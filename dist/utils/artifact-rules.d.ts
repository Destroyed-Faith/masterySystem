/**
 * Artifact Rules — canonical reference for the new Artifact spec.
 *
 * Sources: `D:\DestroyedFaith\Powers\Artefacts.md` and the Player's Guide
 * "Artifacts" / "Echo Artifacts" sections.
 *
 * This module is the single source of truth for:
 *   • The 7 canonical Equipment Slots.
 *   • Per-Slot Base Value limits (1–2 depending on slot).
 *   • Per-Slot allowed Attributes for Stone Functions.
 *   • Per-Slot Power Access restrictions (what slot may grant).
 *   • Artifact Level Stage mapping (Basic / Improved / Greater / Ultimate).
 *   • Default Power Level per Stage (PL 4 / 10 / 16).
 *   • All baseline scaling tables: weapon damage, thrown range, weapon
 *     specials, body armor bonus, no-armor evade, head minor armor,
 *     feet evade / movement, minor movement (Base Value B), passive
 *     reinforcement, save/ward support, stone function scaling, and so on.
 *
 * Everything in this file is pure data + pure helpers — no Foundry types,
 * no DOM, no item mutation. It is consumed by:
 *   • `src/utils/artifact-actor-rules.ts` (capacity / binding)
 *   • `src/artifacts/node-editor.ts` (builder UI constraints)
 *   • `src/artifacts/artifact-evolution-dialog.ts` (player progression)
 *   • `src/utils/echos/*` (echo-artifact authoring)
 *   • `src/documents/actor.ts` (combat-side base-value aggregation)
 */
/** The seven Equipment Slots defined by the new Artifact spec. */
export declare const ARTIFACT_SLOT_KEYS: readonly ["mainHand", "offHand", "bothHands", "body", "head", "feet", "amulet", "ring"];
export type ArtifactSlot = (typeof ARTIFACT_SLOT_KEYS)[number];
/** Display label for each artifact slot. */
export declare const ARTIFACT_SLOT_LABELS: Record<ArtifactSlot, string>;
/**
 * Map the canonical artifact slot key onto the legacy paperdoll slot key
 * (`src/utils/equip-slots.ts`). A two-handed artifact occupies two slots
 * (returns both keys).
 */
export declare const ARTIFACT_SLOT_TO_PAPERDOLL: Record<ArtifactSlot, string[]>;
/**
 * Inverse map — used by migrations to derive a canonical slot from
 * paperdoll keys. Accepts both the new canonical paperdoll keys AND
 * legacy keys (`helmet`, `chest`, `boot`, `necklace`, `ring1`, `ring2`)
 * for backward compatibility.
 */
export declare const PAPERDOLL_TO_ARTIFACT_SLOT: Record<string, ArtifactSlot>;
/**
 * The Base Profile of an artifact — what physical category it falls into.
 * Hand Artifacts have only three legal profiles per spec; other slots
 * use a single profile that matches the slot.
 */
export type ArtifactBaseProfile = 'oneHandedWeapon' | 'oneHandedWeaponRanged' | 'twoHandedWeapon' | 'twoHandedWeaponRanged' | 'shield' | 'bodyArmor' | 'noArmorBody' | 'robe' | 'headArmor' | 'feet' | 'amulet' | 'ring' | 'lantern' | 'custom';
/** Display label for each Base Profile. */
export declare const BASE_PROFILE_LABELS: Record<ArtifactBaseProfile, string>;
/** Profiles allowed for each canonical slot. */
export declare const BASE_PROFILES_BY_SLOT: Record<ArtifactSlot, ArtifactBaseProfile[]>;
/** Does this Base Profile occupy two hand slots (i.e. Main + Off)? */
export declare function isTwoHandedProfile(profile: ArtifactBaseProfile): boolean;
/**
 * Weapon basics (melee/ranged + hand count) implied by a weapon Base Profile.
 * Returns null for non-weapon profiles. The Base Profile is the single source
 * of truth that drives the weapon's `weaponType`/`hands` (and, downstream, the
 * range shown on the printable sheet and in the combat radial menu).
 */
export declare function weaponBasicsForProfile(profile: ArtifactBaseProfile | string): {
    weaponType: 'melee' | 'ranged';
    hands: number;
} | null;
/** Parse a weapon range string to metres; null when there is no real metre value. */
export declare function parseArtifactWeaponRangeMeters(raw: unknown): number | null;
/** Effective melee/ranged kind — `baseProfile` wins over stored `weaponType`. */
export declare function resolveArtifactWeaponKind(aw: {
    weaponType?: string;
} | null | undefined, baseProfile?: string | null): 'melee' | 'ranged';
/**
 * Unified weapon range for display (print sheet, item info) and combat.
 *   • Melee: 1 m, or 2 m with Reach.
 *   • Ranged: authored metre value if it parses, else 24 m base.
 * Junk per-level tables like "1,2,3,4,5,6,7,8" have no `m` suffix → 24 m.
 */
export declare function formatArtifactWeaponRangeDisplay(aw: {
    weaponType?: string;
    range?: unknown;
    innateAbilities?: unknown;
    specials?: unknown;
} | null | undefined, baseProfile?: string | null): {
    kind: 'melee' | 'ranged';
    label: string;
    meters: number;
};
/** Parse the leading d8 dice count from a value like "+5d8", "5d8", 5. */
export declare function parseSpellFocusDice(value: unknown): number;
/**
 * True when an artifact's `system` carries a Spell Focus Base Value. Such a
 * weapon adds its dice to Spell damage instead of dealing normal weapon damage.
 */
