/**
 * Per-combatant encounter-setup locks. Players cannot write the Combat
 * document, but they can usually update their own Combatant — so confirm
 * survives Join Game As / reload even when no GM client is connected.
 */

import { canCurrentUserUpdateDocument } from './combat-permissions.js';

export const COMBATANT_SETUP_FLAG = 'encounterSetupStep';

export interface CombatantSetupStep {
  combatId: string;
  passivesLocked?: boolean;
  stonesDoneRound?: number;
  regenDoneRound?: number;
  initiativeConfirmed?: boolean;
}

export function readCombatantSetupStep(
  combatant: Combatant | null | undefined,
  combat: Combat | null | undefined,
): CombatantSetupStep | null {
  if (!combatant || !combat?.id) return null;
  const raw = combatant.getFlag?.('mastery-system', COMBATANT_SETUP_FLAG) as CombatantSetupStep | undefined;
  if (!raw || String(raw.combatId) !== String(combat.id)) return null;
  return raw;
}

export async function persistCombatantSetupStep(
  combatant: Combatant | null | undefined,
  combat: Combat | null | undefined,
  patch: Partial<Omit<CombatantSetupStep, 'combatId'>>,
): Promise<boolean> {
  if (!combatant || !combat?.id || !canCurrentUserUpdateDocument(combatant)) return false;
  const prev = readCombatantSetupStep(combatant, combat) ?? { combatId: String(combat.id) };
  try {
    await combatant.setFlag('mastery-system', COMBATANT_SETUP_FLAG, {
      ...prev,
      combatId: String(combat.id),
      ...patch,
    });
    return true;
  } catch (err) {
    console.warn('Mastery System | Could not persist combatant setup step', err);
    return false;
  }
}

export function findCombatantByActorId(combat: Combat, actorId: string): Combatant | undefined {
  return Array.from(combat.combatants).find((c: any) => String(c.actor?.id ?? '') === String(actorId)) as
    | Combatant
    | undefined;
}

export function isPassiveSelectionLocked(combat: Combat, actorId: string): boolean {
  if ((combat.flags as any)?.['mastery-system']?.encounterSetup?.passives?.[actorId]?.locked) return true;
  return readCombatantSetupStep(findCombatantByActorId(combat, actorId), combat)?.passivesLocked === true;
}

export function isStoneRegenDone(combat: Combat, combatantId: string, round: number): boolean {
  const done = (combat.flags as any)?.['mastery-system']?.stonePowersState?.regenDone?.[combatantId];
  if (Number(done) === Number(round)) return true;
  const combatant = combat.combatants.get(combatantId);
  return Number(readCombatantSetupStep(combatant, combat)?.regenDoneRound) === Number(round);
}

export function isCombatantInitiativeConfirmed(combat: Combat, combatantId: string): boolean {
  if ((combat.flags as any)?.['mastery-system']?.encounterSetup?.initiativeConfirmed?.[combatantId]) return true;
  const combatant = combat.combatants.get(combatantId);
  return readCombatantSetupStep(combatant, combat)?.initiativeConfirmed === true;
}
