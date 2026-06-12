/**
 * Grant / wire embedded artifacts to world Builder-Trees for evolution.
 */
import { readActorArtifactProgress, serializeActorArtifactProgress, } from './artifact-actor-rules.js';
import { findRootWorldArtifactInFolder, getWorldArtifactItemsInFolder, resolveWorldItemByNodeId, } from './artifact-actor-tree.js';
import { findEchoArtifactRootInWorld } from './seed-artifact-library.js';
import { GENERAL_ARTIFACTS } from './general-artifacts.js';
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
    if (n.includes('serpent scale'))
        return 'serpentScales';
    if (n.includes('wyrm scale'))
        return 'wyrmScales';
    if (n.includes('titan scar'))
        return 'titanScars';
    if (n.includes('stonebound sole'))
        return 'stoneboundSoles';
    if (n.includes('elven stride') && n.includes('fire'))
        return 'elvenStrideFire';
    if (n.includes('elven stride') && n.includes('earth'))
        return 'elvenStrideEarth';
    if (n.includes('elven stride') && n.includes('water'))
        return 'elvenStrideWater';
    if (n.includes('elven stride') && n.includes('air'))
        return 'elvenStrideAir';
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
    const levels = {
        ...(rootItem.getFlag?.('mastery-system', 'actorLevels') || {}),
    };
    const prev = readActorArtifactProgress(levels[actorId], rootNodeId);
    levels[actorId] = serializeActorArtifactProgress({
        nodeId,
        linked: prev.linked === true ? true : false,
    });
    await rootItem.setFlag('mastery-system', 'actorLevels', levels);
    const { syncEmbeddedArtifactFromWorldNode } = await import('./artifact-echo-repair.js');
    await syncEmbeddedArtifactFromWorldNode(embeddedItem, actor);
    if (options.notify !== false && typeof ui !== 'undefined') {
        ui.notifications?.info(`${embeddedItem.name} linked to the artifact evolution tree. Activate it in Progression (1 Stone at MR 2+).`);
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
    }
    await created.setFlag('mastery-system', 'echoArtifactKey', artifactKey);
    await created.setFlag('mastery-system', 'artifactActivated', false);
    const rootNodeId = rootItem.getFlag?.('mastery-system', 'nodeId');
    const actorId = actor.id;
    const levels = { ...(rootItem.getFlag('mastery-system', 'actorLevels') || {}) };
    levels[actorId] = serializeActorArtifactProgress({ nodeId: rootNodeId, linked: false });
    await rootItem.setFlag('mastery-system', 'actorLevels', levels);
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
//# sourceMappingURL=artifact-tree-grant.js.map