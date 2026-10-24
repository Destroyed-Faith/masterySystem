/**
 * Runtime readers for Offensive Active Buff expansion (2026-10-24).
 * Values come from maintained Active Buff ActiveEffects — never written onto defenders.
 */
/** Personal Active Buff: Armor Reduction (own attacks). */
export declare function getActiveBuffArmorReduction(attacker: any): number;
/** Active Buff: Enemy Evade Reduction (own Martial Attack Rolls only). */
export declare function getActiveBuffEnemyEvadeReduction(attacker: any): number;
/** Active Buff: Spell Resistance Piercing (own Spells only). */
export declare function getActiveBuffSpellResistancePiercing(caster: any): number;
/** Active Buff: Maximization uses granted while maintained (0 if none / unavailable PL). */
export declare function getActiveBuffMaximizationUses(actor: any): number;
/** Active Buff: Area Expansion meters (instant circular AoE only). */
export declare function getActiveBuffAreaExpansionMeters(actor: any): number;
/**
 * Radius bonus for eligible instantaneous circular AoEs.
 * Anti-stack: max(Intellect Stone AoE bonus, Area Expansion) — never sum.
 */
export declare function getEffectiveCircularAoeRadiusBonusMeters(actor: any): number;
/** Hostile relative to aura owner (not self, opposite or hostile disposition). */
export declare function isHostileTo(owner: any, other: any): boolean;
/**
 * Armor Reduction Aura: strongest eligible reduction when `attacker` hits `target`.
 * Target must be hostile to aura owner and inside radius; attacker is owner or ally.
 */
export declare function getArmorReductionAuraBonus(attacker: any, target: any): number;
/**
 * Allied Damage Aura: bonus d8 for `attacker` (other ally, non-Summon) standing in an owner's aura.
 * Never for aura owner or any Summon.
 */
export declare function getAlliedDamageAuraBonusDice(attacker: any): number;
/** True when actor currently maintains any Active Buff (for Maximization spend gate). */
export declare function actorMaintainsActiveBuff(actor: any): boolean;
//# sourceMappingURL=offensive-active-buff-effects.d.ts.map