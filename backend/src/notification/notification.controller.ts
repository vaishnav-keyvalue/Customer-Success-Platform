import { Controller, Get, Query, Param } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { Notification } from './notification.entity';
import { PaginationDto } from './dto/pagination.dto';
import { PaginatedNotificationResponseDto } from './dto/notification-response.dto';

@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

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
