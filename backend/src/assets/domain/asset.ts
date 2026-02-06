import { ApiProperty } from '@nestjs/swagger';

export enum AssetType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  AUDIO = 'AUDIO',
  DOCUMENT = 'DOCUMENT',
  TEXT = 'TEXT',
  OTHER = 'OTHER',
}

export class Asset {
  @ApiProperty({
    type: String,
    example: 'cbcfa8b8-3a25-4adb-a9c6-e325f0d0f3ae',
  })
  id: string;

  @ApiProperty({
    type: String,
    example: 'My Awesome Image',
  })
  name: string;

  @ApiProperty({
    enum: AssetType,
    example: AssetType.IMAGE,
  })
  type: AssetType;

  @ApiProperty({
    type: String,
    example: 'https://example.com/image.jpg',
  })
  url: string;

  @ApiProperty({
    type: String,
    example: 'cbcfa8b8-3a25-4adb-a9c6-e325f0d0f3ae',
    required: false,
  })
  fileId?: string;

  @ApiProperty({
    type: String,
    example: 'cbcfa8b8-3a25-4adb-a9c6-e325f0d0f3ae',
    required: false,
  })
  jobId?: string;

  @ApiProperty({
    type: String,
    example: 'cbcfa8b8-3a25-4adb-a9c6-e325f0d0f3ae',
  })
  workspaceId: string;

  @ApiProperty({
    type: String,
    example: 'cbcfa8b8-3a25-4adb-a9c6-e325f0d0f3ae',
    required: false,
  })
  createdBy?: string;

  @ApiProperty({
    type: Object,
    required: false,
  })
  metadata?: Record<string, any>;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
