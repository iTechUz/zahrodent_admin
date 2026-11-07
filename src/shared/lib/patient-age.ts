import type { Patient } from '@/shared/types';

type AgeFields = Pick<Patient, 'age'> & { birthYear?: number | null };

/** Birth year to show/edit: the stored `birthYear` when the backend has it, else derived from `age`. */
export function patientBirthYear(p: AgeFields | null | undefined, now: Date = new Date()): number | undefined {
  if (!p) return undefined;
  if (typeof p.birthYear === 'number') return p.birthYear;
  return typeof p.age === 'number' ? now.getFullYear() - p.age : undefined;
}

/** Age to display: derived from `birthYear` when present (never drifts), else the backend's `age`. */
export function patientAge(p: AgeFields | null | undefined, now: Date = new Date()): number | undefined {
  if (!p) return undefined;
  if (typeof p.birthYear === 'number') return now.getFullYear() - p.birthYear;
  return typeof p.age === 'number' ? p.age : undefined;
}
