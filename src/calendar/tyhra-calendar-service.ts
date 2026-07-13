/**
 * Tyhra calendar — pure date math (no Foundry / DOM dependencies).
 *
 * Day index convention:
 * - Day index 0 = Year 0, day of year 1 (first Turningday of the epoch).
 * - dayIndex = year * 360 + (dayOfYear - 1) for all integer years.
 * - Negative day indices represent dates before the epoch year.
 */

import {
  TYHRA_BLOCK_SIZE,
  TYHRA_CALENDAR,
  TYHRA_CALENDAR_ID,
} from './tyhra-calendar-config.js';
import type {
  TyhraDate,
  TyhraMonthView,
  TyhraMonthViewDay,
  TyhraMonthViewVeil,
} from './tyhra-calendar-types.js';

const C = TYHRA_CALENDAR;

function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

export function yearFromDayIndex(dayIndex: number): number {
  return Math.floor(dayIndex / C.daysPerYear);
}

export function dayOfYearFromDayIndex(dayIndex: number): number {
  const year = yearFromDayIndex(dayIndex);
  return dayIndex - year * C.daysPerYear + 1;
}

export function dayIndexFromParts(year: number, dayOfYear: number): number {
  return year * C.daysPerYear + (dayOfYear - 1);
}

export function getWeekdayIndex(dayIndex: number): number {
  return mod(dayIndex, C.daysPerWeek);
}

export function isVeilDayOfYear(dayOfYear: number): boolean {
  if (dayOfYear < 1 || dayOfYear > C.daysPerYear) return false;
  return (dayOfYear - 1) % TYHRA_BLOCK_SIZE === C.daysPerMonth;
}

export function getMonthIndexForDayOfYear(dayOfYear: number): number {
  return Math.floor((dayOfYear - 1) / TYHRA_BLOCK_SIZE);
}

export function getVeilDayIndexForDayOfYear(dayOfYear: number): number | null {
  if (!isVeilDayOfYear(dayOfYear)) return null;
  return getMonthIndexForDayOfYear(dayOfYear);
}

export function getSeasonIndexForDayOfYear(dayOfYear: number): number {
  const clamped = Math.max(1, Math.min(C.daysPerYear, dayOfYear));
  for (const season of C.seasons) {
    if (clamped >= season.startDayOfYear && clamped <= season.endDayOfYear) {
      return season.index;
    }
  }
  return 0;
}

export function getDateFromDayIndex(dayIndex: number): TyhraDate {
  const year = yearFromDayIndex(dayIndex);
  const dayOfYear = dayOfYearFromDayIndex(dayIndex);
  const weekdayIndex = getWeekdayIndex(dayIndex);
  const weekday = C.weekdays[weekdayIndex]!;
  const seasonIndex = getSeasonIndexForDayOfYear(dayOfYear);
  const season = C.seasons[seasonIndex]!;

  if (isVeilDayOfYear(dayOfYear)) {
    const veilDayIndex = getVeilDayIndexForDayOfYear(dayOfYear)!;
    const veil = C.veilDays[veilDayIndex]!;
    const afterMonth = C.months[veil.afterMonthIndex]!;
    return {
      calendarId: TYHRA_CALENDAR_ID,
      year,
      dayOfYear,
      dayIndex,
      weekdayIndex,
      weekdayName: weekday.name,
      weekdayDeity: weekday.deity,
      seasonIndex,
      seasonName: season.name,
      type: 'veil',
      monthIndex: veil.afterMonthIndex,
      monthName: afterMonth.name,
      dayOfMonth: null,
      veilDayIndex,
      veilDayName: veil.name,
      veilOmen: veil.omen,
      displayName: formatDateDisplay({
        type: 'veil',
        veilDayName: veil.name,
        weekdayName: weekday.name,
        year,
      }),
    };
  }

  const monthIndex = getMonthIndexForDayOfYear(dayOfYear);
  const month = C.months[monthIndex]!;
  const posInBlock = (dayOfYear - 1) % TYHRA_BLOCK_SIZE;
  const dayOfMonth = posInBlock + 1;

  return {
    calendarId: TYHRA_CALENDAR_ID,
    year,
    dayOfYear,
    dayIndex,
    weekdayIndex,
    weekdayName: weekday.name,
    weekdayDeity: weekday.deity,
    seasonIndex,
    seasonName: season.name,
    type: 'month',
    monthIndex,
    monthName: month.name,
    dayOfMonth,
    veilDayIndex: null,
    veilDayName: null,
    veilOmen: null,
    displayName: formatDateDisplay({
      type: 'month',
      dayOfMonth,
      monthName: month.name,
      weekdayName: weekday.name,
      year,
    }),
  };
}

