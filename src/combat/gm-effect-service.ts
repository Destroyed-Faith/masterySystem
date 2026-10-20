/**
 * GM effect application service — carousel bulk tools and future Region Behaviors.
 * Does not invent Special formulas; delegates to apply-special-effects / assign-status.
 */

import {
  ALL_SPECIAL_EFFECTS,
  getEffectById,
  getEffectBaseName,
  type SpecialEffect,
} from '../utils/special-effects.js';
import {
  coerceStatusEffectsArray,
  encodeStatusFlag,
  readActorStatusEffects,
  statusEntryId,
  type RawStatusEntry,
} from '../system/active-specials.js';
import {
  isAssignableStatusId,
  removeStatusById,
  writeActorStatusList,
} from '../system/assign-status.js';
import { resolveLiveActor, tokenDocOfActor, tokenIdOfActor } from '../system/status-target.js';
import { applySpecialStringsToTarget } from './apply-special-effects.js';
import { specialDisplayName } from './special-application.js';

export type GmEffectMode = 'rules' | 'exact';
export type GmEffectScope = 'selected' | 'allCombatants' | 'allSceneTokens';
export type GmEffectSideFilter = 'all' | 'friendly' | 'neutral' | 'hostile';

export interface GmEffectTargetRef {
  actorId?: string | null;
  tokenId?: string | null;
  combatantId?: string | null;
  name?: string;
  disposition?: number;
}

export interface GmEffectSource {
  name: string;
  uuid: string;
}

export interface GmEffectApplyRequest {
  targets: GmEffectTargetRef[];
  specialId: string;
  value?: number | null;
  mode: GmEffectMode;
  source?: GmEffectSource | null;
  /** Audit label for chat. */
  reason?: string;
}

export interface GmEffectTargetResult {
  name: string;
  actorId: string;
  tokenId: string;
  ok: boolean;
  beforeValue: number | null;
  afterValue: number | null;
  notes: string[];
  error?: string;
}

export interface GmEffectOperationResult {
  ok: boolean;
  mode: GmEffectMode;
  specialId: string;
  specialLabel: string;
  results: GmEffectTargetResult[];
  errors: string[];
  undoId: string | null;
}

interface UndoSnapshot {
  id: string;
  at: number;
  entries: Array<{ actorId: string; tokenId: string; encoded: string; list: RawStatusEntry[] }>;
}

let lastUndo: UndoSnapshot | null = null;

function dispositionSide(d: number): GmEffectSideFilter {
  if (d >= 1) return 'friendly';
  if (d <= -1) return 'hostile';
  return 'neutral';
}

function matchesSide(disposition: number | undefined, filter: GmEffectSideFilter): boolean {
  if (filter === 'all') return true;
  return dispositionSide(Math.floor(Number(disposition) || 0)) === filter;
}

/** Legal persistent Specials for the GM picker (instants/support excluded except Cleanse). */
export function listGmAssignableSpecials(): SpecialEffect[] {
  return ALL_SPECIAL_EFFECTS.filter((e) => {
    if (e.id === 'cleanse') return true;
    if (e.category === 'instant' || e.category === 'support' || e.category === 'multiAttack') {
      return false;
    }
    return isAssignableStatusId(e.id) || !!getEffectById(e.id);
  });
}

export function formatSpecialLine(specialId: string, value?: number | null): string {
  const def = getEffectById(specialId);
  const name = def ? getEffectBaseName(def.name) : specialDisplayName(specialId);
  if (def?.hasValue && value != null && Number.isFinite(Number(value))) {
    return `${name}(${Math.floor(Number(value))})`;
  }
  return name;
}

function currentValue(actor: any, specialId: string, tokenHint?: unknown): number | null {
  const list = readActorStatusEffects(actor, tokenHint);
  let sum = 0;
  let found = false;
  for (const e of list) {
    const id = statusEntryId(e) || String(e?.id || '').toLowerCase();
    if (id === specialId) {
      found = true;
      sum += Math.max(0, Math.floor(Number(e.value) || 0));
    }
  }
  if (!found) return null;
  return sum;
}

export function resolveGmEffectActor(ref: GmEffectTargetRef): { actor: any; tokenId: string } | null {
  const combat = (globalThis as any).game?.combat;
  if (ref.combatantId && combat) {
    const c =
      combat.combatants?.get?.(ref.combatantId) ??
      [...(combat.combatants ?? [])].find((x: any) => String(x.id) === String(ref.combatantId));
    if (c?.actor) {
      const tokenId = String(c.tokenId || c.token?.id || tokenIdOfActor(c.actor) || '');
      return { actor: c.actor, tokenId };
    }
  }
  const actor = resolveLiveActor(ref.actorId, ref.tokenId);
  if (!actor) return null;
  return {
    actor,
    tokenId: String(ref.tokenId || tokenIdOfActor(actor) || ''),
  };
}

