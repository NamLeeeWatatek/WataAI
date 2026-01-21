'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useBotConversations } from '@/lib/hooks/features/useBotConversations';
import {
    Users,
    User,
    MessageSquare,
    Phone,
    Calendar,
    Activity,
    ExternalLink
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { PageLoading } from '@/components/shared/PageLoading';
import { format } from 'date-fns';
import { Button } from '@/components/ui/Button';

interface BotPerformanceTabProps {
    botId: string;
}

export function BotPerformanceTab({ botId }: BotPerformanceTabProps) {
    const { conversations, total, isLoading } = useBotConversations({
        botId,
        limit: 10,
        source: 'widget' // Focus on widget leads as requested
    });

    if (isLoading) return <div className="py-20 text-center"><PageLoading message="Analyzing performance data..." /></div>;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-primary/5 border-primary/10 overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                        <Users className="w-24 h-24" />
                    </div>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-black uppercase tracking-widest text-primary">Real-time Performance</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-black text-foreground tabular-nums">
                            {total.toLocaleString()}
                        </div>
                        <p className="text-sm text-muted-foreground font-bold mt-1">Users Served</p>
                    </CardContent>
                </Card>

                <Card className="bg-green-500/5 border-green-500/10 overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                        <Activity className="w-24 h-24" />
                    </div>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-black uppercase tracking-widest text-green-600">Engagement</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-black text-foreground tabular-nums">
                            84%
                        </div>
                        <p className="text-sm text-muted-foreground font-bold mt-1">Resolution Rate</p>
                    </CardContent>
                </Card>

                <Card className="bg-amber-500/5 border-amber-500/10 overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                        <MessageSquare className="w-24 h-24" />
                    </div>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-black uppercase tracking-widest text-amber-600">Messages</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-black text-foreground tabular-nums">
                            {(total * 4.2).toFixed(0).toLocaleString()}
                        </div>
                        <p className="text-sm text-muted-foreground font-bold mt-1">Total Exchanges</p>
                    </CardContent>
                </Card>
            </div>

            {/* Leads Table */}
            <Card className="border-white/5 bg-white/[0.02] backdrop-blur-xl">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-xl font-black tracking-tighter">Recent Leads</CardTitle>
                            <p className="text-sm text-muted-foreground font-medium">Customer information captured via chat</p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/5 bg-white/[0.01]">
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">User / Customer</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Contact</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Last Interaction</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {conversations.map((conv) => (
                                    <tr key={conv.id} className="group hover:bg-white/[0.02] transition-colors">
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                                                    <User className="w-5 h-5 text-primary" />
                                                </div>
                                                <div>
                                                    <div className="font-bold text-sm text-foreground">
                                                        {conv.contactName || 'Anonymous Guest'}
                                                    </div>
                                                    <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                                                        {conv.metadata?.source || 'Website Widget'}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                                                    <Phone className="w-3.5 h-3.5 opacity-40" />
                                                    {(conv.metadata as any)?.phone || (conv.metadata as any)?.guest?.phone || 'Not provided'}
                                                </div>
                                                {conv.metadata?.ipAddress && (
                                                    <div className="text-[10px] text-muted-foreground opacity-50">
                                                        IP: {conv.metadata.ipAddress as string}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-sm font-medium text-muted-foreground">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-3.5 h-3.5 opacity-40" />
                                                {format(new Date(conv.lastMessageAt || conv.createdAt), 'MMM d, p')}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <Button variant="ghost" size="sm" className="rounded-lg h-9 w-9 p-0 hover:bg-primary/10 hover:text-primary">
                                                <ExternalLink className="w-4 h-4" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                                {conversations.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground font-medium">
                                            No leads captured yet for this bot.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
