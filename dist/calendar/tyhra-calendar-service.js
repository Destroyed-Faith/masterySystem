/**
 * Tyhra calendar — pure date math (no Foundry / DOM dependencies).
 *
 * Day index convention:
 * - Day index 0 = Year 0, day of year 1 (first Turningday of the epoch).
 * - dayIndex = year * 360 + (dayOfYear - 1) for all integer years.
 * - Negative day indices represent dates before the epoch year.
 */
import { TYHRA_BLOCK_SIZE, TYHRA_CALENDAR, TYHRA_CALENDAR_ID, } from './tyhra-calendar-config.js';
const C = TYHRA_CALENDAR;
function mod(n, m) {
    return ((n % m) + m) % m;
}
export function yearFromDayIndex(dayIndex) {
    return Math.floor(dayIndex / C.daysPerYear);
}
export function dayOfYearFromDayIndex(dayIndex) {
    const year = yearFromDayIndex(dayIndex);
    return dayIndex - year * C.daysPerYear + 1;
}
export function dayIndexFromParts(year, dayOfYear) {
    return year * C.daysPerYear + (dayOfYear - 1);
}
export function getWeekdayIndex(dayIndex) {
    return mod(dayIndex, C.daysPerWeek);
}
export function isVeilDayOfYear(dayOfYear) {
    if (dayOfYear < 1 || dayOfYear > C.daysPerYear)
        return false;
    return (dayOfYear - 1) % TYHRA_BLOCK_SIZE === C.daysPerMonth;
}
export function getMonthIndexForDayOfYear(dayOfYear) {
    return Math.floor((dayOfYear - 1) / TYHRA_BLOCK_SIZE);
}
export function getVeilDayIndexForDayOfYear(dayOfYear) {
    if (!isVeilDayOfYear(dayOfYear))
        return null;
    return getMonthIndexForDayOfYear(dayOfYear);
}
export function getSeasonIndexForDayOfYear(dayOfYear) {
    const clamped = Math.max(1, Math.min(C.daysPerYear, dayOfYear));
    for (const season of C.seasons) {
        if (clamped >= season.startDayOfYear && clamped <= season.endDayOfYear) {
            return season.index;
        }
    }
    return 0;
}
export function getDateFromDayIndex(dayIndex) {
    const year = yearFromDayIndex(dayIndex);
    const dayOfYear = dayOfYearFromDayIndex(dayIndex);
    const weekdayIndex = getWeekdayIndex(dayIndex);
    const weekday = C.weekdays[weekdayIndex];
    const seasonIndex = getSeasonIndexForDayOfYear(dayOfYear);
    const season = C.seasons[seasonIndex];
    if (isVeilDayOfYear(dayOfYear)) {
        const veilDayIndex = getVeilDayIndexForDayOfYear(dayOfYear);
        const veil = C.veilDays[veilDayIndex];
        const afterMonth = C.months[veil.afterMonthIndex];
        return {
            calendarId: TYHRA_CALENDAR_ID,
            year,
            dayOfYear,
            dayIndex,
            weekdayIndex,
            weekdayName: weekday.name,
            weekdayDeity: weekday.deity,
            seasonIndex,
            seasonName: season.name,
            type: 'veil',
            monthIndex: veil.afterMonthIndex,
            monthName: afterMonth.name,
            dayOfMonth: null,
            veilDayIndex,
            veilDayName: veil.name,
            veilOmen: veil.omen,
            displayName: formatDateDisplay({
                type: 'veil',
                veilDayName: veil.name,
                weekdayName: weekday.name,
                year,
            }),
        };
    }
    const monthIndex = getMonthIndexForDayOfYear(dayOfYear);
    const month = C.months[monthIndex];
    const posInBlock = (dayOfYear - 1) % TYHRA_BLOCK_SIZE;
    const dayOfMonth = posInBlock + 1;
    return {
        calendarId: TYHRA_CALENDAR_ID,
        year,
        dayOfYear,
        dayIndex,
        weekdayIndex,
        weekdayName: weekday.name,
        weekdayDeity: weekday.deity,
        seasonIndex,
        seasonName: season.name,
        type: 'month',
        monthIndex,
        monthName: month.name,
        dayOfMonth,
        veilDayIndex: null,
        veilDayName: null,
        veilOmen: null,
        displayName: formatDateDisplay({
            type: 'month',
            dayOfMonth,
            monthName: month.name,
            weekdayName: weekday.name,
            year,
        }),
    };
}
export function getDayIndexFromDate(input) {
    const dayOfYear = Math.max(1, Math.min(C.daysPerYear, Math.floor(input.dayOfYear)));
    return dayIndexFromParts(Math.floor(input.year), dayOfYear);
}
export function getWeekday(dayIndex) {
    const index = getWeekdayIndex(dayIndex);
    const def = C.weekdays[index];
    return { index, name: def.name, deity: def.deity };
}
export function getMonthData(monthIndex) {
    const idx = Math.max(0, Math.min(C.months.length - 1, monthIndex));
    const month = C.months[idx];
    const veil = C.veilDays[idx];
    return {
        monthIndex: idx,
        month,
        veil,
        seasonIndex: getSeasonIndexForDayOfYear(idx * TYHRA_BLOCK_SIZE + 1),
        season: C.seasons[getSeasonIndexForDayOfYear(idx * TYHRA_BLOCK_SIZE + 1)],
        startDayOfYear: idx * TYHRA_BLOCK_SIZE + 1,
        veilDayOfYear: (idx + 1) * TYHRA_BLOCK_SIZE,
    };
}
export function getSeasonForDay(dayIndex) {
    const date = getDateFromDayIndex(dayIndex);
    return C.seasons[date.seasonIndex];
}
export function getVeilDayForDayIndex(dayIndex) {
    const date = getDateFromDayIndex(dayIndex);
    if (date.type !== 'veil' || date.veilDayIndex == null)
        return null;
    return C.veilDays[date.veilDayIndex];
}
export function isVeilDay(dayIndex) {
    return getDateFromDayIndex(dayIndex).type === 'veil';
}
export function getJournalKey(date) {
    return `${date.calendarId}:${date.dayIndex}`;
}
export function getJournalKeyFromDayIndex(dayIndex) {
    return getJournalKey({ calendarId: TYHRA_CALENDAR_ID, dayIndex });
}
export function formatDate(date, options = {}) {
    const { includeWeekday = true, includeSeason = false, includeYear = true } = options;
    const parts = [];
    if (date.type === 'veil') {
        parts.push(date.veilDayName ?? 'Veil Day');
    }
    else {
        parts.push(`${date.dayOfMonth} ${date.monthName}`);
    }
    if (includeWeekday)
        parts.push(date.weekdayName);
    if (includeSeason)
        parts.push(date.seasonName);
    if (includeYear)
        parts.push(`Year ${date.year}`);
    return parts.join(', ');
}
function formatDateDisplay(parts) {
    if (parts.type === 'veil') {
        return `${parts.veilDayName}, ${parts.weekdayName}, Year ${parts.year}`;
    }
    return `${parts.dayOfMonth} ${parts.monthName}, ${parts.weekdayName}, Year ${parts.year}`;
}
export function getDayJournalName(date) {
    if (date.type === 'veil') {
        return `${date.veilDayName}, ${date.weekdayName} — Year ${date.year}`;
    }
    return `${date.dayOfMonth} ${date.monthName}, ${date.weekdayName} — Year ${date.year}`;
}
export function getYearData(year) {
    const startDayIndex = dayIndexFromParts(year, 1);
    const endDayIndex = dayIndexFromParts(year, C.daysPerYear);
    return {
        year,
        startDayIndex,
        endDayIndex,
        daysPerYear: C.daysPerYear,
        startWeekdayIndex: getWeekdayIndex(startDayIndex),
        startWeekdayName: C.weekdays[getWeekdayIndex(startDayIndex)].name,
    };
}
export function getMonthView(year, monthIndex, options = {}) {
    const idx = Math.max(0, Math.min(C.months.length - 1, monthIndex));
    const month = C.months[idx];
    const meta = getMonthData(idx);
    const startDayOfYear = meta.startDayOfYear;
    const firstDayIndex = dayIndexFromParts(year, startDayOfYear);
    const leadingBlanks = getWeekdayIndex(firstDayIndex);
    const currentDayIndex = options.currentDayIndex;
    const journalMap = options.journalKeyToId ?? new Map();
    const days = [];
    for (let dom = 1; dom <= C.daysPerMonth; dom++) {
        const dayOfYear = startDayOfYear + dom - 1;
        const dayIndex = dayIndexFromParts(year, dayOfYear);
        const weekdayIndex = getWeekdayIndex(dayIndex);
        const journalKey = getJournalKeyFromDayIndex(dayIndex);
        days.push({
            dayOfMonth: dom,
            dayOfYear,
            dayIndex,
            weekdayIndex,
            weekdayName: C.weekdays[weekdayIndex].name,
            isCurrent: currentDayIndex === dayIndex,
            hasJournal: journalMap.has(journalKey),
            journalId: journalMap.get(journalKey) ?? null,
            journalKey,
        });
    }
    const veilDayOfYear = meta.veilDayOfYear;
    const veilDayIndex = dayIndexFromParts(year, veilDayOfYear);
    const veilWeekdayIndex = getWeekdayIndex(veilDayIndex);
    const veilDef = C.veilDays[idx];
    const veilJournalKey = getJournalKeyFromDayIndex(veilDayIndex);
    const veil = {
        dayOfYear: veilDayOfYear,
        dayIndex: veilDayIndex,
        weekdayIndex: veilWeekdayIndex,
        weekdayName: C.weekdays[veilWeekdayIndex].name,
        veilDayIndex: idx,
        veilDayName: veilDef.name,
        veilOmen: veilDef.omen,
        isCurrent: currentDayIndex === veilDayIndex,
        hasJournal: journalMap.has(veilJournalKey),
        journalId: journalMap.get(veilJournalKey) ?? null,
        journalKey: veilJournalKey,
    };
    return {
        year,
        monthIndex: idx,
        monthName: month.name,
        seasonIndex: meta.seasonIndex,
        seasonName: meta.season.name,
        leadingBlanks,
        days,
        veil,
    };
}
export function getMonthIndexForDate(date) {
    if (date.type === 'veil')
        return date.monthIndex ?? 0;
    return date.monthIndex ?? 0;
}
export function buildDayJournalPageContent(date) {
    if (date.type === 'veil') {
        return {
            pageTitle: date.veilDayName ?? 'Veil Day',
            html: `
<h1>${date.veilDayName}</h1>
<p><em>${date.veilOmen ?? ''}</em></p>
<p><strong>Weekday:</strong> ${date.weekdayName}</p>
<p><strong>Year:</strong> ${date.year}</p>
<p><strong>Season:</strong> ${date.seasonName}</p>

<hr>

<h2>Customs and Omens</h2>
<p></p>

<h2>Events</h2>
<p></p>

<h2>Travel and Time</h2>
<p></p>

<h2>NPCs and Locations</h2>
<p></p>

<h2>GM Notes</h2>
<p></p>
`.trim(),
        };
    }
    return {
        pageTitle: `${date.dayOfMonth} ${date.monthName}`,
        html: `
<h1>${date.dayOfMonth} ${date.monthName}, ${date.weekdayName}</h1>
<p><strong>Year:</strong> ${date.year}</p>
<p><strong>Season:</strong> ${date.seasonName}</p>
<p><strong>Day of Year:</strong> ${date.dayOfYear}</p>

<hr>

<h2>Events</h2>
<p></p>

<h2>Travel and Time</h2>
<p></p>

<h2>NPCs and Locations</h2>
<p></p>

<h2>GM Notes</h2>
<p></p>
`.trim(),
    };
}
export function dateToJournalFlagData(date) {
    return {
        calendarId: date.calendarId,
        journalKey: getJournalKey(date),
        year: date.year,
        dayOfYear: date.dayOfYear,
        dayIndex: date.dayIndex,
        type: date.type,
        monthIndex: date.monthIndex,
        monthName: date.monthName,
        dayOfMonth: date.dayOfMonth,
        veilDayIndex: date.veilDayIndex,
        veilDayName: date.veilDayName,
        weekdayIndex: date.weekdayIndex,
        weekdayName: date.weekdayName,
        seasonIndex: date.seasonIndex,
        seasonName: date.seasonName,
    };
}
//# sourceMappingURL=tyhra-calendar-service.js.map