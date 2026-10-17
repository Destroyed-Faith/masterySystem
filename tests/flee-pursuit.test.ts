import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  canDeclareFlee,
  commitFlee,
  fleeAllowanceMeters,
  FLEE_TRAVERSAL,
} from '../src/combat/flee';
import { applyMovementCapToTokenChange, movementActionMeters } from '../src/combat/movement-allowance';
import {
  getAvailableAttackActions,
  getAvailableMovementActions,
  isFleeLocked,
  resetRoundState,
  resetTurnState,
  spendAttackAction,
  spendReactionAction,
} from '../src/combat/action-economy';
import { spendColorlessStones } from '../src/stones/colorless-stones';
import { planThreatZoneWindows } from '../src/combat/threat-zone';
import {
  pursuitChatHtml,
  readPursuit,
  renderPursuitHtml,
  resolvePursuitExchange,
  startPursuit,
} from '../src/combat/pursuit';
import { pursuitDialogContent } from '../src/combat/pursuit-dialog';
import * as rollHandler from '../src/dice/roll-handler';
import { masteryRoll } from '../src/dice/roll-handler';

const combat: any = {
  id: 'enc',
  round: 1,
  turn: 0,
  started: true,
  flags: { 'mastery-system': {} },
  combatants: { values: () => [] },
  getFlag(_s: string, key: string) {
    return this.flags['mastery-system'][key];
  },
  async setFlag(_s: string, key: string, value: unknown) {
    this.flags['mastery-system'][key] = value;
  },
};

function install(): void {
  const g = globalThis as any;
  g.ui = { notifications: { warn: () => undefined, info: () => undefined } };
  g.Hooks = { callAll: () => undefined, on: () => undefined, off: () => undefined };
  g.game = { user: { id: 'gm', isGM: true }, combat, actors: { get: () => null } };
  g.ChatMessage = {
    created: [] as any[],
    async create(data: any) {
      this.created.push(data);
      return data;
    },
    getSpeaker: () => ({}),
  };
}

