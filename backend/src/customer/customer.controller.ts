import { Controller, Get, Param, UseGuards, Query } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { FeatureService } from './feature/feature.service';
import { TenantAuthGuard } from '../tenant/auth/tenant-auth.guard';
import { CurrentTenant } from '../tenant/auth/tenant-auth.decorator';
import type { Tenant } from '../tenant/tenant.entity';
import { EntityMetadataBuilder } from 'typeorm/metadata-builder/EntityMetadataBuilder.js';

@Controller('customers')
export class CustomerController {
  constructor(
    private readonly customerService: CustomerService,
    private readonly featureService: FeatureService,
  ) {}

  // Public endpoint - no authentication required
  @Get('features/public')
  async getPublicUserFeatures(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('tenantId') tenantId: string,
  ) {
    try {
      if (!tenantId) {
        return {
          success: false,
          message: 'tenantId is required',
        };
      }

      const start = new Date(startDate);
      const end = new Date(endDate);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return {
          success: false,
          message:
            'Invalid date format. Please use ISO date strings (YYYY-MM-DD)',
        };
      }

      const features = await this.featureService.computeUserFeatures(
        start,
        end,
        tenantId,
      );

      return {
        success: true,
        data: features,
        count: features.length,
        dateRange: {
          startDate: start.toISOString(),
          endDate: end.toISOString(),
        },
        tenantId,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error computing user features',
        error: error.message,
      };
    }
  }

  // Public endpoint for specific user - no authentication required
  @Get('features/public/:userId')
  async getPublicUserFeaturesForUser(
    @Param('userId') userId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('tenantId') tenantId: string,
  ) {
    try {
      if (!tenantId) {
        return {
          success: false,
          message: 'tenantId is required',
        };
      }

      const start = new Date(startDate);
      const end = new Date(endDate);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return {
          success: false,
          message:
            'Invalid date format. Please use ISO date strings (YYYY-MM-DD)',
        };
      }

      const features = await this.featureService.computeUserFeaturesForUser(userId, start, end, tenantId);
      
      if (!features) {
        return {
          success: false,
          message: 'User features not found for the specified date range',
        };
      }

      return {
        success: true,
        data: features,
        dateRange: {
          startDate: start.toISOString(),
          endDate: end.toISOString(),
        },
        tenantId,
        userId,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error computing user features',
        error: error.message,
      };
    }
  }

  // Protected endpoints below
  @UseGuards(TenantAuthGuard)
  @Get(':customerId')
  async getCustomer(
    @Param('customerId') customerId: string,
    @CurrentTenant() tenant: Tenant,
  ) {
    const customer = await this.customerService.getCustomerById(
      customerId,
      tenant.id,
    );

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

  @UseGuards(TenantAuthGuard)
  @Get('search/email')
  async getCustomerByEmail(
    @Query('email') email: string,
    @CurrentTenant() tenant: Tenant,
  ) {
    const customer = await this.customerService.getCustomerByEmail(
      email,
      tenant.id,
    );

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

  @UseGuards(TenantAuthGuard)
  @Get()
  async getAllCustomers(@CurrentTenant() tenant: Tenant) {
    const customers = await this.customerService.getAllCustomersByTenant(
      tenant.id,
    );

    return {
      success: true,
      data: customers,
      count: customers.length,
    };
  }

  @UseGuards(TenantAuthGuard)
  @Get(':customerId/events')
  async getCustomerEvents(
    @Param('customerId') customerId: string,
    @CurrentTenant() tenant: Tenant,
  ) {
    const events = await this.customerService.getCustomerEvents(
      customerId,
      tenant.id,
    );

    return {
      success: true,
      data: events,
      count: events.length,
      customerId,
    };
  }

  @UseGuards(TenantAuthGuard)
  @Get('features/compute')
  async computeUserFeatures(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @CurrentTenant() tenant: Tenant,
  ) {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return {
          success: false,
          message:
            'Invalid date format. Please use ISO date strings (YYYY-MM-DD)',
        };
      }

      const features = await this.featureService.computeUserFeatures(
        start,
        end,
        tenant.id,
      );

      return {
        success: true,
        data: features,
        count: features.length,
        dateRange: {
          startDate: start.toISOString(),
          endDate: end.toISOString(),
        },
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error computing user features',
        error: error.message,
      };
    }
  }

  @UseGuards(TenantAuthGuard)
  @Get(':userId/features')
  async getUserFeatures(
    @Param('userId') userId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @CurrentTenant() tenant: Tenant,
  ) {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return {
          success: false,
          message:
            'Invalid date format. Please use ISO date strings (YYYY-MM-DD)',
        };
      }

      const features = await this.featureService.computeUserFeaturesForUser(userId, start, end, tenant.id);
      
      if (!features) {
        return {
          success: false,
          message: 'User features not found for the specified date range',
        };
      }

      return {
        success: true,
        data: features,
        dateRange: {
          startDate: start.toISOString(),
          endDate: end.toISOString(),
        },
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error computing user features',
        error: error.message,
      };
    }
  }

  @Get('details/:userId')
  async getCustomerDetails(@Param('userId') userId: string) {
    const customerDetails = await this.customerService.getCustomerDetails(userId);
    
    if (!customerDetails) {
      return {
        success: false,
        message: 'Customer not found',
      };
    }

    return {
      success: true,
      data: customerDetails,
    };
  }

  @UseGuards(TenantAuthGuard)
  @Get('details')
  async getAllCustomerDetails(@CurrentTenant() tenant: Tenant) {
    const customerDetails = await this.customerService.getAllCustomerDetails(tenant.id);
    
    return {
      success: true,
      data: customerDetails,
      count: customerDetails.length,
    };
  }

  // Public endpoint for customer details - no authentication required
  @Get('details/public/:userId')
  async getPublicCustomerDetails(
    @Param('userId') userId: string,
  ) {
    try {
      const customerDetails = await this.customerService.getCustomerDetails(userId);
      
      if (!customerDetails) {
        return {
          success: false,
          message: 'Customer not found',
        };
      }

      return {
        success: true,
        data: customerDetails,
        userId,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error retrieving customer details',
        error: error.message,
      };
    }
  }

  // Public endpoint for all customer details - no authentication required
  @Get('details/public')
  async getPublicAllCustomerDetails(@Query('tenantId') tenantId: string) {
    try {
      if (!tenantId) {
        return {
          success: false,
          message: 'tenantId is required',
        };
      }

      const customerDetails = await this.customerService.getAllCustomerDetails(tenantId);
      
      return {
        success: true,
        data: customerDetails,
        count: customerDetails.length,
        tenantId,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error retrieving customer details',
        error: error.message,
      };
    }
  }
}
