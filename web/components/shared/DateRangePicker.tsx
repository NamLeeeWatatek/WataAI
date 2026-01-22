"use client"

import * as React from "react"
import { addDays, format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { DateRange } from "react-day-picker"
import { useTranslation } from "react-i18next"
import { useDateLocale } from "@/lib/hooks/use-date-locale"

import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/Popover"
import { Button } from "../ui/Button"
import { Calendar } from "../ui/Calendar"

interface DateRangePickerProps extends React.HTMLAttributes<HTMLDivElement> {
    date?: DateRange
    setDate?: (date: DateRange | undefined) => void
}

export function DateRangePicker({
    className,
    date,
    setDate,
}: DateRangePickerProps) {
    const { t } = useTranslation()
    const locale = useDateLocale()

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
                            "w-auto min-w-[220px] justify-start text-left font-normal",
                            !date && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date?.from ? (
                            date.to ? (
                                <>
                                    {format(date.from, "P", { locale })} -{" "}
                                    {format(date.to, "P", { locale })}
                                </>
                            ) : (
                                format(date.from, "P", { locale })
                            )
                        ) : (
                            <span>{t('common.pickDate')}</span>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full sm:w-auto min-w-[320px] sm:min-width-[600px] p-0 border-border/50 shadow-2xl overflow-hidden" align="end">
                    <Calendar
                        mode="range"
                        defaultMonth={tempDate?.from}
                        selected={tempDate}
                        onSelect={setTempDate}
                        numberOfMonths={2}
                    />
                    <div className="p-3 border-t border-border flex items-center justify-between bg-muted/20">
                        <Button variant="ghost" size="sm" onClick={handleClear} disabled={!tempDate} className="text-muted-foreground hover:text-foreground">
                            {t('common.reset')}
                        </Button>
                        <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={handleCancel}>
                                {t('common.cancel')}
                            </Button>
                            <Button size="sm" onClick={handleApply} className="bg-primary text-primary-foreground hover:bg-primary/90">
                                {t('common.apply')}
                            </Button>
                        </div>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    )
}
