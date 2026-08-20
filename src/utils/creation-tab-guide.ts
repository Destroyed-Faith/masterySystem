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
] as const;

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

function isTabPending(tab: CreationGuideTab, state: CreationGuideState): boolean {
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
export function pendingCreationGuideTabs(state: CreationGuideState): CreationGuideTab[] {
  if (state.creationComplete) return [];
  return CREATION_GUIDE_TABS.filter((tab) => isTabPending(tab, state));
}

export function creationGuideFlags(state: CreationGuideState): CreationGuideFlags {
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
