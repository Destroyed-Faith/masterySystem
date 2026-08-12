/**
 * Initiative Rolling System
 * Rolled ONCE at combat start: Mastery Rank d8 (keep all, 8s explode) + optional Combat
 * Reflexes spend (≤ MR×4, pool-limited). Final score before the Initiative Shop = dice + CR.
 * Initiative persists across rounds; only explicit effects (e.g. Wits Stone Powers) may
 * reroll it and reopen the Initiative Shop.
 */

import { masteryRoll } from '../dice/roll-handler.js';
import { getRoundState } from './action-economy.js';
import { calculateMaxSkillRank } from '../utils/calculations.js';
import { getEquippedEquipmentInitiativeModifier } from '../utils/equipment-modifiers.js';
import { readManualAdjustments } from '../utils/manual-adjustments.js';
import {
  formatNpcInitiativeSigned,
  getNpcInitiativeModifier,
} from '../utils/npc-initiative.js';
const CR_SKILL_KEY = 'combatReflexes';

function getMasteryRank(actor: any): number {
  if (!actor || !actor.system) return 2;
  const system = actor.system as any;
  return system.mastery?.rank || 2;
}

export interface InitiativeRollOptions {
  /** If false, no dialog; CR spend is 0 (e.g. non-owner client). */
  promptCombatReflexes?: boolean;
}

/**
 * Initiative roll breakdown (pre–Initiative Shop).
 */
export interface InitiativeRollBreakdown {
  /** Sum of Mastery Rank d8 (exploding 8s). */
  diceTotal: number;
  /** Combat Reflexes points added to this roll (also updates skillsSpent). */
  combatReflexesSpent: number;
  /** Dice + CR — pool for the shop; order uses points left after shopping. */
  totalInitiative: number;
  /** Flat modifier from equipped armor, shield, and weapon (e.g. Heavy). */
  equipmentInitiativeModifier: number;
  masteryRank: number;
  rollResult: any;
}

/**
 * Limits for spending Combat Reflexes on initiative (used by Initiative Shop dropdown).
 */
export function getCombatReflexesInitiativeLimits(
  actor: any,
  masteryRank: number
): { maxThisRoll: number; remainingPool: number; capPerRoll: number } {
  const rating = Number(actor?.system?.skills?.[CR_SKILL_KEY] ?? 0);
  const spent = Number(actor?.system?.skillsSpent?.[CR_SKILL_KEY] ?? 0);
  const remainingPool = Math.max(0, rating - spent);
  const capPerRoll = calculateMaxSkillRank(masteryRank);
  const maxThisRoll = Math.min(capPerRoll, remainingPool);
  return { maxThisRoll, remainingPool, capPerRoll };
}

/**
 * Roll initiative for one combatant (dice + optional CR). Sets combatant.initiative to the pre-shop total.
 * NPCs: dice only. PCs: may prompt to spend CR (owner/GM).
 */
