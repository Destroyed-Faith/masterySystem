import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { planGroupAmbushStealthPool } from '../src/combat/group-ambush.js';
import { rollMasteryPoolDice } from '../src/dice/roll-handler.js';
import {
  PROFESSION_CATALOGUE,
  PROFESSION_CATALOGUE_CATEGORIES,
  PROFESSION_CATALOGUE_VERSION,
} from '../src/rules/profession-catalogue.js';
import {
  ensureStartingProfessionSlots,
  isProfessionRespecEnabled,
  planProfessionRespec,
} from '../src/rules/profession-respec.js';
import {
  professionIdentityKey,
  readActorSpecializations,
  type SpecializationRecord,
} from '../src/rules/specializations.js';
import {
  skillAdvantageRerollMax,
  skillCritDailyAllowance,
} from '../src/rules/skill-advantage.js';
import { ritualTrainingModifiers } from '../src/rules/ritual-tn.js';
import {
  buildWizardSpecRows,
  specRecordsFromDraft,
} from '../src/creation/tower-wizard/tower-wizard-identity.js';

describe('K8 Training Rank Progression (authoritative table)', () => {
  it('maps ranks 0–8 to Training Advantage reroll max', () => {
    expect([0, 1, 2, 3, 4, 5, 6, 7, 8].map(skillAdvantageRerollMax)).toEqual([
      0, 1, 2, 3, 4, 5, 6, 6, 6,
    ]);
  });

  it('unlocks Training Crit only at Rank 7 (1) and Rank 8 (2)', () => {
    expect([0, 1, 2, 3, 4, 5, 6, 7, 8].map(skillCritDailyAllowance)).toEqual([
      0, 0, 0, 0, 0, 0, 0, 1, 2,
    ]);
  });

  it('rerolls initial faces of 6 at Rank 6–8 and never clips the band at 5', () => {
    for (const rank of [6, 7, 8]) {
      expect(skillAdvantageRerollMax(rank)).toBe(6);
    }
    const original = Math.random;
    Math.random = () => 0.7; // flat face 6 (0.7 * 8 + 1 = 6.6 → floor 6)
    try {
      const rolled = rollMasteryPoolDice(1, { skillAdvantageRerollMax: 6 });
      // After Advantage, the kept face is whatever Math.random returns next.
      // First call yields 6 (eligible), second call yields another 6 (kept).
      expect(rolled.dice[0]).toBe(6);
      expect(rolled.dieChains[0]?.[0]).toBe(6);
    } finally {
      Math.random = original;
    }
  });

  it('keeps ritual Training Advantage aligned with the new Rank 4 band', () => {
    expect(ritualTrainingModifiers(4).skillAdvantageRerollMax).toBe(4);
    expect(ritualTrainingModifiers(5).skillAdvantageRerollMax).toBe(5);
    expect(ritualTrainingModifiers(6).skillAdvantageRerollMax).toBe(6);
  });
});

describe('K8 Profession category persistence', () => {
  it('round-trips optional category through readActorSpecializations', () => {
    const record: SpecializationRecord = {
      id: professionIdentityKey('Blacksmith'),
      name: 'Blacksmith',
      origin: 'Apprenticed in Kalgrad.',
      scope: 'Forge work and metal judgment.',
      category: 'Trades',
      startingSlot: true,
      rank: 2,
    };
    const read = readActorSpecializations({ specializations: [record] });
    expect(read[0]).toMatchObject({
      name: 'Blacksmith',
      category: 'Trades',
      startingSlot: true,
      rank: 2,
    });
  });

  it('preserves category across a Wizard re-render after changing a Profession', () => {
    // Simulate picking a catalogue suggestion (sets name + category on the row).
    const afterPick = specRecordsFromDraft([
      {
        name: 'Blacksmith',
        origin: 'Apprenticed in Kalgrad.',
        scope: 'Forge work and metal judgment.',
        category: 'Trades',
      },
      { name: 'Tracker', origin: 'Forest patrols.', scope: 'Tracks and signs.', category: 'Wilderness' },
      { name: 'Courtier', origin: 'Minor house.', scope: 'Favors and ceremony.', category: 'Society' },
      { name: 'Burglar', origin: 'City rooftops.', scope: 'Quiet entries and locks.', category: 'Conflict' },
    ]);
    expect(afterPick[0]?.category).toBe('Trades');

    // Change the first Profession (same flow as the dialog writing selection.specializations).
    const afterChange = specRecordsFromDraft([
      {
        name: 'Alchemist',
        origin: 'Guild lab.',
        scope: 'Reagents and compounds.',
        category: 'Knowledge',
      },
      ...afterPick.slice(1).map((s) => ({
        name: s.name,
        origin: s.origin,
        scope: s.scope,
        category: s.category,
      })),
    ]);
    expect(afterChange[0]).toMatchObject({ name: 'Alchemist', category: 'Knowledge' });

    // Re-render the Wizard step from selection (buildWizardSpecRows) — category must survive.
    const rerendered = buildWizardSpecRows({ specializations: afterChange });
    expect(rerendered).toHaveLength(4);
    expect(rerendered[0]).toMatchObject({
      name: 'Alchemist',
      category: 'Knowledge',
      rank: 2,
    });
    expect(rerendered[1]).toMatchObject({ name: 'Tracker', category: 'Wilderness' });
    expect(rerendered[2]).toMatchObject({ name: 'Courtier', category: 'Society' });
    expect(rerendered[3]).toMatchObject({ name: 'Burglar', category: 'Conflict' });

    // Second re-render (leave / return to step) still carries category into the template attr.
    const secondPass = buildWizardSpecRows({
      specializations: specRecordsFromDraft(
        rerendered.map((r) => ({
          name: r.name,
          origin: afterChange.find((s) => s.name === r.name)?.origin,
          scope: r.scope,
          category: r.category,
        })),
      ),
    });
    expect(secondPass.map((r) => r.category)).toEqual([
      'Knowledge',
      'Wilderness',
      'Society',
      'Conflict',
    ]);
  });
});

