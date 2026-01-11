'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Check, Loader2 } from 'lucide-react';
import { billingApi, Plan } from '@/lib/api/billing';
import { toast } from 'sonner';
import { PaymentMethodDialog } from './PaymentMethodDialog';

interface PricingTableProps {
    plans: Plan[];
    currentPlanId?: string;
    workspaceId: string;
}

export function PricingTable({ plans = [], currentPlanId, workspaceId }: PricingTableProps) {
    const safePlans = Array.isArray(plans) ? plans : [];
    const [loadingId, setLoadingId] = useState<string | null>(null);
    const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
    const [showPaymentDialog, setShowPaymentDialog] = useState(false);

    const handleUpgradeClick = (planId: string) => {
        const plan = safePlans.find(p => p.id === planId);
        // If plan is free or price is 0, skip payment dialog and process directly
        if (plan && (plan.name === 'Free' || plan.priceMonthly <= 0)) {
            handleDirectSwitch(planId);
            return;
        }

        setSelectedPlanId(planId);
        setShowPaymentDialog(true);
    };

    const handleDirectSwitch = async (planId: string) => {
        try {
            setLoadingId(planId);
            // We use 'stripe' as default provider for free plan switch, backend handles logic
            const response: any = await billingApi.createCheckoutSession(workspaceId, planId, 'stripe');
            if (response?.url) {
                window.location.href = response.url;
            } else {
                // Optimization: if no URL returned but success (e.g. direct switch), reload or toast
                toast.success('Plan updated successfully');
                window.location.reload();
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to change plan');
        } finally {
            setLoadingId(null);
        }
    };

    const handlePaymentSelect = async (provider: 'stripe' | 'payos') => {
        if (!selectedPlanId) return;

        try {
            setLoadingId(selectedPlanId);
            setShowPaymentDialog(false); // Close dialog while loading

            const response: any = await billingApi.createCheckoutSession(workspaceId, selectedPlanId, provider);
            const url = response?.url;
            if (url) {
                window.location.href = url;
            } else {
                toast.error('Could not create checkout session');
                setLoadingId(null);
            }
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || 'Failed to start checkout');
            setLoadingId(null);
        }
    };

    return (
        <>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3 lg:gap-8">
                {safePlans.map((plan) => {
                    const isCurrent = currentPlanId === plan.id;
                    const features = plan.features?.list || [];

                    return (
                        <Card
                            key={plan.id}
                            className={`flex flex-col relative \${
                  isCurrent ? 'border-primary ring-1 ring-primary' : ''
                }`}
                        >
                            {isCurrent && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                    <Badge variant="default" className="bg-primary hover:bg-primary">
                                        Current Plan
                                    </Badge>
                                </div>
                            )}

                            <CardHeader>
                                <CardTitle className="text-xl font-bold">{plan.name}</CardTitle>
                                <CardDescription>{plan.description}</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1">
                                <div className="mt-2 mb-6 text-3xl font-bold">
                                    ${plan.priceMonthly}
                                    <span className="text-sm font-normal text-muted-foreground">
                                        /month
                                    </span>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-sm">
                                        <Check className="h-4 w-4 text-green-500" />
                                        <span>{plan.maxMessages.toLocaleString()} Messages/mo</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <Check className="h-4 w-4 text-green-500" />
                                        <span>{plan.maxStorageGb} GB Storage</span>
                                    </div>
                                    {Array.isArray(features) && features.map((feature: string, i: number) => (
                                        <div key={i} className="flex items-center gap-2 text-sm">
                                            <Check className="h-4 w-4 text-primary" />
                                            <span>{feature}</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button
                                    className="w-full"
                                    variant={isCurrent ? 'outline' : 'default'}
                                    disabled={isCurrent || !!loadingId}
                                    onClick={() => handleUpgradeClick(plan.id)}
                                >
                                    {loadingId === plan.id ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : isCurrent ? (
                                        'Active'
                                    ) : (
                                        'Upgrade'
                                    )}
                                </Button>
                            </CardFooter>
                        </Card>
                    );
                })}
            </div>

            <PaymentMethodDialog
                open={showPaymentDialog}
                onOpenChange={setShowPaymentDialog}
                onSelect={handlePaymentSelect}
                loading={!!loadingId}
            />
        </>
    );
}
