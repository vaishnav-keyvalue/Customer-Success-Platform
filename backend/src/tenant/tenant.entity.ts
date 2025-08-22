import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';

export enum TenantStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING = 'pending',
}

export enum TenantTier {
  BASIC = 'basic',
  PREMIUM = 'premium',
  ENTERPRISE = 'enterprise',
  CUSTOM = 'custom',
}

@Entity('tenants')
@Index(['domain'], { unique: true })
@Index(['status'])
@Index(['tier'])
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: false, unique: true })
  domain: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: TenantStatus,
    default: TenantStatus.PENDING,
  })
  status: TenantStatus;

  @Column({
    type: 'enum',
    enum: TenantTier,
    default: TenantTier.BASIC,
  })
  tier: TenantTier;

  @Column({ type: 'jsonb', nullable: true })
  configuration: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'varchar', length: 255, nullable: true })
  contactEmail: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  contactPhone: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  address: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  state: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  postalCode: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  country: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  timezone: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  locale: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'timestamp', nullable: true })
  subscriptionExpiresAt: Date;

  @Column({ type: 'integer', default: 0 })
  maxUsers: number;

  @Column({ type: 'integer', default: 0 })
  maxStorageGB: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  monthlyFee: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  currency: string;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  deletedAt: Date;

  @BeforeInsert()
  beforeInsert() {
    if (!this.configuration) {
      this.configuration = {};
    }
    if (!this.metadata) {
      this.metadata = {};
    }
  }

  @BeforeUpdate()
  beforeUpdate() {
    if (!this.configuration) {
      this.configuration = {};
    }
    if (!this.metadata) {
      this.metadata = {};
    }
  }

  // Helper methods
  isSubscriptionActive(): boolean {
    if (!this.subscriptionExpiresAt) return true;
    return new Date() < this.subscriptionExpiresAt;
  }

  canAddUser(): boolean {
    return this.maxUsers === 0 || this.maxUsers > 0; // 0 means unlimited
  }

  isInTrial(): boolean {
    // Add your trial logic here
    return false;
  }

  getDisplayName(): string {
    return this.name || this.domain;
  }
}
