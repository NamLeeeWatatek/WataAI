import { useState, useEffect } from 'react'
import { Textarea } from '@/components/ui/Textarea'
import { cn } from '@/lib/utils'

interface JsonEditorProps {
    value: any
    onChange: (value: any) => void
    placeholder?: string
    rows?: number
}

export function JsonEditor({ value, onChange, placeholder, rows = 4 }: JsonEditorProps) {
    const [text, setText] = useState('')
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (typeof value === 'string') {
            setText(value)
        } else {
            setText(JSON.stringify(value || {}, null, 2))
        }
    }, [value])

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newText = e.target.value
        setText(newText)

        try {
            if (!newText.trim()) {
                onChange({})
                setError(null)
                return
            }

            const parsed = JSON.parse(newText)
            onChange(parsed)
            setError(null)
        } catch {
            onChange(newText)
        }
    }

    const handleBlur = () => {
        try {
            if (text.trim()) {
                JSON.parse(text)
            }
            setError(null)
        } catch {
            setError('Invalid JSON format')
        }
    }

    return (
        <div>
            <Textarea
                value={text}
                onChange={handleChange}
                onBlur={handleBlur}
                className={cn(
                    "font-mono text-xs",
                    error && "border-destructive focus-visible:ring-destructive"
                )}
                rows={rows}
                placeholder={placeholder}
            />
            {error && <p className="text-xs text-destructive mt-1 font-medium">{error}</p>}
        </div>
    )
}

