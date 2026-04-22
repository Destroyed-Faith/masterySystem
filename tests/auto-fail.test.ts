/**
 * Unit tests for the Auto-Fail engine.
 *
 * Covers the declarative decisions made in `src/system/auto-fail.ts`:
 *   - Blinded(X) forces failure on sight-tagged skill checks.
 *   - Blinded(X) subtracts X dice on sight-tagged attacks (never forces fail).
 *   - Blinded has no effect on non-sight checks.
 *   - Stunned(X) reports the rank used by the action-economy lock.
 *   - Ranks parse from label suffix, status set, and flag bag variants.
 */
import { describe, it, expect } from 'vitest';
import {
  evaluateAutoFail,
  getBlindedRank,
  getStunnedRank,
  resolveCheckTags,
} from '../src/system/auto-fail';

// ---------------------------------------------------------------------------
// Actor stubs — lightweight shapes matching the three lookup paths.
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

describe('getBlindedRank', () => {
  it('returns 0 for a non-blinded actor', () => {
    expect(getBlindedRank({})).toBe(0);
    expect(getBlindedRank(null)).toBe(0);
  });

  it('detects Blinded via status set (rank defaults to 1)', () => {
    expect(getBlindedRank(actorWithStatuses(['blinded']))).toBeGreaterThan(0);
  });

  it('reads rank from the mastery-system conditions flag bag', () => {
    expect(getBlindedRank(actorWithFlag('blinded', 3))).toBe(3);
  });

  it('parses rank from active-effect label suffix', () => {
    expect(getBlindedRank(actorWithEffect('Blinded(2)'))).toBe(2);
    expect(getBlindedRank(actorWithEffect('Blinded 4'))).toBe(4);
  });
});

describe('getStunnedRank', () => {
  it('returns 0 for a non-stunned actor', () => {
    expect(getStunnedRank({})).toBe(0);
  });

  it('parses Stunned rank the same way as Blinded', () => {
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
  it('forces fail on a sight-tagged skill check when Blinded', () => {
    const decision = evaluateAutoFail(
      actorWithFlag('blinded', 2),
      { tags: ['sight'] },
      'skill',
    );
    expect(decision.failed).toBe(true);
    expect(decision.reason).toBe('blinded-sight');
  });

  it('does NOT force fail on an attack, but subtracts dice', () => {
    const decision = evaluateAutoFail(
      actorWithFlag('blinded', 3),
      { tags: ['sight'] },
      'attack',
    );
    expect(decision.failed).toBe(false);
    expect(decision.dicePenalty).toBe(3);
    expect(decision.reason).toBe('blinded-sight');
  });

  it('ignores non-sight checks (e.g. hearing-based Perception)', () => {
    const decision = evaluateAutoFail(
      actorWithFlag('blinded', 1),
      { tags: ['hearing'] },
      'skill',
    );
    expect(decision.failed).toBe(false);
    expect(decision.dicePenalty).toBeUndefined();
  });

  it('is inert for actors without the Blinded condition', () => {
    const decision = evaluateAutoFail({}, { tags: ['sight'] }, 'skill');
    expect(decision.failed).toBe(false);
    expect(decision.dicePenalty).toBeUndefined();
  });

  it('falls back to the skill registry when tags are omitted', () => {
    const decision = evaluateAutoFail(
      actorWithFlag('blinded', 2),
      { skillKey: 'Perception' },
      'skill',
    );
    expect(decision.failed).toBe(true);
    expect(decision.reason).toBe('blinded-sight');
  });
});
