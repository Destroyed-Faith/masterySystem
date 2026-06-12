/**
 * Grant / wire embedded artifacts to world Builder-Trees for evolution.
 */

import {
  readActorArtifactProgress,
  serializeActorArtifactProgress,
} from './artifact-actor-rules.js';
import {
  findRootWorldArtifactInFolder,
  getWorldArtifactItemsInFolder,
  resolveWorldItemByNodeId,
} from './artifact-actor-tree.js';
import { findEchoArtifactRootInWorld } from './seed-artifact-library.js';
import { GENERAL_ARTIFACTS } from './general-artifacts.js';

export interface WireArtifactResult {
  ok: boolean;
  reason?: string;
  alreadyWired?: boolean;
}

/** Infer catalog key from item display name (Echo + General artifacts). */
export function inferArtifactKeyFromName(name: string): string | null {
  const n = String(name || '').toLowerCase();
  for (const [key, def] of Object.entries(GENERAL_ARTIFACTS)) {
    if (n.includes(def.name.toLowerCase())) return key;
  }
  if (n.includes('dragon head')) return 'dragonHead';
  if (n.includes('dragon claw')) return 'dragonClaws';
  if (n.includes('serpent scale')) return 'serpentScales';
  if (n.includes('wyrm scale')) return 'wyrmScales';
  if (n.includes('titan scar')) return 'titanScars';
  if (n.includes('stonebound sole')) return 'stoneboundSoles';
  if (n.includes('elven stride') && n.includes('fire')) return 'elvenStrideFire';
  if (n.includes('elven stride') && n.includes('earth')) return 'elvenStrideEarth';
  if (n.includes('elven stride') && n.includes('water')) return 'elvenStrideWater';
  if (n.includes('elven stride') && n.includes('air')) return 'elvenStrideAir';
  if (n.includes('sentinel frame')) return 'sentinelFrame';
  if (n.includes('judicator frame')) return 'judicatorFrame';
  if (n.includes('oracle frame')) return 'oracleFrame';
  return null;
}

function resolveRootForArtifactKey(artifactKey: string): any | null {
  return findEchoArtifactRootInWorld(artifactKey);
}

function resolveRootFromWorldItem(worldItem: any): any | null {
  if (!worldItem?.folder?.id) return null;
  return findRootWorldArtifactInFolder(worldItem.folder.id) ?? null;
}

/**
 * Wire an embedded artifact to its world evolution tree.
 * Idempotent when already wired to the same tree.
 */
export async function wireEmbeddedArtifactToWorldTree(
  actor: Actor,
  embeddedItem: any,
  options: { sourceWorldItem?: any; notify?: boolean } = {},
): Promise<WireArtifactResult> {
  if (!actor || !embeddedItem || embeddedItem.type !== 'artifact') {
    return { ok: false, reason: 'Not an artifact item.' };
  }

  const existingRootId = embeddedItem.getFlag?.('mastery-system', 'evolutionRootItemId') as
    | string
    | undefined;
  if (existingRootId) return { ok: true, alreadyWired: true };

  const sourceWorld = options.sourceWorldItem;
  const artifactKey =
    (embeddedItem.getFlag?.('mastery-system', 'echoArtifactKey') as string | undefined) ||
    (sourceWorld?.getFlag?.('mastery-system', 'echoArtifactKey') as string | undefined) ||
    inferArtifactKeyFromName(embeddedItem.name) ||
    (sourceWorld ? inferArtifactKeyFromName(sourceWorld.name) : null);

  let rootItem: any = artifactKey ? resolveRootForArtifactKey(artifactKey) : null;
  if (!rootItem && sourceWorld) {
    rootItem = resolveRootFromWorldItem(sourceWorld);
  }

  if (!rootItem) {
    return { ok: false, reason: 'No matching world artifact tree found. Seed the library first.' };
  }

  const rootId = rootItem.id as string;
  const rootNodeId = rootItem.getFlag?.('mastery-system', 'nodeId') as string | undefined;
  if (!rootNodeId) return { ok: false, reason: 'World tree root has no nodeId.' };

  const duplicate = Array.from((actor as any).items).find(
    (i: any) =>
      i.type === 'artifact' &&
      i.id !== embeddedItem.id &&
      i.getFlag?.('mastery-system', 'evolutionRootItemId') === rootId,
  );
  if (duplicate) {
    return { ok: false, reason: 'This actor already has an item from this artifact tree.' };
  }

  let nodeId = rootNodeId;
  const sourceNodeId =
    (sourceWorld?.getFlag?.('mastery-system', 'nodeId') as string | undefined) ||
    (embeddedItem.getFlag?.('mastery-system', 'nodeId') as string | undefined);
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

  const actorId = (actor as any).id;
  const levels = {
    ...((rootItem.getFlag?.('mastery-system', 'actorLevels') || {}) as Record<string, unknown>),
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
    ui.notifications?.info(
      `${embeddedItem.name} linked to the artifact evolution tree. Activate it in Progression (1 Stone at MR 2+).`,
    );
  }

  return { ok: true };
}

