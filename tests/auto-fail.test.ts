/**
 * Unit tests for the Auto-Fail engine.
 *
 * Covers the declarative decisions made in `src/system/auto-fail.ts`:
 *   - Disoriented(X) subtracts X dice on attacks (never forces fail).
 *   - Disoriented(X) subtracts X dice on sight-tagged skill checks.
 *   - Disoriented has no effect on non-sight skill checks.
 *   - Stunned(X) reports the rank used by the action-economy lock.
 *   - Ranks parse from label suffix, status set, and flag bag variants.
 */
import { describe, it, expect } from 'vitest';
import {
  evaluateAutoFail,
  getDisorientedRank,
  getStunnedRank,
  resolveCheckTags,
} from '../src/system/auto-fail';

// ---------------------------------------------------------------------------
// Actor stubs — lightweight shapes matching the lookup paths.
// ---------------------------------------------------------------------------

function actorWithStatuses(ids: string[]) {
  return { statuses: new Set(ids) };
}
function actorWithFlag(condKey: string, rank: number) {
  return { flags: { 'mastery-system': { conditions: { [condKey]: { rank } } } } };
}
function actorWithEffect(label: string) {
  return { effects: [{ name: label }] };
}

describe('getDisorientedRank', () => {
  it('returns 0 for a non-disoriented actor', () => {
    expect(getDisorientedRank({})).toBe(0);
    expect(getDisorientedRank(null)).toBe(0);
  });

  it('detects Disoriented via status set (rank defaults to 1)', () => {
    expect(getDisorientedRank(actorWithStatuses(['disoriented']))).toBeGreaterThan(0);
  });

  it('reads rank from the mastery-system conditions flag bag', () => {
    expect(getDisorientedRank(actorWithFlag('disoriented', 3))).toBe(3);
  });

  it('parses rank from active-effect label suffix', () => {
    expect(getDisorientedRank(actorWithEffect('Disoriented(2)'))).toBe(2);
    expect(getDisorientedRank(actorWithEffect('Disoriented 4'))).toBe(4);
  });

  it('reads value from system.statusEffects', () => {
    const actor = { system: { statusEffects: [{ id: 'disoriented', value: 5 }] } };
    expect(getDisorientedRank(actor)).toBe(5);
  });
});

describe('getStunnedRank', () => {
  it('returns 0 for a non-stunned actor', () => {
    expect(getStunnedRank({})).toBe(0);
  });

  it('parses Stunned rank the same way as Disoriented', () => {
    expect(getStunnedRank(actorWithFlag('stunned', 2))).toBe(2);
    expect(getStunnedRank(actorWithEffect('Stunned(1)'))).toBe(1);
  });
});

describe('resolveCheckTags', () => {
  it('honours explicit tags over the skill lookup', () => {
    expect(resolveCheckTags({ tags: ['hearing'], skillKey: 'perception' })).toEqual([
      'hearing',
    ]);
  });

  it('falls back to the skill-tag registry when tags are empty', () => {
    const tags = resolveCheckTags({ skillKey: 'Perception' });
    expect(tags).toContain('sight');
  });

  it('returns [] for unknown skills / empty context', () => {
    expect(resolveCheckTags(undefined)).toEqual([]);
    expect(resolveCheckTags({ skillKey: 'notaskill' })).toEqual([]);
  });
});

describe('evaluateAutoFail', () => {
  it('subtracts dice (no forced fail) on a sight-tagged skill check when Disoriented', () => {
    const decision = evaluateAutoFail(
      actorWithFlag('disoriented', 2),
      { tags: ['sight'] },
      'skill',
    );
    expect(decision.failed).toBe(false);
    expect(decision.dicePenalty).toBe(2);
    expect(decision.reason).toBe('disoriented');
  });

  it('subtracts dice on any attack when Disoriented', () => {
    const decision = evaluateAutoFail(
      actorWithFlag('disoriented', 3),
      { tags: [] },
      'attack',
    );
    expect(decision.failed).toBe(false);
    expect(decision.dicePenalty).toBe(3);
    expect(decision.reason).toBe('disoriented');
  });

  it('ignores non-sight skill checks (e.g. hearing-based Perception)', () => {
    const decision = evaluateAutoFail(
      actorWithFlag('disoriented', 1),
      { tags: ['hearing'] },
      'skill',
    );
    expect(decision.failed).toBe(false);
    expect(decision.dicePenalty).toBeUndefined();
  });

  it('is inert for actors without the Disoriented condition', () => {
    const decision = evaluateAutoFail({}, { tags: ['sight'] }, 'skill');
    expect(decision.failed).toBe(false);
    expect(decision.dicePenalty).toBeUndefined();
  });

  it('falls back to the skill registry when tags are omitted (sight skill)', () => {
    const decision = evaluateAutoFail(
      actorWithFlag('disoriented', 2),
      { skillKey: 'Perception' },
      'skill',
    );
    expect(decision.failed).toBe(false);
    expect(decision.dicePenalty).toBe(2);
    expect(decision.reason).toBe('disoriented');
  });
});
