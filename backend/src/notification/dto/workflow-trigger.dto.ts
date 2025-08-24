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
    [key: string]: any; // Allow additional properties for ML service results
  };

  @IsOptional()
  notify?: {
    email?: string;
    sms?: string;
  };
}
