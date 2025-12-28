import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsObject,
  IsBoolean,
  IsNumber,
} from 'class-validator';

export class CreateCreationToolDto {
  @ApiProperty({ example: 'Create Image', type: String })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'create-image', type: String })
  @IsNotEmpty()
  @IsString()
  slug: string;

  @ApiPropertyOptional({
    example: 'Generate stunning AI images from text descriptions',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'ImageIcon' })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({ example: 'https://example.com/cover.jpg' })
  @IsOptional()
  @IsString()
  coverImage?: string;

  @ApiPropertyOptional({ example: 'uuid-of-category' })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiProperty({
    type: Object,
    example: {
      fields: [
        {
          name: 'prompt',
          type: 'textarea',
          label: 'Prompt',
          placeholder: 'Describe your image...',
          validation: { required: true },
        },
      ],
      submitLabel: 'Generate Image',
    },
  })
  @IsNotEmpty()
  @IsObject()
  formConfig: any;

  @ApiProperty({
    type: Object,
    example: {
      type: 'ai-generation',
      provider: 'replicate',
      model: 'stability-ai/sdxl',
      outputType: 'image',
    },
  })
  @IsNotEmpty()
  @IsObject()
  executionFlow: any;

  @ApiPropertyOptional({ type: Boolean, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: 'workspace-id-123' })
  @IsOptional()
  @IsString()
  workspaceId?: string;

  @ApiPropertyOptional({ type: Number, default: 0 })
  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}