export interface TyhraDateInput {
  year: number;
  dayOfYear: number;
}

export function getDayIndexFromDate(input: TyhraDateInput): number {
  const dayOfYear = Math.max(1, Math.min(C.daysPerYear, Math.floor(input.dayOfYear)));
  return dayIndexFromParts(Math.floor(input.year), dayOfYear);
}

export function getWeekday(dayIndex: number): { index: number; name: string; deity: string } {
  const index = getWeekdayIndex(dayIndex);
  const def = C.weekdays[index]!;
  return { index, name: def.name, deity: def.deity };
}

export function getMonthData(monthIndex: number) {
  const idx = Math.max(0, Math.min(C.months.length - 1, monthIndex));
  const month = C.months[idx]!;
  const veil = C.veilDays[idx]!;
  return {
    monthIndex: idx,
    month,
    veil,
    seasonIndex: getSeasonIndexForDayOfYear(idx * TYHRA_BLOCK_SIZE + 1),
    season: C.seasons[getSeasonIndexForDayOfYear(idx * TYHRA_BLOCK_SIZE + 1)]!,
    startDayOfYear: idx * TYHRA_BLOCK_SIZE + 1,
    veilDayOfYear: (idx + 1) * TYHRA_BLOCK_SIZE,
  };
}

export function getSeasonForDay(dayIndex: number) {
  const date = getDateFromDayIndex(dayIndex);
  return C.seasons[date.seasonIndex]!;
}

export function getVeilDayForDayIndex(dayIndex: number) {
  const date = getDateFromDayIndex(dayIndex);
  if (date.type !== 'veil' || date.veilDayIndex == null) return null;
  return C.veilDays[date.veilDayIndex]!;
}

export function isVeilDay(dayIndex: number): boolean {
  return getDateFromDayIndex(dayIndex).type === 'veil';
}

export function getJournalKey(date: Pick<TyhraDate, 'dayIndex' | 'calendarId'>): string {
  return `${date.calendarId}:${date.dayIndex}`;
}

export function getJournalKeyFromDayIndex(dayIndex: number): string {
  return getJournalKey({ calendarId: TYHRA_CALENDAR_ID, dayIndex });
}

export interface FormatDateOptions {
  includeWeekday?: boolean;
  includeSeason?: boolean;
  includeYear?: boolean;
}

export function formatDate(date: TyhraDate, options: FormatDateOptions = {}): string {
  const { includeWeekday = true, includeSeason = false, includeYear = true } = options;
  const parts: string[] = [];

  if (date.type === 'veil') {
    parts.push(date.veilDayName ?? 'Veil Day');
  } else {
    parts.push(`${date.dayOfMonth} ${date.monthName}`);
  }

  if (includeWeekday) parts.push(date.weekdayName);
  if (includeSeason) parts.push(date.seasonName);
  if (includeYear) parts.push(`Year ${date.year}`);

  return parts.join(', ');
}

function formatDateDisplay(parts: {
  type: 'month' | 'veil';
  dayOfMonth?: number;
  monthName?: string;
  veilDayName?: string;
  weekdayName: string;
  year: number;
}): string {
  if (parts.type === 'veil') {
    return `${parts.veilDayName}, ${parts.weekdayName}, Year ${parts.year}`;
  }
  return `${parts.dayOfMonth} ${parts.monthName}, ${parts.weekdayName}, Year ${parts.year}`;
}

export function getDayJournalName(date: TyhraDate): string {
  if (date.type === 'veil') {
    return `${date.veilDayName}, ${date.weekdayName} — Year ${date.year}`;
  }
  return `${date.dayOfMonth} ${date.monthName}, ${date.weekdayName} — Year ${date.year}`;
}

export function getYearData(year: number) {
  const startDayIndex = dayIndexFromParts(year, 1);
  const endDayIndex = dayIndexFromParts(year, C.daysPerYear);
  return {
    year,
    startDayIndex,
    endDayIndex,
    daysPerYear: C.daysPerYear,
    startWeekdayIndex: getWeekdayIndex(startDayIndex),
    startWeekdayName: C.weekdays[getWeekdayIndex(startDayIndex)]!.name,
  };
}

export interface MonthViewOptions {
  currentDayIndex?: number;
  journalKeyToId?: Map<string, string>;
}

