/**
 * Unified Artifact Delivery Damage.
 *
 * Canonical rule: an Artifact may support any Delivery its wielder already
 * has. Form, equipment slot, weapon classification, and Spell Focus
 * classification do not gate Delivery eligibility for Artifacts.
 *
 * When an Artifact provides eligible delivery damage, that contribution
 * applies once for the selected Delivery — never as both Weapon Damage and
 * Spell Focus on the same attack.
 *
 * Preference when both Base Values exist on one Artifact:
 *   Martial → Weapon Damage (fallback: Spell Focus as Nd8)
 *   Spell   → Spell Focus   (fallback: Weapon Damage dice)
 *
 * Mundane equipment is unchanged; callers must keep mundane paths separate.
 * Special-only Attacks never receive delivery damage (enforced by callers via
 * martialWeaponDamageApplies / spellFocusDamageApplies).
 */
export type ArtifactDeliveryKind = 'martial' | 'spell';
export type ArtifactDeliveryDamageSource = {
    name: string;
    dice: number;
    formula: string;
    kind: 'weaponDamage' | 'spellFocus';
    itemId?: string;
};
/** Leading Nd8 count from a damage formula (`5d8`, `+5d8`, bare `5`). */
export declare function parseNd8DiceCount(formula: unknown): number;
/**
 * Authored / derived Weapon Damage dice on an Artifact item (0 when none).
 * Does not invent damage for Focus-only gear.
 */
export declare function resolveArtifactItemWeaponDamageDice(item: any): number;
/** Nd8 formula for Artifact Weapon Damage, or '' when the Artifact has none. */
export declare function resolveArtifactItemWeaponDamageFormula(item: any): string;
/**
 * One Artifact → one delivery contribution for the selected Delivery.
 * Returns null when the Artifact grants no delivery damage.
 *
 * Artifact Damage Only (2026-11-19): a printed Artifact Damage / Weapon Damage
 * value is the complete contribution for Martial or Spell. Prefer that over a
 * separate Spell Focus row on the same Artifact so WD+SF never stack. Focus-only
 * Artifacts still contribute their Focus dice to either Delivery.
 */
export declare function resolveArtifactItemDeliveryContribution(item: any, delivery: ArtifactDeliveryKind): ArtifactDeliveryDamageSource | null;
/**
 * Pick at most one Artifact Damage source for a Damage Roll (highest dice).
 * Callers must not sum multiple Artifact contributions onto one roll.
 */
export declare function selectPrimaryArtifactDeliverySource(actor: any, delivery: ArtifactDeliveryKind): ArtifactDeliveryDamageSource | null;
/**
 * Martial formula for a resolved Artifact weapon (including Focus-only fallback).
 * Returns null when the item is not an Artifact or grants no delivery damage.
 */
export declare function resolveMartialArtifactWeaponFormula(weaponOrArtifact: any): string | null;
/**
 * Equipped Artifacts' delivery contributions for the selected Delivery.
 * Each Artifact contributes at most once.
 */
export declare function listArtifactDeliveryDamageSources(actor: any, delivery: ArtifactDeliveryKind): ArtifactDeliveryDamageSource[];
export declare function sumArtifactDeliveryDice(actor: any, delivery: ArtifactDeliveryKind): number;
/**
 * Spell delivery damage sources: at most one Artifact contribution, else mundane
 * weapons that print a Spell Focus (+Xd8) innate (unchanged mundane path).
 * Artifact Damage never stacks with a second Artifact or mundane Focus on the
 * same roll.
 */
export declare function listSpellDeliveryDamageSources(actor: any): Array<{
    name: string;
    dice: number;
}>;
export declare function getSpellDeliveryBonusDice(actor: any): number;
//# sourceMappingURL=artifact-delivery-damage.d.ts.map