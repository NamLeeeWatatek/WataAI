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
    const [error, setError] = useState<string | null>(null)

    // Initialize text state based on value prop
    const [text, setText] = useState(() => {
        if (typeof value === 'string') {
            return value;
        } else {
            return JSON.stringify(value || {}, null, 2);
        }
    });

    useEffect(() => {
        const newText = typeof value === 'string'
            ? value
            : JSON.stringify(value || {}, null, 2);

        // Only update if the text has actually changed to avoid unnecessary re-renders
        if (newText !== text) {
            setText(newText);
        }
    }, [value, text])

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

