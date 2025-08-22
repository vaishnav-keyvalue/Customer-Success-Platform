import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { customAlphabet, nanoid } from 'nanoid';
import axios from 'axios';
import Redis from 'ioredis';
import dayjs from 'dayjs';
import { z } from 'zod';

/* =========================
   Config & Setup
========================= */

const PORT = Number(process.env.PORT || 4001);
const SINK_TYPE = (process.env.SINK_TYPE || 'console') as 'console'|'http'|'redis';
const HTTP_SINK_URL = process.env.HTTP_SINK_URL || 'http://localhost:4000/events';
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const REDIS_STREAM_KEY = process.env.REDIS_STREAM_KEY || 'domain.events';

const DEFAULT_REGION = (process.env.DEFAULT_REGION || 'IN') as 'IN'|'SG'|'US'|'EU';
const DEFAULT_SMS_CONSENT = String(process.env.DEFAULT_SMS_CONSENT || 'true') === 'true';
const DEFAULT_EMAIL_CONSENT = String(process.env.DEFAULT_EMAIL_CONSENT || 'true') === 'true';

/* =========================
   Types
========================= */

type Segment = 'power' | 'casual' | 'at_risk';
type Mode = 'product' | 'billing' | 'ticket';

interface User {
  id: string;
  email: string;
  phone: string;
  region: 'IN'|'SG'|'US'|'EU';
  plan: 'Basic'|'Pro'|'Enterprise';
  createdAt: string; // ISO
  segment: Segment;
  consents: { sms: boolean; email: boolean };
}

interface DomainEvent {
  id: string;
  ts: string;       // ISO
  userId: string;
  name: string;
  props?: Record<string, any>;
}

/* =========================
   In-memory stores
========================= */

const users = new Map<string, User>();
const openTickets = new Map<string, string[]>(); // userId -> ticketIds
const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const shortId = customAlphabet(alphabet, 6);

/* =========================
   RNG (seedable)
========================= */

