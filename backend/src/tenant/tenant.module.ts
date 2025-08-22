import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tenant } from './tenant.entity';
import { TenantService } from './tenant.service';
import { TenantController } from './tenant.controller';
import { TenantAuthGuard } from './auth/tenant-auth.guard';
import { JwtConfigModule } from 'src/config/jwt.module';

@Module({
  imports: [TypeOrmModule.forFeature([Tenant]), JwtConfigModule],
  controllers: [TenantController],
  providers: [TenantService, TenantAuthGuard],
  exports: [TenantService, TypeOrmModule, TenantAuthGuard],
})
export class TenantModule {}
