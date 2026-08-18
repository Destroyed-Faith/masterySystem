/**
 * Stone Powers Flow Management
 * Handles opening Stone Powers dialogs for all combatants at the start of each round
 *
 * Round advance (Runde 2+): Regeneration muss vor Stone Powers laufen — siehe
 * `runMasteryCombatRoundAdvancePipeline` (ein Hook-Pfad, keine Race mit zweitem updateCombat).
 */

import { StonePowersDialog } from '../stones/stone-powers-dialog.js';
import {
  executeInitiativePhase,
  syncCombatTurnToHighestInitiativeFirst,
} from './initiative-roll.js';
import {
  clearStonePowersConfigurationLocksInCombat,
  regenStonesEndOfRound,
  refillStonePoolsFromAttributes,
  resetRoundState,
  syncStonePoolCapsFromAttributes
} from './action-economy.js';
import {
  ENCOUNTER_SOCKET,
  canCurrentUserUpdateDocument,
  emitEncounterSocketToPlayerOwners,
  resolveLiveCombat,
  shouldShowEncounterDialogLocally,
} from './combat-permissions.js';
import { isStonePowersDone } from './stone-round-gate.js';

export { arePlayerStonesReadyForRound, isStonePowersDone, warnIfPlayerStonesPending } from './stone-round-gate.js';

interface StonePowersState {
  roundStonesPrompted: Record<number, boolean>;
  stonesDone: Record<string, number>;
  regenDone?: Record<string, number>;
  /** Round numbers for which the post-stones initiative phase has finished. */
  initiativePhaseDoneByRound?: Record<number, boolean>;
}

function getStonePowersState(combat: Combat): StonePowersState {
  const flags = combat.flags['mastery-system'] || {};
  const state = flags.stonePowersState as StonePowersState | undefined;

  if (!state) {
    return {
      roundStonesPrompted: {},
      stonesDone: {},
      regenDone: {},
      initiativePhaseDoneByRound: {}
    };
  }

  return {
    ...state,
    initiativePhaseDoneByRound: state.initiativePhaseDoneByRound || {}
  };
}

async function updateStonePowersState(combat: Combat, updates: Partial<StonePowersState>): Promise<void> {
  const live = resolveLiveCombat(combat);
  if (!live || !game.user?.isGM) return;
  const current = getStonePowersState(live);
  const updated = { ...current, ...updates };
  try {
    await live.setFlag('mastery-system', 'stonePowersState', updated);
  } catch (err) {
    console.warn('Mastery System | Could not persist stonePowersState', err);
  }
}

async function markStonePowersDone(combat: Combat, combatantId: string, round: number): Promise<void> {
  const state = getStonePowersState(combat);
  state.stonesDone[combatantId] = round;
  await updateStonePowersState(combat, { stonesDone: state.stonesDone });
}

async function markStoneRegenDone(combat: Combat, combatantId: string, round: number): Promise<void> {
  const state = getStonePowersState(combat);
  const regenDone = { ...(state.regenDone || {}), [combatantId]: round };
  await updateStonePowersState(combat, { regenDone });
}

/**
 * Register a finished Stone Recovery for the round. Mirrors
 * `confirmStonePowersForCombatant`: the combatant step is written locally so it
 * survives without a GM client, the Combat flag stays GM-owned.
 */
export async function confirmStoneRecoveryForCombatant(
  combat: Combat | null | undefined,
  combatant: Combatant | null | undefined
): Promise<void> {
  if (!combat || !combatant) return;
  const live = resolveLiveCombat(combat) ?? combat;
  const round = Math.max(1, Number(live.round) || 1);
  const { persistCombatantSetupStep } = await import('./encounter-setup-flags.js');
  await persistCombatantSetupStep(combatant, live, { regenDoneRound: round });

  if (game.user?.isGM) {
    await markStoneRegenDone(live, combatant.id, round);
  } else {
    game.socket?.emit(ENCOUNTER_SOCKET, {
      type: 'stoneRecoveryComplete',
      combatId: live.id,
      combatantId: combatant.id,
      round,
    });
  }
}

export async function handleStoneRecoveryComplete(
  combat: Combat,
  combatantId: string,
  round: number
): Promise<void> {
  const live = resolveLiveCombat(combat);
  if (!live) return;
  await markStoneRegenDone(live, combatantId, round);
}

