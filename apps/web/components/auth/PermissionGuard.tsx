'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { usePermissions } from '@/lib/hooks/usePermissions'
import { paths } from '@/lib/routes'
import { LoadingLogo } from '@/components/ui/LoadingLogo'

interface PermissionGuardProps {
    children: React.ReactNode
    permission?: string
    permissions?: string[]
    requireAll?: boolean
    redirectTo?: string
}

/**
 * Route guard component.
 * Redirects to dashboard (or specific path) if user lacks permission.
 * Shows loading spinner while checking.
 * 
 * Usage in Page.tsx:
 * export default function UsersPage() {
 *   return (
 *     <PermissionGuard permission={PERMISSIONS.IAM.LIST_USERS}>
 *       <UsersContent />
 *     </PermissionGuard>
 *   )
 * }
 */
export const PermissionGuard: React.FC<PermissionGuardProps> = ({
    children,
    permission,
    permissions,
    requireAll = false,
    redirectTo = paths.dashboard.root
}) => {
    const router = useRouter()
    const {
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        isLoading,
        isSuperAdmin
    } = usePermissions()

    useEffect(() => {
        if (isLoading) return

        if (isSuperAdmin()) return

        let authorized = false
        if (permission) {
            authorized = hasPermission(permission)
        } else if (permissions && permissions.length > 0) {
            authorized = requireAll ? hasAllPermissions(permissions) : hasAnyPermission(permissions)
        } else {
            authorized = true
        }

        if (!authorized) {
            router.push(redirectTo as any)
        }
    }, [isLoading, permission, permissions, requireAll, redirectTo, hasPermission, hasAnyPermission, hasAllPermissions, isSuperAdmin, router])

    if (isLoading) {
        return (
            <div className="h-full w-full flex items-center justify-center min-h-[400px]">
                <LoadingLogo />
            </div>
        )
    }

    // Check auth immediately for render to avoid flash (though useEffect handles redirect)
    // Double check to prevent flash of content
    if (!isSuperAdmin()) {
        let authorized = false
        if (permission) {
            authorized = hasPermission(permission)
        } else if (permissions && permissions.length > 0) {
            authorized = requireAll ? hasAllPermissions(permissions) : hasAnyPermission(permissions)
        } else {
            authorized = true
        }

        if (!authorized) return null
    }

    return <>{children}</>
}
