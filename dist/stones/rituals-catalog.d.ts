/**
 * Stone-Powers ritual catalogue — the **expansion** ritual list used by
 * the Stone-Powers dialog when GMs want a broader selection than the
 * canonical 11 rituals in the Players Guide (8961–9171).
 *
 * The Players Guide currently lists:
 *
 *   Detect Magic, Locate Object, Augury, Ward, Cleansing, Communion,
 *   Bind Familiar, Summoning, Translocation, Transformation, Illusion.
 *
 * Anything below that is **not** in the Players Guide (Identify,
 * Clairvoyance, Word of Recall, Greater Restoration, Commune,
 * Atonement, Dreamwalk, Last Light, Raise Dead, …) is GM-tier
 * **expansion content** preserved from earlier playtests. The runtime
 * source-of-truth for canon Rituals is `src/utils/rituals.ts`; this
 * file feeds the optional Stone-Powers extension dialog only.
 *
 * If a campaign wants to mirror the Players Guide exactly, set the
 * `mastery-system.useExpansionRituals` setting to `false` (the dialog
 * falls back to the canonical Rituals only).
 */
export type RitualPoolAttr = 'might' | 'agility' | 'vitality' | 'intellect' | 'resolve' | 'influence' | 'wits';
export type RitualSlotRule = {
    allow: RitualPoolAttr[];
};
export type RitualCatalogEntry = {
    id: string;
    name: string;
    slots: RitualSlotRule[];
    roll: string;
    duration: string;
    requirement: string;
    intro: string;
    raises: {
        label: string;
        text: string;
    }[];
    danger?: string;
    lore?: string;
};
export declare const STONE_RITUALS_CATALOG: RitualCatalogEntry[];
//# sourceMappingURL=rituals-catalog.d.ts.map