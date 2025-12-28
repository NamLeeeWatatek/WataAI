'use client'

import { useEffect, useCallback, useMemo, useState } from 'react'
import { useParams, useRouter, useSearchParams, usePathname } from 'next/navigation'
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
import { cn } from '@/lib/utils'

import {
    Folder,
    MoreVertical,
    Trash2,
    Edit2,
    FileText,
    AlertCircle,
    CheckCircle2,
    Clock,
    RefreshCw,
    Database,
    ArrowLeft,
    Plus,
    Grid,
    List,
    Search,
    FolderPlus,
    Upload,
    Globe,
    Eye,
    Download,
} from 'lucide-react'
import toast from '@/lib/toast'

import { useAppDispatch, useAppSelector } from '@/lib/store/hooks'
import {
    loadKnowledgeBase,
    refreshData,
    createFolder,
    createDocument,
    uploadDocument,
    updateFolder,
    updateDocument,
    removeFolder,
    removeDocument,
    removeBatchItems,
    moveBatchItems,
    moveFolderToFolder,
    moveDocumentToFolder,
    navigateToFolder,
    navigateToBreadcrumb,
    setViewMode,
    setSearchQuery,
    toggleSelection,
    toggleSelectAll,
    clearSelection,
    setDraggedItem,
    setDragOverFolder,
    setAutoRefreshing,
    resetState,
    selectCurrentKB,
    selectStats,
    selectFilteredFolders,
    selectFilteredDocuments,
    selectLoading,
    selectAutoRefreshing,
    selectViewMode,
    selectSearchQuery,
    selectSelectedIds,
    selectBreadcrumbs,
    selectCurrentFolderId,
    selectDraggedItem,
    selectDragOverFolder,
    selectHasProcessingDocuments,
    selectPagination,
    setPagination,
    selectTotalCount,
} from '@/lib/store/slices/knowledgeBaseSlice'
import { queryKnowledgeBase, updateKnowledgeBase } from '@/lib/api/knowledge-base'
import type { KBFolder, KBDocument } from '@/lib/types/knowledge-base'
import { AlertDialogConfirm } from '@/components/ui/AlertDialogConfirm'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Checkbox } from '@/components/ui/Checkbox'
import { Spinner } from '@/components/ui/Spinner'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from '@/components/ui/DropdownMenu'
import { DataTable, type Column, type SortDirection } from '@/components/ui/DataTable'
import { Pagination } from '@/components/ui/Pagination'
import { PageLoading } from '@/components/ui/PageLoading'

