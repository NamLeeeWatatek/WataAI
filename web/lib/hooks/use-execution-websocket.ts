import { useState, useCallback } from 'react'
import type { Node } from 'reactflow'
import { useSession } from 'next-auth/react'
import { useSocketConnection } from '@/lib/hooks/use-socket-connection'

interface UseExecutionWebSocketReturn {
    execute: (flowId: string, inputData?: any) => Promise<void>
    isExecuting: boolean
    error: string | null
}

/**
 * Hook for real-time workflow execution with WebSocket
 * Uses centralized WebSocket service
 */
export function useExecutionWebSocket(
    setNodes: (updater: (nodes: Node[]) => Node[]) => void
): UseExecutionWebSocketReturn {
    const { data: session } = useSession()

    // Local state for execution flow
    const [isExecuting, setIsExecuting] = useState(false)
    const [execError, setExecError] = useState<string | null>(null) // Renamed to avoid loop conflict with socket error if any

    // Unified socket connection for executions
    const { socket, connect, disconnect, isConnected: isSocketConnected, on } = useSocketConnection({
        namespace: 'executions',
        enabled: !!session?.user?.id && !!session?.accessToken,
        autoConnect: false, // We connect explicitly when execution starts
        auth: { token: session?.accessToken },
        query: { userId: session?.user?.id }
    })

    const updateNodeStatus = useCallback((nodeName: string, status: 'running' | 'success' | 'error', data?: any) => {
        setNodes((nds) =>
            nds.map((node) => {
                const nodeLabel = node.data?.label || node.id
                if (nodeLabel === nodeName || node.id === nodeName) {
                    return {
                        ...node,
                        data: {
                            ...node.data,
                            executionStatus: status,
                            executionError: data?.error?.message || null,
                            executionOutput: data?.data || null
                        }
                    }
                }
                return node
            })
        )
    }, [setNodes])

    const execute = useCallback(async (flowId: string, inputData: any = {}) => {
        return new Promise<void>(async (resolve, reject) => {
            setIsExecuting(true)
            setExecError(null)

            // Reset node statuses
            setNodes((nds) =>
                nds.map((node) => ({
                    ...node,
                    data: {
                        ...node.data,
                        executionStatus: 'idle',
                        executionError: null,
                        executionOutput: null
                    }
                }))
            )

            try {
                // Ensure socket is connected
                connect();

                const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'
                const response = await fetch(`${API_URL}/flows/${flowId}/execute`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(session?.accessToken ? { 'Authorization': `Bearer ${session.accessToken}` } : {}),
                    },
                    body: JSON.stringify(inputData || {}),
                })

                if (!response.ok) {
                    throw new Error('Failed to start execution')
                }

                // Setup listeners securely attached to this execution attempt
                const unsubs: (() => void)[] = [];

                unsubs.push(on('execution:node:start', (data: any) => updateNodeStatus(data.nodeId, 'running')));
                unsubs.push(on('execution:node:complete', (data: any) => updateNodeStatus(data.nodeId, 'success', data)));
                unsubs.push(on('execution:node:error', (data: any) => updateNodeStatus(data.nodeId, 'error', data)));

                const cleanup = () => {
                    unsubs.forEach(u => u());
                    disconnect();
                };

                unsubs.push(on('execution:complete', () => {
                    setIsExecuting(false);
                    cleanup();
                    resolve();
                }));

                unsubs.push(on('execution:error', (data: any) => {
                    setExecError(data.error);
                    setIsExecuting(false);
                    cleanup();
                    reject(new Error(data.error));
                }));

                // TODO: Handle socket connection error?

            } catch (error: any) {
                setExecError('Failed to start execution');
                setIsExecuting(false);
                disconnect();
                reject(error);
            }
        })
    }, [setNodes, connect, disconnect, on, session?.accessToken, session?.user?.id, updateNodeStatus])

    return {
        execute,
        isExecuting,
        error: execError
    }
}

