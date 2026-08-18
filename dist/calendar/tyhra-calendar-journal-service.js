/**
 * Tyhra calendar — journal lookup, creation, and folder management.
 */
import { TYHRA_CALENDAR_FLAG_SCOPE, TYHRA_CALENDAR_FOLDER_NAME, TYHRA_CALENDAR_ID, TYHRA_CALENDAR_LOG_PREFIX, } from './tyhra-calendar-config.js';
import { buildDayJournalPageContent, dateToJournalFlagData, dayIndexFromParts, getDateFromDayIndex, getDayIndexFromDate, getDayJournalName, getJournalKey, getJournalKeyFromDayIndex, } from './tyhra-calendar-service.js';
import { canUserCreateDayJournals, getStoredJournalFolderId, setStoredJournalFolderId, } from './tyhra-calendar-settings.js';
const journalCreationLocks = new Map();
let journalIndexCache = null;
let journalIndexBuilt = false;
function logWarn(message, data) {
    if (data !== undefined)
        console.warn(`${TYHRA_CALENDAR_LOG_PREFIX} ${message}`, data);
    else
        console.warn(`${TYHRA_CALENDAR_LOG_PREFIX} ${message}`);
}
function logError(message, error) {
    console.error(`${TYHRA_CALENDAR_LOG_PREFIX} ${message}`, error);
}
/** Resolve day index from flag fields even when `dayIndex` was not persisted. */
export function resolveCalendarFlagDayIndex(data) {
    const direct = Number(data.dayIndex);
    if (Number.isFinite(direct))
        return Math.floor(direct);
    const year = Number(data.year);
    const dayOfYear = Number(data.dayOfYear);
    if (Number.isFinite(year) && Number.isFinite(dayOfYear) && dayOfYear >= 1) {
        return dayIndexFromParts(Math.floor(year), Math.floor(dayOfYear));
    }
    const journalKey = String(data.journalKey ?? '').trim();
    const suffixMatch = journalKey.match(/:(-?\d+)$/);
    if (suffixMatch) {
        const parsed = Number(suffixMatch[1]);
        if (Number.isFinite(parsed))
            return Math.floor(parsed);
    }
    return null;
}
/** True when a journal (or create/update payload) is a Tyhra day entry. */
export function isCalendarJournalSource(source) {
    if (!source || typeof source !== 'object')
        return false;
    const flags = source.flags;
    const scoped = flags?.[TYHRA_CALENDAR_FLAG_SCOPE];
    if (scoped && typeof scoped === 'object' && scoped.calendar) {
        return true;
    }
    if (typeof source.getFlag === 'function') {
        return !!source.getFlag(TYHRA_CALENDAR_FLAG_SCOPE, 'calendar');
    }
    return false;
}
export function readCalendarFlag(entry) {
    const raw = entry.getFlag(TYHRA_CALENDAR_FLAG_SCOPE, 'calendar');
    if (!raw || typeof raw !== 'object')
        return null;
    const data = raw;
    if (!data.journalKey)
        return null;
    const dayIndex = resolveCalendarFlagDayIndex(data);
    if (dayIndex === null)
        return null;
    return {
        ...data,
        calendarId: data.calendarId ?? TYHRA_CALENDAR_ID,
        dayIndex,
    };
}
export function invalidateJournalIndexCache() {
    journalIndexCache = null;
    journalIndexBuilt = false;
}
export function buildJournalIndex() {
    if (journalIndexBuilt && journalIndexCache)
        return journalIndexCache;
    const map = new Map();
    const duplicates = new Map();
    for (const entry of game.journal?.contents ?? []) {
        const flag = readCalendarFlag(entry);
        if (!flag?.journalKey)
            continue;
        const existing = map.get(flag.journalKey);
        if (existing && existing !== entry.id) {
            const list = duplicates.get(flag.journalKey) ?? [existing];
            list.push(entry.id);
            duplicates.set(flag.journalKey, list);
            continue;
        }
        map.set(flag.journalKey, entry.id);
    }
    for (const [key, ids] of duplicates.entries()) {
        logWarn(`Duplicate calendar journals for key ${key}`, ids);
    }
    journalIndexCache = map;
    journalIndexBuilt = true;
    return map;
}
export function findJournalForDate(date) {
    const key = getJournalKey(date);
    const map = buildJournalIndex();
    const id = map.get(key);
    if (!id)
        return null;
    return game.journal?.get(id) ?? null;
}
export function findJournalForDayIndex(dayIndex) {
    return findJournalForDate(getDateFromDayIndex(dayIndex));
}
async function findJournalFolderByName(name, parentId) {
    return (game.folders?.find((f) => f.type === 'JournalEntry' && f.name === name && (f.folder?.id ?? null) === parentId) ?? null);
}
async function ensureJournalFolder(name, parentId) {
    const existing = await findJournalFolderByName(name, parentId);
    if (existing)
        return existing;
    return Folder.create({ name, type: 'JournalEntry', folder: parentId });
}
export async function ensureCalendarJournalFolder(year) {
    const storedRootId = getStoredJournalFolderId();
    let rootFolder = null;
    if (storedRootId) {
        rootFolder = game.folders?.get(storedRootId) ?? null;
        if (!rootFolder) {
            logWarn('Stored Tyhra Calendar folder id is stale; recreating root folder.');
        }
    }
    if (!rootFolder) {
        rootFolder = await findJournalFolderByName(TYHRA_CALENDAR_FOLDER_NAME, null);
        if (!rootFolder) {
            rootFolder = await ensureJournalFolder(TYHRA_CALENDAR_FOLDER_NAME, null);
        }
        await setStoredJournalFolderId(rootFolder.id);
    }
    const yearFolderName = `Year ${year}`;
    let yearFolder = await findJournalFolderByName(yearFolderName, rootFolder.id);
    if (!yearFolder) {
        yearFolder = await ensureJournalFolder(yearFolderName, rootFolder.id);
    }
    return yearFolder;
}
function calendarJournalOwnership() {
    const OWNER = CONST.DOCUMENT_OWNERSHIP_LEVELS?.OWNER ?? 3;
    const ownership = { default: OWNER };
    for (const user of game.users?.contents ?? []) {
        ownership[user.id] = OWNER;
    }
    return ownership;
}
/** GM: give every player Owner on existing day journals so they can edit. */
export async function grantPlayersCalendarJournalOwnership() {
    if (!game.user?.isGM)
        return;
    const OWNER = CONST.DOCUMENT_OWNERSHIP_LEVELS?.OWNER ?? 3;
    for (const entry of game.journal?.contents ?? []) {
        if (!readCalendarFlag(entry))
            continue;
        const current = (entry.ownership ?? {});
        const next = calendarJournalOwnership();
        const sameDefault = Number(current.default) === OWNER;
        const sameUsers = (game.users?.contents ?? []).every((user) => Number(current[user.id]) === OWNER);
        if (sameDefault && sameUsers)
            continue;
        try {
            await entry.update({ ownership: next });
        }
        catch (err) {
            logWarn(`Could not grant player ownership on ${entry.name}`, err);
        }
    }
}
async function openJournalEntry(entry) {
    if (entry.sheet?.rendered) {
        entry.sheet.bringToFront();
        return;
    }
    await entry.sheet?.render(true);
}
/** Create the day journal if missing. Does not open the sheet. */
export async function ensureDayJournal(input) {
    const date = 'dayIndex' in input
        ? getDateFromDayIndex(input.dayIndex)
        : 'year' in input && 'dayOfYear' in input
            ? getDateFromDayIndex(getDayIndexFromDate(input))
            : input;
    const existing = findJournalForDate(date);
    if (existing)
        return existing;
    if (!canUserCreateDayJournals()) {
        ui.notifications?.warn(game.i18n.localize('MASTERY.calendar.noJournalExists'));
        return null;
    }
    if (!game.user?.isGM) {
        const { requestGmCreateDayJournal } = await import('./tyhra-calendar-socket.js');
        return requestGmCreateDayJournal(date.dayIndex);
    }
    const journalKey = getJournalKey(date);
    const inflight = journalCreationLocks.get(journalKey);
    if (inflight)
        return inflight;
    const promise = (async () => {
        try {
            const again = findJournalForDate(date);
            if (again)
                return again;
            const folder = await ensureCalendarJournalFolder(date.year);
            const flagData = dateToJournalFlagData(date);
            const { pageTitle, html } = buildDayJournalPageContent(date);
            const entry = (await JournalEntry.create({
                name: getDayJournalName(date),
                folder: folder.id,
                ownership: calendarJournalOwnership(),
                flags: {
                    [TYHRA_CALENDAR_FLAG_SCOPE]: {
                        calendar: flagData,
                    },
                },
            }));
            await entry.createEmbeddedDocuments('JournalEntryPage', [
                {
                    name: pageTitle,
                    type: 'text',
                    text: { content: html },
                },
            ]);
            invalidateJournalIndexCache();
            buildJournalIndex();
            return entry;
        }
        catch (error) {
            logError(`Failed to create day journal ${journalKey}`, error);
            ui.notifications?.error(game.i18n.localize('MASTERY.calendar.createJournalFailed'));
            return null;
        }
        finally {
            journalCreationLocks.delete(journalKey);
        }
    })();
    journalCreationLocks.set(journalKey, promise);
    return promise;
}
export async function openDayJournal(input) {
    const entry = await ensureDayJournal(input);
    if (entry)
        await openJournalEntry(entry);
    return entry;
}
export function getJournalKeyForDayIndex(dayIndex) {
    return getJournalKeyFromDayIndex(dayIndex);
}
function journalEntrySortTime(entry) {
    const stats = entry._stats
        ?? entry.stats;
    const created = Number(stats?.createdTime);
    if (Number.isFinite(created) && created > 0)
        return created;
    const modified = Number(stats?.modifiedTime);
    if (Number.isFinite(modified) && modified > 0)
        return modified;
    return 0;
}
function isLatestJournalCandidate(candidate, current) {
    if (candidate.sortTime > current.sortTime)
        return true;
    if (candidate.sortTime < current.sortTime)
        return false;
    // Missing Foundry timestamps: prefer the furthest in-game date with a journal.
    return candidate.dayIndex > current.dayIndex;
}
/** Day index of the most recently created calendar day journal, or null if none exist. */
export function getLatestCalendarJournalDayIndex() {
    let latest = null;
    for (const entry of game.journal?.contents ?? []) {
        const flag = readCalendarFlag(entry);
        if (!flag)
            continue;
        const candidate = {
            dayIndex: flag.dayIndex,
            sortTime: journalEntrySortTime(entry),
        };
        if (!latest || isLatestJournalCandidate(candidate, latest)) {
            latest = candidate;
        }
    }
    return latest?.dayIndex ?? null;
}
//# sourceMappingURL=tyhra-calendar-journal-service.js.map