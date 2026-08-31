import { beforeEach, describe, expect, it, vi } from 'vitest';

const showPassives = vi.fn();
const showStones = vi.fn().mockResolvedValue(true);
const ensureDefaults = vi.fn().mockResolvedValue(['p1', 'p2']);
const lockPassives = vi.fn().mockResolvedValue(undefined);
const refillPools = vi.fn().mockResolvedValue(undefined);

vi.mock('../src/sheets/passive-selection-dialog.js', () => ({
  PassiveSelectionDialog: { showForCombatant: (...args: unknown[]) => showPassives(...args) },
}));
vi.mock('../src/stones/stone-powers-dialog.js', () => ({
  StonePowersDialog: { showForActor: (...args: unknown[]) => showStones(...args) },
}));
vi.mock('../src/powers/passives.js', () => ({
  ensureDefaultPassiveSlots: (...args: unknown[]) => ensureDefaults(...args),
}));
vi.mock('../src/combat/encounter-start.js', () => ({
  handlePassiveSelectionComplete: (...args: unknown[]) => lockPassives(...args),
  getEncounterSetup: () => ({
    started: true,
    combatId: 'c1',
    passives: {},
    initiativeConfirmed: {},
    carouselShown: false,
  }),
}));
vi.mock('../src/combat/stone-round-gate.js', () => ({
  isStonePowersDone: () => false,
}));
vi.mock('../src/combat/action-economy.js', () => ({
  refillStonePoolsFromAttributes: (...args: unknown[]) => refillPools(...args),
  syncStonePoolCapsFromAttributes: vi.fn(),
}));
vi.mock('../src/combat/stone-powers-flow.js', () => ({
  handleStonePowersComplete: vi.fn(),
}));

import {
  clearPlayerEncounterSetupSession,
  runPlayerSetupForCombatant,
} from '../src/combat/player-encounter-setup.js';

function mockCombatant(): Combatant {
  const actor = {
    id: 'a1',
    type: 'character',
    isOwner: true,
    canUserModify: () => true,
  };
  return {
    id: 'c1',
    actor,
  } as unknown as Combatant;
}

describe('player encounter setup pipeline', () => {
  beforeEach(() => {
    showPassives.mockClear();
    showStones.mockClear().mockResolvedValue(true);
    ensureDefaults.mockClear().mockResolvedValue(['p1', 'p2']);
    lockPassives.mockClear().mockResolvedValue(undefined);
    refillPools.mockClear().mockResolvedValue(undefined);
    clearPlayerEncounterSetupSession();
    (globalThis as any).foundry = { applications: { instances: { get: () => null } } };
    (globalThis as any).game = {
      user: { id: 'p1', isGM: false },
      combat: { id: 'c1' },
      combats: { get: (id: string) => (id === 'c1' ? (globalThis as any).game.combat : null) },
      socket: { emit: vi.fn() },
    };
  });

  it('does not open the standalone Passives dialog in round 1', async () => {
    const combat = {
      id: 'c1',
      round: 1,
      started: true,
      flags: { 'mastery-system': {} },
      combatants: { get: () => null },
    } as unknown as Combat;
    (globalThis as any).game.combat = combat;
    (globalThis as any).game.combats = { get: (id: string) => (id === 'c1' ? combat : null) };

    await runPlayerSetupForCombatant(combat, mockCombatant());

    expect(showPassives).not.toHaveBeenCalled();
    expect(ensureDefaults).toHaveBeenCalledTimes(1);
    expect(lockPassives).toHaveBeenCalledWith(combat, 'a1', {});
    expect(showStones).toHaveBeenCalledTimes(1);
  });
});
