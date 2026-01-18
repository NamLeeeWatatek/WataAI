'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoriesApi, Category } from '@/lib/api/categories';
import toast from '@/lib/toast';

export const categoryKeys = {
    all: ['categories'] as const,
    lists: () => [...categoryKeys.all, 'list'] as const,
    list: (params: any) => [...categoryKeys.lists(), params] as const,
};

export function useCategories(params: any = {}) {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: categoryKeys.list(params),
        queryFn: () => categoriesApi.findAll(params),
    });

    const createMutation = useMutation({
        mutationFn: (data: any) => categoriesApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
            toast.success('Category created successfully');
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => categoriesApi.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: categoryKeys.all });
            toast.success('Category updated successfully');
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => categoriesApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
            toast.success('Category deleted successfully');
        },
    });

    return {
        ...query,
        categories: query.data?.data || [],
        total: query.data?.total || 0,
        createCategory: createMutation.mutateAsync,
        updateCategory: updateMutation.mutateAsync,
        deleteCategory: deleteMutation.mutateAsync,
        isMutating: createMutation.isPending || updateMutation.isPending || deleteMutation.isPending,
    };
}
