import { ApiProperty } from '@nestjs/swagger';
import { FileType } from '../../../../domain/file';

export class S3FileResponseDto {
  @ApiProperty({
    type: () => FileType,
  })
  file: FileType;
}
