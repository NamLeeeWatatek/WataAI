/**
 * Application Routes Configuration
 * 
 * This file serves as the Single Source of Truth (SSOT) for all application routes.
 * It provides type-safe route definitions and helper functions for dynamic paths.
 * 
 * Usage:
 * import { paths } from '@/lib/routes';
 * <Link href={paths.system.users}>Users</Link>
 * router.push(paths.dashboard.bots.details('123'))
 */

const ROOTS = {
    AUTH: '/auth',
    DASHBOARD: '/dashboard',
    SYSTEM: '/system',
};

export const paths = {
    home: '/',

    // Auth Routes
    auth: {
        login: `/login`, // Often at root level in Next.js
        register: `/register`,
        forgotPassword: `/forgot-password`,
        resetPassword: `/reset-password`,
    },

    // User Dashboard Routes
    dashboard: {
        root: ROOTS.DASHBOARD,
        activity: `${ROOTS.DASHBOARD}/activity`,
        bots: {
            root: `${ROOTS.DASHBOARD}/bots`,
            create: `${ROOTS.DASHBOARD}/bots/create`,
            details: (id: string) => `${ROOTS.DASHBOARD}/bots/${id}`,
            edit: (id: string) => `${ROOTS.DASHBOARD}/bots/${id}/edit`,
        },
        conversations: {
            root: `${ROOTS.DASHBOARD}/conversations`,
            details: (id: string) => `${ROOTS.DASHBOARD}/conversations/${id}`,
        },
        knowledgeBase: {
            root: `${ROOTS.DASHBOARD}/knowledge-base`,
            details: (id: string) => `${ROOTS.DASHBOARD}/knowledge-base/${id}`,
        },
        channels: {
            root: `${ROOTS.DASHBOARD}/channels`,
        },
        myProducts: {
            root: `${ROOTS.DASHBOARD}/my-products`,
        },
        settings: {
            root: `${ROOTS.DASHBOARD}/settings`,
            profile: `${ROOTS.DASHBOARD}/settings/profile`,
        },
    },

    // System Admin Routes
    system: {
        root: ROOTS.SYSTEM,
        users: {
            root: `${ROOTS.SYSTEM}/users`,
            details: (id: string) => `${ROOTS.SYSTEM}/users/${id}`,
        },
        roles: {
            root: `${ROOTS.SYSTEM}/roles-permissions`,
        },
        creationTools: {
            root: `${ROOTS.SYSTEM}/creation-tools`,
            details: (slug: string) => `${ROOTS.SYSTEM}/creation-tools/${slug}`,
        },
        categories: {
            root: `${ROOTS.SYSTEM}/categories`,
        },
        templates: {
            root: `${ROOTS.SYSTEM}/templates`,
            manage: `${ROOTS.SYSTEM}/templates`, // Consolidated route
        }
    },
} as const;