export async function rollInitiativeForCombatant(
  combatant: Combatant,
  options: InitiativeRollOptions = {}
): Promise<InitiativeRollBreakdown> {
  /** CR wird im Initiative-Shop per Dropdown gesetzt (kein separates Popup). */
  const { promptCombatReflexes = false } = options;
  const actor = combatant.actor;
  if (!actor) {
    console.error('Mastery System | Cannot roll initiative: combatant has no actor');
    return {
      diceTotal: 0,
      combatReflexesSpent: 0,
      totalInitiative: 0,
      equipmentInitiativeModifier: 0,
      masteryRank: 2,
      rollResult: null
    };
  }

  const masteryRank = getMasteryRank(actor);
  const equipmentInitiativeModifier = getEquippedEquipmentInitiativeModifier(actor);
  const equipFlavor =
    equipmentInitiativeModifier !== 0
      ? ` · Equipment ${equipmentInitiativeModifier >= 0 ? '+' : ''}${equipmentInitiativeModifier} (armor/shield/weapon)`
      : '';

  // NPC / Summon sheet Ini (−10…+10) — flat on the Mastery Rank d8 total.
  const isNpcLike = actor.type === 'npc' || actor.type === 'summon';
  const npcInitiativeModifier = isNpcLike ? getNpcInitiativeModifier(actor) : 0;
  const npcIniFlavor =
    npcInitiativeModifier !== 0
      ? ` · Sheet Ini ${formatNpcInitiativeSigned(npcInitiativeModifier)}`
      : '';

  // Players Guide attribute scaling (~5969–5973): +floor(Wits/8) initiative.
  // Read from the actor's pre-derived `system.scaling.witsInitiativeBonus` so
  // any rank-up / mid-encounter Wits change is reflected immediately.
  const witsInitBonus = Math.max(
    0,
    Math.floor(Number((actor as any)?.system?.scaling?.witsInitiativeBonus ?? 0) || 0),
  );
  const witsFlavor = witsInitBonus > 0 ? ` · Wits scaling +${witsInitBonus}` : '';

  // Manual Adjustments — character-sheet-authored flat + bonus d8 applied on
  // top of Mastery-Rank d8. Initiative is not a "typed roll kind" in the
  // `masteryRoll` pipeline, so we apply the bonus directly here.
  const manualAdj = actor.type === 'character' ? readManualAdjustments(actor) : null;
  const manualInitiativeFlat = manualAdj?.combat.initiative ?? 0;
  const passiveInitiativeBonus = Math.max(
    0,
    Math.floor(Number((actor.system as any)?.combat?.initiativeFromMechanics ?? 0) || 0),
  );
  const passiveInitFlavor =
    passiveInitiativeBonus > 0 ? ` · Passive Initiative +${passiveInitiativeBonus}` : '';
  const manualInitiativeDice = Math.max(0, manualAdj?.rolls?.any?.dice ?? 0);
  const initiativeNumDice = Math.max(1, masteryRank + manualInitiativeDice);
  const manualFlavorParts: string[] = [];
  if (manualInitiativeDice > 0) manualFlavorParts.push(`+${manualInitiativeDice}d8 Manual Bonus`);
  if (manualInitiativeFlat !== 0) {
    manualFlavorParts.push(
      `${manualInitiativeFlat > 0 ? '+' : ''}${manualInitiativeFlat} Manual Bonus (init)`,
    );
  }
  const manualFlavor = manualFlavorParts.length ? ` · ${manualFlavorParts.join(' · ')}` : '';

  const rollResult = await masteryRoll({
    numDice: initiativeNumDice,
    keepDice: initiativeNumDice,
    skill: 0,
    label: 'Initiative Roll',
    flavor: `${actor.name}${equipFlavor}${witsFlavor}${passiveInitFlavor}${manualFlavor}${npcIniFlavor}`,
    actorId: actor.id
  });

  const diceTotal = rollResult.total;

  let combatReflexesSpent = 0;
  const isPc = actor.type === 'character';
  const user = game.user;
  const mayPromptCr =
    isPc &&
    promptCombatReflexes &&
    user &&
    (user.isGM || (actor as any).isOwner);

  if (mayPromptCr) {
    const { maxThisRoll } = getCombatReflexesInitiativeLimits(actor, masteryRank);
    if (maxThisRoll > 0) {
      combatReflexesSpent = await new Promise<number>((resolve) => {
        new Dialog({
          title: 'Combat Reflexes (Initiative)',
          content: `<form><div class="form-group">
<label>Combat Reflexes to add to initiative (0–${maxThisRoll})</label>
<input type="number" name="cr" min="0" max="${maxThisRoll}" value="0" step="1"/>
</div></form>`,
          buttons: {
            apply: {
              label: 'Apply',
              callback: (html: JQuery) => {
                const raw = Number(html.find('[name="cr"]').val());
                const v = Number.isFinite(raw) ? Math.max(0, Math.min(maxThisRoll, Math.floor(raw))) : 0;
                resolve(v);
              }
            },
            none: { label: 'None', callback: () => resolve(0) }
          },
          default: 'apply'
        }).render(true);
      });
    }
    if (combatReflexesSpent > 0) {
      const prevSpent = Number((actor.system as any)?.skillsSpent?.[CR_SKILL_KEY] ?? 0);
      await actor.update({
        [`system.skillsSpent.${CR_SKILL_KEY}`]: prevSpent + combatReflexesSpent
      });
    }
  }

  // Wits "Initiative Boost" stone power chosen BEFORE this roll (stone phase
  // precedes the initiative phase): fold it into the score here. The boost is
  // temporary ("this round") — record it so the round-advance pipeline can
  // revert it. A reroll replaces the score, so the flag is replaced (not added).
  let stoneInitiativeBonus = 0;
  try {
    const roundState = getRoundState(actor, (game as any).combat);
    stoneInitiativeBonus = Math.max(
      0,
      Math.floor(Number(roundState?.stoneBonuses?.initiativeBonus ?? 0) || 0),
    );
  } catch {
    /* no round state outside combat */
  }

  const totalInitiative =
    diceTotal +
    combatReflexesSpent +
    equipmentInitiativeModifier +
    manualInitiativeFlat +
    passiveInitiativeBonus +
    witsInitBonus +
    stoneInitiativeBonus +
    npcInitiativeModifier;
  await combatant.update({ initiative: totalInitiative });

  await combatant.setFlag('mastery-system', 'msInitiativeValue', totalInitiative);
  await combatant.setFlag('mastery-system', 'msInitiativeBoostThisRound', stoneInitiativeBonus);

  if (isPc) {
    await combatant.setFlag('mastery-system', 'pendingInitiativeShop', {
      diceTotal,
      combatReflexesSpent,
      totalInitiative,
      equipmentInitiativeModifier,
      masteryRank
    });
  }
  return {
    diceTotal,
    combatReflexesSpent,
    totalInitiative,
    equipmentInitiativeModifier,
    masteryRank,
    rollResult
  };
}

