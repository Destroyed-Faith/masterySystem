/**
 * Actor-facing artifact evolution: link, upgrade along tree, ultimate unlock; path preview.
 */

import {
  ARTIFACT_LINK_STONE_COST,
  ARTIFACT_MAX_SYSTEM_LEVEL,
  ARTIFACT_ULTIMATE_XP_COST,
  ARTIFACT_UPGRADE_STONE_COST,
  ARTIFACT_UPGRADE_XP_COST,
  canArtifactLink,
  canUnlockArtifactUltimate,
  getMaxArtifactSystemLevelForMasteryRank,
  readActorArtifactProgress,
  serializeActorArtifactProgress,
  type ArtifactActorProgress
} from '../utils/artifact-actor-rules.js';
import {
  buildArtifactDisplayLabels,
  collectArtifactNodeMeta,
  findRootWorldArtifactInFolder,
  getChildWorldItemsForNode,
  getWorldArtifactItemsInFolder,
  resolveWorldItemByNodeId
} from '../utils/artifact-actor-tree.js';

const BaseApp: any = (foundry as any)?.appv1?.Application || (Application as any);

function actorXpAvailable(actor: Actor): number {
  return (actor.system as any)?.points?.xp ?? 0;
}

function actorStonesCurrent(actor: Actor): number {
  return (actor.system as any)?.stones?.current ?? 0;
}

async function spendActorXp(actor: Actor, amount: number): Promise<boolean> {
  const avail = actorXpAvailable(actor);
  if (avail < amount) return false;
  const spent = (actor.system as any)?.xp?.totalSpent ?? 0;
  await actor.update({
    'system.points.xp': avail - amount,
    'system.xp.totalSpent': spent + amount
  });
  return true;
}

async function spendActorStones(actor: Actor, amount: number): Promise<boolean> {
  const cur = actorStonesCurrent(actor);
  if (cur < amount) return false;
  await actor.update({ 'system.stones.current': cur - amount });
  return true;
}

interface EvolutionCard {
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
  stones: number;
  xp: number;
  paths: {
    worldItemId: string;
    nodeId: string;
    label: string;
    targetLevel: number;
    disabledReason: string;
  }[];
  canUltimate: boolean;
  ultimateUnlocked: boolean;
  atMaxTierForMr: boolean;
}

export class ArtifactEvolutionDialog extends BaseApp {
  private actor: Actor;

  constructor(actor: Actor) {
    super();
    this.actor = actor;
  }

  static get defaultOptions(): any {
    return foundry.utils.mergeObject(super.defaultOptions || {}, {
      id: 'artifact-evolution-dialog',
      title: 'Artifact evolution',
      template: 'systems/mastery-system/templates/artifacts/artifact-evolution-dialog.hbs',
      classes: ['mastery-system', 'artifact-evolution-dialog'],
      width: 560,
      height: 640,
      resizable: true
    });
  }

  private buildCards(): EvolutionCard[] {
    const A = this.actor as any;
    const items: any[] = Array.from(A.items.filter((i: any) => i.type === 'artifact'));
    const cards: EvolutionCard[] = [];
    const masteryRank = (this.actor.system as any)?.mastery?.rank ?? 1;
    const maxSys = getMaxArtifactSystemLevelForMasteryRank(masteryRank);

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

      const paths = childItems.map((child) => {
        const cid = (child as any).getFlag('mastery-system', 'nodeId') as string;
        const tl = (child.system as any)?.level ?? currentSysLevel + 1;
        let disabledReason = '';
        if (!progress.linked) disabledReason = 'Link the artifact first (1 stone).';
        else if (!canArtifactLink(masteryRank)) disabledReason = 'Mastery Rank 2+ required to link.';
        else if (tl > maxSys) disabledReason = `Your MR allows artifact level up to ${maxSys} only.`;
        else if (actorStonesCurrent(this.actor as Actor) < ARTIFACT_UPGRADE_STONE_COST) disabledReason = 'Not enough stones.';
        else if (actorXpAvailable(this.actor as Actor) < ARTIFACT_UPGRADE_XP_COST) disabledReason = 'Not enough XP.';

        const ch = child as any;
        return {
          worldItemId: ch.id,
          nodeId: cid,
          label: labels.get(cid) || ch.name,
          targetLevel: tl,
          disabledReason
        };
      });

      const atMax = currentSysLevel >= maxSys && maxSys >= 1;
      const canUlt = canUnlockArtifactUltimate(masteryRank) && atMax && progress.linked && currentSysLevel >= ARTIFACT_MAX_SYSTEM_LEVEL;

      const rw = rootWorld as any;
      cards.push({
        embeddedId: emb.id as string,
        displayName: rw.name?.replace(/\s*-\s*Level\s*1-1\s*$/i, '').trim() || emb.name,
        rootWorldId: rw.id,
        folderId,
        masteryRank,
        maxSystemLevel: maxSys,
        canLinkRules: canArtifactLink(masteryRank),
        linked: progress.linked,
        progress,
        currentSystemLevel: currentSysLevel,
        currentLabel: labels.get(progress.nodeId) || `Level ${currentSysLevel}`,
        stones: actorStonesCurrent(this.actor),
        xp: actorXpAvailable(this.actor),
        paths,
        canUltimate: Boolean(canUlt),
        ultimateUnlocked: Boolean(progress.ultimateUnlocked),
        atMaxTierForMr: atMax
      });
    }

