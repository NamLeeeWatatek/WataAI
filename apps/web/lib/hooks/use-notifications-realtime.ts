/**
 * Real-time Notifications Hook
 * Connects to backend WebSocket for real-time notification updates
 */
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSocketConnection } from './use-socket-connection';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { useNotificationPreferences } from '@/components/features/notifications/NotificationSettings';
import { axiosClient } from '../axios-client';

interface Notification {
  id: string;
  userId: string;
  workspaceId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  createdAt: string;
}

interface UseNotificationsRealtimeConfig {
  enabled?: boolean;
  autoConnect?: boolean;
  workspaceId?: string;
}

interface UseNotificationsRealtimeReturn {
  notifications: Notification[];
  unreadCount: number;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: (workspaceId?: string) => Promise<void>;
  subscribeToWorkspace: (workspaceId: string) => void;
  unsubscribeFromWorkspace: (workspaceId: string) => void;
  fetchNotifications: () => Promise<void>;
  refreshUnreadCount: () => Promise<void>;
}

export function useNotificationsRealtime({
  enabled = true,
  autoConnect = true,
  workspaceId: initialWorkspaceId,
}: UseNotificationsRealtimeConfig = {}): UseNotificationsRealtimeReturn {
  const { user, accessToken } = useAuth();
  const preferences = useNotificationPreferences();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string | undefined>(initialWorkspaceId);

  // Use the base socket connection hook
  const socketConnection = useSocketConnection({
    namespace: 'notifications',
    enabled: enabled && !!user?.id && !!accessToken,
    autoConnect,
    auth: { token: accessToken },
    query: { userId: user?.id },
  });

  // Fetch notifications from API
  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return;

    try {
      const data = await axiosClient.get<any>(`/notifications`, {
        params: {
          workspaceId: currentWorkspaceId,
          isRead: false
        }
      }) as unknown as any;
      setNotifications(data.items || []);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  }, [user?.id, accessToken, currentWorkspaceId]);

  // Refresh unread count
  const refreshUnreadCount = useCallback(async () => {
    if (!user?.id) return;

    try {
      const data = await axiosClient.get<any>(`/notifications/unread-count`, {
        params: {
          workspaceId: currentWorkspaceId
        }
      }) as unknown as any;
      setUnreadCount(data.count || 0);
    } catch (error) {
      console.error('Failed to refresh unread count:', error);
    }
  }, [user?.id, accessToken, currentWorkspaceId]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    if (!user?.id) return;

    try {
      await axiosClient.patch(`/notifications/${notificationId}/read`) as unknown as any;

      // Update local state
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === notificationId
            ? { ...notification, isRead: true }
            : notification
        )
      );

      // Also emit via WebSocket if connected
      if (socketConnection.isConnected) {
        socketConnection.emit('mark_as_read', { notificationId });
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }, [user?.id, accessToken, socketConnection.isConnected]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async (workspaceId?: string) => {
    if (!user?.id) return;

    try {
      await axiosClient.patch(`/notifications/read-all`, { workspaceId: currentWorkspaceId }) as unknown as any;

      // Update local state
      setNotifications(prev =>
        prev.map(notification =>
          (!workspaceId || notification.workspaceId === workspaceId)
            ? { ...notification, isRead: true }
            : notification
        )
      );

      // Also emit via WebSocket if connected
      if (socketConnection.isConnected) {
        socketConnection.emit('mark_all_as_read', { workspaceId });
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  }, [user?.id, accessToken, socketConnection.isConnected]);

  // Subscribe to workspace
  const subscribeToWorkspace = useCallback((workspaceId: string) => {
    if (socketConnection.isConnected) {
      socketConnection.emit('subscribe_to_workspace', { workspaceId });
      setCurrentWorkspaceId(workspaceId);
    }
  }, [socketConnection.isConnected]);

  // Unsubscribe from workspace
  const unsubscribeFromWorkspace = useCallback((workspaceId: string) => {
    if (socketConnection.isConnected) {
      socketConnection.emit('unsubscribe_from_workspace', { workspaceId });
      if (currentWorkspaceId === workspaceId) {
        setCurrentWorkspaceId(undefined);
      }
    }
  }, [socketConnection.isConnected, currentWorkspaceId]);

  // Handle WebSocket events
  useEffect(() => {
    if (!socketConnection.isConnected || !user?.id) return;

    // New notification event
    const handleNewNotification = (notification: Notification) => {
      console.log('New notification received:', notification);

      // Add to notifications list
      setNotifications(prev => [notification, ...prev]);

      // Show toast notification
      toast(notification.title, {
        description: notification.message,
        duration: 5000,
        style: {
          background: getToastBackground(notification.type),
          color: '#fff',
        },
        icon: getToastIcon(notification.type),
      });

      // Play sound if enabled
      if (preferences.sound) {
        playNotificationSound(notification.type);
      }
    };

    // Unread count update
    const handleUnreadCount = (data: { count: number }) => {
      console.log('Unread count updated:', data.count);
      setUnreadCount(data.count);
    };

    // Notification updated
    const handleNotificationUpdated = (updatedNotification: Notification) => {
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === updatedNotification.id
            ? updatedNotification
            : notification
        )
      );
    };

    // Workspace notification
    const handleWorkspaceNotification = (notification: Notification) => {
      if (notification.workspaceId === currentWorkspaceId) {
        handleNewNotification(notification);
      }
    };

    // Error handling
    const handleError = (error: { message: string }) => {
      console.error('Notification error:', error.message);
      toast.error('Notification Error', {
        description: error.message,
      });
    };

    // Subscribe to events
    const unsubscribeNew = socketConnection.on('new_notification', handleNewNotification);
    const unsubscribeUnread = socketConnection.on('unread_count', handleUnreadCount);
    const unsubscribeUpdated = socketConnection.on('notification_updated', handleNotificationUpdated);
    const unsubscribeWorkspace = socketConnection.on('workspace_notification', handleWorkspaceNotification);
    const unsubscribeError = socketConnection.on('error', handleError);

    // Initial data fetch
    fetchNotifications();
    refreshUnreadCount();

    return () => {
      unsubscribeNew();
      unsubscribeUnread();
      unsubscribeUpdated();
      unsubscribeWorkspace();
      unsubscribeError();
    };
  }, [
    fetchNotifications,
    refreshUnreadCount,
  ]);

  // Helper functions
  const getToastBackground = (type: Notification['type']) => {
    switch (type) {
      case 'success': return '#10b981'; // green-500
      case 'error': return '#ef4444';   // red-500
      case 'warning': return '#f59e0b'; // amber-500
      case 'info': default: return '#3b82f6'; // blue-500
    }
  };

  const getToastIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': default: return 'ℹ️';
    }
  };

  const playNotificationSound = (type: Notification['type']) => {
    try {
      let soundType: 'message' | 'mention' | 'call' = 'message';
      if (type === 'error') soundType = 'mention';
      if (type === 'warning') soundType = 'call';

      const { playSound } = require('./useNotifications');
      playSound(soundType);
    } catch (error) {
      console.warn('Could not play notification sound:', error);
    }
  };

  return {
    notifications,
    unreadCount,
    isConnected: socketConnection.isConnected,
    isConnecting: socketConnection.isConnecting,
    error: socketConnection.error,
    markAsRead,
    markAllAsRead,
    subscribeToWorkspace,
    unsubscribeFromWorkspace,
    fetchNotifications,
    refreshUnreadCount,
  };
}
