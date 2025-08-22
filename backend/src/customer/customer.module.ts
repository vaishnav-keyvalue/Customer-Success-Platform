import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerController } from './customer.controller';
import { CustomerService } from './customer.service';
import { Customer } from './customer.entity';
import { Event } from '../event/event.entity';
import { TenantModule } from '../tenant/tenant.module';
import { JwtConfigModule } from 'src/config/jwt.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Customer, Event]),
    TenantModule,
    JwtConfigModule,
  ],
  controllers: [CustomerController],
  providers: [CustomerService],
  exports: [TypeOrmModule, CustomerService],
})
export class CustomerModule {}
