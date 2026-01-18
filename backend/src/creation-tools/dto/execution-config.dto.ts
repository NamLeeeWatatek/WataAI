import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsObject,
  IsBoolean,
  IsNumber,
  ValidateNested,
  IsArray,
} from 'class-validator';
import { ExecutionType } from '../domain/creation-tool';

export class AiExecutionConfigDto {
  @ApiProperty({ enum: ExecutionType, example: ExecutionType.AI_GENERATION })
  @IsEnum(ExecutionType)
  type: ExecutionType.AI_GENERATION;

  @ApiProperty({ example: 'openai' })
  @IsString()
  @IsNotEmpty()
  provider: string;

  @ApiProperty({ example: 'gpt-4' })
  @IsString()
  @IsNotEmpty()
  model: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  parameters?: Record<string, any>;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  promptTemplate: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  includeTemplate?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  useTools?: boolean;
}

export class HttpExecutionConfigDto {
  @ApiProperty({ enum: ExecutionType, example: ExecutionType.HTTP_WEBHOOK })
  @IsEnum(ExecutionType)
  type: ExecutionType.HTTP_WEBHOOK;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  urlTemplate: string;

  @ApiProperty({ enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] })
  @IsString()
  @IsNotEmpty()
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  headers?: Record<string, string>;

  @ApiPropertyOptional()
  @IsOptional()
  bodyTemplate?: any;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  timeoutMs?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  retryCount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  successCondition?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  asyncPattern?: boolean;
}

export class WorkflowStepDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ type: Object })
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
  execution: AiExecutionConfigDto | HttpExecutionConfigDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  inputMapping?: Record<string, string>;
}

export class WorkflowExecutionConfigDto {
  @ApiProperty({ enum: ExecutionType, example: ExecutionType.WORKFLOW_CHAIN })
  @IsEnum(ExecutionType)
  type: ExecutionType.WORKFLOW_CHAIN;

  @ApiProperty({ type: [WorkflowStepDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkflowStepDto)
  steps: WorkflowStepDto[];
}
