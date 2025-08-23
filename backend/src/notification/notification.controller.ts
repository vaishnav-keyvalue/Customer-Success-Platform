import { Controller, Get, Post, Query, Param, Body } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { Notification } from './notification.entity';
import { PaginationDto } from './dto/pagination.dto';
import { PaginatedNotificationResponseDto } from './dto/notification-response.dto';
import { WorkflowTriggerDto } from './dto/workflow-trigger.dto';
import { CreateNotificationDto } from './dto/create-notification.dto';

@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post()
  async create(@Body() createNotificationDto: CreateNotificationDto): Promise<Notification> {
    return this.notificationService.create(createNotificationDto);
  }

  @Get()
  async findAll(): Promise<Notification[]> {
    return this.notificationService.findAll();
  }

  @Get('paginated')
  async findAllPaginated(@Query() paginationDto: PaginationDto): Promise<PaginatedNotificationResponseDto> {
    return this.notificationService.findAllPaginated(paginationDto);
  }

  // Public endpoint for getting notifications by userId
  @Get('public/user/:userId')
  async getNotificationsByUserId(@Param('userId') userId: string) {
    try {
      const notifications = await this.notificationService.findByUserId(userId);
      
      return {
        success: true,
        data: notifications,
        count: notifications.length,
        userId,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error retrieving notifications',
        error: error.message,
      };
    }
  }
}
