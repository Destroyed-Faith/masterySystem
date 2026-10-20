/**
 * Passive Power Templates.
 *
 * Canonical source: `docs/passives.md` (Passive Design Rules + Catalog).
 *
 * Structure:
 *   - Base unconditional passives (one axis per template): Armor, Damage
 *     Reduction, Evade, Temporary HP, Healing, Phasing, Damage, Health,
 *     Awareness.
 *   - Conditional passives (one axis, gated on a combat condition): Armor
 *     (Stone Stance / Surrounded Bulwark), Evade (Flowing Step / Duelist
 *     Footwork), Damage (Momentum / Ambusher / Bloodlust / Executioner),
 *     Healing (Blood Feast / Battle Trance / Stillness Recovery).
 *   - Combined passives (two axes, unconditional): 12 entries per spec.
 *   - Conditional Combined passives (two axes, gated): 12 entries per spec.
 *   - Passive Special Aura: fixed +1 step on a chosen eligible Special(X),
 *     radius scales with level.
 *
 * Structural axes without a dedicated mechanics key (extra Health Bars and
 * Combat Senses) are encoded as narrative `effect.text`; the aggregator
 * falls back to descriptive behaviour for rows without a mechanical delta.
 */
import type { PowerTemplate } from './_shared.js';
/** ceil(PL / 2) — Enemy Evade Reduction, Self Cleanse, Spell Resistance Piercing. */
export declare function ceilPassiveHalfLevel(level: number): number;
/** ceil(PL / 4) — Special Amplification. */
export declare function ceilPassiveQuarterLevel(level: number): number;
/** Passive: Temporary HP amount at Power Level. */
export declare function passiveTemporaryHpForLevel(level: number): number;
/** Passive: Speed bonus meters (= PL). */
export declare function passiveSpeedMetersForLevel(level: number): number;
/** Absorption — Temporary Colorless Stones per Scarred Health Bar (L1–2 = 1 … L15–16 = 8). */
export declare function absorptionStonesPerTrigger(level: number): number;
/** Fortitude — Health Bar multiplier. Levels 1–3 are unavailable (stay ×4). */
export declare function fortitudeMultiplierForLevel(level: number): number;
/** Same numeric curve as Passive: Armor — reused by Passive: Armor Reduction. */
export declare const PASSIVE_ARMOR_CURVE: number[];
/** Max Parry Pool dice for Passive: Parry at the given power level. */
export declare function passiveParryPoolForLevel(level: number): number;
/** Combat Damage Negation reserve for Passive: Damage Negation at level. */
export declare function passiveDamageNegationReserveForLevel(level: number): number;
/**
 * Ghostform Phasing / Passive Critical / Passive Maximization combat charges.
 * PL 1–3 unavailable (0); PL 4–7 → 1; PL 8–14 → 2; PL 15–16 → 3.
 */
export declare function phasingStyleCombatCharges(lvl: number): number;
/** Armor Reduction ignored against the holder's eligible damaging attacks. */
export declare function passiveArmorReductionForLevel(level: number): number;
export declare const PASSIVE_TEMPLATES: PowerTemplate[];
//# sourceMappingURL=passives.d.ts.map