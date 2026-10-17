/**
 * Combat perception runtime hooks — stealth results, reveal, round/turn cleanup.
 */

import type { CombatSenseId } from './combat-senses.js';
import {
  clearPerceptionCombatEncounterState,
  clearPerceptionRoundState,
  clearPerceptionRoundUsage,
  getPerceptionCombatState,
  setPerceptionCombatState,
} from './perception-state.js';
import { syncInvisibilityFromPowers } from './invisibility-profile.js';

export interface InvisibilityVeilPreset {
  id: string;
  label: string;
  /** Covered senses (basic Invisibility). */
  blockedSenses: CombatSenseId[];
  /** Additional senses covered at higher veil levels. */
  elevatedBlockedSenses?: CombatSenseId[];
}

/** Named veil presets from the Players Guide (Silent Veil, Hollow Veil). */
export const INVISIBILITY_VEIL_PRESETS: Record<string, InvisibilityVeilPreset> = {
  silentVeil: {
    id: 'silentVeil',
    label: 'Silent Veil',
    blockedSenses: ['normalCombatAwareness', 'darkvision'],
    elevatedBlockedSenses: ['sonarSense', 'tremorSense'],
  },
  hollowVeil: {
    id: 'hollowVeil',
    label: 'Hollow Veil',
    blockedSenses: ['normalCombatAwareness', 'darkvision'],
    elevatedBlockedSenses: ['lifeSense', 'predatorSense', 'mageSense'],
  },
};

export function blockedSensesForVeil(presetId: string, elevated = false): CombatSenseId[] {
  const preset = INVISIBILITY_VEIL_PRESETS[presetId];
  if (!preset) return ['normalCombatAwareness', 'darkvision'];
  const out = [...preset.blockedSenses];
  if (elevated && preset.elevatedBlockedSenses?.length) {
    out.push(...preset.elevatedBlockedSenses);
  }
  return [...new Set(out)];
}

/** Apply a Stealth skill check result. Final Result becomes the Perception TN. */
export async function applyStealthRollResult(
  actor: any,
  result: { success: boolean; raises?: number; finalResult?: number },
): Promise<void> {
  if (!actor?.setFlag) return;
  const total = Math.max(0, Math.floor(Number(result.finalResult) || 0));
  if (result.success && total > 0) {
    await setPerceptionCombatState(actor, {
      hidden: true,
      stealthPerceptionTn: total,
      stealthRaiseBonus: 0,
    });
    return;
  }
  await setPerceptionCombatState(actor, {
    hidden: false,
    stealthPerceptionTn: 0,
    stealthRaiseBonus: 0,
  });
}

/** Ordinary Stealth hiding ends. Invisibility is left alone. */
export async function breakOrdinaryStealth(actor: any, _reason?: string): Promise<void> {
  if (!actor) return;
  const st = getPerceptionCombatState(actor);
  if (!st.hidden && !(st.stealthPerceptionTn ?? 0) && !(st.stealthRaiseBonus ?? 0)) return;
  await setPerceptionCombatState(actor, {
    hidden: false,
    stealthPerceptionTn: 0,
    stealthRaiseBonus: 0,
  });
}

/** @deprecated Cloak Disruption removed — attacking no longer reveals Invisibility. */
export async function applyAttackCloakDisruption(_attacker: any): Promise<void> {
  /* no-op */
}

/** @deprecated Cloak Disruption removed — movement no longer lowers Invisibility Bonus. */
export async function applyMovementCloakDisruption(_actor: any, _totalMovedM: number): Promise<void> {
  /* no-op */
}

async function forEachCombatActor(
  cb: (actor: any) => Promise<void>,
  combat?: any,
): Promise<void> {
  const c = combat ?? (globalThis as any).game?.combat;
  if (!c) return;
  const combatants = c.combatants ?? [];
  for (const entry of combatants) {
    const actor = entry?.actor;
    if (actor) await cb(actor);
  }
}

/** New Round: Perception attempts and Stealth-spent TN bonus. */
export async function clearPerceptionUsageForNewRound(combat?: any): Promise<void> {
  await forEachCombatActor(async (actor) => {
    await clearPerceptionRoundState(actor);
  }, combat);
}

/**
 * Combat end / new encounter: wipe attempt flags, locate results, stealth spend,
 * and Hidden-from-Stealth — then re-sync Invisibility from powers.
 */
