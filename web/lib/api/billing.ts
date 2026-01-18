import { axiosClient } from '@/lib/axios-client';

export interface Plan {
  id: string;
  name: string;
  description: string;
  priceMonthly: number;
  features: Record<string, any>;
  stripePriceId?: string;
  maxMessages: number;
  maxStorageGb: number;
}

export const billingApi = {
  getPlans: async () => {
    const data = await axiosClient.get<Plan[]>('/subscriptions/plans');
    return Array.isArray(data) ? data : [];
  },

  getSubscription: async (workspaceId: string) => {
    const data = await axiosClient.get(`/subscriptions/workspace/${workspaceId}`);
    return data;
  },

  createCheckoutSession: async (workspaceId: string, planId: string, provider: 'stripe' | 'payos' = 'stripe') => {
    const data = await axiosClient.post('/billing/checkout', {
      workspaceId,
      planId,
      provider,
    });
    return data; // { url: string }
  },

  createPortalSession: async (workspaceId: string) => {
    const data = await axiosClient.post('/billing/portal', {
      workspaceId,
    });
    return data; // { url: string }
  },

  getStartQuota: async (workspaceId: string) => { // Using explicit start check for now
    const data = await axiosClient.get(`/subscriptions/workspace/${workspaceId}/quota`);
    return data;
  },

  getInvoices: async (workspaceId: string) => {
    const data = await axiosClient.get(`/subscriptions/workspace/${workspaceId}/invoices`);
    return Array.isArray(data) ? data : [];
  }
};
