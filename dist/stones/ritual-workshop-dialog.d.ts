/**
 * Ritual Workshop — Core Ritual catalogue + Named Tier / Raise Skill Check UI (DF 2026).
 * Lives on the character sheet Rituals tab (no extra window).
 */
declare const POOL_ATTRS: readonly ["might", "agility", "vitality", "intellect", "resolve", "influence", "wits"];
type PoolAttr = (typeof POOL_ATTRS)[number];
export declare class RitualWorkshopController {
    #private;
    actor: Actor;
    selectedId: string;
    /** Free-text description of how the Ritual is performed. */
    approach: string;
    /** Named tier 0–4 (Seal Passage Tier 4 = opening mode). */
    namedTier: number;
    /** Extra generic Raises beyond the named tier. */
    genericRaises: number;
    /** Source / task level; Base TN = 4 × max(3, level). */
    taskLevel: number;
    gmMod: number;
    attributeKey: PoolAttr;
    /** Selected Specialization key ('' = none). */
    specKey: string;
    placed: string[];
    uiScrollTop: number;
    private onRefresh;
    constructor(actor: Actor, opts: {
        onRefresh: () => void | Promise<void>;
        ritualId?: string;
    });
    select(ritualId: string): void;
    prepareContext(): Record<string, unknown>;
    bind(root: HTMLElement): void;
}
/** Open the character sheet on the Rituals tab (no floating dialog). */
export declare function showRitualWorkshopOnSheet(actor: Actor, ritualId?: string): Promise<void>;
/** @deprecated Use showRitualWorkshopOnSheet — kept for existing callers. */
export declare const RitualWorkshopDialog: {
    show: typeof showRitualWorkshopOnSheet;
};
export {};
//# sourceMappingURL=ritual-workshop-dialog.d.ts.map