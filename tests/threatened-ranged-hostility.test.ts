import { describe, it, expect, beforeEach } from 'vitest';
import {
  tokenIsHostileTo,
  distanceBetweenTokenEdgesMeters,
  enemyThreatensRangedShooter,
} from '../src/combat/threatened-ranged.js';

describe('tokenIsHostileTo', () => {
  beforeEach(() => {
    (globalThis as any).CONST = {
      TOKEN_DISPOSITIONS: { HOSTILE: -1, NEUTRAL: 0, FRIENDLY: 1, SECRET: -2 },
    };
  });

  it('treats friendly PC vs hostile NPC as hostile both ways', () => {
    const pc = { disposition: 1 };
    const npc = { disposition: -1 };
    expect(tokenIsHostileTo(pc, npc)).toBe(true);
    expect(tokenIsHostileTo(npc, pc)).toBe(true);
  });

  it('does not treat same-side tokens as hostile', () => {
    expect(tokenIsHostileTo({ disposition: -1 }, { disposition: -1 })).toBe(false);
    expect(tokenIsHostileTo({ disposition: 1 }, { disposition: 1 })).toBe(false);
  });

  it('reads disposition from document when present', () => {
    const shooter = { document: { disposition: -1 } };
    const other = { document: { disposition: 1 } };
    expect(tokenIsHostileTo(shooter, other)).toBe(true);
  });

  it('falls back to player-owner XOR when disposition is neutral', () => {
    const npc = {
      disposition: 0,
      actor: { hasPlayerOwner: false },
      document: { disposition: 0, hasPlayerOwner: false },
    };
    const pc = {
      disposition: 0,
      actor: { hasPlayerOwner: true },
      document: { disposition: 0, hasPlayerOwner: true },
    };
    expect(tokenIsHostileTo(npc, pc)).toBe(true);
    expect(tokenIsHostileTo(pc, npc)).toBe(true);
  });
});

describe('melee edge distance', () => {
  beforeEach(() => {
    (globalThis as any).canvas = {
      grid: { size: 100, distance: 2, measurePath: undefined },
    };
  });

  it('treats orthogonally adjacent medium tokens as in 2 m reach via edges', () => {
    // Centers 2 m apart on a 2 m grid; edge distance ≈ 0.
    const a = {
      center: { x: 50, y: 50 },
      document: { width: 1 },
      actor: { system: { mastery: { rank: 2 } }, items: [] },
    };
    const b = {
      center: { x: 150, y: 50 },
      document: { width: 1 },
      actor: { system: { mastery: { rank: 2 } }, items: [] },
    };
    const edge = distanceBetweenTokenEdgesMeters(a, b);
    expect(edge).toBeLessThanOrEqual(0.05);
    expect(enemyThreatensRangedShooter(a, b)).toBe(true);
  });
});

describe('dodge-stance radial prefs', () => {
  it('is not a standard radial maneuver anymore', async () => {
    const { RADIAL_STANDARD_MANEUVER_IDS } = await import('../src/utils/radial-maneuver-prefs.js');
    expect(RADIAL_STANDARD_MANEUVER_IDS).not.toContain('dodge-stance');
    expect(RADIAL_STANDARD_MANEUVER_IDS).toContain('parry-stance');
  });
});
