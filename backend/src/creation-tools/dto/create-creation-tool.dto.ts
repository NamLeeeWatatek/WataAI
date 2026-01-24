import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsBoolean,
  IsNumber,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { FormConfigDto, TriggerActionDto } from './form-config.dto';
import {
  AiExecutionConfigDto,
  HttpExecutionConfigDto,
  WorkflowExecutionConfigDto,
} from './execution-config.dto';
import { ExecutionType } from '../domain/creation-tool';

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

  @ApiPropertyOptional({ example: ['uuid-of-category'], type: [String] })
  @IsOptional()
  @IsString({ each: true })
  categoryIds?: string[];

  @ApiProperty({
    type: FormConfigDto,
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
  @ValidateNested()
  @Type(() => FormConfigDto)
  formConfig: FormConfigDto;

  @ApiPropertyOptional({ type: [TriggerActionDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TriggerActionDto)
  actions?: TriggerActionDto[];

  @ApiPropertyOptional({
    type: Object,
    description:
      'Global execution flow configuration (optional - can use step-level execution instead)',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => Object, {
    keepDiscriminatorProperty: true,
    discriminator: {
      property: 'type',
      subTypes: [
        { value: AiExecutionConfigDto, name: ExecutionType.AI_GENERATION },
        { value: HttpExecutionConfigDto, name: ExecutionType.HTTP_WEBHOOK },
        {
          value: WorkflowExecutionConfigDto,
          name: ExecutionType.WORKFLOW_CHAIN,
        },
      ],
    },
  })
  executionFlow:
    | AiExecutionConfigDto
    | HttpExecutionConfigDto
    | WorkflowExecutionConfigDto;

  @ApiPropertyOptional({ type: Boolean, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: 'workspace-id-123' })
  @IsOptional()
  @IsString()
  workspaceId?: string;

  @ApiPropertyOptional({ example: 'kb-uuid-123' })
  @IsOptional()
  @IsString()
  knowledgeBaseId?: string;

  @ApiPropertyOptional({ type: Number, default: 0 })
  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}
