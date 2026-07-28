/**
 * Canonical Stone Powers Definition — new tier-based spec.
 *
 * Each Stone Power has FOUR fixed tiers. The tier a player gets on a
 * given activation is determined by how many times this power has
 * been used this turn (NOT cumulative across activations):
 *
 *   1st use → 1 stone → Tier 1
 *   2nd use → 2 stones → Tier 2
 *   3rd use → 4 stones → Tier 3
 *   4th use → 8 stones → Tier 4
 *
 * Some tiers are intentionally blank (`label === null`). Spending the
 * stones is still required, but no effect triggers — this is the "ramp"
 * mechanic that prevents trivial low-tier spam of the strongest effects.
 *
 * Pool layout: Generic + 7 attribute pools (Might / Agility / Vitality /
 * Intellect / Resolve / Influence / Wits). Every pool has exactly 4
 * powers ⇒ 32 powers total.
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
import { getEffectById } from '../utils/special-effects.js';
import { statusEntryId } from '../system/active-specials.js';

export type StonePowerAttribute = AttributeKey | 'generic';

export interface StoneTier {
  /** Short rules label. `null` ⇒ tier has no effect (still paid for as a ramp step). */
  label: string | null;
  /** Long-form description used in the dialog tooltip / chat audit. */
  description: string;
  /** Optional numeric scale (used by apply()). Meaning varies per power. */
  value?: number;
}

export interface StonePowerContext {
  actor: any;
  combatant: any;
  /** 1..4 — clamped tier number for this activation. */
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
  /** Tier 1..4 effects. */
  tiers: [StoneTier, StoneTier, StoneTier, StoneTier];
  /** Apply the effect for the given tier. */
  apply: (ctx: StonePowerContext) => Promise<void>;
}

/**
 * Compile the multi-tier tooltip string from the tier table. Tiers with
 * `label === null` are rendered as "—" to make blank ramp steps visible.
 */
