'use client'

import { ReactNode } from 'react'
import { AlertDialogHeader, AlertDialogFooter, AlertDialogDescription, AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogTitle } from './AlertDialog'

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
  const handleConfirm = async () => {
    try {
      await onConfirm()
      if (open) {
        onOpenChange(false)
      }
    } catch {

    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description && (
            <AlertDialogDescription>{description}</AlertDialogDescription>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{cancelText}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className={variant === 'destructive' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

