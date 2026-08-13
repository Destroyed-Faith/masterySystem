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
  DISSOLVE_BOND_CONFIRM,
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
  buildSummonActorDataFromBond,
  buildSummonActorOwnership,
} from '../src/stones/familiar-actor-factory';
import {
  CRITICAL_ATTACK_EXPLODE_FACES,
  resolveCriticalAttackModifier,
  syncCriticalRoundQuota,
  consumeCriticalQuota,
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

describe('Critical resolution (quota model)', () => {
  it('Critical(X) grants X attacks per round with fixed 7–8 explode', () => {
    let quota = syncCriticalRoundQuota(null, 'c:1', 2);
    const m = resolveCriticalAttackModifier({
      activeBuffCriticalX: 2,
      buffQuotaRemaining: quota.remaining,
    });
    expect(m.explodeOn78).toBe(true);
    expect(m.explodeFaces).toEqual(CRITICAL_ATTACK_EXPLODE_FACES);
    expect(m.damageDiceExplode).toBe(false);
    quota = consumeCriticalQuota(quota);
    expect(quota.remaining).toBe(1);
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
    bond.spend.movementPurchases = 2; // Flying base 4 + 4 m → 8
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
    expect(c.movementM).toBe(8);
    const done = recomputeBondDerived({ ...bond, needsRedistribution: false });
    expect(done.movementM).toBe(8);
    expect(done.bodies[0].evade).toBe(8);
  });
});

describe('Summon acceptance — rules, budget, action economy', () => {
  it('1. Flying Owl: 8 tokens, 4 m base, 2× movement → 8 m + skill/sight/evade', () => {
    const spend = emptyBondSpend(1);
    spend.movementPurchases = 2;
    spend.skillDicePurchases = 2;
    spend.bodies[0].sharedSenses = ['sight'];
    spend.bodies[0].evadePurchases = 1;
    const c = computeSummonBond({ boundStoneCount: 1, movementMode: 'flying', spend });
    expect(c.tokensAvailable).toBe(8);
    expect(c.movementM).toBe(8);
    expect(c.tokensRemaining).toBe(0);
    expect(c.errors).toEqual([]);
    expect(c.summonAttacks).toBe(1);
  });

  it('2. Two stones + additional body: 16 tokens, bodies do not add attacks', () => {
    const spend = emptyBondSpend(1);
    spend.additionalBodies = 1;
    const c = computeSummonBond({ boundStoneCount: 2, movementMode: 'walking', spend });
    expect(c.tokensAvailable).toBe(16);
    expect(c.bodyCount).toBe(2);
    expect(c.summonAttacks).toBe(1);
    expect(bondAttackBudgetFromBodies({ ...createEmptyBond({
      name: 'X', ownerActorId: 'A', movementMode: 'walking', stoneAttributes: ['might', 'might'],
    }), summonAttacks: c.summonAttacks } as any)).toBe(1);
  });

  it('3. Extra Attack is Bond-scoped; 3 bodies + 1 extra = 2 attacks', () => {
    const spend = emptyBondSpend(1);
    spend.additionalBodies = 2;
    spend.extraAttackPurchases = 1;
    const c = computeSummonBond({ boundStoneCount: 3, movementMode: 'walking', spend });
    expect(c.bodyCount).toBe(3);
    expect(c.summonAttacks).toBe(2);
    expect(c.tokensSpent).toBe(2 * 2 + 8);
  });

  it('4. Artifact bonus is +4 on an existing Bond and cannot create one', () => {
    expect(artifactSummonBonusTokens(1)).toBe(4);
    expect(summonTokensFromStones(0, 4)).toBe(4);
    const v = validateBondRitual({
      ...createEmptyBond({
        name: 'Nope',
        ownerActorId: 'A',
        movementMode: 'walking',
        stoneAttributes: ['might'],
      }),
      boundStoneCount: 0,
      stoneAttributes: [],
      bonusTokens: 4,
    });
    expect(v.ok).toBe(false);
    expect(v.errors.some((e) => /at least 1 Bound Stone/.test(e))).toBe(true);
  });

  it('5–6. Ritual redistribute + adding a stone raises tokens; skill slots follow Bound Stones only', () => {
    const bond = createEmptyBond({
      name: 'Owl',
      ownerActorId: 'A',
      movementMode: 'flying',
      stoneAttributes: ['wits'],
    });
    expect(tokensSummary(bond).skillSlots).toBe(2);
    bond.stoneAttributes = ['wits', 'agility'];
    bond.boundStoneCount = 2;
    bond.bonusTokens = 4;
    bond.needsRedistribution = true;
    const tok = tokensSummary(bond);
    expect(tok.available).toBe(20);
    expect(tok.skillSlots).toBe(3);
    const v = validateBondRitual(bond);
    expect(v.status).toBe('needsRitual');
  });

  it('7. Removing a stone with leftover spend → Over Budget / Needs Ritual', () => {
    const bond = createEmptyBond({
      name: 'Owl',
      ownerActorId: 'A',
      movementMode: 'walking',
      stoneAttributes: ['might', 'might'],
    });
    bond.spend.attackPurchases = 4; // 8 tok
    bond.spend.damagePurchases = 2; // 4 tok
    bond.boundStoneCount = 1;
    bond.stoneAttributes = ['might'];
    bond.needsRedistribution = true;
    const v = validateBondRitual(bond);
    expect(v.overBudget).toBe(true);
    expect(v.ok).toBe(false);
    expect(v.status).toBe('overBudget');
  });

  it('8. Dissolve confirmation copy is exported', () => {
    expect(DISSOLVE_BOND_CONFIRM).toMatch(/Bound Stones return/);
    expect(DISSOLVE_BOND_CONFIRM).toMatch(/tokens will be removed/);
  });

  it('9. Owner MR too low for power → Invalid Until Fixed', () => {
    const bond = createEmptyBond({
      name: 'Owl',
      ownerActorId: 'A',
      movementMode: 'flying',
      stoneAttributes: ['wits', 'wits', 'wits', 'wits'],
    });
    bond.bodies[0].powers = [{ templateId: 'ab-armor', level: 8, tokenCost: 16, category: 'activeBuff' }];
    const v = validateBondRitual(bond, {}, 1);
    expect(v.ok).toBe(false);
    expect(v.status).toBe('invalidUntilFixed');
    expect(v.hardErrors.some((e) => /exceeds owner MR/.test(e))).toBe(true);
  });

  it('10. Skill dice over owner rating blocks apply', () => {
    const bond = createEmptyBond({
      name: 'Owl',
      ownerActorId: 'A',
      movementMode: 'flying',
      stoneAttributes: ['wits'],
    });
    bond.spend.skillDicePurchases = 2;
    bond.selectedSkills = ['perception'];
    bond.skillDiceAlloc = { perception: 4 };
    const v = validateBondRitual(bond, { perception: 2 });
    expect(v.ok).toBe(false);
    expect(v.errors.some((e) => /perception/.test(e))).toBe(true);
  });

  it('11–12. Movement over 16 m blocked for walking and flying', () => {
    const walk = emptyBondSpend(1);
    walk.movementPurchases = 5;
    const cw = computeSummonBond({ boundStoneCount: 10, movementMode: 'walking', spend: walk });
    expect(cw.errors.some((e) => /Movement/.test(e))).toBe(true);

    const fly = emptyBondSpend(1);
    fly.movementPurchases = 7;
    const cf = computeSummonBond({ boundStoneCount: 10, movementMode: 'flying', spend: fly });
    expect(cf.errors.some((e) => /Movement/.test(e))).toBe(true);
    expect(cf.movementM).toBe(SUMMON_CAPS.maxMovementM);
  });

  it('13. Special Value over Special(4) blocked', () => {
    const spend = emptyBondSpend(1);
    spend.specialAccess = true;
    spend.specialValuePurchases = 4;
    const c = computeSummonBond({ boundStoneCount: 4, movementMode: 'walking', spend });
    expect(c.errors.some((e) => /Special/.test(e))).toBe(true);
  });

  it('14. Extra Attack over max 3 total attacks blocked', () => {
    const spend = emptyBondSpend(1);
    spend.extraAttackPurchases = 3;
    const c = computeSummonBond({ boundStoneCount: 8, movementMode: 'walking', spend });
    expect(c.errors.some((e) => /Extra Attack|Summon Attacks/.test(e))).toBe(true);
    expect(c.summonAttacks).toBe(SUMMON_CAPS.maxSummonAttacks);
  });

  it('token breakdown splits bond / skills / bodies', () => {
    const spend = emptyBondSpend(1);
    spend.attackPurchases = 1;
    spend.skillDicePurchases = 2;
    spend.bodies[0].hpPurchases = 1;
    const c = computeSummonBond({ boundStoneCount: 2, movementMode: 'walking', spend });
    expect(c.bondUpgradeTokens).toBe(2);
    expect(c.skillTokens).toBe(2);
    expect(c.bodyTokens[0]).toBe(1);
  });

  it('Special Access without a key is invalid; special is Bond-scoped', () => {
    const bond = createEmptyBond({
      name: 'Pack',
      ownerActorId: 'A',
      movementMode: 'walking',
      stoneAttributes: ['might', 'might', 'might', 'might'],
    });
    bond.spend.additionalBodies = 3;
    bond.spend.specialAccess = true;
    bond.specialKey = null;
    const v = validateBondRitual(bond);
    expect(v.ok).toBe(false);
    bond.specialKey = 'challenge';
    const v2 = validateBondRitual(bond);
    expect(v2.computed.summonAttacks).toBe(1);
    expect(v2.computed.bodyCount).toBe(4);
  });
});

describe('Summon actor create data', () => {
  it('fills NPC combat fields, Friendly disposition, and no notes/description', () => {
    const bond = createEmptyBond({
      name: 'Eule',
      ownerActorId: 'Actor.fin',
      movementMode: 'flying',
      stoneAttributes: ['vitality'],
    });
    const derived = recomputeBondDerived(bond);
    const data = buildSummonActorDataFromBond(derived, derived.bodies[0], {
      id: 'Actor.fin',
      name: 'Fin',
      system: { mastery: { rank: 3 } },
    });
    expect(data.type).toBe('summon');
    expect((data.prototypeToken as any).disposition).toBe(1);
    expect((data.system as any).combat.evade).toBe(derived.bodies[0].evade);
    expect((data.system as any).combat.armor).toBe(derived.bodies[0].armor);
    expect((data.system as any).combat.speed).toBe(derived.movementM);
    expect((data.system as any).npcBaseAttack.attackDiceCount).toBe(derived.attackDice);
    expect((data.system as any).npcBaseAttack.damageDiceCount).toBe(derived.damageDice);
    expect((data.system as any).npcBaseAttack.npcRangeKind).toBe('melee');
    expect((data.system as any).attackSlots).toBe(derived.summonAttacks);
    expect((data.system as any).mastery.rank).toBe(3);
    expect((data.system as any).notes).toBe('');
    expect((data.system as any).bio.description).toBe('');
    expect((data.system as any).bloodColor).toBe('#4a148c');
    expect((data.system as any).creatureType).toBe('');
  });

  it('writes selected creature type onto the summon actor', () => {
    const bond = createEmptyBond({
      name: 'Wolf',
      ownerActorId: 'Actor.fin',
      movementMode: 'walking',
      stoneAttributes: ['might'],
      creatureType: 'beast',
    });
    const data = buildSummonActorDataFromBond(bond, bond.bodies[0], {
      id: 'Actor.fin',
      system: { mastery: { rank: 2 } },
    });
    expect(bond.creatureType).toBe('beast');
    expect((data.system as any).creatureType).toBe('beast');
  });

  it('grants OWNER to GMs and the assigned player of the owner character', () => {
    const ownerActor = {
      id: 'Actor.fin',
      ownership: { default: 0, 'User.gm': 3 },
    };
    const users = [
      { id: 'User.gm', isGM: true, character: null },
      { id: 'User.fin', isGM: false, character: { id: 'Actor.fin' } },
      { id: 'User.other', isGM: false, character: { id: 'Actor.other' } },
    ];
    const ownership = buildSummonActorOwnership(ownerActor, users, 'User.gm');
    expect(ownership.default).toBe(2);
    expect(ownership['User.gm']).toBe(3);
    expect(ownership['User.fin']).toBe(3);
    expect(ownership['User.other']).toBeUndefined();
  });
});

