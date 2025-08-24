import { IsString, IsNotEmpty, IsUUID, IsOptional } from 'class-validator';

export class CreateNotificationDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  platform: string;

  @IsString()
  @IsNotEmpty()
  outcome: string;

  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsOptional()
  metadata?: Record<string, any>;
}
