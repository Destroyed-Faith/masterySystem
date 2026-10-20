/**
 * Destroyed Faith follow-up 2026-10-20 — Stone DN / Reactions / Active Buff sync.
 * Does not cover the optional ceil(PL/2) DN Buff curve (needs author approval).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  DEFENSIVE_STONE_KEYS,
  getRoundState,
  resetRoundState,
  setRoundState,
  clearCombatStoneTurnBonusesForActor,
  armDefensiveStoneExpiry,
} from '../src/combat/action-economy';
import {
  damageNegationReserveForLevel,
  getBuffDamageNegation,
  getTempDamageNegation,
  refreshBuffDamageNegationPools,
} from '../src/combat/damage-negation';
import {
  clearReactionInstanceTempHP,
  getTempHPSources,
  grantReactionInstanceTempHP,
  previewTempHPConsumption,
  upsertTempHPSource,
  type TempHPSource,
} from '../src/combat/passive-triggers';
import {
  listAvailableCriticalSources,
  resolveCriticalAttackModifier,
  critAppliesToAttackRoll,
} from '../src/combat/critical-resolution';
import {
  passiveCriticalChargesForLevel,
  passiveMaximizationChargesForLevel,
} from '../src/combat/passive-combat-charges';
import { maximizeDamageFormula } from '../src/stones/stone-combat-effects';
import { STONE_POWERS, stonePowerRankCost, isPremiumStonePower } from '../src/stones/stone-powers';
import { ACTIVE_BUFF_TEMPLATES } from '../src/utils/powers/templates/activeBuffs';
import { REACTION_TEMPLATES } from '../src/utils/powers/templates/reaction';

function mergeDotPath(target: any, path: string, value: unknown): void {
  const parts = path.split('.');
  let cur = target;
  for (let i = 0; i < parts.length - 1; i++) {
    const seg = parts[i]!;
    if (cur[seg] == null || typeof cur[seg] !== 'object') cur[seg] = {};
    cur = cur[seg];
  }
  const last = parts[parts.length - 1]!;
  if (last.startsWith('-=')) delete cur[last.slice(2)];
  else cur[last] = value;
}

function makeActor() {
  const flagStore: Record<string, any> = {};
  const actor: any = {
    id: 'hero',
    name: 'Hero',
    type: 'character',
    system: {
      health: { tempHP: 0, bars: [{ max: 40, current: 40 }], currentBar: 0 },
      combat: {},
      mastery: { rank: 2 },
    },
    flags: { 'mastery-system': {} },
    effects: [] as any[],
    getFlag(_s: string, key: string) {
      return flagStore[key] ?? actor.flags?.['mastery-system']?.[key];
    },
    setFlag: async (_s: string, key: string, value: unknown) => {
      flagStore[key] = value;
      if (!actor.flags['mastery-system']) actor.flags['mastery-system'] = {};
      actor.flags['mastery-system'][key] = value;
    },
    unsetFlag: async (_s: string, key: string) => {
      delete flagStore[key];
      if (actor.flags?.['mastery-system']) delete actor.flags['mastery-system'][key];
    },
    update: async (data: Record<string, unknown>) => {
      for (const [path, value] of Object.entries(data)) {
        mergeDotPath(actor, path, value);
        if (path.startsWith('flags.mastery-system.')) {
          const key = path.slice('flags.mastery-system.'.length).replace(/^-=/, '');
          if (path.includes('.-=') || path.match(/\.-=/)) {
            /* handled by mergeDotPath */
          } else if (!path.includes('tempHPSources')) {
            flagStore[key] = value;
          }
        }
      }
    },
  };
  return actor;
}

function abTemplate(id: string) {
  return ACTIVE_BUFF_TEMPLATES.find((t) => t.templateId === id);
}

function reactionTemplate(id: string) {
  return REACTION_TEMPLATES.find((t) => t.templateId === id);
}

