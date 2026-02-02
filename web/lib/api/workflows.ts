import { axiosClient as client } from '@/lib/axios-client';
import type { Workflow } from '@/components/features/workflows/WorkflowCard';

export const workflowsApi = {
    getAll: async (params?: any): Promise<Workflow[]> => {
        const response = await client.get('/workflows', { params });
        const data = response as unknown as any[];
        return data.map((item) => ({
            ...item,
            author: item.owner ? {
                name: item.owner.name,
                avatarUrl: item.owner.avatarUrl,
            } : { name: 'Unknown' },
        })) as Workflow[];
    },

    getOne: async (id: string): Promise<Workflow> => {
        const response = await client.get(`/workflows/${id}`);
        const item = response as unknown as any;
        return {
            ...item,
            author: item.owner ? {
                name: item.owner.name,
                avatarUrl: item.owner.avatarUrl,
            } : { name: 'Unknown' },
        } as Workflow;
    },

    create: async (data: any): Promise<Workflow> => {
        const response = await client.post('/workflows', data);
        return response as unknown as Workflow;
    },

    update: async (id: string, data: any): Promise<Workflow> => {
        const response = await client.patch(`/workflows/${id}`, data);
        return response as unknown as Workflow;
    },

    delete: async (id: string) => {
        await client.delete(`/workflows/${id}`);
    },
    execute: async (id: string, data: any) => {
        return await client.post(`/flows/${id}/execute`, data);
    }
};
