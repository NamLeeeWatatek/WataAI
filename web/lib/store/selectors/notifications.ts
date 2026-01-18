/**
 * NOTIFICATIONS SELECTORS
 * Efficient selectors for notification state
 */
import { createSelector } from '@reduxjs/toolkit'
import type { RootState } from '../index'
import type { NotificationItem } from '../slices/notificationsSlice'

/**
 * Base notification selectors
 */
const selectNotificationsState = (state: RootState) => state.notifications

export const selectNotifications = createSelector(
    [selectNotificationsState],
    (notifications) => notifications.notifications
)

export const selectUnreadCount = createSelector(
    [selectNotificationsState],
    (notifications) => notifications.unreadCount
)

export const selectNotificationsLoading = createSelector(
    [selectNotificationsState],
    (notifications) => notifications.loading
)

export const selectNotificationsError = createSelector(
    [selectNotificationsState],
    (notifications) => notifications.error
)

/**
 * Computed selectors
 */
export const selectHasUnreadNotifications = createSelector(
    [selectUnreadCount],
    (unreadCount) => unreadCount > 0
)

export const selectRecentNotifications = createSelector(
    [selectNotifications],
    (notifications) => notifications.slice(0, 10) // Get first 10 for dropdown
)

export const selectUnreadNotifications = createSelector(
    [selectNotifications],
    (notifications) => notifications.filter(n => !n.read)
)

export const selectNotificationById = (id: string) =>
    createSelector(
        [selectNotifications],
        (notifications) => notifications.find(n => n.id === id) || null
    )

