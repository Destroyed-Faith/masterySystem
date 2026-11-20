/**
 * Active Challenge world tracker + Challenge contribution helpers.
 */
import { describe, expect, it } from 'vitest';
import {
  actorAlreadyContributed,
  isChallengeComplete,
  normalizeActiveChallenge,
  planRecordChallengeContribution,
  planStartActiveChallenge,
} from '../src/rules/active-challenge.js';
import {
  CHALLENGE_PROGRESS_RAISE_THRESHOLD,
  resolveChallengeContribution,
  typicalChallengeTarget,
} from '../src/rules/challenge-rolls.js';

describe('Active Challenge — start / progress / complete', () => {
  it('starts with typical targets 2 / 3', () => {
    const complex = planStartActiveChallenge({
      objective: 'Secure the bridge',
      target: typicalChallengeTarget('complex'),
    });
    expect(complex.ok).toBe(true);
    if (!complex.ok) return;
    expect(complex.state.target).toBe(2);
    expect(complex.state.accumulated).toBe(0);
    expect(complex.state.contributorActorIds).toEqual([]);

    const very = planStartActiveChallenge({
      objective: 'Win the prince',
      target: typicalChallengeTarget('very-complex'),
    });
    expect(very.ok).toBe(true);
    if (!very.ok) return;
    expect(very.state.target).toBe(3);
  });

  it('rejects empty objective', () => {
    const bad = planStartActiveChallenge({ objective: '  ', target: 2 });
    expect(bad.ok).toBe(false);
  });

  it('records +1 / +2 / 0 and completes at target', () => {
    const started = planStartActiveChallenge({ objective: 'Bridge', target: 3, id: 'ch1' });
    expect(started.ok).toBe(true);
    if (!started.ok) return;

    const a = planRecordChallengeContribution(started.state, 'Actor.a', 2);
    expect(a.ok).toBe(true);
    expect(a.successesApplied).toBe(2);
    expect(a.state?.accumulated).toBe(2);
    expect(a.complete).toBe(false);

    const b = planRecordChallengeContribution(a.state, 'Actor.b', 1);
    expect(b.ok).toBe(true);
    expect(b.successesApplied).toBe(1);
    expect(b.state?.accumulated).toBe(3);
    expect(b.complete).toBe(true);
    expect(isChallengeComplete(b.state!)).toBe(true);
  });

  it('marks a failed contribution (0) so the actor cannot roll again', () => {
    const started = planStartActiveChallenge({ objective: 'Talk', target: 2, id: 'ch2' });
    expect(started.ok).toBe(true);
    if (!started.ok) return;

    const fail = planRecordChallengeContribution(started.state, 'Actor.x', 0);
    expect(fail.ok).toBe(true);
    expect(fail.successesApplied).toBe(0);
    expect(fail.state?.contributorActorIds).toContain('Actor.x');
    expect(actorAlreadyContributed(fail.state!, 'Actor.x')).toBe(true);

    const again = planRecordChallengeContribution(fail.state, 'Actor.x', 2);
    expect(again.ok).toBe(false);
    expect(again.error).toMatch(/once per Challenge/i);
  });

  it('caps applied successes at 2 per contribution', () => {
    const started = planStartActiveChallenge({ objective: 'X', target: 5, id: 'ch3' });
    expect(started.ok).toBe(true);
    if (!started.ok) return;
    const over = planRecordChallengeContribution(started.state, 'Actor.y', 9);
    expect(over.successesApplied).toBe(2);
  });
});

describe('Active Challenge — normalize + contribution resolve wiring', () => {
  it('normalizes persisted world payloads', () => {
    expect(normalizeActiveChallenge(null)).toBeNull();
    expect(normalizeActiveChallenge({ id: 'a', objective: 'O', target: 2 })).toMatchObject({
      id: 'a',
      objective: 'O',
      target: 2,
      accumulated: 0,
    });
  });

  it('wires resolveChallengeContribution into one-per-actor recording', () => {
    const started = planStartActiveChallenge({ objective: 'Repair', target: 2, id: 'ch4' });
    expect(started.ok).toBe(true);
    if (!started.ok) return;

    const passFour = resolveChallengeContribution({
      rollTotal: 31,
      baseTn: 12,
      paidRaises: CHALLENGE_PROGRESS_RAISE_THRESHOLD,
    });
    expect(passFour.successes).toBe(2);

    const recorded = planRecordChallengeContribution(
      started.state,
      'Actor.carpenter',
      passFour.successes,
    );
    expect(recorded.ok).toBe(true);
    expect(recorded.complete).toBe(true);
    expect(recorded.state?.accumulated).toBe(2);
  });
});

describe('Skill Check dialog — Challenge contribution wiring', () => {
  it('exposes Challenge contribution controls in the Roles Training Check dialog', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const dialogSrc = fs.readFileSync(
      path.resolve(__dirname, '../src/sheets/skill-check-roll-dialog.ts'),
      'utf8',
    );
    expect(dialogSrc).toMatch(/challengeContribution/);
    expect(dialogSrc).toMatch(/Start Challenge/);
    expect(dialogSrc).toMatch(/Clear \/ Complete Challenge/);
    expect(dialogSrc).toMatch(/ms-sc-challenge-panel/);

    const draftSrc = fs.readFileSync(
      path.resolve(__dirname, '../src/rules/skill-check.ts'),
      'utf8',
    );
    expect(draftSrc).toMatch(/challengeContribution\?:/);

    const execSrc = fs.readFileSync(
      path.resolve(__dirname, '../src/sheets/skill-check-execute.ts'),
      'utf8',
    );
    expect(execSrc).toMatch(/challengeContribution/);
  });
});
