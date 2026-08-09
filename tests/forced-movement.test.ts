import { describe, expect, it } from 'vitest';
import {
  filterLegalForcedMoveKeys,
  isForcedMoveDistanceLegal,
  readPushPullMetersFromPower,
} from '../src/combat/forced-movement';

describe('forced movement distance rules', () => {
  it('Push allows only farther cells; Pull only closer', () => {
    expect(isForcedMoveDistanceLegal('push', 2, 3)).toBe(true);
    expect(isForcedMoveDistanceLegal('push', 2, 2)).toBe(false);
    expect(isForcedMoveDistanceLegal('push', 2, 1)).toBe(false);
    expect(isForcedMoveDistanceLegal('pull', 3, 1)).toBe(true);
    expect(isForcedMoveDistanceLegal('pull', 3, 3)).toBe(false);
    expect(isForcedMoveDistanceLegal('pull', 3, 4)).toBe(false);
  });

  it('filters candidate keys to away-only for Push', () => {
    // Layout (steps from ref at 0,0): origin is at dist 2.
    const dist: Record<string, number> = {
      '0,0': 0, // reference — blocked
      '1,0': 1, // closer — illegal for push
      '2,0': 2, // same — illegal
      '3,0': 3, // farther — legal
      '4,0': 4, // farther — legal
      '2,1': 2, // same ring — illegal
    };
    const legal = filterLegalForcedMoveKeys({
      mode: 'push',
      candidateKeys: Object.keys(dist),
      blockedKeys: new Set(['0,0']),
      originDistSteps: 2,
      distFromRefSteps: (k) => dist[k] ?? null,
    });
    expect([...legal].sort()).toEqual(['3,0', '4,0']);
  });

  it('filters candidate keys to toward-only for Pull', () => {
    const dist: Record<string, number> = {
      '0,0': 0,
      '1,0': 1,
      '2,0': 2,
      '3,0': 3,
    };
    const legal = filterLegalForcedMoveKeys({
      mode: 'pull',
      candidateKeys: Object.keys(dist),
      blockedKeys: new Set(['0,0']),
      originDistSteps: 3,
      distFromRefSteps: (k) => dist[k] ?? null,
    });
    expect([...legal].sort()).toEqual(['1,0', '2,0']);
  });
});

describe('readPushPullMetersFromPower', () => {
  it('reads structured specials and push(N) strings from the active level', () => {
    expect(
      readPushPullMetersFromPower({
        system: {
          rank: 2,
          specials: ['push(2)'],
          levels: {
            '2': { specials: [{ key: 'push', rank: 2 }] },
          },
        },
      }),
    ).toEqual({ push: 2, pull: 0 });

    expect(
      readPushPullMetersFromPower({
        system: {
          rank: 4,
          levels: {
            '4': {
              specials: [
                { key: 'push', rank: 4 },
                { key: 'pull', rank: 2 },
              ],
            },
          },
        },
      }),
    ).toEqual({ push: 4, pull: 2 });
  });

  it('ignores unrelated specials', () => {
    expect(
      readPushPullMetersFromPower({
        system: { specials: [{ key: 'slow', rank: 2 }, 'lacerate(1)'] },
      }),
    ).toEqual({ push: 0, pull: 0 });
  });
});
