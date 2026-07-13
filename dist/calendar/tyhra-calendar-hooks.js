/**
 * Tyhra calendar — hooks, sidebar button, cache invalidation.
 */
import { exposeTyhraCalendarApi } from './tyhra-calendar-api.js';
import { TyhraCalendarApplication } from './tyhra-calendar-application.js';
import { invalidateJournalIndexCache } from './tyhra-calendar-journal-service.js';
import { registerTyhraCalendarSettings, canUserOpenCalendar, isCalendarEnabled } from './tyhra-calendar-settings.js';
function injectJournalSidebarButton(html) {
    if (!isCalendarEnabled() || !canUserOpenCalendar())
        return;
    const root = html instanceof HTMLElement ? html : html[0];
    if (!root)
        return;
    const headerActions = root.querySelector('.directory-header .header-actions') ??
        root.querySelector('.header-actions');
    if (!headerActions || headerActions.querySelector('.df-calendar-launch'))
        return;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'df-calendar-launch';
    button.title = game.i18n.localize('MASTERY.calendar.openCalendar');
    button.innerHTML = '<i class="fas fa-calendar-days"></i>';
    button.addEventListener('click', (ev) => {
        ev.preventDefault();
        game.masterySystem?.calendar?.open?.();
    });
    headerActions.prepend(button);
}
export function initializeTyhraCalendar() {
    registerTyhraCalendarSettings();
    exposeTyhraCalendarApi();
    Hooks.on('renderJournalDirectory', (_app, html) => {
        injectJournalSidebarButton(html);
    });
    Hooks.on('renderSidebarTab', (app, html) => {
        if (app?.tabName === 'journal')
            injectJournalSidebarButton(html);
    });
    const invalidate = () => invalidateJournalIndexCache();
    Hooks.on('createJournalEntry', invalidate);
    Hooks.on('deleteJournalEntry', invalidate);
    Hooks.on('updateJournalEntry', (entry, changes) => {
        if (changes.flags)
            invalidate();
        else {
            const flag = entry.getFlag('mastery-system', 'calendar');
            if (flag)
                invalidate();
        }
    });
    Hooks.on('settingChange', (scope, key) => {
        if (scope === 'mastery-system' && key === 'currentDayIndex') {
            TyhraCalendarApplication.requestRefresh();
        }
    });
}
//# sourceMappingURL=tyhra-calendar-hooks.js.map