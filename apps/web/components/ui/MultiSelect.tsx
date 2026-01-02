"use client"

import * as React from "react"
import { Check, ChevronDown, X } from "lucide-react"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu"
import { cn } from "@/lib/utils"

export interface MultiSelectOption {
    value: string
    label: string
}

export interface MultiSelectProps {
    options: MultiSelectOption[]
    value: string[]
    onChange: (value: string[]) => void
    placeholder?: string
    className?: string
    disabled?: boolean
}

function MultiSelect({
    options,
    value = [],
    onChange,
    placeholder = "Select options...",
    className,
    disabled = false,
}: MultiSelectProps) {
    const [open, setOpen] = React.useState(false)

    const handleSelect = (optionValue: string) => {
        const newValue = value.includes(optionValue)
            ? value.filter((v) => v !== optionValue)
            : [...value, optionValue]
        onChange(newValue)
    }

    const handleRemove = (optionValue: string, e: React.MouseEvent) => {
        e.stopPropagation()
        onChange(value.filter((v) => v !== optionValue))
    }

    const selectedLabels = value
        .map((v) => options.find((o) => o.value === v)?.label)
        .filter(Boolean)

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                <Button
                    data-slot="multi-select-trigger"
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn(
                        "border-input data-[placeholder]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 flex min-h-9 w-full items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
                        className
                    )}
                    disabled={disabled}
                >
                    <div className="flex flex-wrap gap-1 items-center overflow-hidden">
                        {value.length > 0 ? (
                            value.map((v) => {
                                const option = options.find((o) => o.value === v)
                                return (
                                    <Badge
                                        key={v}
                                        variant="secondary"
                                        className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 flex items-center gap-1.5 px-1.5 py-0 h-6 text-[11px] font-bold"
                                    >
                                        {option?.label || v}
                                        <X
                                            className="h-3 w-3 cursor-pointer opacity-70 hover:opacity-100"
                                            onClick={(e) => handleRemove(v, e)}
                                        />
                                    </Badge>
                                )
                            })
                        ) : (
                            <span className="text-muted-foreground">{placeholder}</span>
                        )}
                    </div>
                    <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                className="w-[var(--radix-dropdown-menu-trigger-width)] max-h-60 overflow-y-auto"
                align="start"
            >
                {options.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                        No options found.
                    </div>
                ) : (
                    options.map((option) => (
                        <DropdownMenuCheckboxItem
                            key={option.value}
                            checked={value.includes(option.value)}
                            onCheckedChange={() => handleSelect(option.value)}
                            onSelect={(e) => e.preventDefault()} // Keep open
                        >
                            {option.label}
                        </DropdownMenuCheckboxItem>
                    ))
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

export { MultiSelect }
