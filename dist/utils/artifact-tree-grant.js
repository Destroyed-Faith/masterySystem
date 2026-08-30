/**
 * Grant / wire embedded artifacts to world Builder-Trees for evolution.
 */
import { readActorArtifactProgress, } from './artifact-actor-rules.js';
import { findRootWorldArtifactInFolder, getWorldArtifactItemsInFolder, resolveWorldItemByNodeId, } from './artifact-actor-tree.js';
import { findEchoArtifactRootInWorld } from './seed-artifact-library.js';
import { GENERAL_ARTIFACTS } from './general-artifacts.js';
import { upsertRootActorProgress, upsertRootActorProgressForActor, } from './world-artifact-flag-sync.js';
/** Infer catalog key from item display name (Echo + General artifacts). */
export function inferArtifactKeyFromName(name) {
    const n = String(name || '').toLowerCase();
    for (const [key, def] of Object.entries(GENERAL_ARTIFACTS)) {
        if (n.includes(def.name.toLowerCase()))
            return key;
    }
    if (n.includes('dragon head'))
        return 'dragonHead';
    if (n.includes('dragon claw'))
        return 'dragonClaws';
    if (n.includes('wyrm scale') && n.includes('light'))
        return 'wyrmScalesLight';
    if (n.includes('wyrm scale') && n.includes('heavy'))
        return 'wyrmScalesHeavy';
    if (n.includes('serpent scale'))
        return 'wyrmScalesLight';
    if (n.includes('wyrm scale'))
        return 'wyrmScalesHeavy';
    // Titan Scars variants are all named "Titan Scars"; the affinity isn't in the
    // name, so default name-based wiring to the Might variant (legacy default).
    if (n.includes('titan scar'))
        return 'titanScars';
    if (n.includes('ringchain'))
        return 'ringchainOfKeptNames';
    if (n.includes('stonebound sole'))
        return 'stoneboundSoles';
    if (n.includes('elorian stride'))
        return 'elorianStride';
    if (n.includes('elven stride'))
        return 'elorianStride';
    if (n.includes('sentinel frame'))
        return 'sentinelFrame';
    if (n.includes('judicator frame'))
        return 'judicatorFrame';
    if (n.includes('oracle frame'))
        return 'oracleFrame';
    return null;
}
function resolveRootForArtifactKey(artifactKey) {
    return findEchoArtifactRootInWorld(artifactKey);
}
function resolveRootFromWorldItem(worldItem) {
    if (!worldItem?.folder?.id)
        return null;
    return findRootWorldArtifactInFolder(worldItem.folder.id) ?? null;
}
/**
 * Wire an embedded artifact to its world evolution tree.
 * Idempotent when already wired to the same tree.
 */
export async function wireEmbeddedArtifactToWorldTree(actor, embeddedItem, options = {}) {
    if (!actor || !embeddedItem || embeddedItem.type !== 'artifact') {
        return { ok: false, reason: 'Not an artifact item.' };
    }
    const existingRootId = embeddedItem.getFlag?.('mastery-system', 'evolutionRootItemId');
    if (existingRootId)
        return { ok: true, alreadyWired: true };
    const sourceWorld = options.sourceWorldItem;
    const artifactKey = embeddedItem.getFlag?.('mastery-system', 'echoArtifactKey') ||
        sourceWorld?.getFlag?.('mastery-system', 'echoArtifactKey') ||
        inferArtifactKeyFromName(embeddedItem.name) ||
        (sourceWorld ? inferArtifactKeyFromName(sourceWorld.name) : null);
    let rootItem = artifactKey ? resolveRootForArtifactKey(artifactKey) : null;
    if (!rootItem && sourceWorld) {
        rootItem = resolveRootFromWorldItem(sourceWorld);
    }
    if (!rootItem) {
        return { ok: false, reason: 'No matching world artifact tree found. Seed the library first.' };
    }
    const rootId = rootItem.id;
    const rootNodeId = rootItem.getFlag?.('mastery-system', 'nodeId');
    if (!rootNodeId)
        return { ok: false, reason: 'World tree root has no nodeId.' };
    const duplicate = Array.from(actor.items).find((i) => i.type === 'artifact' &&
        i.id !== embeddedItem.id &&
        i.getFlag?.('mastery-system', 'evolutionRootItemId') === rootId);
    if (duplicate) {
        return { ok: false, reason: 'This actor already has an item from this artifact tree.' };
    }
    let nodeId = rootNodeId;
    const sourceNodeId = sourceWorld?.getFlag?.('mastery-system', 'nodeId') ||
        embeddedItem.getFlag?.('mastery-system', 'nodeId');
    if (sourceNodeId && rootItem.folder?.id) {
        const folderItems = getWorldArtifactItemsInFolder(rootItem.folder.id);
        if (resolveWorldItemByNodeId(sourceNodeId, folderItems)) {
            nodeId = sourceNodeId;
        }
    }
    await embeddedItem.setFlag('mastery-system', 'evolutionRootItemId', rootId);
    await embeddedItem.setFlag('mastery-system', 'evolutionNodeId', nodeId);
    if (artifactKey) {
        await embeddedItem.setFlag('mastery-system', 'echoArtifactKey', artifactKey);
    }
    if (embeddedItem.getFlag?.('mastery-system', 'artifactActivated') !== true) {
        await embeddedItem.setFlag('mastery-system', 'artifactActivated', false);
    }
    const actorId = actor.id;
    const prev = readActorArtifactProgress((rootItem.getFlag?.('mastery-system', 'actorLevels') || {})[actorId], rootNodeId);
    await upsertRootActorProgress(rootItem, actorId, {
        nodeId,
        linked: prev.linked === true ? true : false,
    });
    const { syncEmbeddedArtifactFromWorldNode } = await import('./artifact-echo-repair.js');
    await syncEmbeddedArtifactFromWorldNode(embeddedItem, actor);
    if (options.notify !== false && typeof ui !== 'undefined') {
        ui.notifications?.info(`${embeddedItem.name} linked to the artifact evolution tree. Complete the Attunement Ritual in Progression — Level 1 is free.`);
    }
    return { ok: true };
}
/**
 * Grant the Level-1 root of an artifact tree to an actor (Echo or General).
 */
