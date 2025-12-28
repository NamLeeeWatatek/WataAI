import { ApiProperty } from '@nestjs/swagger';
import { Allow } from 'class-validator';

export class FileType {
  @ApiProperty({
    type: String,
    example: 'cbcfa8b8-3a25-4adb-a9c6-e325f0d0f3ae',
  })
  @Allow()
  id: string;

  @ApiProperty({
    type: String,
    example: 'random-filename.jpg',
  })
  path: string;

  @ApiProperty({
    type: String,
    example: 'images',
  })
  @Allow()
  bucket: string;

  @ApiProperty({
    type: String,
    example: 'original-name.jpg',
  })
  @Allow()
  originalName?: string;

  @ApiProperty({
    type: Number,
    example: 1024,
  })
  @Allow()
  size?: number;

  @ApiProperty({
    type: String,
    example: 'image/jpeg',
  })
  @Allow()
  mimeType?: string;

  @Allow()
  workspaceId?: string;

  @Allow()
  createdBy?: string;

  @Allow()
  createdAt?: Date;

  @Allow()
  isTemp?: boolean;
}
