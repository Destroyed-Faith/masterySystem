/**
 * Shared artifact link / upgrade actions for the Evolution dialog and
 * Equipment-tab controls on the character sheet.
 */

import {
  ARTIFACT_CAPACITY_DEFAULT,
  ARTIFACT_LINK_STONE_COST,
  ARTIFACT_UPGRADE_XP_COST,
  canArtifactLink,
  canBindMoreArtifacts,
  canSpendArtifactLinkStone,
  countBoundArtifacts,
  getArtifactBindingKind,
  getMaxArtifactSystemLevelForMasteryRank,
  isArtifactLinkedOnActor,
  readActorArtifactProgress,
  serializeActorArtifactProgress,
  spendArtifactLinkStone,
  type ArtifactActorProgress,
} from '../utils/artifact-actor-rules.js';
import { summarizeEmbeddedArtifactDisplay } from '../utils/artifact-echo-repair.js';
import {
  buildArtifactDisplayLabels,
  collectArtifactNodeMeta,
  getChildWorldItemsForNode,
  getWorldArtifactItemsInFolder,
  resolveWorldItemByNodeId,
} from '../utils/artifact-actor-tree.js';
import { isBumped, recordBump } from '../utils/xp-step-rule.js';

export interface ArtifactEvolutionPath {
  worldItemId: string;
  nodeId: string;
  label: string;
  targetLevel: number;
  disabledReason: string;
}

export interface ArtifactEvolutionCard {
  embeddedId: string;
  displayName: string;
  rootWorldId: string;
  folderId: string;
  masteryRank: number;
  maxSystemLevel: number;
  canLinkRules: boolean;
  linked: boolean;
  progress: ArtifactActorProgress;
  currentSystemLevel: number;
  currentLabel: string;
  xp: number;
  stones: number;
  paths: ArtifactEvolutionPath[];
  atMaxTierForMr: boolean;
  bindingKind: 'unbound' | 'bound' | 'echo';
  isEchoBound: boolean;
  linkDisabledReason: string;
  canActivate: boolean;
  nextUpgrade: ArtifactEvolutionPath | null;
  baseValues: Array<{ label: string; value: string }>;
  abilities: Array<{ name: string; type: string; effect: string }>;
  hasBaseValues: boolean;
  hasAbilities: boolean;
}

function actorXpAvailable(actor: Actor): number {
  const sys = (actor.system as any) || {};
  const regular = Math.max(0, Number(sys.points?.xp) || 0);
  const free = Math.max(0, Number(sys.points?.xpFree) || 0);
  return regular + free;
}

async function spendActorXp(actor: Actor, amount: number): Promise<boolean> {
  const sys = (actor.system as any) || {};
  const free = Math.max(0, Number(sys.points?.xpFree) || 0);
  const regular = Math.max(0, Number(sys.points?.xp) || 0);
  if (free + regular < amount) return false;
  const fromFree = Math.min(free, amount);
  const fromRegular = amount - fromFree;
  const spent = (sys.xp?.totalSpent ?? 0);
  await actor.update({
    'system.points.xpFree': free - fromFree,
    'system.points.xp': regular - fromRegular,
    'system.xp.totalSpent': spent + amount,
  });
  return true;
}

function readStepArtifacts(actor: Actor): string[] {
  const raw = (actor.system as any)?.xp?.currentStep?.artifacts;
  return Array.isArray(raw) ? raw.map((v) => String(v ?? '')) : [];
}

