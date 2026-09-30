import { render, screen } from '@testing-library/react';
import { createElement } from 'react';
import { PatientNameLabel } from '@/shared/components/PatientNameLabel';
import { DELETED_PATIENT_LABEL, patientRefLabel, patientRefName, resolvePatientRef } from './patient-ref';

const lookup = [{ id: 'p1', firstName: 'Ali', lastName: 'Valiyev' }];

describe('resolvePatientRef', () => {
  it('prefers the embedded row patient (present for archived patients)', () => {
    const row = { patientId: 'p9', patient: { firstName: 'Olim', lastName: 'Karimov', deletedAt: '2026-09-01' } };
    expect(resolvePatientRef(row, lookup)).toEqual(row.patient);
  });
  it('falls back to the lookup list', () => {
    expect(resolvePatientRef({ patientId: 'p1' }, lookup)).toBe(lookup[0]);
  });
  it('is undefined for an unknown patient', () => {
    expect(resolvePatientRef({ patientId: 'x' }, lookup)).toBeUndefined();
  });
});

describe('patientRefLabel', () => {
  it('adds the archived suffix', () => {
    expect(patientRefLabel({ firstName: 'Ali', lastName: 'V', deletedAt: '2026-09-01' })).toBe(`Ali V ${DELETED_PATIENT_LABEL}`);
    expect(patientRefLabel({ firstName: 'Ali', lastName: 'V', deletedAt: '2026-09-01' }, { short: true })).toBe(
      "Ali (o'chirilgan)",
    );
  });
  it('dash / question mark when unknown', () => {
    expect(patientRefLabel(undefined)).toBe('—');
    expect(patientRefLabel(undefined, { short: true })).toBe('?');
    expect(patientRefName(null)).toBe('');
  });
});

describe('PatientNameLabel', () => {
  it("shows an (o'chirilgan) badge for archived patients only", () => {
    const { rerender } = render(
      createElement(PatientNameLabel, { patient: { firstName: 'Ali', lastName: 'V', deletedAt: '2026-09-01' } }),
    );
    expect(screen.getByText('Ali V')).toBeInTheDocument();
    expect(screen.getByTitle('Bemor arxivlangan')).toHaveTextContent("(o'chirilgan)");
    rerender(createElement(PatientNameLabel, { patient: { firstName: 'Ali', lastName: 'V', deletedAt: null } }));
    expect(screen.queryByTitle('Bemor arxivlangan')).toBeNull();
  });
});
