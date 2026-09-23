/**
 * Confirm the one-time v0.9.9 Attribute respec and Stone reassignment.
 * Pure validation so the dialog and tests share one rule.
 */

import {
  assignmentsAreLegal,
  ATTRIBUTE_KEYS,
  compressedAttributeXpBetween,
  emptyAssignments,
  permanentStonesFromLifetimeXp,
  readAssignments,
  startingPackageIsValid,
  type AttributeKeyName,
} from './v099-rules.js';
import { tallyStoneSlotOrder } from './v099-respec-flow.js';
import { V099_LIFETIME_FLAG, V099_RESPEC_FLAG } from './v099-migration.js';

export interface V099RespecInput {
  lifetimeXp?: number | null;
  starting: Record<string, number>;
  attributes: Record<string, number>;
  stones: Record<string, number>;
  permanentColorless?: number;
  stoneSlotOrder?: readonly (string | null)[] | null;
}

export interface V099RespecPlan {
  ok: boolean;
  reason?: string;
  lifetimeXp: number;
  permanentStones: number;
  spentAttributeXp: number;
  leftoverAttributeXp: number;
  permanentColorless: number;
  stoneSlotOrder: string[] | null;
  starting: Record<AttributeKeyName, number>;
  attributes: Record<AttributeKeyName, number>;
  stones: Record<AttributeKeyName, number>;
}

function nums(source: Record<string, number> | null | undefined): Record<AttributeKeyName, number> {
  const out = emptyAssignments();
  for (const key of ATTRIBUTE_KEYS) out[key] = Math.max(0, Math.floor(Number(source?.[key]) || 0));
  return out;
}

function flagOn(actor: any, key: string): boolean {
  try {
    if (actor?.getFlag?.('mastery-system', key) === true) return true;
  } catch {
    /* fall through */
  }
  return actor?.flags?.['mastery-system']?.[key] === true;
}

export function planV099Respec(actor: any, input: V099RespecInput): V099RespecPlan {
  const system = actor?.system ?? {};
  if (system?.progression?.v099Stones === true && !flagOn(actor, V099_RESPEC_FLAG)) {
    return fail('This character has already completed the v0.9.9 migration.');
  }
  const storedLife = system?.progression?.lifetimeXp;
  const needsLife = flagOn(actor, V099_LIFETIME_FLAG) || typeof storedLife !== 'number';
  let lifetime = typeof storedLife === 'number' ? Math.max(0, Math.floor(storedLife)) : null;
  if (needsLife) {
    if (typeof input.lifetimeXp !== 'number' || !Number.isFinite(input.lifetimeXp) || input.lifetimeXp < 0) {
      return fail('Enter Lifetime XP before confirming the migration.');
    }
    lifetime = Math.floor(input.lifetimeXp);
  }
  const life = lifetime ?? 0;
  const starting = nums(input.starting);
  if (!startingPackageIsValid(starting)) {
    return fail('Redistribute the starting package as 4, 4, 3, 3, 2, 2, 2.');
  }
  const attributes = nums(input.attributes);
  for (const key of ATTRIBUTE_KEYS) {
    if (attributes[key] < starting[key]) return fail(`${key} cannot drop below the starting package.`);
    if (attributes[key] > 40) return fail(`${key} cannot exceed 40.`);
  }
  const budget = Math.max(0, Math.floor(Number(system?.progression?.earnedAttributeXp) || 0));
  const spent = compressedAttributeXpBetween(starting, attributes);
  if (!Number.isFinite(spent)) return fail('Attribute increases must stay on the new cost table.');
  if (spent > budget) return fail(`Those Attributes cost ${spent} XP, but only ${budget} preserved Attribute XP is available.`);
  const permanent = permanentStonesFromLifetimeXp(life);
  const storedRank = Math.max(1, Math.floor(Number(system?.mastery?.rank) || 1));
  let stones = readAssignments({ progression: { stoneAssignments: input.stones } });
  let colorless = Math.max(0, Math.floor(Number(input.permanentColorless) || 0));
  let stoneSlotOrder: string[] | null = null;
  if (Array.isArray(input.stoneSlotOrder)) {
    if (input.stoneSlotOrder.length !== permanent) {
      return fail(`Assign exactly ${permanent} permanent Stones.`);
    }
    const tallied = tallyStoneSlotOrder(input.stoneSlotOrder);
    if (!tallied.ok) return fail(tallied.reason || 'Stone assignment is not legal.');
    stones = tallied.assignments;
    colorless = tallied.colorless;
    stoneSlotOrder = input.stoneSlotOrder.map((entry) => String(entry));
  }
  const legal = assignmentsAreLegal(stones, permanent, storedRank, colorless);
  if (!legal.ok) return fail(legal.reason || 'Stone assignment is not legal.');
  return {
    ok: true,
    lifetimeXp: life,
    permanentStones: permanent,
    spentAttributeXp: spent,
    leftoverAttributeXp: budget - spent,
    permanentColorless: colorless,
    stoneSlotOrder,
    starting,
    attributes,
    stones,
  };
}

