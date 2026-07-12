/**
 * Collect Combat Senses granted to an actor and resolve the active Sense Slot.
 */

import type { CombatSenseId } from './combat-senses.js';
import {
  COMBAT_SENSES,
  parseCombatSenseLabel,
  SENSE_SLOT_SPECIAL_IDS,
} from './combat-senses.js';
import { getArtifactBindingKind } from '../utils/artifact-actor-rules.js';
import type { ArtifactBaseValue } from '../types/item.js';

export interface CombatSensesData {
  /** Active sense in the Sense Slot (default Normal Combat Awareness). */
  activeSenseId: CombatSenseId;
  /** Special senses granted by Echo / Artifact / Heightened Senses picks. */
  grantedSenseIds: CombatSenseId[];
  /** Additional special senses slotted as normal Passives. */
  passiveSenseIds: CombatSenseId[];
  /** Minor upgrade — augments Normal Awareness in darkness. */
  hasDarkvision?: boolean;
}

export const DEFAULT_COMBAT_SENSES: CombatSensesData = {
  activeSenseId: 'normalCombatAwareness',
  grantedSenseIds: [],
  passiveSenseIds: [],
  hasDarkvision: false,
};

function normalizeSenseId(raw: unknown): CombatSenseId | null {
  if (typeof raw !== 'string') return null;
  const id = raw.trim() as CombatSenseId;
  return COMBAT_SENSES[id] ? id : parseCombatSenseLabel(raw);
}

function uniqueSenseIds(ids: CombatSenseId[]): CombatSenseId[] {
  const out: CombatSenseId[] = [];
  for (const id of ids) {
    if (!out.includes(id)) out.push(id);
  }
  return out;
}

export function normalizeCombatSensesData(raw: unknown): CombatSensesData {
  const src = (raw && typeof raw === 'object' ? raw : {}) as Partial<CombatSensesData>;
  const active =
    normalizeSenseId(src.activeSenseId) ??
    (SENSE_SLOT_SPECIAL_IDS.includes(src.activeSenseId as CombatSenseId)
      ? (src.activeSenseId as CombatSenseId)
      : 'normalCombatAwareness');
  const slotId = SENSE_SLOT_SPECIAL_IDS.includes(active) ? active : 'normalCombatAwareness';
  const granted = uniqueSenseIds(
    (Array.isArray(src.grantedSenseIds) ? src.grantedSenseIds : [])
      .map((x) => normalizeSenseId(x))
      .filter((x): x is CombatSenseId => !!x && SENSE_SLOT_SPECIAL_IDS.includes(x)),
  );
  const passive = uniqueSenseIds(
    (Array.isArray(src.passiveSenseIds) ? src.passiveSenseIds : [])
      .map((x) => normalizeSenseId(x))
      .filter((x): x is CombatSenseId => !!x && SENSE_SLOT_SPECIAL_IDS.includes(x)),
  );
  return {
    activeSenseId: slotId,
    grantedSenseIds: granted,
    passiveSenseIds: passive,
    hasDarkvision: !!src.hasDarkvision,
  };
}

function artifactIsEquipped(item: any): boolean {
  const sys = item?.system ?? {};
  if (sys.equipped === true) return true;
  const binding = getArtifactBindingKind(item);
  if (binding === 'echo') return true;
  const eq = item?.flags?.['mastery-system']?.equipment;
  return !!(eq && typeof eq === 'object' && (eq as any).slot);
}

function sensesFromArtifactBaseValues(item: any): CombatSenseId[] {
  const out: CombatSenseId[] = [];
  const bvs: ArtifactBaseValue[] = Array.isArray(item?.system?.baseValues) ? item.system.baseValues : [];
  for (const bv of bvs) {
    if (bv.type !== 'sense') continue;
    const val = String(bv.value ?? bv.label ?? '').trim();
    const id = parseCombatSenseLabel(val) ?? parseCombatSenseLabel(bv.label);
    if (id && SENSE_SLOT_SPECIAL_IDS.includes(id)) out.push(id);
  }
  return out;
}

