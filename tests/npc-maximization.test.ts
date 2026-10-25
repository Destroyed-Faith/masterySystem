import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import {
  canSpendNpcMaximization,
  getNpcMaximizationUiState,
  isNpcAttackMaximizationEligible,
  resolveNpcMaximizationConfig,
  seedNpcMaximizationRoundState,
} from '../src/combat/npc-maximization.js';
import type { RoundState } from '../src/combat/action-economy.js';

function baseRoundState(over: Partial<RoundState> = {}): RoundState {
  return {
    combatId: 'c1',
    round: 1,
    turn: 0,
    isPC: false,
    movementActions: { total: 1, used: 0 },
    attackActions: { total: 1, used: 0 },
    reactionActions: { total: 0, used: 0 },
    moveBonusMeters: 0,
    ...over,
  };
}

describe('NPC Maximization pool', () => {
  beforeEach(() => {
    (globalThis as any).game = { combat: { id: 'c1', round: 1, turn: 0 } };
  });
  afterEach(() => {
    delete (globalThis as any).game;
  });

  it('resolves root pool and phase pool', () => {
    expect(
      resolveNpcMaximizationConfig({
        npcMaximization: { charges: 2, refresh: 'perRound' },
        attackValues: [],
      }),
    ).toEqual({ charges: 2, refresh: 'perRound', phaseIndex: null });

    expect(
      resolveNpcMaximizationConfig({
        npcActivePhaseIndex: 1,
        phases: [
          { npcMaximization: { charges: 1, refresh: 'perRound' } },
          { npcMaximization: { charges: 3, refresh: 'perPhase' } },
        ],
      }),
    ).toEqual({ charges: 3, refresh: 'perPhase', phaseIndex: 1 });

    expect(resolveNpcMaximizationConfig({ npcMaximization: { charges: 0 } })).toBeNull();
  });

  it('treats eligible flag correctly', () => {
    expect(isNpcAttackMaximizationEligible({ npcMaximizationEligible: true })).toBe(true);
    expect(isNpcAttackMaximizationEligible({ npcMaximizationEligible: false })).toBe(false);
    expect(isNpcAttackMaximizationEligible({})).toBe(false);
  });

  it('seeds perRound pool to full charges and clears perRound attack uses', () => {
    const actor = {
      type: 'npc',
      system: {
        npcMaximization: { charges: 2, refresh: 'perRound' },
        attackValues: [{ npcMaximizationEligible: true, npcMaximizationCadence: 'perRound' }],
      },
    };
    const prev = baseRoundState({
      npcMaximizationRemaining: 0,
      npcMaximizationRefresh: 'perRound',
      npcMaximizationPhaseIndex: null,
      npcMaximizationAttackUses: { 'npc-attack-root-0': 1 },
    });
    const next = baseRoundState({ round: 2 });
    seedNpcMaximizationRoundState(actor, { id: 'c1', round: 2 }, next, prev);
    expect(next.npcMaximizationRemaining).toBe(2);
    expect(next.npcMaximizationAttackUses).toEqual({});
  });

  it('carries perPhase remaining and perPhase attack uses across rounds', () => {
    const actor = {
      type: 'npc',
      system: {
        npcMaximization: { charges: 2, refresh: 'perPhase' },
        attackValues: [{ npcMaximizationEligible: true, npcMaximizationCadence: 'perPhase' }],
      },
    };
    const prev = baseRoundState({
      npcMaximizationRemaining: 1,
      npcMaximizationGranted: 2,
      npcMaximizationRefresh: 'perPhase',
      npcMaximizationPhaseIndex: null,
      npcMaximizationAttackUses: { 'npc-attack-root-0': 1 },
    });
    const next = baseRoundState({ round: 2 });
    seedNpcMaximizationRoundState(actor, { id: 'c1', round: 2 }, next, prev);
    expect(next.npcMaximizationRemaining).toBe(1);
    expect(next.npcMaximizationAttackUses?.['npc-attack-root-0']).toBe(1);
  });

  it('refills perPhase pool when phase index changes', () => {
    const actor = {
      type: 'npc',
      system: {
        npcActivePhaseIndex: 1,
        phases: [
          {
            npcMaximization: { charges: 2, refresh: 'perPhase' },
            attackValues: [{ npcMaximizationEligible: true, npcMaximizationCadence: 'perPhase' }],
          },
          {
            npcMaximization: { charges: 4, refresh: 'perPhase' },
            attackValues: [{ npcMaximizationEligible: true, npcMaximizationCadence: 'perPhase' }],
          },
        ],
      },
    };
    const prev = baseRoundState({
      npcMaximizationRemaining: 0,
      npcMaximizationRefresh: 'perPhase',
      npcMaximizationPhaseIndex: 0,
      npcMaximizationAttackUses: { 'npc-attack-0-0': 1 },
    });
    const next = baseRoundState({ round: 1 });
    seedNpcMaximizationRoundState(actor, { id: 'c1', round: 1 }, next, prev);
    expect(next.npcMaximizationRemaining).toBe(4);
    expect(next.npcMaximizationPhaseIndex).toBe(1);
    expect(next.npcMaximizationAttackUses).toEqual({});
  });

  it('gates canSpend on eligibility, remaining, and cadence', () => {
    const actor: any = {
      type: 'npc',
      system: {
        npcMaximization: { charges: 2, refresh: 'perRound' },
        attackValues: [
          { name: 'Bite', npcMaximizationEligible: true, npcMaximizationCadence: 'perRound' },
          { name: 'Slam', npcMaximizationEligible: false },
        ],
      },
      getFlag: () =>
        baseRoundState({
          npcMaximizationRemaining: 2,
          npcMaximizationPhaseIndex: null,
          npcMaximizationAttackUses: {},
        }),
    };
    expect(canSpendNpcMaximization(actor, { attackIndex: 0, phaseIndex: null })).toBe(true);
    expect(canSpendNpcMaximization(actor, { attackIndex: 1, phaseIndex: null })).toBe(false);

    actor.getFlag = () =>
      baseRoundState({
        npcMaximizationRemaining: 2,
        npcMaximizationPhaseIndex: null,
        npcMaximizationAttackUses: { 'npc-attack-root-0': 1 },
      });
    expect(canSpendNpcMaximization(actor, { attackIndex: 0, phaseIndex: null })).toBe(false);

    const ui = getNpcMaximizationUiState(
      {
        type: 'npc',
        system: actor.system,
        getFlag: () =>
          baseRoundState({
            npcMaximizationRemaining: 2,
            npcMaximizationPhaseIndex: null,
            npcMaximizationAttackUses: {},
          }),
      },
      { attackIndex: 0, phaseIndex: null },
    );
    expect(ui?.canSpend).toBe(true);
    expect(ui?.remaining).toBe(2);
    expect(ui?.label).toMatch(/NPC Maximization/);
  });

  it('models a spend as remaining-1 and attack cadence used', () => {
    // Mirrors spendNpcMaximization RoundState writes without Foundry setFlag.
    const rs = baseRoundState({
      npcMaximizationRemaining: 2,
      npcMaximizationGranted: 2,
      npcMaximizationRefresh: 'perRound',
      npcMaximizationPhaseIndex: null,
      npcMaximizationAttackUses: {},
    });
    const key = 'npc-attack-root-0';
    expect(Math.max(0, Math.floor(Number(rs.npcMaximizationAttackUses?.[key]) || 0))).toBe(0);
    rs.npcMaximizationRemaining = Math.max(0, (rs.npcMaximizationRemaining || 0) - 1);
    rs.npcMaximizationAttackUses = { ...rs.npcMaximizationAttackUses, [key]: 1 };
    expect(rs.npcMaximizationRemaining).toBe(1);
    expect(rs.npcMaximizationAttackUses[key]).toBe(1);

    const actor: any = {
      type: 'npc',
      system: {
        npcMaximization: { charges: 2, refresh: 'perRound' },
        attackValues: [{ npcMaximizationEligible: true }],
      },
      getFlag: () => rs,
    };
    expect(canSpendNpcMaximization(actor, { attackIndex: 0, phaseIndex: null })).toBe(false);
  });
});
