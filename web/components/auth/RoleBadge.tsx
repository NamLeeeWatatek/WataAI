'use client'

import { usePermissions } from '@/lib/hooks/usePermissions'
import type { Role, RoleBadgeProps } from '@/lib/types'

const roleColors: Record<Role, string> = {
  super_admin: 'bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-red-500/20 text-orange-400 border-orange-400/40',
  admin: 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400 border-cyan-400/40',
  manager: 'bg-gradient-to-r from-teal-500/20 to-emerald-500/20 text-teal-400 border-teal-400/40',
  editor: 'bg-gradient-to-r from-orange-500/20 to-amber-500/20 text-orange-400 border-orange-400/40',
  viewer: 'bg-gradient-to-r from-sky-500/20 to-blue-500/20 text-sky-400 border-sky-400/40',
  user: 'bg-gradient-to-r from-slate-400/15 to-gray-400/15 text-slate-300 border-slate-300/30',
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

