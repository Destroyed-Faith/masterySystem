/**
 * Actor-facing artifact evolution: link, upgrade along tree, ultimate unlock; path preview.
 */
import { ARTIFACT_LINK_STONE_COST, ARTIFACT_MAX_SYSTEM_LEVEL, ARTIFACT_ULTIMATE_XP_COST, ARTIFACT_UPGRADE_STONE_COST, ARTIFACT_UPGRADE_XP_COST, canArtifactLink, canUnlockArtifactUltimate, getMaxArtifactSystemLevelForMasteryRank, readActorArtifactProgress, serializeActorArtifactProgress } from '../utils/artifact-actor-rules.js';
import { buildArtifactDisplayLabels, collectArtifactNodeMeta, getChildWorldItemsForNode, getWorldArtifactItemsInFolder, resolveWorldItemByNodeId } from '../utils/artifact-actor-tree.js';
const BaseApp = foundry?.appv1?.Application || Application;
function actorXpAvailable(actor) {
    return actor.system?.points?.xp ?? 0;
}
function actorStonesCurrent(actor) {
    return actor.system?.stones?.current ?? 0;
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
async function spendActorStones(actor, amount) {
    const cur = actorStonesCurrent(actor);
    if (cur < amount)
        return false;
    await actor.update({ 'system.stones.current': cur - amount });
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
            const paths = childItems.map((child) => {
                const cid = child.getFlag('mastery-system', 'nodeId');
                const tl = child.system?.level ?? currentSysLevel + 1;
                let disabledReason = '';
                if (!progress.linked)
                    disabledReason = 'Link the artifact first (1 stone).';
                else if (!canArtifactLink(masteryRank))
                    disabledReason = 'Mastery Rank 2+ required to link.';
                else if (tl > maxSys)
                    disabledReason = `Your MR allows artifact level up to ${maxSys} only.`;
                else if (actorStonesCurrent(this.actor) < ARTIFACT_UPGRADE_STONE_COST)
                    disabledReason = 'Not enough stones.';
                else if (actorXpAvailable(this.actor) < ARTIFACT_UPGRADE_XP_COST)
                    disabledReason = 'Not enough XP.';
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
            const canUlt = canUnlockArtifactUltimate(masteryRank) && atMax && progress.linked && currentSysLevel >= ARTIFACT_MAX_SYSTEM_LEVEL;
            const rw = rootWorld;
            cards.push({
                embeddedId: emb.id,
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
                stones: actorStonesCurrent(this.actor),
                xp: actorXpAvailable(this.actor),
                paths,
                canUltimate: Boolean(canUlt),
                ultimateUnlocked: Boolean(progress.ultimateUnlocked),
                atMaxTierForMr: atMax
            });
        }
        return cards;
    }
    getData(_options) {
        const data = super.getData ? super.getData(_options) : {};
        data.actor = this.actor;
        data.cards = this.buildCards();
        data.constants = {
            linkStone: ARTIFACT_LINK_STONE_COST,
            upStone: ARTIFACT_UPGRADE_STONE_COST,
            upXp: ARTIFACT_UPGRADE_XP_COST,
            ultXp: ARTIFACT_ULTIMATE_XP_COST,
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
        html.on('click', '[data-action="ae-ultimate"]', async (e) => {
            const rootId = $(e.currentTarget).data('root-id');
            const embId = $(e.currentTarget).data('emb-id');
            await this.onUltimate(String(rootId), String(embId));
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
        if (!(await spendActorStones(this.actor, ARTIFACT_LINK_STONE_COST))) {
            ui.notifications?.warn(`Not enough stones (need ${ARTIFACT_LINK_STONE_COST}).`);
            return;
        }
        const next = { ...cur, linked: true };
        levels[A.id] = serializeActorArtifactProgress(next);
        await root.setFlag('mastery-system', 'actorLevels', levels);
        ui.notifications?.info('Artifact linked. You can now spend stones + XP to evolve along the tree.');
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
        if (!(await spendActorStones(this.actor, ARTIFACT_UPGRADE_STONE_COST))) {
            ui.notifications?.warn(`Not enough stones (need ${ARTIFACT_UPGRADE_STONE_COST}).`);
            return;
        }
        if (!(await spendActorXp(this.actor, ARTIFACT_UPGRADE_XP_COST))) {
            ui.notifications?.warn(`Not enough XP (need ${ARTIFACT_UPGRADE_XP_COST}).`);
            return;
        }
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
            ultimateUnlocked: prog.ultimateUnlocked
        };
        levels[A.id] = serializeActorArtifactProgress(nextProg);
        await root.setFlag('mastery-system', 'actorLevels', levels);
        ui.notifications?.info(`Evolved to ${tw.name}.`);
        await this.render(false);
    }
    async onUltimate(rootWorldId, _embeddedId) {
        const A = this.actor;
        if (!A.isOwner)
            return;
        if (!canUnlockArtifactUltimate(this.actor.system?.mastery?.rank ?? 1)) {
            ui.notifications?.warn('Ultimate unlock requires Mastery Rank 6.');
            return;
        }
        const root = game.items?.get(rootWorldId);
        if (!root)
            return;
        const rootNodeId = root.getFlag('mastery-system', 'nodeId');
        const levels = { ...(root.getFlag('mastery-system', 'actorLevels') || {}) };
        const prog = readActorArtifactProgress(levels[A.id], rootNodeId);
        if (!prog.linked) {
            ui.notifications?.warn('Link the artifact first.');
            return;
        }
        const folderItems = getWorldArtifactItemsInFolder(root.folder?.id);
        const cur = resolveWorldItemByNodeId(prog.nodeId, folderItems);
        const sl = cur?.system?.level ?? 1;
        if (sl < ARTIFACT_MAX_SYSTEM_LEVEL) {
            ui.notifications?.warn(`Reach artifact level ${ARTIFACT_MAX_SYSTEM_LEVEL} first.`);
            return;
        }
        if (prog.ultimateUnlocked) {
            ui.notifications?.info('Ultimate already unlocked.');
            return;
        }
        if (!(await spendActorXp(this.actor, ARTIFACT_ULTIMATE_XP_COST))) {
            ui.notifications?.warn(`Not enough XP (need ${ARTIFACT_ULTIMATE_XP_COST}).`);
            return;
        }
        const next = { ...prog, ultimateUnlocked: true };
        levels[A.id] = serializeActorArtifactProgress(next);
        await root.setFlag('mastery-system', 'actorLevels', levels);
        ui.notifications?.info('Ultimate unlocked for this artifact (narrative / mechanical effects: define with your GM).');
        await this.render(false);
    }
}
export async function openArtifactEvolutionDialog(actor) {
    const dlg = new ArtifactEvolutionDialog(actor);
    dlg.render(true);
}
//# sourceMappingURL=artifact-evolution-dialog.js.map