/**
 * Epic Mastery Roll — full-screen cinematic overlay.
 */
import { countResolvedParticipants, rollLabelForConfig, } from './epic-mastery-roll-types.js';
import { applyEpicSkillSpendAndFinalize, confirmEpicRollWithoutSpend, performEpicParticipantRoll, } from './epic-mastery-roll-roll.js';
import { getSkillSpendOptions } from './epic-mastery-roll-skill-spend.js';
const TEMPLATE = 'systems/mastery-system/templates/epic-roll/session-cinematic.hbs';
function portraitSrc(actor, fallback) {
    const raw = actor?.img || fallback || 'icons/svg/mystery-man.svg';
    try {
        return foundry.utils?.getRoute?.(raw) ?? raw;
    }
    catch {
        return raw;
    }
}
class EpicMasteryRollOverlay {
    session;
    root = null;
    rolling = false;
    constructor(session) {
        this.session = session;
    }
    async buildContext() {
        const rollLabel = rollLabelForConfig(this.session.roll);
        const resolved = countResolvedParticipants(this.session);
        const total = this.session.participants.length;
        const isGM = !!game.user?.isGM;
        const bandHue = this.session.bandHue ?? 350;
        const participants = this.session.participants.map((p) => {
            const actor = game.actors?.get(p.actorId);
            const isOwner = isGM || !!actor?.isOwner;
            const result = this.session.results[p.actorId];
            const awaitingSpend = p.status === 'awaiting_spend' && !!result?.awaitingConfirm;
            const rolled = p.status === 'rolled' && !!result && !result.skipped;
            const skipped = p.status === 'skipped' || result?.skipped;
            let skillSpendOptions = [];
            let skillPoolRemaining = 0;
            let skillRating = 0;
            let canSpend = false;
            if (awaitingSpend && result?.rollPayload && result.skillKey && isOwner) {
                const spend = getSkillSpendOptions(actor, result.skillKey, result.rollPayload.rollResult, result.rollPayload.baseModifier);
                skillPoolRemaining = spend.remainingPool;
                skillRating = spend.skillRating;
                skillSpendOptions = spend.options.map((opt) => ({
                    amount: opt.amount,
                    label: opt.label,
                    newTotal: opt.newTotal,
                    wouldSucceed: opt.success,
                }));
                canSpend = skillSpendOptions.length > 0;
            }
            return {
                ...p,
                portrait: portraitSrc(actor, p.img),
                isOwner,
                result,
                success: result?.success,
                skipped,
                canRoll: p.status === 'pending' && isOwner && this.session.status === 'active',
                canSkip: isGM && (p.status === 'pending' || p.status === 'awaiting_spend') && this.session.status === 'active',
                awaitingSpend,
                showResultFrame: awaitingSpend || rolled,
                showFinalResult: rolled,
                waiting: p.status === 'pending' && !isOwner,
                canSpend,
                skillSpendOptions,
                skillPoolRemaining,
                skillRating,
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
            bandHue,
        };
    }
    async render() {
        if (this.session.status === 'complete' || this.session.status === 'cancelled') {
            this.close();
            return;
        }
        const context = await this.buildContext();
        const html = await foundry.applications.handlebars.renderTemplate(TEMPLATE, context);
        if (!this.root) {
            this.root = document.createElement('div');
            this.root.id = 'mastery-epic-roll-cinematic-root';
            document.body.appendChild(this.root);
        }
        this.root.innerHTML = html;
        this.bind();
    }
    bind() {
        const root = this.root;
        if (!root)
            return;
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
                }
            };
        });
        root.querySelectorAll('[data-action="emr-spend"]').forEach((btn) => {
            btn.onclick = async (ev) => {
                ev.preventDefault();
                const actorId = btn.dataset.actorId;
                const amount = parseInt(btn.dataset.amount ?? '0', 10);
                if (!actorId || amount <= 0)
                    return;
                btn.setAttribute('disabled', 'true');
                await applyEpicSkillSpendAndFinalize(this.session, actorId, amount);
            };
        });
        root.querySelectorAll('[data-action="emr-confirm"]').forEach((btn) => {
            btn.onclick = async (ev) => {
                ev.preventDefault();
                const actorId = btn.dataset.actorId;
                if (!actorId)
                    return;
                btn.setAttribute('disabled', 'true');
                await confirmEpicRollWithoutSpend(this.session, actorId);
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
        void this.render();
    }
    close() {
        this.root?.remove();
        this.root = null;
    }
}
let activeOverlay = null;
export async function openEpicMasteryRollApp(session) {
    if (session.status === 'complete' || session.status === 'cancelled') {
        closeEpicMasteryRollApp();
        return;
    }
    if (activeOverlay) {
        activeOverlay.updateSession(session);
        return;
    }
    activeOverlay = new EpicMasteryRollOverlay(session);
    await activeOverlay.render();
}
export function closeEpicMasteryRollApp() {
    activeOverlay?.close();
    activeOverlay = null;
}
export function getEpicMasteryRollApp() {
    return activeOverlay;
}
//# sourceMappingURL=epic-mastery-roll-app.js.map