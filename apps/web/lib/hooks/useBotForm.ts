import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import * as z from 'zod'
import axiosClient from '@/lib/axios-client'
import { handleFormError } from '@/lib/utils/form-errors'

// Schema definitions
export const botFormSchema = z.object({
  name: z.string().min(1, 'Tên bot là bắt buộc'),
  description: z.string().optional(),
  workspaceId: z.string(),
  defaultLanguage: z.string(),
  timezone: z.string(),
})

export type BotFormData = z.infer<typeof botFormSchema>

// API functions
const createBot = async (data: BotFormData) => {
  return axiosClient.post('/bots', data)
}

const updateBot = async ({ id, data }: { id: string; data: BotFormData }) => {
  return axiosClient.put(`/bots/${id}`, data)
}

// Hook for bot form logic
export function useBotForm(workspaceId: string, bot?: {
  id: string
  name: string
  description?: string
  workspaceId: string
  defaultLanguage?: string
  timezone?: string
}) {
  const queryClient = useQueryClient()

  const form = useForm<BotFormData>({
    resolver: zodResolver(botFormSchema),
    defaultValues: {
      name: '',
      description: '',
      workspaceId,
      defaultLanguage: 'en',
      timezone: 'UTC',
    },
  })

  // Reset form when bot or workspace changes
  useEffect(() => {
    if (bot) {
      form.reset({
        name: bot.name || '',
        description: bot.description || '',
        workspaceId: bot.workspaceId || workspaceId,
        defaultLanguage: bot.defaultLanguage || 'en',
        timezone: bot.timezone || 'UTC',
      })
    } else {
      form.reset({
        name: '',
        description: '',
        workspaceId,
        defaultLanguage: 'en',
        timezone: 'UTC',
      })
    }
  }, [bot, workspaceId, form])

  // Mutations
  const createMutation = useMutation({
    mutationFn: createBot,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bots'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
    },
    onError: (error: any) => {
      handleFormError(error, form)
    },
  })

  const updateMutation = useMutation({
    mutationFn: updateBot,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bots'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
    },
    onError: (error: any) => {
      handleFormError(error, form)
    },
  })

  const handleSubmit = async (data: BotFormData) => {
    if (bot) {
      await updateMutation.mutateAsync({ id: bot.id, data })
    } else {
      await createMutation.mutateAsync(data)
    }
  }

  const isSubmitting = createMutation.isPending || updateMutation.isPending

  return {
    form,
    handleSubmit,
    isSubmitting,
    errors: form.formState.errors,
  }
}
