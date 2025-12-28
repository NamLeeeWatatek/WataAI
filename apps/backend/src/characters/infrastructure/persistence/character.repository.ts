import { DeepPartial } from '../../../utils/types/deep-partial.type';
import { NullableType } from '../../../utils/types/nullable.type';
import { IPaginationOptions } from '../../../utils/types/pagination-options';
import { Character } from '../../domain/character';

export abstract class CharacterRepository {
  abstract create(
    data: Omit<Character, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>,
  ): Promise<Character>;

  abstract findManyWithPagination({
    workspaceId,
    paginationOptions,
  }: {
    workspaceId: string;
    paginationOptions: IPaginationOptions;
  }): Promise<Character[]>;

  abstract findById(id: Character['id']): Promise<NullableType<Character>>;

  abstract update(
    id: Character['id'],
    payload: DeepPartial<Character>,
  ): Promise<Character | null>;

  abstract remove(id: Character['id']): Promise<void>;
}
