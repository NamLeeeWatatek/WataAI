import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GenerationJob {
  @ApiProperty({ type: String })
  id: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Creation Tool ID (new architecture)',
  })
  creationToolId?: string | null;

  @ApiProperty({ type: String })
  templateId: string;

  @ApiProperty({ type: String })
  workspaceId: string;

  template?: any;

  @ApiPropertyOptional({ type: String })
  userId?: string | null;

  @ApiProperty({ type: Object })
  inputData: any;

  @ApiPropertyOptional({ type: Object })
  outputData?: any | null;

  @ApiProperty({
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
  })
  status: 'pending' | 'processing' | 'completed' | 'failed';

  @ApiPropertyOptional({ type: String })
  error?: string | null;

  @ApiPropertyOptional({ type: String })
  projectId?: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional()
  deletedAt?: Date | null;
}
