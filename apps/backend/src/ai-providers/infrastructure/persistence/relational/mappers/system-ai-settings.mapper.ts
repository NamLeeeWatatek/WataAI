import { SystemAiSettingsEntity } from '../entities/ai-provider.entity';
import { SystemAiSettings } from '../../../../domain/ai-provider';

export class SystemAiSettingsMapper {
  static toDomain(entity: SystemAiSettingsEntity): SystemAiSettings {
    return {
      id: entity.id,
      defaultProviderId: entity.defaultProviderId || undefined,
      defaultModel: entity.defaultModel || undefined,
      minTemperature: entity.minTemperature,
      maxTemperature: entity.maxTemperature,
      contentModeration: entity.contentModeration,
      safeFallbacks: entity.safeFallbacks,
      contextAware: entity.contextAware,
      maxRequestsPerHour: entity.maxRequestsPerHour,
      maxRequestsPerUser: entity.maxRequestsPerUser,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  static toPersistence(
    domain: SystemAiSettings,
  ): Partial<SystemAiSettingsEntity> {
    return {
      id: domain.id,
      defaultProviderId: domain.defaultProviderId || '',
      defaultModel: domain.defaultModel || '',
      minTemperature: domain.minTemperature,
      maxTemperature: domain.maxTemperature,
      contentModeration: domain.contentModeration,
      safeFallbacks: domain.safeFallbacks,
      contextAware: domain.contextAware,
      maxRequestsPerHour: domain.maxRequestsPerHour,
      maxRequestsPerUser: domain.maxRequestsPerUser,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
    };
  }
}
