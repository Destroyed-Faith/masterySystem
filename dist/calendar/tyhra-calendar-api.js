/**
 * Tyhra calendar — public API (`game.masterySystem.calendar` / `game.destroyedFaith.calendar`).
 */
import { TyhraCalendarApplication } from './tyhra-calendar-application.js';
import { openDayJournal, getLatestCalendarJournalDayIndex } from './tyhra-calendar-journal-service.js';
import { getDateFromDayIndex, getDayIndexFromDate, } from './tyhra-calendar-service.js';
import { getCurrentDayIndex, getCurrentHour, getCurrentMinute, isCalendarEnabled, setCurrentDayIndex, setCurrentHour, setCurrentMinute, } from './tyhra-calendar-settings.js';
function canChangeWorldDate() {
    return game.user?.isGM === true;
}
export const CALENDAR_DATE_CHANGED_HOOK = 'masterySystem.calendarDateChanged';
function notifyDateChanged(previousDayIndex, currentDayIndex) {
    const payload = {
        previousDayIndex,
        currentDayIndex,
        previousDate: getDateFromDayIndex(previousDayIndex),
        currentDate: getDateFromDayIndex(currentDayIndex),
    };
    Hooks.callAll(CALENDAR_DATE_CHANGED_HOOK, payload);
    TyhraCalendarApplication.requestRefresh();
}
/** When opening the calendar, jump world date to the latest created day journal. */
export async function syncCurrentDayToLatestJournalEntry() {
    const latestDayIndex = getLatestCalendarJournalDayIndex();
    if (latestDayIndex === null)
        return getCurrentDayIndex();
    const previousDayIndex = getCurrentDayIndex();
    if (latestDayIndex === previousDayIndex)
        return previousDayIndex;
    await setCurrentDayIndex(latestDayIndex);
    notifyDateChanged(previousDayIndex, latestDayIndex);
    return latestDayIndex;
}
export function createTyhraCalendarApi() {
    return {
        open(options) {
            if (!isCalendarEnabled()) {
                ui.notifications?.warn(game.i18n.localize('MASTERY.calendar.disabled'));
                return;
            }
            TyhraCalendarApplication.show(options);
        },
        getCurrentDate() {
            return getDateFromDayIndex(getCurrentDayIndex());
        },
        getCurrentDayIndex() {
            return getCurrentDayIndex();
        },
        async setCurrentDayIndex(dayIndex) {
            if (!canChangeWorldDate()) {
                ui.notifications?.warn(game.i18n.localize('MASTERY.calendar.noDatePermission'));
                return getDateFromDayIndex(getCurrentDayIndex());
            }
            const prev = getCurrentDayIndex();
            const next = Math.floor(dayIndex);
            await setCurrentDayIndex(next);
            notifyDateChanged(prev, next);
            return getDateFromDayIndex(next);
        },
        async setCurrentDate(input) {
            return this.setCurrentDayIndex(getDayIndexFromDate(input));
        },
        async advanceDays(amount) {
            if (!canChangeWorldDate()) {
                ui.notifications?.warn(game.i18n.localize('MASTERY.calendar.noDatePermission'));
                return getDateFromDayIndex(getCurrentDayIndex());
            }
            const prev = getCurrentDayIndex();
            const next = prev + Math.floor(amount);
            await setCurrentDayIndex(next);
            notifyDateChanged(prev, next);
            return getDateFromDayIndex(next);
        },
        async advanceHours(amount) {
            if (!canChangeWorldDate()) {
                ui.notifications?.warn(game.i18n.localize('MASTERY.calendar.noDatePermission'));
                return;
            }
            let hour = getCurrentHour();
            let minute = getCurrentMinute();
            let dayIndex = getCurrentDayIndex();
            let delta = Math.floor(amount);
            while (delta !== 0) {
                const step = delta > 0 ? 1 : -1;
                hour += step;
                if (hour >= 40) {
                    hour = 0;
                    dayIndex += 1;
                }
                else if (hour < 0) {
                    hour = 39;
                    dayIndex -= 1;
                }
                delta -= step;
            }
            const prev = getCurrentDayIndex();
            await setCurrentHour(hour);
            await setCurrentMinute(minute);
            if (dayIndex !== prev) {
                await setCurrentDayIndex(dayIndex);
                notifyDateChanged(prev, dayIndex);
            }
            else {
                TyhraCalendarApplication.requestRefresh();
            }
        },
        openDayJournal(input) {
            return openDayJournal(input);
        },
        isEnabled() {
            return isCalendarEnabled();
        },
    };
}
export function exposeTyhraCalendarApi() {
    const api = createTyhraCalendarApi();
    const g = game;
    g.masterySystem = Object.assign(g.masterySystem || {}, { calendar: api });
    g.destroyedFaith = Object.assign(g.destroyedFaith || {}, { calendar: api });
}
//# sourceMappingURL=tyhra-calendar-api.js.map