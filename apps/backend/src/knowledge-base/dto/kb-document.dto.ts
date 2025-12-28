import { IsString, IsOptional, IsUUID, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDocumentDto {
  @ApiProperty()
  @IsUUID()
  knowledgeBaseId: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  workspaceId?: string;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  content: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  folderId?: string | null;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  fileType?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  mimeType?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  fileUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  metadata?: Record<string, any>;

  @ApiPropertyOptional()
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
}

export class UpdateDocumentDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  content?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  folderId?: string | null;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  workspaceId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  metadata?: Record<string, any>;

  @ApiPropertyOptional()
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
}

export class QueryKnowledgeBaseDto {
  @ApiProperty()
  @IsString()
  query: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  knowledgeBaseId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  similarityThreshold?: number;
}

export class GenerateAnswerDto {
  @ApiProperty()
  @IsString()
  question: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  knowledgeBaseId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  model?: string;

  @ApiPropertyOptional({
    description: 'Number of chunks to retrieve',
    default: 5,
  })
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({
    description: 'Similarity threshold (0-1)',
    default: 0.5,
  })
  @IsOptional()
  similarityThreshold?: number;
}

export class CrawlWebsiteDto {
  @ApiProperty({ description: 'Starting URL to crawl' })
  @IsString()
  url: string;

  @ApiProperty()
  @IsUUID()
  knowledgeBaseId: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  folderId?: string | null;

  @ApiPropertyOptional({ description: 'Maximum pages to crawl', default: 50 })
  @IsOptional()
  maxPages?: number;

  @ApiPropertyOptional({
    description: 'Maximum depth to follow links',
    default: 3,
  })
  @IsOptional()
  maxDepth?: number;

  @ApiPropertyOptional({
    description: 'Follow links to other pages',
    default: true,
  })
  @IsOptional()
  followLinks?: boolean;

  @ApiPropertyOptional({ description: 'URL patterns to include' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  includePatterns?: string[];

  @ApiPropertyOptional({ description: 'URL patterns to exclude' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  excludePatterns?: string[];
}
