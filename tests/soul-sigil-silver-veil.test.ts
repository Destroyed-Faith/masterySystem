import { describe, expect, it } from 'vitest';
import { buildEchoArtifactTree } from '../src/artifacts/echo-artifact-tree-builder';
import { getGeneralArtifact } from '../src/utils/general-artifacts';
import { buildArtifactBaseValueBreakdown } from '../src/utils/artifact-base-values';
import {
  noArmorEvadeForLevel,
  soulSigilArmorForLevel,
  soulSigilArmorTotalForLevel,
} from '../src/utils/artifact-base-derive';
import { resolveArtifactBodyArmor } from '../src/utils/artifact-armor-weight';

describe('Soul Sigil Silver Veil curves', () => {
  it('Armor totals 4→8 in paired bands; Evade +3→+12', () => {
    const armorTotals = [4, 4, 5, 5, 6, 6, 7, 7, 8, 8];
    for (let lvl = 1; lvl <= 10; lvl++) {
      expect(soulSigilArmorTotalForLevel(lvl)).toBe(armorTotals[lvl - 1]);
      expect(soulSigilArmorForLevel(lvl)).toBe(armorTotals[lvl - 1]! - 4);
      expect(noArmorEvadeForLevel(lvl)).toBe(2 + lvl);
    }
  });

  it('resolveArtifactBodyArmor uses Light base + bonus (no double-count)', () => {
    const resolved = resolveArtifactBodyArmor(
      {
        slot: 'a',
        type: 'bodyArmor',
        label: 'Light Armor',
        value: 0,
        armorWeightClass: 'light',
      } as any,
      { slot: 'body' },
    );
    expect(resolved?.baseArmor).toBe(4);
    expect(resolved?.bonusArmor).toBe(0);
    expect(resolved?.totalArmor).toBe(4);
  });

  it('equipped L1 Soul Sigil contributes Armor 4 and Evade +3 to breakdown', () => {
    const tree = buildEchoArtifactTree(getGeneralArtifact('soulSigil')!);
    const node = tree.nodes[0]!.itemData;
    const actor = {
      items: [
        {
          ...node,
          type: 'artifact',
          name: 'Soul Sigil - Level 1-1',
          system: {
            ...(node.system as any),
            equipped: true,
            currentLevel: 1,
            slot: 'body',
          },
        },
      ],
    };
    const bv = buildArtifactBaseValueBreakdown(actor);
    expect(bv.armorBonus).toBe(4);
    expect(bv.evadeBonus).toBe(3);
    expect(bv.rows.armor[0]?.typeLabel).toMatch(/Light/i);
    expect(bv.rows.evade[0]?.value).toBe(3);
    expect(bv.rows.notes.some((n) => /suppressed/i.test(String(n.label)))).toBe(false);
  });
});
