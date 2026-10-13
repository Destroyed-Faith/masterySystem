/**
 * Combat Snapshot — GM export/import of a full fight state as versioned JSON.
 *
 * Captures Combat fields (round/turn/initiative) plus per-combatant actor/token
 * economy state (stones, specials, HP, roundState, …). Restore targets the
 * active combat on the same scene.
 */

import { getActionEconomyActor } from './action-economy.js';
import { readActorStatusEffects } from '../system/active-specials.js';
import { writeActorStatusList } from '../system/assign-status.js';
import {
  mirrorStoneCombatReadyToPools,
  writeStoneCombatReady,
  type StoneCombatReadyLedger,
} from '../stones/stone-combat-ledger.js';

export const COMBAT_SNAPSHOT_KIND = 'mastery-combat-snapshot';
export const COMBAT_SNAPSHOT_SCHEMA_VERSION = 1;
const SYSTEM = 'mastery-system';

/** Actor-side mastery flags that belong to a fight. */
export const COMBAT_ACTOR_FLAG_KEYS = [
  'roundState',
  'stoneUsage',
  'stoneCombatReady',
  'stonePowersRoundPlan',
  'stonePowersConfigLock',
  'preparationPhase',
  'tempHPSources',
  'tempColorlessStones',
  'initiativeColorlessStones',
  'initiativeColorlessExhausted',
  'absorbedDamage',
  'absorptionStoneExpiry',
  'phasingCharges',
  'dnReserve',
  'specialRoundApps',
  'naturalSpecialRecovery',
  'deathState',
  'grapple',
  'spellZones',
  'perceptionCombat',
  'initiativeRolledFor',
  'movedThisTurnM',
  'lacerateStageThisTurn',
  'safeMoveNotedThisTurn',
  'slipMovementActive',
  'pendingSafeMovement',
  'pendingSlip',
  'firstAidReceived',
  'bloodRaiseHpLostThisCombat',
  'stressBreakdownPending',
  'stressBreakdownVirtueKeep',
  'msInitiativeBoostUsed',
  'msPhasingStoneUsed',
  'msTempHpStoneUsed',
  'statusJson',
  'statusEffects',
] as const;

/** Combatant-side mastery flags. */
export const COMBATANT_FLAG_KEYS = [
  'encounterSetupStep',
  'msInitiativeValue',
  'msInitiativeBoostThisRound',
  'pendingInitiativeShop',
  'npcInitiativeRolled',
  'initiativeShop',
] as const;

/** Combat-document mastery flags. */
export const COMBAT_FLAG_KEYS = [
  'encounterSetup',
  'stonePowersState',
  'stoneRoundSummaryPosted',
  'stoneSpendByRound',
] as const;

/** Flags that Foundry merges — must unset-then-set on restore. */
const UNSET_THEN_SET_FLAGS = new Set([
  'roundState',
  'spellZones',
  'stoneUsage',
  'stoneCombatReady',
  'stonePowersRoundPlan',
  'phasingCharges',
  'specialRoundApps',
  'naturalSpecialRecovery',
  'deathState',
  'grapple',
  'perceptionCombat',
  'tempHPSources',
]);

export interface CombatSnapshotCombatant {
  id: string;
  name: string;
  actorId: string;
  actorUuid?: string;
  tokenId: string;
  tokenUuid?: string;
  actorLink: boolean;
  initiative: number | null;
  defeated: boolean;
  hidden: boolean;
  flags: Record<string, unknown>;
  economyOwner: {
    kind: 'world' | 'token';
    actorId: string;
    actorUuid: string;
  };
  actor: {
    system: {
      health?: unknown;
      stress?: unknown;
      stonePools?: unknown;
      npcActivePhaseIndex?: unknown;
      phases?: unknown;
    };
    flags: Record<string, unknown>;
    activeBuffEffects: unknown[];
    statusEffects: unknown[];
  };
  token: {
    x?: number;
    y?: number;
    elevation?: number;
    rotation?: number;
    alpha?: number;
    flags: Record<string, unknown>;
  };
}

export interface CombatSnapshot {
  exportKind: typeof COMBAT_SNAPSHOT_KIND;
  schemaVersion: number;
  exportedAt: string;
  worldId?: string;
  scene: { id: string; name?: string };
  combat: {
    id: string;
    name?: string;
    started: boolean;
    round: number;
    turn: number;
    flags: Record<string, unknown>;
    combatants: CombatSnapshotCombatant[];
  };
}

