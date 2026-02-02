import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { metadataApi } from '@/lib/api/metadata';
import { Tag } from '@/lib/types';
import toast from '@/lib/toast';

export const metadataKeys = {
    all: ['metadata'] as const,
    tags: () => [...metadataKeys.all, 'tags'] as const,
    categories: (entityType: string) => [...metadataKeys.all, 'categories', entityType] as const,
};

export function useTags() {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: metadataKeys.tags(),
        queryFn: () => metadataApi.getTags(),
    });

    const createMutation = useMutation({
        mutationFn: (data: Partial<Tag>) => metadataApi.createTag(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: metadataKeys.tags() });
            toast.success('Tag created successfully');
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string | number; data: Partial<Tag> }) =>
            metadataApi.updateTag(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: metadataKeys.tags() });
            toast.success('Tag updated successfully');
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string | number) => metadataApi.deleteTag(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: metadataKeys.tags() });
            toast.success('Tag deleted successfully');
        },
    });

    return {
        ...query,
        tags: query.data || [],
        createTag: createMutation.mutateAsync,
        updateTag: updateMutation.mutateAsync,
        deleteTag: deleteMutation.mutateAsync,
        isMutating: createMutation.isPending || updateMutation.isPending || deleteMutation.isPending,
    };
}
