/**
 * Passive Combat-Trigger Framework
 *
 * Generic runtime for time-based passive effects: combat-start one-shots,
 * turn-start refresh pools, and (future) end-of-turn / round-start / once-
 * per-round riders. First production consumer is Temp HP from passives:
 * - Lean Ward: `triggers.combatStart.tempHP = '1d8'` (one-shot, rolled once
 *   per combat, survives until combatEnd).
 * - Dragon Scales: `triggers.turnStartSelf.tempHP = '2'` (refresh pool, set
 *   to at least N at the owner's own turn-start, can drop to 0 mid-turn).
 *
 * ### Source Book-keeping
 *
 * Each granted pool is tracked by a **stable source key** so that re-
 * applying the same passive never double-stacks:
 *
 *     sourceKey = `${powerId}:${triggerKind}`
 *
 * Sources live under `actor.flags['mastery-system'].tempHPSources` and each
 * entry carries `{ value, declared, kind, origin, combatId, createdAt }`.
 * The scalar mirror `actor.system.health.tempHP` continues to drive all
 * existing display/damage code unchanged — but its mutations are now routed
 * through this module so that the pool breakdown stays consistent with the
 * mirror.
 *
 * ### Stacking rules (confirmed with design)
 *
 * - Same source: idempotent; re-apply overrides to the newly declared value,
 *   never additive.
 * - Different sources: separate pools; mirror = sum of all.
 * - Damage consumption order: **one-shot pools first**, refresh pools last;
 *   inside each group, oldest first (stable createdAt sort).
 * - Manual / unsourced temp HP remains untouched by damage until all tracked
 *   pools are exhausted; on combatEnd we subtract *only* the sourced portion
 *   from the mirror, leaving manual residuals intact.
 *
 * ### Edge cases (acknowledged, not handled here)
 *
 * - Non-combat tempHP sources (rituals, safe-haven heals) are out of scope.
 * - If a GM manually edits `tempHP` mid-combat while sources exist, the
 *   delta-based updater will propagate the manual change correctly on the
 *   next upsert (the source values are not auto-rebalanced).
 */

import type { PowerMechanics, PowerMechanicsTriggers } from '../types/item';
import { getPassiveSlots } from '../powers/passives.js';
import { resolvePowerMechanics } from '../utils/power-mechanics.js';

export type TriggerKind = keyof PowerMechanicsTriggers; // 'combatStart' | 'turnStartSelf'

/** One granted pool tied to a specific passive. */
export interface TempHPSource {
  /** Current pool value (can be reduced by damage, capped at 0). */
  value: number;
  /** "At-least" target for refresh kinds; rolled amount for one-shot kinds. */
  declared: number;
  /** `one-shot` survives the combat; `refresh` is raised on each turn-start. */
  kind: 'one-shot' | 'refresh';
  origin: {
    powerId: string;
    name: string;
    triggerKind: TriggerKind;
  };
  /** Combat this source belongs to; cleared on matching `combatEnd`. */
  combatId: string;
  /** Monotonic timestamp for stable damage-consumption ordering. */
  createdAt: number;
}

export type TempHPSourcesFlag = Record<string, TempHPSource>;

export interface TempHPConsumptionResult {
  /** How much of the incoming damage was absorbed by tempHP (mirror reduction). */
  reducedBy: number;
  /** Leftover damage that still needs to hit the health bars. */
  remainingDamage: number;
}

// ---------------------------------------------------------------------------
// Injectable roller (tests only)
// ---------------------------------------------------------------------------

type Roller = (formula: string) => Promise<number> | number;
let _testRoller: Roller | null = null;

/**
 * Replace the dice-roller for tests. Pass `null` to restore Foundry's
 * default Roll pipeline.
 */
export function setTempHPRollerForTests(roller: Roller | null): void {
  _testRoller = roller;
}

async function rollTempHPFormula(formula: string): Promise<number> {
  const trimmed = String(formula ?? '').trim();
  if (!trimmed) return 0;

  // Pure numeric literal (e.g. "3")
  if (/^\d+$/.test(trimmed)) {
    return Math.max(0, parseInt(trimmed, 10));
  }

  // Test injection takes precedence over Foundry for deterministic unit tests.
  if (_testRoller) {
    try {
      const v = await _testRoller(trimmed);
      const n = Number(v);
      return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
    } catch {
      return 0;
    }
  }

  // Foundry runtime path
  try {
    const R: any = (globalThis as any).Roll;
    if (R) {
      const roll = new R(trimmed);
      const result =
        typeof roll.evaluate === 'function'
          ? await roll.evaluate({ async: true })
          : roll;
      const total = Number(result?.total ?? roll.total ?? 0);
      return Number.isFinite(total) ? Math.max(0, Math.floor(total)) : 0;
    }
  } catch (err) {
    console.warn('Mastery System | [passive-triggers] dice roll failed', formula, err);
  }

  // Defensive fallback for environments without Foundry's Roll (e.g. boot
  // path before Foundry is ready). Uses a simple average-based estimate so
  // callers still get a non-zero pool.
  const m = trimmed.match(/^(\d*)d(\d+)(?:\s*([+-])\s*(\d+))?$/i);
  if (m) {
    const n = parseInt(m[1] || '1', 10);
    const s = parseInt(m[2], 10);
    const sign = m[3] === '-' ? -1 : 1;
    const k = m[4] ? parseInt(m[4], 10) : 0;
    const avg = Math.floor((n * (s + 1)) / 2);
    return Math.max(0, avg + sign * k);
  }
  return 0;
}

