import * as React from "react";
import { Clock } from "lucide-react";

import { cn } from "@/shared/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export interface TimePickerProps {
  /** `HH:mm` (24h) or empty string. */
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  /** Minute step of the list (default 5). A value off the step is still shown and selectable. */
  minuteStep?: number;
  className?: string;
  id?: string;
}

const pad = (n: number) => String(n).padStart(2, "0");
const HOURS = Array.from({ length: 24 }, (_, i) => pad(i));

/** 24-hour time picker with a uniform `HH:mm` display; value is an `HH:mm` string. */
const TimePicker = React.forwardRef<HTMLButtonElement, TimePickerProps>(
  ({ value, onChange, placeholder = "Vaqtni tanlang", disabled, minuteStep = 5, className, id }, ref) => {
    const [open, setOpen] = React.useState(false);
    const match = /^(\d{2}):(\d{2})/.exec(value ?? "");
    const hour = match?.[1];
    const minute = match?.[2];

    const minutes = React.useMemo(() => {
      const list = Array.from({ length: Math.ceil(60 / minuteStep) }, (_, i) => pad(i * minuteStep)).filter((m) => Number(m) < 60);
      if (minute && !list.includes(minute)) list.push(minute);
      return list.sort();
    }, [minuteStep, minute]);

    const pick = (h: string, m: string) => onChange(`${h}:${m}`);
    const colRef = (active: boolean) => (el: HTMLButtonElement | null) => {
      if (active && el) el.scrollIntoView({ block: "center" });
    };

    const column = (items: string[], current: string | undefined, onPick: (v: string) => void, label: string) => (
      <div className="flex max-h-56 w-14 flex-col gap-0.5 overflow-y-auto p-1" role="listbox" aria-label={label}>
        {items.map((v) => (
          <button
            key={v}
            ref={colRef(v === current)}
            type="button"
            role="option"
            aria-selected={v === current}
            onClick={() => onPick(v)}
            className={cn(
              "rounded-md px-2 py-1.5 text-sm hover:bg-accent",
              v === current && "bg-primary text-primary-foreground hover:bg-primary",
            )}
          >
            {v}
          </button>
        ))}
      </div>
    );

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={ref}
            id={id}
            type="button"
            variant="outline"
            disabled={disabled}
            className={cn("h-10 w-full justify-start px-3 text-left font-normal", !match && "text-muted-foreground", className)}
          >
            <Clock className="mr-2 h-4 w-4 shrink-0 opacity-60" />
            <span className="truncate">{match ? `${hour}:${minute}` : placeholder}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="flex w-auto divide-x p-0" align="start">
          {column(HOURS, hour, (h) => pick(h, minute ?? "00"), "Soat")}
          {column(minutes, minute, (m) => { pick(hour ?? "09", m); setOpen(false); }, "Daqiqa")}
        </PopoverContent>
      </Popover>
    );
  },
);
TimePicker.displayName = "TimePicker";

export { TimePicker };