export type SnapshotValidateResult =
  | { ok: true; snapshot: CombatSnapshot }
  | { ok: false; reason: string };

function deepClone<T>(value: T): T {
  try {
    const dup = (globalThis as any).foundry?.utils?.duplicate;
    if (typeof dup === 'function') return dup(value);
  } catch {
    /* fall through */
  }
  return JSON.parse(JSON.stringify(value ?? null)) as T;
}

function readFlagBag(doc: any, keys: readonly string[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (!doc) return out;
  const bag = doc?.flags?.[SYSTEM] ?? {};
  for (const key of keys) {
    let v: unknown;
    try {
      v = typeof doc.getFlag === 'function' ? doc.getFlag(SYSTEM, key) : bag[key];
    } catch {
      v = bag[key];
    }
    if (v !== undefined && v !== null) out[key] = deepClone(v);
  }
  return out;
}

function uuidOf(doc: any): string {
  try {
    return String(doc?.uuid || '');
  } catch {
    return '';
  }
}

function tokenDocOfCombatant(combatant: any): any {
  try {
    if (combatant?.token?.document) return combatant.token.document;
    if (combatant?.token && combatant.token.x != null) return combatant.token;
  } catch {
    /* ignore */
  }
  const tokenId = String(combatant?.tokenId || '');
  const sceneId = String(
    combatant?.combat?.scene?.id ??
      combatant?.combat?.sceneId ??
      (globalThis as any).game?.combat?.scene?.id ??
      '',
  );
  try {
    const scene =
      (sceneId && (globalThis as any).game?.scenes?.get?.(sceneId)) ||
      (globalThis as any).canvas?.scene;
    return scene?.tokens?.get?.(tokenId) ?? null;
  } catch {
    return null;
  }
}

function captureActiveBuffEffects(actor: any): unknown[] {
  if (!actor) return [];
  const raw = actor.effects?.contents ?? actor.effects ?? [];
  const list = Array.isArray(raw) ? raw : typeof raw[Symbol.iterator] === 'function' ? Array.from(raw) : [];
  const out: unknown[] = [];
  for (const ef of list) {
    const flags = ef?.flags?.[SYSTEM] ?? ef?.flags?.['mastery-system'];
    if (flags?.activeBuff !== true) continue;
    try {
      out.push(typeof ef.toObject === 'function' ? ef.toObject() : deepClone(ef));
    } catch {
      /* skip */
    }
  }
  return out;
}

function captureCombatant(combatant: any): CombatSnapshotCombatant | null {
  const actor = combatant?.actor;
  if (!actor) return null;
  const tokenDoc = tokenDocOfCombatant(combatant);
  let economy = actor;
  try {
    economy = getActionEconomyActor(actor) ?? actor;
  } catch {
    economy = actor;
  }
  const economyIsToken = !!(economy as any)?.isToken || economy === (tokenDoc as any)?.actor;
  const statusEffects = readActorStatusEffects(actor, tokenDoc);

  const actorSystem: CombatSnapshotCombatant['actor']['system'] = {};
  const sys = (economy as any)?.system ?? (actor as any)?.system ?? {};
  if (sys.health) actorSystem.health = deepClone(sys.health);
  if (sys.stress) actorSystem.stress = deepClone(sys.stress);
  if (sys.stonePools) actorSystem.stonePools = deepClone(sys.stonePools);
  if (sys.npcActivePhaseIndex !== undefined) actorSystem.npcActivePhaseIndex = deepClone(sys.npcActivePhaseIndex);
  if (sys.phases) actorSystem.phases = deepClone(sys.phases);

  const tokenFlags = readFlagBag(tokenDoc, ['statusJson', 'downed', 'preDownedAlpha']);

  return {
    id: String(combatant.id || ''),
    name: String(combatant.name || actor.name || ''),
    actorId: String(combatant.actorId || actor.id || ''),
    actorUuid: uuidOf(actor) || undefined,
    tokenId: String(combatant.tokenId || tokenDoc?.id || ''),
    tokenUuid: uuidOf(tokenDoc) || undefined,
    actorLink: tokenDoc?.actorLink === true || !!(actor as any)?.prototypeToken?.actorLink,
    initiative: combatant.initiative == null ? null : Number(combatant.initiative),
    defeated: !!combatant.defeated,
    hidden: !!combatant.hidden,
    flags: readFlagBag(combatant, COMBATANT_FLAG_KEYS),
    economyOwner: {
      kind: economyIsToken ? 'token' : 'world',
      actorId: String((economy as any)?.id || actor.id || ''),
      actorUuid: uuidOf(economy) || uuidOf(actor),
    },
    actor: {
      system: actorSystem,
      flags: readFlagBag(economy, COMBAT_ACTOR_FLAG_KEYS),
      activeBuffEffects: captureActiveBuffEffects(economy),
      statusEffects: deepClone(statusEffects),
    },
    token: {
      x: tokenDoc?.x != null ? Number(tokenDoc.x) : undefined,
      y: tokenDoc?.y != null ? Number(tokenDoc.y) : undefined,
      elevation: tokenDoc?.elevation != null ? Number(tokenDoc.elevation) : undefined,
      rotation: tokenDoc?.rotation != null ? Number(tokenDoc.rotation) : undefined,
      alpha: tokenDoc?.alpha != null ? Number(tokenDoc.alpha) : undefined,
      flags: tokenFlags,
    },
  };
}

/** Capture the live combat into a portable snapshot. */
export function captureCombatSnapshot(combat: any): CombatSnapshot {
  if (!combat) throw new Error('No combat');
  const sceneId = String(combat.scene?.id ?? combat.sceneId ?? '');
  const scene =
    (sceneId && (globalThis as any).game?.scenes?.get?.(sceneId)) ||
    (globalThis as any).canvas?.scene ||
    null;
  const combatantsRaw = combat.combatants?.contents ?? combat.combatants ?? [];
  const combatantsList = Array.isArray(combatantsRaw)
    ? combatantsRaw
    : typeof combatantsRaw[Symbol.iterator] === 'function'
      ? Array.from(combatantsRaw)
      : [];

  const combatants: CombatSnapshotCombatant[] = [];
  for (const c of combatantsList) {
    const row = captureCombatant(c);
    if (row) combatants.push(row);
  }

  return {
    exportKind: COMBAT_SNAPSHOT_KIND,
    schemaVersion: COMBAT_SNAPSHOT_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    worldId: String((globalThis as any).game?.world?.id ?? ''),
    scene: {
      id: sceneId || String(scene?.id || ''),
      name: scene?.name ? String(scene.name) : undefined,
    },
    combat: {
      id: String(combat.id || ''),
      name: combat.name ? String(combat.name) : undefined,
      started: !!combat.started,
      round: Math.max(0, Math.floor(Number(combat.round) || 0)),
      turn: Math.max(0, Math.floor(Number(combat.turn) || 0)),
      flags: readFlagBag(combat, COMBAT_FLAG_KEYS),
      combatants,
    },
  };
}

export function validateCombatSnapshot(raw: unknown): SnapshotValidateResult {
  if (!raw || typeof raw !== 'object') return { ok: false, reason: 'Not a JSON object' };
  const doc = raw as Partial<CombatSnapshot>;
  if (doc.exportKind !== COMBAT_SNAPSHOT_KIND) {
    return { ok: false, reason: `Wrong exportKind (expected ${COMBAT_SNAPSHOT_KIND})` };
  }
  const ver = Number(doc.schemaVersion) || 0;
  if (ver < 1 || ver > COMBAT_SNAPSHOT_SCHEMA_VERSION) {
    return { ok: false, reason: `Unsupported schemaVersion ${ver}` };
  }
  if (!doc.scene?.id) return { ok: false, reason: 'Missing scene.id' };
  if (!doc.combat || typeof doc.combat !== 'object') return { ok: false, reason: 'Missing combat' };
  if (!Array.isArray(doc.combat.combatants)) return { ok: false, reason: 'Missing combat.combatants' };
  return { ok: true, snapshot: doc as CombatSnapshot };
}

/**
 * Deep-replace string values equal to `fromId`, and any `combatId` property.
 * Used when the live Combat document id differs from the snapshot.
 */
export function remapCombatIdsInValue(value: unknown, fromId: string, toId: string): unknown {
  if (!fromId || !toId || fromId === toId) return value;
  if (typeof value === 'string') return value === fromId ? toId : value;
  if (Array.isArray(value)) return value.map((v) => remapCombatIdsInValue(v, fromId, toId));
  if (!value || typeof value !== 'object') return value;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (k === 'combatId' && typeof v === 'string' && v === fromId) out[k] = toId;
    else out[k] = remapCombatIdsInValue(v, fromId, toId);
  }
  return out;
}

