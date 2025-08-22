import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { Tenant, TenantStatus } from '../tenant.entity';

export interface JwtPayload {
  sub: string;
  tenantId: string;
  email: string;
  iat: number;
  exp: number;
}

@Injectable()
export class TenantAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Authorization token is required');
    }

    try {
      // Verify and decode the JWT token
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      // Check if token has required claims
      if (!payload.tenantId) {
        throw new UnauthorizedException('Token must contain tenant ID');
      }

      // Validate tenant exists and is active
      const tenant = await this.validateTenant(payload.tenantId);
      if (!tenant) {
        throw new ForbiddenException('Invalid or inactive tenant');
      }

      // Attach user and tenant information to request for use in controllers
      request['user'] = {
        id: payload.sub,
        email: payload.email,
        tenantId: payload.tenantId,
      };
      request['tenant'] = tenant;

      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException || error instanceof ForbiddenException) {
        throw error;
      }
      
      // Handle JWT verification errors
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Token has expired');
      }
      if (error.name === 'JsonWebTokenError') {
        throw new UnauthorizedException('Invalid token');
      }
      
      throw new UnauthorizedException('Authentication failed');
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }

  private async validateTenant(tenantId: string): Promise<Tenant | null> {
    try {
      const tenant = await this.tenantRepository.findOne({
        where: {
          id: tenantId,
          isActive: true,
          status: TenantStatus.ACTIVE,
        },
      });

      if (!tenant) {
        return null;
      }

      // Additional checks for subscription status
      if (tenant.subscriptionExpiresAt && !tenant.isSubscriptionActive()) {
        return null;
      }

      return tenant;
    } catch (error) {
      // Log error for debugging but don't expose internal errors
      console.error('Error validating tenant:', error);
      return null;
    }
  }
}
