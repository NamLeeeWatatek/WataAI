/**
 * Centralized WebSocket Service
 * Uses Socket.IO for real-time communication
 */
import { io, Socket } from 'socket.io-client'

type MessageHandler = (data: any) => void
type ErrorHandler = (_error: any) => void
type CloseHandler = () => void

interface WebSocketConnection {
    socket: Socket
    handlers: Map<string, MessageHandler[]>
    errorHandlers: ErrorHandler[]
    closeHandlers: CloseHandler[]
}

class WebSocketService {
    private connections: Map<string, WebSocketConnection> = new Map()
    private baseUrl: string

    constructor() {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'
        this.baseUrl = apiUrl.replace('/api/v1', '')
    }

    connect(namespace: string, options?: { token?: string, userId?: string }, onOpen?: () => void): Socket {
        const url = `${this.baseUrl}/${namespace}`

        if (this.connections.has(namespace)) {
            const conn = this.connections.get(namespace)!
            if (conn.socket.connected) {
                onOpen?.()
                return conn.socket
            } else {
                this.disconnect(namespace)
            }
        }

        const socketOptions: any = {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5,
        }

        if (options?.token) {
            socketOptions.extraHeaders = {
                Authorization: `Bearer ${options.token}`
            }
            socketOptions.auth = {
                token: options.token
            }
        }

        if (options?.userId) {
            socketOptions.query = {
                userId: options.userId
            }
        }

        const socket = io(url, socketOptions)

        const connection: WebSocketConnection = {
            socket,
            handlers: new Map(),
            errorHandlers: [],
            closeHandlers: []
        }

        socket.on('connect', () => {
            onOpen?.()
        })

        socket.on('disconnect', () => {
            connection.closeHandlers.forEach(handler => handler())
        })

        socket.on('connect_error', (_error) => {
            connection.errorHandlers.forEach(handler => handler(_error))
        })

        socket.onAny((eventName, data) => {
            const handlers = connection.handlers.get(eventName) || []
            handlers.forEach(handler => handler(data))

            const wildcardHandlers = connection.handlers.get('*') || []
            wildcardHandlers.forEach(handler => handler({ type: eventName, data }))
        })

        this.connections.set(namespace, connection)
        return socket
    }

    send(namespace: string, event: string, data?: any): boolean {
        const connection = this.connections.get(namespace)
        if (!connection || !connection.socket.connected) {
            return false
        }

        try {
            connection.socket.emit(event, data)
            return true
        } catch {
            return false
        }
    }

    on(endpoint: string, messageType: string, handler: MessageHandler): () => void {
        const connection = this.connections.get(endpoint)
        if (!connection) {
            return () => { }
        }

        if (!connection.handlers.has(messageType)) {
            connection.handlers.set(messageType, [])
        }

        connection.handlers.get(messageType)!.push(handler)

        return () => {
            const handlers = connection.handlers.get(messageType)
            if (handlers) {
                const index = handlers.indexOf(handler)
                if (index > -1) {
                    handlers.splice(index, 1)
                }
            }
        }
    }

    onError(endpoint: string, handler: ErrorHandler): () => void {
        const connection = this.connections.get(endpoint)
        if (!connection) return () => { }

        connection.errorHandlers.push(handler)

        return () => {
            const index = connection.errorHandlers.indexOf(handler)
            if (index > -1) {
                connection.errorHandlers.splice(index, 1)
            }
        }
    }

    onClose(endpoint: string, handler: CloseHandler): () => void {
        const connection = this.connections.get(endpoint)
        if (!connection) return () => { }

        connection.closeHandlers.push(handler)

        return () => {
            const index = connection.closeHandlers.indexOf(handler)
            if (index > -1) {
                connection.closeHandlers.splice(index, 1)
            }
        }
    }

    disconnect(namespace: string) {
        const connection = this.connections.get(namespace)
        if (connection) {
            connection.socket.disconnect()
            this.connections.delete(namespace)
        }
    }

    disconnectAll() {
        this.connections.forEach((_, endpoint) => {
            this.disconnect(endpoint)
        })
    }

    isConnected(namespace: string): boolean {
        const connection = this.connections.get(namespace)
        return connection?.socket.connected || false
    }

    getActiveConnections(): string[] {
        return Array.from(this.connections.keys()).filter(endpoint =>
            this.isConnected(endpoint)
        )
    }
}

export const wsService = new WebSocketService()

if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
        wsService.disconnectAll()
    })
}

