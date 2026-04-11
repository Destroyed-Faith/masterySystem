/**
 * Mastery Powers Index
 * 
 * This file automatically aggregates all Mastery Tree powers from individual files.
 * Each tree should export a const TREE_NAME_POWERS: PowerDefinition[] or NewArtifactPowerData[]
 * 
 * NOTE: Migrating to new structure (v0.4.18+). Old PowerDefinition format is still supported for backwards compatibility.
 */

import type { PowerDefinition } from './types.js';
import type { NewArtifactPowerData } from '../../types/item.js';

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
import { THUNDERER_POWERS } from './thunderer.js';
// ... etc

/**
 * Map from tree display name to its power array.
 * This is the single source of truth for which powers belong to which tree.
 */
const TREE_POWER_MAP: Record<string, (PowerDefinition | NewArtifactPowerData)[]> = {
    'Crusader': CRUSADER_POWERS,
    'Battlemage': BATTLEMAGE_POWERS,
    'Berserker of the Blood Moon': BERSERKER_POWERS,
    'Sanctifier': SANCTIFIER_POWERS,
    'Alchemist': ALCHEMIST_POWERS,
    'Catalyst': CATALYST_POWERS,
    'Juggernaut': JUGGERNAUT_POWERS,
    'Grim Hunter': GRIM_HUNTER_POWERS,
    'Wild Stalker': WILD_STALKER_POWERS,
    'Elemental Scholar': ELEMENTAL_SCHOLAR_POWERS,
    'Werewolf': WEREWOLF_POWERS,
    'Werebear': WEREBEAR_POWERS,
    'Dragon': DRAGON_POWERS,
    'Ravenlord': RAVENLORD_POWERS,
    'Wraith': WRAITH_POWERS,
    'Mesmer': MESMER_POWERS,
    'Marked One': MARKED_ONE_POWERS,
    'Spellshaper': SPELLSHAPER_POWERS,
    'Frostmonger': FROSTMONGER_POWERS,
    'Scourge': SCOURGE_POWERS,
    'Curseweaver': CURSEWEAVER_POWERS,
    'Siren': SIREN_POWERS,
    'Crane': CRANE_POWERS,
    'Lotus': LOTUS_POWERS,
    'Forgemaster': FORGEMASTER_POWERS,
    'Witchbane': WITCHBANE_POWERS,
    'Titan Runecaster': TITAN_RUNECASTER_POWERS,
    'Thunderer': THUNDERER_POWERS,
};

/**
 * All mastery powers from all trees (flat list)
 */
export const ALL_MASTERY_POWERS: (PowerDefinition | NewArtifactPowerData)[] =
    Object.values(TREE_POWER_MAP).flat();

/**
 * Get all powers for a specific Mastery Tree
 * @param treeName - The display name of the Mastery Tree (e.g. "Crusader")
 */
export function getPowersForTree(treeName: string): (PowerDefinition | NewArtifactPowerData)[] {
    return TREE_POWER_MAP[treeName] ?? [];
}

/**
 * Get a specific power by tree and name
 */
export function getPower(treeName: string, powerName: string): (PowerDefinition | NewArtifactPowerData) | undefined {
    const treePowers = getPowersForTree(treeName);
    return treePowers.find(p => p.name === powerName);
}

// Re-export types
export type { PowerDefinition, PowerLevelDefinition } from './types.js';

