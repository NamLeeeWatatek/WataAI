import { PartialType, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsOptional,
  MinLength,
  IsBoolean,
  IsEnum,
  IsString,
  IsDate,
} from 'class-validator';
import { lowerCaseTransformer } from '../../utils/transformers/lower-case.transformer';
import { Type } from 'class-transformer';
import { Role } from '../../roles/domain/role';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiPropertyOptional({ example: 'test1@example.com', type: String })
  @Transform(lowerCaseTransformer)
  @IsOptional()
  @IsEmail()
  email?: string | null;

  @ApiPropertyOptional({ example: 'John Doe', type: String })
  @IsOptional()
  @IsString()
  name?: string | null;

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

  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ enum: ['admin', 'user'] })
  @IsOptional()
  role?: 'admin' | 'user' | Role | null;

  @ApiPropertyOptional({ type: Date })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  emailVerifiedAt?: Date | null;

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

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  roleId?: number;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  permissions?: Record<string, any>;
}
