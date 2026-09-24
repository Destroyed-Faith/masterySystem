import { describe, expect, it } from 'vitest';
import {
  LEGACY_MARTIAL_SKILL_KEYS,
  MARTIAL_SKILLS_REFUND_FLAG,
  martialSkillsRefundUpdate,
  planMartialSkillsRefund,
  runMartialSkillsRefundMigration,
} from '../src/migrations/martial-skills-refund-migration';
import { SKILLS } from '../src/utils/skills';

/** Minimal Foundry-like actor: `update()` applies dotted keys and `-=` deletions. */
function makeActor(system: Record<string, unknown>, flags: Record<string, unknown> = {}) {
  const actor: any = {
    type: 'character',
    name: 'Tester',
    system: JSON.parse(JSON.stringify(system)),
    flags: { 'mastery-system': { ...flags } },
    updates: [] as Record<string, unknown>[],
    getFlag(scope: string, key: string) {
      return this.flags?.[scope]?.[key];
    },
    async update(data: Record<string, unknown>) {
      this.updates.push(data);
      for (const [path, value] of Object.entries(data)) {
        const parts = path.split('.');
        let node: any = this;
        for (let i = 0; i < parts.length - 1; i += 1) {
          const part = parts[i]!;
          if (node[part] == null || typeof node[part] !== 'object') node[part] = {};
          node = node[part];
        }
        const last = parts[parts.length - 1]!;
        if (last.startsWith('-=')) delete node[last.slice(2)];
        else node[last] = value;
      }
    },
  };
  return actor;
}

const baseSkills = { athletics: 4, lore: 4, perception: 4 };

