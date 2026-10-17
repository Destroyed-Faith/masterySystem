/**
 * GM stone audit: Lifetime track vs live pools vs Summon/Familiar holds.
 * Ready numbers come from `stone-ready.ts` (same source as Stone Powers Available).
 */

import { ATTRIBUTE_KEYS, ATTRIBUTE_ABBREV, type AttributeKeyName } from '../progression/v099-rules.js';
import {
  buildStoneProgressionSlots,
  effectiveStoneAssignments,
  permanentColorlessCount,
  permanentStonesFromLifetimeXp,
} from '../progression/v099-rules.js';
import { lifetimeXpForActor } from '../progression/build-value.js';
import { resolveActorStoneSystem } from './stone-pool-sync.js';
import { bondStoneAssignments, getSummonBondsFromActor } from './summon-bond-bind.js';
import { familiarStoneAssignments, getFamiliarsFromActor } from './familiar-bind.js';
import {
  getAttrStoneReadyView,
  summonBoundSustainedByAttr,
} from './stone-ready.js';

export { summonBoundSustainedByAttr } from './stone-ready.js';

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

/** Full audit snapshot — Ready column uses the same math as Stone Powers Available. */
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

  const livePools = actor?.system?.stonePools ?? {};
  const pools: StoneAuditPoolRow[] = [];
  let hasMismatch = false;

  for (const key of POOL_ATTRS) {
    if (key === 'colorless' && colorless <= 0 && !livePools.colorless) continue;
    const view = getAttrStoneReadyView(actor, key);
    const notes: string[] = [];
    if (view.max !== view.assigned && key !== 'colorless') {
      notes.push(`max ${view.max} ≠ track ${view.assigned}`);
    }
    if (view.summonBound > 0 && view.sustained < view.summonBound) {
      notes.push(`Summon/Familiar hold ${view.summonBound}, sustained only ${view.sustained}`);
    }
    if (view.summonBound > 0 && view.sustained > view.summonBound) {
      notes.push(`sustained ${view.sustained} > Summon hold ${view.summonBound}`);
    }
    if (view.current > view.readyExpected + 0) {
      notes.push(`Ready ${view.current} > expected ${view.readyExpected}`);
    }
    if (view.assigned > 0 && view.max === 0) {
      notes.push('track has stones but pool max is 0');
    }
    const mismatch = notes.length > 0;
    if (mismatch) hasMismatch = true;
    pools.push({
      key,
      name: poolLabel(key),
      assigned: view.assigned,
      max: view.max,
      current: view.current,
      sealed: view.sealed,
      burned: view.burned,
      sustained: view.sustained,
      summonBound: view.summonBound,
      readyExpected: view.readyExpected,
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
    unassigned: Math.max(0, permanentStones - assignedTotal - colorless),
    slots,
    pools,
    bonds: listStoneAuditBonds(actor),
    hasMismatch,
  };
}
