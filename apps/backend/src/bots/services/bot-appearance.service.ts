import { Injectable } from '@nestjs/common';
import { WidgetVersionService } from './widget-version.service';

@Injectable()
export class BotAppearanceService {
  constructor(private readonly widgetVersionService: WidgetVersionService) {}

  async getAppearance(botId: string) {
    const activeVersion =
      await this.widgetVersionService.getActiveVersion(botId);

    if (!activeVersion) {
      return {
        primaryColor: '#667eea',
        backgroundColor: '#ffffff',
        botMessageColor: '#f9fafb',
        botMessageTextColor: '#1f2937',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto',
        position: 'bottom-right',
        buttonSize: 'medium',
        showAvatar: true,
        showTimestamp: true,
        welcomeMessage: 'Hello! How can I help you today?',
        placeholderText: 'Type a message...',
      };
    }

    const config = activeVersion.config;
    return {
      primaryColor: config.theme?.primaryColor || '#667eea',
      backgroundColor: config.theme?.backgroundColor || '#ffffff',
      botMessageColor: config.theme?.botMessageColor || '#f9fafb',
      botMessageTextColor: config.theme?.botMessageTextColor || '#1f2937',
      fontFamily:
        config.theme?.fontFamily ||
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto',
      position: config.theme?.position || 'bottom-right',
      buttonSize: config.theme?.buttonSize || 'medium',
      showAvatar: config.theme?.showAvatar ?? true,
      showTimestamp: config.theme?.showTimestamp ?? true,
      welcomeMessage: config.messages?.welcome || 'Hello!',
      placeholderText: config.messages?.placeholder || 'Type a message...',
    };
  }

  async updateAppearance(botId: string, appearance: any, userId: string) {
    const configUpdate: any = {};

    if (
      appearance.primaryColor ||
      appearance.backgroundColor ||
      appearance.botMessageColor ||
      appearance.botMessageTextColor ||
      appearance.fontFamily ||
      appearance.position ||
      appearance.buttonSize ||
      appearance.showAvatar !== undefined ||
      appearance.showTimestamp !== undefined
    ) {
      configUpdate.theme = {
        ...(appearance.primaryColor && {
          primaryColor: appearance.primaryColor,
        }),
        ...(appearance.backgroundColor && {
          backgroundColor: appearance.backgroundColor,
        }),
        ...(appearance.botMessageColor && {
          botMessageColor: appearance.botMessageColor,
        }),
        ...(appearance.botMessageTextColor && {
          botMessageTextColor: appearance.botMessageTextColor,
        }),
        ...(appearance.fontFamily && { fontFamily: appearance.fontFamily }),
        ...(appearance.position && { position: appearance.position }),
        ...(appearance.buttonSize && { buttonSize: appearance.buttonSize }),
        ...(appearance.showAvatar !== undefined && {
          showAvatar: appearance.showAvatar,
        }),
        ...(appearance.showTimestamp !== undefined && {
          showTimestamp: appearance.showTimestamp,
        }),
      };
    }

    if (appearance.welcomeMessage || appearance.placeholderText) {
      configUpdate.messages = {
        ...(appearance.welcomeMessage && {
          welcome: appearance.welcomeMessage,
        }),
        ...(appearance.placeholderText && {
          placeholder: appearance.placeholderText,
        }),
      };
    }

    const activeVersion =
      await this.widgetVersionService.getActiveVersion(botId);

    if (!activeVersion) {
      // If no active version exists, create the initial version
      const initialConfig = {
        theme: {
          primaryColor: appearance.primaryColor || '#667eea',
          backgroundColor: appearance.backgroundColor || '#ffffff',
          botMessageColor: appearance.botMessageColor || '#f9fafb',
          botMessageTextColor: appearance.botMessageTextColor || '#1f2937',
          fontFamily:
            appearance.fontFamily ||
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto',
          position: appearance.position || 'bottom-right',
          buttonSize: appearance.buttonSize || 'medium',
          showAvatar: appearance.showAvatar ?? true,
          showTimestamp: appearance.showTimestamp ?? true,
        },
        messages: {
          welcome:
            appearance.welcomeMessage || 'Hello! How can I help you today?',
          placeholder: appearance.placeholderText || 'Type a message...',
          offline: 'chatbot.default_offline',
          errorMessage: 'chatbot.default_error',
        },
        behavior: {
          autoOpen: false,
          autoOpenDelay: 3000,
          greetingDelay: 1000,
        },
        features: {
          fileUpload: true,
          voiceInput: false,
          markdown: true,
          quickReplies: true,
        },
        branding: {
          showPoweredBy: true,
        },
        security: {
          allowedOrigins: ['*'],
        },
      };

      const version = await this.widgetVersionService.createVersion(
        botId,
        {
          version: '1.0.0',
          config: initialConfig,
          changelog: 'Initial version from appearance update',
        },
        userId,
      );

      return this.widgetVersionService.publishVersion(
        botId,
        version.id,
        userId,
      );
    }

    return this.widgetVersionService.updateActiveVersionConfig(
      botId,
      configUpdate,
      userId,
      'Updated appearance settings via BotAppearanceService',
    );
  }
}
