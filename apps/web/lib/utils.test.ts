import { describe, it, expect } from 'vitest';
import { formatCompact, formatRelative, formatFull } from './utils';

describe('formatCompact', () => {
  it('keeps small numbers as-is', () => {
    expect(formatCompact(0)).toBe('0');
    expect(formatCompact(942)).toBe('942');
  });
  it('formats thousands', () => {
    expect(formatCompact(1000)).toBe('1k');
    expect(formatCompact(1240)).toBe('1.2k');
    expect(formatCompact(12400)).toBe('12.4k');
  });
  it('formats millions', () => {
    expect(formatCompact(3_400_000)).toBe('3.4M');
  });
  it('handles null/undefined as 0', () => {
    expect(formatCompact(undefined)).toBe('0');
    expect(formatCompact(null)).toBe('0');
  });
});

describe('formatRelative', () => {
  it('returns "just now" for recent times', () => {
    expect(formatRelative(new Date())).toBe('just now');
  });
  it('returns minutes', () => {
    expect(formatRelative(new Date(Date.now() - 5 * 60_000))).toBe('5m');
  });
  it('returns hours', () => {
    expect(formatRelative(new Date(Date.now() - 3 * 3_600_000))).toBe('3h');
  });
  it('returns days', () => {
    expect(formatRelative(new Date(Date.now() - 2 * 86_400_000))).toBe('2d');
  });
});

describe('formatFull', () => {
  it('produces a human-readable timestamp', () => {
    const s = formatFull(new Date('2026-01-15T10:30:00'));
    expect(s).toMatch(/2026/);
    expect(s.length).toBeGreaterThan(8);
  });
});
