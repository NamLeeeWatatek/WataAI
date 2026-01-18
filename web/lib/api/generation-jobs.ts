import { axiosClient } from '../axios-client';
import { CreateGenerationJobDto, GenerationJob } from '../types/generation-job';
import { IPaginationOptions } from '../types/pagination-options';

export const generationJobsApi = {
    create: async (data: CreateGenerationJobDto): Promise<GenerationJob> => {
        const response = await axiosClient.post<GenerationJob>('/generation-jobs', data);
        return response as unknown as GenerationJob;
    },

    findAll: async (query?: any): Promise<{ data: GenerationJob[]; hasNextPage: boolean }> => {
        const response = await axiosClient.get<{ data: GenerationJob[]; hasNextPage: boolean }>('/generation-jobs', { params: query });
        return response as unknown as { data: GenerationJob[]; hasNextPage: boolean };
    },

    findOne: async (id: string): Promise<GenerationJob> => {
        const response = await axiosClient.get<GenerationJob>(`/generation-jobs/${id}`);
        return response as unknown as GenerationJob;
    },
};
