/**
 * SecureApiKey domain entity
 * SINGLE RESPONSIBILITY: Encrypted API key storage and access control
 * NO BUSINESS LOGIC - Only storage and access control
 */

import { ApiProperty } from '@nestjs/swagger';
import { SecureKey, SecureKeyData } from '../interfaces';

export class SecureApiKey implements SecureKey {
  @ApiProperty({ type: String })
  id: string;

  @ApiProperty({
    type: String,
    description: 'Encrypted API key using AES-256-GCM',
  })
  encryptedKey: string;

  @ApiProperty({
    type: String,
    description: 'Owner of this API key (userId or workspaceId)',
  })
  ownerId: string;

  @ApiProperty({
    type: String,
    description: 'Related provider configuration ID',
  })
  providerConfigId: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  // Minimal behavior methods chỉ cho access control validation
  static canRead(key: SecureApiKey, requestingOwnerId: string): boolean {
    return key.ownerId === requestingOwnerId;
  }

  static canModify(key: SecureApiKey, requestingOwnerId: string): boolean {
    return key.ownerId === requestingOwnerId;
  }

  static canDelete(key: SecureApiKey, requestingOwnerId: string): boolean {
    // Same as modify - only owner can delete
    return this.canModify(key, requestingOwnerId);
  }

  // Factory method for creating secure key
  static create(data: SecureKeyData, providerConfigId: string): SecureApiKey {
    const key = new SecureApiKey();
    key.id = crypto.randomUUID();
    key.encryptedKey = data.encryptedKey;
    key.ownerId = data.ownerId;
    key.providerConfigId = providerConfigId;
    key.createdAt = new Date();
    key.updatedAt = new Date();
    return key;
  }

  // Update method (only gives ability to change encrypted key)
  updateEncryptedKey(newEncryptedKey: string): void {
    this.encryptedKey = newEncryptedKey;
    this.updatedAt = new Date();
  }

  // Metadata access for auditing (no secrets)
  getMetadata() {
    return {
      id: this.id,
      ownerId: this.ownerId,
      providerConfigId: this.providerConfigId,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      keyLength: this.encryptedKey.length, // For monitoring key size changes
    };
  }
}

/**
 * API Key Encryption Service - Domain behavior for encryption
 * Separated from entity for clean boundaries
 */
export interface IApiKeyEncryptionService {
  encrypt(plainText: string): Promise<string>;
  decrypt(encryptedText: string): Promise<string>;
  rotateKey(): Promise<void>; // For periodic key rotation
}

/**
 * Security Monitoring Domain Service
 */
export interface IApiKeySecurityMonitor {
  logAccessAttempt(
    keyId: string,
    operation: 'read' | 'write' | 'delete',
    success: boolean,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void>;

  detectSuspiciousActivity(
    keyId: string,
    recentAttempts: SecurityAttempt[],
  ): Promise<SuspiciousActivityFlag>;

  enforceRateLimits(ownerId: string, operation: string): Promise<boolean>;
}

export interface SecurityAttempt {
  timestamp: Date;
  operation: string;
  success: boolean;
  ipAddress: string;
}

export interface SuspiciousActivityFlag {
  isSuspicious: boolean;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  recommendedActions: string[];
  alertRecipients: string[];
}
