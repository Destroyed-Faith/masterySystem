import { describe, expect, it } from 'vitest';
import {
  ARTIFACT_ARMOR_MUNDANE_BASE,
  artifactArmorBonusForLevel,
  artifactArmorEvadeForLevel,
  artifactArmorTotalForLevel,
  deriveBaseValueDisplay,
  type ArtifactArmorWeightClass,
} from '../src/utils/artifact-base-derive';
import { resolveArtifactBodyArmor } from '../src/utils/artifact-armor-weight';
import { buildArtifactBaseValueBreakdown } from '../src/utils/artifact-base-values';
import { BASE_VALUE_LIMIT_BY_SLOT } from '../src/utils/artifact-rules';
import { buildEchoArtifactTree } from '../src/artifacts/echo-artifact-tree-builder';
import { getEchoArtifact } from '../src/utils/echo-artifacts';
import { getGeneralArtifact } from '../src/utils/general-artifacts';

const LIGHT_ARMOR = [4, 4, 5, 5, 6, 6, 7, 7, 8, 8];
const LIGHT_EVADE = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const MEDIUM_ARMOR = [8, 8, 9, 9, 10, 10, 11, 11, 12, 12];
const MEDIUM_EVADE = [-1, -1, 0, 0, 1, 1, 2, 2, 3, 3];
const HEAVY_ARMOR = [12, 12, 13, 13, 14, 14, 15, 15, 16, 16];
const HEAVY_EVADE = [-4, -4, -4, -4, -4, -2, -2, -2, -2, -2];

const BODY_ARMOR_KEYS = [
  { key: 'titanScars', weight: 'medium' as const, via: 'echo' as const },
  { key: 'wyrmScalesHeavy', weight: 'heavy' as const, via: 'echo' as const },
  { key: 'wyrmScalesLight', weight: 'light' as const, via: 'echo' as const },
  { key: 'sentinelFrame', weight: 'light' as const, via: 'echo' as const },
  { key: 'judicatorFrame', weight: 'light' as const, via: 'echo' as const },
  { key: 'oracleFrame', weight: 'light' as const, via: 'echo' as const },
  { key: 'alchemistCoat', weight: 'medium' as const, via: 'echo' as const },
  { key: 'greenWardenMantle', weight: 'medium' as const, via: 'echo' as const },
  { key: 'soulSigil', weight: 'light' as const, via: 'general' as const },
  { key: 'shadowgraveArmor', weight: 'light' as const, via: 'general' as const },
];

function tablesFor(weight: ArtifactArmorWeightClass) {
  if (weight === 'medium') return { armor: MEDIUM_ARMOR, evade: MEDIUM_EVADE };
  if (weight === 'heavy') return { armor: HEAVY_ARMOR, evade: HEAVY_EVADE };
  return { armor: LIGHT_ARMOR, evade: LIGHT_EVADE };
}

function defFor(key: string, via: 'echo' | 'general') {
  return via === 'echo' ? getEchoArtifact(key)! : getGeneralArtifact(key)!;
}

