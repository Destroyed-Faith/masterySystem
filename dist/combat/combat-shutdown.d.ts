/**
 * Emergency exit out of an encounter, always reachable for a GM.
 *
 * The regular path is Foundry's End Combat, but it hangs off the carousel and
 * only appears while the carousel considers the encounter healthy. A fight that
 * ends up wedged (stale stone snapshot, a combatant whose actor is gone, flags
 * from an older version) leaves the table with no way out. Deleting the combat
 * document is the one operation that always works, and it fires `deleteCombat`,
 * so the usual cleanup and stone refill still run.
 */
/**
 * Encounter to shut down. Falls back past `combats.active` on purpose: a combat
 * that is not the active one (wrong scene, leftover from a crash) is exactly the
 * kind that gets stuck and still blocks the table.
 */
export declare function findShutdownCombat(): any | null;
/**
 * Tear the encounter down. Deleting comes first because it cannot be refused;
 * `endCombat()` is only the fallback for the case where a broken document
 * rejects deletion.
 */
export declare function shutDownCombat(options?: {
    confirm?: boolean;
}): Promise<boolean>;
//# sourceMappingURL=combat-shutdown.d.ts.map