import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsObject,
  IsUUID,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  ConversationStatus,
  MessageRole,
  MessageFeedback,
} from '../conversations.enum';

export class CreateConversationDto {
  @ApiProperty({ description: 'Bot ID' })
  @IsNotEmpty()
  @IsUUID()
  botId: string;

  @ApiPropertyOptional({
    enum: ['web', 'messenger', 'telegram', 'instagram', 'whatsapp', 'api'],
    default: 'web',
  })
  @IsOptional()
  @IsEnum(['web', 'messenger', 'telegram', 'instagram', 'whatsapp', 'api'])
  channelType?: string;

  @ApiPropertyOptional({ description: 'Channel ID' })
  @IsOptional()
  @IsUUID()
  channelId?: string | null;

  @ApiPropertyOptional({ example: 'John Doe', deprecated: true })
  @IsOptional()
  @IsString()
  contactName?: string | null;

  @ApiPropertyOptional({
    example: 'https://example.com/avatar.jpg',
    deprecated: true,
  })
  @IsOptional()
  @IsString()
  contactAvatar?: string | null;

  @ApiPropertyOptional({ description: 'Workspace ID' })
  @IsOptional()
  @IsUUID()
  workspaceId?: string;

  @ApiPropertyOptional({ description: 'Source channel/platform' })
  @IsOptional()
  @IsString()
  source?: string;

  @ApiPropertyOptional({ enum: ConversationStatus })
  @IsOptional()
  @IsEnum(ConversationStatus)
  status?: ConversationStatus;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({ deprecated: true })
  @IsOptional()
  @IsString()
  externalId?: string;
}

export class AttachmentDto {
  @ApiProperty({ example: 'image' })
  @IsString()
  type: string;

  @ApiProperty({ example: 'https://example.com/image.jpg' })
  @IsString()
  url: string;

  @ApiPropertyOptional({ example: 'image.jpg' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 1024 })
  @IsOptional()
  @IsNumber()
  size?: number;
}

export class CreateMessageDto {
  @ApiProperty({
    enum: MessageRole,
    default: MessageRole.USER,
  })
  @IsNotEmpty()
  @IsEnum(MessageRole)
  role: MessageRole;

  @ApiProperty({ example: 'Hello, how can I help you?' })
  @IsNotEmpty()
  @IsString()
  content: string;

  @ApiPropertyOptional({ type: [AttachmentDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttachmentDto)
  attachments?: AttachmentDto[] | null;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({ type: [Object] })
  @IsOptional()
  @IsArray()
  sources?: Array<{
    documentId: string;
    title: string;
    content: string;
    score: number;
  }> | null;

  @ApiPropertyOptional({ type: [Object] })
  @IsOptional()
  @IsArray()
  toolCalls?: Array<{
    id: string;
    name: string;
    arguments: Record<string, any>;
    result?: any;
  }> | null;

  @ApiPropertyOptional({
    description: 'Message sender name or handle',
    deprecated: true,
  })
  @IsOptional()
  @IsString()
  sender?: string;
}

export class UpdateConversationStatusDto {
  @ApiProperty({ enum: ConversationStatus })
  @IsEnum(ConversationStatus)
  status: ConversationStatus;
}

export class MessageFeedbackDto {
  @ApiPropertyOptional({ enum: MessageFeedback })
  @IsOptional()
  @IsEnum(MessageFeedback)
  feedback?: MessageFeedback;

  @ApiPropertyOptional({ example: 'Very helpful response!' })
  @IsOptional()
  @IsString()
  feedbackComment?: string | null;
}

export class CreateMessageFeedbackDto {
  @ApiProperty({ minimum: 1, maximum: 5 })
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiPropertyOptional({ example: 'Great response!' })
  @IsOptional()
  @IsString()
  comment?: string | null;
}
