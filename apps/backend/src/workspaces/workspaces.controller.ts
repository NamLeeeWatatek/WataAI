import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiCreatedResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { WorkspacesService } from './workspaces.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import {
  UpdateWorkspaceDto,
  AddMemberDto,
  UpdateMemberRoleDto,
} from './dto/update-workspace.dto';
import { Workspace, WorkspaceMember } from './domain/workspace';

import { PermissionsGuard } from '../permissions/guards/permissions.guard';
import { Permissions } from '../permissions/decorators/permissions.decorator';
import { WorkspaceAccessGuard } from './guards/workspace-access.guard';

@ApiTags('Workspaces')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@Controller({ path: 'workspaces', version: '1' })
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Post()
  @ApiOperation({ summary: 'Create workspace' })
  @ApiCreatedResponse({ type: Workspace })
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createDto: CreateWorkspaceDto, @Request() req) {
    return this.workspacesService.create(createDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all user workspaces' })
  @ApiOkResponse({ type: [Workspace] })
  findAll(@Request() req) {
    return this.workspacesService.findAll(req.user.id);
  }

  @Get('current')
  @ApiOperation({ summary: 'Get user current/default workspace' })
  @ApiOkResponse({ type: Workspace })
  async getCurrent(@Request() req) {
    return this.workspacesService.getUserDefaultWorkspace(req.user.id);
  }

  @Permissions('workspaces:Get')
  @UseGuards(WorkspaceAccessGuard)
  @Get(':id')
  @ApiOperation({ summary: 'Get workspace by ID' })
  @ApiOkResponse({ type: Workspace })
  @ApiParam({ name: 'id', type: String })
  findOne(@Param('id') id: string) {
    return this.workspacesService.findOne(id);
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get workspace by slug' })
  @ApiOkResponse({ type: Workspace })
  @ApiParam({ name: 'slug', type: String })
  findBySlug(@Param('slug') slug: string) {
    return this.workspacesService.findBySlug(slug);
  }

  @Permissions('workspaces:Update')
  @UseGuards(WorkspaceAccessGuard)
  @Patch(':id')
  @ApiOperation({ summary: 'Update workspace' })
  @ApiOkResponse({ type: Workspace })
  @ApiParam({ name: 'id', type: String })
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateWorkspaceDto,
    @Request() req,
  ) {
    return this.workspacesService.update(id, updateDto, req.user.id);
  }

  @Permissions('workspaces:Delete')
  @UseGuards(WorkspaceAccessGuard)
  @Delete(':id')
  @ApiOperation({ summary: 'Delete workspace' })
  @ApiParam({ name: 'id', type: String })
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @Request() req) {
    return this.workspacesService.remove(id, req.user.id);
  }

  @Permissions('iam:ListMembers')
  @UseGuards(WorkspaceAccessGuard)
  @Get(':id/members')
  @ApiOperation({ summary: 'Get workspace members' })
  @ApiOkResponse({ type: [WorkspaceMember] })
  @ApiParam({ name: 'id', type: String })
  getMembers(@Param('id') id: string) {
    return this.workspacesService.getMembers(id);
  }

  @Permissions('iam:AddMember')
  @UseGuards(WorkspaceAccessGuard)
  @Post(':id/members')
  @ApiOperation({ summary: 'Add member to workspace' })
  @ApiCreatedResponse({ type: WorkspaceMember })
  @ApiParam({ name: 'id', type: String })
  @HttpCode(HttpStatus.CREATED)
  addMember(
    @Param('id') id: string,
    @Body() body: AddMemberDto,
    @Request() req,
  ) {
    return this.workspacesService.addMember(
      id,
      body.userId,
      body.role,
      req.user.id,
    );
  }

  @Permissions('iam:UpdateMember')
  @UseGuards(WorkspaceAccessGuard)
  @Patch(':id/members/:userId')
  @ApiOperation({ summary: 'Update member role' })
  @ApiOkResponse({ type: WorkspaceMember })
  @ApiParam({ name: 'id', type: String })
  @ApiParam({ name: 'userId', type: String })
  updateMemberRole(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Body() body: UpdateMemberRoleDto,
    @Request() req,
  ) {
    return this.workspacesService.updateMemberRole(
      id,
      userId,
      body.role,
      req.user.id,
    );
  }

  @Permissions('iam:RemoveMember')
  @UseGuards(WorkspaceAccessGuard)
  @Delete(':id/members/:userId')
  @ApiOperation({ summary: 'Remove member from workspace' })
  @ApiParam({ name: 'id', type: String })
  @ApiParam({ name: 'userId', type: String })
  @HttpCode(HttpStatus.NO_CONTENT)
  removeMember(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Request() req,
  ) {
    return this.workspacesService.removeMember(id, userId, req.user.id);
  }

  @Permissions('workspaces:TransferOwnership')
  @UseGuards(WorkspaceAccessGuard)
  @Post(':id/transfer-ownership')
  @ApiOperation({ summary: 'Transfer workspace ownership' })
  @ApiOkResponse({ type: Workspace })
  @ApiParam({ name: 'id', type: String })
  transferOwnership(
    @Param('id') id: string,
    @Body() body: { newOwnerId: string },
    @Request() req,
  ) {
    return this.workspacesService.transferOwnership(
      id,
      body.newOwnerId,
      req.user.id,
    );
  }
}
