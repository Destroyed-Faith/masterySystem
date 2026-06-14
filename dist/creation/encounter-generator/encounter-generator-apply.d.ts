/**
 * Encounter Generator — world write (folder + NPC actors).
 *
 * Creates a new Actor folder named after the encounter and populates it with
 * `npc` actors built from the (possibly edited) plan. No tokens are placed and
 * no Combat is created — the actors are ready to drag onto the canvas.
 */
import type { EnemyStatBlock, EncounterPlan, EncounterSelection } from './encounter-generator-types.js';
/** Build the `system` payload for one enemy stat block. */
export declare function buildNpcSystem(block: EnemyStatBlock): Record<string, unknown>;
/**
 * Create the folder + NPC actors for the plan. Returns the number of actors
 * created, or null on failure.
 */
export declare function applyEncounter(selection: EncounterSelection, plan: EncounterPlan): Promise<{
    folderId: string;
    actorCount: number;
} | null>;
//# sourceMappingURL=encounter-generator-apply.d.ts.map