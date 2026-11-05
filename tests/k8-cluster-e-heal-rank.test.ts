/**
 * K8.e — Heal/Cleanse identity-primary + option.rank (F12).
 */
import { describe, expect, it } from 'vitest';
import {
  healPowerItemFromRadialOption,
  isHealRadialOption,
} from '../src/combat/heal-resolution.js';
import {
  cleansePowerItemFromRadialOption,
  isCleanseRadialOption,
} from '../src/combat/cleanse-resolution.js';

describe('K8.e Heal / Cleanse', () => {
  it('heal radial option uses templateId identity', () => {
    expect(
      isHealRadialOption({
        source: 'power',
        artifactPowerTemplateId: 'active-ranged-single-heal',
        name: 'Moonlight Mending I',
        item: { type: 'artifact', system: {} },
      }),
    ).toBe(true);
  });

  it('healPowerItemFromRadialOption prefers option.rank over artifact level map', () => {
    const item = healPowerItemFromRadialOption({
      id: 'opt-heal',
      name: 'Moonlight Mending I',
      artifactPowerTemplateId: 'active-ranged-single-heal',
      artifactRowLevel: 1,
      rank: 10,
      item: { type: 'artifact' },
    } as any);
    expect(item?.system?.rank).toBe(10);
    expect(item?.system?.templateId).toBe('active-ranged-single-heal');
  });

  it('cleanse radial option uses templateId identity', () => {
    expect(
      isCleanseRadialOption({
        source: 'power',
        artifactPowerTemplateId: 'active-ranged-single-cleanse',
        name: 'Burden Lifted I',
        item: { type: 'artifact', system: {} },
      }),
    ).toBe(true);
  });

  it('cleansePowerItemFromRadialOption prefers option.rank', () => {
    const item = cleansePowerItemFromRadialOption({
      id: 'opt-cleanse',
      name: 'Burden Lifted I',
      artifactPowerTemplateId: 'active-ranged-single-cleanse',
      artifactRowLevel: 1,
      rank: 16,
      item: { type: 'artifact' },
    } as any);
    expect(item?.system?.rank).toBe(16);
  });
});
