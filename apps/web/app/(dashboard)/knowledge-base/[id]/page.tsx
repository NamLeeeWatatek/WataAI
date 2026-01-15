'use client'

import React, { useState, useRef, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
    KBStatsCards,
    KBFolderDialog,
    KBDocumentDialog,
    KBQueryDialog,
    KBChatDialog,
    KBSettingsDialog,
    KBProcessingStatus,
    KBCrawlerDialog,
    KBItemEditDialog,
    KbTableView,
    KbFileIcon,
} from '@/components/features/knowledge-base'
import { KbBreadcrumbs } from '@/components/features/knowledge-base/KbBreadcrumbs'
import {
    Card,
    CardContent,
} from '@/components/ui/Card'
import {
    Trash2,
    ArrowLeft,
    Database,
    Settings,
    Plus,
    FolderPlus,
    FileText,
    Upload,
    Globe,
    ChevronDown,
    RotateCcw,
    X
} from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu"
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Checkbox } from '@/components/ui/Checkbox'
import { PageLoading } from '@/components/shared/PageLoading'
import { PageHeader } from '@/components/shared/PageHeader'
import { AlertDialogConfirm } from '@/components/ui/AlertDialogConfirm'
import { useKnowledgeBaseController } from '@/lib/hooks/features/useKnowledgeBaseController'
import type { KBFolder, KBDocument } from '@/lib/types/knowledge-base'
import { queryKnowledgeBase } from '@/lib/api/knowledge-base'
import { useKnowledgeBases } from '@/lib/hooks/features/useKnowledgeBases'
import toast from '@/lib/toast'

