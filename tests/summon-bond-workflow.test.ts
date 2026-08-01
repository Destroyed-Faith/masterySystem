import { describe, expect, it } from 'vitest';
import {
  artifactSummonBonusTokens,
  computeSummonBond,
  emptyBondSpend,
  SUMMON_CAPS,
  summonTokensFromStones,
} from '../src/stones/summon-bond-rules';
import {
  bondAttackBudgetFromBodies,
  bodyHasPurchasedPower,
  summonActorMayUseStonesOrArtifacts,
} from '../src/stones/summon-combat';
import {
  bondStoneAssignments,
  createEmptyBond,
  migrateFamiliarToBond,
  recomputeBondDerived,
  syncBodiesFromSpend,
  tokensSummary,
  validateBondRitual,
  validateBondSkillAlloc,
} from '../src/stones/summon-bond-bind';
import {
  CRITICAL_HIGHER_TIER_STATUS,
  resolveCriticalAttackModifier,
} from '../src/combat/critical-resolution';

describe('Artifact Summon Token Generator', () => {
  it('grants 4 bonus tokens per Artifact Summon Stone (not Bound Stones)', () => {
    expect(SUMMON_CAPS.artifactSummonTokensPerStone).toBe(4);
    expect(artifactSummonBonusTokens(1)).toBe(4);
    expect(artifactSummonBonusTokens(2)).toBe(8);
    expect(artifactSummonBonusTokens(8)).toBe(32);
  });

  it('adds artifact bonus tokens on top of Bound Stone ×8 without adding skill slots', () => {
    expect(summonTokensFromStones(2, artifactSummonBonusTokens(1))).toBe(20);
    const spend = emptyBondSpend(1);
    const c = computeSummonBond({
      boundStoneCount: 2,
      bonusTokens: artifactSummonBonusTokens(1),
      movementMode: 'walking',
      spend,
    });
    expect(c.tokensAvailable).toBe(20);
  });
});

describe('Summon Bond Ritual validation', () => {
  it('creates empty bonds that need redistribution until ritual applied', () => {
    const bond = createEmptyBond({
      name: 'Owl',
      ownerActorId: 'Actor.1',
      movementMode: 'flying',
      stoneAttributes: ['vitality'],
    });
    expect(bond.needsRedistribution).toBe(true);
    expect(bond.boundStoneCount).toBe(1);
    expect(tokensSummary(bond).available).toBe(8);
  });

  it('validates movement and attack caps', () => {
    const bond = createEmptyBond({
      name: 'Bear',
      ownerActorId: 'Actor.1',
      movementMode: 'walking',
      stoneAttributes: ['might', 'might', 'might', 'might'],
    });
    bond.spend.movementPurchases = 5; // 8+10=18 > 16
    const v = validateBondRitual(bond);
    expect(v.ok).toBe(false);
    expect(v.errors.some((e) => /Movement/.test(e))).toBe(true);
  });

  it('requires Special Access before Special Value and a special key', () => {
    const bond = createEmptyBond({
      name: 'Bear',
      ownerActorId: 'Actor.1',
      movementMode: 'walking',
      stoneAttributes: ['might', 'might', 'might', 'might'],
    });
    bond.spend.specialValuePurchases = 1;
    let v = validateBondRitual(bond);
    expect(v.ok).toBe(false);

    bond.spend.specialAccess = true;
    bond.specialKey = null;
    v = validateBondRitual(bond);
    expect(v.ok).toBe(false);
    expect(v.errors.some((e) => /Special Access requires selecting/.test(e))).toBe(true);

    bond.specialKey = 'challenge';
    v = validateBondRitual(bond);
    expect(v.computed.specialValue).toBe(2);
  });

  it('syncs additional bodies from spend without granting extra attacks', () => {
    const bond = createEmptyBond({
      name: 'Warband',
      ownerActorId: 'Actor.1',
      movementMode: 'walking',
      stoneAttributes: ['resolve', 'resolve', 'resolve', 'resolve'],
    });
    bond.spend.additionalBodies = 3;
    bond.spend.extraAttackPurchases = 1;
    const synced = syncBodiesFromSpend(bond);
    expect(synced.bodies).toHaveLength(4);
    expect(synced.summonAttacks).toBe(2);
    expect(bondAttackBudgetFromBodies(synced)).toBe(2);
    expect(synced.bodies.length).not.toBe(synced.summonAttacks);
  });

  it('assigns body-specific shared senses and powers', () => {
    const bond = createEmptyBond({
      name: 'Scout',
      ownerActorId: 'Actor.1',
      movementMode: 'flying',
      stoneAttributes: ['wits', 'wits'],
    });
    bond.spend.additionalBodies = 1;
    bond.spend.bodies = [
      {
        hpPurchases: 0,
        armorPurchases: 0,
        evadePurchases: 0,
        sharedSenses: ['sight'],
        powerTokenCosts: [3],
      },
      {
        hpPurchases: 1,
        armorPurchases: 0,
        evadePurchases: 0,
        sharedSenses: ['hearing'],
        powerTokenCosts: [],
      },
    ];
    bond.bodies = [
      {
        id: 'b0',
        hp: 10,
        armor: 0,
        evade: 4,
        sharedSenses: ['sight'],
        powers: [{ templateId: 'ab-armor', level: 1, tokenCost: 3, category: 'activeBuff' }],
        dormant: false,
      },
      {
        id: 'b1',
        hp: 10,
        armor: 0,
        evade: 4,
        sharedSenses: [],
        powers: [],
        dormant: false,
        hpPurchases: 1,
      },
    ];
    const synced = syncBodiesFromSpend(bond);
    expect(synced.bodies[0].sharedSenses).toEqual(['sight']);
    expect(synced.bodies[1].sharedSenses).toEqual(['hearing']);
    expect(synced.bodies[1].hp).toBe(30);
    expect(bodyHasPurchasedPower(synced, 'b0', 'ab-armor')).toBe(true);
    expect(bodyHasPurchasedPower(synced, 'b1', 'ab-armor')).toBe(false);
  });

  it('validates skill dice against owner ratings and purchased dice', () => {
    const bond = createEmptyBond({
      name: 'Owl',
      ownerActorId: 'Actor.1',
      movementMode: 'flying',
      stoneAttributes: ['wits'],
    });
    bond.spend.skillDicePurchases = 2; // 4 dice
    bond.selectedSkills = ['perception', 'stealth'];
    bond.skillDiceAlloc = { perception: 3, stealth: 2 };
    const errors = validateBondSkillAlloc(bond, { perception: 2, stealth: 4 });
    expect(errors.some((e) => /perception/.test(e))).toBe(true);
    expect(errors.some((e) => /Allocated 5/.test(e))).toBe(true);
  });

  it('tracks stone attribute assignments for dissolve credit', () => {
    const bond = createEmptyBond({
      name: 'X',
      ownerActorId: 'A',
      movementMode: 'walking',
      stoneAttributes: ['might', 'might', 'vitality'],
    });
    expect(bondStoneAssignments(bond)).toEqual({ might: 2, vitality: 1 });
  });

  it('migrated familiars keep needsRedistribution until ritual', () => {
    const bond = migrateFamiliarToBond(
      {
        id: 'fam-1',
        name: 'Old Fam',
        img: '',
        movementType: 'flying',
        ownerActorId: 'Actor.1',
        baseStone: { attribute: 'vitality' },
        upgradeStones: [{ id: 'u1', attribute: 'wits', picks: ['hp', 'armor'] }],
        sharedSenses: [],
        boundStoneCount: 2,
        stats: { hp: 22, armor: 4, evade: 4, attack: '2d8', damage: '1d8', movementM: 4 },
        size: 'Small',
        locked: true,
      } as any,
      'Actor.1',
    );
    expect(bond.needsRedistribution).toBe(true);
    expect(bond.boundStoneCount).toBe(2);
    expect(tokensSummary(bond).remaining).toBe(16);
  });
});

