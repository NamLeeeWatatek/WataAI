'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Wrench, Sparkles, Users, ShieldCheck, Settings } from 'lucide-react';
import { PageShell } from '@/components/layout/PageShell';
import { useSystemStats } from '@/lib/hooks/useSystemStats';
import { DashboardQuickAction } from '@/components/features/admin/DashboardQuickAction';
import { AdminStatsCards } from '@/components/features/admin/AdminStatsCards';
import { AdminCharts } from '@/components/features/admin/AdminCharts';
import { QdrantMaintenanceCard } from '@/components/features/admin/QdrantMaintenanceCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { AdminPaymentManagement } from '@/components/features/admin/AdminPaymentManagement';
import { AdminSystemStatus } from '@/components/features/admin/AdminSystemStatus';
import { AdminSystemTools } from '@/components/features/admin/AdminSystemTools';

export default function AdminDashboardPage() {
    const router = useRouter();
    const { data: stats, isLoading } = useSystemStats();

    const adminSections = [
        {
            title: 'User Management',
            description: 'Platform users & access',
            icon: Users,
            href: '/system/users',
            color: 'blue'
        },
        {
            title: 'Roles & Permissions',
            description: 'RBAC configurations',
            icon: ShieldCheck,
            href: '/system/roles-permissions',
            color: 'purple'
        },
        {
            title: 'Creation Tools',
            description: 'AI tool configurations',
            icon: Wrench,
            href: '/system/creation-tools',
            color: 'amber'
        },
        {
            title: 'Templates',
            description: 'Reusable prompt library',
            icon: Sparkles,
            href: '/system/templates',
            color: 'emerald'
        },
    ];

    return (
        <PageShell
            title="System Administration"
            description="Global platform oversight and configuration"
        >
            <div className="pt-4 pb-20">
                <Tabs defaultValue="overview" className="space-y-6">
                    <div className="flex items-center justify-between">
                        <TabsList className="grid w-full grid-cols-4 lg:w-[500px]">
                            <TabsTrigger value="overview">Overview</TabsTrigger>
                            <TabsTrigger value="payments">Payments</TabsTrigger>
                            <TabsTrigger value="health">System Health</TabsTrigger>
                            <TabsTrigger value="tools">System Tools</TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="overview" className="space-y-10 animate-in fade-in-50 duration-500">
                        {/* 1. Quick Actions / Navigation (Streamlined) */}
                        <section>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Quick Management</h2>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {adminSections.map((section) => {
                                    const Icon = section.icon;
                                    return (
                                        <DashboardQuickAction
                                            key={section.title}
                                            title={section.title}
                                            description={section.description}
                                            icon={Icon}
                                            onClick={() => router.push(section.href as any)}
                                            color={section.color as any}
                                        />
                                    );
                                })}
                            </div>
                        </section>

                        {/* 2. Key Metrics Cards */}
                        <section>
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Platform Metrics</h2>
                            </div>
                            {isLoading ? (
                                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                                    {[1, 2, 3, 4].map((i) => (
                                        <Skeleton key={i} className="h-32 rounded-xl" />
                                    ))}
                                </div>
                            ) : (
                                <AdminStatsCards stats={stats} />
                            )}
                        </section>

                        {/* 3. Deep Insights (Charts) */}
                        <section className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Business Intelligence</h2>
                                <Button variant="ghost" size="sm" className="text-xs gap-2">
                                    <Settings className="w-3 h-3" /> Configure Dashboard
                                </Button>
                            </div>

                            {isLoading ? (
                                <div className="grid gap-6 md:grid-cols-3">
                                    <Skeleton className="h-[400px] md:col-span-2 rounded-xl" />
                                    <Skeleton className="h-[400px] rounded-xl" />
                                    <Skeleton className="h-[350px] md:col-span-3 rounded-xl" />
                                </div>
                            ) : (
                                <AdminCharts stats={stats} />
                            )}
                        </section>

                        {/* 4. Danger Zone / Maintenance */}
                        <QdrantMaintenanceCard />
                    </TabsContent>

                    <TabsContent value="payments" className="animate-in fade-in-50 duration-500">
                        <AdminPaymentManagement />
                    </TabsContent>

                    <TabsContent value="health" className="animate-in fade-in-50 duration-500">
                        <AdminSystemStatus />
                    </TabsContent>

                    <TabsContent value="tools" className="animate-in fade-in-50 duration-500">
                        <AdminSystemTools />
                    </TabsContent>
                </Tabs>
            </div>
        </PageShell>
    );
}
