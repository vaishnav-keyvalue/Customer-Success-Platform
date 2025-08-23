import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from './customer.entity';
import { Event } from '../event/event.entity';
import { Notification } from '../notification/notification.entity';
import { CustomerDetailDto } from './dto/customer-detail.dto';

@Injectable()
export class CustomerService {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
  ) {}

  async getCustomerEvents(customerId: string, tenantId: string): Promise<Event[]> {
    return await this.eventRepository.find({
      where: { 
        customer: { id: customerId },
        tenant: { id: tenantId } 
      },
      relations: ['customer'],
      order: { ts: 'DESC' },
    });
  }

  async getCustomerById(customerId: string, tenantId: string): Promise<Customer | null> {
    return await this.customerRepository.findOne({
      where: { 
        id: customerId,
        tenant: { id: tenantId } 
      },
    });
  }

  async getCustomerByEmail(email: string, tenantId: string): Promise<Customer | null> {
    return await this.customerRepository.findOne({
      where: { 
        email,
        tenant: { id: tenantId } 
      },
    });
  }

  async getAllCustomersByTenant(tenantId: string): Promise<Customer[]> {
    return await this.customerRepository.find({
      where: { tenant: { id: tenantId } },
      order: { name: 'ASC' },
    });
  }

  async getCustomerDetails(userId: string): Promise<CustomerDetailDto | null> {
    // Get customer basic info
    const customer = await this.customerRepository.findOne({
      where: { 
        userId,
      },
    });

    if (!customer) {
      return null;
    }

    // Get first event date (join date)
    const firstEvent = await this.eventRepository.findOne({
      where: { 
        userId,
      },
      order: { ts: 'ASC' },
    });

    // Get latest event date (last activity)
    const latestEvent = await this.eventRepository.findOne({
      where: { 
        userId,
      },
      order: { ts: 'DESC' },
    });

    // Get notification counts - using a more direct query
    const [totalNotifications, successfulNotifications, failedNotifications] = await Promise.all([
      this.notificationRepository.count({
        where: { 
          userId,
        },
      }),
      this.notificationRepository.count({
        where: { 
          userId,
          outcome: 'Success'
        },
      }),
      this.notificationRepository.count({
        where: { 
          userId,
          outcome: 'Failed'
        },
      }),
    ]);

    return {
      id: userId,
      name: customer.email, // Using email as name as per requirement
      email: customer.email,
      phone: customer.phone,
      joinDate: firstEvent ? firstEvent.ts.toISOString() : customer.createdAt.toISOString(),
      status: customer.segment || 'Unknown',
      totalNotifications,
      successfulNotifications,
      failedNotifications,
      lastActivity: latestEvent ? latestEvent.ts.toISOString() : customer.updatedAt.toISOString(),
    };
  }

  async getAllCustomerDetails(tenantId: string): Promise<CustomerDetailDto[]> {
    const customers = await this.customerRepository.find({
      where: { tenant: { id: tenantId } },
      select: ['userId', 'email', 'phone', 'segment', 'createdAt', 'updatedAt'],
    });

    const customerDetails: CustomerDetailDto[] = [];

    for (const customer of customers) {
      const details = await this.getCustomerDetails(customer.userId);
      if (details) {
        customerDetails.push(details);
      }
    }

    return customerDetails;
  }
}
