/**
 * Artifact evolution diagnose / sync / XP repair helpers.
 *
 * Fixes desync between embedded `system.level` and the world tree node
 * behind `evolutionNodeId`, and lets GMs refund invested XP safely.
 */
import { getChildWorldItemsForNode, getWorldArtifactItemsInFolder, resolveWorldItemByNodeId, } from './artifact-actor-tree.js';
import { isArtifactLinkedOnActor, getArtifactBindingKind } from './artifact-actor-rules.js';
import { artifactLevelXpCost, totalArtifactXpToLevel } from './constants.js';
import { appendXpHistory, currentXpUser, } from './xp-history.js';
function clampLevel(value) {
    return Math.max(1, Math.min(10, Math.floor(Number(value) || 1)));
}
function readEmbedLevel(emb) {
    const sys = emb?.system || {};
    return clampLevel(sys.currentLevel ?? sys.level);
}
/** World tree node for an embedded artifact, if linked. */
export function resolveEmbeddedArtifactWorldNode(emb) {
    const rootWorldId = emb?.getFlag?.('mastery-system', 'evolutionRootItemId');
    const nodeId = emb?.getFlag?.('mastery-system', 'evolutionNodeId');
    if (!rootWorldId || !nodeId)
        return null;
    const root = globalThis.game?.items?.get?.(rootWorldId);
    if (!root?.folder?.id)
        return null;
    const folderItems = getWorldArtifactItemsInFolder(root.folder.id);
    return resolveWorldItemByNodeId(nodeId, folderItems) ?? null;
}
/**
 * Effective evolution level: prefer the world node's `system.level`,
 * then the embedded item level.
 */
export function resolveEffectiveArtifactLevel(emb) {
    const world = resolveEmbeddedArtifactWorldNode(emb);
    if (world)
        return clampLevel(world.system?.level);
    return readEmbedLevel(emb);
}
/** Ensure copied system data carries the world node's level fields. */
export function normalizeArtifactSystemLevel(system, worldLevel) {
    const level = clampLevel(worldLevel);
    return {
        ...system,
        level,
        currentLevel: level,
    };
}
/** Read-only diagnose of embed vs world evolution state. */
export function diagnoseArtifactEvolution(actor, emb) {
    const name = String(emb?.name || 'Artifact');
    const embedLevel = readEmbedLevel(emb);
    const rootWorldId = String(emb?.getFlag?.('mastery-system', 'evolutionRootItemId') || '');
    const nodeId = String(emb?.getFlag?.('mastery-system', 'evolutionNodeId') || '');
    const world = resolveEmbeddedArtifactWorldNode(emb);
    const worldLevel = world ? clampLevel(world.system?.level) : null;
    const effectiveLevel = worldLevel ?? embedLevel;
    const desync = worldLevel != null && worldLevel !== embedLevel;
    const linked = actor ? isArtifactLinkedOnActor(actor, emb) : false;
    const bindingKind = getArtifactBindingKind(emb);
    const echoLocked = emb?.getFlag?.('mastery-system', 'echoLocked') === true ||
        emb?.getFlag?.('mastery-system', 'echoBound') === true ||
        String(emb?.system?.binding || '') === 'echo';
    let childCount = 0;
    if (rootWorldId && nodeId) {
        const root = globalThis.game?.items?.get?.(rootWorldId);
        if (root?.folder?.id) {
            const folderItems = getWorldArtifactItemsInFolder(root.folder.id);
            childCount = getChildWorldItemsForNode(nodeId, folderItems).length;
        }
    }
    const notes = [];
    if (!rootWorldId || !nodeId) {
        notes.push('Not linked to a world evolution tree.');
    }
    else if (!world) {
        notes.push('evolutionNodeId does not resolve to a world node (stale id after tree rebuild?).');
    }
    if (desync) {
        notes.push(`Desync: embed system.level=${embedLevel}, world node level=${worldLevel}. Badge/history may disagree with upgrades.`);
    }
    if (linked && childCount === 0 && effectiveLevel < 10) {
        notes.push('No child nodes from this evolution step — Upgrade has no valid path.');
    }
    if (!linked && rootWorldId) {
        notes.push('Tree-linked but not attuned — complete Attunement before upgrading.');
    }
    let upgradeBlockedReason = '';
    if (!rootWorldId || !nodeId)
        upgradeBlockedReason = 'Not linked to an evolution tree.';
    else if (!world)
        upgradeBlockedReason = 'World evolution node missing.';
    else if (!linked)
        upgradeBlockedReason = 'Complete the Attunement / Binding Ritual first.';
    else if (childCount === 0)
        upgradeBlockedReason = 'No further evolution paths from this node.';
    const summary = [
        `${name}: embed L${embedLevel}`,
        worldLevel != null ? `world L${worldLevel}` : 'world —',
        `effective L${effectiveLevel}`,
        linked ? 'attuned' : 'not attuned',
        `${childCount} child path(s)`,
        desync ? 'DESYNC' : 'in sync',
    ].join(' · ');
    return {
        ok: !desync && !!world && (linked || !rootWorldId),
        name,
        embedLevel,
        worldLevel,
        effectiveLevel,
        desync,
        evolutionRootItemId: rootWorldId,
        evolutionNodeId: nodeId,
        worldNodeResolved: !!world,
        childCount,
        linked,
        bindingKind,
        echoLocked,
        upgradeBlockedReason,
        notes,
        summary,
    };
}
async function creditActorXp(actor, amount, note, details) {
    const refund = Math.max(0, Math.floor(Number(amount) || 0));
    if (refund <= 0)
        return 0;
    const sys = actor.system || {};
    const free = Math.max(0, Number(sys.points?.xpFree) || 0);
    const regular = Math.max(0, Number(sys.points?.xp) || 0);
    const freeEarned = Number(sys.xp?.freeEarned ?? 0) || 0;
    const totalEarned = Number(sys.xp?.totalEarned ?? 0) || 0;
    const totalSpent = Number(sys.xp?.totalSpent ?? 0) || 0;
    const freeSpent = Number(sys.xp?.freeSpent ?? 0) || 0;
    const before = { available: free + regular, totalEarned, totalSpent };
    const toFree = Math.max(0, Math.min(refund, freeEarned - free));
    const toReg = Math.max(0, refund - toFree);
    const nextSpent = Math.max(0, totalSpent - toReg);
    const user = currentXpUser();
    const entry = {
        ts: Date.now(),
        userId: user.userId,
        userName: user.userName,
        kind: 'adjust',
        category: 'artifact',
        amount: refund,
        note,
        details: { ...details, refund: true },
        before,
        after: {
            available: free + regular + refund,
            totalEarned,
            totalSpent: nextSpent,
        },
    };
    await actor.update({
        'system.points.xpFree': free + toFree,
        'system.points.xp': regular + toReg,
        'system.xp.totalSpent': nextSpent,
        'system.xp.freeSpent': Math.max(0, freeSpent - toFree),
        'system.xp.history': appendXpHistory(actor, [entry]),
    });
    return refund;
}
/**
 * History spends for this artifact that raised level above the live effective level
 * (XP paid, evolution/data no longer reflects it).
 */
