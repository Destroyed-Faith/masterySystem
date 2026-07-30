/**
 * Encounter Generator — party analysis + Roll & Keep simulator.
 *
 * Pure, Foundry-free helpers (so they are unit-testable). `extractPartyMember`
 * reads from a Foundry actor's prepared `system` but is tolerant of partial
 * data and never throws.
 */

import { isArtifactEquippedOnActor } from '../../utils/artifact-actor-rules.js';
import { artifactToVirtualWeapon } from '../../utils/unarmed-fallback.js';
import type { PartyMemberMetrics, PartyMetrics } from './encounter-generator-types.js';

/** Mean of an exploding d8 (each natural 8 rerolls and adds): 36/7 ≈ 5.1429. */
export const EXPLODING_D8_MEAN = 36 / 7;

export type Rng = () => number;

/** One exploding d8 result (face + chained explosions on natural 8s). */
export function rollExplodingD8(rng: Rng = Math.random): number {
  let total = 0;
  // Guard against pathological infinite loops with a hard cap.
  for (let i = 0; i < 64; i++) {
    const face = 1 + Math.floor(rng() * 8);
    total += face;
    if (face !== 8) break;
  }
  return total;
}

/**
 * Roll `numDice` exploding d8, keep the `keep` highest die-totals, return the
 * sum. Mirrors the system's Roll & Keep engine (src/dice/roll-handler.ts).
 */
export function rollKeepSample(numDice: number, keep: number, rng: Rng = Math.random): number {
  const n = Math.max(1, Math.floor(numDice));
  const k = Math.max(1, Math.min(n, Math.floor(keep)));
  const dice: number[] = [];
  for (let i = 0; i < n; i++) dice.push(rollExplodingD8(rng));
  dice.sort((a, b) => b - a);
  let sum = 0;
  for (let i = 0; i < k; i++) sum += dice[i];
  return sum;
}

/**
 * Monte-Carlo sample of `numDice` keep `keep` totals, sorted ascending.
 */
export function simulateAttackTotals(
  numDice: number,
  keep: number,
  samples = 3000,
  rng: Rng = Math.random,
): number[] {
  const out: number[] = [];
  for (let i = 0; i < samples; i++) out.push(rollKeepSample(numDice, keep, rng));
  out.sort((a, b) => a - b);
  return out;
}

/** Value at quantile `q` (0..1) of a sorted-ascending array. */
export function quantile(sortedAsc: number[], q: number): number {
  if (sortedAsc.length === 0) return 0;
  const clamped = Math.max(0, Math.min(1, q));
  const idx = Math.min(sortedAsc.length - 1, Math.max(0, Math.round(clamped * (sortedAsc.length - 1))));
  return sortedAsc[idx];
}

/** Fraction of samples >= tn. */
export function hitRate(sortedAsc: number[], tn: number): number {
  if (sortedAsc.length === 0) return 0;
  let lo = 0;
  let hi = sortedAsc.length;
  // first index with value >= tn
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (sortedAsc[mid] >= tn) hi = mid;
    else lo = mid + 1;
  }
  return (sortedAsc.length - lo) / sortedAsc.length;
}

/** Mean number of raises (floor((total - tn)/4)) over samples that hit. */
export function meanRaisesOnHit(sortedAsc: number[], tn: number): number {
  let count = 0;
  let sum = 0;
  for (const total of sortedAsc) {
    if (total >= tn) {
      count++;
      sum += Math.floor((total - tn) / 4);
    }
  }
  return count > 0 ? sum / count : 0;
}

