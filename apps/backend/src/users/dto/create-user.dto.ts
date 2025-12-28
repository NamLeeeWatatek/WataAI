import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  MinLength,
  IsBoolean,
  IsEnum,
  IsString,
} from 'class-validator';
import { lowerCaseTransformer } from '../../utils/transformers/lower-case.transformer';
import { Role } from '../../roles/domain/role';

export class CreateUserDto {
  @ApiProperty({ example: 'test1@example.com', type: String })
  @Transform(lowerCaseTransformer)
  @IsNotEmpty()
  @IsEmail()
  email: string | null;

  @ApiProperty({ example: 'John Doe', type: String })
  @IsNotEmpty()
  @IsString()
  name: string | null;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })
  @IsOptional()
  @IsString()
  avatarUrl?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @MinLength(6)
  password?: string;

  @ApiPropertyOptional({ example: 'email' })
  @IsOptional()
  @IsString()
  provider?: string;

  @ApiPropertyOptional({ example: '1234567890' })
  @IsOptional()
  @IsString()
  providerId?: string | null;

  @ApiPropertyOptional({ type: Boolean, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ enum: ['admin', 'user'], default: 'user' })
  @IsOptional()
  role?: 'admin' | 'user' | Role | null;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  roleId?: number;

  @ApiPropertyOptional({ example: 'John', deprecated: true })
  @IsOptional()
  @IsString()
  firstName?: string | null;

  @ApiPropertyOptional({ example: 'Doe', deprecated: true })
  @IsOptional()
  @IsString()
  lastName?: string | null;

  @ApiPropertyOptional({ deprecated: true })
  @IsOptional()
  @IsString()
  socialId?: string | null;
}
