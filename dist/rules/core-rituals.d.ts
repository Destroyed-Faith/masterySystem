/**
 * Sixteen Core Rituals — universal access from character creation.
 */
export interface CoreRitualDefinition {
    id: string;
    name: string;
    tagline: string;
    time: string;
    baseTnNote: string;
    effectDuration: string;
    requirement: string;
    exampleApproaches: string;
    tiers: Record<0 | 1 | 2 | 3 | 4, string>;
    limits: string;
    danger: string;
}
export declare const CORE_RITUALS: readonly CoreRitualDefinition[];
export declare function findCoreRitual(id: string): CoreRitualDefinition | undefined;
export declare function listCoreRitualIds(): string[];
/** Normalize legacy `ritual-*` ids to Core Ritual ids. */
export declare function normalizeCoreRitualId(id: string): string;
/** Look up a Core Ritual by current or legacy id. */
export declare function getCoreRitualById(id: string): CoreRitualDefinition | undefined;
/** Seal Passage Raise 4 is an alternate mode (JSON tier 4 is intentionally empty). */
export declare const SEAL_PASSAGE_ID = "seal-passage";
export declare const SEAL_PASSAGE_OPEN_MODE_TEXT: string;
export declare function isSealPassage(ritualOrId: CoreRitualDefinition | string): boolean;
/** Strip the light markdown (`**bold**`, trailing `---`) used in the rules JSON. */
export declare function stripRitualMarkdown(text: string): string;
/** Plain-text effect for a named tier (0–4), with the Seal Passage Raise 4 alternate mode. */
export declare function coreRitualTierText(ritual: CoreRitualDefinition, tier: number): string;
//# sourceMappingURL=core-rituals.d.ts.map