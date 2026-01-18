import { Injectable, NotFoundException } from '@nestjs/common';
import { StylePresetRepository } from './infrastructure/persistence/style-preset.repository';
import { StylePreset } from './domain/style-preset';
import { IPaginationOptions } from '../utils/types/pagination-options';
import { NullableType } from '../utils/types/nullable.type';
import { DeepPartial } from '../utils/types/deep-partial.type';
import { CreateStylePresetDto } from './dto/create-style-preset.dto';
import { UpdateStylePresetDto } from './dto/update-style-preset.dto';

@Injectable()
export class StylePresetsService {
  constructor(private readonly stylePresetRepository: StylePresetRepository) {}

  async create(
    createStylePresetDto: CreateStylePresetDto,
  ): Promise<StylePreset> {
    return this.stylePresetRepository.create(createStylePresetDto);
  }

  async findManyWithPagination({
    workspaceId,
    paginationOptions,
  }: {
    workspaceId: string;
    paginationOptions: IPaginationOptions;
  }): Promise<StylePreset[]> {
    return this.stylePresetRepository.findManyWithPagination({
      workspaceId,
      paginationOptions,
    });
  }

  async findById(id: StylePreset['id']): Promise<NullableType<StylePreset>> {
    return this.stylePresetRepository.findById(id);
  }

  async update(
    id: StylePreset['id'],
    payload: UpdateStylePresetDto,
  ): Promise<StylePreset | null> {
    const preset = await this.stylePresetRepository.findById(id);
    if (!preset) {
      throw new NotFoundException('Style preset not found');
    }
    return this.stylePresetRepository.update(id, payload);
  }

  async remove(id: StylePreset['id']): Promise<void> {
    await this.stylePresetRepository.remove(id);
  }
}
