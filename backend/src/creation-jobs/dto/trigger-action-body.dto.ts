import { ApiProperty } from '@nestjs/swagger';
import { IsObject } from 'class-validator';

export class TriggerActionBodyDto {
    @ApiProperty({
        description: 'Dynamic inputs for the action',
        example: { caption: 'Hello world' },
    })
    @IsObject()
    inputs: Record<string, any>;
}
