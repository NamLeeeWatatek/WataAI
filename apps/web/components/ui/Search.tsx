import * as React from "react"
import { SearchIcon, XIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "./Input"
import { Button } from "./Button"

export interface SearchProps extends React.ComponentProps<typeof Input> {
    onClear?: () => void
    showClear?: boolean
    inputClassName?: string
}

const Search = React.forwardRef<HTMLInputElement, SearchProps>(
    ({ className, value, onChange, onClear, showClear = true, inputClassName, ...props }, ref) => {
        const handleClear = (e: React.MouseEvent) => {
            e.preventDefault()
            e.stopPropagation()
            if (onClear) {
                onClear()
            }
        }

        return (
            <div className={cn("relative flex w-full items-center", className)} data-slot="search-root">
                <SearchIcon
                    className="text-muted-foreground absolute left-3 size-4 pointer-events-none top-1/2 -translate-y-1/2"
                    data-slot="search-icon"
                />
                <Input
                    ref={ref}
                    value={value}
                    onChange={onChange}
                    className={cn(
                        "pl-9",
                        showClear && value && "pr-9",
                        inputClassName
                    )}
                    data-slot="search-input"
                    {...props}
                />
                {showClear && value && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-foreground absolute right-1 size-7 rounded-sm top-1/2 -translate-y-1/2"
                        onClick={handleClear}
                        data-slot="search-clear"
                    >
                        <XIcon className="size-3" />
                        <span className="sr-only">Clear search</span>
                    </Button>
                )}
            </div>
        )
    }
)
Search.displayName = "Search"

export { Search }
