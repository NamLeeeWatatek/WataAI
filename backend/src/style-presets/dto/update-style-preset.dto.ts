import { PartialType } from '@nestjs/swagger';
import { CreateStylePresetDto } from './create-style-preset.dto';

export class UpdateStylePresetDto extends PartialType(CreateStylePresetDto) {}
