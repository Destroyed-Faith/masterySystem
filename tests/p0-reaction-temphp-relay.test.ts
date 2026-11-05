/**
 * P0: clearReactionInstanceTempHP (and other temp-HP source writes) must use
 * updateActorViaGm so player-initiated attacks against unowned NPCs succeed.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const updateActorViaGm = vi.fn(async (actor: any, patch: Record<string, unknown>) => {
  for (const [k, v] of Object.entries(patch)) {
    if (k === 'system.health.tempHP') {
      actor.system.health.tempHP = v;
      continue;
    }
    // flags.mastery-system.tempHPSources.<key> or flags.mastery-system.tempHPSources.-=<key>
    const prefix = 'flags.mastery-system.tempHPSources.';
    if (!k.startsWith(prefix)) continue;
    const rest = k.slice(prefix.length);
    actor.flags = actor.flags || {};
    actor.flags['mastery-system'] = actor.flags['mastery-system'] || {};
    actor.flags['mastery-system'].tempHPSources =
      actor.flags['mastery-system'].tempHPSources || {};
    const sources = actor.flags['mastery-system'].tempHPSources;
    if (rest.startsWith('-=')) {
      delete sources[rest.slice(2)];
    } else {
      sources[rest] = v;
    }
  }
});

vi.mock('../src/combat/gm-relay.js', async () => {
  const actual = await vi.importActual<typeof import('../src/combat/gm-relay.js')>(
    '../src/combat/gm-relay.js',
  );
  return {
    ...actual,
    updateActorViaGm: (...args: any[]) => updateActorViaGm(...args),
  };
});

import {
  clearReactionInstanceTempHP,
  grantReactionInstanceTempHP,
  getTempHPSources,
} from '../src/combat/passive-triggers.js';

function makeActor() {
  return {
    id: 'npc-unowned',
    name: 'Hostile',
    type: 'npc',
    system: { health: { tempHP: 0, bars: [], currentBar: 0 } },
    flags: { 'mastery-system': { tempHPSources: {} } },
    getFlag(scope: string, key: string) {
      return (this as any).flags?.[scope]?.[key];
    },
    async setFlag(scope: string, key: string, value: unknown) {
      if (!(this as any).flags[scope]) (this as any).flags[scope] = {};
      (this as any).flags[scope][key] = value;
    },
    async update() {
      throw new Error('direct actor.update forbidden for unowned NPC');
    },
  };
}

describe('P0 clearReactionInstanceTempHP GM relay', () => {
  beforeEach(() => {
    updateActorViaGm.mockClear();
    (globalThis as any).game = { user: { id: 'player-1', isGM: false } };
  });

  it('routes grant + clear through updateActorViaGm', async () => {
    const actor = makeActor();
    await grantReactionInstanceTempHP(actor, 20, { combat: { id: 'c1' } });
    expect(updateActorViaGm).toHaveBeenCalled();
    expect(actor.system.health.tempHP).toBe(20);
    expect(
      Object.values(getTempHPSources(actor)).some((s) => s.kind === 'reaction-instance'),
    ).toBe(true);

    updateActorViaGm.mockClear();
    const cleared = await clearReactionInstanceTempHP(actor);
    expect(cleared).toBe(20);
    expect(updateActorViaGm).toHaveBeenCalledTimes(1);
    expect(actor.system.health.tempHP).toBe(0);
    expect(
      Object.values(getTempHPSources(actor)).some((s) => s.kind === 'reaction-instance'),
    ).toBe(false);

    const patch = updateActorViaGm.mock.calls[0]![1] as Record<string, unknown>;
    expect(patch['system.health.tempHP']).toBe(0);
    expect(
      Object.keys(patch).some((k) => k.startsWith('flags.mastery-system.tempHPSources')),
    ).toBe(true);
  });

  it('does not call actor.update directly (permission-safe)', async () => {
    const actor = makeActor();
    const updateSpy = vi.spyOn(actor, 'update');
    await grantReactionInstanceTempHP(actor, 12, { combat: { id: 'c1' } });
    await clearReactionInstanceTempHP(actor);
    expect(updateSpy).not.toHaveBeenCalled();
    expect(updateActorViaGm.mock.calls.length).toBeGreaterThan(0);
  });
});
