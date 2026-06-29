/**
 * Epic Mastery Roll — live session overlay.
 */
import { countResolvedParticipants, rollLabelForConfig, } from './epic-mastery-roll-types.js';
import { performEpicParticipantRoll } from './epic-mastery-roll-roll.js';
const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;
const BaseApp = HandlebarsApplicationMixin(ApplicationV2);
export class EpicMasteryRollApp extends BaseApp {
    session;
    rolling = false;
    static DEFAULT_OPTIONS = {
        id: 'mastery-epic-roll-session',
        classes: ['mastery-system', 'epic-mastery-roll-app'],
        position: { width: 520, height: 'auto' },
        window: {
            title: 'Epic Mastery Roll',
            resizable: true,
            minimizable: false,
        },
    };
    static PARTS = {
        content: {
            template: 'systems/mastery-system/templates/epic-roll/session-app.hbs',
        },
    };
    constructor(session) {
        super();
        this.session = session;
    }
    async _prepareContext(_options) {
        const rollLabel = rollLabelForConfig(this.session.roll);
        const resolved = countResolvedParticipants(this.session);
        const total = this.session.participants.length;
        const isGM = !!game.user?.isGM;
        const userId = game.user?.id;
        const participants = this.session.participants.map((p) => {
            const actor = game.actors?.get(p.actorId);
            const isOwner = isGM || !!actor?.isOwner;
            const result = this.session.results[p.actorId];
            return {
                ...p,
                isOwner,
                canRoll: p.status === 'pending' && isOwner && this.session.status === 'active',
                canSkip: isGM && p.status === 'pending' && this.session.status === 'active',
                result,
                success: result?.success,
                skipped: result?.skipped,
            };
        });
        return {
            session: this.session,
            rollLabel,
            resolved,
            total,
            isGM,
            isActive: this.session.status === 'active',
            showTn: this.session.showTn,
            tn: this.session.tn,
            participants,
            rolling: this.rolling,
            userId,
        };
    }
    async _onRender(context, options) {
        await super._onRender(context, options);
        const root = this.element;
        root.querySelectorAll('[data-action="emr-roll"]').forEach((btn) => {
            btn.onclick = async (ev) => {
                ev.preventDefault();
                if (this.rolling || this.session.status !== 'active')
                    return;
                const actorId = btn.dataset.actorId;
                if (!actorId)
                    return;
                this.rolling = true;
                btn.setAttribute('disabled', 'true');
                try {
                    await performEpicParticipantRoll(this.session, actorId);
                }
                finally {
                    this.rolling = false;
                    this.render(false);
                }
            };
        });
        root.querySelectorAll('[data-action="emr-skip"]').forEach((btn) => {
            btn.onclick = async (ev) => {
                ev.preventDefault();
                const actorId = btn.dataset.actorId;
                if (!actorId)
                    return;
                const { skipEpicMasteryRollParticipant } = await import('./epic-mastery-roll-session.js');
                await skipEpicMasteryRollParticipant(actorId);
            };
        });
        const cancelBtn = root.querySelector('[data-action="emr-cancel"]');
        if (cancelBtn) {
            cancelBtn.onclick = async (ev) => {
                ev.preventDefault();
                const { cancelEpicMasteryRollSession } = await import('./epic-mastery-roll-session.js');
                await cancelEpicMasteryRollSession();
            };
        }
    }
    updateSession(session) {
        this.session = session;
        this.render(false);
    }
}
let activeApp = null;
export async function openEpicMasteryRollApp(session) {
    if (session.status === 'complete' || session.status === 'cancelled') {
        closeEpicMasteryRollApp();
        return;
    }
    if (activeApp) {
        activeApp.updateSession(session);
        activeApp.bringToFront();
        return;
    }
    activeApp = new EpicMasteryRollApp(session);
    await activeApp.render(true);
}
export function closeEpicMasteryRollApp() {
    if (activeApp) {
        activeApp.close();
        activeApp = null;
    }
}
export function getEpicMasteryRollApp() {
    return activeApp;
}
//# sourceMappingURL=epic-mastery-roll-app.js.map