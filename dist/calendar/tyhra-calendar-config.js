/**
 * Central Tyhra calendar definition — single source of truth for names and structure.
 * Edit weekday / month / veil / season names here (or add i18n keys later).
 */
export const TYHRA_CALENDAR_ID = 'tyhra';
export const TYHRA_CALENDAR = {
    id: TYHRA_CALENDAR_ID,
    name: 'Tyhra',
    daysPerWeek: 8,
    daysPerYear: 360,
    daysPerMonth: 44,
    weeksPerYear: 45,
    hoursPerDay: 40,
    minutesPerHour: 40,
    secondsPerMinute: 88,
    /** Year 0, day 1 (day index 0) is the calendar epoch. */
    epochYear: 0,
    weekdays: [
        { key: 'turningday', name: 'Turningday', deity: 'Thronos' },
        { key: 'flameday', name: 'Flameday', deity: 'Valkath' },
        { key: 'streamday', name: 'Streamday', deity: 'Nethrion' },
        { key: 'windday', name: 'Windday', deity: 'Sylphoria' },
        { key: 'maskday', name: 'Maskday', deity: 'Ithkor' },
        { key: 'forgeday', name: 'Forgeday', deity: 'Xaldris' },
        { key: 'weaveday', name: 'Weaveday', deity: 'Azarath' },
        { key: 'lawday', name: 'Lawday', deity: 'Thyrros' },
    ],
    months: [
        { index: 0, key: 'oathwhite', name: 'Oathwhite' },
        { index: 1, key: 'glasswake', name: 'Glasswake' },
        { index: 2, key: 'greenAsh', name: 'Green Ash' },
        { index: 3, key: 'crownfall', name: 'Crownfall' },
        { index: 4, key: 'prismtide', name: 'Prismtide' },
        { index: 5, key: 'sootgrain', name: 'Sootgrain' },
        { index: 6, key: 'riftwane', name: 'Riftwane' },
        { index: 7, key: 'ironNight', name: 'Iron Night' },
    ],
    veilDays: [
        { index: 0, key: 'ashVeil', name: 'Ash-Veil', omen: 'The past demands payment.', afterMonthIndex: 0 },
        { index: 1, key: 'mirrorVeil', name: 'Mirror-Veil', omen: 'Truth is visible, but not kind.', afterMonthIndex: 1 },
        { index: 2, key: 'chainVeil', name: 'Chain-Veil', omen: 'What binds you tightens.', afterMonthIndex: 2 },
        { index: 3, key: 'lanternVeil', name: 'Lantern-Veil', omen: 'Guidance appears — but only if you look.', afterMonthIndex: 3 },
        { index: 4, key: 'knifeVeil', name: 'Knife-Veil', omen: 'Conflict chooses a direction.', afterMonthIndex: 4 },
        { index: 5, key: 'sutureVeil', name: 'Suture-Veil', omen: 'Survival is possible, but costs effort.', afterMonthIndex: 5 },
        { index: 6, key: 'saltVeil', name: 'Salt-Veil', omen: 'Protection holds, if maintained.', afterMonthIndex: 6 },
        { index: 7, key: 'silenceVeil', name: 'Silence-Veil', omen: 'The sky listens.', afterMonthIndex: 7 },
    ],
    seasons: [
        { index: 0, key: 'whitewake', name: 'Whitewake', startDayOfYear: 1, endDayOfYear: 90 },
        { index: 1, key: 'ashbloom', name: 'Ashbloom', startDayOfYear: 91, endDayOfYear: 180 },
        { index: 2, key: 'prismheat', name: 'Prismheat', startDayOfYear: 181, endDayOfYear: 270 },
        { index: 3, key: 'riftfall', name: 'Riftfall', startDayOfYear: 271, endDayOfYear: 360 },
    ],
};
/** Month + following veil = 45 days per block. */
export const TYHRA_BLOCK_SIZE = TYHRA_CALENDAR.daysPerMonth + 1;
export const TYHRA_CALENDAR_FOLDER_NAME = 'Tyhra Calendar';
export const TYHRA_CALENDAR_FLAG_SCOPE = 'mastery-system';
export const TYHRA_CALENDAR_LOG_PREFIX = 'Destroyed Faith | Calendar |';
//# sourceMappingURL=tyhra-calendar-config.js.map