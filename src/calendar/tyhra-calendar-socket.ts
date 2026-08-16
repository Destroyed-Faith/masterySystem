/**
 * Players often cannot create JournalEntry documents. A connected GM
 * creates the day journal; the requesting client opens it when it arrives.
 */

import { ensureDayJournal, findJournalForDayIndex, readCalendarFlag } from './tyhra-calendar-journal-service.js';

const SOCKET_NAME = 'system.mastery-system';
const ACTION = 'tyhraCalendarCreateDay';

let socketRegistered = false;

export function registerTyhraCalendarSocket(): void {
  if (typeof game === 'undefined' || socketRegistered) return;
  socketRegistered = true;

  game.socket?.on(SOCKET_NAME, async (payload: any) => {
    if (payload?.action !== ACTION) return;
    if (!game.user?.isGM) return;
    const dayIndex = Math.floor(Number(payload.dayIndex));
    if (!Number.isFinite(dayIndex)) return;
    try {
      await ensureDayJournal({ dayIndex });
    } catch (err) {
      console.warn('Mastery System | Calendar GM create failed', err);
    }
  });
}

export async function requestGmCreateDayJournal(dayIndex: number): Promise<JournalEntry | null> {
  const already = findJournalForDayIndex(dayIndex);
  if (already) return already;

  const gmOnline = ((game as any).users?.contents ?? []).some((u: any) => u.isGM && u.active);
  if (!gmOnline) {
    ui.notifications?.warn(game.i18n.localize('MASTERY.calendar.needGmToCreate'));
    return null;
  }

  return new Promise((resolve) => {
    const timeout = window.setTimeout(() => {
      Hooks.off('createJournalEntry', onCreate);
      ui.notifications?.warn(game.i18n.localize('MASTERY.calendar.createJournalFailed'));
      resolve(null);
    }, 12000);

    const onCreate = (entry: JournalEntry) => {
      const flag = readCalendarFlag(entry);
      if (flag?.dayIndex !== dayIndex) return;
      window.clearTimeout(timeout);
      Hooks.off('createJournalEntry', onCreate);
      resolve(entry);
    };

    Hooks.on('createJournalEntry', onCreate);
    game.socket?.emit(SOCKET_NAME, { action: ACTION, dayIndex });
  });
}
