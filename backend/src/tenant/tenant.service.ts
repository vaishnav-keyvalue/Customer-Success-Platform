import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from './tenant.entity';

@Injectable()
export class TenantService {
  constructor(
    @InjectRepository(Tenant)
    private tenantRepository: Repository<Tenant>,
  ) {}

  async createTenant(tenant: Tenant): Promise<Tenant> {
    return this.tenantRepository.save(tenant);
  }

  async getTenantById(id: string): Promise<Tenant | null> {
    return this.tenantRepository.findOne({ where: { id } });
  }
}