describe('Artifact Body Armor progressions (canonical tables)', () => {
  it('Light / Medium / Heavy Armor + Final Evade match the printed tables at every level', () => {
    for (let lvl = 1; lvl <= 10; lvl++) {
      expect(artifactArmorTotalForLevel('light', lvl)).toBe(LIGHT_ARMOR[lvl - 1]);
      expect(artifactArmorEvadeForLevel('light', lvl)).toBe(LIGHT_EVADE[lvl - 1]);
      expect(artifactArmorTotalForLevel('medium', lvl)).toBe(MEDIUM_ARMOR[lvl - 1]);
      expect(artifactArmorEvadeForLevel('medium', lvl)).toBe(MEDIUM_EVADE[lvl - 1]);
      expect(artifactArmorTotalForLevel('heavy', lvl)).toBe(HEAVY_ARMOR[lvl - 1]);
      expect(artifactArmorEvadeForLevel('heavy', lvl)).toBe(HEAVY_EVADE[lvl - 1]);
    }
  });

  it('stores Armor as bonus over mundane base (4 / 8 / 12)', () => {
    expect(ARTIFACT_ARMOR_MUNDANE_BASE).toEqual({ light: 4, medium: 8, heavy: 12 });
    for (const weight of ['light', 'medium', 'heavy'] as const) {
      for (let lvl = 1; lvl <= 10; lvl++) {
        expect(artifactArmorBonusForLevel(weight, lvl)).toBe(
          artifactArmorTotalForLevel(weight, lvl) - ARTIFACT_ARMOR_MUNDANE_BASE[weight],
        );
      }
    }
  });

  it('Medium Final Evade already includes −2; Heavy Final already includes −4', () => {
    // Artifact Evade Bonus = Final − class drawback
    expect(artifactArmorEvadeForLevel('medium', 1) - -2).toBe(1);
    expect(artifactArmorEvadeForLevel('medium', 10) - -2).toBe(5);
    expect(artifactArmorEvadeForLevel('heavy', 1) - -4).toBe(0);
    expect(artifactArmorEvadeForLevel('heavy', 6) - -4).toBe(2);
    expect(artifactArmorEvadeForLevel('heavy', 10) - -4).toBe(2);
  });

  it('Body slot allows two Base Values (Armor + Evade on A)', () => {
    expect(BASE_VALUE_LIMIT_BY_SLOT.body).toBe(2);
  });
});

describe('resolveArtifactBodyArmor — no class Evade double-count', () => {
  it('returns Armor total from base + bonus and leaves Evade at 0 (Evade is its own BV)', () => {
    const resolved = resolveArtifactBodyArmor({
      slot: 'a',
      type: 'bodyArmor',
      label: 'Medium Armor',
      value: 1, // L3–4 medium bonus
      armorWeightClass: 'medium',
    } as any);
    expect(resolved).toMatchObject({
      baseArmor: 8,
      bonusArmor: 1,
      totalArmor: 9,
      evadeModifier: 0,
      initiativeModifier: -4,
      skillPenaltyDice: 1,
    });
  });

  it('keeps Heavy Initiative −8 and −2d8 Physical Skills', () => {
    const resolved = resolveArtifactBodyArmor({
      slot: 'a',
      type: 'bodyArmor',
      label: 'Heavy Armor',
      value: 0,
      armorWeightClass: 'heavy',
    } as any);
    expect(resolved?.initiativeModifier).toBe(-8);
    expect(resolved?.skillPenaltyDice).toBe(2);
    expect(resolved?.evadeModifier).toBe(0);
  });
});

describe('All Artifact Body Armors seed Armor + Evade on slot A', () => {
  for (const { key, weight, via } of BODY_ARMOR_KEYS) {
    it(`${key} (${weight}) has Armor + Evade both on A at every level`, () => {
      const tree = buildEchoArtifactTree(defFor(key, via));
      const { armor, evade } = tablesFor(weight);
      for (let lvl = 1; lvl <= 10; lvl++) {
        const bvs = (tree.nodes[lvl - 1]!.itemData.system as any).baseValues as any[];
        const armorBv = bvs.find((b) => b.type === 'bodyArmor');
        const evadeBv = bvs.find((b) => b.type === 'evade');
        expect(armorBv, `${key} L${lvl} armor`).toBeTruthy();
        expect(evadeBv, `${key} L${lvl} evade`).toBeTruthy();
        expect(armorBv.slot).toBe('a');
        expect(evadeBv.slot).toBe('a');
        expect(armorBv.armorWeightClass).toBe(weight);
        expect(armorBv.value).toBe(armor[lvl - 1]! - ARTIFACT_ARMOR_MUNDANE_BASE[weight]);
        expect(evadeBv.value).toBe(evade[lvl - 1]);
        const profile = (tree.nodes[lvl - 1]!.itemData.system as any).artifactArmor;
        expect(profile.type).toBe(weight);
        expect(profile.armorValue).toBe(armorBv.value);
        expect(profile.evadeModifier).toBe(evade[lvl - 1]);
      }
    });
  }
});

