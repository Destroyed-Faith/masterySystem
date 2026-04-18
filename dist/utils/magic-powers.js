/**
 * Magic Powers (Spell School Powers) Index
 *
 * This file provides access to magic powers organized by spell school.
 * Converts SpellDefinition to PowerDefinition format for compatibility.
 */
// Active Spell Schools
import { BLACK_WRIT_SPELLS } from './spells/black-writ.js';
import { PACT_BREACH_SPELLS } from './spells/pact-breach.js';
import { SPLIT_TEMPEST_SPELLS } from './spells/split-tempest.js';
import { PYRE_CALCULUS_SPELLS } from './spells/pyre-calculus.js';
// Deprecated — kept for existing actor items, no longer selectable in the Power Picker
// import { PYROMANCY_SPELLS } from './spells/pyromancy.js';
// import { MALEFIC_ARTS_SPELLS } from './spells/malefic-arts.js';
// import { OLD_PACT_SPELLS } from './spells/old-pact.js';
// import { THORN_WHISPER_SPELLS } from './spells/thorn-whisper.js';
// import { BREACH_BREAK_SPELLS } from './spells/breach-break.js';
// import { AEGIS_BENEDICTIONS_SPELLS } from './spells/aegis-benedictions.js';
// import { BOUND_MIND_SPELLS } from './spells/bound-mind.js';
/**
 * Convert SpellLevelDefinition to PowerLevelDefinition
 */
function convertSpellLevelToPowerLevel(spellLevel) {
    const powerLevel = {
        level: spellLevel.level,
        type: spellLevel.type,
        range: spellLevel.range,
        aoe: spellLevel.aoe,
        duration: spellLevel.duration,
        effect: spellLevel.effect,
        special: spellLevel.special,
        cost: spellLevel.cost ? {
            action: spellLevel.cost.action,
            movement: spellLevel.cost.movement,
            reaction: spellLevel.cost.reaction,
            charges: spellLevel.cost.charged ? 1 : 0,
            stones: 0
        } : undefined,
        roll: spellLevel.roll
    };
    // Add raises to effect if present
    if (spellLevel.raises) {
        powerLevel.effect = powerLevel.effect + (powerLevel.effect ? ' | ' : '') + `Raises: ${spellLevel.raises}`;
    }
    return powerLevel;
}
/**
 * Convert SpellDefinition to PowerDefinition
 */
function convertSpellToPower(spell) {
    // Map spellType to powerType
    let powerType = 'active';
    if (spell.spellType === 'utility') {
        powerType = 'utility';
    }
    else if (spell.spellType === 'movement') {
        powerType = 'movement';
    }
    else if (spell.spellType === 'buff') {
        powerType = 'buff';
    }
    return {
        name: spell.name,
        tree: spell.school, // Convert school to tree
        powerType: powerType,
        description: spell.description,
        levels: spell.levels.map(convertSpellLevelToPowerLevel)
    };
}
/**
 * All magic powers from all active spell schools (deprecated schools are omitted here but remain on disk).
 */
export const ALL_MAGIC_POWERS = [
    ...BLACK_WRIT_SPELLS.map(convertSpellToPower),
    ...PACT_BREACH_SPELLS.map(convertSpellToPower),
    ...SPLIT_TEMPEST_SPELLS.map(convertSpellToPower),
    ...PYRE_CALCULUS_SPELLS.map(convertSpellToPower)
];
/**
 * Get all magic powers for a specific Spell School
 * @param schoolName - The name of the Spell School
 * @returns Array of PowerDefinition objects for that school
 */
export function getMagicPowersBySchool(schoolName) {
    return ALL_MAGIC_POWERS.filter(power => power.tree === schoolName);
}
/**
 * Get a specific magic power by school and name
 * @param schoolName - The name of the Spell School
 * @param powerName - The name of the power
 * @returns PowerDefinition or undefined if not found
 */
export function getMagicPower(schoolName, powerName) {
    return ALL_MAGIC_POWERS.find(power => power.tree === schoolName && power.name === powerName);
}
//# sourceMappingURL=magic-powers.js.map