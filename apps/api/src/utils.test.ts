import { describe, expect, it } from 'vitest';
import { calcReceitaLiquida, parseMonth, toNumber } from './utils';

describe('parseMonth', () => {
  it('parses YYYY-MM into first day UTC', () => {
    const parsed = parseMonth('2026-02');
    expect(parsed.toISOString()).toBe('2026-02-01T00:00:00.000Z');
  });

  it('parses YYYY-MM-DD as provided day in UTC', () => {
    const parsed = parseMonth('2026-02-11');
    expect(parsed.toISOString()).toBe('2026-02-11T00:00:00.000Z');
  });

  it('accepts surrounding spaces', () => {
    const parsed = parseMonth(' 2026-01 ');
    expect(parsed.toISOString()).toBe('2026-01-01T00:00:00.000Z');
  });

  it('throws for empty value', () => {
    expect(() => parseMonth('')).toThrow('mes_ref is required');
  });

  it('throws for invalid value format', () => {
    expect(() => parseMonth('2026/02')).toThrow('mes_ref must be YYYY-MM or YYYY-MM-DD');
  });
});

describe('calcReceitaLiquida', () => {
  it('calculates net value based on percentual', () => {
    expect(calcReceitaLiquida(1000, 15)).toBe(850);
  });

  it('rounds to two decimal places', () => {
    expect(calcReceitaLiquida(1234.56, 7.89)).toBe(1137.15);
  });
});

describe('toNumber', () => {
  it('converts numeric strings', () => {
    expect(toNumber('42.5', 'valor')).toBe(42.5);
  });

  it('throws for NaN values', () => {
    expect(() => toNumber('abc', 'valor')).toThrow('valor must be a number');
  });
});
