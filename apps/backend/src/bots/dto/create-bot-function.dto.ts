import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsBoolean,
  IsOptional,
  IsObject,
  IsEnum,
} from 'class-validator';

export enum BotFunctionType {
  DOCUMENT_ACCESS = 'document_access',
  AUTO_FILL = 'auto_fill',
  AI_SUGGEST = 'ai_suggest',
  CUSTOM = 'custom',
}

export class CreateBotFunctionDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsNotEmpty()
  @IsString()
  botId: string;

  @ApiProperty({ enum: BotFunctionType, example: BotFunctionType.AI_SUGGEST })
  @IsNotEmpty()
  @IsEnum(BotFunctionType)
  functionType: BotFunctionType;

  @ApiProperty({ example: 'AI Suggestion for Form Fields' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({
    example: 'Automatically suggests values for form fields',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;

  @ApiPropertyOptional({
    example: {
      targetFields: ['email', 'phone'],
      confidence: 0.8,
    },
  })
  @IsOptional()
  @IsObject()
  config?: Record<string, any>;

  @ApiPropertyOptional({
    example: {
      type: 'object',
      properties: {
        field: { type: 'string' },
        context: { type: 'string' },
      },
    },
  })
  @IsOptional()
  @IsObject()
  inputSchema?: Record<string, any>;

  @ApiPropertyOptional({
    example: {
      type: 'object',
      properties: {
        suggestion: { type: 'string' },
        confidence: { type: 'number' },
      },
    },
  })
  @IsOptional()
  @IsObject()
  outputSchema?: Record<string, any>;
}
