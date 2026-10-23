import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { COMBAT_MANEUVERS } from '../src/system/combat-maneuvers';
import {
  RADIAL_STANDARD_MANEUVER_IDS,
  buildRadialManeuverPrefsContext,
} from '../src/utils/radial-maneuver-prefs';

describe('DF 2026 Aid retirement', () => {
  it('does not list Aid among combat maneuvers', () => {
    expect(COMBAT_MANEUVERS.some((m) => m.id === 'aid')).toBe(false);
  });

  it('does not expose Aid in radial maneuver prefs', () => {
    expect(RADIAL_STANDARD_MANEUVER_IDS.includes('aid')).toBe(false);
    const ctx = buildRadialManeuverPrefsContext({});
    expect(ctx.rows.some((r) => r.id === 'aid')).toBe(false);
  });

  it('roll-handler source no longer renders aid-skill-check buttons', () => {
    const src = readFileSync(resolve('src/dice/roll-handler.ts'), 'utf8');
    expect(src).not.toMatch(/aid-skill-check/);
    expect(src).not.toMatch(/Aid \(\+4\)/);
    expect(src).not.toMatch(/specializationId/);
  });

  it('aid-reaction-handler only strips legacy buttons (no AID_BONUS apply)', () => {
    const src = readFileSync(resolve('src/chat/aid-reaction-handler.ts'), 'utf8');
    expect(src).toMatch(/aid-skill-check/);
    expect(src).toMatch(/\.remove\(\)/);
    expect(src).not.toMatch(/AID_BONUS/);
    expect(src).not.toMatch(/listEligibleAid/);
    expect(src).not.toMatch(/applyAid/);
  });

  it('aid-eligibility module is gone', () => {
    let missing = false;
    try {
      readFileSync(resolve('src/chat/aid-eligibility.ts'), 'utf8');
    } catch {
      missing = true;
    }
    expect(missing).toBe(true);
  });

  it('lang files no longer ship MASTERY.df2026.aid keys', () => {
    const en = JSON.parse(readFileSync(resolve('lang/en.json'), 'utf8'));
    const de = JSON.parse(readFileSync(resolve('lang/de.json'), 'utf8'));
    expect(en.MASTERY?.df2026?.aid).toBeUndefined();
    expect(de.MASTERY?.df2026?.aid).toBeUndefined();
  });
});
