import { describe, expect, it } from 'vitest';
import {
  gateTokenMovementUpdate,
  isMasteryAuthorizedMove,
  isResolverBoundMovementAction,
  MASTERY_AUTHORIZED_MOVE,
} from '../src/combat/token-move-gate';
import { canDeclareFlee, commitFlee } from '../src/combat/flee';
import { getAvailableAttackActions, getAvailableMovementActions, isFleeLocked } from '../src/combat/action-economy';

function combatActor() {
  const flags: Record<string, any> = {};
  return {
    id: 'hero',
    name: 'hero',
    type: 'npc',
    system: {
      attackSlots: 1,
      npcMovementSlots: 1,
      combat: { speed: 8 },
      statusEffects: [],
    },
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
  };
}

describe('Token move gate — Flee and Movement Power drag bypass', () => {
  it('blocks ordinary drag while guided movement is active', () => {
    const blocked = gateTokenMovementUpdate({
      change: { x: 100, y: 0 },
      options: {},
      isLocalUser: true,
      combatStarted: true,
      guidedActive: true,
      currentAction: { category: 'movement', optionId: 'flee' },
    });
    expect(blocked.allow).toBe(false);
  });

  it('allows the same update when the resolver marks it authorized', () => {
    const ok = gateTokenMovementUpdate({
      change: { x: 100, y: 0 },
      options: { [MASTERY_AUTHORIZED_MOVE]: true },
      isLocalUser: true,
      combatStarted: true,
      guidedActive: true,
      currentAction: { category: 'movement', optionId: 'flee' },
    });
    expect(ok.allow).toBe(true);
    expect(isMasteryAuthorizedMove({ [MASTERY_AUTHORIZED_MOVE]: true })).toBe(true);
  });

  it('blocks drag when Flee or a Movement Power is selected without authorization', () => {
    expect(isResolverBoundMovementAction({ optionId: 'flee' })).toBe(true);
    expect(isResolverBoundMovementAction({ optionId: 'movement-ground-dash', powerType: 'movement' })).toBe(true);
    expect(isResolverBoundMovementAction({ optionId: 'move' })).toBe(false);

    const flee = gateTokenMovementUpdate({
      change: { x: 200, y: 0 },
      options: {},
      isLocalUser: true,
      combatStarted: true,
      guidedActive: false,
      currentAction: { category: 'movement', optionId: 'flee' },
    });
    expect(flee.allow).toBe(false);

    const power = gateTokenMovementUpdate({
      change: { x: 200, y: 0 },
      options: {},
      isLocalUser: true,
      combatStarted: true,
      guidedActive: false,
      currentAction: { category: 'movement', optionId: 'movement-teleport', powerType: 'movement' },
    });
    expect(power.allow).toBe(false);
  });

  it('still allows ordinary Move / Dash drag and out-of-combat moves', () => {
    const move = gateTokenMovementUpdate({
      change: { x: 100, y: 0 },
      options: {},
      isLocalUser: true,
      combatStarted: true,
      guidedActive: false,
      currentAction: { category: 'movement', optionId: 'move' },
    });
    expect(move.allow).toBe(true);

    const dash = gateTokenMovementUpdate({
      change: { x: 100, y: 0 },
      options: {},
      isLocalUser: true,
      combatStarted: true,
      guidedActive: false,
      currentAction: { category: 'movement', optionId: 'dash' },
    });
    expect(dash.allow).toBe(true);

    const free = gateTokenMovementUpdate({
      change: { x: 100, y: 0 },
      options: {},
      isLocalUser: true,
      combatStarted: false,
      guidedActive: false,
      currentAction: { category: 'movement', optionId: 'flee' },
    });
    expect(free.allow).toBe(true);
  });

  it('keeps Flee costs and locks on a real commit, and leaves failed declares unspent', async () => {
    const g = globalThis as any;
    g.ui = { notifications: { warn: () => undefined } };
    g.Hooks = { callAll: () => undefined };
    const combat = { id: 'enc', round: 1, started: true };
    g.game = { combat, user: { id: 'gm', isGM: true } };

    const hero = combatActor();
    await hero.setFlag('mastery-system', 'roundState', {
      combatId: 'enc',
      round: 1,
      movementActions: { total: 1, used: 0 },
      attackActions: { total: 1, used: 0 },
      reactionActions: { total: 1, used: 0 },
    });
    expect(canDeclareFlee(hero, combat).ok).toBe(true);
    const dragWhileSelected = gateTokenMovementUpdate({
      change: { x: 400, y: 0 },
      options: {},
      isLocalUser: true,
      combatStarted: true,
      guidedActive: true,
      currentAction: { category: 'movement', optionId: 'flee' },
    });
    expect(dragWhileSelected.allow).toBe(false);
    expect(getAvailableMovementActions(hero as any, combat as any)).toBe(1);
    expect(isFleeLocked(hero as any, combat as any)).toBe(false);

    const ok = await commitFlee(hero as any, combat as any);
    expect(ok.ok).toBe(true);
    expect(getAvailableMovementActions(hero as any, combat as any)).toBe(0);
    expect(getAvailableAttackActions(hero as any, combat as any)).toBe(0);
    expect(isFleeLocked(hero as any, combat as any)).toBe(true);

    await hero.setFlag('mastery-system', 'roundState', {
      combatId: 'enc',
      round: 1,
      movementActions: { total: 1, used: 1 },
      attackActions: { total: 1, used: 0 },
      reactionActions: { total: 1, used: 0 },
      fleeCommitted: false,
      fleeLock: false,
    });
    expect(canDeclareFlee(hero, combat).ok).toBe(false);
    const noMove = await commitFlee(hero as any, combat as any);
    expect(noMove.ok).toBe(false);
    expect(isFleeLocked(hero as any, combat as any)).toBe(false);
  });
});
