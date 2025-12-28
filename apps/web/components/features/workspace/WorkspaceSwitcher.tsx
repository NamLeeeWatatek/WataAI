'use client'

import { useState, useEffect } from 'react'
import { useAppSelector, useAppDispatch } from '@/lib/store/hooks'
import { useSession } from 'next-auth/react'
import axiosClient from '@/lib/axios-client'
import { switchWorkspace } from '@/lib/store/slices/workspaceSlice'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/Select'
import { cn } from '@/lib/utils'
import { Plus } from 'lucide-react'

interface Workspace {
  id: string
  name: string
  slug: string
  plan: string
}

export function WorkspaceSwitcher() {
  const dispatch = useAppDispatch()
  const { currentWorkspace, workspaces, isLoading } = useAppSelector(state => state.workspace)

  // Sync with axiosClient on change or hydration
  useEffect(() => {
    if (currentWorkspace?.id) {
      import('@/lib/axios-client').then(({ setActiveWorkspaceId }) => {
        setActiveWorkspaceId(currentWorkspace.id)
      })
    }
  }, [currentWorkspace?.id])

  const handleWorkspaceChange = (workspaceId: string) => {
    dispatch(switchWorkspace(workspaceId))
    import('@/lib/axios-client').then(({ setActiveWorkspaceId }) => {
      setActiveWorkspaceId(workspaceId)
      // Optional: Force reload to clear other states if needed
      // window.location.reload()
    })
  }

  // Helper to get initials
  const getInitials = (name: string) => {
    return name?.substring(0, 1).toUpperCase() || 'W'
  }

  if (isLoading) {
    return (
      <div className="flex w-full items-center gap-2 rounded-xl border border-border/50 bg-muted/50 p-2">
        <div className="h-8 w-8 animate-pulse rounded-lg bg-muted-foreground/20" />
        <div className="space-y-1">
          <div className="h-3 w-20 animate-pulse rounded bg-muted-foreground/20" />
          <div className="h-2 w-12 animate-pulse rounded bg-muted-foreground/20" />
        </div>
      </div>
    )
  }

  // Common render for the workspace card content
  const renderWorkspaceDisplay = (ws: Partial<Workspace>, isTrigger = false) => (
    <div className="flex items-center gap-3 text-left">
      <div className={cn(
        "flex aspect-square items-center justify-center rounded-lg border border-white/10 shadow-inner",
        isTrigger ? "size-8 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500" : "size-8 border bg-background"
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
          {ws.plan || 'Free'} Plan
        </span>
      </div>
    </div>
  )

  // Show current workspace name if user only has one workspace
  if (workspaces.length === 1) {
    return (
      <div className="w-full rounded-xl border border-border/40 bg-card/50 p-2 shadow-sm backdrop-blur-sm transition-all hover:bg-card/80 hover:shadow-md">
        {renderWorkspaceDisplay(workspaces[0], true)}
      </div>
    )
  }

  return (
    <Select value={currentWorkspace?.id || undefined} onValueChange={handleWorkspaceChange}>
      <SelectTrigger
        className={cn(
          "h-14 w-full rounded-xl border-border/40 bg-card/50 p-2 shadow-sm backdrop-blur-sm hover:bg-card/80 hover:shadow-md focus:ring-0 data-[state=open]:bg-card"
        )}
      >
        {renderWorkspaceDisplay(currentWorkspace || {}, true)}
      </SelectTrigger>
      <SelectContent
        className="w-[--radix-select-trigger-width] min-w-56 rounded-xl border-border/50 bg-popover/95 p-1 backdrop-blur-xl"
        align="start"
      >
        <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
          Select Workspace
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
            <span className="font-medium">Create Workspace</span>
            <span className="ml-auto text-[10px] uppercase tracking-widest text-muted-foreground/50">Soon</span>
          </button>
        </div>
      </SelectContent>
    </Select>
  )
}
