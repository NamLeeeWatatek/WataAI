'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getKnowledgeBases,
    getKnowledgeBase,
    getKnowledgeBaseStats,
    getKBContent,
    createKnowledgeBase,
    updateKnowledgeBase,
    deleteKnowledgeBase,
    createKBFolder,
    updateKBFolder,
    deleteKBFolder,
    createKBDocument,
    updateKBDocument,
    deleteKBDocument,
    uploadKBDocument,
    moveKBFolder,
    moveKBDocument,
    deleteKBBatch,
    moveKBBatch
} from '@/lib/api/knowledge-base';
import toast from '@/lib/toast';
import { useUiStore } from '@/lib/store/zustand/ui-store';

export const kbKeys = {
    all: ['knowledge-bases'] as const,
    lists: () => [...kbKeys.all, 'list'] as const,
    list: (workspaceId: string, params: any) => [...kbKeys.lists(), workspaceId, params] as const,
    details: () => [...kbKeys.all, 'detail'] as const,
    detail: (id: string) => [...kbKeys.details(), id] as const,
    content: (id: string, folderId: string | null, params: any) => [...kbKeys.detail(id), 'content', folderId, params] as const,
    stats: (id: string) => [...kbKeys.detail(id), 'stats'] as const,
};

export function useKnowledgeBases(workspaceId?: string, params: any = {}) {
    const queryClient = useQueryClient();
    const { setGlobalLoading } = useUiStore();

    const query = useQuery({
        queryKey: kbKeys.list(workspaceId || '', params),
        queryFn: async () => {
            if (!workspaceId) return { data: [], total: 0 };
            const data: any = await getKnowledgeBases({
                ...params,
                workspaceId,
            });

            if (Array.isArray(data)) {
                return { data, total: data.length };
            }
            return { data: data.data || [], total: data.total || 0 };
        },
        enabled: !!workspaceId,
    });

    const createMutation = useMutation({
        onMutate: () => setGlobalLoading('create-kb', true, 'Creating knowledge base...'),
        mutationFn: (data: any) => createKnowledgeBase(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: kbKeys.lists() });
            toast.success('Knowledge Base created successfully');
        },
        onSettled: () => setGlobalLoading('create-kb', false),
    });

    const updateMutation = useMutation({
        onMutate: () => setGlobalLoading('update-kb', true, 'Updating knowledge base...'),
        mutationFn: ({ id, data }: { id: string; data: any }) => updateKnowledgeBase(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: kbKeys.lists() });
            queryClient.invalidateQueries({ queryKey: kbKeys.detail(variables.id) });
            toast.success('Knowledge Base updated successfully');
        },
        onSettled: () => setGlobalLoading('update-kb', false),
    });

    const deleteMutation = useMutation({
        onMutate: () => setGlobalLoading('delete-kb', true, 'Deleting knowledge base...'),
        mutationFn: (id: string) => deleteKnowledgeBase(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: kbKeys.lists() });
            toast.success('Knowledge Base deleted successfully');
        },
        onSettled: () => setGlobalLoading('delete-kb', false),
    });

    return {
        ...query,
        knowledgeBases: query.data?.data || [],
        total: query.data?.total || 0,
        createKB: createMutation.mutateAsync,
        updateKB: updateMutation.mutateAsync,
        deleteKB: deleteMutation.mutateAsync,
        isMutating: createMutation.isPending || updateMutation.isPending || deleteMutation.isPending,
    };
}

