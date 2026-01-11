import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsObject,
  IsUUID,
} from 'class-validator';

export class CreateBotChannelDto {
  @ApiProperty({ example: 'facebook' })
  @IsNotEmpty()
  @IsString()
  type: string;

  @ApiProperty({ example: 'My Facebook Page' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  config?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Connection ID', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  connectionId?: string;
}

export class UpdateBotChannelDto {
  @ApiPropertyOptional({ example: 'My Facebook Page' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  config?: Record<string, any>;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Connection ID', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  connectionId?: string;
}
