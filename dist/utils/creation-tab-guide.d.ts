/**
 * Sequential creation-tab highlight: only the next unfinished required tab glows.
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
/** First unfinished creation tab, or null when creation is done or every required tab is done. */
export declare function nextCreationGuideTab(state: CreationGuideState): CreationGuideTab | null;
//# sourceMappingURL=creation-tab-guide.d.ts.map