/**
 * Staff of the Dark — Life Taken must stay on the combat Attack ring.
 *
 * Regression: Transfer Life effect text contains "instance", which used to
 * substring-match `includes('stance')` and get stripped as an Active Buff.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildEchoArtifactTree } from '../src/artifacts/echo-artifact-tree-builder.js';
import { applyDamageToTarget } from '../src/dice/damage-dialog.js';
import {
  damageTransferApplies,
  isDamageTransferTemplateId,
  martialWeaponDamageApplies,
  resetDamageTransferInstances,
  spellFocusDamageApplies,
} from '../src/combat/damage-transfer.js';
import { buildArtifactRadialOptions } from '../src/radial-menu/artifact-options.js';
import {
  getSegmentIdForOption,
  textSuggestsActiveBuff,
} from '../src/radial-menu/options.js';
import { getGeneralArtifact } from '../src/utils/general-artifacts.js';

const RANGED_TRANSFER = 'active-ranged-single-target-damage-transfer';

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

function activatedStaffAtLevel(level: number) {
  const tree = buildEchoArtifactTree(getGeneralArtifact('staffOfTheDark')!);
  const node = tree.nodes.find(
    (n: any) => Number(n.itemData?.system?.currentLevel) === level,
  );
  expect(node, `Staff L${level} node`).toBeTruthy();
  const item = {
    id: node!.nodeId,
    type: 'artifact',
    name: node!.itemData.name,
    system: { ...node!.itemData.system, equipped: true, currentLevel: level },
    getFlag: (_ns: string, key: string) => (key === 'artifactActivated' ? true : undefined),
    flags: { 'mastery-system': { artifactActivated: true } },
  };
  return {
    items: [item],
    system: { mastery: { rank: 4 } },
    getFlag: () => undefined,
  };
}

function actorBars(id: string, current: number, max: number) {
  const system: any = {
    health: { bars: [{ current, max }], currentBar: 0, tempHP: 0 },
    combat: { armorTotal: 0, damageReductionPct: 0 },
    statusEffects: [],
  };
  const doc: any = {
    id,
    name: id,
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

describe('textSuggestsActiveBuff', () => {
  it('does not treat "damage instance" as a Stance', () => {
    expect(textSuggestsActiveBuff('Life Taken I', 'real HP this damage instance removes')).toBe(
      false,
    );
    expect(textSuggestsActiveBuff('Iron Stance', 'enter a defensive stance')).toBe(true);
    expect(textSuggestsActiveBuff('Armor Buff', 'active buff')).toBe(true);
  });
});

describe('Staff of the Dark L3 — Life Taken combat radial', () => {
  beforeEach(() => {
    installFoundry();
    resetDamageTransferInstances();
    vi.restoreAllMocks();
  });

  it('keeps Life Taken I on the Attack ring with Might and Vision', () => {
    const actor = activatedStaffAtLevel(3);
    const built = buildArtifactRadialOptions(actor);
    const combatVisible = built.filter((o) => getSegmentIdForOption(o) !== 'active-buff');
    const names = combatVisible.map((o) => o.name);

    expect(names.some((n) => /Might of the Dark/i.test(n))).toBe(true);
    expect(names.some((n) => /Life Taken/i.test(n))).toBe(true);
    expect(names.some((n) => /Vision of the End/i.test(n))).toBe(true);

    const life = combatVisible.find((o) => /Life Taken/i.test(o.name))!;
    expect(getSegmentIdForOption(life)).toBe('attack');
    expect(life.slot).toBe('attack');
    expect(life.artifactIsSpell).toBe(true);
    expect(life.artifactPowerTemplateId).toBe(RANGED_TRANSFER);
    expect(life.artifactCastingAttribute).toBe('resolve');
    expect(Number(life.range ?? life.rangeMeters)).toBeGreaterThanOrEqual(20);
    expect(life.description).toMatch(/instance/i);
  });

  it('executes as Transfer Life: 4d8 printed, no WD/Focus, heal = real HP lost', async () => {
    const actor = activatedStaffAtLevel(3);
    const life = buildArtifactRadialOptions(actor).find((o) => /Life Taken/i.test(o.name))!;
    expect(isDamageTransferTemplateId(life.artifactPowerTemplateId)).toBe(true);

    // Spell delivery: no weapon damage, Focus allowed for single-target Spells
    // (Staff Focus is separate; Transfer Life printed dice stay 4d8 at stage I).
    expect(
      martialWeaponDamageApplies({
        ignoreWeaponDamage: true,
        powerIsSpell: true,
      }),
    ).toBe(false);
    expect(spellFocusDamageApplies({ isSpell: true })).toBe(true);

    const target = actorBars('victim', 20, 20);
    target.system.combat.armorTotal = 5;
    const attacker = actorBars('oda', 4, 20);

    const rolled = 10; // printed Power Damage pool (not the heal amount)
    const summary = await applyDamageToTarget(target, rolled, attacker, 0, {
      skipPhasing: true,
      skipReactionPrompt: true,
      attackSucceeded: true,
      damageTransfer: damageTransferApplies({ damageTransfer: true, hit: true }),
      damageInstanceId: 'staff-life-taken:l3',
      ignoreWeaponDamage: true,
      powerIsSpell: true,
    });

    // Armor 5 → 5 HP actually removed from the target; heal equals that, not the roll.
    expect(summary.transferHealing).toBe(5);
    expect(summary.transferHealing).not.toBe(rolled);
    expect(target.system.health.bars[0].current).toBe(15);
    expect(attacker.system.health.bars[0].current).toBe(9);
  });

  it('same Transfer Life template is not demoted when used as a catalog power', () => {
    const opt: any = {
      id: 'power-transfer',
      name: 'Ranged Single Target Damage Transfer',
      description:
        'Deal 4d8 damage on hit. The attacker heals HP equal to the real HP this damage instance removes from the target.',
      slot: 'attack',
      source: 'power',
      powerType: 'active',
      costsAction: true,
      item: {
        type: 'power',
        system: {
          powerType: 'active',
          templateId: RANGED_TRANSFER,
          cost: { action: 'attack' },
          description:
            'Deal 4d8 damage on hit. The attacker heals HP equal to the real HP this damage instance removes from the target.',
        },
      },
      tags: ['attack'],
    };
    expect(getSegmentIdForOption(opt)).toBe('attack');
  });
});
