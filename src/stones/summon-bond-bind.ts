/**
 * Summon Bond create / release / stone accounting (V2).
 * Canonical workflow — do not use the legacy Familiar editor for creation.
 */

import type { BoundFamiliarRecord } from '../types/actor.js';
import { normalizeCreatureTypeValue } from '../utils/creature-type.js';
import {
  applySustainedDelta,
  getActorPoolSpendable,
} from './familiar-bind.js';
import {
  BASE_SUMMON,
  BOND_STATUS_LABEL,
  MAX_ARTIFACT_BONUS_TOKENS,
  classifyBondStatus,
  computeSummonBond,
  emptyBondSpend,
  isSummonSkillEligible,
  legacyMovementTypeToMode,
  normalizeMovementMode,
  summonSkillMinRating,
  summonSkillSlots,
  summonTokensFromStones,
  type BondValidityStatus,
  type SharedSenseGroup,
  type SummonBondUpgradeSpend,
  type SummonMovementMode,
  type SummonSkillId,
} from './summon-bond-rules.js';
import {
  inspectBondSpend,
  isIllegalBonusTokens,
  maxAssignableArtifactBonusTokens,
  safePurchaseInt,
  sanitizeBonusTokens,
  sanitizeSpendNumbers,
} from './summon-bond-spend.js';
import { evaluateSummonPower } from './summon-power-allowlist.js';

export const DISSOLVE_BOND_CONFIRM =
  'Dissolve this Summon Bond? Bound Stones return to the owner. Existing summon tokens will be removed. Body actors may be archived or deleted according to system settings.';

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
  /** Canonical creature-type key from CREATURE_TYPE_OPTIONS. */
  creatureType: string;
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
  if (!Array.isArray(raw)) return [];
  return (raw as SummonBondRecord[]).map((bond) => {
    const creatureType = normalizeCreatureTypeValue(bond.creatureType || bond.expression);
    return { ...bond, creatureType, expression: creatureType };
  });
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
  creatureType?: string;
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
    expression: normalizeCreatureTypeValue(opts.creatureType || opts.expression),
    creatureType: normalizeCreatureTypeValue(opts.creatureType || opts.expression),
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
  ownerMasteryRank = 1,
): string[] {
  const errors: string[] = [];
  const slots = summonSkillSlots(bond.boundStoneCount);
  if (bond.selectedSkills.length > slots) {
    errors.push(`Selected ${bond.selectedSkills.length} skills but only ${slots} slots (from Bound Stones).`);
  }
  const minRating = summonSkillMinRating(ownerMasteryRank);
  for (const skill of bond.selectedSkills || []) {
    const rating = Math.max(0, Math.floor(Number(ownerSkillRatings[skill]) || 0));
    if (!isSummonSkillEligible(rating, ownerMasteryRank)) {
      errors.push(`${skill}: Owner skill too low. Needs MR × 2.`);
    }
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
  bondSpent: number;
  skillsSpent: number;
  specialSpent: number;
  bodySpent: number[];
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
    bondSpent: computed.bondUpgradeTokens + computed.specialTokens,
    skillsSpent: computed.skillTokens,
    specialSpent: computed.specialTokens,
    bodySpent: computed.bodyTokens,
  };
}

export function bondStoneAssignments(bond: SummonBondRecord): Record<string, number> {
  const out: Record<string, number> = {};
  for (const attr of bond.stoneAttributes || []) {
    if (!attr) continue;
    out[attr] = (out[attr] ?? 0) + 1;
  }
  return out;
}

export function syncBodiesFromSpend(bond: SummonBondRecord): SummonBondRecord {
  const computed = computeSummonBond({
    boundStoneCount: bond.boundStoneCount,
    bonusTokens: bond.bonusTokens,
    movementMode: bond.movementMode,
    spend: bond.spend,
  });
  const existing = [...bond.bodies];
  const bodies: SummonBodyRecord[] = [];
  for (let i = 0; i < computed.bodyCount; i++) {
    const prev = existing[i];
    const cb = computed.bodies[i];
    const bodySpend = bond.spend.bodies[i];
    const powers = prev?.powers ?? [];
    bodies.push(
      createBaseBody({
        id: prev?.id,
        summonActorId: prev?.summonActorId,
        dormant: !!prev?.dormant,
        hp: prev?.dormant ? prev.hp : cb.hp,
        armor: cb.armor,
        evade: cb.evade,
        sharedSenses: cb.sharedSenses,
        powers,
        hpPurchases: bodySpend?.hpPurchases ?? 0,
        armorPurchases: bodySpend?.armorPurchases ?? 0,
        evadePurchases: bodySpend?.evadePurchases ?? 0,
      }),
    );
  }
  // Drop surplus body actors when body count shrinks (caller deletes actors).
  return {
    ...bond,
    movementM: computed.movementM,
    attackDice: computed.attackDice,
    damageDice: computed.damageDice,
    summonAttacks: computed.summonAttacks,
    specialValue: computed.specialValue,
    bodies,
  };
}

