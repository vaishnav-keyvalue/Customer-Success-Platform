import { Customer } from '../customer/customer.entity';
import { Tenant } from '../tenant/tenant.entity';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';

@Entity('events')
export class Event {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  name: string;

  @Column({ type: 'jsonb', nullable: false })
  data: Record<string, any>;

  @ManyToOne(() => Customer)
  customer: Customer;

  @ManyToOne(() => Tenant)
  tenant: Tenant;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}