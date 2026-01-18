'use client'

import { ReactNode, useState } from 'react'
import { AlertDialogHeader, AlertDialogFooter, AlertDialogDescription, AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogTitle } from './AlertDialog'
import { buttonVariants } from './Button'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

interface AlertDialogConfirmProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string | ReactNode
  confirmText?: string
  cancelText?: string
  onConfirm: () => void | Promise<void>
  variant?: 'default' | 'destructive'
}

export function AlertDialogConfirm({
  open,
  onOpenChange,
  title,
  description,
  confirmText = 'Continue',
  cancelText = 'Cancel',
  onConfirm,
  variant = 'default'
}: AlertDialogConfirmProps) {
  const [loading, setLoading] = useState(false)

  const handleConfirm = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (loading) return

    setLoading(true)
    try {
      await onConfirm()
      if (open) {
        onOpenChange(false)
      }
    } catch (error) {
      console.error(error)
    } finally {
      if (open) setLoading(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={(val) => !loading && onOpenChange(val)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description && (
            <AlertDialogDescription>{description}</AlertDialogDescription>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>{cancelText}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className={cn(variant === 'destructive' && buttonVariants({ variant: "destructive" }))}
            disabled={loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