    return cards;
  }

  getData(_options?: any): any {
    const data: any = super.getData ? super.getData(_options) : {};
    data.actor = this.actor;
    data.cards = this.buildCards();
    data.constants = {
      linkStone: ARTIFACT_LINK_STONE_COST,
      upStone: ARTIFACT_UPGRADE_STONE_COST,
      upXp: ARTIFACT_UPGRADE_XP_COST,
      ultXp: ARTIFACT_ULTIMATE_XP_COST,
      maxLevel: ARTIFACT_MAX_SYSTEM_LEVEL
    };
    return data;
  }

  activateListeners(html: JQuery): void {
    super.activateListeners(html);

    html.find('[data-action="ae-close"]').on('click', () => (this as any).close());

    html.on('click', '[data-action="ae-link"]', async (e: JQuery.ClickEvent) => {
      const rootId = $(e.currentTarget).data('root-id');
      const embId = $(e.currentTarget).data('emb-id');
      await this.onLink(String(rootId), String(embId));
    });

    html.on('click', '[data-action="ae-upgrade"]', async (e: JQuery.ClickEvent) => {
      const rootId = $(e.currentTarget).data('root-id');
      const embId = $(e.currentTarget).data('emb-id');
      const targetWorldId = $(e.currentTarget).data('target-world-id');
      const targetNodeId = $(e.currentTarget).data('target-node-id');
      await this.onUpgrade(String(rootId), String(embId), String(targetWorldId), String(targetNodeId));
    });

    html.on('click', '[data-action="ae-ultimate"]', async (e: JQuery.ClickEvent) => {
      const rootId = $(e.currentTarget).data('root-id');
      const embId = $(e.currentTarget).data('emb-id');
      await this.onUltimate(String(rootId), String(embId));
    });
  }

  private async onLink(rootWorldId: string, embeddedId: string): Promise<void> {
    const A = this.actor as any;
    if (!A.isOwner) return;
    const mr = (this.actor.system as any)?.mastery?.rank ?? 1;
    if (!canArtifactLink(mr)) {
      ui.notifications?.warn('Mastery Rank 2+ is required to link an artifact.');
      return;
    }
    const root = (game as any).items?.get(rootWorldId);
    if (!root) return;

    const rootNodeId = root.getFlag('mastery-system', 'nodeId') as string;
    const levels = { ...((root.getFlag('mastery-system', 'actorLevels') || {}) as any) };
    const cur = readActorArtifactProgress(levels[A.id], rootNodeId);
    if (cur.linked) {
      ui.notifications?.info('Already linked.');
      return;
    }
    if (!(await spendActorStones(this.actor, ARTIFACT_LINK_STONE_COST))) {
      ui.notifications?.warn(`Not enough stones (need ${ARTIFACT_LINK_STONE_COST}).`);
      return;
    }

    const next: ArtifactActorProgress = { ...cur, linked: true };
    levels[A.id] = serializeActorArtifactProgress(next);
    await root.setFlag('mastery-system', 'actorLevels', levels);
    ui.notifications?.info('Artifact linked. You can now spend stones + XP to evolve along the tree.');
    await (this as any).render(false);
  }

  private async onUpgrade(
    rootWorldId: string,
    embeddedId: string,
    targetWorldItemId: string,
    targetNodeId: string
  ): Promise<void> {
    const A = this.actor as any;
    if (!A.isOwner) return;
    const root = (game as any).items?.get(rootWorldId);
    const targetWorld = (game as any).items?.get(targetWorldItemId);
    const emb = A.items.get(embeddedId);
    if (!root || !targetWorld || !emb) return;

    const mr = (this.actor.system as any)?.mastery?.rank ?? 1;
    const maxSys = getMaxArtifactSystemLevelForMasteryRank(mr);
    const rootNodeId = root.getFlag('mastery-system', 'nodeId') as string;
    const levels = { ...((root.getFlag('mastery-system', 'actorLevels') || {}) as any) };
    const prog = readActorArtifactProgress(levels[A.id], rootNodeId);
    if (!prog.linked) {
      ui.notifications?.warn('Link the artifact first.');
      return;
    }

    const tl = (targetWorld.system as any)?.level ?? 1;
    if (tl > maxSys) {
      ui.notifications?.warn(`Your Mastery Rank allows artifact level up to ${maxSys} only.`);
      return;
    }

    const folderId = root.folder?.id;
    const folderItems = getWorldArtifactItemsInFolder(folderId);
    const currentWorld = resolveWorldItemByNodeId(prog.nodeId, folderItems);
    if (!currentWorld) return;
    const tw = targetWorld as any;
    const allowedChildren = getChildWorldItemsForNode(prog.nodeId, folderItems).map((c) => (c as any).id);
    if (!allowedChildren.includes(tw.id)) {
      ui.notifications?.error('Invalid evolution step.');
      return;
    }

    if (!(await spendActorStones(this.actor, ARTIFACT_UPGRADE_STONE_COST))) {
      ui.notifications?.warn(`Not enough stones (need ${ARTIFACT_UPGRADE_STONE_COST}).`);
      return;
    }
    if (!(await spendActorXp(this.actor, ARTIFACT_UPGRADE_XP_COST))) {
      ui.notifications?.warn(`Not enough XP (need ${ARTIFACT_UPGRADE_XP_COST}).`);
      return;
    }

    const equip = emb.getFlag('mastery-system', 'equipment');
    const sys = foundry.utils.duplicate((targetWorld.system as any) || {});
    await emb.update({
      name: targetWorld.name,
      img: targetWorld.img,
      system: sys
    });
    await emb.setFlag('mastery-system', 'evolutionRootItemId', rootWorldId);
    await emb.setFlag('mastery-system', 'evolutionNodeId', targetNodeId);
    if (equip) await emb.setFlag('mastery-system', 'equipment', equip);

    const nextProg: ArtifactActorProgress = {
      nodeId: targetNodeId,
      linked: true,
      ultimateUnlocked: prog.ultimateUnlocked
    };
    levels[A.id] = serializeActorArtifactProgress(nextProg);
    await root.setFlag('mastery-system', 'actorLevels', levels);

    ui.notifications?.info(`Evolved to ${tw.name}.`);
    await (this as any).render(false);
  }

  private async onUltimate(rootWorldId: string, _embeddedId: string): Promise<void> {
    const A = this.actor as any;
    if (!A.isOwner) return;
    if (!canUnlockArtifactUltimate((this.actor.system as any)?.mastery?.rank ?? 1)) {
      ui.notifications?.warn('Ultimate unlock requires Mastery Rank 6.');
      return;
    }
    const root = (game as any).items?.get(rootWorldId);
    if (!root) return;
    const rootNodeId = root.getFlag('mastery-system', 'nodeId') as string;
    const levels = { ...((root.getFlag('mastery-system', 'actorLevels') || {}) as any) };
    const prog = readActorArtifactProgress(levels[A.id], rootNodeId);
    if (!prog.linked) {
      ui.notifications?.warn('Link the artifact first.');
      return;
    }
    const folderItems = getWorldArtifactItemsInFolder(root.folder?.id);
    const cur = resolveWorldItemByNodeId(prog.nodeId, folderItems);
    const sl = (cur?.system as any)?.level ?? 1;
    if (sl < ARTIFACT_MAX_SYSTEM_LEVEL) {
      ui.notifications?.warn(`Reach artifact level ${ARTIFACT_MAX_SYSTEM_LEVEL} first.`);
      return;
    }
    if (prog.ultimateUnlocked) {
      ui.notifications?.info('Ultimate already unlocked.');
      return;
    }
    if (!(await spendActorXp(this.actor, ARTIFACT_ULTIMATE_XP_COST))) {
      ui.notifications?.warn(`Not enough XP (need ${ARTIFACT_ULTIMATE_XP_COST}).`);
      return;
    }

    const next: ArtifactActorProgress = { ...prog, ultimateUnlocked: true };
    levels[A.id] = serializeActorArtifactProgress(next);
    await root.setFlag('mastery-system', 'actorLevels', levels);
    ui.notifications?.info('Ultimate unlocked for this artifact (narrative / mechanical effects: define with your GM).');
    await (this as any).render(false);
  }
}

export async function openArtifactEvolutionDialog(actor: Actor): Promise<void> {
  const dlg = new ArtifactEvolutionDialog(actor);
  (dlg as any).render(true);
}
