import { Controller, Get, Param, UseGuards, Query } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { TenantAuthGuard } from '../tenant/auth/tenant-auth.guard';
import { CurrentTenant } from '../tenant/auth/tenant-auth.decorator';
import type { Tenant } from '../tenant/tenant.entity';

@Controller('customers')
@UseGuards(TenantAuthGuard)
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Get(':customerId')
  async getCustomer(@Param('customerId') customerId: string, @CurrentTenant() tenant: Tenant) {
    const customer = await this.customerService.getCustomerById(customerId, tenant.id);
    
    if (!customer) {
      return {
        success: false,
        message: 'Customer not found',
      };
    }

    return {
      success: true,
      data: customer,
    };
  }

  @Get('search/email')
  async getCustomerByEmail(@Query('email') email: string, @CurrentTenant() tenant: Tenant) {
    const customer = await this.customerService.getCustomerByEmail(email, tenant.id);
    
    if (!customer) {
      return {
        success: false,
        message: 'Customer not found',
      };
    }

    return {
      success: true,
      data: customer,
    };
  }

  @Get()
  async getAllCustomers(@CurrentTenant() tenant: Tenant) {
    const customers = await this.customerService.getAllCustomersByTenant(tenant.id);
    
    return {
      success: true,
      data: customers,
      count: customers.length,
    };
  }

  @Get(':customerId/events')
  async getCustomerEvents(@Param('customerId') customerId: string, @CurrentTenant() tenant: Tenant) {
    const events = await this.customerService.getCustomerEvents(customerId, tenant.id);
    
    return {
      success: true,
      data: events,
      count: events.length,
      customerId,
    };
  }
}
