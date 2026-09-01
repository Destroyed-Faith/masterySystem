import { describe, expect, it } from 'vitest';

import {
  checkWeaponRange,
  npcMaxRangeM,
  parseMaxRangeM,
  rangeTextFromMax,
  DEFAULT_WEAPON_RANGE_M,
} from '../src/utils/range-bands.js';
import { usesThreatenedRangedWeaponRules } from '../src/combat/threatened-ranged.js';
import { npcAttackKeepDice, resolveNpcAttackTargeting } from '../src/utils/npc-attack-model.js';

describe('flat weapon ranges (PG Weapon Properties)', () => {
  it('parses printed and legacy range strings to a flat maximum', () => {
    expect(parseMaxRangeM('32 m')).toBe(32);
    expect(parseMaxRangeM('Ranged (32 m)')).toBe(32);
    expect(parseMaxRangeM('Thrown (16 m)')).toBe(16);
    expect(parseMaxRangeM('8/16/32m')).toBe(32);
    expect(parseMaxRangeM('')).toBeNull();
    expect(rangeTextFromMax(24)).toBe('24m');
  });

  it('NPC stat-block Max is the flat maximum (default 32 m when unset)', () => {
    expect(npcMaxRangeM(24)).toBe(24);
    expect(npcMaxRangeM(0)).toBe(DEFAULT_WEAPON_RANGE_M);
  });

  it('full pool inside the maximum, illegal beyond it — no band reduction', () => {
    expect(checkWeaponRange({ rangeText: '32 m', distanceM: 1 }).inRange).toBe(true);
    expect(checkWeaponRange({ rangeText: '32 m', distanceM: 32 }).inRange).toBe(true);
    expect(checkWeaponRange({ rangeText: '32 m', distanceM: 33 }).inRange).toBe(false);
    expect(checkWeaponRange({ rangeText: null, distanceM: 40 }).maxRangeM).toBe(
      DEFAULT_WEAPON_RANGE_M,
    );
  });

  it('npcAttackKeepDice uses the printed per-attack Keep, else the actor MR', () => {
    expect(npcAttackKeepDice({ keepDice: 1 } as any, 3)).toBe(1);
    expect(npcAttackKeepDice({ keepDice: 2 } as any, 3)).toBe(2);
    expect(npcAttackKeepDice({} as any, 3)).toBe(3);
    expect(npcAttackKeepDice(null, 0)).toBe(1);
  });

  it('resolveNpcAttackTargeting ignores legacy Short and uses flat maximum only', () => {
    const t = resolveNpcAttackTargeting({
      npcRangeKind: 'ranged',
      npcRangeMinMeters: 12,
      npcRangeMeters: 24,
    } as any);
    expect(t.isRanged).toBe(true);
    expect(t.rangedMinM).toBe(0);
    expect(t.rangedMaxM).toBe(24);
    expect(t.rangeM).toBe(24);
  });
});

describe('Threatened Ranged for NPC martial ranged', () => {
  it('applies to npc-attack with ranged tag when not a spell', () => {
    expect(
      usesThreatenedRangedWeaponRules({}, {
        source: 'npc-attack',
        tags: ['attack', 'npc-attack', 'ranged'],
        npcIsSpell: false,
      } as any),
    ).toBe(true);
  });

  it('does not apply to NPC spell ranged attacks', () => {
    expect(
      usesThreatenedRangedWeaponRules({}, {
        source: 'npc-attack',
        tags: ['attack', 'npc-attack', 'ranged'],
        npcIsSpell: true,
      } as any),
    ).toBe(false);
  });

  it('does not apply to melee npc-attack', () => {
    expect(
      usesThreatenedRangedWeaponRules({}, {
        source: 'npc-attack',
        tags: ['attack', 'npc-attack', 'melee'],
      } as any),
    ).toBe(false);
  });
});
