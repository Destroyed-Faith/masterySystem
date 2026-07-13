import { describe, it, expect, vi } from 'vitest';
import {
  parseCombatSenseLabel,
  skillCheckTnByMasteryRank,
  SENSE_SLOT_SPECIAL_IDS,
  COMBAT_SENSES,
} from '../src/combat/combat-senses.js';
import {
  normalizeCombatSensesData,
  collectGrantedCombatSenses,
  listActorCombatSenses,
  getActiveCombatSense,
  buildCombatSensesBattleAreaContext,
} from '../src/combat/combat-sense-collection.js';
import {
  computeStealthRaiseBonus,
  effectiveInvisibilityBonus,
  isSenseBlockedOnTarget,
} from '../src/combat/perception-state.js';
import {
  computePerceptionTn,
  evaluatePerceptionGate,
  targetPerceivedByNonSightSense,
} from '../src/combat/perception-gate.js';
import {
  blockedSensesForVeil,
  applyStealthRollResult,
} from '../src/combat/perception-combat-hooks.js';

function mockActor(overrides: Record<string, unknown> = {}) {
  const flags: Record<string, unknown> = {};
  const actor: any = {
    id: 'actor-1',
    name: 'Test',
    items: [],
    system: {
      mastery: { rank: 2 },
      combatSenses: {
        activeSenseId: 'normalCombatAwareness',
        grantedSenseIds: [],
        passiveSenseIds: [],
        hasDarkvision: false,
      },
    },
    getFlag: vi.fn((scope: string, key: string) => flags[`${scope}:${key}`]),
    setFlag: vi.fn(async (scope: string, key: string, val: unknown) => {
      flags[`${scope}:${key}`] = val;
    }),
    ...overrides,
  };
  return actor;
}

describe('combat-senses registry', () => {
  it('parses sense labels case-insensitively', () => {
    expect(parseCombatSenseLabel('Life Sense')).toBe('lifeSense');
    expect(parseCombatSenseLabel('PREDATOR SENSE')).toBe('predatorSense');
    expect(parseCombatSenseLabel('')).toBeNull();
  });

  it('skill check TN is MR × 8', () => {
    expect(skillCheckTnByMasteryRank(2)).toBe(16);
    expect(skillCheckTnByMasteryRank(1)).toBe(8);
  });

  it('lists all special sense slot options', () => {
    expect(SENSE_SLOT_SPECIAL_IDS).toContain('lifeSense');
    expect(COMBAT_SENSES.lifeSense.rangeM).toBe(30);
  });
});

describe('combat-sense-collection', () => {
  it('only exposes slotted senses, not all granted', () => {
    const actor = mockActor({
      system: {
        mastery: { rank: 2 },
        combatSenses: {
          activeSenseId: 'lifeSense',
          grantedSenseIds: ['lifeSense', 'mageSense'],
          passiveSenseIds: [],
          hasDarkvision: true,
        },
      },
    });
    const senses = listActorCombatSenses(actor);
    expect(senses).toContain('normalCombatAwareness');
    expect(senses).toContain('darkvision');
    expect(senses).toContain('lifeSense');
    expect(senses).not.toContain('mageSense');
  });

  it('buildCombatSensesBattleAreaContext lists all senses and slot choices', () => {
    const actor = mockActor({
      system: {
        combatSenses: {
          activeSenseId: 'normalCombatAwareness',
          grantedSenseIds: ['lifeSense'],
          passiveSenseIds: [],
          hasDarkvision: false,
        },
      },
    });
    const ctx = buildCombatSensesBattleAreaContext(actor);
    expect(ctx.senseRows.length).toBe(6);
    expect(ctx.slotRows.map((r) => r.id)).toEqual(['normalCombatAwareness', 'lifeSense']);
    expect(ctx.activeSenseId).toBe('normalCombatAwareness');
    expect(ctx.senseRows.find((r) => r.id === 'mageSense')?.isGranted).toBe(false);
    expect(ctx.senseRows.find((r) => r.id === 'lifeSense')?.isGranted).toBe(true);
  });

  it('collects senses from equipped artifact base values', () => {
    const actor = mockActor({
      items: [
        {
          type: 'artifact',
          system: {
            equipped: true,
            baseValues: [{ type: 'sense', value: 'Predator Sense' }],
          },
        },
      ],
    });
    expect(collectGrantedCombatSenses(actor)).toContain('predatorSense');
  });

  it('falls back to Normal Combat Awareness when slot sense not granted', () => {
    const actor = mockActor({
      system: {
        mastery: { rank: 2 },
        combatSenses: {
          activeSenseId: 'mageSense',
          grantedSenseIds: [],
          passiveSenseIds: [],
        },
      },
    });
    expect(getActiveCombatSense(actor)).toBe('normalCombatAwareness');
  });
});

