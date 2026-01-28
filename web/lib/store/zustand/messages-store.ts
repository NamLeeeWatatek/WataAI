import { create } from 'zustand'
import { MessageRole } from '@/lib/types/conversations'

export interface Message {
    id: string
    role: MessageRole
    content: string
    conversationId: string
    createdAt: string
}

interface MessagesState {
    byConversation: Record<string, Message[]>
    isLoading: Record<string, boolean>
    error: Record<string, string | null>
    hasMore: Record<string, boolean>

    // Actions
    setMessages: (conversationId: string, messages: Message[]) => void
    appendMessage: (conversationId: string, message: Message) => void
    prependMessages: (conversationId: string, messages: Message[]) => void
    removeMessage: (conversationId: string, messageId: string) => void
    setLoading: (conversationId: string, loading: boolean) => void
    setError: (conversationId: string, error: string | null) => void
    setHasMore: (conversationId: string, hasMore: boolean) => void
    clearConversation: (conversationId: string) => void
}

export const useMessagesStore = create<MessagesState>((set) => ({
    byConversation: {},
    isLoading: {},
    error: {},
    hasMore: {},

    setMessages: (conversationId, messages) =>
        set((state) => ({
            byConversation: { ...state.byConversation, [conversationId]: messages },
        })),

    appendMessage: (conversationId, message) =>
        set((state) => {
            const current = state.byConversation[conversationId] || []
            // Prevent duplicates
            if (current.some(m => m.id === message.id)) return state
            return {
                byConversation: {
                    ...state.byConversation,
                    [conversationId]: [...current, message],
                },
            }
        }),

    prependMessages: (conversationId, messages) =>
        set((state) => {
            const current = state.byConversation[conversationId] || []
            const newMessages = messages.filter(m => !current.some(cm => cm.id === m.id))
            return {
                byConversation: {
                    ...state.byConversation,
                    [conversationId]: [...newMessages, ...current],
                },
            }
        }),

    removeMessage: (conversationId, messageId) =>
        set((state) => ({
            byConversation: {
                ...state.byConversation,
                [conversationId]: (state.byConversation[conversationId] || []).filter(
                    (m) => m.id !== messageId
                ),
            },
        })),

    setLoading: (conversationId, isLoading) =>
        set((state) => ({
            isLoading: { ...state.isLoading, [conversationId]: isLoading },
        })),

    setError: (conversationId, error) =>
        set((state) => ({
            error: { ...state.error, [conversationId]: error },
        })),

    setHasMore: (conversationId, hasMore) =>
        set((state) => ({
            hasMore: { ...state.hasMore, [conversationId]: hasMore },
        })),

    clearConversation: (conversationId) =>
        set((state) => {
            const newByConversation = { ...state.byConversation }
            delete newByConversation[conversationId]
            const newLoading = { ...state.isLoading }
            delete newLoading[conversationId]
            const newError = { ...state.error }
            delete newError[conversationId]
            const newHasMore = { ...state.hasMore }
            delete newHasMore[conversationId]
            return {
                byConversation: newByConversation,
                isLoading: newLoading,
                error: newError,
                hasMore: newHasMore,
            }
        }),
}))
