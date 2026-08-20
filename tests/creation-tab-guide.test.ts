import { describe, expect, it } from 'vitest';
import {
  creationGuideFlags,
  pendingCreationGuideTabs,
  type CreationGuideState,
} from '../src/utils/creation-tab-guide.js';

function state(overrides: Partial<CreationGuideState> = {}): CreationGuideState {
  return {
    creationComplete: false,
    attributesDone: false,
    echoDone: false,
    skillsDone: false,
    powersDone: false,
    equipmentReviewed: false,
    disadvantagesDone: false,
    ...overrides,
  };
}

describe('pendingCreationGuideTabs', () => {
  it('returns no tabs after creation is complete', () => {
    expect(pendingCreationGuideTabs(state({ creationComplete: true }))).toEqual([]);
  });

  it('highlights every unfinished required tab, including Equipment and Disadvantages', () => {
    expect(pendingCreationGuideTabs(state())).toEqual([
      'attributes',
      'echo',
      'skills',
      'powers',
      'equipment',
      'disadvantages',
    ]);
  });

  it('drops a tab once that step is done and never hints summons/rituals/minor magic', () => {
    expect(pendingCreationGuideTabs(state({ attributesDone: true }))).toEqual([
      'echo',
      'skills',
      'powers',
      'equipment',
      'disadvantages',
    ]);
    expect(
      pendingCreationGuideTabs(
        state({
          attributesDone: true,
          echoDone: true,
          skillsDone: true,
          powersDone: true,
        }),
      ),
    ).toEqual(['equipment', 'disadvantages']);
    expect(
      pendingCreationGuideTabs(
        state({
          attributesDone: true,
          echoDone: true,
          skillsDone: true,
          powersDone: true,
          equipmentReviewed: true,
        }),
      ),
    ).toEqual(['disadvantages']);
    expect(
      pendingCreationGuideTabs(
        state({
          attributesDone: true,
          echoDone: true,
          skillsDone: true,
          powersDone: true,
          equipmentReviewed: true,
          disadvantagesDone: true,
        }),
      ),
    ).toEqual([]);
  });
});

describe('creationGuideFlags', () => {
  it('flags Equipment and Disadvantages while they are still open', () => {
    expect(creationGuideFlags(state()).equipment).toBe(true);
    expect(creationGuideFlags(state()).disadvantages).toBe(true);
    expect(creationGuideFlags(state({ equipmentReviewed: true })).equipment).toBe(false);
    expect(creationGuideFlags(state({ disadvantagesDone: true })).disadvantages).toBe(false);
  });
});
