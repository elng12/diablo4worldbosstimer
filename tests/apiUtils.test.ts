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

  it('rejects non-ISO formats like date-only or locale strings', () => {
    expect(isIsoDate('2025-06-15')).toBe(false);
    expect(isIsoDate('June 15, 2025')).toBe(false);
    expect(isIsoDate('2025/06/15T12:00:00Z')).toBe(false);
  });

  it('rejects invalid calendar dates like Feb 30', () => {
    expect(isIsoDate('2024-02-30T00:00:00Z')).toBe(false);
  });

  it('rejects ISO strings with timezone offset instead of Z', () => {
    expect(isIsoDate('2025-06-15T12:00:00+00:00')).toBe(false);
  });
});
