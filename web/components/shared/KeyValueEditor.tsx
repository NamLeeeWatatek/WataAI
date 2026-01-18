
import React, { useState, useEffect } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { cn } from '@/lib/utils'

interface KeyValueEditorProps {
    value?: Record<string, string>
    onChange: (value: Record<string, string>) => void
    placeholder?: { key: string; value: string }
    className?: string
}

export function KeyValueEditor({
    value = {},
    onChange,
    placeholder = { key: 'Key', value: 'Value' },
    className
}: KeyValueEditorProps) {
    const [entries, setEntries] = useState<[string, string][]>([])

    useEffect(() => {
        if (value) {
            setEntries(Object.entries(value))
        } else {
            setEntries([])
        }
    }, [value])

    const handleAdd = () => {
        const newEntries = [...entries, ['', ''] as [string, string]]
        setEntries(newEntries)
        updateParent(newEntries)
    }

    const handleRemove = (index: number) => {
        const newEntries = entries.filter((_, i) => i !== index)
        setEntries(newEntries)
        updateParent(newEntries)
    }

    const handleChange = (index: number, type: 'key' | 'value', val: string) => {
        const newEntries = [...entries]
        if (type === 'key') {
            newEntries[index][0] = val
        } else {
            newEntries[index][1] = val
        }
        setEntries(newEntries)
        updateParent(newEntries)
    }

    const updateParent = (currentEntries: [string, string][]) => {
        const newValue = currentEntries.reduce((acc, [k, v]) => {
            if (k) acc[k] = v
            return acc
        }, {} as Record<string, string>)
        onChange(newValue)
    }

    return (
        <div className={cn("space-y-3", className)}>
            {entries.length === 0 && (
                <div className="flex flex-col items-center justify-center p-6 border border-dashed rounded-lg bg-muted/30 text-muted-foreground text-sm transition-colors hover:bg-muted/50">
                    <p className="font-medium">No items defined</p>
                    <p className="text-xs opacity-70 mt-1">Add key-value pairs to configure settings</p>
                </div>
            )}

            <div className="space-y-2">
                {entries.map((entry, index) => (
                    <div key={index} className="flex gap-2 group animate-in fade-in slide-in-from-left-2 duration-300">
                        <Input
                            placeholder={placeholder.key}
                            value={entry[0]}
                            onChange={(e) => handleChange(index, 'key', e.target.value)}
                            className="flex-1 bg-background"
                        />
                        <Input
                            placeholder={placeholder.value}
                            value={entry[1]}
                            onChange={(e) => handleChange(index, 'value', e.target.value)}
                            className="flex-1 bg-background"
                        />
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemove(index)}
                            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>
                ))}
            </div>

            <Button
                variant="outline"
                size="sm"
                onClick={handleAdd}
                className="w-full border-dashed hover:border-primary/50 hover:bg-primary/5 hover:text-primary transition-all"
                type="button"
            >
                <Plus className="w-4 h-4 mr-2" />
                Add Item
            </Button>
        </div>
    )
}
