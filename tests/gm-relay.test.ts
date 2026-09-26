import { describe, expect, it } from 'vitest';

import { initiativeAfterDelay, isRelayableActorUpdate } from '../src/combat/gm-relay.js';

describe('initiativeAfterDelay', () => {
  it('slots just below the next combatant', () => {
    expect(initiativeAfterDelay(12)).toBe(11.99);
    expect(initiativeAfterDelay(11.99)).toBe(11.98);
  });
});

describe('isRelayableActorUpdate', () => {
  it('allows health, stress, specials, phases, and mastery flags', () => {
    expect(isRelayableActorUpdate({ 'system.health.bars': [], 'system.statusEffects': [] })).toBe(true);
    expect(isRelayableActorUpdate({ 'system.stress.bars': [], 'system.stress.currentBar': 0 })).toBe(true);
    expect(isRelayableActorUpdate({ 'system.npcActivePhaseIndex': 1, 'system.phases': [] })).toBe(true);
    expect(isRelayableActorUpdate({ 'flags.mastery-system.specialRoundApps': {} })).toBe(true);
    expect(isRelayableActorUpdate({ 'system.combat.armor': 9 })).toBe(false);
    expect(isRelayableActorUpdate({})).toBe(false);
  });
});
