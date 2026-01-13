"use client"

import * as React from "react"
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react"
import { DayButton, DayPicker, getDefaultClassNames } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "./Button"

import { format } from "date-fns"

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  buttonVariant = "ghost",
  formatters,
  components,
  ...props
}: React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: React.ComponentProps<typeof Button>["variant"]
}) {
  const defaultClassNames = getDefaultClassNames()

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn(
        "bg-background p-3",
        className
      )}
      captionLayout={captionLayout}
      formatters={{
        formatCaption: (date) => format(date, "MMMM yyyy"),
        ...formatters,
      }}
      classNames={{
        root: cn("p-4 relative", defaultClassNames.root),
        months: cn(
          "flex flex-col sm:flex-row gap-8 justify-center items-start",
          defaultClassNames.months
        ),
        month: cn("flex flex-col gap-4", defaultClassNames.month),
        nav: cn(
          "absolute top-4 left-4 right-4 flex items-center justify-between z-20 pointer-events-none",
          defaultClassNames.nav
        ),
        button_previous: cn(
          buttonVariants({ variant: "ghost" }),
          "h-8 w-8 p-0 opacity-50 hover:opacity-100 transition-opacity pointer-events-auto",
          defaultClassNames.button_previous
        ),
        button_next: cn(
          buttonVariants({ variant: "ghost" }),
          "h-8 w-8 p-0 opacity-50 hover:opacity-100 transition-opacity pointer-events-auto",
          defaultClassNames.button_next
        ),
        month_caption: cn(
          "flex h-7 items-center justify-center",
          defaultClassNames.month_caption
        ),
        dropdowns: cn(
          "flex h-7 items-center justify-center gap-1.5 text-sm font-medium",
          defaultClassNames.dropdowns
        ),
        dropdown_root: cn(
          "has-focus:border-ring border-input shadow-xs relative rounded-md border",
          defaultClassNames.dropdown_root
        ),
        dropdown: cn(
          "bg-popover absolute inset-0 opacity-0",
          defaultClassNames.dropdown
        ),
        caption_label: cn(
          "select-none font-bold text-sm tracking-tight",
          defaultClassNames.caption_label
        ),
        table: "w-full border-collapse",
        weekdays: cn("grid grid-cols-7 w-full mb-1", defaultClassNames.weekdays),
        weekday: cn(
          "text-muted-foreground select-none text-[10px] font-bold uppercase tracking-widest text-center flex items-center justify-center h-8",
          defaultClassNames.weekday
        ),
        week: cn("grid grid-cols-7 w-full mt-1", defaultClassNames.week),
        week_number_header: cn(
          "w-8 select-none",
          defaultClassNames.week_number_header
        ),
        week_number: cn(
          "text-muted-foreground select-none text-xs",
          defaultClassNames.week_number
        ),
        day: cn(
          "relative p-0 text-center text-sm flex items-center justify-center h-10 w-10",
          defaultClassNames.day
        ),
        range_start: cn(
          "bg-primary/20 rounded-l-md",
          defaultClassNames.range_start
        ),
        range_middle: cn("bg-primary/10 rounded-none", defaultClassNames.range_middle),
        range_end: cn("bg-primary/20 rounded-r-md", defaultClassNames.range_end),
        today: cn(
          "bg-muted/50 font-bold",
          defaultClassNames.today
        ),
        outside: cn(
          "text-muted-foreground/30 opacity-50",
          defaultClassNames.outside
        ),
        disabled: cn(
          "text-muted-foreground/20 opacity-20 cursor-not-allowed",
          defaultClassNames.disabled
        ),
        hidden: cn("invisible", defaultClassNames.hidden),
        ...classNames,
      }}
      components={{
        Root: ({ className, rootRef, ...props }) => {
          return (
            <div
              data-slot="calendar"
              ref={rootRef}
              className={cn(className)}
              {...props}
            />
          )
        },
        Chevron: ({ className, orientation, ...props }) => {
          if (orientation === "left") {
            return (
              <ChevronLeftIcon className={cn("size-4", className)} {...props} />
            )
          }

          if (orientation === "right") {
            return (
              <ChevronRightIcon
                className={cn("size-4", className)}
                {...props}
              />
            )
          }

          return (
            <ChevronDownIcon className={cn("size-4", className)} {...props} />
          )
        },
        DayButton: CalendarDayButton,
        WeekNumber: ({ children, ...props }) => {
          return (
            <td {...props}>
              <div className="flex size-8 items-center justify-center text-center text-xs">
                {children}
              </div>
            </td>
          )
        },
        ...components,
      }}
      {...props}
    />
  )
}

function CalendarDayButton({
  className,
  day,
  modifiers,
  ...props
}: React.ComponentProps<typeof DayButton>) {
  const defaultClassNames = getDefaultClassNames()

  const ref = React.useRef<HTMLButtonElement>(null)
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus()
  }, [modifiers.focused])

  return (
    <Button
      ref={ref}
      variant="ghost"
      data-day={day.date.toLocaleDateString()}
      data-selected-single={
        modifiers.selected &&
        !modifiers.range_start &&
        !modifiers.range_end &&
        !modifiers.range_middle
      }
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      className={cn(
        "h-9 w-10 flex items-center justify-center font-medium transition-all duration-150 p-0 text-xs",
        "data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground data-[selected-single=true]:rounded-md",
        "data-[range-middle=true]:bg-primary/10 data-[range-middle=true]:text-foreground data-[range-middle=true]:rounded-none",
        "data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground data-[range-start=true]:rounded-l-md",
        "data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground data-[range-end=true]:rounded-r-md",
        "hover:bg-primary/15 hover:text-primary",
        defaultClassNames.day,
        className
      )}
      {...props}
    />
  )
}

export { Calendar, CalendarDayButton }

