export class NotificationResponseDto {
  id: number;
  userName: string;
  notificationName: string;
  platform: string;
  outcome: string;
  timestamp: string;
  userId: string;
}

export class PaginatedNotificationResponseDto {
  data: NotificationResponseDto[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
