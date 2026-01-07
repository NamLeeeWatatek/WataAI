import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsObject, IsOptional, IsString } from 'class-validator';
import { CreationJobStatus } from '../domain/creation-jobs';

export class CompleteJobDto {
    @ApiProperty({
        description: 'The final status of the job',
        enum: CreationJobStatus,
        example: CreationJobStatus.COMPLETED,
    })
    @IsEnum(CreationJobStatus)
    @IsOptional()
    status?: CreationJobStatus = CreationJobStatus.COMPLETED;

    @ApiPropertyOptional({
        description: 'The output data from the job execution',
        type: 'object',
        additionalProperties: true,
    })
    @IsObject()
    @IsOptional()
    outputData?: Record<string, any>;

    @ApiPropertyOptional({
        description: 'Error message if the job failed',
        example: 'Process timed out',
    })
    @IsString()
    @IsOptional()
    error?: string;
}
