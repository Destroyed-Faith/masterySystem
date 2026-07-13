/**
 * Tyhra calendar — shared types.
 */

export type TyhraDayType = 'month' | 'veil';

export interface TyhraWeekdayDefinition {
  key: string;
  name: string;
  deity: string;
}

export interface TyhraMonthDefinition {
  index: number;
  key: string;
  name: string;
}

export interface TyhraVeilDayDefinition {
  index: number;
  key: string;
  name: string;
  omen: string;
  /** Month index this veil follows (0–7). */
  afterMonthIndex: number;
}

export interface TyhraSeasonDefinition {
  index: number;
  key: string;
  name: string;
  /** Inclusive day-of-year range within a Tyhra year (1-based). */
  startDayOfYear: number;
  endDayOfYear: number;
}

export interface TyhraCalendarDefinition {
  id: string;
  name: string;
  daysPerWeek: number;
  daysPerYear: number;
  daysPerMonth: number;
  weeksPerYear: number;
  hoursPerDay: number;
  minutesPerHour: number;
  secondsPerMinute: number;
  epochYear: number;
  weekdays: TyhraWeekdayDefinition[];
  months: TyhraMonthDefinition[];
  veilDays: TyhraVeilDayDefinition[];
  seasons: TyhraSeasonDefinition[];
}

export interface TyhraDate {
  calendarId: string;
  year: number;
  dayOfYear: number;
  dayIndex: number;
  weekdayIndex: number;
  weekdayName: string;
  weekdayDeity: string;
  seasonIndex: number;
  seasonName: string;
  type: TyhraDayType;
  monthIndex: number | null;
  monthName: string | null;
  dayOfMonth: number | null;
  veilDayIndex: number | null;
  veilDayName: string | null;
  veilOmen: string | null;
  displayName: string;
}

export interface TyhraMonthViewDay {
  dayOfMonth: number;
  dayOfYear: number;
  dayIndex: number;
  weekdayIndex: number;
  weekdayName: string;
  isCurrent: boolean;
  hasJournal: boolean;
  journalId: string | null;
  journalKey: string;
}

export interface TyhraMonthViewVeil {
  dayOfYear: number;
  dayIndex: number;
  weekdayIndex: number;
  weekdayName: string;
  veilDayIndex: number;
  veilDayName: string;
  veilOmen: string;
  isCurrent: boolean;
  hasJournal: boolean;
  journalId: string | null;
  journalKey: string;
}

export interface TyhraMonthView {
  year: number;
  monthIndex: number;
  monthName: string;
  seasonIndex: number;
  seasonName: string;
  /** Empty leading cells before day 1 (0–7). */
  leadingBlanks: number;
  days: TyhraMonthViewDay[];
  veil: TyhraMonthViewVeil;
}

export interface TyhraCalendarJournalFlagData {
  calendarId: string;
  journalKey: string;
  year: number;
  dayOfYear: number;
  dayIndex: number;
  type: TyhraDayType;
  monthIndex: number | null;
  monthName: string | null;
  dayOfMonth: number | null;
  veilDayIndex: number | null;
  veilDayName: string | null;
  weekdayIndex: number;
  weekdayName: string;
  seasonIndex: number;
  seasonName: string;
}

export interface TyhraDateChangedPayload {
  previousDate: TyhraDate;
  currentDate: TyhraDate;
  previousDayIndex: number;
  currentDayIndex: number;
}
