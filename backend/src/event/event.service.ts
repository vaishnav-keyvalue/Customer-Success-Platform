import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Event, EventProps } from './event.entity';
import { Customer } from '../customer/customer.entity';
import { Tenant } from '../tenant/tenant.entity';

export interface CreateEventDto {
  id: string;
  ts: Date | string;
  userId: string;
  name: string;
  props: EventProps;
}

@Injectable()
export class EventService {
  constructor(
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async createEvent(createEventDto: CreateEventDto): Promise<Event> {
    // Find or create customer based on userId
    let customer = await this.customerRepository.findOne({
      where: {
        userId: createEventDto.userId,
        tenantId: 'e0028c9a-8c0b-48a9-889a-9420c0e62662',
      },
    });

    if (!customer) {
      // Create new customer if not exists
      customer = this.customerRepository.create({
        userId: createEventDto.userId,
        tenantId: 'e0028c9a-8c0b-48a9-889a-9420c0e62662',
        // All other fields are optional and will be null
      });
      await this.customerRepository.save(customer);
    }

    // Convert ts to Date if it's a string
    const timestamp = typeof createEventDto.ts === 'string' 
      ? new Date(createEventDto.ts) 
      : createEventDto.ts;

    // Create the event
    const event = this.eventRepository.create({
      id: createEventDto.id,
      ts: timestamp,
      userId: createEventDto.userId,
      name: createEventDto.name,
      props: createEventDto.props,
      tenantId: 'e0028c9a-8c0b-48a9-889a-9420c0e62662',
    });

    // Save the event
    const savedEvent = await this.eventRepository.save(event);
    
    // Emit event after successful save
    await this.eventEmitter.emit('event.created', {
      event: savedEvent,
      customer,
      timestamp: new Date(),
    });

    return savedEvent;
  }

  async getEventsByTenant(tenantId: string): Promise<Event[]> {
    return await this.eventRepository.find({
      where: { tenantId },
      order: { ts: 'DESC' },
    });
  }

  async getEventById(id: string, tenantId: string): Promise<Event> {
    const event = await this.eventRepository.findOne({
      where: { id, tenantId },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    return event;
  }

  async getEventsByUserId(userId: string, tenantId: string): Promise<Event[]> {
    return await this.eventRepository.find({
      where: { 
        userId,
        tenantId 
      },
      order: { ts: 'DESC' },
    });
  }

  async getEventsByName(name: string, tenantId: string): Promise<Event[]> {
    return await this.eventRepository.find({
      where: { 
        name,
        tenantId 
      },
      order: { ts: 'DESC' },
    });
  }

  async getEventsBySentiment(sentiment: 'positive' | 'negative' | 'neutral', tenantId: string): Promise<Event[]> {
    return await this.eventRepository.find({
      where: { 
        props: { sentiment },
        tenantId 
      },
      order: { ts: 'DESC' },
    });
  }

  async getEventsByUrgency(urgency: 'high' | 'low', tenantId: string): Promise<Event[]> {
    return await this.eventRepository.find({
      where: { 
        props: { urgency },
        tenantId 
      },
      order: { ts: 'DESC' },
    });
  }

  async getEventsByTicketId(ticketId: string, tenantId: string): Promise<Event[]> {
    return await this.eventRepository.find({
      where: { 
        props: { ticketId },
        tenantId 
      },
      order: { ts: 'DESC' },
    });
  }
}
