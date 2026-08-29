/**
 * Tyhra calendar — hooks, sidebar button, cache invalidation.
 */

import { exposeTyhraCalendarApi } from './tyhra-calendar-api.js';
import { TyhraCalendarApplication } from './tyhra-calendar-application.js';
import {
  grantPlayersCalendarJournalOwnership,
  invalidateJournalIndexCache,
} from './tyhra-calendar-journal-service.js';
import { registerTyhraCalendarSocket } from './tyhra-calendar-socket.js';
import { registerTyhraCalendarSettings, canUserOpenCalendar, isCalendarEnabled } from './tyhra-calendar-settings.js';

function injectJournalSidebarButton(html: HTMLElement | JQuery): void {
  if (!isCalendarEnabled() || !canUserOpenCalendar()) return;

  const root = html instanceof HTMLElement ? html : (html as JQuery)[0];
  if (!root) return;

  if (root.querySelector('.df-calendar-launch')) return;

  const header =
    root.querySelector('.directory-header') ??
    root.querySelector('header');
  const headerActions =
    root.querySelector('.directory-header .header-actions') ??
    root.querySelector('.header-actions');

  const label = game.i18n.localize('MASTERY.calendar.launchLabel');
  const title = game.i18n.localize('MASTERY.calendar.openCalendar');
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'df-calendar-launch';
  button.title = title;
  button.setAttribute('aria-label', title);
  button.innerHTML = `<i class="fas fa-calendar-days" aria-hidden="true"></i><span>${label}</span>`;

  button.addEventListener('click', (ev) => {
    ev.preventDefault();
    (game as any).masterySystem?.calendar?.open?.();
  });

  if (header) {
    header.insertAdjacentElement('afterend', button);
    return;
  }
  headerActions?.prepend(button);
}

export function initializeTyhraCalendar(): void {
  registerTyhraCalendarSettings();
  exposeTyhraCalendarApi();
  registerTyhraCalendarSocket();

  Hooks.once('ready', () => {
    void grantPlayersCalendarJournalOwnership();
  });

  Hooks.on('renderJournalDirectory', (_app: unknown, html: HTMLElement | JQuery) => {
    injectJournalSidebarButton(html);
  });

  Hooks.on('renderSidebarTab', (app: any, html: HTMLElement | JQuery) => {
    if (app?.tabName === 'journal') injectJournalSidebarButton(html);
  });

  const invalidate = () => invalidateJournalIndexCache();

  Hooks.on('createJournalEntry', invalidate);
  Hooks.on('deleteJournalEntry', invalidate);
  Hooks.on('updateJournalEntry', (entry: JournalEntry, changes: Record<string, unknown>) => {
    if (changes.flags) invalidate();
    else {
      const flag = entry.getFlag('mastery-system', 'calendar');
      if (flag) invalidate();
    }
  });

  Hooks.on('settingChange', (scope: string, key: string) => {
    if (scope === 'mastery-system' && key === 'currentDayIndex') {
      TyhraCalendarApplication.requestRefresh();
    }
  });
}
