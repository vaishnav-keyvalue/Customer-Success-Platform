import { IsString, IsEmail, IsOptional } from 'class-validator';

export class WorkflowTriggerDto {
  @IsString()
  worflowName: string;

  @IsOptional()
  data?: {
    userId: string;
    userName: string;
    tenant: string;
    notificationId: string;
  };

  @IsOptional()
  notify?: {
    email?: string;
    sms?: string;
  };
}