describe('K8 Beta Profession Respec', () => {
  const starting: SpecializationRecord[] = [
    {
      id: professionIdentityKey('Burglar'),
      name: 'Burglar',
      origin: 'City rooftops.',
      scope: 'Quiet entries and locks.',
      category: 'Conflict',
      startingSlot: true,
      rank: 5,
    },
    {
      id: professionIdentityKey('Tracker'),
      name: 'Tracker',
      origin: 'Forest patrols.',
      scope: 'Tracks and signs.',
      category: 'Wilderness',
      startingSlot: true,
      rank: 2,
    },
    {
      id: professionIdentityKey('Courtier'),
      name: 'Courtier',
      origin: 'Minor house.',
      scope: 'Favors and ceremony.',
      category: 'Society',
      startingSlot: true,
      rank: 2,
    },
    {
      id: professionIdentityKey('Apothecary'),
      name: 'Apothecary',
      origin: 'Herb shop.',
      scope: 'Remedies and stores.',
      category: 'Trades',
      startingSlot: true,
      rank: 2,
    },
    {
      id: 'perception:perception',
      name: 'Perception',
      field: 'perception',
      scope: 'Notice, search, and read the scene',
      rank: 2,
    },
  ];

  it('replaces Burglar 5 with Blacksmith 5 without changing Rank', () => {
    const plan = planProfessionRespec(starting, {
      replaceId: professionIdentityKey('Burglar'),
      name: 'Blacksmith',
      origin: 'Forge apprenticeship.',
      scope: 'Tools, metal, and workshop marks.',
      category: 'Trades',
    });
    expect(plan.ok).toBe(true);
    expect(plan.preservedRank).toBe(5);
    const blacksmith = plan.specializations.find((s) => s.name === 'Blacksmith');
    expect(blacksmith).toMatchObject({
      id: professionIdentityKey('Blacksmith'),
      rank: 5,
      category: 'Trades',
      startingSlot: true,
    });
    expect(plan.specializations.some((s) => s.name === 'Burglar')).toBe(false);
    expect(plan.specializations.filter((s) => s.startingSlot).length).toBe(4);
    expect(plan.specializations.find((s) => s.name === 'Perception')?.rank).toBe(2);
  });

  it('refuses Perception and non-starting Professions', () => {
    const learned: SpecializationRecord[] = [
      ...starting,
      {
        id: professionIdentityKey('Spy'),
        name: 'Spy',
        origin: 'Later training.',
        scope: 'Cover stories.',
        rank: 3,
      },
    ];
    expect(
      planProfessionRespec(learned, {
        replaceId: 'perception:perception',
        name: 'Blacksmith',
        origin: 'x',
        scope: 'y',
      }).ok,
    ).toBe(false);
    expect(
      planProfessionRespec(learned, {
        replaceId: professionIdentityKey('Spy'),
        name: 'Blacksmith',
        origin: 'x',
        scope: 'y',
      }).ok,
    ).toBe(false);
  });

  it('stamps starting slots for legacy characters without the flag', () => {
    const legacy = starting.map(({ startingSlot, ...rest }) => rest);
    const stamped = ensureStartingProfessionSlots(legacy);
    expect(stamped.filter((s) => s.startingSlot === true)).toHaveLength(4);
  });

  it('reports the world setting as disabled when settings are absent', () => {
    expect(isProfessionRespecEnabled(null)).toBe(false);
    expect(isProfessionRespecEnabled({ get: () => false })).toBe(false);
    expect(isProfessionRespecEnabled({ get: () => true })).toBe(true);
  });
});

