import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsArray,
  IsObject,
  IsBoolean,
} from 'class-validator';

export class CreateTemplateDto {
  @ApiPropertyOptional({ example: 'creation-tool-id-123', type: String })
  @IsOptional()
  @IsString()
  creationToolId?: string | null;

  @ApiProperty({ example: 'Professional Portrait', type: String })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Template for professional portraits' })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiPropertyOptional({ example: 'uuid-of-category' })
  @IsOptional()
  @IsString()
  categoryId?: string | null;

  @ApiPropertyOptional({
    type: Object,
    example: { prompt: 'Professional headshot', style: 'realistic' },
  })
  @IsOptional()
  @IsObject()
  prefilledData?: Record<string, any> | null;

  @ApiPropertyOptional({ example: 'https://example.com/thumbnail.jpg' })
  @IsOptional()
  @IsString()
  thumbnailUrl?: string | null;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  executionOverrides?: Record<string, any> | null;

  @ApiPropertyOptional({ type: Boolean, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: 'workspace-id-123' })
  @IsOptional()
  @IsString()
  workspaceId?: string | null;

  @ApiPropertyOptional({ type: Number, default: 0 })
  @IsOptional()
  sortOrder?: number;

  // DEPRECATED fields (kept for backward compatibility)
  @ApiPropertyOptional({ deprecated: true })
  @IsOptional()
  @IsString()
  prompt?: string | null;

  @ApiPropertyOptional({ type: [String], deprecated: true })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  mediaFiles?: string[] | null;

  @ApiPropertyOptional({ type: Object, deprecated: true })
  @IsOptional()
  @IsObject()
  styleConfig?: Record<string, any> | null;

  @ApiPropertyOptional({ deprecated: true })
  @IsOptional()
  @IsString()
  promptTemplate?: string | null;

  @ApiPropertyOptional({ type: Object, deprecated: true })
  @IsOptional()
  @IsObject()
  executionConfig?: any | null;

  @ApiPropertyOptional({ type: Object, deprecated: true })
  @IsOptional()
  @IsObject()
  formSchema?: any | null;

  @ApiPropertyOptional({ type: Array, deprecated: true })
  @IsOptional()
  @IsArray()
  inputSchema?: any[] | null;
}
