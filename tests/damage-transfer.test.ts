import { beforeEach, describe, expect, it, vi } from 'vitest';
import { applyDamageToTarget } from '../src/dice/damage-dialog';
import {
  applyLimitedToTransferPowerDamage,
  damageTransferApplies,
  isDamageTransferPower,
  martialWeaponDamageApplies,
  resetDamageTransferInstances,
} from '../src/combat/damage-transfer';
import * as healMod from '../src/combat/heal-resolution';
import { ACTIVE_TEMPLATES } from '../src/utils/powers/templates/actives';

const MELEE_DICE = [1, 2, 3, 4, 6, 7, 8, 9, 10, 12, 13, 14, 15, 16, 18, 19];

function installFoundry(): void {
  const g = globalThis as any;
  g.game = {
    user: { id: 'gm', isGM: true },
    combat: null,
    actors: { get: () => null },
    messages: { get: () => null },
  };
  g.Hooks = { callAll: () => undefined, on: () => undefined, off: () => undefined };
  g.ChatMessage = { create: async () => ({ id: 'chat' }), getSpeaker: () => ({}) };
  g.ui = { notifications: { warn: () => undefined, info: () => undefined } };
  g.canvas = { ready: false };
}

function actor(opts: {
  id: string;
  bars: Array<{ current: number; max: number; name?: string }>;
  currentBar?: number;
  armor?: number;
  tempHP?: number;
}) {
  const system: any = {
    health: {
      bars: opts.bars.map((b) => ({ ...b })),
      currentBar: opts.currentBar ?? 0,
      tempHP: opts.tempHP ?? 0,
    },
    combat: { armorTotal: opts.armor ?? 0, damageReductionPct: 0 },
    statusEffects: [],
  };
  const doc: any = {
    id: opts.id,
    name: opts.id,
    type: 'character',
    system,
    items: [],
    update: async (patch: Record<string, unknown>) => {
      if (patch['system.health.bars']) system.health.bars = patch['system.health.bars'];
      if (patch['system.health.currentBar'] != null) {
        system.health.currentBar = patch['system.health.currentBar'];
      }
      if (patch['system.health.tempHP'] != null) system.health.tempHP = patch['system.health.tempHP'];
      return doc;
    },
  };
  return doc;
}

async function hit(
  target: any,
  attacker: any,
  damage: number,
  extra: Record<string, unknown> = {},
) {
  return applyDamageToTarget(target, damage, attacker, 0, {
    skipPhasing: true,
    skipReactionPrompt: true,
    attackSucceeded: true,
    damageTransfer: true,
    damageInstanceId: `inst-${target.id}-${damage}`,
    ...extra,
  });
}

