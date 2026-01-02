import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { getSession } from 'next-auth/react';

const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

/**
 * Clean Axios client for backend API communication.
 * Completely decoupled from LocalStorage.
 */
export const axiosClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

let activeWorkspaceId: string | null = null;
let cachedToken: string | null = null;

// Keep track of the last valid workspace ID to prevent race conditions during refresh
let lastValidWorkspaceId: string | null = null;

export const setActiveWorkspaceId = (id: string | null) => {
  activeWorkspaceId = id;
  if (id) {
    lastValidWorkspaceId = id;
  }
};

export const setAxiosToken = (token: string | null) => {
  cachedToken = token;
};

// Request Interceptor: Attach token and workspace ID
axiosClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // 1. Get token from cache or session
    // We also use this opportunity to hydrate workspaceId if missing
    if (!cachedToken || !activeWorkspaceId) {
      const session = await getSession();

      if (session?.accessToken && !cachedToken) {
        cachedToken = session.accessToken;
      }

      if (session?.workspace?.id && !activeWorkspaceId) {
        activeWorkspaceId = session.workspace.id;
        lastValidWorkspaceId = session.workspace.id;
      }
    }

    if (cachedToken) {
      config.headers.Authorization = `Bearer ${cachedToken}`;
    }

    // Use active workspace ID or fallback to last known valid ID
    // This prevents 400 errors during brief session refresh moments where ID might be "lost"
    const workspaceIdToUse = activeWorkspaceId || lastValidWorkspaceId;

    if (workspaceIdToUse) {
      // Use lowercase for consistency across client/server axios
      config.headers['x-workspace-id'] = workspaceIdToUse;
    }

    return config;
  },
  (error: Error) => Promise.reject(error)
);

// Queue to hold requests while refreshing token
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: any) => void;
}> = [];

// Helper to process queue
const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

// Response Interceptor: Advanced Error Handling & Request Queueing
axiosClient.interceptors.response.use(
  (response) => response.data,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    // Handle 401 Unauthorized (Token Expired)
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, add this request to queue and wait
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers['Authorization'] = 'Bearer ' + token;
            // Also re-attach workspace ID just in case
            if (activeWorkspaceId || lastValidWorkspaceId) {
              originalRequest.headers['x-workspace-id'] = activeWorkspaceId || lastValidWorkspaceId;
            }
            return axiosClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Force session refresh via NextAuth
        // getSession() will trigger the backend refresh logic if configured
        const session = await getSession();

        if (session?.accessToken) {
          const newToken = session.accessToken;

          // CRITICAL: Prevent infinite loop if NextAuth returns the same expired token
          // This happens if client/server clocks are out of sync or if refresh logic skipped
          if (newToken === cachedToken) {
            console.error("[Axios] Helper: Token refresh returned distinct same token. Forcing logout/reload.");
            processQueue(new Error("Token refresh loop detected"), null);
            cachedToken = null;
            // Optional: Force reload to reset application state
            if (typeof window !== 'undefined') {
              window.location.href = '/login';
            }
            return Promise.reject(error);
          }

          setAxiosToken(newToken);

          // Re-send the original failed request
          axiosClient.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
          originalRequest.headers['Authorization'] = `Bearer ${newToken}`;

          // Process all queued requests
          processQueue(null, newToken);

          return axiosClient(originalRequest);
        } else {
          // Refresh failed - Reject all
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
          throw new Error("Session refresh failed");
        }
      } catch (err) {
        processQueue(err, null);

        // Clear cache
        cachedToken = null;

        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default axiosClient;
