/**
 * Surprise status marks a creature as unaware for contests.
 * Round-1 Surprise Priority is a separate flag and does not change Initiative.
 */

import {
  hasActiveSpecial,
  coerceStatusEffectsArray,
  readActorStatusEffects,
  statusEntryId,
} from '../system/active-specials.js';

export const SURPRISE_STATUS_ID = 'surprise';

function statusIdOf(raw: unknown): string {
  if (typeof raw === 'string') return raw.trim().toLowerCase();
  if (!raw || typeof raw !== 'object') return '';
  const rec = raw as { id?: string; name?: string };
  return String(rec.id || rec.name || '').trim().toLowerCase();
}

/** True when an ActiveEffect / status document is the Surprise condition. */
export function effectCarriesSurprise(effect: any): boolean {
  if (!effect) return false;
  const statuses = effect.statuses ?? effect.system?.statuses;
  if (statuses?.has?.(SURPRISE_STATUS_ID)) return true;
  if (Array.isArray(statuses)) {
    if (statuses.some((s) => statusIdOf(s) === SURPRISE_STATUS_ID)) return true;
  } else if (statuses && typeof statuses === 'object') {
    for (const key of Object.keys(statuses)) {
      if (key.toLowerCase() === SURPRISE_STATUS_ID) return true;
    }
  }
  const coreId = String(effect.flags?.core?.statusId ?? '').trim().toLowerCase();
  if (coreId === SURPRISE_STATUS_ID) return true;
  const name = String(effect.name ?? effect.label ?? '').trim().toLowerCase();
  return name === 'surprise' || name === 'surprised';
}

export function statusListHasSurprise(raw: unknown): boolean {
  return coerceStatusEffectsArray(raw).some((entry) => {
    const id = statusEntryId(entry) || statusIdOf(entry);
    return id === SURPRISE_STATUS_ID || id === 'surprised';
  });
}

/** Token HUD (`actor.statuses` / effects) or the sheet `system.statusEffects` list. */
export function actorHasSurprise(actor: any): boolean {
  if (!actor) return false;
  if (hasActiveSpecial(actor, SURPRISE_STATUS_ID)) return true;
  if (statusListHasSurprise(readActorStatusEffects(actor))) return true;

  const statuses = actor.statuses;
  if (statuses?.has?.(SURPRISE_STATUS_ID)) return true;
  if (statuses && typeof statuses[Symbol.iterator] === 'function' && typeof statuses.has !== 'function') {
    for (const entry of statuses) {
      const id = statusIdOf(entry);
      if (id === SURPRISE_STATUS_ID || id === 'surprised') return true;
    }
  } else if (statuses && typeof statuses.forEach === 'function') {
    let found = false;
    statuses.forEach((entry: unknown) => {
      const id = statusIdOf(entry);
      if (id === SURPRISE_STATUS_ID || id === 'surprised') found = true;
    });
    if (found) return true;
  }

  const effects = actor.effects;
  const list: any[] = effects?.contents
    ? effects.contents
    : effects && typeof effects[Symbol.iterator] === 'function'
      ? Array.from(effects)
      : [];
  return list.some((effect) => effectCarriesSurprise(effect));
}

/**
 * The old Surprise status halved Evade. Core v0.9.9.5 does not.
 * The score passes through. `surprised` stays in the signature so older callers compile.
 */
export function evadeAfterSurprise(evade: number, _surprised: boolean): number {
  return Math.max(0, Math.floor(Number(evade) || 0));
}

function combatantList(combat: any): any[] {
  const bag = combat?.combatants;
  if (!bag) return [];
  if (Array.isArray(bag.contents)) return bag.contents;
  if (typeof bag.values === 'function') return Array.from(bag.values());
  if (typeof bag[Symbol.iterator] === 'function') return Array.from(bag);
  return [];
}

export function combatantsForActor(combat: any, actor: any): any[] {
  if (!combat || !actor) return [];
  const actorId = String(actor.id ?? '');
  const baseId = String(actor._id ?? actor.id ?? '');
  const tokenId = String(actor.token?.id ?? actor.token?.document?.id ?? '');
  return combatantList(combat).filter((c) => {
    if (actorId && String(c.actor?.id ?? '') === actorId) return true;
    if (baseId && String(c.actorId ?? '') === baseId) return true;
    if (tokenId && String(c.tokenId ?? '') === tokenId) return true;
    return false;
  });
}

/**
 * Surprise (Round 1): the unaware target acts last. Initiative Score unchanged.
 */
/** Round 1, or before combat has started, and only against an unaware target. */
export function surprisePriorityShouldGrant(opts: {
  combatStarted: boolean;
  round: number;
  targetUnaware: boolean;
}): boolean {
  if (!opts.targetUnaware) return false;
  if (!opts.combatStarted) return true;
  return Math.floor(Number(opts.round) || 1) <= 1;
}

/** Attack against an unaware creature at the start of a fight. Initiative numbers stay put. */
export async function applySurprisePriorityForAttack(attacker: any, target: any, combat: any): Promise<boolean> {
  const { detectTargetUnaware } = await import('../contests/contest-card.js');
  const unaware = await detectTargetUnaware(attacker, target);
  const grant = surprisePriorityShouldGrant({
    combatStarted: combat?.started === true,
    round: Number(combat?.round) || 1,
    targetUnaware: unaware,
  });
  if (grant) await grantSurprisePriority(attacker, true, target, combat);
  return grant;
}

/**
 * Mark the target combatant(s) as surprised for Round 1 (act last).
 * Initiative scores are unchanged. `actor` is the ambusher (legacy flag marker).
 */
export async function grantSurprisePriority(
  actor: any,
  enabled = true,
  target?: any,
  combatArg?: any,
): Promise<void> {
  const combat = combatArg ?? (globalThis as any).game?.combat;
  if (!enabled) {
    await actor?.unsetFlag?.('mastery-system', 'surprisePriority');
    if (!combat || !target) return;
    try {
      const { readSurprisedCombatantIds, writeSurprisedCombatantIds, applySurpriseOrderToCombat } =
        await import('./surprise-order.js');
      const remove = new Set(combatantsForActor(combat, target).map((c) => String(c.id)));
      const next = readSurprisedCombatantIds(combat).filter((id) => !remove.has(id));
      await writeSurprisedCombatantIds(combat, next);
      await applySurpriseOrderToCombat(combat);
    } catch (err) {
      console.warn('Mastery System | Surprise clear failed', err);
    }
    return;
  }
  // Legacy UI marker on the ambusher (ordering uses combat surprisedIds).
  if (actor?.setFlag) await actor.setFlag('mastery-system', 'surprisePriority', true);
  if (!combat) return;
  try {
    const targets = target ? combatantsForActor(combat, target) : [];
    if (targets.length) {
      const { markCombatantsSurprised } = await import('./surprise-order.js');
      const result = await markCombatantsSurprised(
        combat,
        targets.map((c) => String(c.id)),
      );
      if (!result.ok) {
        console.warn('Mastery System | Surprise mark rejected', result.error);
      }
      return;
    }
    const { applySurpriseOrderToCombat } = await import('./surprise-order.js');
    await applySurpriseOrderToCombat(combat);
  } catch (err) {
    console.warn('Mastery System | Surprise reorder failed', err);
  }
}

/**
 * Retired. Surprise no longer pins Initiative at 0 or halves Evade.
 * Round-1 order is Surprise Priority (`grantSurprisePriority`).
 */
export async function pinSurprisedInitiative(_actor?: any, _combat?: any): Promise<void> {
  return;
}
