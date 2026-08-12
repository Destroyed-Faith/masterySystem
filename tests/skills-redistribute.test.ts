import { beforeEach, describe, expect, it } from 'vitest';
import {
  actorHasNoProgressionXp,
  buildCancelSkillsRedistributeUpdates,
  buildFinishSkillsRedistributeUpdates,
  buildStartSkillsRedistributeUpdates,
  canStartSkillsRedistribute,
  getCreationSkillBudget,
  isValidCreationSkillRank,
  sumActorSkillPoints,
  validateCreationSkillAllocation,
} from '../src/utils/skills-redistribute.js';
import { SKILLS } from '../src/utils/skills.js';

beforeEach(() => {
  (globalThis as any).CONFIG = {
    MASTERY: { creation: { skillPoints: 40, maxSkillAtCreation: 4 } },
  };
});

function makeActor(overrides: Record<string, any> = {}) {
  const skills: Record<string, number> = {};
  for (const key of Object.keys(SKILLS)) skills[key] = 0;
  // 10 skills × 4 = 40
  const keys = Object.keys(SKILLS).slice(0, 10);
  for (const k of keys) skills[k] = 4;
  return {
    type: 'character',
    system: {
      creation: { complete: true },
      skills,
      skillsSpent: {},
      xp: { totalEarned: 0, totalSpent: 0, freeEarned: 0, freeSpent: 0 },
      ...overrides.system,
    },
    ...overrides,
  };
}

describe('skills redistribute', () => {
  it('reads creation budget from CONFIG', () => {
    expect(getCreationSkillBudget()).toEqual({ total: 40, maxPerSkill: 4 });
  });

  it('gates start on no XP earned/spent and creation complete', () => {
    expect(canStartSkillsRedistribute(makeActor()).ok).toBe(true);
    expect(
      canStartSkillsRedistribute(
        makeActor({ system: { creation: { complete: false }, xp: { totalEarned: 0, totalSpent: 0 } } }),
      ).ok,
    ).toBe(false);
    expect(
      canStartSkillsRedistribute(
        makeActor({
          system: {
            creation: { complete: true },
            xp: { totalEarned: 10, totalSpent: 0, freeEarned: 0, freeSpent: 0 },
          },
        }),
      ).ok,
    ).toBe(false);
    expect(actorHasNoProgressionXp(makeActor())).toBe(true);
  });

  it('start updates zero skills and stash a backup', () => {
    const actor = makeActor();
    const updates = buildStartSkillsRedistributeUpdates(actor);
    expect(updates['system.creation.skillsRedistributing']).toBe(true);
    expect(updates['system.creation.skillsRedistributeBackup']).toBeTruthy();
    for (const key of Object.keys(SKILLS)) {
      expect(updates[`system.skills.${key}`]).toBe(0);
    }
  });

  it('cancel restores the backup', () => {
    const actor = makeActor({
      system: {
        creation: {
          complete: true,
          skillsRedistributing: true,
          skillsRedistributeBackup: { athletics: 4, stealth: 2 },
        },
        skills: { athletics: 0, stealth: 0 },
        xp: { totalEarned: 0, totalSpent: 0, freeEarned: 0, freeSpent: 0 },
      },
    });
    const updates = buildCancelSkillsRedistributeUpdates(actor);
    expect(updates['system.creation.skillsRedistributing']).toBe(false);
    expect(updates['system.skills.athletics']).toBe(4);
    expect(updates['system.skills.stealth']).toBe(2);
  });

  it('finish requires exact 40 and ranks of only 0 or 4', () => {
    const actor = makeActor();
    expect(sumActorSkillPoints(actor.system)).toBe(40);
    expect(validateCreationSkillAllocation(actor.system).ok).toBe(true);
    const finished = buildFinishSkillsRedistributeUpdates(actor);
    expect(finished.ok).toBe(true);
    expect(finished.updates?.['system.creation.skillsRedistributing']).toBe(false);
    expect(finished.updates?.['system.xp.postCreationProgress.skills']).toBeTruthy();

    actor.system.skills[Object.keys(SKILLS)[0]] = 5;
    expect(validateCreationSkillAllocation(actor.system).ok).toBe(false);
    expect(buildFinishSkillsRedistributeUpdates(actor).ok).toBe(false);
  });

  it('rejects partial creation ranks (1–3)', () => {
    expect(isValidCreationSkillRank(0)).toBe(true);
    expect(isValidCreationSkillRank(4)).toBe(true);
    expect(isValidCreationSkillRank(1)).toBe(false);
    expect(isValidCreationSkillRank(2)).toBe(false);
    expect(isValidCreationSkillRank(3)).toBe(false);
    const actor = makeActor();
    const key = Object.keys(SKILLS)[0];
    actor.system.skills[key] = 2;
    expect(validateCreationSkillAllocation(actor.system).ok).toBe(false);
  });
});
