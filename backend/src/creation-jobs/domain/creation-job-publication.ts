import { ApiProperty } from '@nestjs/swagger';

export enum PublicationStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  SCHEDULED = 'SCHEDULED',
}

export class CreationJobPublication {
  @ApiProperty()
  id: string;

  @ApiProperty()
  jobId: string;

  @ApiProperty()
  channelId: string;

  @ApiProperty()
  platform: string;

  @ApiProperty({ enum: PublicationStatus })
  status: PublicationStatus;

  @ApiProperty({ required: false })
  externalId?: string;

  @ApiProperty({ required: false })
  url?: string;

  @ApiProperty({ required: false, type: Object })
  metadata?: Record<string, any>;

  @ApiProperty({ required: false })
  error?: string;

  @ApiProperty({ required: false })
  content?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
