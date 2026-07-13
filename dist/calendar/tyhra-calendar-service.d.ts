/**
 * Tyhra calendar — pure date math (no Foundry / DOM dependencies).
 *
 * Day index convention:
 * - Day index 0 = Year 0, day of year 1 (first Turningday of the epoch).
 * - dayIndex = year * 360 + (dayOfYear - 1) for all integer years.
 * - Negative day indices represent dates before the epoch year.
 */
import type { TyhraDate, TyhraMonthView } from './tyhra-calendar-types.js';
export declare function yearFromDayIndex(dayIndex: number): number;
export declare function dayOfYearFromDayIndex(dayIndex: number): number;
export declare function dayIndexFromParts(year: number, dayOfYear: number): number;
export declare function getWeekdayIndex(dayIndex: number): number;
export declare function isVeilDayOfYear(dayOfYear: number): boolean;
export declare function getMonthIndexForDayOfYear(dayOfYear: number): number;
export declare function getVeilDayIndexForDayOfYear(dayOfYear: number): number | null;
export declare function getSeasonIndexForDayOfYear(dayOfYear: number): number;
export declare function getDateFromDayIndex(dayIndex: number): TyhraDate;
export interface TyhraDateInput {
    year: number;
    dayOfYear: number;
}
export declare function getDayIndexFromDate(input: TyhraDateInput): number;
export declare function getWeekday(dayIndex: number): {
    index: number;
    name: string;
    deity: string;
};
export declare function getMonthData(monthIndex: number): {
    monthIndex: number;
    month: import("./tyhra-calendar-types.js").TyhraMonthDefinition;
    veil: import("./tyhra-calendar-types.js").TyhraVeilDayDefinition;
    seasonIndex: number;
    season: import("./tyhra-calendar-types.js").TyhraSeasonDefinition;
    startDayOfYear: number;
    veilDayOfYear: number;
};
export declare function getSeasonForDay(dayIndex: number): import("./tyhra-calendar-types.js").TyhraSeasonDefinition;
export declare function getVeilDayForDayIndex(dayIndex: number): import("./tyhra-calendar-types.js").TyhraVeilDayDefinition | null;
export declare function isVeilDay(dayIndex: number): boolean;
export declare function getJournalKey(date: Pick<TyhraDate, 'dayIndex' | 'calendarId'>): string;
export declare function getJournalKeyFromDayIndex(dayIndex: number): string;
export interface FormatDateOptions {
    includeWeekday?: boolean;
    includeSeason?: boolean;
    includeYear?: boolean;
}
export declare function formatDate(date: TyhraDate, options?: FormatDateOptions): string;
export declare function getDayJournalName(date: TyhraDate): string;
export declare function getYearData(year: number): {
    year: number;
    startDayIndex: number;
    endDayIndex: number;
    daysPerYear: number;
    startWeekdayIndex: number;
    startWeekdayName: string;
};
export interface MonthViewOptions {
    currentDayIndex?: number;
    journalKeyToId?: Map<string, string>;
}
export declare function getMonthView(year: number, monthIndex: number, options?: MonthViewOptions): TyhraMonthView;
export declare function getMonthIndexForDate(date: TyhraDate): number;
export declare function buildDayJournalPageContent(date: TyhraDate): {
    pageTitle: string;
    html: string;
};
export declare function dateToJournalFlagData(date: TyhraDate): {
    calendarId: string;
    journalKey: string;
    year: number;
    dayOfYear: number;
    dayIndex: number;
    type: import("./tyhra-calendar-types.js").TyhraDayType;
    monthIndex: number | null;
    monthName: string | null;
    dayOfMonth: number | null;
    veilDayIndex: number | null;
    veilDayName: string | null;
    weekdayIndex: number;
    weekdayName: string;
    seasonIndex: number;
    seasonName: string;
};
//# sourceMappingURL=tyhra-calendar-service.d.ts.map