function fail(reason: string): V099RespecPlan {
  return {
    ok: false,
    reason,
    lifetimeXp: 0,
    permanentStones: 0,
    spentAttributeXp: 0,
    leftoverAttributeXp: 0,
    permanentColorless: 0,
    stoneSlotOrder: null,
    starting: emptyAssignments(),
    attributes: emptyAssignments(),
    stones: emptyAssignments(),
  };
}

export function v099RespecUpdate(actor: any, plan: V099RespecPlan): Record<string, unknown> {
  const system = actor?.system ?? {};
  const updates: Record<string, unknown> = {
    'system.progression.v099Stones': true,
    'system.progression.v099Prepared': true,
    'system.progression.lifetimeXp': plan.lifetimeXp,
    'system.progression.lifetimeXpSource': system?.progression?.lifetimeXpSource || 'respec',
    'system.progression.earnedAttributeXp': Math.max(0, Math.floor(Number(system?.progression?.earnedAttributeXp) || 0)),
    'system.progression.rulesVersion': '0.9.9.0',
    [`flags.mastery-system.${V099_RESPEC_FLAG}`]: false,
    [`flags.mastery-system.${V099_LIFETIME_FLAG}`]: false,
    'flags.mastery-system.schemaVersion': '0.9.9.0',
  };
  for (const key of ATTRIBUTE_KEYS) {
    updates[`system.attributes.${key}.value`] = plan.attributes[key];
    updates[`system.progression.stoneAssignments.${key}`] = plan.stones[key];
    updates[`system.stonePools.${key}.max`] = plan.stones[key];
    updates[`system.stonePools.${key}.current`] = plan.stones[key];
    updates[`system.stonePools.${key}.sustained`] = 0;
    updates[`system.stonePools.${key}.sealed`] = 0;
    updates[`system.stonePools.${key}.burned`] = 0;
  }
  const colorless = Math.max(0, Math.floor(Number(plan.permanentColorless) || 0));
  updates['system.progression.permanentColorless'] = colorless;
  updates['system.stonePools.colorless.max'] = colorless;
  updates['system.stonePools.colorless.current'] = colorless;
  if (plan.stoneSlotOrder) {
    updates['system.progression.stoneSlotOrder'] = plan.stoneSlotOrder;
  }
  const leftover = plan.leftoverAttributeXp;
  if (leftover > 0) {
    const available = Math.max(0, Math.floor(Number(system?.points?.xp) || 0));
    const spent = Math.max(0, Math.floor(Number(system?.xp?.totalSpent) || 0));
    updates['system.points.xp'] = available + leftover;
    updates['system.xp.totalSpent'] = Math.max(0, spent - leftover);
  }
  return updates;
}
