import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { attributePoolReduction } from '../src/system/pool-reduction.js';
import { packageNeedsWeakenSaveStep } from '../src/creation/tower-wizard/tower-wizard-packages.js';
import { attributeCheckTn } from '../src/utils/constants.js';
import {
  COMBAT_SENSES,
  SENSE_SLOT_SPECIAL_IDS,
  isSpecialCombatSense,
} from '../src/combat/combat-senses.js';
import { getPassiveSlotCountForMasteryRank } from '../src/powers/passives.js';
import { getTrueActiveBuffs, isUtility } from '../src/utils/active-buffs.js';
import { REACTION_TEMPLATES } from '../src/utils/powers/templates/reaction.js';
import { PASSIVE_TEMPLATES } from '../src/utils/powers/templates/passives.js';
import { applyMidCombatInitiativeGain } from '../src/combat/initiative-gain.js';
import {
  bondAttackBudgetFromBodies,
  summonActorMayUseStonesOrArtifacts,
} from '../src/stones/summon-combat.js';
import { createEmptyBond } from '../src/stones/summon-bond-bind.js';
import { standardPowerTokenCost } from '../src/stones/summon-bond-rules.js';

function actorWithSpecials(entries: Array<{ id: string; value: number }>) {
  return {
    system: {
      statusEffects: entries.map((e) => ({
        id: e.id,
        name: e.id,
        value: e.value,
        source: 'test',
      })),
      attributes: {
        might: { value: 4 },
        agility: { value: 4 },
        vitality: { value: 4 },
        intellect: { value: 4 },
        resolve: { value: 4 },
        influence: { value: 4 },
        wits: { value: 4 },
      },
      mastery: { rank: 2 },
    },
    effects: [],
  };
}

describe('Weaken / Soulburn — dice pools only', () => {
  it('Weaken never reduces Vitality / Wits / Influence / Resolve pools', () => {
    const actor = actorWithSpecials([{ id: 'weaken', value: 4 }]);
    for (const attr of ['vitality', 'wits', 'influence', 'resolve'] as const) {
      expect(attributePoolReduction(actor, attr).reduction).toBe(0);
    }
    // Attributes themselves are untouched by the pool-reduction helper.
    expect(actor.system.attributes.might.value).toBe(4);
  });

  it('Soulburn never reduces Might / Agility / Intellect / Vitality pools', () => {
    const actor = actorWithSpecials([{ id: 'soulburn', value: 3 }]);
    for (const attr of ['might', 'agility', 'intellect', 'vitality'] as const) {
      expect(attributePoolReduction(actor, attr).reduction).toBe(0);
    }
    expect(actor.system.attributes.resolve.value).toBe(4);
  });
});

describe('Saving throws removed', () => {
  it('does not ship a saving-throws module', () => {
    expect(existsSync(join(process.cwd(), 'src/utils/saving-throws.ts'))).toBe(false);
    expect(existsSync(join(process.cwd(), 'dist/utils/saving-throws.js'))).toBe(false);
  });

  it('Tower packages never require a weaken save step', () => {
    expect(packageNeedsWeakenSaveStep({} as any)).toBe(false);
    expect(packageNeedsWeakenSaveStep({ id: 'anything' } as any)).toBe(false);
  });
});

describe('Attribute Checks', () => {
  it('exposes Challenge-MR based Attribute Check TN helper', () => {
    expect(attributeCheckTn(1)).toBe(8);
    expect(attributeCheckTn(2)).toBe(16);
    expect(attributeCheckTn(3)).toBe(24);
  });
});

describe('Combat Senses vs Passive slots', () => {
  it('Sense Slot specials are not Passive catalog entries', () => {
    const passiveIds = new Set(PASSIVE_TEMPLATES.map((p) => p.templateId));
    for (const id of SENSE_SLOT_SPECIAL_IDS) {
      expect(passiveIds.has(id)).toBe(false);
    }
  });

  it('Passive slots scale by Mastery Rank independently of Sense Slots', () => {
    expect(getPassiveSlotCountForMasteryRank(1)).toBe(1);
    expect(getPassiveSlotCountForMasteryRank(2)).toBe(2);
    expect(getPassiveSlotCountForMasteryRank(3)).toBe(2);
    expect(getPassiveSlotCountForMasteryRank(4)).toBe(3);
    expect(getPassiveSlotCountForMasteryRank(6)).toBe(4);
  });

  it('Darkvision is a minor upgrade; special Sense Slot picks are separate; Normal Combat Awareness exists', () => {
    expect(COMBAT_SENSES.darkvision.isMinorUpgrade).toBe(true);
    expect(isSpecialCombatSense('darkvision')).toBe(false);
    expect(isSpecialCombatSense('lifeSense')).toBe(true);
    expect(COMBAT_SENSES.normalCombatAwareness.label).toBe('Normal Combat Awareness');
  });
});

describe('Reaction triggers in catalog', () => {
  it('every Reaction template has reaction-gated applyWhen mechanics', () => {
    for (const t of REACTION_TEMPLATES) {
      const row = t.levels['1'];
      expect(row?.mechanics?.applyWhen).toMatch(/reaction/);
    }
  });

  it('includes core trigger pillars from Reactions catalog', () => {
    const names = REACTION_TEMPLATES.map((t) => t.name);
    expect(names).toEqual(expect.arrayContaining([
      'Reaction: Armor',
      'Reaction: Evade',
      'Reaction: Initiative Gain',
      'Reaction: Counter Damage',
    ]));
  });
});

describe('Initiative Gain API', () => {
  it('exports mid-combat Initiative Gain helper (no same-round second turn)', () => {
    expect(typeof applyMidCombatInitiativeGain).toBe('function');
  });
});

describe('Active Buff maintenance', () => {
  it('detects maintained true buffs via getTrueActiveBuffs', () => {
    const actor = {
      effects: [
        {
          flags: {
            'mastery-system': {
              activeBuff: true,
              mechanics: { armor: 5 },
            },
          },
        },
      ],
      items: { get: () => null },
    } as any;
    expect(getTrueActiveBuffs(actor).length).toBe(1);
    expect(typeof isUtility).toBe('function');
  });
});

describe('Summon combat economy rules', () => {
  it('multiple bodies do not increase attack budget', () => {
    const bond = createEmptyBond({
      name: 'Warband',
      ownerActorId: 'A',
      movementMode: 'walking',
      stoneAttributes: ['resolve', 'resolve', 'resolve', 'resolve'],
    });
    bond.spend.additionalBodies = 3;
    bond.summonAttacks = 1;
    expect(bondAttackBudgetFromBodies(bond)).toBe(1);
  });

  it('summons cannot use stones or artifacts', () => {
    expect(summonActorMayUseStonesOrArtifacts({ type: 'summon' })).toBe(false);
  });

  it('Summon Powers use standard action-economy token costs', () => {
    expect(standardPowerTokenCost('active', 4)).toBe(12);
    expect(standardPowerTokenCost('reaction', 4)).toBe(8);
    expect(standardPowerTokenCost('activeBuff', 4)).toBe(13);
    expect(standardPowerTokenCost('movement', 4, 40)).toBe(4);
  });
});