function mulberry32(seed: number) {
  return function() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
let seededRand: (()=>number)|null = null;
function R() { return seededRand ? seededRand() : Math.random(); }
function pick<T>(arr: T[]): T { return arr[Math.floor(R() * arr.length)]; }
function chance(p: number) { return R() < p; } // 0..1

/* =========================
   Event Sink Abstraction
========================= */

interface EventSink {
  send(evt: DomainEvent): Promise<void>;
}

class ConsoleSink implements EventSink {
  async send(evt: DomainEvent) { console.log(JSON.stringify(evt)); }
}

class HttpSink implements EventSink {
  constructor(private url: string) {}
  async send(evt: DomainEvent) {
    await axios.post(this.url, evt, { timeout: 5000 });
  }
}

class RedisSink implements EventSink {
  private redis: Redis;
  constructor(url: string, private streamKey: string) { this.redis = new Redis(url); }
  async send(evt: DomainEvent) {
    await this.redis.xadd(this.streamKey, '*',
      'id', evt.id, 'ts', evt.ts, 'userId', evt.userId, 'name', evt.name, 'props', JSON.stringify(evt.props || {}));
  }
}

let sink: EventSink;
if (SINK_TYPE === 'http') sink = new HttpSink(HTTP_SINK_URL);
else if (SINK_TYPE === 'redis') sink = new RedisSink(REDIS_URL, REDIS_STREAM_KEY);
else sink = new ConsoleSink();

/* =========================
   Generators
========================= */

const regions: User['region'][] = ['IN','SG','US','EU'];
const plans: User['plan'][] = ['Basic','Pro','Enterprise'];

function makeEmail(id: string) { return `user_${id.toLowerCase()}@example.com`; }
function makePhone(region: User['region']) {
  const country = region === 'IN' ? '+91' : region === 'SG' ? '+65' : region === 'US' ? '+1' : '+49';
  return `${country}${Math.floor(100000000 + R()*900000000)}`;
}

function seedUsers(count: number, mix?: Partial<Record<Segment, number>>): User[] {
  const weights: Record<Segment, number> = {
    power: mix?.power ?? 0.2,
    casual: mix?.casual ?? 0.6,
    at_risk: mix?.at_risk ?? 0.2
  };
  const norm = weights.power + weights.casual + weights.at_risk;
  weights.power /= norm; weights.casual /= norm; weights.at_risk /= norm;

  const out: User[] = [];
  for (let i=0;i<count;i++){
    const id = shortId();
    const r = R();
    const segment: Segment = r < weights.power ? 'power' : r < (weights.power+weights.casual) ? 'casual' : 'at_risk';
    const region = pick(regions);
    const plan = pick(plans);
    const user: User = {
      id, email: makeEmail(id), phone: makePhone(region), region, plan,
      createdAt: dayjs().subtract(Math.floor(R()*120), 'day').toISOString(),
      segment,
      consents: { sms: DEFAULT_SMS_CONSENT, email: DEFAULT_EMAIL_CONSENT }
    };
    users.set(id, user);
    out.push(user);
  }
  return out;
}

/* ----- Domain event factories ----- */

function eventBase(userId?: string): Omit<DomainEvent,'name'> {
  return { id: nanoid(), ts: new Date().toISOString(), userId: userId ?? pick([...users.keys()]) };
}

function makeProductEvent(userId?: string): DomainEvent {
  const u = users.get(userId ?? pick([...users.keys()]))!;
  const names = ['session_start','feature_used','session_end'];
  const name = pick(names);
  const features = ['export_csv','schedule_report','bulk_import','team_share','ai_summary'];
  const props: any = {};
  if (name === 'feature_used') props.feature = pick(features);
  return { ...eventBase(u.id), name, props };
}

function makeBillingEvent(userId?: string): DomainEvent {
  const u = users.get(userId ?? pick([...users.keys()]))!;
  // Weigh issues towards at_risk
  const issue = u.segment === 'at_risk' ? 0.55 : u.segment === 'casual' ? 0.25 : 0.1;
  const names = chance(issue)
    ? ['pre_renewal_card_decline','plan_renewal_failed']
    : ['plan_renewed','invoice_paid'];
  const name = pick(names);
  const props: any = {};
  if (name === 'pre_renewal_card_decline') props.daysToRenewal = [3,2,1][Math.floor(R()*3)];
  if (name === 'plan_renewal_failed') props.attempt = 1 + Math.floor(R()*2);
  if (name === 'plan_renewed') props.amount = [19,49,99][Math.floor(R()*3)];
  return { ...eventBase(u.id), name, props };
}

const NEG = [
  "I'm being overcharged—cancel this now.",
  "Support is unresponsive. This is urgent.",
  "Too expensive for what it offers. I want to cancel."
];
const NEU = [
  "Invoice shows an extra line item, please clarify.",
  "How do I export reports for last month?",
  "Is there a way to change my billing cycle?"
];
const POS = [
  "Loving the new export feature!",
  "Kudos to support for quick help.",
  "Feature request: dark mode on emails."
];

function makeTicketEvent(userId?: string): DomainEvent {
  const u = users.get(userId ?? pick([...users.keys()]))!;
  // more negativity for at_risk users
  const sentiment = (() => {
    const r = R();
    if (u.segment === 'at_risk') return r < 0.6 ? 'negative' : r < 0.8 ? 'neutral' : 'positive';
    if (u.segment === 'casual') return r < 0.35 ? 'negative' : r < 0.8 ? 'neutral' : 'positive';
    return r < 0.15 ? 'negative' : r < 0.7 ? 'neutral' : 'positive';
  })();

  const name = chance(0.5) ? 'ticket_opened' : 'ticket_replied';
  let message = '';
  if (sentiment === 'negative') message = pick(NEG);
  else if (sentiment === 'neutral') message = pick(NEU);
  else message = pick(POS);

  const ticketId = (openTickets.get(u.id)?.[0]) || `t_${shortId()}`;
  if (!openTickets.has(u.id)) openTickets.set(u.id, [ticketId]);
  if (name === 'ticket_replied' && chance(0.5)) {
    // close ticket sometimes
    openTickets.set(u.id, []);
  }

  const props = { ticketId, message, sentiment, urgency: sentiment === 'negative' ? 'high' : 'low' };
  return { ...eventBase(u.id), name, props };
}

/* =========================
   Stream engine
========================= */

type StreamState = {
  running: boolean;
  ratePerMin: number;
  modes: Mode[];
  jitter: boolean;
  timer?: NodeJS.Timeout;
};
const stream: StreamState = { running: false, ratePerMin: 0, modes: ['product','billing','ticket'], jitter: true };

async function emitOne(modes: Mode[], explicit?: {name?: string, userId?: string, ts?: string, props?: any}) {
  let evt: DomainEvent;
  if (explicit?.name) {
    evt = {
      id: nanoid(),
      ts: explicit.ts ?? new Date().toISOString(),
      userId: explicit.userId ?? pick([...users.keys()]),
      name: explicit.name,
      props: explicit.props || {}
    };
  } else {
    const mode = pick(modes);
    if (mode === 'product') evt = makeProductEvent();
    else if (mode === 'billing') evt = makeBillingEvent();
    else evt = makeTicketEvent();
  }
  await sink.send(evt);
  return evt;
}

function scheduleNextTick() {
  if (!stream.running) return;
  const base = 60000 / Math.max(1, stream.ratePerMin);
  const jitterFactor = stream.jitter ? (0.7 + R()*0.6) : 1; // 0.7x..1.3x
  const wait = Math.max(50, base * jitterFactor);
  stream.timer = setTimeout(async () => {
    try { await emitOne(stream.modes); } catch (e) { console.error('emit error', (e as any).message); }
    scheduleNextTick();
  }, wait);
}

/* =========================
   HTTP API
========================= */

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/healthz', (_,res)=>res.send({ ok: true, sink: SINK_TYPE }));
app.get('/status', (_,res)=>res.send({ running: stream.running, ratePerMin: stream.ratePerMin, modes: stream.modes, jitter: stream.jitter, users: users.size }));
app.get('/users', (_,res)=>res.send({ users: [...users.values()] }));

const SeedBody = z.object({
  count: z.number().int().min(1).max(100000),
  seed: z.number().optional(),
  mix: z.object({ power: z.number().optional(), casual: z.number().optional(), at_risk: z.number().optional() }).optional()
});
app.post('/seed-users', (req,res)=>{
  const parsed = SeedBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).send({ error: parsed.error.flatten() });
  if (parsed.data.seed !== undefined) seededRand = mulberry32(parsed.data.seed);
  const created = seedUsers(parsed.data.count, parsed.data.mix);
  res.send({ created: created.length });
});

