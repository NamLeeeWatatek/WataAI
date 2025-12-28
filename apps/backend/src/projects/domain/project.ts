import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class Project {
  @ApiProperty({ type: String })
  id: string;

  @ApiProperty({ type: String, example: 'Winter Campaign 2024' })
  name: string;

  @ApiPropertyOptional({ type: String })
  description?: string | null;

  @ApiPropertyOptional({ type: String })
  workspaceId?: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional()
  deletedAt?: Date | null;
}
