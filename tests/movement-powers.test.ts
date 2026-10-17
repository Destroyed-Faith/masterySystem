import { beforeEach, describe, expect, it } from 'vitest';
import { applyMovementCapToTokenChange, movementActionMeters } from '../src/combat/movement-allowance';
import { handleTokenMovement } from '../src/combat/movement-tracker';
import {
  creaturesOnMovementPath,
  executeMovementPower,
  movementPowerBudget,
  movementPowerLevel,
} from '../src/combat/movement-powers';
import { planThreatZoneWindows } from '../src/combat/threat-zone';
import { MOVEMENT_TEMPLATES } from '../src/utils/powers/templates/movement';

const GRID = { size: 100, distance: 1 };

function install(): void {
  const g = globalThis as any;
  g.Hooks = { callAll: () => undefined, on: () => undefined, off: () => undefined };
  g.ui = { notifications: { warn: () => undefined, info: () => undefined } };
  g.ChatMessage = { create: async () => ({}), getSpeaker: () => ({}) };
  g.canvas = { ready: false, tokens: { placeables: [] } };
  g.game = {
    user: { id: 'gm', isGM: true },
    actors: { get: () => null },
    combat: null,
  };
}

function roundState(extra: Record<string, unknown> = {}) {
  return {
    combatId: 'enc',
    round: 1,
    movementActions: { total: 2, used: 0 },
    attackActions: { total: 1, used: 0 },
    reactionActions: { total: 1, used: 0 },
    usedMovementPowerIds: [] as string[],
    usedPowerIdsThisRound: [] as string[],
    moveBonusMeters: 0,
    stoneBonuses: {},
    ...extra,
  };
}

function actorOf(id: string, opts: { speed?: number; armor?: number; evade?: number; moves?: number; enhancement?: number; reduced?: boolean; status?: any[] } = {}) {
  const flags: Record<string, any> = {
    'mastery-system': {
      roundState: roundState({
        movementActions: { total: opts.moves ?? 2, used: 0 },
        moveBonusMeters: opts.enhancement ?? 0,
      }),
      ...(opts.reduced ? { movementReduction: { combatId: 'enc', round: 1 } } : {}),
    },
  };
  const system: any = {
    combat: { speed: opts.speed ?? 8, armorTotal: opts.armor ?? 0, damageReductionPct: 0, evade: opts.evade ?? 12 },
    health: { bars: [{ current: 30, max: 30, name: 'Healthy' }], currentBar: 0, tempHP: 0 },
    statusEffects: opts.status ?? [],
  };
  const actor: any = {
    id,
    name: id,
    type: 'npc',
    system,
    flags,
    getFlag(scope: string, key: string) {
      return flags[scope]?.[key];
    },
    async setFlag(scope: string, key: string, value: unknown) {
      flags[scope] = flags[scope] ?? {};
      flags[scope][key] = value;
    },
    async unsetFlag(scope: string, key: string) {
      if (flags[scope]) delete flags[scope][key];
    },
    async update(patch: Record<string, unknown>) {
      if (patch['system.health.bars']) system.health.bars = patch['system.health.bars'];
      if (patch['system.health.currentBar'] != null) system.health.currentBar = patch['system.health.currentBar'];
      return actor;
    },
  };
  return actor;
}

function tokenOf(id: string, actor: any, x: number, y = 0, elevation = 0) {
  const doc: any = {
    id,
    x,
    y,
    elevation,
    width: 1,
    height: 1,
    actor,
    disposition: 1,
    parent: { grid: GRID, walls: [] as any[] },
    flags: {} as Record<string, any>,
    getFlag(scope: string, key: string) {
      return doc.flags[scope]?.[key];
    },
    async setFlag(scope: string, key: string, value: unknown) {
      doc.flags[scope] = doc.flags[scope] ?? {};
      doc.flags[scope][key] = value;
    },
    async update(patch: Record<string, unknown>) {
      Object.assign(doc, patch);
      return doc;
    },
  };
  return doc;
}

function arm(heroId: string, tokenId: string) {
  (globalThis as any).game.combat = {
    id: 'enc',
    round: 1,
    started: true,
    combatant: { actor: { id: heroId }, token: { id: tokenId } },
  };
}

