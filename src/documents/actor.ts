/**
 * Extended Actor document for Mastery System
 * Handles automatic calculation of derived values
 */

import {
  calculateStones,
  calculateTotalStones,
  initializeHealthBars,
  updateHealthBars
} from '../utils/calculations';
import { applyPassiveEffects } from '../powers/passives';
import { applyBuffEffects } from '../powers/buffs';
import { initializeHealthLevels } from '../combat/health';

export class MasteryActor extends Actor {
  /**
   * Augment the basic actor data with additional dynamic data
   */
  prepareData() {
    super.prepareData();
    
    // Calculate derived data based on actor type
    if ((this as any).type === 'character' || (this as any).type === 'npc') {
      this.prepareCharacterData();
    }
  }

  /**
   * Prepare character-specific derived data
   */
  prepareCharacterData() {
    const system = (this as any).system;
    
    // Update Stones for each attribute
    if (system.attributes) {
      for (const attr of Object.values(system.attributes) as any[]) {
        attr.stones = calculateStones(attr.value);
      }
      
      // Calculate total stones
      if (system.stones) {
        system.stones.total = calculateTotalStones(system.attributes);
        system.stones.maximum = system.stones.total;
        system.stones.vitality = system.attributes.vitality.stones || 0;
        
        // Ensure current stones doesn't exceed maximum
        if (system.stones.current > system.stones.maximum) {
          system.stones.current = system.stones.maximum;
        }
      }
      
      // Update resources.stones to match (consolidation)
      if (system.resources?.stones) {
        system.resources.stones.maximum = system.stones.total;
        system.resources.stones.vitality = system.attributes.vitality.stones || 0;
        system.resources.stones.regeneration = system.mastery?.rank || 2;
        
        // Ensure current doesn't exceed max
        if (system.resources.stones.current > system.resources.stones.maximum) {
          system.resources.stones.current = system.resources.stones.maximum;
        }
      }
    }
    
    // Calculate Stress maximum (Resolve + Wits)
    if (system.resources?.stress && system.attributes) {
      const resolve = system.attributes.resolve?.value || 0;
      const wits = system.attributes.wits?.value || 0;
      system.resources.stress.maximum = resolve + wits;
      
      // Clamp current stress
      if (system.resources.stress.current > system.resources.stress.maximum) {
        system.resources.stress.current = system.resources.stress.maximum;
      }
    }
    
    // Update action conversions max based on Mastery Rank
    if (system.actions?.conversions) {
      const masteryRank = system.mastery?.rank || 2;
      system.actions.conversions.maxConversions = masteryRank;
    }
    
    // Recalculate action max values from base + bonus + conversions
    if (system.actions) {
      const attack = system.actions.attack || { base: 1, bonus: 0 };
      const movement = system.actions.movement || { base: 1, bonus: 0 };
      const reaction = system.actions.reaction || { base: 1, bonus: 0 };
      const conversions = system.actions.conversions || { attackToMovement: 0, attackToReaction: 0 };
      
      system.actions.attack.max = attack.base + attack.bonus;
      system.actions.movement.max = movement.base + movement.bonus + (conversions.attackToMovement || 0);
      system.actions.reaction.max = reaction.base + reaction.bonus + (conversions.attackToReaction || 0);
    }
    
    // Update health bars based on vitality
    if (system.health && system.attributes?.vitality) {
      const vitality = system.attributes.vitality.value;
      
      // Initialize health levels if they don't exist
      if (!system.health.levels || system.health.levels.length === 0) {
        system.health.levels = initializeHealthLevels(vitality);
      }
      
      // Initialize health bars if they don't exist or are empty
      if (!system.health.bars || system.health.bars.length === 0) {
        system.health.bars = initializeHealthBars(vitality);
      } else {
        // Update existing health bars
        updateHealthBars(system.health.bars, vitality);
      }
      
      // Ensure currentBar is valid
      if (system.health.currentBar < 0 || system.health.currentBar >= system.health.bars.length) {
        system.health.currentBar = 0;
      }
    }
    
    // Calculate and apply combat stats
    if (system.combat && system.attributes) {
      const masteryRank = system.mastery?.rank || 2;
      
      // Auto-calculate Evade: Agility + Defensive Combat Skill + (Mastery Rank × 2)
      const agility = system.attributes.agility?.value || 0;
      const defensiveCombat = system.skills?.defensiveCombat || 0;
      const baseEvade = agility + defensiveCombat + (masteryRank * 2);
      
      // Add equipment bonuses (shield, armor)
      const shieldEvadeBonus = system.combat.shieldEvadeBonus || 0;
      const armorEvadeBonus = system.combat.armorEvadeBonus || 0;
      const equipmentEvadeBonus = shieldEvadeBonus + armorEvadeBonus;
      
      // Store base evade (before passives and buffs)
      system.combat.evadeBase = baseEvade + equipmentEvadeBonus;
      
      // Apply passive bonuses to armor and evade
      const baseArmor = system.combat.armor || 0;
      const armorWithPassives = applyPassiveEffects(this as any, 'armor', baseArmor);
      const evadeWithPassives = applyPassiveEffects(this as any, 'evade', system.combat.evadeBase);
      
      // Apply buff bonuses on top of passives
      system.combat.armorTotal = applyBuffEffects(this as any, 'armor', armorWithPassives);
      system.combat.evadeTotal = applyBuffEffects(this as any, 'evade', evadeWithPassives);
      
      // Set the final evade value
      system.combat.evade = system.combat.evadeTotal;
    }
    
    // Update Mastery Charges max
    if (system.mastery) {
      const masteryRank = system.mastery.rank || 2;
      if (!system.mastery.charges) {
        system.mastery.charges = {
          current: masteryRank,
          maximum: masteryRank,
          temporary: 0
        };
      } else {
        system.mastery.charges.maximum = masteryRank;
      }
    }
  }

