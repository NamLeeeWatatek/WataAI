import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreatePermissionDto {
  @ApiProperty({ example: 'users' })
  @IsNotEmpty()
  @IsString()
  resource: string;

  @ApiProperty({ example: 'read' })
  @IsNotEmpty()
  @IsString()
  action: string;

  @ApiProperty({ example: 'Read all user information' })
  @IsNotEmpty()
  @IsString()
  description: string;
}