async function use(
  templateId: string,
  level: number,
  meters: number,
  opts: { elevation?: number; guidance?: any; ally?: any; tokens?: any[]; trampleTotal?: number; y?: number } = {},
) {
  const hero = actorOf('hero');
  const token = tokenOf('mover', hero, 0, 0, 0);
  arm('hero', 'mover');
  const result = await executeMovementPower({
    token,
    templateId,
    level,
    dest: { x: meters * 100, y: (opts.y ?? 0) * 100, elevation: opts.elevation ?? 0 },
    ally: opts.ally,
    tokens: opts.tokens,
    guidance: opts.guidance,
    trampleTotal: opts.trampleTotal,
    combat: (globalThis as any).game.combat,
  });
  return { hero, token, result };
}

describe('Movement Power tables', () => {
  const tables: Record<string, { travel: Array<number | null>; vertical?: number[]; material?: number[]; dice?: number[]; unavailable?: number[] }> = {
    'movement-ground-dash': { travel: [10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 34, 34, 34] },
    'movement-safe-movement': { travel: [2, 4, 6, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20] },
    'movement-teleport': { travel: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16] },
    'movement-teleport-with-ally': { travel: [null, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 12, 12, 12], unavailable: [1] },
    'movement-flight': { travel: [1, 3, 4, 6, 7, 9, 10, 12, 13, 15, 16, 18, 19, 21, 22, 24] },
    'movement-leap': {
      travel: [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 28, 28],
      vertical: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 14, 14],
    },
    'movement-wall-walk': { travel: [2, 5, 7, 10, 12, 15, 17, 20, 22, 25, 27, 28, 28, 28, 28, 28] },
    'movement-burrow': { travel: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16] },
    'movement-phase-passage': {
      travel: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
      material: [0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 8, 8],
      unavailable: [1],
    },
    'movement-trample': {
      travel: [4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 24, 24, 24, 24, 24],
      dice: [1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8],
    },
  };

  it('matches all ten printed PL 1–16 tables, including unavailable levels', () => {
    expect(MOVEMENT_TEMPLATES).toHaveLength(10);
    for (const [id, table] of Object.entries(tables)) {
      for (let level = 1; level <= 16; level++) {
        const row = movementPowerLevel(id, level)!;
        const unavailable = table.unavailable?.includes(level) === true;
        expect(row.available).toBe(!unavailable);
        if (id === 'movement-phase-passage') {
          expect(row.travelMeters).toBeNull();
          expect(row.materialMeters).toBe(table.material![level - 1]);
        } else if (!unavailable) {
          expect(row.travelMeters).toBe(table.travel[level - 1]);
        }
        if (table.vertical) expect(row.verticalMeters).toBe(table.vertical[level - 1]);
        if (table.dice) expect(row.trampleDice).toBe(table.dice[level - 1]);
      }
    }
  });
});