function compileEffectText(name: string, tiers: readonly StoneTier[]): string {
  const lines = tiers.map((t, i) => {
    const tierNum = i + 1;
    const cost = Math.pow(2, i); // 1 / 2 / 4 / 8
    const body = t.label === null ? '—' : t.description || t.label;
    return `T${tierNum} (${cost}): ${body}`;
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

const GENERIC_POWERS_RAW: Array<Omit<StonePower, 'effect'>> = [
  {
    id: 'generic.extraAttack',
    name: 'Extra Attack',
    attribute: 'generic',
    category: 'action',
    description: 'Gain additional Attack Actions this round (T2: +1, T3: +2, T4: +3).',
    tiers: [
      { label: null, description: 'No effect — ramp step.' },
      { label: '+1 Attack Action', description: 'Gain 1 additional Attack Action this round.', value: 1 },
      { label: '+2 Attack Actions', description: 'Gain 2 additional Attack Actions this round.', value: 2 },
      { label: '+3 Attack Actions', description: 'Gain 3 additional Attack Actions this round.', value: 3 },
    ],
    apply: async ({ actor, tier }) => {
      const combat = (game as any).combat;
      const bonus = [0, 1, 2, 3][tier - 1] ?? 0;
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
    description: 'Swap active Passives with other Passives you know (T1..T4: 1/1/2/2 swaps).',
    tiers: [
      { label: 'Swap 1', description: 'Swap 1 active Passive with another Passive you know.', value: 1 },
      { label: 'Swap 1', description: 'Swap 1 active Passive with another Passive you know.', value: 1 },
      { label: 'Swap 2', description: 'Swap 2 active Passives with other Passives you know.', value: 2 },
      { label: 'Swap 2', description: 'Swap 2 active Passives with other Passives you know.', value: 2 },
    ],
    apply: async ({ actor, tier }) => {
      const swaps = tier >= 3 ? 2 : 1;
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

const MIGHT_POWERS_RAW: Array<Omit<StonePower, 'effect'>> = [
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
      const dice = [2, 4, 8, 16][tier - 1] ?? 0;
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
      // Tiers are cumulative TOTALS (+4/+8/+16/+32). SET, don't stack, so
      // ramping +4→+8 yields +8 (not +12).
      const bonus = [4, 8, 16, 32][tier - 1] ?? 0;
      const roundState = getRoundState(actor, combat);
      const sb = ensureStoneBonuses(roundState);
      sb.tempArmor = bonus;
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
      const bonus = [4, 8, 16, 32][tier - 1] ?? 0;
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
    id: 'might.attackPoolReduction',
    name: 'Attack Pool Reduction',
    attribute: 'might',
    category: 'action',
    description: 'One enemy within 6 m loses 10%/20%/30%/40% of its Attack Pool on its next Attack roll this round.',
    tiers: [
      { label: '−10% Attack Pool', description: 'One enemy within 6 m loses 10% of its Attack Pool on its next Attack roll this round.', value: 10 },
      { label: '−20% Attack Pool', description: 'One enemy within 6 m loses 20% of its Attack Pool on its next Attack roll this round.', value: 20 },
      { label: '−30% Attack Pool', description: 'One enemy within 6 m loses 30% of its Attack Pool on its next Attack roll this round.', value: 30 },
      { label: '−40% Attack Pool', description: 'One enemy within 6 m loses 40% of its Attack Pool on its next Attack roll this round.', value: 40 },
    ],
    apply: async ({ actor, combatant, tier }) => {
      const pct = [10, 20, 30, 40][tier - 1] ?? 0;
      // GM-applied: stamp a pending reduction on the combatant flag; the
      // target combatant must be selected manually for now.
      await (combatant as any)?.setFlag?.('mastery-system', 'pendingEnemyAttackPoolReductionPct', pct);
      ui.notifications?.info(
        `${(actor as any).name}: Attack Pool Reduction — target an enemy within 6 m; they lose ${pct}% of their next Attack Pool.`,
      );
    },
  },
];

// ---------------------------------------------------------------------------
// Agility
// ---------------------------------------------------------------------------

const AGILITY_POWERS_RAW: Array<Omit<StonePower, 'effect'>> = [
  {
    id: 'agility.crit',
    name: 'Crit',
    attribute: 'agility',
    category: 'action',
    description: 'A number of your attacks this round can have Crit(1). You decide which attacks BEFORE you roll each attack roll.',
    tiers: [
      { label: '1 attack: Crit(1)', description: '1 of your attacks this round can have Crit(1). Choose before each attack roll.', value: 1 },
      { label: '2 attacks: Crit(1)', description: '2 of your attacks this round can have Crit(1). Choose before each attack roll.', value: 2 },
      { label: '3 attacks: Crit(1)', description: '3 of your attacks this round can have Crit(1). Choose before each attack roll.', value: 3 },
      { label: '4 attacks: Crit(1)', description: '4 of your attacks this round can have Crit(1). Choose before each attack roll.', value: 4 },
    ],
    apply: async ({ actor, tier }) => {
      const combat = (game as any).combat;
      const charges = [1, 2, 3, 4][tier - 1] ?? 0;
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
      const bonus = [8, 16, 24, 32][tier - 1] ?? 0;
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
      { label: 'Move 4 m, no OA', description: 'Move up to 4 m. This movement does not provoke opportunity attacks.', value: 4 },
      { label: 'Move 8 m, no OA', description: 'Move up to 8 m. This movement does not provoke opportunity attacks.', value: 8 },
      { label: 'Move 12 m, no OA', description: 'Move up to 12 m. This movement does not provoke opportunity attacks.', value: 12 },
      { label: 'Move 16 m, no OA', description: 'Move up to 16 m. This movement does not provoke opportunity attacks.', value: 16 },
    ],
    apply: async ({ actor, tier }) => {
      const combat = (game as any).combat;
      const meters = [4, 8, 12, 16][tier - 1] ?? 0;
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
      const meters = [2, 4, 6, 8][tier - 1] ?? 0;
      await (actor as any).setFlag?.('mastery-system', 'pendingSlipMeters', meters);
    },
  },
];

// ---------------------------------------------------------------------------
// Vitality
// ---------------------------------------------------------------------------

const VITALITY_POWERS_RAW: Array<Omit<StonePower, 'effect'>> = [
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
      const hp = [20, 40, 80, 160][tier - 1] ?? 0;
      // Canonical field is `tempHP` (capital P) — the damage pipeline and all
      // health math read/consume that.
      const roundState = getRoundState(actor, combat);
      const sb = ensureStoneBonuses(roundState);
      const prevGranted = Math.max(0, Number(sb.tempHpGrantedThisTurn ?? 0) || 0);
      const current = Math.max(0, Number((actor as any).system?.health?.tempHP ?? 0) || 0);
      // SET the stone-granted portion to the new tier total instead of stacking
      // it: ramping 20→40 yields 40 (not 60), and re-activating never balloons.
      // Any non-stone Temp HP (e.g. Lean Ward) is preserved.
      const baseTempHp = Math.max(0, current - prevGranted);
      await (actor as any).update?.({ 'system.health.tempHP': baseTempHp + hp });
      sb.tempHpGrantedThisTurn = hp;
      await setRoundState(actor, roundState);
      ui.notifications?.info(`${(actor as any).name}: ${hp} Temp HP until the start of your next turn.`);
    },
  },
  {
    id: 'vitality.endureSpecial',
    name: 'Endure Special',
    attribute: 'vitality',
    category: 'action',
    description: 'Reduce one negative Special currently affecting you (−2 / −4 / −8 / −12).',
    tiers: [
      { label: 'Reduce Special by 2', description: 'Reduce one negative Special currently affecting you by 2.', value: 2 },
      { label: 'Reduce Special by 4', description: 'Reduce one negative Special currently affecting you by 4.', value: 4 },
      { label: 'Reduce Special by 8', description: 'Reduce one negative Special currently affecting you by 8.', value: 8 },
      { label: 'Reduce Special by 12', description: 'Reduce one negative Special currently affecting you by 12.', value: 12 },
    ],
    apply: async ({ actor, tier }) => {
      const reduceBy = [2, 4, 8, 12][tier - 1] ?? 0;
      const system: any = (actor as any).system ?? {};
      const list: Array<{ id?: string; name?: string; value?: number | null }> = Array.isArray(system.statusEffects)
        ? system.statusEffects
        : [];
      // Only negative diminishing Specials qualify — Regeneration is the lone
      // positive one and must never be reduced by the wielder's own power.
      const candidates = list
        .map((entry, index) => {
          const id = statusEntryId(entry);
          const effect = id ? getEffectById(id) : undefined;
          const value = Math.max(0, Math.floor(Number(entry?.value ?? 0)));
          return { index, id, effect, value };
        })
        .filter((c) => c.effect?.category === 'diminishing' && c.id !== 'regeneration' && c.value > 0);
      if (candidates.length === 0) {
        ui.notifications?.warn(`${(actor as any).name}: Endure Special — no negative Special to reduce.`);
        return;
      }

      const applyReduction = async (choice: (typeof candidates)[number]) => {
        const nextValue = Math.max(0, choice.value - reduceBy);
        const next = list
          .map((entry, index) => (index === choice.index ? { ...entry, value: nextValue } : entry))
          .filter((entry, index) => !(index === choice.index && nextValue <= 0));
        await (actor as any).update?.({ 'system.statusEffects': next });
        const label = choice.effect?.name?.replace(/\(X\)/i, '').trim() || choice.id;
        ui.notifications?.info(
          nextValue > 0
            ? `${(actor as any).name}: Endure Special — ${label} ${choice.value} → ${nextValue}.`
            : `${(actor as any).name}: Endure Special — ${label} removed.`,
        );
      };

      const DialogCls = (globalThis as any).Dialog;
      if (candidates.length === 1 || typeof DialogCls !== 'function') {
        // No choice needed (or headless environment): reduce the strongest one.
        const strongest = [...candidates].sort((a, b) => b.value - a.value)[0];
        await applyReduction(strongest);
        return;
      }

      const options = candidates
        .map((c, i) => {
          const label = c.effect?.name?.replace(/\(X\)/i, '').trim() || c.id;
          return `<option value="${i}">${label} (${c.value})</option>`;
        })
        .join('');
      await new Promise<void>((resolve) => {
        new DialogCls({
          title: 'Endure Special',
          content: `<p>Reduce one negative Special by <strong>${reduceBy}</strong>:</p><select name="endure-special" style="width:100%">${options}</select>`,
          buttons: {
            ok: {
              label: 'Reduce',
              callback: async (html: any) => {
                const raw = html?.find?.('select[name="endure-special"]')?.val?.();
                const idx = Math.max(0, Math.min(candidates.length - 1, Number(raw ?? 0) || 0));
                await applyReduction(candidates[idx]);
                resolve();
              },
            },
            cancel: { label: 'Cancel', callback: () => resolve() },
          },
          default: 'ok',
          close: () => resolve(),
        }).render(true);
      });
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
      const scar = Math.max(0, Number(system?.health?.scarred ?? 0) || 0);
      if (scar <= 0) {
        ui.notifications?.warn(`${(actor as any).name} has no Scars to remove.`);
        return;
      }
      await (actor as any).update?.({ 'system.health.scarred': scar - 1 });
      ui.notifications?.info(`${(actor as any).name} removed a Scar (${scar} → ${scar - 1}).`);
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
      const rounds = [1, 2, 3, 4][tier - 1] ?? 0;
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

const INTELLECT_POWERS_RAW: Array<Omit<StonePower, 'effect'>> = [
  {
    id: 'intellect.spellRaises',
    name: 'Spell Raises',
    attribute: 'intellect',
    category: 'action',
    description: 'All your Spells this turn gain automatic Raises (+1 / +2 / +3 / +4).',
    tiers: [
      { label: '+1 Auto Raise', description: 'All your Spells this turn gain +1 automatic Raise.', value: 1 },
      { label: '+2 Auto Raises', description: 'All your Spells this turn gain +2 automatic Raises.', value: 2 },
      { label: '+3 Auto Raises', description: 'All your Spells this turn gain +3 automatic Raises.', value: 3 },
      { label: '+4 Auto Raises', description: 'All your Spells this turn gain +4 automatic Raises.', value: 4 },
    ],
    apply: async ({ actor, tier }) => {
      const combat = (game as any).combat;
      const bonus = [4, 8, 12, 16][tier - 1] ?? 0;
      const roundState = getRoundState(actor, combat);
      const sb = ensureStoneBonuses(roundState);
      sb.spellRaiseTnBonus = (sb.spellRaiseTnBonus ?? 0) + bonus;
      await setRoundState(actor, roundState);
    },
  },
  {
    id: 'intellect.spellDefense',
    name: 'Spell Defense',
    attribute: 'intellect',
    category: 'passive',
    description: 'Gain a bonus to Saves against Spells until the start of your next turn (+4 / +8 / +12 / +16).',
    tiers: [
      { label: '+4 Saves vs Spells', description: 'Gain +4 to Saves against Spells until the start of your next turn.', value: 4 },
      { label: '+8 Saves vs Spells', description: 'Gain +8 to Saves against Spells until the start of your next turn.', value: 8 },
      { label: '+12 Saves vs Spells', description: 'Gain +12 to Saves against Spells until the start of your next turn.', value: 12 },
      { label: '+16 Saves vs Spells', description: 'Gain +16 to Saves against Spells until the start of your next turn.', value: 16 },
    ],
    apply: async ({ actor, tier }) => {
      const combat = (game as any).combat;
      const bonus = [4, 8, 12, 16][tier - 1] ?? 0;
      const roundState = getRoundState(actor, combat);
      const sb = ensureStoneBonuses(roundState);
      sb.spellSaveBonus = (sb.spellSaveBonus ?? 0) + bonus;
      await setRoundState(actor, roundState);
    },
  },
  {
    id: 'intellect.spellAction',
    name: 'Spell Action',
    attribute: 'intellect',
    category: 'action',
    description: 'Gain additional Attack Actions this round that may only cast Spells (T2: +1, T3: +2, T4: +3).',
    tiers: [
      { label: null, description: 'No effect — ramp step.' },
      { label: '+1 Spell Action', description: 'Gain 1 additional Attack Action this round. It may only be used to cast a Spell.', value: 1 },
      { label: '+2 Spell Actions', description: 'Gain 2 additional Attack Actions this round. They may only be used to cast Spells.', value: 2 },
      { label: '+3 Spell Actions', description: 'Gain 3 additional Attack Actions this round. They may only be used to cast Spells.', value: 3 },
    ],
    apply: async ({ actor, combatant, tier }) => {
      const bonus = [0, 1, 2, 3][tier - 1] ?? 0;
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
      'Increase one eligible Special on your Spells this turn by +1 / +2 / +3 / +4. ' +
      'Eligible Special Effects: Slow, Ruin, Lacerate, Mark, Blight, Regeneration, Weaken.',
    tiers: [
      { label: '+1 Special (eligible)', description: 'Increase one eligible Special on your Spells this turn by +1.', value: 1 },
      { label: '+2 Special (eligible)', description: 'Increase one eligible Special on your Spells this turn by +2.', value: 2 },
      { label: '+3 Special (eligible)', description: 'Increase one eligible Special on your Spells this turn by +3.', value: 3 },
      { label: '+4 Special (eligible)', description: 'Increase one eligible Special on your Spells this turn by +4.', value: 4 },
    ],
    apply: async ({ actor, tier }) => {
      const combat = (game as any).combat;
      const bonus = [1, 2, 3, 4][tier - 1] ?? 0;
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

const RESOLVE_POWERS_RAW: Array<Omit<StonePower, 'effect'>> = [
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
      const dice = [4, 8, 12, 16][tier - 1] ?? 0;
      const meters = [2, 4, 8, 16][tier - 1] ?? 0;
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
    id: 'resolve.damageReductionBoost',
    name: 'Damage Reduction Boost',
    attribute: 'resolve',
    category: 'passive',
    description: 'Increase your existing Damage Reduction until the start of your next turn (T2:+10%, T3:+20%, T4:+30%).',
    tiers: [
      { label: null, description: 'No effect — ramp step.' },
      { label: '+10% DR', description: 'Increase your existing Damage Reduction by +10% until the start of your next turn.', value: 10 },
      { label: '+20% DR', description: 'Increase your existing Damage Reduction by +20% until the start of your next turn.', value: 20 },
      { label: '+30% DR', description: 'Increase your existing Damage Reduction by +30% until the start of your next turn.', value: 30 },
    ],
    apply: async ({ actor, tier }) => {
      const combat = (game as any).combat;
      // Tiers are cumulative TOTALS. SET, don't stack, so ramping +10%→+20%
      // yields +20% (not +30%).
      const pct = [0, 10, 20, 30][tier - 1] ?? 0;
      if (pct <= 0) return;
      const roundState = getRoundState(actor, combat);
      const sb = ensureStoneBonuses(roundState);
      sb.damageReductionBoostPct = pct;
      await setRoundState(actor, roundState);
    },
  },
  {
    id: 'resolve.saveBoost',
    name: 'Save Boost',
    attribute: 'resolve',
    category: 'passive',
    description: 'Gain a flat bonus to all Saves this round (+2 / +4 / +8 / +12).',
    tiers: [
      { label: '+2 Saves', description: 'Gain +2 to all Saves this round.', value: 2 },
      { label: '+4 Saves', description: 'Gain +4 to all Saves this round.', value: 4 },
      { label: '+8 Saves', description: 'Gain +8 to all Saves this round.', value: 8 },
      { label: '+12 Saves', description: 'Gain +12 to all Saves this round.', value: 12 },
    ],
    apply: async ({ actor, tier }) => {
      const combat = (game as any).combat;
      const bonus = [2, 4, 8, 12][tier - 1] ?? 0;
      const roundState = getRoundState(actor, combat);
      const sb = ensureStoneBonuses(roundState);
      sb.saveAllBonus = (sb.saveAllBonus ?? 0) + bonus;
      await setRoundState(actor, roundState);
    },
  },
  {
    id: 'resolve.specialReduction',
    name: 'Special Reduction',
    attribute: 'resolve',
    category: 'passive',
    description: 'Reduce all incoming Special values against you this round (−1 / −2 / −4 / −8). Cannot reduce a Special below 0.',
    tiers: [
      { label: '−1 Specials', description: 'Reduce all incoming Special values against you this round by 1.', value: 1 },
      { label: '−2 Specials', description: 'Reduce all incoming Special values against you this round by 2.', value: 2 },
      { label: '−4 Specials', description: 'Reduce all incoming Special values against you this round by 4.', value: 4 },
      { label: '−8 Specials', description: 'Reduce all incoming Special values against you this round by 8.', value: 8 },
    ],
    apply: async ({ actor, tier }) => {
      const combat = (game as any).combat;
      const bonus = [1, 2, 4, 8][tier - 1] ?? 0;
      const roundState = getRoundState(actor, combat);
      const sb = ensureStoneBonuses(roundState);
      sb.incomingSpecialReduction = (sb.incomingSpecialReduction ?? 0) + bonus;
      await setRoundState(actor, roundState);
    },
  },
];

// ---------------------------------------------------------------------------
// Influence
// ---------------------------------------------------------------------------

const INFLUENCE_POWERS_RAW: Array<Omit<StonePower, 'effect'>> = [
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
      const bonus = [2, 4, 8, 12][tier - 1] ?? 0;
      const meters = [8, 16, 24, 32][tier - 1] ?? 0;
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
      const value = [2, 4, 6, 8][tier - 1] ?? 0;
      const meters = [8, 16, 24, 32][tier - 1] ?? 0;
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
      const allyCount = [1, 1, 2, 2][tier - 1] ?? 0;
      const meters = [8, 16, 24, 32][tier - 1] ?? 0;
      const immediate = tier === 2 || tier === 4;
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
    description: 'Enemies cannot target you with their next attack this round unless you are the only valid target. T1: 1@8 m, T2: 2@16 m, T3: 3@24 m, T4: 4@32 m.',
    tiers: [
      { label: '1 enemy @ 8 m', description: 'One enemy within 8 m cannot target you with its next attack this round unless you are the only valid target.', value: 1 },
      { label: '2 enemies @ 16 m', description: 'Up to 2 enemies within 16 m cannot target you with their next attack this round unless you are the only valid target.', value: 2 },
      { label: '3 enemies @ 24 m', description: 'Up to 3 enemies within 24 m cannot target you with their next attack this round unless you are the only valid target.', value: 3 },
      { label: '4 enemies @ 32 m', description: 'Up to 4 enemies within 32 m cannot target you with their next attack this round unless you are the only valid target.', value: 4 },
    ],
    apply: async ({ actor, tier }) => {
      const enemies = [1, 2, 3, 4][tier - 1] ?? 0;
      const meters = [8, 16, 24, 32][tier - 1] ?? 0;
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

const WITS_POWERS_RAW: Array<Omit<StonePower, 'effect'>> = [
  {
    id: 'wits.initiativeBoost',
    name: 'Initiative Boost',
    attribute: 'wits',
    category: 'reaction',
    description: 'Gain a flat bonus to Initiative this round (+4 / +8 / +16 / +32).',
    tiers: [
      { label: '+4 Initiative', description: 'Gain +4 Initiative this round.', value: 4 },
      { label: '+8 Initiative', description: 'Gain +8 Initiative this round.', value: 8 },
      { label: '+16 Initiative', description: 'Gain +16 Initiative this round.', value: 16 },
      { label: '+32 Initiative', description: 'Gain +32 Initiative this round.', value: 32 },
    ],
    apply: async ({ actor, combatant, tier }) => {
      const combat = (game as any).combat;
      const bonus = [4, 8, 16, 32][tier - 1] ?? 0;
      const roundState = getRoundState(actor, combat);
      const sb = ensureStoneBonuses(roundState);
      sb.initiativeBonus = (sb.initiativeBonus ?? 0) + bonus;
      await setRoundState(actor, roundState);

      // If Initiative has already been rolled (rounds 2+ — Initiative persists
      // across rounds), apply the flat bonus directly to the persisted score so
      // the turn order actually changes this round. The round-advance pipeline
      // reverts it via the `msInitiativeBoostThisRound` flag. In round 1 the
      // stone phase runs BEFORE the roll — `rollInitiativeForCombatant` folds
      // `stoneBonuses.initiativeBonus` into the score itself.
      const c = combatant ?? combat?.combatants?.find((x: any) => x.actor?.id === (actor as any).id);
      if (c && c.initiative !== null && c.initiative !== undefined) {
        const cur = Number(c.initiative) || 0;
        await c.update({ initiative: cur + bonus });
        await c.setFlag('mastery-system', 'msInitiativeValue', cur + bonus);
        const applied = Number(c.getFlag('mastery-system', 'msInitiativeBoostThisRound') ?? 0) || 0;
        await c.setFlag('mastery-system', 'msInitiativeBoostThisRound', applied + bonus);
        ui.notifications?.info(`${(actor as any).name}: +${bonus} Initiative this round (${cur} → ${cur + bonus}).`);
      }
    },
  },
  {
    id: 'wits.initiativeShop',
    name: 'Seize the Moment',
    attribute: 'wits',
    category: 'action',
    description:
      'Roll Initiative again and reopen the Initiative Shop (Players Guide "Additional Initiative Shops"). ' +
      'The new roll replaces your current Initiative.',
    tiers: [
      {
        label: 'Reroll Initiative + Initiative Shop',
        description: 'Roll Initiative again and reopen the Initiative Shop. The new score replaces your current Initiative.',
        value: 1,
      },
      {
        label: 'Reroll Initiative + Initiative Shop',
        description: 'Same effect — repeated uses in the same round simply cost more Stones.',
        value: 1,
      },
      {
        label: 'Reroll Initiative + Initiative Shop',
        description: 'Same effect — repeated uses in the same round simply cost more Stones.',
        value: 1,
      },
      {
        label: 'Reroll Initiative + Initiative Shop',
        description: 'Same effect — repeated uses in the same round simply cost more Stones.',
        value: 1,
      },
    ],
    apply: async ({ actor, combatant }) => {
      const combat = (game as any).combat;
      const c = combatant ?? combat?.combatants?.find((x: any) => x.actor?.id === (actor as any).id);
      if (!c) {
        ui.notifications?.warn('Seize the Moment: no active encounter / combatant found.');
        return;
      }
      // Audit flag first — visible even if the reroll fails midway.
      await c.setFlag('mastery-system', 'msInitiativeRerollUsed', Date.now());
      if (!c.actor || !combat) {
        ui.notifications?.warn('Seize the Moment: combatant has no actor / no active encounter.');
        return;
      }
      // Fresh roll replaces the old score — clear pending boost bookkeeping so
      // the round-advance revert cannot corrupt the new value.
      await c.setFlag('mastery-system', 'msInitiativeBoostThisRound', 0);
      const { rollInitiativeForCombatant } = await import('../combat/initiative-roll.js');
      const breakdown = await rollInitiativeForCombatant(c, { promptCombatReflexes: false });
      try {
        const { InitiativeShopDialog } = await import('../combat/initiative-shop-dialog.js');
        await InitiativeShopDialog.showForCombatant(c, breakdown, combat);
      } catch (e) {
        console.error('Mastery System | Seize the Moment: Initiative Shop failed', e);
      }
    },
  },
  {
    id: 'wits.phasing',
    name: 'Phasing',
    attribute: 'wits',
    category: 'reaction',
    description: 'Gain Phasing Charges until the start of your next turn (T2: 1, T3: 1, T4: 2).',
    tiers: [
      { label: null, description: 'No effect — ramp step.' },
      { label: '1 Phasing Charge', description: 'Gain 1 Phasing Charge until the start of your next turn.', value: 1 },
      { label: '1 Phasing Charge', description: 'Gain 1 Phasing Charge until the start of your next turn.', value: 1 },
      { label: '2 Phasing Charges', description: 'Gain 2 Phasing Charges until the start of your next turn.', value: 2 },
    ],
    apply: async ({ actor, tier }) => {
      const combat = (game as any).combat;
      const charges = [0, 1, 1, 2][tier - 1] ?? 0;
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
      const targets = [1, 1, 2, 3][tier - 1] ?? 0;
      const detail = [
        'actions',
        'actions + expected damage',
        'actions + expected damage',
        'actions + expected damage + movement + defensive options + support',
      ][tier - 1];
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
      const meters = [2, 4, 8, 16][tier - 1] ?? 0;
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

function finalize(list: Array<Omit<StonePower, 'effect'>>): StonePower[] {
  return list.map((p) => ({
    ...p,
    effect: compileEffectText(p.name, p.tiers),
  }));
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
  generic: GENERIC_POWERS,
  might: MIGHT_POWERS,
  agility: AGILITY_POWERS,
  vitality: VITALITY_POWERS,
  intellect: INTELLECT_POWERS,
  resolve: RESOLVE_POWERS,
  influence: INFLUENCE_POWERS,
  wits: WITS_POWERS,
};

/**
 * Helper — convert a usage count (0-indexed; how many times this turn the
 * power has been activated BEFORE this one) to the matching tier (1..4,
 * clamped). The new spec stops at tier 4; further activations stay at T4.
 */
export function tierForUseIndex(usesBefore: number): number {
  const t = Math.max(1, Math.min(4, Math.floor(usesBefore) + 1));
  return t;
}

/**
 * True when a power's Tier 1 is a no-op "ramp step" (label === null), meaning
 * its first real effect is Tier 2. Such powers start one segment higher: the
 * Tier-1 / Anchor field is disabled and the first activation costs 2 stones.
 * Currently this is only Extra Attack — the deliberate exception so an extra
 * Attack Action can't be bought for a single stone.
 */
export function stonePowerSkipsFirstTier(powerId: string): boolean {
  const t0 = STONE_POWERS[powerId]?.tiers?.[0] as StoneTier | undefined;
  if (!t0) return false;
  return (t0.label === null || t0.label === undefined) && t0.value === undefined;
}
