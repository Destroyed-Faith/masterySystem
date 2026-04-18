import { describe, it, expect } from 'vitest';
import {
  aggregateMechanics,
  collectMechanicsContributions,
  buildActorMechanicsBreakdown,
  resolvePowerMechanics,
  getRollDiceDelta,
  emptyBreakdown,
} from '../src/utils/power-mechanics';
import type { PowerMechanics } from '../src/types/item';

// ---------- helpers ----------

function makePassivePower(id: string, name: string, rank: number, mechanics: PowerMechanics) {
  return {
    id,
    _id: id,
    name,
    type: 'power',
    system: {
      rank,
      levels: {
        [String(rank)]: { mechanics },
      },
    },
  };
}

function makePassivePowerWithTopLevelMechanics(id: string, name: string, mechanics: PowerMechanics) {
  return {
    id,
    _id: id,
    name,
    type: 'power',
    system: {
      rank: 2,
      mechanics,
    },
  };
}

function makeActor(opts: {
  items?: any[];
  slots?: Record<string, { active: boolean; passive: { id: string; name: string } | null }>;
  effects?: any[];
}) {
  const items = opts.items ?? [];
  const effects = opts.effects ?? [];
  return {
    system: {
      passives: opts.slots ?? {},
    },
    items: {
      get: (id: string) => items.find((i) => i.id === id || i._id === id) ?? null,
    },
    effects,
  };
}

// ---------- tests ----------

describe('resolvePowerMechanics', () => {
  it('prefers rank-specific mechanics over top-level', () => {
    const item = {
      system: {
        rank: 2,
        levels: { '2': { mechanics: { armor: 5, applyWhen: 'passive-slotted-active' } } },
        mechanics: { armor: 1, applyWhen: 'passive-slotted-active' },
      },
    };
    expect(resolvePowerMechanics(item)?.armor).toBe(5);
  });

  it('falls back to top-level mechanics when rank row has none', () => {
    const item = {
      system: {
        rank: 2,
        levels: { '2': { type: 'Passive' } },
        mechanics: { armor: 3, applyWhen: 'passive-slotted-active' },
      },
    };
    expect(resolvePowerMechanics(item)?.armor).toBe(3);
  });

  it('returns null when no mechanics anywhere', () => {
    expect(resolvePowerMechanics({ system: { rank: 2, levels: { '2': {} } } })).toBeNull();
    expect(resolvePowerMechanics(null)).toBeNull();
  });

  it('clamps rank into 1..4 range', () => {
    const item = {
      system: {
        rank: 99,
        levels: { '4': { mechanics: { armor: 9, applyWhen: 'passive-slotted-active' } } },
      },
    };
    expect(resolvePowerMechanics(item)?.armor).toBe(9);
  });
});

describe('aggregateMechanics — pure summing', () => {
  it('empty contributions yields zero totals and empty arrays', () => {
    const bd = aggregateMechanics([]);
    expect(bd.totals.armor).toBe(0);
    expect(bd.totals.evade).toBe(0);
    expect(bd.armor).toEqual([]);
    expect(bd.saveDice.body).toEqual([]);
  });

  it('sums armor + evade across multiple contributions with source labels', () => {
    const bd = aggregateMechanics([
      {
        source: 'Dragon Scales',
        mechanics: { armor: 2, evade: -1, applyWhen: 'passive-slotted-active' },
      },
      {
        source: 'Storm Veil',
        mechanics: { armor: 1, evade: 2, applyWhen: 'passive-slotted-active' },
      },
    ]);
    expect(bd.totals.armor).toBe(3);
    expect(bd.totals.evade).toBe(1);
    expect(bd.armor.map((e) => e.source)).toEqual(['Dragon Scales', 'Storm Veil']);
    expect(bd.evade.find((e) => e.source === 'Dragon Scales')?.value).toBe(-1);
  });

  it('aggregates saveDice per family', () => {
    const bd = aggregateMechanics([
      {
        source: 'Warden Stance',
        mechanics: {
          saveDice: { body: 2, mind: 1 },
          applyWhen: 'activeBuff-active',
        },
      },
      {
        source: 'Mental Fortress',
        mechanics: { saveDice: { mind: 2, spirit: 1 }, applyWhen: 'passive-slotted-active' },
      },
    ]);
    expect(bd.totals.saveDice.body).toBe(2);
    expect(bd.totals.saveDice.mind).toBe(3);
    expect(bd.totals.saveDice.spirit).toBe(1);
  });

  it('aggregates rollDice per kind', () => {
    const bd = aggregateMechanics([
      {
        source: 'Predator Mark',
        mechanics: { rollDice: { attack: 1, damage: 1 }, applyWhen: 'passive-slotted-active' },
      },
      {
        source: 'Diplomat',
        mechanics: { rollDice: { skill: 2 }, applyWhen: 'passive-slotted-active' },
      },
    ]);
    expect(bd.totals.rollDice.attack).toBe(1);
    expect(bd.totals.rollDice.damage).toBe(1);
    expect(bd.totals.rollDice.skill).toBe(2);
  });

  it('zero values are not pushed into breakdown arrays', () => {
    const bd = aggregateMechanics([
      {
        source: 'No-op',
        mechanics: { armor: 0, evade: 0, applyWhen: 'passive-slotted-active' },
      },
    ]);
    expect(bd.armor).toEqual([]);
    expect(bd.evade).toEqual([]);
  });

  it('tempHP entries are collected as strings', () => {
    const bd = aggregateMechanics([
      {
        source: 'Scales',
        mechanics: { tempHP: '1d8', applyWhen: 'activeBuff-active' },
      },
    ]);
    expect(bd.tempHP).toEqual([{ source: 'Scales', value: '1d8' }]);
  });

  it('initiativeD8 and movementBonus + regen totals', () => {
    const bd = aggregateMechanics([
      {
        source: 'Fleet',
        mechanics: { movementBonus: 2, initiativeD8: 1, applyWhen: 'passive-slotted-active' },
      },
      {
        source: 'Regen',
        mechanics: { regen: 3, applyWhen: 'activeBuff-active' },
      },
    ]);
    expect(bd.totals.movementBonus).toBe(2);
    expect(bd.totals.initiativeD8).toBe(1);
    expect(bd.totals.regen).toBe(3);
  });
});

