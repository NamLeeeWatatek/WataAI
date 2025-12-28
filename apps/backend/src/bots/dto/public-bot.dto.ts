import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsObject, IsUUID } from 'class-validator';
import { MessageRole } from '../../conversations/conversations.enum';

/**
 * DTO for creating a public conversation (from widget)
 */
export class CreatePublicConversationDto {
  @ApiPropertyOptional({
    description: 'User ID if user is logged in',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({
    description: 'User agent string',
    example: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)...',
  })
  @IsOptional()
  @IsString()
  userAgent?: string;

  @ApiPropertyOptional({
    description: 'IP address of the user',
    example: '192.168.1.1',
  })
  @IsOptional()
  @IsString()
  ipAddress?: string;

  @ApiPropertyOptional({
    description: 'Additional metadata',
    example: {
      url: 'https://example.com/page',
      referrer: 'https://google.com',
    },
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

/**
 * DTO for adding a message to public conversation
 */
export class AddPublicMessageDto {
  @ApiProperty({
    description: 'Message content',
    example: 'What are your business hours?',
  })
  @IsString()
  message: string;

  @ApiPropertyOptional({
    description: 'Additional metadata',
    example: { source: 'widget', timestamp: '2024-12-02T14:30:00Z' },
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

/**
 * Response DTO for bot configuration
 */
export class BotConfigResponseDto {
  @ApiProperty({ description: 'Bot ID' })
  botId: string;

  @ApiPropertyOptional({ description: 'Widget version' })
  version?: string;

  @ApiPropertyOptional({ description: 'Widget version ID' })
  versionId?: string;

  @ApiProperty({ description: 'Bot name' })
  name: string;

  @ApiPropertyOptional({ description: 'Bot description' })
  description?: string | null;

  @ApiPropertyOptional({ description: 'Bot avatar URL' })
  avatarUrl?: string | null;

  @ApiProperty({ description: 'Default language' })
  defaultLanguage: string;

  @ApiProperty({ description: 'Timezone' })
  timezone: string;

  @ApiProperty({ description: 'Welcome message' })
  welcomeMessage: string;

  @ApiProperty({ description: 'Placeholder text' })
  placeholderText: string;

  @ApiProperty({ description: 'Widget theme configuration' })
  theme: {
    primaryColor: string;
    position: string;
    buttonSize: string;
    showAvatar: boolean;
    showTimestamp: boolean;
  };
}

/**
 * Response DTO for conversation creation
 */
export class CreateConversationResponseDto {
  @ApiProperty({ description: 'Conversation ID' })
  conversationId: string;

  @ApiProperty({ description: 'Bot ID' })
  botId: string;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;
}

/**
 * Response DTO for message
 */
export class MessageResponseDto {
  @ApiProperty({ description: 'Message ID' })
  messageId: string;

  @ApiProperty({ description: 'Message content' })
  content: string;

  @ApiProperty({ description: 'Message role', enum: MessageRole })
  role: MessageRole;

  @ApiProperty({ description: 'Message timestamp' })
  timestamp: Date;

  @ApiPropertyOptional({ description: 'Message metadata' })
  metadata?: Record<string, any>;
}

/**
 * Response DTO for conversation messages
 */
export class ConversationMessagesResponseDto {
  @ApiProperty({ description: 'Conversation ID' })
  conversationId: string;

  @ApiProperty({ description: 'List of messages', type: [MessageResponseDto] })
  messages: MessageResponseDto[];
}
