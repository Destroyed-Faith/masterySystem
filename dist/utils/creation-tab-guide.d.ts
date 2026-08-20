/**
 * Creation-tab highlights: every unfinished required tab glows at once.
 * Summons, Rituals, and Minor Magic are in-play tabs and never hinted.
 */
export declare const CREATION_GUIDE_TABS: readonly ["attributes", "echo", "skills", "powers", "equipment", "disadvantages"];
export type CreationGuideTab = (typeof CREATION_GUIDE_TABS)[number];
export interface CreationGuideState {
    creationComplete: boolean;
    attributesDone: boolean;
    echoDone: boolean;
    skillsDone: boolean;
    powersDone: boolean;
    equipmentReviewed: boolean;
    disadvantagesDone: boolean;
}
export type CreationGuideFlags = Record<CreationGuideTab, boolean>;
/** Every unfinished required tab. Empty when creation is done or every required tab is done. */
export declare function pendingCreationGuideTabs(state: CreationGuideState): CreationGuideTab[];
export declare function creationGuideFlags(state: CreationGuideState): CreationGuideFlags;
//# sourceMappingURL=creation-tab-guide.d.ts.map