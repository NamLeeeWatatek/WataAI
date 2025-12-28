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
  return axiosClient.get('/channels/types')
}

/**
 * Get channel type categories
 */
export async function getChannelCategories(): Promise<string[]> {
  return axiosClient.get('/channels/types/categories')
}

/**
 * Get all connected channels
 */
export async function getChannels(workspaceId?: string): Promise<Channel[]> {
  return axiosClient.get('/channels/', { params: { workspaceId } })
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
  return axiosClient.get('/integrations/', { params: { workspaceId } })
}

/**
 * Create integration configuration
 */
export async function createIntegration(
  data: CreateIntegrationDto,
  workspaceId?: string
): Promise<IntegrationConfig> {
  return axiosClient.post('/integrations/', data, { params: { workspaceId } })
}

/**
 * Update integration configuration
 */
export async function updateIntegration(id: number, data: UpdateIntegrationDto): Promise<IntegrationConfig> {
  return axiosClient.patch(`/integrations/${id}`, data)
}

/**
 * Delete integration configuration
 */
export async function deleteIntegration(id: number): Promise<void> {
  await axiosClient.delete(`/integrations/${id}`)
}

/**
 * Get OAuth login URL
 */
export async function getOAuthUrl(
  provider: string,
  configId?: number,
  workspaceId?: string
): Promise<{ url: string }> {
  const params: any = {}
  if (configId) params.configId = configId
  if (workspaceId) params.workspaceId = workspaceId

  return axiosClient.get(`/oauth/login/${provider}`, { params })
}
