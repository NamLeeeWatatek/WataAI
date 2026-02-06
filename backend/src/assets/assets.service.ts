import { Injectable, NotFoundException } from '@nestjs/common';
import { AssetRepository } from './infrastructure/persistence/asset.repository';
import { Asset, AssetType } from './domain/asset';
import { IPaginationOptions } from '../utils/types/pagination-options';

@Injectable()
export class AssetsService {
  constructor(private readonly assetRepository: AssetRepository) {}

  async create(
    data: Omit<Asset, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Asset> {
    return this.assetRepository.create(data as Asset);
  }

  async findAllWithPagination({
    paginationOptions,
    workspaceId,
    type,
    search,
  }: {
    paginationOptions: IPaginationOptions;
    workspaceId: string;
    type?: string;
    search?: string;
  }): Promise<{ data: Asset[]; count: number }> {
    return this.assetRepository.findAllWithPagination({
      paginationOptions,
      workspaceId,
      type,
      search,
    });
  }

  findOne(id: Asset['id']) {
    return this.assetRepository.findById(id);
  }

  async update(id: Asset['id'], payload: Partial<Asset>) {
    return this.assetRepository.update(id, payload);
  }

  async remove(id: Asset['id']) {
    return this.assetRepository.remove(id);
  }

  /**
   * Helper to determine asset type from URL or metadata
   */
  mapMimeTypeToAssetType(mimeType?: string, url?: string): AssetType {
    if (!mimeType && url) {
      const ext = url.split('.').pop()?.toLowerCase();
      if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext!))
        return AssetType.IMAGE;
      if (['mp4', 'webm', 'mov'].includes(ext!)) return AssetType.VIDEO;
      if (['mp3', 'wav', 'ogg'].includes(ext!)) return AssetType.AUDIO;
      if (['pdf', 'doc', 'docx', 'txt'].includes(ext!))
        return AssetType.DOCUMENT;
    }

    if (mimeType) {
      if (mimeType.startsWith('image/')) return AssetType.IMAGE;
      if (mimeType.startsWith('video/')) return AssetType.VIDEO;
      if (mimeType.startsWith('audio/')) return AssetType.AUDIO;
      if (
        mimeType.includes('pdf') ||
        mimeType.includes('word') ||
        mimeType.includes('text')
      )
        return AssetType.DOCUMENT;
    }

    return AssetType.OTHER;
  }
}
