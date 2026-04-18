/**
 * Echo Creation Dialog for Character Sheet
 *
 * Single dialog that walks the user through:
 *   1. Echo selection (7 Echos)
 *   2. Sub-choice (Elves lineage / Sentinels order) \u2014 only if the Echo has one
 *   3. Veiled Form selection \u2014 Dragonborn only
 *   4. Start Card (1 from the chosen Echo's deck)
 *
 * Separate `showEchoCardPickDialog` handles later card picks (post-creation or on rank-up).
 *
 * All writes land on the Actor under `system.echo.*` \u2014 no Item type involved.
 */
/**
 * Show the full Echo creation dialog (Echo \u2192 sub-choice \u2192 veiled \u2192 start card).
 */
export declare function showEchoCreationDialog(actor: Actor): Promise<void>;
/**
 * Post-creation / rank-up card picker. Lets the user pick one additional card
 * from their chosen Echo's deck (any card not already selected).
 */
export declare function showEchoCardPickDialog(actor: Actor): Promise<void>;
//# sourceMappingURL=character-sheet-echo-dialog.d.ts.map