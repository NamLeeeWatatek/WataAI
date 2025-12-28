import { ApiProperty } from '@nestjs/swagger';

export enum CreationJobStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
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

  @ApiProperty()
  inputData: any;

  @ApiProperty({ required: false })
  outputData?: any;

  @ApiProperty()
  progress: number;

  @ApiProperty({ required: false })
  createdBy?: string;

  @ApiProperty({ required: false })
  workspaceId?: string;

  @ApiProperty({ required: false })
  creationTool?: any;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ required: false })
  error?: string;
}
