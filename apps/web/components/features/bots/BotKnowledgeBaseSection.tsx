'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Switch } from '@/components/ui/Switch';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/Dialog';
import { Database, Plus, Search, Trash2, BookOpen, Link as LinkIcon, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import axiosClient from '@/lib/axios-client';
import { cn } from '@/lib/utils';
import type { KnowledgeBase } from '@/lib/types/knowledge-base';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Input } from '@/components/ui/Input';

interface Props {
    botId: string;
    workspaceId?: string;
    onRefresh?: () => void;
}

interface BotKnowledgeBase {
    id: string;
    botId: string;
    knowledgeBaseId: string;
    isActive: boolean;
    knowledgeBase?: KnowledgeBase;
    createdAt: string;
    updatedAt: string;
}

export function BotKnowledgeBaseSection({ botId, workspaceId, onRefresh }: Props) {
    const [linkedKnowledgeBases, setLinkedKnowledgeBases] = useState<BotKnowledgeBase[]>([]);
    const [availableKnowledgeBases, setAvailableKnowledgeBases] = useState<KnowledgeBase[]>([]);
    const [loading, setLoading] = useState(true);
    const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    // Search states for the available KBs dialog
    const [availableSearch, setAvailableSearch] = useState('');

    useEffect(() => {
        loadData();
    }, [botId, refreshKey]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [linkedResponse, availableResponse] = await Promise.all([
                axiosClient.get(`/bots/${botId}/knowledge-bases`),
                axiosClient.get(workspaceId ? `/knowledge-bases?workspaceId=${workspaceId}` : '/knowledge-bases')
            ]);

            setLinkedKnowledgeBases(Array.isArray(linkedResponse) ? linkedResponse : []);
            setAvailableKnowledgeBases(Array.isArray(availableResponse) ? availableResponse : []);
        } catch (error) {
            console.error('Failed to load knowledge bases:', error);
            toast.error('Failed to load knowledge bases');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleActive = async (row: BotKnowledgeBase, isActive: boolean) => {
        try {
            // Optimistic update
            const updated = linkedKnowledgeBases.map(kb =>
                kb.id === row.id ? { ...kb, isActive: !isActive } : kb
            );
            setLinkedKnowledgeBases(updated);

            await axiosClient.patch(`/bots/${botId}/knowledge-bases/${row.knowledgeBaseId}/toggle`, {
                isActive: !isActive,
            });

            if (onRefresh) onRefresh();
            toast.success(isActive ? 'Knowledge base deactivated' : 'Knowledge base activated');
        } catch (error: any) {
            // Revert
            setLinkedKnowledgeBases(linkedKnowledgeBases);
            toast.error(error?.response?.data?.message || 'Failed to update status');
        }
    };

    const handleUnlink = async (row: BotKnowledgeBase) => {
        if (!confirm(`Unlink "${row.knowledgeBase?.name}"?`)) return;

        try {
            setLinkedKnowledgeBases(prev => prev.filter(item => item.id !== row.id));
            await axiosClient.delete(`/bots/${botId}/knowledge-bases/${row.knowledgeBaseId}`);
            toast.success('Knowledge base unlinked');
            setRefreshKey(k => k + 1);
            if (onRefresh) onRefresh();
        } catch (error) {
            toast.error('Failed to unlink');
            setRefreshKey(k => k + 1); // reload just in case
        }
    };

    const handleLink = async (kb: KnowledgeBase) => {
        try {
            await axiosClient.post(`/bots/${botId}/knowledge-bases`, {
                knowledgeBaseId: kb.id,
            });
            toast.success('Linked successfully');
            setIsLinkDialogOpen(false);
            setRefreshKey(k => k + 1);
            if (onRefresh) onRefresh();
        } catch (error) {
            toast.error('Failed to link knowledge base');
        }
    };

    const linkedIds = new Set(linkedKnowledgeBases.map(l => l.knowledgeBaseId));
    const availableToLink = availableKnowledgeBases.filter(kb => !linkedIds.has(kb.id));

    // Linked Table Columns
    const linkedColumns: Column<BotKnowledgeBase>[] = [
        {
            key: 'name',
            label: 'Knowledge Base',
            sortable: true,
            render: (_, row) => (
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                        <BookOpen className="w-4 h-4" />
                    </div>
                    <div>
                        <div className="font-medium">{row.knowledgeBase?.name}</div>
                        <div className="text-xs text-muted-foreground line-clamp-1">{row.knowledgeBase?.description}</div>
                    </div>
                </div>
            )
        },
        {
            key: 'stats',
            label: 'Documents',
            render: (_, row) => (
                <Badge variant="outline" className="font-mono">
                    {row.knowledgeBase?.totalDocuments || 0} docs
                </Badge>
            )
        },
        {
            key: 'status',
            label: 'Status',
            render: (_, row) => (
                <div className="flex items-center gap-2">
                    <Switch
                        checked={row.isActive}
                        onCheckedChange={() => handleToggleActive(row, row.isActive)}
                    />
                    <span className="text-sm text-muted-foreground">{row.isActive ? 'Active' : 'Inactive'}</span>
                </div>
            )
        },
        {
            key: 'actions',
            label: 'Actions',
            className: 'text-right',
            render: (_, row) => (
                <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => handleUnlink(row)}>
                    <Trash2 className="w-4 h-4" />
                </Button>
            )
        }
    ];

    // Available Table Columns (for Dialog)
    const availableColumns: Column<KnowledgeBase>[] = [
        {
            key: 'name',
            label: 'Name',
            render: (_, row) => (
                <div>
                    <div className="font-medium">{row.name}</div>
                    <div className="text-xs text-muted-foreground line-clamp-1">{row.description}</div>
                </div>
            )
        },
        {
            key: 'action',
            label: '',
            className: 'text-right',
            render: (_, row) => (
                <Button size="sm" onClick={() => handleLink(row)}>
                    <LinkIcon className="w-3 h-3 mr-2" />
                    Link
                </Button>
            )
        }
    ];

    return (
        <Card className="rounded-2xl border-border/40 shadow-xl shadow-primary/5 bg-card/50 backdrop-blur-sm overflow-hidden group">
            <div className="h-1.5 w-full bg-gradient-to-r from-primary/50 via-primary to-primary/50 group-hover:via-primary/70 transition-all duration-500" />
            <CardHeader className="pb-0">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-primary/10 rounded-xl shadow-inner">
                            <Database className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <CardTitle className="text-xl font-bold tracking-tight">Knowledge Base</CardTitle>
                            <CardDescription className="text-xs font-medium">Manage the knowledge sources your bot uses</CardDescription>
                        </div>
                    </div>
                    <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="rounded-xl shadow-lg shadow-primary/10 font-bold h-10 transition-all active:scale-95">
                                <Plus className="w-4 h-4 mr-2" />
                                Link Knowledge Base
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl rounded-3xl border-border/40 bg-card/95 backdrop-blur-xl">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-black tracking-tight">Link Knowledge Base</DialogTitle>
                                <DialogDescription className="text-sm font-medium">
                                    Select from your existing knowledge bases to connect to this bot.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-6 pt-4">
                                <div className="relative group">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                    <Input
                                        placeholder="Search available knowledge bases..."
                                        className="pl-10 rounded-xl bg-muted/20 focus:bg-background border-border/50 transition-all h-11"
                                        value={availableSearch}
                                        onChange={(e) => setAvailableSearch(e.target.value)}
                                    />
                                </div>
                                <div className="max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                    <DataTable
                                        data={availableToLink.filter(kb =>
                                            kb.name.toLowerCase().includes(availableSearch.toLowerCase()) ||
                                            kb.description?.toLowerCase().includes(availableSearch.toLowerCase())
                                        )}
                                        columns={[
                                            {
                                                key: 'name',
                                                label: 'Name',
                                                render: (_, row) => (
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 rounded-lg bg-primary/5 text-primary border border-primary/10">
                                                            <BookOpen className="w-4 h-4" />
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-sm tracking-tight">{row.name}</div>
                                                            <div className="text-[10px] font-medium text-muted-foreground line-clamp-1">{row.description}</div>
                                                        </div>
                                                    </div>
                                                )
                                            },
                                            {
                                                key: 'action',
                                                label: '',
                                                className: 'text-right',
                                                render: (_, row) => (
                                                    <Button size="sm" onClick={() => handleLink(row)} className="rounded-lg h-8 px-4 font-bold text-xs shadow-md shadow-primary/5 hover:shadow-primary/10 transition-all">
                                                        <LinkIcon className="w-3.5 h-3.5 mr-2" />
                                                        Link
                                                    </Button>
                                                )
                                            }
                                        ]}
                                        searchable={false}
                                        className="border-none"
                                        tableClassName="bg-transparent"
                                        emptyMessage="No available knowledge bases found."
                                    />
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </CardHeader>
            <CardContent className="pt-6">
                <DataTable
                    data={linkedKnowledgeBases}
                    columns={[
                        {
                            key: 'name',
                            label: 'Knowledge Source',
                            sortable: true,
                            render: (_, row) => (
                                <div className="flex items-center gap-4 py-1">
                                    <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/10 shadow-inner">
                                        <BookOpen className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="font-bold text-sm tracking-tight text-foreground">{row.knowledgeBase?.name}</div>
                                        <div className="text-[10px] font-medium text-muted-foreground line-clamp-1 max-w-[300px]">{row.knowledgeBase?.description || "No description provided"}</div>
                                    </div>
                                </div>
                            )
                        },
                        {
                            key: 'stats',
                            label: 'Volume',
                            render: (_, row) => (
                                <Badge variant="secondary" className="font-mono font-bold text-[10px] px-2.5 py-0.5 bg-muted/50 border-border/40">
                                    {row.knowledgeBase?.totalDocuments || 0} items
                                </Badge>
                            )
                        },
                        {
                            key: 'status',
                            label: 'Intelligence',
                            render: (_, row) => (
                                <div className="flex items-center gap-3">
                                    <Switch
                                        checked={row.isActive}
                                        onCheckedChange={() => handleToggleActive(row, row.isActive)}
                                        className="scale-90 data-[state=checked]:bg-blue-500"
                                    />
                                    <span className={cn(
                                        "text-[10px] font-black uppercase tracking-widest transition-colors",
                                        row.isActive ? "text-blue-500" : "text-muted-foreground"
                                    )}>
                                        {row.isActive ? 'Active' : 'Offline'}
                                    </span>
                                </div>
                            )
                        },
                        {
                            key: 'actions',
                            label: '',
                            className: 'text-right',
                            render: (_, row) => (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-300"
                                    onClick={() => handleUnlink(row)}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            )
                        }
                    ]}
                    tableClassName="border-none shadow-none bg-transparent"
                    loading={loading}
                    emptyMessage="Link sources to enhance your bot's intelligence."
                    emptyComponent={
                        <div className="flex flex-col items-center justify-center py-16 text-center animate-in fade-in duration-700">
                            <div className="p-6 bg-primary/5 rounded-3xl mb-6 ring-8 ring-primary/5 animate-pulse">
                                <Database className="w-10 h-10 text-primary opacity-40" />
                            </div>
                            <h3 className="text-xl font-black tracking-tight text-foreground">Intelligence Required</h3>
                            <p className="max-w-xs text-sm font-medium text-muted-foreground mt-2 mb-8">
                                Connect high-quality knowledge sources to enable accurate and professional AI responses.
                            </p>
                            <Button
                                variant="outline"
                                onClick={() => setIsLinkDialogOpen(true)}
                                className="rounded-full px-8 font-bold border-primary/20 hover:bg-primary/5 hover:text-primary shadow-xl shadow-primary/5 transition-all active:scale-95"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Initialize First Source
                            </Button>
                        </div>
                    }
                />
            </CardContent>
        </Card>
    );
}