export type BondRitualValidation = {
  ok: boolean;
  errors: string[];
  warnings: string[];
  hardErrors: string[];
  overBudget: boolean;
  status: BondValidityStatus;
  statusLabel: string;
  computed: ReturnType<typeof computeSummonBond>;
};

export function validateBondPowers(
  bond: SummonBondRecord,
  ownerMasteryRank = 1,
): string[] {
  const errors: string[] = [];
  for (const body of bond.bodies || []) {
    for (const p of body.powers || []) {
      const ev = evaluateSummonPower(p.templateId, p.level, ownerMasteryRank);
      if (!ev.legal) {
        errors.push(`${body.id}: ${ev.name} L${p.level} — ${ev.reason}`);
      }
    }
  }
  return errors;
}

export function validateBondRitual(
  bond: SummonBondRecord,
  ownerSkillRatings: Record<string, number> = {},
  ownerMasteryRank = 1,
  extras?: { maxBonusTokens?: number },
): BondRitualValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!bond.name?.trim()) errors.push('Name is required.');
  if (bond.boundStoneCount < 1 || bond.stoneAttributes.length < 1) {
    errors.push('A Summon Bond requires at least 1 Bound Stone. Artifact bonus Tokens cannot create a Bond.');
  }
  if (bond.stoneAttributes.length !== bond.boundStoneCount) {
    errors.push('stoneAttributes length must equal boundStoneCount.');
  }
  const rawMode = String(bond.movementMode || '');
  if (/climb/i.test(rawMode)) {
    warnings.push('Legacy Climbing mode was collapsed to Walking.');
  }
  bond.movementMode = normalizeMovementMode(bond.movementMode);

  // Sync power token costs from allowlist evaluation (source of truth).
  for (let i = 0; i < bond.spend.bodies.length; i++) {
    const body = bond.bodies[i];
    if (!body) continue;
    const costs = (body.powers || []).map((p) => {
      const ev = evaluateSummonPower(p.templateId, p.level, ownerMasteryRank);
      p.tokenCost = ev.tokenCost;
      p.category = ev.category;
      return ev.tokenCost;
    });
    bond.spend.bodies[i] = { ...bond.spend.bodies[i], powerTokenCosts: costs };
  }

  const maxBonus = extras?.maxBonusTokens ?? MAX_ARTIFACT_BONUS_TOKENS;
  const inspect = inspectBondSpend(bond.spend, {
    boundStoneCount: bond.boundStoneCount,
    bonusTokens: bond.bonusTokens,
    movementMode: bond.movementMode,
    selectedSkills: bond.selectedSkills,
    ownerSkillRatings,
    ownerMasteryRank,
    maxBonusTokens: maxBonus,
    skillDiceAlloc: bond.skillDiceAlloc,
  });
  if (isIllegalBonusTokens(bond.bonusTokens, maxBonus, bond.boundStoneCount)) {
    errors.push('Artifact bonus Tokens are illegal (must be a multiple of 4 from Artifact Summon Stones, and cannot create a Bond).');
  }

  const computed = computeSummonBond({
    boundStoneCount: bond.boundStoneCount,
    bonusTokens: sanitizeBonusTokens(bond.bonusTokens, maxBonus),
    movementMode: bond.movementMode,
    spend: sanitizeSpendNumbers(bond.spend),
  });
  errors.push(...computed.errors);
  warnings.push(...computed.warnings);
  errors.push(...inspect.reasons);
  errors.push(...validateBondSkillAlloc(bond, ownerSkillRatings, ownerMasteryRank));
  errors.push(...validateBondPowers(bond, ownerMasteryRank));

  if (bond.spend.specialAccess && !bond.specialKey) {
    errors.push('Special Access requires selecting an eligible Special.');
  }
  if (bond.spend.specialAccess && computed.summonAttacks < 1) {
    errors.push('Special Access requires at least 1 Bond Attack Action.');
  }
  if (!bond.spend.specialAccess && bond.specialKey) {
    warnings.push('Special key set without Special Access — will be cleared on apply.');
  }

  const uniqueErrors = [...new Set(errors)];
  errors.length = 0;
  errors.push(...uniqueErrors);
  const budgetErrors = errors.filter((e) => /Spent \d+ Tokens/.test(e));
  const hardErrors = errors.filter((e) => !budgetErrors.includes(e));
  const overBudget = computed.tokensRemaining < 0 || budgetErrors.length > 0 || inspect.overBudget;
  const status = classifyBondStatus({
    hardErrors,
    overBudget,
    needsRedistribution: !!bond.needsRedistribution,
  });

  return {
    ok: hardErrors.length === 0 && !overBudget,
    errors,
    warnings,
    hardErrors,
    overBudget,
    status,
    statusLabel: BOND_STATUS_LABEL[status],
    computed,
  };
}

