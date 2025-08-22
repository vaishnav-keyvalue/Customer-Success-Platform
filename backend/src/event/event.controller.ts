import { Controller, Post, Get, Body, Param, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { EventService } from './event.service';
import type { CreateEventDto } from './event.service';
import { TenantAuthGuard } from '../tenant/auth/tenant-auth.guard';
import { CurrentTenant, CurrentUser } from '../tenant/auth/tenant-auth.decorator';
import type { Tenant } from '../tenant/tenant.entity';

@Controller('events')
@UseGuards(TenantAuthGuard)
export class EventController {
  constructor(private readonly eventService: EventService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createEvent(
    @Body() createEventDto: CreateEventDto,
    @CurrentTenant() tenant: Tenant,
    @CurrentUser() user: any,
  ) {
    const event = await this.eventService.createEvent(createEventDto, tenant);
    return {
      success: true,
      data: event,
      message: 'Event created successfully',
    };
  }

  @Get()
  async getEvents(@CurrentTenant() tenant: Tenant) {
    const events = await this.eventService.getEventsByTenant(tenant.id);
    return {
      success: true,
      data: events,
      count: events.length,
    };
  }

  @Get(':id')
  async getEvent(@Param('id') id: string, @CurrentTenant() tenant: Tenant) {
    const event = await this.eventService.getEventById(id, tenant.id);
    return {
      success: true,
      data: event,
    };
  }

  @Get('customer/:customerId')
  async getUserEvents(@Param('customerId') customerId: string, @CurrentTenant() tenant: Tenant) {
    const events = await this.eventService.getEventsByCustomer(customerId, tenant.id);
    return {
      success: true,
      data: events,
      count: events.length,
      customerId,
    };
  }

  @Get('customer/email/:email')
  async getUserEventsByEmail(@Param('email') email: string, @CurrentTenant() tenant: Tenant) {
    const events = await this.eventService.getEventsByCustomerEmail(email, tenant.id);
    return {
      success: true,
      data: events,
      count: events.length,
      customerEmail: email,
    };
  }
}
