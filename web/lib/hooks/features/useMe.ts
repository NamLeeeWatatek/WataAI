import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi } from '@/lib/api/auth';

export const meKeys = {
    all: ['me'] as const,
};

export function useMe() {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: meKeys.all,
        queryFn: () => authApi.me(),
    });

    const updateMutation = useMutation({
        mutationFn: (data: any) => authApi.updateMe(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: meKeys.all });
        },
    });

    return {
        ...query,
        user: query.data,
        updateMe: updateMutation.mutateAsync,
        isUpdating: updateMutation.isPending,
    };
}