describe('Summon actor restrictions', () => {
  it('forbids stones/artifacts on summon actors', () => {
    expect(summonActorMayUseStonesOrArtifacts({ type: 'summon' })).toBe(false);
    expect(summonActorMayUseStonesOrArtifacts({ type: 'character' })).toBe(true);
  });
});

describe('Critical resolution isolation', () => {
  it('Critical(1) explodes on 7–8', () => {
    const m = resolveCriticalAttackModifier({ activeBuffCriticalTier: 1 });
    expect(m.explodeOn78).toBe(true);
    expect(m.higherTierAwaitingRules).toBe(false);
  });

  it('Critical(2–4) do not invent extra effects; marked awaiting Rules', () => {
    for (const tier of [2, 3, 4]) {
      const m = resolveCriticalAttackModifier({ activeBuffCriticalTier: tier });
      expect(m.explodeOn78).toBe(true);
      expect(m.higherTierAwaitingRules).toBe(true);
      expect(m.pendingHigherTierEffect).toBeNull();
    }
    expect(CRITICAL_HIGHER_TIER_STATUS).toBe('requires-rule-decision');
  });

  it('stone Crit charges also enable explode-on-7–8', () => {
    const m = resolveCriticalAttackModifier({ stoneCritCharges: 2 });
    expect(m.explodeOn78).toBe(true);
    expect(m.sources).toContain('stone-crit');
  });
});

describe('Summon spend recompute', () => {
  it('applies Scout Owl example purchases within 8 tokens', () => {
    const bond = createEmptyBond({
      name: 'Owl',
      ownerActorId: 'A',
      movementMode: 'flying',
      stoneAttributes: ['wits'],
    });
    bond.spend.movementPurchases = 2; // +4 m → 12
    bond.spend.skillDicePurchases = 2; // 2 tok
    bond.spend.bodies[0].sharedSenses = ['sight']; // 2 tok
    bond.spend.bodies[0].evadePurchases = 1; // 2 tok
    // total 2+2+2+2 = 8
    const c = computeSummonBond({
      boundStoneCount: 1,
      movementMode: 'flying',
      spend: bond.spend,
    });
    expect(c.errors).toEqual([]);
    expect(c.tokensRemaining).toBe(0);
    expect(c.movementM).toBe(12);
    const done = recomputeBondDerived({ ...bond, needsRedistribution: false });
    expect(done.movementM).toBe(12);
    expect(done.bodies[0].evade).toBe(8);
  });
});