/** Build evolution cards for every tree-linked embedded artifact on the actor. */
export function buildArtifactEvolutionCards(actor: Actor): ArtifactEvolutionCard[] {
  const A = actor as any;
  const items: any[] = Array.from(A.items.filter((i: any) => i.type === 'artifact'));
  const cards: ArtifactEvolutionCard[] = [];
  const masteryRank = (actor.system as any)?.mastery?.rank ?? 1;
  const maxSys = getMaxArtifactSystemLevelForMasteryRank(masteryRank);
  const boundCount = countBoundArtifacts(actor);
  const canBindOneMore = canBindMoreArtifacts(actor);
  const stepArtifacts = readStepArtifacts(actor);
  const stepState = {
    attributes: [] as string[],
    skills: [] as string[],
    powers: [] as string[],
    artifacts: stepArtifacts,
  };
  const stones = Math.max(0, Number((actor.system as any)?.stones?.current) || 0);

  for (const emb of items) {
    const rootWorldId = emb.getFlag('mastery-system', 'evolutionRootItemId') as string | undefined;
    const embeddedNodeId = emb.getFlag('mastery-system', 'evolutionNodeId') as string | undefined;
    if (!rootWorldId || !embeddedNodeId) continue;

    const rootWorld = (game as any).items?.get(rootWorldId);
    if (!rootWorld || rootWorld.type !== 'artifact') continue;

    const folderId = rootWorld.folder?.id;
    if (!folderId) continue;

    const folderItems = getWorldArtifactItemsInFolder(folderId);
    const metaMap = collectArtifactNodeMeta(folderItems);
    const labels = buildArtifactDisplayLabels(metaMap);

    const rootNodeId = (rootWorld as any).getFlag('mastery-system', 'nodeId') as string;
    const actorLevels = ((rootWorld as any).getFlag('mastery-system', 'actorLevels') || {}) as Record<string, unknown>;
    const rawProg = actorLevels[A.id];
    let progress = readActorArtifactProgress(rawProg, rootNodeId);
    if (embeddedNodeId && progress.nodeId !== embeddedNodeId) {
      progress = { ...progress, nodeId: embeddedNodeId };
    }

    const currentWorld = resolveWorldItemByNodeId(progress.nodeId, folderItems);
    if (!currentWorld) continue;

    const currentSysLevel = (currentWorld.system as any)?.level ?? 1;
    const childItems = getChildWorldItemsForNode(progress.nodeId, folderItems);

    const embeddedId = String(emb.id);
    const alreadyBumped = isBumped(stepState as any, 'artifact', embeddedId);
    const bindingKind = getArtifactBindingKind(emb);
    const isEchoBound = bindingKind === 'echo';
    const linked = isArtifactLinkedOnActor(A, emb);
    const display = summarizeEmbeddedArtifactDisplay(emb, linked);

    let linkDisabledReason = '';
    if (linked) {
      linkDisabledReason = '';
    } else if (!canArtifactLink(masteryRank)) {
      linkDisabledReason = 'Mastery Rank 2+ required to activate.';
    } else if (!canSpendArtifactLinkStone(actor)) {
      linkDisabledReason = `Not enough Stones (need ${ARTIFACT_LINK_STONE_COST}).`;
    } else if (!isEchoBound && bindingKind === 'unbound' && !canBindOneMore) {
      linkDisabledReason = `Artifact Capacity full (${boundCount}/${ARTIFACT_CAPACITY_DEFAULT}). Unbind an Artifact first.`;
    }

    const paths = childItems.map((child) => {
      const cid = (child as any).getFlag('mastery-system', 'nodeId') as string;
      const tl = (child.system as any)?.level ?? currentSysLevel + 1;
      let disabledReason = '';
      if (!linked) disabledReason = 'Activate the artifact first.';
      else if (!canArtifactLink(masteryRank)) disabledReason = 'Mastery Rank 2+ required.';
      else if (tl > maxSys) disabledReason = `Your MR allows artifact level up to ${maxSys} only.`;
      else if (actorXpAvailable(actor) < ARTIFACT_UPGRADE_XP_COST) disabledReason = 'Not enough XP.';
      else if (alreadyBumped) disabledReason = 'Already upgraded this Upgrade Step.';

      const ch = child as any;
      return {
        worldItemId: ch.id,
        nodeId: cid,
        label: labels.get(cid) || ch.name,
        targetLevel: tl,
        disabledReason,
      };
    });

    const nextUpgrade = paths.find((p) => !p.disabledReason) || null;

    const rw = rootWorld as any;
    cards.push({
      embeddedId,
      displayName: rw.name?.replace(/\s*-\s*Level\s*1-1\s*$/i, '').trim() || emb.name,
      rootWorldId: rw.id,
      folderId,
      masteryRank,
      maxSystemLevel: maxSys,
      canLinkRules: canArtifactLink(masteryRank),
      linked,
      progress,
      currentSystemLevel: currentSysLevel,
      currentLabel: labels.get(progress.nodeId) || `Level ${currentSysLevel}`,
      xp: actorXpAvailable(actor),
      stones,
      paths,
      atMaxTierForMr: linked && currentSysLevel >= maxSys && maxSys >= 1,
      bindingKind,
      isEchoBound,
      linkDisabledReason,
      canActivate: !linked && !linkDisabledReason,
      nextUpgrade: linked ? nextUpgrade : null,
      baseValues: display.baseValues,
      abilities: display.abilities,
      hasBaseValues: display.hasBaseValues,
      hasAbilities: display.hasAbilities,
    });
  }

  return cards;
}

