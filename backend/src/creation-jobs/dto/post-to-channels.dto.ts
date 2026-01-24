import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString } from 'class-validator';

export class PostToChannelsDto {
    @ApiProperty({ type: [String], description: 'List of channel IDs' })
    @IsArray()
    @IsString({ each: true })
    channels: string[];

    @ApiPropertyOptional({ description: 'Scheduled time for the post' })
    @IsOptional()
    @IsString()
    scheduledTime?: string;

    @ApiPropertyOptional({ description: 'Custom message/caption' })
    @IsOptional()
    @IsString()
    message?: string;
}
