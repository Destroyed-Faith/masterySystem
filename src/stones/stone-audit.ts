/**
 * GM stone audit: Lifetime track vs live pools vs Summon/Familiar holds.
 * Same sources Stone Powers uses (effective assignments + resolved caps).
 */

import { ATTRIBUTE_KEYS, ATTRIBUTE_ABBREV, type AttributeKeyName } from '../progression/v099-rules.js';
import {
  buildStoneProgressionSlots,
  effectiveStoneAssignments,
  permanentColorlessCount,
  permanentStonesFromLifetimeXp,
} from '../progression/v099-rules.js';
import { lifetimeXpForActor } from '../progression/build-value.js';
import { resolveActorStoneSystem, stonePoolReadyMax } from './stone-pool-sync.js';
import { bondStoneAssignments, getSummonBondsFromActor } from './summon-bond-bind.js';
import { familiarStoneAssignments, getFamiliarsFromActor } from './familiar-bind.js';

const POOL_ATTRS = [...ATTRIBUTE_KEYS, 'colorless'] as const;

export interface StoneAuditBondRow {
  kind: 'summon' | 'familiar';
  name: string;
  stones: number;
  byAttr: string;
}

export interface StoneAuditSlotRow {
  index: number;
  label: string;
  unlocked: boolean;
  attribute: string | null;
  abbrev: string;
}

export interface StoneAuditPoolRow {
  key: string;
  name: string;
  assigned: number;
  max: number;
  current: number;
  sealed: number;
  burned: number;
  sustained: number;
  summonBound: number;
  readyExpected: number;
  mismatch: boolean;
  notes: string;
}

export interface StoneAuditReport {
  actorName: string;
  lifetimeXp: number;
  permanentStones: number;
  permanentColorless: number;
  assignedTotal: number;
  unassigned: number;
  slots: StoneAuditSlotRow[];
  pools: StoneAuditPoolRow[];
  bonds: StoneAuditBondRow[];
  hasMismatch: boolean;
}

function poolLabel(key: string): string {
  if (key === 'colorless') return 'Colorless';
  return key.charAt(0).toUpperCase() + key.slice(1);
}

/** Sustained counts that Summon Bonds / Familiars currently hold. */
export function summonBoundSustainedByAttr(actor: any): Record<string, number> {
  const out: Record<string, number> = {};
  const bump = (attr: string, n: number) => {
    if (!attr || n <= 0) return;
    out[attr] = (out[attr] ?? 0) + n;
  };
  try {
    for (const bond of getSummonBondsFromActor(actor)) {
      for (const [attr, n] of Object.entries(bondStoneAssignments(bond))) {
        bump(attr, Math.max(0, Math.floor(Number(n) || 0)));
      }
    }
  } catch {
    /* optional */
  }
  try {
    for (const fam of getFamiliarsFromActor(actor)) {
      for (const [attr, n] of Object.entries(familiarStoneAssignments(fam))) {
        bump(attr, Math.max(0, Math.floor(Number(n) || 0)));
      }
    }
  } catch {
    /* optional */
  }
  return out;
}

export function listStoneAuditBonds(actor: any): StoneAuditBondRow[] {
  const rows: StoneAuditBondRow[] = [];
  try {
    for (const bond of getSummonBondsFromActor(actor)) {
      const assigns = bondStoneAssignments(bond);
      const stones = Object.values(assigns).reduce((s, n) => s + n, 0);
      rows.push({
        kind: 'summon',
        name: String(bond.name || bond.id || 'Summon Bond'),
        stones,
        byAttr: Object.entries(assigns)
          .filter(([, n]) => n > 0)
          .map(([a, n]) => `${ATTRIBUTE_ABBREV[a as AttributeKeyName] ?? a}×${n}`)
          .join(', '),
      });
    }
  } catch {
    /* optional */
  }
  try {
    for (const fam of getFamiliarsFromActor(actor)) {
      const assigns = familiarStoneAssignments(fam);
      const stones = Object.values(assigns).reduce((s, n) => s + n, 0);
      rows.push({
        kind: 'familiar',
        name: String(fam.name || fam.id || 'Familiar'),
        stones,
        byAttr: Object.entries(assigns)
          .filter(([, n]) => n > 0)
          .map(([a, n]) => `${ATTRIBUTE_ABBREV[a as AttributeKeyName] ?? a}×${n}`)
          .join(', '),
      });
    }
  } catch {
    /* optional */
  }
  return rows;
}