/**
 * Join Game As / no GM client: reset + regen owned actors, then open stone dialogs.
 * The GM path (`runMasteryCombatRoundAdvancePipeline`) already covers this when a GM is present.
 */
export async function runPlayerOwnedRoundAdvance(combat: Combat, newRound: number): Promise<void> {
  if (game.user?.isGM) return;
  const live = resolveLiveCombat(combat);
  if (!live) return;
  combat = live;
  if (newRound <= 1) {
    void import('./player-encounter-setup.js').then(({ resumePlayerEncounterSetup }) => {
      void resumePlayerEncounterSetup(combat);
    });
    return;
  }
  for (const combatant of combat.combatants) {
    const actor = combatant.actor;
    if (!actor || !canCurrentUserUpdateDocument(actor)) continue;
    try {
      await resetRoundState(actor, combatant, combat);
    } catch (err) {
      console.warn('Mastery System | Player round reset failed', err);
    }
  }
  try {
    await regenStonesEndOfRound(combat);
  } catch (err) {
    console.warn('Mastery System | Player stone regen failed', err);
  }
  void import('./player-encounter-setup.js').then(({ resumePlayerEncounterSetup }) => {
    void resumePlayerEncounterSetup(combat);
  });
}

function areAllCombatantsDone(combat: Combat, round: number): boolean {
  const allCombatants = Array.from(combat.combatants) as Combatant[];
  return allCombatants.every((combatant: Combatant) => isStonePowersDone(combat, combatant.id, round));
}

/**
 * After stone powers: leftover NPC rolls + sort by remaining Initiative.
 * PCs already rolled (and maybe converted) inside the Stone Powers dialog.
 * Idempotent per round via `initiativePhaseDoneByRound`.
 */
export async function runInitiativePhaseAfterStones(combat: Combat, round: number): Promise<void> {
  if (!game.user?.isGM) return;
  const live = resolveLiveCombat(combat);
  if (!live) return;
  combat = live;
  const state = getStonePowersState(combat);
  if (state.initiativePhaseDoneByRound?.[round]) {
    return;
  }

  try {
    if (round <= 1) {
      await executeInitiativePhase(combat);
    } else {
      if (typeof (combat as any).setupTurns === 'function') {
        await (combat as any).setupTurns();
      }
      await syncCombatTurnToHighestInitiativeFirst(combat);
    }
  } catch (e) {
    console.error('Mastery System | Initiative phase failed', e);
    throw e;
  }

  const s = getStonePowersState(combat);
  await updateStonePowersState(combat, {
    initiativePhaseDoneByRound: { ...(s.initiativePhaseDoneByRound || {}), [round]: true }
  });
  try {
    const { CombatCarouselApp } = await import('../ui/combat-carousel.js');
    CombatCarouselApp.refresh();
  } catch {
    /* carousel may not be open */
  }
}

async function openStonePowersForCombatant(combat: Combat, combatant: Combatant, round: number): Promise<void> {
  const actor = combatant.actor;
  if (!actor) {
    console.warn('Mastery System | Cannot open stone powers: no actor for combatant', combatant.id);
    await markStonePowersDone(combat, combatant.id, round);
    return;
  }

  if (actor.type === 'npc' || actor.type === 'summon' || actor.type === 'divine') {
    await markStonePowersDone(combat, combatant.id, round);
    return;
  }

  if (!shouldShowEncounterDialogLocally(actor)) {
    if (game.user?.isGM) {
      emitEncounterSocketToPlayerOwners(actor, {
        type: 'openStonePowers',
        combatId: combat.id,
        combatantId: combatant.id,
        actorId: actor.id,
        round,
      });
    }
    return;
  }

  try {
    // Round 2+ recovery happens inside the Stone Powers dialog: it locks the
    // power matrix until the player confirmed which stones come back.
    const confirmed = await StonePowersDialog.showForActor(actor, combatant);
    if (!confirmed) return;
    if (game.user?.isGM) {
      await markStonePowersDone(combat, combatant.id, round);
    } else {
      game.socket?.emit(ENCOUNTER_SOCKET, {
        type: 'stonePowersComplete',
        combatId: combat.id,
        combatantId: combatant.id,
        round,
      });
    }
  } catch (error) {
    console.error('Mastery System | Error in stone powers dialog', error);
  }
}

