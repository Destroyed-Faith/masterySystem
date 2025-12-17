/**
 * Initiative Rolling System
 * Handles initiative calculation and rolling for combatants
 */

import { masteryRoll } from '../dice/roll-handler.js';

/**
 * Get attribute value from actor
 */
function getAttributeValue(actor: any, attributeName: string): number {
  if (!actor || !actor.system) return 0;
  const system = actor.system as any;
  const attributes = system.attributes || {};
  const attr = attributes[attributeName.toLowerCase()] || {};
  return attr.value || 0;
}

/**
 * Get skill value from actor
 */
function getSkillValue(actor: any, skillName: string): number {
  if (!actor || !actor.system) return 0;
  const system = actor.system as any;
  const skills = system.skills || {};
  return skills[skillName] || 0;
}

/**
 * Get mastery rank from actor
 */
function getMasteryRank(actor: any): number {
  if (!actor || !actor.system) return 2;
  const system = actor.system as any;
  return system.mastery?.rank || 2;
}

/**
 * Calculate base initiative for an actor
 * Base = Agility + Wits + Combat Reflexes
 */
export function calculateBaseInitiative(actor: any): number {
  const agility = getAttributeValue(actor, 'agility');
  const wits = getAttributeValue(actor, 'wits');
  const combatReflexes = getSkillValue(actor, 'combatReflexes');
  
  return agility + wits + combatReflexes;
}

/**
 * Roll initiative for a combatant
 * Returns the total initiative value (base + dice roll)
 */
export async function rollInitiativeForCombatant(combatant: Combatant): Promise<number> {
  const actor = combatant.actor;
  if (!actor) {
    console.error('Mastery System | Cannot roll initiative: combatant has no actor');
    return 0;
  }

  const baseInitiative = calculateBaseInitiative(actor);
  const masteryRank = getMasteryRank(actor);
  
  // Roll Mastery Rank d8 (exploding 8s)
  // For initiative, we roll and keep all dice (keepDice = numDice)
  const rollResult = await masteryRoll({
    numDice: masteryRank,
    keepDice: masteryRank,
    skill: 0,
    label: 'Initiative Roll',
    flavor: `${actor.name} (Base: ${baseInitiative})`,
    actorId: actor.id
  });

  const diceTotal = rollResult.total;
  const totalInitiative = baseInitiative + diceTotal;

  // Update combatant's initiative
  await combatant.update({ initiative: totalInitiative });

  console.log('Mastery System | Initiative rolled', {
    actor: actor.name,
    baseInitiative,
    diceTotal,
    totalInitiative,
    masteryRank
  });

  return totalInitiative;
}

/**
 * Roll initiative for all combatants in a combat
 * NPCs roll automatically, PCs get Initiative Shop dialog
 */
export async function rollInitiativeForAllCombatants(combat: Combat): Promise<void> {
  console.log('Mastery System | Rolling initiative for all combatants');

  // Separate NPCs and PCs
  const npcs: Combatant[] = [];
  const pcs: Combatant[] = [];

  for (const combatant of combat.combatants) {
    if (!combatant.actor) continue;
    
    if (combatant.actor.type === 'npc' || combatant.actor.type === 'summon' || combatant.actor.type === 'divine') {
      npcs.push(combatant);
    } else if (combatant.actor.type === 'character') {
      pcs.push(combatant);
    }
  }

  // Roll for NPCs first (automatic, no shop)
  for (const npc of npcs) {
    await rollInitiativeForCombatant(npc);
    // Small delay between rolls for visual effect
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  // Roll for PCs with Initiative Shop
  for (const pc of pcs) {
    // Check if player owns this character
    const actor = pc.actor;
    if (!actor) continue;

    const user = game.user;
    if (!user) continue;

    // Only show shop to the owner or GM
    if (user.isGM || actor.isOwner) {
      // Roll initiative first (returns total initiative = base + dice)
      const totalInitiative = await rollInitiativeForCombatant(pc);
      
      // Show Initiative Shop dialog (pass total initiative, not base)
      try {
        const { InitiativeShopDialog } = await import('systems/mastery-system/dist/combat/initiative-shop-dialog.js' as any);
        await InitiativeShopDialog.showForCombatant(pc, totalInitiative);
      } catch (error) {
        console.error('Mastery System | Failed to show Initiative Shop', error);
        // Continue even if shop fails
      }
    } else {
      // For non-owners, just roll automatically
      await rollInitiativeForCombatant(pc);
    }

    // Small delay between players
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Sort combat by initiative
  await combat.resetAll();
  
  console.log('Mastery System | Initiative rolling complete');
}

