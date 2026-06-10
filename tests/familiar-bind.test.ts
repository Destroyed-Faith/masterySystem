import { describe, it, expect } from 'vitest';
import {
  collectDraftStoneCounts,
  countDraftBoundStones,
  emptyFamiliarDraft,
  familiarStoneAssignments,
  validateFamiliarDraft,
  buildBoundFamiliarRecord,
} from '../src/stones/familiar-bind';

describe('familiar-bind', () => {
  it('counts draft bound stones including base, upgrades, and senses', () => {
    const draft = emptyFamiliarDraft();
    draft.name = 'Owl';
    draft.baseStoneAttr = 'resolve';
    draft.upgradeRows.push({ id: 'u1', attribute: 'might', pickA: 'hp', pickB: 'armor' });
    draft.sharedSight.enabled = true;
    draft.sharedSight.attribute = 'wits';
    expect(countDraftBoundStones(draft)).toBe(3);
    expect(collectDraftStoneCounts(draft)).toEqual({ resolve: 1, might: 1, wits: 1 });
  });

  it('validateFamiliarDraft requires name and base stone', () => {
    const draft = emptyFamiliarDraft();
    const v = validateFamiliarDraft(draft, 2, 0, { might: 2 });
    expect(v.canBind).toBe(false);
    expect(v.errors.some((e) => e.includes('Name'))).toBe(true);
    expect(v.errors.some((e) => e.includes('Base'))).toBe(true);
  });

  it('validateFamiliarDraft passes with sufficient pool stones', () => {
    const draft = emptyFamiliarDraft();
    draft.name = 'Cat';
    draft.baseStoneAttr = 'might';
    const v = validateFamiliarDraft(draft, 4, 0, { might: 2 });
    expect(v.canBind).toBe(true);
  });

  it('familiarStoneAssignments aggregates all bound attributes', () => {
    const draft = emptyFamiliarDraft();
    draft.name = 'Fox';
    draft.baseStoneAttr = 'vitality';
    draft.upgradeRows.push({ id: 'u1', attribute: 'might', pickA: 'evade', pickB: 'attack' });
    const record = buildBoundFamiliarRecord(draft, 'owner1', 'fam1', 3);
    expect(familiarStoneAssignments(record)).toEqual({ vitality: 1, might: 1 });
  });
});
