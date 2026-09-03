/**
 * Canonical Stone Powers Definition — new tier-based spec.
 *
 * Most powers publish T1–T4. A listed set starts at Tier 2: Tier 1 does
 * not exist in data, UI, spending, validation, or serialization. First
 * purchase is T2 (2 Stones total), then T3 (6 total), then T4 (14 total).
 * Tiers continue past the printed table — T5 costs 16, T6 costs 32, up to T8.
 *
 * Pool layout: Generic + 7 attribute pools (Might / Agility / Vitality /
 * Intellect / Resolve / Influence / Wits). Every pool has 4 powers. Total 32.
 *
 * Effects live in `apply(ctx)` and write into `roundState.stoneBonuses`
 * or set actor / combatant flags. Cleanup of per-turn bonuses happens
 * in `clearCombatStoneTurnBonusesForActor` (see action-economy.ts).
 */

import {
  getRoundState,
  setRoundState,
  type AttributeKey,
} from '../combat/action-economy.js';
import { healStressFromBars } from '../utils/calculations.js';
import {
  initiativeBoostAmount,
  isInitiativeBoostUsedThisCombat,
  markInitiativeBoostUsedThisCombat,
} from './colorless-stones.js';

export type StonePowerAttribute = AttributeKey | 'generic';

export interface StoneTier {
  /** Short rules label for a published tier. */
  label: string;
  /** Long-form description used in the dialog tooltip / chat audit. */
  description: string;
  /** Optional numeric scale (used by apply()). Meaning varies per power. */
  value?: number;
}

export interface StonePowerContext {
  actor: any;
  combatant: any;
  /** 1..8 — activation tier (UI currently shows 1..4). */
  tier: number;
  /** Stone cost of this activation (1 / 2 / 4 / 8 / …). */
  cost: number;
}

export interface StonePower {
  id: string;
  name: string;
  attribute: StonePowerAttribute;
  category: 'action' | 'passive' | 'reaction';
  /** Short one-liner (the matching tier description is preferred at runtime). */
  description: string;
  /** Compiled multi-tier tooltip — generated on module load. */
  effect: string;
  /** First published tier. `2` means Tier 1 does not exist for this ability. */
  startsAtTier: 1 | 2;
  /** Published effects starting at `startsAtTier` (T1–T4 or T2–T4). */
  tiers: StoneTier[];
  /**
   * When true, this power may be used only once per combat.
   * Driven by power data / rules — never inferred from category alone.
   */
  oncePerCombat?: boolean;
  /** Apply the effect for the given tier. */
  apply: (ctx: StonePowerContext) => Promise<void>;
}

type StonePowerDraft = Omit<StonePower, 'effect' | 'startsAtTier'> & { startsAtTier?: 1 | 2 };

/** Tiers shown in the dialog / Players Guide. */
export const STONE_TIER_VISIBLE = 4;
/** Last wave you can fully pay with 80 Stones (1+2+4+8+16+32 = 63). */
export const STONE_TIER_PRACTICAL_MAX = 6;
/** Hard cap while the table is still open-ended. */
export const STONE_TIER_HARD_MAX = 8;

/**
 * Continue a published T1–T4 number sequence past the printed table.
 * Doubling sequences keep doubling; otherwise the last delta repeats.
 */
export function scaleStoneTier(seq: readonly number[], tier: number): number {
  const t = Math.max(1, Math.floor(Number(tier) || 1));
  if (t <= seq.length) return Number(seq[t - 1]) || 0;
  if (seq.length === 0) return 0;
  if (seq.length === 1) return Number(seq[0]) || 0;
  const a = Number(seq[seq.length - 2]) || 0;
  const b = Number(seq[seq.length - 1]) || 0;
  const steps = t - seq.length;
  if (a > 0 && b > 0 && b % a === 0 && b / a >= 2) {
    return b * (b / a) ** steps;
  }
  return b + (b - a) * steps;
}

/** Wave cost of an absolute tier: T1=1, T2=2, T3=4, T4=8, … */
export function stonePowerWaveCost(tier: number): number {
  return Math.pow(2, Math.max(1, Math.floor(Number(tier) || 1)) - 1);
}

/** Cumulative stones to reach `tier` when the first published tier is `startsAtTier`. */
export function cumulativeStoneCostForTier(tier: number, startsAtTier: 1 | 2 = 1): number {
  const start = startsAtTier === 2 ? 2 : 1;
  const end = Math.max(start, Math.floor(Number(tier) || start));
  let total = 0;
  for (let t = start; t <= end; t += 1) total += stonePowerWaveCost(t);
  return total;
}

/** Compile the multi-tier tooltip. T2-start powers omit any T1 line. */
function compileEffectText(
  name: string,
  tiers: readonly StoneTier[],
  startsAtTier: 1 | 2 = 1,
): string {
  const lines = tiers.map((t, i) => {
    const tierNum = startsAtTier + i;
    const cost = stonePowerWaveCost(tierNum);
    return `T${tierNum} (${cost}): ${t.description || t.label}`;
  });
  return `${name}\n${lines.join('\n')}`;
}

/** Shared helper — ensure `stoneBonuses` exists with required defaults. */
function ensureStoneBonuses(rs: any): NonNullable<ReturnType<typeof getRoundState>['stoneBonuses']> {
  if (!rs.stoneBonuses) {
    rs.stoneBonuses = { extraAttacks: 0, extraReactions: 0, extraMoveMeters: 0 };
  }
  return rs.stoneBonuses;
}

// ---------------------------------------------------------------------------
// Generic Powers — any pool can pay. 4 powers per spec.
// ---------------------------------------------------------------------------

