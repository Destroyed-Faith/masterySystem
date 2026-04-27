/**
 * Stone Powers Flow Management
 * Handles opening Stone Powers dialogs for all combatants at the start of each round
 *
 * Round advance (Runde 2+): Regeneration muss vor Stone Powers laufen — siehe
 * `runMasteryCombatRoundAdvancePipeline` (ein Hook-Pfad, keine Race mit zweitem updateCombat).
 */

import { StonePowersDialog } from '../stones/stone-powers-dialog.js';
import {
  buildCombatTurnSnapshot,
  buildCombatantsIteratorOrder,
  logInitiativeOrderDebug,
} from '../utils/combat-trace-debug.js';
import { executeInitiativePhase } from './initiative-roll.js';
import {
  clearStonePowersConfigurationLocksInCombat,
  regenStonesEndOfRound,
  refillStonePoolsFromAttributes,
  resetRoundState,
  syncStonePoolCapsFromAttributes
} from './action-economy.js';

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
  logInitiativeOrderDebug('runInitiativePhaseAfterStones.enter', {
    round,
    initiativePhaseDoneForRound: !!state.initiativePhaseDoneByRound?.[round],
    rerollInitiativeAfterStonesEachRound:
      (globalThis as any).game?.settings?.get?.('mastery-system', 'rerollInitiativeAfterStonesEachRound') ===
      true,
    snapshot: buildCombatTurnSnapshot(combat),
    combatantsIteratorOrder: buildCombatantsIteratorOrder(combat),
  });

  if (state.initiativePhaseDoneByRound?.[round]) {
    console.log('Mastery System | Initiative phase already done for round', round);
    return;
  }

  const rerollEachRound =
    (globalThis as any).game?.settings?.get?.('mastery-system', 'rerollInitiativeAfterStonesEachRound') ===
    true;
  if (round > 1 && !rerollEachRound) {
    const sSkip = getStonePowersState(combat);
    await updateStonePowersState(combat, {
      initiativePhaseDoneByRound: { ...(sSkip.initiativePhaseDoneByRound || {}), [round]: true },
    });
    console.log(
      'Mastery System | Skipping initiative phase after stones (round > 1; enable world setting rerollInitiativeAfterStonesEachRound to restore every-round reroll)',
    );
    logInitiativeOrderDebug('runInitiativePhaseAfterStones.skippedRoundGt1', {
      round,
      note: 'No executeInitiativePhase — `turns` / `combat.turn` unchanged by this path.',
      snapshot: buildCombatTurnSnapshot(combat),
      combatantsIteratorOrder: buildCombatantsIteratorOrder(combat),
    });
    return;
  }

  try {
    logInitiativeOrderDebug('runInitiativePhaseAfterStones.runningExecuteInitiativePhase', {
      round,
      snapshot: buildCombatTurnSnapshot(combat),
    });
    await executeInitiativePhase(combat);
  } catch (e) {
    console.error('Mastery System | Initiative phase failed', e);
    throw e;
  }

  const s = getStonePowersState(combat);
  await updateStonePowersState(combat, {
    initiativePhaseDoneByRound: { ...(s.initiativePhaseDoneByRound || {}), [round]: true }
  });

  logInitiativeOrderDebug('runInitiativePhaseAfterStones.done', {
    round,
    snapshot: buildCombatTurnSnapshot(combat),
    combatantsIteratorOrder: buildCombatantsIteratorOrder(combat),
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
  await clearStonePowersConfigurationLocksInCombat(combat);
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
  const state = getStonePowersState(combat);

  if (state.roundStonesPrompted[round]) {
    console.log('Mastery System | Stone powers already prompted for round', round);
    return;
  }

  // Encounter flow opens round-1 stones before `combatStart`; `prepareBaseData` skips refilling
  // pools while in combat — persisted 0/0 pools never get current. Use combatant.actor so
  // unlinked token PCs get the same document the dialog uses.
  for (const c of combat.combatants) {
    const a = c.actor;
    if (!a || a.type !== 'character') continue;
    if (round === 1) {
      await refillStonePoolsFromAttributes(a);
    } else {
      await syncStonePoolCapsFromAttributes(a);
    }
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
