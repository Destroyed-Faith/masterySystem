/**
 * Boss NPC phase advance — when the active phase Health pool hits 0, load the
 * next phase's Health and set npcActivePhaseIndex (Players Guide: a phase has
 * one Health pool; at 0 the creature dies or enters the next phase).
 */

import {
  coerceNpcPhasesArray,
  ensureNpcHealthState,
  npcHealthHasBars,
} from '../utils/npc-attack-model.js';

function dup<T>(v: T): T {
  return JSON.parse(JSON.stringify(v ?? null));
}

/** True when every health bar is at 0 (or there are no bars). */
export function isNpcHealthPoolDepleted(health: unknown): boolean {
  const state = ensureNpcHealthState(health);
  if (!state.bars.length) return true;
  return state.bars.every((b) => Math.floor(Number(b.current) || 0) <= 0);
}

export interface NpcPhaseAdvanceResult {
  fromIndex: number;
  toIndex: number;
  fromName: string;
  toName: string;
  /** True when there was no further phase (boss stays at 0 HP). */
  defeated: boolean;
}

function phaseDisplayName(phase: any, index: number): string {
  const n = String(phase?.name || '').trim();
  return n || `Phase ${index + 1}`;
}

/**
 * Build an actor update that activates `toIndex`: persist current live HP into
 * the old phase, copy the next phase's HP into root health, set active index.
 */
export function buildNpcPhaseActivatePatch(
  actor: any,
  toIndex: number,
  opts?: { persistCurrentHealth?: boolean },
): Record<string, unknown> | null {
  const system = actor?.system;
  if (!system) return null;
  const type = String(actor?.type || '');
  if (type !== 'npc') return null;

  const previousRaw = system.phases;
  const phases = dup(coerceNpcPhasesArray(previousRaw));
  if (phases.length < 2) return null;

  const fromIndex = Math.max(
    0,
    Math.min(phases.length - 1, Math.floor(Number(system.npcActivePhaseIndex) || 0)),
  );
  const next = Math.max(0, Math.min(phases.length - 1, Math.floor(Number(toIndex))));
  if (next === fromIndex) return null;
  if (!phases[next]) return null;

  if (opts?.persistCurrentHealth !== false) {
    phases[fromIndex] = {
      ...(phases[fromIndex] || {}),
      health: ensureNpcHealthState(system.health),
    };
  }

  const nextHealth = npcHealthHasBars(phases[next].health)
    ? ensureNpcHealthState(dup(phases[next].health))
    : ensureNpcHealthState(undefined);

  const patch: Record<string, unknown> = {
    'system.phases': phases,
    'system.npcActivePhaseIndex': next,
    'system.health': nextHealth,
  };
  return patch;
}

/**
 * After damage: if this is a multi-phase boss and the live Health pool is empty,
 * advance to the next phase with a fresh Health pool. No-op on last phase.
 */
export async function maybeAdvanceNpcBossPhase(actor: any): Promise<NpcPhaseAdvanceResult | null> {
  if (!actor || String(actor.type || '') !== 'npc') return null;
  const system = actor.system;
  const phases = coerceNpcPhasesArray(system?.phases);
  if (phases.length < 2) return null;
  if (!isNpcHealthPoolDepleted(system?.health)) return null;

  const fromIndex = Math.max(
    0,
    Math.min(phases.length - 1, Math.floor(Number(system.npcActivePhaseIndex) || 0)),
  );
  if (fromIndex >= phases.length - 1) {
    return {
      fromIndex,
      toIndex: fromIndex,
      fromName: phaseDisplayName(phases[fromIndex], fromIndex),
      toName: phaseDisplayName(phases[fromIndex], fromIndex),
      defeated: true,
    };
  }

  const toIndex = fromIndex + 1;
  const patch = buildNpcPhaseActivatePatch(actor, toIndex, { persistCurrentHealth: true });
  if (!patch) return null;

  await actor.update(patch);

  const result: NpcPhaseAdvanceResult = {
    fromIndex,
    toIndex,
    fromName: phaseDisplayName(phases[fromIndex], fromIndex),
    toName: phaseDisplayName(phases[toIndex], toIndex),
    defeated: false,
  };

  try {
    const g = globalThis as any;
    await g.ChatMessage?.create?.({
      user: g.game?.user?.id,
      speaker: g.ChatMessage?.getSpeaker?.({ actor }),
      content:
        `<p class="mastery-phase-advance"><strong>${String(actor.name || 'Boss')}</strong>: ` +
        `<em>${result.fromName}</em> → <strong>${result.toName}</strong> ` +
        `(neues Health-Pool).</p>`,
    });
  } catch {
    /* chat is best-effort */
  }

  return result;
}

/**
 * Manual phase-tab activation. Always sets the active index. When live HP is
 * already depleted and the clicked phase still has HP, also load that pool
 * (GM safety net if auto-advance was missed).
 */
export async function activateNpcBossPhaseFromSheet(
  actor: any,
  toIndex: number,
): Promise<NpcPhaseAdvanceResult | null> {
  if (!actor || String(actor.type || '') !== 'npc') return null;
  const system = actor.system;
  const phases = coerceNpcPhasesArray(system?.phases);
  if (!phases.length) return null;

  const fromIndex = Math.max(
    0,
    Math.min(phases.length - 1, Math.floor(Number(system.npcActivePhaseIndex) || 0)),
  );
  const next = Math.max(0, Math.min(phases.length - 1, Math.floor(Number(toIndex))));
  if (next === fromIndex) return null;

  const rootDepleted = isNpcHealthPoolDepleted(system.health);
  const targetHasHp =
    npcHealthHasBars(phases[next]?.health) && !isNpcHealthPoolDepleted(phases[next].health);

  if (rootDepleted && targetHasHp) {
    const patch = buildNpcPhaseActivatePatch(actor, next, { persistCurrentHealth: true });
    if (!patch) return null;
    await actor.update(patch);
    return {
      fromIndex,
      toIndex: next,
      fromName: phaseDisplayName(phases[fromIndex], fromIndex),
      toName: phaseDisplayName(phases[next], next),
      defeated: false,
    };
  }

  await actor.update({ 'system.npcActivePhaseIndex': next });
  return {
    fromIndex,
    toIndex: next,
    fromName: phaseDisplayName(phases[fromIndex], fromIndex),
    toName: phaseDisplayName(phases[next], next),
    defeated: false,
  };
}
