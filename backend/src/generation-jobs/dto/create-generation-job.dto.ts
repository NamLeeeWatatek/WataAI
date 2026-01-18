import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateGenerationJobDto {
  @ApiProperty({ example: 'uuid-creation-tool-id', required: false })
  @IsOptional()
  @IsUUID()
  creationToolId?: string;

  @ApiProperty({ example: 'uuid-template-id' })
  @IsNotEmpty()
  @IsUUID()
  templateId: string;

  @ApiProperty({ example: { prompt: 'A futuristic city' } })
  @IsNotEmpty()
  @IsObject()
  params: Record<string, any>;

  @ApiProperty({ example: 'uuid-workspace-id' })
  @IsOptional()
  @IsUUID()
  workspaceId?: string;
}