// ---------------------------------------------------------------------------
// Actor-state helpers
// ---------------------------------------------------------------------------

const FLAG_BASE = 'flags.mastery-system.tempHPSources';

function getActorFlags(actor: any): Record<string, any> {
  return (actor?.flags?.['mastery-system'] as Record<string, any> | undefined) ?? {};
}

/** Return a *copy* of the current sources map so callers may mutate freely. */
export function getTempHPSources(actor: any): TempHPSourcesFlag {
  const raw = getActorFlags(actor).tempHPSources;
  if (!raw || typeof raw !== 'object') return {};
  const out: TempHPSourcesFlag = {};
  for (const [k, v] of Object.entries(raw as Record<string, TempHPSource>)) {
    if (v && typeof v === 'object') out[k] = { ...v, origin: { ...v.origin } };
  }
  return out;
}

function sumSources(src: TempHPSourcesFlag): number {
  let sum = 0;
  for (const s of Object.values(src)) sum += Math.max(0, Number(s?.value) || 0);
  return sum;
}

function currentTempHP(actor: any): number {
  const n = Number(actor?.system?.health?.tempHP);
  return Number.isFinite(n) ? Math.max(0, n) : 0;
}

async function safeActorUpdate(actor: any, patch: Record<string, unknown>): Promise<void> {
  const u = (actor as any)?.update;
  if (typeof u !== 'function') return;
  try {
    await u.call(actor, patch);
  } catch (err) {
    console.warn('Mastery System | [passive-triggers] actor.update failed', err);
  }
}

/**
 * Build a Foundry-compatible update patch that replaces the `tempHPSources`
 * record with the given `nextSources`: every key present in `previousKeys`
 * but missing from `nextSources` is explicitly deleted via `-=key`.
 */
function buildSourcesPatch(
  nextSources: TempHPSourcesFlag,
  previousKeys: string[],
  nextTempHP: number,
): Record<string, unknown> {
  const patch: Record<string, unknown> = {
    'system.health.tempHP': nextTempHP,
  };
  const nextKeySet = new Set(Object.keys(nextSources));
  for (const k of previousKeys) {
    if (!nextKeySet.has(k)) {
      patch[`${FLAG_BASE}.-=${k}`] = null;
    }
  }
  for (const [k, v] of Object.entries(nextSources)) {
    patch[`${FLAG_BASE}.${k}`] = v;
  }
  return patch;
}

