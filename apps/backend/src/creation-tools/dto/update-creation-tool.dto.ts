import { PartialType } from '@nestjs/swagger';
import { CreateCreationToolDto } from './create-creation-tool.dto';

export class UpdateCreationToolDto extends PartialType(CreateCreationToolDto) {}
