import { Injectable, NotFoundException } from '@nestjs/common';
import { CharacterRepository } from './infrastructure/persistence/character.repository';
import { Character } from './domain/character';
import { IPaginationOptions } from '../utils/types/pagination-options';
import { NullableType } from '../utils/types/nullable.type';
import { DeepPartial } from '../utils/types/deep-partial.type';
import { CreateCharacterDto } from './dto/create-character.dto';
import { UpdateCharacterDto } from './dto/update-character.dto';

@Injectable()
export class CharactersService {
  constructor(private readonly characterRepository: CharacterRepository) {}

  async create(createCharacterDto: CreateCharacterDto): Promise<Character> {
    return this.characterRepository.create(createCharacterDto);
  }

  async findManyWithPagination({
    workspaceId,
    paginationOptions,
  }: {
    workspaceId: string;
    paginationOptions: IPaginationOptions;
  }): Promise<Character[]> {
    return this.characterRepository.findManyWithPagination({
      workspaceId,
      paginationOptions,
    });
  }

  async findById(id: Character['id']): Promise<NullableType<Character>> {
    return this.characterRepository.findById(id);
  }

  async update(
    id: Character['id'],
    payload: UpdateCharacterDto,
  ): Promise<Character | null> {
    const character = await this.characterRepository.findById(id);
    if (!character) {
      throw new NotFoundException('Character not found');
    }
    return this.characterRepository.update(id, payload);
  }

  async remove(id: Character['id']): Promise<void> {
    await this.characterRepository.remove(id);
  }
}
