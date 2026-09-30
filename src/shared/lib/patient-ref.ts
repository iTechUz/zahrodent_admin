import type { PatientRef } from '@/shared/types';

/** Suffix/badge for rows whose patient was archived (soft-deleted). */
export const DELETED_PATIENT_LABEL = "(o'chirilgan)";

type LookupPatient = { id: string } & PatientRef;

/**
 * The patient of a booking / payment row. The row's embedded `patient` wins: the backend
 * includes it even for archived patients, who are missing from the patients lookup list.
 */
export function resolvePatientRef(
  row: { patientId?: string | null; patient?: PatientRef | null },
  lookup: readonly LookupPatient[] = [],
): PatientRef | undefined {
  if (row.patient) return row.patient;
  return row.patientId ? lookup.find((p) => p.id === row.patientId) : undefined;
}

export function patientRefName(ref: PatientRef | undefined | null): string {
  return `${ref?.firstName ?? ''} ${ref?.lastName ?? ''}`.trim();
}

/** Plain-text label (exports, chips): "Ali Valiyev (o'chirilgan)" / "—". */
export function patientRefLabel(ref: PatientRef | undefined | null, { short = false } = {}): string {
  const name = short ? (ref?.firstName ?? '').trim() : patientRefName(ref);
  if (!name) return short ? '?' : '—';
  return ref?.deletedAt ? `${name} ${DELETED_PATIENT_LABEL}` : name;
}
