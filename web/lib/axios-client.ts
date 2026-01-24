import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { getSession } from 'next-auth/react';
import { logger } from '@/lib/logger';
import { ApiError, handleApiError } from '@/lib/utils/api-error';

const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

/**
 * Clean Axios client for backend API communication.
 * Completely decoupled from LocalStorage.
 */
export const axiosClient = axios.create({
  baseURL,
});

let activeWorkspaceId: string | null = null;
let cachedToken: string | null = null;

// Keep track of the last valid workspace ID to prevent race conditions during refresh
let lastValidWorkspaceId: string | null = null;

export const getActiveWorkspaceId = () => activeWorkspaceId || lastValidWorkspaceId;

export const setActiveWorkspaceId = (id: string | null) => {
  activeWorkspaceId = id;
  if (id) {
    lastValidWorkspaceId = id;
    axiosClient.defaults.headers.common['x-workspace-id'] = id;
  } else {
    delete axiosClient.defaults.headers.common['x-workspace-id'];
  }
};

export const setAxiosToken = (token: string | null) => {
  cachedToken = token;
};

// Request Interceptor: Attach token and workspace ID
axiosClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Set default content type if not provided and not sending FormData
    if (!config.headers['Content-Type'] && !(config.data instanceof FormData)) {
      config.headers['Content-Type'] = 'application/json';
    }

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
  (error: unknown) => Promise.reject(error)
);

// Queue to hold requests while refreshing token
let isRefreshing = false;

interface FailedRequest {
  resolve: (value: string | null) => void;
  reject: (reason?: unknown) => void;
}

let failedQueue: FailedRequest[] = [];

// Helper to process queue
const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

// Response Interceptor: Advanced Error Handling & Request Queueing
axiosClient.interceptors.response.use(
  (response) => response.data,
  async (error: AxiosError) => {
    const originalRequest = error.config as CustomAxiosRequestConfig;

    if (!originalRequest) {
      return Promise.reject(error);
    }

    // Handle 401 Unauthorized (Token Expired)
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, add this request to queue and wait
        return new Promise<string | null>(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (token) {
              originalRequest.headers['Authorization'] = 'Bearer ' + token;
            }
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
            logger.error("[Axios] Helper: Token refresh returned distinct same token. Loop detected.");
            processQueue(new Error("Token refresh loop detected"), null);
            cachedToken = null; // Clear cache so next attempt tries fresh

            // Do NOT force logout here. It might be a transient network issue where 
            // the refresh endpoint failed (returning old token) but the backend is temporarily down.
            // Letting the request fail allows the user to try again later.
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
          // Do not redirect to login immediately. Let the UI handle the 'Unauthenticated' state 
          // if it persists.
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

    // Convert to standard ApiError for easier handling in components/mutations
    const apiError = new ApiError(
      handleApiError(error),
      error.response?.status,
      error.response?.data
    );

    return Promise.reject(apiError);
  }
);

export default axiosClient;
