/**
 * Spell Roll Handler — Active-as-Spell pipeline (Templates refactor §6).
 *
 * Any Active power on a character can be upgraded into a Spell at creation
 * time. Spells reuse the Raise engine, but their resolution differs from a
 * standard attack:
 *
 *   Spell Attack → pool = casting attribute, keep = mastery rank,
 *                  TN = calculateBaseTN(spellLevel) + 4 × raises (casting-table rules).
 *
 *   Saving Throws were removed from the rules: a successful cast resolves the
 *   spell's full listed payload. Resistance only happens through explicitly
 *   named Attribute Checks created by individual rules.
 *
 * Raises (`+4` per Raise) are declared before the roll. **Blood Raises** cost
 * `4 HP` each (ignoring armor) and add `+4` to the final total *and* stamp the
 * actor with a flag so those HP cannot be healed until the current combat ends.
 *
 * This module owns the maths & side-effects; the UI layer just calls
 * `rollSpell` and `canCastSpellAtLevel`.
 */

import type {
  CastingAttribute,
  SpellResolution,
} from '../types/item.js';
import type { MasteryRollResult } from '../types/index';
import { masteryRoll } from '../dice/roll-handler.js';
import { computeRaiseTns, resolveRaiseOutcome, type RaiseOutcome } from './raise-resolution.js';
import { RAISE_INCREMENT } from '../utils/constants.js';
import {
  applyStress,
  applyDamage,
  isStressTrackCollapsed,
} from '../utils/calculations.js';
import type { HealthBar } from '../types/actor.js';

/** Flag scope used for persistent spell-related state on actors. */
const FLAG_SCOPE = 'mastery-system';
/** Boolean flag: any HP lost to Blood Raises that is still outstanding. */
const FLAG_BLOOD_RAISE_HP = 'bloodRaiseHpLostThisCombat';

// ──────────────────────────────────────────────────────────────────────────
// Pure-math helpers
// ──────────────────────────────────────────────────────────────────────────

/** Maximum Spell Level a character can learn/cast: `Mastery Rank × 2`. */
export function getMaxSpellLevel(masteryRank: number): number {
  return Math.max(0, Math.floor(masteryRank)) * 2;
}

/** Whether an actor of `masteryRank` can cast/learn a spell at `spellLevel`. */
export function canCastSpellAtLevel(masteryRank: number, spellLevel: number): boolean {
  if (!Number.isFinite(masteryRank) || !Number.isFinite(spellLevel)) return false;
  if (spellLevel < 1 || spellLevel > 16) return false;
  return spellLevel <= getMaxSpellLevel(masteryRank);
}

/**
 * Spell Tier I–VIII (Players Guide 7912–7923).
 *
 *   I → 8, II → 16, III → 24, IV → 32, V → 40, VI → 48, VII → 56, VIII → 64.
 *
 * Each Tier covers two consecutive Power Levels (L1+L2 = Tier I, etc.) so the
 * "Spell Tier" surface always lines up with the underlying Active Power Level.
 */
export type SpellTier = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export const SPELL_TIER_TABLE: Record<SpellTier, number> = {
  1: 8,
  2: 16,
  3: 24,
  4: 32,
  5: 40,
  6: 48,
  7: 56,
  8: 64,
};

/** Spell Tier (I–VIII) that contains the given Power Level (1–16). */
export function spellTierForPowerLevel(spellLevel: number): SpellTier {
  const lvl = Math.max(1, Math.min(16, Math.floor(spellLevel)));
  return Math.ceil(lvl / 2) as SpellTier;
}

/** Casting TN for a Spell of Tier I..VIII (Players Guide 7912–7923). */
export function castingTNForTier(tier: SpellTier): number {
  return SPELL_TIER_TABLE[tier];
}

/**
 * Base Casting TN for a Spell built from a Power of `spellLevel` (1..16).
 *
 * Equivalent to `castingTNForTier(spellTierForPowerLevel(spellLevel))`, kept
 * as a stand-alone export because every existing caller already uses
 * `calculateBaseTN(...)`.
 */
export function calculateBaseTN(spellLevel: number): number {
  return castingTNForTier(spellTierForPowerLevel(spellLevel));
}

