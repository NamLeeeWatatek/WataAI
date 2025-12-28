import axiosClient from '../axios-client'
import { MessageRole } from '../types/conversations'

export interface Bot {
  id: string
  workspaceId: string
  name: string
  description?: string
  avatarUrl?: string
  defaultLanguage: string
  timezone: string
  status: 'draft' | 'active' | 'paused' | 'archived'
  createdBy: string
  icon?: string
  isActive?: boolean
  flowId?: string | null
  systemPrompt?: string | null
  functions?: string[] | null
  functionConfig?: Record<string, any> | null
  aiProviderId?: string | null
  aiModelName?: string | null
  aiParameters?: Record<string, any> | null
  knowledgeBaseIds?: string[] | null
  enableAutoLearn?: boolean
  createdAt: string
  updatedAt: string
}

export interface BotChannel {
  id: string
  botId: string
  type: string
  name: string
  config?: Record<string, any>
  isActive: boolean
  connectedAt?: string | null
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface CreateBotDto {
  name: string
  description?: string
  avatarUrl?: string
  defaultLanguage?: string
  timezone?: string
  status?: 'draft' | 'active' | 'paused' | 'archived'
  workspaceId?: string
  systemPrompt?: string
  functions?: string[]
  functionConfig?: Record<string, any>
  aiProviderId?: string
  aiModelName?: string
  aiParameters?: Record<string, any>
  knowledgeBaseIds?: string[]
  enableAutoLearn?: boolean
  icon?: string
  isActive?: boolean
}

export interface UpdateBotDto extends Partial<CreateBotDto> { }

export const botsApi = {
  async getAll(workspaceId: string, options?: { page?: number; limit?: number; status?: string }) {
    const filters: any = { workspaceId }
    if (options?.status) filters.status = options.status

    return await axiosClient.get('/bots', {
      params: {
        workspaceId, // Pass explicitly for @CurrentWorkspace decorator
        page: options?.page || 1,
        limit: options?.limit || 10,
        filters: JSON.stringify(filters)
      }
    })
  },

  async getOne(id: string): Promise<Bot> {
    return await axiosClient.get(`/bots/${id}`)
  },

  async create(data: CreateBotDto): Promise<Bot> {
    return await axiosClient.post('/bots', data, {
      params: { workspaceId: data.workspaceId }
    })
  },

  async update(id: string, data: UpdateBotDto): Promise<Bot> {
    return await axiosClient.patch(`/bots/${id}`, data)
  },

  async delete(id: string): Promise<void> {
    await axiosClient.delete(`/bots/${id}`)
  },

  async activate(id: string): Promise<Bot> {
    return await axiosClient.post(`/bots/${id}/activate`)
  },

  async pause(id: string): Promise<Bot> {
    return await axiosClient.post(`/bots/${id}/pause`)
  },

  async archive(id: string): Promise<Bot> {
    return await axiosClient.post(`/bots/${id}/archive`)
  },

  async duplicate(id: string, name?: string): Promise<Bot> {
    return await axiosClient.post(`/bots/${id}/duplicate`, { name })
  },

  async getChannels(botId: string): Promise<BotChannel[]> {
    return await axiosClient.get(`/bots/${botId}/channels`)
  },

  async createChannel(
    botId: string,
    data: { type: string; name: string; config?: Record<string, any> }
  ): Promise<BotChannel> {
    return await axiosClient.post(`/bots/${botId}/channels`, data)
  },

  async updateChannel(
    botId: string,
    channelId: string,
    data: { name?: string; config?: Record<string, any>; isActive?: boolean }
  ): Promise<BotChannel> {
    return await axiosClient.patch(
      `/bots/${botId}/channels/${channelId}`,
      data
    )
  },

  async deleteChannel(botId: string, channelId: string): Promise<void> {
    await axiosClient.delete(`/bots/${botId}/channels/${channelId}`)
  },

  async toggleChannel(
    botId: string,
    channelId: string,
    isActive: boolean
  ): Promise<BotChannel> {
    return await axiosClient.patch(
      `/bots/${botId}/channels/${channelId}/toggle`,
      { isActive }
    )
  },

  async executeFunction(
    botId: string,
    functionName: string,
    input: Record<string, any>,
    conversationHistory?: Array<{ role: MessageRole; content: string }>
  ): Promise<any> {
    return await axiosClient.post(`/bots/${botId}/execute/${functionName}`, {
      input,
      conversationHistory,
    })
  },

  async chat(
    botId: string,
    message: string,
    conversationHistory?: Array<{ role: MessageRole; content: string }>,
    knowledgeBaseIds?: string[]
  ): Promise<{ response: string; sources?: any[] }> {
    console.log('[Bot Chat]', {
      botId,
      message: message.substring(0, 50),
      knowledgeBaseIds,
      historyLength: conversationHistory?.length || 0,
    });

    const data: any = await axiosClient.post(`/knowledge-bases/chat`, {
      message,
      botId,
      knowledgeBaseIds: knowledgeBaseIds && knowledgeBaseIds.length > 0 ? knowledgeBaseIds : undefined,
      conversationHistory: conversationHistory?.map(m => ({
        role: m.role,
        content: m.content
      })),
    });

    console.log('[Bot Chat Response]', {
      answerLength: data.answer?.length || 0,
      sourcesCount: data.sources?.length || 0,
    });

    return {
      response: data.answer,
      sources: data.sources || []
    };
  },
}

export const executeBotFunction = botsApi.executeFunction.bind(botsApi)