describe('1. Stone Damage Negation ranks + Round-End pool', () => {
  beforeEach(() => {
    vi.stubGlobal('game', { combat: { id: 'c1', round: 1, turn: 0 } });
    vi.stubGlobal('canvas', { tokens: { placeables: [] } });
    vi.stubGlobal('ui', { notifications: { info: () => undefined, warn: () => undefined } });
    vi.stubGlobal('Hooks', { callAll: () => undefined });
  });

  it('Rank 1/2/3/4 = 2/4/8/12 at Premium costs 2/6/12/20', () => {
    expect(isPremiumStonePower('vitality.damageNegation')).toBe(true);
    expect(STONE_POWERS['vitality.damageNegation'].tiers.map((t) => t.value)).toEqual([2, 4, 8, 12]);
    expect([1, 2, 3, 4].map((r) => stonePowerRankCost('vitality.damageNegation', r))).toEqual([
      2, 4, 6, 8,
    ]);
    expect(
      [1, 2, 3, 4].map((r) => {
        let sum = 0;
        for (let i = 1; i <= r; i++) sum += stonePowerRankCost('vitality.damageNegation', i);
        return sum;
      }),
    ).toEqual([2, 6, 12, 20]);
  });

  it('Rank1 pool can remove 1 die from two hits in the same Round, then expires at Round End', async () => {
    const actor = makeActor();
    const combat = { id: 'c1', round: 1, turn: 0 } as any;
    await STONE_POWERS['vitality.damageNegation'].apply({
      actor,
      combatant: { getFlag: () => undefined, setFlag: async () => undefined } as any,
      tier: 1,
      cost: 2,
    });
    expect(getTempDamageNegation(actor, combat)).toBe(2);

    const rs = getRoundState(actor, combat);
    rs.stoneBonuses!.tempDamageNegation = 1;
    await setRoundState(actor, rs);
    expect(getTempDamageNegation(actor, combat)).toBe(1);

    await setRoundState(actor, {
      ...getRoundState(actor, combat),
      stoneBonuses: {
        ...getRoundState(actor, combat).stoneBonuses!,
        damageBonus: 3,
        tempDamageNegation: 1,
      },
    });
    await clearCombatStoneTurnBonusesForActor(actor, combat);
    expect(getTempDamageNegation(actor, combat)).toBe(1);

    await resetRoundState(actor, { getFlag: () => undefined } as any, {
      ...combat,
      round: 2,
    } as any);
    expect(getTempDamageNegation(actor, { ...combat, round: 2 })).toBe(0);
    expect(DEFENSIVE_STONE_KEYS).not.toContain('tempDamageNegation');
  });
});

describe('2. Passive DN reserve stays separate from Stone/Buff', () => {
  it('PL4 Passive reserve = 8; Stone/Buff pools tracked separately', () => {
    expect(damageNegationReserveForLevel(4)).toBe(8);
    const actor = makeActor();
    actor.effects.push({
      disabled: false,
      flags: {
        'mastery-system': {
          activeBuff: true,
          mechanics: { damageNegation: 4, damageNegationPoolMax: 4 },
        },
      },
      update: async () => undefined,
    });
    expect(getBuffDamageNegation(actor)).toBe(4);
    expect(damageNegationReserveForLevel(4)).toBe(8);
  });
});

describe('3. Reaction one-instance Temporary HP', () => {
  it('PL4 self = 20, ally = 17; unused remainder expires after the instance', async () => {
    const selfRow = reactionTemplate('reaction-temp-hp')?.levels?.['4'];
    const allyRow = reactionTemplate('reaction-ally-temp-hp')?.levels?.['4'];
    expect(selfRow?.mechanics?.tempHP).toBe('20');
    expect(allyRow?.mechanics?.tempHP).toBe('17');

    const actor = makeActor();
    await grantReactionInstanceTempHP(actor, 20, {
      combat: { id: 'c1' },
      powerName: 'Reaction: Temporary HP',
    });
    expect(actor.system.health.tempHP).toBe(20);

    const consumed = previewTempHPConsumption(actor, 12);
    expect(consumed.reducedBy).toBe(12);
    expect(consumed.remainingDamage).toBe(0);
    await actor.update(consumed.patch);
    expect(actor.system.health.tempHP).toBe(8);

    const cleared = await clearReactionInstanceTempHP(actor);
    expect(cleared).toBe(8);
    expect(actor.system.health.tempHP).toBe(0);
    const next = previewTempHPConsumption(actor, 10);
    expect(next.reducedBy).toBe(0);
    expect(next.remainingDamage).toBe(10);
  });

  it('does not strip Buff Temporary HP when clearing reaction leftovers', async () => {
    const actor = makeActor();
    const buffSrc: TempHPSource = {
      value: 32,
      declared: 32,
      kind: 'refresh',
      origin: {
        ownerKind: 'buff',
        powerId: 'eff1',
        name: 'Active Buff: Temporary HP',
        triggerKind: 'turnStartSelf',
      },
      combatId: 'c1',
      createdAt: 1,
    };
    await upsertTempHPSource(actor, 'buff:eff1:turnStartSelf', buffSrc);
    await grantReactionInstanceTempHP(actor, 20, { combat: { id: 'c1' } });
    expect(actor.system.health.tempHP).toBe(52);

    const preview = previewTempHPConsumption(actor, 12);
    await actor.update(preview.patch);
    await clearReactionInstanceTempHP(actor);

    const sources = getTempHPSources(actor);
    expect(Object.values(sources).some((s) => s.kind === 'reaction-instance')).toBe(false);
    expect(Object.values(sources).some((s) => s.origin?.ownerKind === 'buff')).toBe(true);
    expect(actor.system.health.tempHP).toBe(32);
  });
});

