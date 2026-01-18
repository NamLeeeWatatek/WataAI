import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TokenRefreshService } from './token-refresh.service';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './strategies/jwt.strategy';
import { AnonymousStrategy } from './strategies/anonymous.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { MailModule } from '../mail/mail.module';
import { SessionModule } from '../session/session.module';
import { UsersModule } from '../users/users.module';
import { WorkspacesModule } from '../workspaces/workspaces.module';

import { AuthEventListener } from './listeners/auth.listener';

@Module({
  imports: [
    UsersModule,
    SessionModule,
    PassportModule,
    MailModule,
    JwtModule.register({}),
    WorkspacesModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    TokenRefreshService,
    JwtStrategy,
    JwtRefreshStrategy,
    AnonymousStrategy,
    AuthEventListener,
  ],
  exports: [AuthService, TokenRefreshService],
})
export class AuthModule {}
