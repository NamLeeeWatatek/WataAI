'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useSocketConnection } from './use-socket-connection';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { notificationsApi } from '../api/notifications';
import { useNotificationsStore } from '@/lib/store/zustand/notifications-store';

import { Notification } from '@/lib/types/notification';
import { useNotificationPreferences } from './use-notification-preferences';

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
  const {
    notifications,
    unreadCount,
    isConnected,
    isConnecting,
    error,
    setNotifications,
    addNotification,
    updateNotification,
    markAsRead: storeMarkAsRead,
    markAllAsRead: storeMarkAllAsRead,
    setUnreadCount,
    setConnectionState,
    setError
  } = useNotificationsStore();

  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string | undefined>(initialWorkspaceId);

  const query = useMemo(() => ({ userId: user?.id }), [user?.id]);

  // Use the base socket connection hook
  const socketConnection = useSocketConnection({
    namespace: 'notifications',
    enabled: enabled && !!user?.id && !!accessToken,
    autoConnect,
    auth: { token: accessToken },
    query,
  });

  // Sync socket connection state to store
  useEffect(() => {
    setConnectionState(socketConnection.isConnected, socketConnection.isConnecting);
    if (socketConnection.error) setError(socketConnection.error);
  }, [socketConnection.isConnected, socketConnection.isConnecting, socketConnection.error, setConnectionState, setError]);

  // Fetch notifications from API
  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return;

    try {
      const data = await notificationsApi.getAll({
        workspaceId: currentWorkspaceId,
        isRead: false
      });
      setNotifications(data.items || []);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  }, [user?.id, currentWorkspaceId, setNotifications]);

  // Refresh unread count
  const refreshUnreadCount = useCallback(async () => {
    if (!user?.id) return;

    try {
      const data = await notificationsApi.getUnreadCount(currentWorkspaceId);
      setUnreadCount(data.count || 0);
    } catch (error) {
      console.error('Failed to refresh unread count:', error);
    }
  }, [user?.id, currentWorkspaceId, setUnreadCount]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    if (!user?.id) return;

    try {
      await notificationsApi.markAsRead(notificationId);
      storeMarkAsRead(notificationId);

      // Also emit via WebSocket if connected
      if (socketConnection.isConnected) {
        socketConnection.emit('mark_as_read', { notificationId });
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }, [user?.id, socketConnection.isConnected, socketConnection.emit, storeMarkAsRead]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async (workspaceId?: string) => {
    if (!user?.id) return;

    try {
      await notificationsApi.markAllAsRead(currentWorkspaceId);
      storeMarkAllAsRead();

      // Also emit via WebSocket if connected
      if (socketConnection.isConnected) {
        socketConnection.emit('mark_all_as_read', { workspaceId });
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  }, [user?.id, currentWorkspaceId, socketConnection.isConnected, socketConnection.emit, storeMarkAllAsRead]);

  // Subscribe to workspace
  const subscribeToWorkspace = useCallback((workspaceId: string) => {
    if (socketConnection.isConnected) {
      socketConnection.emit('subscribe_to_workspace', { workspaceId });
      setCurrentWorkspaceId(workspaceId);
    }
  }, [socketConnection.isConnected, socketConnection.emit]);

  // Unsubscribe from workspace
  const unsubscribeFromWorkspace = useCallback((workspaceId: string) => {
    if (socketConnection.isConnected) {
      socketConnection.emit('unsubscribe_from_workspace', { workspaceId });
      if (currentWorkspaceId === workspaceId) {
        setCurrentWorkspaceId(undefined);
      }
    }
  }, [socketConnection.isConnected, socketConnection.emit, currentWorkspaceId]);

  // Handle WebSocket events
  useEffect(() => {
    if (!socketConnection.isConnected || !user?.id) return;

    // New notification event
    const handleNewNotification = (notification: Notification) => {
      addNotification(notification);

      // Skip toast for background job progress updates
      if (notification.type === 'job_progress') {
        return;
      }

      // Show toast notification
      const toastOptions = {
        description: notification.message,
        duration: 5000,
      };

      switch (notification.type) {
        case 'success':
          toast.success(notification.title, toastOptions);
          break;
        case 'error':
          toast.error(notification.title, toastOptions);
          break;
        case 'warning':
          toast.warning(notification.title, toastOptions);
          break;
        case 'info':
          toast.info(notification.title, toastOptions);
          break;
        default:
          toast(notification.title, toastOptions);
      }

      // Play sound if enabled
      if (preferences.sound) {
        playNotificationSound(notification.type);
      }
    };

    // Unread count update
    const handleUnreadCount = (data: { count: number }) => {
      setUnreadCount(data.count);
    };

    // Notification updated
    const handleNotificationUpdated = (updatedNotification: Notification) => {
      updateNotification(updatedNotification.id, updatedNotification);
    };

    // Workspace notification
    const handleWorkspaceNotification = (notification: Notification) => {
      if (notification.workspaceId === currentWorkspaceId) {
        handleNewNotification(notification);
      }
    };

    // Error handling
    const handleError = (error: { message: string }) => {
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
    socketConnection.isConnected,
    user?.id,
    currentWorkspaceId,
    fetchNotifications,
    refreshUnreadCount,
    addNotification,
    updateNotification,
    setUnreadCount,
    preferences.sound
  ]);

  const playNotificationSound = (type: Notification['type']) => {
    try {
      let soundType: 'message' | 'mention' | 'call' = 'message';
      if (type === 'error') soundType = 'mention';
      if (type === 'warning') soundType = 'call';

      import('./useNotifications').then(({ playSoundUtil }) => {
        playSoundUtil(soundType);
      });
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
