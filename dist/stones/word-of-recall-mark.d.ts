/**
 * Word of Recall — mark tracking (PG "Word of Recall (Ritual)").
 *
 * Special Cost Rule: the Stones paid remain Sealed while the mark exists.
 * They return only after the mark is used, dismissed, broken, or removed,
 * followed by a Safe Haven Rest. The mark is stored as an actor flag; the
 * Safe Haven Rest builder keeps the marked Stones Sealed while it is set.
 */
export interface WordOfRecallMark {
    /** Sealed stones per stone-pool attribute (placed-stone path). */
    attrCounts: Record<string, number>;
    /** Sealed stones from the generic ready/exhausted path. */
    generic: number;
    raise: number;
    createdAt: number;
}
export declare function getWordOfRecallMark(actor: any): WordOfRecallMark | null;
export declare function setWordOfRecallMark(actor: any, mark: Omit<WordOfRecallMark, 'createdAt'>): Promise<void>;
/** Mark used / dismissed / broken — the next Safe Haven Rest returns the Stones. */
export declare function clearWordOfRecallMark(actor: any): Promise<void>;
/** Chat button handler: "Use / Dismiss Mark" on the Word of Recall success card. */
export declare function registerWordOfRecallChatHandler(): void;
//# sourceMappingURL=word-of-recall-mark.d.ts.map