const GENERIC_POWERS_RAW: StonePowerDraft[] = [
  {
    id: 'generic.extraAttack',
    name: 'Extra Attack',
    attribute: 'generic',
    category: 'action',
    description: 'Gain additional Attack Actions this round (T2: +1, T3: +2, T4: +3).',
    startsAtTier: 2,
    tiers: [
      { label: '+1 Attack Action', description: 'Gain 1 additional Attack Action this round.', value: 1 },
      { label: '+2 Attack Actions', description: 'Gain 2 additional Attack Actions this round.', value: 2 },
      { label: '+3 Attack Actions', description: 'Gain 3 additional Attack Actions this round.', value: 3 },
    ],
    apply: async ({ actor, tier }) => {
      if (tier < 2) return;
      const combat = (game as any).combat;
      const bonus = scaleStoneTier([1, 2, 3], tier - 1);
      if (bonus <= 0) return;
      const roundState = getRoundState(actor, combat);
      roundState.attackActions.total += bonus;
      const sb = ensureStoneBonuses(roundState);
      sb.extraAttacks = (sb.extraAttacks ?? 0) + bonus;
      await setRoundState(actor, roundState);
    },
  },
  {
    id: 'generic.extraMovement',
    name: 'Extra Movement',
    attribute: 'generic',
    category: 'action',
    description: 'Gain additional Movement actions this round (T1..T4: +1/+2/+3/+4).',
    tiers: [
      { label: '+1 Movement', description: 'Gain 1 additional Movement this round.', value: 1 },
      { label: '+2 Movement', description: 'Gain 2 additional Movements this round.', value: 2 },
      { label: '+3 Movement', description: 'Gain 3 additional Movements this round.', value: 3 },
      { label: '+4 Movement', description: 'Gain 4 additional Movements this round.', value: 4 },
    ],
    apply: async ({ actor, tier }) => {
      const combat = (game as any).combat;
      const bonus = Math.max(0, tier);
      const roundState = getRoundState(actor, combat);
      roundState.movementActions.total += bonus;
      await setRoundState(actor, roundState);
    },
  },
  {
    id: 'generic.extraReaction',
    name: 'Extra Reaction',
    attribute: 'generic',
    category: 'reaction',
    description: 'Gain additional Reactions this round (T1..T4: +1/+2/+3/+4).',
    tiers: [
      { label: '+1 Reaction', description: 'Gain 1 additional Reaction this round.', value: 1 },
      { label: '+2 Reactions', description: 'Gain 2 additional Reactions this round.', value: 2 },
      { label: '+3 Reactions', description: 'Gain 3 additional Reactions this round.', value: 3 },
      { label: '+4 Reactions', description: 'Gain 4 additional Reactions this round.', value: 4 },
    ],
    apply: async ({ actor, tier }) => {
      const combat = (game as any).combat;
      const bonus = Math.max(0, tier);
      const roundState = getRoundState(actor, combat);
      roundState.reactionActions.total += bonus;
      const sb = ensureStoneBonuses(roundState);
      sb.extraReactions = (sb.extraReactions ?? 0) + bonus;
      await setRoundState(actor, roundState);
    },
  },
  {
    id: 'generic.exchangePassive',
    name: 'Exchange Passive',
    attribute: 'generic',
    category: 'passive',
    description:
      'Swap active Passives with other Passives you know (T1..T4: 1/1/2/2 swaps). Cost is cumulative per combat (1, then 2, then 4…). Stones become Exhausted, not Burned.',
    tiers: [
      { label: 'Swap 1', description: 'Swap 1 active Passive with another Passive you know.', value: 1 },
      { label: 'Swap 1', description: 'Swap 1 active Passive with another Passive you know.', value: 1 },
      { label: 'Swap 2', description: 'Swap 2 active Passives with other Passives you know.', value: 2 },
      { label: 'Swap 2', description: 'Swap 2 active Passives with other Passives you know.', value: 2 },
    ],
    apply: async ({ actor, tier }) => {
      const swaps = Math.ceil(tier / 2);
      const flagKey = 'exchangePassiveSwapsPending';
      const prior = Number((actor as any).getFlag?.('mastery-system', flagKey) ?? 0) || 0;
      await (actor as any).setFlag?.('mastery-system', flagKey, prior + swaps);
      ui.notifications?.info(
        `${(actor as any).name}: Exchange Passive — ${swaps} passive swap(s) pending.`,
      );
    },
  },
];

// ---------------------------------------------------------------------------
// Might
// ---------------------------------------------------------------------------

const MIGHT_POWERS_RAW: StonePowerDraft[] = [
  {
    id: 'might.meleeDamage',
    name: 'Melee Damage',
    attribute: 'might',
    category: 'action',
    description: 'Add bonus damage dice to your next melee damage roll this turn (+2/+4/+8/+16).',
    tiers: [
      { label: '+2 Damage Dice', description: 'Add +2 Damage Dice to your next melee damage roll this turn.', value: 2 },
      { label: '+4 Damage Dice', description: 'Add +4 Damage Dice to your next melee damage roll this turn.', value: 4 },
      { label: '+8 Damage Dice', description: 'Add +8 Damage Dice to your next melee damage roll this turn.', value: 8 },
      { label: '+16 Damage Dice', description: 'Add +16 Damage Dice to your next melee damage roll this turn.', value: 16 },
    ],
    apply: async ({ actor, tier }) => {
      const combat = (game as any).combat;
      const dice = scaleStoneTier([2, 4, 8, 16], tier);
      const roundState = getRoundState(actor, combat);
      const sb = ensureStoneBonuses(roundState);
      sb.meleeDamageBonusDice = (sb.meleeDamageBonusDice ?? 0) + dice;
      // Keep the legacy aggregate field in sync so damage-dialog (which only
      // reads damageBonus today) still surfaces the bonus until it's wired
      // up to read meleeDamageBonusDice directly.
      sb.damageBonus = (sb.damageBonus ?? 0) + dice;
      await setRoundState(actor, roundState);
    },
  },
  {
    id: 'might.armor',
    name: 'Armor',
    attribute: 'might',
    category: 'passive',
    description: 'Gain flat temporary Armor until the start of your next turn (+4/+8/+16/+32).',
    tiers: [
      { label: '+4 Armor', description: 'Gain +4 Armor until the start of your next turn.', value: 4 },
      { label: '+8 Armor', description: 'Gain +8 Armor until the start of your next turn.', value: 8 },
      { label: '+16 Armor', description: 'Gain +16 Armor until the start of your next turn.', value: 16 },
      { label: '+32 Armor', description: 'Gain +32 Armor until the start of your next turn.', value: 32 },
    ],
    apply: async ({ actor, tier }) => {
      const combat = (game as any).combat;
      // Re-activation ADDs (PG "Temporary Defensive Stone Values").
      const bonus = scaleStoneTier([4, 8, 16, 32], tier);
      const roundState = getRoundState(actor, combat);
      const sb = ensureStoneBonuses(roundState);
      sb.tempArmor = (sb.tempArmor ?? 0) + bonus;
      await setRoundState(actor, roundState);
    },
  },
  {
    id: 'might.ignoreArmor',
    name: 'Ignore Armor',
    attribute: 'might',
    category: 'action',
    description: 'All your melee attacks this turn ignore this much Armor (4/8/16/32).',
    tiers: [
      { label: 'Ignore 4 Armor', description: 'All your melee attacks this turn ignore 4 Armor.', value: 4 },
      { label: 'Ignore 8 Armor', description: 'All your melee attacks this turn ignore 8 Armor.', value: 8 },
      { label: 'Ignore 16 Armor', description: 'All your melee attacks this turn ignore 16 Armor.', value: 16 },
      { label: 'Ignore 32 Armor', description: 'All your melee attacks this turn ignore 32 Armor.', value: 32 },
    ],
    apply: async ({ actor, tier }) => {
      const combat = (game as any).combat;
      const bonus = scaleStoneTier([4, 8, 16, 32], tier);
      const roundState = getRoundState(actor, combat);
      const sb = ensureStoneBonuses(roundState);
      sb.meleeIgnoreArmor = (sb.meleeIgnoreArmor ?? 0) + bonus;
      // Mirror into the legacy armorPenetration aggregator until consumers
      // are updated to read the melee-specific field.
      sb.armorPenetration = (sb.armorPenetration ?? 0) + bonus;
      await setRoundState(actor, roundState);
    },
  },
  {
    id: 'might.parry',
    name: 'Parry',
    attribute: 'might',
    category: 'passive',
    description: 'Gain Parry Pool until the start of your next turn (T2: +4, T3: +8, T4: +12). Creates Parry if you do not have it.',
    startsAtTier: 2,
    tiers: [
      { label: '+4 Parry Pool', description: 'Gain +4 Parry Pool until the start of your next turn.', value: 4 },
      { label: '+8 Parry Pool', description: 'Gain +8 Parry Pool until the start of your next turn.', value: 8 },
      { label: '+12 Parry Pool', description: 'Gain +12 Parry Pool until the start of your next turn.', value: 12 },
    ],
    apply: async ({ actor, tier }) => {
      if (tier < 2) return;
      const combat = (game as any).combat;
      const bonus = scaleStoneTier([4, 8, 12], tier - 1);
      if (bonus <= 0) return;
      const roundState = getRoundState(actor, combat);
      const sb = ensureStoneBonuses(roundState);
      // Re-activation ADDs (PG "Temporary Defensive Stone Values").
      sb.tempParryPool = (sb.tempParryPool ?? 0) + bonus;
      await setRoundState(actor, roundState);
    },
  },
];

