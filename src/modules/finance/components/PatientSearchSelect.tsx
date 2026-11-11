import { useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { patientsApi } from '@/lib/api/endpoints';
import { queryKeys } from '@/lib/api/query-keys';
import { normalizeSearch } from '@/shared/lib/formatters';
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue';
import { cn } from '@/shared/lib/utils';

export const PATIENT_SEARCH_LIMIT = 20;
export const PATIENT_SEARCH_DEBOUNCE_MS = 300;

interface Props {
  value?: string | null;
  /** label of the already selected patient (edit mode: the row's embedded patient) */
  selectedLabel?: string;
  onChange: (id: string, label: string) => void;
  placeholder?: string;
}

/** Server-side searchable patient picker — never downloads the whole patient table. */
export function PatientSearchSelect({ value, selectedLabel, onChange, placeholder = 'Bemorni tanlang' }: Props) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [pickedLabel, setPickedLabel] = useState('');
  const term = useDebouncedValue(normalizeSearch(input), PATIENT_SEARCH_DEBOUNCE_MS);

  const params = { search: term, limit: PATIENT_SEARCH_LIMIT };
  const { data, isFetching } = useQuery({
    queryKey: queryKeys.patientsList(params),
    queryFn: () => patientsApi.list(params),
    enabled: open,
    placeholderData: keepPreviousData,
  });
  const patients = data?.data ?? [];
  const typing = input.trim() !== term;
  const loading = isFetching || typing;
  const label = value ? pickedLabel || selectedLabel || 'Tanlangan bemor' : '';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between font-normal">
          <span className="truncate">{label || placeholder}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command shouldFilter={false}>
          <CommandInput placeholder="Ism yoki telefon bo'yicha qidirish..." value={input} onValueChange={setInput} />
          <CommandList>
            {loading && (
              <div className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Qidirilmoqda...
              </div>
            )}
            {!loading && patients.length === 0 && <CommandEmpty>Bemor topilmadi.</CommandEmpty>}
            <CommandGroup>
              {patients.map((p) => {
                const text = `${p.firstName} ${p.lastName} (${p.phone})`;
                return (
                  <CommandItem
                    key={p.id}
                    value={p.id}
                    onSelect={() => {
                      setPickedLabel(text);
                      onChange(p.id, text);
                      setOpen(false);
                    }}
                  >
                    <Check className={cn('mr-2 h-4 w-4', value === p.id ? 'opacity-100' : 'opacity-0')} />
                    {text}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
