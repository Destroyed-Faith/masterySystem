/**
 * R-05 AoE Restoration — distribute a shared Safe Haven pool across allies.
 */

import { escapeStoneChat } from '../stones/stone-resolution.js';
import { countScarredHealthBars } from '../stones/remove-scar.js';
import {
  getHlrRemainingOnCaster,
  getPowerHlrPoolMax,
  healPowerHlrKey,
  spendHlrOnCaster,
} from './heal-resolution.js';
import { restoreScarredHealthBars } from './r05-restoration.js';

export const AOE_RESTORATION_CHAT_FLAG = 'aoeRestoration';

export interface AoeRestorationTarget {
  tokenId: string;
  actorId: string;
  name: string;
  scarred: number;
}

export interface AoeRestorationPending {
  casterActorId: string;
  powerKey: string;
  powerName: string;
  poolRemaining: number;
  poolMax: number;
  targets: AoeRestorationTarget[];
}

/** Validate allocations: non-negative, ≤ scarred per target, sum ≤ pool. */
export function validateAoeRestorationAllocation(
  pending: AoeRestorationPending,
  allocation: Record<string, number>,
): { ok: boolean; total: number; reason?: string; cleaned: Record<string, number> } {
  const cleaned: Record<string, number> = {};
  let total = 0;
  const byActor = new Map(pending.targets.map((t) => [t.actorId, t]));
  for (const [actorId, raw] of Object.entries(allocation || {})) {
    const n = Math.max(0, Math.floor(Number(raw) || 0));
    if (n <= 0) continue;
    const row = byActor.get(actorId);
    if (!row) return { ok: false, total: 0, reason: 'unknown-target', cleaned: {} };
    if (n > row.scarred) {
      return { ok: false, total: 0, reason: 'over-scarred', cleaned: {} };
    }
    cleaned[actorId] = n;
    total += n;
  }
  if (total <= 0) return { ok: false, total: 0, reason: 'empty', cleaned: {} };
  if (total > pending.poolRemaining) {
    return { ok: false, total, reason: 'over-pool', cleaned: {} };
  }
  return { ok: true, total, cleaned };
}

/** Pool points still free given current allocations (optionally ignoring one actor). */
export function aoeRestorationPoolLeft(
  pending: AoeRestorationPending,
  allocation: Record<string, number>,
  excludeActorId?: string,
): number {
  let used = 0;
  for (const [actorId, raw] of Object.entries(allocation || {})) {
    if (excludeActorId && actorId === excludeActorId) continue;
    used += Math.max(0, Math.floor(Number(raw) || 0));
  }
  return Math.max(0, pending.poolRemaining - used);
}

/** Max bars this target may still receive without exceeding scarred or remaining pool. */
export function aoeRestorationMaxForTarget(
  pending: AoeRestorationPending,
  allocation: Record<string, number>,
  actorId: string,
): number {
  const row = pending.targets.find((t) => t.actorId === actorId);
  if (!row) return 0;
  return Math.min(row.scarred, aoeRestorationPoolLeft(pending, allocation, actorId));
}

export function formatAoeRestorationPromptChat(pending: AoeRestorationPending): string {
  const power = escapeStoneChat(pending.powerName);
  const rows = pending.targets
    .map((t) => {
      const name = escapeStoneChat(t.name);
      const id = escapeStoneChat(t.actorId);
      return (
        `<li class="ms-aoe-rest-row" data-actor-id="${id}">` +
        `<span class="ms-aoe-rest-name"><strong>${name}</strong> — Scarred ${t.scarred}</span> ` +
        `<span class="ms-aoe-rest-stepper" data-actor-id="${id}" data-scarred="${t.scarred}">` +
        `<button type="button" class="ms-aoe-rest-dec" data-actor-id="${id}" aria-label="Fewer bars">−</button>` +
        `<span class="ms-aoe-rest-alloc" data-actor-id="${id}" data-value="0">0</span>` +
        `<button type="button" class="ms-aoe-rest-inc" data-actor-id="${id}" aria-label="More bars">+</button>` +
        `</span>` +
        `</li>`
      );
    })
    .join('');
  return (
    `<div class="mastery-aoe-restoration" data-pool="${pending.poolRemaining}" data-pool-max="${pending.poolMax}">` +
    `<p><strong>${power}</strong> — distribute Scarred Bar Restoration (allies in area).</p>` +
    `<p>Pool left: <strong class="ms-aoe-rest-pool-left">${pending.poolRemaining}</strong> / ${pending.poolMax}. ` +
    `One point = one full Scarred Bar on one creature.</p>` +
    `<ul class="ms-aoe-rest-list">${rows}</ul>` +
    `<p class="ms-aoe-rest-total">Allocated: <strong class="ms-aoe-rest-sum">0</strong></p>` +
    `<button type="button" class="ms-aoe-rest-commit" disabled><i class="fas fa-check"></i> Apply Restoration</button>` +
    `<button type="button" class="ms-aoe-rest-cancel">Cancel</button>` +
    `</div>`
  );
}

export async function commitAoeRestorationAllocation(
  caster: any,
  pending: AoeRestorationPending,
  allocation: Record<string, number>,
): Promise<{ ok: boolean; spent: number; results: Array<{ name: string; restored: number }>; reason?: string }> {
  const check = validateAoeRestorationAllocation(pending, allocation);
  if (!check.ok) return { ok: false, spent: 0, results: [], reason: check.reason };

  const g = globalThis as any;
  const results: Array<{ name: string; restored: number }> = [];
  let spent = 0;
  for (const t of pending.targets) {
    const want = check.cleaned[t.actorId] ?? 0;
    if (want <= 0) continue;
    let actor =
      g.game?.actors?.get?.(t.actorId) ||
      null;
    try {
      const tok = (g.canvas?.tokens?.placeables ?? []).find(
        (x: any) => String(x.id) === t.tokenId || String(x.document?.id) === t.tokenId,
      );
      if (tok?.actor) actor = tok.actor;
    } catch {
      /* ignore */
    }
    if (!actor) continue;
    const { restored } = await restoreScarredHealthBars(actor, want);
    if (restored > 0) {
      spent += restored;
      results.push({ name: String(actor.name || t.name), restored });
    }
  }
  if (spent > 0 && caster) {
    await spendHlrOnCaster(caster, pending.powerKey, spent);
  }
  return { ok: spent > 0, spent, results };
}

export function buildAoeRestorationPending(args: {
  caster: any;
  powerItem: any;
  powerName: string;
  targetTokens: any[];
}): AoeRestorationPending | null {
  const caster = args.caster;
  const powerItem = args.powerItem;
  if (!caster || !powerItem) return null;
  const poolRemaining = getHlrRemainingOnCaster(caster, powerItem);
  const poolMax = getPowerHlrPoolMax(powerItem);
  const targets: AoeRestorationTarget[] = [];
  for (const tok of args.targetTokens || []) {
    const actor = tok?.actor;
    if (!actor) continue;
    const scarred = countScarredHealthBars(actor);
    if (scarred <= 0) continue;
    targets.push({
      tokenId: String(tok.id || tok.document?.id || ''),
      actorId: String(actor.id || ''),
      name: String(actor.name || tok.name || 'Ally'),
      scarred,
    });
  }
  if (!targets.length || poolRemaining <= 0) return null;
  return {
    casterActorId: String(caster.id || ''),
    powerKey: healPowerHlrKey(powerItem),
    powerName: args.powerName,
    poolRemaining,
    poolMax,
    targets,
  };
}
