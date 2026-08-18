/**
 * Stone-Powers Rituals tab — same catalog as Perform Ritual.
 * Any Stone color may pay; slots accept every pool attribute.
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