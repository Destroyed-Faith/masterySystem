import { beforeEach, describe, expect, it } from 'vitest';
import { getActiveSpecialValue, readActiveSpecials } from '../src/system/active-specials';
import { attributePoolReduction } from '../src/system/pool-reduction';
import {
  SPECIAL_AURA_ELIGIBLE,
  SPECIAL_AURA_RADIUS_M,
  SUMMON_ARMOR_AURA_BONUS,
  SUMMON_AURA_RADIUS_M,
  SUMMON_DAMAGE_AURA_DICE,
  summonArmorAuraBonus,
  summonDamageAuraBonusDice,
} from '../src/combat/aura-modifiers';
import { applyNaturalSpecialRecovery } from '../src/combat/special-application';
import { pulseActiveBuffAuras } from '../src/combat/aura-pulse';
import {
  applyDamageToTarget,
  applyWardToIncomingSpecial,
  calculateDamageResult,
} from '../src/dice/damage-dialog';
import { ACTIVE_BUFF_TEMPLATES } from '../src/utils/powers/templates/activeBuffs';
import { PASSIVE_TEMPLATES } from '../src/utils/powers/templates/passives';

function installWorld(actors: any[]): void {
  const g = globalThis as any;
  const byId = new Map(actors.map((actor) => [actor.id, actor]));
  g.game = {
    user: { id: 'gm', isGM: true },
    combat: { id: 'combat-1', round: 1, started: true, combatants: { values: () => actors.map((actor) => ({ actor })) } },
    actors: { get: (id: string) => byId.get(id) ?? null, contents: actors },
    messages: { get: () => null },
  };
  g.Hooks = { callAll: () => undefined, on: () => undefined, off: () => undefined };
  g.ChatMessage = { create: async () => ({ id: 'chat' }), getSpeaker: () => ({}) };
  g.ui = { notifications: { warn: () => undefined, info: () => undefined, error: () => undefined } };
  g.canvas = {
    ready: true,
    scene: { id: 'scene' },
    grid: { size: 100, distance: 1 },
    tokens: { placeables: [] as any[] },
  };
  g.Roll = class {
    formula: string;
    total: number;
    terms: any[];
    constructor(formula: string) {
      this.formula = formula;
      const match = String(formula).match(/(\d+)d8/);
      this.total = match ? Number(match[1]) : 0;
      this.terms = [];
    }
    async evaluate() {
      return this;
    }
  };
}

function place(actor: any, metersX: number, disposition = 1): void {
  const token = {
    actor,
    scene: { id: 'scene' },
    center: { x: metersX * 100, y: 0 },
    document: { width: 1, height: 1, disposition },
    disposition,
  };
  actor.token = token;
  (globalThis as any).canvas.tokens.placeables.push(token);
}

function creature(id: string, extra: Record<string, unknown> = {}): any {
  const system: any = {
    mastery: { rank: 1 },
    health: { bars: [{ current: 40, max: 40 }], currentBar: 0, tempHP: 0 },
    combat: { armorTotal: 0, damageReductionPct: 0 },
    statusEffects: [],
    passives: {},
    ...(extra.system as object),
  };
  const doc: any = {
    id,
    name: id,
    type: extra.type ?? 'character',
    system,
    items: [],
    effects: extra.effects ?? [],
    flags: {},
    update: async (patch: Record<string, unknown>) => {
      if (patch['system.health.bars']) system.health.bars = patch['system.health.bars'];
      if (patch['system.health.currentBar'] != null) system.health.currentBar = patch['system.health.currentBar'];
      if (patch['system.statusEffects']) system.statusEffects = patch['system.statusEffects'];
      const encoded = patch['flags.mastery-system.statusJson'];
      if (typeof encoded === 'string') {
        doc.flags['mastery-system'] = { ...(doc.flags['mastery-system'] || {}), statusJson: encoded };
      }
      return doc;
    },
  };
  return doc;
}

function specialAura(level: number, choice: string) {
  return {
    slot0: {
      active: true,
      passive: {
        id: 'passive-special-aura',
        templateId: 'passive-special-aura',
        name: 'Special Aura',
        level,
        specialChoice: choice,
      },
    },
  };
}

