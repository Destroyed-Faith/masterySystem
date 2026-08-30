import { describe, expect, it } from 'vitest';
import {
  applyCreateToLedger,
  applyReleaseToLedger,
  canManageMinorMagic,
  countHeldMinorMagicItems,
  defaultMinorMagicName,
  emptyMinorMagicLedger,
  ledgerKeyForMinorMagic,
  prepareMinorMagicFlagForTransfer,
  shouldReleaseMinorMagicOnDelete,
  isEligibleMinorMagicPower,
  isInstantDurationPower,
  isPlayerCharacterActor,
  listEligibleMinorMagicPowers,
  minorMagicLimit,
  normalizeMinorMagicLedger,
  resolveMinorMagicPower,
  snapshotPowerForMinorMagic,
  snapshotSummaryLines,
  validateCreateMinorMagic,
} from '../src/utils/minor-magic-items';

function powerItem(overrides: Record<string, unknown> = {}) {
  return {
    id: 'pow-1',
    type: 'power',
    name: 'Single Attack',
    system: {
      category: 'active',
      powerType: 'active',
      rank: 3,
      level: 3,
      templateId: 'active-melee-damage-t3',
      templateName: 'Single Attack',
      chosenSpecial: { key: 'bleed', tier: 3 },
      cost: { action: 'attack' },
      tree: 'crusader',
      specials: ['bleed(2)'],
      levels: {
        '3': {
          type: 'Melee',
          range: { kind: 'melee' },
          aoe: { shape: 'single' },
          duration: { kind: 'instant' },
          effect: { text: 'One melee attack.', dice: '3d8' },
          specials: [{ key: 'bleed', rank: 2 }],
        },
      },
    },
    ...overrides,
  };
}

function actorStub(rank = 2) {
  return {
    id: 'act-1',
    name: 'Hero',
    system: {
      mastery: { rank },
      attributes: { might: { value: 16 }, agility: { value: 10 } },
    },
  };
}

function actorWithItems(items: any[], rank = 2) {
  const map = new Map(items.map((it) => [it.id, it]));
  return {
    ...actorStub(rank),
    items: {
      [Symbol.iterator]: () => items[Symbol.iterator](),
      values: () => items.values(),
      get: (id: string) => map.get(id),
    },
  };
}

function artifactItem(overrides: Record<string, unknown> = {}) {
  const { equipment, system: systemOverrides, getFlag: getFlagOverride, ...rest } = overrides as {
    equipment?: Record<string, unknown>;
    system?: Record<string, unknown>;
    getFlag?: (scope: string, key: string) => unknown;
  };
  return {
    id: 'art-1',
    type: 'artifact',
    name: 'Dragon Head',
    ...rest,
    system: {
      currentLevel: 8,
      equipped: true,
      binding: 'bound',
      levelProgression: [
        { level: 1, name: 'Breath I', type: 'Active', effect: 'Fire', range: '8m' },
        { level: 4, name: 'Breath II', type: 'Active', effect: 'More fire', range: '12m', powerTemplateId: 'active-melee-damage-t3', chosenSpecialKey: 'bleed' },
        { level: 7, name: 'Breath III', type: 'Active', effect: 'Great fire', range: '16m' },
        { level: 2, name: 'Roar', type: 'Active Buff', effect: 'Fear' },
        { level: 3, name: 'Recovery', type: 'Passive', effect: 'Heal' },
      ],
      ...systemOverrides,
    },
    getFlag: getFlagOverride ?? ((_scope: string, key: string) => {
      if (key === 'artifactActivated') return true;
      if (key === 'equipment') return equipment;
      return undefined;
    }),
  };
}

describe('eligibility', () => {
  it('accepts a purchased Active Power', () => {
    expect(isEligibleMinorMagicPower(powerItem())).toBe(true);
  });

  it('rejects Active Buffs, reactions, and granted powers', () => {
    expect(isEligibleMinorMagicPower(powerItem({ system: { category: 'activeBuff', powerType: 'buff' } }))).toBe(false);
    expect(isEligibleMinorMagicPower(powerItem({ system: { category: 'reaction', powerType: 'reaction' } }))).toBe(false);
    expect(isEligibleMinorMagicPower(powerItem({ system: { ...powerItem().system, granted: true } }))).toBe(false);
    expect(isEligibleMinorMagicPower({ type: 'gear', system: {} })).toBe(false);
  });

  it('rejects Artifact-sourced Actives entirely (PG: Artifact Functions are not eligible)', () => {
    expect(
      isEligibleMinorMagicPower(
        powerItem({ system: { ...powerItem().system, fromArtifact: true, artifactRowLevel: 4 } }),
      ),
    ).toBe(false);
    expect(
      isEligibleMinorMagicPower(
        powerItem({ system: { ...powerItem().system, source: 'artifact' } }),
      ),
    ).toBe(false);
  });

  it('rejects Actives without an Instant duration (persistent zones, images, etc.)', () => {
    const persistent = powerItem({
      system: {
        ...powerItem().system,
        levels: {
          '3': {
            ...((powerItem().system as any).levels['3']),
            duration: { kind: 'masteryRankRounds' },
          },
        },
      },
    });
    expect(isInstantDurationPower(persistent as any)).toBe(false);
    expect(isEligibleMinorMagicPower(persistent)).toBe(false);
    expect(isInstantDurationPower(powerItem() as any)).toBe(true);
  });

  it('lists only own purchased Actives — never Artifact rows', () => {
    const actor = actorWithItems([powerItem(), artifactItem()]);
    const listed = listEligibleMinorMagicPowers(actor);
    expect(listed.map((p) => p.name)).toEqual(['Single Attack']);
    expect(resolveMinorMagicPower(actor, 'pow-1')?.name).toBe('Single Attack');
  });
});