describe('Martial Skills refund migration', () => {
  it('refunds the full invested Rating of one Martial Skill as unspent Skill Points', () => {
    const actor = makeActor({
      skills: { ...baseSkills, meleeWeapons: 8 },
      skillsSpent: { meleeWeapons: 0 },
    });
    const plan = planMartialSkillsRefund(actor);
    expect(plan.alreadyRefunded).toBe(false);
    expect(plan.refund).toBe(8);
    expect(plan.byKey).toEqual({ meleeWeapons: 8 });

    const update = martialSkillsRefundUpdate(actor)!;
    expect(update['system.skillPoints.unspent']).toBe(8);
    expect(update['system.skills.-=meleeWeapons']).toBeNull();
    expect(update['system.skillsSpent.-=meleeWeapons']).toBeNull();
    expect(update[`flags.mastery-system.${MARTIAL_SKILLS_REFUND_FLAG}`]).toBe(true);
    expect((update['system.progression.martialSkillsRefund'] as any).total).toBe(8);
  });

  it('refunds the permanent Rating, not the remaining consumable value', () => {
    // Melee Weapons 8 with 6 already spent this rest (2 remaining) → refund 8.
    const actor = makeActor({
      skills: { ...baseSkills, meleeWeapons: 8 },
      skillsSpent: { meleeWeapons: 6 },
    });
    const update = martialSkillsRefundUpdate(actor)!;
    expect(update['system.skillPoints.unspent']).toBe(8);
  });

  it('sums the investment of several removed Martial Skills', () => {
    const actor = makeActor({
      skills: { ...baseSkills, handToHand: 4, rangedWeapons: 6, defensiveCombat: 4, combatReflexes: 2 },
      skillsSpent: { handToHand: 4, rangedWeapons: 1, defensiveCombat: 0, combatReflexes: 2 },
      skillPoints: { unspent: 3, placed: {} },
    });
    const plan = planMartialSkillsRefund(actor);
    expect(plan.refund).toBe(16);
    const update = martialSkillsRefundUpdate(actor)!;
    // Existing unspent pool is kept and the refund added on top.
    expect(update['system.skillPoints.unspent']).toBe(19);
    for (const key of ['handToHand', 'rangedWeapons', 'defensiveCombat', 'combatReflexes']) {
      expect(update[`system.skills.-=${key}`]).toBeNull();
      expect(update[`system.skillsSpent.-=${key}`]).toBeNull();
    }
  });

  it('never refunds twice: a second run is a no-op and a re-imported legacy key is only stripped', async () => {
    const actor = makeActor({
      skills: { ...baseSkills, meleeWeapons: 8 },
      skillsSpent: { meleeWeapons: 2 },
    });
    expect(await runMartialSkillsRefundMigration([actor])).toBe(1);
    expect(actor.system.skillPoints.unspent).toBe(8);
    expect(actor.system.skills.meleeWeapons).toBeUndefined();
    expect(actor.getFlag('mastery-system', MARTIAL_SKILLS_REFUND_FLAG)).toBe(true);

    expect(await runMartialSkillsRefundMigration([actor])).toBe(0);
    expect(martialSkillsRefundUpdate(actor)).toBeNull();
    expect(actor.system.skillPoints.unspent).toBe(8);

    // Legacy data sneaks back (old import / old client): strip it, no second refund.
    actor.system.skills.combatReflexes = 4;
    expect(await runMartialSkillsRefundMigration([actor])).toBe(1);
    expect(actor.system.skills.combatReflexes).toBeUndefined();
    expect(actor.system.skillPoints.unspent).toBe(8);
    expect(planMartialSkillsRefund(actor).refund).toBe(0);
  });

  it('leaves unrelated Skills, their spent values, and other data untouched', async () => {
    const actor = makeActor({
      skills: { athletics: 4, lore: 3, perception: 4, meleeWeapons: 4 },
      skillsSpent: { athletics: 2, lore: 0, perception: 4, meleeWeapons: 4 },
      points: { xp: 12, xpFree: 0 },
    });
    await runMartialSkillsRefundMigration([actor]);
    expect(actor.system.skills).toEqual({ athletics: 4, lore: 3, perception: 4 });
    expect(actor.system.skillsSpent).toEqual({ athletics: 2, lore: 0, perception: 4 });
    expect(actor.system.points).toEqual({ xp: 12, xpFree: 0 });
    // Not converted into XP.
    expect(actor.system.skillPoints.unspent).toBe(4);
    const update = actor.updates[0];
    expect(Object.keys(update).some((k) => k.startsWith('system.skills.athletics'))).toBe(false);
    expect(Object.keys(update).some((k) => k.startsWith('system.points'))).toBe(false);
  });

  it('does nothing for characters that never had Martial Skill data', () => {
    const actor = makeActor({ skills: { ...baseSkills }, skillsSpent: {} });
    const plan = planMartialSkillsRefund(actor);
    expect(plan.refund).toBe(0);
    expect(plan.hasLegacyData).toBe(false);
    // Still marks the actor as processed so the flag is present, but refunds 0.
    const update = martialSkillsRefundUpdate(actor)!;
    expect(update['system.skillPoints.unspent']).toBe(0);
    expect(update[`flags.mastery-system.${MARTIAL_SKILLS_REFUND_FLAG}`]).toBe(true);
  });

  it('skips NPCs and only touches characters', async () => {
    const npc = makeActor({ skills: { meleeWeapons: 8 } });
    npc.type = 'npc';
    expect(martialSkillsRefundUpdate(npc)).toBeNull();
    expect(await runMartialSkillsRefundMigration([npc])).toBe(0);
  });

  it('moves the snapshot investment into the pool the GM progression reset restores', async () => {
    const actor = makeActor({
      skills: { ...baseSkills, meleeWeapons: 6 },
      skillsSpent: {},
      xp: {
        postCreationProgress: {
          attributes: {},
          skills: { athletics: 4, meleeWeapons: 4 },
          skillsSpent: { athletics: 0, meleeWeapons: 0 },
          powerLevels: {},
        },
      },
    });
    await runMartialSkillsRefundMigration([actor]);
    expect(actor.system.skillPoints.unspent).toBe(6);
    expect(actor.system.xp.postCreationProgress.skills).toEqual({ athletics: 4 });
    expect(actor.system.xp.postCreationProgress.skillsSpent).toEqual({ athletics: 0 });
    expect(actor.system.xp.postCreationProgress.skillPointsUnspent).toBe(4);
  });

  it('keeps the legacy identifiers out of the active Skill catalog', () => {
    for (const key of LEGACY_MARTIAL_SKILL_KEYS) {
      expect(SKILLS[key]).toBeUndefined();
    }
  });
});
