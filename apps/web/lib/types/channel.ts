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
/** Metadata stored with a channel connection */
export interface ChannelMetadata {
  botId?: string
  pageId?: string
  pageName?: string
  accountId?: string
  accountName?: string
  connectedBy?: string
  pages?: ChannelPage[]
  [key: string]: unknown
}

/** Normalized Page data structure (Facebook/Instagram/etc) */
export interface ChannelPage {
  id: string
  name: string
  category?: string
  tasks?: string[]
  picture?: {
    data: {
      url: string
    }
  }
}

export interface Channel {
  id: string
  name: string
  type: ChannelPlatform | string
  status: ChannelConnectionStatus | string
  connected_at: string
  metadata: ChannelMetadata
}

export interface IntegrationConfig {
  id: string
  name?: string
  provider: ChannelPlatform | string
  client_id: string
  client_secret: string
  scopes?: string
  verify_token?: string
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

