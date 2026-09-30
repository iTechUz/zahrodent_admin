import { findUnknownPlaceholders, insertAt, previewValues, renderTemplate, toReminderDate, type TemplateValues } from './template';

const values: TemplateValues = {
  '{name}': 'Ali',
  '{date}': '01.10.2026',
  '{time}': '10:30',
  '{doctor}': 'Dr. Kamila',
  '{clinic}': 'Zahro',
};

describe('renderTemplate', () => {
  it('replaces every known placeholder, including repeats', () => {
    expect(renderTemplate('{name}, {date} {time} — {doctor}, {clinic}. {name}!', values)).toBe(
      'Ali, 01.10.2026 10:30 — Dr. Kamila, Zahro. Ali!',
    );
  });

  it('leaves unknown placeholders untouched', () => {
    expect(renderTemplate('Salom {ism}', values)).toBe('Salom {ism}');
  });
});

describe('findUnknownPlaceholders', () => {
  it('lists typos once and ignores known ones', () => {
    expect(findUnknownPlaceholders('{name} {ism} {ism} {} {clinic}')).toEqual(['{ism}', '{}']);
  });
  it('is empty for a valid template', () => {
    expect(findUnknownPlaceholders('Hurmatli {name}')).toEqual([]);
  });
});

describe('insertAt', () => {
  it('inserts at the caret / replaces the selection', () => {
    expect(insertAt('Salom !', '{name}', 6, 6)).toEqual({ value: 'Salom {name}!', caret: 12 });
    expect(insertAt('Salom XX', '{name}', 6, 8)).toEqual({ value: 'Salom {name}', caret: 12 });
  });
  it('appends without a selection', () => {
    expect(insertAt('Salom ', '{name}')).toEqual({ value: 'Salom {name}', caret: 12 });
  });
});

describe('previewValues', () => {
  it('uses the backend date format DD.MM.YYYY, shifted by reminderDaysAhead', () => {
    expect(toReminderDate('2026-10-01')).toBe('01.10.2026');
    expect(previewValues('Zahro', 2, '2026-09-30')['{date}']).toBe('02.10.2026');
    expect(previewValues('', 0, '2026-09-30')['{clinic}']).toBe('Zahro Dental');
  });
});
