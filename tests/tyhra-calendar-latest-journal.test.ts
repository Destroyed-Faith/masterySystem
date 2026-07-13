import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { dayIndexFromParts } from '../src/calendar/tyhra-calendar-service.js';
import { getLatestCalendarJournalDayIndex } from '../src/calendar/tyhra-calendar-journal-service.js';

function mockJournalEntry(id: string, dayIndex: number, createdTime: number): JournalEntry {
  return {
    id,
    _stats: { createdTime },
    getFlag(_scope: string, key: string) {
      if (key !== 'calendar') return null;
      return {
        calendarId: 'tyhra',
        journalKey: `y${Math.floor(dayIndex / 360)}-d${(dayIndex % 360) + 1}`,
        dayIndex,
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
          mockJournalEntry('b', dayIndexFromParts(88, 45), 3000),
          mockJournalEntry('c', dayIndexFromParts(88, 20), 2000),
        ],
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns the day index of the most recently created calendar journal', () => {
    expect(getLatestCalendarJournalDayIndex()).toBe(dayIndexFromParts(88, 45));
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
});