describe('collectMechanicsContributions — slot-activated passives', () => {
  const dragonScales = makePassivePower('p-dragon', 'Dragon Scales', 2, {
    armor: 1,
    applyWhen: 'passive-slotted-active',
  });
  const stormVeil = makePassivePower('p-storm', 'Storm Veil', 2, {
    evade: 2,
    applyWhen: 'passive-slotted-active',
  });

  it('only active=true slots contribute', () => {
    const actor = makeActor({
      items: [dragonScales, stormVeil],
      slots: {
        slot0: { active: true, passive: { id: 'p-dragon', name: 'Dragon Scales' } },
        slot1: { active: false, passive: { id: 'p-storm', name: 'Storm Veil' } },
      },
    });
    const contribs = collectMechanicsContributions(actor);
    expect(contribs.length).toBe(1);
    expect(contribs[0].mechanics.armor).toBe(1);
    expect(contribs[0].source).toContain('Dragon Scales');
  });

  it('empty slots are skipped', () => {
    const actor = makeActor({
      items: [dragonScales],
      slots: {
        slot0: { active: true, passive: null },
        slot1: { active: true, passive: { id: 'does-not-exist', name: 'Ghost' } },
      },
    });
    const contribs = collectMechanicsContributions(actor);
    expect(contribs.length).toBe(0);
  });

  it('powers whose applyWhen is not passive-slotted-active are rejected', () => {
    const wrongKind = makePassivePower('p-wrong', 'Buff-like', 2, {
      armor: 1,
      applyWhen: 'activeBuff-active',
    });
    const actor = makeActor({
      items: [wrongKind],
      slots: {
        slot0: { active: true, passive: { id: 'p-wrong', name: 'Buff-like' } },
      },
    });
    expect(collectMechanicsContributions(actor)).toEqual([]);
  });

  it('resolves top-level mechanics when rank row has none', () => {
    const topLevel = makePassivePowerWithTopLevelMechanics('p-top', 'TopLevel Mech', {
      armor: 4,
      applyWhen: 'passive-slotted-active',
    });
    const actor = makeActor({
      items: [topLevel],
      slots: {
        slot0: { active: true, passive: { id: 'p-top', name: 'TopLevel Mech' } },
      },
    });
    const contribs = collectMechanicsContributions(actor);
    expect(contribs.length).toBe(1);
    expect(contribs[0].mechanics.armor).toBe(4);
  });
});

