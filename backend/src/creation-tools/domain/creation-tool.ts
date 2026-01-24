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
    | 'multi-select'
    | 'template-selector'
    | 'page-selector'
    | 'result-preview'
    | 'canvas-editor';
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

  // Configuration for complex field types (e.g., canvas-editor)
  config?: Record<string, any>;

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

  // NEW: Flag to use this field in Post Generation Dialog
  useForPostGen?: boolean;

  // Conditional rendering
  showIf?: {
    field: string;
    operator: 'equals' | 'not-equals' | 'contains';
    value: any;
  };
}

/**
 * Step-level execution configuration
 */
export interface StepExecutionConfig {
  type: ExecutionType.AI_GENERATION | ExecutionType.HTTP_WEBHOOK;

  // When to trigger execution
  trigger: 'immediate' | 'onApproval' | 'manual';

  // Input data sources
  inputSources?: {
    fromSteps?: string[]; // IDs of previous steps to combine data from
    fromFields?: string[]; // Specific field names to include
  };

  // The actual execution configuration
  config: AiExecutionConfig | HttpExecutionConfig;
}

/**
 * Form Step with optional execution
 */
export interface FormStep {
  id: string;
  title: string;
  description?: string;
  layout: {
    rows: Array<{
      id: string;
      zones: Array<{
        id: string;
        title: string;
        width?: string;
        fieldRows: Array<{
          id: string;
          fields: string[];
        }>;
      }>;
    }>;
  };

  // NEW: Optional execution config per step
  execution?: StepExecutionConfig;

  // Whether to pause for user approval after this step
  requiresApproval?: boolean;
}

/**
 * Form configuration interface
 */
export interface FormConfig {
  fields: FormField[];
  steps: FormStep[];
  layout?: string; // e.g. 'wizard'
  submitLabel?: string;
}

export enum ExecutionType {
  AI_GENERATION = 'ai-generation',
  HTTP_WEBHOOK = 'http-webhook',
  WORKFLOW_CHAIN = 'workflow-chain',
}

export interface BaseExecutionConfig {
  type: ExecutionType;
}

/**
 * AI Execution Configuration
 */
export interface AiExecutionConfig {
  type: ExecutionType.AI_GENERATION;
  provider: string;
  aiConfigId?: string;
  model: string;
  parameters?: Record<string, any>;
  promptTemplate: string; // e.g. "Write a story about {{topic}}"
  includeTemplate?: boolean;
  knowledgeBaseId?: string;
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

export interface WorkflowExecutionConfig extends BaseExecutionConfig {
  type: ExecutionType.WORKFLOW_CHAIN;
  steps: Array<{
    id: string;
    title: string;
    execution: AiExecutionConfig | HttpExecutionConfig;
    inputMapping?: Record<string, string>; // Map previous step results to next step inputs
  }>;
}

export type ExecutionFlow =
  | AiExecutionConfig
  | HttpExecutionConfig
  | WorkflowExecutionConfig;
/**
 * Trigger Action - Manual actions available for a product/result
 */
export interface TriggerAction {
  id: string;
  name: string;
  description?: string;
  icon?: string;

  // Optional: Specific fields required only for this manual action (e.g., "Post Caption")
  formConfig?: {
    fields: FormField[];
  };

  // The actual execution logic for this action
  execution: StepExecutionConfig;
}

/**
 * CreationTool domain entity
 * Main entity that defines a creation tool with dynamic forms, execution steps, and manual actions
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

  @ApiPropertyOptional({
    type: [Object],
    description: 'Manual actions available for results of this tool',
  })
  actions?: TriggerAction[];

  @ApiPropertyOptional({
    type: Object,
    description:
      'Global execution workflow configuration (optional - can use step-level execution instead)',
  })
  executionFlow?: ExecutionFlow;

  @ApiProperty({ type: Boolean, default: true })
  isActive: boolean;

  @ApiPropertyOptional({ type: String })
  workspaceId?: string;

  @ApiPropertyOptional({ type: String })
  knowledgeBaseId?: string;

  @ApiProperty({ type: Number, default: 0 })
  sortOrder: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional()
  deletedAt?: Date;
}
