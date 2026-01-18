import { ApiProperty } from '@nestjs/swagger';
import { FileType } from '../../../../domain/file';

export class S3PresignedFileResponseDto {
  @ApiProperty({
    type: () => FileType,
  })
  file: FileType;

  @ApiProperty({
    type: String,
  })
  uploadSignedUrl: string;

  @ApiProperty({
    type: String,
  })
  downloadSignedUrl: string;
}
