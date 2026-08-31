/**
 * Canonical combat mathematics for the Encounter Forge.
 *
 * RULE CONSTANTS ONLY — everything in this file is a direct consequence of
 * the Mastery System core rules as implemented by the live combat engine
 * (attack-executor.ts, damage-mitigation.ts, raise-resolution.ts,
 * spell-roll-handler.ts, special-application.ts). No playtest tuning values
 * belong here; those live in encounter-tuning.ts.
 *
 * Canonical resolution order respected by these helpers:
 *   Parry (strips attack dice) -> to-hit roll vs TN -> Phasing ->
 *   Ward (special reduction) -> damage roll -> Penetration vs Armor ->
 *   Armor -> Damage Reduction % -> natural-8 minimum damage ->
 *   Temporary HP -> Health.
 *
 * Different defenses stay mechanically different — nothing here collapses
 * them into one "effective armor" number.
 */

import {
  damageJointPmf,
  hitChance,
  pmfAtLeast,
  pmfMean,
  pmfQuantile,
  poolKeepPmf,
} from './probability.js';

/* ------------------------------------------------------------------ */
/* Rule constants                                                      */
/* ------------------------------------------------------------------ */

/** One raise per +4 on the TN (RAISE_INCREMENT in the live engine). */
export const RAISE_TN_STEP = 4;

/** New points of one diminishing Special per round: 4 × MR (special-application.ts). */
export const SPECIAL_APPLICATION_LIMIT_PER_MR = 4;

/** Natural Special Recovery at turn start: reduce negative specials by MR total. */
export const NATURAL_RECOVERY_PER_TURN_IS_MR = true;

/** Diminishing specials additionally decay by 1 at turn start (after recovery). */
export const SPECIAL_DECAY_PER_TURN = 1;

/**
 * PC health-bar dice-pool penalty fractions by current bar index
 * (constants.ts HEALTH_PENALTY_FRACTIONS): penalty dice = floor(pool × f).
 */
export const HEALTH_PENALTY_FRACTIONS = [0, 0.1, 0.2, 0.4, 0.5, 1] as const;

/** Base PC evade: MR × 4 (calculations.ts calculateBaseEvade). */
export function baseEvadeForMr(mr: number): number {
  return Math.max(1, Math.floor(mr)) * 4;
}

/** NPC spell attack Casting TN: 8 × MR (+ target Spell Resistance). */
export function npcSpellCastingTn(mr: number, targetSpellResistance = 0): number {
  return 8 * Math.max(1, Math.floor(mr)) + Math.max(0, Math.floor(targetSpellResistance));
}

/**
 * PC spell Casting TN vs an NPC: 8 × caster Mastery Rank
 * (`castingBaseTnForMasteryRank`), +4 if Mental, plus target Spell Resistance.
 * Power Level does not set the TN.
 */
export function pcSpellCastingTn(
  casterMr: number,
  targetSpellResistance = 0,
  opts?: { mental?: boolean },
): number {
  const mr = Math.max(1, Math.min(8, Math.floor(Number(casterMr) || 1)));
  return 8 * mr + (opts?.mental ? 4 : 0) + Math.max(0, Math.floor(targetSpellResistance));
}

/** Melee flat damage bonus from Might: 2 × floor(Might / 8) (calculations.ts). */
export function mightMeleeBonus(might: number): number {
  return 2 * Math.floor(Math.max(0, might) / 8);
}

/** Stones per attribute pool: floor(attr / 8) (action-economy.ts). */
export function stonesForAttribute(attr: number): number {
  return Math.floor(Math.max(0, attr) / 8);
}

/* ------------------------------------------------------------------ */
/* To-hit                                                              */
/* ------------------------------------------------------------------ */

export interface AttackRollSpec {
  /** Attack pool (d8 count) BEFORE parry strips dice. */
  pool: number;
  /** Kept dice = attacker Mastery Rank. */
  keep: number;
  /** Effective TN: target Evade for martial, Casting TN for spells. */
  tn: number;
  /** Expected attack dice stripped by the defender's parry (pre-roll, 1:1). */
  parryStrip?: number;
  /** Chance the defender negates the hit outright via Phasing. */
  phasingNegateChance?: number;
}

/**
 * Chance the attack connects: parry strip reduces the pool, then the kept
 * exploding-d8 sum must reach the TN, then Phasing may negate the hit.
 * A pool stripped to 0 is Fully Parried (no roll).
 */
export function attackConnectChance(spec: AttackRollSpec): number {
  const pool = Math.floor(spec.pool - Math.max(0, spec.parryStrip ?? 0));
  if (pool <= 0) return 0;
  const rollHit = hitChance(pool, spec.keep, spec.tn);
  const phasingPass = 1 - Math.min(1, Math.max(0, spec.phasingNegateChance ?? 0));
  return rollHit * phasingPass;
}

