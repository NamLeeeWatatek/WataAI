import axiosClient from '../axios-client';
import { IPaginationOptions } from '../types/pagination-options';
import { InfinityPaginationResponseDto } from '../types/infinity-pagination';

export interface Category {
    id: string;
    name: string;
    slug: string;
    description?: string;
    icon?: string;
    type: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateCategoryDto {
    name: string;
    slug: string;
    description?: string;
    icon?: string;
    type?: string;
}

export interface UpdateCategoryDto {
    name?: string;
    slug?: string;
    description?: string;
    icon?: string;
    type?: string;
}

export const categoriesApi = {
    create: async (data: CreateCategoryDto): Promise<Category> => {
        return axiosClient.post('/categories', data);
    },

    findAll: async ({ page, limit, type, search }: IPaginationOptions & { type?: string; search?: string }): Promise<InfinityPaginationResponseDto<Category>> => {
        return axiosClient.get('/categories', {
            params: {
                page,
                limit,
                type,
                search,
            },
        });
    },

    findById: async (id: string): Promise<Category> => {
        return axiosClient.get(`/categories/${id}`);
    },

    update: async (id: string, data: UpdateCategoryDto): Promise<Category> => {
        return axiosClient.patch(`/categories/${id}`, data);
    },

    delete: async (id: string): Promise<void> => {
        return axiosClient.delete(`/categories/${id}`);
    },
};
