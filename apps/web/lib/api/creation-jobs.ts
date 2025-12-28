import { axiosClient } from '../axios-client';
import { CreateCreationJobDto, CreationJob } from '../types/creation-job';

export const creationJobsApi = {
    create: async (data: CreateCreationJobDto): Promise<CreationJob> => {
        const response = await axiosClient.post<CreationJob>('/creation-jobs', data);
        return response as unknown as CreationJob;
    },

    findAll: async (query?: any): Promise<{ data: CreationJob[]; hasNextPage: boolean; total: number }> => {
        const response = await axiosClient.get<{ data: CreationJob[]; hasNextPage: boolean; total: number }>('/creation-jobs', {
            params: query,
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

    removeMany: async (ids: string[]): Promise<void> => {
        await axiosClient.post('/creation-jobs/bulk-delete', { ids });
    },
};
