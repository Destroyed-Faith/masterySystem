/**
 * Player-side encounter setup: Passives → Stones (Initiative Exchange).
 * Opens on first scene/combat load after the GM started the encounter.
 * Closing with ✕ leaves the step pending; it does not lock or confirm.
 * A per-session dismiss set prevents the same dialog from immediately
 * reopening after ✕; Join Game As / reload starts a new session.
 */

import {
  ENCOUNTER_SOCKET,
  canCurrentUserUpdateDocument,
  resolveLiveCombat,
  shouldShowEncounterDialogLocally,
} from './combat-permissions.js';
import { isPassiveSelectionLocked, persistCombatantSetupStep } from './encounter-setup-flags.js';

const dismissedThisSession = new Set<string>();
let pipelineRunning = false;
let pipelineQueued = false;

function stepKey(combatId: string, actorId: string, step: string, round?: number): string {
  return round == null ? `${combatId}:${actorId}:${step}` : `${combatId}:${actorId}:${step}:${round}`;
}

export function clearPlayerEncounterSetupSession(): void {
  dismissedThisSession.clear();
  pipelineRunning = false;
  pipelineQueued = false;
}

function dialogAlreadyOpen(id: string): boolean {
  const instances = (foundry as any)?.applications?.instances;
  const existing = instances?.get?.(id);
  if (!existing) return false;
  try {
    existing.bringToFront?.();
  } catch {
    /* ignore */
  }
  return true;
}

/**
 * Resume pending setup for every locally owned PC in the active encounter.
 */
export async function resumePlayerEncounterSetup(combat?: Combat | null): Promise<void> {
  if (pipelineRunning) {
    pipelineQueued = true;
    return;
  }
  if (typeof game === 'undefined' || !game.user) return;

  const live = resolveLiveCombat(combat ?? game.combat);
  if (!live) return;

  const { getEncounterSetup } = await import('./encounter-start.js');
  const setup = getEncounterSetup(live);
  if (!setup.started && !(live as any).started) return;

  const pcs = Array.from(live.combatants).filter(
    (c: any) => c.actor?.type === 'character' && shouldShowEncounterDialogLocally(c.actor),
  ) as Combatant[];
  if (!pcs.length) return;

  pipelineRunning = true;
  try {
    for (const pc of pcs) {
      await runSetupForCombatant(live, pc);
    }
  } finally {
    pipelineRunning = false;
    if (pipelineQueued) {
      pipelineQueued = false;
      void resumePlayerEncounterSetup(live);
    }
  }
}

async function runSetupForCombatant(combat: Combat, combatant: Combatant): Promise<void> {
  const actor = combatant.actor;
  if (!actor?.id) return;

  const { handlePassiveSelectionComplete } = await import('./encounter-start.js');
  const combatId = String(combat.id);
  const actorId = String(actor.id);
  const round = Math.max(1, Number(combat.round) || 1);

  if (round <= 1 && !isPassiveSelectionLocked(combat, actorId)) {
    if (dismissedThisSession.has(stepKey(combatId, actorId, 'passives'))) return;
    if (dialogAlreadyOpen('mastery-passive-selection')) return;

    const { PassiveSelectionDialog } = await import('../sheets/passive-selection-dialog.js');
    const outcome = await PassiveSelectionDialog.showForCombatant(combatant, false);
    if (outcome.alreadyOpen) return;
    if (!outcome.confirmed) {
      dismissedThisSession.add(stepKey(combatId, actorId, 'passives'));
      return;
    }
    try {
      await handlePassiveSelectionComplete(combat, actorId, {});
    } catch (err) {
      console.error('Mastery System | Could not persist passive confirmation', err);
    }
    // Players cannot write Combat flags; the GM socket applies the lock. Continue locally.
  }

  const { isStonePowersDone } = await import('./stone-round-gate.js');
  const { handleStonePowersComplete } = await import('./stone-powers-flow.js');
  if (!isStonePowersDone(combat, combatant.id, round)) {
    if (dismissedThisSession.has(stepKey(combatId, actorId, 'stones', round))) return;
    if (dialogAlreadyOpen('mastery-stone-powers')) return;

    if (round > 1) {
      try {
        const { syncStonePoolCapsFromAttributes } = await import('./action-economy.js');
        if (canCurrentUserUpdateDocument(actor)) {
          await syncStonePoolCapsFromAttributes(actor);
        }
      } catch (err) {
        console.warn('Mastery System | Could not sync stone pools for the new round', err);
      }
    }

    const { StonePowersDialog } = await import('../stones/stone-powers-dialog.js');
    const confirmed = await StonePowersDialog.showForActor(actor, combatant);
    if (!confirmed) {
      dismissedThisSession.add(stepKey(combatId, actorId, 'stones', round));
      return;
    }
    await persistCombatantSetupStep(combatant, combat, { stonesDoneRound: round });
    if (game.user?.isGM) {
      await handleStonePowersComplete(combat, combatant.id, round);
    } else {
      game.socket?.emit(ENCOUNTER_SOCKET, {
        type: 'stonePowersComplete',
        combatId: combat.id,
        combatantId: combatant.id,
        round,
      });
    }
  }
}
