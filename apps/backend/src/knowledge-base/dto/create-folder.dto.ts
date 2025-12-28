import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID, IsNumber } from 'class-validator';

export class CreateFolderDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID()
  knowledgeBaseId: string;

  @ApiProperty({ example: 'Getting Started' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Beginner guides and tutorials' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'FiFolder' })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({ example: '#10B981' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsOptional()
  @IsUUID()
  parentFolderId?: string;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsNumber()
  order?: number;
}
