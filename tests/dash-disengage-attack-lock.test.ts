import { beforeEach, describe, expect, it } from 'vitest';
import {
  applyBasicMovementManeuverFlags,
  getAvailableAttackActions,
  getRoundState,
  setRoundState,
  spendAttackAction,
} from '../src/combat/action-economy';

const combat: any = { id: 'enc-dash', round: 1, turn: 0 };

function install(): void {
  const g = globalThis as any;
  g.ui = { notifications: { warn: () => undefined, info: () => undefined } };
  g.Hooks = { callAll: () => undefined, on: () => undefined, off: () => undefined };
  g.game = { combat, actors: { get: () => null } };
  g.canvas = { tokens: { placeables: [] } };
}

function actor(id: string): any {
  const flags: Record<string, any> = {};
  return {
    id,
    name: id,
    type: 'character',
    system: {
      combat: { speed: 8 },
      attributes: {},
      mastery: { rank: 1 },
      statusEffects: [],
    },
    items: [],
    flags: { 'mastery-system': flags },
    getFlag(_s: string, key: string) {
      return flags[key];
    },
    async setFlag(_s: string, key: string, value: unknown) {
      flags[key] = value;
    },
    async unsetFlag(_s: string, key: string) {
      delete flags[key];
    },
    async update() {
      return this;
    },
  };
}

describe('Dash / Disengage base Attack Action lock', () => {
  beforeEach(() => {
    install();
  });

  it('Dash locks the base Attack and blocks spend when only one Attack remains', async () => {
    const hero = actor('dash-hero');
    const rs = getRoundState(hero, combat);
    rs.attackActions = { total: 1, used: 0 };
    await setRoundState(hero, rs);

    expect(getAvailableAttackActions(hero, combat)).toBe(1);
    await applyBasicMovementManeuverFlags(hero, combat, 'dash');
    expect(getRoundState(hero, combat).baseAttackLocked).toBe(true);
    expect(getRoundState(hero, combat).attackActions.used).toBe(0);
    expect(getAvailableAttackActions(hero, combat)).toBe(0);
    expect(await spendAttackAction(hero, combat)).toBe(false);
  });

  it('Disengage locks the base Attack but leaves Extra Attack available', async () => {
    const hero = actor('dis-hero');
    const rs = getRoundState(hero, combat);
    rs.attackActions = { total: 2, used: 0 };
    await setRoundState(hero, rs);

    await applyBasicMovementManeuverFlags(hero, combat, 'disengage');
    expect(getRoundState(hero, combat).baseAttackLocked).toBe(true);
    expect(getRoundState(hero, combat).safeMovementThisTurn).toBe(true);
    expect(getAvailableAttackActions(hero, combat)).toBe(1);
    expect(await spendAttackAction(hero, combat)).toBe(true);
    expect(getAvailableAttackActions(hero, combat)).toBe(0);
  });
});