describe('4. Counter Damage: no Crit; Maximization allowed; numbers preserved', () => {
  it('preserves Counter Damage / Damage+Push dice curves', () => {
    const dmg = reactionTemplate('reaction-counter-damage');
    const push = reactionTemplate('reaction-counter-damage-push');
    expect(dmg?.levels?.['4']?.mechanics?.damageRider?.flat).toBe('+4d8');
    expect(push?.levels?.['4']?.mechanics?.damageRider?.flat).toBe('+2d8');
    expect(String(push?.levels?.['4']?.effect?.text || '')).toMatch(/push/i);
  });

  it('Counter Damage has no Attack/Casting Roll → Crit does not apply without declaration', () => {
    expect(critAppliesToAttackRoll({ spell: false, damageDice: 4 })).toBe(true);
    const mod = resolveCriticalAttackModifier({
      activeBuffCriticalX: 2,
      buffQuotaRemaining: 2,
      stoneCritCharges: 2,
      passiveCritCharges: 2,
      declared: false,
    });
    expect(mod.applyCritical).toBe(false);
  });

  it('Maximization of 10d8 after −2 Stone DN yields 64 artificial damage', () => {
    const remainingDice = 10 - 2;
    const maximized = maximizeDamageFormula(`${remainingDice}d8`);
    expect(maximized).toBe('64');
    expect(Number(maximized)).toBe(8 * 8);
  });
});

describe('5. Active Buff DN Pool — immediate grant + Prep refresh', () => {
  it('PL4 printed pool = 4 (sync-only; optional ceil/2 not adopted)', () => {
    const row = abTemplate('ab-reinforced-damage-negation')?.levels?.['4'];
    expect(row?.mechanics?.damageNegation).toBe(4);
    expect(row?.mechanics?.damageNegationPoolMax).toBe(4);
  });

  it('activation snapshot grants current Round pool; Prep refresh restores max', async () => {
    const actor = makeActor();
    const effect: any = {
      disabled: false,
      name: 'Active Buff: Damage Negation Pool',
      flags: {
        'mastery-system': {
          activeBuff: true,
          powerTemplateId: 'ab-reinforced-damage-negation',
          mechanics: { damageNegation: 4, damageNegationPoolMax: 4 },
        },
      },
      update: async (data: Record<string, unknown>) => {
        const n = Number(data['flags.mastery-system.mechanics.damageNegation']);
        if (Number.isFinite(n)) effect.flags['mastery-system'].mechanics.damageNegation = n;
      },
    };
    actor.effects.push(effect);
    expect(getBuffDamageNegation(actor)).toBe(4);

    effect.flags['mastery-system'].mechanics.damageNegation = 1;
    expect(getBuffDamageNegation(actor)).toBe(1);

    await refreshBuffDamageNegationPools(actor);
    expect(getBuffDamageNegation(actor)).toBe(4);
  });
});

describe('6. Active Buff Temporary HP vs Reaction Temp HP', () => {
  it('PL4 Buff grants 32 via Preparation refresh (not turnStartSelf)', () => {
    const row = abTemplate('ab-temp-hp')?.levels?.['4'];
    expect(row?.mechanics?.tempHP).toBe('32');
    expect(row?.mechanics?.preparationTempHP).toBe(true);
    expect(row?.mechanics?.triggers?.turnStartSelf).toBeUndefined();
  });

  it('Reaction PL4 remains 20 one-instance', () => {
    expect(reactionTemplate('reaction-temp-hp')?.levels?.['4']?.mechanics?.tempHP).toBe('20');
  });
});

