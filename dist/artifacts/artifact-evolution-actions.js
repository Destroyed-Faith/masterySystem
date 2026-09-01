/**
 * Shared artifact link / upgrade actions for the Evolution dialog and
 * Equipment-tab controls on the character sheet.
 */
import { ARTIFACT_CAPACITY_DEFAULT, ARTIFACT_UPGRADE_XP_COST, artifactExceedsMasteryRankCap, canArtifactLink, canBindMoreArtifacts, countBoundArtifacts, getArtifactBindingKind, getMaxArtifactSystemLevelForMasteryRank, getArtifactStonePoolLabel, isArtifactLinkedOnActor, readActorArtifactProgress, refundArtifactLinkStone, serializeActorArtifactProgress, usesStonePoolEconomy, } from '../utils/artifact-actor-rules.js';
import { summarizeEmbeddedArtifactDisplay } from '../utils/artifact-echo-repair.js';
import { buildArtifactDisplayLabels, collectArtifactNodeMeta, getChildWorldItemsForNode, getWorldArtifactItemsInFolder, resolveWorldItemByNodeId, } from '../utils/artifact-actor-tree.js';
import { setRootActorLevels } from '../utils/world-artifact-flag-sync.js';
import { isBumped, recordBump, undoBump } from '../utils/xp-step-rule.js';
import { appendXpHistory, currentXpUser } from '../utils/xp-history.js';
/** Flavor line from lore / description (embedded first, then world root). */
export function artifactFlavorText(...items) {
    for (const item of items) {
        const sys = item?.system;
        const lore = String(sys?.lore || '').trim();
        if (lore)
            return lore;
        const description = String(sys?.description || '').trim();
        if (description)
            return description;
    }
    return '';
}
export function artifactUpgradeBlockReason(paths, opts) {
    if (paths.some((p) => !String(p.disabledReason || '').trim()))
        return '';
    const first = paths.find((p) => String(p.disabledReason || '').trim());
    if (first?.disabledReason)
        return String(first.disabledReason);
    return opts?.atMax ? 'Max level for current Mastery Rank.' : 'No further branches from this node.';
}
function actorXpAvailable(actor) {
    const sys = actor.system || {};
    const regular = Math.max(0, Number(sys.points?.xp) || 0);
    const free = Math.max(0, Number(sys.points?.xpFree) || 0);
    return regular + free;
}
function actorHasFreeXp(actor) {
    return Math.max(0, Number(actor.system?.points?.xpFree) || 0) > 0;
}
async function spendActorXp(actor, amount) {
    const sys = actor.system || {};
    const free = Math.max(0, Number(sys.points?.xpFree) || 0);
    const regular = Math.max(0, Number(sys.points?.xp) || 0);
    const totalEarned = Number(sys.xp?.totalEarned ?? 0) || 0;
    const totalSpent = Number(sys.xp?.totalSpent ?? 0) || 0;
    const freeSpent = Number(sys.xp?.freeSpent ?? 0) || 0;
    if (free + regular < amount)
        return { ok: false };
    const fromFree = Math.min(free, amount);
    const fromRegular = amount - fromFree;
    const before = {
        available: free + regular,
        totalEarned,
        totalSpent,
    };
    const nextSpent = totalSpent + fromRegular;
    await actor.update({
        'system.points.xpFree': free - fromFree,
        'system.points.xp': regular - fromRegular,
        'system.xp.totalSpent': nextSpent,
        'system.xp.freeSpent': freeSpent + fromFree,
    });
    return {
        ok: true,
        before,
        after: {
            available: free + regular - amount,
            totalEarned,
            totalSpent: nextSpent,
        },
    };
}
function readStepArtifacts(actor) {
    const raw = actor.system?.xp?.currentStep?.artifacts;
    return Array.isArray(raw) ? raw.map((v) => String(v ?? '')) : [];
}
/** Build evolution cards for every tree-linked embedded artifact on the actor. */
export function buildArtifactEvolutionCards(actor, opts) {
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
    const xpAvailable = opts?.xpAvailable != null ? Math.max(0, Math.floor(Number(opts.xpAvailable) || 0)) : actorXpAvailable(actor);
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
        const alreadyBumped = !actorHasFreeXp(actor) && isBumped(stepState, 'artifact', embeddedId);
        const bindingKind = getArtifactBindingKind(emb);
        const isEchoBound = bindingKind === 'echo';
        const linked = isArtifactLinkedOnActor(A, emb);
        const display = summarizeEmbeddedArtifactDisplay(emb, true);
        let linkDisabledReason = '';
        if (linked) {
            linkDisabledReason = '';
        }
        else if (!isEchoBound && bindingKind === 'unbound' && !canBindOneMore) {
            linkDisabledReason = `Artifact Capacity full (${boundCount}/${ARTIFACT_CAPACITY_DEFAULT}). Unbind an Artifact first.`;
        }
        const paths = childItems.map((child) => {
            const cid = child.getFlag('mastery-system', 'nodeId');
            const tl = child.system?.level ?? currentSysLevel + 1;
            let disabledReason = '';
            let gmDisabledReason = '';
            if (!linked) {
                disabledReason = 'Complete the Attunement / Binding Ritual first.';
                gmDisabledReason = disabledReason;
            }
            else if (tl > maxSys) {
                disabledReason = `Your MR allows artifact level up to ${maxSys} only.`;
            }
            else if (xpAvailable < ARTIFACT_UPGRADE_XP_COST) {
                disabledReason = `Not enough XP (${ARTIFACT_UPGRADE_XP_COST} needed for level 2+).`;
            }
            else if (alreadyBumped) {
                disabledReason = 'Already upgraded this session. Use Free XP to raise it again.';
            }
            const ch = child;
            return {
                worldItemId: ch.id,
                nodeId: cid,
                label: labels.get(cid) || ch.name,
                targetLevel: tl,
                disabledReason,
                gmDisabledReason,
            };
        });
        const nextUpgrade = paths.find((p) => !p.disabledReason) || null;
        const nextGmUpgrade = paths.find((p) => !p.gmDisabledReason) || null;
        const atMaxTierForMr = linked && currentSysLevel >= maxSys && maxSys >= 1;
        const upgradeDisabledReason = artifactUpgradeBlockReason(paths, { atMax: atMaxTierForMr });
        const legacyOverCap = artifactExceedsMasteryRankCap(currentSysLevel, masteryRank);
        const legacyOverCapReason = legacyOverCap
            ? `Legacy: this artifact is level ${currentSysLevel}, above the MR ${masteryRank} cap of ${maxSys}. It was not reduced.`
            : '';
        const activationStoneAttr = emb.getFlag?.('mastery-system', 'artifactActivationStoneAttr') || '';
        const activationStoneLabel = activationStoneAttr
            ? getArtifactStonePoolLabel(activationStoneAttr)
            : '';
        const rw = rootWorld;
        cards.push({
            embeddedId,
            displayName: rw.name?.replace(/\s*-\s*Level\s*1-1\s*$/i, '').trim() || emb.name,
            img: String(emb.img || rw.img || ''),
            flavor: artifactFlavorText(emb, rw),
            rootWorldId: rw.id,
            folderId,
            masteryRank,
            maxSystemLevel: maxSys,
            canLinkRules: canArtifactLink(masteryRank),
            linked,
            progress,
            currentSystemLevel: currentSysLevel,
            currentLabel: labels.get(progress.nodeId) || `Level ${currentSysLevel}`,
            xp: xpAvailable,
            stones,
            paths,
            atMaxTierForMr,
            bindingKind,
            isEchoBound,
            linkDisabledReason,
            canActivate: !linked && !linkDisabledReason,
            canUpgrade: linked && !!nextUpgrade,
            upgradeDisabledReason,
            nextUpgrade: linked ? nextUpgrade : null,
            nextGmUpgrade: linked ? nextGmUpgrade : null,
            baseValues: display.baseValues,
            abilities: display.abilities,
            hasBaseValues: display.hasBaseValues,
            hasAbilities: display.hasAbilities,
            openAbilities: linked && display.hasAbilities && display.abilities.length <= 3,
            activationStoneAttr,
            activationStoneLabel,
            legacyOverCap,
            legacyOverCapReason,
        });
    }
    return cards;
}
/** Attune / bind an artifact — one-time ritual, no Stone reservation, Level 1 is free. */
export async function linkArtifactForActor(actor, rootWorldId, embeddedId, _stoneAttr) {
    const A = actor;
    if (!A.isOwner)
        return false;
    const mr = actor.system?.mastery?.rank ?? 1;
    if (!canArtifactLink(mr)) {
        ui.notifications?.warn('Cannot complete Attunement for this character.');
        return false;
    }
    const root = game.items?.get(rootWorldId);
    if (!root)
        return false;
    const rootNodeId = root.getFlag('mastery-system', 'nodeId');
    const levels = { ...(root.getFlag('mastery-system', 'actorLevels') || {}) };
    const emb = A.items.get(embeddedId);
    if (emb && isArtifactLinkedOnActor(actor, emb)) {
        ui.notifications?.info('Already attuned.');
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
    // Attunement is free: no Bind / Seal / Burn / reservation of a character Stone.
    const next = { ...cur, linked: true };
    levels[A.id] = serializeActorArtifactProgress(next);
    await setRootActorLevels(root, levels);
    if (emb) {
        await emb.setFlag('mastery-system', 'artifactActivated', true);
        await emb.unsetFlag('mastery-system', 'artifactActivationStoneAttr');
        const sys = emb.system || {};
        const curLevel = Math.max(0, Number(sys.currentLevel ?? sys.level ?? 0) || 0);
        const patch = {};
        if (curLevel < 1) {
            patch['system.currentLevel'] = 1;
            patch['system.level'] = 1;
        }
        const currentKind = getArtifactBindingKind(emb);
        if (currentKind === 'unbound') {
            patch['system.binding'] = 'bound';
        }
        if (Object.keys(patch).length > 0) {
            try {
                await emb.update(patch);
            }
            catch (err) {
                console.warn('[mastery-system] could not finish artifact attunement fields', err);
            }
        }
    }
    ui.notifications?.info('Attunement complete. The artifact awakens at Level 1 (no XP) and occupies its Artifact Capacity. Further levels cost 8 XP each.');
    return true;
}
/**
 * GM-only: deactivate artifact and refund its activation Stone so the player
 * can choose a different pool.
 */
export async function resetArtifactActivationForActor(actor, rootWorldId, embeddedId) {
    if (!game.user?.isGM) {
        ui.notifications?.warn('Nur der GM kann die Artifact-Aktivierung zurücksetzen.');
        return false;
    }
    const A = actor;
    const root = game.items?.get(rootWorldId);
    const emb = A.items.get(embeddedId);
    if (!root || !emb)
        return false;
    if (!isArtifactLinkedOnActor(actor, emb)) {
        ui.notifications?.info('Artifact ist bereits inaktiv.');
        return false;
    }
    const rootNodeId = root.getFlag('mastery-system', 'nodeId');
    const levels = { ...(root.getFlag('mastery-system', 'actorLevels') || {}) };
    const prog = readActorArtifactProgress(levels[A.id], rootNodeId);
    const stoneAttr = emb.getFlag('mastery-system', 'artifactActivationStoneAttr');
    let refunded = false;
    if (stoneAttr) {
        refunded = await refundArtifactLinkStone(actor, stoneAttr);
    }
    else if (!usesStonePoolEconomy(actor)) {
        refunded = await refundArtifactLinkStone(actor);
    }
    levels[A.id] = serializeActorArtifactProgress({ ...prog, linked: false });
    await setRootActorLevels(root, levels);
    // Clear the activation flags on EVERY embedded copy of this artifact tree,
    // not just the one the dialog points at. Stale/duplicate copies (see
    // `dedupeEchoArtifactsOnActor`) otherwise keep an activation Stone blocked —
    // sometimes on the wrong attribute pool.
    const echoKey = emb.getFlag('mastery-system', 'echoArtifactKey');
    const copies = Array.from(A.items.filter((it) => {
        if (it.type !== 'artifact')
            return false;
        if (it.id === emb.id)
            return true;
        const itRoot = it.getFlag?.('mastery-system', 'evolutionRootItemId');
        if (itRoot && itRoot === rootWorldId)
            return true;
        const itEcho = it.getFlag?.('mastery-system', 'echoArtifactKey');
        return !!echoKey && itEcho === echoKey;
    }));
    for (const copy of copies) {
        if (copy.getFlag?.('mastery-system', 'artifactActivated') === true) {
            await copy.setFlag('mastery-system', 'artifactActivated', false);
        }
        if (copy.getFlag?.('mastery-system', 'artifactActivationStoneAttr') != null) {
            await copy.unsetFlag('mastery-system', 'artifactActivationStoneAttr');
        }
    }
    const poolNote = stoneAttr ? ` (${getArtifactStonePoolLabel(stoneAttr)})` : '';
    if (refunded) {
        ui.notifications?.info(`Artifact-Aktivierung zurückgesetzt${poolNote}. Stone erstattet.`);
    }
    else if (usesStonePoolEconomy(actor) && !stoneAttr) {
        ui.notifications?.warn('Artifact deaktiviert. Kein Stone-Pool gespeichert (alte Aktivierung) — keine automatische Erstattung.');
    }
    else {
        ui.notifications?.info(`Artifact-Aktivierung zurückgesetzt${poolNote}.`);
    }
    return true;
}
/**
 * GM-only: clear leftover Link-Stone reservation flags on an actor.
 * Artifacts stay active (Level 1 is free). Use to recover from stale
 * `artifactActivationStoneAttr` leftovers — never deactivates items.
 *
 * @returns the number of reservation flags cleared.
 */
export async function releaseAllArtifactActivationStones(actor) {
    if (!game.user?.isGM) {
        ui.notifications?.warn('Nur der GM kann Aktivierungs-Steine freigeben.');
        return 0;
    }
    const A = actor;
    if (!A?.items?.filter)
        return 0;
    let removedDuplicates = 0;
    try {
        const { dedupeEchoArtifactsOnActor } = await import('../utils/echo-artifact-equip.js');
        removedDuplicates = await dedupeEchoArtifactsOnActor(actor);
    }
    catch (err) {
        console.warn('[mastery-system] dedupe before release failed', err);
    }
    const artifacts = Array.from(A.items.filter((it) => it.type === 'artifact'));
    let released = 0;
    for (const emb of artifacts) {
        const hadAttr = emb.getFlag?.('mastery-system', 'artifactActivationStoneAttr') != null;
        if (hadAttr) {
            await emb.unsetFlag('mastery-system', 'artifactActivationStoneAttr');
            released += 1;
        }
    }
    const dupNote = removedDuplicates > 0
        ? ` (${removedDuplicates} doppelte${removedDuplicates === 1 ? 's' : ''} Artefakt-Item entfernt)`
        : '';
    if (released > 0 || removedDuplicates > 0) {
        ui.notifications?.info(`${released} Artifact-Aktivierungs-Stein${released === 1 ? '' : 'e'} freigegeben${dupNote}.`);
    }
    else {
        ui.notifications?.info('Keine blockierten Aktivierungs-Steine gefunden.');
    }
    return released;
}
/** Upgrade an artifact one tree step — costs 8 XP (unless `gmFree`). */
export async function upgradeArtifactForActor(actor, rootWorldId, embeddedId, targetWorldItemId, targetNodeId, options = {}) {
    const gmFree = options.gmFree === true;
    if (gmFree && !game.user?.isGM) {
        ui.notifications?.warn('Nur der GM kann Artefakte ohne XP upgraden.');
        return false;
    }
    const A = actor;
    if (!gmFree && !A.isOwner)
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
        ui.notifications?.warn('Complete the Attunement / Binding Ritual first.');
        return false;
    }
    const prog = readActorArtifactProgress(levels[A.id], rootNodeId);
    const tl = targetWorld.system?.level ?? 1;
    if (!gmFree && tl > maxSys) {
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
    if (!gmFree) {
        const stepRaw = actor.system?.xp?.currentStep ?? {};
        const stepNow = {
            attributes: Array.isArray(stepRaw.attributes) ? [...stepRaw.attributes] : [],
            skills: Array.isArray(stepRaw.skills) ? [...stepRaw.skills] : [],
            powers: Array.isArray(stepRaw.powers) ? [...stepRaw.powers] : [],
            artifacts: Array.isArray(stepRaw.artifacts) ? [...stepRaw.artifacts] : [],
        };
        const unrestricted = actorHasFreeXp(actor);
        if (!unrestricted && isBumped(stepNow, 'artifact', embeddedId)) {
            ui.notifications?.warn('This artifact was already upgraded this session. Use Free XP to raise it again.');
            return false;
        }
        const spend = await spendActorXp(actor, ARTIFACT_UPGRADE_XP_COST);
        if (!spend.ok) {
            ui.notifications?.warn(`Not enough XP (need ${ARTIFACT_UPGRADE_XP_COST}).`);
            return false;
        }
        const fromLevel = Number(emb.system?.level ?? currentWorld.system?.level ?? 1) || 1;
        const user = currentXpUser();
        const history = appendXpHistory(actor, [
            {
                ts: Date.now(),
                userId: user.userId,
                userName: user.userName,
                kind: 'spend',
                category: 'artifact',
                amount: ARTIFACT_UPGRADE_XP_COST,
                note: `${emb.name} ${fromLevel} → ${tl}`,
                details: {
                    artifactId: embeddedId,
                    name: emb.name,
                    from: fromLevel,
                    to: tl,
                    targetName: tw.name,
                },
                before: spend.before,
                after: spend.after,
            },
        ]);
        const stepAfter = unrestricted ? stepNow : recordBump(stepNow, 'artifact', embeddedId);
        await actor.update({
            'system.xp.currentStep.attributes': [...stepAfter.attributes],
            'system.xp.currentStep.skills': [...stepAfter.skills],
            'system.xp.currentStep.powers': [...stepAfter.powers],
            'system.xp.currentStep.artifacts': [...stepAfter.artifacts],
            'system.xp.history': history,
        });
    }
    const fromLevelForLog = Number(emb.system?.level ?? currentWorld.system?.level ?? 1) || 1;
    const fromNameForLog = String(emb.name || tw.name);
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
    await setRootActorLevels(root, levels);
    if (gmFree) {
        const user = currentXpUser();
        await actor.update({
            'system.xp.history': appendXpHistory(actor, [
                {
                    ts: Date.now(),
                    userId: user.userId,
                    userName: user.userName,
                    kind: 'adjust',
                    category: 'artifact',
                    amount: 0,
                    note: `GM: ${fromNameForLog} ${fromLevelForLog} → ${tl}`,
                    details: {
                        artifactId: embeddedId,
                        name: fromNameForLog,
                        from: fromLevelForLog,
                        to: tl,
                        targetName: tw.name,
                        gmFree: true,
                    },
                },
            ]),
        });
    }
    ui.notifications?.info(gmFree ? `GM: Evolved to ${tw.name} (no XP spent).` : `Evolved to ${tw.name}.`);
    return true;
}
async function refundActorXp(actor, amount) {
    const sys = actor.system || {};
    const free = Math.max(0, Number(sys.points?.xpFree) || 0);
    const regular = Math.max(0, Number(sys.points?.xp) || 0);
    const freeEarned = Number(sys.xp?.freeEarned ?? 0) || 0;
    const totalEarned = Number(sys.xp?.totalEarned ?? 0) || 0;
    const totalSpent = Number(sys.xp?.totalSpent ?? 0) || 0;
    const freeSpent = Number(sys.xp?.freeSpent ?? 0) || 0;
    const before = { available: free + regular, totalEarned, totalSpent };
    const toFree = Math.max(0, Math.min(amount, freeEarned - free));
    const toReg = Math.max(0, amount - toFree);
    const nextSpent = Math.max(0, totalSpent - toReg);
    await actor.update({
        'system.points.xpFree': free + toFree,
        'system.points.xp': regular + toReg,
        'system.xp.totalSpent': nextSpent,
        'system.xp.freeSpent': Math.max(0, freeSpent - toFree),
    });
    return {
        before,
        after: {
            available: free + regular + amount,
            totalEarned,
            totalSpent: nextSpent,
        },
    };
}
/** Walk the evolution tree back to `targetLevel` and refund 8 XP per dropped level. */
export async function downgradeArtifactForActor(actor, embeddedId, targetLevel) {
    const A = actor;
    const emb = A.items?.get?.(embeddedId);
    if (!emb)
        return { ok: false, error: 'Artifact not found.' };
    const rootWorldId = emb.getFlag('mastery-system', 'evolutionRootItemId');
    const currentNodeId = emb.getFlag('mastery-system', 'evolutionNodeId');
    const root = rootWorldId ? game.items?.get(rootWorldId) : undefined;
    if (!root || !currentNodeId)
        return { ok: false, error: 'Artifact is not linked to an evolution tree.' };
    const folderItems = getWorldArtifactItemsInFolder(root.folder?.id);
    const metaMap = collectArtifactNodeMeta(folderItems);
    const want = Math.max(1, Math.floor(Number(targetLevel) || 1));
    const drops = [];
    let nodeId = currentNodeId;
    let guard = 0;
    while (guard++ < 24) {
        const world = resolveWorldItemByNodeId(nodeId, folderItems);
        if (!world)
            return { ok: false, error: 'Could not resolve the current artifact node.' };
        const level = Number(world.system?.level ?? 1) || 1;
        if (level <= want)
            break;
        const parentId = metaMap.get(nodeId)?.parentIds?.[0];
        if (!parentId) {
            return { ok: false, error: `Cannot revert this artifact to level ${want}.` };
        }
        const parentWorld = resolveWorldItemByNodeId(parentId, folderItems);
        if (!parentWorld)
            return { ok: false, error: 'Could not resolve the parent artifact node.' };
        const parentLevel = Number(parentWorld.system?.level ?? 1) || 1;
        const worldAny = world;
        drops.push({
            from: level,
            to: parentLevel,
            fromName: String(worldAny.name || emb.name),
            toName: String(parentWorld.name || ''),
            toNodeId: parentId,
            toWorld: parentWorld,
        });
        nodeId = parentId;
    }
    if (!drops.length)
        return { ok: false, error: 'This artifact step is no longer in effect.' };
    const last = drops[drops.length - 1];
    if ((Number(last.toWorld.system?.level ?? 1) || 1) > want) {
        return { ok: false, error: `Cannot revert this artifact to level ${want}.` };
    }
    const refundAmount = drops.length * ARTIFACT_UPGRADE_XP_COST;
    const xp = await refundActorXp(actor, refundAmount);
    const user = currentXpUser();
    const historyEntries = drops.map((drop, i) => ({
        ts: Date.now() + i,
        userId: user.userId,
        userName: user.userName,
        kind: 'adjust',
        category: 'artifact',
        amount: ARTIFACT_UPGRADE_XP_COST,
        note: `refund: ${drop.fromName} ${drop.from} → ${drop.to}`,
        details: {
            artifactId: embeddedId,
            name: drop.fromName,
            from: drop.from,
            to: drop.to,
            targetName: drop.toName,
        },
        before: xp.before,
        after: xp.after,
    }));
    const stepRaw = actor.system?.xp?.currentStep ?? {};
    const stepNow = {
        attributes: Array.isArray(stepRaw.attributes) ? [...stepRaw.attributes] : [],
        skills: Array.isArray(stepRaw.skills) ? [...stepRaw.skills] : [],
        powers: Array.isArray(stepRaw.powers) ? [...stepRaw.powers] : [],
        artifacts: Array.isArray(stepRaw.artifacts) ? [...stepRaw.artifacts] : [],
    };
    const stepAfter = undoBump(stepNow, 'artifact', embeddedId);
    await actor.update({
        'system.xp.currentStep.attributes': [...stepAfter.attributes],
        'system.xp.currentStep.skills': [...stepAfter.skills],
        'system.xp.currentStep.powers': [...stepAfter.powers],
        'system.xp.currentStep.artifacts': [...stepAfter.artifacts],
        'system.xp.history': appendXpHistory(actor, historyEntries),
    });
    const equip = emb.getFlag('mastery-system', 'equipment');
    const sys = foundry.utils.duplicate(last.toWorld.system || {});
    await emb.update({
        name: last.toWorld.name,
        img: last.toWorld.img,
        system: sys,
    });
    await emb.setFlag('mastery-system', 'evolutionRootItemId', rootWorldId);
    await emb.setFlag('mastery-system', 'evolutionNodeId', last.toNodeId);
    await emb.setFlag('mastery-system', 'artifactActivated', true);
    if (equip)
        await emb.setFlag('mastery-system', 'equipment', equip);
    const levels = { ...(root.getFlag('mastery-system', 'actorLevels') || {}) };
    levels[A.id] = serializeActorArtifactProgress({ nodeId: last.toNodeId, linked: true });
    await setRootActorLevels(root, levels);
    ui.notifications?.info(`Reverted to ${last.toWorld.name}. Refunded ${refundAmount} XP.`);
    return { ok: true };
}
//# sourceMappingURL=artifact-evolution-actions.js.map