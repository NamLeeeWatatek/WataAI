'use client';

import { useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useKbStore } from '@/lib/store/zustand/kb-store';
import { useUiStore } from '@/lib/store/zustand/ui-store';
import type { KBFolder, KBDocument, KnowledgeBase } from '@/lib/types/knowledge-base';
import toast from '@/lib/toast';
import { useKBContent } from '@/lib/hooks/use-kb';

export function useKnowledgeBaseController(kbId: string) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const pathname = usePathname();

    // Zustand Store with selectors for stability
    const viewMode = useKbStore((state) => state.viewMode);
    const searchQuery = useKbStore((state) => state.searchQuery);
    const breadcrumbs = useKbStore((state) => state.breadcrumbs);
    const selectedIds = useKbStore((state) => state.selectedIds);
    const draggedItem = useKbStore((state) => state.draggedItem);
    const dragOverFolder = useKbStore((state) => state.dragOverFolder);
    const currentPage = useKbStore((state) => state.currentPage);
    const pageSize = useKbStore((state) => state.pageSize);
    const setViewMode = useKbStore((state) => state.setViewMode);
    const setSearchQuery = useKbStore((state) => state.setSearchQuery);
    const setSelectedIds = useKbStore((state) => state.setSelectedIds);
    const clearSelection = useKbStore((state) => state.clearSelection);
    const setDraggedItem = useKbStore((state) => state.setDraggedItem);
    const setDragOverFolder = useKbStore((state) => state.setDragOverFolder);
    const setPagination = useKbStore((state) => state.setPagination);
    const resetState = useKbStore((state) => state.resetState);
    const zustandNavigateToFolder = useKbStore((state) => state.navigateToFolder);
    const zustandNavigateToBreadcrumb = useKbStore((state) => state.navigateToBreadcrumb);
    const setAutoRefreshing = useKbStore((state) => state.setAutoRefreshing);
    const toggleSelection = useKbStore((state) => state.toggleSelection);

    const setBreadcrumbName = useUiStore((state) => state.setBreadcrumbName);
    const removeBreadcrumbName = useUiStore((state) => state.removeBreadcrumbName);

    // Initial Load & URL Sync
    const folderParam = searchParams.get('folder');

    // TanStack Query Hooks
    const {
        kb,
        stats,
        content,
        isLoading: isQueryLoading,
        refetch: refresh,
        createFolder,
        createDocument,
        uploadDocument,
        updateFolder,
        updateDocument,
        deleteFolder,
        deleteDocument,
        moveFolder,
        moveDocument,
        deleteBatch,
        moveBatch
    } = useKBContent(kbId, folderParam || null, {
        page: currentPage,
        limit: pageSize,
        search: searchQuery
    });

    const folders = useMemo(() => content?.folders || [], [content]);
    const documents = useMemo(() => content?.documents?.data || [], [content]);
    const totalCount = useMemo(() => content?.documents?.total || 0, [content]);
    const hasProcessing = useMemo(() => documents.some(doc => doc.processingStatus === 'processing'), [documents]);

    // Reset state on unmount or ID change
    useEffect(() => {
        return () => {
            resetState();
        };
    }, [resetState, kbId]);

    const autoRefreshing = useKbStore((state) => state.autoRefreshing);

    // Auto Refresh Logic
    useEffect(() => {
        if (autoRefreshing !== hasProcessing) {
            setAutoRefreshing(hasProcessing);
        }

        if (hasProcessing) {
            const interval = setInterval(() => {
                refresh();
            }, 5000);
            return () => clearInterval(interval);
        }
    }, [hasProcessing, autoRefreshing, setAutoRefreshing, refresh]);

    // Breadcrumb Name Sync
    useEffect(() => {
        if (kb?.name) {
            setBreadcrumbName(kbId, kb.name);
        }
        return () => {
            removeBreadcrumbName(kbId);
        };
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
            zustandNavigateToFolder(folderId, folderName || '...');
        }

        router.push(`${pathname}?${params.toString()}` as any);
    }, [searchParams, router, pathname, zustandNavigateToFolder]);

    const handleNavigateBreadcrumb = useCallback((index: number) => {
        const targetId = index === -1 ? null : breadcrumbs[index]?.id || null;
        handleNavigateToFolder(targetId, breadcrumbs[index]?.name);
        zustandNavigateToBreadcrumb(index);
    }, [breadcrumbs, handleNavigateToFolder, zustandNavigateToBreadcrumb]);

    const createNewFolder = useCallback(async (name: string, description: string) => {
        try {
            await createFolder({
                knowledgeBaseId: kbId,
                parentFolderId: folderParam || null,
                name,
                description
            });
            refresh();
            return true;
        } catch (e) {
            return false;
        }
    }, [kbId, folderParam, createFolder, refresh]);

    const createNewDoc = useCallback(async (name: string, content: string) => {
        try {
            await createDocument({
                knowledgeBaseId: kbId,
                folderId: folderParam || null,
                name,
                content
            });
            refresh();
            return true;
        } catch (e) {
            return false;
        }
    }, [kbId, folderParam, createDocument, refresh]);

    const uploadFiles = useCallback(async (files: File[]) => {
        try {
            for (const file of files) {
                await uploadDocument({ kbId, folderId: folderParam || null, file });
            }
            refresh();
            return true;
        } catch (e) {
            return false;
        }
    }, [kbId, folderParam, uploadDocument, refresh]);

    const deleteItems = useCallback(async (items: { type: 'folder' | 'document'; id: string }[]) => {
        try {
            if (items.length === 1) {
                const item = items[0];
                if (item.type === 'folder') await deleteFolder(item.id);
                else await deleteDocument(item.id);
            } else {
                const folderIds = items.filter(i => i.type === 'folder').map(i => i.id);
                const documentIds = items.filter(i => i.type === 'document').map(i => i.id);
                await deleteBatch({ folderIds, documentIds });
            }
            clearSelection();
            refresh();
            return true;
        } catch (e) {
            return false;
        }
    }, [deleteFolder, deleteDocument, deleteBatch, clearSelection, refresh]);

    const moveItems = useCallback(async (items: { type: 'folder' | 'document'; id: string }[], targetFolderId: string | null) => {
        try {
            const folderIds = items.filter(i => i.type === 'folder').map(i => i.id);
            if (targetFolderId && folderIds.includes(targetFolderId)) {
                toast.error("Cannot move folder into itself");
                return false;
            }

            if (items.length === 1) {
                const item = items[0];
                if (item.type === 'folder') await moveFolder({ folderId: item.id, targetFolderId });
                else await moveDocument({ documentId: item.id, targetFolderId });
            } else {
                const documentIds = items.filter(i => i.type === 'document').map(i => i.id);
                await moveBatch({ folderIds, documentIds, targetFolderId });
            }
            clearSelection();
            refresh();
            return true;
        } catch (e) {
            return false;
        }
    }, [moveFolder, moveDocument, moveBatch, clearSelection, refresh]);

    const tableData = useMemo(() => {
        const filteredFolders = searchQuery
            ? folders.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()))
            : folders;

        const folderItems = filteredFolders.map(f => ({
            id: f.id,
            name: f.name,
            type: 'folder' as const,
            description: f.description || undefined,
            updatedAt: f.updatedAt || new Date().toISOString(),
            icon: f.icon || undefined,
        }));

        const docItems = documents.map(d => ({
            ...d,
            id: d.id,
            name: d.name,
            type: 'document' as const,
            description: undefined,
            fileSize: d.fileSize,
            processingStatus: d.processingStatus,
            updatedAt: d.updatedAt || new Date().toISOString(),
        }));

        return [...folderItems, ...docItems];
    }, [folders, documents, searchQuery]);

    const toggleSelectAll = useCallback((checked: boolean) => {
        if (checked) {
            const allIds = [...folders.map(f => f.id), ...documents.map(d => d.id)];
            setSelectedIds(allIds);
        } else {
            clearSelection();
        }
    }, [folders, documents, setSelectedIds, clearSelection]);

    return {
        kb,
        stats,
        items: tableData,
        breadcrumbs,
        currentFolderId: folderParam || null,
        isLoading: isQueryLoading,
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

        updateFolder: (id: string, updates: any) => updateFolder({ id, updates }).then(() => refresh()),
        updateDocument: (id: string, updates: any) => updateDocument({ id, updates }).then(() => refresh()),
    };
}
