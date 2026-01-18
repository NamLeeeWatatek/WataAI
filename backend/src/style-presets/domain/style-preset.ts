import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class StylePreset {
  @ApiProperty({ type: String })
  id: string;

  @ApiProperty({ type: String, example: 'Cinematic Dream' })
  name: string;

  @ApiPropertyOptional({ type: String })
  description?: string | null;

  @ApiProperty({
    type: Object,
    description:
      'Style parameters (lighting, composition, color grading, etc.)',
  })
  config: Record<string, any>;

  @ApiPropertyOptional({ type: String })
  workspaceId?: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional()
  deletedAt?: Date | null;
}
