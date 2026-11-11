import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { patientsApi } from '@/lib/api/endpoints';
import { queryKeys } from '@/lib/api/query-keys';
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue';
import { normalizeSearch } from '@/shared/lib/formatters';
import { patientRefLabel } from '@/shared/lib/patient-ref';
import { cn } from '@/shared/lib/utils';
import type { PatientRef } from '@/shared/types';

export const PATIENT_SELECT_LIMIT = 20;
export const PATIENT_SELECT_DEBOUNCE_MS = 250;

type SelectedPatient = { id: string; phone?: string } & PatientRef;

const labelOf = (p: SelectedPatient) => `${patientRefLabel(p)}${p.phone ? ` (${p.phone})` : ''}`;

interface PatientSelectProps {
  value?: string;
  onValueChange: (id: string) => void;
  /** Known record of the current value (e.g. `booking.patient` when editing) — avoids an extra request. */
  selected?: SelectedPatient | null;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * Server-side searchable patient picker: nothing is loaded until the list is opened, then
 * `GET /patients?search=&limit=20` (debounced) — instead of downloading the whole patient table.
 */
export function PatientSelect({
  value,
  onValueChange,
  selected,
  placeholder = 'Bemorni tanlang',
  disabled,
  className,
}: PatientSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const term = useDebouncedValue(normalizeSearch(query), PATIENT_SELECT_DEBOUNCE_MS);

  const params = { search: term, limit: PATIENT_SELECT_LIMIT };
  const { data, isFetching } = useQuery({
    queryKey: queryKeys.patientsList(params),
    queryFn: () => patientsApi.list(params),
    enabled: open,
    placeholderData: keepPreviousData,
  });
  const options = data?.data ?? [];

  const known = value ? (options.find((p) => p.id === value) ?? (selected?.id === value ? selected : null)) : null;
  // the chosen patient is not in the (filtered) results and the caller does not know it → fetch just that one
  const { data: fetched } = useQuery({
    queryKey: queryKeys.patient(value ?? ''),
    queryFn: () => patientsApi.get(value!),
    enabled: !!value && !known,
  });
  const current = known ?? fetched ?? null;

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) setQuery('');
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn('w-full justify-between font-normal', !value && 'text-muted-foreground', className)}
        >
          <span className="truncate">{value ? (current ? labelOf(current) : '...') : placeholder}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command shouldFilter={false}>
          <CommandInput placeholder="Ism yoki telefon..." value={query} onValueChange={setQuery} />
          <CommandList>
            <CommandEmpty>{isFetching ? 'Qidirilmoqda...' : 'Bemor topilmadi.'}</CommandEmpty>
            <CommandGroup>
              {options.map((p) => (
                <CommandItem
                  key={p.id}
                  value={p.id}
                  onSelect={() => {
                    onValueChange(p.id === value ? '' : p.id);
                    setOpen(false);
                  }}
                >
                  <Check className={cn('mr-2 h-4 w-4', value === p.id ? 'opacity-100' : 'opacity-0')} />
                  {labelOf(p)}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
