/**
 * Summons V2 — universal Summon Bond rules (Players Guide / agent.md v0.9.8).
 *
 * Tokens = Bound Stones × 8 (first stone included).
 * One Movement Mode (8–16 m). Bond- vs Body-scoped upgrades.
 * No Familiar / Companion / Host chassis.
 */

export type SummonMovementMode = 'walking' | 'flying' | 'swimming' | 'climbing';

export type SharedSenseGroup = 'sight' | 'hearing' | 'tasteSmell' | 'touchPressure';

export const SUMMON_MOVEMENT_MODES: { value: SummonMovementMode; label: string }[] = [
  { value: 'walking', label: 'Walking' },
  { value: 'flying', label: 'Flying' },
  { value: 'swimming', label: 'Swimming' },
  { value: 'climbing', label: 'Climbing' },
];

export const SHARED_SENSE_GROUPS: { value: SharedSenseGroup; label: string }[] = [
  { value: 'sight', label: 'Sight' },
  { value: 'hearing', label: 'Hearing' },
  { value: 'tasteSmell', label: 'Taste / Smell' },
  { value: 'touchPressure', label: 'Touch / Pressure' },
];

/** Approved Summon Skills only (PG). */
export const SUMMON_SKILL_IDS = [
  'perception',
  'investigation',
  'tracking',
  'survival',
  'navigation',
  'weatherSense',
  'stealth',
  'concealment',
  'athletics',
  'acrobatics',
] as const;

export type SummonSkillId = (typeof SUMMON_SKILL_IDS)[number];

export const BASE_SUMMON = {
  hp: 10,
  armor: 0,
  evade: 4,
  attackDice: 2,
  damageDice: 1,
  movementM: 8,
  summonAttacks: 1,
} as const;

export const SUMMON_CAPS = {
  maxMovementM: 16,
  maxSummonAttacks: 3,
  maxSpecialValue: 4,
  /** Normal Bound Stone → Summon Tokens (Players Guide). */
  tokensPerStone: 8,
  /**
   * Artifact Summon Token Generator (`Rules/artefacts.md`):
   * each Artifact Summon Stone → 4 bonus Tokens for an existing Bond.
   * These are not Bound Stones and cannot create a Bond.
   */
  artifactSummonTokensPerStone: 4,
  extraBodyTokenCost: 2,
  sharedSenseTokenCost: 2,
  skillDiceTokenCost: 1,
  skillDicePerPurchase: 2,
  extraAttackTokenCost: 8,
  specialAccessTokenCost: 4,
  specialValueTokenCost: 2,
  hpTokenCost: 1,
  hpGain: 20,
  armorTokenCost: 2,
  armorGain: 4,
  evadeTokenCost: 2,
  evadeGain: 4,
  attackTokenCost: 2,
  attackDiceGain: 2,
  damageTokenCost: 2,
  damageDiceGain: 1,
  movementTokenCost: 1,
  movementGainM: 2,
} as const;

/** Bonus Tokens from N Artifact Summon Stones (not Bound Stones). */
export function artifactSummonBonusTokens(artifactSummonStoneCount: number): number {
  const n = Math.max(0, Math.floor(Number(artifactSummonStoneCount) || 0));
  return n * SUMMON_CAPS.artifactSummonTokensPerStone;
}

/** Eligible numeric Specials for Summon Bond Special Access (attack Specials). */
export const SUMMON_ELIGIBLE_SPECIALS: { id: string; label: string }[] = [
  { id: 'challenge', label: 'Challenge' },
  { id: 'blight', label: 'Blight' },
  { id: 'corrode', label: 'Corrode' },
  { id: 'disoriented', label: 'Disoriented' },
  { id: 'expose', label: 'Expose' },
  { id: 'hex', label: 'Hex' },
  { id: 'lacerate', label: 'Lacerate' },
  { id: 'mark', label: 'Mark' },
  { id: 'ruin', label: 'Ruin' },
  { id: 'slow', label: 'Slow' },
  { id: 'soulburn', label: 'Soulburn' },
  { id: 'sundered', label: 'Sundered' },
  { id: 'weaken', label: 'Weaken' },
  { id: 'root', label: 'Root' },
];

export type SummonBodyUpgradeSpend = {
  hpPurchases: number;
  armorPurchases: number;
  evadePurchases: number;
  sharedSenses: SharedSenseGroup[];
  /** Canonical powers: token cost already computed. */
  powerTokenCosts: number[];
};

export type SummonBondUpgradeSpend = {
  attackPurchases: number;
  damagePurchases: number;
  movementPurchases: number;
  extraAttackPurchases: number;
  specialAccess: boolean;
  specialValuePurchases: number;
  skillDicePurchases: number;
  /** Number of additional bodies beyond the first (each costs 2 tokens for the body slot). */
  additionalBodies: number;
  bodies: SummonBodyUpgradeSpend[];
};