describe('collectMechanicsContributions — active buff effects', () => {
  it('reads mechanics straight from effect flags', () => {
    const actor = makeActor({
      items: [],
      effects: [
        {
          name: 'Warden Stance',
          flags: {
            'mastery-system': {
              activeBuff: true,
              powerName: 'Warden Stance',
              mechanics: {
                saveDice: { body: 2 },
                applyWhen: 'activeBuff-active',
              },
            },
          },
        },
      ],
    });
    const contribs = collectMechanicsContributions(actor);
    expect(contribs.length).toBe(1);
    expect(contribs[0].mechanics.saveDice?.body).toBe(2);
    expect(contribs[0].source).toContain('Warden Stance');
  });

  it('falls back to power item when flag.mechanics missing', () => {
    const sourcePower = {
      id: 'p-buff',
      _id: 'p-buff',
      type: 'power',
      system: {
        rank: 2,
        levels: {
          '2': { mechanics: { rollDice: { attack: 1 }, applyWhen: 'activeBuff-active' } },
        },
      },
    };
    const actor = makeActor({
      items: [sourcePower],
      effects: [
        {
          name: 'Buff-Source',
          flags: {
            'mastery-system': {
              activeBuff: true,
              powerId: 'p-buff',
              powerName: 'Buff Source',
            },
          },
        },
      ],
    });
    const contribs = collectMechanicsContributions(actor);
    expect(contribs.length).toBe(1);
    expect(contribs[0].mechanics.rollDice?.attack).toBe(1);
  });

  it('non-activeBuff effects are ignored', () => {
    const actor = makeActor({
      effects: [
        { flags: { 'mastery-system': { activeBuff: false, mechanics: { armor: 99 } } } },
        { flags: {} },
      ],
    });
    expect(collectMechanicsContributions(actor)).toEqual([]);
  });

  it('rejects buff mechanics whose applyWhen is not activeBuff-active', () => {
    const actor = makeActor({
      effects: [
        {
          name: 'Wrong',
          flags: {
            'mastery-system': {
              activeBuff: true,
              mechanics: { armor: 5, applyWhen: 'passive-slotted-active' },
            },
          },
        },
      ],
    });
    expect(collectMechanicsContributions(actor)).toEqual([]);
  });
});

describe('buildActorMechanicsBreakdown — integration', () => {
  it('combines passives and buffs into one breakdown', () => {
    const passive = makePassivePower('p-dragon', 'Dragon Scales', 2, {
      armor: 1,
      applyWhen: 'passive-slotted-active',
    });
    const actor = makeActor({
      items: [passive],
      slots: {
        slot0: { active: true, passive: { id: 'p-dragon', name: 'Dragon Scales' } },
      },
      effects: [
        {
          name: 'Warden Stance',
          flags: {
            'mastery-system': {
              activeBuff: true,
              powerName: 'Warden Stance',
              mechanics: { armor: 2, applyWhen: 'activeBuff-active' },
            },
          },
        },
      ],
    });
    const bd = buildActorMechanicsBreakdown(actor);
    expect(bd.totals.armor).toBe(3);
    expect(bd.armor.length).toBe(2);
    expect(bd.armor.map((e) => e.source)).toEqual(
      expect.arrayContaining([expect.stringContaining('Dragon Scales'), expect.stringContaining('Warden Stance')]),
    );
  });

  it('returns fully-populated empty breakdown for bare actor', () => {
    const bd = buildActorMechanicsBreakdown({ system: {}, items: { get: () => null }, effects: [] });
    expect(bd.totals.armor).toBe(0);
    expect(bd.saveDice.body).toEqual([]);
    expect(bd.rollDice.skill).toEqual([]);
  });
});

describe('getRollDiceDelta', () => {
  it('reads skill delta', () => {
    const actor: any = {
      system: {
        derived: {
          mechanicsBreakdown: {
            ...emptyBreakdown(),
            totals: { ...emptyBreakdown().totals, rollDice: { attack: 0, skill: 2, damage: 0 } },
          },
        },
      },
    };
    expect(getRollDiceDelta(actor, 'skill')).toBe(2);
    expect(getRollDiceDelta(actor, 'attack')).toBe(0);
  });

  it('reads save deltas', () => {
    const actor: any = {
      system: {
        derived: {
          mechanicsBreakdown: {
            ...emptyBreakdown(),
            totals: {
              ...emptyBreakdown().totals,
              saveDice: { body: 1, mind: 2, spirit: 3 },
            },
          },
        },
      },
    };
    expect(getRollDiceDelta(actor, 'saveBody')).toBe(1);
    expect(getRollDiceDelta(actor, 'saveMind')).toBe(2);
    expect(getRollDiceDelta(actor, 'saveSpirit')).toBe(3);
  });

  it('returns 0 when breakdown missing', () => {
    expect(getRollDiceDelta({ system: {} }, 'attack')).toBe(0);
    expect(getRollDiceDelta(null, 'skill')).toBe(0);
  });
});
