import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { assetsApi } from '@/lib/api/assets';
import { Asset, AssetType } from '@/lib/types/asset';
import { useState, useMemo } from 'react';

interface UseAssetsOptions {
    page?: number;
    pageSize?: number;
    type?: AssetType;
    search?: string;
}

export function useAssets(initialOptions: UseAssetsOptions = {}) {
    const queryClient = useQueryClient();
    const [page, setPage] = useState(initialOptions.page || 1);
    const [pageSize, setPageSize] = useState(initialOptions.pageSize || 12);
    const [typeFilter, setTypeFilter] = useState<AssetType | undefined>(initialOptions.type);
    const [searchFilter, setSearchFilter] = useState(initialOptions.search || '');

    const queryKey = useMemo(() => ['assets', { page, pageSize, typeFilter, searchFilter }], [
        page,
        pageSize,
        typeFilter,
        searchFilter,
    ]);

    const {
        data,
        isLoading,
        isRefetching,
        error,
        refetch,
    } = useQuery({
        queryKey,
        queryFn: async () => {
            const response = await assetsApi.findAll({
                page,
                limit: pageSize,
                type: typeFilter,
                search: searchFilter,
            });
            // Handle if response is paginated or not
            // Backend currently returns paginated response due to infinityPagination
            return response as any;
        },
    });

    const assets = data?.data || [];
    const total = data?.total || 0;
    const hasNextPage = data?.hasNextPage || false;

    const deleteMutation = useMutation({
        mutationFn: assetsApi.remove,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['assets'] });
        },
    });

    return {
        assets,
        total,
        hasNextPage,
        isLoading,
        isRefetching,
        error,
        page,
        pageSize,
        typeFilter,
        searchFilter,
        setPage,
        setPageSize,
        setTypeFilter,
        setSearchFilter,
        refresh: refetch,
        deleteAsset: deleteMutation.mutateAsync,
    };
}
