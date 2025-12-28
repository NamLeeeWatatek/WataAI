import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * WebhookEvent domain entity - theo schema má»›i
 * Table: webhook_events
 * Fields: id, channel_id, raw_payload, status, error_message, processed_at, received_at
 */
export class WebhookEvent {
  @ApiProperty({ type: String })
  id: string;

  @ApiProperty({ type: String })
  channelId: string;

  @ApiProperty({ type: Object })
  rawPayload: Record<string, any>;

  @ApiProperty({
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending',
  })
  status: 'pending' | 'processing' | 'completed' | 'failed';

  @ApiPropertyOptional({ type: String })
  errorMessage?: string | null;

  @ApiPropertyOptional({ type: Date })
  processedAt?: Date | null;

  @ApiProperty()
  receivedAt: Date;
}
