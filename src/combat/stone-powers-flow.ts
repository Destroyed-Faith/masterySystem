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
import { readCombatantSetupStep } from './encounter-setup-flags.js';

interface StonePowersState {
  roundStonesPrompted: Record<number, boolean>;
  stonesDone: Record<string, number>;
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

export function isStonePowersDone(combat: Combat, combatantId: string, round: number): boolean {
  if (getStonePowersState(combat).stonesDone[combatantId] === round) return true;
  const combatant = combat.combatants.get(combatantId);
  return Number(readCombatantSetupStep(combatant, combat)?.stonesDoneRound) === Number(round);
}

function areAllCombatantsDone(combat: Combat, round: number): boolean {
  const state = getStonePowersState(combat);
  const allCombatants = Array.from(combat.combatants) as Combatant[];

  return allCombatants.every((combatant: Combatant) => state.stonesDone[combatant.id] === round);
}

/**
 * After stone powers: Round 1 runs the full initiative phase (dice + CR + Initiative Shop
 * for PCs, `setupTurns`, Mastery first-actor sync). Rounds 2+ keep the existing Initiative —
 * per the Players Guide, Initiative is NOT rolled again each round and the Initiative Shop
 * does not reopen automatically (only effects like Wits Stone Powers may allow it). We only
 * re-sync the turn pointer to the highest remaining Initiative. Idempotent per round via
 * `initiativePhaseDoneByRound`.
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

  // Wits "Initiative Boost" lasts "this round": remove last round's temporary
  // boost from the persisted Initiative before the new round is set up.
  for (const combatant of combat.combatants) {
    try {
      const boost = Number(combatant.getFlag('mastery-system', 'msInitiativeBoostThisRound') ?? 0) || 0;
      if (boost > 0) {
        const cur = Number(combatant.initiative ?? 0) || 0;
        const restored = Math.max(0, cur - boost);
        await combatant.update({ initiative: restored });
        await combatant.setFlag('mastery-system', 'msInitiativeValue', restored);
      }
      if (boost !== 0) {
        await combatant.unsetFlag('mastery-system', 'msInitiativeBoostThisRound');
      }
    } catch (e) {
      console.warn('Mastery System | Failed to revert Initiative Boost', e);
    }
  }

  for (const combatant of combat.combatants) {
    const actor = combatant.actor;
    if (actor) await resetRoundState(actor, combatant, combat);
  }
  if (newRound <= 1) return;
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
