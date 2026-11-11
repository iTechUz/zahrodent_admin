import { CalendarDays } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { addDaysToDate, clinicMonthStart, clinicToday } from '@/shared/lib/date-utils';

export type DatePreset = 'all' | 'today' | 'week' | 'month' | 'lastMonth' | 'year' | 'custom';

const LABELS: Record<DatePreset, string> = {
  all: 'Barcha vaqt',
  today: 'Bugun',
  week: 'Oxirgi 7 kun',
  month: 'Shu oy',
  lastMonth: "O'tgan oy",
  year: 'Shu yil',
  custom: 'Sanani tanlash',
};

const PRESETS = Object.keys(LABELS) as DatePreset[];

export interface DateRange {
  startDate?: string;
  endDate?: string;
}

/** Human label of the period a range stands for ("Shu oy", "O'tgan oy", "Tanlangan davr"). */
export function presetLabel(range: DateRange, now: Date = new Date()): string {
  const p = detectPreset(range, now);
  return p === 'custom' ? 'Tanlangan davr' : LABELS[p];
}

/** Start/end (YYYY-MM-DD, clinic time zone) of a preset; `custom` keeps whatever is passed in. */
export function presetRange(preset: DatePreset, now: Date = new Date()): DateRange {
  const today = clinicToday(now);
  switch (preset) {
    case 'today':
      return { startDate: today, endDate: today };
    case 'week':
      return { startDate: addDaysToDate(today, -6), endDate: today };
    case 'month':
      return { startDate: clinicMonthStart(now), endDate: today };
    case 'lastMonth': {
      const thisStart = clinicMonthStart(now);
      const lastStart = `${addDaysToDate(thisStart, -1).slice(0, 7)}-01`;
      return { startDate: lastStart, endDate: addDaysToDate(thisStart, -1) };
    }
    case 'year':
      return { startDate: `${today.slice(0, 4)}-01-01`, endDate: today };
    default:
      return { startDate: undefined, endDate: undefined };
  }
}

/** Which preset the current range corresponds to (anything unrecognised is `custom`). */
export function detectPreset({ startDate, endDate }: DateRange, now: Date = new Date()): DatePreset {
  if (!startDate && !endDate) return 'all';
  for (const p of PRESETS) {
    if (p === 'all' || p === 'custom') continue;
    const r = presetRange(p, now);
    if ((r.startDate ?? '') === (startDate ?? '') && (r.endDate ?? '') === (endDate ?? '')) return p;
  }
  return 'custom';
}

interface Props extends DateRange {
  onChange: (range: DateRange) => void;
}

/** "This month / all time / custom" period picker — preset select plus two date inputs. */
export function DateRangeFilter({ startDate, endDate, onChange }: Props) {
  const detected = detectPreset({ startDate, endDate });
  const preset = detected;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        value={preset}
        onValueChange={(v) => {
          const p = v as DatePreset;
          // "custom" keeps the current dates so the inputs stay editable
          onChange(p === 'custom' ? { startDate: startDate ?? clinicToday(), endDate } : presetRange(p));
        }}
      >
        <SelectTrigger className="w-[170px] h-10" aria-label="Davr">
          <CalendarDays className="w-4 h-4 mr-2" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PRESETS.map((p) => (
            <SelectItem key={p} value={p}>
              {LABELS[p]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="flex items-center gap-2 bg-muted/30 p-1 rounded-lg border">
        <Input
          type="date"
          aria-label="Boshlanish sanasi"
          className="w-[140px] h-8 text-xs border-none bg-transparent"
          value={startDate || ''}
          max={endDate || undefined}
          onChange={(e) => onChange({ startDate: e.target.value || undefined, endDate })}
        />
        <span className="text-muted-foreground text-xs">—</span>
        <Input
          type="date"
          aria-label="Tugash sanasi"
          className="w-[140px] h-8 text-xs border-none bg-transparent"
          value={endDate || ''}
          min={startDate || undefined}
          onChange={(e) => onChange({ startDate, endDate: e.target.value || undefined })}
        />
      </div>
    </div>
  );
}
