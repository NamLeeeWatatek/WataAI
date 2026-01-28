'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { KBSettingsDialog } from '@/components/features/knowledge-base';
import {
    Database,
    Plus,
    MoreVertical,
    Edit2,
    Trash2,
    FileText,
} from 'lucide-react';
import { Search } from '@/components/shared/Search';
import type { KnowledgeBase } from '@/lib/types/knowledge-base';
import { AlertDialogConfirm } from '@/components/ui/AlertDialogConfirm';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from '@/components/ui/DropdownMenu';

import { CardGridSkeleton } from '@/components/shared/Skeletons';
import { Pagination } from '@/components/shared/Pagination';
import { PageHeader } from '@/components/shared/PageHeader';
import { useWorkspaceStore } from '@/lib/store/zustand/workspace-store';
import { useKnowledgeBases } from '@/lib/hooks/use-kb';
import { useDebounce } from '@/lib/hooks/useDebounce';

export default function KnowledgeBasePage() {
    const { t } = useTranslation();
    const router = useRouter();
    const { currentWorkspace } = useWorkspaceStore();
    const workspaceId = currentWorkspace?.id;
    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearch = useDebounce(searchQuery, 500);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(12);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [deleteItem, setDeleteItem] = useState<KnowledgeBase | null>(null);
    const [editingKb, setEditingKb] = useState<KnowledgeBase | null>(null);

    const {
        knowledgeBases,
        total: totalItems,
        isLoading: loading,
        refetch,
        createKB,
        updateKB,
        deleteKB
    } = useKnowledgeBases(workspaceId || undefined, {
        page: currentPage,
        limit: pageSize,
        filters: JSON.stringify({ search: debouncedSearch })
    });

    // Reset to page 1 when search changes
    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedSearch]);

    const formatSize = (bytes: string | number) => {
        const size = typeof bytes === 'string' ? parseInt(bytes) : bytes;
        if (isNaN(size) || size === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(size) / Math.log(k));
        return Math.round(size / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    const handleSaveKnowledgeBase = async (data: any) => {
        if (!workspaceId) return;
        try {
            if (editingKb) {
                await updateKB({ id: editingKb.id, data });
            } else {
                await createKB({ ...data, workspaceId });
            }
            setDialogOpen(false);
            setEditingKb(null);
        } catch { }
    };

    const handleDeleteKnowledgeBase = async () => {
        if (!deleteItem) return;
        try {
            await deleteKB(deleteItem.id);
            setDeleteItem(null);
        } catch { }
    };

    if (loading && knowledgeBases.length === 0) return <div className="page-container"><CardGridSkeleton /></div>;

    return (
        <div className="page-container h-full flex flex-col space-y-6">
            <PageHeader
                title={t('knowledgeBase.title')}
                description={t('knowledgeBase.description')}
                icon={Database}
                onRefresh={refetch}
                refreshing={loading}
                premium
            >
                <div className="flex items-center gap-2">
                    <Button onClick={() => {
                        setEditingKb(null);
                        setDialogOpen(true);
                    }} className="font-bold shadow-lg shadow-primary/10">
                        <Plus className="w-4 h-4 mr-2" />
                        {t('knowledgeBase.initNewEngine')}
                    </Button>
                </div>
            </PageHeader>

            <div className="flex items-center gap-4">
                <Search
                    placeholder={t('knowledgeBase.searchPlaceholder')}
                    value={searchQuery}
                    onChange={(e: any) => {
                        setSearchQuery(e.target.value);
                    }}
                    onClear={() => {
                        setSearchQuery("");
                    }}
                    className="max-w-sm"
                />
            </div>

            {knowledgeBases.length === 0 && !loading ? (
                <div className="flex flex-col items-center justify-center flex-1 py-12 border border-dashed border-border/40 rounded-3xl bg-muted/5 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.02] to-transparent pointer-events-none" />
                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 relative">
                        <Database className="w-10 h-10 text-primary opacity-60" />
                    </div>
                    <h3 className="text-2xl font-black mb-2 tracking-tight">{t('knowledgeBase.vaultEmpty')}</h3>
                    <p className="text-muted-foreground mb-8 text-center max-w-sm font-medium leading-relaxed">
                        {searchQuery ? t('knowledgeBase.noResultsDesc') : t('knowledgeBase.noItemsDesc')}
                    </p>
                    <Button onClick={() => { setEditingKb(null); setDialogOpen(true); }} className="px-8 font-bold">
                        <Plus className="w-4 h-4 mr-2" /> {t('knowledgeBase.bootstrapFirstEngine')}
                    </Button>
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {knowledgeBases.map((kb: KnowledgeBase) => (
                            <Card
                                key={kb.id}
                                className="group p-6 cursor-pointer hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                onClick={() => router.push(`/knowledge-base/${kb.id}`)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        router.push(`/knowledge-base/${kb.id}`);
                                    }
                                }}
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="w-12 h-12 rounded-lg flex items-center justify-center border border-white/5 transition-transform" style={{ backgroundColor: kb.color || '#3B82F6' }}>
                                        <Database className="w-6 h-6 text-white drop-shadow-md" />
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-9 w-9 opacity-0 group-hover:opacity-100 transition-all">
                                                <MoreVertical className="w-4 h-4 text-muted-foreground" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-48">
                                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setEditingKb(kb); setDialogOpen(true); }}>
                                                <Edit2 className="w-4 h-4 mr-2" /> {t('knowledgeBase.editSpecs')}
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem className="text-destructive focus:bg-destructive/10" onClick={(e) => { e.stopPropagation(); setDeleteItem(kb); }}>
                                                <Trash2 className="w-4 h-4 mr-2" /> {t('knowledgeBase.decommissionEngine')}
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg mb-1 truncate">{kb.name}</h3>
                                    <p className="text-muted-foreground text-xs mb-4 line-clamp-2 font-medium">
                                        {kb.description || t('knowledgeBase.defaultDescription')}
                                    </p>
                                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest mb-4 border-t border-border/10 pt-4">
                                        <div className="flex items-center gap-1.5 text-primary">
                                            <FileText className="w-3.5 h-3.5" /> <span>{t('knowledgeBase.slots', { count: kb.totalDocuments })}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-muted-foreground">
                                            <span>{formatSize(kb.totalSize)}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <Badge variant="secondary" className="font-bold px-2">
                                            {kb.embeddingModel || t('knowledgeBase.noEmbedding')}
                                        </Badge>
                                        {kb.ragModel && (
                                            <Badge variant="secondary" className="font-bold px-2 bg-indigo-500/10 text-indigo-500 border-indigo-500/20">
                                                {kb.ragModel}
                                            </Badge>
                                        )}
                                        <Badge variant="outline" className="font-bold px-2 border-primary/20 text-primary">
                                            {t('knowledgeBase.stable')}
                                        </Badge>
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
                            pageSizeOptions={[12, 24, 36, 48]}
                        />
                    )}
                </div>
            )}

            <KBSettingsDialog
                open={dialogOpen}
                onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditingKb(null); }}
                knowledgeBase={editingKb}
                workspaceId={workspaceId || undefined}
                onSave={handleSaveKnowledgeBase}
            />

            <AlertDialogConfirm
                open={deleteItem !== null}
                onOpenChange={(open) => !open && setDeleteItem(null)}
                title={t('knowledgeBase.decommissionTitle')}
                description={t('knowledgeBase.decommissionConfirm', { name: deleteItem?.name })}
                onConfirm={handleDeleteKnowledgeBase}
                variant="destructive"
            />
        </div>
    );
}
