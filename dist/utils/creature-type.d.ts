/**
 * Creature type helpers (Exorcism / Requiem validity, NPC typing).
 *
 * Exorcism(X) applies only to Fiends; Requiem(X) only to Undead (Rules).
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
/** True when Exorcism(X) may be applied (Fiend only). */
export declare function isExorcismValidTarget(actor: {
    system?: any;
} | null | undefined): boolean;
/** True when Requiem(X) may be applied (Undead only). */
export declare function isRequiemValidTarget(actor: {
    system?: any;
} | null | undefined): boolean;
/** Tag gate for a targeted Special id (`exorcism` / `requiem`). */
export declare function isTargetedSpecialValidTarget(specialId: string, actor: {
    system?: any;
} | null | undefined): boolean;
//# sourceMappingURL=creature-type.d.ts.map