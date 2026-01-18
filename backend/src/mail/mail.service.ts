import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { MailData } from './interfaces/mail-data.interface';

import { MaybeType } from '../utils/types/maybe.type';
import { MailerService } from '../mailer/mailer.service';
import path from 'path';
import { AllConfigType } from '../config/config.type';

@Injectable()
export class MailService {
  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService<AllConfigType>,
    private readonly i18n: I18nService,
  ) {}

  async userSignUp(mailData: MailData<{ hash: string }>): Promise<void> {
    const context = I18nContext.current();
    const lang =
      context?.lang ||
      this.configService.get('app.fallbackLanguage', { infer: true });

    const [emailConfirmTitle, text1, text2, text3] = await Promise.all([
      this.i18n.t('common.confirmEmail', { lang }),
      this.i18n.t('confirm-email.text1', { lang }),
      this.i18n.t('confirm-email.text2', { lang }),
      this.i18n.t('confirm-email.text3', { lang }),
    ]);

    const url = new URL(
      this.configService.getOrThrow('app.frontendDomain', {
        infer: true,
      }) + '/confirm-email',
    );
    url.searchParams.set('hash', mailData.data.hash);

    await this.mailerService.sendMail({
      to: mailData.to,
      subject: emailConfirmTitle,
      text: `${url.toString()} ${emailConfirmTitle}`,
      templatePath: path.join(__dirname, 'mail-templates', 'activation.hbs'),
      context: {
        title: emailConfirmTitle,
        url: url.toString(),
        actionTitle: emailConfirmTitle,
        app_name: this.configService.get('app.name', { infer: true }),
        text1,
        text2,
        text3,
      },
    });
  }

  async forgotPassword(
    mailData: MailData<{ hash: string; tokenExpires: number }>,
  ): Promise<void> {
    const context = I18nContext.current();
    const lang =
      context?.lang ||
      this.configService.get('app.fallbackLanguage', { infer: true });

    const [resetPasswordTitle, text1, text2, text3, text4] = await Promise.all([
      this.i18n.t('common.resetPassword', { lang }),
      this.i18n.t('reset-password.text1', { lang }),
      this.i18n.t('reset-password.text2', { lang }),
      this.i18n.t('reset-password.text3', { lang }),
      this.i18n.t('reset-password.text4', { lang }),
    ]);

    const url = new URL(
      this.configService.getOrThrow('app.frontendDomain', {
        infer: true,
      }) + '/reset-password',
    );
    url.searchParams.set('hash', mailData.data.hash);
    url.searchParams.set('expires', mailData.data.tokenExpires.toString());

    await this.mailerService.sendMail({
      to: mailData.to,
      subject: resetPasswordTitle,
      text: `${url.toString()} ${resetPasswordTitle}`,
      templatePath: path.join(
        __dirname,
        'mail-templates',
        'reset-password.hbs',
      ),
      context: {
        title: resetPasswordTitle,
        url: url.toString(),
        actionTitle: resetPasswordTitle,
        app_name: this.configService.get('app.name', {
          infer: true,
        }),
        text1,
        text2,
        text3,
        text4,
      },
    });
  }

  async confirmNewEmail(mailData: MailData<{ hash: string }>): Promise<void> {
    const context = I18nContext.current();
    const lang =
      context?.lang ||
      this.configService.get('app.fallbackLanguage', { infer: true });

    const [emailConfirmTitle, text1, text2, text3] = await Promise.all([
      this.i18n.t('common.confirmEmail', { lang }),
      this.i18n.t('confirm-new-email.text1', { lang }),
      this.i18n.t('confirm-new-email.text2', { lang }),
      this.i18n.t('confirm-new-email.text3', { lang }),
    ]);

    const url = new URL(
      this.configService.getOrThrow('app.frontendDomain', {
        infer: true,
      }) + '/confirm-new-email',
    );
    url.searchParams.set('hash', mailData.data.hash);

    await this.mailerService.sendMail({
      to: mailData.to,
      subject: emailConfirmTitle,
      text: `${url.toString()} ${emailConfirmTitle}`,
      templatePath: path.join(
        __dirname,
        'mail-templates',
        'confirm-new-email.hbs',
      ),
      context: {
        title: emailConfirmTitle,
        url: url.toString(),
        actionTitle: emailConfirmTitle,
        app_name: this.configService.get('app.name', { infer: true }),
        text1,
        text2,
        text3,
      },
    });
  }

  async sendWorkspaceInvitation(
    mailData: MailData<{ workspaceName: string }>,
  ): Promise<void> {
    const context = I18nContext.current();
    const lang =
      context?.lang ||
      this.configService.get('app.fallbackLanguage', { infer: true });

    const appName = this.configService.get('app.name', { infer: true });
    const workspaceName = mailData.data.workspaceName;

    const [subject, title, text1, text2, text3, actionBtn] = await Promise.all([
      this.i18n.t('invitation.subject', { lang, args: { workspaceName } }),
      this.i18n.t('invitation.title', {
        lang,
        args: { workspaceName, appName },
      }),
      this.i18n.t('invitation.text1', { lang, args: { workspaceName } }),
      this.i18n.t('invitation.text2', { lang }),
      this.i18n.t('invitation.text3', { lang }),
      this.i18n.t('invitation.actionBtn', { lang }),
    ]);

    const url = new URL(
      this.configService.getOrThrow('app.frontendDomain', {
        infer: true,
      }) + '/login',
    );

    await this.mailerService.sendMail({
      to: mailData.to,
      subject: subject,
      text: `${url.toString()} ${subject}`,
      templatePath: path.join(__dirname, 'mail-templates', 'invitation.hbs'),
      context: {
        title: title,
        url: url.toString(),
        actionTitle: actionBtn,
        app_name: appName,
        text1,
        text2,
        text3,
      },
    });
  }
}
