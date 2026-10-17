/**
 * Cross-system integration proofs for Destroyed Faith v0.9.9.5.
 * Expectations are taken from the printed Core / Movement tables, not from
 * the production helper that builds catalog rows.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  armDefensiveStoneExpiry,
  clearCombatStoneTurnBonusesForActor,
  getAvailableAttackActions,
  getAvailableMovementActions,
  isFleeLocked,
  releaseDefensiveStoneExpiry,
  setRoundState,
} from '../src/combat/action-economy';
import { commitFlee } from '../src/combat/flee';
import { applyDefensiveMitigation } from '../src/combat/damage-mitigation';
import {
  executeMovementPower,
  listTeleportAllyCandidates,
  resolveTeleportAllyForGuidedMove,
} from '../src/combat/movement-powers';
import { movementActionMeters } from '../src/combat/movement-allowance';
import { planThreatZoneWindows } from '../src/combat/threat-zone';
import { gateTokenMovementUpdate, MASTERY_AUTHORIZED_MOVE } from '../src/combat/token-move-gate';
import { applyDamageToTarget } from '../src/dice/damage-dialog';
import { resetDamageTransferInstances } from '../src/combat/damage-transfer';
import { MOVEMENT_TEMPLATES } from '../src/utils/powers/templates/movement';
import { summonArmorAuraBonus } from '../src/combat/aura-modifiers';

/** Printed Ground Dash distances from docs/Rules/movement.md (2026-10-16). */
const GROUND_DASH_BOOK = [10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 34, 34, 34];
const SAFE_MOVEMENT_BOOK = [2, 4, 6, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
const TELEPORT_BOOK = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
const TRAMPLE_DICE_BOOK = [1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8];

function installFoundry(): void {
  const g = globalThis as any;
  g.game = {
    user: { id: 'gm', isGM: true },
    combat: { id: 'enc', round: 1, started: true },
    actors: { get: (id: string) => g.__actors?.[id] ?? null },
    messages: { get: () => null },
  };
  g.__actors = {};
  g.Hooks = { callAll: () => undefined, on: () => undefined, off: () => undefined };
  g.ChatMessage = { create: async () => ({ id: 'chat' }), getSpeaker: () => ({}) };
  g.ui = { notifications: { warn: () => undefined, info: () => undefined } };
  g.canvas = {
    ready: false,
    scene: { id: 'scene' },
    tokens: { placeables: [] },
    grid: { size: 100, distance: 1 },
  };
}

function combatActor(id: string, opts: {
  armor?: number;
  dr?: number;
  tempHP?: number;
  bars?: Array<{ current: number; max: number }>;
  speed?: number;
  moves?: number;
  attacks?: number;
} = {}) {
  const flags: Record<string, any> = {
    'mastery-system': {
      roundState: {
        combatId: 'enc',
        round: 1,
        isPC: true,
        movementActions: { total: opts.moves ?? 1, used: 0 },
        attackActions: { total: opts.attacks ?? 1, used: 0 },
        reactionActions: { total: 1, used: 0 },
        moveBonusMeters: 0,
        usedPowerIdsThisRound: [],
        npcAttackUsesThisRound: {},
        stoneBonuses: { extraAttacks: 0, extraReactions: 0, extraMoveMeters: 0 },
      },
    },
  };
  const system: any = {
    combat: {
      speed: opts.speed ?? 8,
      armorTotal: opts.armor ?? 0,
      damageReductionPct: opts.dr ?? 0,
      evade: 12,
    },
    health: {
      bars: (opts.bars ?? [{ current: 40, max: 40 }]).map((b) => ({ ...b })),
      currentBar: 0,
      tempHP: opts.tempHP ?? 0,
    },
    statusEffects: [],
  };
  const doc: any = {
    id,
    name: id,
    type: 'character',
    system,
    items: [],
    flags,
    effects: [] as any[],
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
      if (patch['system.health.tempHP'] != null) system.health.tempHP = patch['system.health.tempHP'];
      return doc;
    },
  };
  (globalThis as any).__actors[id] = doc;
  return doc;
}

function tokenDoc(actor: any, x: number, y: number) {
  const flags: Record<string, any> = { 'mastery-system': {} };
  return {
    id: `tok-${actor.id}`,
    x,
    y,
    elevation: 0,
    width: 1,
    height: 1,
    actor,
    getFlag(scope: string, key: string) {
      return flags[scope]?.[key];
    },
    async setFlag(scope: string, key: string, value: unknown) {
      flags[scope] = flags[scope] ?? {};
      flags[scope][key] = value;
    },
    async update(data: any, _opts?: any) {
      if (data.x != null) this.x = data.x;
      if (data.y != null) this.y = data.y;
      if (data.elevation != null) this.elevation = data.elevation;
      return this;
    },
  };
}

