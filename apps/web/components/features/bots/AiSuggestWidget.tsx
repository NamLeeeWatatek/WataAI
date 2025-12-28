'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import axiosClient from '@/lib/axios-client'
import toast from '@/lib/toast'
import { Zap, Check, X } from 'lucide-react'
import type { AiSuggestWidgetProps } from '@/lib/types'

export function AiSuggestWidget({
    functionId,
    task,
    context,
    onApply,
    className = '',
}: AiSuggestWidgetProps) {
    const [loading, setLoading] = useState(false)
    const [suggestion, setSuggestion] = useState<string | null>(null)
    const [showSuggestion, setShowSuggestion] = useState(false)

    const getSuggestion = async () => {
        try {
            setLoading(true)
            const response = await axiosClient.post('/bots/functions/execute', {
                functionId,
                input: {
                    task,
                    context,
                },
            }) as any

            if (response.success) {
                setSuggestion(response.suggestion)
                setShowSuggestion(true)
            } else {
                toast.error('Failed to get suggestion')
            }
        } catch {
            toast.error('Failed to get AI suggestion')
        } finally {
            setLoading(false)
        }
    }

    const applySuggestion = () => {
        if (suggestion && onApply) {
            onApply(suggestion)
            setShowSuggestion(false)
            toast.success('Suggestion applied')
        }
    }

    const dismissSuggestion = () => {
        setShowSuggestion(false)
        setSuggestion(null)
    }

    return (
        <div className={className}>
            {!showSuggestion ? (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={getSuggestion}
                    disabled={loading}
                >
                    {loading ? (
                        <Spinner className="size-4 mr-2" />
                    ) : (
                        <Zap className="w-4 h-4 mr-2" />
                    )}
                    AI Suggest
                </Button>
            ) : (
                <Card className="p-4 bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800">
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-purple-500 flex items-center justify-center flex-shrink-0">
                            <Zap className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1">
                            <h4 className="font-semibold text-sm mb-2">AI Suggestion</h4>
                            <p className="text-sm text-muted-foreground mb-3">{suggestion}</p>
                            <div className="flex items-center gap-2">
                                <Button size="sm" onClick={applySuggestion}>
                                    <Check className="w-4 h-4 mr-2" />
                                    Apply
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={dismissSuggestion}
                                >
                                    <X className="w-4 h-4 mr-2" />
                                    Dismiss
                                </Button>
                            </div>
                        </div>
                    </div>
                </Card>
            )}
        </div>
    )
}