export function matchSnapshotCombatant(
  snap: CombatSnapshotCombatant,
  liveCombatants: any[],
): any | null {
  const byTokenUuid = snap.tokenUuid
    ? liveCombatants.find((c) => uuidOf(tokenDocOfCombatant(c)) === snap.tokenUuid)
    : null;
  if (byTokenUuid) return byTokenUuid;
  if (snap.tokenId) {
    const byTokenId = liveCombatants.find((c) => String(c.tokenId || '') === snap.tokenId);
    if (byTokenId) return byTokenId;
  }
  if (snap.actorLink && snap.actorId) {
    const byActor = liveCombatants.find((c) => String(c.actorId || '') === snap.actorId);
    if (byActor) return byActor;
  }
  if (snap.actorUuid) {
    const byUuid = liveCombatants.find((c) => uuidOf(c.actor) === snap.actorUuid);
    if (byUuid) return byUuid;
  }
  return null;
}

async function replaceMasteryFlag(doc: any, key: string, value: unknown): Promise<void> {
  if (!doc) return;
  if (UNSET_THEN_SET_FLAGS.has(key) && typeof doc.unsetFlag === 'function') {
    try {
      await doc.unsetFlag(SYSTEM, key);
    } catch {
      try {
        await doc.update?.({ [`flags.${SYSTEM}.-=${key}`]: null });
      } catch {
        /* continue */
      }
    }
  }
  if (value === undefined) return;
  if (typeof doc.setFlag === 'function') {
    await doc.setFlag(SYSTEM, key, value);
  } else {
    await doc.update?.({ [`flags.${SYSTEM}.${key}`]: value });
  }
}

