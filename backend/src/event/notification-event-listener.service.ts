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
export class NotificationEventListenerService {
  private readonly logger = new Logger(NotificationEventListenerService.name);

  @OnEvent('event.created')
  async handleEventCreated(payload: EventCreatedPayload) {
    const { event, customer } = payload;
    
    // Check if this event requires immediate notification
    if (this.shouldSendNotification(event)) {
      await this.sendNotification(event, customer);
    }
    
    // Check for high urgency events
    if (event.props.urgency === 'high') {
      this.logger.warn(`High urgency event detected: ${event.id}`);
      await this.handleHighUrgencyEvent(event, customer);
    }
    
    // Check for negative sentiment events
    if (event.props.sentiment === 'negative') {
      this.logger.warn(`Negative sentiment event detected: ${event.id}`);
      await this.handleNegativeSentimentEvent(event, customer);
    }
  }

  private shouldSendNotification(event: Event): boolean {
    // Add your notification logic here
    return event.props.urgency === 'high' || 
           event.props.sentiment === 'negative' ||
           event.name === 'ticket_created' ||
           event.name === 'escalation';
  }

  private async sendNotification(event: Event, customer: Customer): Promise<void> {
    this.logger.log(`Sending notification for event ${event.id} to customer ${customer.userId}`);
    
    // Implement your notification logic here
    // This could include:
    // - Sending emails
    // - Push notifications
    // - SMS
    // - Slack/Discord webhooks
    // - etc.
  }

  private async handleHighUrgencyEvent(event: Event, customer: Customer): Promise<void> {
    this.logger.log(`Handling high urgency event ${event.id}`);
    
    // Implement high urgency handling logic
    // This could include:
    // - Immediate escalation
    // - Alerting managers
    // - Creating high-priority tickets
  }

  private async handleNegativeSentimentEvent(event: Event, customer: Customer): Promise<void> {
    this.logger.log(`Handling negative sentiment event ${event.id}`);
    
    // Implement negative sentiment handling logic
    // This could include:
    // - Customer satisfaction surveys
    // - Escalation to customer success team
    // - Follow-up communications
  }
}
