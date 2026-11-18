import { describe, expect, it } from 'vitest';
import {
  ensureStartingProfessionSlots,
  isLockedStartingProfession,
  isUninvestedStartingProfession,
  planProfessionDelete,
  planProfessionRespec,
  planProfessionRespecEligibility,
  professionIdentityKey,
  specializationXpCostFromTo,
  type SpecializationRecord,
} from '../src/rules/index';

function startingFour(rankByName: Record<string, number> = {}): SpecializationRecord[] {
  const names = ['Burglar', 'Tracker', 'Courtier', 'Apothecary'];
  return [
    ...names.map((name) => ({
      id: professionIdentityKey(name),
      name,
      scope: `${name} scope`,
      rank: rankByName[name] ?? 2,
      startingSlot: true as const,
    })),
    {
      id: 'profession:perception',
      name: 'Perception',
      field: 'perception' as const,
      scope: 'Notice',
      rank: 2,
    },
  ];
}

describe('profession lifecycle — delete', () => {
  it('allows creation reselect with 0 refund', () => {
    const specs = startingFour();
    const plan = planProfessionDelete(specs, professionIdentityKey('Burglar'), {
      creationComplete: false,
      isGM: false,
    });
    expect(plan).toMatchObject({ ok: true, refund: 0, mode: 'creation-reselect' });
  });

  it('blocks players from deleting starting Professions after creation', () => {
    const plan = planProfessionDelete(startingFour(), professionIdentityKey('Burglar'), {
      creationComplete: true,
      isGM: false,
    });
    expect(plan.ok).toBe(false);
    expect(plan.refund).toBe(0);
    expect(plan.error).toMatch(/cannot be deleted for XP/i);
  });

  it('lets GM clear uninvested Rank 2 starting Profession with 0 refund', () => {
    const plan = planProfessionDelete(startingFour(), professionIdentityKey('Tracker'), {
      creationComplete: true,
      isGM: true,
    });
    expect(plan).toMatchObject({ ok: true, refund: 0, mode: 'gm-rank2-clear' });
  });

  it('locks GM clear once starting Profession has invested XP', () => {
    const specs = startingFour({ Burglar: 3 });
    expect(isLockedStartingProfession(specs[0]!)).toBe(true);
    const plan = planProfessionDelete(specs, professionIdentityKey('Burglar'), {
      creationComplete: true,
      isGM: true,
    });
    expect(plan.ok).toBe(false);
    expect(plan.refund).toBe(0);
  });

  it('stamps missing startingSlot before treating Rank 2 as free (no exploit refund)', () => {
    const unstamped: SpecializationRecord[] = startingFour().map(({ startingSlot, ...rest }) => rest);
    const plan = planProfessionDelete(unstamped, professionIdentityKey('Burglar'), {
      creationComplete: true,
      isGM: true,
    });
    expect(plan.ok).toBe(true);
    expect(plan.refund).toBe(0);
    expect(plan.spec?.startingSlot).toBe(true);
  });

  it('refunds invested XP for learned Professions', () => {
    const specs: SpecializationRecord[] = [
      ...startingFour(),
      {
        id: professionIdentityKey('Courier'),
        name: 'Courier',
        scope: 'Messages',
        rank: 2,
      },
    ];
    const plan = planProfessionDelete(specs, professionIdentityKey('Courier'), {
      creationComplete: true,
      isGM: false,
    });
    expect(plan).toMatchObject({
      ok: true,
      mode: 'learned-refund',
      refund: specializationXpCostFromTo(0, 2),
    });
  });
});

describe('profession lifecycle — respec', () => {
  it('marks Rank 2 starting rows as uninvested', () => {
    const tracker = startingFour().find((s) => s.name === 'Tracker')!;
    expect(isUninvestedStartingProfession(tracker)).toBe(true);
  });

  it('allows GM Rank 2 respec without the player world setting', () => {
    const eligibility = planProfessionRespecEligibility(
      startingFour(),
      professionIdentityKey('Courtier'),
      { creationComplete: true, isGM: true, playerRespecEnabled: false },
    );
    expect(eligibility.ok).toBe(true);
    expect(eligibility.gmAllowed).toBe(true);
  });

  it('blocks player respec when the beta setting is off', () => {
    const eligibility = planProfessionRespecEligibility(
      startingFour(),
      professionIdentityKey('Courtier'),
      { creationComplete: true, isGM: false, playerRespecEnabled: false },
    );
    expect(eligibility.ok).toBe(false);
  });

  it('allows player Rank 2 respec when the beta setting is on', () => {
    const eligibility = planProfessionRespecEligibility(
      startingFour(),
      professionIdentityKey('Courtier'),
      { creationComplete: true, isGM: false, playerRespecEnabled: true },
    );
    expect(eligibility.ok).toBe(true);
  });

  it('refuses respec after XP investment', () => {
    const plan = planProfessionRespec(startingFour({ Apothecary: 4 }), {
      replaceId: professionIdentityKey('Apothecary'),
      name: 'Herbalist',
      scope: 'Plants and poultices.',
    });
    expect(plan.ok).toBe(false);
  });
});

describe('ensureStartingProfessionSlots', () => {
  it('does not convert a later learned Profession when slots already exist', () => {
    const specs: SpecializationRecord[] = [
      ...startingFour().slice(0, 4),
      {
        id: professionIdentityKey('Spy'),
        name: 'Spy',
        scope: 'Cover',
        rank: 1,
      },
    ];
    const stamped = ensureStartingProfessionSlots(specs);
    expect(stamped.find((s) => s.name === 'Spy')?.startingSlot).toBeUndefined();
  });
});
