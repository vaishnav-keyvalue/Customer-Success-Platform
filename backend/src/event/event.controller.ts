import { Controller, Post, Get, Body, Param, UseGuards, HttpCode, HttpStatus, Query } from '@nestjs/common';
import { EventService } from './event.service';
import type { CreateEventDto } from './event.service';
import { TenantAuthGuard } from '../tenant/auth/tenant-auth.guard';
import { CurrentTenant, CurrentUser } from '../tenant/auth/tenant-auth.decorator';
import type { Tenant } from '../tenant/tenant.entity';

@Controller('events')
// @UseGuards(TenantAuthGuard)
export class EventController {
  constructor(private readonly eventService: EventService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createEvent(
    @Body() createEventDto: CreateEventDto,
    // @CurrentTenant() tenant: Tenant,
    // @CurrentUser() user: any,
  ) {
    const event = await this.eventService.createEvent(createEventDto);
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

  @Get('user/:userId')
  async getUserEvents(@Param('userId') userId: string, @CurrentTenant() tenant: Tenant) {
    const events = await this.eventService.getEventsByUserId(userId, tenant.id);
    return {
      success: true,
      data: events,
      count: events.length,
      userId,
    };
  }

  @Get('name/:name')
  async getEventsByName(@Param('name') name: string, @CurrentTenant() tenant: Tenant) {
    const events = await this.eventService.getEventsByName(name, tenant.id);
    return {
      success: true,
      data: events,
      count: events.length,
      name,
    };
  }

  @Get('sentiment/:sentiment')
  async getEventsBySentiment(
    @Param('sentiment') sentiment: 'positive' | 'negative' | 'neutral',
    @CurrentTenant() tenant: Tenant
  ) {
    const events = await this.eventService.getEventsBySentiment(sentiment, tenant.id);
    return {
      success: true,
      data: events,
      count: events.length,
      sentiment,
    };
  }

  @Get('urgency/:urgency')
  async getEventsByUrgency(
    @Param('urgency') urgency: 'high' | 'low',
    @CurrentTenant() tenant: Tenant
  ) {
    const events = await this.eventService.getEventsByUrgency(urgency, tenant.id);
    return {
      success: true,
      data: events,
      count: events.length,
      urgency,
    };
  }

  @Get('ticket/:ticketId')
  async getEventsByTicketId(@Param('ticketId') ticketId: string, @CurrentTenant() tenant: Tenant) {
    const events = await this.eventService.getEventsByTicketId(ticketId, tenant.id);
    return {
      success: true,
      data: events,
      count: events.length,
      ticketId,
    };
  }
}