export function listOrphanArtifactHistorySpends(actor, emb) {
    const embId = String(emb?.id || '');
    const effective = resolveEffectiveArtifactLevel(emb);
    const history = Array.isArray(actor?.system?.xp?.history) ? actor.system.xp.history : [];
    const out = [];
    for (const raw of history) {
        if (String(raw?.kind || '') !== 'spend')
            continue;
        if (String(raw?.category || '') !== 'artifact')
            continue;
        const details = raw?.details || {};
        const key = String(details.artifactId || details.key || '');
        if (key && embId && key !== embId)
            continue;
        if (!key) {
            const noteName = String(raw?.note || '');
            if (emb?.name && !noteName.includes(String(emb.name).split(' - Level')[0] || emb.name)) {
                continue;
            }
        }
        const from = Number(details.from);
        const to = Number(details.to);
        if (!Number.isFinite(from) || !Number.isFinite(to) || to <= effective)
            continue;
        const amount = typeof raw.amount === 'number' && Number.isFinite(raw.amount)
            ? Math.max(0, Math.floor(raw.amount))
            : artifactLevelXpCost(to);
        if (amount <= 0)
            continue;
        out.push({
            from,
            to,
            amount,
            note: String(raw.note || `orphan: artifact ${from} → ${to}`),
            key: key || embId,
        });
    }
    return out;
}
export function planOrphanArtifactRefundXp(actor, emb) {
    return listOrphanArtifactHistorySpends(actor, emb).reduce((sum, row) => sum + row.amount, 0);
}
/** Credit XP for orphan artifact spends without changing the tree node. */
export async function refundOrphanArtifactSpends(actor, emb) {
    const isGM = !!globalThis.game?.user?.isGM;
    if (!isGM)
        return { ok: false, refunded: 0, error: 'Only the GM can refund orphan artifact XP.' };
    const orphans = listOrphanArtifactHistorySpends(actor, emb);
    if (!orphans.length)
        return { ok: true, refunded: 0 };
    const total = orphans.reduce((sum, row) => sum + row.amount, 0);
    const refunded = await creditActorXp(actor, total, `refund: orphan artifact XP for ${emb.name} (${orphans.length} spend(s))`, {
        artifactId: emb.id,
        name: emb.name,
        orphan: true,
        spends: orphans.map((o) => ({ from: o.from, to: o.to, amount: o.amount })),
    });
    return { ok: true, refunded };
}
/**
 * Reset evolution to Level 1 and refund XP.
 * If live evolution is still > 1: tree downgrade (banded refund).
 * If already at L1 but history still shows spends: orphan refund only.
 */
