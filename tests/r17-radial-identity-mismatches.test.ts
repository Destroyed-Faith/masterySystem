/**
 * R-17 Forge shadow gaps (radial.getSegmentIdForOption):
 * 1. Consumable potions — propagate Minor Magic snapshot.templateId
 * 2. Artifact movement rows — preserve artifactPowerTemplateId
 * 3. Ruin Breath — keep K3 dragon-breath + templateId (ruin mechanics via mode flags)
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { buildConsumableAttackOption } from '../src/utils/consumable-slots.js';
import { buildArtifactRadialOptions } from '../src/radial-menu/artifact-options.js';
import { getSegmentIdForOption } from '../src/radial-menu/options.js';
import { resolvePowerIdentity } from '../src/utils/power-identity.js';
import {
  clearIdentityShadowLog,
  getIdentityShadowLog,
  setIdentityShadowEnabled,
} from '../src/utils/identity-shadow.js';

function potionOfMoonlightMending(id = 'vDZ9GD9Ut3KDevZR') {
  return {
    id,
    name: 'Potion of Moonlight Mending I',
    img: 'icons/svg/heal.svg',
    type: 'gear',
    system: { consumable: true },
    flags: {
      'mastery-system': {
        equipment: { container: 'inventory', consumableSlot: 0 },
        minorMagic: {
          creatorId: 'creator-1',
          creatorName: 'Alaris',
          form: 'potion',
          snapshot: {
            powerId: 'mending-1',
            powerName: 'Moonlight Mending I',
            templateId: 'active-ranged-single-heal',
            templateName: 'Ranged Single Target Heal',
            powerLevel: 4,
            definitionRank: 4,
            category: 'active',
            actionCost: 'attack',
            isSpell: true,
            castingAttribute: 'resolve',
            attackPool: { attribute: 'resolve', numDice: 0, keepDice: 0 },
            damage: '—',
            healing: 'Heal',
            range: '8 m',
            aoe: 'Single',
            aoeShape: 'single',
            targets: 1,
            duration: 'Instant',
            specials: '—',
            effect: 'Heal one ally.',
            chosenSpecialKey: '',
          },
        },
      },
    },
    getFlag(scope: string, key: string) {
      return (this as any).flags?.[scope]?.[key];
    },
  };
}

function actorWithArtifacts(items: any[]) {
  return {
    id: 'act-r17',
    name: 'Hero',
    system: { mastery: { rank: 3 } },
    items,
    getFlag() {
      return undefined;
    },
  };
}

function flag(data: Record<string, unknown>) {
  return (scope: string, key: string) =>
    scope === 'mastery-system' ? (data as any)[key] : undefined;
}

describe('R-17 radial identity mismatches', () => {
  beforeEach(() => {
    clearIdentityShadowLog();
    setIdentityShadowEnabled(true);
  });

  describe('1. Consumable Potion of Moonlight Mending I', () => {
    it('propagates snapshot.templateId onto the radial option', () => {
      const option = buildConsumableAttackOption(
        { system: { mastery: { rank: 3 } } },
        potionOfMoonlightMending(),
      );
      expect(option.item.system.templateId).toBe('active-ranged-single-heal');
      expect(option.item.system.rank).toBe(4);
      expect(option.slot).toBe('attack');
      expect(option.consumableItemId).toBe('vDZ9GD9Ut3KDevZR');
    });

    it('resolves identity and matches attack segment (consumable attack-slot policy)', () => {
      const option = buildConsumableAttackOption(
        { system: { mastery: { rank: 3 } } },
        potionOfMoonlightMending('9DqYYeXAOExMJBeS'),
      );
      const id = resolvePowerIdentity({ kind: 'radial-option', option });
      expect(id.ok).toBe(true);
      if (id.ok) {
        expect(id.templateId).toBe('active-ranged-single-heal');
        expect(id.category).toBe('active');
      }
      expect(getSegmentIdForOption(option)).toBe('attack');
      const shadow = getIdentityShadowLog().find(
        (e) => e.siteId === 'radial.getSegmentIdForOption' && e.ref?.optionId === option.id,
      );
      expect(shadow?.equal).toBe(true);
      expect(shadow?.legacy).toBe('attack');
      expect(shadow?.identity).toBe('attack');
    });
  });

  describe('2. Artifact movement rows', () => {
    it('preserves artifactPowerTemplateId for Dragon Wings I (movement-flight)', () => {
      const scales = {
        id: 'YKYNcATGmbUS7yEL',
        type: 'artifact',
        name: 'Serpent Scales - Level 2-1',
        system: {
          equipped: true,
          binding: 'echo',
          currentLevel: 2,
          levelProgression: [
            {
              level: 1,
              name: 'Dragon Wings I',
              type: 'Movement',
              range: 'Self',
              effect: 'Fly up to 6 m.',
              powerTemplateId: 'movement-flight',
              rank: 4,
            },
            {
              level: 2,
              name: 'Serpent Evasion I',
              type: 'Active Buff',
              powerTemplateId: 'ab-evade',
              rank: 4,
            },
          ],
        },
        flags: { 'mastery-system': { artifactActivated: true, echoArtifactKey: 'wyrmScalesLight' } },
        getFlag: flag({ artifactActivated: true, echoArtifactKey: 'wyrmScalesLight' }),
      };
      const wings = buildArtifactRadialOptions(actorWithArtifacts([scales])).find(
        (o) => o.name === 'Dragon Wings I',
      );
      expect(wings).toBeTruthy();
      expect((wings as any).artifactPowerTemplateId).toBe('movement-flight');
      expect((wings as any).rank).toBe(4);
      const id = resolvePowerIdentity({ kind: 'radial-option', option: wings });
      expect(id.ok).toBe(true);
      if (id.ok) {
        expect(id.templateId).toBe('movement-flight');
        expect(id.category).toBe('movement');
      }
      expect(getSegmentIdForOption(wings!)).toBe('movement');
      const shadow = getIdentityShadowLog().find(
        (e) => e.ref?.optionId === wings!.id && e.siteId === 'radial.getSegmentIdForOption',
      );
      expect(shadow?.equal).toBe(true);
    });

    it('preserves artifactPowerTemplateId for Elorian Cling I (movement-wall-walk)', () => {
      const stride = {
        id: '4UfdSf0d4CpJOtQ6',
        type: 'artifact',
        name: 'Elorian Stride - Level 2-1',
        system: {
          equipped: true,
          binding: 'echo',
          currentLevel: 2,
          levelProgression: [
            {
              level: 1,
              name: 'Otherworld Reflex I',
              type: 'Reaction',
              powerTemplateId: 'reaction-evade',
              rank: 2,
            },
            {
              level: 2,
              name: 'Elorian Cling I',
              type: 'Movement',
              range: 'Self',
              effect: 'Move along walls/ceilings.',
              powerTemplateId: 'movement-wall-walk',
              rank: 4,
            },
          ],
        },
        flags: { 'mastery-system': { artifactActivated: true, echoArtifactKey: 'elorianStride' } },
        getFlag: flag({ artifactActivated: true, echoArtifactKey: 'elorianStride' }),
      };
      const cling = buildArtifactRadialOptions(actorWithArtifacts([stride])).find(
        (o) => o.name === 'Elorian Cling I',
      );
      expect(cling).toBeTruthy();
      expect((cling as any).artifactPowerTemplateId).toBe('movement-wall-walk');
      const id = resolvePowerIdentity({ kind: 'radial-option', option: cling });
      expect(id.ok).toBe(true);
      if (id.ok) expect(id.templateId).toBe('movement-wall-walk');
      expect(getSegmentIdForOption(cling!)).toBe('movement');
      expect(
        getIdentityShadowLog().some(
          (e) => e.ref?.optionId === cling!.id && e.equal === true,
        ),
      ).toBe(true);
    });
  });

  describe('3. Ruin Breath K3 contract', () => {
    it('keeps dragon-breath + active-melee-weapon-aoe while preserving ruin-only flags', () => {
      const head = {
        id: 'IqH2PUiBdJzevU5Q',
        type: 'artifact',
        name: 'Dragon Head - Level 3-1',
        system: {
          equipped: true,
          binding: 'echo',
          currentLevel: 3,
          naturalWeapon: { name: 'Bite', weaponType: 'melee', hands: 0 },
          artifactWeapon: { damage: '3d8', name: 'Bite', isNatural: true },
          levelProgression: [
            {
              level: 1,
              name: 'Breath Weapon I',
              type: 'Melee AoE',
              range: 'Self',
              aoe: 'Damage: Cone 3 m / Ruin: Cone 3 m',
              effect: 'Damage Breath or Ruin Breath',
              powerTemplateId: 'active-melee-weapon-aoe',
              artifactFunctionId: 'dragon-breath',
              rank: 4,
            },
          ],
        },
        flags: { 'mastery-system': { artifactActivated: true, echoArtifactKey: 'dragonHead' } },
        getFlag: flag({ artifactActivated: true, echoArtifactKey: 'dragonHead' }),
      };
      const opts = buildArtifactRadialOptions(actorWithArtifacts([head]));
      const ruin = opts.find((o) => /Ruin Breath/i.test(o.name));
      const damage = opts.find((o) => /Damage Breath/i.test(o.name));
      expect(ruin).toBeTruthy();
      expect(damage).toBeTruthy();

      expect((ruin as any).artifactFunctionId).toBe('dragon-breath');
      expect((ruin as any).artifactPowerTemplateId).toBe('active-melee-weapon-aoe');
      expect((ruin as any).dragonHeadBreathMode).toBe('ruin');
      expect(ruin!.ignoreWeaponDamage).toBe(true);
      expect((ruin as any).forcedWeaponItemId).toBeUndefined();
      expect((ruin as any).artifactRowSpecial).toMatch(/Ruin\(/);

      const id = resolvePowerIdentity({ kind: 'radial-option', option: ruin });
      expect(id.ok).toBe(true);
      if (id.ok) {
        expect(id.artifactFunctionId).toBe('dragon-breath');
        expect(id.templateId).toBe('active-melee-weapon-aoe');
      }

      expect(getSegmentIdForOption(ruin!)).toBe('attack');
      const shadow = getIdentityShadowLog().find(
        (e) => e.ref?.optionId === ruin!.id && e.siteId === 'radial.getSegmentIdForOption',
      );
      expect(shadow?.equal).toBe(true);
      expect(shadow?.identity).toBe('attack');
    });
  });
});
