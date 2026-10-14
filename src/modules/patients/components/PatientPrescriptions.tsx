import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { prescriptionsApi } from '@/lib/api/endpoints';
import { queryKeys } from '@/lib/api/query-keys';
import { PrescriptionItem } from '@/shared/types';
import { PrescriptionCard } from './PrescriptionCard';

const emptyItem = (): PrescriptionItem => ({
  name: '', dosage: '', frequency: '', duration: '', quantity: '', instructions: '',
});

interface Props {
  patientId: string;
  /** Doctor/admin may write; `doctorId` only needed for admin (the backend scopes a doctor to themselves). */
  canWrite: boolean;
  doctorId?: string;
}

export function PatientPrescriptions({ patientId, canWrite, doctorId }: Props) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<PrescriptionItem[]>([emptyItem()]);
  const [notes, setNotes] = useState('');

  const { data } = useQuery({
    queryKey: queryKeys.prescriptionsByPatient(patientId),
    queryFn: () => prescriptionsApi.list({ patientId, limit: 100 }),
  });
  const list = data?.data ?? [];

  const refresh = () => queryClient.invalidateQueries({ queryKey: queryKeys.prescriptions });

  const create = useMutation({
    mutationFn: () =>
      prescriptionsApi.create({
        patientId,
        doctorId,
        notes: notes.trim() || undefined,
        items: items.filter((i) => i.name.trim()),
      }),
    onSuccess: (rx) => {
      toast.success(`Retsept yaratildi: ${rx.code}`);
      setOpen(false);
      setItems([emptyItem()]);
      setNotes('');
      refresh();
    },
  });

  const cancel = useMutation({
    mutationFn: (id: string) => prescriptionsApi.cancel(id),
    onSuccess: () => {
      toast.success('Retsept bekor qilindi');
      refresh();
    },
  });

  const setItem = (idx: number, patch: Partial<PrescriptionItem>) =>
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));

  const canSubmit = items.some((i) => i.name.trim()) && !create.isPending;

  return (
    <div className="space-y-3">
      {canWrite && (
        <div className="flex justify-end">
          <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setOpen(true)}>
            <Plus className="w-3.5 h-3.5" /> Retsept yozish
          </Button>
        </div>
      )}

      {list.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">Retseptlar yo'q</p>
      ) : (
        list.map((rx) => (
          <PrescriptionCard
            key={rx.id}
            prescription={rx}
            action={
              canWrite && rx.status === 'issued' ? (
                <Button size="sm" variant="outline" onClick={() => cancel.mutate(rx.id)} disabled={cancel.isPending}>
                  Bekor qilish
                </Button>
              ) : undefined
            }
          />
        ))
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Yangi retsept</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {items.map((it, idx) => (
              <div key={idx} className="rounded-lg border p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Dori nomi (masalan: Amoksitsillin 500 mg)"
                    value={it.name}
                    onChange={(e) => setItem(idx, { name: e.target.value })}
                  />
                  {items.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="Dorini olib tashlash"
                      onClick={() => setItems((prev) => prev.filter((_, i) => i !== idx))}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input placeholder="Dozasi (500 mg)" value={it.dosage} onChange={(e) => setItem(idx, { dosage: e.target.value })} />
                  <Input placeholder="Qabul (kuniga 3 mahal)" value={it.frequency} onChange={(e) => setItem(idx, { frequency: e.target.value })} />
                  <Input placeholder="Muddat (7 kun)" value={it.duration} onChange={(e) => setItem(idx, { duration: e.target.value })} />
                  <Input placeholder="Miqdori (21 dona)" value={it.quantity} onChange={(e) => setItem(idx, { quantity: e.target.value })} />
                </div>
                <Input placeholder="Izoh (ovqatdan keyin)" value={it.instructions} onChange={(e) => setItem(idx, { instructions: e.target.value })} />
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => setItems((p) => [...p, emptyItem()])}>
              <Plus className="w-3.5 h-3.5" /> Dori qo'shish
            </Button>
            <div className="space-y-1.5">
              <Label>Umumiy izoh</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => create.mutate()} disabled={!canSubmit}>
              Saqlash
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
