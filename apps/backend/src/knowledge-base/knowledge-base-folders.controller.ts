import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { KBFoldersService } from './services/kb-folders.service';
import { CreateFolderDto, UpdateFolderDto } from './dto/kb-folder.dto';

import { WorkspaceAccessGuard } from '../workspaces/guards/workspace-access.guard';

@ApiTags('Knowledge Base - Folders')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), WorkspaceAccessGuard)
@Controller({ path: 'knowledge-bases', version: '1' })
export class KnowledgeBaseFoldersController {
  constructor(private readonly foldersService: KBFoldersService) { }

  @Post('folders')
  @ApiOperation({ summary: 'Create folder' })
  async create(@Request() req, @Body() createDto: CreateFolderDto) {
    const userId = req.user.id;
    return this.foldersService.create(userId, createDto);
  }

  @Get(':id/folders')
  @ApiOperation({ summary: 'Get folders in knowledge base' })
  async getFolders(@Param('id') id: string, @Request() req) {
    const userId = req.user.id;
    return this.foldersService.findAll(id, userId);
  }

  @Get(':id/folders/tree')
  @ApiOperation({ summary: 'Get folder tree structure' })
  async getFolderTree(@Param('id') id: string, @Request() req) {
    const userId = req.user.id;
    return this.foldersService.getTree(id, userId);
  }

  @Patch('folders/:folderId')
  @ApiOperation({ summary: 'Update folder' })
  async update(
    @Param('folderId') folderId: string,
    @Request() req,
    @Body() updateDto: UpdateFolderDto,
  ) {
    const userId = req.user.id;
    return this.foldersService.update(folderId, userId, updateDto);
  }

  @Delete('folders/:folderId')
  @ApiOperation({ summary: 'Delete folder' })
  async remove(@Param('folderId') folderId: string, @Request() req) {
    const userId = req.user.id;
    return this.foldersService.remove(folderId, userId);
  }
}
