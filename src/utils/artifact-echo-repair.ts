/**
 * Repair / sync embedded Echo artifacts against the world Builder-Tree.
 */

import {
  getArtifactBindingKind,
  readActorArtifactProgress,
  serializeActorArtifactProgress,
} from './artifact-actor-rules.js';
import {
  getWorldArtifactItemsInFolder,
  resolveWorldItemByNodeId,
} from './artifact-actor-tree.js';
import { visibleAbilityRows } from './artifact-visible-abilities.js';
import { findEchoArtifactRootInWorld } from './seed-artifact-library.js';

/** True when the embedded copy looks stale (missing progression data). */
export function echoEmbeddedArtifactNeedsSync(emb: any): boolean {
  if (!emb || emb.type !== 'artifact') return false;
  const sys = (emb.system as any) || {};
  const lp = sys.levelProgression;
  const bv = sys.baseValues;
  const hasLp = Array.isArray(lp) && lp.length > 0;
  const hasBv = Array.isArray(bv) && bv.length > 0;
  const echoKey = emb.getFlag?.('mastery-system', 'echoArtifactKey');
  const isEcho = emb.getFlag?.('mastery-system', 'echoBound') || sys.binding === 'echo' || echoKey;
  if (!isEcho) return false;
  return !hasLp || !hasBv;
}

/**
 * Copy name/img/system from the matching world tree node onto the actor item.
 * @returns true when an update was applied.
 */
export async function syncEmbeddedArtifactFromWorldNode(emb: any, actor: any): Promise<boolean> {
  const rootWorldId = emb.getFlag?.('mastery-system', 'evolutionRootItemId') as string | undefined;
  const nodeId = emb.getFlag?.('mastery-system', 'evolutionNodeId') as string | undefined;
  if (!rootWorldId || !nodeId || !actor?.id) return false;

  const root = (game as any).items?.get(rootWorldId);
  if (!root?.folder?.id) return false;

  const folderItems = getWorldArtifactItemsInFolder(root.folder.id);
  const worldNode = resolveWorldItemByNodeId(nodeId, folderItems);
  if (!worldNode) return false;

  const fi = worldNode as any;
  await emb.update({
    name: fi.name,
    img: fi.img,
    system: foundry.utils.duplicate((fi.system as any) || {}),
  });
  return true;
}

/**
 * Wire a legacy / fallback Echo artifact (no evolution root) to the world tree
 * and refresh its Level-1 data.
 */
export async function repairEchoArtifactTreeLink(actor: any, emb: any): Promise<boolean> {
  const echoKey =
    (emb.getFlag?.('mastery-system', 'echoArtifactKey') as string | undefined) ||
    inferEchoKeyFromName(emb.name);
  if (!echoKey) return false;

  const rootItem = findEchoArtifactRootInWorld(echoKey);
  if (!rootItem) return false;

  const rootId = rootItem.id as string;
  const rootNodeId = rootItem.getFlag?.('mastery-system', 'nodeId') as string | undefined;
  if (!rootNodeId) return false;

  await emb.setFlag('mastery-system', 'evolutionRootItemId', rootId);
  await emb.setFlag('mastery-system', 'evolutionNodeId', rootNodeId);
  await emb.setFlag('mastery-system', 'echoArtifactKey', echoKey);

  const actorId = actor.id;
  const levels = { ...((rootItem.getFlag('mastery-system', 'actorLevels') || {}) as Record<string, unknown>) };
  const prev = readActorArtifactProgress(levels[actorId], rootNodeId);
  if (emb.getFlag?.('mastery-system', 'artifactActivated') !== true) {
    levels[actorId] = serializeActorArtifactProgress({ ...prev, linked: false });
    await rootItem.setFlag('mastery-system', 'actorLevels', levels);
  }

  return syncEmbeddedArtifactFromWorldNode(emb, actor);
}

function inferEchoKeyFromName(name: string): string | null {
  const n = String(name || '').toLowerCase();
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

/**
 * Repair all echo artifacts on an actor: wire missing tree links, sync stale
 * Level-1 data from the world library, and ensure activation flags exist.
 */
export async function repairActorEchoArtifacts(actor: any): Promise<number> {
  if (!actor?.items?.filter) return 0;
  let fixes = 0;
  const artifacts: any[] = Array.from(actor.items.filter((it: any) => it.type === 'artifact'));

  for (const emb of artifacts) {
    if (getArtifactBindingKind(emb) !== 'echo') continue;

    const rootWorldId = emb.getFlag?.('mastery-system', 'evolutionRootItemId');
    if (!rootWorldId) {
      if (await repairEchoArtifactTreeLink(actor, emb)) fixes++;
      continue;
    }

    if (echoEmbeddedArtifactNeedsSync(emb)) {
      if (await syncEmbeddedArtifactFromWorldNode(emb, actor)) fixes++;
    }

    const activated = emb.getFlag?.('mastery-system', 'artifactActivated');
    if (activated !== true && activated !== false) {
      await emb.setFlag('mastery-system', 'artifactActivated', false);
      fixes++;
    }
  }

  return fixes;
}

/** Summarize abilities / base values from an embedded artifact for UI panels. */
export function summarizeEmbeddedArtifactDisplay(emb: any, active: boolean) {
  const sys = (emb?.system as any) || {};
  const level = Math.max(1, Math.min(10, Number(sys.currentLevel) || Number(sys.level) || 1));

  const baseValues = active
    ? (Array.isArray(sys.baseValues) ? sys.baseValues : []).map((bv: any) => ({
        label: bv.label || '',
        value: bv.value != null && bv.value !== '' ? String(bv.value) : bv.note || '',
      }))
    : [];

  const abilities = active
    ? visibleAbilityRows(sys.levelProgression, level).map((row: any) => ({
        name: row.name || '',
        type: row.type || '',
        effect: row.effect || '',
      }))
    : [];

  return { baseValues, abilities, hasBaseValues: baseValues.length > 0, hasAbilities: abilities.length > 0 };
}
