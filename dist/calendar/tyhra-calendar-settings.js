/**
 * Tyhra calendar — world settings registration.
 */
import { TYHRA_CALENDAR, TYHRA_CALENDAR_ID, } from './tyhra-calendar-config.js';
import { dayIndexFromParts } from './tyhra-calendar-service.js';
export const CALENDAR_SETTINGS = {
    enabled: 'calendarEnabled',
    currentDayIndex: 'currentDayIndex',
    currentHour: 'currentHour',
    currentMinute: 'currentMinute',
    journalFolderId: 'journalFolderId',
    defaultYear: 'defaultYear',
    playersCanOpen: 'playersCanOpenCalendar',
    playersCanCreate: 'playersCanCreateDayJournals',
    journalDefaultOwnership: 'calendarJournalDefaultOwnership',
};
const SETTING_SCOPE = 'mastery-system';
export function registerTyhraCalendarSettings() {
    game.settings.register(SETTING_SCOPE, CALENDAR_SETTINGS.enabled, {
        name: 'MASTERY.calendar.settings.enabled.name',
        hint: 'MASTERY.calendar.settings.enabled.hint',
        scope: 'world',
        config: true,
        type: Boolean,
        default: true,
    });
    game.settings.register(SETTING_SCOPE, CALENDAR_SETTINGS.currentDayIndex, {
        name: 'MASTERY.calendar.settings.currentDayIndex.name',
        hint: 'MASTERY.calendar.settings.currentDayIndex.hint',
        scope: 'world',
        config: false,
        type: Number,
        default: dayIndexFromParts(88, 1),
    });
    game.settings.register(SETTING_SCOPE, CALENDAR_SETTINGS.currentHour, {
        name: 'MASTERY.calendar.settings.currentHour.name',
        scope: 'world',
        config: false,
        type: Number,
        default: 0,
    });
    game.settings.register(SETTING_SCOPE, CALENDAR_SETTINGS.currentMinute, {
        name: 'MASTERY.calendar.settings.currentMinute.name',
        scope: 'world',
        config: false,
        type: Number,
        default: 0,
    });
    game.settings.register(SETTING_SCOPE, CALENDAR_SETTINGS.journalFolderId, {
        name: 'MASTERY.calendar.settings.journalFolderId.name',
        scope: 'world',
        config: false,
        type: String,
        default: '',
    });
    game.settings.register(SETTING_SCOPE, CALENDAR_SETTINGS.defaultYear, {
        name: 'MASTERY.calendar.settings.defaultYear.name',
        hint: 'MASTERY.calendar.settings.defaultYear.hint',
        scope: 'world',
        config: true,
        type: Number,
        default: 88,
    });
    game.settings.register(SETTING_SCOPE, CALENDAR_SETTINGS.playersCanOpen, {
        name: 'MASTERY.calendar.settings.playersCanOpen.name',
        hint: 'MASTERY.calendar.settings.playersCanOpen.hint',
        scope: 'world',
        config: false,
        type: Boolean,
        default: true,
    });
    game.settings.register(SETTING_SCOPE, CALENDAR_SETTINGS.playersCanCreate, {
        name: 'MASTERY.calendar.settings.playersCanCreate.name',
        hint: 'MASTERY.calendar.settings.playersCanCreate.hint',
        scope: 'world',
        config: false,
        type: Boolean,
        default: true,
    });
    game.settings.register(SETTING_SCOPE, CALENDAR_SETTINGS.journalDefaultOwnership, {
        name: 'MASTERY.calendar.settings.journalDefaultOwnership.name',
        hint: 'MASTERY.calendar.settings.journalDefaultOwnership.hint',
        scope: 'world',
        config: false,
        type: Number,
        default: CONST.DOCUMENT_OWNERSHIP_LEVELS?.OWNER ?? 3,
    });
}
export function isCalendarEnabled() {
    return game.settings.get(SETTING_SCOPE, CALENDAR_SETTINGS.enabled) !== false;
}
/** Any logged-in user may open the calendar window. */
export function canUserOpenCalendar(user = game.user) {
    return !!user;
}
/** Any logged-in user may create missing day journals (GM socket if needed). */
export function canUserCreateDayJournals(user = game.user) {
    return !!user;
}
/** Players edit day journals; world date stays GM-only. */
export function canUserEditDayJournals(user = game.user) {
    return !!user;
}
export function getCurrentDayIndex() {
    return Number(game.settings.get(SETTING_SCOPE, CALENDAR_SETTINGS.currentDayIndex)) || 0;
}
export function getCurrentHour() {
    return Math.max(0, Math.min(TYHRA_CALENDAR.hoursPerDay - 1, Number(game.settings.get(SETTING_SCOPE, CALENDAR_SETTINGS.currentHour)) || 0));
}
export function getCurrentMinute() {
    return Math.max(0, Math.min(TYHRA_CALENDAR.minutesPerHour - 1, Number(game.settings.get(SETTING_SCOPE, CALENDAR_SETTINGS.currentMinute)) || 0));
}
export async function setCurrentDayIndex(dayIndex) {
    await game.settings.set(SETTING_SCOPE, CALENDAR_SETTINGS.currentDayIndex, Math.floor(dayIndex));
}
export async function setCurrentHour(hour) {
    await game.settings.set(SETTING_SCOPE, CALENDAR_SETTINGS.currentHour, Math.max(0, Math.min(TYHRA_CALENDAR.hoursPerDay - 1, Math.floor(hour))));
}
export async function setCurrentMinute(minute) {
    await game.settings.set(SETTING_SCOPE, CALENDAR_SETTINGS.currentMinute, Math.max(0, Math.min(TYHRA_CALENDAR.minutesPerHour - 1, Math.floor(minute))));
}
export function getStoredJournalFolderId() {
    return String(game.settings.get(SETTING_SCOPE, CALENDAR_SETTINGS.journalFolderId) || '').trim();
}
export async function setStoredJournalFolderId(folderId) {
    await game.settings.set(SETTING_SCOPE, CALENDAR_SETTINGS.journalFolderId, folderId);
}
export function getDefaultViewYear() {
    const fromSetting = Number(game.settings.get(SETTING_SCOPE, CALENDAR_SETTINGS.defaultYear));
    if (Number.isFinite(fromSetting))
        return Math.floor(fromSetting);
    return 88;
}
export { TYHRA_CALENDAR_ID, SETTING_SCOPE };
//# sourceMappingURL=tyhra-calendar-settings.js.map