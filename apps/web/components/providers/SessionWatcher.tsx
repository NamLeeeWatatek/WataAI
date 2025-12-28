'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { setAxiosToken } from '@/lib/axios-client';

/**
 * SessionWatcher:
 * 1. Syncs the NextAuth accessToken to the axios client.
 * 2. Handles automatic redirection if a RefreshAccessTokenError occurs.
 */
export function SessionWatcher() {
    const { error, signOut, accessToken, isAuthenticated } = useAuth();
    const pathname = usePathname();

    // 1. Sync Token to Axios
    useEffect(() => {
        if (isAuthenticated && accessToken) {
            setAxiosToken(accessToken);
        } else {
            setAxiosToken(null);
        }
    }, [isAuthenticated, accessToken]);

    // 2. Handle Refresh Error (Auto-logout)
    useEffect(() => {
        if (error === 'RefreshAccessTokenError') {
            console.warn('[SessionWatcher] Refresh token expired or failed. Signing out...');
            signOut({
                redirect: true,
                callbackUrl: `/login?callbackUrl=${encodeURIComponent(pathname)}`
            });
        }
    }, [error, signOut, pathname]);

    return null;
}
