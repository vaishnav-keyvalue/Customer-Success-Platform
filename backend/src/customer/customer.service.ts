import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from './customer.entity';
import { Event } from '../event/event.entity';

@Injectable()
export class CustomerService {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
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
}
