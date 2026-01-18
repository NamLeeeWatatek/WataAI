import { Module } from '@nestjs/common';
import { CharactersController } from './characters.controller';
import { CharactersService } from './characters.service';
import { RelationalCharacterPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';

@Module({
  imports: [RelationalCharacterPersistenceModule],
  controllers: [CharactersController],
  providers: [CharactersService],
  exports: [CharactersService, RelationalCharacterPersistenceModule],
})
export class CharactersModule {}
