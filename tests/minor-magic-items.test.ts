import { describe, expect, it } from 'vitest';
import {
  applyCreateToLedger,
  applyReleaseToLedger,
  applySafeHavenToLedger,
  countHeldMinorMagicItems,
  defaultMinorMagicName,
  emptyMinorMagicLedger,
  isEligibleMinorMagicPower,
  minorMagicLimit,
  snapshotPowerForMinorMagic,
  snapshotSummaryLines,
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

describe('eligibility', () => {
  it('accepts a purchased Active Power', () => {
    expect(isEligibleMinorMagicPower(powerItem())).toBe(true);
  });

  it('rejects Active Buffs, reactions, and artifact-granted powers', () => {
    expect(isEligibleMinorMagicPower(powerItem({ system: { category: 'activeBuff', powerType: 'buff' } }))).toBe(false);
    expect(isEligibleMinorMagicPower(powerItem({ system: { category: 'reaction', powerType: 'reaction' } }))).toBe(false);
    expect(isEligibleMinorMagicPower(powerItem({ system: { ...powerItem().system, fromArtifact: true } }))).toBe(false);
    expect(isEligibleMinorMagicPower(powerItem({ system: { ...powerItem().system, granted: true } }))).toBe(false);
    expect(isEligibleMinorMagicPower({ type: 'gear', system: {} })).toBe(false);
  });
});

describe('limit and ledger', () => {
  it('limit equals Mastery Rank', () => {
    expect(minorMagicLimit(actorStub(1))).toBe(1);
    expect(minorMagicLimit(actorStub(3))).toBe(3);
  });

  it('create counts against the limit until release', () => {
    let ledger = emptyMinorMagicLedger();
    ledger = applyCreateToLedger(ledger, 'item-a', 'might');
    ledger = applyCreateToLedger(ledger, 'item-b', 'intellect');
    expect(countHeldMinorMagicItems(ledger)).toBe(2);
    expect(ledger.heldByAttr.might).toBe(1);
    expect(ledger.heldByAttr.intellect).toBe(1);

    const released = applyReleaseToLedger(ledger, 'item-a');
    expect(released).not.toBeNull();
    expect(countHeldMinorMagicItems(released!)).toBe(1);
    expect(released!.heldByAttr.might).toBeUndefined();
    expect(released!.pendingByAttr.might).toBe(1);
  });

  it('Safe Haven restores pending stones and keeps held stones burned', () => {
    let ledger = applyCreateToLedger(emptyMinorMagicLedger(), 'item-a', 'might');
    ledger = applyReleaseToLedger(ledger, 'item-a')!;
    ledger = applyCreateToLedger(ledger, 'item-b', 'might');

    const rest = applySafeHavenToLedger(ledger);
    expect(rest.restoreByAttr.might).toBe(1);
    expect(rest.ledger.pendingByAttr).toEqual({});
    expect(rest.ledger.heldByAttr.might).toBe(1);
    expect(countHeldMinorMagicItems(rest.ledger)).toBe(1);
  });

  it('releasing an unknown item is a no-op', () => {
    expect(applyReleaseToLedger(emptyMinorMagicLedger(), 'missing')).toBeNull();
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

describe('default names', () => {
  it('labels each form', () => {
    expect(defaultMinorMagicName('potion', 'Heal')).toBe('Potion of Heal');
    expect(defaultMinorMagicName('rune', 'Heal')).toBe('Rune of Heal');
    expect(defaultMinorMagicName('weapon', 'Single Attack')).toBe('Prepared Single Attack');
    expect(defaultMinorMagicName('trap', 'Single Attack')).toBe('Trap: Single Attack');
    expect(defaultMinorMagicName('charm', 'Ward')).toBe('Charm of Ward');
  });
});
