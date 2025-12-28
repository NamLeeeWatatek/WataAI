import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class Character {
  @ApiProperty({ type: String })
  id: string;

  @ApiProperty({ type: String, example: 'Luna' })
  name: string;

  @ApiPropertyOptional({ type: String })
  description?: string | null;

  @ApiPropertyOptional({
    type: Object,
    description: 'Visual description, personality traits, voice settings',
  })
  metadata?: Record<string, any> | null;

  @ApiPropertyOptional({ type: String })
  workspaceId?: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional()
  deletedAt?: Date | null;
}
