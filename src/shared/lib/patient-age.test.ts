import { patientAge, patientBirthYear } from './patient-age';

const now = new Date('2026-11-08T00:00:00Z');

describe('patient age helpers', () => {
  it('prefers birthYear', () => {
    expect(patientAge({ age: 99, birthYear: 1995 }, now)).toBe(31);
    expect(patientBirthYear({ age: 99, birthYear: 1995 }, now)).toBe(1995);
  });
  it('falls back to age', () => {
    expect(patientAge({ age: 30 }, now)).toBe(30);
    expect(patientAge({ age: 30, birthYear: null }, now)).toBe(30);
    expect(patientBirthYear({ age: 30 }, now)).toBe(1996);
  });
  it('handles a missing patient', () => {
    expect(patientAge(undefined)).toBeUndefined();
    expect(patientBirthYear(null)).toBeUndefined();
  });
});
