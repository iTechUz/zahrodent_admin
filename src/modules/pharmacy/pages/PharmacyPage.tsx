import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pill, Search } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/shared/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { prescriptionsApi } from '@/lib/api/endpoints';
import { queryKeys } from '@/lib/api/query-keys';
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';
import { PrescriptionCard } from '@/modules/patients/components/PrescriptionCard';

export default function PharmacyPage() {
  const queryClient = useQueryClient();
  const [input, setInput] = useState('');
  const [term, setTerm] = useState('');
  const [dispenseId, setDispenseId] = useState<string | null>(null);

  const { data, isFetching } = useQuery({
    queryKey: queryKeys.pharmacySearch(term),
    queryFn: () => prescriptionsApi.pharmacySearch(term),
    enabled: term.length >= 4,
  });

  const dispense = useMutation({
    mutationFn: (id: string) => prescriptionsApi.dispense(id),
    onSuccess: () => {
      toast.success('Dori berildi deb belgilandi');
      queryClient.invalidateQueries({ queryKey: queryKeys.prescriptions });
    },
  });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setTerm(input.trim());
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Apteka"
        description="Elektron retseptni kod yoki bemor telefon raqami bo'yicha toping"
      />

      <form onSubmit={onSubmit} className="flex gap-2 max-w-xl">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Retsept kodi (K7M2X9QD) yoki +998901234567"
            className="pl-9"
            autoFocus
          />
        </div>
        <Button type="submit" disabled={input.trim().length < 4}>
          Qidirish
        </Button>
      </form>

      {term.length >= 4 && !isFetching && data?.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Pill className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <h3 className="text-lg font-semibold text-foreground">Faol retsept topilmadi</h3>
          <p className="text-sm">Kod noto'g'ri, retsept allaqachon berilgan, bekor qilingan yoki muddati o'tgan.</p>
        </div>
      )}

      <div className="space-y-4">
        {data?.map((rx) => (
          <PrescriptionCard
            key={rx.id}
            prescription={rx}
            showPatient
            action={
              <Button onClick={() => setDispenseId(rx.id)} disabled={dispense.isPending}>
                Dori berildi
              </Button>
            }
          />
        ))}
      </div>

      <ConfirmDeleteDialog
        open={!!dispenseId}
        onOpenChange={(o) => { if (!o) setDispenseId(null); }}
        onConfirm={() => {
          if (dispenseId) dispense.mutate(dispenseId);
          setDispenseId(null);
        }}
        title="Dori berildimi?"
        description="Retsept 'berildi' deb belgilanadi va qayta ishlatib bo'lmaydi."
        confirmLabel="Ha, berildi"
      />
    </div>
  );
}
