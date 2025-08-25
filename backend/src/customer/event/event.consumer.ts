import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { Event } from '../../event/event.entity';
import { Customer } from '../customer.entity';
import { CustomerService } from '../customer.service';
import { FeatureService } from '../feature/feature.service';
import { NotificationService } from 'src/notification/notification.service';

// ML Service interfaces
interface  MLScoreRequest {
  userId: string;
  features: {
    activity_7d?: number;
    activity_30d?: number;
    usage_score?: number;
    region?: string;
    [key: string]: any;
  };
}

interface MLScoreResponse {
  risk: number;
  tier: 'low' | 'med' | 'high';
  reasons: string[];
  modelVersion: string;
}

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
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
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
            new Date(startDate.getTime() - 30 * 24 * 60 * 60 * 1000),
            tenantId
          );
          
          if (userFeatures) {
            this.logger.log(`Computed features for user ${customerIdFromEvent}:`, {
              activity_7d: userFeatures.features.activity_7d,
              activity_30d: userFeatures.features.activity_30d,
              usage_score: userFeatures.features.usage_score,
              label: userFeatures.label
            });

            this.logger.log(`Proceeding to ML service integration for user ${customerIdFromEvent}`);
          } else {
            this.logger.warn(`Could not compute features for user ${customerIdFromEvent}`);
          }

          // Integrate with ML service to get the tier
          let customerTier = 'low'; // default tier
          let mlRiskScore = 0;
          let mlReasons: string[] = [];
          
          try {
            const mlServiceUrl = this.configService.get<string>('ML_SERVICE_URL', 'http://localhost:8000');
            const mlRequest: MLScoreRequest = {
              userId: customerIdFromEvent,
              features: {
                activity_7d: userFeatures?.features?.activity_7d || 0,
                activity_30d: userFeatures?.features?.activity_30d || 0,
                usage_score: userFeatures?.features?.usage_score || 0,
                failed_renewals_30d: userFeatures?.features?.failed_renewals_30d || 0,
                tickets_7d: userFeatures?.features?.tickets_7d || 0,
                tickets_30d: userFeatures?.features?.tickets_30d || 0,
                plan_value: userFeatures?.features?.plan_value || 0,
                region: customerDetails.region, // default region, can be enhanced to get from customer data
              }
            };

            this.logger.log(`Calling ML service at ${mlServiceUrl}/score with features:`, mlRequest.features);
            
            const mlResponse = await firstValueFrom(
              this.httpService.post<MLScoreResponse>(`${mlServiceUrl}/score`, mlRequest)
            );

            customerTier = mlResponse.data.tier;
            mlRiskScore = mlResponse.data.risk;
            mlReasons = mlResponse.data.reasons;

            this.logger.log(`ML service response: tier=${customerTier}, risk=${mlRiskScore}, reasons=${mlReasons.join(', ')}`);
          } catch (mlError) {
            this.logger.error(`Error calling ML service: ${mlError.message}`);
            this.logger.warn('Using default tier "low" due to ML service error');
          }

          this.logger.log(`Final customer tier for user ${customerIdFromEvent}: ${customerTier} (risk: ${mlRiskScore})`);


          if (customerTier !== 'low'
            && (customerDetails.status === 'casual' ||
             customerDetails.status === 'power')
          ) {

          const notification = await this.notificationService.create({
            name: payload.event.name,
            platform: 'Workflow',
            outcome: 'In Progress',
            userId: customerIdFromEvent,
            // Add ML service results to notification metadata if available
            ...(customerTier !== 'low' && {
              metadata: {
                mlTier: customerTier,
                mlRiskScore: mlRiskScore,
                mlReasons: mlReasons,
              }
            })
          });


          const response = await this.notificationService.triggerWorkflow({
            workflowName: 'Customer_Retention',
            data: {
              userId: customerIdFromEvent,
              userName: customerDetails.email,
              tenant: "Sample Tenant",
              notificationId: notification.id,
              mlTier: customerTier,
              mlRiskScore: mlRiskScore,
              mlReasons: mlReasons,
            },
            notify: {
              email: customerDetails.email,
              sms: customerDetails.phone,
            },
          });
          this.logger.log(`Workflow response: ${response}`);
        }
        
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