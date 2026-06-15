import { describe, it, expect } from 'vitest';
import { getWeekStr, getMondayOfWeek, addDays, isWeekend, getCronType } from '../src/utils/date.js';

describe('getWeekStr', () => {
  it('2025-01-06 (월) → 2025-W02', () => {
    expect(getWeekStr(new Date('2025-01-06'))).toBe('2025-W02');
  });

  it('2025-12-31 (수) → 2026-W01', () => {
    expect(getWeekStr(new Date('2025-12-31'))).toBe('2026-W01');
  });

  it('2025-06-13 (금) → 2025-W24', () => {
    expect(getWeekStr(new Date('2025-06-13'))).toBe('2025-W24');
  });
});

describe('getMondayOfWeek', () => {
  it('금요일에서 그 주 월요일 반환', () => {
    const friday = new Date('2025-06-13T00:00:00Z');
    const monday = getMondayOfWeek(friday);
    expect(monday.toISOString().slice(0, 10)).toBe('2025-06-09');
  });

  it('월요일은 자기 자신', () => {
    const monday = new Date('2025-06-09T00:00:00Z');
    expect(getMondayOfWeek(monday).toISOString().slice(0, 10)).toBe('2025-06-09');
  });
});

describe('addDays', () => {
  it('3일 더하기', () => {
    const d = addDays(new Date('2025-06-09T00:00:00Z'), 3);
    expect(d.toISOString().slice(0, 10)).toBe('2025-06-12');
  });

  it('음수 빼기', () => {
    const d = addDays(new Date('2025-06-09T00:00:00Z'), -2);
    expect(d.toISOString().slice(0, 10)).toBe('2025-06-07');
  });
});

describe('isWeekend', () => {
  it('토요일 true', () => {
    expect(isWeekend(new Date('2025-06-14T00:00:00Z'))).toBe(true);
  });

  it('일요일 true', () => {
    expect(isWeekend(new Date('2025-06-15T00:00:00Z'))).toBe(true);
  });

  it('월요일 false', () => {
    expect(isWeekend(new Date('2025-06-09T00:00:00Z'))).toBe(false);
  });
});

describe('getCronType', () => {
  it('01:00 UTC → announce', () => {
    const d = new Date('2025-06-09T01:00:00Z');
    expect(getCronType(d)).toBe('announce');
  });

  it('07:30 UTC → warn', () => {
    const d = new Date('2025-06-13T07:30:00Z');
    expect(getCronType(d)).toBe('warn');
  });

  it('08:00 UTC → send', () => {
    const d = new Date('2025-06-13T08:00:00Z');
    expect(getCronType(d)).toBe('send');
  });

  it('다른 시간 → null', () => {
    expect(getCronType(new Date('2025-06-09T05:00:00Z'))).toBeNull();
  });
});