/** Scan equipped artifacts / flags for granted special senses. */
export function collectGrantedCombatSenses(actor: any): CombatSenseId[] {
  const data = normalizeCombatSensesData(actor?.system?.combatSenses);
  const out: CombatSenseId[] = [...data.grantedSenseIds];

  try {
    for (const item of actor?.items ?? []) {
      if (item?.type !== 'artifact') continue;
      if (!artifactIsEquipped(item)) continue;
      out.push(...sensesFromArtifactBaseValues(item));
    }
  } catch {
    /* ignore */
  }

  const flagRaw = actor?.getFlag?.('mastery-system', 'grantedCombatSenses');
  if (Array.isArray(flagRaw)) {
    for (const entry of flagRaw) {
      const id = normalizeSenseId(entry);
      if (id && SENSE_SLOT_SPECIAL_IDS.includes(id)) out.push(id);
    }
  }

  return uniqueSenseIds(out);
}

function senseIsAvailableToActor(
  senseId: CombatSenseId,
  granted: CombatSenseId[],
  data: CombatSensesData,
): boolean {
  return (
    granted.includes(senseId) ||
    data.grantedSenseIds.includes(senseId) ||
    data.passiveSenseIds.includes(senseId)
  );
}

/** All senses the actor may use (for targeting / perception). */
export function listActorCombatSenses(actor: any): CombatSenseId[] {
  const data = normalizeCombatSensesData(actor?.system?.combatSenses);
  const granted = collectGrantedCombatSenses(actor);
  const out: CombatSenseId[] = ['normalCombatAwareness'];
  if (data.hasDarkvision) out.push('darkvision');
  if (
    SENSE_SLOT_SPECIAL_IDS.includes(data.activeSenseId) &&
    senseIsAvailableToActor(data.activeSenseId, granted, data)
  ) {
    out.push(data.activeSenseId);
  }
  for (const id of data.passiveSenseIds) {
    if (SENSE_SLOT_SPECIAL_IDS.includes(id) && senseIsAvailableToActor(id, granted, data)) {
      out.push(id);
    }
  }
  return uniqueSenseIds(out);
}

export interface CombatSensesPanelRow {
  id: CombatSenseId;
  label: string;
  rangeM: number;
  selected: boolean;
}

export interface CombatSensesPanelContext {
  activeSenseId: CombatSenseId;
  hasDarkvision: boolean;
  slotOptions: Array<{ id: CombatSenseId; label: string }>;
  grantedRows: CombatSensesPanelRow[];
  passiveRows: CombatSensesPanelRow[];
  activeSenseLabel: string;
}

/** Character sheet context for Sense Slot + granted sense picks. */
export function buildCombatSensesPanelContext(actor: any): CombatSensesPanelContext {
  const data = normalizeCombatSensesData(actor?.system?.combatSenses);
  const artifactGranted = collectGrantedCombatSenses(actor);
  const allGranted = uniqueSenseIds([...data.grantedSenseIds, ...artifactGranted]);

  const slotOptions: Array<{ id: CombatSenseId; label: string }> = [
    { id: 'normalCombatAwareness', label: COMBAT_SENSES.normalCombatAwareness.label },
  ];
  for (const id of SENSE_SLOT_SPECIAL_IDS) {
    if (senseIsAvailableToActor(id, artifactGranted, data)) {
      slotOptions.push({ id, label: COMBAT_SENSES[id].label });
    }
  }

  const grantedRows: CombatSensesPanelRow[] = SENSE_SLOT_SPECIAL_IDS.map((id) => ({
    id,
    label: COMBAT_SENSES[id].label,
    rangeM: COMBAT_SENSES[id].rangeM,
    selected: allGranted.includes(id),
  }));

  const passiveRows = grantedRows.filter((r) => data.passiveSenseIds.includes(r.id));

  return {
    activeSenseId: getActiveCombatSense(actor),
    hasDarkvision: !!data.hasDarkvision,
    slotOptions,
    grantedRows,
    passiveRows,
    activeSenseLabel: COMBAT_SENSES[getActiveCombatSense(actor)].label,
  };
}

/** Primary active sense for sense-based rules (Sense Slot contents). */
export function getActiveCombatSense(actor: any): CombatSenseId {
  const data = normalizeCombatSensesData(actor?.system?.combatSenses);
  const granted = collectGrantedCombatSenses(actor);
  if (
    SENSE_SLOT_SPECIAL_IDS.includes(data.activeSenseId) &&
    senseIsAvailableToActor(data.activeSenseId, granted, data)
  ) {
    return data.activeSenseId;
  }
  return 'normalCombatAwareness';
}

export function isNonSightCombatSense(senseId: CombatSenseId): boolean {
  return senseId !== 'normalCombatAwareness' && senseId !== 'darkvision';
}