// ---------------------------------------------------------------------------
// Agility
// ---------------------------------------------------------------------------

const AGILITY_POWERS_RAW: StonePowerDraft[] = [
  {
    id: 'agility.crit',
    name: 'Crit',
    attribute: 'agility',
    category: 'action',
    description: 'A number of your attacks this round can have Crit(1). You decide which attacks BEFORE you roll each attack roll (T2: 1, T3: 2, T4: 3).',
    startsAtTier: 2,
    tiers: [
      { label: '1 attack: Crit(1)', description: 'One of your attacks this round can have Crit(1). You decide which attack before you roll the Attack Roll.', value: 1 },
      { label: '2 attacks: Crit(1)', description: 'Two of your attacks this round can have Crit(1). You decide which attacks before you roll each Attack Roll.', value: 2 },
      { label: '3 attacks: Crit(1)', description: 'Three of your attacks this round can have Crit(1). You decide which attacks before you roll each Attack Roll.', value: 3 },
    ],
    apply: async ({ actor, tier }) => {
      if (tier < 2) return;
      const combat = (game as any).combat;
      const charges = scaleStoneTier([1, 2, 3], tier - 1);
      if (charges <= 0) return;
      const roundState = getRoundState(actor, combat);
      const sb = ensureStoneBonuses(roundState);
      sb.critRaises = (sb.critRaises ?? 0) + charges;
      await setRoundState(actor, roundState);
    },
  },
  {
    id: 'agility.evade',
    name: 'Evade',
    attribute: 'agility',
    category: 'passive',
    description: 'Gain Evade until the start of your next turn (+8/+16/+24/+32).',
    tiers: [
      { label: '+8 Evade', description: 'Gain +8 Evade until the start of your next turn.', value: 8 },
      { label: '+16 Evade', description: 'Gain +16 Evade until the start of your next turn.', value: 16 },
      { label: '+24 Evade', description: 'Gain +24 Evade until the start of your next turn.', value: 24 },
      { label: '+32 Evade', description: 'Gain +32 Evade until the start of your next turn.', value: 32 },
    ],
    apply: async ({ actor, tier }) => {
      const combat = (game as any).combat;
      const bonus = scaleStoneTier([8, 16, 24, 32], tier);
      const roundState = getRoundState(actor, combat);
      const sb = ensureStoneBonuses(roundState);
      sb.evadeBonus = (sb.evadeBonus ?? 0) + bonus;
      await setRoundState(actor, roundState);
    },
  },
  {
    id: 'agility.safeMovement',
    name: 'Safe Movement',
    attribute: 'agility',
    category: 'action',
    description: 'Move some distance without provoking opportunity attacks (4 / 8 / 12 / 16 m).',
    tiers: [
      { label: 'Move 4 m, no reactions', description: 'Move up to 4 m. This movement does not provoke reactions.', value: 4 },
      { label: 'Move 8 m, no reactions', description: 'Move up to 8 m. This movement does not provoke reactions.', value: 8 },
      { label: 'Move 12 m, no reactions', description: 'Move up to 12 m. This movement does not provoke reactions.', value: 12 },
      { label: 'Move 16 m, no reactions', description: 'Move up to 16 m. This movement does not provoke reactions.', value: 16 },
    ],
    apply: async ({ actor, tier }) => {
      const combat = (game as any).combat;
      const meters = scaleStoneTier([4, 8, 12, 16], tier);
      const roundState = getRoundState(actor, combat);
      roundState.moveBonusMeters = (roundState.moveBonusMeters ?? 0) + meters;
      await setRoundState(actor, roundState);
      const prior = Number((actor as any).getFlag?.('mastery-system', 'pendingNoOaMove') ?? 0) || 0;
      await (actor as any).setFlag?.('mastery-system', 'pendingNoOaMove', prior + meters);
    },
  },
  {
    id: 'agility.slip',
    name: 'Slip',
    attribute: 'agility',
    category: 'reaction',
    description: 'Once before the start of your next turn, when an enemy misses you with an attack, you may move 2/4/6/8 m.',
    tiers: [
      { label: 'Slip 2 m on miss', description: 'Once before the start of your next turn, when an enemy misses you with an attack, you may move 2 m.', value: 2 },
      { label: 'Slip 4 m on miss', description: 'Once before the start of your next turn, when an enemy misses you with an attack, you may move 4 m.', value: 4 },
      { label: 'Slip 6 m on miss', description: 'Once before the start of your next turn, when an enemy misses you with an attack, you may move 6 m.', value: 6 },
      { label: 'Slip 8 m on miss', description: 'Once before the start of your next turn, when an enemy misses you with an attack, you may move 8 m.', value: 8 },
    ],
    apply: async ({ actor, tier }) => {
      const meters = scaleStoneTier([2, 4, 6, 8], tier);
      await (actor as any).setFlag?.('mastery-system', 'pendingSlipMeters', meters);
    },
  },
];

// ---------------------------------------------------------------------------
// Vitality
// ---------------------------------------------------------------------------

