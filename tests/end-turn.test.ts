import { describe, expect, it } from 'vitest';
import { canViewerSeeEndTurn } from '../src/combat/end-turn.js';

describe('canViewerSeeEndTurn', () => {
  it('hides Next Turn on NPCs from players', () => {
    const npc = { type: 'npc', isOwner: false };
    expect(canViewerSeeEndTurn(npc, { isGM: false })).toBe(false);
    expect(canViewerSeeEndTurn(npc, { isGM: true })).toBe(true);
  });

  it('still shows Next Turn on the player’s own character', () => {
    const pc = { type: 'character', isOwner: true };
    expect(canViewerSeeEndTurn(pc, { isGM: false })).toBe(true);
  });
});
