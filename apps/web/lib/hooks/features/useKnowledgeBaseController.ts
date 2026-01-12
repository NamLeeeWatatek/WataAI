'use client';

import { useEffect, useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import {
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
    setSearchQuery,
    setViewMode,
    toggleSelection,
    toggleSelectAll,
    clearSelection,
    setDraggedItem,
    setDragOverFolder,
    setPagination,
    resetState,
    selectCurrentKB,
    selectStats,
    selectFilteredFolders,
    selectFilteredDocuments,
    selectLoading,
    selectViewMode,
    selectSearchQuery,
    selectSelectedIds,
    selectBreadcrumbs,
    selectCurrentFolderId,
    selectDraggedItem,
    selectDragOverFolder,
    selectTotalCount,
    selectHasProcessingDocuments,
    setAutoRefreshing,
} from '@/lib/store/slices/knowledgeBaseSlice';
import type { KBFolder, KBDocument, KnowledgeBase } from '@/lib/types/knowledge-base';
import { useBreadcrumbStore } from '@/lib/stores/useBreadcrumbStore';
import toast from '@/lib/toast';
import { useQuery } from '@tanstack/react-query';
import { getKnowledgeBase, getKnowledgeBaseStats, getKBContent } from '@/lib/api/knowledge-base';

export function useKnowledgeBaseController(kbId: string) {
    const dispatch = useAppDispatch();
    const router = useRouter();
    const searchParams = useSearchParams();
    const pathname = usePathname();

    // Redux Selectors
    const kb = useAppSelector(selectCurrentKB);
    const stats = useAppSelector(selectStats);
    const folders = useAppSelector(selectFilteredFolders);
    const documents = useAppSelector(selectFilteredDocuments);
    const isLoadingRedux = useAppSelector(selectLoading);
    const viewMode = useAppSelector(selectViewMode);
    const searchQuery = useAppSelector(selectSearchQuery);
    const selectedIds = useAppSelector(selectSelectedIds);
    const breadcrumbs = useAppSelector(selectBreadcrumbs);
    const currentFolderId = useAppSelector(selectCurrentFolderId);
    const draggedItem = useAppSelector(selectDraggedItem);
    const dragOverFolder = useAppSelector(selectDragOverFolder);
    const totalCount = useAppSelector(selectTotalCount);
    const hasProcessing = useAppSelector(selectHasProcessingDocuments);

    // Pagination from Redux
    const currentPage = useAppSelector((state) => state.knowledgeBase.currentPage);
    const pageSize = useAppSelector((state) => state.knowledgeBase.pageSize);

    // Initial Load & URL Sync
    const folderParam = searchParams.get('folder');

    // React Query for Data Fetching
    const {
        data: serverData,
        isLoading: isQueryLoading,
        refetch: refresh
    } = useQuery({
        queryKey: ['kb-detail', kbId, folderParam, currentPage, pageSize, searchQuery],
        queryFn: async () => {
            if (!kbId) return null;
            const [kbRes, statsRes, contentRes] = await Promise.all([
                getKnowledgeBase(kbId),
                getKnowledgeBaseStats(kbId),
                getKBContent(kbId, folderParam || null, currentPage, pageSize, searchQuery),
            ]);

            const kb = (kbRes as any)?.data || kbRes;
            const stats = (statsRes as any)?.data || statsRes;

            return {
                kb,
                stats,
                folders: contentRes.folders,
                documents: contentRes.documents.data,
                total: contentRes.documents.total,
                breadcrumbs: contentRes.breadcrumbs,
            };
        },
        enabled: !!kbId,
        staleTime: 60000,
    });

    // Sync Query Data to Redux
    useEffect(() => {
        if (serverData) {
            dispatch({
                type: 'knowledgeBase/load/fulfilled',
                payload: {
                    kb: serverData.kb,
                    stats: serverData.stats,
                    folders: serverData.folders,
                    documents: serverData.documents,
                    total: serverData.total,
                    breadcrumbs: serverData.breadcrumbs,
                    folderId: folderParam || null
                },
                meta: { arg: { kbId, folderId: folderParam, page: currentPage, limit: pageSize } }
            });
        }
    }, [serverData, dispatch, kbId, folderParam, currentPage, pageSize]);

    // Reset state on unmount or ID change
    useEffect(() => {
        return () => {
            dispatch(resetState());
        };
    }, [dispatch, kbId]);

    // Auto Refresh Logic
    useEffect(() => {
        dispatch(setAutoRefreshing(hasProcessing));
        if (hasProcessing) {
            const interval = setInterval(() => {
                refresh();
            }, 5000);
            return () => clearInterval(interval);
        }
    }, [hasProcessing, dispatch, refresh]);

    // Breadcrumb Name Sync
    const setBreadcrumbName = useBreadcrumbStore(state => state.setBreadcrumbName);
    const removeBreadcrumbName = useBreadcrumbStore(state => state.removeBreadcrumbName);

    useEffect(() => {
        if (kb?.name) {
            setBreadcrumbName(kbId, kb.name);
        }
        return () => removeBreadcrumbName(kbId);
    }, [kb, kbId, setBreadcrumbName, removeBreadcrumbName]);

    // Actions
    const handleNavigateToFolder = useCallback((folderId: string | null, folderName?: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (folderId) {
            params.set('folder', folderId);
        } else {
            params.delete('folder');
        }

        // Optimistic update
        if (folderId) {
            dispatch(navigateToFolder({ id: folderId, name: folderName || '...' }));
        }

        router.push(`${pathname}?${params.toString()}` as any);
    }, [searchParams, router, pathname, dispatch]);

    const handleNavigateBreadcrumb = useCallback((index: number) => {
        const targetId = index === -1 ? null : breadcrumbs[index]?.id || null;
        handleNavigateToFolder(targetId, breadcrumbs[index]?.name);
    }, [breadcrumbs, handleNavigateToFolder]);

    const createNewFolder = useCallback(async (name: string, description: string) => {
        try {
            await dispatch(createFolder({
                knowledgeBaseId: kbId,
                parentFolderId: currentFolderId,
                name,
                description
            })).unwrap();
            toast.success('Folder created');
            refresh();
            return true;
        } catch (e) {
            toast.error('Failed to create folder');
            return false;
        }
    }, [dispatch, kbId, currentFolderId, refresh]);

    const createNewDoc = useCallback(async (name: string, content: string) => {
        try {
            await dispatch(createDocument({
                knowledgeBaseId: kbId,
                folderId: currentFolderId,
                name,
                content
            })).unwrap();
            toast.success('Document created');
            refresh();
            return true;
        } catch (e) {
            toast.error('Failed to create document');
            return false;
        }
    }, [dispatch, kbId, currentFolderId, refresh]);

    const uploadFiles = useCallback(async (files: File[]) => {
        try {
            for (const file of files) {
                await dispatch(uploadDocument({ kbId, folderId: currentFolderId, file })).unwrap();
            }
            toast.success('Files uploaded successfully');
            refresh();
            return true;
        } catch (e) {
            toast.error('Failed to upload files');
            return false;
        }
    }, [dispatch, kbId, currentFolderId, refresh]);

    const deleteItems = useCallback(async (items: { type: 'folder' | 'document'; id: string }[]) => {
        try {
            if (items.length === 1) {
                const item = items[0];
                if (item.type === 'folder') await dispatch(removeFolder(item.id)).unwrap();
                else await dispatch(removeDocument(item.id)).unwrap();
            } else {
                const folderIds = items.filter(i => i.type === 'folder').map(i => i.id);
                const documentIds = items.filter(i => i.type === 'document').map(i => i.id);
                await dispatch(removeBatchItems({ folderIds, documentIds })).unwrap();
            }
            toast.success(`Deleted ${items.length} items`);
            dispatch(clearSelection());
            refresh();
            return true;
        } catch (e) {
            toast.error('Failed to delete items');
            return false;
        }
    }, [dispatch, refresh]);

    const moveItems = useCallback(async (items: { type: 'folder' | 'document'; id: string }[], targetFolderId: string | null) => {
        try {
            const folderIds = items.filter(i => i.type === 'folder').map(i => i.id);
            if (targetFolderId && folderIds.includes(targetFolderId)) {
                toast.error("Cannot move folder into itself");
                return false;
            }

            if (items.length === 1) {
                const item = items[0];
                if (item.type === 'folder') await dispatch(moveFolderToFolder({ folderId: item.id, targetFolderId })).unwrap();
                else await dispatch(moveDocumentToFolder({ documentId: item.id, targetFolderId })).unwrap();
            } else {
                const documentIds = items.filter(i => i.type === 'document').map(i => i.id);
                await dispatch(moveBatchItems({ folderIds, documentIds, targetFolderId })).unwrap();
            }
            toast.success(`Moved ${items.length} items`);
            dispatch(clearSelection());
            refresh();
            return true;
        } catch (e) {
            toast.error('Failed to move items');
            return false;
        }
    }, [dispatch, kbId, currentFolderId, refresh]);

    const tableData = useMemo(() => {
        const folderItems = folders.map(f => ({
            id: f.id,
            name: f.name,
            type: 'folder' as const,
            description: f.description || undefined,
            updatedAt: f.updatedAt || new Date().toISOString(),
            icon: f.icon || undefined,
        }));

        const docItems = documents.map(d => ({
            id: d.id,
            name: d.name,
            type: 'document' as const,
            description: undefined,
            fileSize: d.fileSize,
            processingStatus: d.processingStatus,
            updatedAt: d.updatedAt || new Date().toISOString(),
        }));

        return [...folderItems, ...docItems];
    }, [folders, documents]);

    return {
        kb,
        stats,
        items: tableData,
        breadcrumbs,
        currentFolderId,
        isLoading: isQueryLoading || isLoadingRedux,
        viewMode,
        searchQuery,
        selectedIds,
        currentPage,
        pageSize,
        totalCount,
        draggedItem,
        dragOverFolder,

        setSearchQuery: (q: string) => dispatch(setSearchQuery(q)),
        setViewMode: (m: 'grid' | 'table') => dispatch(setViewMode(m)),
        handleNavigateToFolder,
        handleNavigateBreadcrumb,
        createNewFolder,
        createNewDoc,
        uploadFiles,
        deleteItems,
        moveItems,
        refresh,
        toggleSelection: (id: string) => dispatch(toggleSelection(id)),
        toggleSelectAll: (checked: boolean) => dispatch(toggleSelectAll(checked)),
        setDraggedItem: (item: { type: 'folder' | 'document'; id: string } | null) => dispatch(setDraggedItem(item)),
        setDragOverFolder: (id: string | null) => dispatch(setDragOverFolder(id)),
        setPagination: (p: number, s: number) => dispatch(setPagination({ page: p, pageSize: s })),
        clearSelection: () => dispatch(clearSelection()),

        updateFolder: (id: string, updates: any) => dispatch(updateFolder({ id, updates })).then(() => refresh()),
        updateDocument: (id: string, updates: any) => dispatch(updateDocument({ id, updates })).then(() => refresh()),
    };
}
