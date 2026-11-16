import * as React from "react";
import { CalendarIcon, X } from "lucide-react";
import { format, parse, isValid } from "date-fns";
import { uz } from "date-fns/locale";

import { cn } from "@/shared/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const YMD = "yyyy-MM-dd";

export interface DatePickerProps {
  /** `YYYY-MM-DD` or empty string. */
  value?: string;
  /** Called with `YYYY-MM-DD`, or `''` when cleared. */
  onChange: (value: string) => void;
  placeholder?: string;
  /** `YYYY-MM-DD` — earlier days are disabled. */
  min?: string;
  /** `YYYY-MM-DD` — later days are disabled. */
  max?: string;
  disabled?: boolean;
  /** Show a clear button (for optional filters). */
  clearable?: boolean;
  className?: string;
  id?: string;
  "aria-label"?: string;
}

function toDate(ymd?: string): Date | undefined {
  if (!ymd) return undefined;
  const d = parse(ymd, YMD, new Date());
  return isValid(d) ? d : undefined;
}

/** Date picker with a uniform `dd.MM.yyyy` display; value stays a `YYYY-MM-DD` string. */
const DatePicker = React.forwardRef<HTMLButtonElement, DatePickerProps>(
  ({ value, onChange, placeholder = "Sanani tanlang", min, max, disabled, clearable, className, id, "aria-label": ariaLabel }, ref) => {
    const [open, setOpen] = React.useState(false);
    const selected = toDate(value);
    const minDate = toDate(min);
    const maxDate = toDate(max);

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <div className="relative w-full">
          <PopoverTrigger asChild>
            <Button
              ref={ref}
              id={id}
              aria-label={ariaLabel}
              type="button"
              variant="outline"
              disabled={disabled}
              className={cn(
                "h-10 w-full justify-start px-3 text-left font-normal",
                !selected && "text-muted-foreground",
                clearable && selected && "pr-8",
                className,
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4 shrink-0 opacity-60" />
              <span className="truncate">{selected ? format(selected, "dd.MM.yyyy") : placeholder}</span>
            </Button>
          </PopoverTrigger>
          {clearable && selected && !disabled && (
            <button
              type="button"
              aria-label="Tozalash"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground"
              onClick={() => onChange("")}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            locale={uz}
            weekStartsOn={1}
            selected={selected}
            defaultMonth={selected ?? maxDate ?? minDate}
            disabled={[...(minDate ? [{ before: minDate }] : []), ...(maxDate ? [{ after: maxDate }] : [])]}
            onSelect={(d) => {
              if (d) {
                onChange(format(d, YMD));
                setOpen(false);
              }
            }}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    );
  },
);
DatePicker.displayName = "DatePicker";

export { DatePicker };
