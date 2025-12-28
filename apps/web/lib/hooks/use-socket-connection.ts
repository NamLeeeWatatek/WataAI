import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket, ManagerOptions } from 'socket.io-client';
import { useSession } from 'next-auth/react';

export interface UseSocketConnectionConfig {
  namespace: string;
  enabled?: boolean;
  autoConnect?: boolean;
  auth?: Record<string, any>;
  query?: Record<string, any>;
  customUrl?: string;
  transport?: 'websocket' | 'polling';
}

export interface UseSocketConnectionReturn {
  socket: Socket | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  connect: () => void;
  disconnect: () => void;
  reconnect: () => void;
  emit: (event: string, data?: any) => void;
  on: (event: string, handler: (...args: any[]) => void) => () => void;
  off: (event: string, handler?: (...args: any[]) => void) => void;
}

/**
 * Unified WebSocket connection hook with common functionality
 * All specialized socket hooks should extend this base hook
 */
export function useSocketConnection({
  namespace,
  enabled = true,
  autoConnect = true,
  auth,
  query,
  customUrl,
  transport = 'websocket'
}: UseSocketConnectionConfig): UseSocketConnectionReturn {
  const { data: session } = useSession();
  const socketRef = useRef<Socket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getSocketUrl = useCallback(() => {
    if (customUrl) return customUrl;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const baseUrl = apiUrl.replace(/\/api\/v1$/, '');

    return `${baseUrl}/${namespace}`;
  }, [customUrl, namespace]);

  const getSocketOptions = useCallback((): any => ({
    transports: transport === 'polling' ? ['polling'] : ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
    auth: auth || (session?.accessToken ? { token: session.accessToken } : undefined),
    query: query,
  }), [transport, auth, query, session?.accessToken]);

  const connect = useCallback(() => {
    if (!enabled || isConnected || isConnecting) return;

    setIsConnecting(true);
    setError(null);

    try {
      const url = getSocketUrl();
      const options = getSocketOptions();

      console.log(`[Socket:${namespace}] Connecting to: ${url}`);
      const socket = io(url, options);

      socket.on('connect', () => {
        console.log(`[Socket:${namespace}] Connected: ${socket.id}`);
        setIsConnected(true);
        setIsConnecting(false);
        setError(null);
      });

      socket.on('disconnect', (reason) => {
        console.log(`[Socket:${namespace}] Disconnected: ${reason}`);
        setIsConnected(false);
        setIsConnecting(false);

        if (enabled && reason === 'io server disconnect') {
          // Server disconnected us, try reconnect
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log(`[Socket:${namespace}] Attempting reconnection...`);
            socket.connect();
          }, 3000);
        }
      });

      socket.on('connect_error', (err) => {
        console.error(`[Socket:${namespace}] Connection error:`, err.message);
        setError(err.message);
        setIsConnecting(false);
        setIsConnected(false);
      });

      socket.on('reconnect', (attempt) => {
        console.log(`[Socket:${namespace}] Reconnected after ${attempt} attempts`);
        setIsConnected(true);
        setIsConnecting(false);
        setError(null);
      });

      socket.on('reconnect_error', (err) => {
        console.error(`[Socket:${namespace}] Reconnection failed:`, err.message);
        setError(`Reconnection failed: ${err.message}`);
        setIsConnecting(false);
      });

      socketRef.current = socket;

      if (autoConnect) {
        // Connection will happen automatically
      }
    } catch (err: any) {
      setError(err.message || 'Failed to initialize socket');
      setIsConnecting(false);
    }
  }, [namespace, enabled, isConnected, isConnecting, autoConnect, getSocketUrl, getSocketOptions]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    if (socketRef.current) {
      console.log(`[Socket:${namespace}] Disconnecting...`);
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    setIsConnected(false);
    setIsConnecting(false);
    setError(null);
  }, [namespace]);

  const reconnect = useCallback(() => {
    disconnect();
    setTimeout(connect, 1000);
  }, [disconnect, connect]);

  const emit = useCallback((event: string, data?: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    } else {
      console.warn(`[Socket:${namespace}] Cannot emit '${event}' - not connected`);
    }
  }, [namespace]);

  const on = useCallback((event: string, handler: (...args: any[]) => void) => {
    if (socketRef.current) {
      socketRef.current.on(event, handler);

      // Return cleanup function
      return () => socketRef.current?.off(event, handler);
    }

    // Return no-op if no socket
    return () => { };
  }, []);

  const off = useCallback((event: string, handler?: (...args: any[]) => void) => {
    if (socketRef.current) {
      socketRef.current.off(event, handler);
    }
  }, []);

  useEffect(() => {
    if (enabled && autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, autoConnect]); // Remove connect/disconnect from deps to prevent infinite re-runs

  // Handle auth changes
  useEffect(() => {
    if (socketRef.current && session?.accessToken) {
      // Update auth if session changes
      socketRef.current.auth = { token: session.accessToken };
    }
  }, [session?.accessToken]);

  return {
    socket: socketRef.current,
    isConnected,
    isConnecting,
    error,
    connect,
    disconnect,
    reconnect,
    emit,
    on,
    off,
  };
}
