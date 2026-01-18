'use client'

import React from 'react'
import { usePermissions } from '@/lib/hooks/usePermissions'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/Tooltip'
import { cn } from '@/lib/utils'

export interface PermissionGateProps {
  children: React.ReactNode

  /**
   * The fallback content to show if permission is denied.
   * If not provided, children are simply not rendered.
   */
  fallback?: React.ReactNode

  /**
   * Single permission required
   */
  permission?: string

  /**
   * List of permissions required.
   * By default, ANY of these will grant access.
   * Use `requireAll` to enforce ALL.
   */
  permissions?: string[]

  /**
   * If true, user must have ALL listed permissions.
   * If false (default), user needs only ONE of the listed.
   */
  requireAll?: boolean

  /**
   * If defined, renders children but disabled/greyed out if denied.
   * Usually combined with a tooltip.
   */
  renderDisabled?: boolean

  /**
   * Tooltip message to show when renderDisabled is true and permission is denied.
   */
  disabledTooltip?: string

  className?: string
}

/**
 * A wrapper component that conditionally renders its children based on user permissions.
 * 
 * Usage:
 * <PermissionGate permission={PERMISSIONS.TOOLS.CREATE}>
 *   <CreateButton />
 * </PermissionGate>
 * 
 * <PermissionGate 
 *   permission={PERMISSIONS.TOOLS.DELETE} 
 *   renderDisabled 
 *   disabledTooltip="You do not have permission to delete"
 * >
 *   <DeleteButton />
 * </PermissionGate>
 */
export const PermissionGate: React.FC<PermissionGateProps> = ({
  children,
  fallback = null,
  permission,
  permissions,
  requireAll = false,
  renderDisabled = false,
  disabledTooltip = "You do not have permission to perform this action",
  className
}) => {
  const { hasPermission, hasAllPermissions, hasAnyPermission, isLoading, isSuperAdmin } = usePermissions()

  // Always allow super admin (though hook handles this, explicit check here is cheap/safe)
  if (isSuperAdmin()) {
    return <>{children}</>
  }

  // Loading state handling could be added here if critical
  if (isLoading) {
    // Optionally return nothing or a skeleton
    return null
  }

  let authorized = false

  if (permission) {
    authorized = hasPermission(permission)
  } else if (permissions && permissions.length > 0) {
    if (requireAll) {
      authorized = hasAllPermissions(permissions)
    } else {
      authorized = hasAnyPermission(permissions)
    }
  } else {
    // No permission constraints defined -> Assume public/allowed
    authorized = true
  }

  if (authorized) {
    return <>{children}</>
  }

  if (renderDisabled) {
    // If we want to show the UI but disabled
    // If children is a Button or interactive element, we might need to clone it to add disabled prop,
    // or just wrap it in a div that captures events.
    // However, cloning is React-specific and can be brittle.
    // Better approach: User passes a disabled prop to child? No, PermissionGate shouldn't know child props.
    // Wrapper approach: "pointer-events-none opacity-50"

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn("inline-flex opacity-50 pointer-events-none cursor-not-allowed", className)} aria-disabled="true">
              {children}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{disabledTooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return <>{fallback}</>
}
