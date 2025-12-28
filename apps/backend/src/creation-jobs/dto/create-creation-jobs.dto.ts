import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsObject, IsUUID } from 'class-validator';

export class CreateCreationJobDto {
  @ApiProperty({
    description: 'The ID of the creation tool to run',
    example: 'd290f1ee-6c54-4b01-90e6-d701748f0851',
  })
  @IsNotEmpty()
  @IsUUID()
  creationToolId: string;

  @ApiProperty({
    description: 'The input data for the job',
    example: { topic: 'AI Agents', tone: 'Professional' },
  })
  @IsNotEmpty()
  @IsObject()
  inputData: Record<string, any>;
}
