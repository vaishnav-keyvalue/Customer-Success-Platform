import { Customer } from '../customer/customer.entity';
import { Tenant } from '../tenant/tenant.entity';
import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from 'typeorm';

export interface EventProps {
  ticketId?: string;
  message?: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
  urgency?: 'high' | 'low';
  [key: string]: any; // Allow additional properties
}

@Entity('events')
export class Event {
  @PrimaryColumn({ type: 'varchar', length: 255 })
  id: string;

  @Column({ type: 'timestamp', nullable: false })
  ts: Date;

  @Column({ type: 'varchar', length: 255, nullable: false })
  userId: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  name: string;

  @Column({ type: 'jsonb', nullable: false })
  props: EventProps;

  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'userId', referencedColumnName: 'userId' })
  customer: Customer;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Column({ type: 'uuid', nullable: false })
  tenantId: string;
}