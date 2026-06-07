/**
 * Shared artifact link / upgrade actions for the Evolution dialog and
 * Equipment-tab controls on the character sheet.
 */
import { ARTIFACT_CAPACITY_DEFAULT, ARTIFACT_LINK_STONE_COST, ARTIFACT_UPGRADE_XP_COST, canArtifactLink, canBindMoreArtifacts, canSpendArtifactLinkStone, countBoundArtifacts, getArtifactBindingKind, getMaxArtifactSystemLevelForMasteryRank, isArtifactLinkedOnActor, readActorArtifactProgress, serializeActorArtifactProgress, spendArtifactLinkStone, usesStonePoolEconomy, } from '../utils/artifact-actor-rules.js';
import { summarizeEmbeddedArtifactDisplay } from '../utils/artifact-echo-repair.js';
import { buildArtifactDisplayLabels, collectArtifactNodeMeta, getChildWorldItemsForNode, getWorldArtifactItemsInFolder, resolveWorldItemByNodeId, } from '../utils/artifact-actor-tree.js';
import { isBumped, recordBump } from '../utils/xp-step-rule.js';
function actorXpAvailable(actor) {
    const sys = actor.system || {};
    const regular = Math.max(0, Number(sys.points?.xp) || 0);
    const free = Math.max(0, Number(sys.points?.xpFree) || 0);
    return regular + free;
}
async function spendActorXp(actor, amount) {
    const sys = actor.system || {};
    const free = Math.max(0, Number(sys.points?.xpFree) || 0);
    const regular = Math.max(0, Number(sys.points?.xp) || 0);
    if (free + regular < amount)
        return false;
    const fromFree = Math.min(free, amount);
    const fromRegular = amount - fromFree;
    const spent = (sys.xp?.totalSpent ?? 0);
    await actor.update({
        'system.points.xpFree': free - fromFree,
        'system.points.xp': regular - fromRegular,
        'system.xp.totalSpent': spent + amount,
    });
    return true;
}
function readStepArtifacts(actor) {
    const raw = actor.system?.xp?.currentStep?.artifacts;
    return Array.isArray(raw) ? raw.map((v) => String(v ?? '')) : [];
}
/** Build evolution cards for every tree-linked embedded artifact on the actor. */
export function buildArtifactEvolutionCards(actor) {
    const A = actor;
    const items = Array.from(A.items.filter((i) => i.type === 'artifact'));
    const cards = [];
    const masteryRank = actor.system?.mastery?.rank ?? 1;
    const maxSys = getMaxArtifactSystemLevelForMasteryRank(masteryRank);
    const boundCount = countBoundArtifacts(actor);
    const canBindOneMore = canBindMoreArtifacts(actor);
    const stepArtifacts = readStepArtifacts(actor);
    const stepState = {
        attributes: [],
        skills: [],
        powers: [],
        artifacts: stepArtifacts,
    };
    const stones = Math.max(0, Number(actor.system?.stones?.current) || 0);
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
        const linked = isArtifactLinkedOnActor(A, emb);
        const display = summarizeEmbeddedArtifactDisplay(emb, linked);
        let linkDisabledReason = '';
        if (linked) {
            linkDisabledReason = '';
        }
        else if (!canArtifactLink(masteryRank)) {
            linkDisabledReason = 'Mastery Rank 2+ required to activate.';
        }
        else if (!canSpendArtifactLinkStone(actor)) {
            linkDisabledReason = `Not enough Stones (need ${ARTIFACT_LINK_STONE_COST}).`;
        }
        else if (!isEchoBound && bindingKind === 'unbound' && !canBindOneMore) {
            linkDisabledReason = `Artifact Capacity full (${boundCount}/${ARTIFACT_CAPACITY_DEFAULT}). Unbind an Artifact first.`;
        }
        const paths = childItems.map((child) => {
            const cid = child.getFlag('mastery-system', 'nodeId');
            const tl = child.system?.level ?? currentSysLevel + 1;
            let disabledReason = '';
            if (!linked)
                disabledReason = 'Activate the artifact first.';
            else if (!canArtifactLink(masteryRank))
                disabledReason = 'Mastery Rank 2+ required.';
            else if (tl > maxSys)
                disabledReason = `Your MR allows artifact level up to ${maxSys} only.`;
            else if (actorXpAvailable(actor) < ARTIFACT_UPGRADE_XP_COST)
                disabledReason = 'Not enough XP.';
            else if (alreadyBumped)
                disabledReason = 'Already upgraded this Upgrade Step.';
            const ch = child;
            return {
                worldItemId: ch.id,
                nodeId: cid,
                label: labels.get(cid) || ch.name,
                targetLevel: tl,
                disabledReason,
            };
        });
        const nextUpgrade = paths.find((p) => !p.disabledReason) || null;
        const rw = rootWorld;
        cards.push({
            embeddedId,
            displayName: rw.name?.replace(/\s*-\s*Level\s*1-1\s*$/i, '').trim() || emb.name,
            rootWorldId: rw.id,
            folderId,
            masteryRank,
            maxSystemLevel: maxSys,
            canLinkRules: canArtifactLink(masteryRank),
            linked,
            progress,
            currentSystemLevel: currentSysLevel,
            currentLabel: labels.get(progress.nodeId) || `Level ${currentSysLevel}`,
            xp: actorXpAvailable(actor),
            stones,
            paths,
            atMaxTierForMr: linked && currentSysLevel >= maxSys && maxSys >= 1,
            bindingKind,
            isEchoBound,
            linkDisabledReason,
            canActivate: !linked && !linkDisabledReason,
            nextUpgrade: linked ? nextUpgrade : null,
            baseValues: display.baseValues,
            abilities: display.abilities,
            hasBaseValues: display.hasBaseValues,
            hasAbilities: display.hasAbilities,
        });
    }
    return cards;
}
/** Activate (link) an artifact — costs 1 Stone once from a chosen pool. */
export async function linkArtifactForActor(actor, rootWorldId, embeddedId, stoneAttr) {
    const A = actor;
    if (!A.isOwner)
        return false;
    const mr = actor.system?.mastery?.rank ?? 1;
    if (!canArtifactLink(mr)) {
        ui.notifications?.warn('Mastery Rank 2+ is required to activate an artifact.');
        return false;
    }
    const root = game.items?.get(rootWorldId);
    if (!root)
        return false;
    const rootNodeId = root.getFlag('mastery-system', 'nodeId');
    const levels = { ...(root.getFlag('mastery-system', 'actorLevels') || {}) };
    const emb = A.items.get(embeddedId);
    if (emb && isArtifactLinkedOnActor(actor, emb)) {
        ui.notifications?.info('Already activated.');
        return false;
    }
    const cur = readActorArtifactProgress(levels[A.id], rootNodeId);
    if (emb) {
        const currentKind = getArtifactBindingKind(emb);
        if (currentKind === 'unbound' && !canBindMoreArtifacts(actor)) {
            ui.notifications?.warn(`Artifact Capacity full (${countBoundArtifacts(actor)}/${ARTIFACT_CAPACITY_DEFAULT}). Unbind another Artifact first.`);
            return false;
        }
    }
    if (usesStonePoolEconomy(actor)) {
        if (!stoneAttr) {
            ui.notifications?.warn('Wähle einen Stone aus deinem Pool.');
            return false;
        }
        if (!(await spendArtifactLinkStone(actor, stoneAttr))) {
            ui.notifications?.warn(`Nicht genug ${stoneAttr} Stones (benötigt ${ARTIFACT_LINK_STONE_COST}).`);
            return false;
        }
    }
    else {
        if (!canSpendArtifactLinkStone(actor)) {
            ui.notifications?.warn(`Not enough Stones (need ${ARTIFACT_LINK_STONE_COST}).`);
            return false;
        }
        if (!(await spendArtifactLinkStone(actor))) {
            ui.notifications?.warn(`Not enough Stones (need ${ARTIFACT_LINK_STONE_COST}).`);
            return false;
        }
    }
    const next = { ...cur, linked: true };
    levels[A.id] = serializeActorArtifactProgress(next);
    await root.setFlag('mastery-system', 'actorLevels', levels);
    if (emb) {
        await emb.setFlag('mastery-system', 'artifactActivated', true);
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
    ui.notifications?.info(`Artifact activated (${ARTIFACT_LINK_STONE_COST} Stone). You can now spend XP to evolve it.`);
    return true;
}
/** Upgrade an artifact one tree step — costs 8 XP. */
export async function upgradeArtifactForActor(actor, rootWorldId, embeddedId, targetWorldItemId, targetNodeId) {
    const A = actor;
    if (!A.isOwner)
        return false;
    const root = game.items?.get(rootWorldId);
    const targetWorld = game.items?.get(targetWorldItemId);
    const emb = A.items.get(embeddedId);
    if (!root || !targetWorld || !emb)
        return false;
    const mr = actor.system?.mastery?.rank ?? 1;
    const maxSys = getMaxArtifactSystemLevelForMasteryRank(mr);
    const rootNodeId = root.getFlag('mastery-system', 'nodeId');
    const levels = { ...(root.getFlag('mastery-system', 'actorLevels') || {}) };
    if (!isArtifactLinkedOnActor(actor, emb)) {
        ui.notifications?.warn('Activate the artifact first.');
        return false;
    }
    const prog = readActorArtifactProgress(levels[A.id], rootNodeId);
    const tl = targetWorld.system?.level ?? 1;
    if (tl > maxSys) {
        ui.notifications?.warn(`Your Mastery Rank allows artifact level up to ${maxSys} only.`);
        return false;
    }
    const folderId = root.folder?.id;
    const folderItems = getWorldArtifactItemsInFolder(folderId);
    const currentWorld = resolveWorldItemByNodeId(prog.nodeId, folderItems);
    if (!currentWorld)
        return false;
    const tw = targetWorld;
    const allowedChildren = getChildWorldItemsForNode(prog.nodeId, folderItems).map((c) => c.id);
    if (!allowedChildren.includes(tw.id)) {
        ui.notifications?.error('Invalid evolution step.');
        return false;
    }
    const stepRaw = actor.system?.xp?.currentStep ?? {};
    const stepNow = {
        attributes: Array.isArray(stepRaw.attributes) ? [...stepRaw.attributes] : [],
        skills: Array.isArray(stepRaw.skills) ? [...stepRaw.skills] : [],
        powers: Array.isArray(stepRaw.powers) ? [...stepRaw.powers] : [],
        artifacts: Array.isArray(stepRaw.artifacts) ? [...stepRaw.artifacts] : [],
    };
    if (isBumped(stepNow, 'artifact', embeddedId)) {
        ui.notifications?.warn('This artifact was already upgraded this Upgrade Step. End the current step first to upgrade it again.');
        return false;
    }
    if (!(await spendActorXp(actor, ARTIFACT_UPGRADE_XP_COST))) {
        ui.notifications?.warn(`Not enough XP (need ${ARTIFACT_UPGRADE_XP_COST}).`);
        return false;
    }
    const stepAfter = recordBump(stepNow, 'artifact', embeddedId);
    await actor.update({
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
        system: sys,
    });
    await emb.setFlag('mastery-system', 'evolutionRootItemId', rootWorldId);
    await emb.setFlag('mastery-system', 'evolutionNodeId', targetNodeId);
    await emb.setFlag('mastery-system', 'artifactActivated', true);
    if (equip)
        await emb.setFlag('mastery-system', 'equipment', equip);
    const nextProg = {
        nodeId: targetNodeId,
        linked: true,
    };
    levels[A.id] = serializeActorArtifactProgress(nextProg);
    await root.setFlag('mastery-system', 'actorLevels', levels);
    ui.notifications?.info(`Evolved to ${tw.name}.`);
    return true;
}
//# sourceMappingURL=artifact-evolution-actions.js.map