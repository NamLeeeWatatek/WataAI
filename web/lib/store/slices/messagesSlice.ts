/**
 * Messages Redux Slice
 * Migrated from Zustand messages-store.ts
 */
import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from '../index'
import { MessageRole } from '@/lib/types/conversations'

export interface Message {
    id: string
    role: MessageRole
    content: string
    conversationId: string
    createdAt: string
}

interface MessagesState {
    // Messages per conversation
    byConversation: Record<string, Message[]>

    // Loading states
    isLoading: Record<string, boolean>
    loadingMore: Record<string, boolean>

    // State management
    hasMore: Record<string, boolean>
    oldestMessageId: Record<string, string>
    error: Record<string, string>
}

const initialState: MessagesState = {
    byConversation: {},
    isLoading: {},
    loadingMore: {},
    hasMore: {},
    oldestMessageId: {},
    error: {},
}

const messagesSlice = createSlice({
    name: 'messages',
    initialState,
    reducers: {
        setMessages: (state, action: PayloadAction<{ conversationId: string; messages: Message[] }>) => {
            state.byConversation[action.payload.conversationId] = action.payload.messages
        },

        prependMessages: (state, action: PayloadAction<{ conversationId: string; messages: Message[] }>) => {
            const currentMessages = state.byConversation[action.payload.conversationId] || []
            state.byConversation[action.payload.conversationId] = [...action.payload.messages, ...currentMessages]
        },

        appendMessage: (state, action: PayloadAction<{ conversationId: string; message: Message }>) => {
            const currentMessages = state.byConversation[action.payload.conversationId] || []
            state.byConversation[action.payload.conversationId] = [...currentMessages, action.payload.message]
        },

        removeMessage: (state, action: PayloadAction<{ conversationId: string; messageId: string }>) => {
            const currentMessages = state.byConversation[action.payload.conversationId] || []
            state.byConversation[action.payload.conversationId] = currentMessages.filter(
                (msg) => msg.id !== action.payload.messageId
            )
        },

        setLoading: (state, action: PayloadAction<{ conversationId: string; loading: boolean }>) => {
            state.isLoading[action.payload.conversationId] = action.payload.loading
        },

        setLoadingMore: (state, action: PayloadAction<{ conversationId: string; loading: boolean }>) => {
            state.loadingMore[action.payload.conversationId] = action.payload.loading
        },

        setHasMore: (state, action: PayloadAction<{ conversationId: string; hasMore: boolean }>) => {
            state.hasMore[action.payload.conversationId] = action.payload.hasMore
        },

        setOldestMessageId: (state, action: PayloadAction<{ conversationId: string; id: string }>) => {
            state.oldestMessageId[action.payload.conversationId] = action.payload.id
        },

        setError: (state, action: PayloadAction<{ conversationId: string; error: string }>) => {
            state.error[action.payload.conversationId] = action.payload.error
        },

        clearConversation: (state, action: PayloadAction<string>) => {
            const conversationId = action.payload
            delete state.byConversation[conversationId]
            delete state.isLoading[conversationId]
            delete state.loadingMore[conversationId]
            delete state.hasMore[conversationId]
            delete state.oldestMessageId[conversationId]
            delete state.error[conversationId]
        },
    },
})

export const {
    setMessages,
    prependMessages,
    appendMessage,
    removeMessage,
    setLoading,
    setLoadingMore,
    setHasMore,
    setOldestMessageId,
    setError,
    clearConversation,
} = messagesSlice.actions

// Selectors
export const selectMessages = (conversationId: string) => (state: RootState) =>
    state.messages.byConversation[conversationId] || []

export const selectMessagesLoading = (conversationId: string) => (state: RootState) =>
    state.messages.isLoading[conversationId] || false

export const selectMessagesHasMore = (conversationId: string) => (state: RootState) =>
    state.messages.hasMore[conversationId] ?? true

export default messagesSlice.reducer
