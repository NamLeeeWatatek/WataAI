import { DeepPartial } from '../../../utils/types/deep-partial.type';
import { NullableType } from '../../../utils/types/nullable.type';
import { IPaginationOptions } from '../../../utils/types/pagination-options';
import { StylePreset } from '../../domain/style-preset';

export abstract class StylePresetRepository {
  abstract create(
    data: Omit<StylePreset, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>,
  ): Promise<StylePreset>;

  abstract findManyWithPagination({
    workspaceId,
    paginationOptions,
  }: {
    workspaceId: string;
    paginationOptions: IPaginationOptions;
  }): Promise<StylePreset[]>;

  abstract findById(id: StylePreset['id']): Promise<NullableType<StylePreset>>;

  abstract update(
    id: StylePreset['id'],
    payload: DeepPartial<StylePreset>,
  ): Promise<StylePreset | null>;

  abstract remove(id: StylePreset['id']): Promise<void>;
}