export function collectTargetsByScope(
  scope: GmEffectScope,
  opts?: {
    selected?: GmEffectTargetRef[];
    sideFilter?: GmEffectSideFilter;
    combat?: any;
    scene?: any;
  },
): GmEffectTargetRef[] {
  const side = opts?.sideFilter ?? 'all';
  const out: GmEffectTargetRef[] = [];
  const pushUnique = (ref: GmEffectTargetRef) => {
    if (!matchesSide(ref.disposition, side)) return;
    const key = ref.tokenId
      ? `t:${ref.tokenId}`
      : ref.combatantId
        ? `c:${ref.combatantId}`
        : `a:${ref.actorId}`;
    if (out.some((r) => {
      const k = r.tokenId
        ? `t:${r.tokenId}`
        : r.combatantId
          ? `c:${r.combatantId}`
          : `a:${r.actorId}`;
      return k === key;
    })) {
      return;
    }
    out.push(ref);
  };

  if (scope === 'selected') {
    for (const r of opts?.selected ?? []) pushUnique(r);
    return out;
  }

  const combat = opts?.combat ?? (globalThis as any).game?.combat;
  if (scope === 'allCombatants' && combat) {
    const bag = combat.combatants;
    const list = bag?.contents
      ? bag.contents
      : typeof bag?.values === 'function'
        ? Array.from(bag.values())
        : Array.from(bag ?? []);
    for (const c of list) {
      const token = c.token?.document ?? c.token;
      pushUnique({
        combatantId: String(c.id ?? ''),
        actorId: String(c.actorId ?? c.actor?.id ?? ''),
        tokenId: String(c.tokenId ?? token?.id ?? ''),
        name: String(c.name ?? c.actor?.name ?? ''),
        disposition: Number(token?.disposition ?? c.actor?.token?.disposition ?? 0),
      });
    }
    return out;
  }

  if (scope === 'allSceneTokens') {
    const scene =
      opts?.scene ??
      (globalThis as any).canvas?.scene ??
      (globalThis as any).game?.scenes?.viewed ??
      (globalThis as any).game?.scenes?.active;
    const tokens = scene?.tokens?.contents
      ? scene.tokens.contents
      : typeof scene?.tokens?.values === 'function'
        ? Array.from(scene.tokens.values())
        : [];
    for (const t of tokens) {
      if (!t?.actor) continue;
      pushUnique({
        actorId: String(t.actor.id ?? t.actorId ?? ''),
        tokenId: String(t.id ?? ''),
        name: String(t.name ?? t.actor.name ?? ''),
        disposition: Number(t.disposition ?? 0),
      });
    }
  }
  return out;
}

async function snapshotTargets(targets: GmEffectTargetRef[]): Promise<UndoSnapshot['entries']> {
  const entries: UndoSnapshot['entries'] = [];
  for (const ref of targets) {
    const resolved = resolveGmEffectActor(ref);
    if (!resolved) continue;
    const { actor, tokenId } = resolved;
    const list = readActorStatusEffects(actor, tokenDocOfActor(actor)).map((e) => ({ ...e }));
    entries.push({
      actorId: String(actor.id ?? ''),
      tokenId,
      encoded: encodeStatusFlag(list),
      list,
    });
  }
  return entries;
}

async function postAudit(message: string): Promise<void> {
  try {
    const ChatMessage = (globalThis as any).ChatMessage;
    if (!ChatMessage?.create) return;
    await ChatMessage.create({
      user: (globalThis as any).game?.user?.id,
      content: `<div class="mastery-gm-effect-audit"><p>${message}</p></div>`,
      style: (globalThis as any).CONST?.CHAT_MESSAGE_STYLES?.OTHER,
    });
  } catch (err) {
    console.warn('Mastery System | GM effect audit chat failed', err);
  }
}

function assertGm(): boolean {
  return !!(globalThis as any).game?.user?.isGM;
}