export function summonTokensFromStones(boundStoneCount: number, bonusTokens = 0): number {
  const stones = Math.max(0, Math.floor(Number(boundStoneCount) || 0));
  const bonus = Math.max(0, Math.floor(Number(bonusTokens) || 0));
  return stones * SUMMON_CAPS.tokensPerStone + bonus;
}

/** Selected skill slots by Bound Stones (bonus tokens do not increase this). */
export function summonSkillSlots(boundStoneCount: number): number {
  const stones = Math.max(0, Math.floor(Number(boundStoneCount) || 0));
  if (stones <= 0) return 0;
  if (stones === 1) return 2;
  if (stones === 2) return 3;
  return 4;
}

/** Max Power Level by owner Mastery Rank. */
export function maxSummonPowerLevel(ownerMasteryRank: number): number {
  const mr = Math.max(1, Math.floor(Number(ownerMasteryRank) || 1));
  if (mr <= 2) return 4;
  if (mr === 3) return 8;
  if (mr === 4) return 12;
  return 16;
}

/** Power Token Cost = ceil(PP / 10). */
export function powerTokenCostFromPp(pp: number): number {
  const n = Math.max(0, Math.floor(Number(pp) || 0));
  if (n <= 0) return 0;
  return Math.ceil(n / 10);
}

/** Standard reference costs when PP is not available. */
export function standardPowerTokenCost(
  powerType: 'active' | 'passive' | 'reaction' | 'activeBuff' | 'movement',
  powerLevel: number,
  movementPp?: number,
): number {
  const lvl = Math.max(1, Math.min(16, Math.floor(Number(powerLevel) || 1)));
  switch (powerType) {
    case 'active':
      return 3 * lvl;
    case 'passive':
    case 'reaction':
      return 2 * lvl;
    case 'activeBuff':
      return 3 * lvl + 1;
    case 'movement':
      return powerTokenCostFromPp(movementPp ?? 0);
    default:
      return 0;
  }
}

export function legacyMovementTypeToMode(raw: string | undefined): SummonMovementMode {
  const t = String(raw || '').toLowerCase();
  if (t === 'flying' || t === 'fly') return 'flying';
  if (t === 'swimming' || t === 'swim') return 'swimming';
  if (t === 'climbing' || t === 'climb') return 'climbing';
  return 'walking';
}

export type ComputedSummonBody = {
  hp: number;
  armor: number;
  evade: number;
  sharedSenses: SharedSenseGroup[];
  powerTokensSpent: number;
};

export type ComputedSummonBond = {
  attackDice: number;
  damageDice: number;
  movementM: number;
  summonAttacks: number;
  specialValue: number;
  hasSpecialAccess: boolean;
  skillDiceTotal: number;
  bodyCount: number;
  bodies: ComputedSummonBody[];
  tokensSpent: number;
  tokensAvailable: number;
  tokensRemaining: number;
  errors: string[];
  warnings: string[];
};

function emptyBodySpend(): SummonBodyUpgradeSpend {
  return {
    hpPurchases: 0,
    armorPurchases: 0,
    evadePurchases: 0,
    sharedSenses: [],
    powerTokenCosts: [],
  };
}

