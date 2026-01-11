import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, MoreThan } from 'typeorm';
import { WorkspaceInvitationEntity } from './infrastructure/persistence/relational/entities/workspace-invitation.entity';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { WorkspacesService } from './workspaces.service';
import { WorkspaceRole } from './enums/workspace-role.enum';
import { getWorkspaceRoleId } from './utils/workspace-role.helper';
import crypto from 'crypto';
import { MailService } from '../mail/mail.service'; // Assuming you have a MailService
import { UsersService } from '../users/users.service';

@Injectable()
export class WorkspaceInvitationsService {
  private readonly logger = new Logger(WorkspaceInvitationsService.name);

  constructor(
    @InjectRepository(WorkspaceInvitationEntity)
    private invitationRepository: Repository<WorkspaceInvitationEntity>,
    private workspacesService: WorkspacesService,
    private mailService: MailService,
    private usersService: UsersService,
  ) {}

  async create(
    workspaceId: string,
    senderId: string,
    createDto: CreateInvitationDto,
  ) {
    // 1. Check permission
    const senderRole = await this.workspacesService.getMemberRole(
      workspaceId,
      senderId,
    );
    if (
      senderRole !== WorkspaceRole.OWNER &&
      senderRole !== WorkspaceRole.ADMIN
    ) {
      throw new ForbiddenException('Only owners and admins can invite members');
    }

    // 2. Check if user is already a member
    const existingUser = await this.usersService.findByEmail(createDto.email);
    if (existingUser) {
      const isMember = await this.workspacesService.isWorkspaceMember(
        workspaceId,
        existingUser.id,
      );
      if (isMember) {
        throw new BadRequestException(
          'User is already a member of this workspace',
        );
      }
    }

    const roleId = getWorkspaceRoleId(createDto.role || WorkspaceRole.MEMBER);
    const existingInvitation = await this.findExistingInvitation(
      workspaceId,
      createDto.email,
      roleId,
    );

    if (existingInvitation) {
      this.logger.log(
        `Returning existing invitation for ${createDto.email} in workspace ${workspaceId}`,
      );
      // Update expiration and resend email
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      existingInvitation.expiresAt = expiresAt;
      await this.invitationRepository.save(existingInvitation);

      const workspace = await this.workspacesService.findOne(workspaceId);
      await this.mailService.sendWorkspaceInvitation({
        to: createDto.email,
        data: { workspaceName: workspace.name },
      });

      return existingInvitation;
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiration

    const invitation = this.invitationRepository.create({
      workspaceId,
      senderId,
      email: createDto.email,
      roleId,
      token,
      expiresAt,
    });

    await this.invitationRepository.save(invitation);

    // 4. Send email
    const workspace = await this.workspacesService.findOne(workspaceId);
    await this.mailService.sendWorkspaceInvitation({
      to: createDto.email,
      data: { workspaceName: workspace.name },
    });

    return invitation;
  }

  async accept(token: string, userId: string) {
    const invitation = await this.invitationRepository.findOne({
      where: { token },
      relations: ['workspace'],
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    if (invitation.expiresAt < new Date()) {
      throw new BadRequestException('Invitation expired');
    }

    if (invitation.acceptedAt) {
      throw new BadRequestException('Invitation already accepted');
    }

    // Check if email matches for security
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.email !== invitation.email) {
      this.logger.warn(
        `User ${userId} (${user.email}) tried to accept invitation for ${invitation.email}`,
      );
      throw new ForbiddenException(
        'This invitation was sent to a different email address',
      );
    }

    // Add member
    await this.workspacesService.addDirectMember(
      invitation.workspaceId,
      userId,
      invitation.roleId,
    );

    invitation.acceptedAt = new Date();
    await this.invitationRepository.save(invitation);

    return invitation.workspace;
  }

  async acceptPendingInvitations(email: string, userId: string) {
    const invitations = await this.invitationRepository.find({
      where: {
        email,
        acceptedAt: IsNull(),
        expiresAt: MoreThan(new Date()),
      },
    });

    const acceptedWorkspaces: string[] = [];

    for (const invitation of invitations) {
      await this.workspacesService.addDirectMember(
        invitation.workspaceId,
        userId,
        invitation.roleId,
      );

      invitation.acceptedAt = new Date();
      await this.invitationRepository.save(invitation);
      acceptedWorkspaces.push(invitation.workspaceId);
    }

    return acceptedWorkspaces;
  }

  async getPendingInvitationsByEmail(
    email: string,
  ): Promise<WorkspaceInvitationEntity[]> {
    return this.invitationRepository.find({
      where: {
        email,
        acceptedAt: IsNull(),
        expiresAt: MoreThan(new Date()),
      },
      relations: ['workspace'],
    });
  }

  async findExistingInvitation(
    workspaceId: string,
    email: string,
    roleId: number,
  ): Promise<WorkspaceInvitationEntity | null> {
    return this.invitationRepository.findOne({
      where: {
        workspaceId,
        email,
        roleId,
        acceptedAt: IsNull(),
        expiresAt: MoreThan(new Date()),
      },
    });
  }
}
