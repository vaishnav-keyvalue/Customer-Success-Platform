import { IsNotEmpty, IsString } from "class-validator";

export class UpdateNotificationDto {
    @IsString()
    @IsNotEmpty()
    notificationId: string;

    @IsString()
    @IsNotEmpty()
    outcome: string;

    @IsString()
    @IsNotEmpty()
    provider: string;
}