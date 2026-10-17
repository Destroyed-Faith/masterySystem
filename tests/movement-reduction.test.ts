import { afterEach, describe, expect, it } from 'vitest';
import { applyMovementCapToTokenChange, movementActionMeters } from '../src/combat/movement-allowance';
import { handleTokenMovement } from '../src/combat/movement-tracker';
import { markMovementReductionTargets } from '../src/stones/stone-combat-effects';
import { planThreatZoneWindows } from '../src/combat/threat-zone';

const grid = { size: 100, distance: 1 };
const combat = { id: 'enc-1', round: 1 };

function actorOf(opts: {
  speed: number;
  reduced?: boolean;
  enhancement?: number;
  round?: number;
  status?: Array<{ id: string; value: number }>;
}) {
  const flags: Record<string, unknown> = {
    roundState: {
      combatId: combat.id,
      round: opts.round ?? 1,
      movementActions: { total: 3, used: 0 },
      moveBonusMeters: opts.enhancement ?? 0,
    },
  };
  if (opts.reduced) {
    flags.movementReduction = { combatId: combat.id, round: opts.round ?? 1 };
  }
  const actor: any = {
    id: 'hero',
    name: 'Hero',
    type: 'character',
    system: {
      combat: { speed: opts.speed },
      statusEffects: opts.status ?? [],
      health: { bars: [{ current: 20, max: 20 }], currentBar: 0 },
    },
    flags: { 'mastery-system': flags },
    getFlag(_scope: string, key: string) {
      return flags[key];
    },
    async setFlag(_scope: string, key: string, value: unknown) {
      flags[key] = value;
    },
    async update(data: any) {
      actor.updated = data;
    },
  };
  return actor;
}

function tokenOf(actor: any, action: Record<string, unknown>, traversal?: string) {
  const flags: Record<string, unknown> = { currentAction: action };
  if (traversal) flags.movementTraversal = traversal;
  return {
    id: 'tok',
    x: 0,
    y: 0,
    width: 1,
    height: 1,
    disposition: 1,
    actor,
    parent: { grid },
    _source: { x: 0, y: 0 },
    getFlag(_scope: string, key: string) {
      return flags[key];
    },
  };
}

function drag(token: any, meters: number, combatRound = combat) {
  const change: { x: number; y: number } = { x: meters * grid.size, y: 0 };
  const result = applyMovementCapToTokenChange(token, change, combatRound);
  return { change, result, used: token.actor.getFlag('mastery-system', 'roundState').movementActions.used };
}