/** Activate (link) an artifact — costs 1 Stone once. */
export async function linkArtifactForActor(
  actor: Actor,
  rootWorldId: string,
  embeddedId: string,
): Promise<boolean> {
  const A = actor as any;
  if (!A.isOwner) return false;

  const mr = (actor.system as any)?.mastery?.rank ?? 1;
  if (!canArtifactLink(mr)) {
    ui.notifications?.warn('Mastery Rank 2+ is required to activate an artifact.');
    return false;
  }

  const root = (game as any).items?.get(rootWorldId);
  if (!root) return false;

  const rootNodeId = root.getFlag('mastery-system', 'nodeId') as string;
  const levels = { ...((root.getFlag('mastery-system', 'actorLevels') || {}) as any) };
  const emb = A.items.get(embeddedId);
  if (emb && isArtifactLinkedOnActor(actor, emb)) {
    ui.notifications?.info('Already activated.');
    return false;
  }

  const cur = readActorArtifactProgress(levels[A.id], rootNodeId);
  if (emb) {
    const currentKind = getArtifactBindingKind(emb);
    if (currentKind === 'unbound' && !canBindMoreArtifacts(actor)) {
      ui.notifications?.warn(
        `Artifact Capacity full (${countBoundArtifacts(actor)}/${ARTIFACT_CAPACITY_DEFAULT}). Unbind another Artifact first.`,
      );
      return false;
    }
  }

  if (!canSpendArtifactLinkStone(actor)) {
    ui.notifications?.warn(`Not enough Stones (need ${ARTIFACT_LINK_STONE_COST}).`);
    return false;
  }

  if (!(await spendArtifactLinkStone(actor))) {
    ui.notifications?.warn(`Not enough Stones (need ${ARTIFACT_LINK_STONE_COST}).`);
    return false;
  }

  const next: ArtifactActorProgress = { ...cur, linked: true };
  levels[A.id] = serializeActorArtifactProgress(next);
  await root.setFlag('mastery-system', 'actorLevels', levels);

  if (emb) {
    await emb.setFlag('mastery-system', 'artifactActivated', true);
    const currentKind = getArtifactBindingKind(emb);
    if (currentKind === 'unbound') {
      try {
        await emb.update({ 'system.binding': 'bound' });
      } catch (err) {
        console.warn('[mastery-system] could not set binding=bound on artifact', err);
      }
    }
  }

  ui.notifications?.info(`Artifact activated (${ARTIFACT_LINK_STONE_COST} Stone). You can now spend XP to evolve it.`);
  return true;
}

