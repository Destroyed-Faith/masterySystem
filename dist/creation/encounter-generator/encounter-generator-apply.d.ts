/**
 * Encounter Generator — world write (folder + NPC actors).
 *
 * Creates a new Actor folder named after the encounter and populates it with
 * `npc` actors built from the (possibly edited) plan. No tokens are placed and
 * no Combat is created — the actors are ready to drag onto the canvas.
 */
import type { EncounterPlan, EncounterProjectPlan, EncounterSelection, EnemyStatBlock, PartyMetrics, ThreatReport } from './encounter-generator-types.js';
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
/** Build the boss actor `system` payload from a concept plan. */
export declare function buildProjectBossSystem(plan: EncounterProjectPlan): Record<string, unknown>;
/** Build the add prototype actor `system` payload. */
export declare function buildProjectAddSystem(plan: EncounterProjectPlan): Record<string, unknown> | null;
/** Environment mechanic actor (zones roll their own damage). */
export declare function buildProjectEnvironmentSystem(plan: EncounterProjectPlan): Record<string, unknown> | null;
/** Compact "2-page" NPC sheet as journal HTML (printable via browser). */
export declare function buildNpcSheetHtml(name: string, plan: EncounterProjectPlan): string;
/** Encounter summary page (threat report, spawn rules, warnings). */
export declare function buildSummaryHtml(name: string, plan: EncounterProjectPlan, report: ThreatReport, party: PartyMetrics): string;
/**
 * Create the full Encounter-Projekt: folder tree (Boss / Adds / Encounter
 * Mechanics), the actors, and the summary journal with print sheets.
 */
export declare function applyEncounterProject(name: string, party: PartyMetrics, plan: EncounterProjectPlan, report: ThreatReport): Promise<{
    folderId: string;
    actorCount: number;
} | null>;
//# sourceMappingURL=encounter-generator-apply.d.ts.map