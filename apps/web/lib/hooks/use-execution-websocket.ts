import { useState, useCallback } from 'react'
import type { Node } from 'reactflow'
import { useSession } from 'next-auth/react'
import { wsService } from '@/lib/services/websocket-service'

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
    const [isExecuting, setIsExecuting] = useState(false)
    const [error, setError] = useState<string | null>(null)

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
            setError(null)

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

            const namespace = 'executions'

            wsService.connect(namespace, {
                token: session?.accessToken,
                userId: session?.user?.id
            }, async () => {

                try {
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

                    const result = await response.json()

                } catch (error) {

                    setError('Failed to start execution')
                    setIsExecuting(false)
                    wsService.disconnect(namespace)
                    reject(error)
                }
            })

            const unsubscribeStart = wsService.on(namespace, 'execution:start', (data) => {

            })

            const unsubscribeNodeStart = wsService.on(namespace, 'execution:node:start', (data) => {

                updateNodeStatus(data.nodeId, 'running')
            })

            const unsubscribeNodeComplete = wsService.on(namespace, 'execution:node:complete', (data) => {

                updateNodeStatus(data.nodeId, 'success', data)
            })

            const unsubscribeNodeError = wsService.on(namespace, 'execution:node:error', (data) => {

                updateNodeStatus(data.nodeId, 'error', data)
            })

            const unsubscribeComplete = wsService.on(namespace, 'execution:complete', (data) => {

                setIsExecuting(false)

                unsubscribeStart()
                unsubscribeNodeStart()
                unsubscribeNodeComplete()
                unsubscribeNodeError()
                unsubscribeComplete()
                unsubscribeError()

                wsService.disconnect(namespace)
                resolve()
            })

            const unsubscribeError = wsService.on(namespace, 'execution:error', (data) => {

                setError(data.error)
                setIsExecuting(false)

                unsubscribeStart()
                unsubscribeNodeStart()
                unsubscribeNodeComplete()
                unsubscribeNodeError()
                unsubscribeComplete()
                unsubscribeError()

                wsService.disconnect(namespace)
                reject(new Error(data.error))
            })

            wsService.onError(namespace, (error) => {

                setError('Socket.IO connection error')
                setIsExecuting(false)
                reject(new Error('Socket.IO connection error'))
            })
        })
    }, [setNodes, updateNodeStatus])

    return {
        execute,
        isExecuting,
        error
    }
}

