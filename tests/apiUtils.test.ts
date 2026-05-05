import { describe, it, expect } from 'vitest';
import { clampLimit, isIsoDate } from '@/lib/apiUtils';

describe('clampLimit', () => {
  it('clamps value within range', () => {
    expect(clampLimit(5, 1, 20)).toBe(5);
  });

  it('clamps to minimum', () => {
    expect(clampLimit(-5, 1, 20)).toBe(1);
  });

  it('clamps to maximum', () => {
    expect(clampLimit(50, 1, 20)).toBe(20);
  });

  it('defaults min to 1 and max to 20', () => {
    expect(clampLimit(5)).toBe(5);
    expect(clampLimit(0)).toBe(1);
    expect(clampLimit(100)).toBe(20);
  });

  it('handles NaN by returning minimum', () => {
    expect(clampLimit(NaN, 1, 20)).toBe(1);
  });

  it('handles Infinity by returning minimum', () => {
    expect(clampLimit(Infinity, 1, 20)).toBe(1);
    expect(clampLimit(-Infinity, 1, 20)).toBe(1);
  });
});

describe('isIsoDate', () => {
  it('accepts valid ISO dates', () => {
    expect(isIsoDate('2025-06-15T12:00:00Z')).toBe(true);
    expect(isIsoDate('2025-01-01T00:00:00.000Z')).toBe(true);
  });

  it('rejects invalid date strings', () => {
    expect(isIsoDate('not-a-date')).toBe(false);
    expect(isIsoDate('')).toBe(false);
  });

  it('rejects empty string', () => {
    expect(isIsoDate('')).toBe(false);
  });
});
