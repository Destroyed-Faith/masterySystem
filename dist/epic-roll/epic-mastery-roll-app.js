/**
 * Epic Mastery Roll — full-screen cinematic overlay.
 */
import { buildEpicDiceFaces, countResolvedParticipants, rollLabelForConfig, } from './epic-mastery-roll-types.js';
import { canSpendEpicRerollPoint, confirmEpicRollWithoutSpend, performEpicParticipantReroll, performEpicParticipantRoll, } from './epic-mastery-roll-roll.js';
import { portraitFallbackSrc, resolveActorPortraitSrc } from './epic-mastery-roll-portraits.js';
const TEMPLATE = 'systems/mastery-system/templates/epic-roll/session-cinematic.hbs';
class EpicMasteryRollOverlay {
    session;
    root = null;
    rolling = false;
    renderSeq = 0;
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
            let showReroll = false;
            let showFailureActions = false;
            const displayTotal = result?.total ?? 0;
            const displaySuccess = !!result?.success;
            if (awaitingSpend && isOwner && result && !result.success) {
                showFailureActions = true;
                showReroll = !result.rerolled && canSpendEpicRerollPoint(actor);
            }
            const canRoll = p.status === 'pending' && isOwner && this.session.status === 'active';
            const showRollResult = (awaitingSpend || rolled) && !!result && !skipped;
            const diceFaces = showRollResult && result?.diceFaces?.length
                ? result.diceFaces
                : showRollResult && result?.rollPayload?.rollResult
                    ? buildEpicDiceFaces(result.rollPayload.rollResult)
                    : [];
            const displayRaises = result?.raises ?? 0;
            return {
                ...p,
                portrait: resolveActorPortraitSrc(actor, p.img),
                isOwner,
                result,
                success: displaySuccess,
                displayTotal,
                displayRaises,
                skipped,
                canRoll,
                awaitingSpend,
                showRollResult,
                showResultFrame: showRollResult,
                diceFaces,
                showDiceFaces: diceFaces.length > 0,
                showFinalMeta: rolled && !!result?.rerolled,
                waiting: p.status === 'pending' && !isOwner,
                showFailureActions,
                showReroll,
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
        if (this.session.status !== 'active') {
            this.close();
            return;
        }
        const seq = ++this.renderSeq;
        const context = await this.buildContext();
        const html = await foundry.applications.handlebars.renderTemplate(TEMPLATE, context);
        if (seq !== this.renderSeq)
            return;
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
        const fallback = portraitFallbackSrc();
        root.querySelectorAll('.emr-portrait-img, .emr-actor-thumb').forEach((img) => {
            img.onerror = () => {
                if (img.src !== fallback)
                    img.src = fallback;
            };
        });
        root.querySelectorAll('[data-action="emr-roll"]').forEach((btn) => {
            btn.onclick = async (ev) => {
                ev.preventDefault();
                if (this.rolling || this.session.status !== 'active' || btn.hasAttribute('disabled'))
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
        root.querySelectorAll('[data-action="emr-reroll"]').forEach((btn) => {
            btn.onclick = async (ev) => {
                ev.preventDefault();
                if (this.rolling || this.session.status !== 'active' || btn.hasAttribute('disabled'))
                    return;
                const actorId = btn.dataset.actorId;
                if (!actorId)
                    return;
                this.rolling = true;
                btn.setAttribute('disabled', 'true');
                try {
                    await performEpicParticipantReroll(this.session, actorId);
                }
                finally {
                    this.rolling = false;
                }
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
    if (session.status !== 'active') {
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