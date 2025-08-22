import { Controller, Get, Post, Body } from '@nestjs/common';
import { AppService } from './app.service';
import { TenantService } from './tenant/tenant.service';
import { Tenant, TenantStatus, TenantTier } from './tenant/tenant.entity';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly tenantService: TenantService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('create-tenant')
  async createTenant(@Body() createTenantDto: Partial<Tenant>) {
    // Set default values if not provided
    const tenantData: Partial<Tenant> = {
      status: TenantStatus.ACTIVE,
      tier: TenantTier.BASIC,
      isActive: true,
      maxUsers: 10,
      maxStorageGB: 1,
      monthlyFee: 0,
      currency: 'USD',
      timezone: 'UTC',
      locale: 'en',
      ...createTenantDto,
    };

    return this.tenantService.createTenant(tenantData as Tenant);
  }
}
