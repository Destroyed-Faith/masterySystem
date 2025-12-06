/**
 * Equipment Penalties System for Mastery System
 *
 * Rules from rulebook (Lines 5078-5093):
 *
 * Armor Penalties:
 * - Light Armor: No penalty
 * - Medium Armor: Stealth -2 dice, Evade -2
 * - Heavy Armor: Athletics/Acrobatics/Stealth -4 dice, Evade -4
 *
 * Shield Penalties:
 * - Parry Shield (+1 AR, +4 Evade): No penalty
 * - Medium Shield (+2 AR): Evade -4
 * - Tower Shield (+4 AR): Evade -8
 */
/**
 * Armor types and their penalties
 */
export var ArmorType;
(function (ArmorType) {
    ArmorType["LIGHT"] = "light";
    ArmorType["MEDIUM"] = "medium";
    ArmorType["HEAVY"] = "heavy";
    ArmorType["NONE"] = "none";
})(ArmorType || (ArmorType = {}));
/**
 * Shield types and their bonuses/penalties
 */
export var ShieldType;
(function (ShieldType) {
    ShieldType["NONE"] = "none";
    ShieldType["PARRY"] = "parry";
    ShieldType["MEDIUM"] = "medium";
    ShieldType["TOWER"] = "tower"; // +4 AR, -8 Evade
})(ShieldType || (ShieldType = {}));
/**
 * Get armor penalties based on armor type
 */
export function getArmorPenalties(armorType) {
    switch (armorType) {
        case ArmorType.LIGHT:
            return {
                athletics: 0,
                acrobatics: 0,
                stealth: 0,
                evade: 0,
                fromArmor: true,
                fromShield: false
            };
        case ArmorType.MEDIUM:
            return {
                athletics: 0,
                acrobatics: 0,
                stealth: 2,
                evade: 2,
                fromArmor: true,
                fromShield: false
            };
        case ArmorType.HEAVY:
            return {
                athletics: 4,
                acrobatics: 4,
                stealth: 4,
                evade: 4,
                fromArmor: true,
                fromShield: false
            };
        default:
            return {
                athletics: 0,
                acrobatics: 0,
                stealth: 0,
                evade: 0,
                fromArmor: false,
                fromShield: false
            };
    }
}
/**
 * Get shield penalties based on shield type
 */
export function getShieldPenalties(shieldType) {
    switch (shieldType) {
        case ShieldType.PARRY:
            return {
                evade: 0, // No penalty
                evadeBonus: 4, // +4 Evade
                armorBonus: 1 // +1 AR
            };
        case ShieldType.MEDIUM:
            return {
                evade: 4, // -4 Evade penalty
                evadeBonus: 0,
                armorBonus: 2 // +2 AR
            };
        case ShieldType.TOWER:
            return {
                evade: 8, // -8 Evade penalty
                evadeBonus: 0,
                armorBonus: 4 // +4 AR
            };
        default:
            return {
                evade: 0,
                evadeBonus: 0,
                armorBonus: 0
            };
    }
}
/**
 * Calculate total equipment penalties for an actor
 */
export function calculateEquipmentPenalties(actor) {
    const system = actor.system;
    // Get armor type from equipped armor
    const armorType = system.combat?.armorType || ArmorType.NONE;
    const shieldType = system.combat?.shieldType || ShieldType.NONE;
    // Get penalties from each source
    const armorPenalties = getArmorPenalties(armorType);
    const shieldPenalties = getShieldPenalties(shieldType);
    // Combine penalties
    return {
        athletics: armorPenalties.athletics,
        acrobatics: armorPenalties.acrobatics,
        stealth: armorPenalties.stealth,
        evade: armorPenalties.evade + shieldPenalties.evade,
        fromArmor: armorPenalties.fromArmor,
        fromShield: shieldPenalties.evade > 0
    };
}
/**
 * Apply equipment penalties to a skill roll
 * Returns the modified dice pool
 *
 * @param actor - The actor
 * @param skill - Skill being rolled
 * @param baseDice - Base dice pool
 * @returns Modified dice pool after penalties
 */
export function applySkillPenalties(actor, skill, baseDice) {
    const penalties = calculateEquipmentPenalties(actor);
    let penaltyAmount = 0;
    // Check which skill penalties apply
    switch (skill.toLowerCase()) {
        case 'athletics':
            penaltyAmount = penalties.athletics;
            break;
        case 'acrobatics':
            penaltyAmount = penalties.acrobatics;
            break;
        case 'stealth':
            penaltyAmount = penalties.stealth;
            break;
    }
    if (penaltyAmount > 0) {
        console.log(`Mastery System | Equipment penalty: -${penaltyAmount} dice to ${skill}`);
    }
    return Math.max(1, baseDice - penaltyAmount);
}
/**
 * Get equipment penalty summary for display
 */
export function getEquipmentPenaltySummary(actor) {
    const penalties = calculateEquipmentPenalties(actor);
    const summary = [];
    if (penalties.athletics > 0) {
        summary.push(`Athletics -${penalties.athletics} dice`);
    }
    if (penalties.acrobatics > 0) {
        summary.push(`Acrobatics -${penalties.acrobatics} dice`);
    }
    if (penalties.stealth > 0) {
        summary.push(`Stealth -${penalties.stealth} dice`);
    }
    if (penalties.evade > 0) {
        summary.push(`Evade -${penalties.evade}`);
    }
    return summary;
}
/**
 * Get equipment bonuses from shield
 */
export function getShieldBonuses(shieldType) {
    const data = getShieldPenalties(shieldType);
    return {
        armor: data.armorBonus,
        evade: data.evadeBonus
    };
}
//# sourceMappingURL=equipment.js.map