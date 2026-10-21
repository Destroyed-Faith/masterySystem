/**
 * Destroyed Faith — Rules Index (world Journal).
 *
 * Idempotent GM helper: creates or updates a single world JournalEntry that
 * links into the three system-owned Rules Compendium packs. Does not import
 * pack contents into the world.
 */
/**
 * Create or update the world Rules Index Journal. GM only.
 * @returns The JournalEntry document, or null on failure.
 */
export declare function ensureRulesIndexJournal(): Promise<any | null>;
/** Register GM setting + API for the Rules Index. */
export declare function registerRulesJournalHooks(): void;
//# sourceMappingURL=rules-index.d.ts.map