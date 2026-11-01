import { describe, expect, it } from 'vitest';
import { guideUrlFor } from './guide';

describe('guideUrlFor', () => {
  it('opens the section of the current page', () => {
    expect(guideUrlFor('/bookings')).toMatch(/\/qollanma\/#bron$/);
    expect(guideUrlFor('/patients')).toMatch(/#bemorlar$/);
    expect(guideUrlFor('/patients/abc123')).toMatch(/#bemor-kartasi$/);
    expect(guideUrlFor('/pharmacy')).toMatch(/#apteka$/);
  });

  it('falls back to the guide start for pages without a section', () => {
    expect(guideUrlFor('/')).toMatch(/\/qollanma\/$/);
    expect(guideUrlFor('/nope')).toMatch(/\/qollanma\/$/);
  });
});
