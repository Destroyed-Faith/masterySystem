import { describe, expect, it } from 'vitest';
import {
  BLOOD_TEXTURES,
  BLOOD_TRAIL_TEXTURE_ANGLE,
  BLOOD_TRAIL_TEXTURES,
  bloodSpriteSize,
  bloodTrailRotation,
  bloodTrailWaypoints,
  didLoseHealthLevel,
  hpLostFromHealthUpdate,
  normalizeBloodIntensity,
  pickBloodTexturePath,
  pickBloodTrailPath,
  resolveBloodIntensity,
  shouldLeaveBloodTrail,
} from '../src/utils/blood-pool';

describe('resolveBloodIntensity', () => {
  it('returns heavy when a health level is lost', () => {
    expect(resolveBloodIntensity({ barDamage: 3, healthLevelLost: true })).toBe('heavy');
  });

  it('returns light for a small HP chip', () => {
    expect(resolveBloodIntensity({ barDamage: 2, healthLevelLost: false })).toBe('light');
  });

  it('returns medium for a large chip without level loss', () => {
    expect(resolveBloodIntensity({ barDamage: 5, healthLevelLost: false })).toBe('medium');
  });

  it('uses bar max so a 3-point chip on a 20 HP bar stays light', () => {
    expect(
      resolveBloodIntensity({ barDamage: 3, healthLevelLost: false, barMax: 20 }),
    ).toBe('light');
  });

  it('uses bar max so an 8-point chip on a 20 HP bar is medium', () => {
    expect(
      resolveBloodIntensity({ barDamage: 8, healthLevelLost: false, barMax: 20 }),
    ).toBe('medium');
  });

  it('returns null when no bar damage and no level loss', () => {
    expect(resolveBloodIntensity({ barDamage: 0, healthLevelLost: false })).toBeNull();
  });

  it('maps legacy puddle/splatter overrides', () => {
    expect(
      resolveBloodIntensity({
        barDamage: 0,
        healthLevelLost: false,
        intensity: 'puddle',
      }),
    ).toBe('heavy');
    expect(normalizeBloodIntensity('splatter')).toBe('light');
  });
});

describe('blood textures', () => {
  it('maps each intensity to the matching asset folder', () => {
    expect(BLOOD_TEXTURES.light.every((p) => p.includes('/drops/'))).toBe(true);
    expect(BLOOD_TEXTURES.medium.every((p) => p.includes('/impacts/'))).toBe(true);
    expect(BLOOD_TEXTURES.heavy.every((p) => p.includes('/pools/'))).toBe(true);
    expect(BLOOD_TRAIL_TEXTURES.every((p) => p.includes('/trails/'))).toBe(true);
  });

  it('picks a catalog path for the requested intensity', () => {
    const path = pickBloodTexturePath('medium', 11);
    expect(BLOOD_TEXTURES.medium).toContain(path);
    expect(BLOOD_TRAIL_TEXTURES).toContain(pickBloodTrailPath(4));
  });

  it('keeps stains around one hex, heavy only a little larger', () => {
    const light = bloodSpriteSize({ intensity: 'light', damage: 2, gridSize: 100 });
    const heavy = bloodSpriteSize({ intensity: 'heavy', damage: 8, gridSize: 100 });
    expect(heavy).toBeGreaterThan(light);
    expect(light).toBeGreaterThan(40);
    expect(light).toBeLessThanOrEqual(80);
    expect(heavy).toBeLessThanOrEqual(140);
  });
});

describe('blood trails', () => {
  const sixBars = [
    { name: 'Healthy' },
    { name: 'Bruised' },
    { name: 'Injured' },
    { name: 'Wounded' },
    { name: 'Broken' },
    { name: 'Incapacitated' },
  ];

  it('starts dripping at Wounded', () => {
    expect(shouldLeaveBloodTrail({ system: { health: { bars: sixBars, currentBar: 2 } } })).toBe(
      false,
    );
    expect(shouldLeaveBloodTrail({ system: { health: { bars: sixBars, currentBar: 3 } } })).toBe(
      true,
    );
    expect(shouldLeaveBloodTrail({ system: { health: { bars: sixBars, currentBar: 5 } } })).toBe(
      true,
    );
    expect(shouldLeaveBloodTrail({ system: { health: { bars: [] } } })).toBe(false);
  });

  it('skips short nudges and caps long drags at three stamps', () => {
    expect(
      bloodTrailWaypoints({ from: { x: 0, y: 0 }, to: { x: 20, y: 0 }, gridSize: 100 }),
    ).toEqual([]);
    expect(
      bloodTrailWaypoints({ from: { x: 0, y: 0 }, to: { x: 100, y: 0 }, gridSize: 100 }),
    ).toHaveLength(1);
    expect(
      bloodTrailWaypoints({ from: { x: 0, y: 0 }, to: { x: 400, y: 0 }, gridSize: 100 }),
    ).toHaveLength(3);
  });

  it('rotates the trail to match movement', () => {
    expect(bloodTrailRotation(1, -1)).toBeCloseTo(0, 5);
    expect(bloodTrailRotation(1, 0)).toBeCloseTo(Math.PI / 4, 5);
    expect(BLOOD_TRAIL_TEXTURE_ANGLE).toBeCloseTo(-Math.PI / 4, 5);
  });
});

describe('didLoseHealthLevel', () => {
  it('detects currentBar advance', () => {
    expect(
      didLoseHealthLevel({
        oldBarIndex: 0,
        newBarIndex: 1,
        barsBefore: [{ current: 4 }, { current: 10 }],
        barsAfter: [{ current: 0 }, { current: 8 }],
      }),
    ).toBe(true);
  });

  it('detects a newly emptied bar even if index unchanged', () => {
    expect(
      didLoseHealthLevel({
        oldBarIndex: 1,
        newBarIndex: 1,
        barsBefore: [{ current: 0 }, { current: 2 }, { current: 10 }],
        barsAfter: [{ current: 0 }, { current: 0 }, { current: 10 }],
      }),
    ).toBe(true);
  });

  it('sums HP lost across bars and ignores heals', () => {
    expect(
      hpLostFromHealthUpdate({
        barsBefore: [{ current: 10 }, { current: 10 }],
        barsAfter: [{ current: 7 }, { current: 10 }],
      }),
    ).toBe(3);
    expect(
      hpLostFromHealthUpdate({
        barsBefore: [{ current: 4 }, { current: 10 }],
        barsAfter: [{ current: 10 }, { current: 10 }],
      }),
    ).toBe(0);
  });

  it('is false for a simple chip inside the same bar', () => {
    expect(
      didLoseHealthLevel({
        oldBarIndex: 0,
        newBarIndex: 0,
        barsBefore: [{ current: 10 }, { current: 10 }],
        barsAfter: [{ current: 7 }, { current: 10 }],
      }),
    ).toBe(false);
  });
});