const StartBody = z.object({
  rate: z.number().int().min(1).max(6000),               // events per minute
  modes: z.array(z.enum(['product','billing','ticket'])).min(1).optional(),
  jitter: z.boolean().optional()
});
app.post('/start-stream', async (req,res)=>{
  const body = StartBody.safeParse(req.body);
  if (!body.success) return res.status(400).send({ error: body.error.flatten() });
  stream.running = true;
  stream.ratePerMin = body.data.rate;
  stream.modes = body.data.modes ?? ['product','billing','ticket'];
  stream.jitter = body.data.jitter ?? true;
  if (stream.timer) clearTimeout(stream.timer);
  scheduleNextTick();
  res.send({ ok: true, running: stream.running, ratePerMin: stream.ratePerMin, modes: stream.modes, jitter: stream.jitter });
});

app.post('/stop-stream', (req,res)=>{
  stream.running = false;
  if (stream.timer) clearTimeout(stream.timer);
  stream.timer = undefined;
  res.send({ ok: true });
});

const EmitBody = z.object({
  name: z.string().min(1),
  userId: z.string().optional(),
  ts: z.string().optional(),
  props: z.record(z.any()).optional()
});
app.post('/emit', async (req,res)=>{
  const body = EmitBody.safeParse(req.body);
  if (!body.success) return res.status(400).send({ error: body.error.flatten() });
  try {
    const evt = await emitOne(stream.modes, body.data);
    res.send({ ok: true, evt });
  } catch (e:any) {
    res.status(500).send({ error: e.message || 'emit_failed' });
  }
});

/* --- Backfill historical data for ML bootstrap --- */
const BackfillBody = z.object({
  days: z.number().int().min(1).max(365),
  density: z.number().int().min(1).max(500).default(50), // events per day
  modes: z.array(z.enum(['product','billing','ticket'])).min(1).optional()
});
app.post('/backfill', async (req,res)=>{
  const body = BackfillBody.safeParse(req.body);
  if (!body.success) return res.status(400).send({ error: body.error.flatten() });
  const modes = body.data.modes ?? ['product','billing','ticket'];
  let count = 0;
  for (let d = body.data.days; d >= 1; d--) {
    const date = dayjs().subtract(d, 'day');
    for (let i=0; i<body.data.density; i++) {
      const ts = date.add(Math.floor(R()*24*60), 'minute').toISOString();
      const mode = pick(modes);
      let evt: DomainEvent;
      if (mode === 'product') { evt = makeProductEvent(); }
      else if (mode === 'billing') { evt = makeBillingEvent(); }
      else { evt = makeTicketEvent(); }
      evt.ts = ts;
      await sink.send(evt);
      count++;
    }
  }
  res.send({ ok: true, emitted: count });
});

/* Start */
app.listen(PORT, ()=> {
  console.log(`[mockgen] up on :${PORT} | sink=${SINK_TYPE}`);
});