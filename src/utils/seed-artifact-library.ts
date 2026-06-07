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

import {
  buildAllEchoArtifactTrees,
  ECHO_ARTIFACT_SEED_VERSION,
} from '../artifacts/echo-artifact-tree-builder.js';
import {
  readActorArtifactProgress,
  serializeActorArtifactProgress,
} from './artifact-actor-rules.js';
import { pushWorldArtifactNodeToEmbeddedActors } from './artifact-embedded-sync.js';

export const ECHO_ARTIFACT_LIBRARY_FOLDER_NAME = 'Echo Artifacts';

function findItemFolder(name: string, parentId: string | null): any {
  return (game as any).folders?.find(
    (f: any) => f.type === 'Item' && f.name === name && (f.folder?.id ?? null) === parentId,
  );
}

async function ensureItemFolder(name: string, parentId: string | null): Promise<any> {
  const existing = findItemFolder(name, parentId);
  if (existing) return existing;
  return (Folder as any).create({ name, type: 'Item', folder: parentId ?? null });
}

/** Find a seeded Echo-Artifact node item by its catalog key + node flag. */
export function findEchoArtifactWorldItem(
  echoArtifactKey: string,
  predicate?: (item: any) => boolean,
): any {
  const items: any[] = Array.from((game as any).items ?? []);
  return items.find((it: any) => {
    if (it.type !== 'artifact') return false;
    if (it.getFlag?.('mastery-system', 'echoArtifactKey') !== echoArtifactKey) return false;
    return predicate ? predicate(it) : true;
  });
}

/** All seeded world node items for an Echo Artifact key. */
function findAllEchoArtifactWorldItems(echoArtifactKey: string): any[] {
  const items: any[] = Array.from((game as any).items ?? []);
  return items.filter(
    (it: any) =>
      it.type === 'artifact' &&
      it.getFlag?.('mastery-system', 'echoArtifactKey') === echoArtifactKey,
  );
}

/**
 * Refresh an already-seeded tree in place to the current generator output.
 * Existing node items are matched by their stable `nodeId` flag and updated
 * (name / img / system / structural flags) — their `_id`, folder, and the
 * root's `actorLevels` are preserved, so actor evolution links survive.
 * Missing nodes are created in the same sub-folder. Returns nodes touched.
 */
async function upgradeEchoArtifactTreeInPlace(
  tree: ReturnType<typeof buildAllEchoArtifactTrees>[number],
  existingItems: any[],
): Promise<number> {
  const byNodeId = new Map<string, any>();
  let folderId: string | null = null;
  for (const it of existingItems) {
    const nid = it.getFlag?.('mastery-system', 'nodeId');
    if (nid) byNodeId.set(String(nid), it);
    if (folderId == null) folderId = it.folder?.id ?? null;
  }

  let touched = 0;
  const toCreate: any[] = [];

  for (const node of tree.nodes) {
    const existing = byNodeId.get(node.nodeId);
    const data = foundry.utils.duplicate(node.itemData) as any;
    const flags = data.flags?.['mastery-system'] || {};
    if (existing) {
      const update: any = {
        name: data.name,
        img: data.img,
        system: data.system,
        'flags.mastery-system.nodeId': flags.nodeId,
        'flags.mastery-system.parentIds': flags.parentIds || [],
        'flags.mastery-system.childIds': flags.childIds || [],
        'flags.mastery-system.echoBound': flags.echoBound,
        'flags.mastery-system.echoArtifactKey': flags.echoArtifactKey,
        'flags.mastery-system.seedVersion': ECHO_ARTIFACT_SEED_VERSION,
      };
      if (flags.isRoot) update['flags.mastery-system.isRoot'] = true;
      await existing.update(update);
      // Propagate the refreshed node to any actor that already holds this copy
      // (matched by evolutionRootItemId + evolutionNodeId), so live characters
      // pick up the new Base Values / Stone Function without re-granting.
      try {
        await pushWorldArtifactNodeToEmbeddedActors(existing);
      } catch (e) {
        console.warn('Mastery System | Failed to push refreshed artifact node to actors', e);
      }
      touched += 1;
    } else {
      data.folder = folderId;
      toCreate.push(data);
    }
  }

  if (toCreate.length > 0) {
    const created = await (Item as any).createDocuments(toCreate, { render: false });
    touched += Array.isArray(created) ? created.length : 0;
  }
  return touched;
}

/** Resolve the Level-1 *root* world item for an Echo Artifact (the tree entry point). */
export function findEchoArtifactRootInWorld(echoArtifactKey: string): any {
  return (
    findEchoArtifactWorldItem(
      echoArtifactKey,
      (it) => it.getFlag?.('mastery-system', 'isRoot') === true,
    ) || findEchoArtifactWorldItem(echoArtifactKey)
  );
}

/**
 * Seed the Echo Artifact library. GM-only and idempotent.
 * @returns number of node items created across all artifacts.
 */
