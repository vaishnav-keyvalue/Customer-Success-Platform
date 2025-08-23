import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Event } from './event.entity';
import { Customer } from '../customer/customer.entity';

export interface EventCreatedPayload {
  event: Event;
  customer: Customer;
  timestamp: Date;
}

@Injectable()
export class EventListenerService {
  private readonly logger = new Logger(EventListenerService.name);

  @OnEvent('event.created')
  handleEventCreated(payload: EventCreatedPayload) {
    this.logger.log(`Event created: ${payload.event.id} for user ${payload.event.userId}`);
    this.logger.log(`Event name: ${payload.event.name}`);
    this.logger.log(`Event timestamp: ${payload.event.ts}`);
    this.logger.log(`Customer ID: ${payload.customer.id}`);
    this.logger.log(`Event payload:`, payload.event.props);
    
    // You can add additional logic here like:
    // - Sending notifications
    // - Updating analytics
    // - Triggering ML model predictions
    // - Syncing with external systems
  }
}