export function getMonthView(
  year: number,
  monthIndex: number,
  options: MonthViewOptions = {},
): TyhraMonthView {
  const idx = Math.max(0, Math.min(C.months.length - 1, monthIndex));
  const month = C.months[idx]!;
  const meta = getMonthData(idx);
  const startDayOfYear = meta.startDayOfYear;
  const firstDayIndex = dayIndexFromParts(year, startDayOfYear);
  const leadingBlanks = getWeekdayIndex(firstDayIndex);
  const currentDayIndex = options.currentDayIndex;
  const journalMap = options.journalKeyToId ?? new Map<string, string>();

  const days: TyhraMonthViewDay[] = [];
  for (let dom = 1; dom <= C.daysPerMonth; dom++) {
    const dayOfYear = startDayOfYear + dom - 1;
    const dayIndex = dayIndexFromParts(year, dayOfYear);
    const weekdayIndex = getWeekdayIndex(dayIndex);
    const journalKey = getJournalKeyFromDayIndex(dayIndex);
    days.push({
      dayOfMonth: dom,
      dayOfYear,
      dayIndex,
      weekdayIndex,
      weekdayName: C.weekdays[weekdayIndex]!.name,
      isCurrent: currentDayIndex === dayIndex,
      hasJournal: journalMap.has(journalKey),
      journalId: journalMap.get(journalKey) ?? null,
      journalKey,
    });
  }

  const veilDayOfYear = meta.veilDayOfYear;
  const veilDayIndex = dayIndexFromParts(year, veilDayOfYear);
  const veilWeekdayIndex = getWeekdayIndex(veilDayIndex);
  const veilDef = C.veilDays[idx]!;
  const veilJournalKey = getJournalKeyFromDayIndex(veilDayIndex);

  const veil: TyhraMonthViewVeil = {
    dayOfYear: veilDayOfYear,
    dayIndex: veilDayIndex,
    weekdayIndex: veilWeekdayIndex,
    weekdayName: C.weekdays[veilWeekdayIndex]!.name,
    veilDayIndex: idx,
    veilDayName: veilDef.name,
    veilOmen: veilDef.omen,
    isCurrent: currentDayIndex === veilDayIndex,
    hasJournal: journalMap.has(veilJournalKey),
    journalId: journalMap.get(veilJournalKey) ?? null,
    journalKey: veilJournalKey,
  };

  return {
    year,
    monthIndex: idx,
    monthName: month.name,
    seasonIndex: meta.seasonIndex,
    seasonName: meta.season.name,
    leadingBlanks,
    days,
    veil,
  };
}

export function getMonthIndexForDate(date: TyhraDate): number {
  if (date.type === 'veil') return date.monthIndex ?? 0;
  return date.monthIndex ?? 0;
}

export function buildDayJournalPageContent(date: TyhraDate): { pageTitle: string; html: string } {
  if (date.type === 'veil') {
    return {
      pageTitle: date.veilDayName ?? 'Veil Day',
      html: `
<h1>${date.veilDayName}</h1>
<p><em>${date.veilOmen ?? ''}</em></p>
<p><strong>Weekday:</strong> ${date.weekdayName}</p>
<p><strong>Year:</strong> ${date.year}</p>
<p><strong>Season:</strong> ${date.seasonName}</p>

<hr>

<h2>Customs and Omens</h2>
<p></p>

<h2>Events</h2>
<p></p>

<h2>Travel and Time</h2>
<p></p>

<h2>NPCs and Locations</h2>
<p></p>

<h2>GM Notes</h2>
<p></p>
`.trim(),
    };
  }

  return {
    pageTitle: `${date.dayOfMonth} ${date.monthName}`,
    html: `
<h1>${date.dayOfMonth} ${date.monthName}, ${date.weekdayName}</h1>
<p><strong>Year:</strong> ${date.year}</p>
<p><strong>Season:</strong> ${date.seasonName}</p>
<p><strong>Day of Year:</strong> ${date.dayOfYear}</p>

<hr>

<h2>Events</h2>
<p></p>

<h2>Travel and Time</h2>
<p></p>

<h2>NPCs and Locations</h2>
<p></p>

<h2>GM Notes</h2>
<p></p>
`.trim(),
  };
}

export function dateToJournalFlagData(date: TyhraDate) {
  return {
    calendarId: date.calendarId,
    journalKey: getJournalKey(date),
    year: date.year,
    dayOfYear: date.dayOfYear,
    dayIndex: date.dayIndex,
    type: date.type,
    monthIndex: date.monthIndex,
    monthName: date.monthName,
    dayOfMonth: date.dayOfMonth,
    veilDayIndex: date.veilDayIndex,
    veilDayName: date.veilDayName,
    weekdayIndex: date.weekdayIndex,
    weekdayName: date.weekdayName,
    seasonIndex: date.seasonIndex,
    seasonName: date.seasonName,
  };
}
