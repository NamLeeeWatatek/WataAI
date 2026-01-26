import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Param,
  Get,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { WorkspaceAccessGuard } from '../workspaces/guards/workspace-access.guard';
import { PermissionsGuard } from '../permissions/guards/permissions.guard';
import { Permissions } from '../permissions/decorators/permissions.decorator';
import { WorkspaceInvitationsService } from './workspace-invitations.service';
import { CreateInvitationDto } from './dto/create-invitation.dto';

@ApiTags('Workspace Invitations')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), WorkspaceAccessGuard, PermissionsGuard)
@Controller('workspaces/invitations')
export class WorkspaceInvitationsController {
  constructor(
    private readonly invitationsService: WorkspaceInvitationsService,
  ) {}

  @Permissions('iam:InviteUser')
  @Post(':workspaceId')
  @ApiOperation({ summary: 'Create invitation for workspace' })
  @HttpCode(HttpStatus.CREATED)
  create(
    @Param('workspaceId') workspaceId: string,
    @Body() createDto: CreateInvitationDto,
    @Request() req,
  ) {
    return this.invitationsService.create(workspaceId, req.user.id, createDto);
  }

  @Post('accept/:token')
  @ApiOperation({ summary: 'Accept workspace invitation' })
  @HttpCode(HttpStatus.OK)
  accept(@Param('token') token: string, @Request() req) {
    return this.invitationsService.accept(token, req.user.id);
  }

  @Permissions('iam:InviteUser')
  @Get(':workspaceId')
  @ApiOperation({ summary: 'Get pending invitations for workspace' })
  findAll(@Param('workspaceId') workspaceId: string) {
    return this.invitationsService.findAllByWorkspace(workspaceId);
  }
}
