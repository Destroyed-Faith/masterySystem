/**
 * Familiar / Summons rules: canonical progression tables (character sheet) and validation.
 */

export type MovementType = 'ground' | 'flying';

export type UpgradeCategory = 'hp' | 'armor' | 'evade' | 'attack' | 'damage' | 'movement';

/** Select options for the Familiar builder UI. */
export const FAMILIAR_UPGRADE_CATEGORY_OPTIONS: { value: UpgradeCategory; label: string }[] = [
  { value: 'hp', label: 'HP (+12)' },
  { value: 'armor', label: 'Armor (+3)' },
  { value: 'evade', label: 'Evade (+4)' },
  { value: 'attack', label: 'Attack (+2d8)' },
  { value: 'damage', label: 'Damage (+1d8)' },
  { value: 'movement', label: 'Movement (+2 m ground / +1 m flying)' }
];

export type SharedSenseGroup = 'sight' | 'hearing' | 'tasteSmell' | 'touchPressure';

export type UpgradeStoneInput = {
  id: string;
  picks: [UpgradeCategory, UpgradeCategory];
};

export type FamiliarComputationInput = {
  familiarName: string;
  movementType: MovementType;
  /** Each entry is one additional Bound Stone with exactly two distinct upgrade picks. */
  upgradeStones: UpgradeStoneInput[];
  /** Shared Sense groups (each costs one Bound Stone, no upgrade picks). */
  sharedSenses: SharedSenseGroup[];
  masteryRank: number;
};

/** Base + 8 upgrade tiers — index = number of category upgrades taken. */
export const FAMILIAR_HP_BY_TIER = [
  10, 22, 34, 46, 58, 70, 82, 94, 106
] as const;

export const FAMILIAR_ARMOR_BY_TIER = [0, 3, 6, 9, 12, 15, 18, 21, 24] as const;

export const FAMILIAR_EVADE_BY_TIER = [4, 8, 12, 16, 20, 24, 28, 32, 36] as const;

/** Attack: dice count for Xd8 */
export const FAMILIAR_ATTACK_DICE_BY_TIER = [2, 4, 6, 8, 10, 12, 14, 16, 18] as const;

export const FAMILIAR_DAMAGE_DICE_BY_TIER = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

export const FAMILIAR_GROUND_MOVEMENT_BY_TIER = [8, 10, 12, 14, 16, 18, 20, 22, 24] as const;

export const FAMILIAR_FLYING_MOVEMENT_BY_TIER = [4, 5, 6, 7, 8, 9, 10, 11, 12] as const;

const MAX_TIER_INDEX = 8;

export type FamiliarFinalStats = {
  hp: number;
  armor: number;
  evade: number;
  attack: string;
  damage: string;
  movementM: number;
};

export type FamiliarSize = 'Tiny' | 'Small' | 'Medium' | 'Large';

export type FamiliarResult = {
  familiarName: string;
  movementType: MovementType;
  totalBoundStones: number;
  /** Count of additional upgrade Stones (not including base). */
  upgradeStones: number;
  sharedSenseStones: number;
  sharedSenses: SharedSenseGroup[];
  hpUpgrades: number;
  armorUpgrades: number;
  evadeUpgrades: number;
  attackUpgrades: number;
  damageUpgrades: number;
  movementUpgrades: number;
  size: FamiliarSize;
  finalStats: FamiliarFinalStats;
  validationWarnings: string[];
};

function sizeFromHpUpgrades(hpUpgrades: number): FamiliarSize {
  if (hpUpgrades <= 0) return 'Tiny';
  if (hpUpgrades <= 3) return 'Small';
  if (hpUpgrades <= 6) return 'Medium';
  return 'Large';
}

function tierLookup<T extends readonly number[]>(table: T, index: number, label: string, warnings: string[]): number {
  if (index < 0) {
    warnings.push(`${label}: negative upgrade count treated as 0.`);
    return table[0];
  }
  if (index > MAX_TIER_INDEX) {
    warnings.push(`${label}: ${index} upgrades exceed table (max ${MAX_TIER_INDEX}); using tier ${MAX_TIER_INDEX}.`);
    return table[MAX_TIER_INDEX];
  }
  return table[index];
}

function attackDamageString(dice: number): string {
  return `${dice}d8`;
}

/**
 * Aggregate upgrade picks from upgrade stones, handling duplicate picks on the same stone (invalid: only first counts per category per stone).
 */
function aggregateUpgradePicks(
  upgradeStones: UpgradeStoneInput[],
  warnings: string[]
): {
  hp: number;
  armor: number;
  evade: number;
  attack: number;
  damage: number;
  movement: number;
} {
  const counts = {
    hp: 0,
    armor: 0,
    evade: 0,
    attack: 0,
    damage: 0,
    movement: 0
  };

  const bump = (cat: UpgradeCategory) => {
    counts[cat] += 1;
  };

  for (const stone of upgradeStones) {
    const [a, b] = stone.picks;
    if (a === b) {
      warnings.push(
        `Upgrade stone "${stone.id}": duplicate category (${a}) on the same stone — only one pick counts.`
      );
      bump(a);
      continue;
    }
    bump(a);
    bump(b);
  }

  return counts;
}

