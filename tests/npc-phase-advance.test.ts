import { describe, expect, it, vi } from 'vitest';

import {
  activateNpcBossPhaseFromSheet,
  buildNpcPhaseActivatePatch,
  isNpcHealthPoolDepleted,
  maybeAdvanceNpcBossPhase,
} from '../src/combat/npc-phase-advance.js';

function health(current: number, max = 30) {
  return {
    bars: [{ name: 'Healthy', max, current, penalty: 0 }],
    currentBar: 0,
    tempHP: 0,
  };
}

function bossActor(overrides: Record<string, unknown> = {}) {
  const system = {
    npcActivePhaseIndex: 0,
    health: health(0),
    phases: [
      { name: 'Phase 1', health: health(0), combat: { armor: 2 } },
      { name: 'Phase 2', health: health(40, 40), combat: { armor: 5 } },
    ],
    ...overrides,
  };
  const actor: any = {
    type: 'npc',
    name: 'Boss',
    system,
    update: vi.fn(async (patch: Record<string, unknown>) => {
      if (patch['system.npcActivePhaseIndex'] != null) {
        system.npcActivePhaseIndex = patch['system.npcActivePhaseIndex'];
      }
      if (patch['system.health'] != null) {
        system.health = patch['system.health'] as any;
      }
      if (patch['system.phases'] != null) {
        system.phases = patch['system.phases'] as any;
      }
    }),
  };
  return actor;
}

describe('isNpcHealthPoolDepleted', () => {
  it('is true when all bars are 0', () => {
    expect(isNpcHealthPoolDepleted(health(0))).toBe(true);
    expect(isNpcHealthPoolDepleted(health(5))).toBe(false);
  });
});

describe('buildNpcPhaseActivatePatch', () => {
  it('loads next phase health and persists depleted current', () => {
    const actor = bossActor();
    const patch = buildNpcPhaseActivatePatch(actor, 1);
    expect(patch).toBeTruthy();
    expect(patch!['system.npcActivePhaseIndex']).toBe(1);
    const nextHealth = patch!['system.health'] as any;
    expect(nextHealth.bars[0].current).toBe(40);
    const phases = patch!['system.phases'] as any[];
    expect(phases[0].health.bars[0].current).toBe(0);
  });
});

describe('maybeAdvanceNpcBossPhase', () => {
  it('advances when HP is 0 and a next phase exists', async () => {
    const actor = bossActor();
    (globalThis as any).ChatMessage = { create: vi.fn(async () => ({})) };
    const result = await maybeAdvanceNpcBossPhase(actor);
    expect(result?.defeated).toBe(false);
    expect(result?.toIndex).toBe(1);
    expect(actor.update).toHaveBeenCalled();
    expect(actor.system.npcActivePhaseIndex).toBe(1);
    expect(actor.system.health.bars[0].current).toBe(40);
  });

  it('does not advance when HP remains', async () => {
    const actor = bossActor({ health: health(12) });
    const result = await maybeAdvanceNpcBossPhase(actor);
    expect(result).toBeNull();
    expect(actor.update).not.toHaveBeenCalled();
  });

  it('reports defeated on last phase at 0 HP', async () => {
    const actor = bossActor({
      npcActivePhaseIndex: 1,
      health: health(0),
      phases: [
        { name: 'Phase 1', health: health(0) },
        { name: 'Phase 2', health: health(0) },
      ],
    });
    const result = await maybeAdvanceNpcBossPhase(actor);
    expect(result?.defeated).toBe(true);
    expect(actor.update).not.toHaveBeenCalled();
  });

  it('ignores characters and single-phase NPCs', async () => {
    expect(await maybeAdvanceNpcBossPhase({ type: 'character', system: {} })).toBeNull();
    const solo = bossActor({
      phases: [{ name: 'Only', health: health(0) }],
    });
    expect(await maybeAdvanceNpcBossPhase(solo)).toBeNull();
  });
});

describe('activateNpcBossPhaseFromSheet', () => {
  it('loads HP when root is depleted and target phase has HP', async () => {
    const actor = bossActor();
    const result = await activateNpcBossPhaseFromSheet(actor, 1);
    expect(result?.toIndex).toBe(1);
    expect(actor.system.health.bars[0].current).toBe(40);
  });

  it('only flips the index when root still has HP', async () => {
    const actor = bossActor({ health: health(20) });
    await activateNpcBossPhaseFromSheet(actor, 1);
    expect(actor.system.npcActivePhaseIndex).toBe(1);
    expect(actor.system.health.bars[0].current).toBe(20);
  });
});
