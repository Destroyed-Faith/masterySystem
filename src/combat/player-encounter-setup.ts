/**
 * Player-side encounter setup: apply default Passives, then open Stones
 * (Initiative Exchange + Passives button). Closing Stones with ✕ leaves
 * that step pending. A per-session dismiss set prevents the same dialog
 * from immediately reopening after ✕; Join Game As / reload starts a new session.
 */

import {
  ENCOUNTER_SOCKET,
  canCurrentUserUpdateDocument,
  resolveLiveCombat,
  shouldShowEncounterDialogLocally,
} from './combat-permissions.js';
import { isPassiveSelectionLocked, persistCombatantSetupStep } from './encounter-setup-flags.js';
import {
  clearStonePowersSession,
  dismissStonePowersPrompt,
  isStonePowersDismissed,
  logStonePowersGate,
  stonePowersReopenBlocked,
} from './stone-powers-session.js';

let pipelineRunning = false;
let pipelineQueued = false;

export function clearPlayerEncounterSetupSession(): void {
  clearStonePowersSession();
  pipelineRunning = false;
  pipelineQueued = false;
}

export { dismissStonePowersPrompt };

function dialogAlreadyOpen(id: string): boolean {
  const instances = (foundry as any)?.applications?.instances;
  const existing = instances?.get?.(id);
  if (!existing) return false;
  // Closing counts as "busy" — resume must NOT open a second instance mid-close.
  try {
    if ((existing as any).state?.closing || (existing as any).closing) return true;
    if ((existing as any).rendered === false) return false;
  } catch {
    /* ignore */
  }
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

/** @internal Exported for pipeline tests. */
export async function runPlayerSetupForCombatant(combat: Combat, combatant: Combatant): Promise<void> {
  return runSetupForCombatant(combat, combatant);
}

async function runSetupForCombatant(combat: Combat, combatant: Combatant): Promise<void> {
  const actor = combatant.actor;
  if (!actor?.id) return;

  const { handlePassiveSelectionComplete } = await import('./encounter-start.js');
  const combatId = String(combat.id);
  const actorId = String(actor.id);
  const round = Math.max(1, Number(combat.round) || 1);

  if (round <= 1 && !(combat as any).started) {
    try {
      const { refillStonePoolsFromAttributes } = await import('./action-economy.js');
      if (canCurrentUserUpdateDocument(actor)) {
        await refillStonePoolsFromAttributes(actor);
      }
    } catch (err) {
      console.warn('Mastery System | Round-1 stone refill during setup failed', err);
    }
  }

  if (round <= 1 && !isPassiveSelectionLocked(combat, actorId)) {
    try {
      const { ensureDefaultPassiveSlots } = await import('../powers/passives.js');
      if (canCurrentUserUpdateDocument(actor)) {
        await ensureDefaultPassiveSlots(actor);
      }
      await handlePassiveSelectionComplete(combat, actorId, {});
    } catch (err) {
      console.error('Mastery System | Could not apply default passives', err);
    }
  }

  const { isStonePowersDone } = await import('./stone-round-gate.js');
  const { handleStonePowersComplete } = await import('./stone-powers-flow.js');
  if (!isStonePowersDone(combat, combatant.id, round)) {
    if (stonePowersReopenBlocked()) {
      logStonePowersGate('resume-blocked-reopen', { combatId, actorId, round });
      return;
    }
    if (isStonePowersDismissed(combatId, actorId, round, combatant.id)) {
      logStonePowersGate('resume-blocked-dismissed', { combatId, actorId, round });
      return;
    }
    if (dialogAlreadyOpen('mastery-stone-powers')) {
      logStonePowersGate('resume-blocked-already-open', { combatId, actorId, round });
      return;
    }

    if (round > 1) {
      try {
        const { syncStonePoolCapsFromAttributes } = await import('./action-economy.js');
        if (canCurrentUserUpdateDocument(actor)) {
          await syncStonePoolCapsFromAttributes(actor);
        }
      } catch (err) {
        console.warn('Mastery System | Could not sync stone pools for the new round', err);
      }
      // Stone Recovery lives inside the Stone Powers dialog from here on: it
      // opens locked on the recovery step and unlocks the powers afterwards.
    }

    const { StonePowersDialog } = await import('../stones/stone-powers-dialog.js');
    const confirmed = await StonePowersDialog.showForActor(actor, combatant);
    if (!confirmed) {
      dismissStonePowersPrompt(combat, actor, combatant);
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
