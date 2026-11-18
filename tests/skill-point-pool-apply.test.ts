import { describe, expect, it } from 'vitest';
import { applySkillPendingChanges } from '../src/progression/progression-hub-actions';
import { runMartialSkillsRefundMigration } from '../src/migrations/martial-skills-refund-migration';
import { planSkillPointRetirement } from '../src/progression/skill-point-pool';
import { skillBandCost } from '../src/utils/constants';

/** Foundry-like actor whose `update()` applies dotted keys and `-=` deletions. */
function makeActor(system: Record<string, unknown>) {
  const actor: any = {
    type: 'character',
    name: 'Tester',
    system: JSON.parse(JSON.stringify(system)),
    flags: { 'mastery-system': {} },
    items: { get: () => undefined, filter: () => [] },
    getFlag(scope: string, key: string) {
      return this.flags?.[scope]?.[key];
    },
    async update(data: Record<string, unknown>) {
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

describe('retired Skill Points → Free XP → normal Skill progression', () => {
  it('migrates martial refund into Skill Points, then retirement converts them to Free XP', async () => {
    const actor = makeActor({
      mastery: { rank: 2 },
      skills: { athletics: 4, lore: 0, meleeWeapons: 8 },
      skillsSpent: { meleeWeapons: 5 },
      points: { xp: 3, xpFree: 0 },
      xp: { totalEarned: 3, totalSpent: 0, freeEarned: 0, freeSpent: 0, history: [] },
      creation: { complete: true },
    });
    await runMartialSkillsRefundMigration([actor]);
    expect(actor.system.skillPoints.unspent).toBe(8);
    expect(actor.system.skills.meleeWeapons).toBeUndefined();

    const retire = planSkillPointRetirement(actor.system);
    expect(retire.needed).toBe(true);
    expect(retire.convertedXp).toBe(8);
    await actor.update(retire.updates);
    expect(actor.system.skillPoints).toEqual({ unspent: 0, placed: {} });
    expect(actor.system.points.xpFree).toBe(8);
    expect(actor.system.xp.freeEarned).toBe(8);

    // Skills are XP-only now; Free XP covers Lore +4 and Athletics +4.
    const cost =
      skillBandCost(1) +
      skillBandCost(2) +
      skillBandCost(3) +
      skillBandCost(4) +
      skillBandCost(5) +
      skillBandCost(6) +
      skillBandCost(7) +
      skillBandCost(8);
    expect(cost).toBeLessThanOrEqual(8 + 3);

    const res = await applySkillPendingChanges(actor, { lore: 4, athletics: 4 });
    expect(res.ok).toBe(true);
    expect(actor.system.skills).toEqual({ athletics: 8, lore: 4 });
    expect(actor.system.skillPoints?.unspent ?? 0).toBe(0);
    expect(actor.system.skillPoints?.placed ?? {}).toEqual({});
  });

  it('charges and refunds Skill ranks with XP only (no Skill Point pool)', async () => {
    const actor = makeActor({
      mastery: { rank: 2 },
      skills: { lore: 0 },
      skillsSpent: {},
      skillPoints: { unspent: 1, placed: {} },
      points: { xp: 10, xpFree: 0 },
      xp: { totalEarned: 10, totalSpent: 0, freeEarned: 0, freeSpent: 0, history: [] },
      creation: { complete: true },
    });

    // Leftover pool is ignored by apply — ranks cost full XP.
    const up = await applySkillPendingChanges(actor, { lore: 2 });
    expect(up.ok).toBe(true);
    expect(actor.system.skills.lore).toBe(2);
    expect(actor.system.points.xp).toBe(10 - skillBandCost(1) - skillBandCost(2));
    expect(actor.system.xp.currentStep.skills).toEqual(['lore']);

    const down = await applySkillPendingChanges(actor, { lore: -2 });
    expect(down.ok).toBe(true);
    expect(actor.system.skills.lore).toBe(0);
    expect(actor.system.points.xp).toBe(10);
  });
});
