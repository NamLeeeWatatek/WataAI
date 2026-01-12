import { useQuery } from '@tanstack/react-query';
import axiosClient from '@/lib/axios-client';

export const adminKeys = {
    all: ['admin'] as const,
    health: () => [...adminKeys.all, 'system-health'] as const,
    invoices: (params: Record<string, any>) => [...adminKeys.all, 'invoices', params] as const,
};

export interface SystemHealth {
    health: string;
    uptime: number;
    resources: {
        cpu: number;
        memory: {
            total: number;
            used: number;
            percent: number;
        };
        storage: {
            percent: number;
        };
    };
    services: {
        name: string;
        status: 'operational' | 'degraded' | 'down';
        uptime: string;
    }[];
}

export interface Invoice {
    id: string;
    amount: number;
    currency: string;
    status: string;
    periodStart: string;
    createdAt: string;
    providerInvoiceId: string;
    subscription?: {
        planId: string;
    };
    user?: {
        email: string;
        name: string;
    }
}

export interface InvoiceResponse {
    data: Invoice[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export function useSystemHealth() {
    return useQuery({
        queryKey: adminKeys.health(),
        queryFn: async () => {
            const result = await axiosClient.get<SystemHealth>('/stats/admin/control-plane');
            return result;
        },
        refetchInterval: 10000,
    });
}

export function useAdminInvoices(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
}) {
    return useQuery({
        queryKey: adminKeys.invoices(params),
        queryFn: async () => {
            const result = await axiosClient.get<InvoiceResponse>('/billing/admin/invoices', { params });
            return result;
        },
        placeholderData: (previousData) => previousData, // Keep previous data while fetching next page
    });
}