describe('Runtime breakdown — Armor + Evade on A, Init/Skills from class', () => {
  function equippedBody(weight: ArtifactArmorWeightClass, level: number, name: string) {
    return {
      items: [
        {
          type: 'artifact',
          name,
          system: {
            slot: 'body',
            equipped: true,
            currentLevel: level,
            level,
            artifactArmor: { type: weight },
            baseValues: [
              {
                slot: 'a',
                type: 'bodyArmor',
                label: `${weight} Armor`,
                value: artifactArmorBonusForLevel(weight, level),
                armorWeightClass: weight,
              },
              {
                slot: 'a',
                type: 'evade',
                label: 'Evade',
                value: artifactArmorEvadeForLevel(weight, level),
              },
            ],
          },
          getFlag: () => ({ slot: 'body' }),
        },
      ],
    };
  }

  it('Light L1 → Armor 4, Evade +2, no Init/Skill penalty', () => {
    const bd = buildArtifactBaseValueBreakdown(equippedBody('light', 1, 'Light Suit'));
    expect(bd.armorBonus).toBe(4);
    expect(bd.evadeBonus).toBe(2);
    expect(bd.bodyArmorClassPenalty).toBeNull();
    expect(bd.rows.notes.some((n) => /suppressed/i.test(String(n.label)))).toBe(false);
  });

  it('Medium L1 → Armor 8, Final Evade −1, Init −4, −1d8 skills', () => {
    const bd = buildArtifactBaseValueBreakdown(equippedBody('medium', 1, 'Titan Scars'));
    expect(bd.armorBonus).toBe(8);
    expect(bd.evadeBonus).toBe(-1);
    expect(bd.bodyArmorClassPenalty).toMatchObject({
      evade: 0,
      initiative: -4,
      skillPenaltyDice: 1,
    });
  });

  it('Medium L5 → Armor 10, Final Evade +1', () => {
    const bd = buildArtifactBaseValueBreakdown(equippedBody('medium', 5, 'Alchemist Coat'));
    expect(bd.armorBonus).toBe(10);
    expect(bd.evadeBonus).toBe(1);
  });

  it('Heavy L1 → Armor 12, Final Evade −4, Init −8, −2d8 skills', () => {
    const bd = buildArtifactBaseValueBreakdown(equippedBody('heavy', 1, 'Wyrm Scales'));
    expect(bd.armorBonus).toBe(12);
    expect(bd.evadeBonus).toBe(-4);
    expect(bd.bodyArmorClassPenalty).toMatchObject({
      evade: 0,
      initiative: -8,
      skillPenaltyDice: 2,
    });
  });

  it('Heavy L6 → Armor 14, Final Evade −2 (partial recovery)', () => {
    const bd = buildArtifactBaseValueBreakdown(equippedBody('heavy', 6, 'Wyrm Scales'));
    expect(bd.armorBonus).toBe(14);
    expect(bd.evadeBonus).toBe(-2);
  });

  it('does not double-count Medium/Heavy class Evade on top of Final Evade BV', () => {
    const bd = buildArtifactBaseValueBreakdown(equippedBody('medium', 10, 'Green Warden'));
    // Final Evade is +3; class −2 must NOT also apply.
    expect(bd.evadeBonus).toBe(3);
    expect(bd.bodyArmorClassPenalty?.evade ?? 0).toBe(0);
  });
});

describe('deriveBaseValueDisplay for body armor weight class', () => {
  it('returns parseable bonus / evade for node-editor data-derived', () => {
    const armor = deriveBaseValueDisplay('bodyArmor', 1, 'medium');
    expect(armor.display).toBe('0');
    expect(armor.label).toMatch(/Armor 8/);
    const evade = deriveBaseValueDisplay('evade', 1, 'medium');
    expect(evade.display).toBe('-1');
    expect(evade.label).toMatch(/-1 Evade/);
  });
});