describe('limit and ledger', () => {
  it('limit equals Mastery Rank', () => {
    expect(minorMagicLimit(actorStub(1))).toBe(1);
    expect(minorMagicLimit(actorStub(3))).toBe(3);
  });

  it('create counts against the limit until release, including given-away items', () => {
    let ledger = emptyMinorMagicLedger();
    ledger = applyCreateToLedger(ledger, 'item-a');
    ledger = applyCreateToLedger(ledger, 'item-b');
    expect(countHeldMinorMagicItems(ledger)).toBe(2);

    const released = applyReleaseToLedger(ledger, 'item-a');
    expect(released).not.toBeNull();
    expect(countHeldMinorMagicItems(released!)).toBe(1);
    expect(released!.itemIds).toEqual(['item-b']);
  });

  it('reads the old stone ledger shape as item ids', () => {
    const ledger = normalizeMinorMagicLedger({
      items: { 'item-a': { attr: 'might' }, 'item-b': { attr: 'intellect' } },
    });
    expect(ledger.itemIds).toEqual(['item-a', 'item-b']);
  });

  it('releasing an unknown item is a no-op', () => {
    expect(applyReleaseToLedger(emptyMinorMagicLedger(), 'missing')).toBeNull();
  });

  it('keeps the creator slot when the item is given away', () => {
    const flag = {
      creatorId: 'act-1',
      creatorName: 'Hero',
      instanceId: 'mm-1',
      form: 'potion' as const,
      snapshot: { powerName: 'Heal' } as any,
    };
    expect(shouldReleaseMinorMagicOnDelete(flag, { masterySystemMinorMagicTransfer: true })).toBe(false);
    expect(shouldReleaseMinorMagicOnDelete(flag, {})).toBe(true);
    const moved = prepareMinorMagicFlagForTransfer({ ...flag, instanceId: undefined }, 'old-item');
    expect(moved.instanceId).toBe('old-item');
    expect(ledgerKeyForMinorMagic(moved, 'new-item')).toBe('old-item');
  });

  it('create and dismiss require a Safe Haven Rest window', () => {
    const actor = {
      ...actorStub(2),
      getFlag: () => undefined,
    };
    expect(canManageMinorMagic(actor)).toBe(false);
    expect(validateCreateMinorMagic(actor, powerItem(), 'potion')).toMatch(/Safe Haven Rest/);

    const resting = {
      ...actor,
      getFlag: (_scope: string, key: string) => (key === 'minorMagicRest' ? true : undefined),
    };
    expect(canManageMinorMagic(resting)).toBe(true);
  });
});

describe('snapshot', () => {
  it('freezes power level, specials, and the creator attack pool', () => {
    const snap = snapshotPowerForMinorMagic(actorStub(2), powerItem());
    expect(snap.powerLevel).toBe(3);
    expect(snap.attackPool).toEqual({ attribute: 'might', numDice: 16, keepDice: 2 });
    expect(snap.damage).toBe('3d8');
    expect(snap.specials).toMatch(/bleed/i);
    expect(snap.aoeShape).toBe('single');
    expect(snap.targets).toBe(1);
  });

  it('keeps Single Target even when the form is a grenade', () => {
    const snap = snapshotPowerForMinorMagic(actorStub(2), powerItem());
    const lines = snapshotSummaryLines(snap);
    expect(lines.some((l) => /single target/i.test(l))).toBe(true);
    expect(defaultMinorMagicName('grenade', snap.powerName)).toBe('Grenade of Single Attack');
  });

  it('uses the spell casting attribute for the stored attack pool', () => {
    const power = powerItem({
      system: {
        ...powerItem().system,
        isSpell: true,
        castingAttribute: 'intellect',
        tree: 'crusader',
      },
    });
    const actor = {
      ...actorStub(2),
      system: {
        ...actorStub(2).system,
        attributes: { might: { value: 16 }, intellect: { value: 12 } },
      },
    };
    const snap = snapshotPowerForMinorMagic(actor, power);
    expect(snap.attackPool.attribute).toBe('intellect');
    expect(snap.attackPool.numDice).toBe(12);
  });

});

describe('player character recipients', () => {
  it('keeps assigned player characters and drops NPCs and GM-only sheets', () => {
    expect(isPlayerCharacterActor({ id: 'pc1', type: 'character', hasPlayerOwner: true })).toBe(true);
    expect(isPlayerCharacterActor({ id: 'npc1', type: 'npc', hasPlayerOwner: false })).toBe(false);
    expect(isPlayerCharacterActor({ id: 'gm-pc', type: 'character', hasPlayerOwner: false })).toBe(false);
    (globalThis as any).game = {
      users: [{ isGM: false, character: { id: 'linked' } }, { isGM: true, character: { id: 'gm-pc' } }],
    };
    expect(isPlayerCharacterActor({ id: 'linked', type: 'character', hasPlayerOwner: false })).toBe(true);
    delete (globalThis as any).game;
  });
});

describe('default names', () => {
  it('labels each form', () => {
    expect(defaultMinorMagicName('potion', 'Heal')).toBe('Potion of Heal');
    expect(defaultMinorMagicName('rune', 'Heal')).toBe('Rune of Heal');
    expect(defaultMinorMagicName('weapon', 'Single Attack')).toBe('Prepared Single Attack');
    expect(defaultMinorMagicName('trap', 'Single Attack')).toBe('Trap: Single Attack');
    expect(defaultMinorMagicName('charm', 'Ward')).toBe('Charm of Ward');
  });
});