const VITALITY_POWERS_RAW: StonePowerDraft[] = [
  {
    id: 'vitality.tempHp',
    name: 'Temporary HP',
    attribute: 'vitality',
    category: 'passive',
    description: 'Gain Temporary HP until the start of your next turn (20 / 40 / 80 / 160).',
    tiers: [
      { label: '20 Temp HP', description: 'Gain 20 Temporary HP until the start of your next turn.', value: 20 },
      { label: '40 Temp HP', description: 'Gain 40 Temporary HP until the start of your next turn.', value: 40 },
      { label: '80 Temp HP', description: 'Gain 80 Temporary HP until the start of your next turn.', value: 80 },
      { label: '160 Temp HP', description: 'Gain 160 Temporary HP until the start of your next turn.', value: 160 },
    ],
    apply: async ({ actor, tier }) => {
      const combat = (game as any).combat;
      // Tiers are cumulative TOTALS (20/40/80/160), not per-wave increments.
      const hp = scaleStoneTier([20, 40, 80, 160], tier);
      // Canonical field is `tempHP` (capital P) — the damage pipeline and all
      // health math read/consume that.
      const roundState = getRoundState(actor, combat);
      const sb = ensureStoneBonuses(roundState);
      const current = Math.max(0, Number((actor as any).system?.health?.tempHP ?? 0) || 0);
      // Re-activation ADDs to the existing value (PG "Temporary Defensive
      // Stone Values": if you already have the defense, add the listed value).
      await (actor as any).update?.({ 'system.health.tempHP': current + hp });
      sb.tempHpGrantedThisTurn = Math.max(0, Number(sb.tempHpGrantedThisTurn ?? 0) || 0) + hp;
      await setRoundState(actor, roundState);
      ui.notifications?.info(`${(actor as any).name}: ${hp} Temp HP until the start of your next turn.`);
    },
  },
  {
    id: 'vitality.damageNegation',
    name: 'Damage Negation',
    attribute: 'vitality',
    category: 'passive',
    description: 'Gain Damage Negation until the start of your next turn (T2: +4, T3: +8, T4: +12). Creates it if you do not have it.',
    startsAtTier: 2,
    tiers: [
      { label: '+4 Damage Negation', description: 'Gain +4 Damage Negation until the start of your next turn.', value: 4 },
      { label: '+8 Damage Negation', description: 'Gain +8 Damage Negation until the start of your next turn.', value: 8 },
      { label: '+12 Damage Negation', description: 'Gain +12 Damage Negation until the start of your next turn.', value: 12 },
    ],
    apply: async ({ actor, tier }) => {
      if (tier < 2) return;
      const combat = (game as any).combat;
      const bonus = scaleStoneTier([4, 8, 12], tier - 1);
      if (bonus <= 0) return;
      const roundState = getRoundState(actor, combat);
      const sb = ensureStoneBonuses(roundState);
      // Re-activation ADDs (PG "Temporary Defensive Stone Values").
      sb.tempDamageNegation = (sb.tempDamageNegation ?? 0) + bonus;
      await setRoundState(actor, roundState);
    },
  },
  {
    id: 'vitality.removeScar',
    name: 'Remove Scar',
    attribute: 'vitality',
    category: 'action',
    description: 'Recover 1 Scarred Health Bar. Burns 1 Vitality Stone (any tier).',
    tiers: [
      { label: 'Recover 1 Scar', description: 'Recover 1 Scarred Health Bar. Burn 1 Vitality Stone.', value: 1 },
      { label: 'Recover 1 Scar', description: 'Recover 1 Scarred Health Bar. Burn 1 Vitality Stone.', value: 1 },
      { label: 'Recover 1 Scar', description: 'Recover 1 Scarred Health Bar. Burn 1 Vitality Stone.', value: 1 },
      { label: 'Recover 1 Scar', description: 'Recover 1 Scarred Health Bar. Burn 1 Vitality Stone.', value: 1 },
    ],
    apply: async ({ actor }) => {
      const system: any = (actor as any).system ?? {};
      // Scarred bar = fully depleted Health Bar. Restore the most recent one.
      const src: any[] = Array.isArray(system?.health?.bars) ? system.health.bars : [];
      let activeIdx = src.findIndex((b: any) => (Number(b?.current) || 0) > 0);
      if (activeIdx < 0) activeIdx = src.length;
      let scarIdx = -1;
      for (let i = activeIdx - 1; i >= 0; i--) {
        if ((Number(src[i]?.current) || 0) === 0) {
          scarIdx = i;
          break;
        }
      }
      if (scarIdx < 0) {
        ui.notifications?.warn(`${(actor as any).name} has no Scarred Health Bar to recover.`);
        return;
      }
      const bars = src.map((b: any) => ({ ...b }));
      bars[scarIdx] = { ...bars[scarIdx], current: Number(bars[scarIdx]?.max) || 0 };
      const scarredCount = bars.filter((b: any) => (Number(b?.current) || 0) === 0).length;
      const newActive = bars.findIndex((b: any) => (Number(b?.current) || 0) > 0);
      // BURN: the spent Vitality Stone is lost until a Safe Haven Rest —
      // `burned` keeps regen / refills from bringing it back early.
      const burnedNow = Math.max(0, Number(system?.stonePools?.vitality?.burned) || 0);
      await (actor as any).update?.({
        'system.health.bars': bars,
        'system.health.currentBar': Math.max(0, newActive),
        ...(Object.prototype.hasOwnProperty.call(system?.health ?? {}, 'scarred')
          ? { 'system.health.scarred': scarredCount }
          : {}),
        'system.stonePools.vitality.burned': burnedNow + 1,
      });
      ui.notifications?.info(
        `${(actor as any).name} recovered a Scarred Health Bar (1 Vitality Stone burned until Safe Haven Rest).`,
      );
    },
  },
  {
    id: 'vitality.extendActiveBuff',
    name: 'Extend Active Buff',
    attribute: 'vitality',
    category: 'action',
    description: 'Increase the duration of one Active Buff you activate this turn (+1 / +2 / +3 / +4 rounds).',
    tiers: [
      { label: '+1 round', description: 'Increase the duration of one Active Buff you activate this turn by +1 round.', value: 1 },
      { label: '+2 rounds', description: 'Increase the duration of one Active Buff you activate this turn by +2 rounds.', value: 2 },
      { label: '+3 rounds', description: 'Increase the duration of one Active Buff you activate this turn by +3 rounds.', value: 3 },
      { label: '+4 rounds', description: 'Increase the duration of one Active Buff you activate this turn by +4 rounds.', value: 4 },
    ],
    apply: async ({ actor, tier }) => {
      const combat = (game as any).combat;
      const rounds = scaleStoneTier([1, 2, 3, 4], tier);
      const roundState = getRoundState(actor, combat);
      const sb = ensureStoneBonuses(roundState);
      // Tiers are TOTALS (+1/+2/+3/+4) — keep the highest, don't stack. The
      // pending extension is consumed by the next Active Buff activation
      // (see activateActiveBuff) and cleared at end of turn.
      sb.extendActiveBuffRounds = Math.max(sb.extendActiveBuffRounds ?? 0, rounds);
      await setRoundState(actor, roundState);
      ui.notifications?.info(
        `${(actor as any).name}: Extend Active Buff — the next Active Buff activated this turn lasts +${rounds} round${rounds === 1 ? '' : 's'}.`,
      );
    },
  },
];

// ---------------------------------------------------------------------------
// Intellect
// ---------------------------------------------------------------------------

