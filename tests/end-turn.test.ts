import { describe, expect, it } from 'vitest';
import { canViewerSeeEndTurn, userMayEndCurrentTurn } from '../src/combat/end-turn.js';

describe('canViewerSeeEndTurn', () => {
  it('hides Next Turn on NPCs from players', () => {
    const npc = { type: 'npc', isOwner: false };
    expect(canViewerSeeEndTurn(npc, { isGM: false })).toBe(false);
    expect(canViewerSeeEndTurn(npc, { isGM: true })).toBe(true);
  });

  it('still shows Next Turn on the player’s own character', () => {
    const pc = { type: 'character', isOwner: true, id: 'pc1' };
    expect(canViewerSeeEndTurn(pc, { isGM: false })).toBe(true);
  });

  it('treats the assigned user character as their own turn', () => {
    const pc = { type: 'character', id: 'pc1', isOwner: false };
    expect(canViewerSeeEndTurn(pc, { isGM: false, character: { id: 'pc1' } })).toBe(true);
    expect(canViewerSeeEndTurn(pc, { isGM: false, character: { id: 'other' } })).toBe(false);
  });
});

describe('userMayEndCurrentTurn', () => {
  it('is only the current combatant’s owner', () => {
    const pc = { type: 'character', id: 'pc1', isOwner: true };
    const combat = { started: true, combatant: { actor: pc } };
    expect(userMayEndCurrentTurn({ isGM: false }, combat)).toBe(true);
    expect(userMayEndCurrentTurn({ isGM: false }, { started: true, combatant: { actor: { type: 'npc' } } })).toBe(
      false,
    );
    expect(userMayEndCurrentTurn({ isGM: false }, { started: false, combatant: { actor: pc } })).toBe(false);
  });
});
