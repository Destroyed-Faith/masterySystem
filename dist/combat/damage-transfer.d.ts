/**
 * Damage Transfer (Vampyr).
 *
 * Healing is the real HP this one damage instance removed from the target
 * after mitigation, Temporary HP, and other buffers. It is capped by the
 * missing HP on the attacker's current Health Bar. Limited multiplies printed
 * power dice ×4 only; it does not multiply the heal. This is not Life Absorption.
 */
export declare const MELEE_DAMAGE_TRANSFER_TEMPLATE_ID = "active-melee-single-target-damage-transfer";
export declare const RANGED_DAMAGE_TRANSFER_TEMPLATE_ID = "active-ranged-single-target-damage-transfer";
/** Test hook. Production claims live for the session so a replay cannot heal twice. */
export declare function resetDamageTransferInstances(): void;
export declare function isDamageTransferTemplateId(templateId: unknown): boolean;
export declare function isDamageTransferPower(item: any): boolean;
/** A miss never transfers. The attack handler and the damage resolver both use this. */
export declare function damageTransferApplies(opts: {
    damageTransfer?: boolean;
    hit: boolean;
}): boolean;
type InstantAoeFlagBag = {
    aoeMeleeWeapon?: boolean | string;
    instantAoe?: boolean | string;
};
type SpecialOnlyFlagBag = {
    specialOnly?: boolean | string;
    templateId?: string | null;
    selectedPowerTemplateId?: string | null;
};
/**
 * Instant AoE (Melee / Ranged AoE Attack, AoE Special Attacks): one shared
 * Attack/Casting roll and — when damaging — one shared Damage Pool roll reused
 * for every hit. No Primary Target. Allies stay excluded by the AoE filter.
 *
 * Instant Damage AoE pools are Power Dice + Weapon (martial) or Spell Focus
 * (spell). Special-only AoEs have no Damage Pool.
 *
 * `aoeMeleeWeapon` is the legacy flag name; `instantAoe` is preferred.
 */
export declare function isInstantAoeFlags(flags: InstantAoeFlagBag | null | undefined): boolean;
/**
 * Canonical Special-only Active template ids (no direct damage axis).
 * Single source for radial options, Instant AoE flags, and damage gates —
 * do not re-implement with divergent string heuristics elsewhere.
 *
 * Covers:
 * - Instant Single-Special (ST): `active-*-instant-special-t[3-6]`
 * - Instant AoE Special (0 Power dice): `active-*-aoe-damage-t[3-6]`
 * - AoE Targeted Special (Exorcism/Requiem, no Power/Weapon/Focus damage)
 *
 * Does NOT cover Damage+Special (`active-*-damage-t*`), ST Targeted Special
 * (weapon damage), or Weapon AoE (shared Damage Pool).
 */
export declare function isSpecialOnlyTemplateId(templateId: unknown): boolean;
/**
 * Special-only Attacks never deal direct damage (no Power / Weapon / Spell Focus
 * dice, no Damage Roll / Dialog, no Combat Damage Raises, no Maximization).
 * On-hit Specials still apply; follow-up Special ticks (e.g. Ruin 4×X) are unchanged.
 */
export declare function isSpecialOnlyAttack(flags: (SpecialOnlyFlagBag & InstantAoeFlagBag) | null | undefined): boolean;
/**
 * Martial delivery includes weapon damage on single-target and Instant Damage
 * AoE. Spell delivery, Special-only Attacks, and an explicit ignore flag do not.
 * NPC spell rows are spell delivery.
 */
export declare function martialWeaponDamageApplies(flags: {
    ignoreWeaponDamage?: boolean;
    powerIsSpell?: boolean;
    npcIsSpell?: boolean;
    dragonHeadDamageBreath?: boolean;
} & InstantAoeFlagBag & SpecialOnlyFlagBag): boolean;
/**
 * Spell Focus dice apply to damaging Spells (single-target and Instant Damage
 * AoE). Special-only Attacks have no Damage Pool and never receive Spell Focus.
 */
export declare function spellFocusDamageApplies(flags: {
    isSpell?: boolean;
    isNpcAttackFlow?: boolean;
} & InstantAoeFlagBag & SpecialOnlyFlagBag): boolean;
/** Multiply only the leading printed Power Dice pool (never a following weapon term). */
export declare function multiplyPrintedPowerDice(formula: string, factor: number): string;
/** @deprecated Use multiplyPrintedPowerDice(formula, 2) — kept for callers mid-migration. */
export declare function doublePrintedPowerDice(formula: string): string;
/**
 * Limited ×4 applies only to printed Power Damage Dice.
 * Damage Transfer is never a legal Limited Power (Batch 5 C07) — no-op.
 */
export declare function applyLimitedToTransferPowerDamage(formula: string, _opts: {
    damageTransfer?: boolean;
    limited?: boolean;
}): string;
/**
 * Limited Instant Damage Attacks: ×4 printed Power Dice once.
 * Pass `alreadyMultiplied: true` when the formula / catalog row already stores
 * the Limited output so runtime does not apply ×4 again (no ×16).
 */
export declare function applyLimitedPowerDamage(formula: string, opts: {
    limited?: boolean;
    alreadyMultiplied?: boolean;
}): string;
/** Parse leading NdS count from a Power damage formula (`3d8`, `+3d8`). */
export declare function printedPowerDiceCount(formula: string): number;
export declare function settleDamageTransfer(opts: {
    enabled: boolean;
    attacker: any;
    realHpLost: number;
    instanceId?: string | null;
}): Promise<number>;
export {};
//# sourceMappingURL=damage-transfer.d.ts.map