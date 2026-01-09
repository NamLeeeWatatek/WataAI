'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { MessageRole, type AiMessage } from '@/lib/types/conversations'
import { BotWidgetConfig } from '@/lib/types/bots'

// Flexible message type for UI state
interface UiMessage extends Partial<AiMessage> {
    role: MessageRole;
    content: string;
}

interface UsePublicChatProps {
    botId: string
    apiUrl?: string
}

export function usePublicChat({ botId, apiUrl = '/api/v1' }: UsePublicChatProps) {
    const [config, setConfig] = useState<BotWidgetConfig | null>(null)
    const [messages, setMessages] = useState<UiMessage[]>([])
    const [loading, setLoading] = useState(false)
    const [conversationId, setConversationId] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [isInitializing, setIsInitializing] = useState(false)
    const hasInitialized = useRef(false)

    // Load Bot Config on Mount
    useEffect(() => {
        const loadConfig = async () => {
            try {
                const response = await fetch(`${apiUrl}/public/bots/${botId}/config`)
                if (!response.ok) throw new Error('Failed to load bot configuration')
                const data = await response.json()
                setConfig(data)
            } catch (err) {
                console.error("Widget Config Error:", err)
                setError("Unable to load chat widget")
            }
        }
        loadConfig()
    }, [botId, apiUrl])

    const createConversation = useCallback(async () => {
        if (isInitializing || hasInitialized.current) return

        setIsInitializing(true)
        setError(null)
        try {
            const response = await fetch(`${apiUrl}/public/bots/${botId}/conversations`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
                    metadata: {
                        url: typeof window !== 'undefined' ? window.location.href : '',
                        referrer: typeof document !== 'undefined' ? document.referrer : '',
                        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                    },
                }),
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.message || 'Failed to start conversation')
            }

            const data = await response.json()
            setConversationId(data.conversationId)
            hasInitialized.current = true

            // Add welcome message if configured
            if (config?.welcomeMessage) {
                setMessages([{
                    id: 'welcome',
                    conversationId: data.conversationId,
                    role: MessageRole.ASSISTANT,
                    content: config.welcomeMessage,
                    metadata: {},
                }])
            }
        } catch (err) {
            console.error("Init Error:", err)
            setError("Failed to connect to the assistant")
        } finally {
            setIsInitializing(false)
        }
    }, [botId, apiUrl, config, isInitializing])

    const sendMessage = async (input: string) => {
        if (!input.trim() || loading || !conversationId) return

        const messageText = input.trim()

        // Optimistic UI update
        const userMessage: UiMessage = {
            role: MessageRole.USER,
            content: messageText,
        }
        setMessages(prev => [...prev, userMessage])
        setLoading(true)

        try {
            const response = await fetch(`${apiUrl}/public/bots/conversations/${conversationId}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: messageText }),
            })

            if (!response.ok) throw new Error('Failed to send message')

            const data = await response.json()
            const assistantMessage: UiMessage = {
                id: data.id,
                conversationId: conversationId,
                role: MessageRole.ASSISTANT,
                content: data.content,
                sentAt: data.sentAt,
                metadata: data.metadata || {},
                sources: data.sources,
            }
            setMessages(prev => [...prev, assistantMessage])
        } catch (err) {
            setMessages(prev => [...prev, {
                role: MessageRole.ASSISTANT,
                content: "I'm having trouble connecting right now. Please try again.",
                isError: true,
            }])
        } finally {
            setLoading(false)
        }
    }

    return {
        config,
        messages,
        loading,
        conversationId,
        error,
        isInitializing,
        createConversation,
        sendMessage
    }
}
