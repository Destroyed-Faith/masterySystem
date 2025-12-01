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
    }
    
    // Update health bars based on vitality
    if (system.health && system.attributes?.vitality) {
      const vitality = system.attributes.vitality.value;
      
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

