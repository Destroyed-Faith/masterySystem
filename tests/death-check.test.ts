import { beforeEach, describe, expect, it } from 'vitest';
import { maybeRollDeathCheck, markStabilized, readDeathState } from '../src/combat/death-check';

function incapacitatedActor() {
  const flags: Record<string, any> = { 'mastery-system': {} };
  return {
    id: 'dying',
    name: 'Dying',
    type: 'character',
    system: {
      mastery: { rank: 2 },
      attributes: { vitality: { value: 3 } },
      health: { bars: [{ current: 0, max: 20, name: 'Wounded' }], currentBar: 0 },
      statusEffects: [{ id: 'incapacitated' }],
    },
    getFlag(_s: string, key: string) {
      return flags['mastery-system']?.[key];
    },
    async setFlag(_s: string, key: string, value: unknown) {
      flags['mastery-system'] = flags['mastery-system'] ?? {};
      flags['mastery-system'][key] = value;
    },
    async unsetFlag(_s: string, key: string) {
      if (flags['mastery-system']) delete flags['mastery-system'][key];
    },
  };
}

describe('Death Check runtime', () => {
  beforeEach(() => {
    const g = globalThis as any;
    g.game = { users: [{ id: 'gm', isGM: true }] };
    g.ChatMessage = { create: async () => ({}), getSpeaker: () => ({}) };
    g.Roll = class {
      formula: string;
      total = 20;
      constructor(formula: string) {
        this.formula = formula;
      }
      async evaluate() {
        return this;
      }
    };
  });

  it('rolls and tracks successes for an Incapacitated character', async () => {
    const actor = incapacitatedActor();
    const first = await maybeRollDeathCheck(actor);
    expect(first.rolled).toBe(true);
    expect(first.success).toBe(true);
    expect(first.state?.successes).toBe(1);
    expect(readDeathState(actor).successes).toBe(1);

    // Force four successes → Stabilized
    for (let i = 0; i < 3; i++) await maybeRollDeathCheck(actor);
    expect(readDeathState(actor).stabilized).toBe(true);
    const after = await maybeRollDeathCheck(actor);
    expect(after.rolled).toBe(false);
  });

  it('does not roll once Stabilized via Medicine helper', async () => {
    const actor = incapacitatedActor();
    await markStabilized(actor);
    const result = await maybeRollDeathCheck(actor);
    expect(result.rolled).toBe(false);
    expect(readDeathState(actor).stabilized).toBe(true);
  });
});
