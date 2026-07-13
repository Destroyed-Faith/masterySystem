import { describe, expect, it } from 'vitest';
import { TYHRA_BLOCK_SIZE, TYHRA_CALENDAR } from '../src/calendar/tyhra-calendar-config.js';
import {
  dayIndexFromParts,
  dayOfYearFromDayIndex,
  getDateFromDayIndex,
  getDayIndexFromDate,
  getJournalKeyFromDayIndex,
  getMonthData,
  getWeekdayIndex,
  isVeilDayOfYear,
  yearFromDayIndex,
} from '../src/calendar/tyhra-calendar-service.js';

describe('Tyhra calendar — structure', () => {
  it('has exactly 360 days per year', () => {
    expect(TYHRA_CALENDAR.daysPerYear).toBe(360);
  });

  it('has exactly 45 eight-day weeks per year', () => {
    expect(TYHRA_CALENDAR.daysPerYear / TYHRA_CALENDAR.daysPerWeek).toBe(45);
    expect(TYHRA_CALENDAR.weeksPerYear).toBe(45);
  });

  it('gives every month 44 normal days', () => {
    for (let m = 0; m < TYHRA_CALENDAR.months.length; m++) {
      const meta = getMonthData(m);
      expect(meta.veilDayOfYear - meta.startDayOfYear).toBe(44);
    }
  });

  it('places exactly one veil day after each month', () => {
    for (let m = 0; m < 8; m++) {
      const veilDayOfYear = (m + 1) * TYHRA_BLOCK_SIZE;
      expect(isVeilDayOfYear(veilDayOfYear)).toBe(true);
      expect(isVeilDayOfYear(veilDayOfYear - 1)).toBe(false);
    }
  });
});

describe('Tyhra calendar — landmark dates (year 0)', () => {
  it('day 45 is Ash-Veil', () => {
    const date = getDateFromDayIndex(dayIndexFromParts(0, 45));
    expect(date.type).toBe('veil');
    expect(date.veilDayName).toBe('Ash-Veil');
    expect(date.dayOfMonth).toBeNull();
  });

  it('day 46 is 1 Glasswake', () => {
    const date = getDateFromDayIndex(dayIndexFromParts(0, 46));
    expect(date.type).toBe('month');
    expect(date.monthName).toBe('Glasswake');
    expect(date.dayOfMonth).toBe(1);
  });

  it('day 90 is Mirror-Veil', () => {
    const date = getDateFromDayIndex(dayIndexFromParts(0, 90));
    expect(date.type).toBe('veil');
    expect(date.veilDayName).toBe('Mirror-Veil');
  });

  it('day 360 is Silence-Veil', () => {
    const date = getDateFromDayIndex(dayIndexFromParts(0, 360));
    expect(date.type).toBe('veil');
    expect(date.veilDayName).toBe('Silence-Veil');
  });

  it('day 361 is year 1 day 1 with same weekday as year 0 day 1', () => {
    const y0d1 = getWeekdayIndex(dayIndexFromParts(0, 1));
    const y1d1 = getWeekdayIndex(dayIndexFromParts(1, 1));
    expect(y0d1).toBe(y1d1);
    expect(getDateFromDayIndex(dayIndexFromParts(1, 1)).year).toBe(1);
    expect(getDateFromDayIndex(dayIndexFromParts(1, 1)).dayOfYear).toBe(1);
  });
});

describe('Tyhra calendar — conversions', () => {
  it('round-trips day index through date parts', () => {
    for (const dayIndex of [-720, -1, 0, 1, 359, 360, 31724]) {
      const date = getDateFromDayIndex(dayIndex);
      const back = getDayIndexFromDate({ year: date.year, dayOfYear: date.dayOfYear });
      expect(back).toBe(dayIndex);
    }
  });

  it('never assigns a month day number to veil days', () => {
    for (let doy = 1; doy <= 360; doy++) {
      const date = getDateFromDayIndex(dayIndexFromParts(5, doy));
      if (date.type === 'veil') expect(date.dayOfMonth).toBeNull();
      else expect(date.dayOfMonth).toBeGreaterThanOrEqual(1);
    }
  });

  it('uses distinct journal keys for same month-day in different years', () => {
    const k88 = getJournalKeyFromDayIndex(dayIndexFromParts(88, 17));
    const k89 = getJournalKeyFromDayIndex(dayIndexFromParts(89, 17));
    expect(k88).not.toBe(k89);
  });

  it('handles negative day indices', () => {
    expect(yearFromDayIndex(-1)).toBe(-1);
    expect(dayOfYearFromDayIndex(-1)).toBe(360);
    expect(getDateFromDayIndex(-360).year).toBe(-1);
    expect(getDateFromDayIndex(-360).dayOfYear).toBe(1);
  });

  it('has no leap years — year length is always 360', () => {
    expect(dayIndexFromParts(10, 1) - dayIndexFromParts(9, 1)).toBe(360);
    expect(dayIndexFromParts(0, 360) + 1).toBe(dayIndexFromParts(1, 1));
  });
});
