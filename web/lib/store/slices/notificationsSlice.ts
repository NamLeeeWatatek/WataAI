/**
 * NOTIFICATIONS SLICE
 * Manages notification state globally to prevent layout lag
 */
import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit'

export interface NotificationItem {
    id: string
    title: string
    message: string
    type: 'info' | 'success' | 'warning' | 'error'
    read: boolean
    createdAt: string
    actionUrl?: string
    actionLabel?: string
}

interface NotificationsState {
    notifications: NotificationItem[]
    unreadCount: number
    loading: boolean
    error: string | null
}

// Mock data for initial notifications
const initialNotifications: NotificationItem[] = [
    {
        id: 'welcome',
        title: 'Welcome to WataOmi!',
        message: 'Start by creating your first workflow or connecting a channel.',
        type: 'info',
        read: false,
        createdAt: new Date().toISOString(),
    }
]

const initialState: NotificationsState = {
    notifications: initialNotifications,
    unreadCount: initialNotifications.filter(n => !n.read).length,
    loading: false,
    error: null,
}

const notificationsSlice = createSlice({
    name: 'notifications',
    initialState,
    reducers: {
        addNotification: (state, action: PayloadAction<Omit<NotificationItem, 'id' | 'createdAt'>>) => {
            const notification: NotificationItem = {
                ...action.payload,
                id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                createdAt: new Date().toISOString(),
            }
            state.notifications.unshift(notification)
            if (!notification.read) {
                state.unreadCount += 1
            }
        },

        markAsRead: (state, action: PayloadAction<string>) => {
            const notification = state.notifications.find(n => n.id === action.payload)
            if (notification && !notification.read) {
                notification.read = true
                state.unreadCount = Math.max(0, state.unreadCount - 1)
            }
        },

        markAllAsRead: (state) => {
            state.notifications.forEach(notification => {
                notification.read = true
            })
            state.unreadCount = 0
        },

        removeNotification: (state, action: PayloadAction<string>) => {
            const notification = state.notifications.find(n => n.id === action.payload)
            const wasRead = notification?.read
            state.notifications = state.notifications.filter(n => n.id !== action.payload)
            if (notification && !wasRead) {
                state.unreadCount = Math.max(0, state.unreadCount - 1)
            }
        },

        clearAllNotifications: (state) => {
            state.notifications = []
            state.unreadCount = 0
        },

        setNotifications: (state, action: PayloadAction<NotificationItem[]>) => {
            state.notifications = action.payload
            state.unreadCount = action.payload.filter(n => !n.read).length
            state.loading = false
            state.error = null
        },

        setLoading: (state, action: PayloadAction<boolean>) => {
            state.loading = action.payload
        },

        setError: (state, action: PayloadAction<string | null>) => {
            state.error = action.payload
            state.loading = false
        },
    },
})

export const {
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAllNotifications,
    setNotifications,
    setLoading,
    setError,
} = notificationsSlice.actions

export default notificationsSlice.reducer