const INTELLECT_POWERS_RAW: StonePowerDraft[] = [
  {
    id: 'intellect.spellRaises',
    name: 'Spell Raises',
    attribute: 'intellect',
    category: 'action',
    description: 'Your Spells this turn gain +4 / +8 / +12 / +16 to their roll for meeting the Raise TN only.',
    tiers: [
      { label: '+4 Raise TN', description: 'Your Spells this turn gain +4 to their roll for the purpose of meeting the Raise TN only.', value: 4 },
      { label: '+8 Raise TN', description: 'Your Spells this turn gain +8 to their roll for the purpose of meeting the Raise TN only.', value: 8 },
      { label: '+12 Raise TN', description: 'Your Spells this turn gain +12 to their roll for the purpose of meeting the Raise TN only.', value: 12 },
      { label: '+16 Raise TN', description: 'Your Spells this turn gain +16 to their roll for the purpose of meeting the Raise TN only.', value: 16 },
    ],
    apply: async ({ actor, tier }) => {
      const combat = (game as any).combat;
      const bonus = scaleStoneTier([4, 8, 12, 16], tier);
      const roundState = getRoundState(actor, combat);
      const sb = ensureStoneBonuses(roundState);
      sb.spellRaiseTnBonus = (sb.spellRaiseTnBonus ?? 0) + bonus;
      await setRoundState(actor, roundState);
    },
  },
  {
    id: 'intellect.spellResistance',
    name: 'Spell Resistance',
    attribute: 'intellect',
    category: 'passive',
    description:
      'Until the start of your next turn, gain +4 / +8 / +12 / +16 Spell Resistance. This increases the Final Spell TN of both direct Spells and Spell AoEs checked against you.',
    tiers: [
      { label: '+4 Spell Resistance', description: 'Gain +4 Spell Resistance until the start of your next turn (direct Spells and Spell AoEs).', value: 4 },
      { label: '+8 Spell Resistance', description: 'Gain +8 Spell Resistance until the start of your next turn (direct Spells and Spell AoEs).', value: 8 },
      { label: '+12 Spell Resistance', description: 'Gain +12 Spell Resistance until the start of your next turn (direct Spells and Spell AoEs).', value: 12 },
      { label: '+16 Spell Resistance', description: 'Gain +16 Spell Resistance until the start of your next turn (direct Spells and Spell AoEs).', value: 16 },
    ],
    apply: async ({ actor, tier }) => {
      const combat = (game as any).combat;
      const bonus = scaleStoneTier([4, 8, 12, 16], tier);
      const roundState = getRoundState(actor, combat);
      const sb = ensureStoneBonuses(roundState);
      sb.spellResistanceBonus = (sb.spellResistanceBonus ?? 0) + bonus;
      await setRoundState(actor, roundState);
    },
  },
  {
    id: 'intellect.spellAction',
    name: 'Spell Action',
    attribute: 'intellect',
    category: 'action',
    description: 'Gain additional Attack Actions this round that may only cast Spells (T2: +1, T3: +2, T4: +3).',
    startsAtTier: 2,
    tiers: [
      { label: '+1 Spell Action', description: 'Gain 1 additional Attack Action this round. It may only be used to cast a Spell.', value: 1 },
      { label: '+2 Spell Actions', description: 'Gain 2 additional Attack Actions this round. They may only be used to cast Spells.', value: 2 },
      { label: '+3 Spell Actions', description: 'Gain 3 additional Attack Actions this round. They may only be used to cast Spells.', value: 3 },
    ],
    apply: async ({ actor, combatant, tier }) => {
      if (tier < 2) return;
      const bonus = scaleStoneTier([1, 2, 3], tier - 1);
      if (bonus <= 0) return;
      const combat = (game as any).combat;
      const roundState = getRoundState(actor, combat);
      roundState.attackActions.total += bonus;
      const sb = ensureStoneBonuses(roundState);
      sb.extraAttacks = (sb.extraAttacks ?? 0) + bonus;
      sb.extraSpellActions = (sb.extraSpellActions ?? 0) + bonus;
      await setRoundState(actor, roundState);
      // Mark the combatant so attack consumers know N attacks must be Spells.
      const prior = Number((combatant as any)?.getFlag?.('mastery-system', 'extraSpellActions') ?? 0) || 0;
      await (combatant as any)?.setFlag?.('mastery-system', 'extraSpellActions', prior + bonus);
    },
  },
  {
    id: 'intellect.specialBoost',
    name: 'Special Boost',
    attribute: 'intellect',
    category: 'action',
    description:
      'Increase one eligible Special on your Spells this turn by +2 / +4 / +8 / +12. ' +
      'Eligible Special Effects: Slow, Ruin, Lacerate, Mark, Blight, Regeneration, Challenge, Weaken, Soulburn.',
    tiers: [
      { label: '+2 Special (eligible)', description: 'Increase one eligible Special on your Spells this turn by +2.', value: 2 },
      { label: '+4 Special (eligible)', description: 'Increase one eligible Special on your Spells this turn by +4.', value: 4 },
      { label: '+8 Special (eligible)', description: 'Increase one eligible Special on your Spells this turn by +8.', value: 8 },
      { label: '+12 Special (eligible)', description: 'Increase one eligible Special on your Spells this turn by +12.', value: 12 },
    ],
    apply: async ({ actor, tier }) => {
      const combat = (game as any).combat;
      const bonus = scaleStoneTier([2, 4, 8, 12], tier);
      const roundState = getRoundState(actor, combat);
      const sb = ensureStoneBonuses(roundState);
      sb.spellSpecialBoost = (sb.spellSpecialBoost ?? 0) + bonus;
      await setRoundState(actor, roundState);
    },
  },
];

// ---------------------------------------------------------------------------
// Resolve
// ---------------------------------------------------------------------------

const RESOLVE_POWERS_RAW: StonePowerDraft[] = [
  {
    id: 'resolve.healing',
    name: 'Healing',
    attribute: 'resolve',
    category: 'action',
    description:
      'You or one ally within range heals HP in their current Health Bar. ' +
      'T1: 4d8@2 m, T2: 8d8@4 m, T3: 12d8@8 m, T4: 16d8@16 m.',
    tiers: [
      { label: 'Heal 4d8 (2 m)', description: 'You or one ally within 2 m heals 4d8 HP in their current Health Bar.', value: 4 },
      { label: 'Heal 8d8 (4 m)', description: 'You or one ally within 4 m heals 8d8 HP in their current Health Bar.', value: 8 },
      { label: 'Heal 12d8 (8 m)', description: 'You or one ally within 8 m heals 12d8 HP in their current Health Bar.', value: 12 },
      { label: 'Heal 16d8 (16 m)', description: 'You or one ally within 16 m heals 16d8 HP in their current Health Bar.', value: 16 },
    ],
    apply: async ({ actor, tier }) => {
      const dice = scaleStoneTier([4, 8, 12, 16], tier);
      const meters = scaleStoneTier([2, 4, 8, 16], tier);
      try {
        const roll = await new (Roll as any)(`${dice}d8`).evaluate({ async: true });
        const total = Number(roll?.total) || 0;
        if (typeof (actor as any)?.heal === 'function') {
          await (actor as any).heal(total);
        }
        ui.notifications?.info(
          `${(actor as any).name}: Healing rolled ${total} HP (${dice}d8). Apply to self or one ally within ${meters} m.`,
        );
      } catch {
        ui.notifications?.warn('Healing: roll failed.');
      }
    },
  },
  {
    id: 'resolve.stressHealing',
    name: 'Stress Healing',
    attribute: 'resolve',
    category: 'action',
    description:
      'Remove Stress from yourself or one ally within range. ' +
      'T1: 1d8@2 m, T2: 2d8@4 m, T3: 3d8@8 m, T4: 4d8@16 m.',
    tiers: [
      { label: '−1d8 Stress (2 m)', description: 'Remove 1d8 Stress from yourself or one ally within 2 m.', value: 1 },
      { label: '−2d8 Stress (4 m)', description: 'Remove 2d8 Stress from yourself or one ally within 4 m.', value: 2 },
      { label: '−3d8 Stress (8 m)', description: 'Remove 3d8 Stress from yourself or one ally within 8 m.', value: 3 },
      { label: '−4d8 Stress (16 m)', description: 'Remove 4d8 Stress from yourself or one ally within 16 m.', value: 4 },
    ],
    apply: async ({ actor, tier }) => {
      const dice = scaleStoneTier([1, 2, 3, 4], tier);
      const meters = scaleStoneTier([2, 4, 8, 16], tier);
      try {
        const roll = await new (Roll as any)(`${dice}d8`).evaluate({ async: true });
        const total = Number(roll?.total) || 0;
        const stress = (actor as any)?.system?.stress;
        if (Array.isArray(stress?.bars) && stress.bars.length) {
          const healed = healStressFromBars(stress.bars, stress.currentBar ?? 0, total);
          await (actor as any).update?.({
            'system.stress.bars': healed.bars,
            'system.stress.currentBar': healed.currentBar,
          });
        }
        await (actor as any).setFlag?.('mastery-system', 'pendingStressHealing', {
          amount: total,
          dice,
          range: meters,
        });
        ui.notifications?.info(
          `${(actor as any).name}: Stress Healing rolled ${total} (${dice}d8). Apply to self or one ally within ${meters} m.`,
        );
      } catch {
        ui.notifications?.warn('Stress Healing: roll failed.');
      }
    },
  },
  {
    id: 'resolve.damageReduction',
    name: 'Damage Reduction',
    attribute: 'resolve',
    category: 'passive',
    description: 'Gain Damage Reduction until the start of your next turn (T2:+10%, T3:+20%, T4:+30%). Creates it if you do not have it.',
    startsAtTier: 2,
    tiers: [
      { label: '+10% DR', description: 'Gain +10% Damage Reduction until the start of your next turn.', value: 10 },
      { label: '+20% DR', description: 'Gain +20% Damage Reduction until the start of your next turn.', value: 20 },
      { label: '+30% DR', description: 'Gain +30% Damage Reduction until the start of your next turn.', value: 30 },
    ],
    apply: async ({ actor, tier }) => {
      if (tier < 2) return;
      const combat = (game as any).combat;
      // Re-activation ADDs (PG "Temporary Defensive Stone Values").
      const pct = scaleStoneTier([10, 20, 30], tier - 1);
      if (pct <= 0) return;
      const roundState = getRoundState(actor, combat);
      const sb = ensureStoneBonuses(roundState);
      sb.damageReductionBoostPct = (sb.damageReductionBoostPct ?? 0) + pct;
      await setRoundState(actor, roundState);
    },
  },
  {
    id: 'resolve.ward',
    name: 'Ward',
    attribute: 'resolve',
    category: 'passive',
    description: 'Gain Ward until the start of your next turn (+2 / +4 / +8 / +12). Creates Ward if you do not have it. Applies only to eligible incoming hostile Special(X).',
    tiers: [
      { label: '+2 Ward', description: 'Gain +2 Ward until the start of your next turn.', value: 2 },
      { label: '+4 Ward', description: 'Gain +4 Ward until the start of your next turn.', value: 4 },
      { label: '+8 Ward', description: 'Gain +8 Ward until the start of your next turn.', value: 8 },
      { label: '+12 Ward', description: 'Gain +12 Ward until the start of your next turn.', value: 12 },
    ],
    apply: async ({ actor, tier }) => {
      const combat = (game as any).combat;
      const bonus = scaleStoneTier([2, 4, 8, 12], tier);
      const roundState = getRoundState(actor, combat);
      const sb = ensureStoneBonuses(roundState);
      // Re-activation ADDs (PG "Temporary Defensive Stone Values").
      sb.tempWard = (sb.tempWard ?? 0) + bonus;
      sb.incomingSpecialReduction = (sb.incomingSpecialReduction ?? 0) + bonus;
      await setRoundState(actor, roundState);
    },
  },
];

