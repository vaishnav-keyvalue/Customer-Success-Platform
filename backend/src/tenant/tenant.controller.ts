import { Controller, Post, Get, Body, Param, HttpException, HttpStatus } from '@nestjs/common';
import { TenantService } from './tenant.service';
import { Tenant, TenantStatus, TenantTier } from './tenant.entity';

@Controller('tenants')
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Post()
  async createTenant(@Body() createTenantDto: Partial<Tenant>): Promise<Tenant> {
    try {
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

      const tenant = await this.tenantService.createTenant(tenantData as Tenant);
      return tenant;
    } catch (error) {
      if (error.code === '23505') { // Unique constraint violation
        throw new HttpException('Tenant with this domain already exists', HttpStatus.CONFLICT);
      }
      throw new HttpException('Failed to create tenant', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get(':id')
  async getTenant(@Param('id') id: string): Promise<Tenant> {
    const tenant = await this.tenantService.getTenantById(id);
    if (!tenant) {
      throw new HttpException('Tenant not found', HttpStatus.NOT_FOUND);
    }
    return tenant;
  }
}