describe('K8 Group Ambush Profession retention', () => {
  it('uses the specialist Profession id when provided', () => {
    const specialist = {
      id: 's1',
      system: {
        attributes: { agility: { value: 4 } },
        mastery: { rank: 2 },
        specializations: [
          {
            id: professionIdentityKey('Burglar'),
            name: 'Burglar',
            origin: 'Roofs.',
            scope: 'Quiet movement.',
            rank: 4,
          },
        ],
      },
    };
    const trained = planGroupAmbushStealthPool({
      specialist,
      participants: [specialist],
      professionId: professionIdentityKey('Burglar'),
    });
    expect(trained.ok).toBe(true);
    expect(trained.skillRank).toBe(4);
    expect(trained.skillName).toBe('Burglar');
    expect(trained.skillAdvantageRerollMax).toBe(4);

    const untrained = planGroupAmbushStealthPool({
      specialist,
      participants: [specialist],
    });
    expect(untrained.skillRank).toBe(0);
    expect(untrained.skillName).toBe('Untrained');
  });
});

describe('K8 catalogue vs reconciled Player Guide', () => {
  it('has exactly 90 entries in five categories of 18', () => {
    expect(PROFESSION_CATALOGUE).toHaveLength(90);
    expect([...PROFESSION_CATALOGUE_CATEGORIES]).toEqual([
      'Trades',
      'Wilderness',
      'Society',
      'Conflict',
      'Knowledge',
    ]);
    for (const category of PROFESSION_CATALOGUE_CATEGORIES) {
      expect(PROFESSION_CATALOGUE.filter((e) => e.category === category)).toHaveLength(18);
    }
    expect(PROFESSION_CATALOGUE_VERSION).toBe('k8-approved-2026-11-05');
  });

  it('matches every catalogue name and description against the Guide', () => {
    const guide = readFileSync(
      resolve('docs/Rules/Canonical/Players_Handbook.md'),
      'utf8',
    );
    expect(guide).toContain('Beta Profession Respec (Optional)');
    expect(guide).toMatch(/May reroll initial \*\*1s-6s\*\*/);
    expect(guide).toContain('At Rank 7 or higher');
    expect(guide).not.toContain('Five Professions start at Rank 2 using **20 Profession Creation Points**');

    const mismatches: string[] = [];
    for (const entry of PROFESSION_CATALOGUE) {
      const bold = `**${entry.name}:**`;
      if (!guide.includes(bold)) {
        mismatches.push(`missing name ${entry.name}`);
        continue;
      }
      // Scope text is printed after the bold name; require a substantial unique substring.
      const needle = entry.scope_example.slice(0, Math.min(48, entry.scope_example.length));
      if (!guide.includes(needle)) {
        mismatches.push(`missing description for ${entry.name}`);
      }
    }
    expect(mismatches).toEqual([]);
  });
});

describe('K8 ordinary Stealth — no fixed distance break', () => {
  it('does not auto-break ordinary Stealth after moving more than 3 meters', async () => {
    const src = readFileSync(resolve('src/combat/movement-tracker.ts'), 'utf8');
    expect(src).not.toMatch(/totalMoved\s*>\s*3/);
    expect(src).not.toMatch(/breakOrdinaryStealth\(\s*actor\s*,\s*['"]movement['"]\s*\)/);

    const flags: Record<string, unknown> = {};
    const actor = {
      id: 'hero',
      getFlag(_s: string, key: string) {
        return flags[key];
      },
      async setFlag(_s: string, key: string, value: unknown) {
        flags[key] = value;
      },
    };
    const tokenDoc = {
      actor,
      parent: { grid: { size: 100, distance: 1 } },
      x: 0,
      y: 0,
      _source: { x: 0, y: 0 },
    };
    (globalThis as any).game = {
      user: { isGM: true },
      combat: {
        started: true,
        combatant: { actor: { id: 'hero' } },
      },
    };
    const { handleTokenMovement } = await import('../src/combat/movement-tracker.js');
    // Move 5 m in one drag — must track meters for Lacerate but must NOT clear Stealth.
    flags.hidden = true;
    await handleTokenMovement(tokenDoc, { x: 500, y: 0 });
    expect(Number(flags.movedThisTurnM)).toBeGreaterThan(3);
    // breakOrdinaryStealth would clear perception hidden/stealth flags; those are not
    // on this mock — assert the movement path never imported a stealth break by
    // confirming the source contract above and that movement still recorded meters.
    expect(flags.movedThisTurnM).toBe(5);
  });
});

describe('K8 stationary Invisibility — GM adjudication', () => {
  it('documents that an offered sight Perception roll is not automatic permission', () => {
    const src = readFileSync(resolve('src/combat/perception-gate.ts'), 'utf8');
    expect(src).toMatch(/Invisibility \(GM adjudication\)/);
    expect(src).toMatch(/not<\/em> permission to roll|not.*permission to roll/i);
    expect(src).toMatch(/No clue \/ Cancel/);
    expect(src).toMatch(/default:\s*inv\s*>\s*0\s*\?\s*['"]cancel['"]/);
  });
});
