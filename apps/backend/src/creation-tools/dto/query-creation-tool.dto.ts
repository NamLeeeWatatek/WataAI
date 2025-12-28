import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
  IsBoolean,
} from 'class-validator';
import { Transform, Type, plainToInstance } from 'class-transformer';
import { CreationTool } from '../domain/creation-tool';

export class FilterCreationToolDto {
  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  workspaceId?: string;
}

export class SortCreationToolDto {
  @ApiPropertyOptional()
  @Type(() => String)
  @IsString()
  orderBy: keyof CreationTool;

  @ApiPropertyOptional({ enum: ['ASC', 'DESC'] })
  @IsString()
  order: 'ASC' | 'DESC';
}

export class QueryCreationToolDto {
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

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @Transform(({ value }) =>
    value
      ? plainToInstance(FilterCreationToolDto, JSON.parse(value))
      : undefined,
  )
  @ValidateNested()
  @Type(() => FilterCreationToolDto)
  filters?: FilterCreationToolDto | null;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @Transform(({ value }) =>
    value ? plainToInstance(SortCreationToolDto, JSON.parse(value)) : undefined,
  )
  @ValidateNested({ each: true })
  @Type(() => SortCreationToolDto)
  sort?: SortCreationToolDto[] | null;
}
