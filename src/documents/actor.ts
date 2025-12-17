/**
 * Extended Actor document for Mastery System
 */

import { 
  calculateStones, 
  calculateTotalStones, 
  updateAttributeStones 
} from '../utils/calculations.js';

export class MasteryActor extends Actor {
  /**
   * Augment the basic actor data with additional dynamic data
   */
  prepareData() {
    super.prepareData();
    this.prepareBaseData();
    this.prepareDerivedData();
  }

  /**
   * Prepare base data for the actor (attributes, stones, etc.)
   */
  prepareBaseData() {
    const system = (this as any).system;
    
    // Calculate derived values if needed
    if (system.attributes) {
      // Calculate attribute stones using /8 rule (Single Source of Truth)
      for (const attr of Object.values(system.attributes) as any[]) {
        if (attr && typeof attr.value === 'number') {
          updateAttributeStones(attr);
        }
      }
      
      // Calculate total stones
      if (!system.stones) {
        system.stones = {};
      }
      system.stones.total = calculateTotalStones(system.attributes);
      
      // Calculate vitality stones
      if (system.attributes.vitality) {
        system.stones.vitality = calculateStones(system.attributes.vitality.value);
      }
      
      // Set maximum stones (total for now, can be extended with bonuses later)
      system.stones.maximum = system.stones.total;
      
      // Clamp current stones: 0..maximum
      if (system.stones.current === undefined || system.stones.current === null) {
        system.stones.current = system.stones.maximum;
      } else {
        system.stones.current = Math.max(0, Math.min(system.stones.current, system.stones.maximum));
      }
    }
  }

  /**
   * Prepare derived equipment data (armorTotal, evadeTotal, etc.)
   */
  prepareDerivedData() {
    const system = (this as any).system;
    const items = (this as any).items || [];
    
    // Ensure combat object exists
    if (!system.combat) {
      system.combat = {};
    }
    
    // Find equipped items
    let equippedWeapon: any = null;
    let equippedArmor: any = null;
    let equippedShield: any = null;
    
    for (const item of items) {
      const itemSystem = (item as any).system || {};
      if (itemSystem.equipped === true) {
        if (item.type === 'weapon' && !equippedWeapon) {
          equippedWeapon = item;
        } else if (item.type === 'armor' && !equippedArmor) {
          equippedArmor = item;
        } else if (item.type === 'shield' && !equippedShield) {
          equippedShield = item;
        }
      }
    }
    
    // Set derived equipment names and IDs
    system.combat.activeWeaponName = equippedWeapon?.name || null;
    system.combat.activeWeaponId = equippedWeapon?.id || null;
    system.combat.armorName = equippedArmor?.name || null;
    system.combat.armorId = equippedArmor?.id || null;
    system.combat.shieldName = equippedShield?.name || null;
    system.combat.shieldId = equippedShield?.id || null;
    
    // Calculate armorTotal = Mastery Rank + Armor Value + Shield Value
    const masteryRank = system.mastery?.rank || 2;
    const armorValue = (equippedArmor?.system as any)?.armorValue || 0;
    const shieldValue = (equippedShield?.system as any)?.shieldValue || 0;
    system.combat.armorTotal = masteryRank + armorValue + shieldValue;
    
    // Calculate evadeTotal = base evade + shield evadeBonus
    const baseEvade = system.combat.evade || 0;
    const shieldEvadeBonus = (equippedShield?.system as any)?.evadeBonus || 0;
    system.combat.evadeTotal = baseEvade + shieldEvadeBonus;
    
    // Prepare tracked resources for Combat Carousel module
    // These are derived fields that update automatically when actor data changes
    system.tracked = system.tracked ?? {};
    
    // HP: current health bar (for Carousel)
    const bars = system.health?.bars ?? [];
    const idx = Math.max(0, Math.min(Number(system.health?.currentBar ?? 0), bars.length - 1));
    const bar = bars[idx] ?? { current: 0, max: 0 };
    
    // Include tempHP in value ONLY (not in max)
    const tempHP = Number(system.health?.tempHP ?? 0);
    
    system.tracked.hp = {
      value: Math.max(0, Number(bar.current ?? 0) + tempHP),
      max: Math.max(0, Number(bar.max ?? 0))
    };
    
    // Stress: current/maximum stress
    system.tracked.stress = {
      value: Math.max(0, Number(system.stress?.current ?? 0)),
      max: Math.max(0, Number(system.stress?.maximum ?? 0))
    };
    
    // Stones: current/maximum stones
    system.tracked.stones = {
      value: Math.max(0, Number(system.stones?.current ?? 0)),
      max: Math.max(0, Number(system.stones?.maximum ?? 0))
    };
  }

  /**
   * Heal the actor
   */
  async heal(amount: number): Promise<void> {
    const system = (this as any).system;
    if (system.health && system.health.bars) {
      const currentBar = system.health.bars[system.health.currentBar || 0];
      if (currentBar) {
        currentBar.current = Math.min(currentBar.current + amount, currentBar.max);
        await (this as any).update({ 'system.health': system.health });
      }
    }
  }

  /**
   * Apply damage to the actor
   */
  async applyDamage(amount: number): Promise<void> {
    const system = (this as any).system;
    if (system.health && system.health.bars) {
      const currentBar = system.health.bars[system.health.currentBar || 0];
      if (currentBar) {
        currentBar.current = Math.max(currentBar.current - amount, 0);
        await (this as any).update({ 'system.health': system.health });
      }
    }
  }
}
