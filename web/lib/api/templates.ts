import { axiosClient } from '../axios-client';
import { Template } from '../types/template';

export const templatesApi = {
    findAll: async (query?: any): Promise<{ data: Template[]; hasNextPage: boolean; total: number }> => {
        const params = { ...query };
        if (params.filters && typeof params.filters === 'object') {
            params.filters = JSON.stringify(params.filters);
        }
        return axiosClient.get('/templates', { params }) as any;
    },

    findOne: async (id: string): Promise<Template> => {
        return axiosClient.get(`/templates/${id}`) as any;
    },

    findByWorkspace: async (workspaceId: string): Promise<Template[]> => {
        return axiosClient.get(`/templates/workspace/${workspaceId}`) as any;
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
        return axiosClient.post(`/templates/${id}/activate`) as any;
    },

    deactivate: async (id: string): Promise<Template> => {
        return axiosClient.post(`/templates/${id}/deactivate`) as any;
    },

    execute: async (id: string, data: any): Promise<{ executionId: string; status: string }> => {
        return axiosClient.post(`/templates/${id}/execute`, data) as any;
    },

    bulkUpdate: async (ids: string[], data: Partial<Template>): Promise<void> => {
        await axiosClient.patch('/templates/bulk/update', { ids, data });
    },

    bulkDelete: async (ids: string[]): Promise<void> => {
        await axiosClient.post('/templates/bulk/delete', { ids });
    },

    import: async (templates: any[], workspaceId: string): Promise<Template[]> => {
        return axiosClient.post('/templates/import', { templates, workspaceId }) as any;
    },

    export: async (ids: string[]): Promise<Template[]> => {
        return axiosClient.get('/templates/export', { params: { ids: ids.join(',') } }) as any;
    }
};
