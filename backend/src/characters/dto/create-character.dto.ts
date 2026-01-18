import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsObject } from 'class-validator';

export class CreateCharacterDto {
  @ApiProperty({ example: 'Luna' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'A friendly AI companion' })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any> | null;

  @ApiPropertyOptional({ example: 'workspace-id-123' })
  @IsOptional()
  @IsString()
  workspaceId?: string | null;
}
