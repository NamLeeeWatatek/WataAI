import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreationJobsDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  id: string;
}
