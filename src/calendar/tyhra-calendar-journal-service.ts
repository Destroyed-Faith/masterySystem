/**
 * Tyhra calendar — journal lookup, creation, and folder management.
 */

import {
  TYHRA_CALENDAR_FLAG_SCOPE,
  TYHRA_CALENDAR_FOLDER_NAME,
  TYHRA_CALENDAR_ID,
  TYHRA_CALENDAR_LOG_PREFIX,
} from './tyhra-calendar-config.js';
import {
  buildDayJournalPageContent,
  dateToJournalFlagData,
  getDateFromDayIndex,
  getDayIndexFromDate,
  getDayJournalName,
  getJournalKey,
  getJournalKeyFromDayIndex,
} from './tyhra-calendar-service.js';
import type { TyhraCalendarJournalFlagData, TyhraDate } from './tyhra-calendar-types.js';
import {
  canUserCreateDayJournals,
  getStoredJournalFolderId,
  setStoredJournalFolderId,
} from './tyhra-calendar-settings.js';

const journalCreationLocks = new Map<string, Promise<JournalEntry | null>>();

let journalIndexCache: Map<string, string> | null = null;
let journalIndexBuilt = false;

function logInfo(message: string, data?: unknown): void {
  if (data !== undefined) console.log(`${TYHRA_CALENDAR_LOG_PREFIX} ${message}`, data);
  else console.log(`${TYHRA_CALENDAR_LOG_PREFIX} ${message}`);
}

function logWarn(message: string, data?: unknown): void {
  if (data !== undefined) console.warn(`${TYHRA_CALENDAR_LOG_PREFIX} ${message}`, data);
  else console.warn(`${TYHRA_CALENDAR_LOG_PREFIX} ${message}`);
}

function logError(message: string, error?: unknown): void {
  console.error(`${TYHRA_CALENDAR_LOG_PREFIX} ${message}`, error);
}

/** Resolve day index from flag fields even when `dayIndex` was not persisted. */
export function resolveCalendarFlagDayIndex(
  data: Partial<TyhraCalendarJournalFlagData> & { journalKey?: string },
): number | null {
  const direct = Number(data.dayIndex);
  if (Number.isFinite(direct)) return Math.floor(direct);

  const year = Number(data.year);
  const dayOfYear = Number(data.dayOfYear);
  if (Number.isFinite(year) && Number.isFinite(dayOfYear) && dayOfYear >= 1) {
    return dayIndexFromParts(Math.floor(year), Math.floor(dayOfYear));
  }

  const journalKey = String(data.journalKey ?? '').trim();
  const suffixMatch = journalKey.match(/:(-?\d+)$/);
  if (suffixMatch) {
    const parsed = Number(suffixMatch[1]);
    if (Number.isFinite(parsed)) return Math.floor(parsed);
  }

  return null;
}

export function readCalendarFlag(entry: JournalEntry): TyhraCalendarJournalFlagData | null {
  const raw = entry.getFlag(TYHRA_CALENDAR_FLAG_SCOPE, 'calendar');
  if (!raw || typeof raw !== 'object') return null;
  const data = raw as TyhraCalendarJournalFlagData;
  if (!data.journalKey) return null;

  const dayIndex = resolveCalendarFlagDayIndex(data);
  if (dayIndex === null) return null;

  return {
    ...data,
    calendarId: data.calendarId ?? TYHRA_CALENDAR_ID,
    dayIndex,
  };
}

export function invalidateJournalIndexCache(): void {
  journalIndexCache = null;
  journalIndexBuilt = false;
}