/** Preview expected values before apply (pure; no writes). */
export function previewGmEffectApply(req: GmEffectApplyRequest): Array<{
  name: string;
  before: number | null;
  expectedAfter: number | null | string;
  restriction?: string;
}> {
  const def = getEffectById(req.specialId);
  const rows: Array<{
    name: string;
    before: number | null;
    expectedAfter: number | null | string;
    restriction?: string;
  }> = [];
  if (req.specialId === 'challenge' && req.mode === 'rules' && !req.source?.uuid) {
    return req.targets.map((ref) => ({
      name: ref.name || '?',
      before: null as number | null,
      expectedAfter: null as number | null,
      restriction: 'Challenge requires a source',
    }));
  }

  for (const ref of req.targets) {
    const resolved = resolveGmEffectActor(ref);
    if (!resolved) {
      rows.push({
        name: ref.name || '?',
        before: null,
        expectedAfter: null,
        restriction: 'Target not found',
      });
      continue;
    }
    const before = currentValue(resolved.actor, req.specialId, tokenDocOfActor(resolved.actor));
    if (def?.category === 'instant') {
      rows.push({
        name: String(resolved.actor.name || ref.name || '?'),
        before,
        expectedAfter: '—',
        restriction: 'Instant Special cannot be stored from this interface',
      });
      continue;
    }
    const add = Math.max(0, Math.floor(Number(req.value) || (def?.hasValue ? 1 : 0)));
    if (req.mode === 'exact') {
      rows.push({
        name: String(resolved.actor.name || ref.name || '?'),
        before,
        expectedAfter: def?.hasValue ? add : 1,
      });
    } else if (req.specialId === 'cleanse') {
      rows.push({
        name: String(resolved.actor.name || ref.name || '?'),
        before,
        expectedAfter: `Cleanse(${add}) distribute`,
      });
    } else {
      const base = before ?? 0;
      rows.push({
        name: String(resolved.actor.name || ref.name || '?'),
        before,
        expectedAfter: def?.hasValue ? base + add : 1,
      });
    }
  }
  return rows;
}

export async function applyGmEffect(req: GmEffectApplyRequest): Promise<GmEffectOperationResult> {
  const specialId = String(req.specialId || '')
    .trim()
    .toLowerCase();
  const def = getEffectById(specialId);
  const specialLabel = formatSpecialLine(specialId, req.value);
  const empty: GmEffectOperationResult = {
    ok: false,
    mode: req.mode,
    specialId,
    specialLabel,
    results: [],
    errors: [],
    undoId: null,
  };
  if (!assertGm()) {
    empty.errors.push('GM only');
    return empty;
  }
  if (!def && !isAssignableStatusId(specialId)) {
    empty.errors.push(`Unknown Special: ${specialId}`);
    return empty;
  }
  if (def?.category === 'instant') {
    empty.errors.push(
      `${specialLabel} is Instant — it cannot be applied as a persistent status from this interface.`,
    );
    return empty;
  }
  if (req.mode === 'rules' && specialId === 'challenge' && !req.source?.uuid) {
    empty.errors.push('Challenge requires a valid source challenger.');
    return empty;
  }

  const undoEntries = await snapshotTargets(req.targets);
  const results: GmEffectTargetResult[] = [];
  const errors: string[] = [];
  const line = formatSpecialLine(specialId, req.value);

  for (const ref of req.targets) {
    const resolved = resolveGmEffectActor(ref);
    if (!resolved) {
      results.push({
        name: ref.name || '?',
        actorId: String(ref.actorId || ''),
        tokenId: String(ref.tokenId || ''),
        ok: false,
        beforeValue: null,
        afterValue: null,
        notes: [],
        error: 'Target not found',
      });
      errors.push(`${ref.name || '?'}: not found`);
      continue;
    }
    const { actor, tokenId } = resolved;
    const beforeValue = currentValue(actor, specialId, tokenDocOfActor(actor));
    const notes: string[] = [];
    try {
      if (req.mode === 'exact') {
        const list = readActorStatusEffects(actor, tokenDocOfActor(actor)).map((e) => ({ ...e }));
        const filtered = removeStatusById(list, specialId);
        const val =
          def?.hasValue === false
            ? undefined
            : Math.max(1, Math.floor(Number(req.value) || 1));
        if (specialId === 'cleanse') {
          notes.push('Cleanse is not stored as a status in Override mode — use Apply Normally.');
          results.push({
            name: String(actor.name || ''),
            actorId: String(actor.id || ''),
            tokenId,
            ok: false,
            beforeValue,
            afterValue: beforeValue,
            notes,
            error: 'Use Apply Normally for Cleanse',
          });
          continue;
        }
        const entry: RawStatusEntry = {
          id: specialId,
          name: def ? getEffectBaseName(def.name) : specialDisplayName(specialId),
          ...(val != null ? { value: val } : {}),
          source: req.source?.name || 'GM Override',
          ...(req.source?.uuid ? { sourceUuid: req.source.uuid } : {}),
          timestamp: Date.now(),
        };
        filtered.push(entry);
        await writeActorStatusList(actor, filtered);
        notes.push('GM Override – exact value set');
      } else {
        const sourceActor = req.source?.uuid
          ? ({
              name: req.source.name,
              uuid: req.source.uuid,
              id: req.source.uuid.split('.').pop(),
            } as any)
          : null;
        const applyNotes = await applySpecialStringsToTarget(actor, [line], sourceActor, {
          skipReactiveCleanse: true,
          requireChallengeSource: specialId === 'challenge',
          tokenHint: tokenDocOfActor(actor),
        });
        notes.push(...applyNotes);
      }
      const afterValue = currentValue(actor, specialId, tokenDocOfActor(actor));
      results.push({
        name: String(actor.name || ''),
        actorId: String(actor.id || ''),
        tokenId,
        ok: true,
        beforeValue,
        afterValue,
        notes,
      });
    } catch (err: any) {
      const msg = String(err?.message || err || 'failed');
      errors.push(`${actor.name}: ${msg}`);
      results.push({
        name: String(actor.name || ''),
        actorId: String(actor.id || ''),
        tokenId,
        ok: false,
        beforeValue,
        afterValue: beforeValue,
        notes,
        error: msg,
      });
    }
  }

  const undoId = `gm-fx-${Date.now()}`;
  lastUndo = { id: undoId, at: Date.now(), entries: undoEntries };
  const modeLabel = req.mode === 'exact' ? 'GM Override' : 'Apply Normally';
  const names = results.filter((r) => r.ok).map((r) => r.name).join(', ');
  await postAudit(
    `<strong>${modeLabel}</strong>: ${specialLabel} → ${names || '—'}${
      req.reason ? ` (${req.reason})` : ''
    }`,
  );

  return {
    ok: errors.length === 0 && results.some((r) => r.ok),
    mode: req.mode,
    specialId,
    specialLabel,
    results,
    errors,
    undoId,
  };
}