describe('Damage Transfer / Vampyr', () => {
  beforeEach(() => {
    installFoundry();
    resetDamageTransferInstances();
    vi.restoreAllMocks();
  });

  it('heals the attacker for melee damage that includes weapon damage', async () => {
    expect(martialWeaponDamageApplies({})).toBe(true);
    const healSpy = vi.spyOn(healMod, 'applyHealHpAcrossOpenBars');
    const target = actor({ id: 't-melee', bars: [{ current: 20, max: 20 }] });
    const attacker = actor({ id: 'a-melee', bars: [{ current: 10, max: 20 }] });
    const weaponPlusPower = 2 + 3;
    const summary = await hit(target, attacker, weaponPlusPower, { damageInstanceId: 'melee-1' });
    expect(summary.transferHealing).toBe(5);
    expect(target.system.health.bars[0].current).toBe(15);
    expect(attacker.system.health.bars[0].current).toBe(15);
    expect(healSpy).toHaveBeenCalledWith(expect.objectContaining({ bars: expect.any(Array) }), 5);
  });

  it('heals the attacker for ranged martial damage that includes weapon damage', async () => {
    expect(martialWeaponDamageApplies({ ignoreWeaponDamage: false, powerIsSpell: false })).toBe(true);
    const target = actor({ id: 't-ranged', bars: [{ current: 20, max: 20 }] });
    const attacker = actor({ id: 'a-ranged', bars: [{ current: 4, max: 20 }] });
    const weaponPlusPower = 2 + 4;
    const summary = await hit(target, attacker, weaponPlusPower, { damageInstanceId: 'ranged-martial-1' });
    expect(summary.transferHealing).toBe(6);
    expect(target.system.health.bars[0].current).toBe(14);
    expect(attacker.system.health.bars[0].current).toBe(10);
  });

  it('heals only the printed power damage for legal ranged spell delivery', async () => {
    expect(martialWeaponDamageApplies({ powerIsSpell: true })).toBe(false);
    expect(martialWeaponDamageApplies({ ignoreWeaponDamage: true })).toBe(false);
    const target = actor({ id: 't-spell', bars: [{ current: 20, max: 20 }] });
    const attacker = actor({ id: 'a-spell', bars: [{ current: 8, max: 20 }] });
    const powerOnly = 4;
    const summary = await hit(target, attacker, powerOnly, { damageInstanceId: 'spell-1' });
    expect(summary.transferHealing).toBe(4);
    expect(attacker.system.health.bars[0].current).toBe(12);
    expect(summary.transferHealing).not.toBe(powerOnly + 3);
  });

  it('does not heal when the attack fails', async () => {
    expect(damageTransferApplies({ damageTransfer: true, hit: false })).toBe(false);
    const target = actor({ id: 't-miss', bars: [{ current: 20, max: 20 }] });
    const attacker = actor({ id: 'a-miss', bars: [{ current: 5, max: 20 }] });
    const summary = await hit(target, attacker, 9, {
      damageInstanceId: 'miss-1',
      attackSucceeded: false,
    });
    expect(summary.transferHealing).toBe(0);
    expect(target.system.health.bars[0].current).toBe(20);
    expect(attacker.system.health.bars[0].current).toBe(5);
  });

  it('does not heal when armor prevents the entire hit', async () => {
    const target = actor({ id: 't-armor', bars: [{ current: 20, max: 20 }], armor: 50 });
    const attacker = actor({ id: 'a-armor', bars: [{ current: 5, max: 20 }] });
    const summary = await hit(target, attacker, 8, { damageInstanceId: 'armor-1' });
    expect(summary.transferHealing).toBe(0);
    expect(summary.barDamage).toBe(0);
    expect(target.system.health.bars[0].current).toBe(20);
    expect(attacker.system.health.bars[0].current).toBe(5);
  });

  it('does not heal when Temporary HP absorbs the entire hit', async () => {
    const target = actor({ id: 't-temp', bars: [{ current: 20, max: 20 }], tempHP: 12 });
    const attacker = actor({ id: 'a-temp', bars: [{ current: 5, max: 20 }] });
    const summary = await hit(target, attacker, 8, { damageInstanceId: 'temp-1' });
    expect(summary.transferHealing).toBe(0);
    expect(summary.tempHPAbsorbed).toBe(8);
    expect(target.system.health.bars[0].current).toBe(20);
    expect(attacker.system.health.bars[0].current).toBe(5);
  });

  it('heals at most the real HP lost, discarding overkill', async () => {
    const target = actor({ id: 't-seven', bars: [{ current: 7, max: 20 }] });
    const attacker = actor({ id: 'a-seven', bars: [{ current: 0, max: 20 }] });
    const summary = await hit(target, attacker, 20, { damageInstanceId: 'seven-1' });
    expect(summary.transferHealing).toBe(7);
    expect(target.system.health.bars[0].current).toBe(0);
    expect(attacker.system.health.bars[0].current).toBe(7);
  });

  it('caps healing at the missing HP on the attacker’s current Health Bar', async () => {
    const target = actor({ id: 't-cap', bars: [{ current: 20, max: 20 }] });
    const attacker = actor({ id: 'a-cap', bars: [{ current: 7, max: 10 }] });
    const summary = await hit(target, attacker, 7, { damageInstanceId: 'cap-1' });
    expect(summary.transferHealing).toBe(3);
    expect(attacker.system.health.bars[0].current).toBe(10);
    expect(target.system.health.bars[0].current).toBe(13);
  });

  it('does not fill a scarred Health Bar', async () => {
    const target = actor({ id: 't-scar', bars: [{ current: 20, max: 20 }] });
    const attacker = actor({
      id: 'a-scar',
      currentBar: 1,
      bars: [
        { name: 'Healthy', current: 0, max: 10 },
        { name: 'Bruised', current: 7, max: 10 },
      ],
    });
    const summary = await hit(target, attacker, 7, { damageInstanceId: 'scar-1' });
    expect(summary.transferHealing).toBe(3);
    expect(attacker.system.health.bars[0].current).toBe(0);
    expect(attacker.system.health.bars[1].current).toBe(10);
  });

  it('doubles printed power dice for Limited and does not double the heal', async () => {
    expect(applyLimitedToTransferPowerDamage('4d8', { damageTransfer: true, limited: true })).toBe('8d8');
    expect(applyLimitedToTransferPowerDamage('2d8', { damageTransfer: true, limited: false })).toBe('2d8');
    expect(applyLimitedToTransferPowerDamage('2d8', { damageTransfer: false, limited: true })).toBe('2d8');
    const target = actor({ id: 't-lim', bars: [{ current: 7, max: 20 }] });
    const attacker = actor({ id: 'a-lim', bars: [{ current: 0, max: 30 }] });
    const summary = await hit(target, attacker, 7, { damageInstanceId: 'limited-1' });
    expect(summary.transferHealing).toBe(7);
    expect(attacker.system.health.bars[0].current).toBe(7);
  });

  it('uses the HP actually lost after a maximized damage roll', async () => {
    const target = actor({ id: 't-max', bars: [{ current: 20, max: 20 }], armor: 9 });
    const attacker = actor({ id: 'a-max', bars: [{ current: 0, max: 30 }] });
    const maximizedPool = 16;
    const summary = await hit(target, attacker, maximizedPool, { damageInstanceId: 'max-1' });
    expect(summary.transferHealing).toBe(7);
    expect(summary.transferHealing).not.toBe(maximizedPool);
    expect(attacker.system.health.bars[0].current).toBe(7);
    expect(target.system.health.bars[0].current).toBe(13);
  });

  it('heals a damage instance exactly once when the resolver runs twice', async () => {
    const target = actor({ id: 't-once', bars: [{ current: 20, max: 20 }] });
    const attacker = actor({ id: 'a-once', bars: [{ current: 0, max: 30 }] });
    const first = await hit(target, attacker, 7, { damageInstanceId: 'same-instance' });
    const second = await hit(target, attacker, 7, { damageInstanceId: 'same-instance' });
    expect(first.transferHealing).toBe(7);
    expect(second.transferHealing).toBe(0);
    expect(attacker.system.health.bars[0].current).toBe(7);
    expect(target.system.health.bars[0].current).toBe(6);
  });

  it('matches both printed PL 1–16 tables', () => {
    const melee = ACTIVE_TEMPLATES.find((t) => t.templateId === 'active-melee-single-target-damage-transfer');
    const ranged = ACTIVE_TEMPLATES.find((t) => t.templateId === 'active-ranged-single-target-damage-transfer');
    expect(melee?.name).toBe('Melee Single Target Damage Transfer');
    expect(ranged?.name).toBe('Ranged Single Target Damage Transfer');
    for (let level = 1; level <= 16; level++) {
      const meleeRow = melee!.levels[String(level) as '1'];
      const rangedRow = ranged!.levels[String(level) as '1'];
      expect(meleeRow.effect.dice).toBe(`${MELEE_DICE[level - 1]}d8`);
      expect(meleeRow.range?.kind).toBe('melee');
      expect(meleeRow.mechanics.damageTransfer).toBe(true);
      expect(meleeRow.aoe?.shape).toBe('none');
      expect(rangedRow.effect.dice).toBe(`${level}d8`);
      expect(rangedRow.range).toMatchObject({ kind: 'distance', m: 8 + (level - 1) * 4 });
      expect(rangedRow.mechanics.damageTransfer).toBe(true);
      expect(rangedRow.aoe?.shape).toBe('none');
    }
    expect(isDamageTransferPower({ system: { templateId: melee!.templateId } })).toBe(true);
    expect(isDamageTransferPower({ system: { templateId: 'active-melee-health-level-heal' } })).toBe(false);
  });

  it('runs through applyDamageToTarget, the resolver the attack card calls', async () => {
    expect(damageTransferApplies({ damageTransfer: true, hit: true })).toBe(true);
    const target = actor({ id: 't-live', bars: [{ current: 12, max: 12 }] });
    const attacker = actor({ id: 'a-live', bars: [{ current: 2, max: 12 }] });
    const summary = await applyDamageToTarget(target, 4, attacker, 0, {
      skipPhasing: true,
      skipReactionPrompt: true,
      attackSucceeded: true,
      damageTransfer: damageTransferApplies({ damageTransfer: true, hit: true }),
      damageInstanceId: 'card-message:damage-transfer',
    });
    expect(summary.transferHealing).toBe(4);
    expect(attacker.system.health.bars[0].current).toBe(6);
    expect(target.system.health.bars[0].current).toBe(8);
  });
});
