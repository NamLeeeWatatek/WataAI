import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CharacterEntity } from '../entities/character.entity';
import { NullableType } from '../../../../../utils/types/nullable.type';
import { IPaginationOptions } from '../../../../../utils/types/pagination-options';
import { Character } from '../../../../domain/character';
import { CharacterRepository } from '../../character.repository';
import { CharacterMapper } from '../mappers/character.mapper';

@Injectable()
export class CharacterRelationalRepository implements CharacterRepository {
  constructor(
    @InjectRepository(CharacterEntity)
    private readonly repository: Repository<CharacterEntity>,
  ) {}

  async create(data: Character): Promise<Character> {
    const persistenceModel = CharacterMapper.toPersistence(data);
    const newEntity = await this.repository.save(
      this.repository.create(persistenceModel),
    );
    return CharacterMapper.toDomain(newEntity);
  }

  async findManyWithPagination({
    workspaceId,
    paginationOptions,
  }: {
    workspaceId: string;
    paginationOptions: IPaginationOptions;
  }): Promise<Character[]> {
    const entities = await this.repository.find({
      skip: (paginationOptions.page - 1) * paginationOptions.limit,
      take: paginationOptions.limit,
      where: {
        workspaceId,
      },
    });

    return entities.map((entity) => CharacterMapper.toDomain(entity));
  }

  async findById(id: Character['id']): Promise<NullableType<Character>> {
    const entity = await this.repository.findOne({
      where: { id },
    });

    return entity ? CharacterMapper.toDomain(entity) : null;
  }

  async update(
    id: Character['id'],
    payload: Partial<Character>,
  ): Promise<Character | null> {
    const entity = await this.repository.findOne({
      where: { id },
    });

    if (!entity) return null;

    const updatedEntity = await this.repository.save(
      this.repository.create(
        CharacterMapper.toPersistence({
          ...CharacterMapper.toDomain(entity),
          ...payload,
        }),
      ),
    );

    return CharacterMapper.toDomain(updatedEntity);
  }

  async remove(id: Character['id']): Promise<void> {
    await this.repository.softDelete(id);
  }
}
