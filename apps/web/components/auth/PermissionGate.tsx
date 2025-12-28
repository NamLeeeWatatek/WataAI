'use client'

import { ReactNode } from 'react'
import { usePermissions } from '@/lib/hooks/usePermissions'
import type { ResourceType, PermissionGateProps } from '@/lib/types'

export function PermissionGate({
  children,
  fallback = null,
  permission,
  permissions,
  requireAll = false,
  resource,
  action,
  widget,
  feature,
  requireAdmin,
  requireSuperAdmin,
  showLoadingFallback = false,
}: PermissionGateProps) {
  const {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canCreate,
    canRead,
    canUpdate,
    canDelete,
    canAccessWidget,
    canAccessFeature,
    isAdmin,
    isSuperAdmin,
    isLoading,
    capabilities,
  } = usePermissions()

  if (isLoading && showLoadingFallback) {
    return <>{fallback}</>
  }

  if (isLoading || !capabilities) {
    return null
  }

  if (requireSuperAdmin && !isSuperAdmin()) {
    return <>{fallback}</>
  }

  if (requireAdmin && !isAdmin()) {
    return <>{fallback}</>
  }

  if (permission && !hasPermission(permission)) {
    return <>{fallback}</>
  }

  if (permissions) {
    const hasAccess = requireAll
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions)

    if (!hasAccess) {
      return <>{fallback}</>
    }
  }

  if (resource && action) {
    let hasAccess = false
    switch (action) {
      case 'create':
        hasAccess = canCreate(resource)
        break
      case 'read':
        hasAccess = canRead(resource)
        break
      case 'update':
        hasAccess = canUpdate(resource)
        break
      case 'delete':
        hasAccess = canDelete(resource)
        break
    }

    if (!hasAccess) {
      return <>{fallback}</>
    }
  }

  if (widget && !canAccessWidget(widget as any)) {
    return <>{fallback}</>
  }

  if (feature && !canAccessFeature(feature as any)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

export function AdminOnly({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <PermissionGate requireAdmin fallback={fallback}>
      {children}
    </PermissionGate>
  )
}

export function SuperAdminOnly({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <PermissionGate requireSuperAdmin fallback={fallback}>
      {children}
    </PermissionGate>
  )
}

export function CanCreate({ resource, children, fallback }: { resource: ResourceType; children: ReactNode; fallback?: ReactNode }) {
  return (
    <PermissionGate resource={resource} action="create" fallback={fallback}>
      {children}
    </PermissionGate>
  )
}

export function CanUpdate({ resource, children, fallback }: { resource: ResourceType; children: ReactNode; fallback?: ReactNode }) {
  return (
    <PermissionGate resource={resource} action="update" fallback={fallback}>
      {children}
    </PermissionGate>
  )
}

export function CanDelete({ resource, children, fallback }: { resource: ResourceType; children: ReactNode; fallback?: ReactNode }) {
  return (
    <PermissionGate resource={resource} action="delete" fallback={fallback}>
      {children}
    </PermissionGate>
  )
}

