import {
  Controller,
  Post,
  Get,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { KBSyncService } from './services/kb-sync.service';
import { KBManagementService } from './services/kb-management.service';

@ApiTags('Knowledge Base - Sync')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({ path: 'knowledge-bases', version: '1' })
export class KnowledgeBaseSyncController {
  constructor(
    private readonly syncService: KBSyncService,
    private readonly kbManagementService: KBManagementService,
  ) {}

  @Post(':id/rebuild-collection')
  @ApiOperation({
    summary: 'Rebuild entire vector collection from database',
    description:
      'Use this when Qdrant collection is lost or corrupted. Regenerates all embeddings from stored chunks.',
  })
  async rebuildCollection(@Param('id') id: string, @Request() req) {
    await this.kbManagementService.findOne(id, req.user.id);

    const result = await this.syncService.rebuildCollection(id);
    return result;
  }

  @Post(':id/sync-missing')
  @ApiOperation({
    summary: 'Sync only missing vectors',
    description:
      'Syncs chunks that are missing vectors or have failed embeddings.',
  })
  async syncMissing(@Param('id') id: string, @Request() req) {
    await this.kbManagementService.findOne(id, req.user.id);

    const result = await this.syncService.syncMissingVectors(id);
    return result;
  }

  @Get(':id/verify-collection')
  @ApiOperation({
    summary: 'Verify collection integrity',
    description:
      'Check how many chunks are missing vectors or have failed embeddings.',
  })
  async verifyCollection(@Param('id') id: string, @Request() req) {
    await this.kbManagementService.findOne(id, req.user.id);

    const result = await this.syncService.verifyCollection(id);
    return result;
  }
}