/**
 * Bei `updateCombat` mit neuem `round`: Locks für Stone-Powers-UI leeren, RoundState aller
 * Combatants zurücksetzen; ab Runde 2 zuerst Regen-Dialoge, dann Stone Powers + Initiative
 * (sofern `combat.started`). Runde 1: nur Reset — Stone Powers übernimmt `combatStart` /
 * Encounter-Flow.
 */
export async function runMasteryCombatRoundAdvancePipeline(
  combat: Combat,
  newRound: number
): Promise<void> {
  if (!game.user?.isGM) return;
  const live = resolveLiveCombat(combat);
  if (!live) return;
  combat = live;
  await clearStonePowersConfigurationLocksInCombat(combat);

  // Round 1 is reached by leaving the prepare phase (round 0 → 1). Resetting
  // here would discard the Stone Powers the players just bought (Extra Attack,
  // Spell Action, …), so only rounds 2+ get a fresh round state.
  if (newRound <= 1) return;

  for (const combatant of combat.combatants) {
    const actor = combatant.actor;
    if (actor) await resetRoundState(actor, combatant, combat);
  }
  await regenStonesEndOfRound(combat);
  if (combat.started) {
    await openStonePowersForAllCombatants(combat, newRound);
  }
}

export async function openStonePowersForAllCombatants(combat: Combat, round: number): Promise<void> {
  if (!game.user?.isGM) return;
  const live = resolveLiveCombat(combat);
  if (!live) return;
  combat = live;
  const state = getStonePowersState(combat);

  if (state.roundStonesPrompted[round]) {
    return;
  }

  // Encounter flow opens round-1 stones before `combatStart`; `prepareBaseData` skips refilling
  // pools while in combat — persisted 0/0 pools never get current. Use combatant.actor so
  // unlinked token PCs get the same document the dialog uses.
  for (const c of combat.combatants) {
    const a = c.actor;
    if (!a || a.type !== 'character') continue;
    if (!canCurrentUserUpdateDocument(a)) continue;
    if (round === 1) {
      await refillStonePoolsFromAttributes(a);
    } else {
      await syncStonePoolCapsFromAttributes(a);
    }
  }

  await updateStonePowersState(combat, {
    roundStonesPrompted: { ...state.roundStonesPrompted, [round]: true }
  });
  const allCombatants = Array.from(combat.combatants);

  for (const combatant of allCombatants as Combatant[]) {
    await openStonePowersForCombatant(combat, combatant, round);
    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  if (areAllCombatantsDone(combat, round)) {
    await runInitiativePhaseAfterStones(combat, round);
  }
}

/**
 * Register a confirmed stone assignment, whichever way the dialog was opened
 * (player pipeline, GM fill, setup status row, forced dialog). Writes the
 * combatant step so it survives without a GM client, then lets the GM own the
 * Combat flag. Round 0 (prepare phase) counts as round 1, matching
 * `encounterStartBlockers`.
 */
export async function confirmStonePowersForCombatant(
  combat: Combat | null | undefined,
  combatant: Combatant | null | undefined
): Promise<void> {
  if (!combat || !combatant) return;
  const live = resolveLiveCombat(combat) ?? combat;
  const round = Math.max(1, Number(live.round) || 1);
  const { persistCombatantSetupStep } = await import('./encounter-setup-flags.js');
  await persistCombatantSetupStep(combatant, live, { stonesDoneRound: round });

  if (game.user?.isGM) {
    await handleStonePowersComplete(live, combatant.id, round);
  } else {
    game.socket?.emit(ENCOUNTER_SOCKET, {
      type: 'stonePowersComplete',
      combatId: live.id,
      combatantId: combatant.id,
      round,
    });
  }
}

export async function handleStonePowersComplete(combat: Combat, combatantId: string, round: number): Promise<void> {
  const live = resolveLiveCombat(combat);
  if (!live) return;
  await markStonePowersDone(live, combatantId, round);

  if (areAllCombatantsDone(live, round)) {
    await runInitiativePhaseAfterStones(live, round);
  }
}

export function initializeStonePowersFlow(): void {
  // Socket handling lives in registerEncounterSocket (ready).
}
