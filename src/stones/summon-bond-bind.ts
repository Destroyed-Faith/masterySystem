/**
 * Summon Bond create / release / stone accounting (V2).
 */

import type { BoundFamiliarRecord } from '../types/actor.js';
import {
  BASE_SUMMON,
  computeSummonBond,
  emptyBondSpend,
  legacyMovementTypeToMode,
  summonSkillSlots,
  summonTokensFromStones,
  type SharedSenseGroup,
  type SummonBondUpgradeSpend,
  type SummonMovementMode,
  type SummonSkillId,
} from './summon-bond-rules.js';

export type StonePoolAttr =
  | 'might'
  | 'agility'
  | 'vitality'
  | 'intellect'
  | 'resolve'
  | 'influence'
  | 'wits';

export const STONE_POOL_ATTRS: StonePoolAttr[] = [
  'might',
  'agility',
  'vitality',
  'intellect',
  'resolve',
  'influence',
  'wits',
];

export type SummonPowerRef = {
  templateId: string;
  level: number;
  tokenCost: number;
  category?: string;
};

export type SummonBodyRecord = {
  id: string;
  hp: number;
  armor: number;
  evade: number;
  sharedSenses: SharedSenseGroup[];
  powers: SummonPowerRef[];
  dormant: boolean;
  summonActorId?: string;
  /** Purchases used to rebuild spend. */
  hpPurchases?: number;
  armorPurchases?: number;
  evadePurchases?: number;
};

export type SummonBondRecord = {
  id: string;
  name: string;
  img: string;
  expression: string;
  ownerActorId: string;
  boundStoneCount: number;
  /** Attribute keys used for each bound stone (length === boundStoneCount). */
  stoneAttributes: StonePoolAttr[];
  bonusTokens: number;
  movementMode: SummonMovementMode;
  movementM: number;
  attackDice: number;
  damageDice: number;
  summonAttacks: number;
  specialKey?: string | null;
  specialValue: number;
  selectedSkills: SummonSkillId[];
  skillDiceAlloc: Partial<Record<SummonSkillId, number>>;
  spend: SummonBondUpgradeSpend;
  bodies: SummonBodyRecord[];
  activationTiming: 'before' | 'after';
  needsRedistribution: boolean;
  locked: boolean;
};

export function getSummonBondsFromActor(actor: any): SummonBondRecord[] {
  const raw = actor?.system?.summonBonds;
  return Array.isArray(raw) ? (raw as SummonBondRecord[]) : [];
}

export function getFamiliarsFromActor(actor: any): BoundFamiliarRecord[] {
  const raw = actor?.system?.familiars;
  return Array.isArray(raw) ? (raw as BoundFamiliarRecord[]) : [];
}

function newId(prefix: string): string {
  try {
    return `${prefix}-${(globalThis as any).foundry?.utils?.randomID?.() ?? Math.random().toString(36).slice(2, 10)}`;
  } catch {
    return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
  }
}

export function createBaseBody(partial?: Partial<SummonBodyRecord>): SummonBodyRecord {
  return {
    id: partial?.id || newId('body'),
    hp: BASE_SUMMON.hp,
    armor: BASE_SUMMON.armor,
    evade: BASE_SUMMON.evade,
    sharedSenses: [],
    powers: [],
    dormant: false,
    summonActorId: partial?.summonActorId,
    hpPurchases: 0,
    armorPurchases: 0,
    evadePurchases: 0,
    ...partial,
  };
}

export function createEmptyBond(opts: {
  name: string;
  img?: string;
  ownerActorId: string;
  movementMode: SummonMovementMode;
  stoneAttributes: StonePoolAttr[];
  expression?: string;
}): SummonBondRecord {
  const stones = Math.max(1, opts.stoneAttributes.length);
  const spend = emptyBondSpend(1);
  const computed = computeSummonBond({
    boundStoneCount: stones,
    bonusTokens: 0,
    movementMode: opts.movementMode,
    spend,
  });
  const body = createBaseBody();
  return {
    id: newId('bond'),
    name: opts.name.trim() || 'Summon',
    img: opts.img || '',
    expression: opts.expression || '',
    ownerActorId: opts.ownerActorId,
    boundStoneCount: stones,
    stoneAttributes: opts.stoneAttributes.slice(0, stones),
    bonusTokens: 0,
    movementMode: opts.movementMode,
    movementM: computed.movementM,
    attackDice: computed.attackDice,
    damageDice: computed.damageDice,
    summonAttacks: computed.summonAttacks,
    specialKey: null,
    specialValue: 0,
    selectedSkills: [],
    skillDiceAlloc: {},
    spend,
    bodies: [body],
    activationTiming: 'after',
    needsRedistribution: true,
    locked: false,
  };
}

