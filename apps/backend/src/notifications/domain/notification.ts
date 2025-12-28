import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Notification domain entity - theo schema má»›i
 * Table: notifications
 */
export class Notification {
  @ApiProperty({ type: String })
  id: string;

  @ApiProperty({ type: String })
  userId: string;

  @ApiProperty({ type: String })
  workspaceId: string;

  @ApiProperty({ type: String })
  title: string;

  @ApiProperty({ type: String })
  message: string;

  @ApiProperty({
    type: String,
    enum: ['info', 'success', 'warning', 'error'],
    default: 'info',
  })
  type: 'info' | 'success' | 'warning' | 'error';

  @ApiProperty({ type: Boolean, default: false })
  isRead: boolean;

  @ApiProperty()
  createdAt: Date;
}
