import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsArray } from 'class-validator';

export class CreateRoleDto {
  @ApiProperty({ example: 'Editor' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'Has access to content management' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: ['perm-id-1', 'perm-id-2'] })
  @IsOptional()
  @IsArray()
  permissionIds?: string[];
}
