/**
 * Actor-facing artifact evolution: link, upgrade along tree; path preview.
 *
 * New XP spec — Artifacts:
 *   • Link: free (still gated by MR ≥ 2).
 *   • Upgrade: 8 XP per +1 artifact level. No Stone cost.
 *   • Maximum reachable level = `(MR - 1) × 2`, capped at 16.
 *   • Each Artifact may only be upgraded once per Upgrade Step (new
 *     once-per-step rule shared with Attributes / Skills / Powers).
 *   • Legacy "Ultimate" path and all per-link / per-upgrade Stone costs
 *     have been removed.
 */
import { ARTIFACT_CAPACITY_DEFAULT, ARTIFACT_MAX_SYSTEM_LEVEL, ARTIFACT_UPGRADE_XP_COST, canArtifactLink, canBindMoreArtifacts, countBoundArtifacts, getArtifactBindingKind, getMaxArtifactSystemLevelForMasteryRank, readActorArtifactProgress, serializeActorArtifactProgress } from '../utils/artifact-actor-rules.js';
import { buildArtifactDisplayLabels, collectArtifactNodeMeta, getChildWorldItemsForNode, getWorldArtifactItemsInFolder, resolveWorldItemByNodeId } from '../utils/artifact-actor-tree.js';
import { isBumped, recordBump } from '../utils/xp-step-rule.js';
const BaseApp = foundry?.appv1?.Application || Application;
function actorXpAvailable(actor) {
    return actor.system?.points?.xp ?? 0;
}
async function spendActorXp(actor, amount) {
    const avail = actorXpAvailable(actor);
    if (avail < amount)
        return false;
    const spent = actor.system?.xp?.totalSpent ?? 0;
    await actor.update({
        'system.points.xp': avail - amount,
        'system.xp.totalSpent': spent + amount
    });
    return true;
}
export class ArtifactEvolutionDialog extends BaseApp {
    actor;
    constructor(actor) {
        super();
        this.actor = actor;
    }
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions || {}, {
            id: 'artifact-evolution-dialog',
            title: 'Artifact evolution',
            template: 'systems/mastery-system/templates/artifacts/artifact-evolution-dialog.hbs',
            classes: ['mastery-system', 'artifact-evolution-dialog'],
            width: 560,
            height: 640,
            resizable: true
        });
    }
    buildCards() {
        const A = this.actor;
        const items = Array.from(A.items.filter((i) => i.type === 'artifact'));
        const cards = [];
        const masteryRank = this.actor.system?.mastery?.rank ?? 1;
        const maxSys = getMaxArtifactSystemLevelForMasteryRank(masteryRank);
        const boundCount = countBoundArtifacts(this.actor);
        const canBindOneMore = canBindMoreArtifacts(this.actor);
        const stepState = {
            attributes: [],
            skills: [],
            powers: [],
            artifacts: Array.isArray(this.actor.system?.xp?.currentStep?.artifacts)
                ? this.actor.system.xp.currentStep.artifacts.map((v) => String(v ?? ''))
                : [],
        };
        for (const emb of items) {
            const rootWorldId = emb.getFlag('mastery-system', 'evolutionRootItemId');
            const embeddedNodeId = emb.getFlag('mastery-system', 'evolutionNodeId');
            if (!rootWorldId || !embeddedNodeId)
                continue;
            const rootWorld = game.items?.get(rootWorldId);
            if (!rootWorld || rootWorld.type !== 'artifact')
                continue;
            const folderId = rootWorld.folder?.id;
            if (!folderId)
                continue;
            const folderItems = getWorldArtifactItemsInFolder(folderId);
            const metaMap = collectArtifactNodeMeta(folderItems);
            const labels = buildArtifactDisplayLabels(metaMap);
            const rootNodeId = rootWorld.getFlag('mastery-system', 'nodeId');
            const actorLevels = (rootWorld.getFlag('mastery-system', 'actorLevels') || {});
            const rawProg = actorLevels[A.id];
            let progress = readActorArtifactProgress(rawProg, rootNodeId);
            if (embeddedNodeId && progress.nodeId !== embeddedNodeId) {
                progress = { ...progress, nodeId: embeddedNodeId };
            }
            const currentWorld = resolveWorldItemByNodeId(progress.nodeId, folderItems);
            if (!currentWorld)
                continue;
            const currentSysLevel = currentWorld.system?.level ?? 1;
            const childItems = getChildWorldItemsForNode(progress.nodeId, folderItems);
            const embeddedId = String(emb.id);
            const alreadyBumped = isBumped(stepState, 'artifact', embeddedId);
            const bindingKind = getArtifactBindingKind(emb);
            const isEchoBound = bindingKind === 'echo';
            let linkDisabledReason = '';
            if (progress.linked) {
                linkDisabledReason = '';
            }
            else if (isEchoBound) {
                linkDisabledReason = 'Echo-bound artifacts are always linked.';
            }
            else if (!canArtifactLink(masteryRank)) {
                linkDisabledReason = 'Mastery Rank 2+ required to link.';
            }
            else if (!canBindOneMore) {
                linkDisabledReason = `Artifact Capacity full (${boundCount}/${ARTIFACT_CAPACITY_DEFAULT}). Unbind an Artifact first.`;
            }
            const paths = childItems.map((child) => {
                const cid = child.getFlag('mastery-system', 'nodeId');
                const tl = child.system?.level ?? currentSysLevel + 1;
                let disabledReason = '';
                if (!progress.linked)
                    disabledReason = 'Link the artifact first.';
                else if (!canArtifactLink(masteryRank))
                    disabledReason = 'Mastery Rank 2+ required to link.';
                else if (tl > maxSys)
                    disabledReason = `Your MR allows artifact level up to ${maxSys} only.`;
                else if (actorXpAvailable(this.actor) < ARTIFACT_UPGRADE_XP_COST)
                    disabledReason = 'Not enough XP.';
                else if (alreadyBumped)
                    disabledReason = 'Already upgraded this Upgrade Step.';
                const ch = child;
                return {
                    worldItemId: ch.id,
                    nodeId: cid,
                    label: labels.get(cid) || ch.name,
                    targetLevel: tl,
                    disabledReason
                };
            });
            const atMax = currentSysLevel >= maxSys && maxSys >= 1;
            const rw = rootWorld;
            cards.push({
                embeddedId,
                displayName: rw.name?.replace(/\s*-\s*Level\s*1-1\s*$/i, '').trim() || emb.name,
                rootWorldId: rw.id,
                folderId,
                masteryRank,
                maxSystemLevel: maxSys,
                canLinkRules: canArtifactLink(masteryRank),
                linked: progress.linked,
                progress,
                currentSystemLevel: currentSysLevel,
                currentLabel: labels.get(progress.nodeId) || `Level ${currentSysLevel}`,
                xp: actorXpAvailable(this.actor),
                paths,
                atMaxTierForMr: atMax,
                bindingKind,
                isEchoBound,
                linkDisabledReason,
            });
        }
        return cards;
    }
    getData(_options) {
        const data = super.getData ? super.getData(_options) : {};
        data.actor = this.actor;
        data.cards = this.buildCards();
        const boundCount = countBoundArtifacts(this.actor);
        data.capacity = {
            bound: boundCount,
            max: ARTIFACT_CAPACITY_DEFAULT,
            full: boundCount >= ARTIFACT_CAPACITY_DEFAULT,
        };
        data.constants = {
            upXp: ARTIFACT_UPGRADE_XP_COST,
            maxLevel: ARTIFACT_MAX_SYSTEM_LEVEL
        };
        return data;
    }
    activateListeners(html) {
        super.activateListeners(html);
        html.find('[data-action="ae-close"]').on('click', () => this.close());
        html.on('click', '[data-action="ae-link"]', async (e) => {
            const rootId = $(e.currentTarget).data('root-id');
            const embId = $(e.currentTarget).data('emb-id');
            await this.onLink(String(rootId), String(embId));
        });
        html.on('click', '[data-action="ae-upgrade"]', async (e) => {
            const rootId = $(e.currentTarget).data('root-id');
            const embId = $(e.currentTarget).data('emb-id');
            const targetWorldId = $(e.currentTarget).data('target-world-id');
            const targetNodeId = $(e.currentTarget).data('target-node-id');
            await this.onUpgrade(String(rootId), String(embId), String(targetWorldId), String(targetNodeId));
        });
    }
    async onLink(rootWorldId, embeddedId) {
        const A = this.actor;
        if (!A.isOwner)
            return;
        const mr = this.actor.system?.mastery?.rank ?? 1;
        if (!canArtifactLink(mr)) {
            ui.notifications?.warn('Mastery Rank 2+ is required to link an artifact.');
            return;
        }
        const root = game.items?.get(rootWorldId);
        if (!root)
            return;
        const rootNodeId = root.getFlag('mastery-system', 'nodeId');
        const levels = { ...(root.getFlag('mastery-system', 'actorLevels') || {}) };
        const cur = readActorArtifactProgress(levels[A.id], rootNodeId);
        if (cur.linked) {
            ui.notifications?.info('Already linked.');
            return;
        }
        // Artifact Capacity check: linking an unbound artifact promotes it
        // to "bound" and consumes one of the actor's four capacity slots.
        const emb = A.items.get(embeddedId);
        if (emb) {
            const currentKind = getArtifactBindingKind(emb);
            if (currentKind === 'unbound' && !canBindMoreArtifacts(this.actor)) {
                ui.notifications?.warn(`Artifact Capacity full (${countBoundArtifacts(this.actor)}/${ARTIFACT_CAPACITY_DEFAULT}). Unbind another Artifact first.`);
                return;
            }
        }
        const next = { ...cur, linked: true };
        levels[A.id] = serializeActorArtifactProgress(next);
        await root.setFlag('mastery-system', 'actorLevels', levels);
        // Promote the binding to `bound` so it counts toward Artifact Capacity
        // (echo-bound items keep their `echo` binding).
        if (emb) {
            const currentKind = getArtifactBindingKind(emb);
            if (currentKind === 'unbound') {
                try {
                    await emb.update({ 'system.binding': 'bound' });
                }
                catch (err) {
                    console.warn('[mastery-system] could not set binding=bound on artifact', err);
                }
            }
        }
        ui.notifications?.info('Artifact linked. You can now spend XP to evolve along the tree.');
        await this.render(false);
    }
    async onUpgrade(rootWorldId, embeddedId, targetWorldItemId, targetNodeId) {
        const A = this.actor;
        if (!A.isOwner)
            return;
        const root = game.items?.get(rootWorldId);
        const targetWorld = game.items?.get(targetWorldItemId);
        const emb = A.items.get(embeddedId);
        if (!root || !targetWorld || !emb)
            return;
        const mr = this.actor.system?.mastery?.rank ?? 1;
        const maxSys = getMaxArtifactSystemLevelForMasteryRank(mr);
        const rootNodeId = root.getFlag('mastery-system', 'nodeId');
        const levels = { ...(root.getFlag('mastery-system', 'actorLevels') || {}) };
        const prog = readActorArtifactProgress(levels[A.id], rootNodeId);
        if (!prog.linked) {
            ui.notifications?.warn('Link the artifact first.');
            return;
        }
        const tl = targetWorld.system?.level ?? 1;
        if (tl > maxSys) {
            ui.notifications?.warn(`Your Mastery Rank allows artifact level up to ${maxSys} only.`);
            return;
        }
        const folderId = root.folder?.id;
        const folderItems = getWorldArtifactItemsInFolder(folderId);
        const currentWorld = resolveWorldItemByNodeId(prog.nodeId, folderItems);
        if (!currentWorld)
            return;
        const tw = targetWorld;
        const allowedChildren = getChildWorldItemsForNode(prog.nodeId, folderItems).map((c) => c.id);
        if (!allowedChildren.includes(tw.id)) {
            ui.notifications?.error('Invalid evolution step.');
            return;
        }
        /**
         * New spec — once-per-step rule. Each Artifact may only be upgraded
         * once per Upgrade Step. Read the actor's current step bucket and
         * reject the click if this artifact is already in the list.
         */
        const stepRaw = this.actor.system?.xp?.currentStep ?? {};
        const stepNow = {
            attributes: Array.isArray(stepRaw.attributes) ? [...stepRaw.attributes] : [],
            skills: Array.isArray(stepRaw.skills) ? [...stepRaw.skills] : [],
            powers: Array.isArray(stepRaw.powers) ? [...stepRaw.powers] : [],
            artifacts: Array.isArray(stepRaw.artifacts) ? [...stepRaw.artifacts] : [],
        };
        if (isBumped(stepNow, 'artifact', embeddedId)) {
            ui.notifications?.warn('This artifact was already upgraded this Upgrade Step. End the current step first to upgrade it again.');
            return;
        }
        if (!(await spendActorXp(this.actor, ARTIFACT_UPGRADE_XP_COST))) {
            ui.notifications?.warn(`Not enough XP (need ${ARTIFACT_UPGRADE_XP_COST}).`);
            return;
        }
        // Record the bump in the step bucket.
        const stepAfter = recordBump(stepNow, 'artifact', embeddedId);
        await this.actor.update({
            'system.xp.currentStep.attributes': [...stepAfter.attributes],
            'system.xp.currentStep.skills': [...stepAfter.skills],
            'system.xp.currentStep.powers': [...stepAfter.powers],
            'system.xp.currentStep.artifacts': [...stepAfter.artifacts],
        });
        const equip = emb.getFlag('mastery-system', 'equipment');
        const sys = foundry.utils.duplicate(targetWorld.system || {});
        await emb.update({
            name: targetWorld.name,
            img: targetWorld.img,
            system: sys
        });
        await emb.setFlag('mastery-system', 'evolutionRootItemId', rootWorldId);
        await emb.setFlag('mastery-system', 'evolutionNodeId', targetNodeId);
        if (equip)
            await emb.setFlag('mastery-system', 'equipment', equip);
        const nextProg = {
            nodeId: targetNodeId,
            linked: true,
        };
        levels[A.id] = serializeActorArtifactProgress(nextProg);
        await root.setFlag('mastery-system', 'actorLevels', levels);
        ui.notifications?.info(`Evolved to ${tw.name}.`);
        await this.render(false);
    }
}
export async function openArtifactEvolutionDialog(actor) {
    const dlg = new ArtifactEvolutionDialog(actor);
    dlg.render(true);
}
//# sourceMappingURL=artifact-evolution-dialog.js.map