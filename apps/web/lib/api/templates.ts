import { axiosClient } from '../axios-client';
import { Template } from '../types/template';

export const templatesApi = {
    findAll: async (query?: any): Promise<{ data: Template[]; hasNextPage: boolean; total: number }> => {
        const response = await axiosClient.get<{ data: Template[]; hasNextPage: boolean; total: number }>('/templates', { params: query });
        return response as unknown as { data: Template[]; hasNextPage: boolean; total: number };
    },

    findOne: async (id: string): Promise<Template> => {
        const response = await axiosClient.get<Template>(`/templates/${id}`);
        return response as unknown as Template;
    },

    findByWorkspace: async (workspaceId: string): Promise<Template[]> => {
        const response = await axiosClient.get<Template[]>(`/templates/workspace/${workspaceId}`);
        return response as unknown as Template[];
    },

    findByCreationTool: async (creationToolId: string): Promise<Template[]> => {
        const data: any = await axiosClient.get(`/templates/by-tool/${creationToolId}`);
        return Array.isArray(data) ? data : [];
    },

    create: async (template: Partial<Template>): Promise<Template> => {
        const data: any = await axiosClient.post('/templates', template);
        return data;
    },

    update: async (id: string, template: Partial<Template>): Promise<Template> => {
        const data: any = await axiosClient.patch(`/templates/${id}`, template);
        return data;
    },

    delete: async (id: string): Promise<void> => {
        await axiosClient.delete(`/templates/${id}`);
    },

    activate: async (id: string): Promise<Template> => {
        return axiosClient.post<Template>(`/templates/${id}/activate`) as unknown as Template;
    },

    deactivate: async (id: string): Promise<Template> => {
        return axiosClient.post<Template>(`/templates/${id}/deactivate`) as unknown as Template;
    },

    execute: async (id: string, data: any): Promise<{ executionId: string; status: string }> => {
        return axiosClient.post<{ executionId: string; status: string }>(`/templates/${id}/execute`, data) as unknown as { executionId: string; status: string };
    },

    bulkUpdate: async (ids: string[], data: Partial<Template>): Promise<void> => {
        await axiosClient.patch('/templates/bulk/update', { ids, data });
    },

    bulkDelete: async (ids: string[]): Promise<void> => {
        await axiosClient.post('/templates/bulk/delete', { ids });
    }
};