// ──────────────────────────────────────────────────────────────────────────
// Casting-cost mutators (HP for Blood Raises, Stress for fizzle)
// ──────────────────────────────────────────────────────────────────────────

/**
 * Deduct `amount` HP from the actor, bypassing armor (blood magic). Records
 * the amount lost so it cannot be healed until combat ends.
 * Returns the actual HP actually removed (clamped to what was available).
 */
export async function applyBloodRaiseHpLoss(actor: any, amount: number): Promise<number> {
  if (!actor || amount <= 0) return 0;
  const system = actor.system ?? {};
  const health = system.health ?? {};
  const bars: HealthBar[] | undefined = Array.isArray(health.bars) ? health.bars : undefined;
  if (!bars || bars.length === 0) return 0;

  const barsClone = bars.map((b) => ({ ...b }));
  const before = barsClone.reduce((sum, b) => sum + b.current, 0);
  // Same as strike damage: pools drain from the first (Healthy) bar onward.
  const newCurrent = applyDamage(barsClone, 0, amount);
  const after = barsClone.reduce((sum, b) => sum + b.current, 0);
  const lost = Math.max(0, before - after);

  const prior = Number(actor.getFlag?.(FLAG_SCOPE, FLAG_BLOOD_RAISE_HP) ?? 0) || 0;

  try {
    await actor.update({
      'system.health.bars': barsClone,
      'system.health.currentBar': newCurrent,
    });
    await actor.setFlag?.(FLAG_SCOPE, FLAG_BLOOD_RAISE_HP, prior + lost);
  } catch (err) {
    console.warn('Mastery System | applyBloodRaiseHpLoss failed', err);
  }
  return lost;
}

/**
 * Apply `amount` stress to the actor.
 *
 * Players Guide stress chapter (~6493–6502): `floor(Resolve/8)` Stress
 * Armor reduces every *involuntary* stress hit; voluntary stress (push
 * casts, Focus power-ups, etc.) ignores Stress Armor. Pass
 * `{ voluntary: true }` to bypass the armor.
 */
export async function applyStressToActor(
  actor: any,
  amount: number,
  options?: { voluntary?: boolean },
): Promise<number> {
  if (!actor || amount <= 0) return 0;
  const system = actor.system ?? {};
  const stress = system.stress ?? {};
  const bars: HealthBar[] | undefined = Array.isArray(stress.bars) ? stress.bars : undefined;
  const currentBar: number = Number.isFinite(stress.currentBar) ? stress.currentBar : 0;
  if (!bars || bars.length === 0) return currentBar;

  let appliedAmount = amount;
  if (!options?.voluntary) {
    const armor = Math.max(
      0,
      Math.floor(Number(system?.scaling?.resolveStressArmor ?? 0) || 0),
    );
    if (armor > 0) {
      appliedAmount = Math.max(0, amount - armor);
      if (appliedAmount === 0) {
        // Fully absorbed by armor — nothing to commit, but signal to the
        // caller that the armor "ate" the entire hit.
        return currentBar;
      }
    }
  }

  const wasCollapsed = isStressTrackCollapsed(bars, currentBar);
  const barsClone = bars.map((b) => ({ ...b }));
  const newCurrent = applyStress(barsClone, currentBar, appliedAmount);
  // Store a clamped bar index for sheet UI; collapse is detected separately.
  const storedBar = Math.min(Math.max(0, newCurrent), Math.max(0, barsClone.length - 1));
  try {
    await actor.update({
      'system.stress.bars': barsClone,
      'system.stress.currentBar': storedBar,
    });
  } catch (err) {
    console.warn('Mastery System | applyStressToActor failed', err);
  }

  // Players Guide: when the track fills, run the Stress Breakdown Check.
  try {
    const nowCollapsed = isStressTrackCollapsed(barsClone, newCurrent);
    if (!wasCollapsed && nowCollapsed) {
      const { maybeTriggerStressBreakdown } = await import('./stress-breakdown.js');
      await maybeTriggerStressBreakdown(actor, { wasCollapsed: false });
    }
  } catch (err) {
    console.warn('Mastery System | stress breakdown trigger failed', err);
  }

  return storedBar;
}