export default function KnowledgeBaseDetailPage() {
    const params = useParams()
    const router = useRouter()
    const kbId = params.id as string

    // --- Data Controller ---
    const {
        kb,
        stats,
        items,
        breadcrumbs,
        currentFolderId,
        isLoading,
        viewMode,
        searchQuery,
        selectedIds,
        currentPage,
        pageSize,
        totalCount,
        draggedItem,
        dragOverFolder,

        setSearchQuery,
        setViewMode,
        handleNavigateToFolder,
        handleNavigateBreadcrumb,
        createNewFolder,
        createNewDoc,
        uploadFiles,
        deleteItems,
        moveItems,
        refresh,
        toggleSelection,
        toggleSelectAll,
        setDraggedItem,
        setDragOverFolder,
        setPagination,
        clearSelection,
    } = useKnowledgeBaseController(kbId)

    // --- Local UI State ---
    const [folderDialogOpen, setFolderDialogOpen] = useState(false)
    const [documentDialogOpen, setDocumentDialogOpen] = useState(false)
    const [crawlerDialogOpen, setCrawlerDialogOpen] = useState(false)
    const [queryDialogOpen, setQueryDialogOpen] = useState(false)
    const [chatDialogOpen, setChatDialogOpen] = useState(false)
    const [settingsDialogOpen, setSettingsDialogOpen] = useState(false)
    const [editingItem, setEditingItem] = useState<{ type: 'folder' | 'document', item: KBFolder | KBDocument } | null>(null)
    const [deleteItem, setDeleteItem] = useState<{ type: 'folder' | 'document', id: string } | null>(null)
    const [showBulkDelete, setShowBulkDelete] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const { updateKB } = useKnowledgeBases(kb?.workspaceId || undefined)

    // --- Handlers ---
    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (files && files.length > 0) {
            await uploadFiles(Array.from(files))
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    const handleDeleteSingle = async () => {
        if (!deleteItem) return
        await deleteItems([{ type: deleteItem.type, id: deleteItem.id }])
        setDeleteItem(null)
    }

    const handleBulkDelete = async () => {
        const itemsToDelete = items.filter(i => selectedIds.includes(i.id))
            .map(i => ({ type: i.type, id: i.id }))
        await deleteItems(itemsToDelete)
        setShowBulkDelete(false)
    }

    const handleSaveEdit = async (data: any) => {
        if (!editingItem) return
        // Implement save logic via controller if needed
        setEditingItem(null)
    }

    const handleSaveSettings = async (data: any) => {
        if (!kb) return
        try {
            await updateKB({ id: kbId, data })
            setSettingsDialogOpen(false)
            toast.success("Settings updated successfully")
            refresh()
        } catch (error) {
            toast.error("Failed to update settings")
        }
    }

    const handleDrop = async (itemId: string, itemType: 'folder' | 'document', targetFolderId: string | null) => {
        await moveItems([{ type: itemType, id: itemId }], targetFolderId)
    }

    if (isLoading && !kb) return <PageLoading />
    if (!kb && !isLoading) return (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center p-6">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <Database className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Collection Not Found</h2>
            <p className="text-muted-foreground mb-6">This knowledge base does not exist or you don't have permission.</p>
            <Button variant="outline" onClick={() => router.push('/knowledge-base')}>
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Collections
            </Button>
        </div>
    )

    const pagination = {
        page: currentPage,
        limit: pageSize,
        total: totalCount,
        hasNextPage: currentPage * pageSize < totalCount,
        totalPages: Math.ceil(totalCount / pageSize)
    }

    return (
        <div className="h-full flex flex-col space-y-6">
            <div className="flex flex-col gap-6">
                {/* Header Section */}
                <PageHeader
                    title={kb?.name || 'Knowledge Base'}
                    description={kb?.description || "Manage documents and settings for this knowledge base."}
                    onRefresh={() => refresh()}
                    refreshing={isLoading}
                >
                    <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={() => setSettingsDialogOpen(true)}>
                            <Settings className="w-4 h-4 mr-2" />
                            Settings
                        </Button>
                    </div>
                </PageHeader>

                {/* Summary Stats & Status Indicators */}
                {(stats || kbId) && (
                    <div className="flex flex-col gap-4">
                        {stats && <KBStatsCards stats={stats} />}
                        <KBProcessingStatus knowledgeBaseId={kbId} onProcessingComplete={refresh} />
                    </div>
                )}

                {/* Breadcrumbs & Folder Navigation */}
                <div className="px-1 flex items-center justify-between">
                    <KbBreadcrumbs
                        breadcrumbs={breadcrumbs}
                        onNavigate={(id) => handleNavigateToFolder(id)}
                    />
                </div>

                <div className="flex-1 min-h-0 flex flex-col">
                    <KbTableView
                        items={items}
                        selectedIds={selectedIds}
                        sortColumn="name"
                        sortDirection="asc"
                        isLoading={isLoading}
                        pagination={pagination}
                        viewMode={viewMode}
                        onViewModeChange={setViewMode}
                        onPageChange={(p: number) => setPagination(p, pageSize)}
                        onPageSizeChange={(s: number) => setPagination(1, s)}
                        onItemClick={(item: any) => item.type === 'folder' && handleNavigateToFolder(item.id, item.name)}
                        onToggleSelection={toggleSelection}
                        onToggleSelectAll={(checked: boolean) => toggleSelectAll(checked)}
                        onSort={() => { }}
                        onEditItem={(item: any) => setEditingItem({ type: item.type, item: item as unknown as KBFolder | KBDocument })}
                        onDeleteItem={(item: any) => setDeleteItem({ type: item.type, id: item.id })}
                        onPreviewDocument={(id: string) => {
                            import('@/lib/utils/document-actions').then(({ previewDocument }) => previewDocument(id));
                        }}
                        onDownloadDocument={(id: string, filename: string) => {
                            import('@/lib/utils/document-actions').then(({ downloadDocument }) => downloadDocument(id, filename));
                        }}
                        onDragStart={(item: any) => setDraggedItem({ type: item.type, id: item.id })}
                        onDragOver={(folderId: string | null) => setDragOverFolder(folderId)}
                        onDrop={(targetId) => draggedItem && handleDrop(draggedItem.id, draggedItem.type, targetId)}
                        searchable={true}
                        searchValue={searchQuery}
                        onSearch={setSearchQuery}
                        searchPlaceholder="Search files & folders..."
                        renderGridItem={(item) => (
                            <Card
                                key={item.id}
                                className={cn(
                                    "group p-5 cursor-pointer transition-all duration-500 relative overflow-hidden flex flex-col items-center text-center",
                                    "bg-card/40 backdrop-blur-md border border-border/50 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-2",
                                    selectedIds.includes(item.id) && "ring-2 ring-primary border-primary bg-primary/5",
                                    dragOverFolder === item.id && "ring-2 ring-primary bg-primary/10 scale-105"
                                )}
                                onClick={() => item.type === 'folder' && handleNavigateToFolder(item.id, item.name)}
                            >
                                <div className={cn(
                                    "absolute top-4 right-4 z-20 transition-all duration-300",
                                    selectedIds.includes(item.id) ? "opacity-100 scale-100" : "opacity-0 scale-50 group-hover:opacity-100 group-hover:scale-100"
                                )}>
                                    <Checkbox
                                        checked={selectedIds.includes(item.id)}
                                        onCheckedChange={() => toggleSelection(item.id)}
                                        onClick={(e) => e.stopPropagation()}
                                        className="w-5 h-5 rounded-md border-primary/50 data-[state=checked]:bg-primary"
                                    />
                                </div>

                                <div className={cn(
                                    "w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-all duration-500 shadow-premium border border-white/5",
                                    "group-hover:scale-110 group-hover:rotate-2",
                                    item.type === 'folder'
                                        ? "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground"
                                        : "bg-muted/50 text-muted-foreground group-hover:bg-muted group-hover:text-foreground"
                                )}>
                                    <KbFileIcon name={item.name} type={item.type} className="w-7 h-7" />
                                </div>

                                <h3 className="font-bold text-xs truncate w-full px-2 group-hover:text-primary transition-colors leading-relaxed">
                                    {item.name}
                                </h3>
                                {item.type === 'folder' && <span className="text-[10px] font-bold text-muted-foreground/60 uppercase mt-1 tracking-tighter">Folder</span>}
                                {item.type === 'document' && item.processingStatus && (
                                    <Badge variant="outline" className="mt-2 text-[8px] font-black uppercase tracking-tighter border-primary/10 bg-primary/5 text-primary">
                                        {item.processingStatus}
                                    </Badge>
                                )}
                            </Card>
                        )}
                        actions={
                            selectedIds.length > 0 ? (
                                <div className="flex items-center gap-2">
                                    <div className="bg-primary/10 text-primary px-3 py-1.5 rounded-lg text-xs font-bold border border-primary/20 flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                                        {selectedIds.length} Selected
                                    </div>
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        className="h-9 px-4 shadow-sm hover:shadow-md transition-all active:scale-95 font-bold uppercase text-[10px] tracking-widest"
                                        onClick={() => setShowBulkDelete(true)}
                                    >
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Delete
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-9 w-9 p-0 rounded-lg border border-border/50 hover:bg-muted"
                                        onClick={() => clearSelection()}
                                        title="Cancel Selection"
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-3">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => refresh()}
                                        disabled={isLoading}
                                        className="h-9 w-9 border-border/50"
                                        title="Refresh"
                                    >
                                        <RotateCcw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                                    </Button>

                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button className="h-9 gap-2 shadow-sm font-black text-[10px] uppercase tracking-widest pl-3 pr-4 shadow-primary/20 transition-all hover:shadow-primary/30 active:scale-95">
                                                <Plus className="w-4 h-4" />
                                                <span>New Asset</span>
                                                <ChevronDown className="w-3 h-3 opacity-50 ml-1" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-48 p-2 rounded-xl shadow-premium border-border/50">
                                            <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 px-2 py-1.5">Add Content</DropdownMenuLabel>
                                            <DropdownMenuSeparator className="bg-border/30" />
                                            <DropdownMenuItem onClick={() => setFolderDialogOpen(true)} className="rounded-lg cursor-pointer font-bold p-2.5">
                                                <FolderPlus className="w-4 h-4 mr-3 text-indigo-500" />
                                                New Folder
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => setDocumentDialogOpen(true)} className="rounded-lg cursor-pointer font-bold p-2.5">
                                                <FileText className="w-4 h-4 mr-3 text-cyan-500" />
                                                New Document
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator className="bg-border/30" />
                                            <DropdownMenuItem onClick={() => fileInputRef.current?.click()} className="rounded-lg cursor-pointer font-bold p-2.5">
                                                <Upload className="w-4 h-4 mr-3 text-orange-500" />
                                                Upload Files
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => setCrawlerDialogOpen(true)} className="rounded-lg cursor-pointer font-bold p-2.5">
                                                <Globe className="w-4 h-4 mr-3 text-purple-500" />
                                                Crawl Website
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            )
                        }
                    />
                </div>
            </div>

            {/* Dialogs */}
            <KBFolderDialog
                open={folderDialogOpen}
                onOpenChange={setFolderDialogOpen}
                onSubmit={async (data) => { await createNewFolder(data.name, data.description || ''); }}
            />
            <KBDocumentDialog
                open={documentDialogOpen}
                onOpenChange={setDocumentDialogOpen}
                onSubmit={async (data) => { await createNewDoc(data.name, data.content || ''); }}
            />

            <KBQueryDialog
                open={queryDialogOpen}
                onOpenChange={setQueryDialogOpen}
                onQuery={async (q) => (await queryKnowledgeBase({ query: q, knowledgeBaseId: kbId, limit: 5 })).results}
            />

            <KBChatDialog
                open={chatDialogOpen}
                onOpenChange={setChatDialogOpen}
                knowledgeBaseId={kbId}
                knowledgeBaseName={kb?.name || ''}
            />

            <KBSettingsDialog
                open={settingsDialogOpen}
                onOpenChange={setSettingsDialogOpen}
                knowledgeBase={kb}
                workspaceId={kb?.workspaceId || undefined}
                onSave={handleSaveSettings}
            />

            <KBCrawlerDialog
                open={crawlerDialogOpen}
                onOpenChange={setCrawlerDialogOpen}
                knowledgeBaseId={kbId}
                folderId={currentFolderId}
                onSuccess={() => refresh()}
            />

            <KBItemEditDialog
                open={editingItem !== null}
                onOpenChange={(o) => !o && setEditingItem(null)}
                item={editingItem?.item || null}
                type={editingItem?.type || 'folder'}
                onSubmit={handleSaveEdit}
            />

            {/* Confirm Dialogs */}
            <AlertDialogConfirm
                open={deleteItem !== null}
                onOpenChange={(o) => !o && setDeleteItem(null)}
                title={`Delete ${deleteItem?.type}`}
                description="This action cannot be undone."
                onConfirm={handleDeleteSingle}
                variant="destructive"
            />

            <AlertDialogConfirm
                open={showBulkDelete}
                onOpenChange={setShowBulkDelete}
                title={`Delete ${selectedIds.length} items`}
                description="This will permanently remove selected items."
                onConfirm={handleBulkDelete}
                variant="destructive"
            />

            {/* Hidden Input for Uploads */}
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                multiple
                onChange={handleFileSelect}
            />
        </div>
    )
}
