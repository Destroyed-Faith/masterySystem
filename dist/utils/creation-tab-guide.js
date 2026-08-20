/**
 * Sequential creation-tab highlight: only the next unfinished required tab glows.
 * Summons, Rituals, and Minor Magic are in-play tabs and never hinted.
 */
export const CREATION_GUIDE_TABS = [
    'attributes',
    'echo',
    'skills',
    'powers',
    'equipment',
    'disadvantages',
];
/** First unfinished creation tab, or null when creation is done or every required tab is done. */
export function nextCreationGuideTab(state) {
    if (state.creationComplete)
        return null;
    if (!state.attributesDone)
        return 'attributes';
    if (!state.echoDone)
        return 'echo';
    if (!state.skillsDone)
        return 'skills';
    if (!state.powersDone)
        return 'powers';
    if (!state.equipmentReviewed)
        return 'equipment';
    if (!state.disadvantagesDone)
        return 'disadvantages';
    return null;
}
//# sourceMappingURL=creation-tab-guide.js.map