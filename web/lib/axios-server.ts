/**
 * Server-side Axios Configuration with NextAuth v5
 * Use this in server components and API routes
 */
import axios from 'axios'
import { auth } from '@/auth'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

export const axiosServer = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

export async function getAuthenticatedAxios(workspaceId?: string) {
  const session = await auth()
  
  const instance = axios.create({
    baseURL: API_URL,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
      ...(session?.accessToken && {
        Authorization: `Bearer ${session.accessToken}`,
      }),
      // Add workspace context header
      ...(workspaceId || session?.workspace?.id) && {
        'X-Workspace-Id': workspaceId || session?.workspace?.id,
      },
    },
  })

  instance.interceptors.response.use(
    (response) => response.data,
    (error) => {
      const message = error.response?.data?.detail || error.message || 'An error occurred'
      return Promise.reject(new Error(message))
    }
  )

  return instance
}

export default axiosServer

