import { describe, expect, it } from 'vitest';
import {
  applyCreateToLedger,
  applyReleaseToLedger,
  canManageMinorMagic,
  countHeldMinorMagicItems,
  defaultMinorMagicName,
  emptyMinorMagicLedger,
  isEligibleMinorMagicPower,
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
      get: (id: string) => map.get(id),
    },
  };
}

function artifactItem(overrides: Record<string, unknown> = {}) {
  return {
    id: 'art-1',
    type: 'artifact',
    name: 'Dragon Head',
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
    },
    getFlag: (_scope: string, key: string) => (key === 'artifactActivated' ? true : undefined),
    ...overrides,
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

  it('accepts Artifact Actives at level 6 or lower and rejects Greater / Ultimate rows', () => {
    expect(
      isEligibleMinorMagicPower(
        powerItem({ system: { ...powerItem().system, fromArtifact: true, artifactRowLevel: 6 } }),
      ),
    ).toBe(true);
    expect(
      isEligibleMinorMagicPower(
        powerItem({ system: { ...powerItem().system, fromArtifact: true, artifactRowLevel: 7 } }),
      ),
    ).toBe(false);
    expect(
      isEligibleMinorMagicPower(
        powerItem({ system: { ...powerItem().system, fromArtifact: true, artifactRowLevel: 10 } }),
      ),
    ).toBe(false);
  });

  it('lists equipped Artifact Actives capped at Artifact Level 6', () => {
    const actor = actorWithItems([powerItem(), artifactItem()]);
    const listed = listEligibleMinorMagicPowers(actor);
    expect(listed.map((p) => p.name)).toEqual(['Breath II', 'Single Attack']);
    const breath = listed.find((p) => p.name === 'Breath II');
    expect(breath.system.artifactRowLevel).toBe(4);
    expect(breath.system.rank).toBe(10);
    expect(resolveMinorMagicPower(actor, breath.id)?.name).toBe('Breath II');
    expect(listed.some((p) => p.name === 'Breath III')).toBe(false);
    expect(listed.some((p) => p.name === 'Roar')).toBe(false);
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

  it('snapshots an Artifact Active at the Improved (level 6) stage, not Greater', () => {
    const actor = actorWithItems([artifactItem()]);
    const breath = listEligibleMinorMagicPowers(actor).find((p) => p.name === 'Breath II');
    expect(breath).toBeTruthy();
    const snap = snapshotPowerForMinorMagic(actor, breath);
    expect(snap.powerName).toBe('Breath II');
    expect(snap.powerLevel).toBe(10);
    expect(snap.templateId).toBe('active-melee-damage-t3');
    expect(snap.chosenSpecialKey).toBe('bleed');
    expect(snap.damage).toMatch(/d8/);
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
