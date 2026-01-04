import { useEffect, useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
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
    const isLoading = useAppSelector(selectLoading);
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

    // Reset state on unmount or ID change
    useEffect(() => {
        return () => {
            dispatch(resetState());
        };
    }, [dispatch, kbId]);

    // Load Data Effect
    useEffect(() => {
        // Only load if not already loaded or if ID changes
        // We defer to the ID passed to loadKnowledgeBase
        if (kbId) {
            dispatch(loadKnowledgeBase({
                kbId,
                folderId: folderParam || null,
                page: currentPage,
                limit: pageSize
            }));
        }
    }, [dispatch, kbId, folderParam, currentPage, pageSize]);

    // Auto Refresh Logic
    useEffect(() => {
        dispatch(setAutoRefreshing(hasProcessing));
        if (hasProcessing) {
            const interval = setInterval(() => {
                dispatch(refreshData({ kbId, folderId: currentFolderId, page: currentPage, limit: pageSize }));
            }, 5000);
            return () => clearInterval(interval);
        }
    }, [hasProcessing, dispatch, kbId, currentFolderId]);

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
        const target = breadcrumbs[index];
        const targetId = index === 0 ? null : target?.id; // Assuming 0 is root or handled

        // Actually breadcrumbs logic in slice might have root as empty or first item
        // Let's safe check: if index is -1 or whatever logic
        // For simplicity, we trust the slice or iterate
        // Use slice action?
        // Actually, we should just use the ID from the breadcrumb array to navigate

        // If we want to strictly follow the URL pattern:
        if (index < 0) return;

        // If index is 0 and it's root (check your breadcrumb structure. Usually root is not in array or array[0] is root?)
        // In this app, breadcrumbs seems to be user-navigated path.
        // Let's assume breadcrumbs are correct.

        let idToNav = null;
        if (index < breadcrumbs.length) {
            idToNav = breadcrumbs[index].id;
        }
        // If it's the strict "Root" usually we want null. 
        // We'll rely on the breadcrumb object's ID.

        handleNavigateToFolder(idToNav, breadcrumbs[index]?.name);
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
            return true;
        } catch (e) {
            toast.error('Failed to create folder');
            return false;
        }
    }, [dispatch, kbId, currentFolderId]);

    const createNewDoc = useCallback(async (name: string, content: string) => {
        try {
            await dispatch(createDocument({
                knowledgeBaseId: kbId,
                folderId: currentFolderId,
                name,
                content
            })).unwrap();
            toast.success('Document created');
            return true;
        } catch (e) {
            toast.error('Failed to create document');
            return false;
        }
    }, [dispatch, kbId, currentFolderId]);

    const uploadFiles = useCallback(async (files: File[]) => {
        try {
            for (const file of files) {
                await dispatch(uploadDocument({ kbId, folderId: currentFolderId, file })).unwrap();
            }
            toast.success('Files uploaded successfully');
            dispatch(refreshData({ kbId, folderId: currentFolderId })); // refresh to get status
            return true;
        } catch (e) {
            toast.error('Failed to upload files');
            return false;
        }
    }, [dispatch, kbId, currentFolderId]);

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
            return true;
        } catch (e) {
            toast.error('Failed to delete items');
            return false;
        }
    }, [dispatch]);

    const moveItems = useCallback(async (items: { type: 'folder' | 'document'; id: string }[], targetFolderId: string | null) => {
        try {
            // Prevent moving into self
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
            // Refresh current view as items disappeared
            dispatch(refreshData({ kbId, folderId: currentFolderId }));
            return true;
        } catch (e) {
            toast.error('Failed to move items');
            return false;
        }
    }, [dispatch, kbId, currentFolderId]);

    // Data Transformation for UI
    const tableData = useMemo(() => {
        // Flattened list for the current view
        // If we want tree view, we might need more complex logic, but let's stick to current folder view for now
        // heavily filtering based on search query is handled by selector `selectFilteredFolders`

        const folderItems = folders.map(f => ({
            id: f.id,
            name: f.name,
            type: 'folder' as const,
            description: f.description || undefined,
            updatedAt: f.updatedAt || new Date().toISOString(),
            icon: f.icon || undefined,
            // Add extra fields if needed by Grid/Table
        }));

        const docItems = documents.map(d => ({
            id: d.id,
            name: d.name,
            type: 'document' as const,
            description: undefined,
            fileSize: d.fileSize,
            processingStatus: d.processingStatus,
            updatedAt: d.updatedAt || new Date().toISOString(),
            // Add extra fields
        }));

        return [...folderItems, ...docItems];
        return [...folderItems, ...docItems];
    }, [folders, documents]);



    return {
        // State
        kb,
        stats,
        items: tableData,
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

        // Actions
        setSearchQuery: (q: string) => dispatch(setSearchQuery(q)),
        setViewMode: (m: 'grid' | 'table') => dispatch(setViewMode(m)),
        handleNavigateToFolder,
        handleNavigateBreadcrumb,
        createNewFolder,
        createNewDoc,
        uploadFiles,
        deleteItems,
        moveItems,
        refresh: () => dispatch(refreshData({ kbId, folderId: currentFolderId, page: currentPage, limit: pageSize })),
        toggleSelection: (id: string) => dispatch(toggleSelection(id)),
        toggleSelectAll: (checked: boolean) => dispatch(toggleSelectAll(checked)),
        setDraggedItem: (item: { type: 'folder' | 'document'; id: string } | null) => dispatch(setDraggedItem(item)),
        setDragOverFolder: (id: string | null) => dispatch(setDragOverFolder(id)),
        setPagination: (p: number, s: number) => dispatch(setPagination({ page: p, pageSize: s })),
        clearSelection: () => dispatch(clearSelection()),

        // Edit wrappers
        updateFolder: (id: string, updates: any) => dispatch(updateFolder({ id, updates })),
        updateDocument: (id: string, updates: any) => dispatch(updateDocument({ id, updates })),
    };
}
