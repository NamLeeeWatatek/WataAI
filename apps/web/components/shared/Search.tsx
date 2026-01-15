import * as React from "react"
import { SearchIcon, XIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"

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
                <Input
                    ref={ref}
                    className={cn(
                        "pl-8",
                        inputClassName
                    )}
                    value={value}
                    onChange={onChange}
                    {...props}
                />
                <SearchIcon
                    className="text-muted-foreground absolute left-3 size-4 pointer-events-none top-1/2 -translate-y-1/2 z-10"
                    data-slot="search-icon"
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
