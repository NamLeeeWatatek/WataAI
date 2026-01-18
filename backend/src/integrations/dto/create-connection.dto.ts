import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class CreateConnectionDto {
  @ApiProperty({ example: 'My Facebook Page' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'facebook' })
  @IsString()
  type: string;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsOptional()
  @IsString()
  credentialId?: string;

  @ApiProperty({ example: 'EAABwz...', required: false })
  @IsOptional()
  @IsString()
  accessToken?: string;

  @ApiProperty({ example: 'refresh-token', required: false })
  @IsOptional()
  @IsString()
  refreshToken?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  metadata?: Record<string, any>;
}
