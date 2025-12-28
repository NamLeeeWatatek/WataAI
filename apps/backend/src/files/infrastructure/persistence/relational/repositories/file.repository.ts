import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FileEntity } from '../entities/file.entity';
import { In, Repository, LessThan } from 'typeorm';
import { FileRepository } from '../../file.repository';

import { FileMapper } from '../mappers/file.mapper';
import { FileType } from '../../../../domain/file';
import { NullableType } from '../../../../../utils/types/nullable.type';

@Injectable()
export class FileRelationalRepository implements FileRepository {
  constructor(
    @InjectRepository(FileEntity)
    private readonly fileRepository: Repository<FileEntity>,
  ) {}

  async create(data: FileType): Promise<FileType> {
    const persistenceModel = FileMapper.toPersistence(data);
    const entity = await this.fileRepository.save(
      this.fileRepository.create(persistenceModel),
    );

    return FileMapper.toDomain(entity);
  }

  async findById(id: FileType['id']): Promise<NullableType<FileType>> {
    const entity = await this.fileRepository.findOne({
      where: {
        id: id,
      },
    });

    return entity ? FileMapper.toDomain(entity) : null;
  }

  async findByIds(ids: FileType['id'][]): Promise<FileType[]> {
    const entities = await this.fileRepository.find({
      where: {
        id: In(ids),
      },
    });

    return entities.map((entity) => FileMapper.toDomain(entity));
  }

  async delete(id: FileType['id']): Promise<void> {
    await this.fileRepository.delete({
      id: id,
    });
  }

  async update(id: FileType['id'], payload: Partial<FileType>): Promise<void> {
    const entity = await this.fileRepository.findOne({
      where: { id },
    });

    if (!entity) return;

    if (payload.isTemp !== undefined) {
      entity.isTemp = payload.isTemp;
    }

    await this.fileRepository.save(entity);
  }

  async findOldTemporaryFiles(): Promise<FileType[]> {
    const yesterday = new Date();
    yesterday.setHours(yesterday.getHours() - 24);

    const qb = this.fileRepository.createQueryBuilder('file');
    const oldTempFiles = await qb
      .where('file.isTemp = :isTemp', { isTemp: true })
      .andWhere('file.createdAt < :yesterday', { yesterday })
      .getMany();

    return oldTempFiles.map((entity) => FileMapper.toDomain(entity));
  }
}
