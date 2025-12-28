import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Workspace } from '../../workspaces/domain/workspace';

export class Bot {
  @ApiProperty({ type: String })
  id: string;

  @ApiProperty({ type: String })
  workspaceId: string;

  @ApiProperty({ type: String })
  name: string;

  @ApiPropertyOptional({ type: String })
  description?: string | null;

  @ApiPropertyOptional({ type: String })
  avatarUrl?: string | null;

  @ApiProperty({ type: String, default: 'en' })
  defaultLanguage: string;

  @ApiProperty({ type: String, default: 'UTC' })
  timezone: string;

  @ApiProperty({
    type: String,
    enum: ['draft', 'active', 'paused', 'archived'],
    default: 'draft',
  })
  status: 'draft' | 'active' | 'paused' | 'archived';

  @ApiProperty({ type: String, nullable: true })
  createdBy: string | null;

  @ApiPropertyOptional({ type: String, deprecated: true })
  icon?: string;

  @ApiPropertyOptional({ type: Boolean, deprecated: true })
  isActive?: boolean;

  @ApiPropertyOptional({ type: String, deprecated: true })
  flowId?: string | null;

  @ApiPropertyOptional({ type: String })
  systemPrompt?: string | null;

  @ApiPropertyOptional({ type: [String] })
  functions?: string[] | null;

  @ApiPropertyOptional({ type: Object })
  functionConfig?: Record<string, any> | null;

  @ApiPropertyOptional({
    type: String,
    description: 'AI Provider ID from workspace or user providers',
  })
  aiProviderId?: string | null;

  @ApiPropertyOptional({
    type: String,
    description: 'Model name (e.g., gpt-4, gemini-pro)',
  })
  aiModelName?: string | null;

  @ApiPropertyOptional({
    type: Object,
    description: 'AI parameters like temperature, max_tokens',
  })
  aiParameters?: Record<string, any> | null;

  @ApiPropertyOptional({ type: [String] })
  knowledgeBaseIds?: string[] | null;

  @ApiPropertyOptional({ type: Boolean, default: false })
  enableAutoLearn?: boolean;

  @ApiPropertyOptional({
    type: [String],
    description:
      'Allowed origins for CORS (e.g., ["https://example.com", "*"])',
  })
  allowedOrigins?: string[] | null;

  @ApiPropertyOptional({
    type: String,
    description: 'Welcome message displayed when widget opens',
  })
  welcomeMessage?: string | null;

  @ApiPropertyOptional({
    type: String,
    description: 'Placeholder text for message input',
  })
  placeholderText?: string | null;

  @ApiPropertyOptional({
    type: String,
    description: 'Primary color for widget theme (hex color)',
  })
  primaryColor?: string | null;

  @ApiPropertyOptional({
    type: String,
    enum: ['bottom-right', 'bottom-left', 'top-right', 'top-left'],
    default: 'bottom-right',
    description: 'Widget position on the page',
  })
  widgetPosition?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';

  @ApiPropertyOptional({
    type: String,
    enum: ['small', 'medium', 'large'],
    default: 'medium',
    description: 'Widget button size',
  })
  widgetButtonSize?: 'small' | 'medium' | 'large';

  @ApiPropertyOptional({
    type: Boolean,
    default: true,
    description: 'Show bot avatar in widget',
  })
  showAvatar?: boolean;

  @ApiPropertyOptional({
    type: Boolean,
    default: true,
    description: 'Show message timestamps in widget',
  })
  showTimestamp?: boolean;

  @ApiPropertyOptional({
    type: Boolean,
    default: true,
    description: 'Enable/disable widget for this bot',
  })
  widgetEnabled?: boolean;

  @ApiPropertyOptional({ type: () => Workspace })
  workspace?: Workspace;

  @ApiPropertyOptional()
  deletedAt?: Date | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

/**
 * FlowVersion domain entity - theo schema má»›i
 * Table: flow_versions
 * Fields: id, bot_id, version, name, description, status, published_at, created_by, created_at
 */
export class FlowVersion {
  @ApiProperty({ type: String })
  id: string;

  @ApiProperty({ type: String })
  botId: string;

  @ApiProperty({ type: Number })
  version: number;

  @ApiPropertyOptional({ type: String })
  name?: string | null;

  @ApiPropertyOptional({ type: String })
  description?: string | null;

  @ApiProperty({
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft',
  })
  status: 'draft' | 'published' | 'archived';

  @ApiPropertyOptional({ type: Date })
  publishedAt?: Date | null;

  @ApiProperty({ type: String })
  createdBy: string;

  @ApiProperty({ type: Object })
  flow: Record<string, any>;

  @ApiPropertyOptional({ type: Boolean, deprecated: true })
  isPublished?: boolean;

  @ApiPropertyOptional({ type: () => Bot })
  bot?: Bot;

  @ApiProperty()
  createdAt: Date;

  @ApiPropertyOptional()
  updatedAt?: Date;
}

/**
 * BotKnowledgeBase domain entity - theo schema má»›i
 * Table: bot_knowledge_bases
 * Fields: bot_id, knowledge_base_id, priority, rag_settings, is_active, created_at
 */
export class BotKnowledgeBase {
  @ApiProperty({ type: String })
  botId: string;

  @ApiProperty({ type: String })
  knowledgeBaseId: string;

  @ApiProperty({ type: Number, default: 1 })
  priority: number;

  @ApiPropertyOptional({ type: Object })
  ragSettings?: Record<string, any> | null;

  @ApiProperty({ type: Boolean, default: true })
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;
}
