import axiosClient from '../axios-client'
import { MessageRole } from '../types/conversations'
import { Bot, CreateBotDto, UpdateBotDto } from '../types/bots'

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

export interface PaginatedBots {
  data: Bot[]
  total: number
}

export const botsApi = {
  async getAll(workspaceId: string, options?: { page?: number; limit?: number; status?: string }): Promise<PaginatedBots> {
    const filters: Record<string, string | number | boolean> = { workspaceId };
    if (options?.status) filters.status = options.status;

    const response = await axiosClient.get<PaginatedBots>('/bots', {
      params: {
        workspaceId,
        page: options?.page || 1,
        limit: options?.limit || 10,
        filters: JSON.stringify(filters)
      }
    });

    return response as unknown as PaginatedBots;
  },

  async getOne(id: string): Promise<Bot> {
    return axiosClient.get<Bot>(`/bots/${id}`) as unknown as Promise<Bot>;
  },

  async create(data: CreateBotDto): Promise<Bot> {
    return axiosClient.post('/bots', data, {
      params: { workspaceId: data.workspaceId }
    }) as unknown as Promise<Bot>
  },

  async update(id: string, data: UpdateBotDto): Promise<Bot> {
    return axiosClient.patch(`/bots/${id}`, data) as unknown as Promise<Bot>
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
    const response = await axiosClient.post<{ answer: string; sources: any[] }>(`/knowledge-bases/chat`, {
      message,
      botId,
      knowledgeBaseIds: knowledgeBaseIds && knowledgeBaseIds.length > 0 ? knowledgeBaseIds : undefined,
      conversationHistory: conversationHistory?.map(m => ({
        role: m.role,
        content: m.content
      })),
    }) as unknown as { answer: string; sources: any[] };

    return {
      response: response.answer,
      sources: response.sources || []
    };
  },

  async getWidgetAppearance(botId: string): Promise<any> {
    return await axiosClient.get(`/bots/${botId}/widget/appearance`)
  },

  async updateWidgetAppearance(botId: string, data: Record<string, any>): Promise<any> {
    return await axiosClient.put(`/bots/${botId}/widget/appearance`, data)
  },
}

export const executeBotFunction = botsApi.executeFunction.bind(botsApi)
export type { Bot };