function num(value: unknown, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

/** Parse a weapon's damage into an expected mean (exploding d8 assumed). */
export function estimateWeaponDamageMean(weaponSystem: any): number {
  if (!weaponSystem) return 2 * EXPLODING_D8_MEAN;
  // Explicit dice count (some weapons / NPC-style rows).
  const dc = num(weaponSystem.damageDiceCount, 0);
  if (dc > 0) return dc * EXPLODING_D8_MEAN;
  // Strings like "2d8", "1d8+2", or a bare number.
  const raw = String(weaponSystem.baseDamage ?? weaponSystem.damage ?? '').trim();
  if (raw) {
    const dice = raw.match(/(\d+)\s*d\s*8/i);
    const flat = raw.match(/([+-]\s*\d+)(?!\s*d)/i);
    let mean = 0;
    if (dice) mean += parseInt(dice[1], 10) * EXPLODING_D8_MEAN;
    if (flat) mean += parseInt(flat[1].replace(/\s+/g, ''), 10);
    if (mean > 0) return mean;
    const bare = parseInt(raw, 10);
    if (Number.isFinite(bare) && bare > 0) return bare;
  }
  // Default: a one-handed weapon.
  return 2 * EXPLODING_D8_MEAN;
}

/**
 * Extract a combat profile from a Foundry `character` actor.
 * `samples` controls the Monte-Carlo size for this member's attack roll.
 */
export function extractPartyMember(actor: any, samples = 3000, rng: Rng = Math.random): PartyMemberMetrics {
  const system = actor?.system ?? {};
  const combat = system.combat ?? {};
  const attributes = system.attributes ?? {};
  const mr = Math.max(1, Math.min(8, Math.floor(num(system.mastery?.rank, 2))));

  const evade = Math.round(num(combat.evadeTotal, num(combat.evade, mr * 4)));
  const armor = Math.round(num(combat.armorTotal, num(combat.armor, mr)));
  const drPct = Math.max(0, Math.min(100, Math.round(num(combat.damageReductionPct, 0))));

  const bars: any[] = Array.isArray(system.health?.bars) ? system.health.bars : [];
  const effectiveHP = bars.reduce((acc, b) => acc + Math.max(0, num(b?.max, 0)), 0) || 1;
  const barCount = Math.max(1, bars.length);

  const might = num(attributes.might?.value, 2);
  const agility = num(attributes.agility?.value, 2);
  const bestAttr = Math.max(might, agility);
  const attackPool = Math.max(mr, Math.floor(bestAttr));

  // Realistic per-hit damage: best weapon (real OR artifact weapon like the
  // Monarch Greatsword) + the best attack power's bonus dice. Attack powers
  // are weapon-carried in this system (weapon 5d8 + power 4d8 = 9d8 per hit),
  // so ignoring them made generated bosses paper-thin.
  let weaponMean = 0;
  let bestPowerBonusMean = 0;
  let bestSpellMean = 0;
  let canCleanse = false;
  try {
    const items: any[] = Array.isArray(actor?.items?.contents)
      ? actor.items.contents
      : Array.isArray(actor?.items)
        ? actor.items
        : [];

    const equippedWeapon =
      items.find((i) => i?.type === 'weapon' && i?.system?.equipped === true)
        ?? items.find((i) => i?.type === 'weapon')
        ?? null;
    if (equippedWeapon?.system) {
      weaponMean = estimateWeaponDamageMean(equippedWeapon.system);
    }

    // Artifact weapons: derive the virtual weapon profile (equipped artifacts
    // keep their weapon damage even before activation).
    for (const it of items) {
      if (it?.type !== 'artifact') continue;
      try {
        if (!isArtifactEquippedOnActor(it)) continue;
        const vw = artifactToVirtualWeapon(it);
        if (vw?.system) {
          weaponMean = Math.max(weaponMean, estimateWeaponDamageMean(vw.system));
        }
      } catch {
        /* ignore malformed artifacts */
      }
    }

    for (const i of items) {
      if (i?.type !== 'power') continue;
      const sys = i?.system ?? {};
      const chosen = String(sys.chosenSpecial?.key ?? '').toLowerCase();
      const name = String(i?.name ?? '').toLowerCase();
      const subfamily = String(sys.subfamily ?? '').toLowerCase();
      if (chosen === 'cleanse' || subfamily === 'support-cleanse' || name.includes('cleanse')) {
        canCleanse = true;
      }
      // Damage dice of attack powers ("4d8"): non-spell powers ride on the
      // weapon; spells stand alone.
      const dmgRaw = String(sys.roll?.damage ?? '').trim();
      const diceMatch = dmgRaw.match(/(\d+)\s*d\s*8/i);
      const d8 = diceMatch ? parseInt(diceMatch[1], 10) : 0;
      if (d8 > 0) {
        if (sys.isSpell === true) {
          bestSpellMean = Math.max(bestSpellMean, d8 * EXPLODING_D8_MEAN);
        } else {
          bestPowerBonusMean = Math.max(bestPowerBonusMean, d8 * EXPLODING_D8_MEAN);
        }
      }
    }
  } catch {
    /* keep defaults */
  }
  if (weaponMean <= 0) weaponMean = estimateWeaponDamageMean(null);
  const weaponDamageMean = Math.max(weaponMean + bestPowerBonusMean, bestSpellMean);
  const mightMeleeBonus = 2 * Math.floor(might / 8);

  const attackTotals = simulateAttackTotals(attackPool, mr, samples, rng);

  return {
    actorId: String(actor?.id ?? ''),
    name: String(actor?.name ?? 'Unbenannt'),
    mr,
    effectiveHP,
    evade,
    armor,
    drPct,
    attackPool,
    keep: mr,
    weaponDamageMean,
    mightMeleeBonus,
    attacksPerRound: 1,
    attackTotals,
    barCount,
    canCleanse,
  };
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/** Aggregate a list of member metrics into party-level metrics. */
export function buildPartyMetrics(members: PartyMemberMetrics[]): PartyMetrics {
  const pooled: number[] = [];
  for (const m of members) pooled.push(...m.attackTotals);
  pooled.sort((a, b) => a - b);

  return {
    members,
    size: members.length,
    medianMR: Math.round(median(members.map((m) => m.mr))) || 2,
    avgEvade: Math.round(average(members.map((m) => m.evade))),
    avgArmor: Math.round(average(members.map((m) => m.armor))),
    avgDrPct: Math.round(average(members.map((m) => m.drPct))),
    avgHP: Math.round(average(members.map((m) => m.effectiveHP))),
    pooledAttackTotals: pooled,
  };
}

/** Convenience: extract metrics for a list of actors and aggregate. */
export function analyzeParty(actors: any[], samples = 3000, rng: Rng = Math.random): PartyMetrics {
  const members = actors.map((a) => extractPartyMember(a, samples, rng));
  return buildPartyMetrics(members);
}
