/**
 * Combat perception runtime hooks — stealth results, cloak disruption, round/turn cleanup.
 */

import type { CombatSenseId } from './combat-senses.js';
import {
  applyCloakDisruption,
  computeStealthRaiseBonus,
  getPerceptionCombatState,
  resetInvisibilityAtTurnStart,
  setPerceptionCombatState,
  clearPerceptionRoundUsage,
} from './perception-state.js';

export interface InvisibilityVeilPreset {
  id: string;
  label: string;
  /** Base blocked senses (basic Invisibility). */
  blockedSenses: CombatSenseId[];
  /** Additional senses blocked at higher veil levels. */
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

/** Apply a Stealth skill check result to the rolling actor's perception combat state. */
export async function applyStealthRollResult(
  actor: any,
  result: { success: boolean; raises?: number },
): Promise<void> {
  if (!actor?.setFlag) return;
  const raises = Math.max(0, Math.floor(Number(result.raises) || 0));
  if (result.success) {
    await setPerceptionCombatState(actor, {
      hidden: true,
      stealthRaiseBonus: computeStealthRaiseBonus(raises),
    });
    return;
  }
  await setPerceptionCombatState(actor, {
    hidden: false,
    stealthRaiseBonus: 0,
  });
}

/** Cloak Disruption reductions per rules table. */
export async function applyAttackCloakDisruption(attacker: any): Promise<void> {
  if (!attacker) return;
  const st = getPerceptionCombatState(attacker);
  const inv = st.invisibilityBonus ?? st.currentInvisibilityBonus;
  if (inv === undefined && st.currentInvisibilityBonus === undefined) return;
  const next = applyCloakDisruption(st, 4);
  await setPerceptionCombatState(attacker, next);
}

export async function applyMovementCloakDisruption(actor: any, totalMovedM: number): Promise<void> {
  if (!actor || totalMovedM <= 3) return;
  const st = getPerceptionCombatState(actor);
  const inv = st.invisibilityBonus ?? st.currentInvisibilityBonus;
  if (inv === undefined && st.currentInvisibilityBonus === undefined) return;
  const extraM = Math.max(0, totalMovedM - 3);
  const reduction = Math.floor(extraM / 4) * 4;
  if (reduction <= 0) return;
  const next = applyCloakDisruption(st, reduction);
  await setPerceptionCombatState(actor, next);
}

async function forEachCombatActor(cb: (actor: any) => Promise<void>): Promise<void> {
  const combat = (globalThis as any).game?.combat;
  if (!combat?.started) return;
  const combatants = combat.combatants ?? [];
  for (const c of combatants) {
    const actor = c?.actor;
    if (actor) await cb(actor);
  }
}

/** One Perception check per hidden/invisible target per round — reset on new round. */
export async function clearPerceptionUsageForNewRound(): Promise<void> {
  await forEachCombatActor(async (actor) => {
    await clearPerceptionRoundUsage(actor);
  });
}

/** Restore current Invisibility Bonus at the start of the creature's turn. */
export async function processPerceptionTurnStart(actor: any): Promise<void> {
  if (!actor) return;
  await resetInvisibilityAtTurnStart(actor);
}

/** Register Foundry hooks for perception combat bookkeeping. */
export function registerPerceptionCombatHooks(): void {
  const Hooks = (globalThis as any).Hooks;
  if (!Hooks?.on) return;

  let lastRound = 0;

  Hooks.on('updateCombat', async (combat: any, changes: any) => {
    try {
      const round = Math.max(0, Math.floor(Number(combat?.round) || 0));
      if (changes?.round !== undefined && round > 0 && round !== lastRound) {
        lastRound = round;
        await clearPerceptionUsageForNewRound();
      }
      if (changes?.turn !== undefined) {
        const actor = combat?.combatant?.actor;
        if (actor) await processPerceptionTurnStart(actor);
      }
    } catch (err) {
      console.error('Mastery System | perception combat updateCombat hook failed', err);
    }
  });

  Hooks.on('combatEnd', async () => {
    lastRound = 0;
  });
}
