
import { axiosClient } from '../axios-client'
import type {
  GetConversationsResponse,
  GetConversationResponse,
  CreateConversationDto,
  CreateConversationResponse,
  GetMessagesResponse,
  CreateMessageDto,
  AddMessageResponse,
  GetAiConversationsResponse,
  GetAiConversationResponse,
  CreateAiConversationDto,
  CreateAiConversationResponse,
  UpdateAiConversationDto,
  UpdateAiConversationResponse,
  DeleteAiConversationResponse,
  AddAiMessageDto,
  AddAiMessageResponse,
} from '../types/conversations'

export interface GetConversationsParams {
  botId?: string
  channelType?: string
  status?: 'active' | 'closed' | 'handover' | 'archived'
  startDate?: string
  endDate?: string
  page?: number
  limit?: number
  source?: 'all' | 'channel' | 'widget'
}

/**
 * Get all bot conversations with advanced filtering
 * 
 * @param params - Query parameters
 * @param params.botId - Filter by bot ID
 * @param params.channelType - Filter by channel type (facebook, instagram, telegram, etc.)
 * @param params.status - Filter by status (active, closed, handover, archived)
 * @param params.startDate - Filter conversations created after this date
 * @param params.endDate - Filter conversations created before this date
 * @param params.page - Page number for pagination (default: 1)
 * @param params.limit - Items per page (default: 20, max: 100)
 * @param params.source - Filter by source:
 *   - 'all': All conversations (default)
 *   - 'channel': Only channel conversations (Facebook, WhatsApp, etc.)
 *   - 'widget': Only widget conversations (AI chat from website)
 * 
 * @example
 * // Get all conversations
 * const all = await getBotConversations()
 * 
 * // Get only Facebook conversations
 * const facebook = await getBotConversations({ source: 'channel', channelType: 'facebook' })
 * 
 * // Get only widget conversations
 * const widget = await getBotConversations({ source: 'widget' })
 * 
 * // Get active conversations for a specific bot
 * const active = await getBotConversations({ botId: 'bot-id', status: 'active' })
 */
export async function getBotConversations(params?: GetConversationsParams): Promise<GetConversationsResponse> {
  return axiosClient.get('/conversations', { params })
}

/**
 * Get conversation by ID
 */
export async function getBotConversation(id: string): Promise<GetConversationResponse> {
  return axiosClient.get(`/conversations/${id}`)
}

/**
 * Create conversation
 */
export async function createBotConversation(data: CreateConversationDto): Promise<CreateConversationResponse> {
  return axiosClient.post('/conversations', data)
}

/**
 * Get messages in conversation
 */
export async function getBotConversationMessages(conversationId: string): Promise<GetMessagesResponse> {
  return axiosClient.get(`/conversations/${conversationId}/messages`)
}

/**
 * Add message to conversation
 */
export async function addBotConversationMessage(conversationId: string, data: CreateMessageDto): Promise<AddMessageResponse> {
  return axiosClient.post(`/conversations/${conversationId}/messages`, data)
}

/**
 * Get all AI conversations
 */
export async function getAIConversations(): Promise<GetAiConversationsResponse> {
  return axiosClient.get('/ai-conversations')
}

/**
 * Get AI conversation by ID
 */
export async function getAIConversation(id: string): Promise<GetAiConversationResponse> {
  return axiosClient.get(`/ai-conversations/${id}`)
}

/**
 * Create AI conversation
 */
export async function createAIConversation(data: CreateAiConversationDto): Promise<CreateAiConversationResponse> {
  return axiosClient.post('/ai-conversations', data)
}

/**
 * Update AI conversation
 */
export async function updateAIConversation(id: string, data: UpdateAiConversationDto): Promise<UpdateAiConversationResponse> {
  return axiosClient.patch(`/ai-conversations/${id}`, data)
}

/**
 * Delete AI conversation
 */
export async function deleteAIConversation(id: string): Promise<DeleteAiConversationResponse> {
  return axiosClient.delete(`/ai-conversations/${id}`)
}

/**
 * Add message to AI conversation
 */
export async function addAIConversationMessage(id: string, data: AddAiMessageDto): Promise<AddAiMessageResponse> {
  return axiosClient.post(`/ai-conversations/${id}/messages`, data)
}