/* ------------------------------------------------------------------ */
/* Damage after mitigation                                             */
/* ------------------------------------------------------------------ */

export interface DamageSpec {
  /** Plain d8 damage dice (damage dice do NOT explode by default). */
  dice: number;
  /** Flat damage added to the roll (e.g. Might melee bonus). */
  flat?: number;
  /** Attacker's armor penetration ("ignores X Armor"). */
  penetration?: number;
  /** Defender flat armor (armorTotal at hit time). */
  armor: number;
  /** Defender damage reduction percent 0..100 (applied after armor, ceil). */
  drPct?: number;
  /** Expected damage dice removed by Damage Negation before the roll. */
  damageNegationDice?: number;
}

/**
 * Exact expected HP damage of one connecting hit, respecting:
 * Damage Negation (dice removed) -> roll -> Penetration -> Armor -> DR% ->
 * natural-8 minimum damage (if armor+DR zero out the hit, the target still
 * takes 1 damage per natural 8 rolled).
 *
 * Temporary HP is handled by the simulator (it is a pool, not a per-hit
 * modifier).
 */
export function expectedHitDamage(spec: DamageSpec): number {
  const dice = Math.max(0, Math.floor(spec.dice - Math.max(0, spec.damageNegationDice ?? 0)));
  const flat = Math.max(0, Math.floor(spec.flat ?? 0));
  const effArmor = Math.max(
    0,
    Math.floor(spec.armor) - Math.max(0, Math.floor(spec.penetration ?? 0)),
  );
  const dr = Math.min(100, Math.max(0, spec.drPct ?? 0));
  if (dice === 0) {
    const afterArmor = Math.max(0, flat - effArmor);
    return afterArmor - Math.ceil((afterArmor * dr) / 100);
  }
  const joint = damageJointPmf(dice);
  let expected = 0;
  for (let eights = 0; eights < joint.length; eights += 1) {
    const pmf = joint[eights];
    for (let s = 0; s < pmf.length; s += 1) {
      const p = pmf[s];
      if (p === 0) continue;
      const raw = s + flat;
      const afterArmor = Math.max(0, raw - effArmor);
      const afterDr = afterArmor - Math.ceil((afterArmor * dr) / 100);
      const dmg = afterDr > 0 ? afterDr : eights;
      expected += p * dmg;
    }
  }
  return expected;
}

/**
 * Damage quantile of one connecting hit (for favorable/unfavorable bands and
 * burst checks). Same mitigation model as expectedHitDamage.
 */
export function hitDamageQuantile(spec: DamageSpec, q: number): number {
  const dice = Math.max(0, Math.floor(spec.dice - Math.max(0, spec.damageNegationDice ?? 0)));
  const flat = Math.max(0, Math.floor(spec.flat ?? 0));
  const effArmor = Math.max(
    0,
    Math.floor(spec.armor) - Math.max(0, Math.floor(spec.penetration ?? 0)),
  );
  const dr = Math.min(100, Math.max(0, spec.drPct ?? 0));
  if (dice === 0) {
    const afterArmor = Math.max(0, flat - effArmor);
    return afterArmor - Math.ceil((afterArmor * dr) / 100);
  }
  // Build the mitigated-damage PMF, then take the quantile.
  const joint = damageJointPmf(dice);
  const maxDmg = 8 * dice + flat;
  const out = new Float64Array(maxDmg + 1);
  for (let eights = 0; eights < joint.length; eights += 1) {
    const pmf = joint[eights];
    for (let s = 0; s < pmf.length; s += 1) {
      const p = pmf[s];
      if (p === 0) continue;
      const raw = s + flat;
      const afterArmor = Math.max(0, raw - effArmor);
      const afterDr = afterArmor - Math.ceil((afterArmor * dr) / 100);
      const dmg = afterDr > 0 ? afterDr : eights;
      out[dmg] += p;
    }
  }
  return pmfQuantile(out, q);
}

/* ------------------------------------------------------------------ */
/* Convenience wrappers                                                */
/* ------------------------------------------------------------------ */

/** Expected damage of one attack action = connect chance × mitigated hit damage. */
export function expectedAttackDamage(roll: AttackRollSpec, damage: DamageSpec): number {
  return attackConnectChance(roll) * expectedHitDamage(damage);
}

/** Mean of the kept attack roll (diagnostics). */
export function attackRollMean(pool: number, keep: number): number {
  return pmfMean(poolKeepPmf(Math.max(1, pool), Math.max(1, keep)));
}

/** P(kept attack roll >= tn) without parry/phasing (diagnostics). */
export function rawHitChance(pool: number, keep: number, tn: number): number {
  if (pool <= 0) return 0;
  return pmfAtLeast(poolKeepPmf(pool, keep), tn);
}