function liveCombatantsList(combat: any): any[] {
  const raw = combat?.combatants?.contents ?? combat?.combatants ?? [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw[Symbol.iterator] === 'function') return Array.from(raw);
  return [];
}

function resolveEconomyTarget(combatant: any, snap: CombatSnapshotCombatant): any {
  const actor = combatant?.actor;
  if (!actor) return null;
  try {
    return getActionEconomyActor(actor) ?? actor;
  } catch {
    return actor;
  }
}

async function applyTokenGeometry(combatant: any, snap: CombatSnapshotCombatant): Promise<void> {
  const tokenDoc = tokenDocOfCombatant(combatant);
  if (!tokenDoc?.update) return;
  const patch: Record<string, unknown> = {};
  if (snap.token.x != null) patch.x = snap.token.x;
  if (snap.token.y != null) patch.y = snap.token.y;
  if (snap.token.elevation != null) patch.elevation = snap.token.elevation;
  if (snap.token.rotation != null) patch.rotation = snap.token.rotation;
  if (snap.token.alpha != null) patch.alpha = snap.token.alpha;
  for (const [k, v] of Object.entries(snap.token.flags || {})) {
    patch[`flags.${SYSTEM}.${k}`] = v;
  }
  if (Object.keys(patch).length) {
    try {
      await tokenDoc.update(patch);
    } catch (err) {
      console.warn('Mastery System | combat snapshot token update failed', snap.name, err);
    }
  }
}

async function applyActiveBuffs(owner: any, effects: unknown[]): Promise<void> {
  if (!owner?.effects) return;
  const raw = owner.effects?.contents ?? owner.effects ?? [];
  const list = Array.isArray(raw) ? raw : typeof raw[Symbol.iterator] === 'function' ? Array.from(raw) : [];
  const toDelete: string[] = [];
  for (const ef of list) {
    if (ef?.flags?.[SYSTEM]?.activeBuff === true && ef.id) toDelete.push(String(ef.id));
  }
  if (toDelete.length && typeof owner.deleteEmbeddedDocuments === 'function') {
    try {
      await owner.deleteEmbeddedDocuments('ActiveEffect', toDelete);
    } catch (err) {
      console.warn('Mastery System | combat snapshot buff clear failed', err);
    }
  }
  if (Array.isArray(effects) && effects.length && typeof owner.createEmbeddedDocuments === 'function') {
    try {
      await owner.createEmbeddedDocuments('ActiveEffect', effects as any[]);
    } catch (err) {
      console.warn('Mastery System | combat snapshot buff restore failed', err);
    }
  }
}

async function ensureMissingCombatants(combat: any, snapshot: CombatSnapshot): Promise<void> {
  const live = liveCombatantsList(combat);
  const missingTokenIds: string[] = [];
  for (const snap of snapshot.combat.combatants) {
    if (matchSnapshotCombatant(snap, live)) continue;
    if (snap.tokenId) missingTokenIds.push(snap.tokenId);
  }
  if (!missingTokenIds.length) return;
  try {
    const { addTokensToCombat } = await import('./start-encounter.js');
    await addTokensToCombat(combat, missingTokenIds);
  } catch (err) {
    console.warn('Mastery System | combat snapshot could not add missing combatants', err);
  }
}

