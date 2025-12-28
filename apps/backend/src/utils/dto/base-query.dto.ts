import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Transform, Type, plainToInstance } from 'class-transformer';
import { SortOrder } from '../types/sort-order.type';

export class BaseFilterDto {
  @ApiPropertyOptional({ type: String, description: 'Search term' })
  @IsOptional()
  @IsString()
  search?: string;
}

export class BaseSortDto {
  @ApiPropertyOptional({ description: 'Field to sort by' })
  @Type(() => String)
  @IsString()
  orderBy: string;

  @ApiPropertyOptional({ enum: ['ASC', 'DESC'], description: 'Sort order' })
  @IsString()
  order: SortOrder;
}

export class BaseQueryDto {
  @ApiPropertyOptional({ default: 1, description: 'Page number' })
  @Transform(({ value }) => (value ? Number(value) : 1))
  @IsNumber()
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({
    default: 10,
    maximum: 50,
    description: 'Items per page',
  })
  @Transform(({ value }) => (value ? Number(value) : 10))
  @IsNumber()
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({
    type: String,
    description: 'JSON string of filter options',
  })
  @IsOptional()
  @Transform(({ value }) =>
    value ? plainToInstance(BaseFilterDto, JSON.parse(value)) : undefined,
  )
  @ValidateNested()
  @Type(() => BaseFilterDto)
  filters?: BaseFilterDto | null;

  @ApiPropertyOptional({
    type: String,
    description: 'JSON string of sort options',
  })
  @IsOptional()
  @Transform(({ value }) =>
    value ? plainToInstance(BaseSortDto, JSON.parse(value)) : undefined,
  )
  @ValidateNested({ each: true })
  @Type(() => BaseSortDto)
  sort?: BaseSortDto[] | null;
}
