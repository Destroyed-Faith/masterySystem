import { describe, expect, it } from 'vitest';
import {
  filterKeysBlockedByWalls,
  filterLegalForcedMoveKeys,
  isForcedMoveDistanceLegal,
  isMoveRayBlockedByWall,
  parsePushPullMetersFromLine,
  readPushPullMetersFromPower,
  readPushPullMetersFromSpecialLines,
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

describe('readPushPullMetersFromSpecialLines', () => {
  it('parses Push(N) / Pull(N) from damage specialsUsed lines', () => {
    expect(parsePushPullMetersFromLine('Push(4)')).toEqual({ push: 4, pull: 0 });
    expect(parsePushPullMetersFromLine('Pull(2)')).toEqual({ push: 0, pull: 2 });
    expect(parsePushPullMetersFromLine('Lacerate(3)')).toEqual({ push: 0, pull: 0 });
    expect(
      readPushPullMetersFromSpecialLines([
        'Push(4)',
        'Slow(2)',
        'Pull(2)',
        'Hex(3) vulnerability: 2d8',
      ]),
    ).toEqual({ push: 4, pull: 2 });
  });

  it('keeps the highest metre value when several Push lines appear', () => {
    expect(readPushPullMetersFromSpecialLines(['Push(2)', 'Push(6)', 'push(4)'])).toEqual({
      push: 6,
      pull: 0,
    });
  });
});

describe('filterKeysBlockedByWalls', () => {
  it('drops cells whose center→origin ray is blocked', () => {
    const centers: Record<string, { x: number; y: number }> = {
      '1,0': { x: 100, y: 0 },
      '2,0': { x: 200, y: 0 },
      '3,0': { x: 300, y: 0 },
    };
    // Wall between origin and 2,0 / 3,0 — only 1,0 is open.
    const blocked = filterKeysBlockedByWalls({
      candidateKeys: Object.keys(centers),
      originCenter: { x: 0, y: 0 },
      cellCenterFromKey: (k) => centers[k] ?? null,
      testCollision: (_a, b) => b.x >= 150,
    });
    expect([...blocked].sort()).toEqual(['1,0']);
  });

  it('isMoveRayBlockedByWall respects an injected collision predicate', () => {
    expect(
      isMoveRayBlockedByWall({ x: 0, y: 0 }, { x: 10, y: 0 }, () => true),
    ).toBe(true);
    expect(
      isMoveRayBlockedByWall({ x: 0, y: 0 }, { x: 10, y: 0 }, () => false),
    ).toBe(false);
  });
});
