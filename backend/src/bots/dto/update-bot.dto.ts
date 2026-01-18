import { PartialType, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateBotDto } from './create-bot.dto';
import {
  BotStatus,
  BotWidgetPosition,
  BotWidgetButtonSize,
} from '../bots.enum';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  IsBoolean,
  IsObject,
  IsUUID,
} from 'class-validator';

export class UpdateBotDto extends PartialType(CreateBotDto) {
  @ApiPropertyOptional({ example: 'Customer Support Bot' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'A bot for handling customer inquiries' })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiPropertyOptional({ example: 'https://example.com/bot-avatar.png' })
  @IsOptional()
  @IsString()
  avatarUrl?: string | null;

  @ApiPropertyOptional({ example: 'en' })
  @IsOptional()
  @IsString()
  defaultLanguage?: string;

  @ApiPropertyOptional({ example: 'UTC' })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional({ enum: BotStatus })
  @IsOptional()
  @IsEnum(BotStatus)
  status?: BotStatus;

  @ApiPropertyOptional({ example: 'You are a helpful customer support agent.' })
  @IsOptional()
  @IsString()
  systemPrompt?: string | null;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  functions?: string[] | null;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  functionConfig?: Record<string, any> | null;

  @ApiPropertyOptional({ description: 'Flow ID' })
  @IsOptional()
  @IsUUID()
  flowId?: string | null;

  @ApiPropertyOptional({ description: 'AI Provider ID' })
  @IsOptional()
  @IsUUID()
  aiProviderId?: string | null;

  @ApiPropertyOptional({ example: 'gpt-4' })
  @IsOptional()
  @IsString()
  aiModelName?: string | null;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  aiParameters?: Record<string, any> | null;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  knowledgeBaseIds?: string[] | null;

  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @IsBoolean()
  enableAutoLearn?: boolean;

  @ApiPropertyOptional({ example: '#667eea' })
  @IsOptional()
  @IsString()
  primaryColor?: string | null;

  @ApiPropertyOptional({
    enum: BotWidgetPosition,
  })
  @IsOptional()
  @IsEnum(BotWidgetPosition)
  widgetPosition?: BotWidgetPosition;

  @ApiPropertyOptional({ enum: BotWidgetButtonSize })
  @IsOptional()
  @IsEnum(BotWidgetButtonSize)
  widgetButtonSize?: BotWidgetButtonSize;

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

  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @IsBoolean()
  showAvatar?: boolean;

  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @IsBoolean()
  showTimestamp?: boolean;

  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @IsBoolean()
  widgetEnabled?: boolean;

  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowedOrigins?: string[] | null;
}

export class CreateFlowVersionDto {
  @ApiPropertyOptional({ example: 'Version 1.0' })
  @IsOptional()
  @IsString()
  name?: string | null;

  @ApiPropertyOptional({ example: 'Initial release' })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  flow?: Record<string, any>;
}

export class LinkKnowledgeBaseDto {
  @ApiPropertyOptional({ description: 'Knowledge Base ID' })
  @IsUUID()
  knowledgeBaseId: string;

  @ApiPropertyOptional({ type: Number, default: 1 })
  @IsOptional()
  priority?: number;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  ragSettings?: Record<string, any> | null;
}
