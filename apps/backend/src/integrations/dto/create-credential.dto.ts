import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { Transform, Expose } from 'class-transformer';

export class CreateCredentialDto {
  @ApiProperty({ example: 'facebook' })
  @IsString()
  provider: string;

  @ApiProperty({ example: 'Production App', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    example: '1234567890',
    description: 'Client ID',
  })
  @Expose({ name: 'client_id' })
  @Transform(({ value, obj }) => value || obj.clientId || obj.client_id)
  @IsString()
  clientId: string;

  @ApiProperty({
    example: 'secret-key-here',
    description: 'Client Secret',
  })
  @Expose({ name: 'client_secret' })
  @Transform(({ value, obj }) => value || obj.clientSecret || obj.client_secret)
  @IsString()
  clientSecret: string;

  @ApiProperty({ example: 'email,public_profile', required: false })
  @IsOptional()
  @IsString()
  scopes?: string;

  @ApiProperty({ example: 'verify-token', required: false })
  @Expose({ name: 'verify_token' })
  @Transform(({ value, obj }) => value || obj.verifyToken || obj.verify_token)
  @IsOptional()
  @IsString()
  verifyToken?: string;

  @ApiProperty({ example: true, required: false })
  @Expose({ name: 'is_active' })
  @Transform(({ value, obj }) => value ?? obj.isActive ?? obj.is_active ?? true)
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ example: {}, required: false })
  @IsOptional()
  metadata?: Record<string, any>;
}
