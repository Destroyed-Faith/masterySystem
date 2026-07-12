/**
 * Collect Combat Senses granted to an actor and resolve the active Sense Slot.
 */
import type { CombatSenseId } from './combat-senses.js';
export interface CombatSensesData {
    /** Active sense in the Sense Slot (default Normal Combat Awareness). */
    activeSenseId: CombatSenseId;
    /** Special senses granted by Echo / Artifact / Heightened Senses picks. */
    grantedSenseIds: CombatSenseId[];
    /** Additional special senses slotted as normal Passives. */
    passiveSenseIds: CombatSenseId[];
    /** Minor upgrade — augments Normal Awareness in darkness. */
    hasDarkvision?: boolean;
}
export declare const DEFAULT_COMBAT_SENSES: CombatSensesData;
export declare function normalizeCombatSensesData(raw: unknown): CombatSensesData;
/** Scan equipped artifacts / flags for granted special senses. */
export declare function collectGrantedCombatSenses(actor: any): CombatSenseId[];
/** All senses the actor may use (for targeting / perception). */
export declare function listActorCombatSenses(actor: any): CombatSenseId[];
export interface CombatSensesPanelRow {
    id: CombatSenseId;
    label: string;
    rangeM: number;
    selected: boolean;
}
export interface CombatSensesPanelContext {
    activeSenseId: CombatSenseId;
    hasDarkvision: boolean;
    slotOptions: Array<{
        id: CombatSenseId;
        label: string;
    }>;
    grantedRows: CombatSensesPanelRow[];
    passiveRows: CombatSensesPanelRow[];
    activeSenseLabel: string;
}
/** Character sheet context for Sense Slot + granted sense picks. */
export declare function buildCombatSensesPanelContext(actor: any): CombatSensesPanelContext;
/** Primary active sense for sense-based rules (Sense Slot contents). */
export declare function getActiveCombatSense(actor: any): CombatSenseId;
export declare function isNonSightCombatSense(senseId: CombatSenseId): boolean;
//# sourceMappingURL=combat-sense-collection.d.ts.map