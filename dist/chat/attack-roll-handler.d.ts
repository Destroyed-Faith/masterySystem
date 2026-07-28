/**
 * Attack Roll Click Handler
 * Handles clicks on .roll-attack-btn buttons in chat messages
 * Moved from module.ts to avoid circular dependencies
 */
export declare function registerAttackRollClickHandler(): void;
/**
 * Run the attack roll pipeline for an attack card (fresh roll → on success the
 * damage dialog and follow-ups). Invoked by the Roll button click, and by the
 * Faith Fracture reroll flow (`faithReroll` set): the reroll re-runs the whole
 * pipeline so a rerolled hit can proceed to damage — but must NOT re-spend the
 * attack action or re-trigger one-time side effects (Dread gate, Disrupt
 * consumption, Blood Raise HP loss) that the original roll already paid.
 */
export declare function executeAttackRollFromCard(button: JQuery, messageId: string, opts?: {
    faithReroll?: {
        spenderName: string;
    };
}): Promise<void>;
//# sourceMappingURL=attack-roll-handler.d.ts.map