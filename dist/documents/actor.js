/**
 * Extended Actor document for Mastery System
 */
import { calculateStones, calculateTotalStones, updateAttributeStones } from '../utils/calculations.js';
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
        const system = this.system;
        // Calculate derived values if needed
        if (system.attributes) {
            // Calculate attribute stones using /8 rule (Single Source of Truth)
            for (const attr of Object.values(system.attributes)) {
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
            }
            else {
                system.stones.current = Math.max(0, Math.min(system.stones.current, system.stones.maximum));
            }
        }
    }
    /**
     * Prepare derived equipment data (armorTotal, evadeTotal, etc.)
     */
    prepareDerivedData() {
        const system = this.system;
        const items = this.items || [];
        // Ensure combat object exists
        if (!system.combat) {
            system.combat = {};
        }
        // Find equipped items
        let equippedWeapon = null;
        let equippedArmor = null;
        let equippedShield = null;
        for (const item of items) {
            const itemSystem = item.system || {};
            if (itemSystem.equipped === true) {
                if (item.type === 'weapon' && !equippedWeapon) {
                    equippedWeapon = item;
                }
                else if (item.type === 'armor' && !equippedArmor) {
                    equippedArmor = item;
                }
                else if (item.type === 'shield' && !equippedShield) {
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
        const armorValue = equippedArmor?.system?.armorValue || 0;
        const shieldValue = equippedShield?.system?.shieldValue || 0;
        system.combat.armorTotal = masteryRank + armorValue + shieldValue;
        // Calculate evadeTotal = base evade + shield evadeBonus
        const baseEvade = system.combat.evade || 0;
        const shieldEvadeBonus = equippedShield?.system?.evadeBonus || 0;
        system.combat.evadeTotal = baseEvade + shieldEvadeBonus;
    }
    /**
     * Heal the actor
     */
    async heal(amount) {
        const system = this.system;
        if (system.health && system.health.bars) {
            const currentBar = system.health.bars[system.health.currentBar || 0];
            if (currentBar) {
                currentBar.current = Math.min(currentBar.current + amount, currentBar.max);
                await this.update({ 'system.health': system.health });
            }
        }
    }
    /**
     * Apply damage to the actor
     */
    async applyDamage(amount) {
        const system = this.system;
        if (system.health && system.health.bars) {
            const currentBar = system.health.bars[system.health.currentBar || 0];
            if (currentBar) {
                currentBar.current = Math.max(currentBar.current - amount, 0);
                await this.update({ 'system.health': system.health });
            }
        }
    }
}
//# sourceMappingURL=actor.js.map