import { axiosClient } from '../axios-client';
import { CreateCreationJobDto, CreationJob } from '../types/creation-job';
import { CreationJobPublication } from '../types/publication';

export const creationJobsApi = {
    create: async (data: CreateCreationJobDto): Promise<CreationJob> => {
        const response = await axiosClient.post<CreationJob>('/creation-jobs', data);
        return response as unknown as CreationJob;
    },

    findAll: async (query?: any): Promise<{ data: CreationJob[]; hasNextPage: boolean; total: number }> => {
        const response = await axiosClient.get<{ data: CreationJob[]; hasNextPage: boolean; total: number }>('/creation-jobs', {
            params: query,
            paramsSerializer: (params) => {
                const searchParams = new URLSearchParams();
                Object.keys(params).forEach(key => {
                    const value = params[key];
                    if (value === undefined || value === null) return;
                    if (Array.isArray(value)) {
                        value.forEach(v => searchParams.append(key, v));
                    } else {
                        searchParams.append(key, value);
                    }
                });
                return searchParams.toString();
            },
        });
        return response as unknown as { data: CreationJob[]; hasNextPage: boolean; total: number };
    },

    findOne: async (id: string): Promise<CreationJob> => {
        const response = await axiosClient.get<CreationJob>(`/creation-jobs/${id}`);
        return response as unknown as CreationJob;
    },

    remove: async (id: string): Promise<void> => {
        await axiosClient.delete(`/creation-jobs/${id}`);
    },

    cancel: async (id: string): Promise<void> => {
        await axiosClient.post(`/creation-jobs/${id}/cancel`);
    },

    removeMany: async (ids: string[]): Promise<void> => {
        await axiosClient.post('/creation-jobs/bulk-delete', { ids });
    },

    preview: async (data: CreateCreationJobDto): Promise<any> => {
        const response = await axiosClient.post<any>('/creation-jobs/preview', data);
        return response;
    },

    getPublications: async (id: string): Promise<CreationJobPublication[]> => {
        const response = await axiosClient.get<CreationJobPublication[]>(`/creation-jobs/${id}/publications`);
        return response as unknown as CreationJobPublication[];
    },

    generatePostDraft: async (id: string, data: any): Promise<{ draft: string }> => {
        return await axiosClient.post(`/creation-jobs/${id}/post-draft`, data);
    },

    postToChannels: async (id: string, data: any): Promise<any> => {
        return await axiosClient.post(`/creation-jobs/${id}/post`, data);
    },

    executeAction: async (jobId: string, actionId: string, inputs: any): Promise<any> => {
        return await axiosClient.post(`/creation-jobs/${jobId}/actions/${actionId}`, { inputs });
    }
};
