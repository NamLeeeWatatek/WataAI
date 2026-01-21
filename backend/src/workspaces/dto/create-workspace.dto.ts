import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEnum,
  Matches,
} from 'class-validator';

import { WorkspacePlan } from '../enums/workspace-plan.enum';

export class CreateWorkspaceDto {
  @ApiProperty({ example: 'My Workspace' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'my-workspace', description: 'URL-friendly slug' })
  @IsNotEmpty()
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug must be lowercase alphanumeric with hyphens',
  })
  slug: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })
  @IsOptional()
  @IsString()
  avatarUrl?: string | null;

  @ApiPropertyOptional({
    enum: WorkspacePlan,
    default: WorkspacePlan.FREE,
  })
  @IsOptional()
  @IsEnum(WorkspacePlan)
  plan?: WorkspacePlan;
}
