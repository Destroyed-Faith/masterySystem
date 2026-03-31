/**
 * Stone Powers Flow Management
 * Handles opening Stone Powers dialogs for all combatants at the start of each round
 */

import { StonePowersDialog } from '../stones/stone-powers-dialog.js';
import { executeInitiativePhase } from './initiative-roll.js';

const SOCKET_NAME = 'system.mastery-system';

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
  const current = getStonePowersState(combat);
  const updated = { ...current, ...updates };
  await combat.setFlag('mastery-system', 'stonePowersState', updated);
}

async function markStonePowersDone(combat: Combat, combatantId: string, round: number): Promise<void> {
  const state = getStonePowersState(combat);
  state.stonesDone[combatantId] = round;
  await updateStonePowersState(combat, { stonesDone: state.stonesDone });
}

function areAllCombatantsDone(combat: Combat, round: number): boolean {
  const state = getStonePowersState(combat);
  const allCombatants = Array.from(combat.combatants) as Combatant[];

  return allCombatants.every((combatant: Combatant) => state.stonesDone[combatant.id] === round);
}

/**
 * After stone powers for a round, roll initiative (dice + CR + shop) for all combatants once per round.
 */
export async function runInitiativePhaseAfterStones(combat: Combat, round: number): Promise<void> {
  const state = getStonePowersState(combat);
  if (state.initiativePhaseDoneByRound?.[round]) {
    console.log('Mastery System | Initiative phase already done for round', round);
    return;
  }

  try {
    await executeInitiativePhase(combat);
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
    console.log('Mastery System | Auto-resolving stone powers for NPC', actor.name);
    await markStonePowersDone(combat, combatant.id, round);
    return;
  }

  const user = game.user;
  if (!user) {
    await markStonePowersDone(combat, combatant.id, round);
    return;
  }

  if (!user.isGM && !actor.isOwner) {
    await markStonePowersDone(combat, combatant.id, round);
    return;
  }

  try {
    console.log('Mastery System | Opening stone powers dialog for', actor.name, 'round', round);
    await StonePowersDialog.showForActor(actor, combatant);
    await markStonePowersDone(combat, combatant.id, round);
    console.log('Mastery System | Stone powers completed for', actor.name, 'round', round);
  } catch (error) {
    console.error('Mastery System | Error in stone powers dialog', error);
    await markStonePowersDone(combat, combatant.id, round);
  }
}

export async function openStonePowersForAllCombatants(combat: Combat, round: number): Promise<void> {
  const state = getStonePowersState(combat);

  if (state.roundStonesPrompted[round]) {
    console.log('Mastery System | Stone powers already prompted for round', round);
    return;
  }

  await updateStonePowersState(combat, {
    roundStonesPrompted: { ...state.roundStonesPrompted, [round]: true }
  });

  console.log('Mastery System | Opening stone powers for all combatants, round', round);

  const allCombatants = Array.from(combat.combatants);

  for (const combatant of allCombatants as Combatant[]) {
    await openStonePowersForCombatant(combat, combatant, round);
    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  if (areAllCombatantsDone(combat, round)) {
    console.log('Mastery System | All combatants completed stone powers for round', round);
    await runInitiativePhaseAfterStones(combat, round);
  }
}

async function handleStonePowersComplete(combat: Combat, combatantId: string, round: number): Promise<void> {
  await markStonePowersDone(combat, combatantId, round);

  if (areAllCombatantsDone(combat, round)) {
    console.log('Mastery System | All combatants completed stone powers for round', round);
    await runInitiativePhaseAfterStones(combat, round);
  }
}

export function initializeStonePowersFlow(): void {
  console.log('Mastery System | Initializing stone powers flow system');

  game.socket?.on(SOCKET_NAME, async (payload: any) => {
    const { type, combatId, combatantId, round } = payload;

    if (type !== 'stonePowersComplete') return;

    const combat = game.combat;
    if (!combat || combat.id !== combatId) return;

    await handleStonePowersComplete(combat, combatantId, round);
  });
}
