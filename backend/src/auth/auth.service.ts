import {
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import ms from 'ms';
import crypto from 'crypto';
import { randomStringGenerator } from '@nestjs/common/utils/random-string-generator.util';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';
import { AuthEmailLoginDto } from './dto/auth-email-login.dto';
import { AuthUpdateDto } from './dto/auth-update.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SocialInterface } from '../social/interfaces/social.interface';
import { AuthRegisterLoginDto } from './dto/auth-register-login.dto';
import { NullableType } from '../utils/types/nullable.type';
import { LoginResponseDto } from './dto/login-response.dto';
import { ConfigService } from '@nestjs/config';
import { JwtRefreshPayloadType } from './strategies/types/jwt-refresh-payload.type';
import { JwtPayloadType } from './strategies/types/jwt-payload.type';
import { UsersService } from '../users/users.service';
import { AllConfigType } from '../config/config.type';
import { MailService } from '../mail/mail.service';
import { RoleEnum } from '../roles/roles.enum';
import { Role } from '../roles/domain/role';
import { Session } from '../session/domain/session';
import { SessionService } from '../session/session.service';
import { User } from '../users/domain/user';
import { WorkspaceHelperService } from '../workspaces/workspace-helper.service';
import { WorkspaceInvitationsService } from '../workspaces/workspace-invitations.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private jwtService: JwtService,
    private usersService: UsersService,
    private sessionService: SessionService,
    private mailService: MailService,
    private configService: ConfigService<AllConfigType>,
    private workspaceHelper: WorkspaceHelperService,
    private eventEmitter: EventEmitter2,
    private workspaceInvitationsService: WorkspaceInvitationsService,
  ) {}

  async validateLogin(loginDto: AuthEmailLoginDto): Promise<LoginResponseDto> {
    const user = await this.usersService.findByEmail(loginDto.email);

    if (!user) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          email: 'notFound',
        },
      });
    }

    if (!user.password) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          password: 'incorrectPassword',
        },
      });
    }

    // Allow credentials login if user has a password, regardless of provider
    // This handles cases where users were created with external providers but now have passwords

    const isValidPassword = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!isValidPassword) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          password: 'incorrectPassword',
        },
      });
    }

    if (!user.isActive) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          email: 'unverified',
        },
      });
    }

    const hash = crypto
      .createHash('sha256')
      .update(randomStringGenerator())
      .digest('hex');

    const session = await this.sessionService.create({
      user,
      hash,
    });

    let workspace: any = null;
    let hasPendingInvitation = false;

    if (user.email) {
      const invitations =
        await this.workspaceInvitationsService.getPendingInvitationsByEmail(
          user.email,
        );

      if (invitations && invitations.length > 0) {
        hasPendingInvitation = true;
        await this.workspaceInvitationsService.acceptPendingInvitations(
          user.email,
          user.id,
        );
      }
    }

    // Only create workspace if user has no pending invitations
    if (!hasPendingInvitation) {
      workspace = await this.workspaceHelper.ensureUserHasWorkspace(
        user.id,
        user.name || undefined,
      );
    } else {
      // Get the workspace from accepted invitations
      const workspaces = await this.workspaceHelper.getUserWorkspaces(user.id);
      workspace = workspaces.length > 0 ? workspaces[0] : null;
    }

    const { token, refreshToken, tokenExpires } = await this.getTokensData({
      id: user.id,
      role: user.role,
      sessionId: session.id,
      hash,
      workspaceId: workspace?.id,
    });
    const workspaces = await this.workspaceHelper.getUserWorkspaces(user.id);

    return {
      refreshToken,
      token,
      tokenExpires,
      user,
      workspace: workspace,
      workspaces: workspaces,
    };
  }

  // Handle social login authentication (Google, Facebook, etc.)
  // Creates or links user account and returns login response
  async validateSocialLogin(
    authProvider: string,
    socialData: SocialInterface,
  ): Promise<LoginResponseDto> {
    let user: NullableType<User> = null;
    const socialEmail = socialData.email?.toLowerCase();
    let userByEmail: NullableType<User> = null;

    if (socialEmail) {
      userByEmail = await this.usersService.findByEmail(socialEmail);
    }

    if (socialData.id) {
      user = await this.usersService.findBySocialIdAndProvider({
        socialId: socialData.id,
        provider: authProvider,
      });
    }

    if (user) {
      // ✅ FIX: Don't auto-update email from social login without confirmation
      // If social email differs from current email, flag for confirmation
      if (socialEmail && user.email !== socialEmail) {
        this.logger.log(
          `Social login email (${socialEmail}) differs from user email (${user.email}). Keeping existing email.`,
        );
        // Don't update email - require email confirmation flow
      }
      // Update social ID and provider if not set
      if (!user.socialId || !user.provider) {
        user.socialId = socialData.id;
        user.provider = authProvider;
        await this.usersService.update(user.id, user);
      }
    } else if (userByEmail) {
      // User exists with same email - link social account
      user = {
        ...userByEmail,
        socialId: socialData.id,
        provider: authProvider,
      } as User;
      await this.usersService.update(user.id, {
        socialId: socialData.id,
        provider: authProvider,
      });
    } else if (socialData.id) {
      user = await this.usersService.create({
        email: socialEmail ?? null,
        name:
          `${socialData.firstName ?? ''} ${socialData.lastName ?? ''}`.trim() ||
          null,
        socialId: socialData.id,
        provider: authProvider,
        role: {
          id: RoleEnum.user,
        } as Role, // Force type as DTO might expect Role object now
        isActive: true,
      });

      user = await this.usersService.findById(user.id);
    }

    if (!user) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          user: 'userNotFound',
        },
      });
    }

    const hash = crypto
      .createHash('sha256')
      .update(randomStringGenerator())
      .digest('hex');

    const session = await this.sessionService.create({
      user,
      hash,
    });

    // Check for pending invitations
    if (user.email) {
      await this.workspaceInvitationsService.acceptPendingInvitations(
        user.email,
        user.id,
      );
    }

    const workspace = await this.workspaceHelper.ensureUserHasWorkspace(
      user.id,
      user.name || undefined,
    );

    const {
      token: jwtToken,
      refreshToken,
      tokenExpires,
    } = await this.getTokensData({
      id: user.id,
      role: user.role,
      sessionId: session.id,
      hash,
      workspaceId: workspace?.id,
    });
    const workspaces = await this.workspaceHelper.getUserWorkspaces(user.id);

    return {
      refreshToken,
      token: jwtToken,
      tokenExpires,
      user,
      workspace: workspace,
      workspaces: workspaces,
    };
  }

  async register(dto: AuthRegisterLoginDto): Promise<void> {
    // Use 'name' if provided, otherwise fallback to legacy firstName/lastName composition
    const finalName =
      dto.name ||
      [dto.firstName, dto.lastName].filter(Boolean).join(' ').trim();

    const user = await this.usersService.create({
      email: dto.email,
      name: finalName,
      password: dto.password,
      role: {
        id: RoleEnum.user,
      } as Role,
      isActive: false,
    });

    const hash = await this.jwtService.signAsync(
      {
        confirmEmailUserId: user.id,
      },
      {
        secret: this.configService.getOrThrow('auth.confirmEmailSecret', {
          infer: true,
        }),
        expiresIn: this.configService.getOrThrow('auth.confirmEmailExpires', {
          infer: true,
        }),
      },
    );

    this.logger.log(
      `[AuthService] User registered, emitting event for email verification: ${dto.email}`,
    );
    this.eventEmitter.emit('user.registered', {
      email: dto.email,
      hash,
    });
  }

  async confirmEmail(hash: string): Promise<void> {
    let userId: User['id'];

    try {
      const jwtData = await this.jwtService.verifyAsync<{
        confirmEmailUserId: User['id'];
      }>(hash, {
        secret: this.configService.getOrThrow('auth.confirmEmailSecret', {
          infer: true,
        }),
      });

      userId = jwtData.confirmEmailUserId;
    } catch {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          hash: `invalidHash`,
        },
      });
    }

    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new NotFoundException({
        status: HttpStatus.NOT_FOUND,
        error: `notFound`,
      });
    }

    if (user.isActive) {
      return;
    }

    await this.usersService.update(user.id, { isActive: true });
  }

  async confirmNewEmail(hash: string): Promise<void> {
    let userId: User['id'];
    let newEmail: User['email'];

    try {
      const jwtData = await this.jwtService.verifyAsync<{
        confirmEmailUserId: User['id'];
        newEmail: User['email'];
      }>(hash, {
        secret: this.configService.getOrThrow('auth.confirmEmailSecret', {
          infer: true,
        }),
      });

      userId = jwtData.confirmEmailUserId;
      newEmail = jwtData.newEmail;
    } catch {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          hash: `invalidHash`,
        },
      });
    }

    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new NotFoundException({
        status: HttpStatus.NOT_FOUND,
        error: `notFound`,
      });
    }

    user.email = newEmail;

    await this.usersService.update(user.id, {
      email: newEmail,
      isActive: true,
    });
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          email: 'emailNotExists',
        },
      });
    }

    const tokenExpiresIn = this.configService.getOrThrow('auth.forgotExpires', {
      infer: true,
    });

    const tokenExpires = Date.now() + ms(tokenExpiresIn);

    const hash = await this.jwtService.signAsync(
      {
        forgotUserId: user.id,
      },
      {
        secret: this.configService.getOrThrow('auth.forgotSecret', {
          infer: true,
        }),
        expiresIn: tokenExpiresIn,
      },
    );

    this.logger.log(
      `[AuthService] Password recovery requested, emitting event: ${email}`,
    );
    this.eventEmitter.emit('user.forgotPassword', {
      email,
      hash,
      tokenExpires,
    });
  }

  async resetPassword(hash: string, password: string): Promise<void> {
    let userId: User['id'];

    try {
      const jwtData = await this.jwtService.verifyAsync<{
        forgotUserId: User['id'];
      }>(hash, {
        secret: this.configService.getOrThrow('auth.forgotSecret', {
          infer: true,
        }),
      });

      userId = jwtData.forgotUserId;
    } catch {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          hash: `invalidHash`,
        },
      });
    }

    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          hash: `notFound`,
        },
      });
    }

    user.password = password;

    await this.sessionService.deleteByUserId({
      userId: user.id,
    });

    await this.usersService.update(user.id, user);
  }

  async me(userJwtPayload: JwtPayloadType): Promise<NullableType<User>> {
    return this.usersService.findById(userJwtPayload.id);
  }

  async update(
    userJwtPayload: JwtPayloadType,
    userDto: AuthUpdateDto,
  ): Promise<NullableType<User>> {
    const currentUser = await this.usersService.findById(userJwtPayload.id);

    if (!currentUser) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          user: 'userNotFound',
        },
      });
    }

    if (userDto.password) {
      if (!userDto.oldPassword) {
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            oldPassword: 'missingOldPassword',
          },
        });
      }

      if (!currentUser.password) {
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            oldPassword: 'incorrectOldPassword',
          },
        });
      }

      const isValidOldPassword = await bcrypt.compare(
        userDto.oldPassword,
        currentUser.password,
      );

      if (!isValidOldPassword) {
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            oldPassword: 'incorrectOldPassword',
          },
        });
      } else {
        await this.sessionService.deleteByUserIdWithExclude({
          userId: currentUser.id,
          excludeSessionId: userJwtPayload.sessionId,
        });
      }
    }

    if (userDto.email && userDto.email !== currentUser.email) {
      const userByEmail = await this.usersService.findByEmail(userDto.email);

      if (userByEmail && userByEmail.id !== currentUser.id) {
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            email: 'emailExists',
          },
        });
      }

      const hash = await this.jwtService.signAsync(
        {
          confirmEmailUserId: currentUser.id,
          newEmail: userDto.email,
        },
        {
          secret: this.configService.getOrThrow('auth.confirmEmailSecret', {
            infer: true,
          }),
          expiresIn: this.configService.getOrThrow('auth.confirmEmailExpires', {
            infer: true,
          }),
        },
      );

      await this.mailService.confirmNewEmail({
        to: userDto.email,
        data: {
          hash,
        },
      });
    }

    delete userDto.email;
    delete userDto.oldPassword;

    await this.usersService.update(userJwtPayload.id, userDto);

    return this.usersService.findById(userJwtPayload.id);
  }

  async refreshToken(
    data: Pick<JwtRefreshPayloadType, 'sessionId' | 'hash'>,
  ): Promise<Omit<LoginResponseDto, 'user'>> {
    const session = await this.sessionService.findById(data.sessionId);

    if (!session) {
      throw new UnauthorizedException();
    }

    if (session.hash !== data.hash) {
      throw new UnauthorizedException();
    }

    // ✅ FIX: Do NOT rotate hash on every single refresh.
    // This prevents race conditions where parallel requests invalidate each other's refresh tokens.
    // The session hash should remain stable unless we want to force-invalidate all current refresh tokens.
    const hash = session.hash;

    const user = await this.usersService.findById(session.user.id);

    if (!user?.role) {
      throw new UnauthorizedException();
    }

    // No need to update the session hash every time.
    // This allows multiple browser tabs to refresh concurrently if needed.
    // await this.sessionService.update(session.id, { hash });

    // ✅ FIX: Preserve workspace context from existing token
    // Don't call ensureUserHasWorkspace which may create new workspace
    // Get existing workspace or first workspace user belongs to
    const existingWorkspaces = await this.workspaceHelper.getUserWorkspaces(
      user.id,
    );

    // Use first workspace user belongs to (preserve context)
    const workspaceId =
      existingWorkspaces.length > 0 ? existingWorkspaces[0].id : undefined;

    const { token, refreshToken, tokenExpires } = await this.getTokensData({
      id: session.user.id,
      role: user.role,
      sessionId: session.id,
      hash,
      workspaceId,
    });

    return {
      token,
      refreshToken,
      tokenExpires,
    };
  }

  /**
   * âœ… NEW: Refresh token from body (for frontend)
   * Decodes refresh token to get session info, then calls refreshToken
   */
  async refreshTokenFromBody(
    refreshTokenString: string,
  ): Promise<Omit<LoginResponseDto, 'user'>> {
    try {
      // Decode refresh token to get session info
      const payload = await this.jwtService.verifyAsync<JwtRefreshPayloadType>(
        refreshTokenString,
        {
          secret: this.configService.getOrThrow('auth.refreshSecret', {
            infer: true,
          }),
        },
      );

      // Call existing refreshToken method
      return this.refreshToken({
        sessionId: payload.sessionId,
        hash: payload.hash,
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async softDelete(user: User): Promise<void> {
    await this.usersService.remove(user.id);
  }

  async logout(data: Pick<JwtRefreshPayloadType, 'sessionId'>) {
    return this.sessionService.deleteById(data.sessionId);
  }

  private async getTokensData(data: {
    id: User['id'];
    role: User['role'];
    sessionId: Session['id'];
    hash: Session['hash'];
    workspaceId?: string;
  }) {
    const tokenExpiresIn = this.configService.getOrThrow('auth.expires', {
      infer: true,
    });

    const tokenExpires = Date.now() + ms(tokenExpiresIn);

    const [token, refreshToken] = await Promise.all([
      await this.jwtService.signAsync(
        {
          id: data.id,
          role: data.role,
          sessionId: data.sessionId,
          workspaceId: data.workspaceId,
        },
        {
          secret: this.configService.getOrThrow('auth.secret', { infer: true }),
          expiresIn: tokenExpiresIn,
        },
      ),
      await this.jwtService.signAsync(
        {
          sessionId: data.sessionId,
          hash: data.hash,
        },
        {
          secret: this.configService.getOrThrow('auth.refreshSecret', {
            infer: true,
          }),
          expiresIn: this.configService.getOrThrow('auth.refreshExpires', {
            infer: true,
          }),
        },
      ),
    ]);

    return {
      token,
      refreshToken,
      tokenExpires,
    };
  }
}
