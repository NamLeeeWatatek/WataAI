import { axiosClient } from '../axios-client';
import { User, CreateUserDto, UpdateUserDto } from '../types/user';
import { InfinityPaginationResponseDto } from '@/lib/types/pagination';

export const usersApi = {
    findAll: async (query?: any): Promise<InfinityPaginationResponseDto<User>> => {
        const response = await axiosClient.get<InfinityPaginationResponseDto<User>>('/users', {
            params: query,
        });
        return response as unknown as InfinityPaginationResponseDto<User>;
    },

    findOne: async (id: string): Promise<User> => {
        const response = await axiosClient.get<User>(`/users/${id}`);
        return response as unknown as User;
    },

    create: async (data: CreateUserDto): Promise<User> => {
        const response = await axiosClient.post<User>('/users', data);
        return response as unknown as User;
    },

    update: async (id: string, data: UpdateUserDto): Promise<User> => {
        const response = await axiosClient.patch<User>(`/users/${id}`, data);
        return response as unknown as User;
    },

    remove: async (id: string): Promise<void> => {
        await axiosClient.delete(`/users/${id}`);
    },

    verifyEmail: async (id: string): Promise<User> => {
        const response = await axiosClient.post<User>(`/users/${id}/verify-email`);
        return response as unknown as User;
    },

    activate: async (id: string): Promise<User> => {
        const response = await axiosClient.post<User>(`/users/${id}/activate`);
        return response as unknown as User;
    },

    deactivate: async (id: string): Promise<User> => {
        const response = await axiosClient.post<User>(`/users/${id}/deactivate`);
        return response as unknown as User;
    },
};
