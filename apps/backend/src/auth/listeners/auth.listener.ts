import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { MailService } from '../../mail/mail.service';

@Injectable()
export class AuthEventListener {
  private readonly logger = new Logger(AuthEventListener.name);

  constructor(private readonly mailService: MailService) { }

  @OnEvent('user.registered', { async: true })
  async handleUserRegisteredEvent(payload: { email: string; hash: string }) {
    try {
      this.logger.log(
        `[Background Worker] Sending verification email to ${payload.email}...`,
      );
      await this.mailService.userSignUp({
        to: payload.email,
        data: {
          hash: payload.hash,
        },
      });
      this.logger.log(
        `[Background Worker] Verification email sent to ${payload.email}`,
      );
    } catch (error) {
      this.logger.error(
        `[Background Worker] Failed to send email to ${payload.email}:`,
        error,
      );
      // Ở hệ thống cao cấp hơn, chỗ này sẽ lưu vào DB hoặc hàng đợi để Retry
    }
  }

  @OnEvent('user.forgotPassword', { async: true })
  async handleForgotPasswordEvent(payload: {
    email: string;
    hash: string;
    tokenExpires: number;
  }) {
    try {
      this.logger.log(
        `[Background Worker] Sending reset password email to ${payload.email}...`,
      );
      await this.mailService.forgotPassword({
        to: payload.email,
        data: {
          hash: payload.hash,
          tokenExpires: payload.tokenExpires,
        },
      });
      this.logger.log(
        `[Background Worker] Reset password email sent to ${payload.email}`,
      );
    } catch (error) {
      this.logger.error(
        `[Background Worker] Failed to send reset email to ${payload.email}:`,
        error,
      );
    }
  }
}
