/**
 * Actor-facing artifact evolution: link, upgrade along tree; path preview.
 *
 * New XP spec — Artifacts:
 *   • Link: free (still gated by MR ≥ 2).
 *   • Upgrade: 8 XP per +1 artifact level. No Stone cost.
 *   • Maximum reachable level = `(MR - 1) × 2`, capped at 16.
 *   • Each Artifact may only be upgraded once per Upgrade Step (new
 *     once-per-step rule shared with Attributes / Skills / Powers).
 *   • Legacy "Ultimate" path and all per-link / per-upgrade Stone costs
 *     have been removed.
 */

import {
  ARTIFACT_CAPACITY_DEFAULT,
  ARTIFACT_MAX_SYSTEM_LEVEL,
  ARTIFACT_UPGRADE_XP_COST,
  canArtifactLink,
  canBindMoreArtifacts,
  countBoundArtifacts,
  getArtifactBindingKind,
  getMaxArtifactSystemLevelForMasteryRank,
  readActorArtifactProgress,
  serializeActorArtifactProgress,
  type ArtifactActorProgress
} from '../utils/artifact-actor-rules.js';
import {
  buildArtifactDisplayLabels,
  collectArtifactNodeMeta,
  getChildWorldItemsForNode,
  getWorldArtifactItemsInFolder,
  resolveWorldItemByNodeId
} from '../utils/artifact-actor-tree.js';
import { isBumped, recordBump } from '../utils/xp-step-rule.js';

const BaseApp: any = (foundry as any)?.appv1?.Application || (Application as any);

function actorXpAvailable(actor: Actor): number {
  return (actor.system as any)?.points?.xp ?? 0;
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
  xp: number;
  paths: {
    worldItemId: string;
    nodeId: string;
    label: string;
    targetLevel: number;
    disabledReason: string;
  }[];
  atMaxTierForMr: boolean;
  bindingKind: 'unbound' | 'bound' | 'echo';
  isEchoBound: boolean;
  linkDisabledReason: string;
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
    const boundCount = countBoundArtifacts(this.actor);
    const canBindOneMore = canBindMoreArtifacts(this.actor);
    const stepState = {
      attributes: [] as string[],
      skills: [] as string[],
      powers: [] as string[],
      artifacts: Array.isArray((this.actor.system as any)?.xp?.currentStep?.artifacts)
        ? ((this.actor.system as any).xp.currentStep.artifacts as unknown[]).map((v) => String(v ?? ''))
        : [],
    };

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

      let linkDisabledReason = '';
      if (progress.linked) {
        linkDisabledReason = '';
      } else if (isEchoBound) {
        linkDisabledReason = 'Echo-bound artifacts are always linked.';
      } else if (!canArtifactLink(masteryRank)) {
        linkDisabledReason = 'Mastery Rank 2+ required to link.';
      } else if (!canBindOneMore) {
        linkDisabledReason = `Artifact Capacity full (${boundCount}/${ARTIFACT_CAPACITY_DEFAULT}). Unbind an Artifact first.`;
      }

      const paths = childItems.map((child) => {
        const cid = (child as any).getFlag('mastery-system', 'nodeId') as string;
        const tl = (child.system as any)?.level ?? currentSysLevel + 1;
        let disabledReason = '';
        if (!progress.linked) disabledReason = 'Link the artifact first.';
        else if (!canArtifactLink(masteryRank)) disabledReason = 'Mastery Rank 2+ required to link.';
        else if (tl > maxSys) disabledReason = `Your MR allows artifact level up to ${maxSys} only.`;
        else if (actorXpAvailable(this.actor as Actor) < ARTIFACT_UPGRADE_XP_COST) disabledReason = 'Not enough XP.';
        else if (alreadyBumped) disabledReason = 'Already upgraded this Upgrade Step.';

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

      const rw = rootWorld as any;
      cards.push({
        embeddedId,
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
        xp: actorXpAvailable(this.actor),
        paths,
        atMaxTierForMr: atMax,
        bindingKind,
        isEchoBound,
        linkDisabledReason,
      });
    }

    return cards;
  }

  getData(_options?: any): any {
    const data: any = super.getData ? super.getData(_options) : {};
    data.actor = this.actor;
    data.cards = this.buildCards();
    const boundCount = countBoundArtifacts(this.actor);
    data.capacity = {
      bound: boundCount,
      max: ARTIFACT_CAPACITY_DEFAULT,
      full: boundCount >= ARTIFACT_CAPACITY_DEFAULT,
    };
    data.constants = {
      upXp: ARTIFACT_UPGRADE_XP_COST,
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

    // Artifact Capacity check: linking an unbound artifact promotes it
    // to "bound" and consumes one of the actor's four capacity slots.
    const emb = A.items.get(embeddedId);
    if (emb) {
      const currentKind = getArtifactBindingKind(emb);
      if (currentKind === 'unbound' && !canBindMoreArtifacts(this.actor)) {
        ui.notifications?.warn(
          `Artifact Capacity full (${countBoundArtifacts(this.actor)}/${ARTIFACT_CAPACITY_DEFAULT}). Unbind another Artifact first.`,
        );
        return;
      }
    }

    const next: ArtifactActorProgress = { ...cur, linked: true };
    levels[A.id] = serializeActorArtifactProgress(next);
    await root.setFlag('mastery-system', 'actorLevels', levels);

    // Promote the binding to `bound` so it counts toward Artifact Capacity
    // (echo-bound items keep their `echo` binding).
    if (emb) {
      const currentKind = getArtifactBindingKind(emb);
      if (currentKind === 'unbound') {
        try {
          await emb.update({ 'system.binding': 'bound' });
        } catch (err) {
          console.warn('[mastery-system] could not set binding=bound on artifact', err);
        }
      }
    }

    ui.notifications?.info('Artifact linked. You can now spend XP to evolve along the tree.');
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

    /**
     * New spec — once-per-step rule. Each Artifact may only be upgraded
     * once per Upgrade Step. Read the actor's current step bucket and
     * reject the click if this artifact is already in the list.
     */
    const stepRaw = (this.actor.system as any)?.xp?.currentStep ?? {};
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
      return;
    }

    if (!(await spendActorXp(this.actor, ARTIFACT_UPGRADE_XP_COST))) {
      ui.notifications?.warn(`Not enough XP (need ${ARTIFACT_UPGRADE_XP_COST}).`);
      return;
    }

    // Record the bump in the step bucket.
    const stepAfter = recordBump(stepNow as any, 'artifact', embeddedId);
    await this.actor.update({
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
      system: sys
    });
    await emb.setFlag('mastery-system', 'evolutionRootItemId', rootWorldId);
    await emb.setFlag('mastery-system', 'evolutionNodeId', targetNodeId);
    if (equip) await emb.setFlag('mastery-system', 'equipment', equip);

    const nextProg: ArtifactActorProgress = {
      nodeId: targetNodeId,
      linked: true,
    };
    levels[A.id] = serializeActorArtifactProgress(nextProg);
    await root.setFlag('mastery-system', 'actorLevels', levels);

    ui.notifications?.info(`Evolved to ${tw.name}.`);
    await (this as any).render(false);
  }
}

export async function openArtifactEvolutionDialog(actor: Actor): Promise<void> {
  const dlg = new ArtifactEvolutionDialog(actor);
  (dlg as any).render(true);
}
