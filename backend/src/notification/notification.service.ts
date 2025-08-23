import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Notification } from './notification.entity';
import { PaginationDto } from './dto/pagination.dto';
import { PaginatedNotificationResponseDto, NotificationResponseDto } from './dto/notification-response.dto';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
  ) {}

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
}
