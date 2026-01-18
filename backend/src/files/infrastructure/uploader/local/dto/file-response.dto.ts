import { ApiProperty } from '@nestjs/swagger';
import { FileType } from '../../../../domain/file';

export class LocalFileResponseDto {
  @ApiProperty({
    type: () => FileType,
  })
  file: FileType;
}
