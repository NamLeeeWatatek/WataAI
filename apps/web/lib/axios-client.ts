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

export const setActiveWorkspaceId = (id: string | null) => {
  activeWorkspaceId = id;
};

export const setAxiosToken = (token: string | null) => {
  cachedToken = token;
};

// Request Interceptor: Attach token and workspace ID
axiosClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // 1. Get token from cache or session
    if (!cachedToken) {
      const session = await getSession();
      if (session?.accessToken) {
        cachedToken = session.accessToken;
      }
    }

    if (cachedToken) {
      config.headers.Authorization = `Bearer ${cachedToken}`;
    }

    if (activeWorkspaceId) {
      config.headers['x-workspace-id'] = activeWorkspaceId;
    }

    return config;
  },
  (error: Error) => Promise.reject(error)
);

// Response Interceptor: Basic error handling
axiosClient.interceptors.response.use(
  (response) => response.data,
  async (error: AxiosError) => {
    // If we get a 401, it means the token in memory might be stale
    // but NextAuth should have handled refresh in the background via getSession().
    // If it still fails, we let the component or SessionWatcher handle the logout.
    if (error.response?.status === 401) {
      // Clear cache so next request tries to get fresh session
      cachedToken = null;
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