export declare function artifactSystemHasSpellFocus(system: any): boolean;
/** Total Spell Focus bonus dice (d8) authored on an artifact `system`. */
export declare function spellFocusDiceFromSystem(system: any): number;
/**
 * Max number of Base Values per slot per spec:
 *   Main Hand / Off Hand: 2
 *   Body: 1
 *   Head: 2
 *   Feet: 2
 *   Ring / Amulet: 1
 */
export declare const BASE_VALUE_LIMIT_BY_SLOT: Record<ArtifactSlot, number>;
/** Hard cap on Base Values per artifact regardless of slot. */
export declare const BASE_VALUE_HARD_CAP = 3;
export type ArtifactBaseValueType = 'weaponDamage' | 'spellFocus' | 'thrownRange' | 'weaponSpecial' | 'bodyArmor' | 'headArmor' | 'shieldValue' | 'evade' | 'movement' | 'sense' | 'minorFeature';
export declare const BASE_VALUE_TYPE_LABELS: Record<ArtifactBaseValueType, string>;
/** Stone Function variants per spec. */
export type ArtifactStoneFunctionKind = 'stonePowerSupport' | 'stonePool' | 'stoneRefresh' | 'stoneBattery';
export declare const STONE_FUNCTION_LABELS: Record<ArtifactStoneFunctionKind, string>;
/** Attributes allowed for an Artifact's Stone Function, keyed by slot. */
export declare const ATTRIBUTE_ACCESS_BY_SLOT: Record<ArtifactSlot, string[]>;
/** Stage of an artifact level (Basic / Improved / Greater / Ultimate). */
export type ArtifactStage = 'basic' | 'improved' | 'greater' | 'ultimate';
export declare const ARTIFACT_STAGE_LABELS: Record<ArtifactStage, string>;
/** Map artifact level (1–10) → Stage. */
export declare function getArtifactStageForLevel(level: number): ArtifactStage;
/** Default Power Level for a Power granted at this artifact level. */
export declare function getDefaultPowerLevelForArtifactLevel(level: number): number;
/** Spec maximum artifact level (Ultimate). */
export declare const ARTIFACT_MAX_LEVEL = 10;
export interface SlotPowerAccess {
    primary: string[];
    secondary: string[];
    notAllowed: string[];
}
export declare const SLOT_POWER_ACCESS: Record<ArtifactSlot, SlotPowerAccess>;
/** Weapon Damage Baseline — `NdN` where N = level. */
export declare function getWeaponDamageBaseline(level: number): string;
/** Thrown Range Baseline — m. */
export declare function getThrownRangeBaseline(level: number): number;
/** Body Armor Bonus from Artifact (+Armor on top of base mundane armor type). */
export declare function getBodyArmorBaselineBonus(level: number): number;
/** No-Armor Body Evade Bonus. */
export declare function getNoArmorBodyEvadeBaseline(level: number): number;
/** Feet Evade Baseline (Base Value A). */
export declare function getFeetEvadeBaseline(level: number): number;
/** Minor Armor Baseline (Head / Feet Base Value A). */
export declare function getMinorArmorBaseline(level: number): number;
/** Feet Movement scaling (Base Value A: walking/climbing/swim/tunnel speed). */
export declare function getFeetMovementBaseline(level: number): number;
/** Base Value B Minor Movement (additive; starts at L4). */
export declare function getMinorMovementBaselineB(level: number): number;
/** Base Value B Minor Flight / Safe Movement (reduced scaling). */
export declare function getMinorFlightBaselineB(level: number): number;
/** Weapon Special baseline value at a given level for high-value scaling specials. */
export interface WeaponSpecialBaseline {
    /** Penetration / Expose / Corrode / Push / Slow / Disrupt / Mark. */
    standard: number;
    /** Precision / Prone. */
    precision: number;
    /** Brutal Impact. */
    brutal: number;
}
export declare function getWeaponSpecialBaseline(level: number): WeaponSpecialBaseline;
/** Passive Reinforcement levels added by an Amulet/Ring at this artifact level. */
export declare function getPassiveReinforcementBaseline(level: number): number;
/** Active Buff Empowerment uses per Safe Haven Rest based on MR (ceil(MR/2)). */
export declare function getActiveBuffEmpowermentUsesPerRest(masteryRank: number): number;
/** Stone Power Support pre-fill tier at an artifact level. */
export declare function getStonePowerSupportPrefillTier(level: number): 0 | 2 | 3 | 4;
/** Stone Pool stored stones per Safe Haven Rest. */
export declare function getStonePoolStoredStones(level: number): number;
/** Stone Refresh stones restored per Safe Haven Rest. */
export declare function getStoneRefreshAmount(level: number): number;
/** Stone Battery capacity. */
export declare function getStoneBatteryCapacity(level: number): number;
/** Stone Power Cost Chain. Tier (1..4) → stones spent. */
export declare const STONE_POWER_COST_CHAIN: Record<1 | 2 | 3 | 4, number>;
/** True if the given slot can host the given Base Profile. */
export declare function isBaseProfileAllowedForSlot(slot: ArtifactSlot, profile: ArtifactBaseProfile): boolean;
/** True if the given Base Value type is generally allowed in the given slot. */
export declare function isBaseValueTypeAllowedForSlot(slot: ArtifactSlot, type: ArtifactBaseValueType): boolean;
/** True if the given Attribute (`might`, `agility`, …) is legal for this slot's Stone Function. */
export declare function isAttributeAllowedForStoneFunctionInSlot(slot: ArtifactSlot, attr: string): boolean;
/** Map an Artifact's canonical slot to the paperdoll slot keys it should occupy. */
export declare function getPaperdollSlotsForArtifact(slot: ArtifactSlot, baseProfile: ArtifactBaseProfile): string[];
//# sourceMappingURL=artifact-rules.d.ts.map