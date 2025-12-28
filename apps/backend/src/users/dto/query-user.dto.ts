import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
  IsBoolean,
  IsArray,
  IsEnum,
} from 'class-validator';
import { Transform, Type, plainToInstance } from 'class-transformer';
import { User } from '../domain/user';

export class FilterUserDto {
  @ApiPropertyOptional({
    type: [String],
    enum: ['admin', 'user'],
    description: 'Filter by roles',
  })
  @IsOptional()
  @IsArray()
  @IsEnum(['admin', 'user'], { each: true })
  roles?: ('admin' | 'user')[] | any[];

  @ApiPropertyOptional({
    type: Boolean,
    description: 'Filter by active status',
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ type: String, description: 'Search by email' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ type: String, description: 'Search by name' })
  @IsOptional()
  @IsString()
  name?: string;
}

export class SortUserDto {
  @ApiProperty({ description: 'Field to sort by' })
  @Type(() => String)
  @IsString()
  orderBy: keyof User;

  @ApiProperty({ enum: ['ASC', 'DESC'], description: 'Sort order' })
  @IsString()
  order: 'ASC' | 'DESC';
}

export class QueryUserDto {
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
    description: 'JSON string of FilterUserDto',
  })
  @IsOptional()
  @Transform(({ value }) =>
    value ? plainToInstance(FilterUserDto, JSON.parse(value)) : undefined,
  )
  @ValidateNested()
  @Type(() => FilterUserDto)
  filters?: FilterUserDto | null;

  @ApiPropertyOptional({
    type: String,
    description: 'JSON string of SortUserDto[]',
  })
  @IsOptional()
  @Transform(({ value }) =>
    value ? plainToInstance(SortUserDto, JSON.parse(value)) : undefined,
  )
  @ValidateNested({ each: true })
  @Type(() => SortUserDto)
  sort?: SortUserDto[] | null;
}
