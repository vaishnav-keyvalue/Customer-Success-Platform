import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Event } from '../../event/event.entity';
import { Customer } from '../customer.entity';
import { CustomerService } from '../customer.service';
import { FeatureService } from '../feature/feature.service';
import { NotificationService } from 'src/notification/notification.service';

export interface EventCreatedPayload {
  event: Event;
  customer: Customer;
  timestamp: Date;
}

@Injectable()
export class CustomerEventConsumer {
  private readonly logger = new Logger(CustomerEventConsumer.name);

  constructor(
    private readonly customerService: CustomerService,
    private readonly featureService: FeatureService,
    private readonly notificationService: NotificationService,
  ) {}

  @OnEvent('event.created')
  handleEventCreated(payload: EventCreatedPayload) {
    this.logger.log(`Customer event consumer: Event ${payload.event.id} created for customer ${payload.customer.id}`);
    this.logger.log(`Event details: ${payload.event.name} at ${payload.event.ts}`);
    this.logger.log(`Customer: ${payload.customer.userId} (${payload.customer.email})`);
    this.logger.log(`Event properties:`, payload.event.props);
    
    // Customer-specific event handling logic
    this.processCustomerEvent(payload);
  }

  private async processCustomerEvent(payload: EventCreatedPayload) {
    this.logger.log(`Processing customer event: ${payload.event.name}`);
    
    // Use customer service to get the customer who sent the event
    const customerIdFromEvent = payload.event.userId;
    const tenantId = payload.event.tenantId;
    
    try {
      // Get customer details using the customer service
      const customerDetails = await this.customerService.getCustomerDetails(customerIdFromEvent);
      
      if (customerDetails) {
        // Compute user features for this customer
        try {
          const startDate = new Date(); // Use current date as reference
          const userFeatures = await this.featureService.computeUserFeaturesForUser(
            customerIdFromEvent,
            startDate,
            tenantId
          );
          
          if (userFeatures) {
            this.logger.log(`Computed features for user ${customerIdFromEvent}:`, {
              activity_7d: userFeatures.features.activity_7d,
              activity_30d: userFeatures.features.activity_30d,
              usage_score: userFeatures.features.usage_score,
              label: userFeatures.label
            });
          } else {
            this.logger.warn(`Could not compute features for user ${customerIdFromEvent}`);
          }

          const notification = await this.notificationService.create({
            name: payload.event.name,
            platform: 'email',
            outcome: 'In Progress',
            userId: customerIdFromEvent,
          });

          await this.notificationService.triggerWorkflow({
            worflowName: 'Customer_Retention',
            data: {
              userId: customerIdFromEvent,
              userName: customerDetails.email,
              tenant: tenantId,
              notificationId: notification.id,
            },
            notify: {
              email: customerDetails.email,
              sms: customerDetails.phone,
            },
          });
        
          // Send notification to the customer

        } catch (featureError) {
          this.logger.error(`Error computing user features: ${featureError.message}`);
        }
      } else {
        this.logger.warn(`Customer not found for userId: ${customerIdFromEvent}`);
      }
    } catch (error) {
      this.logger.error(`Error retrieving customer details: ${error.message}`);
    }
  }
}