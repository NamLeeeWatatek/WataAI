'use client'

import React from 'react'
import { NotificationDropdown } from '@/components/features/notifications/NotificationDropdown'

interface DashboardNotificationsProps {
    showNotifications: boolean
    onToggle: () => void
}

export const DashboardNotifications = React.memo<DashboardNotificationsProps>(({ showNotifications, onToggle }) => {
    return (
        <NotificationDropdown />
    )
})

DashboardNotifications.displayName = 'DashboardNotifications'