export async function removeGmEffect(
  targets: GmEffectTargetRef[],
  specialId: string,
): Promise<GmEffectOperationResult> {
  const id = String(specialId || '')
    .trim()
    .toLowerCase();
  const specialLabel = formatSpecialLine(id);
  if (!assertGm()) {
    return {
      ok: false,
      mode: 'exact',
      specialId: id,
      specialLabel,
      results: [],
      errors: ['GM only'],
      undoId: null,
    };
  }
  const undoEntries = await snapshotTargets(targets);
  const results: GmEffectTargetResult[] = [];
  const errors: string[] = [];
  for (const ref of targets) {
    const resolved = resolveGmEffectActor(ref);
    if (!resolved) {
      errors.push(`${ref.name || '?'}: not found`);
      continue;
    }
    const { actor, tokenId } = resolved;
    const beforeValue = currentValue(actor, id, tokenDocOfActor(actor));
    try {
      const list = readActorStatusEffects(actor, tokenDocOfActor(actor));
      const next = removeStatusById(list, id);
      await writeActorStatusList(actor, next);
      results.push({
        name: String(actor.name || ''),
        actorId: String(actor.id || ''),
        tokenId,
        ok: true,
        beforeValue,
        afterValue: null,
        notes: ['removed'],
      });
    } catch (err: any) {
      errors.push(`${actor.name}: ${err?.message || err}`);
    }
  }
  const undoId = `gm-fx-${Date.now()}`;
  lastUndo = { id: undoId, at: Date.now(), entries: undoEntries };
  await postAudit(
    `<strong>Remove Special</strong>: ${specialLabel} → ${results.map((r) => r.name).join(', ')}`,
  );
  return {
    ok: errors.length === 0,
    mode: 'exact',
    specialId: id,
    specialLabel,
    results,
    errors,
    undoId,
  };
}

export async function adjustGmEffect(
  targets: GmEffectTargetRef[],
  specialId: string,
  newValue: number,
): Promise<GmEffectOperationResult> {
  return applyGmEffect({
    targets,
    specialId,
    value: newValue,
    mode: 'exact',
    reason: 'Adjust Existing Special',
  });
}

export async function undoLastGmEffectBulk(): Promise<{ ok: boolean; message: string }> {
  if (!assertGm()) return { ok: false, message: 'GM only' };
  if (!lastUndo?.entries.length) return { ok: false, message: 'Nothing to undo' };
  const snap = lastUndo;
  lastUndo = null;
  for (const entry of snap.entries) {
    const actor = resolveLiveActor(entry.actorId, entry.tokenId);
    if (!actor) continue;
    const list = coerceStatusEffectsArray(entry.list);
    await writeActorStatusList(actor, list);
  }
  await postAudit(`<strong>Undo</strong> last GM bulk Special operation (${snap.id}).`);
  return { ok: true, message: 'Undid last bulk Special operation' };
}

export function peekLastGmEffectUndoId(): string | null {
  return lastUndo?.id ?? null;
}
