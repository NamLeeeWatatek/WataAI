import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  IsArray,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateKnowledgeBaseDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  workspaceId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  icon?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  color?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  embeddingModel?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  aiProviderId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  ragModel?: string;

  @ApiPropertyOptional()
  @IsInt()
  @Min(100)
  @IsOptional()
  chunkSize?: number;

  @ApiPropertyOptional()
  @IsInt()
  @Min(0)
  @IsOptional()
  chunkOverlap?: number;

  @ApiPropertyOptional()
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
}

export class UpdateKnowledgeBaseDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  icon?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  color?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  embeddingModel?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  aiProviderId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  ragModel?: string;

  @ApiPropertyOptional()
  @IsInt()
  @Min(100)
  @IsOptional()
  chunkSize?: number;

  @ApiPropertyOptional()
  @IsInt()
  @Min(0)
  @IsOptional()
  chunkOverlap?: number;

  @ApiPropertyOptional()
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
}

export class AssignAgentDto {
  @ApiProperty()
  @IsString()
  agentId: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsInt()
  @Min(1)
  @IsOptional()
  priority?: number;

  @ApiPropertyOptional()
  @IsInt()
  @Min(1)
  @IsOptional()
  maxResults?: number;

  @ApiPropertyOptional()
  @IsOptional()
  similarityThreshold?: number;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  ragSettings?: Record<string, any>;
}

export class BatchDeleteDto {
  @ApiPropertyOptional()
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  folderIds?: string[];

  @ApiPropertyOptional()
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  documentIds?: string[];
}

export class BatchMoveDto {
  @ApiPropertyOptional()
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  folderIds?: string[];

  @ApiPropertyOptional()
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  documentIds?: string[];

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  targetFolderId?: string | null;
}
