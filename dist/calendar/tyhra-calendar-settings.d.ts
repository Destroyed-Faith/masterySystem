/**
 * Tyhra calendar — world settings registration.
 */
import { TYHRA_CALENDAR_ID } from './tyhra-calendar-config.js';
export declare const CALENDAR_SETTINGS: {
    readonly enabled: "calendarEnabled";
    readonly currentDayIndex: "currentDayIndex";
    readonly currentHour: "currentHour";
    readonly currentMinute: "currentMinute";
    readonly journalFolderId: "journalFolderId";
    readonly defaultYear: "defaultYear";
    readonly playersCanOpen: "playersCanOpenCalendar";
    readonly playersCanCreate: "playersCanCreateDayJournals";
    readonly journalDefaultOwnership: "calendarJournalDefaultOwnership";
};
declare const SETTING_SCOPE = "mastery-system";
export declare function registerTyhraCalendarSettings(): void;
export declare function isCalendarEnabled(): boolean;
/** Any logged-in user may open the calendar window. */
export declare function canUserOpenCalendar(user?: any): boolean;
/** Any logged-in user may create missing day journals (GM socket if needed). */
export declare function canUserCreateDayJournals(user?: any): boolean;
/** Players edit day journals; world date stays GM-only. */
export declare function canUserEditDayJournals(user?: any): boolean;
export declare function getCurrentDayIndex(): number;
export declare function getCurrentHour(): number;
export declare function getCurrentMinute(): number;
export declare function setCurrentDayIndex(dayIndex: number): Promise<void>;
export declare function setCurrentHour(hour: number): Promise<void>;
export declare function setCurrentMinute(minute: number): Promise<void>;
export declare function getStoredJournalFolderId(): string;
export declare function setStoredJournalFolderId(folderId: string): Promise<void>;
export declare function getDefaultViewYear(): number;
export { TYHRA_CALENDAR_ID, SETTING_SCOPE };
//# sourceMappingURL=tyhra-calendar-settings.d.ts.map