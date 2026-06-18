import { describe, it, expect } from 'vitest';
import {
  aggregateMechanics,
  collectMechanicsContributions,
  buildActorMechanicsBreakdown,
  buildPassiveMechanicsBreakdown,
  buildBuffMechanicsBreakdown,
  resolvePowerMechanics,
  getRollDiceDelta,
  emptyBreakdown,
  hasCondition,
  evaluateConditionGate,
  collectConditionalDamageRiders,
  extractMeleeAoePowerBonusD8,
  isSanctionedPhasingName,
} from '../src/utils/power-mechanics';
import { aoeSecondaryBodySaveDc } from '../src/combat/aoe-melee-resolution';
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

  it('clamps rank into 1..16 range for levels lookup', () => {
    const item = {
      system: {
        rank: 99,
        levels: {
          '4': { mechanics: { armor: 4, applyWhen: 'passive-slotted-active' } },
          '16': { mechanics: { armor: 9, applyWhen: 'passive-slotted-active' } },
        },
      },
    };
    expect(resolvePowerMechanics(item)?.armor).toBe(9);
  });

  it('reads levels[7] when system.rank is 7 (not capped at 4)', () => {
    const power = {
      type: 'power',
      system: {
        rank: 7,
        levels: {
          '4': { mechanics: { armor: 4 } },
          '7': { mechanics: { armor: 7, damageReductionPct: 10 } },
        },
      },
    };
    const m = resolvePowerMechanics(power);
    expect(m?.armor).toBe(7);
    expect(m?.damageReductionPct).toBe(10);
  });

  it('resolves ab-damage-reduction from catalog when levels on item are empty', () => {
    const power = {
      type: 'power',
      name: 'Active Buff: Damage Reduction',
      system: {
        rank: 12,
        templateId: 'ab-damage-reduction',
        levels: {},
      },
    };
    const m = resolvePowerMechanics(power);
    expect(m?.damageReductionPct).toBe(10);
  });

  // NOTE: The former "falls back to the live catalog" tests depended on the
  // legacy Mastery-Tree power files (Warden Dragon → Dragon Scales, Coal
  // Plate, etc.). Those files were removed by the Templates refactor (plan
  // §8). The catalog fallback in `resolvePowerMechanics` now points at
  // `ALL_POWER_TEMPLATES`; once templates ship matching mechanics blocks a
  // new test can re-assert the fallback path against them.
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

  it('collects healing dice strings into breakdown.healing', () => {
    const bd = aggregateMechanics([
      {
        source: 'Renewal',
        mechanics: {
          applyWhen: 'activeBuff-active',
          healing: { flat: '2d8', target: 'self', trigger: 'endOfTurn' },
        },
      },
    ]);
    expect(bd.healing).toEqual([
      { source: 'Renewal (self · endOfTurn)', value: '2d8' },
    ]);
  });

  it('lists modifySpecial and grantNextHitEffect as declarative breakdown rows', () => {
    const bd = aggregateMechanics([
      {
        source: 'Furnace',
        mechanics: {
          applyWhen: 'passive-slotted-active',
          modifySpecial: {
            type: 'ignite',
            mode: 'increaseExisting',
            amount: 2,
            minExisting: 1,
          },
          grantNextHitEffect: {
            expires: 'endOfTurn',
            qualifier: 'nextHit',
            damageRiderFlat: '+1d8',
            specials: [{ key: 'Ignite', rank: 1 }],
          },
        },
      },
    ]);
    expect(bd.modifySpecialDeclared).toEqual([
      { source: 'Furnace', text: 'ignite increaseExisting 2 min≥1' },
    ]);
    expect(bd.grantNextHitDeclared[0].source).toBe('Furnace');
    expect(bd.grantNextHitDeclared[0].text).toContain('nextHit');
    expect(bd.grantNextHitDeclared[0].text).toContain('expires:endOfTurn');
    expect(bd.grantNextHitDeclared[0].text).toContain('dmg:+1d8');
    expect(bd.grantNextHitDeclared[0].text).toContain('specials×1');
  });

  it('skips unconditional totals when conditionExpr is set (like condition)', () => {
    const bd = aggregateMechanics([
      {
        source: 'Gated',
        mechanics: {
          armor: 5,
          applyWhen: 'passive-slotted-active',
          conditionExpr: 'targetIgnited',
        },
      },
    ]);
    expect(bd.totals.armor).toBe(0);
    expect(bd.armor).toEqual([]);
  });

  it('skips self.adjacentEnemies gate when no adjacent hostiles (no canvas)', () => {
    const bd = aggregateMechanics(
      [
        {
          source: 'Bulwark',
          mechanics: {
            armor: 3,
            applyWhen: 'passive-slotted-active',
            conditionExpr: 'self.adjacentEnemies >= 2',
          },
        },
      ],
      { id: 'a1', system: { health: { bars: [{ name: 'Healthy' }], currentBar: 0 } } },
    );
    expect(bd.totals.armor).toBe(0);
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

  it('all slotted passives contribute (slotted = active; legacy active=false ignored)', () => {
    const actor = makeActor({
      items: [dragonScales, stormVeil],
      slots: {
        slot0: { active: true, passive: { id: 'p-dragon', name: 'Dragon Scales' } },
        slot1: { active: false, passive: { id: 'p-storm', name: 'Storm Veil' } },
      },
    });
    const contribs = collectMechanicsContributions(actor);
    expect(contribs.length).toBe(2);
    expect(contribs.map((c) => c.mechanics.armor ?? c.mechanics.evade)).toEqual(
      expect.arrayContaining([1, 2]),
    );
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

  it('DR active buff does not add to total without a passive DR base', () => {
    const actor = makeActor({
      items: [],
      effects: [
        {
          name: 'Schadensreduktion',
          flags: {
            'mastery-system': {
              activeBuff: true,
              powerName: 'Schadensreduktion (Aktiv)',
              powerTemplateId: 'ab-damage-reduction',
              mechanics: { damageReductionPct: 10, applyWhen: 'activeBuff-active' },
            },
          },
        },
      ],
    });
    const bd = buildActorMechanicsBreakdown(actor);
    expect(bd.totals.damageReductionPct).toBe(0);
    expect(bd.damageReductionPct.buff).toHaveLength(0);
  });

  it('sanctioned passive DR plus matching buff stacks in total', () => {
    const drPassive = makePassivePower('p-dr', 'Damage Reduction', 4, {
      damageReductionPct: 10,
      applyWhen: 'passive-slotted-active',
    });
    (drPassive.system as any).templateId = 'passive-damage-reduction';
    const actor = makeActor({
      items: [drPassive],
      slots: { slot0: { active: true, passive: { id: 'p-dr', name: 'Damage Reduction' } } },
      effects: [
        {
          name: 'Schadensreduktion',
          flags: {
            'mastery-system': {
              activeBuff: true,
              powerName: 'Schadensreduktion (Aktiv)',
              powerTemplateId: 'ab-damage-reduction',
              mechanics: { damageReductionPct: 10, applyWhen: 'activeBuff-active' },
            },
          },
        },
      ],
    });
    const bd = buildActorMechanicsBreakdown(actor);
    expect(bd.totals.damageReductionPct).toBe(20);
    expect(bd.damageReductionPct.passive.length).toBeGreaterThanOrEqual(1);
    expect(bd.damageReductionPct.buff).toHaveLength(1);
  });

  it('passive DR is sanctioned by German display name', () => {
    const drPassive = makePassivePower('p-dr-de', 'Schadensreduktion', 4, {
      damageReductionPct: 12,
      applyWhen: 'passive-slotted-active',
    });
    const actor = makeActor({
      items: [drPassive],
      slots: { slot0: { active: true, passive: { id: 'p-dr-de', name: 'Schadensreduktion' } } },
    });
    const bd = buildActorMechanicsBreakdown(actor);
    expect(bd.totals.damageReductionPct).toBe(12);
    expect(bd.damageReductionPct.passive).toHaveLength(1);
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

  it('splits slotted passives from active buffs for armor/evade base totals', () => {
    const passive = makePassivePower('p-dragon', 'Dragon Scales', 2, {
      armor: 1,
      evade: 1,
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
              mechanics: { armor: 2, evade: 3, applyWhen: 'activeBuff-active' },
            },
          },
        },
      ],
    });
    const passiveBd = buildPassiveMechanicsBreakdown(actor);
    const buffBd = buildBuffMechanicsBreakdown(actor);
    const fullBd = buildActorMechanicsBreakdown(actor);
    expect(passiveBd.totals.armor).toBe(1);
    expect(passiveBd.totals.evade).toBe(1);
    expect(buffBd.totals.armor).toBe(2);
    expect(buffBd.totals.evade).toBe(3);
    expect(fullBd.totals.armor).toBe(passiveBd.totals.armor + buffBd.totals.armor);
    expect(fullBd.totals.evade).toBe(passiveBd.totals.evade + buffBd.totals.evade);
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

  it('folds conditional rollDice when target has the gated condition', () => {
    const passive = makePassivePower('p1', 'Hex Attuned', 2, {
      rollDice: { attack: 1 },
      condition: 'targetHexed',
      applyWhen: 'passive-slotted-active',
    });
    const actor = makeActor({
      items: [passive],
      slots: { slot1: { active: true, passive: { id: 'p1', name: 'Hex Attuned' } } },
    });
    // Pre-aggregated breakdown has 0 unconditional rollDice (conditions aren't added there).
    (actor as any).system.derived = { mechanicsBreakdown: buildActorMechanicsBreakdown(actor) };
    const target: any = { statuses: new Set(['hexed']) };
    expect(getRollDiceDelta(actor, 'attack')).toBe(0);
    expect(getRollDiceDelta(actor, 'attack', target)).toBe(1);
  });

  it('folds conditional rollDice when conditionExpr matches target', () => {
    const passive = makePassivePower('p2', 'Expr Attuned', 2, {
      rollDice: { attack: 2 },
      conditionExpr: 'targetIgnited',
      applyWhen: 'passive-slotted-active',
    });
    const actor = makeActor({
      items: [passive],
      slots: { slot1: { active: true, passive: { id: 'p2', name: 'Expr Attuned' } } },
    });
    (actor as any).system.derived = { mechanicsBreakdown: buildActorMechanicsBreakdown(actor) };
    const target: any = { statuses: new Set(['ignited']) };
    expect(getRollDiceDelta(actor, 'attack')).toBe(0);
    expect(getRollDiceDelta(actor, 'attack', target)).toBe(2);
  });
});

describe('hasCondition', () => {
  it('reads from actor.statuses (Set)', () => {
    const a: any = { statuses: new Set(['hexed', 'marked']) };
    expect(hasCondition(a, 'hexed')).toBe(true);
    expect(hasCondition(a, 'Hexed')).toBe(true);
    expect(hasCondition(a, 'targetHexed')).toBe(true);
    expect(hasCondition(a, 'ignited')).toBe(false);
  });

  it('reads from actor.effects names', () => {
    const a: any = { effects: [{ name: 'Ignite(3)', disabled: false }] };
    expect(hasCondition(a, 'ignited')).toBe(true);
  });

  it('ignores disabled effects', () => {
    const a: any = { effects: [{ name: 'Ignite(3)', disabled: true }] };
    expect(hasCondition(a, 'ignited')).toBe(false);
  });

  it('reads from system.specials array (string entries like "Bleeding(3)")', () => {
    const a: any = { system: { specials: ['Bleeding(3)'] } };
    expect(hasCondition(a, 'bleeding')).toBe(true);
  });

  it('reads from mastery-system flag bucket', () => {
    const a: any = { flags: { 'mastery-system': { conditions: { hexed: true } } } };
    expect(hasCondition(a, 'hexed')).toBe(true);
  });

  it('treats synonyms consistently', () => {
    const a: any = { statuses: new Set(['burning']) };
    expect(hasCondition(a, 'ignited')).toBe(true);
  });
});

describe('evaluateConditionGate', () => {
  it('returns true when gate is null/undefined', () => {
    expect(evaluateConditionGate({}, {}, null as any)).toBe(true);
    expect(evaluateConditionGate({}, {}, undefined as any)).toBe(true);
  });

  it('evaluates target-facing conditions against the target actor', () => {
    const target: any = { statuses: new Set(['marked']) };
    expect(evaluateConditionGate({}, target, 'targetMarked')).toBe(true);
    expect(evaluateConditionGate({}, target, 'targetHexed')).toBe(false);
  });

  it('evaluates self-hp-below-50 against actor.system.health', () => {
    const low: any = { system: { health: { currentBar: 3, bars: [1, 2, 3, 4, 5] } } };
    const high: any = { system: { health: { currentBar: 0, bars: [1, 2, 3, 4, 5] } } };
    expect(evaluateConditionGate(low, {}, 'self-hp-below-50')).toBe(true);
    expect(evaluateConditionGate(high, {}, 'self-hp-below-50')).toBe(false);
  });
});

describe('collectConditionalDamageRiders', () => {
  it('fires a damageRider.vsCondition rider when target carries the condition', () => {
    const passive = makePassivePower('p1', 'Pact Brand', 2, {
      damageRider: { vsCondition: 'hexed', vsConditionDamage: '+2d8' },
      applyWhen: 'passive-slotted-active',
    });
    const actor = makeActor({
      items: [passive],
      slots: { slot1: { active: true, passive: { id: 'p1', name: 'Pact Brand' } } },
    });
    const target: any = { statuses: new Set(['hexed']) };
    const riders = collectConditionalDamageRiders(actor, target);
    expect(riders).toHaveLength(1);
    expect(riders[0].condition).toBe('hexed');
    expect(riders[0].dice).toBe('2d8');
    expect(riders[0].source).toContain('Pact Brand');
  });

  it('does not fire when target lacks the condition', () => {
    const passive = makePassivePower('p1', 'Pact Brand', 2, {
      damageRider: { vsCondition: 'hexed', vsConditionDamage: '+2d8' },
      applyWhen: 'passive-slotted-active',
    });
    const actor = makeActor({
      items: [passive],
      slots: { slot1: { active: true, passive: { id: 'p1', name: 'Pact Brand' } } },
    });
    const target: any = { statuses: new Set([]) };
    expect(collectConditionalDamageRiders(actor, target)).toEqual([]);
  });

  it('fires a gated flat rider when the actor has a matching condition gate', () => {
    const passive = makePassivePower('p1', 'Branded', 2, {
      damageRider: { flat: '+1d8' },
      condition: 'targetMarked',
      applyWhen: 'passive-slotted-active',
    });
    const actor = makeActor({
      items: [passive],
      slots: { slot1: { active: true, passive: { id: 'p1', name: 'Branded' } } },
    });
    const target: any = { statuses: new Set(['marked']) };
    const riders = collectConditionalDamageRiders(actor, target);
    expect(riders).toHaveLength(1);
    expect(riders[0].condition).toBe('marked');
    expect(riders[0].dice).toBe('1d8');
  });

  it('respects the selected power rider when target carries the condition', () => {
    const actor = makeActor({ items: [], slots: {} });
    const selectedPower: any = {
      id: 'spw',
      name: 'Eldritch Bolt',
      system: {
        rank: 2,
        levels: {
          '2': {
            mechanics: {
              damageRider: { vsCondition: 'hexed', vsConditionDamage: '+3d8' },
              applyWhen: 'attack-rider',
            },
          },
        },
      },
    };
    const target: any = { statuses: new Set(['hexed']) };
    const riders = collectConditionalDamageRiders(actor, target, selectedPower);
    expect(riders).toHaveLength(1);
    expect(riders[0].dice).toBe('3d8');
  });
});

describe('extractMeleeAoePowerBonusD8', () => {
  it('reads unconditional damageRider.flat Nd8', () => {
    const item = {
      system: {
        rank: 1,
        mechanics: {
          applyWhen: 'active',
          damageRider: { flat: '+2d8' },
        },
      },
    };
    expect(extractMeleeAoePowerBonusD8(item)).toBe(2);
  });

  it('returns 0 when vsCondition is set', () => {
    const item = {
      system: {
        rank: 1,
        mechanics: {
          damageRider: { flat: '+3d8', vsCondition: 'hexed' as const },
        },
      },
    };
    expect(extractMeleeAoePowerBonusD8(item)).toBe(0);
  });

  it('treats bare d8 as 1', () => {
    const item = {
      system: {
        rank: 1,
        mechanics: { damageRider: { flat: 'd8' } },
      },
    };
    expect(extractMeleeAoePowerBonusD8(item)).toBe(1);
  });
});

describe('isSanctionedPhasingName', () => {
  it('matches slot display names with Passive: prefix for Ghostform', () => {
    expect(isSanctionedPhasingName('Passive: Ghostform', 'passive')).toBe(true);
    expect(isSanctionedPhasingName('ghostform', 'passive')).toBe(true);
  });
  it('matches Active Buff: for Ghost Mantle', () => {
    expect(isSanctionedPhasingName('Active Buff: Ghost Mantle', 'buff')).toBe(true);
  });
  it('matches Reaction: for Ghost Slip', () => {
    expect(isSanctionedPhasingName('Reaction: Ghost Slip', 'reaction')).toBe(true);
  });
  it('rejects wrong names', () => {
    expect(isSanctionedPhasingName('Random', 'passive')).toBe(false);
  });
});

describe('aoeSecondaryBodySaveDc', () => {
  it('maps mastery rank 1–6 to 8–48', () => {
    expect(aoeSecondaryBodySaveDc(1)).toBe(8);
    expect(aoeSecondaryBodySaveDc(3)).toBe(24);
    expect(aoeSecondaryBodySaveDc(6)).toBe(48);
  });

  it('clamps rank outside 1–6', () => {
    expect(aoeSecondaryBodySaveDc(0)).toBe(8);
    expect(aoeSecondaryBodySaveDc(99)).toBe(48);
  });
});
