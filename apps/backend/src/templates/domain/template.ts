import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CreationTool } from '../../creation-tools/domain/creation-tool';
import { Category } from '../../categories/domain/category';

export class Template {
  @ApiProperty({ type: String })
  id: string;

  // Link to parent Creation Tool
  @ApiPropertyOptional({
    type: String,
    description: 'Creation Tool ID this template belongs to',
  })
  creationToolId?: string | null;

  @ApiPropertyOptional({
    type: () => CreationTool,
    description: 'Creation Tool object',
  })
  creationTool?: CreationTool | null;

  @ApiProperty({ type: String, example: 'Professional Portrait' })
  name: string;

  @ApiPropertyOptional({ type: String, description: 'Template description' })
  description?: string | null;

  @ApiPropertyOptional({ type: () => Category })
  category?: Category | null;

  // NEW: Prefilled form data
  @ApiPropertyOptional({
    type: Object,
    description: 'Prefilled form data matching CreationTool.formConfig',
  })
  prefilledData?: Record<string, any> | null;

  // NEW: Template thumbnail
  @ApiPropertyOptional({
    type: String,
    description: 'Template preview image URL',
  })
  thumbnailUrl?: string | null;

  // NEW: Optional execution overrides
  @ApiPropertyOptional({
    type: Object,
    description: 'Optional overrides for execution parameters',
  })
  executionOverrides?: Record<string, any> | null;

  // OLD FIELDS (deprecated but kept for backward compatibility)
  @ApiPropertyOptional({
    type: String,
    description: 'DEPRECATED: Use prefilledData instead',
    deprecated: true,
  })
  prompt?: string | null;

  @ApiPropertyOptional({
    type: [String],
    description: 'DEPRECATED: Use prefilledData instead',
    deprecated: true,
  })
  mediaFiles?: string[] | null;

  @ApiPropertyOptional({
    type: Object,
    description: 'DEPRECATED: Use prefilledData instead',
    deprecated: true,
  })
  styleConfig?: Record<string, any> | null;

  @ApiPropertyOptional({
    type: String,
    description: 'DEPRECATED: Use prefilledData instead',
    deprecated: true,
  })
  promptTemplate?: string | null;

  @ApiPropertyOptional({
    type: Object,
    description: 'DEPRECATED: Use executionOverrides instead',
    deprecated: true,
  })
  executionConfig?: any | null;

  @ApiPropertyOptional({
    type: Object,
    description: 'DEPRECATED: Moved to CreationTool.formConfig',
    deprecated: true,
  })
  formSchema?: any | null;

  @ApiPropertyOptional({
    type: Array,
    description: 'DEPRECATED: Moved to CreationTool.formConfig',
    deprecated: true,
  })
  inputSchema?: any[] | null;

  // Metadata
  @ApiProperty({ type: Boolean, default: true })
  isActive: boolean;

  @ApiPropertyOptional({
    type: String,
    description: 'User ID who created the template',
  })
  createdBy?: string | null;

  @ApiPropertyOptional({ type: String, description: 'Workspace ID' })
  workspaceId?: string | null;

  @ApiPropertyOptional({ type: Number, default: 0 })
  sortOrder?: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional()
  deletedAt?: Date | null;
}