/** Create a new Summon Bond, debit Bound Stones from the owner's pool, clear legacy familiars. */
export async function createSummonBondWithStones(
  actor: any,
  opts: {
    name: string;
    img?: string;
    expression?: string;
    creatureType?: string;
    movementMode: SummonMovementMode;
    stoneAttributes: StonePoolAttr[];
    bonusTokens?: number;
    activationTiming?: 'before' | 'after';
  },
): Promise<{ bond: SummonBondRecord | null; errors: string[] }> {
  const attrs = (opts.stoneAttributes || []).filter((a) => STONE_POOL_ATTRS.includes(a));
  if (attrs.length < 1) return { bond: null, errors: ['Assign at least 1 Bound Stone.'] };
  if (!opts.name?.trim()) return { bond: null, errors: ['Name is required.'] };

  const need: Record<string, number> = {};
  for (const a of attrs) need[a] = (need[a] ?? 0) + 1;
  const spendable = getActorPoolSpendable(actor);
  for (const [attr, n] of Object.entries(need)) {
    if ((spendable[attr] ?? 0) < n) {
      return { bond: null, errors: [`Not enough ${attr} stones (need ${n}, have ${spendable[attr] ?? 0}).`] };
    }
  }

  let bond = createEmptyBond({
    name: opts.name,
    img: opts.img,
    ownerActorId: actor.id,
    movementMode: opts.movementMode,
    stoneAttributes: attrs,
    expression: opts.creatureType || opts.expression,
    creatureType: opts.creatureType || opts.expression,
  });
  // Artifact bonus Tokens cannot create a Bond and are ignored at create.
  bond.bonusTokens = 0;
  bond.activationTiming = opts.activationTiming ?? 'after';
  bond.needsRedistribution = true;
  bond = recomputeBondDerived(bond);

  const stonePools = applySustainedDelta(
    actor.system?.stonePools ?? {},
    need,
    1,
  );
  const bonds = [...getSummonBondsFromActor(actor), bond];
  await actor.update({
    'system.summonBonds': bonds,
    'system.stonePools': stonePools,
    'system.familiars': [],
  });
  return { bond, errors: [] };
}

/** Persist an edited bond list entry (no stone debit). */
export async function upsertSummonBond(actor: any, bond: SummonBondRecord): Promise<void> {
  const bonds = getSummonBondsFromActor(actor);
  const idx = bonds.findIndex((b) => b.id === bond.id);
  const next = recomputeBondDerived(bond);
  if (idx >= 0) bonds[idx] = next;
  else bonds.push(next);
  await persistSummonBonds(actor, bonds);
}

/**
 * Apply Bond Ritual: validate spend, sync bodies, clear needsRedistribution,
 * restore dormant bodies to full HP.
 */
