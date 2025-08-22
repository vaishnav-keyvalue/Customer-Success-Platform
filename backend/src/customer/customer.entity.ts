import { Tenant } from '../tenant/tenant.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum UserPlan {
  BASIC = 'Basic',
  PRO = 'Pro',
  ENTERPRISE = 'Enterprise'
}

export enum UserSegment {
  CASUAL = 'casual',
  POWER = 'power',
  AT_RISK = 'at_risk'
}

export enum UserRegion {
  US = 'US',
  EU = 'EU',
  SG = 'SG',
  IN = 'IN'
}

export interface UserConsents {
  sms: boolean;
  email: boolean;
}

@Entity('customers')
export class Customer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: false, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  phone: string;

  @Column({ type: 'varchar', length: 255, nullable: false, unique: true })
  userId: string;

  @Column({ type: 'enum', enum: UserRegion, nullable: true })
  region: UserRegion;

  @Column({ type: 'enum', enum: UserPlan, nullable: true })
  plan: UserPlan;

  @Column({ type: 'enum', enum: UserSegment, nullable: true })
  segment: UserSegment;

  @Column({ type: 'json', nullable: true })
  consents: UserConsents;

  @ManyToOne(() => Tenant, { nullable: false })
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Column({ type: 'uuid', nullable: false })
  tenantId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}