import { describe, it, expect, vi } from 'vitest';
import { applyMidCombatInitiativeGain, findCombatantForActor } from '../src/combat/initiative-gain.js';

function mockCombat(params: {
  turn: number;
  turns: Array<{ id: string; actorId: string; initiative: number; tokenId?: string }>;
}) {
  const combatants = params.turns.map((t) => {
    const c: any = {
      id: t.id,
      tokenId: t.tokenId ?? null,
      initiative: t.initiative,
      actor: { id: t.actorId },
      update: vi.fn(async function (this: any, patch: { initiative?: number }) {
        if (typeof patch.initiative === 'number') {
          this.initiative = patch.initiative;
          t.initiative = patch.initiative;
        }
      }),
    };
    return c;
  });
  const combat = {
    turn: params.turn,
    get turns() {
      return combatants;
    },
    combatants,
    setupTurns: vi.fn(async () => {
      combatants.sort((a, b) => b.initiative - a.initiative);
    }),
  };
  return { combat, combatants };
}

describe('initiative-gain', () => {
  it('findCombatantForActor matches by actor id', () => {
    const { combat } = mockCombat({
      turn: 0,
      turns: [{ id: 'c1', actorId: 'actor-a', initiative: 10 }],
    });
    const actor = { id: 'actor-a' } as any;
    expect(findCombatantForActor(combat as any, actor)?.id).toBe('c1');
  });

  it('adds initiative and re-sorts when combatant has not acted yet', async () => {
    const { combat, combatants } = mockCombat({
      turn: 1,
      turns: [
        { id: 'c1', actorId: 'a1', initiative: 30 },
        { id: 'c2', actorId: 'a2', initiative: 20 },
        { id: 'c3', actorId: 'a3', initiative: 10 },
      ],
    });
    const actor = { id: 'a3' } as any;
    const result = await applyMidCombatInitiativeGain(combat as any, actor, 12);
    expect(result.applied).toBe(true);
    expect(result.oldInitiative).toBe(10);
    expect(result.newInitiative).toBe(22);
    expect(combatants.find((c) => c.id === 'c3')?.initiative).toBe(22);
    expect(combat.setupTurns).toHaveBeenCalled();
    expect(result.note).toContain('Turn order updated');
  });

  it('updates score only when combatant already acted this round', async () => {
    const { combat, combatants } = mockCombat({
      turn: 2,
      turns: [
        { id: 'c1', actorId: 'a1', initiative: 30 },
        { id: 'c2', actorId: 'a2', initiative: 20 },
        { id: 'c3', actorId: 'a3', initiative: 10 },
      ],
    });
    const actor = { id: 'a1' } as any;
    const result = await applyMidCombatInitiativeGain(combat as any, actor, 4);
    expect(result.applied).toBe(true);
    expect(result.newInitiative).toBe(34);
    expect(combatants.find((c) => c.id === 'c1')?.initiative).toBe(34);
    expect(combat.setupTurns).not.toHaveBeenCalled();
    expect(result.note).toContain('next round');
  });
});
