import { describe, expect, it } from 'vitest';
import {
  visibleAbilityRows,
  progressionSlotIndex,
  isUltimateProgressionRow,
} from '../src/utils/artifact-visible-abilities.js';
import type { ArtifactLevelProgressionRow } from '../src/types/item.js';

const DRAGON_HEAD_ROWS: ArtifactLevelProgressionRow[] = [
  { level: 1, name: 'Breath Weapon I', type: 'Active', effect: 'a' },
  { level: 2, name: 'Draconic Roar I', type: 'Active Buff', effect: 'b' },
  { level: 3, name: 'Draconic Recovery I', type: 'Stone Refresh', effect: 'c' },
  { level: 4, name: 'Breath Weapon II', type: 'Active', effect: 'a2' },
  { level: 5, name: 'Draconic Roar II', type: 'Active Buff', effect: 'b2' },
  { level: 6, name: 'Draconic Recovery II', type: 'Stone Refresh', effect: 'c2' },
  { level: 7, name: 'Breath Weapon III', type: 'Active', effect: 'a3' },
  { level: 8, name: 'Draconic Roar III', type: 'Active Buff', effect: 'b3' },
  { level: 9, name: 'Draconic Recovery III', type: 'Stone Refresh', effect: 'c3' },
  { level: 10, name: 'True Dragon Head', type: 'Ultimate', effect: 'ult' },
];

describe('artifact-visible-abilities', () => {
  it('maps staged rows to pick slots 0..2', () => {
    expect(progressionSlotIndex({ level: 1, name: '', type: '' })).toBe(0);
    expect(progressionSlotIndex({ level: 4, name: '', type: '' })).toBe(0);
    expect(progressionSlotIndex({ level: 2, name: '', type: '' })).toBe(1);
    expect(progressionSlotIndex({ level: 5, name: '', type: '' })).toBe(1);
    expect(progressionSlotIndex({ level: 3, name: '', type: '' })).toBe(2);
  });

  it('detects level-10 ultimate rows', () => {
    expect(isUltimateProgressionRow({ level: 10, name: 'True Dragon Head', type: 'Ultimate' })).toBe(true);
    expect(isUltimateProgressionRow({ level: 4, name: 'Breath II', type: 'Active' })).toBe(false);
  });

  it('shows 1 / 2 / 3 abilities by unlock level', () => {
    expect(visibleAbilityRows(DRAGON_HEAD_ROWS, 1).map((r) => r.name)).toEqual(['Breath Weapon I']);
    expect(visibleAbilityRows(DRAGON_HEAD_ROWS, 2).map((r) => r.name)).toEqual([
      'Breath Weapon I',
      'Draconic Roar I',
    ]);
    expect(visibleAbilityRows(DRAGON_HEAD_ROWS, 3).map((r) => r.name)).toEqual([
      'Breath Weapon I',
      'Draconic Roar I',
      'Draconic Recovery I',
    ]);
  });

  it('upgrades slots in place without adding a fourth row', () => {
    expect(visibleAbilityRows(DRAGON_HEAD_ROWS, 5).map((r) => r.name)).toEqual([
      'Breath Weapon II',
      'Draconic Roar II',
      'Draconic Recovery I',
    ]);
    expect(visibleAbilityRows(DRAGON_HEAD_ROWS, 9).map((r) => r.name)).toEqual([
      'Breath Weapon III',
      'Draconic Roar III',
      'Draconic Recovery III',
    ]);
    expect(visibleAbilityRows(DRAGON_HEAD_ROWS, 9)).toHaveLength(3);
  });

  it('appends the ultimate only at level 10', () => {
    expect(visibleAbilityRows(DRAGON_HEAD_ROWS, 9).some((r) => r.type === 'Ultimate')).toBe(false);
    const l10 = visibleAbilityRows(DRAGON_HEAD_ROWS, 10);
    expect(l10).toHaveLength(4);
    expect(l10[l10.length - 1].name).toBe('True Dragon Head');
  });
});
