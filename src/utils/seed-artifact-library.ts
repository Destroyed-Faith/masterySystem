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
  buildAllGeneralArtifactTrees,
  ECHO_ARTIFACT_SEED_VERSION,
} from '../artifacts/echo-artifact-tree-builder.js';
import { pushWorldArtifactNodeToEmbeddedActors } from './artifact-embedded-sync.js';

export { grantArtifactTreeToActor, grantEchoArtifactTreeToActor } from './artifact-tree-grant.js';

export const ECHO_ARTIFACT_LIBRARY_FOLDER_NAME = 'Echo Artifacts';
export const GENERAL_ARTIFACT_LIBRARY_FOLDER_NAME = 'General Artifacts';

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
        'flags.mastery-system.echoArtifactKey': flags.echoArtifactKey,
        'flags.mastery-system.seedVersion': ECHO_ARTIFACT_SEED_VERSION,
      };
      // General (bound) trees never carry the echoBound flag.
      if (flags.echoBound !== undefined) {
        update['flags.mastery-system.echoBound'] = flags.echoBound;
      }
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

  // Echo trees live under "Echo Artifacts", general (bound) trees under
  // "General Artifacts" — both share the same idempotent upgrade logic.
  const libraries: { folderName: string; trees: ReturnType<typeof buildAllEchoArtifactTrees> }[] = [
    { folderName: ECHO_ARTIFACT_LIBRARY_FOLDER_NAME, trees: buildAllEchoArtifactTrees() },
    { folderName: GENERAL_ARTIFACT_LIBRARY_FOLDER_NAME, trees: buildAllGeneralArtifactTrees() },
  ];

  const toCreate: any[] = [];
  let upgraded = 0;
  const newTreeNames: string[] = [];

  for (const library of libraries) {
    if (library.trees.length === 0) continue;
    let parentId: string | null | undefined;

    for (const tree of library.trees) {
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

      if (parentId === undefined) {
        const parentFolder = await ensureItemFolder(library.folderName, null);
        parentId = parentFolder?.id ?? null;
      }
      const subFolder = await ensureItemFolder(tree.folderName, parentId ?? null);
      const subId = subFolder?.id ?? null;
      newTreeNames.push(`${tree.folderName} (${library.folderName})`);

      for (const node of tree.nodes) {
        const data = foundry.utils.duplicate(node.itemData);
        (data as any).folder = subId;
        toCreate.push(data);
      }
    }
  }

  let count = 0;
  if (toCreate.length > 0) {
    const created = await (Item as any).createDocuments(toCreate, { render: false });
    count = Array.isArray(created) ? created.length : 0;
  }

  if (count > 0) {
    console.log(`Mastery System | Seeded ${count} artifact node items`, newTreeNames);
    const folderHint = newTreeNames.length
      ? ` — new trees: ${newTreeNames.join(', ')}`
      : '';
    ui.notifications?.info(
      `Seeded ${count} artifact items.${folderHint} Look under Items → Echo Artifacts / General Artifacts.`,
    );
  }
  if (upgraded > 0) {
    console.log(`Mastery System | Refreshed ${upgraded} artifact node items to v${ECHO_ARTIFACT_SEED_VERSION}`);
    ui.notifications?.info(
      `Refreshed ${upgraded} artifact items to v${ECHO_ARTIFACT_SEED_VERSION} (icons, base values, abilities).`,
    );
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