// ---------------------------------------------------------------------------
// Influence
// ---------------------------------------------------------------------------

const INFLUENCE_POWERS_RAW: StonePowerDraft[] = [
  {
    id: 'influence.aidRoll',
    name: 'Aid Roll',
    attribute: 'influence',
    category: 'action',
    description: 'One ally within range gains a flat bonus to all rolls this round except damage rolls. T1: +2@8 m, T2: +4@16 m, T3: +8@24 m, T4: +12@32 m.',
    tiers: [
      { label: 'Ally +2 (8 m)', description: 'One ally within 8 m gains +2 to all rolls this round except damage rolls.', value: 2 },
      { label: 'Ally +4 (16 m)', description: 'One ally within 16 m gains +4 to all rolls this round except damage rolls.', value: 4 },
      { label: 'Ally +8 (24 m)', description: 'One ally within 24 m gains +8 to all rolls this round except damage rolls.', value: 8 },
      { label: 'Ally +12 (32 m)', description: 'One ally within 32 m gains +12 to all rolls this round except damage rolls.', value: 12 },
    ],
    apply: async ({ actor, tier }) => {
      const bonus = scaleStoneTier([2, 4, 8, 12], tier);
      const meters = scaleStoneTier([8, 16, 24, 32], tier);
      await (actor as any).setFlag?.('mastery-system', 'pendingAidRoll', { bonus, range: meters });
      ui.notifications?.info(
        `${(actor as any).name}: Aid Roll — choose 1 ally within ${meters} m (+${bonus} to all rolls this round except damage).`,
      );
    },
  },
  {
    id: 'influence.regeneration',
    name: 'Regeneration',
    attribute: 'influence',
    category: 'action',
    description: 'One ally within range gains Regeneration(X). T1: 2@8 m, T2: 4@16 m, T3: 6@24 m, T4: 8@32 m.',
    tiers: [
      { label: 'Ally Regen(2) (8 m)', description: 'One ally within 8 m gains Regeneration(2).', value: 2 },
      { label: 'Ally Regen(4) (16 m)', description: 'One ally within 16 m gains Regeneration(4).', value: 4 },
      { label: 'Ally Regen(6) (24 m)', description: 'One ally within 24 m gains Regeneration(6).', value: 6 },
      { label: 'Ally Regen(8) (32 m)', description: 'One ally within 32 m gains Regeneration(8).', value: 8 },
    ],
    apply: async ({ actor, tier }) => {
      const value = scaleStoneTier([2, 4, 6, 8], tier);
      const meters = scaleStoneTier([8, 16, 24, 32], tier);
      await (actor as any).setFlag?.('mastery-system', 'pendingAllyRegeneration', { value, range: meters });
      ui.notifications?.info(
        `${(actor as any).name}: Regeneration — apply Regeneration(${value}) to one ally within ${meters} m.`,
      );
    },
  },
  {
    id: 'influence.passiveSwap',
    name: 'Passive Swap',
    attribute: 'influence',
    category: 'action',
    description: 'Help allies swap an active Passive. T1: 1 ally next turn, T2: 1 ally immediate, T3: 2 allies next turn, T4: 2 allies immediate.',
    tiers: [
      { label: '1 ally swap (next turn) — 8 m', description: 'One ally within 8 m may swap 1 active Passive with another Passive they know on their next turn.', value: 1 },
      { label: '1 ally swap (immediate) — 16 m', description: 'One ally within 16 m may swap 1 active Passive immediately.', value: 1 },
      { label: '2 ally swaps (next turn) — 24 m', description: 'Two allies within 24 m may each swap 1 active Passive on their next turn.', value: 2 },
      { label: '2 ally swaps (immediate) — 32 m', description: 'Two allies within 32 m may each swap 1 active Passive immediately.', value: 2 },
    ],
    apply: async ({ actor, tier }) => {
      const allyCount = Math.ceil(tier / 2);
      const meters = scaleStoneTier([8, 16, 24, 32], tier);
      const immediate = tier % 2 === 0;
      await (actor as any).setFlag?.('mastery-system', 'pendingAllyPassiveSwap', {
        allies: allyCount,
        range: meters,
        immediate,
      });
      ui.notifications?.info(
        `${(actor as any).name}: Passive Swap — ${allyCount} ally(ies) within ${meters} m may swap 1 active Passive ${immediate ? 'immediately' : 'on their next turn'}.`,
      );
    },
  },
  {
    id: 'influence.notATarget',
    name: 'Not a Target',
    attribute: 'influence',
    category: 'reaction',
    description: 'Enemies cannot target you with their next attack before the start of your next turn unless you are the only valid target. T2: 1@8 m, T3: 2@16 m, T4: 3@24 m.',
    startsAtTier: 2,
    tiers: [
      { label: '1 enemy @ 8 m', description: 'One enemy within 8 m cannot target you with its next attack before the start of your next turn unless you are the only valid target.', value: 1 },
      { label: '2 enemies @ 16 m', description: 'Up to 2 enemies within 16 m cannot target you with their next attack before the start of your next turn unless you are the only valid target.', value: 2 },
      { label: '3 enemies @ 24 m', description: 'Up to 3 enemies within 24 m cannot target you with their next attack before the start of your next turn unless you are the only valid target.', value: 3 },
    ],
    apply: async ({ actor, tier }) => {
      if (tier < 2) return;
      const enemies = scaleStoneTier([1, 2, 3], tier - 1);
      const meters = scaleStoneTier([8, 16, 24], tier - 1);
      if (enemies <= 0) return;
      await (actor as any).setFlag?.('mastery-system', 'pendingNotATarget', { enemies, range: meters });
      ui.notifications?.info(
        `${(actor as any).name}: Not a Target — up to ${enemies} enemy(ies) within ${meters} m cannot target you next attack this round.`,
      );
    },
  },
];