/** Roll `1d8` and apply the result as stress. Returns the stress inflicted. */
export async function applyFizzleStress(actor: any): Promise<number> {
  try {
    const roll = await new (globalThis as any).Roll('1d8').evaluate({ async: true });
    const amount = Math.max(1, Number(roll?.total) || 1);
    await applyStressToActor(actor, amount);
    return amount;
  } catch (err) {
    console.warn('Mastery System | applyFizzleStress fallback to flat 4', err);
    await applyStressToActor(actor, 4);
    return 4;
  }
}

/**
 * `combatEnd`/`deleteCombat` hook target: clears the per-combat Blood Raise
 * flag so HP becomes healable again once the fight is over. Intentionally
 * cheap — runs once per actor, no-op if the flag is absent.
 */
export async function clearBloodRaiseHpFlagForCombat(combat: any): Promise<void> {
  try {
    const combatants = combat?.combatants?.contents ?? combat?.combatants ?? [];
    const seen = new Set<string>();
    for (const c of combatants) {
      const a = c?.actor;
      if (!a || seen.has(a.id)) continue;
      seen.add(a.id);
      try {
        if (a.getFlag?.(FLAG_SCOPE, FLAG_BLOOD_RAISE_HP) != null) {
          await a.unsetFlag?.(FLAG_SCOPE, FLAG_BLOOD_RAISE_HP);
        }
      } catch (err) {
        console.warn('Mastery System | clearBloodRaiseHpFlagForCombat actor failed', err);
      }
    }
  } catch (err) {
    console.warn('Mastery System | clearBloodRaiseHpFlagForCombat failed', err);
  }
}

// ──────────────────────────────────────────────────────────────────────────
// Core roll pipeline
// ──────────────────────────────────────────────────────────────────────────

export interface SpellRollParams {
  /** The caster actor. */
  actor: any;
  /** Target actor (required for `spellAttack`; optional for support). */
  target?: any | null;
  /** Spell level (1–16) — typically equals the chosen Power rank. */
  spellLevel: number;
  /** Which attribute rolls the pool. */
  castingAttribute: CastingAttribute;
  /** Resolution type pulled from the power item. */
  resolution: SpellResolution;
  /** Declared raise slots (each +4 to Raise TN; Normal TN unchanged). */
  declaredRaiseSlots?: number;
  /** @deprecated Use declaredRaiseSlots */
  declaredRaises?: number;
  /** Blood Raises bought with 4 HP each (each adds +4 to the final total). */
  bloodRaises?: number;
  /** GM fiction modifier, additive on the final TN (+4 = Challenging etc.). */
  gmModifier?: number;
  /** Optional override for the caster's Mastery Rank. */
  masteryRankOverride?: number;
  /** Power-item name for the chat label. */
  spellName?: string;
  /** Flavor string forwarded to the chat card. */
  flavor?: string;
  /** Support spell: no target required — only the Casting Roll must succeed. */
  supportMode?: boolean;
}

export interface SpellRollResult {
  /** Casting / spell-attack roll result. */
  castingRoll: MasteryRollResult;
  /** Normal casting TN (before raise tier). */
  baseTn: number;
  /** Raise TN when raises declared. */
  raiseTn: number;
  /** @deprecated Final TN — same as raiseTn when raises declared, else baseTn. */
  finalTn: number;
  declaredRaises: number;
  raiseOutcome: RaiseOutcome;
  /** Blood Raises applied (each worth +4 total and −4 HP). */
  bloodRaises: number;
  /** HP actually removed for Blood Raises (clamped to what was available). */
  bloodHpLost: number;
  /** `true` when the casting roll met the final TN. */
  success: boolean;
  /** Raises achieved (includes declared/blood when successful). */
  raises: number;
  /** Stress inflicted on the caster when the spell fizzled. */
  stressTaken: number;
  /** Resolution used. */
  resolution: SpellResolution;
}

/**
 * Execute the full Active-as-Spell roll pipeline:
 *   1. Blood Raises (HP loss) → added to the pool's total as +4 each.
 *   2. Casting Roll via `masteryRoll` (Pool = attribute, Keep = MR).
 *   3. Resolve against the Casting TN.
 *   4. On failure: `1d8` stress; on success: return result for the caller to
 *      apply damage/effects.
 */
