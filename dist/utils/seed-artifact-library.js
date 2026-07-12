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
import { buildAllEchoArtifactTrees, buildAllGeneralArtifactTrees, ECHO_ARTIFACT_SEED_VERSION, } from '../artifacts/echo-artifact-tree-builder.js';
import { pushWorldArtifactNodeToEmbeddedActors } from './artifact-embedded-sync.js';
export { grantArtifactTreeToActor, grantEchoArtifactTreeToActor } from './artifact-tree-grant.js';
export const ECHO_ARTIFACT_LIBRARY_FOLDER_NAME = 'Echo Artifacts';
export const GENERAL_ARTIFACT_LIBRARY_FOLDER_NAME = 'General Artifacts';
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
/** All seeded world node items for an Echo Artifact key. */
function findAllEchoArtifactWorldItems(echoArtifactKey) {
    const items = Array.from(game.items ?? []);
    return items.filter((it) => it.type === 'artifact' &&
        it.getFlag?.('mastery-system', 'echoArtifactKey') === echoArtifactKey);
}
/**
 * Refresh an already-seeded tree in place to the current generator output.
 * Existing node items are matched by their stable `nodeId` flag and updated
 * (name / img / system / structural flags) — their `_id`, folder, and the
 * root's `actorLevels` are preserved, so actor evolution links survive.
 * Missing nodes are created in the same sub-folder. Returns nodes touched.
 */
async function upgradeEchoArtifactTreeInPlace(tree, existingItems) {
    const byNodeId = new Map();
    let folderId = null;
    for (const it of existingItems) {
        const nid = it.getFlag?.('mastery-system', 'nodeId');
        if (nid)
            byNodeId.set(String(nid), it);
        if (folderId == null)
            folderId = it.folder?.id ?? null;
    }
    let touched = 0;
    const toCreate = [];
    for (const node of tree.nodes) {
        const existing = byNodeId.get(node.nodeId);
        const data = foundry.utils.duplicate(node.itemData);
        const flags = data.flags?.['mastery-system'] || {};
        if (existing) {
            const update = {
                name: data.name,
                img: data.img,
                system: data.system,
                'flags.mastery-system.nodeId': flags.nodeId,
                'flags.mastery-system.parentIds': flags.parentIds || [],
                'flags.mastery-system.childIds': flags.childIds || [],
                'flags.mastery-system.echoArtifactKey': flags.echoArtifactKey,
                'flags.mastery-system.seedVersion': ECHO_ARTIFACT_SEED_VERSION,
            };
            // General (bound) trees never carry the echoBound flag.
            if (flags.echoBound !== undefined) {
                update['flags.mastery-system.echoBound'] = flags.echoBound;
            }
            if (flags.isRoot)
                update['flags.mastery-system.isRoot'] = true;
            await existing.update(update);
            // Propagate the refreshed node to any actor that already holds this copy
            // (matched by evolutionRootItemId + evolutionNodeId), so live characters
            // pick up the new Base Values / Stone Function without re-granting.
            try {
                await pushWorldArtifactNodeToEmbeddedActors(existing);
            }
            catch (e) {
                console.warn('Mastery System | Failed to push refreshed artifact node to actors', e);
            }
            touched += 1;
        }
        else {
            data.folder = folderId;
            toCreate.push(data);
        }
    }
    if (toCreate.length > 0) {
        const created = await Item.createDocuments(toCreate, { render: false });
        touched += Array.isArray(created) ? created.length : 0;
    }
    return touched;
}
/** Resolve the Level-1 *root* world item for an Echo Artifact (the tree entry point). */
export function findEchoArtifactRootInWorld(echoArtifactKey) {
    return (findEchoArtifactWorldItem(echoArtifactKey, (it) => it.getFlag?.('mastery-system', 'isRoot') === true) || findEchoArtifactWorldItem(echoArtifactKey));
}
/**
 * Seed the Echo Artifact library. GM-only and idempotent.
 * @returns number of node items created across all artifacts.
 */
