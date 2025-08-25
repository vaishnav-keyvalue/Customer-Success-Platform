import { IsNotEmpty, IsString } from "class-validator";

export class NotificationStatusDto {
    @IsString()
    @IsNotEmpty()
    notificationId: string;
}