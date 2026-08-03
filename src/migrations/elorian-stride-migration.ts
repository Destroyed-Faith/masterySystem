/**
 * GM migration: rename Elves → Elorians and consolidate legacy Elven Stride
 * lineage artifacts into the single Elorian Stride tree.
 */

import {
  findEchoArtifactRootInWorld,
  findEchoArtifactWorldItem,
} from '../utils/seed-artifact-library.js';
import {
  readActorArtifactProgress,
  serializeActorArtifactProgress,
} from '../utils/artifact-actor-rules.js';
const SETTING_NAMESPACE = 'mastery-system';

const LEGACY_STRIDE_KEYS = new Set([
  'elvenStride',
  'elvenStrideFire',
  'elvenStrideEarth',
  'elvenStrideWater',
  'elvenStrideAir',
]);

function remapStrideNodeId(nodeId: string): string {
  const m = String(nodeId || '').match(/^elvenStride(?:Fire|Earth|Water|Air)?-l(\d+)$/);
  if (m) return `elorianStride-l${m[1]}`;
  if (nodeId.startsWith('elvenStride-')) {
    return nodeId.replace(/^elvenStride-/, 'elorianStride-');
  }
  return nodeId;
}

function isLegacyStrideItem(item: any): boolean {
  const key = item?.getFlag?.(SETTING_NAMESPACE, 'echoArtifactKey');
  return item?.type === 'artifact' && LEGACY_STRIDE_KEYS.has(String(key || ''));
}

async function migrateStrideItem(actor: any, item: any): Promise<boolean> {
  const newKey = 'elorianStride';
  const newRoot = findEchoArtifactRootInWorld(newKey);
  if (!newRoot) return false;

  const oldNodeId = String(item.getFlag(SETTING_NAMESPACE, 'evolutionNodeId') || `${newKey}-l1`);
  const newNodeId = remapStrideNodeId(oldNodeId);

  const targetWorld =
    findEchoArtifactWorldItem(newKey, (it) => it.getFlag(SETTING_NAMESPACE, 'nodeId') === newNodeId)
    || newRoot;

  const equip = item.getFlag(SETTING_NAMESPACE, 'equipment');
  const sys = foundry.utils.duplicate((targetWorld.system as any) || {});

  await item.update({
    name: targetWorld.name,
    img: targetWorld.img,
    system: sys,
    'flags.mastery-system.echoArtifactKey': newKey,
    'flags.mastery-system.echoBound': true,
    'flags.mastery-system.evolutionRootItemId': newRoot.id,
    'flags.mastery-system.evolutionNodeId': newNodeId,
  });
  if (equip) {
    await item.setFlag(SETTING_NAMESPACE, 'equipment', equip);
  }

  const actorId = actor.id as string;
  const levels = { ...((newRoot as any).getFlag(SETTING_NAMESPACE, 'actorLevels') || {}) };
  const prev = readActorArtifactProgress(levels[actorId], newNodeId);
  levels[actorId] = serializeActorArtifactProgress({
    nodeId: newNodeId,
    linked: prev.linked !== false,
  });
  await (newRoot as any).setFlag(SETTING_NAMESPACE, 'actorLevels', levels);
  return true;
}

/** Migrate legacy Elven Stride items and rename Elves echo to Elorians. */
export async function runElorianStrideMigration(actors: any[]): Promise<void> {
  if (!game.user?.isGM) return;

  let echoRenamed = 0;
  let artifactsMigrated = 0;

  for (const actor of actors) {
    const echo = (actor.system as any)?.echo;
    if (echo?.key === 'elves') {
      await actor.update({ 'system.echo.key': 'elorians' });
      echoRenamed += 1;
    }

    const legacyItems = Array.from(actor.items || []).filter(isLegacyStrideItem) as any[];
    for (const item of legacyItems) {
      if (await migrateStrideItem(actor, item)) {
        artifactsMigrated += 1;
      }
    }
  }
}
