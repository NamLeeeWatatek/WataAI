import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsObject } from 'class-validator';

export class CreateStylePresetDto {
  @ApiProperty({ example: 'Cinematic Dream' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Vibrant colors and dramatic lighting' })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiProperty({
    type: Object,
    example: { contrast: 1.2, saturation: 1.1, lighting: 'volumetric' },
  })
  @IsNotEmpty()
  @IsObject()
  config: Record<string, any>;

  @ApiPropertyOptional({ example: 'workspace-id-123' })
  @IsOptional()
  @IsString()
  workspaceId?: string | null;
}
