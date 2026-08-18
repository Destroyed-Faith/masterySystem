/**
 * Creature type catalog (NPC + Summon). No free text — pick from this list.
 *
 * Exorcism(X) applies only to Fiends; Requiem(X) only to Undead (Rules).
 */
export declare const CREATURE_TYPE_OPTIONS: readonly [{
    readonly value: "";
    readonly label: "— Creature Type —";
}, {
    readonly value: "humanoid";
    readonly label: "Humanoid";
}, {
    readonly value: "beast";
    readonly label: "Beast";
}, {
    readonly value: "spirit";
    readonly label: "Spirit";
}, {
    readonly value: "undead";
    readonly label: "Undead";
}, {
    readonly value: "fiend";
    readonly label: "Fiend";
}, {
    readonly value: "construct";
    readonly label: "Construct";
}, {
    readonly value: "elemental";
    readonly label: "Elemental";
}, {
    readonly value: "plant";
    readonly label: "Plant";
}, {
    readonly value: "dragon";
    readonly label: "Dragon";
}, {
    readonly value: "celestial";
    readonly label: "Celestial";
}, {
    readonly value: "other";
    readonly label: "Other";
}];
export type CreatureTypeValue = (typeof CREATURE_TYPE_OPTIONS)[number]['value'];
export declare function isCreatureTypeKey(value: string): value is Exclude<CreatureTypeValue, ''>;
export declare function creatureTypeLabel(value: string | null | undefined): string;
export declare function creatureTypeSelectOptions(selected?: string | null): Array<{
    value: string;
    label: string;
    selected: boolean;
}>;
/** Map a stored key or leftover free-text to a catalog key. */
export declare function normalizeCreatureTypeValue(raw: string | null | undefined): CreatureTypeValue;
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