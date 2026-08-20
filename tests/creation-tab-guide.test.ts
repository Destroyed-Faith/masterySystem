import { describe, expect, it } from 'vitest';
import { nextCreationGuideTab, type CreationGuideState } from '../src/utils/creation-tab-guide.js';

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

describe('nextCreationGuideTab', () => {
  it('returns null after creation is complete', () => {
    expect(nextCreationGuideTab(state({ creationComplete: true }))).toBeNull();
  });

  it('walks the required tabs in order and skips summons/rituals/minor magic', () => {
    expect(nextCreationGuideTab(state())).toBe('attributes');
    expect(nextCreationGuideTab(state({ attributesDone: true }))).toBe('echo');
    expect(nextCreationGuideTab(state({ attributesDone: true, echoDone: true }))).toBe('skills');
    expect(nextCreationGuideTab(state({ attributesDone: true, echoDone: true, skillsDone: true }))).toBe('powers');
    expect(
      nextCreationGuideTab(
        state({ attributesDone: true, echoDone: true, skillsDone: true, powersDone: true }),
      ),
    ).toBe('equipment');
    expect(
      nextCreationGuideTab(
        state({
          attributesDone: true,
          echoDone: true,
          skillsDone: true,
          powersDone: true,
          equipmentReviewed: true,
        }),
      ),
    ).toBe('disadvantages');
    expect(
      nextCreationGuideTab(
        state({
          attributesDone: true,
          echoDone: true,
          skillsDone: true,
          powersDone: true,
          equipmentReviewed: true,
          disadvantagesDone: true,
        }),
      ),
    ).toBeNull();
  });
});