/** Upgrade an artifact one tree step — costs 8 XP. */
export async function upgradeArtifactForActor(
  actor: Actor,
  rootWorldId: string,
  embeddedId: string,
  targetWorldItemId: string,
  targetNodeId: string,
): Promise<boolean> {
  const A = actor as any;
  if (!A.isOwner) return false;

  const root = (game as any).items?.get(rootWorldId);
  const targetWorld = (game as any).items?.get(targetWorldItemId);
  const emb = A.items.get(embeddedId);
  if (!root || !targetWorld || !emb) return false;

  const mr = (actor.system as any)?.mastery?.rank ?? 1;
  const maxSys = getMaxArtifactSystemLevelForMasteryRank(mr);
  const rootNodeId = root.getFlag('mastery-system', 'nodeId') as string;
  const levels = { ...((root.getFlag('mastery-system', 'actorLevels') || {}) as any) };
  if (!isArtifactLinkedOnActor(actor, emb)) {
    ui.notifications?.warn('Activate the artifact first.');
    return false;
  }

  const prog = readActorArtifactProgress(levels[A.id], rootNodeId);

  const tl = (targetWorld.system as any)?.level ?? 1;
  if (tl > maxSys) {
    ui.notifications?.warn(`Your Mastery Rank allows artifact level up to ${maxSys} only.`);
    return false;
  }

  const folderId = root.folder?.id;
  const folderItems = getWorldArtifactItemsInFolder(folderId);
  const currentWorld = resolveWorldItemByNodeId(prog.nodeId, folderItems);
  if (!currentWorld) return false;

  const tw = targetWorld as any;
  const allowedChildren = getChildWorldItemsForNode(prog.nodeId, folderItems).map((c) => (c as any).id);
  if (!allowedChildren.includes(tw.id)) {
    ui.notifications?.error('Invalid evolution step.');
    return false;
  }

  const stepRaw = (actor.system as any)?.xp?.currentStep ?? {};
  const stepNow = {
    attributes: Array.isArray(stepRaw.attributes) ? [...stepRaw.attributes] : [],
    skills: Array.isArray(stepRaw.skills) ? [...stepRaw.skills] : [],
    powers: Array.isArray(stepRaw.powers) ? [...stepRaw.powers] : [],
    artifacts: Array.isArray(stepRaw.artifacts) ? [...stepRaw.artifacts] : [],
  };
  if (isBumped(stepNow as any, 'artifact', embeddedId)) {
    ui.notifications?.warn(
      'This artifact was already upgraded this Upgrade Step. End the current step first to upgrade it again.',
    );
    return false;
  }

  if (!(await spendActorXp(actor, ARTIFACT_UPGRADE_XP_COST))) {
    ui.notifications?.warn(`Not enough XP (need ${ARTIFACT_UPGRADE_XP_COST}).`);
    return false;
  }

  const stepAfter = recordBump(stepNow as any, 'artifact', embeddedId);
  await actor.update({
    'system.xp.currentStep.attributes': [...stepAfter.attributes],
    'system.xp.currentStep.skills': [...stepAfter.skills],
    'system.xp.currentStep.powers': [...stepAfter.powers],
    'system.xp.currentStep.artifacts': [...stepAfter.artifacts],
  });

  const equip = emb.getFlag('mastery-system', 'equipment');
  const sys = foundry.utils.duplicate((targetWorld.system as any) || {});
  await emb.update({
    name: targetWorld.name,
    img: targetWorld.img,
    system: sys,
  });
  await emb.setFlag('mastery-system', 'evolutionRootItemId', rootWorldId);
  await emb.setFlag('mastery-system', 'evolutionNodeId', targetNodeId);
  await emb.setFlag('mastery-system', 'artifactActivated', true);
  if (equip) await emb.setFlag('mastery-system', 'equipment', equip);

  const nextProg: ArtifactActorProgress = {
    nodeId: targetNodeId,
    linked: true,
  };
  levels[A.id] = serializeActorArtifactProgress(nextProg);
  await root.setFlag('mastery-system', 'actorLevels', levels);

  ui.notifications?.info(`Evolved to ${tw.name}.`);
  return true;
}
