import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Category } from '../../categories/domain/category';

/**
 * Form field configuration interface for dynamic forms
 */
export interface FormField {
  name: string;
  type:
  | 'text'
  | 'textarea'
  | 'string'
  | 'select'
  | 'radio'
  | 'checkbox'
  | 'boolean'
  | 'number'
  | 'file'
  | 'files'
  | 'slider'
  | 'color'
  | 'json'
  | 'key-value'
  | 'channel-select'
  | 'channel-selector'
  | 'multi-select';
  label: string;
  placeholder?: string;
  description?: string;
  defaultValue?: any;

  // For select/radio/checkbox options
  options?: Array<{
    label: string;
    value: any;
    icon?: string;
  }>;

  // Validation rules
  validation?: {
    required?: boolean;
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    customMessage?: string;
  };

  // Conditional rendering
  showIf?: {
    field: string;
    operator: 'equals' | 'not-equals' | 'contains';
    value: any;
  };
}

/**
 * Form configuration interface
 */
export interface FormConfig {
  fields: FormField[];
  layout?: 'single-column' | 'two-column' | 'wizard';
  submitLabel?: string;
}

export enum ExecutionType {
  AI_GENERATION = 'ai-generation',
  HTTP_WEBHOOK = 'http-webhook',
  WORKFLOW_CHAIN = 'workflow-chain',
}

/**
 * AI Execution Configuration
 */
export interface AiExecutionConfig {
  type: ExecutionType.AI_GENERATION;
  provider: 'openai' | 'anthropic' | 'gemini';
  model: string;
  parameters?: Record<string, any>;
  promptTemplate: string; // e.g. "Write a story about {{topic}}"
  includeTemplate?: boolean;
  useTools?: boolean;
}

/**
 * HTTP Webhook Execution Configuration (Enterprise Standard)
 */
export interface HttpExecutionConfig {
  type: ExecutionType.HTTP_WEBHOOK;
  urlTemplate: string; // e.g., "https://api.crm.com/leads/{{userId}}"
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;

  // Supports complex JSON structures with liquidjs-style injection
  bodyTemplate?: Record<string, any> | string;

  // Resiliency Settings
  timeoutMs?: number; // Default 5000
  retryCount?: number; // Default 3

  // Validation
  successCondition?: string;

  /**
   * If true, the system will NOT wait for the response to mark the job as completed.
   * Instead, it will keep the job in PROCESSING state.
   * The external tool is expected to call back the system to complete the job.
   */
  asyncPattern?: boolean;
}

export type ExecutionFlow = AiExecutionConfig | HttpExecutionConfig;
/**
 * CreationTool domain entity
 * Main entity that defines a creation tool with dynamic forms and execution logic
 */
export class CreationTool {
  @ApiProperty({ type: String })
  id: string;

  @ApiProperty({ type: String, example: 'Create Image' })
  name: string;

  @ApiProperty({ type: String, example: 'create-image' })
  slug: string;

  @ApiPropertyOptional({ type: String })
  description?: string;

  @ApiPropertyOptional({ type: String })
  icon?: string;

  @ApiPropertyOptional({ type: String })
  coverImage?: string;

  @ApiPropertyOptional({ type: () => [Category] })
  categories?: Category[];

  @ApiProperty({ type: Object, description: 'Dynamic form configuration' })
  formConfig: FormConfig;

  @ApiProperty({
    type: Object,
    description: 'Execution workflow configuration',
  })
  executionFlow: ExecutionFlow;

  @ApiProperty({ type: Boolean, default: true })
  isActive: boolean;

  @ApiPropertyOptional({ type: String })
  workspaceId?: string;

  @ApiProperty({ type: Number, default: 0 })
  sortOrder: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional()
  deletedAt?: Date;
}
