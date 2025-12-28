import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsNumber,
  ValidateNested,
} from 'class-validator';
import { Transform, Type, plainToInstance } from 'class-transformer';
import {
  BaseQueryDto,
  BaseFilterDto,
  BaseSortDto,
} from '../../utils/dto/base-query.dto';
import { KnowledgeBaseEntity } from '../infrastructure/persistence/relational/entities/knowledge-base.entity';

export class FilterKnowledgeBaseDto extends BaseFilterDto {
  @ApiPropertyOptional({
    type: String,
    description: 'Filter by workspace ID',
  })
  @IsOptional()
  @IsString()
  workspaceId?: string;
}

export class SortKnowledgeBaseDto extends BaseSortDto {
  @ApiPropertyOptional({ description: 'Field to sort by' })
  @IsString()
  orderBy: keyof KnowledgeBaseEntity;

  @ApiPropertyOptional({ enum: ['ASC', 'DESC'], description: 'Sort order' })
  @IsString()
  order: 'ASC' | 'DESC';
}

export class QueryKnowledgeBaseDto {
  @ApiPropertyOptional({ default: 1 })
  @Transform(({ value }) => (value ? Number(value) : 1))
  @IsNumber()
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ default: 10, maximum: 50 })
  @Transform(({ value }) => (value ? Number(value) : 10))
  @IsNumber()
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({
    type: String,
    description: 'JSON string of FilterKnowledgeBaseDto',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (!value) return undefined;
    if (typeof value === 'object')
      return plainToInstance(FilterKnowledgeBaseDto, value);
    try {
      return plainToInstance(FilterKnowledgeBaseDto, JSON.parse(value));
    } catch (e) {
      return undefined;
    }
  })
  @ValidateNested()
  @Type(() => FilterKnowledgeBaseDto)
  filters?: FilterKnowledgeBaseDto | null;

  @ApiPropertyOptional({
    type: String,
    description: 'JSON string of SortKnowledgeBaseDto[]',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (!value) return undefined;
    if (typeof value === 'object')
      return plainToInstance(SortKnowledgeBaseDto, value);
    try {
      return plainToInstance(SortKnowledgeBaseDto, JSON.parse(value));
    } catch (e) {
      return undefined;
    }
  })
  @ValidateNested({ each: true })
  @Type(() => SortKnowledgeBaseDto)
  sort?: SortKnowledgeBaseDto[] | null;
}
