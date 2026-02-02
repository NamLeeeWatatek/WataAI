import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { agentConfigsApi, AgentConfig } from '@/lib/api/agent-configs';
import toast from '@/lib/toast';

export const agentConfigKeys = {
    all: ['agent-configs'] as const,
    detail: (flowId: number) => [...agentConfigKeys.all, flowId] as const,
};

export function useAgentConfig(flowId: number) {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: agentConfigKeys.detail(flowId),
        queryFn: () => agentConfigsApi.getOne(flowId),
        enabled: !!flowId,
    });

    const saveMutation = useMutation({
        mutationFn: (data: AgentConfig) => {
            if (data.id) {
                return agentConfigsApi.update(flowId, data);
            }
            return agentConfigsApi.create(data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: agentConfigKeys.detail(flowId) });
            toast.success('Agent configuration saved!');
        },
        onError: () => {
            toast.error('Failed to save configuration');
        }
    });

    return {
        ...query,
        config: query.data,
        saveConfig: saveMutation.mutateAsync,
        isSaving: saveMutation.isPending,
    };
}
