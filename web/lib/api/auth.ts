import { axiosClient } from '../axios-client';

export const authApi = {
    register: (data: any) =>
        axiosClient.post('/auth/email/register', data),

    confirmEmail: (hash: string) =>
        axiosClient.post('/auth/email/confirm', { hash }),

    confirmNewEmail: (hash: string) =>
        axiosClient.post('/auth/email/confirm/new', { hash }),

    forgotPassword: (email: string) =>
        axiosClient.post('/auth/forgot/password', { email }),

    resetPassword: (data: any) =>
        axiosClient.post('/auth/reset/password', data),

    me: () =>
        axiosClient.get('/auth/me'),

    updateMe: (data: any) =>
        axiosClient.patch('/auth/me', data),
};
