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
  /** Checked in UI (manual grant and/or equipped artifact). */
  selected: boolean;
  /** Granted by equipped artifact — display only, not stored on actor.combatSenses.grantedSenseIds. */
  fromArtifact: boolean;
}

export interface CombatSensesPanelContext {
  activeSenseId: CombatSenseId;
  hasDarkvision: boolean;
  slotOptions: Array<{ id: CombatSenseId; label: string }>;
  grantedRows: CombatSensesPanelRow[];
  passiveRows: CombatSensesPanelRow[];
  activeSenseLabel: string;
}

export interface CombatSenseBattleRow {
  id: CombatSenseId;
  label: string;
  rangeM: number;
  summary: string;
  channels: string;
  isActive: boolean;
  /** May be placed in the Sense Slot this combat. */
  isSlotChoice: boolean;
  /** Character has access (granted via sheet, artifact, or always-on default). */
  isGranted: boolean;
  fromArtifact: boolean;
}

export interface CombatSensesBattleAreaContext {
  instruction: string;
  pickOneHint: string;
  activeSenseId: CombatSenseId;
  activeSenseLabel: string;
  hasDarkvision: boolean;
  /** Every sense listed with availability; slot-eligible rows are selectable. */
  senseRows: CombatSenseBattleRow[];
  /** Subset of senseRows that may be chosen in the Sense Slot. */
  slotRows: CombatSenseBattleRow[];
  grantedRows: CombatSensesPanelRow[];
  darkvisionSummary: string;
}

function formatSenseChannels(id: CombatSenseId): string {
  return COMBAT_SENSES[id].primaryChannels.join(', ');
}

/** Battle sheet + character sheet: full sense list with slot choice emphasis. */
export function buildCombatSensesBattleAreaContext(actor: any): CombatSensesBattleAreaContext {
  const panel = buildCombatSensesPanelContext(actor);
  const data = normalizeCombatSensesData(actor?.system?.combatSenses);
  const artifactGranted = collectGrantedCombatSenses(actor);
  const slotIds = new Set(panel.slotOptions.map((o) => o.id));

  const senseRows: CombatSenseBattleRow[] = [];

  const pushRow = (id: CombatSenseId, isGranted: boolean, fromArtifact: boolean) => {
    const def = COMBAT_SENSES[id];
    senseRows.push({
      id,
      label: def.label,
      rangeM: def.rangeM,
      summary: def.summary,
      channels: formatSenseChannels(id),
      isActive: panel.activeSenseId === id,
      isSlotChoice: slotIds.has(id),
      isGranted,
      fromArtifact,
    });
  };

  pushRow('normalCombatAwareness', true, false);

  for (const id of SENSE_SLOT_SPECIAL_IDS) {
    const sheetGranted = data.grantedSenseIds.includes(id);
    const fromArtifact = artifactGranted.includes(id) && !data.grantedSenseIds.includes(id);
    const isGranted = sheetGranted || fromArtifact
      || panel.grantedRows.find((r) => r.id === id)?.selected === true;
    pushRow(id, isGranted, fromArtifact);
  }

  const slotRows = senseRows.filter((r) => r.isSlotChoice);

  return {
    instruction: 'Sense Slot — choose exactly one active Combat Sense for battle.',
    pickOneHint: slotRows.length > 1
      ? 'Mark one sense below as your active Sense Slot choice.'
      : 'Normal Combat Awareness is your default Sense Slot until you grant a special sense.',
    activeSenseId: panel.activeSenseId,
    activeSenseLabel: panel.activeSenseLabel,
    hasDarkvision: panel.hasDarkvision,
    senseRows,
    slotRows,
    grantedRows: panel.grantedRows,
    darkvisionSummary: COMBAT_SENSES.darkvision.summary,
  };
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

  const grantedRows: CombatSensesPanelRow[] = SENSE_SLOT_SPECIAL_IDS.map((id) => {
    const manual = data.grantedSenseIds.includes(id);
    const fromArtifact = artifactGranted.includes(id) && !manual;
    return {
      id,
      label: COMBAT_SENSES[id].label,
      rangeM: COMBAT_SENSES[id].rangeM,
      selected: manual || fromArtifact,
      fromArtifact,
    };
  });

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