export async function applyBondRitual(
  actor: any,
  bondDraft: SummonBondRecord,
  ownerSkillRatings: Record<string, number> = {},
): Promise<{ bond: SummonBondRecord | null; errors: string[]; warnings: string[] }> {
  const mr = Math.max(1, Math.floor(Number(actor?.system?.mastery?.rank) || 1));
  // Sync power token costs into spend before validate
  const draft = foundryDuplicate(bondDraft);
  const otherBonds = getSummonBondsFromActor(actor);
  const maxBonus = maxAssignableArtifactBonusTokens(actor, draft.id, otherBonds);
  draft.bonusTokens = sanitizeBonusTokens(draft.bonusTokens, maxBonus);
  draft.spend = sanitizeSpendNumbers(draft.spend);
  if (draft.boundStoneCount < 1) draft.bonusTokens = 0;
  for (let i = 0; i < draft.spend.bodies.length; i++) {
    const body = draft.bodies[i];
    if (!body) continue;
    draft.spend.bodies[i] = {
      ...draft.spend.bodies[i],
      powerTokenCosts: (body.powers || []).map((p) => safePurchaseInt(p.tokenCost)),
      sharedSenses: (body.sharedSenses || []) as SharedSenseGroup[],
      hpPurchases: safePurchaseInt(body.hpPurchases ?? draft.spend.bodies[i].hpPurchases),
      armorPurchases: safePurchaseInt(body.armorPurchases ?? draft.spend.bodies[i].armorPurchases),
      evadePurchases: safePurchaseInt(body.evadePurchases ?? draft.spend.bodies[i].evadePurchases),
    };
  }
  if (!draft.spend.specialAccess) {
    draft.specialKey = null;
    draft.spend.specialValuePurchases = 0;
  }
  const validation = validateBondRitual(draft, ownerSkillRatings, mr, { maxBonusTokens: maxBonus });
  const inspect = inspectBondSpend(draft.spend, {
    boundStoneCount: draft.boundStoneCount,
    bonusTokens: draft.bonusTokens,
    movementMode: draft.movementMode,
    selectedSkills: draft.selectedSkills,
    ownerSkillRatings,
    ownerMasteryRank: mr,
    maxBonusTokens: maxBonus,
    skillDiceAlloc: draft.skillDiceAlloc,
  });
  if (!validation.ok || inspect.illegal) {
    return {
      bond: null,
      errors: [...new Set([...validation.errors, ...inspect.reasons])],
      warnings: validation.warnings,
    };
  }

  let bond = syncBodiesFromSpend(draft);
  const computed = computeSummonBond({
    boundStoneCount: bond.boundStoneCount,
    bonusTokens: bond.bonusTokens,
    movementMode: bond.movementMode,
    spend: bond.spend,
  });
  // Bond Ritual / Safe Haven Rest restores dormant bodies at full HP.
  bond.bodies = bond.bodies.map((b, i) => ({
    ...b,
    dormant: false,
    hp: computed.bodies[i]?.hp ?? b.hp,
    armor: computed.bodies[i]?.armor ?? b.armor,
    evade: computed.bodies[i]?.evade ?? b.evade,
    sharedSenses: computed.bodies[i]?.sharedSenses ?? b.sharedSenses,
  }));
  bond.needsRedistribution = false;
  bond.locked = true;
  bond = recomputeBondDerived(bond);

  await upsertSummonBond(actor, bond);
  try {
    const { syncSummonBodyActorsFromBond } = await import('./familiar-actor-factory.js');
    await syncSummonBodyActorsFromBond(bond, actor);
  } catch (err) {
    console.warn('Mastery System | Bond Ritual actor sync failed', err);
  }
  return { bond, errors: [], warnings: validation.warnings };
}

function foundryDuplicate<T>(obj: T): T {
  try {
    return (globalThis as any).foundry?.utils?.duplicate?.(obj) ?? structuredClone(obj);
  } catch {
    return JSON.parse(JSON.stringify(obj)) as T;
  }
}

/** Add Bound Stones during a Bond Ritual (debits pool; marks needsRedistribution). */
export async function addBoundStonesToBond(
  actor: any,
  bondId: string,
  attributes: StonePoolAttr[],
): Promise<{ bond: SummonBondRecord | null; errors: string[] }> {
  const attrs = attributes.filter((a) => STONE_POOL_ATTRS.includes(a));
  if (!attrs.length) return { bond: null, errors: ['No stones selected.'] };
  const bonds = getSummonBondsFromActor(actor);
  const idx = bonds.findIndex((b) => b.id === bondId);
  if (idx < 0) return { bond: null, errors: ['Bond not found.'] };

  const need: Record<string, number> = {};
  for (const a of attrs) need[a] = (need[a] ?? 0) + 1;
  const spendable = getActorPoolSpendable(actor);
  for (const [attr, n] of Object.entries(need)) {
    if ((spendable[attr] ?? 0) < n) {
      return { bond: null, errors: [`Not enough ${attr} stones.`] };
    }
  }

  const bond = { ...bonds[idx] };
  bond.stoneAttributes = [...bond.stoneAttributes, ...attrs];
  bond.boundStoneCount = bond.stoneAttributes.length;
  bond.needsRedistribution = true;
  bonds[idx] = recomputeBondDerived(bond);

  const stonePools = applySustainedDelta(actor.system?.stonePools ?? {}, need, 1);
  await actor.update({
    'system.summonBonds': bonds,
    'system.stonePools': stonePools,
  });
  return { bond: bonds[idx], errors: [] };
}