export async function rollSpell(params: SpellRollParams): Promise<SpellRollResult> {
  const {
    actor,
    target = null,
    spellLevel,
    castingAttribute,
    resolution,
    declaredRaises = 0,
    declaredRaiseSlots,
    bloodRaises = 0,
    gmModifier = 0,
    masteryRankOverride,
    spellName = 'Spell',
    flavor,
    supportMode = false,
  } = params;

  const system = actor?.system ?? {};
  const attrValue = Number(system.attributes?.[castingAttribute]?.value ?? 0);
  const masteryRank = Number(
    masteryRankOverride ?? system.mastery?.rank ?? 1,
  );
  // Base pool = casting attribute. Specials (Weaken / Soulburn), the
  // Health/Encumbrance percentage penalty, and the Minimum Pool (= MR)
  // are applied centrally inside `masteryRoll` in canonical order.
  const numDice = Math.max(0, attrValue);
  const keepDice = Math.max(1, masteryRank);

  const bloodApplied = Math.max(0, Math.floor(bloodRaises));
  const raiseSlots = Math.max(
    0,
    Math.floor(declaredRaiseSlots ?? declaredRaises ?? 0),
  );

  const baseTn = calculateBaseTN(spellLevel) + (Number(gmModifier) || 0);
  const { raiseTn } = computeRaiseTns(baseTn, raiseSlots);

  // HP cost for Blood Raises fires *before* the roll per the SRD wording.
  let bloodHpLost = 0;
  if (bloodApplied > 0) {
    bloodHpLost = await applyBloodRaiseHpLoss(actor, bloodApplied * 4);
  }

  const label = `Cast ${spellName} (Lvl ${spellLevel})`;
  const autoFlavor = [
    flavor,
    `Spell — Casting TN ${baseTn}${supportMode ? ' (support)' : ''}`,
    raiseSlots > 0 ? `+${raiseSlots} Raise${raiseSlots === 1 ? '' : 's'} (Raise TN ${raiseTn})` : undefined,
    bloodApplied > 0 ? `Blood Raises: ${bloodApplied} (−${bloodHpLost} HP)` : undefined,
    gmModifier ? `GM ${gmModifier > 0 ? '+' : ''}${gmModifier}` : undefined,
  ]
    .filter(Boolean)
    .join(' | ');

  const castingRoll = await masteryRoll({
    numDice,
    keepDice,
    skill: 0,
    tn: baseTn,
    normalTn: baseTn,
    raiseTn,
    declaredRaiseSlots: raiseSlots,
    label,
    flavor: autoFlavor,
    actorId: actor?.id,
    targetActorId: target?.id,
    rollKind: resolution === 'spellAttack' ? 'attack' : 'generic',
    poolAttribute: castingAttribute,
    applyPoolPenalties: true,
    actorRef: actor,
  });

  const adjustedTotal = castingRoll.total + bloodApplied * RAISE_INCREMENT;
  let raiseTnRollBonus = 0;
  try {
    const { getRoundState } = await import('./action-economy.js');
    const combat = (game as any).combat;
    if (actor && combat) {
      const rs = getRoundState(actor, combat);
      raiseTnRollBonus = Math.max(0, Number(rs?.stoneBonuses?.spellRaiseTnBonus) || 0);
    }
  } catch {
    /* ignore */
  }
  const raiseOutcome = resolveRaiseOutcome(adjustedTotal, baseTn, raiseSlots, raiseTnRollBonus);
  const success = raiseOutcome !== 'fail';
  const raises = raiseOutcome === 'full' ? raiseSlots : 0;

  let stressTaken = 0;
  if (!success) {
    stressTaken = await applyFizzleStress(actor);
  }

  return {
    castingRoll,
    baseTn,
    raiseTn,
    finalTn: raiseSlots > 0 ? raiseTn : baseTn,
    declaredRaises: raiseSlots,
    raiseOutcome,
    bloodRaises: bloodApplied,
    bloodHpLost,
    success,
    raises,
    stressTaken,
    resolution,
  } as SpellRollResult;
}

/**
 * Resolution mode for a spell power item. Saving throws were removed —
 * every spell resolves as `spellAttack` (caster roll vs TN).
 */
export function inferResolutionFromItem(_powerItem: any): SpellResolution {
  return 'spellAttack';
}