export async function grantArtifactTreeToActor(actor, artifactKey) {
    const rootItem = findEchoArtifactRootInWorld(artifactKey);
    if (!rootItem)
        return null;
    const rootId = rootItem.id;
    const existing = Array.from(actor.items).find((i) => i.type === 'artifact' && i.getFlag?.('mastery-system', 'evolutionRootItemId') === rootId);
    if (existing) {
        const emb = existing;
        const { embeddedArtifactNeedsSync, syncEmbeddedArtifactFromWorldNode } = await import('./artifact-echo-repair.js');
        if (embeddedArtifactNeedsSync(emb)) {
            await syncEmbeddedArtifactFromWorldNode(emb, actor);
        }
        if (emb.getFlag?.('mastery-system', 'artifactActivated') !== true) {
            await emb.setFlag('mastery-system', 'artifactActivated', false);
        }
        return emb;
    }
    const itemData = foundry.utils.duplicate(rootItem.toObject());
    delete itemData._id;
    const createdDocs = await actor.createEmbeddedDocuments('Item', [itemData]);
    const created = createdDocs?.[0];
    if (!created)
        return null;
    const wire = await wireEmbeddedArtifactToWorldTree(actor, created, {
        sourceWorldItem: rootItem,
        notify: false,
    });
    if (!wire.ok && !wire.alreadyWired) {
        console.warn('[mastery-system] grantArtifactTreeToActor wire failed', wire.reason);
        try {
            await actor.deleteEmbeddedDocuments('Item', [created.id], {
                masterySystemForceDelete: true,
            });
        }
        catch (err) {
            console.warn('[mastery-system] grantArtifactTreeToActor rollback failed', err);
        }
        return null;
    }
    await created.setFlag('mastery-system', 'echoArtifactKey', artifactKey);
    await created.setFlag('mastery-system', 'artifactActivated', false);
    const rootNodeId = rootItem.getFlag?.('mastery-system', 'nodeId');
    const actorId = actor.id;
    await upsertRootActorProgress(rootItem, actorId, {
        nodeId: rootNodeId,
        linked: false,
    });
    return created;
}
/** @deprecated Use grantArtifactTreeToActor — kept for existing imports. */
export async function grantEchoArtifactTreeToActor(actor, echoArtifactKey) {
    return grantArtifactTreeToActor(actor, echoArtifactKey);
}
/** True when actor has any embedded artifact (wired or wireable). */
export function actorHasProgressionArtifacts(actor) {
    const A = actor;
    if (!A?.items?.filter)
        return false;
    return Array.from(A.items.filter((i) => i.type === 'artifact')).length > 0;
}
/** Embedded artifacts missing evolution wiring but potentially repairable. */
export function listUnwiredEmbeddedArtifacts(actor) {
    const out = [];
    const A = actor;
    if (!A?.items?.filter)
        return out;
    for (const emb of Array.from(A.items.filter((i) => i.type === 'artifact'))) {
        if (emb.getFlag?.('mastery-system', 'evolutionRootItemId'))
            continue;
        const key = emb.getFlag?.('mastery-system', 'echoArtifactKey') ||
            inferArtifactKeyFromName(emb.name);
        if (key || emb.getFlag?.('mastery-system', 'nodeId'))
            out.push(emb);
    }
    return out;
}
/**
 * Reset a general (non-Echo) embedded artifact to Level 1 / inactive while
 * keeping it on the actor. Used during character reset for recreation.
 */
export async function resetGeneralArtifactForRecreation(actor, emb) {
    if (!emb || emb.type !== 'artifact')
        return;
    if (!emb.getFlag?.('mastery-system', 'evolutionRootItemId')) {
        await wireEmbeddedArtifactToWorldTree(actor, emb, { notify: false });
    }
    const rootWorldId = emb.getFlag?.('mastery-system', 'evolutionRootItemId');
    if (!rootWorldId)
        return;
    const root = game.items?.get(rootWorldId);
    if (!root)
        return;
    const rootNodeId = root.getFlag?.('mastery-system', 'nodeId');
    if (!rootNodeId)
        return;
    const actorId = actor.id;
    await upsertRootActorProgressForActor(root, actorId, {
        nodeId: rootNodeId,
        linked: false,
    });
    await emb.setFlag('mastery-system', 'evolutionNodeId', rootNodeId);
    await emb.setFlag('mastery-system', 'artifactActivated', false);
    if (typeof emb.unsetFlag === 'function') {
        await emb.unsetFlag('mastery-system', 'artifactActivationStoneAttr');
    }
    const { syncEmbeddedArtifactFromWorldNode } = await import('./artifact-echo-repair.js');
    await syncEmbeddedArtifactFromWorldNode(emb, actor);
}
//# sourceMappingURL=artifact-tree-grant.js.map