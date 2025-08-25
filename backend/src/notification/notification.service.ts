import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { Notification } from './notification.entity';
import { PaginationDto } from './dto/pagination.dto';
import { PaginatedNotificationResponseDto, NotificationResponseDto } from './dto/notification-response.dto';
import { WorkflowTriggerDto } from './dto/workflow-trigger.dto';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { CustomerService } from 'src/customer/customer.service';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    private readonly httpService: HttpService,
    private readonly customerService: CustomerService,
  ) {}

  async create(createNotificationDto: CreateNotificationDto): Promise<Notification> {
    const notification = this.notificationRepository.create(createNotificationDto);
    return this.notificationRepository.save(notification);
  }

  async findAll(): Promise<Notification[]> {
    return this.notificationRepository.find({
      order: {
        timestamp: 'DESC',
      },
    });
  }

  async findAllPaginated(paginationDto: PaginationDto): Promise<PaginatedNotificationResponseDto> {
    const { page = 1, limit = 20, search, platform, outcome, sortBy = 'timestamp', sortOrder = 'DESC' } = paginationDto;
    
    // Build query builder for search functionality
    const queryBuilder = this.notificationRepository
      .createQueryBuilder('notification')
      .leftJoinAndSelect('notification.customer', 'customer');

    // Apply search filter
    if (search) {
      queryBuilder.andWhere(
        '(customer.email LIKE :search OR notification.name LIKE :search)',
        { search: `%${search}%` }
      );
    }

    // Apply other filters
    if (platform && platform !== 'All') {
      queryBuilder.andWhere('notification.platform = :platform', { platform });
    }

    if (outcome && outcome !== 'All') {
      queryBuilder.andWhere('notification.outcome = :outcome', { outcome });
    }

    // Apply sorting
    if (sortBy === 'userName') {
      queryBuilder.orderBy('customer.name', sortOrder);
    } else if (sortBy === 'notificationName') {
      queryBuilder.orderBy('notification.name', sortOrder);
    } else if (sortBy === 'platform') {
      queryBuilder.orderBy('notification.platform', sortOrder);
    } else if (sortBy === 'outcome') {
      queryBuilder.orderBy('notification.outcome', sortOrder);
    } else {
      queryBuilder.orderBy('notification.timestamp', sortOrder);
    }

    // Get total count
    const total = await queryBuilder.getCount();

    // Apply pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    // Execute query
    const notifications = await queryBuilder.getMany();

    // Map to response DTO
    const data: NotificationResponseDto[] = notifications.map((notification, index) => ({
      id: skip + index + 1, // Generate sequential ID for frontend
      userName: notification.customer?.name || notification.customer?.email,
      notificationName: notification.name,
      platform: notification.platform,
      outcome: notification.outcome,
      timestamp: notification.timestamp.toISOString(),
      userId: notification.userId,
    }));

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  async findByUserId(userId: string): Promise<NotificationResponseDto[]> {
    const notifications = await this.notificationRepository.find({
      where: { userId },
      relations: ['customer'],
      order: { timestamp: 'DESC' },
    });

    return notifications.map((notification, index) => ({
      id: index + 1,
      userName: notification.customer?.name || notification.customer?.email,
      notificationName: notification.name,
      platform: notification.platform,
      outcome: notification.outcome,
      timestamp: notification.timestamp.toISOString(),
      userId: notification.userId,
    }));
  }

  async triggerWorkflow(workflowData: WorkflowTriggerDto): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          'https://api.trysiren.io/api/v2/workflows/trigger',
          workflowData,
          {
            headers: {
              'Authorization': process.env.WORKFLOW_API_KEY,
              'Content-Type': 'application/json',
            },
          }
        )
      );

      return {
        success: true,
        data: response.data,
        status: response.status,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        status: error.response?.status || 500,
      };
    }
  }

  async updateNotification(notificationId: string, updateNotificationDto: UpdateNotificationDto): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({ where: { id: notificationId } });
    return this.notificationRepository.save({
      ...notification,
      outcome: updateNotificationDto.outcome,
      platform: updateNotificationDto.provider,
    });
  }

  async getStatus(notificationId: string): Promise<string> {
    const notification = await this.notificationRepository.findOne({ where: { id: notificationId } });

    if (notification) {
      const customer = await this.customerService.getCustomerDetails(notification.userId);
      if (customer?.status !== 'at_risk') {
        await this.updateNotification(notificationId, { outcome: 'Success', provider: 'Workflow', notificationId: notificationId });
      }
      return 'resolved';
    }

    return 'pending';
  }
}