  /**
   * Get the current health bar penalty
   */
  get currentPenalty(): number {
    const system = (this as any).system;
    if (system.health?.bars && system.health.currentBar !== undefined) {
      const bar = system.health.bars[system.health.currentBar];
      return bar?.penalty || 0;
    }
    return 0;
  }

  /**
   * Get total HP across all bars
   */
  get totalHP(): number {
    const system = (this as any).system;
    if (!system.health?.bars) return 0;
    
    return system.health.bars.reduce((sum: number, bar: any) => sum + bar.current, 0);
  }

  /**
   * Get maximum HP across all bars
   */
  get maxHP(): number {
    const system = (this as any).system;
    if (!system.health?.bars) return 0;
    
    return system.health.bars.reduce((sum: number, bar: any) => sum + bar.max, 0);
  }

  /**
   * Apply damage to the actor
   */
  async applyDamage(damage: number): Promise<void> {
    const system = (this as any).system;
    if (!system.health?.bars) return;
    
    let remainingDamage = damage;
    let currentBar = system.health.currentBar;
    
    while (remainingDamage > 0 && currentBar < system.health.bars.length) {
      const bar = system.health.bars[currentBar];
      
      if (bar.current >= remainingDamage) {
        bar.current -= remainingDamage;
        remainingDamage = 0;
      } else {
        remainingDamage -= bar.current;
        bar.current = 0;
        currentBar++;
      }
    }
    
    await (this as any).update({
      'system.health.bars': system.health.bars,
      'system.health.currentBar': currentBar
    });
  }

  /**
   * Heal the actor
   * Healing only affects the current health bar
   */
  async heal(healing: number): Promise<void> {
    const system = (this as any).system;
    if (!system.health?.bars) return;
    
    const currentBar = system.health.currentBar;
    if (currentBar < 0 || currentBar >= system.health.bars.length) return;
    
    const bar = system.health.bars[currentBar];
    bar.current = Math.min(bar.current + healing, bar.max);
    
    await (this as any).update({
      'system.health.bars': system.health.bars
    });
  }

  /**
   * Get a skill value
   */
  getSkillValue(skillName: string): number {
    const system = (this as any).system;
    return system.skills?.[skillName] || 0;
  }

  /**
   * Set a skill value
   */
  async setSkillValue(skillName: string, value: number): Promise<void> {
    await (this as any).update({
      [`system.skills.${skillName}`]: value
    });
  }

  /**
   * Get the number of dice to roll for an attribute
   */
  getAttributeDice(attributeName: string): number {
    const system = (this as any).system;
    return system.attributes?.[attributeName]?.value || 0;
  }

  /**
   * Get the number of dice to keep (based on Mastery Rank)
   */
  getKeepDice(): number {
    const system = (this as any).system;
    return system.mastery?.rank || 1;
  }
}

