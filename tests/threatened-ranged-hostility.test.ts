import { describe, it, expect, beforeEach } from 'vitest';
import { tokenIsHostileTo } from '../src/combat/threatened-ranged.js';

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
});

describe('dodge-stance radial prefs', () => {
  it('is not a standard radial maneuver anymore', async () => {
    const { RADIAL_STANDARD_MANEUVER_IDS } = await import('../src/utils/radial-maneuver-prefs.js');
    expect(RADIAL_STANDARD_MANEUVER_IDS).not.toContain('dodge-stance');
    expect(RADIAL_STANDARD_MANEUVER_IDS).toContain('parry-stance');
  });
});
