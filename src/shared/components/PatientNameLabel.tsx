import type { PatientRef } from '@/shared/types';
import { cn } from '@/shared/lib/utils';
import { DELETED_PATIENT_LABEL, patientRefName } from '@/shared/lib/patient-ref';

/** Patient name with an "(o'chirilgan)" badge when the patient is archived. */
export function PatientNameLabel({ patient, className }: { patient: PatientRef | undefined | null; className?: string }) {
  const name = patientRefName(patient);
  return (
    <span className={cn('inline-flex items-center gap-1.5', className)}>
      <span className={cn(patient?.deletedAt && 'text-muted-foreground')}>{name || '—'}</span>
      {patient?.deletedAt && (
        <span
          className="text-[10px] font-normal px-1.5 py-0 rounded-full border border-border bg-muted text-muted-foreground whitespace-nowrap"
          title="Bemor arxivlangan"
        >
          {DELETED_PATIENT_LABEL}
        </span>
      )}
    </span>
  );
}