export function useKBContent(kbId: string, folderId: string | null = null, params: any = {}) {
    const queryClient = useQueryClient();
    const { setGlobalLoading } = useUiStore();

    const contentQuery = useQuery({
        queryKey: kbKeys.content(kbId, folderId, params),
        queryFn: () => getKBContent(kbId, folderId, params.page, params.limit, params.search),
        enabled: !!kbId,
    });

    const statsQuery = useQuery({
        queryKey: kbKeys.stats(kbId),
        queryFn: () => getKnowledgeBaseStats(kbId),
        enabled: !!kbId,
    });

    const kbDetailQuery = useQuery({
        queryKey: kbKeys.detail(kbId),
        queryFn: () => getKnowledgeBase(kbId),
        enabled: !!kbId,
    });

    // Folders Mutations
    const createFolderMutation = useMutation({
        onMutate: () => setGlobalLoading('create-folder', true, 'Creating folder...'),
        mutationFn: (data: { knowledgeBaseId: string; name: string; description?: string; parentFolderId?: string | null }) => createKBFolder(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: kbKeys.detail(kbId) });
            toast.success('Folder created');
        },
        onSettled: () => setGlobalLoading('create-folder', false),
    });

    const updateFolderMutation = useMutation({
        onMutate: () => setGlobalLoading('update-folder', true, 'Updating folder...'),
        mutationFn: ({ id, updates }: { id: string; updates: any }) => updateKBFolder(id, updates),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: kbKeys.detail(kbId) });
            toast.success('Folder updated');
        },
        onSettled: () => setGlobalLoading('update-folder', false),
    });

    const deleteFolderMutation = useMutation({
        onMutate: () => setGlobalLoading('delete-folder', true, 'Deleting folder...'),
        mutationFn: (id: string) => deleteKBFolder(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: kbKeys.detail(kbId) });
            toast.success('Folder deleted');
        },
        onSettled: () => setGlobalLoading('delete-folder', false),
    });

    // Documents Mutations
    const createDocumentMutation = useMutation({
        onMutate: () => setGlobalLoading('create-doc', true, 'Creating document...'),
        mutationFn: (data: { knowledgeBaseId: string; name: string; content: string; folderId?: string | null }) => createKBDocument(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: kbKeys.detail(kbId) });
            toast.success('Document created');
        },
        onSettled: () => setGlobalLoading('create-doc', false),
    });

    const uploadDocumentMutation = useMutation({
        onMutate: (variables) => setGlobalLoading(`upload-${variables.file.name}`, true, `Uploading ${variables.file.name}...`),
        mutationFn: (data: { file: File; kbId: string; folderId?: string | null }) => uploadKBDocument(data.file, data.kbId, data.folderId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: kbKeys.detail(kbId) });
            toast.success('File uploaded successfully');
        },
        onSettled: (_, __, variables) => setGlobalLoading(`upload-${variables.file.name}`, false),
    });

    const updateDocumentMutation = useMutation({
        onMutate: () => setGlobalLoading('update-doc', true, 'Updating document...'),
        mutationFn: ({ id, updates }: { id: string; updates: any }) => updateKBDocument(id, updates),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: kbKeys.detail(kbId) });
            toast.success('Document updated');
        },
        onSettled: () => setGlobalLoading('update-doc', false),
    });

    const deleteDocumentMutation = useMutation({
        onMutate: () => setGlobalLoading('delete-doc', true, 'Deleting document...'),
        mutationFn: (id: string) => deleteKBDocument(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: kbKeys.detail(kbId) });
            toast.success('Document deleted');
        },
        onSettled: () => setGlobalLoading('delete-doc', false),
    });

    // Batch and Move operations
    const moveFolderMutation = useMutation({
        onMutate: () => setGlobalLoading('move-folder', true, 'Moving folder...'),
        mutationFn: ({ folderId, targetFolderId }: { folderId: string; targetFolderId: string | null }) => moveKBFolder(folderId, targetFolderId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: kbKeys.detail(kbId) });
            toast.success('Folder moved');
        },
        onSettled: () => setGlobalLoading('move-folder', false),
    });

    const moveDocumentMutation = useMutation({
        onMutate: () => setGlobalLoading('move-doc', true, 'Moving document...'),
        mutationFn: ({ documentId, targetFolderId }: { documentId: string; targetFolderId: string | null }) => moveKBDocument(documentId, targetFolderId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: kbKeys.detail(kbId) });
            toast.success('Document moved');
        },
        onSettled: () => setGlobalLoading('move-doc', false),
    });

    const deleteBatchMutation = useMutation({
        onMutate: () => setGlobalLoading('delete-batch', true, 'Deleting items...'),
        mutationFn: (data: { folderIds: string[]; documentIds: string[] }) => deleteKBBatch(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: kbKeys.detail(kbId) });
            toast.success('Items deleted successfully');
        },
        onSettled: () => setGlobalLoading('delete-batch', false),
    });

    const moveBatchMutation = useMutation({
        onMutate: () => setGlobalLoading('move-batch', true, 'Moving items...'),
        mutationFn: (data: { folderIds: string[]; documentIds: string[]; targetFolderId: string | null }) => moveKBBatch(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: kbKeys.detail(kbId) });
            toast.success('Items moved successfully');
        },
        onSettled: () => setGlobalLoading('move-batch', false),
    });

    return {
        kb: kbDetailQuery.data,
        stats: statsQuery.data,
        content: contentQuery.data,
        isLoading: contentQuery.isLoading || statsQuery.isLoading || kbDetailQuery.isLoading,
        isError: contentQuery.isError || statsQuery.isError || kbDetailQuery.isError,
        refetch: () => {
            contentQuery.refetch();
            statsQuery.refetch();
            kbDetailQuery.refetch();
        },

        // Actions
        createFolder: createFolderMutation.mutateAsync,
        updateFolder: updateFolderMutation.mutateAsync,
        deleteFolder: deleteFolderMutation.mutateAsync,

        createDocument: createDocumentMutation.mutateAsync,
        uploadDocument: uploadDocumentMutation.mutateAsync,
        updateDocument: updateDocumentMutation.mutateAsync,
        deleteDocument: deleteDocumentMutation.mutateAsync,

        moveFolder: moveFolderMutation.mutateAsync,
        moveDocument: moveDocumentMutation.mutateAsync,
        deleteBatch: deleteBatchMutation.mutateAsync,
        moveBatch: moveBatchMutation.mutateAsync
    };
}