export async function resetArtifactToLevel1WithRefund(actor, emb) {
    const isGM = !!globalThis.game?.user?.isGM;
    if (!isGM)
        return { ok: false, refunded: 0, error: 'Only the GM can reset artifact evolution.' };
    if (!emb?.id)
        return { ok: false, refunded: 0, error: 'Artifact not found.' };
    const effective = resolveEffectiveArtifactLevel(emb);
    if (effective > 1) {
        const { downgradeArtifactForActor } = await import('../artifacts/artifact-evolution-actions.js');
        const res = await downgradeArtifactForActor(actor, emb.id, 1);
        if (!res.ok)
            return { ok: false, refunded: 0, error: res.error };
        const fresh = actor.items?.get?.(emb.id) || emb;
        await syncEmbeddedArtifactFromWorldNodeNormalized(fresh, actor);
        return { ok: true, refunded: totalArtifactXpToLevel(effective) };
    }
    const orphan = await refundOrphanArtifactSpends(actor, emb);
    if (!orphan.ok)
        return { ok: false, refunded: 0, error: orphan.error };
    await syncEmbeddedArtifactFromWorldNodeNormalized(emb, actor);
    return { ok: true, refunded: orphan.refunded };
}
/**
 * Sync embed from world node and force level fields to match the world node.
 */
export async function syncEmbeddedArtifactFromWorldNodeNormalized(emb, actor) {
    const rootWorldId = emb.getFlag?.('mastery-system', 'evolutionRootItemId');
    const nodeId = emb.getFlag?.('mastery-system', 'evolutionNodeId');
    if (!rootWorldId || !nodeId || !actor?.id)
        return false;
    const root = globalThis.game?.items?.get?.(rootWorldId);
    if (!root?.folder?.id)
        return false;
    const folderItems = getWorldArtifactItemsInFolder(root.folder.id);
    const worldNode = resolveWorldItemByNodeId(nodeId, folderItems);
    if (!worldNode)
        return false;
    const fi = worldNode;
    const worldLevel = clampLevel(fi.system?.level);
    const sys = normalizeArtifactSystemLevel(foundry.utils.duplicate(fi.system || {}), worldLevel);
    await emb.update({
        name: fi.name,
        img: fi.img,
        system: sys,
    });
    return true;
}
/**
 * Delete a non-echo artifact after refunding invested + orphan XP.
 */
export async function deleteArtifactWithXpRefund(actor, emb) {
    if (!actor || !emb?.id)
        return { ok: false, refunded: 0, error: 'Artifact not found.' };
    const binding = getArtifactBindingKind(emb);
    const echoLocked = emb.getFlag?.('mastery-system', 'echoLocked') === true ||
        binding === 'echo' ||
        String(emb.system?.binding || '') === 'echo';
    if (echoLocked) {
        return {
            ok: false,
            refunded: 0,
            error: 'Echo-bound artifacts cannot be deleted. Use Reset Character to start over.',
        };
    }
    const effective = resolveEffectiveArtifactLevel(emb);
    let refunded = 0;
    if (effective > 1) {
        const { downgradeArtifactForActor } = await import('../artifacts/artifact-evolution-actions.js');
        const res = await downgradeArtifactForActor(actor, emb.id, 1);
        if (res.ok) {
            refunded += totalArtifactXpToLevel(effective);
        }
        else {
            // Tree walk failed — still credit XP for the effective level.
            refunded += await creditActorXp(actor, totalArtifactXpToLevel(effective), `refund: ${emb.name} removed (Level ${effective})`, { artifactId: emb.id, name: emb.name, from: effective, to: 1, deleteRefund: true });
        }
    }
    else {
        const orphan = await refundOrphanArtifactSpends(actor, emb);
        if (!orphan.ok)
            return { ok: false, refunded: 0, error: orphan.error };
        refunded += orphan.refunded;
    }
    await actor.deleteEmbeddedDocuments('Item', [emb.id], {
        masterySystemForceDelete: true,
    });
    return { ok: true, refunded };
}
//# sourceMappingURL=artifact-evolution-repair.js.map