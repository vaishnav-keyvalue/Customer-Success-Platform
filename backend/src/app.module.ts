import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { TenantModule } from './tenant/tenant.module';
import { EventModule } from './event/event.module';
import { CustomerModule } from './customer/customer.module';
import { NotificationModule } from './notification/notification.module';
import { JwtConfigModule } from './config/jwt.module';
import { ConfigModule } from './config/config.module';
import { JwtService } from '@nestjs/jwt';

@Module({
  imports: [
    DatabaseModule,
    ConfigModule,
    JwtConfigModule,
    TenantModule,
    EventModule,
    CustomerModule,
    NotificationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
