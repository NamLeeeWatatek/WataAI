import { AiModel } from '../../domain/ai-provider';
import { NullableType } from '../../../utils/types/nullable.type';
import { AiProviderOwnerType } from '../../ai-providers.enum';

export abstract class AiModelRepository {
  abstract save(data: AiModel): Promise<AiModel>;

  abstract saveAll(data: AiModel[]): Promise<AiModel[]>;

  abstract findByConfigId(
    configId: string,
    ownerType: AiProviderOwnerType,
    type?: string,
  ): Promise<AiModel[]>;

  abstract findById(id: string): Promise<NullableType<AiModel>>;

  abstract deleteByConfigId(
    configId: string,
    ownerType: AiProviderOwnerType,
  ): Promise<void>;

  abstract deactivateAllByConfigId(
    configId: string,
    ownerType: AiProviderOwnerType,
  ): Promise<void>;
}