/** Full audit snapshot — same math as Stone Powers caps. */
export function buildStoneAuditReport(actor: any): StoneAuditReport {
  const stoneSystem = resolveActorStoneSystem(actor);
  const lifetimeXp = Math.max(0, Math.floor(Number(lifetimeXpForActor(actor)) || 0));
  const permanentStones = permanentStonesFromLifetimeXp(lifetimeXp);
  const colorless = permanentColorlessCount(stoneSystem);
  const assignments = effectiveStoneAssignments(stoneSystem);
  const assignedTotal = ATTRIBUTE_KEYS.reduce((s, k) => s + (assignments[k] || 0), 0);
  const slotOrder = Array.isArray(stoneSystem?.progression?.stoneSlotOrder)
    ? stoneSystem.progression.stoneSlotOrder
    : null;
  const slots = buildStoneProgressionSlots(
    lifetimeXp,
    assignments,
    undefined,
    colorless,
    slotOrder,
    'visible',
  ).map((s) => ({
    index: s.index,
    label: s.label,
    unlocked: s.unlocked,
    attribute: s.attribute,
    abbrev: s.abbrev,
  }));

  const summonBound = summonBoundSustainedByAttr(actor);
  const livePools = actor?.system?.stonePools ?? {};
  const pools: StoneAuditPoolRow[] = [];
  let hasMismatch = false;

  for (const key of POOL_ATTRS) {
    if (key === 'colorless' && colorless <= 0 && !livePools.colorless) continue;
    const pool = livePools[key] ?? {};
    const assigned =
      key === 'colorless'
        ? colorless
        : Math.max(0, Math.floor(Number((assignments as any)[key]) || 0));
    const max = stonePoolReadyMax(stoneSystem, key, pool);
    const current = Math.max(0, Math.floor(Number(pool.current) || 0));
    const sealed = Math.max(0, Math.floor(Number(pool.sealed) || 0));
    const burned = Math.max(0, Math.floor(Number(pool.burned) || 0));
    const sustained = Math.max(0, Math.floor(Number(pool.sustained) || 0));
    const bound = key === 'colorless' ? 0 : Math.max(0, summonBound[key] ?? 0);
    const readyExpected = Math.max(0, max - sealed - burned - Math.max(sustained, bound));
    const notes: string[] = [];
    if (max !== assigned && key !== 'colorless') {
      notes.push(`max ${max} ≠ track ${assigned}`);
    }
    if (bound > 0 && sustained < bound) {
      notes.push(`Summon/Familiar hold ${bound}, sustained only ${sustained}`);
    }
    if (bound > 0 && sustained > bound) {
      notes.push(`sustained ${sustained} > Summon hold ${bound}`);
    }
    if (current > readyExpected + 0) {
      notes.push(`Ready ${current} > expected ${readyExpected}`);
    }
    if (assigned > 0 && max === 0) {
      notes.push('track has stones but pool max is 0');
    }
    const mismatch = notes.length > 0;
    if (mismatch) hasMismatch = true;
    pools.push({
      key,
      name: poolLabel(key),
      assigned,
      max,
      current,
      sealed,
      burned,
      sustained,
      summonBound: bound,
      readyExpected,
      mismatch,
      notes: notes.join('; '),
    });
  }

  return {
    actorName: String(actor?.name || 'Character'),
    lifetimeXp,
    permanentStones,
    permanentColorless: colorless,
    assignedTotal,
    unassigned: Math.max(0, permanentStones - assignedTotal - 2 * colorless),
    slots,
    pools,
    bonds: listStoneAuditBonds(actor),
    hasMismatch,
  };
}
