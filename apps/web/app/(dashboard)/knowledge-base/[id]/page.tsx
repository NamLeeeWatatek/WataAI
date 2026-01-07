'use client'

import React, { useState, useRef, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
    KBStatsCards,
    KBBreadcrumbs,
    KBFolderDialog,
    KBDocumentDialog,
    KBQueryDialog,
    KBChatDialog,
    KBSettingsDialog,
    KBProcessingStatus,
    KBCrawlerDialog,
    KBItemEditDialog,
    KbToolbar,
    KbGridView,
    KbTableView,
} from '@/components/features/knowledge-base'
import { BulkActionsToolbar } from '@/components/ui/BulkActionsToolbar'
import {
    Trash2,
    Move,
    ArrowLeft,
    Database,
    Settings,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { PageLoading } from '@/components/ui/PageLoading'
import { PageHeader } from '@/components/ui/PageHeader'
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
        updateFolder,
        updateDocument
    } = useKnowledgeBaseController(kbId)

    const { updateKB } = useKnowledgeBases()

    // --- Local UI State ---
    const [folderDialogOpen, setFolderDialogOpen] = useState(false)
    const [documentDialogOpen, setDocumentDialogOpen] = useState(false)
    const [queryDialogOpen, setQueryDialogOpen] = useState(false)
    const [chatDialogOpen, setChatDialogOpen] = useState(false)
    const [settingsDialogOpen, setSettingsDialogOpen] = useState(false)
    const [crawlerDialogOpen, setCrawlerDialogOpen] = useState(false)

    const [deleteItem, setDeleteItem] = useState<{ type: 'folder' | 'document'; id: string } | null>(null)
    const [showBulkDelete, setShowBulkDelete] = useState(false)
    const [editingItem, setEditingItem] = useState<{ type: 'folder' | 'document'; item: KBFolder | KBDocument } | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // --- Handlers ---
    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return
        await uploadFiles(Array.from(e.target.files))
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    const handleDeleteSingle = async () => {
        if (!deleteItem) return
        await deleteItems([deleteItem])
    }

    const handleBulkDelete = async () => {
        if (!selectedIds.length) return
        // We need to resolve types for selected IDs
        // The controller doesn't give us type map directly for bulk delete action, 
        // but our items list has the type info.
        const itemsToDelete = items
            .filter(i => selectedIds.includes(i.id))
            .map(i => ({ type: i.type, id: i.id }))

        await deleteItems(itemsToDelete)
        setShowBulkDelete(false)
    }

    const handleDrop = async (targetFolderId: string | null) => {
        setDragOverFolder(null)
        if (!draggedItem) return

        // 1. Bulk Move
        const isDraggingSelection = selectedIds.includes(draggedItem.id) && selectedIds.length > 1;
        if (isDraggingSelection) {
            const itemsToMove = items
                .filter(i => selectedIds.includes(i.id))
                .map(i => ({ type: i.type, id: i.id }))

            await moveItems(itemsToMove, targetFolderId)
        } else {
            // 2. Single Move
            await moveItems([draggedItem], targetFolderId)
        }
        setDraggedItem(null)
    }

    const handleSaveEdit = async (data: { name: string; description?: string; icon?: string }) => {
        if (!editingItem) return
        try {
            if (editingItem.type === 'folder') {
                await updateFolder(editingItem.item.id, data)
            } else {
                await updateDocument(editingItem.item.id, data)
            }
            toast.success('Item updated')
            setEditingItem(null)
            refresh()
        } catch (error) {
            toast.error('Failed to update item')
        }
    }

    const handleSaveSettings = async (data: any) => {
        try {
            await updateKB({ id: kbId, data })
            setSettingsDialogOpen(false)
            refresh()
        } catch (error) {
            // Error handled in hook if we add error toast there
        }
    }

    // --- Render ---

    if (isLoading && !kb) return <PageLoading message="Loading collection..." />

    if (!kb) return (
        <div className="flex flex-col items-center justify-center h-full animate-in fade-in zoom-in duration-500">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6">
                <Database className="w-10 h-10 text-muted-foreground opacity-50" />
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

    // Sort logic local to view (could be moved to controller if complex)
    // For now we pass simple handlers

    return (
        <div className="h-full flex flex-col space-y-6">


            <PageHeader
                title={kb.name}
                description={kb.description || "Manage documents and settings for this knowledge base."}
                onRefresh={refresh}
                refreshing={isLoading}
            >
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => setSettingsDialogOpen(true)}>
                        <Settings className="w-4 h-4 mr-2" />
                        Settings
                    </Button>
                </div>
            </PageHeader>

            {/* Stats Header */}
            {stats && <KBStatsCards stats={stats} />}

            <KBProcessingStatus knowledgeBaseId={kbId} onProcessingComplete={refresh} />

            {/* Breadcrumbs */}
            <KBBreadcrumbs
                rootName={kb.name}
                breadcrumbs={breadcrumbs}
                onNavigate={handleNavigateBreadcrumb}
                onDrop={handleDrop}
                dragOverId={dragOverFolder}
            />

            {/* Main Toolbar */}
            <KbToolbar
                searchQuery={searchQuery}
                viewMode={viewMode}
                isLoading={isLoading}
                onSearchChange={setSearchQuery}
                onViewModeChange={setViewMode}
                onRefresh={refresh}
                onCreateFolder={() => setFolderDialogOpen(true)}
                onCreateDocument={() => setDocumentDialogOpen(true)}
                onUploadFile={() => fileInputRef.current?.click()}
                onCrawlWebsite={() => setCrawlerDialogOpen(true)}
                selectedCount={selectedIds.length}
                onDeleteSelected={() => setShowBulkDelete(true)}
            />

            {/* Bulk Actions overlay */}
            <BulkActionsToolbar
                selectedCount={selectedIds.length}
                onClearSelection={clearSelection}
                actions={[
                    {
                        label: 'Move Items',
                        icon: Move,
                        onClick: () => {
                            // This would ideally open a directory picker. 
                            // For now we implement basic Drag-Drop, so this button might be just a hint
                            // or trigger a "Move Dialog" (Future improvement)
                            toast.info('Drag items to a folder to move', { icon: '💡' })
                        },
                    },
                    {
                        label: 'Delete',
                        icon: Trash2,
                        onClick: () => setShowBulkDelete(true),
                        variant: 'destructive'
                    }
                ]}
            />

            {/* View Content */}
            <div className="flex-1 relative min-h-[400px]">
                {viewMode === 'table' ? (
                    <KbTableView
                        items={items}
                        selectedIds={selectedIds}
                        sortColumn="name" // Default for now
                        sortDirection="asc"
                        isLoading={isLoading}
                        pagination={pagination}
                        onPageChange={(p) => setPagination(p, pageSize)}
                        onPageSizeChange={(s) => setPagination(1, s)}
                        onItemClick={(item) => item.type === 'folder' && handleNavigateToFolder(item.id, item.name)}
                        onToggleSelection={toggleSelection}
                        onToggleSelectAll={(checked) => toggleSelectAll(checked)}
                        onSort={() => { }} // TODO: Implement sort in controller
                        onEditItem={(item) => setEditingItem({ type: item.type, item: item as any })}
                        onDeleteItem={(item) => setDeleteItem({ type: item.type, id: item.id })}
                        onPreviewDocument={(id) => {
                            import('@/lib/utils/document-actions').then(({ previewDocument }) => previewDocument(id));
                        }}
                        onDownloadDocument={(id, filename) => {
                            import('@/lib/utils/document-actions').then(({ downloadDocument }) => downloadDocument(id, filename));
                        }}
                        onDragStart={(item) => setDraggedItem({ type: item.type, id: item.id })}
                        onDragOver={(folderId) => setDragOverFolder(folderId)}
                        onDrop={handleDrop}

                    />
                ) : (
                    <KbGridView
                        items={items}
                        selectedIds={selectedIds}
                        draggedItem={draggedItem}
                        dragOverFolder={dragOverFolder}
                        isLoading={isLoading}
                        onItemClick={(item) => item.type === 'folder' && handleNavigateToFolder(item.id, item.name)}
                        onToggleSelection={toggleSelection}
                        onDragStart={(item) => setDraggedItem({ type: item.type, id: item.id })}
                        onDragOver={(folderId) => setDragOverFolder(folderId)}
                        onDrop={handleDrop}
                        onEditItem={(item) => setEditingItem({ type: item.type, item: item as any })}
                        onDeleteItem={(item) => setDeleteItem({ type: item.type, id: item.id })}
                        onPreviewDocument={(id) => {
                            import('@/lib/utils/document-actions').then(({ previewDocument }) => previewDocument(id));
                        }}
                        onDownloadDocument={(id, filename) => {
                            import('@/lib/utils/document-actions').then(({ downloadDocument }) => downloadDocument(id, filename));
                        }}
                        onToggleSelectAll={(checked) => toggleSelectAll(checked)}
                        pagination={pagination}
                        onPageChange={(p) => setPagination(p, pageSize)}
                        onPageSizeChange={(s) => setPagination(1, s)}
                    />
                )}
            </div>

            {/* Dialogs */}
            <KBFolderDialog open={folderDialogOpen} onOpenChange={setFolderDialogOpen} onSubmit={async (data) => { await createNewFolder(data.name, data.description || ''); }} />
            <KBDocumentDialog open={documentDialogOpen} onOpenChange={setDocumentDialogOpen} onSubmit={async (data) => { await createNewDoc(data.name, data.content || ''); }} />

            <KBQueryDialog
                open={queryDialogOpen}
                onOpenChange={setQueryDialogOpen}
                onQuery={async (q) => (await queryKnowledgeBase({ query: q, knowledgeBaseId: kbId, limit: 5 })).results}
            />

            <KBChatDialog
                open={chatDialogOpen}
                onOpenChange={setChatDialogOpen}
                knowledgeBaseId={kbId}
                knowledgeBaseName={kb.name}
            />

            <KBSettingsDialog
                open={settingsDialogOpen}
                onOpenChange={setSettingsDialogOpen}
                knowledgeBase={kb}
                onSave={handleSaveSettings}
            />

            <KBCrawlerDialog
                open={crawlerDialogOpen}
                onOpenChange={setCrawlerDialogOpen}
                knowledgeBaseId={kbId}
                folderId={currentFolderId}
                onSuccess={refresh}
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
            <Input
                type="file"
                ref={fileInputRef}
                className="hidden"
                multiple
                onChange={handleFileSelect}
            />
        </div>
    )
}
