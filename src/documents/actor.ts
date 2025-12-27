/**
 * Extended Actor document for Mastery System
 */

import { 
  calculateStones, 
  calculateTotalStones, 
  updateAttributeStones,
  initializeHealthBars,
  initializeStressBars,
  calculateHealthBarMax,
  calculateStressBarMax
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
      
      // NEW: Calculate per-attribute stone pools (floor(attribute / 8))
      // For characters only (NPCs may have stones but don't use action bonuses)
      if ((this as any).type === 'character') {
        // Initialize stonePools if it doesn't exist (for new characters)
        if (!system.stonePools) {
          system.stonePools = {};
        }
        
        const attributeKeys = ['might', 'agility', 'vitality', 'intellect', 'resolve', 'influence'] as const;
        
        for (const attrKey of attributeKeys) {
          const attrValue = system.attributes[attrKey]?.value || 0;
          const maxStones = Math.floor(attrValue / 8);
          
          // Initialize pool if missing
          if (!system.stonePools[attrKey]) {
            system.stonePools[attrKey] = {
              current: maxStones,
              max: maxStones,
              sustained: 0
            };
          } else {
            // Update max based on attribute
            system.stonePools[attrKey].max = maxStones;
            
            // Calculate effective max (max - sustained)
            const sustained = system.stonePools[attrKey].sustained ?? 0;
            const effectiveMax = Math.max(0, maxStones - sustained);
            
            // Initialize/refill current if:
            // - missing/undefined/null -> set to effectiveMax
            // - is 0 and maxStones > 0 and sustained === 0 -> refill to effectiveMax (character creation or reset case)
            // - otherwise clamp to valid range
            const current = system.stonePools[attrKey].current;
            if (current === undefined || current === null) {
              system.stonePools[attrKey].current = effectiveMax;
            } else if (current === 0 && maxStones > 0 && sustained === 0) {
              // Refill empty pools (character creation or after attribute increase)
              system.stonePools[attrKey].current = effectiveMax;
            } else {
              system.stonePools[attrKey].current = Math.max(0, Math.min(current, effectiveMax));
            }
          }
        }
      }
      
      // OLD STONE SYSTEM: Keep for backwards compatibility / migration
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
      
      // Initialize health bars (4 bars: Healthy, Bruised, Injured, Wounded)
      if ((this as any).type === 'character') {
        const vitality = system.attributes.vitality?.value || 2;
        const maxHP = calculateHealthBarMax(vitality);
        
        if (!system.health) {
          system.health = {
            bars: initializeHealthBars(vitality),
            currentBar: 0,
            tempHP: 0
          };
        } else {
          // Ensure bars is an array (migrate from object if needed)
          if (!Array.isArray(system.health.bars)) {
            // Convert object to array if needed
            if (system.health.bars && typeof system.health.bars === 'object' && system.health.bars !== null) {
              const barsObj = system.health.bars as any;
              // Check if it's an object with numeric keys (old format)
              const keys = Object.keys(barsObj);
              if (keys.length > 0 && keys.some((k: string) => !isNaN(parseInt(k)))) {
                system.health.bars = Object.keys(barsObj)
                  .sort((a, b) => parseInt(a) - parseInt(b))
                  .map(key => barsObj[key]);
              } else {
                // Not a valid object format, initialize fresh
                system.health.bars = initializeHealthBars(vitality);
              }
            } else {
              system.health.bars = initializeHealthBars(vitality);
            }
          }
          
          // Ensure we have exactly 4 bars (remove any extra bars)
          if (!system.health.bars || system.health.bars.length === 0) {
            system.health.bars = initializeHealthBars(vitality);
          } else {
            // Limit to 4 bars maximum (remove any 5th bar)
            if (system.health.bars.length > 4) {
              system.health.bars = system.health.bars.slice(0, 4);
            }
            
            // Add missing bars if less than 4
            if (system.health.bars.length < 4) {
              const allBarNames = ['Healthy', 'Bruised', 'Injured', 'Wounded'];
              const penalties = [0, -1, -2, -4];
              
              for (let i = system.health.bars.length; i < 4; i++) {
                system.health.bars.push({
                  name: allBarNames[i],
                  max: maxHP,
                  current: maxHP,
                  penalty: penalties[i]
                });
              }
            }
            
            // Update max HP and penalties for all bars
            const penalties = [0, -1, -2, -4];
            for (let i = 0; i < system.health.bars.length && i < 4; i++) {
              const bar = system.health.bars[i];
              const ratio = bar.max > 0 ? bar.current / bar.max : 1;
              bar.max = maxHP;
              bar.current = Math.min(Math.floor(maxHP * ratio), maxHP);
              bar.penalty = penalties[i];
            }
          }
          
          // Update max HP for all bars based on current vitality
          // Only iterate if it's an array
          if (Array.isArray(system.health.bars)) {
            for (const bar of system.health.bars) {
              const ratio = bar.max > 0 ? bar.current / bar.max : 1;
              bar.max = maxHP;
              bar.current = Math.min(Math.floor(maxHP * ratio), maxHP);
            }
          }
        }
        
        // Initialize stress bars (5 bars: Healthy, Stressed, Not Well, Breaking, Breakdown)
        const resolve = system.attributes.resolve?.value || 2;
        const wits = system.attributes.wits?.value || 2;
        const maxStress = calculateStressBarMax(resolve, wits);
        
        if (!system.stress) {
          system.stress = {
            bars: initializeStressBars(resolve, wits),
            currentBar: 0
          };
        } else {
          // Ensure bars is an array (migrate from object if needed)
          if (!Array.isArray(system.stress.bars)) {
            // Convert object to array if needed
            if (system.stress.bars && typeof system.stress.bars === 'object' && system.stress.bars !== null) {
              const barsObj = system.stress.bars as any;
              // Check if it's an object with numeric keys (old format)
              const keys = Object.keys(barsObj);
              if (keys.length > 0 && keys.some((k: string) => !isNaN(parseInt(k)))) {
                system.stress.bars = Object.keys(barsObj)
                  .sort((a, b) => parseInt(a) - parseInt(b))
                  .map(key => barsObj[key]);
              } else {
                // Not a valid object format, initialize fresh
                system.stress.bars = initializeStressBars(resolve, wits);
              }
            } else {
              system.stress.bars = initializeStressBars(resolve, wits);
            }
          }
          
          // Migrate old stress format to bars if needed
          if (!system.stress.bars || system.stress.bars.length === 0) {
            const oldCurrent = system.stress.current || 0;
            system.stress.bars = initializeStressBars(resolve, wits);
            system.stress.currentBar = 0;
            
            // Distribute old stress value across bars
            if (oldCurrent > 0) {
              let remaining = oldCurrent;
              for (let i = 0; i < system.stress.bars.length && remaining > 0; i++) {
                if (remaining >= system.stress.bars[i].max) {
                  system.stress.bars[i].current = 0;
                  remaining -= system.stress.bars[i].max;
                  system.stress.currentBar = i + 1;
                } else {
                  system.stress.bars[i].current = system.stress.bars[i].max - remaining;
                  remaining = 0;
                }
              }
            }
          } else if (system.stress.bars.length < 5) {
            // Add missing bars
            const allBarNames = ['Healthy', 'Stressed', 'Not Well', 'Breaking', 'Breakdown'];
            
            for (let i = system.stress.bars.length; i < 5; i++) {
              system.stress.bars.push({
                name: allBarNames[i],
                max: maxStress,
                current: maxStress,
                penalty: 0
              });
            }
          }
          
          // Update max stress for all bars
          for (const bar of system.stress.bars) {
            const ratio = bar.max > 0 ? bar.current / bar.max : 1;
            bar.max = maxStress;
            bar.current = Math.min(Math.floor(maxStress * ratio), maxStress);
          }
          
          // Ensure currentBar exists
          if (system.stress.currentBar === undefined || system.stress.currentBar === null) {
            system.stress.currentBar = 0;
          }
        }
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
    
    // Stress: current stress bar (for Carousel)
    const stressBars = system.stress?.bars ?? [];
    const stressIdx = Math.max(0, Math.min(Number(system.stress?.currentBar ?? 0), stressBars.length - 1));
    const stressBar = stressBars[stressIdx] ?? { current: 0, max: 0 };
    
    system.tracked.stress = {
      value: Math.max(0, Number(stressBar.current ?? 0)),
      max: Math.max(0, Number(stressBar.max ?? 0))
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
    if (system.health && system.health.bars && Array.isArray(system.health.bars)) {
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
    if (system.health && system.health.bars && Array.isArray(system.health.bars)) {
      const currentBar = system.health.bars[system.health.currentBar || 0];
      if (currentBar) {
        currentBar.current = Math.max(currentBar.current - amount, 0);
        await (this as any).update({ 'system.health': system.health });
      }
    }
  }
}
