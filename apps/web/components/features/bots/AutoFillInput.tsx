'use client'

import { useState } from 'react'
import { Sparkles, Loader2, Check } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export interface AutoFillInputProps {
  functionId: string
  field: string
  context: string
  value: string
  onChange: (value: string) => void
  label?: string
  placeholder?: string
  className?: string
}

export function AutoFillInput({
  functionId,
  field,
  context,
  value,
  onChange,
  label,
  placeholder,
  className,
}: AutoFillInputProps) {
  const [suggestion, setSuggestion] = useState('')
  const [loading, setLoading] = useState(false)
  const [showSuggestion, setShowSuggestion] = useState(false)

  const getSuggestion = async () => {
    setLoading(true)
    try {
      toast.error('This feature needs to be updated to use the new API')
      
    } catch {
      toast.error('Đã xảy ra lỗi khi tạo gợi ý')
    } finally {
      setLoading(false)
    }
  }

  const applySuggestion = () => {
    onChange(suggestion)
    setShowSuggestion(false)
    toast.success('Đã áp dụng gợi ý')
  }

  return (
    <div className={cn('space-y-2', className)}>
      {label && <Label>{label}</Label>}
      <div className="flex gap-2">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1"
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={getSuggestion}
          disabled={loading}
          title="Gợi ý AI"
        >
          {loading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Sparkles className="size-4" />
          )}
        </Button>
      </div>
      {showSuggestion && suggestion && (
        <div className="flex items-center gap-2 p-3 bg-muted rounded-lg border border-primary/20">
          <Sparkles className="size-4 text-primary flex-shrink-0" />
          <p className="text-sm flex-1">{suggestion}</p>
          <Button
            type="button"
            size="sm"
            onClick={applySuggestion}
            className="flex-shrink-0"
          >
            <Check className="size-4 mr-1" />
            Áp dụng
          </Button>
        </div>
      )}
    </div>
  )
}

