import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

export class PermissionCheckRequestDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  permissions: string[];
}

export class PermissionCheckResponseDto {
  @ApiProperty()
  hasPermission: boolean;

  @ApiProperty({ type: [String] })
  missingPermissions: string[];
}
