import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EventController } from './event.controller';
import { EventService } from './event.service';
import { EventListenerService } from './event-listener.service';
import { NotificationEventListenerService } from './notification-event-listener.service';
import { Event } from './event.entity';
import { Customer } from '../customer/customer.entity';
import { TenantModule } from '../tenant/tenant.module';
import { JwtConfigModule } from 'src/config/jwt.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Event, Customer]),
    JwtConfigModule,
    TenantModule,
  ],
  controllers: [EventController],
  providers: [
    EventService, 
    EventListenerService, 
    NotificationEventListenerService, 
  ],
  exports: [EventService],
})
export class EventModule {}
