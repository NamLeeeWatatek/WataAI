"use client"

import * as React from "react"
import { addDays, format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "./Button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/Popover"


interface DatePickerWithRangeProps extends React.HTMLAttributes<HTMLDivElement> {
    date?: DateRange
    setDate?: (date: DateRange | undefined) => void
}

export function DatePickerWithRange({
    className,
    date,
    setDate,
}: DatePickerWithRangeProps) {
    const [open, setOpen] = React.useState(false)
    const [tempDate, setTempDate] = React.useState<DateRange | undefined>(date)

    React.useEffect(() => {
        setTempDate(date)
    }, [date])

    const handleApply = () => {
        if (setDate) {
            setDate(tempDate)
        }
        setOpen(false)
    }

    const handleCancel = () => {
        setTempDate(date)
        setOpen(false)
    }

    const handleClear = () => {
        setTempDate(undefined)
    }

    return (
        <div className={cn("grid gap-2", className)}>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        id="date"
                        variant={"outline"}
                        className={cn(
                            "w-[300px] justify-start text-left font-normal",
                            !date && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date?.from ? (
                            date.to ? (
                                <>
                                    {format(date.from, "LLL dd, y")} -{" "}
                                    {format(date.to, "LLL dd, y")}
                                </>
                            ) : (
                                format(date.from, "LLL dd, y")
                            )
                        ) : (
                            <span>Pick a date</span>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={tempDate?.from}
                        selected={tempDate}
                        onSelect={setTempDate}
                        numberOfMonths={2}
                    />
                    <div className="p-3 border-t border-border flex items-center justify-between bg-muted/20">
                        <Button variant="ghost" size="sm" onClick={handleClear} disabled={!tempDate} className="text-muted-foreground hover:text-foreground">
                            Reset
                        </Button>
                        <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={handleCancel}>
                                Cancel
                            </Button>
                            <Button size="sm" onClick={handleApply} className="bg-primary text-primary-foreground hover:bg-primary/90">
                                Apply
                            </Button>
                        </div>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    )
}
