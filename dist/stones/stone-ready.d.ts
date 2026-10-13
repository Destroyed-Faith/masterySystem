/**
 * Canonical Ready / Available Stones math.
 *
 * Single source of truth shared by:
 * - GM Stone-Übersicht (`readyExpected`)
 * - Stone Powers "Available Stones" gems
 * - `poolSpendableStones` / payment
 *
 * Formula (Lifetime track):
 *   max = assigned stones on the Lifetime XP track
 *   readyExpected = max − sealed − burned − max(sustained, summon/familiar hold)
 *
 * Does NOT use Attribute÷8, pool.current, or retired artifact activation flags
 * for Available. `pool.current` is only mirrored for Audit mismatch notes.
 */
export interface AttrStoneReadyView {
    key: string;
    assigned: number;
    /** Lifetime track capacity (same as Audit "Max"). */
    max: number;
    /** Live pool.current (Audit "Ready" column only — not used for Available). */
    current: number;
    sealed: number;
    burned: number;
    sustained: number;
    summonBound: number;
    /**
     * Stones the player may place in Stone Powers.
     * Identical to Audit "Erwartet Ready".
     */
    readyExpected: number;
    lifetimeStoneMode: boolean;
}
/** Sustained counts that Summon Bonds / Familiars currently hold. */
export declare function summonBoundSustainedByAttr(actor: any): Record<string, number>;
/**
 * Audit-identical Ready view for one attribute (or `colorless`).
 */
export declare function getAttrStoneReadyView(actor: any, attr: string): AttrStoneReadyView;
/** All attribute pools (no colorless) — Stone Powers Available row source. */
export declare function listAttrStoneReadyViews(actor: any): AttrStoneReadyView[];
/**
 * Sync pool `max` / summon holds to the Lifetime Audit track.
 *
 * Out of combat: also refill `current` to readyExpected.
 * In combat: never refill spent stones — round 2+ Stone Recovery (Mastery Rank)
 * is the only way pools come back mid-fight. Only clamp `current` down when it
 * exceeds readyExpected (e.g. after a sustain/seal increase).
 */
export declare function alignStonePoolsToAuditReady(actor: any): Promise<boolean>;
//# sourceMappingURL=stone-ready.d.ts.map