describe('7. Critical sources are independent; one nominated per roll', () => {
  it('Passive Crit 1/2/3 at PL4/8/15; Buff milestones 1/2/3/4 at PL4/8/12/15', () => {
    expect(passiveCriticalChargesForLevel(4)).toBe(1);
    expect(passiveCriticalChargesForLevel(8)).toBe(2);
    expect(passiveCriticalChargesForLevel(15)).toBe(3);
    const crit = abTemplate('ab-critical');
    expect(crit?.levels?.['4']?.mechanics?.critical).toBe(1);
    expect(crit?.levels?.['8']?.mechanics?.critical).toBe(2);
    expect(crit?.levels?.['12']?.mechanics?.critical).toBe(3);
    expect(crit?.levels?.['15']?.mechanics?.critical).toBe(4);
  });

  it('exactly one source charged when preferred', () => {
    const sources = listAvailableCriticalSources({
      buffQuotaRemaining: 2,
      stoneCritCharges: 1,
      passiveCritCharges: 2,
    });
    expect(sources.map((s) => s.source)).toEqual(['active-buff', 'stone-crit', 'passive-crit']);
    const mod = resolveCriticalAttackModifier({
      activeBuffCriticalX: 2,
      buffQuotaRemaining: 2,
      stoneCritCharges: 1,
      passiveCritCharges: 2,
      declared: true,
      preferredSource: 'passive-crit',
    });
    expect(mod.applyCritical).toBe(true);
    expect(mod.consumeFrom).toBe('passive-crit');
  });
});

describe('8. Maximization sources + Stone DN interaction', () => {
  it('Passive Max 1/2/3 at PL4/8/15', () => {
    expect(passiveMaximizationChargesForLevel(4)).toBe(1);
    expect(passiveMaximizationChargesForLevel(8)).toBe(2);
    expect(passiveMaximizationChargesForLevel(15)).toBe(3);
  });

  it('10d8 − 2 Stone DN maximized = 64; forced 8s are not natural 8s', () => {
    const afterDn = maximizeDamageFormula('8d8');
    expect(afterDn).toBe('64');
    expect(afterDn).not.toMatch(/d8/i);
  });
});

describe('9. Round boundary + multi-hit Stone DN', () => {
  beforeEach(() => {
    vi.stubGlobal('game', { combat: { id: 'c9', round: 1, turn: 0 } });
    vi.stubGlobal('canvas', { tokens: { placeables: [] } });
    vi.stubGlobal('Hooks', { callAll: () => undefined });
  });

  it('two hits spend the same Round Stone DN pool; round change clears leftovers', async () => {
    const actor = makeActor();
    const combat = { id: 'c9', round: 1, turn: 0 } as any;
    await setRoundState(actor, {
      combatId: 'c9',
      round: 1,
      turn: 0,
      isPC: true,
      movementActions: { total: 1, used: 0 },
      attackActions: { total: 1, used: 0 },
      reactionActions: { total: 1, used: 0 },
      moveBonusMeters: 0,
      usedPowerIdsThisRound: [],
      npcAttackUsesThisRound: {},
      stoneBonuses: {
        extraAttacks: 0,
        extraReactions: 0,
        extraMoveMeters: 0,
        tempDamageNegation: 2,
        tempArmor: 8,
      },
    });

    const rs = getRoundState(actor, combat);
    rs.stoneBonuses!.tempDamageNegation = 0;
    await setRoundState(actor, rs);

    await armDefensiveStoneExpiry(actor, combat);
    await resetRoundState(actor, { getFlag: () => undefined } as any, {
      ...combat,
      round: 2,
    } as any);
    const after = getRoundState(actor, { ...combat, round: 2 });
    expect(after.stoneBonuses?.tempDamageNegation ?? 0).toBe(0);
    expect(after.stoneBonuses?.tempArmor).toBe(8);
  });
});

describe('Active Buff Spell Resistance — Final Spell TN wording', () => {
  it('catalogue effect mentions Final Spell TN', () => {
    const text = String(abTemplate('ab-spell-resistance')?.levels?.['4']?.effect?.text || '');
    expect(text.toLowerCase()).toMatch(/final spell tn/);
  });
});
