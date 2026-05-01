/**
 * Schticks configuration for Mastery System.
 *
 * Players Guide ~3134+: Schticks are **purely cosmetic** character traits
 * — colour, quirks, narrative hooks. The base game grants `+1` Schtick per
 * Mastery Rank, and an *optional* extra Schtick may be purchased for 2
 * Mastery Points during character creation. They never grant mechanical
 * dice/HP/save bonuses, so the catalog must read as pure roleplay flavour.
 */
export interface SchtickDefinition {
    id: string;
    name: string;
    short: string;
    tags?: string[];
    relatedAttribute?: string;
}
export declare const SCHTICKS: SchtickDefinition[];
/**
 * Get all schticks
 */
export declare function getAllSchticks(): SchtickDefinition[];
/**
 * Get schtick by ID
 */
export declare function getSchtick(id: string): SchtickDefinition | undefined;
/**
 * Get schticks by attribute affinity
 */
export declare function getSchticksByAttribute(attribute: string): SchtickDefinition[];
//# sourceMappingURL=schticks.d.ts.map