export async function seedArtifactLibrary(options = {}) {
    if (!game.user?.isGM)
        return 0;
    const force = options.force === true;
    // Echo trees live under "Echo Artifacts", general (bound) trees under
    // "General Artifacts" — both share the same idempotent upgrade logic.
    const libraries = [
        { folderName: ECHO_ARTIFACT_LIBRARY_FOLDER_NAME, trees: buildAllEchoArtifactTrees() },
        { folderName: GENERAL_ARTIFACT_LIBRARY_FOLDER_NAME, trees: buildAllGeneralArtifactTrees() },
    ];
    const toCreate = [];
    let upgraded = 0;
    const newTreeNames = [];
    const repairedTrees = [];
    for (const library of libraries) {
        if (library.trees.length === 0)
            continue;
        let parentId;
        for (const tree of library.trees) {
            const existing = findAllEchoArtifactWorldItems(tree.echoArtifactKey);
            const expected = tree.nodes.length;
            if (existing.length > 0) {
                const isIncomplete = existing.length < expected;
                const isStale = force ||
                    isIncomplete ||
                    existing.some((it) => Number(it.getFlag?.('mastery-system', 'seedVersion') || 0) !==
                        ECHO_ARTIFACT_SEED_VERSION);
                if (isStale) {
                    const before = existing.length;
                    upgraded += await upgradeEchoArtifactTreeInPlace(tree, existing);
                    if (isIncomplete) {
                        repairedTrees.push(`${tree.folderName} (${before}/${expected} → ${expected})`);
                    }
                }
                continue;
            }
            if (parentId === undefined) {
                const parentFolder = await ensureItemFolder(library.folderName, null);
                parentId = parentFolder?.id ?? null;
            }
            const subFolder = await ensureItemFolder(tree.folderName, parentId ?? null);
            const subId = subFolder?.id ?? null;
            newTreeNames.push(`${tree.folderName} (${library.folderName})`);
            for (const node of tree.nodes) {
                const data = foundry.utils.duplicate(node.itemData);
                data.folder = subId;
                toCreate.push(data);
            }
        }
    }
    let count = 0;
    if (toCreate.length > 0) {
        const created = await Item.createDocuments(toCreate, { render: false });
        count = Array.isArray(created) ? created.length : 0;
    }
    if (count > 0) {
        console.log(`Mastery System | Seeded ${count} artifact node items`, newTreeNames);
        const folderHint = newTreeNames.length
            ? ` — new trees: ${newTreeNames.join(', ')}`
            : '';
        ui.notifications?.info(`Seeded ${count} artifact items.${folderHint} Look under Items → Echo Artifacts / General Artifacts.`);
    }
    if (upgraded > 0) {
        console.log(`Mastery System | Refreshed ${upgraded} artifact node items to v${ECHO_ARTIFACT_SEED_VERSION}`);
        const repairHint = repairedTrees.length > 0 ? ` Repaired incomplete trees: ${repairedTrees.join(', ')}.` : '';
        ui.notifications?.info(`Refreshed ${upgraded} artifact items to v${ECHO_ARTIFACT_SEED_VERSION} (icons, base values, abilities).${repairHint}`);
    }
    return count + upgraded;
}
/**
 * Repair a single catalog tree in the world (missing nodes + refresh stale data).
 */
export async function repairArtifactTreeByKey(echoArtifactKey) {
    if (!game.user?.isGM)
        return 0;
    const key = String(echoArtifactKey || '').trim();
    if (!key)
        return 0;
    const allTrees = [...buildAllEchoArtifactTrees(), ...buildAllGeneralArtifactTrees()];
    const tree = allTrees.find((t) => t.echoArtifactKey === key);
    if (!tree) {
        ui.notifications?.warn(`Unknown artifact key: ${key}`);
        return 0;
    }
    const existing = findAllEchoArtifactWorldItems(key);
    if (existing.length === 0) {
        return seedArtifactLibrary();
    }
    const n = await upgradeEchoArtifactTreeInPlace(tree, existing);
    if (n > 0) {
        const expected = tree.nodes.length;
        ui.notifications?.info(`Repaired ${tree.folderName}: ${existing.length}/${expected} → ${expected} nodes (v${ECHO_ARTIFACT_SEED_VERSION}).`);
    }
    return n;
}
/**
 * GM-triggered hard refresh of the whole Echo Artifact library. Re-runs the
 * seeder in upgrade mode (force = true) so every existing tree is rebuilt in
 * place from the current generator output and pushed to embedded actor copies —
 * a guaranteed manual fix when auto-detection (seedVersion) is somehow bypassed.
 */
export async function forceRefreshEchoArtifactLibrary() {
    if (!game.user?.isGM) {
        ui.notifications?.warn('Only the GM can refresh the Echo Artifact library.');
        return 0;
    }
    const n = await seedArtifactLibrary({ force: true });
    ui.notifications?.info(n > 0
        ? `Echo Artifact library refreshed (${n} node items updated).`
        : 'Echo Artifact library is already up to date.');
    return n;
}
//# sourceMappingURL=seed-artifact-library.js.map