'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PricingTable } from '@/components/billing/PricingTable';
import { billingApi, Plan } from '@/lib/api/billing';
import { useWorkspace } from '@/lib/hooks/useWorkspace';
import { Loader2, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Progress } from '@/components/ui/Progress';
import { toast } from 'sonner';
import { BillingHistoryTable } from '@/components/billing/BillingHistoryTable';
import { useSearchParams } from 'next/navigation';

export function BillingTab() {
  const { t } = useTranslation();
  const { workspace } = useWorkspace();
  const searchParams = useSearchParams();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] = useState<any>(null);
  const [quota, setQuota] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    if (!workspace) return;

    async function loadData() {
      try {
        const [plansData, subData, quotaData, invoicesData] = await Promise.all([
          billingApi.getPlans(),
          billingApi.getSubscription(workspace!.id),
          billingApi.getStartQuota(workspace!.id),
          billingApi.getInvoices(workspace!.id),
        ]);
        setPlans(plansData);
        setSubscription(subData);
        setQuota(quotaData);
        setInvoices(invoicesData);

        // Check success status
        if (searchParams.get('status') === 'success') {
          toast.success('Subscription updated successfully!');
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [workspace, searchParams]);

  const handlePortal = async () => {
    try {
      setPortalLoading(true);
      const response: any = await billingApi.createPortalSession(workspace!.id);
      const url = response?.url;
      if (url) {
        window.location.href = url;
      } else {
        toast.error('Failed to get portal URL');
      }
    } catch (error) {
      toast.error('Failed to open billing portal');
    } finally {
      setPortalLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-500">
      {/* Usage Section */}
      {quota && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Message Usage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {quota.messagesUsed.toLocaleString()} / {subscription?.plan?.maxMessages?.toLocaleString() || '100'}
              </div>
              <Progress
                value={(quota.messagesUsed / (subscription?.plan?.maxMessages || 100)) * 100}
                className="mt-2"
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Storage Usage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Number(quota.storageUsedGb).toFixed(1)} / {subscription?.plan?.maxStorageGb || 1} GB
              </div>
              <Progress
                value={(Number(quota.storageUsedGb) / (subscription?.plan?.maxStorageGb || 1)) * 100}
                className="mt-2"
              />
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold tracking-tight">Available Plans</h2>
        {subscription?.stripeCustomerId && (
          <Button variant="outline" onClick={handlePortal} disabled={portalLoading}>
            {portalLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <CreditCard className="mr-2 h-4 w-4" />
            Manage Billing
          </Button>
        )}
      </div>

      <PricingTable
        plans={plans}
        currentPlanId={subscription?.planId}
        workspaceId={workspace!.id}
      />

      <div className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight">Billing History</h2>
        <BillingHistoryTable invoices={invoices} />
      </div>
    </div>
  );
}
