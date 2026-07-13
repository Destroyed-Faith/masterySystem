/**
 * Tyhra calendar — public API (`game.masterySystem.calendar` / `game.destroyedFaith.calendar`).
 */
import type { TyhraDate } from './tyhra-calendar-types.js';
export declare const CALENDAR_DATE_CHANGED_HOOK = "masterySystem.calendarDateChanged";
/** When opening the calendar, jump world date to the latest created day journal. */
export declare function syncCurrentDayToLatestJournalEntry(): Promise<number>;
export interface TyhraCalendarApi {
    open: (options?: {
        year?: number;
        monthIndex?: number;
    }) => void;
    getCurrentDate: () => TyhraDate;
    getCurrentDayIndex: () => number;
    setCurrentDayIndex: (dayIndex: number) => Promise<TyhraDate>;
    setCurrentDate: (input: {
        year: number;
        dayOfYear: number;
    }) => Promise<TyhraDate>;
    advanceDays: (amount: number) => Promise<TyhraDate>;
    advanceHours: (amount: number) => Promise<void>;
    openDayJournal: (input: TyhraDate | {
        dayIndex: number;
    } | {
        year: number;
        dayOfYear: number;
    }) => Promise<JournalEntry | null>;
    isEnabled: () => boolean;
}
export declare function createTyhraCalendarApi(): TyhraCalendarApi;
export declare function exposeTyhraCalendarApi(): void;
//# sourceMappingURL=tyhra-calendar-api.d.ts.map