import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerController } from './customer.controller';
import { CustomerService } from './customer.service';
import { FeatureService } from './feature/feature.service';
import { Customer } from './customer.entity';
import { Event } from '../event/event.entity';
import { Notification } from '../notification/notification.entity';
import { TenantModule } from '../tenant/tenant.module';
import { JwtConfigModule } from 'src/config/jwt.module';
import { CustomerEventConsumer } from './event/event.consumer';
import { NotificationService } from 'src/notification/notification.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    TypeOrmModule.forFeature([Customer, Event, Notification]),
    TenantModule,
    JwtConfigModule,
    HttpModule,
  ],
  controllers: [CustomerController],
  providers: [CustomerService, FeatureService, CustomerEventConsumer, NotificationService],
  exports: [TypeOrmModule, CustomerService, FeatureService],
})
export class CustomerModule {}
