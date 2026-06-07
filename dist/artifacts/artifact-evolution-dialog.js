/**
 * Actor-facing artifact evolution: activate (1 Stone), upgrade along tree.
 *
 *   • Activate / link: 1 Stone once (MR ≥ 2).
 *   • Upgrade: 8 XP per +1 artifact level.
 *   • Maximum reachable level = `(MR - 1) × 2`, capped at 16.
 *   • Each Artifact may only be upgraded once per Upgrade Step.
 */
import { ARTIFACT_CAPACITY_DEFAULT, ARTIFACT_LINK_STONE_COST, ARTIFACT_MAX_SYSTEM_LEVEL, ARTIFACT_UPGRADE_XP_COST, countBoundArtifacts, } from '../utils/artifact-actor-rules.js';
import { repairActorEchoArtifacts } from '../utils/artifact-echo-repair.js';
import { buildArtifactEvolutionCards, linkArtifactForActor, upgradeArtifactForActor, } from './artifact-evolution-actions.js';
const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;
const BaseDialog = HandlebarsApplicationMixin(ApplicationV2);
export class ArtifactEvolutionDialog extends BaseDialog {
    actor;
    static DEFAULT_OPTIONS = {
        id: 'artifact-evolution-dialog',
        classes: ['mastery-system', 'artifact-evolution-dialog'],
        position: { width: 560, height: 640 },
        window: {
            title: 'Echo & Artifact Progression',
            resizable: true,
        },
    };
    static PARTS = {
        content: { template: 'systems/mastery-system/templates/artifacts/artifact-evolution-dialog.hbs' },
    };
    constructor(actor, options = {}) {
        const mergedOptions = foundry.utils.mergeObject(ArtifactEvolutionDialog.DEFAULT_OPTIONS, options);
        super(mergedOptions);
        this.actor = actor;
    }
    async _prepareContext(_options) {
        const boundCount = countBoundArtifacts(this.actor);
        return {
            actor: this.actor,
            cards: buildArtifactEvolutionCards(this.actor),
            capacity: {
                bound: boundCount,
                max: ARTIFACT_CAPACITY_DEFAULT,
                full: boundCount >= ARTIFACT_CAPACITY_DEFAULT,
            },
            constants: {
                linkStone: ARTIFACT_LINK_STONE_COST,
                upXp: ARTIFACT_UPGRADE_XP_COST,
                maxLevel: ARTIFACT_MAX_SYSTEM_LEVEL,
            },
        };
    }
    async _onRender(_context, _options) {
        const root = this.element;
        if (!root)
            return;
        const closeBtn = root.querySelector('[data-action="ae-close"]');
        if (closeBtn) {
            closeBtn.onclick = (ev) => {
                ev.preventDefault();
                this.close();
            };
        }
        root.querySelectorAll('[data-action="ae-link"]').forEach((btn) => {
            btn.onclick = async (ev) => {
                ev.preventDefault();
                const rootId = btn.dataset.rootId;
                const embId = btn.dataset.embId;
                const ok = await linkArtifactForActor(this.actor, String(rootId), String(embId));
                if (ok)
                    await this.render({ force: true });
            };
        });
        root.querySelectorAll('[data-action="ae-upgrade"]').forEach((btn) => {
            btn.onclick = async (ev) => {
                ev.preventDefault();
                const rootId = btn.dataset.rootId;
                const embId = btn.dataset.embId;
                const targetWorldId = btn.dataset.targetWorldId;
                const targetNodeId = btn.dataset.targetNodeId;
                const ok = await upgradeArtifactForActor(this.actor, String(rootId), String(embId), String(targetWorldId), String(targetNodeId));
                if (ok)
                    await this.render({ force: true });
            };
        });
    }
}
export async function openArtifactEvolutionDialog(actor) {
    try {
        await repairActorEchoArtifacts(actor);
    }
    catch (err) {
        console.warn('[mastery-system] echo artifact repair failed', err);
    }
    const existing = foundry.applications.instances.get('artifact-evolution-dialog');
    if (existing) {
        existing.bringToFront?.();
        await existing.render({ force: true });
        return;
    }
    const dlg = new ArtifactEvolutionDialog(actor);
    dlg.render(true);
}
//# sourceMappingURL=artifact-evolution-dialog.js.map