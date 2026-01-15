import * as React from "react"
import { Check, PlusCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/Popover"
import { Separator } from "@/components/ui/Separator"
import { Checkbox } from "@/components/ui/Checkbox"
import { ScrollArea } from "@/components/ui/ScrollArea"

interface DataTableFacetedFilterProps<TValue> {
    title?: string
    options: {
        label: string
        value: TValue
        icon?: React.ComponentType<{ className?: string }>
    }[]
    selectedValues?: Set<TValue>
    onSelect?: (values: Set<TValue>) => void
}

export function DataTableFacetedFilter<TValue extends string | number>({
    title,
    options,
    selectedValues,
    onSelect,
}: DataTableFacetedFilterProps<TValue>) {
    const selected = selectedValues || new Set()

    const handleSelect = (value: TValue) => {
        const newSelected = new Set(selected)
        if (newSelected.has(value)) {
            newSelected.delete(value)
        } else {
            newSelected.add(value)
        }
        onSelect?.(newSelected)
    }

    const handleClear = () => {
        onSelect?.(new Set())
    }

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 border-dashed">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    {title}
                    {selected.size > 0 && (
                        <>
                            <Separator orientation="vertical" className="mx-2 h-4" />
                            <Badge
                                variant="secondary"
                                className="rounded-sm px-1 font-normal lg:hidden"
                            >
                                {selected.size}
                            </Badge>
                            <div className="hidden space-x-1 lg:flex">
                                {selected.size > 2 ? (
                                    <Badge
                                        variant="secondary"
                                        className="rounded-sm px-1 font-normal"
                                    >
                                        {selected.size} selected
                                    </Badge>
                                ) : (
                                    options
                                        .filter((option) => selected.has(option.value))
                                        .map((option) => (
                                            <Badge
                                                variant="secondary"
                                                key={option.value}
                                                className="rounded-sm px-1 font-normal"
                                            >
                                                {option.label}
                                            </Badge>
                                        ))
                                )}
                            </div>
                        </>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0" align="start">
                <div className="p-1">
                    <ScrollArea className="h-full max-h-[300px]">
                        <div className="flex flex-col gap-1">
                            {options.map((option) => {
                                const isSelected = selected.has(option.value)
                                return (
                                    <div
                                        key={option.value}
                                        className={cn(
                                            "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                                        )}
                                        onClick={() => handleSelect(option.value)}
                                    >
                                        <div
                                            className={cn(
                                                "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                                isSelected
                                                    ? "bg-primary text-primary-foreground"
                                                    : "opacity-50 [&_svg]:invisible"
                                            )}
                                        >
                                            <Check className={cn("h-4 w-4")} />
                                        </div>
                                        {option.icon && (
                                            <option.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                                        )}
                                        <span>{option.label}</span>
                                    </div>
                                )
                            })}
                        </div>
                    </ScrollArea>
                </div>
                {selected.size > 0 && (
                    <>
                        <Separator />
                        <div className="p-1">
                            <div
                                className="flex w-full cursor-pointer items-center justify-center rounded-sm px-2 py-1.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
                                onClick={handleClear}
                            >
                                Clear filters
                            </div>
                        </div>
                    </>
                )}
            </PopoverContent>
        </Popover>
    )
}