export async function seedArtifactLibrary(options: { force?: boolean } = {}): Promise<number> {
  if (!game.user?.isGM) return 0;
  const force = options.force === true;

  const trees = buildAllEchoArtifactTrees();
  if (trees.length === 0) return 0;

  const parentFolder = await ensureItemFolder(ECHO_ARTIFACT_LIBRARY_FOLDER_NAME, null);
  const parentId = parentFolder?.id ?? null;

  const toCreate: any[] = [];
  let upgraded = 0;

  for (const tree of trees) {
    const existing = findAllEchoArtifactWorldItems(tree.echoArtifactKey);

    if (existing.length > 0) {
      // Already seeded — refresh in place when forced or when the content
      // version changed, so per-actor progress (`actorLevels`) and evolution
      // links are kept.
      const isStale =
        force ||
        existing.some(
          (it) =>
            Number(it.getFlag?.('mastery-system', 'seedVersion') || 0) !==
            ECHO_ARTIFACT_SEED_VERSION,
        );
      if (isStale) {
        upgraded += await upgradeEchoArtifactTreeInPlace(tree, existing);
      }
      continue;
    }

    const subFolder = await ensureItemFolder(tree.folderName, parentId);
    const subId = subFolder?.id ?? null;

    for (const node of tree.nodes) {
      const data = foundry.utils.duplicate(node.itemData);
      (data as any).folder = subId;
      toCreate.push(data);
    }
  }

  let count = 0;
  if (toCreate.length > 0) {
    const created = await (Item as any).createDocuments(toCreate, { render: false });
    count = Array.isArray(created) ? created.length : 0;
  }

  if (count > 0) {
    console.log(`Mastery System | Seeded ${count} Echo Artifact node items`);
    ui.notifications?.info(`Seeded ${count} Echo Artifact items (${ECHO_ARTIFACT_LIBRARY_FOLDER_NAME}).`);
  }
  if (upgraded > 0) {
    console.log(`Mastery System | Refreshed ${upgraded} Echo Artifact node items to v${ECHO_ARTIFACT_SEED_VERSION}`);
    ui.notifications?.info(`Refreshed ${upgraded} Echo Artifact items to the latest data.`);
  }
  return count + upgraded;
}

/**
 * GM-triggered hard refresh of the whole Echo Artifact library. Re-runs the
 * seeder in upgrade mode (force = true) so every existing tree is rebuilt in
 * place from the current generator output and pushed to embedded actor copies —
 * a guaranteed manual fix when auto-detection (seedVersion) is somehow bypassed.
 */
export async function forceRefreshEchoArtifactLibrary(): Promise<number> {
  if (!game.user?.isGM) {
    ui.notifications?.warn('Only the GM can refresh the Echo Artifact library.');
    return 0;
  }
  const n = await seedArtifactLibrary({ force: true });
  ui.notifications?.info(
    n > 0
      ? `Echo Artifact library refreshed (${n} node items updated).`
      : 'Echo Artifact library is already up to date.',
  );
  return n;
}

/**
 * Grant the *root* of an Echo Artifact Builder-Tree to an actor as an embedded
 * artifact item, wired to the world tree for evolution (mirrors the GM "Give
 * Artifact" flow in `artifact-awakening.ts`).
 *
 * The embedded item carries `evolutionRootItemId` / `evolutionNodeId` so the
 * Artifact Evolution dialog can walk the tree, and the world root records this
 * actor's progress in `actorLevels` (echo artifacts start inactive until activated).
 *
 * @returns the created embedded item, or `null` if the world library has not
 *          been seeded yet (caller should fall back to a single-item grant).
 */
export async function grantEchoArtifactTreeToActor(
  actor: Actor,
  echoArtifactKey: string,
): Promise<any | null> {
  const rootItem = findEchoArtifactRootInWorld(echoArtifactKey);
  if (!rootItem) return null;

  const rootId = rootItem.id as string;
  const rootNodeId = rootItem.getFlag?.('mastery-system', 'nodeId') as string | undefined;
  if (!rootNodeId) return null;

  // Avoid duplicating the same tree on the actor.
  const existing = Array.from((actor as any).items).find(
    (i: any) =>
      i.type === 'artifact' && i.getFlag?.('mastery-system', 'evolutionRootItemId') === rootId,
  );
  if (existing) {
    const emb = existing as any;
    const { echoEmbeddedArtifactNeedsSync, syncEmbeddedArtifactFromWorldNode } = await import(
      './artifact-echo-repair.js'
    );
    if (echoEmbeddedArtifactNeedsSync(emb)) {
      await syncEmbeddedArtifactFromWorldNode(emb, actor);
    }
    if (emb.getFlag?.('mastery-system', 'artifactActivated') !== true) {
      await emb.setFlag('mastery-system', 'artifactActivated', false);
    }
    return emb;
  }

  const itemData = foundry.utils.duplicate((rootItem as any).toObject());
  delete (itemData as any)._id;

  const createdDocs = await (actor as any).createEmbeddedDocuments('Item', [itemData]);
  const created = createdDocs?.[0];
  if (!created) return null;

  await created.setFlag('mastery-system', 'evolutionRootItemId', rootId);
  await created.setFlag('mastery-system', 'evolutionNodeId', rootNodeId);
  await created.setFlag('mastery-system', 'echoArtifactKey', echoArtifactKey);
  await created.setFlag('mastery-system', 'artifactActivated', false);

  const actorId = (actor as any).id;
  const levels = { ...((rootItem as any).getFlag('mastery-system', 'actorLevels') || {}) };
  // Echo-bound artifacts are equipped but inactive until the player spends 1 Stone at MR2+.
  levels[actorId] = serializeActorArtifactProgress({ nodeId: rootNodeId, linked: false });
  await (rootItem as any).setFlag('mastery-system', 'actorLevels', levels);

  return created;
}