// ---------------------------------------------------------------------------
// Wits
// ---------------------------------------------------------------------------

const WITS_POWERS_RAW: StonePowerDraft[] = [
  {
    id: 'wits.initiativeBoost',
    name: 'Initiative Boost',
    attribute: 'wits',
    category: 'reaction',
    oncePerCombat: true,
    description:
      'During Initiative Exchange, once per combat, gain Initiative equal to 1 / 2 / 4 / 8 × your Mastery Rank. Add it before converting Initiative into Temporary Colorless Stones.',
    tiers: [
      { label: '+1 × MR Initiative', description: 'Gain Initiative equal to your Mastery Rank.', value: 1 },
      { label: '+2 × MR Initiative', description: 'Gain Initiative equal to 2 × your Mastery Rank.', value: 2 },
      { label: '+4 × MR Initiative', description: 'Gain Initiative equal to 4 × your Mastery Rank.', value: 4 },
      { label: '+8 × MR Initiative', description: 'Gain Initiative equal to 8 × your Mastery Rank.', value: 8 },
    ],
    apply: async ({ actor, combatant, tier }) => {
      const combat = (game as any).combat;
      const c = combatant ?? combat?.combatants?.find((x: any) => x.actor?.id === (actor as any).id);
      if (c && isInitiativeBoostUsedThisCombat(c)) {
        ui.notifications?.warn(`${(actor as any).name}: Initiative Boost already used this combat.`);
        return;
      }
      const mr = Math.max(2, Math.floor(Number((actor as any)?.system?.mastery?.rank ?? 2) || 2));
      const bonus = initiativeBoostAmount(tier, mr);
      const roundState = getRoundState(actor, combat);
      const sb = ensureStoneBonuses(roundState);
      sb.initiativeBonus = (sb.initiativeBonus ?? 0) + bonus;
      await setRoundState(actor, roundState);

      if (c && c.initiative !== null && c.initiative !== undefined) {
        const cur = Number(c.initiative) || 0;
        await c.update({ initiative: cur + bonus });
        await c.setFlag('mastery-system', 'msInitiativeValue', cur + bonus);
      }
      if (c) await markInitiativeBoostUsedThisCombat(c);
      ui.notifications?.info(
        `${(actor as any).name}: Initiative Boost +${bonus} (MR ${mr} × ${2 ** (tier - 1)}).`,
      );
    },
  },
  {
    id: 'wits.phasing',
    name: 'Phasing',
    attribute: 'wits',
    category: 'reaction',
    description: 'Gain Phasing Charges until the start of your next turn (T2: 1, T3: 1, T4: 2).',
    startsAtTier: 2,
    tiers: [
      { label: '1 Phasing Charge', description: 'Gain 1 Phasing Charge until the start of your next turn.', value: 1 },
      { label: '1 Phasing Charge', description: 'Gain 1 Phasing Charge until the start of your next turn.', value: 1 },
      { label: '2 Phasing Charges', description: 'Gain 2 Phasing Charges until the start of your next turn.', value: 2 },
    ],
    apply: async ({ actor, tier }) => {
      if (tier < 2) return;
      const combat = (game as any).combat;
      const charges = Math.ceil((tier - 1) / 2);
      if (charges <= 0) return;
      const roundState = getRoundState(actor, combat);
      const sb = ensureStoneBonuses(roundState);
      sb.phasingChargesFromStones = (sb.phasingChargesFromStones ?? 0) + charges;
      await setRoundState(actor, roundState);
      const prior = Number((actor as any).getFlag?.('mastery-system', 'phasingChargesPending') ?? 0) || 0;
      await (actor as any).setFlag?.('mastery-system', 'phasingChargesPending', prior + charges);
    },
  },
  {
    id: 'wits.readIntent',
    name: 'Read Intent',
    attribute: 'wits',
    category: 'action',
    description:
      'Choose creatures you can see; the GM reveals their planned actions / damage / movement / defense / support. ' +
      'T1: 1 creature (actions); T2: 1 (+ damage); T3: 2 (+ damage); T4: 3 (actions + damage + movement + defense + support).',
    tiers: [
      { label: '1 creature: actions', description: 'Choose 1 creature you can see. The GM must reveal its planned actions for this round: attacks, movement, defensive options, and support actions.', value: 1 },
      { label: '1 creature: actions + damage', description: 'Choose 1 creature you can see. The GM must also reveal the expected damage of its planned attacks.', value: 1 },
      { label: '2 creatures: actions + damage', description: 'Choose 2 creatures you can see. The GM must reveal their planned actions and expected damage.', value: 2 },
      { label: '3 creatures: full intent', description: 'Choose 3 creatures you can see. The GM must reveal their planned actions, expected damage, movement, defensive options, and support actions.', value: 3 },
    ],
    apply: async ({ actor, tier }) => {
      const targets = scaleStoneTier([1, 1, 2, 3], tier);
      const detail =
        tier >= 4
          ? 'actions + expected damage + movement + defensive options + support'
          : tier >= 2
            ? 'actions + expected damage'
            : 'actions';
      await (actor as any).setFlag?.('mastery-system', 'pendingReadIntent', { targets, detail });
      ui.notifications?.info(
        `${(actor as any).name}: Read Intent — GM, reveal ${targets} creature(s)' ${detail}.`,
      );
    },
  },
  {
    id: 'wits.reactionRange',
    name: 'Reaction Range',
    attribute: 'wits',
    category: 'reaction',
    description: 'Increase the range of your Reactions this round (+2 / +4 / +8 / +16 m).',
    tiers: [
      { label: '+2 m Reaction Range', description: 'Increase the range of your Reactions by +2 m this round.', value: 2 },
      { label: '+4 m Reaction Range', description: 'Increase the range of your Reactions by +4 m this round.', value: 4 },
      { label: '+8 m Reaction Range', description: 'Increase the range of your Reactions by +8 m this round.', value: 8 },
      { label: '+16 m Reaction Range', description: 'Increase the range of your Reactions by +16 m this round.', value: 16 },
    ],
    apply: async ({ actor, tier }) => {
      const combat = (game as any).combat;
      const meters = scaleStoneTier([2, 4, 8, 16], tier);
      const roundState = getRoundState(actor, combat);
      const sb = ensureStoneBonuses(roundState);
      sb.reactionRangeBonus = (sb.reactionRangeBonus ?? 0) + meters;
      await setRoundState(actor, roundState);
    },
  },
];

