/**
 * Schticks configuration for Mastery System
 * Schticks are small character traits/quirks chosen during character creation
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