import {
  Controller,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { WorkspaceAccessGuard } from '../workspaces/guards/workspace-access.guard';
import { CurrentWorkspace } from '../workspaces/decorators/current-workspace.decorator';
import { InstagramConversationSyncService } from './services/instagram-conversation-sync.service';

@ApiTags('Instagram')
@Controller('channels/instagram')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), WorkspaceAccessGuard)
export class InstagramController {
  constructor(
    private readonly instagramConversationSyncService: InstagramConversationSyncService,
  ) {}

  @Post('connections/:id/sync-to-db')
  @ApiOperation({ summary: 'Sync Instagram conversations into database' })
  @ApiParam({ name: 'id', type: String })
  @HttpCode(HttpStatus.OK)
  async syncConversationsToDatabase(
    @Request() req,
    @CurrentWorkspace() workspaceId: string,
    @Param('id') connectionId: string,
    @Body()
    body?: {
      conversationLimit?: number;
      messageLimit?: number;
    },
  ) {
    const result =
      await this.instagramConversationSyncService.syncConversationsForChannel(
        connectionId,
        workspaceId,
        {
          conversationLimit: body?.conversationLimit || 25,
          messageLimit: body?.messageLimit || 50,
        },
      );

    return {
      success: true,
      synced: result.synced,
      conversations: result.conversations,
    };
  }
}
