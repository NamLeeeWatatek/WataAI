import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsString,
  IsNumber,
  IsObject,
  IsOptional,
  IsIn,
  Matches,
  Min,
  Max,
} from 'class-validator';

/**
 * Create Widget Version DTO
 */
export class CreateWidgetVersionDto {
  @ApiProperty({ example: '1.0.1' })
  @IsString()
  @Matches(/^\d+\.\d+\.\d+$/, {
    message: 'Version must be in semantic versioning format (e.g., 1.0.0)',
  })
  version: string;

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
      security: {
        allowedOrigins: ['*'],
      },
    },
  })
  @IsObject()
  config: any;

  @ApiPropertyOptional({ example: 'Fixed mobile responsive issue' })
  @IsString()
  @IsOptional()
  changelog?: string;

  @ApiPropertyOptional({ example: 'Internal notes' })
  @IsString()
  @IsOptional()
  notes?: string;
}

/**
 * Update Widget Version DTO
 */
export class UpdateWidgetVersionDto {
  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  config?: any;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  changelog?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}

/**
 * Rollback Widget Version DTO
 */
export class RollbackWidgetVersionDto {
  @ApiProperty({ example: 'Version 1.0.1 has mobile bug' })
  @IsString()
  reason: string;
}

/**
 * Widget Version Response DTO
 */
export class WidgetVersionResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  botId: string;

  @ApiProperty()
  version: string;

  @ApiProperty()
  status: 'draft' | 'published' | 'archived';

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  config: any;

  @ApiPropertyOptional()
  publishedAt?: Date | null;

  @ApiPropertyOptional()
  publishedBy?: string | null;

  @ApiPropertyOptional()
  cdnUrl?: string | null;

  @ApiPropertyOptional()
  changelog?: string | null;

  @ApiPropertyOptional()
  notes?: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

/**
 * Widget Version List Item DTO
 */
export class WidgetVersionListItemDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  version: string;

  @ApiProperty()
  status: 'draft' | 'published' | 'archived';

  @ApiProperty()
  isActive: boolean;

  @ApiPropertyOptional()
  publishedAt?: Date | null;

  @ApiPropertyOptional()
  changelog?: string | null;

  @ApiProperty()
  createdAt: Date;
}

/**
 * Widget Deployment Response DTO
 */
export class WidgetDeploymentResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  botId: string;

  @ApiProperty()
  widgetVersionId: string;

  @ApiProperty()
  version: string;

  @ApiProperty()
  deploymentType: 'publish' | 'rollback' | 'canary';

  @ApiPropertyOptional()
  previousVersionId?: string | null;

  @ApiPropertyOptional()
  previousVersion?: string | null;

  @ApiPropertyOptional()
  rollbackReason?: string | null;

  @ApiProperty()
  trafficPercentage: number;

  @ApiProperty()
  status: 'deploying' | 'deployed' | 'failed' | 'rolled_back';

  @ApiProperty()
  deployedAt: Date;

  @ApiPropertyOptional()
  deployedBy?: string | null;
}

/**
 * Widget Version Analytics DTO
 */
export class WidgetVersionAnalyticsDto {
  @ApiProperty()
  versionId: string;

  @ApiProperty()
  version: string;

  @ApiProperty()
  totalLoads: number;

  @ApiProperty()
  totalMessages: number;

  @ApiProperty()
  totalErrors: number;

  @ApiProperty()
  errorRate: number;

  @ApiProperty()
  avgLoadTime: number;

  @ApiProperty()
  uniqueDomains: number;
}