describe('Movement Reduction on the token update', () => {
  const warnings: string[] = [];
  const previous = {
    ui: (globalThis as any).ui,
    game: (globalThis as any).game,
    foundry: (globalThis as any).foundry,
    ChatMessage: (globalThis as any).ChatMessage,
  };

  afterEach(() => {
    (globalThis as any).ui = previous.ui;
    (globalThis as any).game = previous.game;
    (globalThis as any).foundry = previous.foundry;
    (globalThis as any).ChatMessage = previous.ChatMessage;
    warnings.length = 0;
  });

  function armUi() {
    (globalThis as any).ui = { notifications: { warn: (msg: string) => warnings.push(msg) } };
  }

  it('halves a normal Move of 8 m to 4 m on the token change', () => {
    armUi();
    const token = tokenOf(actorOf({ speed: 8, reduced: true }), { category: 'movement', optionId: 'move' });
    const { change, result, used } = drag(token, 8);
    expect(change.x).toBe(400);
    expect(result.clamped).toBe(true);
    expect(result.allowedMeters).toBe(4);
    expect(used).toBe(0);
    expect(token.actor.system.combat.speed).toBe(8);
  });

  it('halves Disengage the same way as a normal Move', () => {
    armUi();
    const token = tokenOf(actorOf({ speed: 8, reduced: true }), { category: 'movement', optionId: 'disengage' });
    const { change, result, used } = drag(token, 8);
    expect(change.x).toBe(400);
    expect(result.movementAction).toBe(true);
    expect(used).toBe(0);
  });

  it('halves a Dash of 16 m to 8 m', () => {
    armUi();
    const token = tokenOf(actorOf({ speed: 8, reduced: true }), { category: 'movement', optionId: 'dash' });
    const { change, result } = drag(token, 16);
    expect(change.x).toBe(800);
    expect(result.allowedMeters).toBe(8);
  });

  it('rounds 5, 7 and 9 m up to 3, 4 and 5 m', () => {
    armUi();
    for (const [speed, expectedPx] of [[5, 300], [7, 400], [9, 500]] as const) {
      const token = tokenOf(actorOf({ speed, reduced: true }), { category: 'movement', optionId: 'move' });
      const { change } = drag(token, speed);
      expect(change.x).toBe(expectedPx);
    }
  });

  it('adds Movement Enhancement before the halve', () => {
    armUi();
    const token = tokenOf(actorOf({ speed: 8, enhancement: 4, reduced: true }), {
      category: 'movement',
      optionId: 'move',
    });
    const { change, result } = drag(token, 12);
    expect(result.allowedMeters).toBe(6);
    expect(change.x).toBe(600);
  });

  it('halves each extra Movement Action once, not again on the next action', () => {
    armUi();
    const each = movementActionMeters({ kind: 'move', speed: 8, enhancement: 0, reduced: true }).meters;
    expect([each, each, each]).toEqual([4, 4, 4]);

    let origin = 0;
    for (let step = 0; step < 3; step += 1) {
      const token = tokenOf(actorOf({ speed: 8, reduced: true }), { category: 'movement', optionId: 'move' });
      token.x = origin;
      const change = { x: origin + 800, y: 0 };
      const result = applyMovementCapToTokenChange(token, change, combat);
      expect(result.allowedMeters).toBe(4);
      expect(change.x).toBe(origin + 400);
      expect(token.actor.getFlag('mastery-system', 'roundState').movementActions.used).toBe(0);
      origin = change.x;
    }
  });

  it('halves a Movement Power distance and still teleports past intervening squares', () => {
    armUi();
    const token = tokenOf(
      actorOf({ speed: 8, reduced: true }),
      { category: 'movement', optionId: 'power-phase', powerType: 'movement', basisMeters: 16 },
      'teleport',
    );
    const { change } = drag(token, 16);
    expect(change.x).toBe(800);

    const crossed = {
      moverId: 'tok',
      fromX: 0,
      fromY: 0,
      toX: change.x,
      toY: 0,
      disposition: 1 as const,
      protectedFromReactions: false,
    };
    const guard = {
      id: 'guard',
      x: 300,
      y: 0,
      disposition: -1 as const,
      reachMeters: 1,
      reactionsRemaining: 1,
    };
    const teleported = planThreatZoneWindows({ ...crossed, traversal: 'teleport' }, [guard], grid);
    const walked = planThreatZoneWindows({ ...crossed, traversal: 'path' }, [guard], grid);
    expect(teleported.windows.filter((w) => !w.suppressed)).toHaveLength(0);
    expect(walked.windows.filter((w) => !w.suppressed).length).toBeGreaterThan(0);
  });

  it('clamps a direct token drag that exceeds the reduced allowance', () => {
    armUi();
    const token = tokenOf(actorOf({ speed: 8, reduced: true }), { category: 'movement', optionId: 'move' });
    const { change, result } = drag(token, 12);
    expect(change.x).toBe(400);
    expect(result.clamped).toBe(true);
    expect(warnings[0]).toMatch(/stops at 4 m/);
  });

  it('leaves a token without Movement Reduction on the requested square', () => {
    const token = tokenOf(actorOf({ speed: 8, reduced: false }), { category: 'movement', optionId: 'move' });
    const { change, result } = drag(token, 12);
    expect(change.x).toBe(1200);
    expect(result.clamped).toBe(false);
  });

  it('expires when the combat round no longer matches the flag', () => {
    const token = tokenOf(actorOf({ speed: 8, reduced: true, round: 1 }), {
      category: 'movement',
      optionId: 'move',
    });
    const { change, result } = drag(token, 8, { id: 'enc-1', round: 2 });
    expect(change.x).toBe(800);
    expect(result.clamped).toBe(false);
  });

  it('still opens a Threat Zone and still applies Lacerate after the cap', async () => {
    armUi();
    const actor = actorOf({ speed: 8, reduced: true, status: [{ id: 'lacerate', value: 2 }] });
    const token = tokenOf(actor, { category: 'movement', optionId: 'move' });
    token.x = 500;
    const change = { x: 0, y: 0 };
    applyMovementCapToTokenChange(token, change, combat);
    expect(change.x).toBe(100);

    const plan = planThreatZoneWindows(
      {
        moverId: 'tok',
        fromX: 500,
        fromY: 0,
        toX: change.x,
        toY: 0,
        width: 1,
        height: 1,
        disposition: 1,
        traversal: 'path',
        protectedFromReactions: false,
      },
      [{
        id: 'guard',
        x: 0,
        y: 0,
        width: 1,
        height: 1,
        disposition: -1,
        reachMeters: 2,
        reactionsRemaining: 1,
      }],
      grid,
    );
    expect(plan.movementEvent).toBe(true);
    expect(plan.windows.some((w) => w.kind === 'entry' && !w.suppressed)).toBe(true);

    (globalThis as any).game = {
      user: { isGM: true },
      combat: { id: 'enc-1', round: 1, started: true, combatant: { token: { id: 'tok' }, actor: { id: 'hero' } } },
    };
    (globalThis as any).foundry = { utils: { duplicate: (value: unknown) => JSON.parse(JSON.stringify(value)) } };
    (globalThis as any).ChatMessage = { create: async () => {}, getSpeaker: () => ({}) };
    token._source = { x: 500, y: 0 };
    await handleTokenMovement(token, { x: change.x, y: 0 });
    expect(actor.getFlag('mastery-system', 'lacerateStageThisTurn')).toBe(1);
  });

  it('marks only as many enemies as the activated rank', async () => {
    const made = (id: string) => {
      const flags: Record<string, unknown> = {};
      return {
        id,
        flags,
        async setFlag(_s: string, key: string, value: unknown) {
          flags[key] = value;
        },
        getFlag(_s: string, key: string) {
          return flags[key];
        },
      };
    };
    const enemies = [made('a'), made('b'), made('c'), made('d')];
    expect(await markMovementReductionTargets(enemies, 1, combat)).toBe(1);
    expect(enemies[0]!.getFlag('mastery-system', 'movementReduction')).toBeTruthy();
    expect(enemies[1]!.getFlag('mastery-system', 'movementReduction')).toBeUndefined();

    const rank3 = [made('e'), made('f'), made('g'), made('h')];
    expect(await markMovementReductionTargets(rank3, 3, combat)).toBe(3);
    expect(rank3[2]!.getFlag('mastery-system', 'movementReduction')).toBeTruthy();
    expect(rank3[3]!.getFlag('mastery-system', 'movementReduction')).toBeUndefined();

    const marked = actorOf({ speed: 8, reduced: false });
    marked.flags['mastery-system'].movementReduction = rank3[2]!.getFlag('mastery-system', 'movementReduction');
    const unmarked = actorOf({ speed: 8, reduced: false });
    const markedDrag = drag(tokenOf(marked, { category: 'movement', optionId: 'move' }), 8);
    const unmarkedDrag = drag(tokenOf(unmarked, { category: 'movement', optionId: 'move' }), 8);
    expect(markedDrag.change.x).toBe(400);
    expect(unmarkedDrag.change.x).toBe(800);
  });

  it('does not halve forced movement or a Reaction, and does not spend a Movement Action', () => {
    const reduced = actorOf({ speed: 8, reduced: true });
    const forced = tokenOf(reduced, {}, 'forced');
    const forcedDrag = drag(forced, 8);
    expect(forcedDrag.change.x).toBe(800);
    expect(forcedDrag.result.movementAction).toBe(false);
    expect(forcedDrag.used).toBe(0);

    const reaction = tokenOf(reduced, { category: 'reaction', optionId: 'reaction-reposition', powerType: 'reaction' }, 'reaction');
    const reactionDrag = drag(reaction, 6);
    expect(reactionDrag.change.x).toBe(600);
    expect(reactionDrag.result.movementAction).toBe(false);
    expect(reactionDrag.used).toBe(0);
  });
});