describe('Movement Power token movement', () => {
  beforeEach(() => install());

  it('spends one Movement and keeps the other', async () => {
    const { hero, token, result } = await use('movement-ground-dash', 1, 10);
    expect(result.ok).toBe(true);
    expect(result.traversal).toBe('path');
    expect(token.x).toBe(1000);
    expect(hero.getFlag('mastery-system', 'roundState').movementActions.used).toBe(1);
    expect(hero.getFlag('mastery-system', 'roundState').movementActions.total).toBe(2);
  });

  it('refuses the same Power a second time and still allows a different Power', async () => {
    const hero = actorOf('hero');
    const token = tokenOf('mover', hero, 0);
    arm('hero', 'mover');
    const first = await executeMovementPower({
      token, templateId: 'movement-ground-dash', level: 1, dest: { x: 1000, y: 0 }, combat: (globalThis as any).game.combat,
    });
    const second = await executeMovementPower({
      token, templateId: 'movement-ground-dash', level: 1, dest: { x: 2000, y: 0 }, combat: (globalThis as any).game.combat,
    });
    const other = await executeMovementPower({
      token, templateId: 'movement-safe-movement', level: 4, dest: { x: 1800, y: 0 }, combat: (globalThis as any).game.combat,
    });
    expect(first.ok).toBe(true);
    expect(second.ok).toBe(false);
    expect(token.x).toBe(1800);
    expect(other.ok).toBe(true);
    expect(other.traversal).toBe('safe');
    expect(hero.getFlag('mastery-system', 'roundState').movementActions.used).toBe(2);
  });

  it('applies Enhancement and then one Reduction to a Ground Dash', async () => {
    const hero = actorOf('hero', { enhancement: 4, reduced: true });
    const token = tokenOf('mover', hero, 0);
    arm('hero', 'mover');
    const budget = movementPowerBudget({
      templateId: 'movement-ground-dash', level: 1, speed: 8, enhancement: 4, reduced: true,
    });
    expect(budget?.allowedMeters).toBe(7);
    const tooFar = await executeMovementPower({
      token, templateId: 'movement-ground-dash', level: 1, dest: { x: 800, y: 0 }, combat: (globalThis as any).game.combat,
    });
    expect(tooFar.ok).toBe(false);
    expect(token.x).toBe(0);
    expect(hero.getFlag('mastery-system', 'roundState').movementActions.used).toBe(0);
    const ok = await executeMovementPower({
      token, templateId: 'movement-ground-dash', level: 1, dest: { x: 700, y: 0 }, combat: (globalThis as any).game.combat,
    });
    expect(ok.ok).toBe(true);
    expect(token.x).toBe(700);
  });

  it('treats Ground Dash as a path, not a teleport, and still opens a Threat Zone', async () => {
    const { token, result } = await use('movement-ground-dash', 4, 8);
    expect(result.traversal).toBe('path');
    const guard = { id: 'guard', x: 300, y: 0, width: 1, height: 1, disposition: -1, reachMeters: 1, reactionsRemaining: 1 };
    const move = {
      moverId: 'mover', fromX: 0, fromY: 0, toX: token.x, toY: 0, width: 1, height: 1, disposition: 1,
    };
    const walked = planThreatZoneWindows({ ...move, traversal: 'path', protectedFromReactions: false }, [guard], GRID);
    const jumped = planThreatZoneWindows({ ...move, traversal: 'teleport', protectedFromReactions: false }, [guard], GRID);
    expect(walked.windows.filter((w) => !w.suppressed).length).toBeGreaterThan(0);
    expect(jumped.windows.filter((w) => !w.suppressed)).toHaveLength(0);
  });

  it('lets Safe Movement suppress Threat Zones without granting Evade and still applies Lacerate', async () => {
    const hero = actorOf('hero', { status: [{ id: 'lacerate', value: 2 }] });
    const token = tokenOf('mover', hero, 0);
    token._source = { x: 0, y: 0 };
    arm('hero', 'mover');
    const result = await executeMovementPower({
      token, templateId: 'movement-safe-movement', level: 4, dest: { x: 800, y: 0 }, combat: (globalThis as any).game.combat,
    });
    expect(result.ok).toBe(true);
    expect(result.traversal).toBe('safe');
    expect(hero.system.combat.evade).toBe(12);
    const plan = planThreatZoneWindows({
      moverId: 'mover', fromX: 0, fromY: 0, toX: 800, toY: 0, width: 1, height: 1, disposition: 1,
      traversal: 'path', protectedFromReactions: true,
    }, [{ id: 'guard', x: 300, y: 0, width: 1, height: 1, disposition: -1, reachMeters: 1, reactionsRemaining: 1 }], GRID);
    expect(plan.windows.length).toBeGreaterThan(0);
    expect(plan.windows.every((w) => w.suppressed)).toBe(true);
    const stage = hero.getFlag('mastery-system', 'lacerateStageThisTurn');
    expect(stage).toBeGreaterThan(0);
    await handleTokenMovement(token, { x: 800, y: 0 });
    expect(hero.getFlag('mastery-system', 'lacerateStageThisTurn')).toBe(stage);
  });

  it('teleports only to a visible free space and checks endpoints', async () => {
    const blocked = tokenOf('other', actorOf('other'), 800);
    const hidden = await use('movement-teleport', 8, 8, { guidance: { destinationVisible: false, destinationFree: true }, tokens: [] });
    expect(hidden.result.ok).toBe(false);
    expect(hidden.token.x).toBe(0);
    const occupied = await use('movement-teleport', 8, 8, { guidance: { destinationVisible: true }, tokens: [blocked] });
    expect(occupied.result.ok).toBe(false);
    const { token, result } = await use('movement-teleport', 8, 8, { guidance: { destinationVisible: true, destinationFree: true } });
    expect(result.ok).toBe(true);
    expect(result.traversal).toBe('teleport');
    expect(token.x).toBe(800);
  });

  it('moves one willing ally within 2 m and leaves that ally’s Movement unspent', async () => {
    const hero = actorOf('hero');
    const allyActor = actorOf('ally');
    const token = tokenOf('mover', hero, 0);
    const ally = tokenOf('ally-token', allyActor, 100);
    arm('hero', 'mover');
    const unwilling = await executeMovementPower({
      token, templateId: 'movement-teleport-with-ally', level: 8, dest: { x: 700, y: 0 },
      ally: { token: ally, dest: { x: 200, y: 0 }, willing: false },
      guidance: { destinationVisible: true },
      combat: (globalThis as any).game.combat,
    });
    expect(unwilling.ok).toBe(false);
    expect(token.x).toBe(0);
    expect(ally.x).toBe(100);
    const moved = await executeMovementPower({
      token, templateId: 'movement-teleport-with-ally', level: 8, dest: { x: 700, y: 0 },
      ally: { token: ally, dest: { x: 200, y: 0 }, willing: true },
      tokens: [token, ally],
      guidance: { destinationVisible: true, destinationFree: true },
      combat: (globalThis as any).game.combat,
    });
    expect(moved.ok).toBe(true);
    expect(token.x).toBe(700);
    expect(ally.x).toBe(200);
    expect(allyActor.getFlag('mastery-system', 'roundState').movementActions.used).toBe(0);
    const far = tokenOf('far', actorOf('far'), 400);
    const rejected = await executeMovementPower({
      token, templateId: 'movement-teleport-with-ally', level: 9, dest: { x: 800, y: 0 },
      ally: { token: far, dest: { x: 500, y: 0 }, willing: true },
      guidance: { destinationVisible: true },
      combat: (globalThis as any).game.combat,
    });
    expect(rejected.ok).toBe(false);
  });

  it('refuses Flight that does not land and does not keep a hover flag', async () => {
    const aloft = await use('movement-flight', 8, 4, { elevation: 4, guidance: {} });
    expect(aloft.result.ok).toBe(false);
    expect(aloft.token.x).toBe(0);
    expect(aloft.token.getFlag('mastery-system', 'sustainedFlight')).toBeUndefined();
    const landed = await use('movement-flight', 8, 4, { elevation: 0, guidance: {} });
    expect(landed.result.ok).toBe(true);
    expect(landed.result.traversal).toBe('path');
    expect(landed.token.elevation).toBe(0);
  });

  it('keeps Leap horizontal and vertical limits separate', async () => {
    const tooHigh = await use('movement-leap', 1, 0, { elevation: 2, guidance: { arcLegal: true }, y: 0 });
    expect(tooHigh.result.ok).toBe(false);
    const tooFar = await use('movement-leap', 1, 3, { elevation: 0, guidance: { arcLegal: true } });
    expect(tooFar.result.ok).toBe(false);
    const arc = await use('movement-leap', 1, 2, { elevation: 1, guidance: { arcLegal: true } });
    expect(arc.result.ok).toBe(true);
    expect(arc.token.x).toBe(200);
    expect(arc.token.elevation).toBe(1);
    const unconfirmed = await use('movement-leap', 1, 2, { elevation: 0, guidance: { arcLegal: false } });
    expect(unconfirmed.result.ok).toBe(false);
  });

  it('requires surface contact for Wall Walk and does not teleport', async () => {
    const missing = await use('movement-wall-walk', 1, 2, { guidance: { surfaceContact: false } });
    expect(missing.result.ok).toBe(false);
    const walked = await use('movement-wall-walk', 1, 2, { guidance: { surfaceContact: true } });
    expect(walked.result.ok).toBe(true);
    expect(walked.result.traversal).toBe('path');
    expect(walked.token.x).toBe(200);
  });

  it('requires suitable material for Burrow and does not grant cover', async () => {
    const rock = await use('movement-burrow', 4, 4, { guidance: { suitableMaterial: false } });
    expect(rock.result.ok).toBe(false);
    const soft = await use('movement-burrow', 4, 4, { guidance: { suitableMaterial: true } });
    expect(soft.result.ok).toBe(true);
    expect(soft.result.traversal).toBe('path');
    expect(soft.hero.getFlag('mastery-system', 'cover')).toBeUndefined();
  });

  it('uses Speed for Phase Passage distance and the printed cap for material thickness', async () => {
    const hero = actorOf('hero', { speed: 8, enhancement: 4 });
    const token = tokenOf('mover', hero, 0);
    arm('hero', 'mover');
    const budget = movementPowerBudget({
      templateId: 'movement-phase-passage', level: 2, speed: 8, enhancement: 4, reduced: false,
    });
    expect(budget?.allowedMeters).toBe(12);
    expect(budget?.materialMeters).toBe(1);
    const blocked = await executeMovementPower({
      token, templateId: 'movement-phase-passage', level: 1, dest: { x: 800, y: 0 },
      guidance: { materialThicknessMeters: 0, endsOutsideSolid: true },
      combat: (globalThis as any).game.combat,
    });
    expect(blocked.ok).toBe(false);
    expect(hero.getFlag('mastery-system', 'roundState').movementActions.used).toBe(0);
    const thick = await executeMovementPower({
      token, templateId: 'movement-phase-passage', level: 2, dest: { x: 1200, y: 0 },
      guidance: { materialThicknessMeters: 2, endsOutsideSolid: true },
      combat: (globalThis as any).game.combat,
    });
    expect(thick.ok).toBe(false);
    const passed = await executeMovementPower({
      token, templateId: 'movement-phase-passage', level: 2, dest: { x: 1200, y: 0 },
      guidance: { materialThicknessMeters: 1, endsOutsideSolid: true },
      combat: (globalThis as any).game.combat,
    });
    expect(passed.ok).toBe(true);
    expect(token.x).toBe(1200);
    expect(hero.getFlag('mastery-system', 'phasingCharges')).toBeUndefined();
  });

  it('damages each creature on the Trample path once through mitigation, and ignores creatures off the path', async () => {
    const hero = actorOf('hero');
    const token = tokenOf('mover', hero, 0);
    const onPath = actorOf('on-path', { armor: 3 });
    const beside = actorOf('beside');
    const pathToken = tokenOf('path-token', onPath, 200);
    const sideToken = tokenOf('side-token', beside, 200, 400);
    arm('hero', 'mover');
    const crossed = creaturesOnMovementPath(token, { x: 0, y: 0 }, { x: 400, y: 0 }, [pathToken, sideToken]);
    expect(crossed.map((t) => t.id)).toEqual(['path-token']);
    const result = await executeMovementPower({
      token, templateId: 'movement-trample', level: 1, dest: { x: 400, y: 0 },
      tokens: [pathToken, sideToken], trampleTotal: 8, combat: (globalThis as any).game.combat,
    });
    expect(result.ok).toBe(true);
    expect(result.trample).toHaveLength(1);
    expect(result.trample[0].raw).toBe(8);
    expect(result.trample[0].applied).toBe(5);
    expect(onPath.system.health.bars[0].current).toBe(25);
    expect(beside.system.health.bars[0].current).toBe(30);
    expect(hero.getFlag('mastery-system', 'roundState').attackActions.used).toBe(0);
    const again = await executeMovementPower({
      token, templateId: 'movement-trample', level: 1, dest: { x: 800, y: 0 },
      tokens: [pathToken], trampleTotal: 8, combat: (globalThis as any).game.combat,
    });
    expect(again.ok).toBe(false);
    expect(onPath.system.health.bars[0].current).toBe(25);
  });

  it('rejects a Ground Dash through a wall without spending the Movement', async () => {
    const hero = actorOf('hero');
    const token = tokenOf('mover', hero, 0);
    token.parent.walls = [{ c: [400, -50, 400, 50] }];
    arm('hero', 'mover');
    const result = await executeMovementPower({
      token, templateId: 'movement-ground-dash', level: 4, dest: { x: 800, y: 0 }, combat: (globalThis as any).game.combat,
    });
    expect(result.ok).toBe(false);
    expect(token.x).toBe(0);
    expect(hero.getFlag('mastery-system', 'roundState').movementActions.used).toBe(0);
  });

  it('still resolves Move, Dash, Disengage, and Flee as their own distances', () => {
    expect(movementActionMeters({ kind: 'move', speed: 8, enhancement: 0, reduced: false }).meters).toBe(8);
    expect(movementActionMeters({ kind: 'dash', speed: 8, enhancement: 0, reduced: false }).meters).toBe(16);
    expect(movementActionMeters({ kind: 'disengage', speed: 8, enhancement: 0, reduced: false }).meters).toBe(8);
    expect(movementActionMeters({ kind: 'flee', speed: 8, enhancement: 0, reduced: false }).meters).toBe(32);
    const token = tokenOf('mover', actorOf('hero'), 0);
    token.flags['mastery-system'] = { currentAction: { category: 'movement', optionId: 'move', basisMeters: null } };
    const change = { x: 1200, y: 0 };
    const result = applyMovementCapToTokenChange(token, change, { id: 'enc', round: 1 });
    expect(result.clamped).toBe(false);
    expect(change.x).toBe(1200);
  });
});
