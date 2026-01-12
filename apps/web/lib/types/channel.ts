/**
 * Channel Type Definitions
 * Strongly typed interfaces for channel management
 */

export interface ChannelType {
  id: string
  name: string
  description: string
  category: ChannelCategory
  icon: string
  color: string
  multiAccount: boolean
  isActive: boolean
  createdAt?: string
  updatedAt?: string
}

export type ChannelCategory =
  | 'messaging'
  | 'social'
  | 'ecommerce'
  | 'crm'
  | 'marketing'
  | 'support'
  | 'automation'
  | 'productivity'
  | 'business'

export enum ChannelPlatform {
  FACEBOOK = 'facebook',
  INSTAGRAM = 'instagram',
  GOOGLE = 'google',
  OMI = 'omi',
  TELEGRAM = 'telegram',
  WHATSAPP = 'whatsapp',
}

export enum ChannelConnectionStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ERROR = 'error',
  DISCONNECTED = 'disconnected',
}

/** Metadata stored with a channel connection */
export interface ChannelMetadata {
  botId?: string
  pageId?: string
  pageName?: string
  pageAccessToken?: string
  webhookVerified?: boolean
  lastSyncAt?: string
  errorMessage?: string
  pages?: FacebookPage[]
  [key: string]: unknown
}

/** Facebook page data structure */
export interface FacebookPage {
  id: string
  name: string
  access_token?: string
  picture?: {
    data: {
      url: string
    }
  }
  category?: string
  isPage?: boolean
}

export interface Channel {
  id: string
  name: string
  type: ChannelPlatform | string
  icon?: string
  status: ChannelConnectionStatus | string
  connected_at: string
  accessToken?: string
  refreshToken?: string
  expiresAt?: string
  botId?: string
  bot?: { id: string; name: string } | null
  metadata?: ChannelMetadata
}

export interface IntegrationConfig {
  id: string
  name?: string
  provider: ChannelPlatform | string
  client_id: string
  client_secret: string
  scopes?: string
  verify_token?: string // ✅ For Facebook webhook verification
  is_active: boolean
  createdAt?: string
  updatedAt?: string
}

export interface CreateIntegrationDto {
  provider: string
  name?: string
  client_id: string
  client_secret: string
  scopes?: string
  verify_token?: string
  is_active?: boolean
}

export interface UpdateIntegrationDto {
  name?: string
  client_id?: string
  client_secret?: string
  scopes?: string
  verify_token?: string
  is_active?: boolean
}