describe('perception state', () => {
  it('computes stealth raise bonus as +2 per raise', () => {
    expect(computeStealthRaiseBonus(2)).toBe(4);
    expect(computeStealthRaiseBonus(0)).toBe(0);
  });

  it('basic invisibility blocks normal awareness and darkvision', () => {
    const target = mockActor();
    target.getFlag = vi.fn(() => ({
      invisibilityBonus: 8,
      currentInvisibilityBonus: 8,
    }));
    expect(isSenseBlockedOnTarget(target, 'normalCombatAwareness')).toBe(true);
    expect(isSenseBlockedOnTarget(target, 'darkvision')).toBe(true);
    expect(isSenseBlockedOnTarget(target, 'lifeSense')).toBe(false);
  });

  it('effective invisibility uses current bonus after cloak disruption', () => {
    expect(effectiveInvisibilityBonus({ invisibilityBonus: 12, currentInvisibilityBonus: 4 })).toBe(4);
    expect(effectiveInvisibilityBonus({ invisibilityBonus: 12 })).toBe(12);
  });
});

describe('perception gate', () => {
  it('Perception TN = MR×8 + invisibility + stealth raise', () => {
    const target = mockActor({
      system: { mastery: { rank: 3 } },
    });
    target.getFlag = vi.fn(() => ({
      invisibilityBonus: 6,
      stealthRaiseBonus: 4,
    }));
    expect(computePerceptionTn(target)).toBe(24 + 6 + 4);
  });

  it('Life Sense perceives invisible-to-normal living target', () => {
    const observer = mockActor({
      id: 'obs',
      system: {
        mastery: { rank: 2 },
        combatSenses: {
          activeSenseId: 'lifeSense',
          grantedSenseIds: ['lifeSense'],
          passiveSenseIds: [],
        },
      },
    });
    const target = mockActor({
      id: 'tgt',
      system: { mastery: { rank: 2 } },
    });
    target.getFlag = vi.fn(() => ({ invisibilityBonus: 8 }));
    const gate = evaluatePerceptionGate(observer, target);
    expect(gate.canTarget).toBe(true);
    expect(gate.senseUsed).toBe('lifeSense');
    expect(targetPerceivedByNonSightSense(observer, target)).toBe(true);
  });

  it('hidden target without special sense needs Perception check', () => {
    const observer = mockActor({ id: 'obs' });
    const target = mockActor({ id: 'tgt' });
    target.getFlag = vi.fn(() => ({ hidden: true, stealthRaiseBonus: 2 }));
    const gate = evaluatePerceptionGate(observer, target, { forTargeting: true });
    expect(gate.canTarget).toBe(false);
    expect(gate.needsPerceptionCheck).toBe(true);
  });
});

describe('perception combat hooks', () => {
  it('stealth success sets hidden and raise bonus', async () => {
    const actor = mockActor();
    await applyStealthRollResult(actor, { success: true, raises: 3 });
    expect(actor.setFlag).toHaveBeenCalledWith(
      'mastery-system',
      'perceptionCombat',
      expect.objectContaining({ hidden: true, stealthRaiseBonus: 6 }),
    );
  });

  it('silent veil elevated blocks sonar and tremor', () => {
    const blocked = blockedSensesForVeil('silentVeil', true);
    expect(blocked).toContain('normalCombatAwareness');
    expect(blocked).toContain('sonarSense');
    expect(blocked).toContain('tremorSense');
  });
});

describe('normalizeCombatSensesData', () => {
  it('defaults to Normal Combat Awareness', () => {
    const data = normalizeCombatSensesData(undefined);
    expect(data.activeSenseId).toBe('normalCombatAwareness');
    expect(data.grantedSenseIds).toEqual([]);
  });
});