export function computeSummonBond(opts: {
  boundStoneCount: number;
  bonusTokens?: number;
  movementMode: SummonMovementMode;
  spend: SummonBondUpgradeSpend;
}): ComputedSummonBond {
  const errors: string[] = [];
  const warnings: string[] = [];
  const stones = Math.max(0, Math.floor(Number(opts.boundStoneCount) || 0));
  const available = summonTokensFromStones(stones, opts.bonusTokens);
  const spend = opts.spend;

  let tokensSpent = 0;
  const add = (n: number) => {
    tokensSpent += n;
  };

  const attackPurchases = Math.max(0, Math.floor(spend.attackPurchases || 0));
  const damagePurchases = Math.max(0, Math.floor(spend.damagePurchases || 0));
  const movementPurchases = Math.max(0, Math.floor(spend.movementPurchases || 0));
  const extraAttackPurchases = Math.max(0, Math.floor(spend.extraAttackPurchases || 0));
  const specialValuePurchases = Math.max(0, Math.floor(spend.specialValuePurchases || 0));
  const skillDicePurchases = Math.max(0, Math.floor(spend.skillDicePurchases || 0));
  const additionalBodies = Math.max(0, Math.floor(spend.additionalBodies || 0));

  add(attackPurchases * SUMMON_CAPS.attackTokenCost);
  add(damagePurchases * SUMMON_CAPS.damageTokenCost);
  add(movementPurchases * SUMMON_CAPS.movementTokenCost);
  add(extraAttackPurchases * SUMMON_CAPS.extraAttackTokenCost);
  if (spend.specialAccess) add(SUMMON_CAPS.specialAccessTokenCost);
  add(specialValuePurchases * SUMMON_CAPS.specialValueTokenCost);
  add(skillDicePurchases * SUMMON_CAPS.skillDiceTokenCost);
  add(additionalBodies * SUMMON_CAPS.extraBodyTokenCost);

  const bodyCount = 1 + additionalBodies;
  const bodySpends: SummonBodyUpgradeSpend[] = [];
  for (let i = 0; i < bodyCount; i++) {
    bodySpends.push(spend.bodies[i] ? { ...spend.bodies[i] } : emptyBodySpend());
  }

  const bodies: ComputedSummonBody[] = bodySpends.map((b) => {
    const hpP = Math.max(0, Math.floor(b.hpPurchases || 0));
    const arP = Math.max(0, Math.floor(b.armorPurchases || 0));
    const evP = Math.max(0, Math.floor(b.evadePurchases || 0));
    const senses = Array.from(new Set(b.sharedSenses || []));
    const powerCosts = (b.powerTokenCosts || []).map((c) => Math.max(0, Math.floor(c || 0)));
    const powerTokens = powerCosts.reduce((s, c) => s + c, 0);

    add(hpP * SUMMON_CAPS.hpTokenCost);
    add(arP * SUMMON_CAPS.armorTokenCost);
    add(evP * SUMMON_CAPS.evadeTokenCost);
    add(senses.length * SUMMON_CAPS.sharedSenseTokenCost);
    add(powerTokens);

    return {
      hp: BASE_SUMMON.hp + hpP * SUMMON_CAPS.hpGain,
      armor: BASE_SUMMON.armor + arP * SUMMON_CAPS.armorGain,
      evade: BASE_SUMMON.evade + evP * SUMMON_CAPS.evadeGain,
      sharedSenses: senses,
      powerTokensSpent: powerTokens,
    };
  });

  const movementM = BASE_SUMMON.movementM + movementPurchases * SUMMON_CAPS.movementGainM;
  if (movementM > SUMMON_CAPS.maxMovementM) {
    errors.push(`Movement ${movementM} m exceeds cap ${SUMMON_CAPS.maxMovementM} m.`);
  }

  const summonAttacks = BASE_SUMMON.summonAttacks + extraAttackPurchases;
  if (summonAttacks > SUMMON_CAPS.maxSummonAttacks) {
    errors.push(`Summon Attacks ${summonAttacks} exceed cap ${SUMMON_CAPS.maxSummonAttacks}.`);
  }

  if (specialValuePurchases > 0 && !spend.specialAccess) {
    errors.push('Special Value requires Special Access.');
  }
  const specialValue = spend.specialAccess ? 1 + specialValuePurchases : 0;
  if (specialValue > SUMMON_CAPS.maxSpecialValue) {
    errors.push(`Special value ${specialValue} exceeds Special(${SUMMON_CAPS.maxSpecialValue}).`);
  }

  if (tokensSpent > available) {
    errors.push(`Spent ${tokensSpent} Tokens but only ${available} available.`);
  }

  if (!SUMMON_MOVEMENT_MODES.some((m) => m.value === opts.movementMode)) {
    errors.push(`Invalid movement mode: ${opts.movementMode}`);
  }

  return {
    attackDice: BASE_SUMMON.attackDice + attackPurchases * SUMMON_CAPS.attackDiceGain,
    damageDice: BASE_SUMMON.damageDice + damagePurchases * SUMMON_CAPS.damageDiceGain,
    movementM: Math.min(SUMMON_CAPS.maxMovementM, movementM),
    summonAttacks: Math.min(SUMMON_CAPS.maxSummonAttacks, summonAttacks),
    specialValue: Math.min(SUMMON_CAPS.maxSpecialValue, specialValue),
    hasSpecialAccess: !!spend.specialAccess,
    skillDiceTotal: skillDicePurchases * SUMMON_CAPS.skillDicePerPurchase,
    bodyCount,
    bodies,
    tokensSpent,
    tokensAvailable: available,
    tokensRemaining: available - tokensSpent,
    errors,
    warnings,
  };
}

/** Default empty spend for a freshly created bond (tokens unspent). */
export function emptyBondSpend(bodyCount = 1): SummonBondUpgradeSpend {
  const n = Math.max(1, bodyCount);
  return {
    attackPurchases: 0,
    damagePurchases: 0,
    movementPurchases: 0,
    extraAttackPurchases: 0,
    specialAccess: false,
    specialValuePurchases: 0,
    skillDicePurchases: 0,
    additionalBodies: n - 1,
    bodies: Array.from({ length: n }, () => emptyBodySpend()),
  };
}