/** Migrate a V1 familiar record into a V2 bond stub (tokens unspent for redistribution). */
export function migrateFamiliarToBond(familiar: BoundFamiliarRecord, ownerActorId: string): SummonBondRecord {
  const stones = Math.max(1, Math.floor(Number(familiar.boundStoneCount) || 1));
  const attrs: StonePoolAttr[] = [];
  const baseAttr = (familiar.baseStone?.attribute || 'vitality') as StonePoolAttr;
  attrs.push(STONE_POOL_ATTRS.includes(baseAttr) ? baseAttr : 'vitality');
  for (const u of familiar.upgradeStones || []) {
    const a = (u.attribute || 'vitality') as StonePoolAttr;
    attrs.push(STONE_POOL_ATTRS.includes(a) ? a : 'vitality');
  }
  // Pad / trim to stones count
  while (attrs.length < stones) attrs.push('vitality');
  const stoneAttributes = attrs.slice(0, stones);

  const mode = legacyMovementTypeToMode(familiar.movementType);
  const bond = createEmptyBond({
    name: familiar.name || 'Summon',
    img: familiar.img || '',
    ownerActorId: ownerActorId || familiar.ownerActorId || '',
    movementMode: mode,
    stoneAttributes,
  });
  bond.id = familiar.id || bond.id;
  if (familiar.summonActorId) {
    bond.bodies[0].summonActorId = familiar.summonActorId;
  }
  bond.needsRedistribution = true;
  bond.locked = !!familiar.locked;
  return bond;
}

export function recomputeBondDerived(bond: SummonBondRecord): SummonBondRecord {
  const computed = computeSummonBond({
    boundStoneCount: bond.boundStoneCount,
    bonusTokens: bond.bonusTokens,
    movementMode: bond.movementMode,
    spend: bond.spend,
  });
  const bodies = bond.bodies.map((b, i) => {
    const cb = computed.bodies[i];
    if (!cb) return b;
    return {
      ...b,
      hp: b.dormant ? b.hp : cb.hp,
      armor: cb.armor,
      evade: cb.evade,
      sharedSenses: cb.sharedSenses,
    };
  });
  // Ensure body count matches spend
  while (bodies.length < computed.bodyCount) {
    bodies.push(createBaseBody());
  }
  return {
    ...bond,
    movementM: computed.movementM,
    attackDice: computed.attackDice,
    damageDice: computed.damageDice,
    summonAttacks: computed.summonAttacks,
    specialValue: computed.specialValue,
    bodies: bodies.slice(0, Math.max(computed.bodyCount, bodies.length)),
  };
}

export function validateBondSkillAlloc(
  bond: SummonBondRecord,
  ownerSkillRatings: Record<string, number>,
): string[] {
  const errors: string[] = [];
  const slots = summonSkillSlots(bond.boundStoneCount);
  if (bond.selectedSkills.length > slots) {
    errors.push(`Selected ${bond.selectedSkills.length} skills but only ${slots} slots (from Bound Stones).`);
  }
  let diceSum = 0;
  for (const [skill, dice] of Object.entries(bond.skillDiceAlloc || {})) {
    const d = Math.max(0, Math.floor(Number(dice) || 0));
    diceSum += d;
    const rating = Math.max(0, Math.floor(Number(ownerSkillRatings[skill]) || 0));
    if (d > 0 && rating <= 0) {
      errors.push(`Cannot assign dice to ${skill}: owner Rating is 0.`);
    } else if (d > rating) {
      errors.push(`${skill}: ${d} dice exceed owner Rating ${rating}.`);
    }
  }
  const computed = computeSummonBond({
    boundStoneCount: bond.boundStoneCount,
    bonusTokens: bond.bonusTokens,
    movementMode: bond.movementMode,
    spend: bond.spend,
  });
  if (diceSum > computed.skillDiceTotal) {
    errors.push(`Allocated ${diceSum} skill dice but only ${computed.skillDiceTotal} purchased.`);
  }
  return errors;
}

export async function persistSummonBonds(actor: any, bonds: SummonBondRecord[]): Promise<void> {
  await actor.update({ 'system.summonBonds': bonds });
}

export async function bindSummonBond(actor: any, bond: SummonBondRecord): Promise<SummonBondRecord | null> {
  const bonds = [...getSummonBondsFromActor(actor), recomputeBondDerived(bond)];
  // Stone pool debit is handled by caller (stone-powers-dialog) via attribute stones.
  await persistSummonBonds(actor, bonds);
  return bonds[bonds.length - 1] || null;
}

export async function releaseSummonBond(actor: any, bondId: string): Promise<SummonBondRecord | null> {
  const bonds = getSummonBondsFromActor(actor);
  const idx = bonds.findIndex((b) => b.id === bondId);
  if (idx < 0) return null;
  const [removed] = bonds.splice(idx, 1);
  await persistSummonBonds(actor, bonds);
  return removed;
}

export function tokensSummary(bond: SummonBondRecord): {
  available: number;
  spent: number;
  remaining: number;
  skillSlots: number;
} {
  const computed = computeSummonBond({
    boundStoneCount: bond.boundStoneCount,
    bonusTokens: bond.bonusTokens,
    movementMode: bond.movementMode,
    spend: bond.spend,
  });
  return {
    available: summonTokensFromStones(bond.boundStoneCount, bond.bonusTokens),
    spent: computed.tokensSpent,
    remaining: computed.tokensRemaining,
    skillSlots: summonSkillSlots(bond.boundStoneCount),
  };
}
