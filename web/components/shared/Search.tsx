import * as React from "react"
import { Search as LucideSearch, X as LucideX, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"

export interface SearchProps extends React.ComponentProps<typeof Input> {
    onClear?: () => void
    showClear?: boolean
    inputClassName?: string
    loading?: boolean
}

const Search = React.forwardRef<HTMLInputElement, SearchProps>(
    ({ className, value, onChange, onClear, showClear = true, inputClassName, loading, ...props }, ref) => {
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
                    variant="default"
                    className={cn(
                        "pl-8 pr-10 bg-white/5 dark:bg-black/20 border-white/10 dark:border-white/5 focus-visible:ring-primary/20",
                        inputClassName
                    )}
                    value={value || ""}
                    onChange={onChange}
                    {...props}
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10 size-4 flex items-center justify-center pointer-events-none">
                    {loading ? (
                        <Loader2 className="text-primary animate-spin size-3.5" />
                    ) : (
                        <LucideSearch className="text-muted-foreground size-4" />
                    )}
                </div>
                {showClear && value && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-foreground absolute right-1 size-7 rounded-sm top-1/2 -translate-y-1/2"
                        onClick={handleClear}
                        data-slot="search-clear"
                    >
                        <LucideX className="size-3" />
                        <span className="sr-only">Clear search</span>
                    </Button>
                )}
            </div>
        )
    }
)
Search.displayName = "Search"

export { Search }
