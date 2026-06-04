/**
 * Echo Artifact Library seeding (GM, idempotent).
 *
 * Materialises every Echo Artifact as a full Artifact-Builder *tree* in the
 * world: a parent folder "Echo Artifacts" with one sub-folder per artifact,
 * each holding ten linked `artifact` node items (Level 1 → Level 10). These
 * are the canonical, always-present world copies that character creation hands
 * out (the actor's embedded item points back here via `evolutionRootItemId`)
 * and that players evolve along the tree.
 *
 * The trees are produced by the pure generator in
 * `../artifacts/echo-artifact-tree-builder.ts`, so the world library and the
 * shipped compendium pack are byte-for-byte the same content.
 *
 * Idempotency: an artifact is only created if no world item already carries its
 * `flags.mastery-system.echoArtifactKey`. Existing trees are never touched, so
 * per-actor progress stored on the root (`actorLevels`) is preserved.
 */
import { buildAllEchoArtifactTrees } from '../artifacts/echo-artifact-tree-builder.js';
import { readActorArtifactProgress, serializeActorArtifactProgress, } from './artifact-actor-rules.js';
export const ECHO_ARTIFACT_LIBRARY_FOLDER_NAME = 'Echo Artifacts';
function findItemFolder(name, parentId) {
    return game.folders?.find((f) => f.type === 'Item' && f.name === name && (f.folder?.id ?? null) === parentId);
}
async function ensureItemFolder(name, parentId) {
    const existing = findItemFolder(name, parentId);
    if (existing)
        return existing;
    return Folder.create({ name, type: 'Item', folder: parentId ?? null });
}
/** Find a seeded Echo-Artifact node item by its catalog key + node flag. */
export function findEchoArtifactWorldItem(echoArtifactKey, predicate) {
    const items = Array.from(game.items ?? []);
    return items.find((it) => {
        if (it.type !== 'artifact')
            return false;
        if (it.getFlag?.('mastery-system', 'echoArtifactKey') !== echoArtifactKey)
            return false;
        return predicate ? predicate(it) : true;
    });
}
/** Resolve the Level-1 *root* world item for an Echo Artifact (the tree entry point). */
export function findEchoArtifactRootInWorld(echoArtifactKey) {
    return (findEchoArtifactWorldItem(echoArtifactKey, (it) => it.getFlag?.('mastery-system', 'isRoot') === true) || findEchoArtifactWorldItem(echoArtifactKey));
}
/**
 * Seed the Echo Artifact library. GM-only and idempotent.
 * @returns number of node items created across all artifacts.
 */
export async function seedArtifactLibrary() {
    if (!game.user?.isGM)
        return 0;
    const trees = buildAllEchoArtifactTrees();
    if (trees.length === 0)
        return 0;
    const parentFolder = await ensureItemFolder(ECHO_ARTIFACT_LIBRARY_FOLDER_NAME, null);
    const parentId = parentFolder?.id ?? null;
    const toCreate = [];
    for (const tree of trees) {
        // Skip artifacts that already exist in the world (preserve actorLevels).
        const already = findEchoArtifactWorldItem(tree.echoArtifactKey);
        if (already)
            continue;
        const subFolder = await ensureItemFolder(tree.folderName, parentId);
        const subId = subFolder?.id ?? null;
        for (const node of tree.nodes) {
            const data = foundry.utils.duplicate(node.itemData);
            data.folder = subId;
            toCreate.push(data);
        }
    }
    if (toCreate.length === 0)
        return 0;
    const created = await Item.createDocuments(toCreate, { render: false });
    const count = Array.isArray(created) ? created.length : 0;
    if (count > 0) {
        console.log(`Mastery System | Seeded ${count} Echo Artifact node items`);
        ui.notifications?.info(`Seeded ${count} Echo Artifact items (${ECHO_ARTIFACT_LIBRARY_FOLDER_NAME}).`);
    }
    return count;
}
/**
 * Grant the *root* of an Echo Artifact Builder-Tree to an actor as an embedded
 * artifact item, wired to the world tree for evolution (mirrors the GM "Give
 * Artifact" flow in `artifact-awakening.ts`).
 *
 * The embedded item carries `evolutionRootItemId` / `evolutionNodeId` so the
 * Artifact Evolution dialog can walk the tree, and the world root records this
 * actor's progress in `actorLevels` (echo artifacts start already linked).
 *
 * @returns the created embedded item, or `null` if the world library has not
 *          been seeded yet (caller should fall back to a single-item grant).
 */
export async function grantEchoArtifactTreeToActor(actor, echoArtifactKey) {
    const rootItem = findEchoArtifactRootInWorld(echoArtifactKey);
    if (!rootItem)
        return null;
    const rootId = rootItem.id;
    const rootNodeId = rootItem.getFlag?.('mastery-system', 'nodeId');
    if (!rootNodeId)
        return null;
    // Avoid duplicating the same tree on the actor.
    const existing = Array.from(actor.items).find((i) => i.type === 'artifact' && i.getFlag?.('mastery-system', 'evolutionRootItemId') === rootId);
    if (existing)
        return existing;
    const itemData = foundry.utils.duplicate(rootItem.toObject());
    delete itemData._id;
    const createdDocs = await actor.createEmbeddedDocuments('Item', [itemData]);
    const created = createdDocs?.[0];
    if (!created)
        return null;
    await created.setFlag('mastery-system', 'evolutionRootItemId', rootId);
    await created.setFlag('mastery-system', 'evolutionNodeId', rootNodeId);
    const actorId = actor.id;
    const levels = { ...(rootItem.getFlag('mastery-system', 'actorLevels') || {}) };
    const prev = readActorArtifactProgress(levels[actorId], rootNodeId);
    // Echo-bound artifacts are intrinsic → always linked.
    levels[actorId] = serializeActorArtifactProgress({ nodeId: rootNodeId, linked: true });
    void prev;
    await rootItem.setFlag('mastery-system', 'actorLevels', levels);
    return created;
}
//# sourceMappingURL=seed-artifact-library.js.map