/**
 * Grant the Level-1 root of an artifact tree to an actor (Echo or General).
 */
export async function grantArtifactTreeToActor(
  actor: Actor,
  artifactKey: string,
): Promise<any | null> {
  const rootItem = findEchoArtifactRootInWorld(artifactKey);
  if (!rootItem) return null;

  const rootId = rootItem.id as string;

  const existing = Array.from((actor as any).items).find(
    (i: any) =>
      i.type === 'artifact' && i.getFlag?.('mastery-system', 'evolutionRootItemId') === rootId,
  );
  if (existing) {
    const emb = existing as any;
    const { embeddedArtifactNeedsSync, syncEmbeddedArtifactFromWorldNode } = await import(
      './artifact-echo-repair.js'
    );
    if (embeddedArtifactNeedsSync(emb)) {
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

  const wire = await wireEmbeddedArtifactToWorldTree(actor, created, {
    sourceWorldItem: rootItem,
    notify: false,
  });
  if (!wire.ok && !wire.alreadyWired) {
    console.warn('[mastery-system] grantArtifactTreeToActor wire failed', wire.reason);
  }

  await created.setFlag('mastery-system', 'echoArtifactKey', artifactKey);
  await created.setFlag('mastery-system', 'artifactActivated', false);

  const rootNodeId = rootItem.getFlag?.('mastery-system', 'nodeId') as string;
  const actorId = (actor as any).id;
  const levels = { ...((rootItem.getFlag('mastery-system', 'actorLevels') || {}) as any) };
  levels[actorId] = serializeActorArtifactProgress({ nodeId: rootNodeId, linked: false });
  await rootItem.setFlag('mastery-system', 'actorLevels', levels);

  return created;
}

/** @deprecated Use grantArtifactTreeToActor — kept for existing imports. */
export async function grantEchoArtifactTreeToActor(
  actor: Actor,
  echoArtifactKey: string,
): Promise<any | null> {
  return grantArtifactTreeToActor(actor, echoArtifactKey);
}

/** True when actor has any embedded artifact (wired or wireable). */
export function actorHasProgressionArtifacts(actor: Actor): boolean {
  const A = actor as any;
  if (!A?.items?.filter) return false;
  return Array.from(A.items.filter((i: any) => i.type === 'artifact')).length > 0;
}

/** Embedded artifacts missing evolution wiring but potentially repairable. */
export function listUnwiredEmbeddedArtifacts(actor: Actor): any[] {
  const out: any[] = [];
  const A = actor as any;
  if (!A?.items?.filter) return out;
  for (const emb of Array.from(A.items.filter((i: any) => i.type === 'artifact')) as any[]) {
    if (emb.getFlag?.('mastery-system', 'evolutionRootItemId')) continue;
    const key =
      (emb.getFlag?.('mastery-system', 'echoArtifactKey') as string | undefined) ||
      inferArtifactKeyFromName(emb.name);
    if (key || emb.getFlag?.('mastery-system', 'nodeId')) out.push(emb);
  }
  return out;
}

/**
 * Reset a general (non-Echo) embedded artifact to Level 1 / inactive while
 * keeping it on the actor. Used during character reset for recreation.
 */
export async function resetGeneralArtifactForRecreation(actor: Actor, emb: any): Promise<void> {
  if (!emb || emb.type !== 'artifact') return;

  if (!emb.getFlag?.('mastery-system', 'evolutionRootItemId')) {
    await wireEmbeddedArtifactToWorldTree(actor, emb, { notify: false });
  }

  const rootWorldId = emb.getFlag?.('mastery-system', 'evolutionRootItemId') as string | undefined;
  if (!rootWorldId) return;

  const root = (game as any).items?.get(rootWorldId);
  if (!root) return;

  const rootNodeId = root.getFlag?.('mastery-system', 'nodeId') as string | undefined;
  if (!rootNodeId) return;

  const actorId = (actor as any).id;
  const levels = {
    ...((root.getFlag?.('mastery-system', 'actorLevels') || {}) as Record<string, unknown>),
  };
  levels[actorId] = serializeActorArtifactProgress({ nodeId: rootNodeId, linked: false });
  await root.setFlag('mastery-system', 'actorLevels', levels);

  await emb.setFlag('mastery-system', 'evolutionNodeId', rootNodeId);
  await emb.setFlag('mastery-system', 'artifactActivated', false);
  if (typeof emb.unsetFlag === 'function') {
    await emb.unsetFlag('mastery-system', 'artifactActivationStoneAttr');
  }

  const { syncEmbeddedArtifactFromWorldNode } = await import('./artifact-echo-repair.js');
  await syncEmbeddedArtifactFromWorldNode(emb, actor);
}
