import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CharacterEntity } from './entities/character.entity';
import { CharacterRepository } from '../character.repository';
import { CharacterRelationalRepository } from './repositories/character.repository';

@Module({
  imports: [TypeOrmModule.forFeature([CharacterEntity])],
  providers: [
    {
      provide: CharacterRepository,
      useClass: CharacterRelationalRepository,
    },
  ],
  exports: [CharacterRepository],
})
export class RelationalCharacterPersistenceModule {}
