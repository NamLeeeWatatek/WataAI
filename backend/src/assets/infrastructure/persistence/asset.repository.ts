import { NullableType } from '../../../utils/types/nullable.type';
import { IPaginationOptions } from '../../../utils/types/pagination-options';
import { Asset } from '../../domain/asset';

export abstract class AssetRepository {
  abstract create(
    data: Omit<Asset, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Asset>;

  abstract findAllWithPagination({
    paginationOptions,
    workspaceId,
    type,
    search,
  }: {
    paginationOptions: IPaginationOptions;
    workspaceId: string;
    type?: string;
    search?: string;
  }): Promise<{ data: Asset[]; count: number }>;

  abstract findById(id: Asset['id']): Promise<NullableType<Asset>>;

  abstract update(
    id: Asset['id'],
    payload: Partial<Asset>,
  ): Promise<Asset | null>;

  abstract remove(id: Asset['id']): Promise<void>;
}
