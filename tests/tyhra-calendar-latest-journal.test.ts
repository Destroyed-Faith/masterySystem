import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TYHRA_CALENDAR_ID } from '../src/calendar/tyhra-calendar-config.js';
import {
  getLatestCalendarJournalDayIndex,
  resolveCalendarFlagDayIndex,
} from '../src/calendar/tyhra-calendar-journal-service.js';
import {
  dayIndexFromParts,
  getJournalKeyFromDayIndex,
} from '../src/calendar/tyhra-calendar-service.js';

function mockJournalEntry(
  id: string,
  dayIndex: number,
  createdTime: number,
  flagOverrides: Record<string, unknown> = {},
): JournalEntry {
  const journalKey = getJournalKeyFromDayIndex(dayIndex);
  return {
    id,
    _stats: { createdTime },
    getFlag(_scope: string, key: string) {
      if (key !== 'calendar') return null;
      return {
        calendarId: TYHRA_CALENDAR_ID,
        journalKey,
        dayIndex,
        year: Math.floor(dayIndex / 360),
        dayOfYear: (dayIndex % 360) + 1,
        ...flagOverrides,
      };
    },
  } as unknown as JournalEntry;
}

describe('Tyhra calendar — latest journal day', () => {
  beforeEach(() => {
    vi.stubGlobal('game', {
      journal: {
        contents: [
          mockJournalEntry('a', dayIndexFromParts(88, 12), 1000),
          mockJournalEntry('b', dayIndexFromParts(88, 82), 3000),
          mockJournalEntry('c', dayIndexFromParts(88, 20), 2000),
        ],
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns the day index of the most recently created calendar journal', () => {
    expect(getLatestCalendarJournalDayIndex()).toBe(dayIndexFromParts(88, 82));
  });

  it('returns null when no calendar journals exist', () => {
    vi.stubGlobal('game', {
      journal: {
        contents: [
          {
            id: 'plain',
            _stats: { createdTime: 5000 },
            getFlag: () => null,
          },
        ],
      },
    });
    expect(getLatestCalendarJournalDayIndex()).toBeNull();
  });

  it('resolves day index from journalKey when dayIndex is missing on the flag', () => {
    const dayIndex = dayIndexFromParts(88, 82);
    vi.stubGlobal('game', {
      journal: {
        contents: [
          {
            id: 'legacy',
            _stats: { createdTime: 9000 },
            getFlag(_scope: string, key: string) {
              if (key !== 'calendar') return null;
              return {
                journalKey: getJournalKeyFromDayIndex(dayIndex),
              };
            },
          },
        ],
      },
    });

    expect(getLatestCalendarJournalDayIndex()).toBe(dayIndex);
  });

  it('falls back to the furthest in-game date when Foundry timestamps are missing', () => {
    vi.stubGlobal('game', {
      journal: {
        contents: [
          mockJournalEntry('a', dayIndexFromParts(88, 6), 0),
          mockJournalEntry('b', dayIndexFromParts(88, 82), 0),
        ],
      },
    });

    expect(getLatestCalendarJournalDayIndex()).toBe(dayIndexFromParts(88, 82));
  });
});

describe('resolveCalendarFlagDayIndex', () => {
  it('parses day index from journalKey suffix', () => {
    const dayIndex = dayIndexFromParts(88, 82);
    expect(
      resolveCalendarFlagDayIndex({
        journalKey: `${TYHRA_CALENDAR_ID}:${dayIndex}`,
      }),
    ).toBe(dayIndex);
  });
});