export default function KnowledgeBaseDetailPage() {
    const params = useParams()
    const router = useRouter()
    const searchParams = useSearchParams()
    const pathname = usePathname()
    const dispatch = useAppDispatch()
    const kbId = params.id as string

    // Global State
    const kb = useAppSelector(selectCurrentKB)
    const stats = useAppSelector(selectStats)
    const folders = useAppSelector(selectFilteredFolders)
    const documents = useAppSelector(selectFilteredDocuments)
    const loading = useAppSelector(selectLoading)
    const autoRefreshing = useAppSelector(selectAutoRefreshing)
    const viewMode = useAppSelector(selectViewMode)
    const searchQuery = useAppSelector(selectSearchQuery)
    const selectedIds = useAppSelector(selectSelectedIds)
    const breadcrumbs = useAppSelector(selectBreadcrumbs)
    const currentFolderId = useAppSelector(selectCurrentFolderId)
    const draggedItem = useAppSelector(selectDraggedItem)
    const dragOverFolder = useAppSelector(selectDragOverFolder)
    const hasProcessing = useAppSelector(selectHasProcessingDocuments)
    const currentPage = useAppSelector((state) => state.knowledgeBase.currentPage)
    const pageSize = useAppSelector((state) => state.knowledgeBase.pageSize)
    const totalCount = useAppSelector(selectTotalCount)

    // UI Dialog State
    const [folderDialogOpen, setFolderDialogOpen] = useState(false)
    const [documentDialogOpen, setDocumentDialogOpen] = useState(false)
    const [queryDialogOpen, setQueryDialogOpen] = useState(false)
    const [chatDialogOpen, setChatDialogOpen] = useState(false)
    const [settingsDialogOpen, setSettingsDialogOpen] = useState(false)
    const [crawlerDialogOpen, setCrawlerDialogOpen] = useState(false)
    const [deleteItemId, setDeleteItemId] = useState<{ type: 'folder' | 'document'; id: string } | null>(null)
    const [showBulkDelete, setShowBulkDelete] = useState(false)
    const [editingItem, setEditingItem] = useState<{ type: 'folder' | 'document'; item: KBFolder | KBDocument } | null>(null)

    // DataTable State (Sort local, Pagination/Search in Redux)
    const [sortColumn, setSortColumn] = useState('name')
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

    // Sync URL -> Redux State
    // Sync URL -> Redux State
    const folderParam = searchParams.get('folder')

    useEffect(() => {
        if (folderParam !== currentFolderId) {
            // Only navigate if different. handle null/undefined cases
            const targetId = folderParam || null;
            if (targetId !== currentFolderId) {
                dispatch(navigateToFolder({ id: targetId!, name: '' })) // name will be empty initially, acceptable for now
            }
        }
    }, [folderParam, dispatch, currentFolderId])

    // Helper Functions
    const formatSize = (bytes: string | number) => {
        const size = typeof bytes === 'string' ? parseInt(bytes) : bytes
        if (isNaN(size) || size === 0) return '0 B'
        const k = 1024
        const sizes = ['B', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(size) / Math.log(k))
        return Math.round(size / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed': return <CheckCircle2 className="w-4 h-4 text-green-500" />
            case 'processing': return <Clock className="w-4 h-4 text-blue-500 animate-spin" />
            case 'failed': return <AlertCircle className="w-4 h-4 text-red-500" />
            default: return <Clock className="w-4 h-4 text-gray-500" />
        }
    }

    const getIcon = (iconName?: string | null) => {
        if (!iconName) return null
        return <Folder className="w-5 h-5" />
    }

    // Data Loading Logic
    const loadData = useCallback(() => {
        const filters = { search: searchQuery }
        // Ensure sort is stable or constructed correctly
        const sort = sortColumn ? [{ orderBy: sortColumn, order: (sortDirection || 'asc').toUpperCase() }] : undefined

        // Pass the explicit ID to ensure consistency with what we just decided in the Effect
        // However, we rely on Redux state 'currentFolderId' to be up to date.
        // If the Effect above just dispatched, Redux might not have updated in this render cycle if it was synchronous/batched? 
        // Actually, Redux dispatch is synchronous usually, but React re-render is asynchronous.
        // We wait for currentFolderId to update.

        dispatch(loadKnowledgeBase({
            kbId,
            folderId: currentFolderId,
            params: {
                page: currentPage,
                limit: pageSize,
                filters: JSON.stringify(filters),
                sort: sort ? JSON.stringify(sort) : undefined
            }
        }))
    }, [dispatch, kbId, currentFolderId, currentPage, pageSize, searchQuery, sortColumn, sortDirection])

    useEffect(() => {
        loadData()
    }, [loadData])

    useEffect(() => {
        return () => {
            dispatch(resetState())
        }
    }, [dispatch])

    useEffect(() => {
        dispatch(setAutoRefreshing(hasProcessing))
        if (hasProcessing) {
            const interval = setInterval(() => {
                const filters = { search: searchQuery }
                const sort = sortColumn ? [{ orderBy: sortColumn, order: (sortDirection || 'asc').toUpperCase() }] : undefined

                dispatch(refreshData({
                    kbId,
                    folderId: currentFolderId,
                    params: {
                        page: currentPage,
                        limit: pageSize,
                        filters: JSON.stringify(filters),
                        sort: sort ? JSON.stringify(sort) : undefined
                    }
                }))
            }, 5000)
            return () => clearInterval(interval)
        }
    }, [dispatch, hasProcessing, kbId, currentFolderId, currentPage, pageSize, searchQuery, sortColumn, sortDirection])

    // Handlers
    const handleNavigateToFolder = (id: string, name: string) => {
        const params = new URLSearchParams(searchParams.toString())
        if (id) {
            params.set('folder', id)
        } else {
            params.delete('folder')
        }
        dispatch(setPagination({ page: 1, pageSize }))
        router.push(`${pathname}?${params.toString()}` as any)
    }


    const handleNavigateToBreadcrumb = (index: number) => {
        let targetFolderId: string | null = null
        if (index > 0 && breadcrumbs[index]) {
            targetFolderId = breadcrumbs[index].id
        }

        const params = new URLSearchParams(searchParams.toString())
        if (targetFolderId) {
            params.set('folder', targetFolderId)
        } else {
            params.delete('folder')
        }
        dispatch(setPagination({ page: 1, pageSize }))
        router.push(`${pathname}?${params.toString()}` as any)
    }

    const handleCreateFolder = async (data: { name: string; description: string }) => {
        try {
            await dispatch(createFolder({
                knowledgeBaseId: kbId,
                parentFolderId: currentFolderId,
                name: data.name,
                description: data.description
            })).unwrap()
            toast.success('Folder created')
            setFolderDialogOpen(false)
            loadData()
        } catch (error) {
            toast.error('Failed to create folder')
        }
    }

    const handleCreateDocument = async (data: { name: string; content: string }) => {
        try {
            await dispatch(createDocument({
                knowledgeBaseId: kbId,
                folderId: currentFolderId,
                name: data.name,
                content: data.content
            })).unwrap()
            toast.success('Document created')
            setDocumentDialogOpen(false)
            loadData()
        } catch (error) {
            toast.error('Failed to create document')
        }
    }

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return
        const files = Array.from(e.target.files)
        try {
            for (const file of files) {
                await dispatch(uploadDocument({ kbId, folderId: currentFolderId, file })).unwrap()
            }
            toast.success('Files uploaded successfully')
            loadData()
        } catch (error) {
            toast.error('Failed to upload files')
        }
    }

    const handleDelete = async () => {
        if (!deleteItemId) return
        try {
            if (deleteItemId.type === 'folder') await dispatch(removeFolder(deleteItemId.id)).unwrap()
            else await dispatch(removeDocument(deleteItemId.id)).unwrap()
            toast.success('Item deleted')
            loadData()
        } catch (error) {
            toast.error('Failed to delete item')
        } finally {
            setDeleteItemId(null)
        }
    }

    const handleBulkDelete = async () => {
        if (!selectedIds.length) return
        try {
            // Split selectedIds into folders and documents
            const folderIds = selectedIds.filter(id => folders.some(f => f.id === id))
            const documentIds = selectedIds.filter(id => documents.some(d => d.id === id))

            await dispatch(removeBatchItems({ folderIds, documentIds })).unwrap()

            toast.success(`${selectedIds.length} items deleted`)
            dispatch(clearSelection())
            loadData()
        } catch (error) {
            toast.error('Failed to delete items')
        } finally {
            setShowBulkDelete(false)
        }
    }

    const handleDrop = async (targetFolderId: string | null) => {
        dispatch(setDragOverFolder(null))
        if (!draggedItem) return

        try {
            // Check if we are dragging a selection
            const isDraggingSelection = selectedIds.includes(draggedItem.id) && selectedIds.length > 1;

            if (isDraggingSelection) {
                const folderIds = selectedIds.filter(id => folders.some(f => f.id === id))
                const documentIds = selectedIds.filter(id => documents.some(d => d.id === id))

                // Prevent moving folder into itself or its children (simple check for itself)
                if (targetFolderId && folderIds.includes(targetFolderId)) {
                    toast.error("Cannot move a folder into itself")
                    return
                }

                await dispatch(moveBatchItems({ folderIds, documentIds, targetFolderId })).unwrap()
                toast.success(`${selectedIds.length} items moved`)
                dispatch(clearSelection())
            } else {
                if (draggedItem.type === 'folder') {
                    if (draggedItem.id === targetFolderId) return
                    await dispatch(moveFolderToFolder({ folderId: draggedItem.id, targetFolderId })).unwrap()
                } else {
                    await dispatch(moveDocumentToFolder({ documentId: draggedItem.id, targetFolderId })).unwrap()
                }
                toast.success('Item moved')
            }
            loadData()
        } catch (error) {
            toast.error('Failed to move item')
        } finally {
            dispatch(setDraggedItem(null))
        }
    }

    const handleSaveEdit = async (data: { name: string; description?: string; icon?: string }) => {
        if (!editingItem) return
        try {
            if (editingItem.type === 'folder') {
                await dispatch(updateFolder({ id: editingItem.item.id, updates: data })).unwrap()
            } else {
                await dispatch(updateDocument({ id: editingItem.item.id, updates: data })).unwrap()
            }
            toast.success('Item updated')
            setEditingItem(null)
            loadData()
        } catch (error) {
            toast.error('Failed to update item')
        }
    }

    const handleSaveSettings = async (data: any) => {
        await updateKnowledgeBase(kbId, data)
        toast.success('Settings saved')
        setSettingsDialogOpen(false)
        loadData()
    }

    // DataTable Configuration
    const columns: Column[] = useMemo(() => [
        {
            key: 'selection',
            label: '',
            width: 50,
            render: (_: any, row: any) => (
                <div onClick={e => e.stopPropagation()} className="flex justify-center">
                    <Checkbox
                        checked={selectedIds.includes(row.id)}
                        onCheckedChange={() => dispatch(toggleSelection(row.id))}
                    />
                </div>
            )
        },
        {
            key: 'name',
            label: 'Name',
            sortable: true,
            render: (value: any, row: any) => (
                <div
                    className="flex items-center gap-3 cursor-pointer py-1 group"
                    onClick={(e) => {
                        if (row.type === 'folder') {
                            e.stopPropagation();
                            handleNavigateToFolder(row.id, row.name);
                        }
                    }}
                >
                    <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110",
                        row.type === 'folder' ? "bg-blue-500/10 text-blue-500" : "bg-muted/50 text-muted-foreground"
                    )}>
                        {row.type === 'folder' ? (getIcon(row.icon) || <Folder className="w-5 h-5" />) : <FileText className="w-5 h-5" />}
                    </div>
                    <div>
                        <div className="font-bold text-sm leading-tight group-hover:text-primary transition-colors">{value}</div>
                        {row.description && <div className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1 font-medium">{row.description}</div>}
                    </div>
                </div>
            )
        },
        {
            key: 'type',
            label: 'Type',
            width: 100,
            render: (value: any, row: any) => (
                <Badge variant={row.type === 'folder' ? 'outline' : 'secondary'} className="font-black text-[10px] py-0.5 px-2 rounded-lg uppercase">
                    {row.type === 'folder' ? 'Folder' : (row.fileType || 'Text')}
                </Badge>
            )
        },
        {
            key: 'processingStatus',
            label: 'Status',
            width: 150,
            render: (value: any, row: any) => row.type === 'document' ? (
                <div className="flex items-center gap-2">
                    {getStatusIcon(value)}
                    <span className="text-[10px] font-bold capitalize">{value}</span>
                </div>
            ) : <span className="text-muted-foreground/30">—</span>
        },
        {
            key: 'fileSize',
            label: 'Size',
            width: 100,
            render: (value: any, row: any) => row.type === 'document' ? (
                <span className="text-xs font-bold text-muted-foreground">{formatSize(value)}</span>
            ) : <span className="text-muted-foreground/30">—</span>
        },
        {
            key: 'updatedAt',
            label: 'Updated',
            sortable: true,
            width: 120,
            render: (value: any) => <span className="text-xs font-medium text-muted-foreground">{new Date(value).toLocaleDateString()}</span>
        },
        {
            key: 'actions',
            label: '',
            width: 60,
            render: (_: any, row: any) => (
                <div className="flex justify-end" onClick={e => e.stopPropagation()}>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-muted font-bold">
                                <MoreVertical className="w-4 h-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 p-2 shadow-premium border-border/50 bg-card/90 backdrop-blur-xl">
                            {row.type === 'document' && (
                                <>
                                    <DropdownMenuItem className="flex items-center gap-2 font-bold cursor-pointer p-3" onClick={() => {
                                        import('@/lib/utils/document-actions').then(({ previewDocument }) => previewDocument(row.id))
                                    }}>
                                        <Eye className="w-4 h-4" /> Preview
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="flex items-center gap-2 font-bold cursor-pointer p-3" onClick={() => {
                                        import('@/lib/utils/document-actions').then(({ downloadDocument }) => downloadDocument(row.id, row.title || row.name))
                                    }}>
                                        <Download className="w-4 h-4" /> Download
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator className="bg-border/50 my-1" />
                                </>
                            )}
                            <DropdownMenuItem className="flex items-center gap-2 font-bold cursor-pointer p-3" onClick={() => setEditingItem({ type: row.type, item: row })}>
                                <Edit2 className="w-4 h-4 text-primary" /> Edit Properties
                            </DropdownMenuItem>
                            <DropdownMenuItem className="flex items-center gap-2 font-bold cursor-pointer p-3 text-destructive focus:text-destructive focus:bg-destructive/10" onClick={() => setDeleteItemId({ type: row.type, id: row.id })}>
                                <Trash2 className="w-4 h-4" /> Delete Item
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            )
        }
    ], [selectedIds, dispatch, handleNavigateToFolder])

    const allFolders = useAppSelector(state => state.knowledgeBase.allFolders)

    const allDocuments = useAppSelector(state => state.knowledgeBase.documents)

    const tableData = useMemo(() => {
        const buildFolderTree = (parentId: string | null): any[] => {
            const currentFolders = allFolders.filter(f =>
                (f.parentId === parentId || f.parentFolderId === parentId) ||
                (!f.parentId && !f.parentFolderId && parentId === null)
            )

            const currentDocs = allDocuments.filter(d =>
                (d.folderId === parentId) ||
                (!d.folderId && parentId === null)
            )

            const folderItems = currentFolders.map(f => ({
                id: f.id,
                name: f.name,
                type: 'folder' as const,
                description: f.description || undefined,
                fileSize: undefined,
                processingStatus: undefined,
                updatedAt: f.updatedAt || new Date().toISOString(),
                icon: f.icon || undefined,
                children: buildFolderTree(f.id)
            }))

            const docItems = currentDocs.map(d => ({
                id: d.id,
                name: d.name,
                type: 'document' as const,
                description: undefined,
                fileSize: d.fileSize,
                processingStatus: d.processingStatus,
                updatedAt: d.updatedAt || new Date().toISOString(),
                icon: undefined
            }))

            return [...folderItems, ...docItems]
        }

        // If in table view and at root, we might want to show the full tree
        // But if searching, show flat view
        if (viewMode === 'table' && !searchQuery) {
            // In tree mode, we start from the current folder but fetch EVERYTHING relative to it
            return buildFolderTree(currentFolderId)
        }

        // Flat view for grid or search
        const folderItems = folders.map(f => ({
            id: f.id,
            name: f.name,
            type: 'folder' as const,
            description: f.description || undefined,
            fileSize: undefined,
            processingStatus: undefined,
            updatedAt: f.updatedAt || new Date().toISOString(),
            icon: f.icon || undefined
        }))
        const documentItems = documents.map(d => ({
            id: d.id,
            name: d.name,
            type: 'document' as const,
            description: undefined,
            fileSize: d.fileSize,
            processingStatus: d.processingStatus,
            updatedAt: d.updatedAt || new Date().toISOString(),
            icon: undefined
        }))
        return [...folderItems, ...documentItems]
    }, [folders, allFolders, documents, allDocuments, viewMode, searchQuery, currentFolderId])

    const pagination = useMemo(() => ({
        page: currentPage,
        limit: pageSize,
        total: totalCount,
        hasNextPage: currentPage * pageSize < totalCount,
        totalPages: Math.ceil(totalCount / pageSize)
    }), [currentPage, pageSize, totalCount])



    if (loading && !kb) return <PageLoading message="Loading collection" />
    if (!kb) return (
        <div className="flex flex-col items-center justify-center h-full">
            <Database className="w-16 h-16 text-muted-foreground mb-4 opacity-20" />
            <h2 className="text-xl font-bold mb-2">Collection Not Found</h2>
            <Button variant="outline" onClick={() => router.push('/knowledge-base')}><ArrowLeft className="w-4 h-4 mr-2" /> Back to Collections</Button>
        </div>
    )

    return (
        <div className="h-full flex flex-col space-y-6">
            {stats && <KBStatsCards stats={stats} />}
            <KBProcessingStatus knowledgeBaseId={kbId} />

            <KBBreadcrumbs
                rootName={kb!.name}
                breadcrumbs={breadcrumbs}
                onNavigate={handleNavigateToBreadcrumb}
                onDrop={handleDrop}
                dragOverId={dragOverFolder}
            />

            <KbToolbar
                searchQuery={searchQuery}
                viewMode={viewMode}
                isLoading={loading}
                onSearchChange={(query) => dispatch(setSearchQuery(query))}
                onViewModeChange={(mode) => dispatch(setViewMode(mode))}
                onRefresh={loadData}
                onCreateFolder={() => setFolderDialogOpen(true)}
                onCreateDocument={() => setDocumentDialogOpen(true)}
                onUploadFile={() => (document.querySelector('input[type="file"]') as HTMLInputElement)?.click()}
                onCrawlWebsite={() => setCrawlerDialogOpen(true)}
                selectedCount={selectedIds.length}
                onDeleteSelected={() => setShowBulkDelete(true)}
            />

            {viewMode === 'table' ? (
                <KbTableView
                    items={tableData}
                    selectedIds={selectedIds}
                    sortColumn={sortColumn}
                    sortDirection={sortDirection}
                    isLoading={loading}
                    pagination={pagination}
                    onPageChange={(p) => dispatch(setPagination({ page: p, pageSize }))}
                    onPageSizeChange={(s) => dispatch(setPagination({ page: 1, pageSize: s }))}
                    onItemClick={(item) => item.type === 'folder' && handleNavigateToFolder(item.id, item.name)}
                    onToggleSelection={(id) => dispatch(toggleSelection(id))}
                    onToggleSelectAll={(checked) => dispatch(toggleSelectAll(checked))}
                    onSort={(column, direction) => {
                        setSortColumn(column);
                        setSortDirection(direction as SortDirection);
                    }}
                    onEditItem={(item) => setEditingItem({ type: item.type, item: item as unknown as KBFolder | KBDocument })}
                    onDeleteItem={(item) => setDeleteItemId({ type: item.type, id: item.id })}
                    onPreviewDocument={(id) => {
                        import('@/lib/utils/document-actions').then(({ previewDocument }) => previewDocument(id));
                    }}
                    onDownloadDocument={(id, filename) => {
                        import('@/lib/utils/document-actions').then(({ downloadDocument }) => downloadDocument(id, filename));
                    }}
                    onDragStart={(item) => dispatch(setDraggedItem({ type: item.type, id: item.id }))}
                    onDragOver={(folderId) => dispatch(setDragOverFolder(folderId))}
                    onDrop={(targetFolderId) => handleDrop(targetFolderId)}
                />
            ) : (
                <KbGridView
                    items={tableData}
                    selectedIds={selectedIds}
                    draggedItem={draggedItem}
                    dragOverFolder={dragOverFolder}
                    isLoading={loading}
                    onItemClick={(item) => item.type === 'folder' && handleNavigateToFolder(item.id, item.name)}
                    onToggleSelection={(id) => dispatch(toggleSelection(id))}
                    onDragStart={(item) => dispatch(setDraggedItem({ type: item.type, id: item.id }))}
                    onDragOver={(folderId) => dispatch(setDragOverFolder(folderId))}
                    onDrop={(targetFolderId) => handleDrop(targetFolderId)}
                    onEditItem={(item) => setEditingItem({ type: item.type, item: item as unknown as KBFolder | KBDocument })}
                    onDeleteItem={(item) => setDeleteItemId({ type: item.type, id: item.id })}
                    onPreviewDocument={(id) => {
                        import('@/lib/utils/document-actions').then(({ previewDocument }) => previewDocument(id));
                    }}
                    onDownloadDocument={(id, filename) => {
                        import('@/lib/utils/document-actions').then(({ downloadDocument }) => downloadDocument(id, filename));
                    }}
                />
            )}
            <KBFolderDialog open={folderDialogOpen} onOpenChange={setFolderDialogOpen} onSubmit={handleCreateFolder} />
            <KBDocumentDialog open={documentDialogOpen} onOpenChange={setDocumentDialogOpen} onSubmit={handleCreateDocument} />
            <KBQueryDialog open={queryDialogOpen} onOpenChange={setQueryDialogOpen} onQuery={async (q) => (await queryKnowledgeBase({ query: q, knowledgeBaseId: kbId, limit: 5 })).results} />
            <KBChatDialog open={chatDialogOpen} onOpenChange={setChatDialogOpen} knowledgeBaseId={kbId} knowledgeBaseName={kb!.name} />
            <KBSettingsDialog open={settingsDialogOpen} onOpenChange={setSettingsDialogOpen} knowledgeBase={kb!} onSave={handleSaveSettings} />
            <KBCrawlerDialog open={crawlerDialogOpen} onOpenChange={setCrawlerDialogOpen} knowledgeBaseId={kbId} folderId={currentFolderId} onSuccess={() => loadData()} />
            <KBItemEditDialog open={editingItem !== null} onOpenChange={(o) => !o && setEditingItem(null)} item={editingItem?.item || null} type={editingItem?.type || 'folder'} onSubmit={handleSaveEdit} />
            <AlertDialogConfirm open={deleteItemId !== null} onOpenChange={(o) => !o && setDeleteItemId(null)} title={`Delete ${deleteItemId?.type}`} description="This action cannot be undone." onConfirm={handleDelete} variant="destructive" />
            <AlertDialogConfirm open={showBulkDelete} onOpenChange={setShowBulkDelete} title={`Delete ${selectedIds.length} items`} description="This will permanently remove selected items." onConfirm={handleBulkDelete} variant="destructive" />
        </div>
    )
}