/** Remove Bound Stones during a Bond Ritual (credits pool; may force redistrib). */
export async function removeBoundStonesFromBond(
  actor: any,
  bondId: string,
  indices: number[],
): Promise<{ bond: SummonBondRecord | null; errors: string[] }> {
  const bonds = getSummonBondsFromActor(actor);
  const idx = bonds.findIndex((b) => b.id === bondId);
  if (idx < 0) return { bond: null, errors: ['Bond not found.'] };
  const bond = { ...bonds[idx], stoneAttributes: [...bonds[idx].stoneAttributes] };
  const sorted = [...new Set(indices)].sort((a, b) => b - a);
  const returned: Record<string, number> = {};
  for (const i of sorted) {
    if (i < 0 || i >= bond.stoneAttributes.length) continue;
    const [attr] = bond.stoneAttributes.splice(i, 1);
    if (attr) returned[attr] = (returned[attr] ?? 0) + 1;
  }
  if (bond.stoneAttributes.length < 1) {
    return { bond: null, errors: ['A Bond must keep at least 1 Bound Stone (or dissolve it).'] };
  }
  bond.boundStoneCount = bond.stoneAttributes.length;
  bond.needsRedistribution = true;
  bonds[idx] = recomputeBondDerived(bond);
  const stonePools = applySustainedDelta(actor.system?.stonePools ?? {}, returned, -1);
  await actor.update({
    'system.summonBonds': bonds,
    'system.stonePools': stonePools,
  });
  return { bond: bonds[idx], errors: [] };
}

/** Set Artifact-generated bonus Tokens on a Bond (not Bound Stones). */
export async function setBondBonusTokens(
  actor: any,
  bondId: string,
  bonusTokens: number,
): Promise<SummonBondRecord | null> {
  const bonds = getSummonBondsFromActor(actor);
  const idx = bonds.findIndex((b) => b.id === bondId);
  if (idx < 0) return null;
  const maxBonus = maxAssignableArtifactBonusTokens(actor, bondId, bonds);
  let nextBonus = sanitizeBonusTokens(bonusTokens, maxBonus);
  if (bonds[idx].boundStoneCount < 1) nextBonus = 0;
  bonds[idx] = recomputeBondDerived({
    ...bonds[idx],
    bonusTokens: nextBonus,
    needsRedistribution: true,
  });
  await persistSummonBonds(actor, bonds);
  return bonds[idx];
}

/**
 * Dissolve / release a Summon Bond via Bond Ritual: return Bound Stones, delete body actors.
 */
export async function dissolveSummonBond(
  actor: any,
  bondId: string,
  deleteActors: (id: string | undefined) => Promise<void> = async () => {},
): Promise<{ removed: SummonBondRecord | null; errors: string[] }> {
  const bonds = getSummonBondsFromActor(actor);
  const idx = bonds.findIndex((b) => b.id === bondId);
  if (idx < 0) return { removed: null, errors: ['Bond not found.'] };
  const [removed] = bonds.splice(idx, 1);
  for (const body of removed.bodies || []) {
    await deleteActors(body.summonActorId);
  }
  const assignments = bondStoneAssignments(removed);
  const stonePools = applySustainedDelta(actor.system?.stonePools ?? {}, assignments, -1);
  await actor.update({
    'system.summonBonds': bonds,
    'system.stonePools': stonePools,
  });
  return { removed, errors: [] };
}

/** Owner skill ratings helper for ritual validation. */
export function ownerSkillRatingsFromActor(actor: any): Record<string, number> {
  const skills = actor?.system?.skills ?? {};
  const out: Record<string, number> = {};
  for (const [key, val] of Object.entries(skills)) {
    const rating =
      typeof val === 'number'
        ? val
        : Math.max(0, Math.floor(Number((val as any)?.rating ?? (val as any)?.value ?? 0) || 0));
    out[key] = rating;
  }
  return out;
}
