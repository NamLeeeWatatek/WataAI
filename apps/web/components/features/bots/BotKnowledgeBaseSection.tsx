'use client';

import React, { useState, useEffect } from 'react';
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
import { Database, Plus, Trash2, BookOpen, Link as LinkIcon } from 'lucide-react';
import { Search } from '@/components/ui/Search';
import { toast } from 'sonner';
import axiosClient from '@/lib/axios-client';
import { cn } from '@/lib/utils';
import type { KnowledgeBase } from '@/lib/types/knowledge-base';
import { DataTable } from '@/components/ui/DataTable';
import { AlertDialogConfirm } from '@/components/ui/AlertDialogConfirm';
import { ColumnDef } from '@tanstack/react-table';

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
    const [unlinkTarget, setUnlinkTarget] = useState<BotKnowledgeBase | null>(null);

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

            setLinkedKnowledgeBases(Array.isArray(linkedResponse) ? linkedResponse : (linkedResponse as any).data || []);
            setAvailableKnowledgeBases(Array.isArray(availableResponse) ? availableResponse : (availableResponse as any).data || []);
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

    const handleUnlink = (row: BotKnowledgeBase) => {
        setUnlinkTarget(row);
    };

    const confirmUnlink = async () => {
        if (!unlinkTarget) return;

        try {
            setLinkedKnowledgeBases(prev => prev.filter(item => item.id !== unlinkTarget.id));
            await axiosClient.delete(`/bots/${botId}/knowledge-bases/${unlinkTarget.knowledgeBaseId}`);
            toast.success('Knowledge base unlinked');
            setRefreshKey(k => k + 1);
            if (onRefresh) onRefresh();
        } catch (error) {
            toast.error('Failed to unlink');
            setRefreshKey(k => k + 1); // reload just in case
        } finally {
            setUnlinkTarget(null);
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
    const linkedColumns = React.useMemo<ColumnDef<BotKnowledgeBase>[]>(() => [
        {
            id: 'name',
            header: 'Knowledge Source',
            accessorKey: 'knowledgeBase.name',
            cell: ({ row }) => (
                <div className="flex items-center gap-4 py-1">
                    <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500">
                        <BookOpen className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="font-bold text-sm tracking-tight text-foreground">{row.original.knowledgeBase?.name}</div>
                        <div className="text-[10px] font-medium text-muted-foreground line-clamp-1 max-w-[300px]">{row.original.knowledgeBase?.description || "No description provided"}</div>
                    </div>
                </div>
            )
        },
        {
            id: 'stats',
            header: 'Volume',
            cell: ({ row }) => (
                <Badge variant="secondary" className="font-mono font-bold text-[10px] px-2.5 py-0.5">
                    {row.original.knowledgeBase?.totalDocuments || 0} items
                </Badge>
            )
        },
        {
            id: 'status',
            header: 'Status',
            accessorKey: 'isActive',
            cell: ({ row, getValue }) => {
                const isActive = getValue() as boolean;
                return (
                    <div className="flex items-center gap-3">
                        <Switch
                            checked={isActive}
                            onCheckedChange={() => handleToggleActive(row.original, isActive)}
                            className="scale-90 data-[state=checked]:bg-blue-500"
                        />
                        <span className={cn(
                            "text-[10px] font-black uppercase tracking-widest transition-colors",
                            isActive ? "text-blue-500" : "text-muted-foreground"
                        )}>
                            {isActive ? 'Active' : 'Offline'}
                        </span>
                    </div>
                );
            }
        },
        {
            id: 'actions',
            header: '',
            cell: ({ row }) => (
                <div className="flex justify-end">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-300"
                        onClick={() => handleUnlink(row.original)}
                    >
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>
            )
        }
    ], [linkedKnowledgeBases]);

    // Available Table Columns (for Dialog)
    const availableColumns = React.useMemo<ColumnDef<KnowledgeBase>[]>(() => [
        {
            id: 'name',
            header: 'Name',
            accessorKey: 'name',
            cell: ({ row, getValue }) => (
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        <BookOpen className="w-4 h-4" />
                    </div>
                    <div>
                        <div className="font-bold text-sm tracking-tight">{getValue() as string}</div>
                        <div className="text-[10px] font-medium text-muted-foreground line-clamp-1">{row.original.description}</div>
                    </div>
                </div>
            )
        },
        {
            id: 'action',
            header: '',
            cell: ({ row }) => (
                <div className="flex justify-end">
                    <Button size="sm" onClick={() => handleLink(row.original)} className="h-8 px-4 font-bold text-xs shadow-md shadow-primary/5">
                        <LinkIcon className="w-3.5 h-3.5 mr-2" />
                        Link
                    </Button>
                </div>
            )
        }
    ], [availableKnowledgeBases, availableSearch]);

    return (
        <Card>
            <CardHeader className="pb-0">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-primary/10 rounded-xl">
                            <Database className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <CardTitle className="text-xl font-bold tracking-tight">Knowledge Base</CardTitle>
                            <CardDescription className="text-xs font-medium">Manage the knowledge sources your bot uses</CardDescription>
                        </div>
                    </div>
                    <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="font-bold h-10 transition-all active:scale-95 shadow-lg shadow-primary/5">
                                <Plus className="w-4 h-4 mr-2" />
                                Link Knowledge Base
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl rounded-3xl border-none shadow-3xl">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-black tracking-tight">Link Knowledge Base</DialogTitle>
                                <DialogDescription className="text-sm font-medium">
                                    Select from your existing knowledge bases to connect to this bot.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-6 pt-4">
                                <Search
                                    placeholder="Search available knowledge bases..."
                                    value={availableSearch}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAvailableSearch(e.target.value)}
                                    onClear={() => setAvailableSearch("")}
                                />
                                <div className="max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                    <DataTable
                                        data={availableToLink.filter(kb =>
                                            kb.name.toLowerCase().includes(availableSearch.toLowerCase()) ||
                                            kb.description?.toLowerCase().includes(availableSearch.toLowerCase())
                                        )}
                                        columns={availableColumns}
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
                    columns={linkedColumns}
                    tableClassName="border-none shadow-none bg-transparent"
                    loading={loading}
                    emptyMessage="Link sources to enhance your bot's intelligence."
                    emptyComponent={
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="p-6 bg-primary/5 rounded-3xl mb-6 ring-8 ring-primary/5">
                                <Database className="w-10 h-10 text-primary opacity-40" />
                            </div>
                            <h3 className="text-xl font-black tracking-tight text-foreground">Knowledge Source Required</h3>
                            <p className="max-w-xs text-sm font-medium text-muted-foreground mt-2 mb-8">
                                Connect knowledge sources to enable accurate AI responses.
                            </p>
                            <Button
                                variant="outline"
                                onClick={() => setIsLinkDialogOpen(true)}
                                className="px-8 font-bold border-primary/20 transition-all active:scale-95"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Initialize First Source
                            </Button>
                        </div>
                    }
                />
            </CardContent>

            <AlertDialogConfirm
                open={!!unlinkTarget}
                onOpenChange={(open) => !open && setUnlinkTarget(null)}
                title="Unlink Knowledge Base"
                description={`Are you sure you want to unlink "${unlinkTarget?.knowledgeBase?.name}"? This will stop the bot from using this source for answers.`}
                onConfirm={confirmUnlink}
                variant="destructive"
                confirmText="Unlink"
            />
        </Card>
    );
}
