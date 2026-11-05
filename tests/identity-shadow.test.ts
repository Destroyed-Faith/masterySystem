/**
 * C1 / K5 Shadow-Compare isolation tests (plan §11 S1–S3 + hygiene).
 */
import { describe, expect, it, beforeEach } from 'vitest';
import {
  clearIdentityShadowLog,
  compareIdentityDecision,
  exportIdentityShadowClusterReports,
  exportIdentityShadowReport,
  getIdentityShadowLog,
  getIdentityShadowSkipCount,
  IDENTITY_SHADOW_LOG_CAP,
} from '../src/utils/identity-shadow.js';
import { getSegmentIdForOption } from '../src/radial-menu/options.js';
import { resolvePowerMechanics } from '../src/utils/power-mechanics.js';
import { isLimitedAttackDeclaration } from '../src/combat/limited-charge.js';
import { isHealRadialOption } from '../src/combat/heal-resolution.js';
import { isCleanseRadialOption } from '../src/combat/cleanse-resolution.js';

describe('identity shadow compare', () => {
  beforeEach(() => clearIdentityShadowLog());

  it('S1: returns legacy even when identity disagrees', () => {
    const out = compareIdentityDecision('test.s1', 'legacy-value', () => 'identity-value');
    expect(out).toBe('legacy-value');
    expect(getIdentityShadowLog()[0]?.equal).toBe(false);
  });

  it('S2: throwing identity factory does not affect legacy', () => {
    const out = compareIdentityDecision('test.s2', 42, () => {
      throw new Error('identity boom');
    });
    expect(out).toBe(42);
    const entry = getIdentityShadowLog()[0];
    expect(entry?.equal).toBe(false);
    expect(String((entry?.identity as any)?.message || '')).toMatch(/identity boom/);
  });

  it('S3: export report counts mismatches', () => {
    compareIdentityDecision('a', 1, () => 1);
    compareIdentityDecision('b', 1, () => 2);
    const report = exportIdentityShadowReport();
    expect(report.total).toBe(2);
    expect(report.mismatches).toBe(1);
  });

  it('K5: dedupes identical site/ref/legacy/identity tuples', () => {
    compareIdentityDecision('dedupe.site', true, () => false, { id: 'x' });
    compareIdentityDecision('dedupe.site', true, () => false, { id: 'x' });
    compareIdentityDecision('dedupe.site', true, () => false, { id: 'x' });
    expect(getIdentityShadowLog().filter((e) => e.siteId === 'dedupe.site')).toHaveLength(1);
  });

  it('K5: skips npc-attack and maneuver sources', () => {
    compareIdentityDecision('radial.getSegmentIdForOption', 'attack', () => 'utility', {
      source: 'npc-attack',
    });
    compareIdentityDecision('radial.getSegmentIdForOption', 'attack', () => 'utility', {
      source: 'maneuver',
    });
    expect(getIdentityShadowLog()).toHaveLength(0);
    expect(getIdentityShadowSkipCount()).toBe(2);
  });

  it('K5: respects soft cap', () => {
    for (let i = 0; i < IDENTITY_SHADOW_LOG_CAP + 25; i++) {
      compareIdentityDecision(`cap.site.${i}`, i, () => i + 1, { i });
    }
    expect(getIdentityShadowLog().length).toBeLessThanOrEqual(IDENTITY_SHADOW_LOG_CAP);
  });

  it('K5: cluster export filters by site prefix', () => {
    compareIdentityDecision('executor.claimsLimited', true, () => false);
    compareIdentityDecision('mechanics.isSanctionedDR', true, () => true);
    const clusters = exportIdentityShadowClusterReports();
    expect(clusters.executor?.total).toBe(1);
    expect(clusters.mechanics?.total).toBe(1);
  });

  it('K6-final: cluster export carries entries produced by real shadowed call sites', () => {
    // Drive the production call sites (not compareIdentityDecision directly) and
    // verify the per-cluster export is populated and JSON-serializable.
    const powerOption: any = {
      id: 'e2e-heal',
      name: 'ZZZ_E2E_HEAL',
      description: 'neutral',
      source: 'power',
      slot: 'attack',
      powerType: 'active',
      tags: [],
      item: {
        type: 'power',
        name: 'ZZZ_E2E_HEAL',
        system: {
          templateId: 'active-ranged-single-heal',
          powerType: 'active',
          category: 'active',
          rank: 3,
          cost: { action: 'attack' },
        },
      },
    };
    // radial.* + heal.* + cleanse.*
    const seg = getSegmentIdForOption(powerOption);
    const heal = isHealRadialOption(powerOption);
    const cleanse = isCleanseRadialOption(powerOption);
    // limited.*
    const limited = isLimitedAttackDeclaration({
      item: { system: { templateId: 'active-melee-limited-single' } },
    });
    // mechanics.* (name-only item exercises legacy name fallback vs id-only path)
    const mech = resolvePowerMechanics({
      name: 'ZZZ_E2E_NO_SUCH_TEMPLATE',
      system: { rank: 2, category: 'passive', powerType: 'passive' },
    });

    // Legacy values are returned unchanged (sanity on each site).
    expect(['attack', 'utility', 'active-buff']).toContain(seg);
    expect(heal).toBe(true);
    expect(cleanse).toBe(false);
    expect(limited).toBe(true);
    expect(mech).toBeNull();

    const clusters = exportIdentityShadowClusterReports();
    for (const c of ['radial', 'heal', 'cleanse', 'limited', 'mechanics']) {
      expect(clusters[c], `cluster ${c} missing`).toBeDefined();
      expect(clusters[c].total, `cluster ${c} empty`).toBeGreaterThan(0);
      expect(clusters[c].entries.every((e) => e.siteId.startsWith(`${c}.`))).toBe(true);
    }
    // Known C1 mismatch surfaces in the radial cluster (support-heal: identity utility vs legacy attack).
    expect(clusters.radial.mismatches).toBeGreaterThan(0);
    // Export is serializable (what a GM/dev would copy out of the console).
    const json = JSON.stringify(clusters);
    expect(json.length).toBeGreaterThan(0);
    const back = JSON.parse(json);
    expect(Object.keys(back).sort()).toEqual(Object.keys(clusters).sort());
    // Whole-log export agrees with the sum of clusters.
    const whole = exportIdentityShadowReport();
    const sum = Object.values(clusters).reduce((n, r) => n + r.total, 0);
    expect(whole.total).toBe(sum);
  });

  it('getSegmentIdForOption still returns legacy for stance-text active', () => {
    const option: any = {
      id: 'p1',
      name: 'Damage Transfer',
      description: 'enter a defensive stance',
      source: 'power',
      slot: 'attack',
      powerType: 'active',
      tags: [],
      item: {
        type: 'power',
        name: 'Damage Transfer',
        system: {
          templateId: 'active-melee-single-target-damage-transfer',
          powerType: 'active',
          category: 'active',
          rank: 4,
          cost: { action: 'attack' },
        },
      },
    };
    const seg = getSegmentIdForOption(option);
    expect(['attack', 'active-buff', 'utility']).toContain(seg);
    expect(getIdentityShadowLog().some((e) => e.siteId === 'radial.getSegmentIdForOption')).toBe(
      true,
    );
  });
});