/**
 * Apply a validated snapshot onto the live combat (same scene). GM-only caller.
 */
export async function applyCombatSnapshot(
  combat: any,
  snapshot: CombatSnapshot,
): Promise<{ ok: boolean; reason?: string }> {
  if (!combat) return { ok: false, reason: 'No combat' };
  const liveSceneId = String(combat.scene?.id ?? combat.sceneId ?? '');
  if (liveSceneId && snapshot.scene.id && liveSceneId !== snapshot.scene.id) {
    return {
      ok: false,
      reason: `Scene mismatch (combat ${liveSceneId} vs snapshot ${snapshot.scene.id})`,
    };
  }

  const oldCombatId = String(snapshot.combat.id || '');
  const newCombatId = String(combat.id || '');
  const remapped = remapCombatIdsInValue(deepClone(snapshot), oldCombatId, newCombatId) as CombatSnapshot;

  await ensureMissingCombatants(combat, remapped);
  const live = liveCombatantsList(combat);

  for (const snap of remapped.combat.combatants) {
    const combatant = matchSnapshotCombatant(snap, live);
    if (!combatant) {
      console.warn('Mastery System | combat snapshot: no match for', snap.name, snap.tokenId);
      continue;
    }

    await applyTokenGeometry(combatant, snap);

    const owner = resolveEconomyTarget(combatant, snap);
    if (!owner) continue;

    // Vitals + stone pools
    const sysPatch: Record<string, unknown> = {};
    if (snap.actor.system.health) sysPatch['system.health'] = snap.actor.system.health;
    if (snap.actor.system.stress) sysPatch['system.stress'] = snap.actor.system.stress;
    if (snap.actor.system.stonePools) sysPatch['system.stonePools'] = snap.actor.system.stonePools;
    if (snap.actor.system.npcActivePhaseIndex !== undefined) {
      sysPatch['system.npcActivePhaseIndex'] = snap.actor.system.npcActivePhaseIndex;
    }
    if (snap.actor.system.phases) sysPatch['system.phases'] = snap.actor.system.phases;
    if (Object.keys(sysPatch).length) {
      try {
        await owner.update?.(sysPatch);
      } catch (err) {
        console.warn('Mastery System | combat snapshot actor system update failed', snap.name, err);
      }
    }

    // Statuses
    try {
      const list = Array.isArray(snap.actor.statusEffects) ? (snap.actor.statusEffects as any[]) : [];
      await writeActorStatusList(owner, list);
    } catch (err) {
      console.warn('Mastery System | combat snapshot status write failed', snap.name, err);
    }

    // Actor flags
    for (const [key, value] of Object.entries(snap.actor.flags || {})) {
      try {
        await replaceMasteryFlag(owner, key, value);
      } catch (err) {
        console.warn('Mastery System | combat snapshot flag', key, err);
      }
    }

    // Ledger mirror
    const ledger = snap.actor.flags?.stoneCombatReady as StoneCombatReadyLedger | undefined;
    if (ledger && ledger.combatId) {
      try {
        await writeStoneCombatReady(owner, ledger);
        await mirrorStoneCombatReadyToPools(owner, ledger);
      } catch (err) {
        console.warn('Mastery System | combat snapshot ledger mirror failed', err);
      }
    }

    await applyActiveBuffs(owner, snap.actor.activeBuffEffects);

    // Combatant fields
    const cPatch: Record<string, unknown> = {
      initiative: snap.initiative,
      defeated: snap.defeated,
      hidden: snap.hidden,
    };
    for (const [key, value] of Object.entries(snap.flags || {})) {
      cPatch[`flags.${SYSTEM}.${key}`] = value;
    }
    try {
      await combatant.update?.(cPatch);
    } catch (err) {
      console.warn('Mastery System | combat snapshot combatant update failed', snap.name, err);
    }
  }

  // Combat flags then round/turn/started
  for (const [key, value] of Object.entries(remapped.combat.flags || {})) {
    try {
      await replaceMasteryFlag(combat, key, value);
    } catch (err) {
      console.warn('Mastery System | combat snapshot combat flag', key, err);
    }
  }

  try {
    await combat.update?.({
      round: remapped.combat.round,
      turn: remapped.combat.turn,
      started: remapped.combat.started,
    });
  } catch (err) {
    console.warn('Mastery System | combat snapshot round/turn update failed', err);
  }

  try {
    await (combat as any).setupTurns?.();
  } catch {
    /* optional */
  }

  try {
    const { CombatCarouselApp } = await import('../ui/combat-carousel.js');
    CombatCarouselApp.refresh();
  } catch {
    /* carousel optional */
  }

  return { ok: true };
}

