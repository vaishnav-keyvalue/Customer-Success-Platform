import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Customer } from '../customer.entity';
import { Event } from '../../event/event.entity';

export interface UserFeatures {
  userId: string;
  activity_7d: number;
  activity_30d: number;
  time_since_last_use_days: number;
  failed_renewals_30d: number;
  tickets_7d: number;
  tickets_30d: number;
  plan_value: number;
  region: string;
  usage_score: number;
}

export interface UserFeaturesWithLabel {
  userId: string;
  features: UserFeatures;
  label: number; // Value between 0 and 1
}

@Injectable()
export class FeatureService {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
  ) {}

  async computeUserFeatures(
    startDate: Date,
    tenantId: string,
    userId?: string,
  ): Promise<UserFeaturesWithLabel[]> {
    // Fetch all events within the date range for the tenant
    const events = await this.eventRepository.find({
      where: {
        ts: Between(
          new Date(startDate.getTime() - 30 * 24 * 60 * 60 * 1000),
          startDate
        ),
        tenantId,
        userId,
      },
      order: { ts: 'ASC' },
    });

    // Fetch all customers for the tenant
    const customers = await this.customerRepository.find({
      where: { tenantId },
    });

    // Group events by userId
    const eventsByUser = new Map<string, Event[]>();
    events.forEach(event => {
      if (!eventsByUser.has(event.userId)) {
        eventsByUser.set(event.userId, []);
      }
      eventsByUser.get(event.userId)!.push(event);
    });

    // Compute features for each user
    const userFeatures: UserFeaturesWithLabel[] = [];

    for (const customer of customers) {
      const userEvents = eventsByUser.get(customer.userId) || [];
      
      // Calculate date ranges for different periods
      const now = new Date();
      const sevenDaysAgo = new Date(startDate.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Filter events for different periods
      const events7d = userEvents.filter(event => event.ts >= sevenDaysAgo);

      // Calculate activity metrics
      const activity_7d = events7d.length;
      const activity_30d = userEvents.length;

      // Calculate time since last use
      let time_since_last_use_days = 0;
      let timeDiff = now.getTime() - startDate.getTime() - 30 * 24 * 60 * 60 * 1000;
      if (userEvents.length > 0) {
        const lastEvent = userEvents[userEvents.length - 1]; // Events are sorted ASC
        timeDiff = now.getTime() - lastEvent.ts.getTime();
      }
      time_since_last_use_days = Math.floor(timeDiff / (24 * 60 * 60 * 1000));

      // Calculate failed renewals
      const failed_renewals_30d = userEvents.filter(event => 
        event.name === 'plan_renewal_failed' || event.name === 'pre_renewal_card_decline'
      ).length;

      // Calculate tickets
      const tickets_7d = events7d.filter(event => event.name === 'ticket_opened').length;
      const tickets_30d = userEvents.filter(event => event.name === 'ticket_opened').length;

      // Get plan value based on customer plan
      let plan_value = 0;
      switch (customer.plan) {
        case 'Basic':
          plan_value = 9;
          break;
        case 'Pro':
          plan_value = 29;
          break;
        case 'Enterprise':
          plan_value = 99;
          break;
        default:
          plan_value = 0;
      }

      // Get region
      const region = customer.region || 'Unknown';

      // Calculate usage score (normalized activity over 30 days, max score 1.0)
      const maxExpectedActivity = 10; // Assume 10 events in 30 days is max
      const usage_score = Math.min(activity_30d / maxExpectedActivity, 1.0);

      // Create features object
      const features: UserFeatures = {
        userId: customer.userId,
        activity_7d,
        activity_30d,
        time_since_last_use_days,
        failed_renewals_30d,
        tickets_7d,
        tickets_30d,
        plan_value,
        region,
        usage_score,
      };

      // Generate label (value between 0 and 1)
      const label = await this.getLabel(features);

      userFeatures.push({
        userId: customer.userId,
        features,
        label,
      });
    }

    return userFeatures;
  }

  async getLabel(features: UserFeatures): Promise<number> {
    // Start with a base score
    let score = 0.5; // Base score of 0.5

    // Positive features (higher values = better score)
    // activity_30d, activity_7d, usage_score are positive
    score += Math.min(features.activity_30d / 5, 0.2); // Max 0.2 contribution
    score += Math.min(features.activity_7d / 5, 0.15); // Max 0.15 contribution
    score += features.usage_score * 0.15; // Max 0.15 contribution

    // Negative features (higher values = worse score)
    // time_since_last_use_days, failed_renewals_30d, tickets_7d, tickets_30d are negative
    score -= Math.min(features.failed_renewals_30d / 2, 0.15); // Max 0.15 penalty
    score -= Math.min(features.tickets_7d / 5, 0.1); // Max 0.1 penalty
    score -= Math.min(features.tickets_30d / 5, 0.1); // Max 0.1 penalty

    // Ensure score is between 0 and 1
    return Math.max(0, Math.min(1, score)) > 0.3 ? 1 : 0;
  }

  async computeUserFeaturesForUser(
    userId: string,
    startDate: Date,
    tenantId: string,
  ): Promise<UserFeaturesWithLabel | null> {
    const features = await this.computeUserFeatures(startDate, tenantId, userId);
    return features.find(f => f.userId === userId) || null;
  }
}
