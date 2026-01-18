import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  BotStatus,
  BotWidgetPosition,
  BotWidgetButtonSize,
} from '../bots.enum';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsArray,
  IsBoolean,
  IsObject,
  IsUUID,
  Matches,
} from 'class-validator';

export class CreateBotDto {
  @ApiProperty({ example: 'Customer Support Bot' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'A bot for handling customer inquiries' })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiPropertyOptional({ example: 'https://example.com/bot-avatar.png' })
  @IsOptional()
  @IsString()
  avatarUrl?: string | null;

  @ApiPropertyOptional({ example: 'en', default: 'en' })
  @IsOptional()
  @IsString()
  defaultLanguage?: string;

  @ApiPropertyOptional({ example: 'UTC', default: 'UTC' })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional({
    enum: BotStatus,
    default: BotStatus.DRAFT,
  })
  @IsOptional()
  @IsEnum(BotStatus)
  status?: BotStatus;

  @ApiPropertyOptional({
    description: 'Workspace ID (auto-detected if not provided)',
  })
  @IsOptional()
  @IsUUID()
  workspaceId?: string;

  @ApiPropertyOptional({ example: 'You are a helpful customer support agent.' })
  @IsOptional()
  @IsString()
  systemPrompt?: string | null;

  @ApiPropertyOptional({
    type: [String],
    example: ['document_access', 'ai_suggest'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  functions?: string[] | null;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  functionConfig?: Record<string, any> | null;

  @ApiPropertyOptional({ description: 'AI Provider ID' })
  @IsOptional()
  @IsUUID()
  aiProviderId?: string | null;

  @ApiPropertyOptional({ example: 'gpt-4' })
  @IsOptional()
  @IsString()
  aiModelName?: string | null;

  @ApiPropertyOptional({
    type: Object,
    example: { temperature: 0.7, max_tokens: 1000 },
  })
  @IsOptional()
  @IsObject()
  aiParameters?: Record<string, any> | null;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  knowledgeBaseIds?: string[] | null;

  @ApiPropertyOptional({ type: Boolean, default: false })
  @IsOptional()
  @IsBoolean()
  enableAutoLearn?: boolean;

  @ApiPropertyOptional({
    example: '#667eea',
    description: 'Primary color in hex format',
  })
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-F]{6}$/i, {
    message: 'Invalid color format. Use hex format like #667eea',
  })
  primaryColor?: string | null;

  @ApiPropertyOptional({
    enum: BotWidgetPosition,
    example: BotWidgetPosition.BOTTOM_RIGHT,
  })
  @IsOptional()
  @IsEnum(BotWidgetPosition)
  widgetPosition?: BotWidgetPosition;

  @ApiPropertyOptional({
    enum: BotWidgetButtonSize,
    example: BotWidgetButtonSize.MEDIUM,
  })
  @IsOptional()
  @IsEnum(BotWidgetButtonSize)
  widgetButtonSize?: BotWidgetButtonSize;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  showAvatar?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  showTimestamp?: boolean;

  @ApiPropertyOptional({
    example: 'Xin chÃ o! TÃ´i cÃ³ thá»ƒ giÃºp gÃ¬ cho báº¡n?',
  })
  @IsOptional()
  @IsString()
  welcomeMessage?: string | null;

  @ApiPropertyOptional({ example: 'Nháº­p tin nháº¯n...' })
  @IsOptional()
  @IsString()
  placeholderText?: string | null;

  @ApiPropertyOptional({
    type: [String],
    example: ['*'],
    description: 'Allowed origins for CORS',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowedOrigins?: string[] | null;

  @ApiPropertyOptional({ deprecated: true })
  @IsOptional()
  @IsString()
  icon?: string;
}
