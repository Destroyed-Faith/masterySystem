import { describe, expect, it } from 'vitest';
import { applySkillPendingChanges } from '../src/progression/progression-hub-actions';
import { runMartialSkillsRefundMigration } from '../src/migrations/martial-skills-refund-migration';
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

describe('refunded Skill Points flow through the normal Skill progression', () => {
  it('migrates, then places the refund on remaining Skills without spending XP', async () => {
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

    // 8 Skill Points cover Lore +4 and Athletics +4 (MR 2 → cap 8) with 0 XP,
    // and the once-per-step rule does not block the second rank on a Skill.
    const res = await applySkillPendingChanges(actor, { lore: 4, athletics: 4 });
    expect(res.ok).toBe(true);
    expect(actor.system.skills).toEqual({ athletics: 8, lore: 4 });
    expect(actor.system.skillPoints.unspent).toBe(0);
    expect(actor.system.skillPoints.placed).toEqual({ lore: 4, athletics: 4 });
    expect(actor.system.points.xp).toBe(3);
    expect(actor.system.xp.totalSpent).toBe(0);
    expect(actor.system.xp.currentStep.skills).toEqual([]);
    const poolEntries = actor.system.xp.history.filter((h: any) => h.details?.skillPoint === true);
    expect(poolEntries).toHaveLength(8);
    expect(poolEntries.every((h: any) => h.amount === 0)).toBe(true);
  });

  it('charges XP only for ranks beyond the pool and returns pool ranks instead of XP on decrease', async () => {
    const actor = makeActor({
      mastery: { rank: 2 },
      skills: { lore: 0 },
      skillsSpent: {},
      skillPoints: { unspent: 1, placed: {} },
      points: { xp: 10, xpFree: 0 },
      xp: { totalEarned: 10, totalSpent: 0, freeEarned: 0, freeSpent: 0, history: [] },
      creation: { complete: true },
    });
    const up = await applySkillPendingChanges(actor, { lore: 2 });
    expect(up.ok).toBe(true);
    expect(actor.system.skills.lore).toBe(2);
    expect(actor.system.skillPoints.unspent).toBe(0);
    expect(actor.system.skillPoints.placed.lore).toBe(1);
    expect(actor.system.points.xp).toBe(10 - skillBandCost(2));
    expect(actor.system.xp.currentStep.skills).toEqual(['lore']);

    // Drop both ranks: the XP rank refunds XP, the pool rank returns to the pool.
    const down = await applySkillPendingChanges(actor, { lore: -2 });
    expect(down.ok).toBe(true);
    expect(actor.system.skills.lore).toBe(0);
    expect(actor.system.skillPoints.unspent).toBe(1);
    expect(actor.system.skillPoints.placed.lore).toBeUndefined();
    expect(actor.system.points.xp).toBe(10);
  });
});
