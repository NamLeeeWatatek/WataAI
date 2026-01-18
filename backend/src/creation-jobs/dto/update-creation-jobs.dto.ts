import { PartialType, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateCreationJobDto } from './create-creation-jobs.dto';
import { IsNumber, IsEnum, IsOptional, Max, Min } from 'class-validator';
import { CreationJobStatus } from '../domain/creation-jobs';

export class UpdateCreationJobDto extends PartialType(CreateCreationJobDto) {
  @ApiPropertyOptional({ description: 'Job status' })
  @IsOptional()
  @IsEnum(CreationJobStatus)
  status?: CreationJobStatus;

  @ApiPropertyOptional({ description: 'Job progress (0-100)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  progress?: number;

  @ApiPropertyOptional({ description: 'Job output data' })
  @IsOptional()
  outputData?: any;

  @ApiPropertyOptional({ description: 'Job error message' })
  @IsOptional()
  error?: string;
}
