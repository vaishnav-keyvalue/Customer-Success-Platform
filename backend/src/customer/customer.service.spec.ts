import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomerService } from './customer.service';
import { Customer } from './customer.entity';
import { Event } from '../event/event.entity';
import { Notification } from '../notification/notification.entity';
import { CustomerDetailDto } from './dto/customer-detail.dto';

describe('CustomerService', () => {
  let service: CustomerService;
  let customerRepository: Repository<Customer>;
  let eventRepository: Repository<Event>;
  let notificationRepository: Repository<Notification>;

  const mockCustomer = {
    id: '1',
    userId: 'user123',
    email: 'test@example.com',
    phone: '+1234567890',
    segment: 'power',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-15'),
  };

  const mockFirstEvent = {
    id: 'event1',
    ts: new Date('2024-01-01'),
    userId: 'user123',
    name: 'first_event',
    props: {},
    tenantId: 'tenant1',
  };

  const mockLatestEvent = {
    id: 'event2',
    ts: new Date('2024-01-15'),
    userId: 'user123',
    name: 'latest_event',
    props: {},
    tenantId: 'tenant1',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomerService,
        {
          provide: getRepositoryToken(Customer),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Event),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Notification),
          useValue: {
            count: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<CustomerService>(CustomerService);
    customerRepository = module.get<Repository<Customer>>(getRepositoryToken(Customer));
    eventRepository = module.get<Repository<Event>>(getRepositoryToken(Event));
    notificationRepository = module.get<Repository<Notification>>(getRepositoryToken(Notification));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getCustomerDetails', () => {
    it('should return customer details with aggregated data', async () => {
      jest.spyOn(customerRepository, 'findOne').mockResolvedValue(mockCustomer as Customer);
      jest.spyOn(eventRepository, 'findOne')
        .mockResolvedValueOnce(mockFirstEvent as Event)
        .mockResolvedValueOnce(mockLatestEvent as Event);
      jest.spyOn(notificationRepository, 'count')
        .mockResolvedValueOnce(10) // total
        .mockResolvedValueOnce(8)  // successful
        .mockResolvedValueOnce(2); // failed

      const result = await service.getCustomerDetails('user123', 'tenant1');

      expect(result).toEqual({
        id: 'user123',
        name: 'test@example.com',
        email: 'test@example.com',
        phone: '+1234567890',
        joinDate: '2024-01-01T00:00:00.000Z',
        status: 'power',
        totalNotifications: 10,
        successfulNotifications: 8,
        failedNotifications: 2,
        lastActivity: '2024-01-15T00:00:00.000Z',
      });
    });

    it('should return null when customer not found', async () => {
      jest.spyOn(customerRepository, 'findOne').mockResolvedValue(null);

      const result = await service.getCustomerDetails('nonexistent', 'tenant1');

      expect(result).toBeNull();
    });
  });
});
