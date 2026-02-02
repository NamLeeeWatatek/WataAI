import { axiosClient } from '../axios-client';
import { User, CreateUserDto, UpdateUserDto } from '../types/user';
import { InfinityPaginationResponseDto } from '@/lib/types/pagination';

export const usersApi = {
    findAll: async (query?: any): Promise<InfinityPaginationResponseDto<User>> => {
        return axiosClient.get('/users', {
            params: query,
        }) as any;
    },

    findOne: async (id: string): Promise<User> => {
        return axiosClient.get(`/users/${id}`) as any;
    },

    create: async (data: CreateUserDto): Promise<User> => {
        return axiosClient.post('/users', data) as any;
    },

    update: async (id: string, data: UpdateUserDto): Promise<User> => {
        return axiosClient.patch(`/users/${id}`, data) as any;
    },

    remove: async (id: string): Promise<void> => {
        await axiosClient.delete(`/users/${id}`);
    },

    verifyEmail: async (id: string): Promise<User> => {
        return axiosClient.post(`/users/${id}/verify-email`) as any;
    },

    activate: async (id: string): Promise<User> => {
        return axiosClient.post(`/users/${id}/activate`) as any;
    },

    deactivate: async (id: string): Promise<User> => {
        return axiosClient.post(`/users/${id}/deactivate`) as any;
    },
};
