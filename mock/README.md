# MockGen - Customer Success Event Generator

A complete, runnable mock service for generating realistic customer success events. Built with Node.js + TypeScript and minimal Express.

## Features

- **Realistic User Seeding**: Generate users with segments (power, casual, at_risk), regions, and contact info
- **Event Streaming**: Stream domain events at configurable rates with jitter and mode mixing
- **Manual Event Emission**: Manually emit specific events for testing
- **Multiple Sinks**: Support for console, HTTP (POST to CS-API), or Redis Streams
- **Historical Backfill**: Generate historical events for ML bootstrap
- **Deterministic Seeding**: Use seeds for reproducible data generation

## Quick Start

1. **Install dependencies:**
   ```bash
   cd mock
   npm install
   ```

2. **Setup environment:**
   ```bash
   cp env.example .env
   ```

3. **Start in development mode:**
   ```bash
   npm run dev
   ```

The service will start on port 4001 with console sink by default.

## Configuration

Edit `.env` file to configure the service:

```env
PORT=4001

# Where to send generated events
SINK_TYPE=console          # console | http | redis
HTTP_SINK_URL=http://localhost:4000/events
REDIS_URL=redis://localhost:6379
REDIS_STREAM_KEY=domain.events

# Defaults for seeding
DEFAULT_REGION=IN
DEFAULT_SMS_CONSENT=true
DEFAULT_EMAIL_CONSENT=true
```

### Sink Types

- **console**: Print events to stdout (default)
- **http**: POST events to your Customer Success API
- **redis**: Push events to Redis Streams

## API Endpoints

### Health & Status

```bash
# Health check
GET /healthz

# Service status
GET /status

# List all users
GET /users
```

### User Management

```bash
# Seed users with deterministic generation
POST /seed-users
{
  "count": 5000,
  "seed": 42,  # optional, for reproducible data
  "mix": {     # optional, segment distribution
    "power": 0.2,
    "casual": 0.6, 
    "at_risk": 0.2
  }
}
```

### Event Streaming

```bash
# Start streaming events
POST /start-stream
{
  "rate": 180,                           # events per minute
  "modes": ["product", "billing"],       # optional, default: all
  "jitter": true                         # optional, default: true
}

# Stop streaming
POST /stop-stream
```

### Manual Event Emission

```bash
# Emit specific event
POST /emit
{
  "name": "pre_renewal_card_decline",
  "userId": "ABC123",                    # optional, random if not provided
  "ts": "2025-01-20T10:00:00.000Z",     # optional, current time if not provided
  "props": {
    "daysToRenewal": 3,
    "amount": 49,
    "currency": "USD"
  }
}
```

### Historical Data

```bash
# Backfill historical events for ML bootstrap
POST /backfill
{
  "days": 60,                           # days of history
  "density": 80,                        # events per day
  "modes": ["product", "billing", "ticket"]  # optional
}
```

## Event Types & Schema

All events follow this schema:

```typescript
{
  "id": "evt_abcd123",                    # unique event ID
  "ts": "2025-01-20T10:00:00.000Z",      # ISO timestamp
  "userId": "ABC123",                     # user identifier
  "name": "event_name",                   # event type
  "props": { ... }                        # event-specific properties
}
```

### Product Events
- `session_start`
- `feature_used` (with `feature` property)
- `session_end`

### Billing Events
- `pre_renewal_card_decline` (with `daysToRenewal`)
- `plan_renewal_failed` (with `attempt`)
- `plan_renewed` (with `amount`)
- `invoice_paid`

### Support Ticket Events
- `ticket_opened` (with `message`, `sentiment`, `urgency`)
- `ticket_replied` (with `message`, `sentiment`, `urgency`)

Events are intelligently biased by user segments:
- **at_risk** users generate more billing issues and negative support tickets
- **power** users have more feature usage and positive interactions
- **casual** users have balanced, moderate activity

## Example Usage

### 1. Seed Users and Start Streaming

```bash
# Generate 5,000 deterministic users
curl -X POST localhost:4001/seed-users \
  -H 'content-type: application/json' \
  -d '{"count":5000,"seed":42,"mix":{"power":0.2,"casual":0.6,"at_risk":0.2}}'

# Start streaming 180 events/min (product + billing only)
curl -X POST localhost:4001/start-stream \
  -H 'content-type: application/json' \
  -d '{"rate":180,"modes":["product","billing"],"jitter":true}'
```

### 2. Manual Event Testing

```bash
# Emit a specific churn risk event
curl -X POST localhost:4001/emit \
  -H 'content-type: application/json' \
  -d '{"name":"pre_renewal_card_decline","props":{"daysToRenewal":3,"amount":49}}'
```

### 3. Historical Data Bootstrap

```bash
# Generate 60 days of historical events
curl -X POST localhost:4001/backfill \
  -H 'content-type: application/json' \
  -d '{"days":60,"density":80,"modes":["product","billing","ticket"]}'
```

### 4. Check Status

```bash
curl localhost:4001/status
```

## Integration with Customer Success Platform

To send events to your main Customer Success API:

1. Set `SINK_TYPE=http` in `.env`
2. Set `HTTP_SINK_URL=http://localhost:4000/events` (or your API endpoint)
3. Ensure your CS API has a `POST /events` endpoint that accepts the event schema

The service will automatically POST each generated event to your specified endpoint.

## Development

```bash
# Development with auto-reload
npm run dev

# Build for production
npm run build

# Run production build
npm start
```

## User Segments

Users are automatically segmented based on behavior patterns:

- **Power Users (20%)**: High engagement, positive sentiment, enterprise plans
- **Casual Users (60%)**: Moderate usage, mixed sentiment, various plans  
- **At-Risk Users (20%)**: Billing issues, negative support tickets, higher churn probability

This realistic distribution enables effective testing of customer success workflows, churn prediction models, and intervention strategies.


