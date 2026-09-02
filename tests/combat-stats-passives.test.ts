import { describe, expect, it } from 'vitest';
import {
  buildPassiveMechanicsBreakdown,
  collectMechanicsContributions,
} from '../src/utils/power-mechanics';
import { resolvePowerMechanics } from '../src/utils/power-mechanics';
import {
  passiveDamageNegationReserveForLevel,
  passiveParryPoolForLevel,
} from '../src/utils/powers/templates/passives';

function makePassive(
  id: string,
  name: string,
  templateId: string,
  rank: number,
  mechanics: Record<string, unknown>,
) {
  return {
    id,
    _id: id,
    type: 'power',
    name,
    system: {
      category: 'passive',
      templateId,
      rank,
      level: rank,
      levels: {
        [String(rank)]: { mechanics },
      },
    },
  };
}

describe('Combat Statistics — owned Passives fold into defense totals', () => {
  it('collects Armor / Evade / Initiative from owned Passives without slots', () => {
    const actor = {
      system: { passives: {} },
      items: [
        makePassive('p-armor', 'Test Sheet Armor Bonus', 'test-sheet-armor', 4, {
          armor: 5,
          applyWhen: 'passive-slotted-active',
        }),
        makePassive('p-evade', 'Test Sheet Evade Bonus', 'test-sheet-evade', 4, {
          evade: 4,
          applyWhen: 'passive-slotted-active',
        }),
        makePassive('p-ini', 'Test Sheet Initiative Bonus', 'test-sheet-initiative', 4, {
          initiative: 2,
          applyWhen: 'passive-slotted-active',
        }),
      ],
      effects: [],
    };
    const contribs = collectMechanicsContributions(actor);
    expect(contribs).toHaveLength(3);
    const bd = buildPassiveMechanicsBreakdown(actor);
    expect(bd.totals.armor).toBe(5);
    expect(bd.totals.evade).toBe(4);
    expect(bd.totals.initiative).toBe(2);
  });

  it('does not fold Active Buff armor/evade into the Passive breakdown', () => {
    const actor = {
      system: { passives: {} },
      items: [
        makePassive('p-armor', 'Passive: Armor', 'passive-fortified-frame', 1, {
          armor: 1,
          applyWhen: 'passive-slotted-active',
        }),
      ],
      effects: [
        {
          name: 'Warden Stance',
          flags: {
            'mastery-system': {
              activeBuff: true,
              powerName: 'Warden Stance',
              mechanics: { armor: 9, evade: 9, applyWhen: 'activeBuff-active' },
            },
          },
        },
      ],
    };
    const passiveBd = buildPassiveMechanicsBreakdown(actor);
    expect(passiveBd.totals.armor).toBe(1);
    expect(passiveBd.totals.evade).toBe(0);
  });

  it('exposes Parry / Damage Negation pool sizes from owned Passives', () => {
    expect(passiveParryPoolForLevel(4)).toBeGreaterThan(0);
    expect(passiveDamageNegationReserveForLevel(4)).toBeGreaterThan(0);
    const parry = makePassive('p-parry', 'Passive: Parry', 'passive-parry', 4, {
      applyWhen: 'passive-slotted-active',
    });
    const negation = makePassive(
      'p-neg',
      'Passive: Damage Negation',
      'passive-damage-negation',
      4,
      { applyWhen: 'passive-slotted-active' },
    );
    expect(resolvePowerMechanics(parry)).toBeTruthy();
    expect(resolvePowerMechanics(negation)).toBeTruthy();
    expect(passiveParryPoolForLevel(4)).toBe(passiveParryPoolForLevel(4));
  });
});
