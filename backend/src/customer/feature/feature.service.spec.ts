import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FeatureService } from './feature.service';
import { Customer } from '../customer.entity';
import { Event } from '../../event/event.entity';

describe('FeatureService', () => {
  let service: FeatureService;
  let customerRepository: Repository<Customer>;
  let eventRepository: Repository<Event>;

  const mockCustomerRepository = {
    find: jest.fn(),
  };

  const mockEventRepository = {
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeatureService,
        {
          provide: getRepositoryToken(Customer),
          useValue: mockCustomerRepository,
        },
        {
          provide: getRepositoryToken(Event),
          useValue: mockEventRepository,
        },
      ],
    }).compile();

    service = module.get<FeatureService>(FeatureService);
    customerRepository = module.get<Repository<Customer>>(getRepositoryToken(Customer));
    eventRepository = module.get<Repository<Event>>(getRepositoryToken(Event));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('computeUserFeatures', () => {
    it('should compute features for all users in a date range', async () => {
      const startDate = new Date('2024-01-31');
      const tenantId = 'test-tenant-id';

      const mockCustomers: Partial<Customer>[] = [
        {
          id: '1',
          userId: 'user1',
          plan: 'Pro' as any,
          region: 'US' as any,
        },
        {
          id: '2',
          userId: 'user2',
          plan: 'Basic' as any,
          region: 'IN' as any,
        },
      ];

      const mockEvents: Partial<Event>[] = [
        {
          id: 'event1',
          userId: 'user1',
          ts: new Date('2024-01-15'),
          name: 'login',
          props: { sentiment: 'positive' },
        },
        {
          id: 'event2',
          userId: 'user1',
          ts: new Date('2024-01-20'),
          name: 'ticket_opened',
          props: { ticketId: 'ticket1' },
        },
        {
          id: 'event3',
          userId: 'user2',
          ts: new Date('2024-01-25'),
          name: 'login',
          props: { sentiment: 'negative' },
        },
      ];

      mockCustomerRepository.find.mockResolvedValue(mockCustomers);
      mockEventRepository.find.mockResolvedValue(mockEvents);

      const result = await service.computeUserFeatures(startDate, tenantId);

      expect(result).toHaveLength(2);
      expect(result[0].userId).toBe('user1');
      expect(result[0].features.plan_value).toBe(29); // Pro plan
      expect(result[0].features.region).toBe('US');
      expect(result[0].label).toBeGreaterThanOrEqual(0);
      expect(result[0].label).toBeLessThanOrEqual(1);
      expect(result[1].userId).toBe('user2');
      expect(result[1].features.plan_value).toBe(9); // Basic plan
      expect(result[1].features.region).toBe('IN');
      expect(result[1].label).toBeGreaterThanOrEqual(0);
      expect(result[1].label).toBeLessThanOrEqual(1);
    });
  });

  describe('getLabel', () => {
    it('should return a value between 0 and 1', async () => {
      const mockFeatures = {
        userId: 'user1',
        activity_7d: 5,
        activity_30d: 15,
        time_since_last_use_days: 2,
        failed_renewals_30d: 0,
        tickets_7d: 1,
        tickets_30d: 3,
        plan_value: 29,
        region: 'US',
        usage_score: 0.8,
      };

      const label = await service.getLabel(mockFeatures);
      
      expect(label).toBeGreaterThanOrEqual(0);
      expect(label).toBeLessThanOrEqual(1);
      expect(typeof label).toBe('number');
    });

    it('should handle high activity users positively', async () => {
      const highActivityFeatures = {
        userId: 'user1',
        activity_7d: 10,
        activity_30d: 25,
        time_since_last_use_days: 0,
        failed_renewals_30d: 0,
        tickets_7d: 0,
        tickets_30d: 0,
        plan_value: 29,
        region: 'US',
        usage_score: 1.0,
      };

      const label = await service.getLabel(highActivityFeatures);
      expect(label).toBeGreaterThan(0.5); // Should be above base score
    });

    it('should handle problematic users negatively', async () => {
      const problematicFeatures = {
        userId: 'user1',
        activity_7d: 0,
        activity_30d: 0,
        time_since_last_use_days: 30,
        failed_renewals_30d: 5,
        tickets_7d: 5,
        tickets_30d: 10,
        plan_value: 29,
        region: 'US',
        usage_score: 0.0,
      };

      const label = await service.getLabel(problematicFeatures);
      expect(label).toBeLessThan(0.5); // Should be below base score
    });
  });
});
