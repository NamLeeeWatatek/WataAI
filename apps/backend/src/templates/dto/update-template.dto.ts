import { PartialType, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateTemplateDto } from './create-template.dto';
import {
  IsOptional,
  IsString,
  IsArray,
  IsObject,
  IsBoolean,
  IsNumber,
} from 'class-validator';

export class UpdateTemplateDto extends PartialType(CreateTemplateDto) {
  @ApiPropertyOptional({
    example: 'a2cb7239-91ce-4fb2-b03d-3fe4acc57bd2',
    type: String,
    description: 'Creation Tool ID this template belongs to',
  })
  @IsOptional()
  @IsString()
  creationToolId?: string | null;

  @ApiPropertyOptional({
    example: 'Professional Portrait Template',
    type: String,
    description: 'Template name (3-100 characters)',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    example: 'A professional portrait template with optimal lighting',
    description: 'Template description',
  })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiPropertyOptional({
    example: 'portrait',
    description: 'Template category',
  })
  @IsOptional()
  @IsString()
  category?: string | null;

  @ApiPropertyOptional({
    type: Object,
    example: {
      prompt: 'Professional headshot',
      style: 'realistic',
      quality: 'high',
    },
    description: 'Prefilled form data matching CreationTool.formConfig',
  })
  @IsOptional()
  @IsObject()
  prefilledData?: Record<string, any> | null;

  @ApiPropertyOptional({
    example: 'https://cdn.example.com/thumbnails/portrait.jpg',
    description: 'Template preview thumbnail URL',
  })
  @IsOptional()
  @IsString()
  thumbnailUrl?: string | null;

  @ApiPropertyOptional({
    type: Object,
    description: 'Optional execution parameter overrides',
  })
  @IsOptional()
  @IsObject()
  executionOverrides?: Record<string, any> | null;

  @ApiPropertyOptional({
    type: Boolean,
    description: 'Whether the template is active and visible',
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    example: 'workspace-id-456',
    description: 'Workspace ID',
  })
  @IsOptional()
  @IsString()
  workspaceId?: string | null;

  @ApiPropertyOptional({
    type: Number,
    example: 10,
    description: 'Sort order for display',
  })
  @IsOptional()
  @IsNumber()
  sortOrder?: number;

  // DEPRECATED fields (kept for backward compatibility)
  @ApiPropertyOptional({
    example: 'Create a professional portrait...',
    deprecated: true,
    description: 'DEPRECATED: Use prefilledData instead',
  })
  @IsOptional()
  @IsString()
  prompt?: string | null;

  @ApiPropertyOptional({
    type: [String],
    example: ['file-id-1', 'file-id-2'],
    deprecated: true,
    description: 'DEPRECATED: Use prefilledData instead',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  mediaFiles?: string[] | null;

  @ApiPropertyOptional({
    type: Object,
    example: { style: 'realistic', lighting: 'soft' },
    deprecated: true,
    description: 'DEPRECATED: Use prefilledData instead',
  })
  @IsOptional()
  @IsObject()
  styleConfig?: Record<string, any> | null;

  @ApiPropertyOptional({
    example: 'Create a {style} portrait of {subject}',
    deprecated: true,
    description: 'DEPRECATED: Use prefilledData instead',
  })
  @IsOptional()
  @IsString()
  promptTemplate?: string | null;

  @ApiPropertyOptional({
    type: Object,
    deprecated: true,
    description: 'DEPRECATED: Use executionOverrides instead',
  })
  @IsOptional()
  @IsObject()
  executionConfig?: any | null;

  @ApiPropertyOptional({
    type: Object,
    deprecated: true,
    description: 'DEPRECATED: Moved to CreationTool.formConfig',
  })
  @IsOptional()
  @IsObject()
  formSchema?: any | null;

  @ApiPropertyOptional({
    type: Array,
    deprecated: true,
    description: 'DEPRECATED: Moved to CreationTool.formConfig',
  })
  @IsOptional()
  @IsArray()
  inputSchema?: any[] | null;
}
