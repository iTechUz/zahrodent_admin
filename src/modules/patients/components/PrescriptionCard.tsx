import { ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { Prescription, PrescriptionStatus } from '@/shared/types';
import { formatDate } from '@/shared/lib/formatters';

export const PRESCRIPTION_STATUS_LABELS: Record<PrescriptionStatus, string> = {
  issued: 'Berilmagan',
  dispensed: 'Dori berilgan',
  cancelled: 'Bekor qilingan',
};

interface Props {
  prescription: Prescription;
  showPatient?: boolean;
  action?: ReactNode;
}

export function PrescriptionCard({ prescription: rx, showPatient, action }: Props) {
  return (
    <div className="rounded-xl border bg-card p-4 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="font-mono text-lg font-bold tracking-widest">{rx.code}</div>
          <div className="text-xs text-muted-foreground">
            {formatDate(rx.createdAt)} · {rx.validUntil} gacha amal qiladi
          </div>
          {showPatient && rx.patient && (
            <div className="text-sm mt-1">
              Bemor: <b>{rx.patient.firstName} {rx.patient.lastName}</b>, {rx.patient.age} yosh
            </div>
          )}
          {rx.doctor && (
            <div className="text-sm text-muted-foreground">
              Shifokor: {rx.doctor.firstName} {rx.doctor.lastName} ({rx.doctor.specialty})
            </div>
          )}
        </div>
        <Badge variant="outline">{PRESCRIPTION_STATUS_LABELS[rx.status]}</Badge>
      </div>

      <ul className="divide-y rounded-lg border">
        {rx.items.map((i, idx) => (
          <li key={i.id ?? idx} className="p-3 text-sm">
            <div className="font-medium">{i.name}</div>
            <div className="text-muted-foreground">
              {[i.dosage, i.frequency, i.duration, i.quantity].filter(Boolean).join(' · ')}
            </div>
            {i.instructions && <div className="text-muted-foreground italic">{i.instructions}</div>}
          </li>
        ))}
      </ul>

      {rx.notes && <p className="text-sm text-muted-foreground">{rx.notes}</p>}
      {action && <div className="flex justify-end gap-2">{action}</div>}
    </div>
  );
}
