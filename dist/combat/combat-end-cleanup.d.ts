/**
 * Post-combat cleanup that runs on `combatEnd` / `deleteCombat`.
 *
 * Encounter-scoped resources always go away:
 *   - Temporary HP (sourced pools are cleared by `passive-triggers`; the scalar
 *     mirror is zeroed here so stone-granted / manual Temp HP cannot survive).
 *   - Temporary Colorless Stones (also on the action-economy owner document).
 *
 * Ongoing Special Effects are treated asymmetrically on purpose: NPC-side
 * creatures are wiped, player characters keep theirs. Players must resolve
 * their own stacks after the fight — that is part of the rules, not a bug.
 */
/** Zero the Temp HP mirror on every combatant — Temp HP never outlives a fight. */
export declare function resetTempHpAfterCombat(combat: any): Promise<void>;
/** Leftover Temporary Colorless Stones vanish when the encounter ends. */
export declare function clearColorlessStonesAfterCombat(combat: any): Promise<void>;
/**
 * Drop ongoing Special Effects and Mastery active buffs from NPC-side
 * creatures. Player characters keep both so they have to resolve them
 * themselves after the encounter.
 */
export declare function clearNpcOngoingEffectsAfterCombat(combat: any): Promise<void>;
/**
 * Fresh encounter: drop leftovers from a fight that ended without cleanup
 * (crash, no GM online, world from before the cleanup existed). Colorless
 * Stones only ever come from Initiative Exchange, so anything present before
 * the first conversion is stale, and a stale stone assignment snapshot would
 * otherwise reappear in the Stone Powers dialog.
 *
 * Runs at encounter preparation, never at `combatStart` — round-1 stones are
 * bought during the prepare phase and must survive.
 */
export declare function clearStaleStoneStateBeforeEncounter(combat: any): Promise<void>;
/** Single entry point for the `combatEnd` / `deleteCombat` hooks (GM only). */
export declare function runCombatEndCleanup(combat: any): Promise<void>;
//# sourceMappingURL=combat-end-cleanup.d.ts.map