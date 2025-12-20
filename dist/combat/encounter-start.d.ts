/**
 * Encounter Start Flow
 * Orchestrates the one-click "Begin Encounter" setup pipeline
 *
 * Flow:
 * 1. GM clicks "Begin Encounter" button
 * 2. For all PC combatants: open passive selection (read-only if already done)
 * 3. After passive selection: open initiative shop, auto-roll, allow shopping
 * 4. For all NPC combatants: auto-roll initiative (roll&keep)
 * 5. Start combat after all PCs confirm initiative
 */
/**
 * Begin encounter flow (called by GM)
 */
export declare function beginEncounter(combat: Combat): Promise<void>;
/**
 * Initialize encounter start system
 */
export declare function initializeEncounterStart(): void;
//# sourceMappingURL=encounter-start.d.ts.map