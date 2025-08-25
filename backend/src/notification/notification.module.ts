import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { Notification } from './notification.entity';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { CustomerService } from '../customer/customer.service';
import { CustomerModule } from '../customer/customer.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification]),
    HttpModule,
    CustomerModule,
  ],
  providers: [NotificationService, CustomerService],
  controllers: [NotificationController],
  exports: [NotificationService],
})
export class NotificationModule {}
