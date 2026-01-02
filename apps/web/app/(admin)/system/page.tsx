'use client';

import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Wrench, Sparkles, ArrowRight, Users, ShieldCheck, Activity, Search, Settings, Plus } from 'lucide-react';
import { PageShell } from '@/components/layout/PageShell';
import { useSystemStats } from '@/lib/hooks/useSystemStats';
import { AdminStatsCards } from '@/components/features/admin/AdminStatsCards';
import { AdminCharts } from '@/components/features/admin/AdminCharts';
import { Skeleton } from '@/components/ui/Skeleton';
import { motion } from 'framer-motion';

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
            <div className="space-y-10 pt-4 pb-20">
                {/* 1. Quick Actions / Navigation (Streamlined) */}
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Quick Management</h2>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {adminSections.map((section) => {
                            const Icon = section.icon;
                            return (
                                <button
                                    key={section.title}
                                    onClick={() => router.push(section.href as any)}
                                    className="flex items-center gap-3 p-4 rounded-xl border border-border/40 bg-card hover:bg-accent hover:border-primary/20 transition-all text-left group"
                                >
                                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold truncate">{section.title}</div>
                                        <div className="text-[10px] text-muted-foreground truncate uppercase font-semibold opacity-70"> Manage </div>
                                    </div>
                                </button>
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
            </div>
        </PageShell>
    );
}