// ---------------------------------------------------------------------------
// Registry + finalization (auto-compile `.effect`)
// ---------------------------------------------------------------------------

function finalize(list: StonePowerDraft[]): StonePower[] {
  return list.map((p) => {
    const startsAtTier: 1 | 2 = p.startsAtTier === 2 ? 2 : 1;
    return {
      ...p,
      startsAtTier,
      effect: compileEffectText(p.name, p.tiers, startsAtTier),
    };
  });
}

function leadTier2Start(list: StonePower[]): StonePower[] {
  const lead = list.filter((p) => p.startsAtTier === 2);
  const rest = list.filter((p) => p.startsAtTier !== 2);
  return [...lead, ...rest];
}

const GENERIC_POWERS = finalize(GENERIC_POWERS_RAW);
const MIGHT_POWERS = finalize(MIGHT_POWERS_RAW);
const AGILITY_POWERS = finalize(AGILITY_POWERS_RAW);
const VITALITY_POWERS = finalize(VITALITY_POWERS_RAW);
const INTELLECT_POWERS = finalize(INTELLECT_POWERS_RAW);
const RESOLVE_POWERS = finalize(RESOLVE_POWERS_RAW);
const INFLUENCE_POWERS = finalize(INFLUENCE_POWERS_RAW);
const WITS_POWERS = finalize(WITS_POWERS_RAW);

export const STONE_POWERS: Record<string, StonePower> = {};

[
  ...GENERIC_POWERS,
  ...MIGHT_POWERS,
  ...AGILITY_POWERS,
  ...VITALITY_POWERS,
  ...INTELLECT_POWERS,
  ...RESOLVE_POWERS,
  ...INFLUENCE_POWERS,
  ...WITS_POWERS,
].forEach((power) => {
  STONE_POWERS[power.id] = power;
});

export const STONE_POWERS_BY_ATTRIBUTE: Record<AttributeKey | 'generic', StonePower[]> = {
  generic: leadTier2Start(GENERIC_POWERS),
  might: leadTier2Start(MIGHT_POWERS),
  agility: leadTier2Start(AGILITY_POWERS),
  vitality: leadTier2Start(VITALITY_POWERS),
  intellect: leadTier2Start(INTELLECT_POWERS),
  resolve: leadTier2Start(RESOLVE_POWERS),
  influence: leadTier2Start(INFLUENCE_POWERS),
  wits: leadTier2Start(WITS_POWERS),
};

/**
 * Convert a usage count (0-indexed; activations this turn BEFORE this one)
 * to the matching tier. Published UI is T1–T4; the math continues to T8.
 */
export function tierForUseIndex(usesBefore: number): number {
  return Math.max(1, Math.min(STONE_TIER_HARD_MAX, Math.floor(usesBefore) + 1));
}

/**
 * Abilities whose first published tier is T2. Tier 1 does not exist.
 * Extra Attack (generic) uses the same start.
 */
export const TIER2_START_STONE_POWER_IDS = [
  'might.parry',
  'agility.crit',
  'vitality.damageNegation',
  'intellect.spellAction',
  'resolve.damageReduction',
  'influence.notATarget',
  'wits.phasing',
  'generic.extraAttack',
] as const;

export function stonePowerStartsAtTier(powerId: string): 1 | 2 {
  const power = STONE_POWERS[resolveStonePowerId(powerId)];
  if (power?.startsAtTier === 2) return 2;
  if ((TIER2_START_STONE_POWER_IDS as readonly string[]).includes(resolveStonePowerId(powerId))) {
    return 2;
  }
  return 1;
}

/** True when the ability begins at Tier 2 (no Tier-1 slot). */
export function stonePowerSkipsFirstTier(powerId: string): boolean {
  return stonePowerStartsAtTier(powerId) === 2;
}

/** First published tier (2 when Tier 1 does not exist, otherwise 1). */
export function firstEffectiveStonePowerTier(powerId: string): number {
  return stonePowerStartsAtTier(powerId);
}

/**
 * Printed Support that would land on (or below) the first published tier is
 * lifted one step so the player still pays that tier and the gold prefills
 * sit above it. Crit + Elorian Focus I (printed T2) → T3.
 */
export function effectiveStoneSupportPrefillTier(powerId: string, printedTier: number): number {
  const printed = Math.max(0, Math.floor(Number(printedTier) || 0));
  if (printed <= 0) return 0;
  const first = firstEffectiveStonePowerTier(powerId);
  if (printed <= first) return Math.min(STONE_TIER_HARD_MAX, first + 1);
  return Math.min(STONE_TIER_HARD_MAX, printed);
}

/** Lane indices for one published tier (T1=anchor, T2=mid, T3=quad, T4=oct). */
export function stonePaymentLanesForTier(tier: number): number[] {
  const seg = Math.floor(Number(tier) || 0) - 1;
  if (seg === 0) return [0];
  if (seg === 1) return [1, 2];
  if (seg === 2) return [3, 4, 5, 6];
  if (seg === 3) return [7, 8, 9, 10, 11, 12, 13, 14];
  return [];
}

/**
 * Gold Artifact Support Stone lanes: every published tier above the one the
 * player must pay, up through the effective prefill. Empty when Support
 * cannot raise the first published tier.
 */
export function stoneSupportPrefillLanes(powerId: string, printedTier: number): number[] {
  const first = firstEffectiveStonePowerTier(powerId);
  const effective = effectiveStoneSupportPrefillTier(powerId, printedTier);
  if (effective <= first) return [];
  const lanes: number[] = [];
  for (let tier = first + 1; tier <= effective; tier += 1) {
    lanes.push(...stonePaymentLanesForTier(tier));
  }
  return lanes;
}

/**
 * Support may raise the first paid activation to a higher tier. It never
 * grants the first published tier for free (T1, or T2 when T1 does not exist).
 */
export function stonePowerSupportPrefillApplies(powerId: string, printedTier: number): boolean {
  return effectiveStoneSupportPrefillTier(powerId, printedTier) > firstEffectiveStonePowerTier(powerId);
}

/** Retired ids that still resolve to a current Stone Power. */
export const STONE_POWER_ID_ALIASES: Record<string, string> = {
  'resolve.damageReductionBoost': 'resolve.damageReduction',
  'resolve.specialReduction': 'resolve.ward',
};

/**
 * Per-power adjustment applied to Artifact Stone Power Support pre-fill tiers.
 * The current rulebook prints Support stages as Tier 2 / 3 / 4 for every power
 * (Elorian Focus PG 4819–4825, Ringchain "Kept from Sight" PG 4253–4261), so
 * no power is shifted. Kept as a map in case a future table diverges.
 */
export const STONE_POWER_SUPPORT_TIER_SHIFT: Record<string, number> = {};

export function resolveStonePowerId(powerId: string): string {
  const id = String(powerId || '').trim();
  return STONE_POWER_ID_ALIASES[id] || id;
}

/** Retired Stone Power ids that have no successor (cannot auto-remap). */
export const UNRESOLVED_STONE_POWER_IDS = [
  'might.attackPoolReduction',
  'vitality.endureSpecial',
  'wits.initiativeShop',
] as const;
