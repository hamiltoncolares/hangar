import { describe, expect, it } from 'vitest';
import { isDate, isMonth } from './validators';

describe('validators', () => {
  it('validates month format YYYY-MM', () => {
    expect(isMonth('2026-02')).toBe(true);
    expect(isMonth('2026-2')).toBe(false);
    expect(isMonth('02-2026')).toBe(false);
  });

  it('validates date format YYYY-MM-DD', () => {
    expect(isDate('2026-02-11')).toBe(true);
    expect(isDate('2026-2-11')).toBe(false);
    expect(isDate('11-02-2026')).toBe(false);
  });
});
