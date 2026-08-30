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
/** One raise per +4 on the TN (RAISE_INCREMENT in the live engine). */
export declare const RAISE_TN_STEP = 4;
/** New points of one diminishing Special per round: 4 × MR (special-application.ts). */
export declare const SPECIAL_APPLICATION_LIMIT_PER_MR = 4;
/** Natural Special Recovery at turn start: reduce negative specials by MR total. */
export declare const NATURAL_RECOVERY_PER_TURN_IS_MR = true;
/** Diminishing specials additionally decay by 1 at turn start (after recovery). */
export declare const SPECIAL_DECAY_PER_TURN = 1;
/**
 * PC health-bar dice-pool penalty fractions by current bar index
 * (constants.ts HEALTH_PENALTY_FRACTIONS): penalty dice = floor(pool × f).
 */
export declare const HEALTH_PENALTY_FRACTIONS: readonly [0, 0.1, 0.2, 0.4, 0.5, 1];
/** Base PC evade: MR × 4 (calculations.ts calculateBaseEvade). */
export declare function baseEvadeForMr(mr: number): number;
/** NPC spell attack Casting TN: 8 × MR (+ target Spell Resistance). */
export declare function npcSpellCastingTn(mr: number, targetSpellResistance?: number): number;
/**
 * PC spell Casting TN: 8 × tier where tier = ceil(powerLevel / 2)
 * (spell-roll-handler.ts SPELL_TIER_TABLE), plus target Spell Resistance.
 */
export declare function pcSpellCastingTn(powerLevel: number, targetSpellResistance?: number): number;
/** Melee flat damage bonus from Might: 2 × floor(Might / 8) (calculations.ts). */
export declare function mightMeleeBonus(might: number): number;
/** Stones per attribute pool: floor(attr / 8) (action-economy.ts). */
export declare function stonesForAttribute(attr: number): number;
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
export declare function attackConnectChance(spec: AttackRollSpec): number;
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
export declare function expectedHitDamage(spec: DamageSpec): number;
/**
 * Damage quantile of one connecting hit (for favorable/unfavorable bands and
 * burst checks). Same mitigation model as expectedHitDamage.
 */
export declare function hitDamageQuantile(spec: DamageSpec, q: number): number;
/** Expected damage of one attack action = connect chance × mitigated hit damage. */
export declare function expectedAttackDamage(roll: AttackRollSpec, damage: DamageSpec): number;
/** Mean of the kept attack roll (diagnostics). */
export declare function attackRollMean(pool: number, keep: number): number;
/** P(kept attack roll >= tn) without parry/phasing (diagnostics). */
export declare function rawHitChance(pool: number, keep: number, tn: number): number;
//# sourceMappingURL=combat-math.d.ts.map