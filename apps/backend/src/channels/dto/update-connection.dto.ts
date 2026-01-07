import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsObject } from 'class-validator';

export class UpdateConnectionDto {
    @ApiPropertyOptional({ example: 'My Channel' })
    @IsOptional()
    @IsString()
    name?: string;

    @ApiPropertyOptional({ example: '12345' })
    @IsOptional()
    @IsString()
    botId?: string | null;

    @ApiPropertyOptional({
        type: 'object',
        example: { pageId: '123' },
        additionalProperties: true,
    })
    @IsOptional()
    @IsObject()
    metadata?: Record<string, any>;
}
