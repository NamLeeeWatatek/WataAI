import { NullableType } from '../../../utils/types/nullable.type';
import { FileType } from '../../domain/file';

export abstract class FileRepository {
  abstract create(data: Omit<FileType, 'id'> | FileType): Promise<FileType>;

  abstract findById(id: FileType['id']): Promise<NullableType<FileType>>;

  abstract findByIds(ids: FileType['id'][]): Promise<FileType[]>;

  abstract delete(id: FileType['id']): Promise<void>;

  abstract update(
    id: FileType['id'],
    payload: Partial<FileType>,
  ): Promise<void>;

  abstract findOldTemporaryFiles(): Promise<FileType[]>;
}