export async function resetPerceptionForCombatEnd(combat?: any): Promise<void> {
  const c = combat ?? (globalThis as any).game?.combat;
  const actors = new Set<any>();
  await forEachCombatActor(async (actor) => {
    actors.add(actor);
  }, c);
  // Unlinked token actors live on the Token, not in game.actors — that was the
  // stale perceptionUsedVs hang after shutdown/restart.
  try {
    const placeables: any[] =
      (globalThis as any).canvas?.tokens?.placeables ??
      (globalThis as any).canvas?.tokens?.ownedTokens ??
      [];
    for (const t of placeables) {
      if (t?.actor) actors.add(t.actor);
    }
  } catch {
    /* best-effort */
  }
  // Also sweep world actors that still carry a stale perceptionCombat flag
  // (deleteCombat can drop combatant.actor before hooks finish).
  try {
    const col = (globalThis as any).game?.actors;
    const list: any[] = col
      ? Array.isArray(col)
        ? col
        : Array.isArray(col.contents)
          ? col.contents
          : typeof col[Symbol.iterator] === 'function'
            ? Array.from(col)
            : []
      : [];
    for (const actor of list) {
      const raw =
        actor?.getFlag?.('mastery-system', 'perceptionCombat') ??
        actor?.flags?.['mastery-system']?.perceptionCombat;
      if (raw && typeof raw === 'object') actors.add(actor);
    }
  } catch {
    /* best-effort */
  }
  for (const actor of actors) {
    try {
      await clearPerceptionCombatEncounterState(actor);
      await syncInvisibilityFromPowers(actor);
    } catch (err) {
      console.warn('Mastery System | perception combat-end reset failed', actor?.name, err);
    }
  }
}

/**
 * Start of this creature's turn: sync Invisibility profile; clear *their*
 * Perception attempt flags so they may try once vs each invisible target again.
 */
export async function processPerceptionTurnStart(actor: any): Promise<void> {
  if (!actor) return;
  await clearPerceptionRoundUsage(actor);
  const profile = await syncInvisibilityFromPowers(actor);
  await setPerceptionCombatState(actor, {
    invisibilityBonus: profile.baseBonus,
    blockedSenses: profile.blockedSenses,
  });
}

/** Sync every combatant when combat begins so Passive Invisibility is live immediately. */
export async function syncAllCombatantInvisibility(combat?: any): Promise<void> {
  const c = combat ?? (globalThis as any).game?.combat;
  if (!c) return;
  for (const combatant of c.combatants ?? []) {
    const actor = combatant?.actor;
    if (actor) await syncInvisibilityFromPowers(actor);
  }
}

/** Register Foundry hooks for perception combat bookkeeping. */
export function registerPerceptionCombatHooks(): void {
  const Hooks = (globalThis as any).Hooks;
  if (!Hooks?.on) return;

  let lastRound = 0;

  Hooks.on('combatStart', async (combat: any) => {
    try {
      lastRound = Math.max(0, Math.floor(Number(combat?.round) || 1));
      // Wipe leftovers from the previous fight first (tokens often keep flags).
      await resetPerceptionForCombatEnd(combat);
      await syncAllCombatantInvisibility(combat);
      await clearPerceptionUsageForNewRound(combat);
    } catch (err) {
      console.error('Mastery System | perception combatStart invisibility sync failed', err);
    }
  });

  Hooks.on('updateCombat', async (combat: any, changes: any) => {
    try {
      const round = Math.max(0, Math.floor(Number(combat?.round) || 0));
      if (round > 0 && round !== lastRound) {
        lastRound = round;
        await clearPerceptionUsageForNewRound(combat);
      }
      if (changes?.turn !== undefined || changes?.combatant !== undefined) {
        const actor = combat?.combatant?.actor;
        if (actor) await processPerceptionTurnStart(actor);
      }
    } catch (err) {
      console.error('Mastery System | perception combat updateCombat hook failed', err);
    }
  });

  Hooks.on('updateItem', async (item: any) => {
    try {
      if (item?.type !== 'power') return;
      const tid = String(item.system?.templateId || '');
      if (tid !== 'passive-invisibility' && tid !== 'ab-invisibility') return;
      const actor = item.parent ?? item.actor;
      if (actor) await syncInvisibilityFromPowers(actor);
    } catch (err) {
      console.error('Mastery System | invisibility updateItem sync failed', err);
    }
  });

  Hooks.on('createItem', async (item: any) => {
    try {
      if (item?.type !== 'power') return;
      const tid = String(item.system?.templateId || '');
      if (tid !== 'passive-invisibility' && tid !== 'ab-invisibility') return;
      const actor = item.parent ?? item.actor;
      if (actor) await syncInvisibilityFromPowers(actor);
    } catch (err) {
      console.error('Mastery System | invisibility createItem sync failed', err);
    }
  });

  Hooks.on('combatEnd', async (combat: any) => {
    lastRound = 0;
    try {
      await resetPerceptionForCombatEnd(combat);
    } catch (err) {
      console.error('Mastery System | perception combatEnd reset failed', err);
    }
  });

  Hooks.on('deleteCombat', async (combat: any) => {
    lastRound = 0;
    try {
      await resetPerceptionForCombatEnd(combat);
    } catch (err) {
      console.error('Mastery System | perception deleteCombat reset failed', err);
    }
  });

  // Health-bar changes can suppress / restore Invisibility (Incapacitated).
  Hooks.on('updateActor', async (actor: any, changes: any) => {
    try {
      if (!actor || !changes?.system?.health) return;
      await syncInvisibilityFromPowers(actor);
    } catch (err) {
      console.error('Mastery System | invisibility health sync failed', err);
    }
  });
}
