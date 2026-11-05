/**
 * K1 golden: Radial Limited detection must agree with attack-executor name heuristics
 * for the legacy Limited Instant Damage aliases (Moonlight Judgment / Undead Tracer).
 */
import { describe, expect, it } from 'vitest';
import {
  clearIdentityShadowLog,
  getIdentityShadowLog,
  setIdentityShadowEnabled,
} from '../src/utils/identity-shadow.js';
import { compareIdentityDecision } from '../src/utils/identity-shadow.js';
import { isLimitedPowerTemplateId } from '../src/combat/limited-charge.js';

/** Mirrors restored Radial legacy Limited decision (artifact-options.ts). */
function radialLegacyLimited(row: {
  limited?: boolean;
  special?: string;
  name: string;
}): boolean {
  return (
    row.limited === true ||
    /\blimited\b/i.test(String(row.special || '')) ||
    /moonlight\s*judgment/i.test(row.name) ||
    /undead\s*tracer/i.test(row.name)
  );
}

/** Mirrors attack-executor claimsLimited name branch. */
function executorClaimsLimitedByName(optionName: string): boolean {
  return (
    /moonlight\s*judgment/i.test(optionName) || /undead\s*tracer/i.test(optionName)
  );
}

describe('K1 Limited Radial ↔ Executor parity', () => {
  it('Moonlight Judgment / Undead Tracer: Radial and Executor both treat as Limited', () => {
    for (const name of ['Moonlight Judgment', 'Undead Tracer I', 'Moonlight Judgment III']) {
      expect(radialLegacyLimited({ name })).toBe(true);
      expect(executorClaimsLimitedByName(name)).toBe(true);
    }
  });

  it('row.limited flag alone is Limited in Radial (Executor via option.artifactLimited)', () => {
    expect(radialLegacyLimited({ name: 'Generic Instant', limited: true })).toBe(true);
  });

  it('special column "Limited" alone is Limited in Radial', () => {
    expect(
      radialLegacyLimited({ name: 'Some Instant', special: 'Limited Instant Damage' }),
    ).toBe(true);
  });

  it('unrelated attack is not Limited by either path', () => {
    expect(radialLegacyLimited({ name: 'Breath Weapon I' })).toBe(false);
    expect(executorClaimsLimitedByName('Breath Weapon I')).toBe(false);
  });

  it('K8.d: missing-ID name/special bridge still Limited when prefer identity', () => {
    clearIdentityShadowLog();
    setIdentityShadowEnabled(true);
    const row = {
      limited: false,
      special: 'Limited',
      name: 'Legacy Special Limited',
      powerTemplateId: undefined as string | undefined,
    };
    const structured =
      row.limited === true ||
      (!!row.powerTemplateId && isLimitedPowerTemplateId(String(row.powerTemplateId)));
    const nameBridge =
      /\blimited\b/i.test(String(row.special || '')) ||
      /moonlight\s*judgment/i.test(row.name) ||
      /undead\s*tracer/i.test(row.name);
    const legacy = structured || nameBridge;
    const decided = compareIdentityDecision(
      'artifact.rowLimited',
      legacy,
      () => structured || (!row.powerTemplateId && nameBridge),
      { name: row.name },
      { prefer: 'identity' },
    );
    expect(decided).toBe(true);
    expect(legacy).toBe(true);
    const log = getIdentityShadowLog().filter((e) => e.siteId === 'artifact.rowLimited');
    expect(log.length).toBeGreaterThan(0);
    expect(log[log.length - 1]!.legacy).toBe(true);
    expect(log[log.length - 1]!.identity).toBe(true);
    expect(log[log.length - 1]!.equal).toBe(true);
  });

  it('K8.d: with Limited templateId, name bridge is not required', () => {
    clearIdentityShadowLog();
    const tid = 'active-ranged-limited-aoe';
    const structured = isLimitedPowerTemplateId(tid);
    const decided = compareIdentityDecision(
      'artifact.rowLimited',
      structured,
      () => structured,
      { powerTemplateId: tid },
      { prefer: 'identity' },
    );
    expect(decided).toBe(true);
  });
});
