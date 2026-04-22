/**
 * Mastery Powers Index
 *
 * This file automatically aggregates all Mastery Tree powers from individual files.
 * Each tree should export a const TREE_NAME_POWERS: PowerDefinition[] or NewArtifactPowerData[]
 *
 * NOTE: Migrating to new structure (v0.4.18+). Old PowerDefinition format is still supported for backwards compatibility.
 */
// Active Mastery Trees
import { DREADSTALKER_POWERS } from './dreadstalker.js';
import { DOOMSCRIBE_POWERS } from './doomscribe.js';
import { HEXBOUND_HARRIER_POWERS } from './hexbound-harrier.js';
import { VOID_TESTAMENT_POWERS } from './void-testament.js';
import { GALE_BREAKER_POWERS } from './gale-breaker.js';
import { STORM_VEIL_POWERS } from './storm-veil.js';
import { ASHGUARD_POWERS } from './ashguard.js';
import { INFERNAL_BASTION_POWERS } from './infernal-bastion.js';
import { WARDEN_DRAGON_POWERS } from './warden-dragon.js';
import { RAPTOR_DRAGON_POWERS } from './raptor-dragon.js';
import { DREADWYRM_POWERS } from './dreadwyrm.js';
import { SKY_TYRANT_POWERS } from './sky-tyrant.js';
// Deprecated — kept for existing actor items, no longer selectable in the Power Picker
// import { CRUSADER_POWERS } from './crusader.js';
// import { BATTLEMAGE_POWERS } from './battlemage.js';
// import { BERSERKER_POWERS } from './berserker.js';
// import { SANCTIFIER_POWERS } from './sanctifier.js';
// import { ALCHEMIST_POWERS } from './alchemist.js';
// import { CATALYST_POWERS } from './catalyst.js';
// import { JUGGERNAUT_POWERS } from './juggernaut.js';
// import { GRIM_HUNTER_POWERS } from './grim-hunter.js';
// import { WILD_STALKER_POWERS } from './wild-stalker.js';
// import { ELEMENTAL_SCHOLAR_POWERS } from './elemental-scholar.js';
// import { WEREWOLF_POWERS } from './werewolf.js';
// import { WEREBEAR_POWERS } from './werebear.js';
// import { DRAGON_POWERS } from './dragon.js';
// import { RAVENLORD_POWERS } from './ravenlord.js';
// import { WRAITH_POWERS } from './wraith.js';
// import { MESMER_POWERS } from './mesmer.js';
// import { MARKED_ONE_POWERS } from './marked-one.js';
// import { SPELLSHAPER_POWERS } from './spellshaper.js';
// import { FROSTMONGER_POWERS } from './frostmonger.js';
// import { SCOURGE_POWERS } from './scourge.js';
// import { CURSEWEAVER_POWERS } from './curseweaver.js';
// import { SIREN_POWERS } from './siren.js';
// import { CRANE_POWERS } from './crane.js';
// import { LOTUS_POWERS } from './lotus.js';
// import { FORGEMASTER_POWERS } from './forgemaster.js';
// import { WITCHBANE_POWERS } from './witchbane.js';
// import { TITAN_RUNECASTER_POWERS } from './titan-runecaster.js';
// import { THUNDERER_POWERS } from './thunderer.js';
/**
 * Map from tree display name to its power array.
 * This is the single source of truth for which powers belong to which tree.
 * Only active (non-deprecated) trees are listed here; they drive the Power Picker.
 */
/** Tree display name → embedded powers (single source of truth for picker + audits). */
export const MASTERY_TREE_POWER_MAP = {
    'Dreadstalker': DREADSTALKER_POWERS,
    'Doomscribe': DOOMSCRIBE_POWERS,
    'Hexbound Harrier': HEXBOUND_HARRIER_POWERS,
    'Void Testament': VOID_TESTAMENT_POWERS,
    'Gale Breaker': GALE_BREAKER_POWERS,
    'Storm Veil': STORM_VEIL_POWERS,
    'Ashguard': ASHGUARD_POWERS,
    'Infernal Bastion': INFERNAL_BASTION_POWERS,
    'Warden Dragon': WARDEN_DRAGON_POWERS,
    'Raptor Dragon': RAPTOR_DRAGON_POWERS,
    'Dreadwyrm': DREADWYRM_POWERS,
    'Sky Tyrant': SKY_TYRANT_POWERS,
};
/**
 * All mastery powers from all trees (flat list)
 */
export const ALL_MASTERY_POWERS = Object.values(MASTERY_TREE_POWER_MAP).flat();
/**
 * Get all powers for a specific Mastery Tree
 * @param treeName - The display name of the Mastery Tree (e.g. "Dreadstalker")
 */
export function getPowersForTree(treeName) {
    return MASTERY_TREE_POWER_MAP[treeName] ?? [];
}
/**
 * Get a specific power by tree and name
 */
export function getPower(treeName, powerName) {
    const treePowers = getPowersForTree(treeName);
    return treePowers.find(p => p.name === powerName);
}
//# sourceMappingURL=index.js.map