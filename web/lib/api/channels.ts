/**
 * Channels API
 * API calls for managing channels and integrations
 */
import { axiosClient } from '../axios-client'
import type { Channel, ChannelType, IntegrationConfig, CreateIntegrationDto, UpdateIntegrationDto } from '../types/channel'

/**
 * Get all available channel types
 */
export async function getChannelTypes(): Promise<ChannelType[]> {
  return axiosClient.get('/channels/types') as unknown as Promise<ChannelType[]>
}

/**
 * Get channel type categories
 */
export async function getChannelCategories(): Promise<string[]> {
  return axiosClient.get('/channels/types/categories') as unknown as Promise<string[]>
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface ChannelQueryParams {
  page?: number
  limit?: number
  search?: string
  workspaceId?: string
}

/**
 * Get all connected channels
 */
export async function getChannels(params?: ChannelQueryParams): Promise<PaginatedResponse<Channel>> {
  return axiosClient.get('/channels/', { params }) as unknown as Promise<PaginatedResponse<Channel>>
}

/**
 * Update a connected channel
 */
export async function updateChannel(id: string, data: Partial<Channel>): Promise<Channel> {
  return axiosClient.patch<Channel>(`/channels/${id}`, data) as unknown as Promise<Channel>
}

/**
 * Disconnect a channel
 */
export async function disconnectChannel(id: string): Promise<void> {
  await axiosClient.delete(`/channels/${id}`)
}

/**
 * Get all integration configurations
 */
export async function getIntegrations(workspaceId?: string): Promise<IntegrationConfig[]> {
  return axiosClient.get('/integrations/', { params: { workspaceId } }) as unknown as Promise<IntegrationConfig[]>
}

/**
 * Create integration configuration
 */
export async function createIntegration(
  data: CreateIntegrationDto,
  workspaceId?: string
): Promise<IntegrationConfig> {
  return axiosClient.post('/integrations/', data, { params: { workspaceId } }) as unknown as Promise<IntegrationConfig>
}

/**
 * Update integration configuration
 */
export async function updateIntegration(id: string, data: UpdateIntegrationDto): Promise<IntegrationConfig> {
  return axiosClient.patch(`/integrations/${id}`, data) as unknown as Promise<IntegrationConfig>
}

/**
 * Delete integration configuration
 */
export async function deleteIntegration(id: string): Promise<void> {
  await axiosClient.delete(`/integrations/${id}`)
}

export interface OAuthParams {
  configId?: string
  workspaceId?: string
}

/**
 * Get OAuth login URL
 */
export async function getOAuthUrl(
  provider: string,
  configId?: string,
  workspaceId?: string,
  redirectUri?: string
): Promise<{ url: string }> {
  const params: OAuthParams & { redirect_uri?: string } = {}
  if (configId) params.configId = configId
  if (workspaceId) params.workspaceId = workspaceId
  if (redirectUri) params.redirect_uri = redirectUri

  // Use the specific controller for Facebook to ensure consistency
  if (provider === 'facebook') {
    const facebookParams: any = { ...params };
    if (configId) {
      facebookParams.credential_id = configId;
      delete facebookParams.configId;
    }
    return axiosClient.get('/channels/facebook/oauth/url', { params: facebookParams }) as unknown as Promise<{ url: string }>
  }

  return axiosClient.get(`/oauth/login/${provider}`, { params }) as unknown as Promise<{ url: string }>
}

export interface ConnectFacebookDto {
  pageId: string
  pageName: string
  userAccessToken: string
  pageAccessToken: string
  category?: string
  botId?: string | null
}

/**
 * Connect Facebook page
 */
export async function connectFacebook(data: ConnectFacebookDto): Promise<void> {
  return axiosClient.post('/channels/facebook/connect', data)
}

/**
 * Handle Facebook OAuth callback
 */
export async function facebookCallback(params: { code: string; state?: string; redirect_uri: string }): Promise<any> {
  return axiosClient.get('/channels/facebook/oauth/callback', { params })
}
