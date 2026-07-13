/**
 * Tyhra Calendar — ApplicationV2 window.
 */
import { TYHRA_CALENDAR } from './tyhra-calendar-config.js';
import { createTyhraCalendarApi } from './tyhra-calendar-api.js';
import { buildJournalIndex, openDayJournal } from './tyhra-calendar-journal-service.js';
import { canUserCreateDayJournals, canUserOpenCalendar, getCurrentDayIndex, getCurrentHour, getCurrentMinute, } from './tyhra-calendar-settings.js';
import { getDateFromDayIndex, getMonthIndexForDate, getMonthView, } from './tyhra-calendar-service.js';
const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;
const BaseDialog = HandlebarsApplicationMixin(ApplicationV2);
let refreshCallback = null;
export class TyhraCalendarApplication extends BaseDialog {
    viewYear;
    viewMonthIndex;
    static instance = null;
    static DEFAULT_OPTIONS = {
        id: 'tyhra-calendar-app',
        classes: ['mastery-system', 'df-calendar'],
        position: { width: 920, height: 780 },
        window: {
            title: 'MASTERY.calendar.title',
            resizable: true,
            icon: 'fa-solid fa-calendar-days',
        },
    };
    static PARTS = {
        content: { template: 'systems/mastery-system/templates/calendar/tyhra-calendar.hbs' },
    };
    constructor(options = {}) {
        const localizedTitle = game.i18n?.localize('MASTERY.calendar.title') ?? 'Tyhra Calendar';
        super(foundry.utils.mergeObject(TyhraCalendarApplication.DEFAULT_OPTIONS, {
            window: { title: localizedTitle },
        }));
        const current = getDateFromDayIndex(getCurrentDayIndex());
        this.viewYear = options.year ?? current.year;
        this.viewMonthIndex = options.monthIndex ?? getMonthIndexForDate(current);
    }
    static show(options = {}) {
        if (!canUserOpenCalendar()) {
            ui.notifications?.warn(game.i18n.localize('MASTERY.calendar.noPermission'));
            return;
        }
        if (TyhraCalendarApplication.instance?.rendered) {
            TyhraCalendarApplication.instance.bringToFront();
            return;
        }
        TyhraCalendarApplication.instance = new TyhraCalendarApplication(options);
        TyhraCalendarApplication.instance.render(true);
    }
    static requestRefresh() {
        refreshCallback?.();
    }
    async _prepareContext(_options) {
        const currentDayIndex = getCurrentDayIndex();
        const current = getDateFromDayIndex(currentDayIndex);
        const journalMap = buildJournalIndex();
        const view = getMonthView(this.viewYear, this.viewMonthIndex, {
            currentDayIndex,
            journalKeyToId: journalMap,
        });
        const canCreate = canUserCreateDayJournals();
        const dayTooltip = (hasJournal) => {
            if (hasJournal)
                return game.i18n.localize('MASTERY.calendar.openJournal');
            if (canCreate)
                return game.i18n.localize('MASTERY.calendar.createJournal');
            return game.i18n.localize('MASTERY.calendar.noJournalExists');
        };
        const viewDays = view.days.map((d) => ({
            ...d,
            tooltip: dayTooltip(d.hasJournal),
        }));
        const veilTooltip = dayTooltip(view.veil.hasJournal);
        const hour = getCurrentHour();
        const minute = getCurrentMinute();
        const timeLabel = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
        return {
            weekdays: TYHRA_CALENDAR.weekdays,
            view: {
                ...view,
                days: viewDays,
                veil: { ...view.veil, tooltip: veilTooltip },
            },
            leadingCells: Array.from({ length: view.leadingBlanks }, (_, i) => i),
            current: {
                ...current,
                isVeil: current.type === 'veil',
            },
            isGM: game.user?.isGM === true,
            timeLabel,
        };
    }
    #root() {
        const el = this.element;
        return el?.querySelector('.df-calendar') ?? el ?? null;
    }
    async _onRender(_context, _options) {
        const root = this.#root();
        if (!root)
            return;
        refreshCallback = () => {
            if (this.rendered)
                this.render(false);
        };
        root.querySelectorAll('[data-action]').forEach((btn) => {
            btn.addEventListener('click', (ev) => this.#onAction(ev));
        });
    }
    async close(options) {
        if (TyhraCalendarApplication.instance === this) {
            TyhraCalendarApplication.instance = null;
        }
        if (refreshCallback)
            refreshCallback = null;
        return super.close(options);
    }
    async #onAction(ev) {
        ev.preventDefault();
        const target = ev.currentTarget;
        const action = target.dataset.action;
        if (!action)
            return;
        const api = createTyhraCalendarApi();
        try {
            switch (action) {
                case 'prev-year':
                    this.viewYear -= 1;
                    await this.render(false);
                    break;
                case 'next-year':
                    this.viewYear += 1;
                    await this.render(false);
                    break;
                case 'prev-month':
                    if (this.viewMonthIndex <= 0) {
                        this.viewMonthIndex = TYHRA_CALENDAR.months.length - 1;
                        this.viewYear -= 1;
                    }
                    else {
                        this.viewMonthIndex -= 1;
                    }
                    await this.render(false);
                    break;
                case 'next-month':
                    if (this.viewMonthIndex >= TYHRA_CALENDAR.months.length - 1) {
                        this.viewMonthIndex = 0;
                        this.viewYear += 1;
                    }
                    else {
                        this.viewMonthIndex += 1;
                    }
                    await this.render(false);
                    break;
                case 'today': {
                    const cur = getDateFromDayIndex(getCurrentDayIndex());
                    this.viewYear = cur.year;
                    this.viewMonthIndex = getMonthIndexForDate(cur);
                    await this.render(false);
                    break;
                }
                case 'prev-day':
                    await api.advanceDays(-1);
                    await this.render(false);
                    break;
                case 'next-day':
                    await api.advanceDays(1);
                    await this.render(false);
                    break;
                case 'prev-hour':
                    await api.advanceHours(-1);
                    await this.render(false);
                    break;
                case 'next-hour':
                    await api.advanceHours(1);
                    await this.render(false);
                    break;
                case 'open-day':
                case 'open-veil': {
                    const dayIndex = Number(target.dataset.dayIndex);
                    if (!Number.isFinite(dayIndex))
                        return;
                    target.classList.add('df-calendar__day--busy');
                    try {
                        await openDayJournal({ dayIndex });
                        await this.render(false);
                    }
                    finally {
                        target.classList.remove('df-calendar__day--busy');
                    }
                    break;
                }
                default:
                    break;
            }
        }
        catch (error) {
            console.error('Destroyed Faith | Calendar | Action failed', action, error);
            ui.notifications?.error(game.i18n.localize('MASTERY.calendar.actionFailed'));
        }
    }
}
//# sourceMappingURL=tyhra-calendar-application.js.map