function actor(id: string, extra: Record<string, unknown> = {}): any {
  const flags: Record<string, any> = {};
  const doc: any = {
    id,
    name: id,
    type: 'npc',
    system: {
      attackSlots: 1,
      npcMovementSlots: 1,
      combat: { speed: 8 },
      attributes: { agility: { value: 6 }, might: { value: 6 }, vitality: { value: 6 } },
      mastery: { rank: 1 },
      statusEffects: [],
      stonePools: { colorless: { current: 2, max: 2 } },
      ...(extra.system as object),
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
    async update(patch: Record<string, unknown>) {
      if (patch['system.stonePools.colorless.current'] != null) {
        doc.system.stonePools.colorless.current = patch['system.stonePools.colorless.current'];
      }
    },
  };
  return doc;
}

describe('P1.6 Flee and Pursuit', () => {
  beforeEach(() => {
    install();
    combat.flags['mastery-system'] = {};
    combat.round = 1;
    vi.restoreAllMocks();
  });

  it('requires Movement and an Attack Action, spends both, and locks until the next own Turn', async () => {
    const hero = actor('hero');
    expect(fleeAllowanceMeters({ speed: 8 })).toBe(32);
    expect(movementActionMeters({ kind: 'flee', speed: 8, reduced: false }).meters).toBe(32);
    expect(FLEE_TRAVERSAL).toBe('path');

    await hero.setFlag('mastery-system', 'roundState', {
      combatId: 'enc',
      round: 1,
      movementActions: { total: 1, used: 1 },
      attackActions: { total: 1, used: 0 },
      reactionActions: { total: 1, used: 0 },
    });
    const noMove = await commitFlee(hero, combat);
    expect(noMove.ok).toBe(false);
    expect(isFleeLocked(hero, combat)).toBe(false);
    expect(getAvailableAttackActions(hero, combat)).toBe(1);
    expect(hero.getFlag('mastery-system', 'roundState').attackActions.used).toBe(0);

    const spent = hero.getFlag('mastery-system', 'roundState');
    if (spent) {
      spent.movementActions.total = 1;
      spent.movementActions.used = 0;
      spent.attackActions.used = 1;
      spent.attackActions.total = 1;
      await hero.setFlag('mastery-system', 'roundState', spent);
    } else {
      await hero.setFlag('mastery-system', 'roundState', {
        combatId: 'enc',
        round: 1,
        movementActions: { total: 1, used: 0 },
        attackActions: { total: 1, used: 1 },
        reactionActions: { total: 1, used: 0 },
      });
    }
    const noAttack = await commitFlee(hero, combat);
    expect(noAttack.ok).toBe(false);
    expect(isFleeLocked(hero, combat)).toBe(false);
    expect(getAvailableMovementActions(hero, combat)).toBe(1);

    const state = hero.getFlag('mastery-system', 'roundState');
    state.attackActions.used = 0;
    await hero.setFlag('mastery-system', 'roundState', state);
    const ok = await commitFlee(hero, combat);
    expect(ok.ok).toBe(true);
    expect(getAvailableMovementActions(hero, combat)).toBe(0);
    expect(getAvailableAttackActions(hero, combat)).toBe(0);
    expect(await spendAttackAction(hero, combat)).toBe(false);
    expect(await spendReactionAction(hero, combat)).toBe(false);
    expect(await spendColorlessStones(hero, 1)).toBe(false);
    expect(hero.system.stonePools.colorless.current).toBe(2);
    const again = await commitFlee(hero, combat);
    expect(again.already).toBe(true);
    expect(hero.getFlag('mastery-system', 'roundState').movementActions.used).toBe(1);
    expect(hero.getFlag('mastery-system', 'roundState').attackActions.used).toBe(1);
    expect(readPursuit(combat)).toBeNull();

    combat.round = 2;
    await resetRoundState(hero, { actor: hero } as any, combat);
    expect(isFleeLocked(hero, combat)).toBe(true);
    await resetTurnState(hero, combat);
    expect(isFleeLocked(hero, combat)).toBe(false);
    expect(getAvailableAttackActions(hero, combat)).toBe(1);
  });

  it('caps Flee at 4 × Speed and still opens a Threat Zone', () => {
    const hero = actor('hero');
    const token = {
      id: 'tok',
      x: 0,
      y: 0,
      width: 1,
      height: 1,
      actor: hero,
      parent: { grid: { size: 100, distance: 1 } },
      getFlag(_s: string, key: string) {
        if (key === 'currentAction') return { category: 'movement', optionId: 'flee' };
        return undefined;
      },
    };
    const change = { x: 5000, y: 0 };
    const capped = applyMovementCapToTokenChange(token, change, combat);
    expect(capped.allowedMeters).toBe(32);
    expect(capped.clamped).toBe(true);
    expect(change.x).toBe(3200);
    const plan = planThreatZoneWindows(
      {
        moverId: 'tok',
        fromX: 0,
        fromY: 0,
        toX: 800,
        toY: 0,
        width: 1,
        height: 1,
        disposition: 1,
        traversal: FLEE_TRAVERSAL,
        protectedFromReactions: false,
      },
      [{ id: 'guard', x: 300, y: 0, width: 1, height: 1, disposition: -1, reachMeters: 1, reactionsRemaining: 1 }],
      { size: 100, distance: 1 },
    );
    expect(plan.windows.some((row) => !row.suppressed)).toBe(true);
  });

  it('tracks Pursuit from 0 through Escape, Caught, and a tie without a second calculation', async () => {
    const fleeing = actor('fleeing');
    const pursuer = actor('pursuer');
    combat.combatants = { values: () => [{ actor: fleeing }, { actor: pursuer }] };
    const started = await startPursuit({ combat, fleeing, pursuer, allowedAttributes: ['agility', 'might', 'vitality'] });
    expect(started.pursuit?.track).toBe(0);
    expect(canDeclareFlee(fleeing, combat).ok).toBe(true);

    const script = vi.spyOn(rollHandler, 'masteryRoll');
    script.mockImplementation(async (options: any) => ({
      total: String(options.actorId) === 'fleeing' ? 12 : 4,
      dice: [String(options.actorId) === 'fleeing' ? 12 : 4],
      kept: [String(options.actorId) === 'fleeing' ? 12 : 4],
      keptIndices: [0],
    }));
    const first = await resolvePursuitExchange({
      combat,
      fleeingActor: fleeing,
      pursuerActor: pursuer,
      fleeingAttribute: 'agility',
      pursuerAttribute: 'might',
      exchangeKey: 'e1',
    });
    expect(first.pursuit?.track).toBe(1);
    const dup = await resolvePursuitExchange({
      combat,
      fleeingActor: fleeing,
      pursuerActor: pursuer,
      fleeingAttribute: 'agility',
      pursuerAttribute: 'might',
      exchangeKey: 'e1',
    });
    expect(dup.duplicate).toBe(true);
    expect(readPursuit(combat)?.track).toBe(1);
    const escape = await resolvePursuitExchange({
      combat,
      fleeingActor: fleeing,
      pursuerActor: pursuer,
      fleeingAttribute: 'vitality',
      pursuerAttribute: 'agility',
      exchangeKey: 'e2',
    });
    expect(escape.pursuit?.status).toBe('escape');
    expect(escape.pursuit?.track).toBe(2);
    const refused = await resolvePursuitExchange({
      combat,
      fleeingActor: fleeing,
      pursuerActor: pursuer,
      fleeingAttribute: 'agility',
      pursuerAttribute: 'agility',
      exchangeKey: 'e3',
    });
    expect(refused.ok).toBe(false);
    expect(readPursuit(combat)?.exchanges).toHaveLength(2);
    const panel = renderPursuitHtml(readPursuit(combat));
    const chat = pursuitChatHtml(readPursuit(combat)!, escape.exchange!);
    expect(panel).toContain('Track <strong>2</strong>');
    expect(panel).toContain(chat);
    expect((globalThis as any).ChatMessage.created.at(-1).content).toBe(chat);
    expect(pursuitDialogContent(combat)).toContain('data-track="2"');

    combat.flags['mastery-system'].pursuit = undefined;
    await startPursuit({ combat, fleeing, pursuer });
    script.mockImplementation(async (options: any) => ({
      total: String(options.actorId) === 'pursuer' ? 15 : 3,
      dice: [String(options.actorId) === 'pursuer' ? 15 : 3],
      kept: [3],
      keptIndices: [0],
    }));
    const down = await resolvePursuitExchange({
      combat, fleeingActor: fleeing, pursuerActor: pursuer, fleeingAttribute: 'might', pursuerAttribute: 'might', exchangeKey: 'c1',
    });
    expect(down.pursuit?.track).toBe(-1);
    const caught = await resolvePursuitExchange({
      combat, fleeingActor: fleeing, pursuerActor: pursuer, fleeingAttribute: 'might', pursuerAttribute: 'vitality', exchangeKey: 'c2',
    });
    expect(caught.pursuit?.status).toBe('caught');
    expect(caught.pursuit?.track).toBe(-2);

    combat.flags['mastery-system'].pursuit = undefined;
    await startPursuit({ combat, fleeing, pursuer, allowedAttributes: ['might'] });
    script.mockImplementation(async () => ({ total: 8, dice: [8], kept: [8], keptIndices: [0] }));
    const tie = await resolvePursuitExchange({
      combat, fleeingActor: fleeing, pursuerActor: pursuer, fleeingAttribute: 'might', pursuerAttribute: 'might', exchangeKey: 't1',
    });
    expect(tie.pursuit?.track).toBe(0);
    expect(tie.exchange?.winner).toBe('tie');
    const blocked = await resolvePursuitExchange({
      combat, fleeingActor: fleeing, pursuerActor: pursuer, fleeingAttribute: 'agility', pursuerAttribute: 'might', exchangeKey: 't2',
    });
    expect(blocked.ok).toBe(false);
    expect(readPursuit(combat)?.track).toBe(0);
    script.mockRestore();
  });

  it('uses the normal contest roll, including pool reductions', async () => {
    const fleeing = actor('fleeing');
    const pursuer = actor('pursuer');
    fleeing.system.statusEffects = [{ id: 'weaken', value: 2 }];
    fleeing.system.attributes.agility.value = 6;
    pursuer.system.attributes.agility.value = 6;
    await startPursuit({ combat, fleeing, pursuer });
    const random = vi.spyOn(Math, 'random').mockReturnValue(0);
    try {
      const result = await resolvePursuitExchange({
        combat,
        fleeingActor: fleeing,
        pursuerActor: pursuer,
        fleeingAttribute: 'agility',
        pursuerAttribute: 'agility',
        exchangeKey: 'pool',
      });
      expect(result.ok).toBe(true);
      expect(result.exchange?.fleeingDice.length).toBeLessThan(result.exchange?.pursuerDice.length ?? 0);
      const plain = await masteryRoll({
        numDice: 6,
        keepDice: 1,
        skill: 0,
        tn: 0,
        skipChat: true,
        actorRef: pursuer,
        applyPoolPenalties: true,
        rollKind: 'contest',
        poolAttribute: 'agility',
      });
      expect(plain.dice.length).toBe(result.exchange?.pursuerDice.length);
    } finally {
      random.mockRestore();
    }
  });
});
