import { useQuery } from '@tanstack/react-query';
import { adminApi, type SystemHealth, type InvoiceResponse } from '@/lib/api/admin';

export const adminKeys = {
    all: ['admin'] as const,
    health: () => [...adminKeys.all, 'system-health'] as const,
    invoices: (params: Record<string, any>) => [...adminKeys.all, 'invoices', params] as const,
};

export function useSystemHealth() {
    return useQuery({
        queryKey: adminKeys.health(),
        queryFn: async () => {
            const result = await adminApi.getSystemHealth();
            return result as unknown as SystemHealth;
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
            const result = await adminApi.getInvoices(params);
            return result as unknown as InvoiceResponse;
        },
        placeholderData: (previousData) => previousData, // Keep previous data while fetching next page
    });
}
