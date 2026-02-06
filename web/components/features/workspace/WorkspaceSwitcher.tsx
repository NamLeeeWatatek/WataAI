'use client'

import { useState, useEffect } from 'react'
import { useWorkspaceStore } from '@/lib/store/zustand/workspace-store'
import { useSession } from 'next-auth/react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/Select'
import { cn } from '@/lib/utils'
import { Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface Workspace {
  id: string
  name: string
  slug: string
  plan: string
}

export function WorkspaceSwitcher() {
  const { t } = useTranslation()
  const { data: session, status, update } = useSession()
  const {
    currentWorkspace,
    workspaces,
    isLoading,
    switchWorkspace
  } = useWorkspaceStore()

  const [mounted, setMounted] = useState(false)

  // Sync with axiosClient on change or hydration
  useEffect(() => {
    setMounted(true)
  }, [])

  const handleWorkspaceChange = async (workspaceId: string) => {
    const selectedWorkspace = workspaces.find(w => w.id === workspaceId)
    if (!selectedWorkspace) return

    switchWorkspace(workspaceId)

    // Sync with NextAuth session so it persists across refreshes
    if (status === 'authenticated') {
      try {
        await update({
          workspace: {
            id: selectedWorkspace.id,
            name: selectedWorkspace.name,
            slug: selectedWorkspace.slug
          }
        })
      } catch (err) {
        console.error('Failed to update session workspace:', err)
      }
    }
  }

  // Helper to get initials
  const getInitials = (name: string) => {
    return name?.substring(0, 1).toUpperCase() || 'W'
  }

  if (isLoading || !mounted) {
    return (
      <div className="flex w-full items-center gap-2 rounded-xl border border-border/50 bg-muted/50 p-2">
        <div className="h-8 w-8 rounded-lg bg-muted-foreground/20" />
        <div className="space-y-1">
          <div className="h-3 w-20 rounded bg-muted-foreground/20" />
          <div className="h-2 w-12 rounded bg-muted-foreground/20" />
        </div>
      </div>
    )
  }

  // Common render for the workspace card content
  const renderWorkspaceDisplay = (ws: Partial<Workspace>, isTrigger = false) => (
    <div className="flex items-center gap-3 text-left">
      <div className={cn(
        "flex aspect-square items-center justify-center rounded-lg border border-white/10 shadow-inner",
        isTrigger ? "size-8 bg-gradient-to-br from-teal-500 via-cyan-500 to-emerald-500" : "size-8 border bg-background"
      )}>
        <span className={cn("font-bold", isTrigger ? "text-white" : "text-foreground")}>
          {getInitials(ws.name || '')}
        </span>
      </div>
      <div className="grid flex-1 gap-0.5 leading-none">
        <span className="truncate font-semibold tracking-tight">
          {ws.name}
        </span>
        <span className="truncate text-xs font-medium text-muted-foreground/80">
          {(ws.plan || 'Free') === 'Free' ? t('free') : ws.plan} {t('plan')}
        </span>
      </div>
    </div>
  )

  // Show current workspace name if user only has one workspace
  if (workspaces.length === 1) {
    return (
      <div className="w-full rounded-xl border border-border/40 bg-card/50 p-2 shadow-sm backdrop-blur-sm">
        {renderWorkspaceDisplay(workspaces[0], true)}
      </div>
    )
  }

  return (
    <Select value={currentWorkspace?.id || undefined} onValueChange={handleWorkspaceChange}>
      <SelectTrigger
        className={cn(
          "h-14 w-full rounded-xl border-border/40 bg-card/50 p-2 shadow-sm backdrop-blur-sm focus:ring-0 data-[state=open]:bg-card"
        )}
      >
        {renderWorkspaceDisplay(currentWorkspace || {}, true)}
      </SelectTrigger>
      <SelectContent
        className="w-[--radix-select-trigger-width] min-w-56 rounded-xl border-border/50 bg-popover/95 p-1 backdrop-blur-xl"
        align="start"
      >
        <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
          {t('common.selectWorkspace')}
        </div>
        {workspaces.map((ws) => (
          <SelectItem
            key={ws.id}
            value={ws.id}
            className="rounded-lg p-2 focus:bg-accent focus:text-accent-foreground data-[state=checked]:bg-accent/50"
          >
            {renderWorkspaceDisplay(ws, false)}
          </SelectItem>
        ))}

        {/* Optional: Add New Workspace Action */}
        <div className="mt-1 border-t border-border/50 pt-1">
          <button
            className="flex w-full cursor-not-allowed items-center gap-2 rounded-lg p-2 text-sm text-muted-foreground opacity-50 hover:bg-accent hover:text-foreground"
            disabled
          >
            <div className="flex size-8 items-center justify-center rounded-lg border border-dashed border-muted-foreground/30 bg-background">
              <Plus className="size-4" />
            </div>
            <span className="font-medium">{t('common.createWorkspace')}</span>
            <span className="ml-auto text-[10px] uppercase tracking-widest text-muted-foreground/50">{t('soon')}</span>
          </button>
        </div>
      </SelectContent>
    </Select>
  )
}
