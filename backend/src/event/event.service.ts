import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from './event.entity';
import { Customer } from '../customer/customer.entity';
import { Tenant } from '../tenant/tenant.entity';

export interface CreateEventDto {
  name: string;
  data: Record<string, any>;
  customerEmail: string;
  customerName?: string;
  customerPhone?: string;
}

@Injectable()
export class EventService {
  constructor(
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
  ) {}

  async createEvent(createEventDto: CreateEventDto, tenant: Tenant): Promise<Event> {
    // Find or create customer
    let customer = await this.customerRepository.findOne({
      where: {
        email: createEventDto.customerEmail,
        tenant: { id: tenant.id },
      },
    });

    if (!customer) {
      // Create new customer if not exists
      customer = this.customerRepository.create({
        name: createEventDto.customerName || createEventDto.customerEmail.split('@')[0],
        email: createEventDto.customerEmail,
        phone: createEventDto.customerPhone || '',
        tenant,
      });
      await this.customerRepository.save(customer);
    }

    // Create the event
    const event = this.eventRepository.create({
      name: createEventDto.name,
      data: createEventDto.data,
      customer,
      tenant,
    });

    return await this.eventRepository.save(event);
  }

  async getEventsByTenant(tenantId: string): Promise<Event[]> {
    return await this.eventRepository.find({
      where: { tenant: { id: tenantId } },
      relations: ['customer'],
      order: { createdAt: 'DESC' },
    });
  }

  async getEventById(id: string, tenantId: string): Promise<Event> {
    const event = await this.eventRepository.findOne({
      where: { id, tenant: { id: tenantId } },
      relations: ['customer'],
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    return event;
  }

  async getEventsByCustomer(customerId: string, tenantId: string): Promise<Event[]> {
    return await this.eventRepository.find({
      where: { 
        customer: { id: customerId },
        tenant: { id: tenantId } 
      },
      relations: ['customer'],
      order: { createdAt: 'DESC' },
    });
  }

  async getEventsByCustomerEmail(customerEmail: string, tenantId: string): Promise<Event[]> {
    return await this.eventRepository.find({
      where: { 
        customer: { email: customerEmail },
        tenant: { id: tenantId } 
      },
      relations: ['customer'],
      order: { createdAt: 'DESC' },
    });
  }
}
