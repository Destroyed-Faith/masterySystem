/**
 * Actor-facing artifact evolution: activate (1 Stone), upgrade along tree.
 *
 *   • Activate / link: 1 Stone once (MR ≥ 2).
 *   • Upgrade: 8 XP per +1 artifact level.
 *   • Maximum reachable level = `(MR - 1) × 2`, capped at 16.
 *   • Each Artifact may only be upgraded once per Upgrade Step.
 */

import {
  ARTIFACT_CAPACITY_DEFAULT,
  ARTIFACT_LINK_STONE_COST,
  ARTIFACT_MAX_SYSTEM_LEVEL,
  ARTIFACT_UPGRADE_XP_COST,
  countBoundArtifacts,
} from '../utils/artifact-actor-rules.js';
import {
  buildArtifactEvolutionCards,
  linkArtifactForActor,
  upgradeArtifactForActor,
} from './artifact-evolution-actions.js';

const BaseApp: any = (foundry as any)?.appv1?.Application || (Application as any);

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
      resizable: true,
    });
  }

  getData(_options?: any): any {
    const data: any = super.getData ? super.getData(_options) : {};
    data.actor = this.actor;
    data.cards = buildArtifactEvolutionCards(this.actor);
    const boundCount = countBoundArtifacts(this.actor);
    data.capacity = {
      bound: boundCount,
      max: ARTIFACT_CAPACITY_DEFAULT,
      full: boundCount >= ARTIFACT_CAPACITY_DEFAULT,
    };
    data.constants = {
      linkStone: ARTIFACT_LINK_STONE_COST,
      upXp: ARTIFACT_UPGRADE_XP_COST,
      maxLevel: ARTIFACT_MAX_SYSTEM_LEVEL,
    };
    return data;
  }

  activateListeners(html: JQuery): void {
    super.activateListeners(html);

    html.find('[data-action="ae-close"]').on('click', () => (this as any).close());

    html.on('click', '[data-action="ae-link"]', async (e: JQuery.ClickEvent) => {
      const rootId = $(e.currentTarget).data('root-id');
      const embId = $(e.currentTarget).data('emb-id');
      const ok = await linkArtifactForActor(this.actor, String(rootId), String(embId));
      if (ok) await (this as any).render(false);
    });

    html.on('click', '[data-action="ae-upgrade"]', async (e: JQuery.ClickEvent) => {
      const rootId = $(e.currentTarget).data('root-id');
      const embId = $(e.currentTarget).data('emb-id');
      const targetWorldId = $(e.currentTarget).data('target-world-id');
      const targetNodeId = $(e.currentTarget).data('target-node-id');
      const ok = await upgradeArtifactForActor(
        this.actor,
        String(rootId),
        String(embId),
        String(targetWorldId),
        String(targetNodeId),
      );
      if (ok) await (this as any).render(false);
    });
  }
}

export async function openArtifactEvolutionDialog(actor: Actor): Promise<void> {
  const dlg = new ArtifactEvolutionDialog(actor);
  (dlg as any).render(true);
}
