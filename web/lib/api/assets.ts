import { axiosClient } from '../axios-client';
import { Asset } from '../types/asset';

export const assetsApi = {
    findAll: async (query?: any): Promise<Asset[]> => {
        const response = await axiosClient.get<Asset[]>('/assets', {
            params: query,
        });
        return response as unknown as Asset[];
    },

    findOne: async (id: string): Promise<Asset> => {
        const response = await axiosClient.get<Asset>(`/assets/${id}`);
        return response as unknown as Asset;
    },

    remove: async (id: string): Promise<void> => {
        await axiosClient.delete(`/assets/${id}`);
    },

    removeMany: async (ids: string[]): Promise<void> => {
        // Fallback or implementation for bulk delete if backend supports it
        for (const id of ids) {
            await axiosClient.delete(`/assets/${id}`);
        }
    }
};
