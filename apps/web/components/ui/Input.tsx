import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const inputVariants = cva(
  "border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
  {
    variants: {
      variant: {
        default: "border-border/50 shadow-sm",
        ghost: "bg-transparent border-none shadow-none focus-visible:bg-muted/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input"> & VariantProps<typeof inputVariants>>(
  ({ className, variant, type, ...props }, ref) => {
    return (
      <input
        data-slot="input"
        type={type}
        className={cn(inputVariants({ variant, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }

