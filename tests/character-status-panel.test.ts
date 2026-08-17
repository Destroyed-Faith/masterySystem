import { describe, expect, it } from 'vitest';
import {
  buildCharacterStatusRows,
  reduceCharacterStatusRow,
  removeCharacterStatusRow,
} from '../src/sheets/character-status-panel.js';

function mockActor(opts: { statusEffects?: unknown[]; tempHP?: number }): Actor {
  const updates: Array<Record<string, unknown>> = [];
  const actor = {
    system: {
      statusEffects: opts.statusEffects ?? [],
      health: { tempHP: opts.tempHP ?? 0 },
    },
    update: async (patch: Record<string, unknown>) => {
      updates.push(patch);
      if (patch['system.health.tempHP'] !== undefined) {
        (opts as any).tempHP = patch['system.health.tempHP'];
        actor.system.health.tempHP = Number(patch['system.health.tempHP']);
      }
      if (patch['system.statusEffects']) {
        opts.statusEffects = patch['system.statusEffects'] as unknown[];
        actor.system.statusEffects = opts.statusEffects;
      }
    },
    _updates: updates,
  };
  return actor as unknown as Actor;
}

describe('character status panel', () => {
  it('lists specials and leftover Temp HP', () => {
    const actor = mockActor({
      statusEffects: [{ id: 'slow', name: 'Slow', value: 2 }],
      tempHP: 40,
    });
    const rows = buildCharacterStatusRows(actor);
    expect(rows.map((r) => r.id)).toEqual(['slow', 'tempHP']);
    expect(rows[0]?.canReduce).toBe(true);
    expect(rows[1]?.value).toBe(40);
  });

  it('clears leftover Temp HP with X', async () => {
    const actor = mockActor({ tempHP: 40 });
    const row = buildCharacterStatusRows(actor).find((r) => r.kind === 'tempHP');
    expect(row).toBeTruthy();
    await removeCharacterStatusRow(actor, row!);
    expect((actor as any)._updates.at(-1)?.['system.health.tempHP']).toBe(0);
  });

  it('lists valueless conditions without reduce', () => {
    const actor = mockActor({ statusEffects: [{ id: 'prone', name: 'Prone' }] });
    const rows = buildCharacterStatusRows(actor);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.hasValue).toBe(false);
    expect(rows[0]?.canReduce).toBe(false);
  });

  it('reduces a stacked special and removes it at 0', async () => {
    const actor = mockActor({ statusEffects: [{ id: 'slow', name: 'Slow', value: 3 }] });
    const row = buildCharacterStatusRows(actor)[0]!;
    await reduceCharacterStatusRow(actor, row, 2);
    expect((actor as any).system.statusEffects).toEqual([{ id: 'slow', name: 'Slow', value: 1 }]);
    await reduceCharacterStatusRow(actor, buildCharacterStatusRows(actor)[0]!, 1);
    expect((actor as any).system.statusEffects).toEqual([]);
  });
});
