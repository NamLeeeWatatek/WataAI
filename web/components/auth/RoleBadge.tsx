'use client'

import { usePermissions } from '@/lib/hooks/usePermissions'
import type { Role, RoleBadgeProps } from '@/lib/types'

const roleColors: Record<Role, string> = {
  super_admin: 'bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-orange-500/20 text-orange-400 border-orange-400/40',
  admin: 'bg-gradient-to-r from-pink-500/20 to-orange-500/20 text-pink-400 border-pink-400/40',
  manager: 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-400 border-purple-400/40',
  editor: 'bg-gradient-to-r from-orange-500/20 to-amber-500/20 text-orange-400 border-orange-400/40',
  viewer: 'bg-gradient-to-r from-pink-500/20 to-rose-500/20 text-pink-400 border-pink-400/40',
  user: 'bg-gradient-to-r from-purple-400/15 to-pink-400/15 text-purple-300 border-purple-300/30',
}

const roleLabels: Record<Role, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  manager: 'Manager',
  editor: 'Editor',
  viewer: 'Viewer',
  user: 'User',
}

export function RoleBadge({ role, className = '' }: RoleBadgeProps) {
  const { capabilities } = usePermissions()
  const userRole = role || capabilities?.role || 'user'

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${roleColors[userRole]} ${className}`}
    >
      {roleLabels[userRole]}
    </span>
  )
}