function dedupeSharedSenses(groups: SharedSenseGroup[], warnings: string[]): SharedSenseGroup[] {
  const seen = new Set<SharedSenseGroup>();
  const out: SharedSenseGroup[] = [];
  for (const g of groups) {
    if (seen.has(g)) {
      warnings.push(`Shared sense "${g}" listed more than once — duplicate ignored.`);
      continue;
    }
    seen.add(g);
    out.push(g);
  }
  return out;
}

/** Read-only reference grid for the Summons tab (9 columns: base + 8 upgrades). */
export function getFamiliarProgressionTableRows(): { label: string; cells: string[] }[] {
  return [
    { label: 'HP', cells: [...FAMILIAR_HP_BY_TIER].map(String) },
    { label: 'Armor', cells: [...FAMILIAR_ARMOR_BY_TIER].map(String) },
    { label: 'Evade', cells: [...FAMILIAR_EVADE_BY_TIER].map(String) },
    { label: 'Attack', cells: [...FAMILIAR_ATTACK_DICE_BY_TIER].map((n) => `${n}d8`) },
    { label: 'Damage', cells: [...FAMILIAR_DAMAGE_DICE_BY_TIER].map((n) => `${n}d8`) },
    { label: 'Ground (m)', cells: [...FAMILIAR_GROUND_MOVEMENT_BY_TIER].map(String) },
    { label: 'Flying (m)', cells: [...FAMILIAR_FLYING_MOVEMENT_BY_TIER].map(String) }
  ];
}

export function buildFamiliarResult(input: FamiliarComputationInput): FamiliarResult {
  const warnings: string[] = [];
  const upgradeStones = input.upgradeStones.length;
  const sharedSenseStones = input.sharedSenses.length;
  const totalBoundStones = 1 + upgradeStones + sharedSenseStones;

  const expectedPicks = upgradeStones * 2;
  let rawPickSum = 0;
  for (const s of input.upgradeStones) {
    rawPickSum += s.picks[0] === s.picks[1] ? 1 : 2;
  }
  if (rawPickSum !== expectedPicks && upgradeStones > 0) {
    warnings.push(
      `Expected ${expectedPicks} effective upgrade picks for ${upgradeStones} upgrade stone(s); got ${rawPickSum} (duplicate categories on a stone reduce effective picks).`
    );
  }

  const agg = aggregateUpgradePicks(input.upgradeStones, warnings);
  const sharedSenses = dedupeSharedSenses([...input.sharedSenses], warnings);

  const hpUpgrades = agg.hp;
  const armorUpgrades = agg.armor;
  const evadeUpgrades = agg.evade;
  const attackUpgrades = agg.attack;
  const damageUpgrades = agg.damage;
  const movementUpgrades = agg.movement;

  const cap = Math.max(1, Math.floor(Number(input.masteryRank) || 1)) * 4;
  if (totalBoundStones > cap) {
    warnings.push(
      `Bound stones (${totalBoundStones}) exceed per-Familiar limit (Mastery Rank × 4 = ${cap}).`
    );
  }

  const hp = tierLookup(FAMILIAR_HP_BY_TIER, hpUpgrades, 'HP', warnings);
  const armor = tierLookup(FAMILIAR_ARMOR_BY_TIER, armorUpgrades, 'Armor', warnings);
  const evade = tierLookup(FAMILIAR_EVADE_BY_TIER, evadeUpgrades, 'Evade', warnings);
  const attackDice = tierLookup(FAMILIAR_ATTACK_DICE_BY_TIER, attackUpgrades, 'Attack', warnings);
  const damageDice = tierLookup(FAMILIAR_DAMAGE_DICE_BY_TIER, damageUpgrades, 'Damage', warnings);

  const moveTable =
    input.movementType === 'ground' ? FAMILIAR_GROUND_MOVEMENT_BY_TIER : FAMILIAR_FLYING_MOVEMENT_BY_TIER;
  const movementM = tierLookup(moveTable, movementUpgrades, 'Movement', warnings);

  const size = sizeFromHpUpgrades(hpUpgrades);
  if (hpUpgrades > 8) {
    warnings.push('HP upgrades exceed maximum track (8).');
  }

  return {
    familiarName: input.familiarName.trim() || '(unnamed)',
    movementType: input.movementType,
    totalBoundStones,
    upgradeStones,
    sharedSenseStones: sharedSenses.length,
    sharedSenses,
    hpUpgrades,
    armorUpgrades,
    evadeUpgrades,
    attackUpgrades,
    damageUpgrades,
    movementUpgrades,
    size,
    finalStats: {
      hp,
      armor,
      evade,
      attack: attackDamageString(attackDice),
      damage: attackDamageString(damageDice),
      movementM
    },
    validationWarnings: warnings
  };
}
