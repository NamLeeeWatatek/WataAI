import axiosClient from '../axios-client'

export interface AgentConfig {
    id?: number
    flow_id: number
    name: string
    personality: string
    tone: string
    language: string
    system_prompt: string
    temperature: number
    max_tokens: number
    model: string
}

export const agentConfigsApi = {
    async getOne(flowId: number): Promise<AgentConfig> {
        return await axiosClient.get(`/agent-configs/${flowId}`)
    },

    async create(data: AgentConfig): Promise<AgentConfig> {
        return await axiosClient.post('/agent-configs/', data)
    },

    async update(flowId: number, data: Partial<AgentConfig>): Promise<AgentConfig> {
        return await axiosClient.patch(`/agent-configs/${flowId}`, data)
    }
}
