"use client"

import * as React from "react"
import { Button } from "@/components/ui/Button"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/Popover"
import { Input } from "@/components/ui/Input"
import { ScrollArea } from "@/components/ui/ScrollArea"
import { icons, Search, Folder } from 'lucide-react'
import { cn } from "@/lib/utils"

interface IconPickerProps {
    value?: string
    onChange: (icon: string) => void
    className?: string
}

const commonIcons = [
    'Folder',
    'File',
    'FileText',
    'Book',
    'BookOpen',
    'Database',
    'Archive',
    'Box',
    'Briefcase',
    'Clipboard',
    'Code',
    'Coffee',
    'Cpu',
    'CreditCard',
    'DollarSign',
    'Globe',
    'Grid',
    'HardDrive',
    'Hash',
    'Heart',
    'Home',
    'Image',
    'Inbox',
    'Layers',
    'Layout',
    'LifeBuoy',
    'List',
    'Lock',
    'Mail',
    'Map',
    'MessageSquare',
    'Monitor',
    'Music',
    'Package',
    'Paperclip',
    'PieChart',
    'Settings',
    'ShoppingBag',
    'ShoppingCart',
    'Star',
    'Tag',
    'Target',
    'Tool',
    'TrendingUp',
    'Truck',
    'Tv',
    'User',
    'Users',
    'Video',
    'Zap',
    'Bot',
    'Globe2',
    'Library',
    'Brain',
    'Sparkles'
]

export function IconPicker({ value, onChange, className }: IconPickerProps) {
    const [open, setOpen] = React.useState(false)
    const [search, setSearch] = React.useState("")

    const filteredIcons = commonIcons.filter(icon =>
        icon.toLowerCase().includes(search.toLowerCase())
    )

    const SelectedIcon = value && (icons as any)[value] ? (icons as any)[value] : Folder

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    rounded="xl"
                    aria-expanded={open}
                    className={cn("w-full justify-start h-12 glass border-white/5 pl-4 font-bold hover:border-primary/40 focus:ring-primary/40 transition-all", className)}
                >
                    <div className="p-2 rounded-lg bg-primary/10 text-primary mr-3 shadow-inner">
                        <SelectedIcon className="w-4 h-4" />
                    </div>
                    <span className="opacity-80">{value || "Identify with icon..."}</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0 glass border-white/10 rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200" align="start">
                <div className="p-4 border-b border-white/5">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
                        <Input
                            placeholder="Search cryptograms..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            rounded="xl"
                            className="h-10 glass border-white/5 pl-9 font-bold text-xs"
                        />
                    </div>
                </div>
                <ScrollArea className="h-72">
                    <div className="grid grid-cols-5 gap-2 p-4">
                        {filteredIcons.map((iconName) => {
                            const IconComponent = (icons as any)[iconName]
                            if (!IconComponent) return null;

                            return (
                                <button
                                    key={iconName}
                                    onClick={() => {
                                        onChange(iconName)
                                        setOpen(false)
                                    }}
                                    className={cn(
                                        "aspect-square rounded-xl hover:bg-primary hover:text-primary-foreground transition-all flex items-center justify-center group relative",
                                        value === iconName ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "bg-muted/10 glass border border-white/5"
                                    )}
                                    title={iconName}
                                >
                                    <IconComponent className="w-5 h-5 transition-transform group-hover:scale-125" />
                                    {value === iconName && (
                                        <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-success rounded-full border-2 border-background animate-bounce" />
                                    )}
                                </button>
                            )
                        })}
                    </div>
                </ScrollArea>
            </PopoverContent>
        </Popover>
    )
}