function summonLink(owner: any, summon: any) {
  owner.system.summonBonds = [
    {
      id: 'bond',
      summonAttacks: 2,
      bodies: [{ id: 'body', summonActorId: summon.id }],
    },
  ];
  summon.type = 'summon';
  summon.system.summonBond = { ownerActorId: owner.id, bondId: 'bond', bodyId: 'body' };
}

function buff(templateId: string, mechanics: Record<string, unknown>) {
  return {
    name: templateId,
    disabled: false,
    flags: { 'mastery-system': { activeBuff: true, powerTemplateId: templateId, mechanics } },
  };
}

describe('P1.9 Special Aura and Summon Auras', () => {
  beforeEach(() => {
    installWorld([]);
  });

  it('prints every PL 1–16 radius, armor, and damage value', () => {
    const damage = ACTIVE_BUFF_TEMPLATES.find((t) => t.templateId === 'ab-summon-damage-aura')!;
    const armor = ACTIVE_BUFF_TEMPLATES.find((t) => t.templateId === 'ab-summon-armor-aura')!;
    const special = PASSIVE_TEMPLATES.find((t) => t.templateId === 'passive-special-aura')!;
    for (let level = 1; level <= 16; level += 1) {
      const d = (damage.levels as any)[String(level)].mechanics.summonDamageAura;
      const a = (armor.levels as any)[String(level)].mechanics.summonArmorAura;
      const s = (special.levels as any)[String(level)].mechanics;
      expect(d.dice).toBe(SUMMON_DAMAGE_AURA_DICE[level - 1]);
      expect(d.radiusM).toBe(SUMMON_AURA_RADIUS_M[level - 1]);
      expect(a.armor).toBe(SUMMON_ARMOR_AURA_BONUS[level - 1]);
      expect(a.radiusM).toBe(SUMMON_AURA_RADIUS_M[level - 1]);
      expect(s.specialAura?.radiusM ?? 0).toBe(SPECIAL_AURA_RADIUS_M[level - 1]);
      if (level <= 3) expect(s.specialAuraUnavailable).toBe(true);
    }
    expect(SPECIAL_AURA_ELIGIBLE.has('weaken')).toBe(true);
    expect(SPECIAL_AURA_ELIGIBLE.has('stunned')).toBe(false);
  });

  it('raises stored Weaken(2) to an effective Weaken(3) and drops it outside the radius', () => {
    const owner = creature('owner', { system: { passives: specialAura(4, 'weaken') } });
    const target = creature('target', { system: { statusEffects: [{ id: 'weaken', value: 2 }] } });
    installWorld([owner, target]);
    place(owner, 0);
    place(target, 1);
    expect(getActiveSpecialValue(target, 'weaken')).toBe(3);
    expect(attributePoolReduction(target, 'might').reduction).toBe(3);
    expect(readActiveSpecials(target).find((row) => row.id === 'weaken')?.value).toBe(2);
    (globalThis as any).canvas.tokens.placeables[1].center.x = 500;
    expect(getActiveSpecialValue(target, 'weaken')).toBe(2);
    (globalThis as any).canvas.tokens.placeables[1].center.x = 100;
    (globalThis as any).canvas.tokens.placeables[0].center.x = 600;
    expect(getActiveSpecialValue(target, 'weaken')).toBe(2);
  });

  it('does not create a Special, boost an ineligible type, or stack two auras', () => {
    const ownerA = creature('a', { system: { passives: specialAura(8, 'weaken') } });
    const ownerB = creature('b', { system: { passives: specialAura(8, 'weaken') } });
    const bare = creature('bare');
    const stunned = creature('stunned', { system: { statusEffects: [{ id: 'stunned', value: 1 }] } });
    const wrong = creature('wrong', {
      system: {
        statusEffects: [{ id: 'weaken', value: 2 }],
        passives: specialAura(8, 'stunned'),
      },
    });
    installWorld([ownerA, ownerB, bare, stunned, wrong]);
    place(ownerA, 0);
    place(ownerB, 0);
    place(bare, 1);
    place(stunned, 1);
    place(wrong, 30);
    expect(getActiveSpecialValue(bare, 'weaken')).toBe(0);
    expect(readActiveSpecials(bare)).toEqual([]);
    expect(getActiveSpecialValue(stunned, 'stunned')).toBe(1);
    expect(getActiveSpecialValue(wrong, 'weaken')).toBe(2);
    const stacked = creature('stacked', { system: { statusEffects: [{ id: 'weaken', value: 2 }] } });
    installWorld([ownerA, ownerB, stacked]);
    place(ownerA, 0);
    place(ownerB, 0);
    place(stacked, 1);
    expect(getActiveSpecialValue(stacked, 'weaken')).toBe(3);
    expect(readActiveSpecials(stacked)[0]?.value).toBe(2);
    getActiveSpecialValue(stacked, 'weaken');
    expect(readActiveSpecials(stacked)[0]?.value).toBe(2);
  });

  it('keeps Special Recovery and Special Negation on the stored value', async () => {
    const owner = creature('owner', { system: { passives: specialAura(6, 'weaken') } });
    const target = creature('target', { system: { statusEffects: [{ id: 'weaken', value: 2 }] } });
    installWorld([owner, target]);
    place(owner, 0);
    place(target, 1);
    target.system.derived = { mechanicsBreakdown: { totals: { wardIncoming: 1 } } };
    const warded = applyWardToIncomingSpecial(target, 'weaken', 'Weaken', 2);
    expect(warded.value).toBe(1);
    target.system.statusEffects = [{ id: 'weaken', value: warded.value }];
    expect(getActiveSpecialValue(target, 'weaken')).toBe(2);
    target.system.statusEffects = [{ id: 'weaken', value: 2 }];
    const combat = {
      id: 'combat-1',
      round: 1,
      started: true,
      combatant: { actor: target },
    };
    (globalThis as any).game.combat = { ...((globalThis as any).game.combat), ...combat };
    const recovered = await applyNaturalSpecialRecovery(target, 'weaken', combat);
    expect(recovered.ok).toBe(true);
    expect(recovered.after).toBe(1);
    expect(readActiveSpecials(target).find((row) => row.id === 'weaken')?.value).toBe(1);
    expect(getActiveSpecialValue(target, 'weaken')).toBe(2);
    target.system.statusEffects = [];
    delete target.flags['mastery-system']?.statusJson;
    expect(getActiveSpecialValue(target, 'weaken')).toBe(0);
  });

  it('adds Summon Damage Aura dice only to the owner’s in-range Summon attacks', async () => {
    const owner = creature('caster', {
      effects: [buff('ab-summon-damage-aura', { summonDamageAura: { dice: 3, radiusM: 12 } })],
    });
    const summon = creature('summon', { type: 'summon' });
    const ally = creature('ally');
    const foreign = creature('foreign', { type: 'summon' });
    const other = creature('other');
    summonLink(owner, summon);
    other.system.summonBonds = [{ id: 'other-bond', bodies: [{ id: 'ob', summonActorId: foreign.id }] }];
    foreign.system.summonBond = { ownerActorId: other.id, bondId: 'other-bond', bodyId: 'ob' };
    installWorld([owner, summon, ally, foreign, other]);
    place(owner, 0);
    place(summon, 2);
    place(ally, 2);
    place(foreign, 2);
    place(other, 0);
    expect(summonDamageAuraBonusDice(summon)).toBe(3);
    expect(summonDamageAuraBonusDice(owner)).toBe(0);
    expect(summonDamageAuraBonusDice(ally)).toBe(0);
    expect(summonDamageAuraBonusDice(foreign)).toBe(0);

    const first = await calculateDamageResult('0', '2d8', '0', 0, new Map(), [], summon, owner, 0, 0, [], null, false, 'melee', false);
    const second = await calculateDamageResult('0', '2d8', '0', 0, new Map(), [], summon, owner, 0, 0, [], null, false, 'melee', false);
    expect(first.totalDamage).toBe(5);
    expect(second.totalDamage).toBe(5);

    (globalThis as any).canvas.tokens.placeables.find((t: any) => t.actor === summon).center.x = 2000;
    const outside = await calculateDamageResult('0', '2d8', '0', 0, new Map(), [], summon, owner, 0, 0, [], null, false, 'melee', false);
    expect(outside.totalDamage).toBe(2);

    (globalThis as any).canvas.tokens.placeables.find((t: any) => t.actor === summon).center.x = 200;
    summon.system.summonBond = { ownerActorId: 'missing', bondId: 'bond', bodyId: 'body' };
    expect(summonDamageAuraBonusDice(summon)).toBe(0);
    owner.effects = [buff('ab-evade', { evade: 4 })];
    summon.system.summonBond = { ownerActorId: owner.id, bondId: 'bond', bodyId: 'body' };
    expect(summonDamageAuraBonusDice(summon)).toBe(0);
    expect(summon.system.combat.extraDamageDice ?? 0).toBe(0);
  });

  it('changes Summon Armor mitigation while the Summon is inside the aura', async () => {
    const owner = creature('caster', {
      effects: [buff('ab-summon-armor-aura', { summonArmorAura: { armor: 8, radiusM: 14 } })],
    });
    const summon = creature('summon', { type: 'summon', system: { combat: { armorTotal: 4, damageReductionPct: 0 } } });
    summonLink(owner, summon);
    installWorld([owner, summon]);
    place(owner, 0);
    place(summon, 2);
    expect(summonArmorAuraBonus(summon)).toBe(8);
    expect(summon.system.combat.armorTotal).toBe(4);
    const inside = await applyDamageToTarget(summon, 20, owner, 0, { skipPhasing: true, skipReactionPrompt: true });
    expect(inside.mitigatedDamage).toBe(8);
    expect(inside.armorApplied).toBe(12);
    (globalThis as any).canvas.tokens.placeables.find((t: any) => t.actor === summon).center.x = 2000;
    summon.system.health.bars = [{ current: 40, max: 40 }];
    const outside = await applyDamageToTarget(summon, 20, owner, 0, { skipPhasing: true, skipReactionPrompt: true });
    expect(outside.mitigatedDamage).toBe(16);
    (globalThis as any).canvas.tokens.placeables.find((t: any) => t.actor === summon).center.x = 200;
    owner.effects = [];
    summon.system.health.bars = [{ current: 40, max: 40 }];
    const ended = await applyDamageToTarget(summon, 20, owner, 0, { skipPhasing: true, skipReactionPrompt: true });
    expect(ended.mitigatedDamage).toBe(16);
    expect(summon.system.combat.armorTotal).toBe(4);
  });

  it('keeps Damage Aura and Healing Aura as end-of-turn pulses', async () => {
    const owner = creature('owner', {
      effects: [
        buff('ab-summon-damage-aura', { summonDamageAura: { dice: 8, radiusM: 40 } }),
        {
          name: 'Damage Aura',
          disabled: false,
          flags: {
            'mastery-system': {
              activeBuff: true,
              mechanics: { auraPayload: { kind: 'damage', dice: '4d8', targets: 'enemies', radiusM: 2 } },
            },
          },
        },
      ],
    });
    const enemy = creature('enemy');
    installWorld([owner, enemy]);
    place(owner, 0, 1);
    place(enemy, 1, -1);
    await pulseActiveBuffAuras(owner);
    expect(enemy.system.health.bars[0].current).toBe(36);
    await pulseActiveBuffAuras(owner);
    expect(enemy.system.health.bars[0].current).toBe(36);
    owner.flags['mastery-system'].lastAuraPulseKey = '';
    owner.effects = [
      {
        name: 'Healing Aura',
        disabled: false,
        flags: {
          'mastery-system': {
            activeBuff: true,
            mechanics: { auraPayload: { kind: 'healing', dice: '3d8', targets: 'allies', radiusM: 2 } },
          },
        },
      },
    ];
    const ally = creature('ally');
    ally.system.health.bars = [{ current: 10, max: 40 }];
    installWorld([owner, ally]);
    (globalThis as any).canvas.tokens.placeables = [];
    place(owner, 0, 1);
    place(ally, 1, 1);
    (globalThis as any).game.combat.round = 2;
    await pulseActiveBuffAuras(owner);
    expect(ally.system.health.bars[0].current).toBe(13);
  });
});
