/**
 * Summon actor sheet — read-focused statblock for Summons V2 Bond bodies.
 */

import { MasteryCharacterSheet } from './character-sheet.js';
import { getSharedSenseLabel } from '../stones/familiar-bind.js';
import type { SharedSenseGroup } from '../stones/summon-bond-rules.js';

export class MasterySummonSheet extends MasteryCharacterSheet {
  /** @override */
  static DEFAULT_OPTIONS = {
    classes: ['summon'],
    position: { width: 520, height: 640 },
  };

  /** @override */
  static PARTS = {
    body: {
      template: 'systems/mastery-system/templates/actor/summon-sheet.hbs',
    },
  };

  /**
   * ApplicationV2 unions `classes` across the inheritance chain; strip the
   * parent's `character` class so character-sheet CSS never applies here.
   * @override
   */
  _initializeApplicationOptions(options: any) {
    const opts = super._initializeApplicationOptions(options);
    opts.classes = (opts.classes || []).filter((c: string) => c !== 'character');
    return opts;
  }

  override async _prepareContext(options?: any): Promise<any> {
    const context = await super._prepareContext(options);
    const system = (this.actor as any).system ?? {};
    const bondLink = system.summonBond ?? {};
    const familiar = system.familiar ?? {};
    const ownerId = bondLink.ownerActorId || familiar.ownerActorId || '';
    const owner = ownerId ? (game as any).actors?.get(ownerId) : null;
    const senseGroups = (bondLink.sharedSenses ?? familiar.sharedSenses ?? []) as SharedSenseGroup[];
    const specials = system.npcBaseAttack?.specials ?? [];
    const special0 = specials[0];
    const specialDisplay =
      special0?.special && special0?.specialValue
        ? `${special0.special}(${special0.specialValue})`
        : '';
    const powers = Array.isArray(system.notesPowers)
      ? system.notesPowers
      : [];

    const stats = {
      hp: system.health?.bars?.[0]?.max ?? system.health?.maximum ?? 0,
      armor: system.combat?.armor ?? 0,
      evade: system.combat?.evade ?? 0,
      speed: system.combat?.speed ?? 0,
      attack: system.npcBaseAttack?.attackDiceCount
        ? `${system.npcBaseAttack.attackDiceCount}d8`
        : '—',
      damage: system.npcBaseAttack?.damageDiceCount
        ? `${system.npcBaseAttack.damageDiceCount}d8`
        : '—',
    };

    return {
      ...context,
      familiar,
      familiarStats: stats,
      movementMode: bondLink.movementMode || familiar.movementType || 'walking',
      expression: system.bio?.description?.match(/Expression: ([^.]+)/)?.[1] ?? '',
      sharedSenseLabels: senseGroups.map((g) => getSharedSenseLabel(g as any)),
      ownerName: owner?.name ?? 'Unknown',
      ownerActorId: ownerId,
      boundStoneCount: bondLink.boundStoneCount ?? familiar.boundStoneCount ?? 0,
      summonAttacks: system.attackSlots ?? 1,
      specialDisplay,
      dormant: !!bondLink.dormant,
      powerLabels: powers,
    };
  }

  override activateListeners(html: JQuery): void {
    super.activateListeners(html);
    html.find('[data-action="open-owner"]').on('click', (ev) => {
      ev.preventDefault();
      const system = (this.actor as any).system ?? {};
      const ownerId = system.summonBond?.ownerActorId || system.familiar?.ownerActorId;
      if (!ownerId) return;
      const owner = (game as any).actors?.get(ownerId);
      owner?.sheet?.render(true);
    });
  }
}
