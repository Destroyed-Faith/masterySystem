/**
 * Tyhra calendar — public API (`game.masterySystem.calendar` / `game.destroyedFaith.calendar`).
 */

import { TyhraCalendarApplication } from './tyhra-calendar-application.js';
import { openDayJournal } from './tyhra-calendar-journal-service.js';
import {
  getDateFromDayIndex,
  getDayIndexFromDate,
} from './tyhra-calendar-service.js';
import type { TyhraDate, TyhraDateChangedPayload } from './tyhra-calendar-types.js';
import {
  getCurrentDayIndex,
  getCurrentHour,
  getCurrentMinute,
  isCalendarEnabled,
  setCurrentDayIndex,
  setCurrentHour,
  setCurrentMinute,
} from './tyhra-calendar-settings.js';

export const CALENDAR_DATE_CHANGED_HOOK = 'masterySystem.calendarDateChanged';

function notifyDateChanged(previousDayIndex: number, currentDayIndex: number): void {
  const payload: TyhraDateChangedPayload = {
    previousDayIndex,
    currentDayIndex,
    previousDate: getDateFromDayIndex(previousDayIndex),
    currentDate: getDateFromDayIndex(currentDayIndex),
  };
  Hooks.callAll(CALENDAR_DATE_CHANGED_HOOK, payload);
  TyhraCalendarApplication.requestRefresh();
}

export interface TyhraCalendarApi {
  open: (options?: { year?: number; monthIndex?: number }) => void;
  getCurrentDate: () => TyhraDate;
  getCurrentDayIndex: () => number;
  setCurrentDayIndex: (dayIndex: number) => Promise<TyhraDate>;
  setCurrentDate: (input: { year: number; dayOfYear: number }) => Promise<TyhraDate>;
  advanceDays: (amount: number) => Promise<TyhraDate>;
  advanceHours: (amount: number) => Promise<void>;
  openDayJournal: (
    input: TyhraDate | { dayIndex: number } | { year: number; dayOfYear: number },
  ) => Promise<JournalEntry | null>;
  isEnabled: () => boolean;
}

export function createTyhraCalendarApi(): TyhraCalendarApi {
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

    async setCurrentDayIndex(dayIndex: number) {
      const prev = getCurrentDayIndex();
      const next = Math.floor(dayIndex);
      await setCurrentDayIndex(next);
      notifyDateChanged(prev, next);
      return getDateFromDayIndex(next);
    },

    async setCurrentDate(input) {
      return this.setCurrentDayIndex(getDayIndexFromDate(input));
    },

    async advanceDays(amount: number) {
      const prev = getCurrentDayIndex();
      const next = prev + Math.floor(amount);
      await setCurrentDayIndex(next);
      notifyDateChanged(prev, next);
      return getDateFromDayIndex(next);
    },

    async advanceHours(amount: number) {
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
        } else if (hour < 0) {
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
      } else {
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

export function exposeTyhraCalendarApi(): void {
  const api = createTyhraCalendarApi();
  const g = game as any;
  g.masterySystem = Object.assign(g.masterySystem || {}, { calendar: api });
  g.destroyedFaith = Object.assign(g.destroyedFaith || {}, { calendar: api });
}
