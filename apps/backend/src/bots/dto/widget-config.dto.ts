import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsString,
  IsNumber,
  IsObject,
  IsArray,
  IsOptional,
  IsIn,
  Matches,
} from 'class-validator';

/**
 * Widget Config Response DTO (Public API)
 * Tráº£ vá» cho widget khi load
 */
export class WidgetConfigResponseDto {
  @ApiProperty({ example: 'abc-123-xyz' })
  botId: string;

  @ApiProperty({ example: 'Support Bot' })
  name: string;

  @ApiPropertyOptional({ example: '24/7 AI Support' })
  description?: string;

  @ApiPropertyOptional({ example: 'https://cdn.wataomi.com/avatars/bot.png' })
  avatarUrl?: string;

  @ApiProperty({ example: 'vi' })
  defaultLanguage: string;

  @ApiProperty({ example: 'Asia/Ho_Chi_Minh' })
  timezone: string;

  @ApiProperty({
    example: {
      primaryColor: '#667eea',
      position: 'bottom-right',
      buttonSize: 'medium',
      showAvatar: true,
      showTimestamp: true,
    },
  })
  theme: {
    primaryColor: string;
    position: string;
    buttonSize: string;
    showAvatar: boolean;
    showTimestamp: boolean;
  };

  @ApiProperty({
    example: {
      autoOpen: false,
      autoOpenDelay: 0,
      greetingDelay: 2,
    },
  })
  behavior: {
    autoOpen: boolean;
    autoOpenDelay: number;
    greetingDelay: number;
  };

  @ApiProperty({
    example: {
      welcome: 'Xin chÃ o! TÃ´i cÃ³ thá»ƒ giÃºp gÃ¬ cho báº¡n?',
      placeholder: 'Nháº­p tin nháº¯n...',
      offline: 'ChÃºng tÃ´i hiá»‡n Ä‘ang offline',
      errorMessage: 'ÄÃ£ cÃ³ lá»—i xáº£y ra. Vui lÃ²ng thá»­ láº¡i.',
    },
  })
  messages: {
    welcome: string;
    placeholder: string;
    offline: string;
    errorMessage: string;
  };

  @ApiProperty({
    example: {
      fileUpload: false,
      voiceInput: false,
      markdown: true,
      quickReplies: true,
    },
  })
  features: {
    fileUpload: boolean;
    voiceInput: boolean;
    markdown: boolean;
    quickReplies: boolean;
  };

  @ApiProperty({
    example: {
      showPoweredBy: true,
    },
  })
  branding: {
    showPoweredBy: boolean;
  };
}

/**
 * Widget Config DTO (Admin API)
 * DÃ¹ng cho dashboard
 */
export class WidgetConfigDto {
  @ApiProperty({ example: true })
  enabled: boolean;

  @ApiProperty({
    example: {
      theme: {
        primaryColor: '#667eea',
        position: 'bottom-right',
        buttonSize: 'medium',
        showAvatar: true,
        showTimestamp: true,
      },
      behavior: {
        autoOpen: false,
        autoOpenDelay: 0,
        greetingDelay: 2,
      },
      messages: {
        welcome: 'Xin chÃ o!',
        placeholder: 'Nháº­p tin nháº¯n...',
        offline: 'Offline',
        errorMessage: 'Lá»—i',
      },
      features: {
        fileUpload: false,
        voiceInput: false,
        markdown: true,
        quickReplies: true,
      },
      branding: {
        showPoweredBy: true,
      },
    },
  })
  config: any;

  @ApiProperty({ example: ['https://example.com', '*'] })
  allowedOrigins: string[];
}

/**
 * Update Widget Config DTO
 */
export class UpdateWidgetConfigDto {
  @ApiProperty({
    example: {
      theme: {
        primaryColor: '#667eea',
        position: 'bottom-right',
        buttonSize: 'medium',
        showAvatar: true,
        showTimestamp: true,
      },
    },
  })
  @IsObject()
  config: {
    theme?: {
      primaryColor?: string;
      position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
      buttonSize?: 'small' | 'medium' | 'large';
      showAvatar?: boolean;
      showTimestamp?: boolean;
    };
    behavior?: {
      autoOpen?: boolean;
      autoOpenDelay?: number;
      greetingDelay?: number;
    };
    messages?: {
      welcome?: string;
      placeholder?: string;
      offline?: string;
      errorMessage?: string;
    };
    features?: {
      fileUpload?: boolean;
      voiceInput?: boolean;
      markdown?: boolean;
      quickReplies?: boolean;
    };
    branding?: {
      showPoweredBy?: boolean;
    };
  };

  @ApiPropertyOptional({ example: ['https://example.com'] })
  @IsArray()
  @IsOptional()
  allowedOrigins?: string[];
}

/**
 * Widget Theme DTO
 */
export class WidgetThemeDto {
  @ApiProperty({ example: '#667eea' })
  @IsString()
  @Matches(/^#[0-9A-F]{6}$/i, {
    message: 'Invalid color format. Use hex format like #667eea',
  })
  primaryColor: string;

  @ApiProperty({ example: 'bottom-right' })
  @IsString()
  @IsIn(['bottom-right', 'bottom-left', 'top-right', 'top-left'])
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';

  @ApiProperty({ example: 'medium' })
  @IsString()
  @IsIn(['small', 'medium', 'large'])
  buttonSize: 'small' | 'medium' | 'large';

  @ApiProperty({ example: true })
  @IsBoolean()
  showAvatar: boolean;

  @ApiProperty({ example: true })
  @IsBoolean()
  showTimestamp: boolean;
}

/**
 * Widget Behavior DTO
 */
export class WidgetBehaviorDto {
  @ApiProperty({ example: false })
  @IsBoolean()
  autoOpen: boolean;

  @ApiProperty({ example: 0 })
  @IsNumber()
  autoOpenDelay: number;

  @ApiProperty({ example: 2 })
  @IsNumber()
  greetingDelay: number;
}

/**
 * Widget Messages DTO
 */
export class WidgetMessagesDto {
  @ApiProperty({ example: 'Xin chÃ o! TÃ´i cÃ³ thá»ƒ giÃºp gÃ¬ cho báº¡n?' })
  @IsString()
  welcome: string;

  @ApiProperty({ example: 'Nháº­p tin nháº¯n...' })
  @IsString()
  placeholder: string;

  @ApiProperty({ example: 'ChÃºng tÃ´i hiá»‡n Ä‘ang offline' })
  @IsString()
  offline: string;

  @ApiProperty({ example: 'ÄÃ£ cÃ³ lá»—i xáº£y ra. Vui lÃ²ng thá»­ láº¡i.' })
  @IsString()
  errorMessage: string;
}

/**
 * Embed Code Response DTO
 */
export class EmbedCodeResponseDto {
  @ApiProperty({
    example:
      '<script src="https://cdn.wataomi.com/widget-loader.js" data-bot-id="abc-123"></script>',
  })
  embedCode: string;

  @ApiProperty({ example: 'abc-123-xyz' })
  botId: string;

  @ApiProperty({ example: 'https://cdn.wataomi.com/widget-loader.js' })
  widgetUrl: string;
}
