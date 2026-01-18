import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
  IsBoolean,
  IsArray,
} from 'class-validator';
import { Transform, Type, plainToInstance } from 'class-transformer';
import { Template } from '../domain/template';

export class FilterTemplateDto {
  @ApiPropertyOptional({
    type: Boolean,
    description: 'Filter by active status',
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ type: String, description: 'Search by name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ type: String, description: 'Filter by category' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ type: String, description: 'Filter by workspace ID' })
  @IsOptional()
  @IsString()
  workspaceId?: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Filter by creator user ID',
  })
  @IsOptional()
  @IsString()
  createdBy?: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Filter by creation tool ID',
  })
  @IsOptional()
  @IsString()
  creationToolId?: string;
}

export class SortTemplateDto {
  @ApiProperty({ description: 'Field to sort by' })
  @Type(() => String)
  @IsString()
  orderBy: keyof Template;

  @ApiProperty({ enum: ['ASC', 'DESC'], description: 'Sort order' })
  @IsString()
  order: 'ASC' | 'DESC';
}

export class QueryTemplateDto {
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
    description: 'JSON string of FilterTemplateDto',
  })
  @IsOptional()
  @Transform(({ value }) =>
    value ? plainToInstance(FilterTemplateDto, JSON.parse(value)) : undefined,
  )
  @ValidateNested()
  @Type(() => FilterTemplateDto)
  filters?: FilterTemplateDto | null;

  @ApiPropertyOptional({
    type: String,
    description: 'JSON string of SortTemplateDto[]',
  })
  @IsOptional()
  @Transform(({ value }) =>
    value ? plainToInstance(SortTemplateDto, JSON.parse(value)) : undefined,
  )
  @ValidateNested({ each: true })
  @Type(() => SortTemplateDto)
  sort?: SortTemplateDto[] | null;
}
