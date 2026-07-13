/**
 * Tyhra calendar — journal lookup, creation, and folder management.
 */
import type { TyhraCalendarJournalFlagData, TyhraDate } from './tyhra-calendar-types.js';
/** Resolve day index from flag fields even when `dayIndex` was not persisted. */
export declare function resolveCalendarFlagDayIndex(data: Partial<TyhraCalendarJournalFlagData> & {
    journalKey?: string;
}): number | null;
export declare function readCalendarFlag(entry: JournalEntry): TyhraCalendarJournalFlagData | null;
export declare function invalidateJournalIndexCache(): void;
export declare function buildJournalIndex(): Map<string, string>;
export declare function findJournalForDate(date: TyhraDate): JournalEntry | null;
export declare function findJournalForDayIndex(dayIndex: number): JournalEntry | null;
export declare function ensureCalendarJournalFolder(year: number): Promise<Folder>;
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