import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventController } from './event.controller';
import { EventService } from './event.service';
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
  providers: [EventService],
  exports: [EventService],
})
export class EventModule {}
