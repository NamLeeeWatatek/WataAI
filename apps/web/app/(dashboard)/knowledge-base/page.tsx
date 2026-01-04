"use client";

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { KBCollectionDialog } from '@/components/features/knowledge-base';
import {
    Database,
    Plus,
    MoreVertical,
    Edit2,
    Trash2,
    RefreshCw,
    FolderOpen,
    FileText,
    ChevronRight,
    SearchX
} from 'lucide-react';
import { Search } from '@/components/ui/Search';
import toast from '@/lib/toast';

import { getKnowledgeBases, createKnowledgeBase, deleteKnowledgeBase, updateKnowledgeBase } from '@/lib/api/knowledge-base';
import type { KnowledgeBase } from '@/lib/types/knowledge-base';
import { AlertDialogConfirm } from '@/components/ui/AlertDialogConfirm';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from '@/components/ui/DropdownMenu';
import { PageLoading } from '@/components/ui/PageLoading';
import { Pagination } from '@/components/ui/Pagination';
import { PageHeader } from '@/components/ui/PageHeader';



import { useWorkspace } from '@/lib/hooks/useWorkspace';

export default function KnowledgeBasePage() {
    const router = useRouter();
    const { workspaceId, isLoading: isWorkspaceLoading } = useWorkspace();
    const [searchQuery, setSearchQuery] = useState('');
    const [querySearch, setQuerySearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(12);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [deleteItem, setDeleteItem] = useState<KnowledgeBase | null>(null);
    const [editingKb, setEditingKb] = useState<KnowledgeBase | null>(null);

    const searchTimerRef = useRef<NodeJS.Timeout>();

    // Cleanup timer
    useEffect(() => {
        return () => {
            if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
        }
    }, []);

    const { data: kbData, isLoading: loading, refetch } = useQuery({
        queryKey: ['knowledge-bases', workspaceId, currentPage, pageSize, querySearch],
        queryFn: async (): Promise<{ data: KnowledgeBase[], total: number }> => {
            if (!workspaceId) return { data: [], total: 0 };

            const data: any = await getKnowledgeBases({
                page: currentPage,
                limit: pageSize,
                workspaceId,
                filters: JSON.stringify({
                    search: querySearch
                })
            });

            // Normalize return
            if (Array.isArray(data)) {
                return { data, total: data.length };
            }
            return { data: data.data || [], total: data.total || 0 };
        },
        enabled: !!workspaceId,
        placeholderData: keepPreviousData,
    });

    const knowledgeBases = kbData?.data || [];
    const totalItems = kbData?.total || 0;

    const formatSize = (bytes: string | number) => {
        const size = typeof bytes === 'string' ? parseInt(bytes) : bytes;
        if (isNaN(size) || size === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(size) / Math.log(k));
        return Math.round(size / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    const handleSaveKnowledgeBase = async (data: { name: string; description?: string; aiProviderId?: string; ragModel?: string; embeddingModel?: string; color?: string; isPublic?: boolean }) => {
        if (!workspaceId) return;
        try {
            if (editingKb) {
                await updateKnowledgeBase(editingKb.id, {
                    ...data,
                });
                toast.success('Knowledge Base updated successfully');
            } else {
                await createKnowledgeBase({
                    name: data.name,
                    description: data.description,
                    aiProviderId: data.aiProviderId,
                    ragModel: data.ragModel,
                    embeddingModel: data.embeddingModel,
                    color: data.color || '#3B82F6',
                    isPublic: data.isPublic || false,
                    workspaceId
                });
                toast.success('Knowledge Base created successfully');
            }
            setDialogOpen(false);
            setEditingKb(null);
            refetch();
        } catch (error) {
            toast.error(editingKb ? 'Failed to update knowledge base' : 'Failed to create knowledge base');
        }
    };

    const handleDeleteKnowledgeBase = async () => {
        if (!deleteItem) return;
        try {
            await deleteKnowledgeBase(deleteItem.id);
            toast.success('Knowledge Base deleted successfully');
            setDeleteItem(null);
            refetch();
        } catch (error) {
            toast.error('Failed to delete knowledge base');
        }
    };

    if (loading && knowledgeBases.length === 0) return <PageLoading message="Loading knowledge bases" />;

    return (
        <div className="h-full flex flex-col space-y-6">
            <PageHeader
                title="Knowledge Base"
                description="Manage your intelligence assets and structured documentation."
                onRefresh={refetch}
                refreshing={loading}
                premium
            >
                <div className="flex items-center gap-2">
                    <Button onClick={() => {
                        setEditingKb(null);
                        setDialogOpen(true);
                    }} className="font-bold">
                        <Plus className="w-4 h-4 mr-2" />
                        New Knowledge Base
                    </Button>
                </div>
            </PageHeader>

            <div className="flex items-center gap-4">
                <div className="flex items-center gap-4">
                    <Search
                        placeholder="Search system intelligence..."
                        value={searchQuery}
                        onChange={(e: any) => {
                            const val = e.target.value;
                            setSearchQuery(val);

                            if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
                            searchTimerRef.current = setTimeout(() => {
                                setQuerySearch(val);
                                setCurrentPage(1);
                            }, 500);
                        }}
                        onClear={() => {
                            setSearchQuery("");
                            if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
                            setQuerySearch("");
                            setCurrentPage(1);
                        }}
                        className="max-w-sm"

                    />
                </div>
            </div>

            {knowledgeBases.length === 0 && !loading ? (
                <div className="flex flex-col items-center justify-center flex-1 py-12 border border-dashed border-border/40 rounded-3xl bg-muted/5 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.02] to-transparent pointer-events-none" />
                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 relative">
                        <Database className="w-10 h-10 text-primary opacity-60" />
                    </div>
                    <h3 className="text-2xl font-black mb-2 tracking-tight">Intelligence Vault Empty</h3>
                    <p className="text-muted-foreground mb-8 text-center max-w-sm font-medium leading-relaxed">
                        {searchQuery ? 'Adjust your search parameters to locate specific intelligence assets.' : 'Initialize your first knowledge base engine to power your AI agents.'}
                    </p>
                    <Button onClick={() => {
                        setEditingKb(null);
                        setDialogOpen(true);
                    }} className="px-8 font-bold">
                        <Plus className="w-4 h-4 mr-2" />
                        Construct First Vault
                    </Button>
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {knowledgeBases.map((kb: KnowledgeBase) => (
                            <Card
                                key={kb.id}
                                className="p-6 cursor-pointer"
                                onClick={() => router.push(`/knowledge-base/${kb.id}`)}
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="w-12 h-12 rounded-lg flex items-center justify-center border border-white/5 transition-transform group-hover:scale-110" style={{ backgroundColor: kb.color || '#3B82F6' }}>
                                        <Database className="w-6 h-6 text-white" />
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-9 w-9 opacity-0 group-hover:opacity-100 transition-all">
                                                <MoreVertical className="w-4 h-4 text-muted-foreground" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-48">
                                            <DropdownMenuItem
                                                className="cursor-pointer"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setEditingKb(kb);
                                                    setDialogOpen(true);
                                                }}
                                            >
                                                <Edit2 className="w-4 h-4 mr-2" />
                                                Edit Properties
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setDeleteItem(kb);
                                                }}
                                            >
                                                <Trash2 className="w-4 h-4 mr-2" />
                                                Delete Asset
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg mb-1 line-clamp-1">{kb.name}</h3>
                                    <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                                        {kb.description || 'No description available'}
                                    </p>
                                    <div className="flex items-center justify-between text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-4 border-t border-border/10 pt-4">
                                        <div className="flex items-center gap-1.5">
                                            <FileText className="w-3.5 h-3.5 text-primary" />
                                            <span>{kb.totalDocuments} Docs</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Database className="w-3.5 h-3.5 text-primary" />
                                            <span>{formatSize(kb.totalSize)}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="secondary" className="text-[10px] font-bold uppercase tracking-tight py-0.5 px-2">
                                            {kb.embeddingModel}
                                        </Badge>
                                        {(kb as any).isActive && (
                                            <Badge variant="default" className="text-[10px] font-bold uppercase tracking-tight py-0.5 px-2">
                                                Active
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>

                    {knowledgeBases.length > 0 && (
                        <Pagination
                            pagination={{
                                page: currentPage,
                                limit: pageSize,
                                total: totalItems,
                                totalPages: Math.ceil(totalItems / pageSize),
                                hasNextPage: currentPage < Math.ceil(totalItems / pageSize)
                            }}
                            onPageChange={setCurrentPage}
                            onPageSizeChange={(size: number) => {
                                setPageSize(size);
                                setCurrentPage(1);
                            }}
                            pageSizeOptions={[6, 9, 12, 24, 48]}
                        />
                    )}
                </div>
            )
            }

            <KBCollectionDialog
                open={dialogOpen}
                onOpenChange={(open) => {
                    setDialogOpen(open);
                    if (!open) setEditingKb(null);
                }}
                knowledgeBase={editingKb}
                onSubmit={handleSaveKnowledgeBase}
            />

            <AlertDialogConfirm
                open={deleteItem !== null}
                onOpenChange={(open) => !open && setDeleteItem(null)}
                title="Delete Knowledge Base"
                description={`Are you sure you want to delete "${deleteItem?.name}"? This action cannot be undone and will permanently remove all documents and folders in this knowledge base.`}
                onConfirm={handleDeleteKnowledgeBase}
                variant="destructive"
            />
        </div >
    );
}
