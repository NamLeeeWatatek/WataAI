import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsUUID, IsOptional, IsEnum } from 'class-validator';

export class CreateNotificationDto {
  @ApiProperty({ description: 'User ID who receives the notification' })
  @IsUUID()
  userId: string;

  @ApiProperty({ description: 'Workspace ID associated with the notification' })
  @IsUUID()
  workspaceId: string;

  @ApiProperty({ description: 'Notification title' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Notification message content' })
  @IsString()
  message: string;

  @ApiPropertyOptional({
    description: 'Notification type',
    enum: ['info', 'success', 'warning', 'error'],
    default: 'info',
  })
  @IsOptional()
  @IsEnum(['info', 'success', 'warning', 'error'])
  type?: 'info' | 'success' | 'warning' | 'error';
}
