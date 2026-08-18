/**
 * Tyhra calendar — journal lookup, creation, and folder management.
 */
import type { TyhraCalendarJournalFlagData, TyhraDate } from './tyhra-calendar-types.js';
/** Resolve day index from flag fields even when `dayIndex` was not persisted. */
export declare function resolveCalendarFlagDayIndex(data: Partial<TyhraCalendarJournalFlagData> & {
    journalKey?: string;
}): number | null;
/** True when a journal (or create/update payload) is a Tyhra day entry. */
export declare function isCalendarJournalSource(source: unknown): boolean;
export declare function readCalendarFlag(entry: JournalEntry): TyhraCalendarJournalFlagData | null;
export declare function invalidateJournalIndexCache(): void;
export declare function buildJournalIndex(): Map<string, string>;
export declare function findJournalForDate(date: TyhraDate): JournalEntry | null;
export declare function findJournalForDayIndex(dayIndex: number): JournalEntry | null;
export declare function ensureCalendarJournalFolder(year: number): Promise<Folder>;
/** GM: give every player Owner on existing day journals so they can edit. */
export declare function grantPlayersCalendarJournalOwnership(): Promise<void>;
/** Create the day journal if missing. Does not open the sheet. */
export declare function ensureDayJournal(input: TyhraDate | {
    dayIndex: number;
} | {
    year: number;
    dayOfYear: number;
}): Promise<JournalEntry | null>;
export declare function openDayJournal(input: TyhraDate | {
    dayIndex: number;
} | {
    year: number;
    dayOfYear: number;
}): Promise<JournalEntry | null>;
export declare function getJournalKeyForDayIndex(dayIndex: number): string;
/** Day index of the most recently created calendar day journal, or null if none exist. */
export declare function getLatestCalendarJournalDayIndex(): number | null;
//# sourceMappingURL=tyhra-calendar-journal-service.d.ts.map