/**
 * Full initiative phase: NPCs auto; PCs with owner/GM get shop; others auto roll without CR prompt.
 */
export async function executeInitiativePhase(combat: Combat): Promise<void> {
  const { InitiativeShopDialog } = await import('./initiative-shop-dialog.js');
  const npcs: Combatant[] = [];
  const pcs: Combatant[] = [];

  for (const combatant of combat.combatants) {
    if (!combatant.actor) continue;
    const t = combatant.actor.type;
    if (t === 'npc' || t === 'summon' || t === 'divine') npcs.push(combatant);
    else if (t === 'character') pcs.push(combatant);
  }

  for (const npc of npcs) {
    await rollInitiativeForCombatant(npc, { promptCombatReflexes: false });
    await new Promise((r) => setTimeout(r, 200));
  }

  for (const pc of pcs) {
    const actor = pc.actor;
    if (!actor) continue;
    const user = game.user;
    if (!user) continue;

    if (user.isGM || (actor as any).isOwner) {
      const breakdown = await rollInitiativeForCombatant(pc, { promptCombatReflexes: false });
      try {
        await InitiativeShopDialog.showForCombatant(pc, breakdown, combat);
      } catch (error) {
        console.error('Mastery System | Failed to show Initiative Shop', error);
      }
    } else {
      await rollInitiativeForCombatant(pc, { promptCombatReflexes: false });
    }
    await new Promise((r) => setTimeout(r, 500));
  }

  // Combatants with null initiative are omitted from `combat.turns`, so the round
  // appears to advance early (fewer turns per round than combatants). Pin unset values.
  for (const c of combat.combatants) {
    if (c.initiative === null || c.initiative === undefined) {
      await c.update({ initiative: 0 });
    }
  }
  if (typeof (combat as any).setupTurns === 'function') {
    await (combat as any).setupTurns();
  }
  await syncCombatTurnToHighestInitiativeFirst(combat);
}

/**
 * Index of the combatant who should act first: highest initiative (desc).
 * Tie-break: lexicographically smaller combatant id (deterministic; avoids implicit player-first ordering).
 * Non-defeated beats defeated at equal initiative.
 */
export function findTurnIndexHighestInitiativeFirst(combat: Combat): number {
  const turns: any[] = Array.isArray(combat.turns) ? [...combat.turns] : [];
  if (!turns.length) return Math.max(0, Number(combat.turn) || 0);

  const candidateBeatsBest = (best: any, cand: any): boolean => {
    const bd = !!best?.defeated;
    const cd = !!cand?.defeated;
    if (!bd && cd) return false;
    if (bd && !cd) return true;
    const bi = Number(best?.initiative ?? -Infinity);
    const ci = Number(cand?.initiative ?? -Infinity);
    if (ci > bi) return true;
    if (ci < bi) return false;
    return String(cand.id ?? '') < String(best.id ?? '');
  };

  let bestIdx = 0;
  for (let i = 1; i < turns.length; i++) {
    if (candidateBeatsBest(turns[bestIdx], turns[i])) bestIdx = i;
  }
  return bestIdx;
}

/** After `setupTurns()`, ensure `combat.turn` points at highest-initiative combatant (Mastery first-actor rule). */
export async function syncCombatTurnToHighestInitiativeFirst(combat: Combat): Promise<void> {
  try {
    const turns: any[] = Array.isArray(combat.turns) ? [...combat.turns] : [];
    const desired = findTurnIndexHighestInitiativeFirst(combat);
    const chosen = turns[desired];
    if (desired !== combat.turn) {
      await combat.update({ turn: desired });
    }
  } catch (e) {
    console.warn('Mastery System | syncCombatTurnToHighestInitiativeFirst failed', e);
  }
}

/** @deprecated Prefer executeInitiativePhase; kept for compatibility. */
export async function rollInitiativeForAllCombatants(combat: Combat): Promise<void> {
  await executeInitiativePhase(combat);
}

/**
 * Open Initiative Shop from combat tracker: reuse pending roll context if shop not confirmed yet (encounter setup rescue).
 */
export async function openInitiativeShopForTrackerRescue(
  combatant: Combatant,
  combat: Combat
): Promise<void> {
  const { InitiativeShopDialog } = await import('./initiative-shop-dialog.js');

  const setup = (combat.flags as any)?.['mastery-system']?.encounterSetup;
  const confirmed = setup?.initiativeConfirmed?.[combatant.id] === true;
  const pending = (await combatant.getFlag('mastery-system', 'pendingInitiativeShop')) as
    | InitiativeRollBreakdown
    | undefined;

  if (!confirmed && pending && typeof pending.diceTotal === 'number') {
    await InitiativeShopDialog.showForCombatant(combatant, pending, combat);
    return;
  }

  const breakdown = await rollInitiativeForCombatant(combatant, { promptCombatReflexes: false });
  await InitiativeShopDialog.showForCombatant(combatant, breakdown, combat);
}
