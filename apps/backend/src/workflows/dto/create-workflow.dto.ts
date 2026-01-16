import {
  IsBoolean,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateWorkflowDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  thumbnailUrl?: string;

  @ApiProperty()
  @IsObject()
  @IsOptional()
  graph?: any;

  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;

  @ApiProperty()
  @IsString()
  @IsOptional()
  category?: string;
}