export function downloadCombatSnapshot(snapshot: CombatSnapshot): void {
  const scene = String(snapshot.scene.name || snapshot.scene.id || 'scene')
    .replace(/[^\w\-]+/g, '_')
    .slice(0, 40);
  const name = `combat-snapshot-${scene}-r${snapshot.combat.round}.json`;
  const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  window.setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

function loc(key: string, fallback: string): string {
  const full = `MASTERY.combatSnapshot.${key}`;
  const t = (globalThis as any).game?.i18n?.localize?.(full);
  return t && t !== full ? t : fallback;
}

/** GM: capture + download active combat. */
export async function exportActiveCombatSnapshot(): Promise<void> {
  const g = globalThis as any;
  if (!g.game?.user?.isGM) {
    g.ui?.notifications?.warn?.(loc('gmOnly', 'Only the GM can export combat snapshots.'));
    return;
  }
  const combat = g.game?.combats?.active ?? g.game?.combat;
  if (!combat) {
    g.ui?.notifications?.warn?.(loc('noCombat', 'No active combat.'));
    return;
  }
  try {
    const snap = captureCombatSnapshot(combat);
    downloadCombatSnapshot(snap);
    g.ui?.notifications?.info?.(
      loc('exported', 'Combat snapshot downloaded ({n} combatants).').replace(
        '{n}',
        String(snap.combat.combatants.length),
      ),
    );
  } catch (err) {
    console.error('Mastery System | combat snapshot export failed', err);
    g.ui?.notifications?.error?.(loc('exportFailed', 'Combat snapshot export failed — see console.'));
  }
}

/** GM: file picker → confirm → apply onto active combat. */
export async function promptImportCombatSnapshot(): Promise<void> {
  const g = globalThis as any;
  if (!g.game?.user?.isGM) {
    g.ui?.notifications?.warn?.(loc('gmOnly', 'Only the GM can import combat snapshots.'));
    return;
  }
  const combat = g.game?.combats?.active ?? g.game?.combat;
  if (!combat) {
    g.ui?.notifications?.warn?.(loc('noCombat', 'No active combat.'));
    return;
  }

  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'application/json,.json';
  input.style.display = 'none';
  document.body.appendChild(input);

  const file = await new Promise<File | null>((resolve) => {
    input.onchange = () => resolve(input.files?.[0] ?? null);
    input.oncancel = () => resolve(null);
    input.click();
  });
  input.remove();
  if (!file) return;

  let raw: unknown;
  try {
    raw = JSON.parse(await file.text());
  } catch {
    g.ui?.notifications?.error?.(loc('badJson', 'Could not parse JSON file.'));
    return;
  }

  const validated = validateCombatSnapshot(raw);
  if (!validated.ok) {
    g.ui?.notifications?.error?.(
      loc('invalid', 'Invalid combat snapshot: {reason}').replace('{reason}', validated.reason),
    );
    return;
  }

  const DialogCls = g.Dialog ?? g.foundry?.applications?.api?.DialogV2;
  const title = loc('confirmTitle', 'Load Combat Snapshot');
  const content = loc(
    'confirmContent',
    'Overwrite the current fight with this snapshot (same scene)? Initiative, HP, Specials, and Stones will be replaced.',
  );

  let confirmed = false;
  if (typeof g.Dialog?.confirm === 'function') {
    confirmed = !!(await g.Dialog.confirm({ title, content, yes: () => true, no: () => false, defaultYes: 'no' }));
  } else if (DialogCls?.confirm) {
    confirmed = !!(await DialogCls.confirm({ window: { title }, content }));
  } else {
    confirmed = window.confirm(content);
  }
  if (!confirmed) return;

  const result = await applyCombatSnapshot(combat, validated.snapshot);
  if (!result.ok) {
    g.ui?.notifications?.error?.(
      loc('importFailed', 'Import failed: {reason}').replace('{reason}', result.reason || 'unknown'),
    );
    return;
  }
  g.ui?.notifications?.info?.(loc('imported', 'Combat snapshot restored.'));
}
