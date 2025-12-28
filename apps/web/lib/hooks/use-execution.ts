import { useState, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import type { Node } from 'reactflow';
import { useSocketConnection } from './use-socket-connection';
import axiosClient from '@/lib/axios-client';

export type ExecutionTransport = 'websocket' | 'sse';

export interface ExecutionUpdate {
  executionId: string;
  flowId: string;
  status: 'running' | 'completed' | 'failed';
  currentNode?: string;
  progress?: number;
  result?: any;
  error?: string;
}

export interface UseExecutionOptions {
  transport?: ExecutionTransport;
  flowId?: string;
  executionId?: string;
  onUpdate?: (update: ExecutionUpdate) => void;
  onComplete?: (result: any) => void;
  onError?: (error: string) => void;
  autoUpdateNodes?: boolean;
}

export interface UseExecutionReturn {
  execute: (flowId?: string, inputData?: any) => Promise<void>;
  isExecuting: boolean;
  error: string | null;
  updateNodeStatus: (nodeName: string, status: 'running' | 'success' | 'error', data?: any) => void;
  lastExecutionResult?: any;
}

/**
 * Unified execution hook supporting WebSocket and SSE transports
 * Consolidates useExecutionSocket, use-execution-stream, and use-execution-websocket
 */
export function useExecution(
  setNodes: ((updater: (nodes: Node[]) => Node[]) => void) | null = null,
  options: UseExecutionOptions = {}
): UseExecutionReturn {
  const {
    transport = 'websocket',
    flowId: defaultFlowId,
    executionId,
    onUpdate,
    onComplete,
    onError,
    autoUpdateNodes = true,
  } = options;

  const { data: session } = useSession();
  const token = session?.accessToken;
  const eventSourceRef = useRef<EventSource | null>(null);

  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastExecutionResult, setLastExecutionResult] = useState<any>(null);

  // WebSocket connection for execution monitoring
  const {
    socket,
    isConnected: wsConnected,
    emit,
    on: onWs,
    off: offWs,
  } = useSocketConnection({
    namespace: 'executions',
    enabled: transport === 'websocket',
  });

  // Node status update helper
  const updateNodeStatus = useCallback((nodeName: string, status: 'running' | 'success' | 'error', data?: any) => {
    if (!setNodes || !autoUpdateNodes) return;

    setNodes((nds) =>
      nds.map((node) => {
        const nodeLabel = node.data?.label || node.id;
        if (nodeLabel === nodeName || node.id === nodeName) {
          return {
            ...node,
            data: {
              ...node.data,
              executionStatus: status,
              executionError: data?.error?.message || null,
              executionOutput: data?.data || null
            }
          };
        }
        return node;
      })
    );
  }, [setNodes, autoUpdateNodes]);

  // WebSocket execution handler
  const executeWithWebSocket = useCallback(async (flowId: string, inputData: any = {}) => {
    return new Promise<void>((resolve, reject) => {
      const execId = executionId || `exec-${Date.now()}`;

      try {
        // Start execution via standardized axios client (auth/workspace handled in interceptors)
        const responsePromise = axiosClient.post(`/flows/${flowId}/execute`, inputData || {});

        // Set up WebSocket event handlers
        const unsubscribeProgress = onWs('execution:progress', (data) => {
          const update: ExecutionUpdate = {
            executionId: execId,
            flowId,
            status: 'running',
            currentNode: data.nodeId,
            progress: data.progress,
          };
          updateNodeStatus(data.nodeId, 'running');
          onUpdate?.(update);

          if (transport !== 'websocket') {
            console.warn('Received WebSocket execution progress but transport is not websocket');
          }
        });

        const unsubscribeNodeStart = onWs('execution:node:start', (data) => {
          updateNodeStatus(data.nodeId, 'running');
        });

        const unsubscribeNodeComplete = onWs('execution:node:complete', (data) => {
          updateNodeStatus(data.nodeId, 'success', data);
        });

        const unsubscribeNodeError = onWs('execution:node:error', (data) => {
          updateNodeStatus(data.nodeId, 'error', data);
        });

        const unsubscribeComplete = onWs('execution:complete', (data) => {
          const update: ExecutionUpdate = {
            executionId: execId,
            flowId,
            status: 'completed',
            result: data.result,
          };
          setLastExecutionResult(data.result);
          onUpdate?.(update);
          onComplete?.(data.result);

          // Cleanup
          unsubscribeProgress();
          unsubscribeNodeStart();
          unsubscribeNodeComplete();
          unsubscribeNodeError();
          unsubscribeComplete();
          unsubscribeWebSocketError();
          setIsExecuting(false);
          resolve();
        });

        const unsubscribeWebSocketError = onWs('execution:error', (data) => {
          const update: ExecutionUpdate = {
            executionId: execId,
            flowId,
            status: 'failed',
            error: data.error,
          };
          setError(data.error);
          onUpdate?.(update);
          onError?.(data.error);

          // Cleanup
          unsubscribeProgress();
          unsubscribeNodeStart();
          unsubscribeNodeComplete();
          unsubscribeNodeError();
          unsubscribeComplete();
          unsubscribeWebSocketError();
          setIsExecuting(false);
          reject(new Error(data.error));
        });

        // Check API response (axiosClient returns data or throws)
        responsePromise.catch((err: any) => {
          if (err?.code === 'UNAUTHORIZED') {
            const e: any = new Error('UNAUTHORIZED');
            e.code = 'UNAUTHORIZED';
            setError('Unauthorized');
            reject(e);
            return;
          }
          setError(err.message || 'Failed to start execution');
          reject(err);
        });

      } catch (err: any) {
        setError(err.message || 'Failed to start WebSocket execution');
        setIsExecuting(false);
        reject(err);
      }
    });
  }, [executionId, token, onWs, onUpdate, onComplete, onError, updateNodeStatus, transport]);

  // SSE execution handler
  const executeWithSSE = useCallback(async (flowId: string, inputData: any = {}) => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

      const response = await fetch(`${API_URL}/executions/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          flow_id: flowId,
          input_data: inputData
        })
      });

      if (!response.ok) {
        if (response.status === 401) {
          const e: any = new Error('UNAUTHORIZED');
          e.code = 'UNAUTHORIZED';
          throw e;
        }
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body');
      }

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        const text = decoder.decode(value, { stream: true });
        const lines = text.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const jsonStr = line.slice(6);

            try {
              const event = JSON.parse(jsonStr);

              switch (event.type) {
                case 'executionStarted':
                  break;

                case 'nodeExecutionBefore':
                  updateNodeStatus(event.data.nodeName, 'running');
                  break;

                case 'nodeExecutionAfter':
                  if (event.data.error) {
                    updateNodeStatus(event.data.nodeName, 'error', event.data);
                  } else {
                    updateNodeStatus(event.data.nodeName, 'success', event.data);
                  }
                  break;

                case 'executionFinished':
                  setIsExecuting(false);
                  break;

                case 'executionError':
                  setError(event.data.error);
                  setIsExecuting(false);
                  break;
              }
            } catch (e) {
              console.warn('Failed to parse SSE event:', e);
            }
          }
        }
      }

    } catch (err: any) {
      setError(err.message || 'SSE execution failed');
      setIsExecuting(false);
    }
  }, [token, updateNodeStatus]);

  // Main execute function
  const execute = useCallback(async (flowId?: string, inputData: any = {}) => {
    const targetFlowId = flowId || defaultFlowId;
    if (!targetFlowId) {
      throw new Error('flowId is required');
    }

    setIsExecuting(true);
    setError(null);

    // Reset node states
    if (setNodes && autoUpdateNodes) {
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
      );
    }

    try {
      if (transport === 'websocket') {
        await executeWithWebSocket(targetFlowId, inputData);
      } else if (transport === 'sse') {
        await executeWithSSE(targetFlowId, inputData);
      } else {
        throw new Error(`Unsupported transport: ${transport}`);
      }
    } catch (err: any) {
      setError(err.message);
      setIsExecuting(false);
      throw err;
    }
  }, [defaultFlowId, transport, executeWithWebSocket, executeWithSSE, setNodes, autoUpdateNodes]);

  return {
    execute,
    isExecuting,
    error,
    updateNodeStatus,
    lastExecutionResult,
  };
}

// NOTE: Previous hooks (useExecutionSocket, useExecutionStream, useExecutionWebSocket)
// have been consolidated into this unified useExecution hook.
// Migration guide:
// - useExecutionSocket -> useExecution(setNodes, { transport: 'websocket' })
// - useExecutionStream -> useExecution(setNodes, { transport: 'sse' })
// - useExecutionWebSocket -> useExecution(setNodes, { transport: 'websocket' })
