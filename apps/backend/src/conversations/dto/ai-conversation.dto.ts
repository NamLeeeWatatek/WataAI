import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsUUID,
  IsArray,
} from 'class-validator';

export class CreateAiConversationDto {
  @ApiProperty({ example: 'My Chat with AI' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsOptional()
  @IsUUID()
  botId?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  useKnowledgeBase?: boolean;

  @ApiPropertyOptional({
    example: {
      knowledgeBaseIds: ['kb-id-1', 'kb-id-2'],
    },
  })
  @IsOptional()
  metadata?: Record<string, any>;
}

export class UpdateAiConversationDto {
  @ApiPropertyOptional({ example: 'Updated Chat Title' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsOptional()
  @IsUUID()
  botId?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  useKnowledgeBase?: boolean;

  @ApiPropertyOptional({
    example: {
      knowledgeBaseIds: ['kb-id-1', 'kb-id-2'],
    },
  })
  @IsOptional()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({
    example: [
      {
        role: 'user',
        content: 'Hello',
        timestamp: '2024-01-01T00:00:00.000Z',
      },
    ],
  })
  @IsOptional()
  @IsArray()
  messages?: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: string;
    metadata?: any;
  }>;
}
