import { describe, it, expect, beforeEach } from 'vitest';
import {
  tokenIsHostileTo,
  isPlayerCombatantToken,
  distanceBetweenTokenEdgesMeters,
  enemyThreatensRangedShooter,
  tokensAreGridAdjacent,
} from '../src/combat/threatened-ranged.js';

describe('tokenIsHostileTo / isPlayerCombatantToken', () => {
  beforeEach(() => {
    (globalThis as any).CONST = {
      TOKEN_DISPOSITIONS: { HOSTILE: -1, NEUTRAL: 0, FRIENDLY: 1, SECRET: -2 },
    };
    (globalThis as any).game = { users: { get: () => null } };
  });

  it('treats friendly PC vs hostile NPC as hostile both ways', () => {
    const pc = { disposition: 1, actor: { type: 'character' } };
    const npc = { disposition: -1, actor: { type: 'npc' } };
    expect(tokenIsHostileTo(pc, npc)).toBe(true);
    expect(tokenIsHostileTo(npc, pc)).toBe(true);
  });

  it('treats FRIENDLY Dummy NPC vs FRIENDLY PC as opposing (Threatened Ranged)', () => {
    // Common GM setup: Dummy token disposition = Friendly for easy control.
    const dummy = {
      disposition: 1,
      document: { disposition: 1 },
      actor: { type: 'npc', hasPlayerOwner: false },
    };
    const alaris = {
      disposition: 1,
      document: { disposition: 1 },
      actor: { type: 'character', hasPlayerOwner: true },
    };
    expect(isPlayerCombatantToken(dummy)).toBe(false);
    expect(isPlayerCombatantToken(alaris)).toBe(true);
    expect(tokenIsHostileTo(dummy, alaris)).toBe(true);
    expect(tokenIsHostileTo(alaris, dummy)).toBe(true);
  });

  it('does not treat two PCs as hostile', () => {
    const a = { disposition: 1, actor: { type: 'character' } };
    const b = { disposition: 1, actor: { type: 'character' } };
    expect(tokenIsHostileTo(a, b)).toBe(false);
  });

  it('does not treat two NPCs with same disposition as hostile', () => {
    expect(
      tokenIsHostileTo(
        { disposition: -1, actor: { type: 'npc' } },
        { disposition: -1, actor: { type: 'npc' } },
      ),
    ).toBe(false);
  });
});

describe('melee edge distance + grid adjacency', () => {
  beforeEach(() => {
    (globalThis as any).canvas = {
      grid: { size: 100, distance: 2, measurePath: undefined },
    };
  });

  it('treats orthogonally adjacent medium tokens as in 2 m reach via edges', () => {
    const a = {
      center: { x: 50, y: 50 },
      document: { width: 1, height: 1, x: 0, y: 0 },
      actor: { type: 'npc', system: { mastery: { rank: 2 } }, items: [] },
    };
    const b = {
      center: { x: 150, y: 50 },
      document: { width: 1, height: 1, x: 100, y: 0 },
      actor: { type: 'character', system: { mastery: { rank: 2 } }, items: [] },
    };
    const edge = distanceBetweenTokenEdgesMeters(a, b);
    expect(edge).toBeLessThanOrEqual(0.05);
    expect(tokensAreGridAdjacent(a, b)).toBe(true);
    expect(enemyThreatensRangedShooter(a, b)).toBe(true);
  });

  it('treats diagonally adjacent tokens as engaged via grid adjacency', () => {
    const a = {
      center: { x: 50, y: 50 },
      document: { width: 1, height: 1, x: 0, y: 0 },
      actor: { type: 'npc', system: { mastery: { rank: 2 } }, items: [] },
    };
    const b = {
      center: { x: 150, y: 150 },
      document: { width: 1, height: 1, x: 100, y: 100 },
      actor: { type: 'character', system: { mastery: { rank: 2 } }, items: [] },
    };
    expect(tokensAreGridAdjacent(a, b)).toBe(true);
    expect(enemyThreatensRangedShooter(a, b)).toBe(true);
  });
});