export function buildJournalIndex(): Map<string, string> {
  if (journalIndexBuilt && journalIndexCache) return journalIndexCache;

  const map = new Map<string, string>();
  const duplicates = new Map<string, string[]>();

  for (const entry of (game as any).journal?.contents ?? []) {
    const flag = readCalendarFlag(entry as JournalEntry);
    if (!flag?.journalKey) continue;
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

export function findJournalForDate(date: TyhraDate): JournalEntry | null {
  const key = getJournalKey(date);
  const map = buildJournalIndex();
  const id = map.get(key);
  if (!id) return null;
  return (game as any).journal?.get(id) ?? null;
}

export function findJournalForDayIndex(dayIndex: number): JournalEntry | null {
  return findJournalForDate(getDateFromDayIndex(dayIndex));
}

async function findJournalFolderByName(name: string, parentId: string | null): Promise<Folder | null> {
  return (
  (game as any).folders?.find(
    (f: Folder) => f.type === 'JournalEntry' && f.name === name && (f.folder?.id ?? null) === parentId,
  ) ?? null
  );
}

async function ensureJournalFolder(name: string, parentId: string | null): Promise<Folder> {
  const existing = await findJournalFolderByName(name, parentId);
  if (existing) return existing;
  return (Folder as any).create({ name, type: 'JournalEntry', folder: parentId }) as Promise<Folder>;
}

export async function ensureCalendarJournalFolder(year: number): Promise<Folder> {
  const storedRootId = getStoredJournalFolderId();
  let rootFolder: Folder | null = null;

  if (storedRootId) {
    rootFolder = (game as any).folders?.get(storedRootId) ?? null;
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

async function openJournalEntry(entry: JournalEntry): Promise<void> {
  if (entry.sheet?.rendered) {
    entry.sheet.bringToFront();
    return;
  }
  await entry.sheet?.render(true);
}

export async function openDayJournal(
  input: TyhraDate | { dayIndex: number } | { year: number; dayOfYear: number },
): Promise<JournalEntry | null> {
  const date =
    'dayIndex' in input
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
    if (created) await openJournalEntry(created);
    return created;
  }

  const promise = (async () => {
    try {
      const again = findJournalForDate(date);
      if (again) return again;

      const folder = await ensureCalendarJournalFolder(date.year);
      const flagData = dateToJournalFlagData(date);
      const { pageTitle, html } = buildDayJournalPageContent(date);

      const ownershipLevel = Number(
        (game as any).settings.get('mastery-system', 'calendarJournalDefaultOwnership'),
      );
      const ownership: Record<string, number> = {};
      if (game.user?.id) ownership[game.user.id] = (CONST as any).DOCUMENT_OWNERSHIP_LEVELS?.OWNER ?? 3;
      for (const user of (game as any).users?.contents ?? []) {
        if (user.isGM) {
          ownership[user.id] = (CONST as any).DOCUMENT_OWNERSHIP_LEVELS?.OWNER ?? 3;
        } else if (Number.isFinite(ownershipLevel)) {
          ownership[user.id] = ownershipLevel;
        }
      }

      const entry = (await (JournalEntry as any).create({
        name: getDayJournalName(date),
        folder: folder.id,
        ownership,
        flags: {
          [TYHRA_CALENDAR_FLAG_SCOPE]: {
            calendar: flagData,
          },
        },
      })) as JournalEntry;

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
    } catch (error) {
      logError(`Failed to create day journal ${journalKey}`, error);
      ui.notifications?.error(game.i18n.localize('MASTERY.calendar.createJournalFailed'));
      return null;
    } finally {
      journalCreationLocks.delete(journalKey);
    }
  })();

  journalCreationLocks.set(journalKey, promise);
  const entry = await promise;
  if (entry) await openJournalEntry(entry);
  return entry;
}

export function getJournalKeyForDayIndex(dayIndex: number): string {
  return getJournalKeyFromDayIndex(dayIndex);
}

function journalEntrySortTime(entry: JournalEntry): number {
  const stats =
    (entry as { _stats?: { createdTime?: number | null; modifiedTime?: number | null } })._stats
    ?? (entry as { stats?: { createdTime?: number | null; modifiedTime?: number | null } }).stats;
  const created = Number(stats?.createdTime);
  if (Number.isFinite(created) && created > 0) return created;
  const modified = Number(stats?.modifiedTime);
  if (Number.isFinite(modified) && modified > 0) return modified;
  return 0;
}

function isLatestJournalCandidate(
  candidate: { dayIndex: number; sortTime: number },
  current: { dayIndex: number; sortTime: number },
): boolean {
  if (candidate.sortTime > current.sortTime) return true;
  if (candidate.sortTime < current.sortTime) return false;
  // Missing Foundry timestamps: prefer the furthest in-game date with a journal.
  return candidate.dayIndex > current.dayIndex;
}

/** Day index of the most recently created calendar day journal, or null if none exist. */
export function getLatestCalendarJournalDayIndex(): number | null {
  let latest: { dayIndex: number; sortTime: number } | null = null;

  for (const entry of (game as any).journal?.contents ?? []) {
    const flag = readCalendarFlag(entry as JournalEntry);
    if (!flag) continue;

    const candidate = {
      dayIndex: flag.dayIndex,
      sortTime: journalEntrySortTime(entry as JournalEntry),
    };

    if (!latest || isLatestJournalCandidate(candidate, latest)) {
      latest = candidate;
    }
  }

  return latest?.dayIndex ?? null;
}
