import { ApiProperty } from '@nestjs/swagger';
import { CreationTool } from '../../creation-tools/domain/creation-tool';

export enum CreationJobStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELED = 'CANCELED',
}

export class CreationJob {
  @ApiProperty({
    type: String,
  })
  id: string;

  @ApiProperty({ enum: CreationJobStatus })
  status: CreationJobStatus;

  @ApiProperty()
  creationToolId: string;

  @ApiProperty({ type: Object })
  inputData: Record<string, any>;

  @ApiProperty({ required: false, type: Object })
  outputData?: Record<string, any>;

  @ApiProperty()
  progress: number;

  @ApiProperty({ required: false })
  createdBy?: string;

  @ApiProperty({ required: false })
  workspaceId?: string;

  @ApiProperty({ required: false, type: () => CreationTool })
  creationTool?: CreationTool;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ required: false })
  error?: string;
}
