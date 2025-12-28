import { useState, useEffect } from 'react'

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
            <textarea
                value={text}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full glass rounded-lg px-3 py-2 border ${error ? 'border-red-500' : 'border-border/40'} focus:outline-none focus:ring-2 focus:ring-primary/20 font-mono text-xs`}
                rows={rows}
                placeholder={placeholder}
            />
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>
    )
}

