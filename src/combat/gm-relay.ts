/**
 * Player → GM relays for writes Foundry only accepts from a GM
 * (combat turns, NPC/unlinked-target actor updates).
 */

import { ENCOUNTER_SOCKET, canCurrentUserUpdateDocument, hasActiveGm } from './combat-permissions.js';

const pending = new Map<string, (ok: boolean) => void>();

export function settleGmRelay(requestId: string, ok: boolean): void {
  const fn = pending.get(requestId);
  if (!fn) return;
  pending.delete(requestId);
  fn(!!ok);
}

function newRequestId(): string {
  return `gm-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}

async function askGm(payload: Record<string, unknown>): Promise<boolean> {
  const g = globalThis as any;
  if (!g.game?.socket) return false;
  if (!hasActiveGm()) {
    g.ui?.notifications?.warn?.('Kein GM verbunden — Änderung nicht möglich.');
    return false;
  }
  const requestId = newRequestId();
  const replyTo = String(g.game.user?.id || '');
  return await new Promise<boolean>((resolve) => {
    const timer = setTimeout(() => {
      pending.delete(requestId);
      resolve(false);
    }, 8000);
    pending.set(requestId, (ok) => {
      clearTimeout(timer);
      resolve(ok);
    });
    g.game.socket.emit(ENCOUNTER_SOCKET, { ...payload, requestId, replyTo });
  });
}

/** Keys a player may ask the GM to write onto a target actor. */
export function isRelayableActorUpdate(update: unknown): boolean {
  if (!update || typeof update !== 'object' || Array.isArray(update)) return false;
  const keys = Object.keys(update as object);
  if (!keys.length) return false;
  return keys.every(
    (k) =>
      k === 'system.health' ||
      k.startsWith('system.health.') ||
      k === 'system.statusEffects' ||
      k.startsWith('system.statusEffects.') ||
      k === 'system.phases' ||
      k.startsWith('system.phases.') ||
      k === 'system.npcActivePhaseIndex' ||
      k.startsWith('flags.mastery-system.'),
  );
}

export async function updateActorViaGm(
  actor: any,
  update: Record<string, unknown>,
  options?: Record<string, unknown>,
): Promise<void> {
  if (!actor) return;
  const g = globalThis as any;
  if (canCurrentUserUpdateDocument(actor) || typeof g.game === 'undefined' || !g.game?.user) {
    await actor.update(update, options);
    return;
  }
  if (!isRelayableActorUpdate(update)) {
    console.warn('Mastery System | Refusing non-relayable actor update', Object.keys(update));
    return;
  }
  const ok = await askGm({
    type: 'gmActorUpdate',
    actorId: String(actor.id || ''),
    tokenActorUuid: String(actor.uuid || ''),
    update,
    options: options ?? {},
  });
  if (!ok) {
    throw new Error('GM actor update failed or timed out');
  }
}

export async function requestCombatNextTurn(): Promise<boolean> {
  const g = globalThis as any;
  const combat = g.game?.combat;
  if (!combat) return false;
  const user = g.game?.user;
  if (user?.isGM) {
    await combat.nextTurn();
    return true;
  }
  return askGm({ type: 'gmNextTurn', combatId: combat.id });
}

/**
 * Yield to the next combatant: set this initiative just below theirs, then advance.
 * Returns false when already last in the round.
 */
export function initiativeAfterDelay(nextInitiative: number): number {
  const next = Number(nextInitiative);
  if (!Number.isFinite(next)) return next;
  return Math.round((next - 0.01) * 100) / 100;
}

export async function requestDelayInitiative(): Promise<boolean> {
  const g = globalThis as any;
  const combat = g.game?.combat;
  if (!combat?.combatant) return false;
  const turns: any[] = Array.isArray(combat.turns) ? combat.turns : [];
  const idx = turns.findIndex((c) => c?.id === combat.combatant.id);
  const next = idx >= 0 ? turns[idx + 1] : null;
  if (!next || next.initiative == null || !Number.isFinite(Number(next.initiative))) {
    g.ui?.notifications?.info?.('Initiative verzögern: du bist bereits der letzte in der Runde.');
    return false;
  }
  const initiative = initiativeAfterDelay(Number(next.initiative));
  if (g.game.user?.isGM) {
    await combat.combatant.update({ initiative });
    await combat.nextTurn();
    return true;
  }
  return askGm({
    type: 'gmDelayInitiative',
    combatId: combat.id,
    combatantId: combat.combatant.id,
    initiative,
  });
}
