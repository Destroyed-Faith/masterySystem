/**
 * UI colors for attribute stone gems / pools (Player-facing names in German notes).
 * Game keys: might, agility, vitality, intellect, resolve, influence; optional separate `wits` pool on the sheet.
 */
export type StonePoolAttributeKey = 'might' | 'agility' | 'vitality' | 'intellect' | 'resolve' | 'influence' | 'wits';
export interface StoneAttributeGemStyle {
    /** Main gem / fill color */
    fill: string;
    /** Rim / highlight stroke */
    stroke: string;
}
/**
 * Farben laut Spielleitung:
 * Might schwarz, Agility grün, Vitality rot, Intelligence blau, Resolve lila,
 * Intellect orange, Wits gelb.
 * Im System: ein Pool `intellect` → Füllung orange, Rand blau.
 * `influence` → Wits gelb.
 * Separater Pool `wits` (falls am Bogen vorhanden): helleres Gelb.
 */
export declare const STONE_ATTRIBUTE_GEM_STYLES: Record<StonePoolAttributeKey, StoneAttributeGemStyle>;
export declare function getStoneGemStyle(key: string): StoneAttributeGemStyle | undefined;
//# sourceMappingURL=stone-attribute-ui.d.ts.map