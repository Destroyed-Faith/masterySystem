/**
 * Initiative Rolling System
 * Each round: Mastery Rank d8 (keep all, 8s explode) + optional Combat Reflexes spend (≤ MR×4, pool-limited).
 * Final score before the Initiative Shop = dice total + CR spent.
 */

import { masteryRoll } from '../dice/roll-handler.js';
import { calculateMaxSkillRank } from '../utils/calculations.js';

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
      masteryRank: 2,
      rollResult: null
    };
  }

  const masteryRank = getMasteryRank(actor);

  const rollResult = await masteryRoll({
    numDice: masteryRank,
    keepDice: masteryRank,
    skill: 0,
    label: 'Initiative Roll',
    flavor: `${actor.name}`,
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

  const totalInitiative = diceTotal + combatReflexesSpent;
  await combatant.update({ initiative: totalInitiative });

  if (!isPc) {
    await combatant.setFlag('mastery-system', 'msInitiativeValue', totalInitiative);
  }

  console.log('Mastery System | Initiative rolled', {
    actor: actor.name,
    diceTotal,
    combatReflexesSpent,
    totalInitiative,
    masteryRank
  });

  return {
    diceTotal,
    combatReflexesSpent,
    totalInitiative,
    masteryRank,
    rollResult
  };
}

/**
 * Full initiative phase: NPCs auto; PCs with owner/GM get shop; others auto roll without CR prompt.
 */
export async function executeInitiativePhase(combat: Combat): Promise<void> {
  const { InitiativeShopDialog } = await import('./initiative-shop-dialog.js');

  console.log('Mastery System | Initiative phase for combat', combat.id, 'round', combat.round);

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

  await combat.resetAll();
}

/** @deprecated Prefer executeInitiativePhase; kept for compatibility. */
export async function rollInitiativeForAllCombatants(combat: Combat): Promise<void> {
  await executeInitiativePhase(combat);
}