export function makeSourceKey(powerId: string, triggerKind: TriggerKind): string {
  return `${powerId}:${triggerKind}`;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Upsert a single Temp HP source. The actor mirror `system.health.tempHP`
 * is adjusted by the delta so manual residuals stay intact.
 *
 * Exposed primarily for tests and future callers (e.g. activeBuff-applied
 * Temp HP). The main dispatcher `applyPassiveTrigger` uses an inlined
 * batched version so it only writes once per trigger.
 */
export async function upsertTempHPSource(
  actor: any,
  key: string,
  source: TempHPSource,
): Promise<void> {
  if (!actor || !key) return;
  const previous = getTempHPSources(actor);
  const prevKeys = Object.keys(previous);
  const oldValue = Math.max(0, previous[key]?.value ?? 0);
  const next = { ...previous, [key]: source };
  const delta = Math.max(0, source.value) - oldValue;
  const nextTempHP = Math.max(0, currentTempHP(actor) + delta);
  await safeActorUpdate(actor, buildSourcesPatch(next, prevKeys, nextTempHP));
}

/**
 * Apply a trigger to every slot-activated passive on the actor whose
 * mechanics block declares `triggers[triggerKind]`. Rolls dice-strings as
 * needed, merges the resulting pools into the actor's `tempHPSources` map,
 * and synchronises the scalar mirror in a single `actor.update`.
 *
 * Idempotence:
 * - `combatStart` skips sources that already exist for the given combatId
 *   (so re-firing the hook does not reroll pools).
 * - `turnStartSelf` always re-evaluates and raises the pool to at least the
 *   declared value; never lowers it.
 */
export async function applyPassiveTrigger(
  actor: any,
  triggerKind: TriggerKind,
  combat: any,
): Promise<void> {
  if (!actor) return;
  const combatId = String(combat?.id ?? '');
  const slots = getPassiveSlots(actor);
  if (!slots || slots.length === 0) return;

  const sources = getTempHPSources(actor);
  const prevKeys = Object.keys(sources);
  let accumDelta = 0;
  let anyChange = false;

  for (const slot of slots) {
    if (!slot.active || !slot.passive) continue;
    const pid = String(slot.passive.id ?? '').trim();
    if (!pid) continue;

    const items = (actor as any).items;
    let powerItem: any = null;
    try {
      powerItem = items?.get?.(pid) ?? null;
      if (!powerItem && Array.isArray(items)) {
        powerItem = items.find(
          (it: any) => it?.id === pid || it?._id === pid || it?.name === slot.passive?.name,
        );
      }
      if (!powerItem && items && typeof items[Symbol.iterator] === 'function') {
        for (const it of Array.from(items) as any[]) {
          if (it?.id === pid || it?._id === pid || it?.name === slot.passive?.name) {
            powerItem = it;
            break;
          }
        }
      }
    } catch {
      powerItem = null;
    }
    if (!powerItem) continue;

    const mech: PowerMechanics | null = resolvePowerMechanics(powerItem);
    if (!mech || mech.applyWhen !== 'passive-slotted-active') continue;

    const triggerBlock = mech.triggers?.[triggerKind];
    if (!triggerBlock) continue;

    const formula = triggerBlock.tempHP;
    if (!formula) continue;

    const key = makeSourceKey(pid, triggerKind);
    const existing = sources[key];
    const powerName = slot.passive.name ?? powerItem.name ?? 'Passive';

    if (triggerKind === 'combatStart') {
      if (existing && existing.combatId === combatId && existing.kind === 'one-shot') {
        // Already rolled for this combat → idempotent skip.
        continue;
      }
      const rolled = await rollTempHPFormula(formula);
      if (rolled <= 0) continue;
      const oldValue = existing?.value ?? 0;
      sources[key] = {
        value: rolled,
        declared: rolled,
        kind: 'one-shot',
        origin: { powerId: pid, name: powerName, triggerKind },
        combatId,
        createdAt: Date.now(),
      };
      accumDelta += rolled - oldValue;
      anyChange = true;
    } else if (triggerKind === 'turnStartSelf') {
      const target = await rollTempHPFormula(formula);
      if (target <= 0) continue;
      const currentValue = existing?.value ?? 0;
      const newValue = Math.max(currentValue, target);
      const delta = newValue - currentValue;
      sources[key] = {
        value: newValue,
        declared: target,
        kind: 'refresh',
        origin: { powerId: pid, name: powerName, triggerKind },
        combatId,
        createdAt: existing?.createdAt ?? Date.now(),
      };
      if (delta !== 0 || !existing || existing.combatId !== combatId) {
        accumDelta += delta;
        anyChange = true;
      }
    }
  }

  if (!anyChange) return;
  const nextTempHP = Math.max(0, currentTempHP(actor) + accumDelta);
  await safeActorUpdate(actor, buildSourcesPatch(sources, prevKeys, nextTempHP));
}

export interface TempHPConsumptionPreview extends TempHPConsumptionResult {
  /**
   * Partial actor.update patch that applies the consumption. Callers that
   * also need to update other actor fields (e.g. health bars) should merge
   * this into their own update call to keep the write atomic.
   */
  patch: Record<string, unknown>;
}

/**
 * Compute the result of consuming incoming damage from the actor's tempHP
 * pools **without** writing to the actor. Returns both the numeric result
 * and the update patch to apply. Useful for the damage pipeline, which
 * merges tempHP + bar updates into a single atomic `actor.update`.
 *
 * Consumption order:
 *   1. one-shot sources, oldest first;
 *   2. refresh sources, oldest first;
 *   3. any unsourced manual tempHP residual (mirror minus sources).
 */
export function previewTempHPConsumption(
  actor: any,
  incoming: number,
): TempHPConsumptionPreview {
  const damage = Math.max(0, Math.floor(Number(incoming) || 0));
  const emptyPatch: Record<string, unknown> = {};
  if (damage <= 0 || !actor) {
    return { reducedBy: 0, remainingDamage: Math.max(0, damage), patch: emptyPatch };
  }

  const mirror = currentTempHP(actor);
  if (mirror <= 0) {
    return { reducedBy: 0, remainingDamage: damage, patch: emptyPatch };
  }

  const absorbed = Math.min(mirror, damage);
  const remainingDamage = damage - absorbed;
  const nextTempHP = mirror - absorbed;

  const sources = getTempHPSources(actor);
  const prevKeys = Object.keys(sources);
  const sortedKeys = prevKeys.slice().sort((a, b) => {
    const sa = sources[a];
    const sb = sources[b];
    const ka = sa.kind === 'one-shot' ? 0 : 1;
    const kb = sb.kind === 'one-shot' ? 0 : 1;
    if (ka !== kb) return ka - kb;
    return (Number(sa.createdAt) || 0) - (Number(sb.createdAt) || 0);
  });

  let toReduce = absorbed;
  for (const k of sortedKeys) {
    if (toReduce <= 0) break;
    const s = sources[k];
    const take = Math.min(Math.max(0, s.value), toReduce);
    if (take > 0) {
      s.value = Math.max(0, s.value - take);
      toReduce -= take;
    }
    if (s.value <= 0) {
      delete sources[k];
    }
  }
  // Remaining `toReduce` > 0 means the mirror had unsourced residual; it is
  // implicitly consumed by the mirror-subtract below and needs no
  // per-source tracking.

  return {
    reducedBy: absorbed,
    remainingDamage,
    patch: buildSourcesPatch(sources, prevKeys, nextTempHP),
  };
}

/**
 * Subtract incoming damage from the actor's tempHP pools in priority order.
 * Writes the resulting patch to the actor and returns the numeric result.
 * Use `previewTempHPConsumption` instead when you need to merge the patch
 * with other updates (e.g. health-bar changes) into a single write.
 */
export async function consumeTempHPFromSources(
  actor: any,
  incoming: number,
): Promise<TempHPConsumptionResult> {
  const preview = previewTempHPConsumption(actor, incoming);
  if (Object.keys(preview.patch).length > 0) {
    await safeActorUpdate(actor, preview.patch);
  }
  return { reducedBy: preview.reducedBy, remainingDamage: preview.remainingDamage };
}

/**
 * Remove every sourced temp-HP pool for the given combat (or all of them, if
 * no combat is passed — use the no-arg form defensively on `deleteCombat`).
 *
 * The mirror `system.health.tempHP` is decremented by the removed portion
 * only; any unsourced residual (GM-set, ritual-derived, …) stays on the
 * actor.
 */
export async function clearTempHPSourcesOnCombatEnd(
  actor: any,
  combat?: any,
): Promise<void> {
  if (!actor) return;
  const sources = getTempHPSources(actor);
  const prevKeys = Object.keys(sources);
  if (prevKeys.length === 0) return;

  const combatId = combat?.id ? String(combat.id) : null;
  const toRemove = combatId
    ? prevKeys.filter((k) => sources[k].combatId === combatId)
    : prevKeys.slice();
  if (toRemove.length === 0) return;

  const removedSum = toRemove.reduce((s, k) => s + Math.max(0, sources[k].value || 0), 0);
  for (const k of toRemove) delete sources[k];

  const nextTempHP = Math.max(0, currentTempHP(actor) - removedSum);
  await safeActorUpdate(actor, buildSourcesPatch(sources, prevKeys, nextTempHP));
}

/**
 * Iterate every actor attached to the combat's combatants. Handles both
 * Collection-backed (Foundry) and plain-array (tests) combatant stores.
 */
export function getCombatActors(combat: any): any[] {
  if (!combat) return [];
  const combatants = combat.combatants;
  if (!combatants) return [];
  const iter: any[] =
    typeof combatants[Symbol.iterator] === 'function'
      ? Array.from(combatants)
      : Array.isArray(combatants)
        ? combatants
        : [];
  const out: any[] = [];
  const seen = new Set<string>();
  for (const c of iter) {
    const actor = c?.actor;
    if (!actor) continue;
    const id = String(actor.id ?? actor._id ?? out.length);
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(actor);
  }
  return out;
}

/**
 * Convenience: apply a trigger to every combatant in the combat, one at a
 * time (sequentially — avoids racing `actor.update` calls).
 */
export async function applyPassiveTriggerToCombat(
  triggerKind: TriggerKind,
  combat: any,
): Promise<void> {
  const actors = getCombatActors(combat);
  for (const actor of actors) {
    await applyPassiveTrigger(actor, triggerKind, combat);
  }
}

/** Convenience: clear sources on every combatant in the combat. */
export async function clearTempHPSourcesForCombat(combat: any): Promise<void> {
  const actors = getCombatActors(combat);
  for (const actor of actors) {
    await clearTempHPSourcesOnCombatEnd(actor, combat);
  }
}
