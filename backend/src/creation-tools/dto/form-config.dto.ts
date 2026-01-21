import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
  IsIn,
} from 'class-validator';
import { ExecutionType } from '../domain/creation-tool';
import {
  AiExecutionConfigDto,
  HttpExecutionConfigDto,
} from './execution-config.dto';

export class ValidationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  required?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  min?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  max?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  minLength?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  maxLength?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  pattern?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  customMessage?: string;
}

export const FORM_FIELD_TYPES = [
  'text',
  'textarea',
  'string',
  'select',
  'radio',
  'checkbox',
  'boolean',
  'number',
  'file',
  'files',
  'slider',
  'color',
  'json',
  'key-value',
  'channel-select',
  'channel-selector',
  'multi-select',
  'template-selector',
  'page-selector',
  'result-preview',
  'canvas-editor',
] as const;

export type FormFieldType = (typeof FORM_FIELD_TYPES)[number];

export class FormFieldDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ enum: FORM_FIELD_TYPES })
  @IsString()
  @IsNotEmpty()
  @IsIn(FORM_FIELD_TYPES)
  type: FormFieldType;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  label: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  placeholder?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  defaultValue?: any;

  @ApiPropertyOptional()
  @IsOptional()
  options?: any;

  @ApiPropertyOptional({ type: ValidationDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ValidationDto)
  validation?: ValidationDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  showIf?: {
    field: string;
    operator: 'equals' | 'not-equals' | 'contains';
    value: any;
  };

  @ApiPropertyOptional({
    description: 'Configuration for complex field types like canvas-editor',
  })
  @IsOptional()
  @IsObject()
  config?: Record<string, any>;
}

// --- New Layout Structure ---

export class FieldRowDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  fields: string[];
}

export class ZoneConfigDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  width?: string;

  @ApiProperty({ type: [FieldRowDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FieldRowDto)
  fieldRows: FieldRowDto[];
}

export class LayoutRowDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({ type: [ZoneConfigDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ZoneConfigDto)
  zones: ZoneConfigDto[];
}

export class StepLayoutDto {
  @ApiProperty({ type: [LayoutRowDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LayoutRowDto)
  rows: LayoutRowDto[];
}

export class StepExecutionConfigDto {
  @ApiProperty({
    enum: [ExecutionType.AI_GENERATION, ExecutionType.HTTP_WEBHOOK],
    description: 'Execution type for this step',
  })
  @IsEnum(ExecutionType)
  @IsIn([ExecutionType.AI_GENERATION, ExecutionType.HTTP_WEBHOOK])
  type: ExecutionType.AI_GENERATION | ExecutionType.HTTP_WEBHOOK;

  @ApiProperty({
    enum: ['immediate', 'onApproval', 'manual'],
    description: 'When to trigger execution',
  })
  @IsString()
  @IsIn(['immediate', 'onApproval', 'manual'])
  trigger: 'immediate' | 'onApproval' | 'manual';

  @ApiPropertyOptional({
    description: 'Input data sources configuration',
  })
  @IsOptional()
  @IsObject()
  inputSources?: {
    fromSteps?: string[];
    fromFields?: string[];
  };

  @ApiProperty({
    type: Object,
    description: 'Execution configuration (AI or HTTP)',
  })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => Object, {
    keepDiscriminatorProperty: true,
    discriminator: {
      property: 'type',
      subTypes: [
        { value: AiExecutionConfigDto, name: ExecutionType.AI_GENERATION },
        { value: HttpExecutionConfigDto, name: ExecutionType.HTTP_WEBHOOK },
      ],
    },
  })
  config: AiExecutionConfigDto | HttpExecutionConfigDto;
}

export class FormStepDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ type: StepLayoutDto })
  @ValidateNested()
  @Type(() => StepLayoutDto)
  layout: StepLayoutDto;

  @ApiPropertyOptional({
    type: StepExecutionConfigDto,
    description: 'Optional execution config for this step',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => StepExecutionConfigDto)
  execution?: StepExecutionConfigDto;

  @ApiPropertyOptional({
    description: 'Whether to pause for user approval after this step',
  })
  @IsOptional()
  @IsBoolean()
  requiresApproval?: boolean;
}

export class FormConfigDto {
  @ApiProperty({ type: [FormFieldDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FormFieldDto)
  fields: FormFieldDto[];

  @ApiProperty({ type: [FormStepDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FormStepDto)
  steps: FormStepDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  submitLabel?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  layout?: string; // Legacy support or global layout type hint
}
