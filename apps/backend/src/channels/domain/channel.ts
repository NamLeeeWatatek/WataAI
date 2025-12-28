import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Channel domain entity - theo schema má»›i
 * Table: channels
 * Fields: id, bot_id, type, name, config, is_active, connected_at, created_by, created_at, updated_at
 */
export class Channel {
  @ApiProperty({ type: String })
  id: string;

  @ApiProperty({ type: String })
  botId: string;

  @ApiProperty({
    type: String,
    enum: [
      'web',
      'messenger',
      'telegram',
      'instagram',
      'whatsapp',
      'api',
      'omi',
    ],
  })
  type: string;

  @ApiProperty({ type: String })
  name: string;

  @ApiPropertyOptional({
    type: Object,
    description: 'Channel-specific configuration',
  })
  config?: Record<string, any>;

  @ApiProperty({ type: Boolean, default: true })
  isActive: boolean;

  @ApiPropertyOptional({ type: Date })
  connectedAt?: Date | null;

  @ApiProperty({ type: String })
  createdBy: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
