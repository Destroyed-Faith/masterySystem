/**
 * Mastery Powers Index
 *
 * This file automatically aggregates all Mastery Tree powers from individual files.
 * Each tree should export a const TREE_NAME_POWERS: PowerDefinition[]
 */
// Import all tree powers
import { CRUSADER_POWERS } from './crusader.js';
import { BATTLEMAGE_POWERS } from './battlemage.js';
import { BERSERKER_POWERS } from './berserker.js';
import { SANCTIFIER_POWERS } from './sanctifier.js';
import { ALCHEMIST_POWERS } from './alchemist.js';
import { CATALYST_POWERS } from './catalyst.js';
import { JUGGERNAUT_POWERS } from './juggernaut.js';
import { GRIM_HUNTER_POWERS } from './grim-hunter.js';
import { WILD_STALKER_POWERS } from './wild-stalker.js';
import { ELEMENTAL_SCHOLAR_POWERS } from './elemental-scholar.js';
import { WEREWOLF_POWERS } from './werewolf.js';
import { WEREBEAR_POWERS } from './werebear.js';
import { DRAGON_POWERS } from './dragon.js';
import { RAVENLORD_POWERS } from './ravenlord.js';
import { WRAITH_POWERS } from './wraith.js';
import { MESMER_POWERS } from './mesmer.js';
import { MARKED_ONE_POWERS } from './marked-one.js';
import { SPELLSHAPER_POWERS } from './spellshaper.js';
import { FROSTMONGER_POWERS } from './frostmonger.js';
import { SCOURGE_POWERS } from './scourge.js';
import { CURSEWEAVER_POWERS } from './curseweaver.js';
import { SIREN_POWERS } from './siren.js';
import { CRANE_POWERS } from './crane.js';
import { LOTUS_POWERS } from './lotus.js';
import { FORGEMASTER_POWERS } from './forgemaster.js';
import { WITCHBANE_POWERS } from './witchbane.js';
import { TITAN_RUNECASTER_POWERS } from './titan-runecaster.js';
// ... etc
/**
 * All mastery powers from all trees
 */
export const ALL_MASTERY_POWERS = [
    ...CRUSADER_POWERS,
    ...BATTLEMAGE_POWERS,
    ...BERSERKER_POWERS,
    ...SANCTIFIER_POWERS,
    ...ALCHEMIST_POWERS,
    ...CATALYST_POWERS,
    ...JUGGERNAUT_POWERS,
    ...GRIM_HUNTER_POWERS,
    ...WILD_STALKER_POWERS,
    ...ELEMENTAL_SCHOLAR_POWERS,
    ...WEREWOLF_POWERS,
    ...WEREBEAR_POWERS,
    ...DRAGON_POWERS,
    ...RAVENLORD_POWERS,
    ...WRAITH_POWERS,
    ...MESMER_POWERS,
    ...MARKED_ONE_POWERS,
    ...SPELLSHAPER_POWERS,
    ...FROSTMONGER_POWERS,
    ...SCOURGE_POWERS,
    ...CURSEWEAVER_POWERS,
    ...SIREN_POWERS,
    ...CRANE_POWERS,
    ...LOTUS_POWERS,
    ...FORGEMASTER_POWERS,
    ...WITCHBANE_POWERS,
    ...TITAN_RUNECASTER_POWERS
];
/**
 * Get all powers for a specific Mastery Tree
 * @param treeName - The name of the Mastery Tree
 * @returns Array of PowerDefinition objects for that tree
 */
export function getPowersForTree(treeName) {
    return ALL_MASTERY_POWERS.filter(power => power.tree === treeName);
}
/**
 * Get a specific power by tree and name
 * @param treeName - The name of the Mastery Tree
 * @param powerName - The name of the power
 * @returns PowerDefinition or undefined if not found
 */
export function getPower(treeName, powerName) {
    return ALL_MASTERY_POWERS.find(power => power.tree === treeName && power.name === powerName);
}
//# sourceMappingURL=index.js.map