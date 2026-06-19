/**
 * Artifact Base Values → Actor Combat Stats aggregator
 *
 * Walks an actor's embedded artifact items and contributes the numeric
 * Base Values defined by the new Artifact spec (Artefacts.md) onto the
 * actor's derived combat stats.
 *
 * Only **equipped** artifacts contribute. An artifact is considered equipped
 * when:
 *   - `system.equipped === true`, OR
 *   - the mastery-system equipment flag is non-empty with a slot, OR
 *   - the artifact is echo-bound (echo-bound artifacts are intrinsic and
 *     always count).
 *
 * Contributions are returned as a structured breakdown so the character
 * sheet can show "Artifact: X" rows alongside Armor / Shield / Mechanics
 * / Manual rows.
 *
 * Slot-typed Base Value handling (per the spec):
 *   • mainHand / offHand → not aggregated here (weapon damage etc. is
 *     read by the damage roll pipeline directly from `baseValues`).
 *   • body                → armorBonus (always), or evade (only when no
 *                            body armor is equipped — "No-Armor Body Evade").
 *   • head                → headArmor (treated as additional armor).
 *   • feet                → movementBonus (m), evade baseline,
 *                            minorArmor (treated as armor).
 *   • amulet / ring        → minorArmor, evade, sense (informational).
 *
 * `sense` and `minorFeature` Base Values are exposed as informational
 * `notes` rows on the breakdown but do not modify combat numbers.
 */
import { type ArtifactBodyArmorClassPenalty, type ArmorWeightClass } from './artifact-armor-weight.js';
import type { ArtifactBaseValueType } from '../types/item.js';
export interface ArtifactStatContribution {
    /** Where the contribution comes from — usually the artifact item name. */
    source: string;
    /** Base Value type that produced the contribution. */
    type: ArtifactBaseValueType;
    /** Numeric value applied to the actor stat (0 if non-numeric). */
    value: number;
    /** Optional GM-facing label (e.g. "Slot A · Tremorsense"). */
    label?: string;
    /** Resolved weight class when this row is body armor. */
    armorWeightClass?: 'light' | 'medium' | 'heavy';
    baseArmor?: number;
    bonusArmor?: number;
    typeLabel?: string;
}
export interface ArtifactBaseValueBreakdown {
    /** Sum into `system.combat.armorTotal`. */
    armorBonus: number;
    /** Sum into `system.combat.evadeTotal`. */
    evadeBonus: number;
    /** Sum into a new `system.combat.artifactMovementBonus` (meters). */
    movementBonus: number;
    /** Sum into a new `system.combat.headArmor`. */
    headArmor: number;
    /** Sum into `system.combat.armorTotal` ("Minor Armor"). */
    minorArmor: number;
    /** Total Spell Focus bonus dice (d8) from equipped weapon-slot artifacts. */
    spellFocusBonusDice: number;
    /** Per-stat breakdown rows (for the sheet). */
    rows: {
        armor: ArtifactStatContribution[];
        evade: ArtifactStatContribution[];
        movement: ArtifactStatContribution[];
        headArmor: ArtifactStatContribution[];
        minorArmor: ArtifactStatContribution[];
        notes: ArtifactStatContribution[];
    };
    /** Drawbacks from equipped body artifact armor class (Medium / Heavy). */
    bodyArmorClassPenalty: ArtifactBodyArmorClassPenalty | null;
    /** Weight class of the primary body artifact armor (includes Light). */
    bodyArmorClassInfo: {
        weightClass: ArmorWeightClass;
        typeLabel: string;
        source: string;
    } | null;
}
/**
 * Aggregate Base Values from all equipped artifacts on the actor.
 * Pure function — never mutates the actor.
 */
export declare function buildArtifactBaseValueBreakdown(actor: any): ArtifactBaseValueBreakdown;
/**
 * Total Spell Focus bonus dice (d8) the actor's equipped weapon-slot artifacts
 * add to Spell damage. Cheap convenience wrapper around the full breakdown.
 */
export declare function getActorSpellFocusBonusDice(actor: any): number;
//# sourceMappingURL=artifact-base-values.d.ts.map