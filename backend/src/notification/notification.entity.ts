import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Customer } from '../customer/customer.entity';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  name: string;

  @CreateDateColumn()
  timestamp: Date;

  @Column({ type: 'varchar', length: 100, nullable: false })
  platform: string;

  @Column({ type: 'varchar', length: 100, nullable: false })
  outcome: string;

  @ManyToOne(() => Customer, { nullable: false })
  @JoinColumn({ name: 'userId', referencedColumnName: 'userId' })
  customer: Customer;

  @Column({ type: 'varchar', length: 255, nullable: false })
  userId: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;
}
