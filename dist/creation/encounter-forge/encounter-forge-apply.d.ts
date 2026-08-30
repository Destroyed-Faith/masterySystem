/**
 * Encounter Forge — world write (folder + NPC actors + journal).
 *
 * The generated Actor is the SOURCE OF TRUTH: every solved value lands in
 * real, sheet-editable NPC fields (evade/armor/SR/DR% on the stat block,
 * attack rows, phases with own health pools, reactions, phasing charge
 * flags). The journal summarizes the same solution — it never contains
 * numbers the actor doesn't carry.
 *
 * No fake attributes: NPC combat math never reads attributes, so they stay
 * at schema defaults. The old Evade -> Agility back-calculation is gone.
 */
import type { EncounterDesign, MainEnemyConcept } from './encounter-model.js';
import type { EncounterSolution, SolvedAddGroup, SolvedPhase } from './solve-encounter.js';
import type { EncounterWarning } from './encounter-validator.js';
import type { SolvedAttack } from './offense-solver.js';
export declare function solvedAttackToNpcRow(attack: SolvedAttack): Record<string, unknown>;
/** Build the full NPC `system` payload for one solved enemy across phases. */
export declare function buildForgeNpcSystem(design: EncounterDesign, enemy: MainEnemyConcept, phases: SolvedPhase[]): Record<string, unknown>;
/** Build the NPC `system` payload for one add group prototype. */
export declare function buildForgeAddSystem(add: SolvedAddGroup, npcMr: number): Record<string, unknown>;
export declare function buildForgeSummaryHtml(design: EncounterDesign, solution: EncounterSolution, warnings: EncounterWarning[]): string;
export declare function applyEncounterForge(design: EncounterDesign, solution: EncounterSolution, warnings: EncounterWarning[]): Promise<{
    folderId: string;
    actorCount: number;
} | null>;
//# sourceMappingURL=encounter-forge-apply.d.ts.map