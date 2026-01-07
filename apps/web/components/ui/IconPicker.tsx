"use client"

import * as React from "react"
import { Button } from "@/components/ui/Button"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/Popover"
import { ScrollArea } from "@/components/ui/ScrollArea"
import { type LucideIcon, Folder } from 'lucide-react'
import { Search } from "@/components/ui/Search"
import { cn } from "@/lib/utils"
import { commonIcons } from "@/lib/constants/icons"
import { iconMap } from "@/lib/icon-map"

interface IconPickerProps {
    value?: string
    onChange: (icon: string) => void
    className?: string
}

export function IconPicker({ value, onChange, className }: IconPickerProps) {
    const [open, setOpen] = React.useState(false)
    const [search, setSearch] = React.useState("")

    const filteredIcons = React.useMemo(() => {
        return commonIcons.filter(icon =>
            icon.toLowerCase().includes(search.toLowerCase())
        )
    }, [search])

    const SelectedIcon = (value && iconMap[value])
        ? iconMap[value]
        : Folder

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn("w-full justify-start h-12 pl-4 font-medium hover:bg-accent transition-all rounded-md", className)}
                >
                    <div className="p-2 rounded bg-primary/10 text-primary mr-3">
                        <SelectedIcon className="w-4 h-4" />
                    </div>
                    <span className="opacity-80">{value || "Select icon..."}</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0 rounded-md shadow-md animate-in zoom-in-95 duration-200" align="start">
                <div className="p-4 border-b border-border">
                    <Search
                        placeholder="Search icons..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onClear={() => setSearch("")}
                        variant="ghost"
                        className="bg-muted/50 rounded-md"
                    />
                </div>
                <ScrollArea className="h-72">
                    <div className="grid grid-cols-5 gap-2 p-4">
                        {filteredIcons.map((iconName) => {
                            const IconComponent = iconMap[iconName]
                            if (!IconComponent) return null;

                            return (
                                <Button
                                    type="button"
                                    key={iconName}
                                    variant="ghost"
                                    onClick={() => {
                                        onChange(iconName)
                                        setOpen(false)
                                    }}
                                    className={cn(
                                        "h-auto w-auto aspect-square p-0 rounded-md hover:bg-primary hover:text-primary-foreground transition-all flex items-center justify-center group relative",
                                        value === iconName ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted/10 border border-border/50"
                                    )}
                                    title={iconName}
                                >
                                    <IconComponent className="w-5 h-5 transition-transform group-hover:scale-125" />
                                    {value === iconName && (
                                        <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-success rounded-full border-2 border-background animate-bounce" />
                                    )}
                                </Button>
                            )
                        })}
                    </div>
                </ScrollArea>
            </PopoverContent>
        </Popover>
    )
}