describe('Rules-runtime integration v0.9.9.5', () => {
  beforeEach(() => {
    installFoundry();
    resetDamageTransferInstances();
    vi.restoreAllMocks();
  });

  describe('A — Damage pipeline (Armor → DR ceil remaining → Temp HP → HP)', () => {
    it('applies Core DR rounding after Armor and consumes Temp HP before bars', async () => {
      // Book: Final = ceil(DamageAfterArmor × (1 − DR/100)); 13 @ 30% → 10
      const pure = applyDefensiveMitigation({
        rawDamage: 13,
        count8s: 0,
        armorTotal: 0,
        damageReductionPct: 30,
      });
      expect(pure.mitigatedDamage).toBe(10);

      const target = combatActor('def', { armor: 4, dr: 25, tempHP: 5, bars: [{ current: 30, max: 30 }] });
      // raw 20 → armor 4 → 16 → ceil(16×0.75)=ceil(12)=12 → tempHP 5 → HP loss 7
      const summary = await applyDamageToTarget(target, 20, combatActor('atk'), 0, {
        skipPhasing: true,
        skipReactionPrompt: true,
        attackSucceeded: true,
      });
      expect(summary.mitigatedDamage).toBe(12);
      expect(target.system.health.tempHP).toBe(0);
      expect(target.system.health.bars[0].current).toBe(23);
    });
  });

  describe('B — Defensive stones across enemy turns', () => {
    it('keeps Armor stone through spotlight end and enemy hit; clears at next own turn', async () => {
      const defender = combatActor('stone-def', { armor: 4, bars: [{ current: 40, max: 40 }] });
      const combat = (globalThis as any).game.combat;
      await setRoundState(defender, {
        combatId: 'enc',
        round: 1,
        isPC: true,
        movementActions: { total: 1, used: 0 },
        attackActions: { total: 1, used: 0 },
        reactionActions: { total: 1, used: 0 },
        moveBonusMeters: 0,
        usedPowerIdsThisRound: [],
        npcAttackUsesThisRound: {},
        stoneBonuses: {
          extraAttacks: 0,
          extraReactions: 0,
          extraMoveMeters: 0,
          tempArmor: 8,
          damageReductionBoostPct: 25,
        },
      });

      await clearCombatStoneTurnBonusesForActor(defender, combat);
      await armDefensiveStoneExpiry(defender, combat);
      const mid = defender.getFlag('mastery-system', 'roundState') as any;
      expect(mid.stoneBonuses.tempArmor).toBe(8);
      expect(mid.stoneBonuses.damageReductionBoostPct).toBe(25);

      // Enemy hits while bonuses still armed (sheet armor + stone armor + stone DR).
      const hit = applyDefensiveMitigation({
        rawDamage: 20,
        count8s: 0,
        armorTotal: 4 + mid.stoneBonuses.tempArmor,
        damageReductionPct: mid.stoneBonuses.damageReductionBoostPct,
      });
      // 20−12=8 → ceil(8×0.75)=ceil(6)=6
      expect(hit.mitigatedDamage).toBe(6);

      await releaseDefensiveStoneExpiry(defender, combat);
      const after = defender.getFlag('mastery-system', 'roundState') as any;
      expect(after.stoneBonuses.tempArmor).toBe(0);
      expect(after.stoneBonuses.damageReductionBoostPct).toBe(0);
    });
  });

  describe('C — Damage Transfer + Armor + DR + Temp HP', () => {
    it('heals only real HP lost after mitigation and Temp HP', async () => {
      const target = combatActor('xfer-t', {
        armor: 4,
        dr: 25,
        tempHP: 3,
        bars: [{ current: 30, max: 30 }],
      });
      const attacker = combatActor('xfer-a', { bars: [{ current: 5, max: 20 }] });
      // 20 → armor 4 → 16 → ceil(16×0.75)=12 → temp 3 → real HP 9 → heal 9
      const summary = await applyDamageToTarget(target, 20, attacker, 0, {
        skipPhasing: true,
        skipReactionPrompt: true,
        attackSucceeded: true,
        damageTransfer: true,
        damageInstanceId: 'xfer-int-1',
      });
      expect(summary.mitigatedDamage).toBe(12);
      expect(target.system.health.tempHP).toBe(0);
      expect(target.system.health.bars[0].current).toBe(21);
      expect(summary.transferHealing).toBe(9);
      expect(attacker.system.health.bars[0].current).toBe(14);
    });
  });

  describe('D — Flee action economy + drag gate', () => {
    it('blocks drag bypass and spends Movement+Attack only on commitFlee', async () => {
      const hero = combatActor('flee-hero', { moves: 1, attacks: 1, speed: 8 });
      const combat = (globalThis as any).game.combat;

      const blocked = gateTokenMovementUpdate({
        change: { x: 400, y: 0 },
        options: {},
        isLocalUser: true,
        combatStarted: true,
        guidedActive: true,
        currentAction: { category: 'movement', optionId: 'flee' },
      });
      expect(blocked.allow).toBe(false);
      expect(getAvailableMovementActions(hero, combat)).toBe(1);

      const ok = await commitFlee(hero, combat);
      expect(ok.ok).toBe(true);
      expect(getAvailableMovementActions(hero, combat)).toBe(0);
      expect(getAvailableAttackActions(hero, combat)).toBe(0);
      expect(isFleeLocked(hero, combat)).toBe(true);

      const authorized = gateTokenMovementUpdate({
        change: { x: 400, y: 0 },
        options: { [MASTERY_AUTHORIZED_MOVE]: true },
        isLocalUser: true,
        combatStarted: true,
        guidedActive: true,
        currentAction: { category: 'movement', optionId: 'flee' },
      });
      expect(authorized.allow).toBe(true);
    });
  });

  describe('E — Movement powers, threat, enhancement/reduction', () => {
    it('matches printed Movement PL tables independently of the runtime budget helper', () => {
      const byId = Object.fromEntries(MOVEMENT_TEMPLATES.map((t) => [t.templateId, t]));
      for (let lvl = 1; lvl <= 16; lvl++) {
        const key = String(lvl);
        expect((byId['movement-ground-dash'].levels as any)[key].mechanics.movementBonus).toBe(GROUND_DASH_BOOK[lvl - 1]);
        expect((byId['movement-safe-movement'].levels as any)[key].mechanics.movementBonus).toBe(SAFE_MOVEMENT_BOOK[lvl - 1]);
        expect((byId['movement-teleport'].levels as any)[key].mechanics.movementBonus).toBe(TELEPORT_BOOK[lvl - 1]);
        expect((byId['movement-trample'].levels as any)[key].mechanics.trampleDice).toBe(TRAMPLE_DICE_BOOK[lvl - 1]);
      }
      expect((byId['movement-teleport-with-ally'].levels as any)['1'].mechanics.movementUnavailable).toBe(true);
      expect((byId['movement-phase-passage'].levels as any)['1'].mechanics.movementUnavailable).toBe(true);
    });

    it('Safe Movement suppresses threat; Teleport skips intervening path; Reduction halves after Enhancement', () => {
      const guard = {
        id: 'e',
        x: 300,
        y: 0,
        width: 1,
        height: 1,
        disposition: -1,
        reachMeters: 1,
        reactionsRemaining: 1,
      };
      const move = {
        moverId: 'm',
        fromX: 0,
        fromY: 0,
        toX: 800,
        toY: 0,
        width: 1,
        height: 1,
        disposition: 1,
      };
      const safeThreat = planThreatZoneWindows(
        { ...move, traversal: 'path', protectedFromReactions: true },
        [guard],
        { size: 100, distance: 1 },
      );
      expect(safeThreat.windows.length).toBeGreaterThan(0);
      expect(safeThreat.windows.every((w) => w.suppressed)).toBe(true);

      const pathThreat = planThreatZoneWindows(
        { ...move, traversal: 'path', protectedFromReactions: false },
        [guard],
        { size: 100, distance: 1 },
      );
      const teleportThreat = planThreatZoneWindows(
        { ...move, traversal: 'teleport', protectedFromReactions: false },
        [guard],
        { size: 100, distance: 1 },
      );
      expect(pathThreat.windows.filter((w) => !w.suppressed).length).toBeGreaterThan(0);
      // Intervening guard with neither endpoint inside → Teleport opens no window.
      expect(teleportThreat.windows.filter((w) => !w.suppressed)).toHaveLength(0);

      // Speed 8 dash = 16; +4 enhancement = 20; half → 10
      expect(
        movementActionMeters({ kind: 'dash', speed: 8, enhancement: 4, reduced: true }).meters,
      ).toBe(10);
    });

    it('wires Teleport with Ally candidates for the guided movement path', async () => {
      const hero = combatActor('hero-ally', { moves: 2, speed: 8 });
      const ally = combatActor('ally-tok', { moves: 1, speed: 8 });
      const mover = tokenDoc(hero, 0, 0);
      const allyTok = tokenDoc(ally, 100, 0); // 1 m on a 100px = 1 m grid
      const candidates = listTeleportAllyCandidates(mover, [mover, allyTok], 2);
      expect(candidates).toHaveLength(1);
      expect(candidates[0]!.name).toBe('ally-tok');
      const resolved = await resolveTeleportAllyForGuidedMove({
        mover,
        dest: { x: 400, y: 0 },
        tokens: [mover, allyTok],
      });
      expect(resolved?.willing).toBe(true);
      expect(resolved?.dest.x).toBe(500);
      expect(resolved?.dest.y).toBe(0);

      const combat = { id: 'enc', round: 1, started: true };
      (globalThis as any).game.combat = combat;
      const ok = await executeMovementPower({
        token: mover,
        templateId: 'movement-teleport-with-ally',
        level: 8,
        dest: { x: 400, y: 0 },
        ally: resolved!,
        tokens: [mover, allyTok],
        guidance: { destinationVisible: true, destinationFree: true },
        combat,
      });
      expect(ok.ok).toBe(true);
      expect(mover.x).toBe(400);
      expect(allyTok.x).toBe(500);
      expect(getAvailableMovementActions(ally, combat as any)).toBe(1);
    });

    it('executeMovementPower spends one Movement and rejects unavailable levels', async () => {
      const actor = combatActor('mover', { moves: 2, speed: 8 });
      const tok = tokenDoc(actor, 0, 0);
      const combat = { id: 'enc', round: 1, started: true };
      (globalThis as any).game.combat = combat;

      const bad = await executeMovementPower({
        token: tok,
        templateId: 'movement-teleport-with-ally',
        level: 1,
        dest: { x: 100, y: 0 },
        tokens: [],
        combat,
      });
      expect(bad.ok).toBe(false);
      expect(getAvailableMovementActions(actor, combat as any)).toBe(2);

      const ok = await executeMovementPower({
        token: tok,
        templateId: 'movement-teleport',
        level: 4,
        dest: { x: 400, y: 0 },
        tokens: [],
        guidance: { destinationVisible: true, destinationFree: true },
        combat,
      });
      expect(ok.ok).toBe(true);
      expect(tok.x).toBe(400);
      expect(getAvailableMovementActions(actor, combat as any)).toBe(1);
    });
  });

  describe('F — Summon Armor Aura in damage resolution', () => {
    it('adds aura armor only while the owned summon is in range', async () => {
      const owner = combatActor('caster');
      const summon = combatActor('summon', { armor: 4, bars: [{ current: 40, max: 40 }] });
      owner.system.summonBonds = [
        { id: 'bond', bodies: [{ id: 'body', summonActorId: summon.id }] },
      ];
      owner.effects = [
        {
          name: 'Summon Armor Aura',
          disabled: false,
          flags: {
            'mastery-system': {
              activeBuff: true,
              mechanics: { summonArmorAura: { armor: 8, radiusM: 14 } },
            },
          },
        },
      ];
      summon.type = 'summon';
      summon.system.summonBond = {
        ownerActorId: owner.id,
        bondId: 'bond',
        bodyId: 'body',
      };

      const actors = [owner, summon];
      const byId = new Map(actors.map((a) => [a.id, a]));
      const g = globalThis as any;
      g.game = {
        user: { id: 'gm', isGM: true },
        combat: {
          id: 'enc',
          round: 1,
          started: true,
          combatants: { values: () => actors.map((actor) => ({ actor })) },
        },
        actors: { get: (id: string) => byId.get(id) ?? null, contents: actors },
        messages: { get: () => null },
      };
      g.canvas = {
        ready: true,
        scene: { id: 'scene' },
        grid: { size: 100, distance: 1 },
        tokens: { placeables: [] as any[] },
      };
      for (const [actor, metersX] of [
        [owner, 0],
        [summon, 2],
      ] as const) {
        const token = {
          actor,
          scene: { id: 'scene' },
          center: { x: metersX * 100, y: 0 },
          document: { width: 1, height: 1, disposition: 1 },
          disposition: 1,
        };
        actor.token = token;
        g.canvas.tokens.placeables.push(token);
      }

      expect(summonArmorAuraBonus(summon)).toBe(8);
      const inside = await applyDamageToTarget(summon, 20, owner, 0, {
        skipPhasing: true,
        skipReactionPrompt: true,
      });
      expect(inside.armorApplied).toBe(12);
      expect(inside.mitigatedDamage).toBe(8);
      expect(summon.system.combat.armorTotal).toBe(4);
    });
  });
});
