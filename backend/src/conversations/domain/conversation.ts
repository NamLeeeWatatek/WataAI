import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Conversation domain entity - theo schema má»›i
 * Table: conversations
 * Fields: id, bot_id, channel_type, channel_id, contact_name, contact_avatar,
 *         metadata, status, last_message_at, handover_ticket_id, deleted_at, created_at, updated_at
 */
export class Conversation {
  @ApiProperty({ type: String })
  id: string;

  @ApiProperty({ type: String })
  botId: string;

  @ApiProperty({
    type: String,
    enum: ['web', 'messenger', 'telegram', 'instagram', 'whatsapp', 'api'],
  })
  channelType: string;

  @ApiPropertyOptional({ type: String })
  channelId?: string | null;

  @ApiPropertyOptional({ type: String })
  contactName?: string | null;

  @ApiPropertyOptional({ type: String })
  contactAvatar?: string | null;

  @ApiPropertyOptional({ type: Object })
  metadata?: Record<string, any>;

  @ApiProperty({
    type: String,
    enum: ['active', 'closed', 'handover', 'archived'],
    default: 'active',
  })
  status: 'active' | 'closed' | 'handover' | 'archived';

  @ApiPropertyOptional({ type: Date })
  lastMessageAt?: Date | null;

  @ApiPropertyOptional({ type: String })
  handoverTicketId?: string | null;

  @ApiPropertyOptional({ type: String, deprecated: true })
  externalId?: string;

  @ApiPropertyOptional()
  deletedAt?: Date | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

/**
 * Message domain entity - theo schema má»›i
 * Table: messages
 * Fields: id, conversation_id, role, content, attachments, metadata,
 *         sources, tool_calls, feedback, feedback_comment, sent_at
 */
export class Message {
  @ApiProperty({ type: String })
  id: string;

  @ApiProperty({ type: String })
  conversationId: string;

  @ApiProperty({
    type: String,
    enum: ['user', 'assistant', 'system', 'tool'],
  })
  role: 'user' | 'assistant' | 'system' | 'tool';

  @ApiProperty({ type: String })
  content: string;

  @ApiPropertyOptional({ type: [Object], description: 'File attachments' })
  attachments?: Array<{
    type: string;
    url: string;
    name?: string;
    size?: number;
  }> | null;

  @ApiPropertyOptional({ type: Object })
  metadata?: Record<string, any>;

  @ApiPropertyOptional({
    type: [Object],
    description: 'RAG sources used for response',
  })
  sources?: Array<{
    documentId: string;
    title: string;
    content: string;
    score: number;
  }> | null;

  @ApiPropertyOptional({ type: [Object], description: 'Tool/function calls' })
  toolCalls?: Array<{
    id: string;
    name: string;
    arguments: Record<string, any>;
    result?: any;
  }> | null;

  @ApiPropertyOptional({
    type: String,
    enum: ['positive', 'negative'],
    description: 'User feedback',
  })
  feedback?: 'positive' | 'negative' | null;

  @ApiPropertyOptional({ type: String })
  feedbackComment?: string | null;

  @ApiPropertyOptional({ type: String, deprecated: true })
  sender?: string;

  @ApiProperty()
  sentAt: Date;
}

/**
 * MessageFeedback domain entity - theo schema má»›i
 * Table: message_feedback
 * Fields: message_id, rating, comment, created_at
 */
export class MessageFeedback {
  @ApiProperty({ type: String })
  messageId: string;

  @ApiProperty({ type: Number, minimum: 1, maximum: 5 })
  rating: number;

  @ApiPropertyOptional({ type: String })
  comment?: string | null;

  @ApiProperty()
  createdAt: Date;
}
