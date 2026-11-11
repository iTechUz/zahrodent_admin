import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { PhoneInput } from '@/components/ui/phone-input';
import { Button } from '@/components/ui/button';
import { patientsApi } from '@/lib/api/endpoints';
import { queryKeys } from '@/lib/api/query-keys';
import { PatientDialogSchema } from '@/shared/lib/validation';
import type { Patient } from '@/shared/types';

const empty = { fullName: '', phone: '', birthYear: '', workplace: '' };

/**
 * Inline "Yangi bemor" form inside the booking dialog, so a walk-in does not force leaving it.
 * Same schema and API as the patients page quick-create (name + phone + birth year + workplace).
 */
export function QuickPatientCreate({ onCreated, onCancel }: { onCreated: (patient: Patient) => void; onCancel: () => void }) {
  const queryClient = useQueryClient();
  const [values, setValues] = useState(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createMut = useMutation({
    mutationFn: patientsApi.create,
    onSuccess: (patient) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.patients });
      queryClient.invalidateQueries({ queryKey: queryKeys.analytics });
      toast.success("Yangi bemor qo'shildi");
      onCreated(patient);
    },
  });

  const submit = () => {
    if (createMut.isPending) return;
    const parsed = PatientDialogSchema.safeParse({ ...values, source: 'walk-in' });
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? '');
        if (key && !next[key]) next[key] = issue.message;
      }
      setErrors(next);
      return;
    }
    setErrors({});
    const { fullName, birthYear, address, workplace, phone, source } = parsed.data;
    const [firstName, ...rest] = fullName.split(/\s+/);
    createMut.mutate({
      firstName,
      lastName: rest.join(' '),
      phone,
      source,
      workplace,
      address: address ?? '',
      notes: '',
      age: new Date().getFullYear() - birthYear,
      birthYear,
    });
  };

  const err = (k: string) => (errors[k] ? <p role="alert" className="text-xs text-destructive">{errors[k]}</p> : null);

  return (
    <div className="rounded-lg border border-dashed border-border p-3 space-y-2 bg-muted/20" aria-label="Yangi bemor">
      <p className="text-xs font-medium text-muted-foreground">Yangi bemor</p>
      <div>
        <Input
          placeholder="Ism familya"
          aria-label="Ism familya"
          value={values.fullName}
          onChange={(e) => setValues({ ...values, fullName: e.target.value })}
        />
        {err('fullName')}
      </div>
      <div>
        <PhoneInput aria-label="Telefon" value={values.phone} onChange={(phone) => setValues({ ...values, phone })} />
        {err('phone')}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Input
            type="number"
            placeholder="Tug'ilgan yili"
            aria-label="Tug'ilgan yili"
            value={values.birthYear}
            onChange={(e) => setValues({ ...values, birthYear: e.target.value })}
          />
          {err('birthYear')}
        </div>
        <div>
          <Input
            placeholder="Ish joyi"
            aria-label="Ish joyi"
            value={values.workplace}
            onChange={(e) => setValues({ ...values, workplace: e.target.value })}
          />
          {err('workplace')}
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Bekor qilish
        </Button>
        <Button type="button" size="sm" onClick={submit} disabled={createMut.isPending}>
          Bemorni qo'shish
        </Button>
      </div>
    </div>
  );
}
