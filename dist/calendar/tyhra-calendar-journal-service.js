/**
 * Tyhra calendar — journal lookup, creation, and folder management.
 */
import { TYHRA_CALENDAR_FLAG_SCOPE, TYHRA_CALENDAR_FOLDER_NAME, TYHRA_CALENDAR_LOG_PREFIX, } from './tyhra-calendar-config.js';
import { buildDayJournalPageContent, dateToJournalFlagData, getDateFromDayIndex, getDayIndexFromDate, getDayJournalName, getJournalKey, getJournalKeyFromDayIndex, } from './tyhra-calendar-service.js';
import { canUserCreateDayJournals, getStoredJournalFolderId, setStoredJournalFolderId, } from './tyhra-calendar-settings.js';
const journalCreationLocks = new Map();
let journalIndexCache = null;
let journalIndexBuilt = false;
function logInfo(message, data) {
    if (data !== undefined)
        console.log(`${TYHRA_CALENDAR_LOG_PREFIX} ${message}`, data);
    else
        console.log(`${TYHRA_CALENDAR_LOG_PREFIX} ${message}`);
}
function logWarn(message, data) {
    if (data !== undefined)
        console.warn(`${TYHRA_CALENDAR_LOG_PREFIX} ${message}`, data);
    else
        console.warn(`${TYHRA_CALENDAR_LOG_PREFIX} ${message}`);
}
function logError(message, error) {
    console.error(`${TYHRA_CALENDAR_LOG_PREFIX} ${message}`, error);
}
export function readCalendarFlag(entry) {
    const raw = entry.getFlag(TYHRA_CALENDAR_FLAG_SCOPE, 'calendar');
    if (!raw || typeof raw !== 'object')
        return null;
    const data = raw;
    if (!data.journalKey || data.calendarId == null)
        return null;
    return data;
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
            logInfo(`Created journal folder "${TYHRA_CALENDAR_FOLDER_NAME}"`, rootFolder.id);
        }
        await setStoredJournalFolderId(rootFolder.id);
    }
    const yearFolderName = `Year ${year}`;
    let yearFolder = await findJournalFolderByName(yearFolderName, rootFolder.id);
    if (!yearFolder) {
        yearFolder = await ensureJournalFolder(yearFolderName, rootFolder.id);
        logInfo(`Created journal folder "${yearFolderName}"`, yearFolder.id);
    }
    return yearFolder;
}
async function openJournalEntry(entry) {
    if (entry.sheet?.rendered) {
        entry.sheet.bringToFront();
        return;
    }
    await entry.sheet?.render(true);
}
export async function openDayJournal(input) {
    const date = 'dayIndex' in input
        ? getDateFromDayIndex(input.dayIndex)
        : 'year' in input && 'dayOfYear' in input
            ? getDateFromDayIndex(getDayIndexFromDate(input))
            : input;
    const journalKey = getJournalKey(date);
    const existing = findJournalForDate(date);
    if (existing) {
        await openJournalEntry(existing);
        return existing;
    }
    if (!canUserCreateDayJournals()) {
        ui.notifications?.warn(game.i18n.localize('MASTERY.calendar.noJournalExists'));
        return null;
    }
    const inflight = journalCreationLocks.get(journalKey);
    if (inflight) {
        const created = await inflight;
        if (created)
            await openJournalEntry(created);
        return created;
    }
    const promise = (async () => {
        try {
            const again = findJournalForDate(date);
            if (again)
                return again;
            const folder = await ensureCalendarJournalFolder(date.year);
            const flagData = dateToJournalFlagData(date);
            const { pageTitle, html } = buildDayJournalPageContent(date);
            const ownershipLevel = Number(game.settings.get('mastery-system', 'calendarJournalDefaultOwnership'));
            const ownership = {};
            if (game.user?.id)
                ownership[game.user.id] = CONST.DOCUMENT_OWNERSHIP_LEVELS?.OWNER ?? 3;
            for (const user of game.users?.contents ?? []) {
                if (user.isGM) {
                    ownership[user.id] = CONST.DOCUMENT_OWNERSHIP_LEVELS?.OWNER ?? 3;
                }
                else if (Number.isFinite(ownershipLevel)) {
                    ownership[user.id] = ownershipLevel;
                }
            }
            const entry = (await JournalEntry.create({
                name: getDayJournalName(date),
                folder: folder.id,
                ownership,
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
            logInfo(`Created day journal ${journalKey}`, entry.id);
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
    const entry = await promise;
    if (entry)
        await openJournalEntry(entry);
    return entry;
}
export function getJournalKeyForDayIndex(dayIndex) {
    return getJournalKeyFromDayIndex(dayIndex);
}
//# sourceMappingURL=tyhra-calendar-journal-service.js.map