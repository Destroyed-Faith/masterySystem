/**
 * Creation-tab highlights: every unfinished required tab glows at once.
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
function isTabPending(tab, state) {
    switch (tab) {
        case 'attributes':
            return !state.attributesDone;
        case 'echo':
            return !state.echoDone;
        case 'skills':
            return !state.skillsDone;
        case 'powers':
            return !state.powersDone;
        case 'equipment':
            return !state.equipmentReviewed;
        case 'disadvantages':
            return !state.disadvantagesDone;
    }
}
/** Every unfinished required tab. Empty when creation is done or every required tab is done. */
export function pendingCreationGuideTabs(state) {
    if (state.creationComplete)
        return [];
    return CREATION_GUIDE_TABS.filter((tab) => isTabPending(tab, state));
}
export function creationGuideFlags(state) {
    const pending = new Set(pendingCreationGuideTabs(state));
    return {
        attributes: pending.has('attributes'),
        echo: pending.has('echo'),
        skills: pending.has('skills'),
        powers: pending.has('powers'),
        equipment: pending.has('equipment'),
        disadvantages: pending.has('disadvantages'),
    };
}
//# sourceMappingURL=creation-tab-guide.js.map