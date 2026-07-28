/**
 * Creature type helpers (Smite validity, NPC typing).
 *
 * Smite(X) adds +Xd8 bonus damage only vs Undead / Fiends (Rules).
 * NPCs set `system.creatureType`; aliases like "Dämon" / "demon" map to fiend.
 */
export declare const CREATURE_TYPE_OPTIONS: readonly [{
    readonly value: "";
    readonly label: "— Creature Type —";
}, {
    readonly value: "humanoid";
    readonly label: "Humanoid";
}, {
    readonly value: "undead";
    readonly label: "Undead";
}, {
    readonly value: "fiend";
    readonly label: "Dämon / Fiend";
}, {
    readonly value: "beast";
    readonly label: "Beast";
}, {
    readonly value: "construct";
    readonly label: "Construct";
}, {
    readonly value: "elemental";
    readonly label: "Elemental";
}, {
    readonly value: "other";
    readonly label: "Other";
}];
export type CreatureTypeValue = (typeof CREATURE_TYPE_OPTIONS)[number]['value'];
/** Normalize free-text / sheet values to a canonical creature-type key. */
export declare function resolveCreatureType(actor: {
    system?: any;
} | null | undefined): string;
/** True when Smite(X) bonus damage applies (Undead or Fiend). */
export declare function isSmiteValidTarget(actor: {
    system?: any;
} | null | undefined): boolean;
/**
 * Sum Smite(X) ranks from special effect strings (e.g. "Smite(8)").
 * Instant rider — not a lasting status.
 */
export declare function extractSmiteDice(specialStrings: readonly string[]): number;
/** Drop Smite entries so they are not written as lasting status effects. */
export declare function stripSmiteSpecials(specialStrings: readonly string[]): string[];
//# sourceMappingURL=creature-type.d.ts.map