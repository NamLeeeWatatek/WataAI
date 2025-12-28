import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Transform, Type, plainToInstance } from 'class-transformer';
import {
  BaseQueryDto,
  BaseFilterDto,
  BaseSortDto,
} from '../../utils/dto/base-query.dto';
import { Bot } from '../domain/bot';

export class FilterBotDto extends BaseFilterDto {
  @ApiPropertyOptional({
    type: String,
    enum: ['draft', 'active', 'paused', 'archived'],
    description: 'Filter by status',
  })
  @IsOptional()
  @IsEnum(['draft', 'active', 'paused', 'archived'])
  status?: 'draft' | 'active' | 'paused' | 'archived';

  @ApiPropertyOptional({
    type: String,
    description: 'Filter by workspace ID',
  })
  @IsOptional()
  @IsString()
  workspaceId?: string;

  @ApiPropertyOptional({
    type: Boolean,
    description: 'Filter by active status',
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class SortBotDto extends BaseSortDto {
  @ApiPropertyOptional({ description: 'Field to sort by' })
  orderBy: keyof Bot;

  @ApiPropertyOptional({ enum: ['ASC', 'DESC'], description: 'Sort order' })
  order: 'ASC' | 'DESC';
}

export class QueryBotDto {
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
    description: 'JSON string of FilterBotDto',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (!value) return undefined;
    if (typeof value === 'object') return plainToInstance(FilterBotDto, value);
    try {
      return plainToInstance(FilterBotDto, JSON.parse(value));
    } catch (e) {
      return undefined;
    }
  })
  @ValidateNested()
  @Type(() => FilterBotDto)
  filters?: FilterBotDto | null;

  @ApiPropertyOptional({
    type: String,
    description: 'JSON string of SortBotDto[]',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (!value) return undefined;
    if (typeof value === 'object') return plainToInstance(SortBotDto, value);
    try {
      return plainToInstance(SortBotDto, JSON.parse(value));
    } catch (e) {
      return undefined;
    }
  })
  @ValidateNested({ each: true })
  @Type(() => SortBotDto)
  sort?: SortBotDto[] | null;
}
