import { create } from 'zustand'
import { Notification } from '@/lib/types/notification'

interface NotificationsState {
    notifications: Notification[]
    unreadCount: number
    isConnected: boolean
    isConnecting: boolean
    error: string | null

    // Actions
    setNotifications: (notifications: Notification[]) => void
    addNotification: (notification: Notification) => void
    updateNotification: (id: string, updates: Partial<Notification>) => void
    markAsRead: (id: string) => void
    markAllAsRead: () => void
    setUnreadCount: (count: number) => void
    setConnectionState: (isConnected: boolean, isConnecting: boolean) => void
    setError: (error: string | null) => void
}

export const useNotificationsStore = create<NotificationsState>((set) => ({
    notifications: [],
    unreadCount: 0,
    isConnected: false,
    isConnecting: false,
    error: null,

    setNotifications: (notifications) => set({
        notifications,
        unreadCount: notifications.filter(n => !n.isRead).length
    }),

    addNotification: (notification) => set((state) => {
        const isTransient = notification.type === 'job_progress'
        if (isTransient) {
            // Check if we already have this job's progress in list
            const existingIndex = state.notifications.findIndex(n => n.id === notification.id)
            if (existingIndex > -1) {
                const newNotifications = [...state.notifications]
                newNotifications[existingIndex] = notification
                return { notifications: newNotifications }
            }
            return { notifications: [notification, ...state.notifications] }
        }

        return {
            notifications: [notification, ...state.notifications],
            unreadCount: notification.isRead ? state.unreadCount : state.unreadCount + 1
        }
    }),

    updateNotification: (id, updates) => set((state) => ({
        notifications: state.notifications.map(n => n.id === id ? { ...n, ...updates } : n),
        unreadCount: updates.isRead === true
            ? Math.max(0, state.unreadCount - (state.notifications.find(n => n.id === id)?.isRead === false ? 1 : 0))
            : state.unreadCount
    })),

    markAsRead: (id) => set((state) => {
        const notification = state.notifications.find(n => n.id === id)
        if (notification && !notification.isRead) {
            return {
                notifications: state.notifications.map(n => n.id === id ? { ...n, isRead: true } : n),
                unreadCount: Math.max(0, state.unreadCount - 1)
            }
        }
        return state
    }),

    markAllAsRead: () => set((state) => ({
        notifications: state.notifications.map(n => ({ ...n, isRead: true })),
        unreadCount: 0
    })),

    setUnreadCount: (unreadCount) => set({ unreadCount }),

    setConnectionState: (isConnected, isConnecting) => set({ isConnected, isConnecting }),

    setError: (error) => set({ error })
}))
