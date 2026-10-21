/**
 * Quiet v0.9.9 schema ensure for player characters.
 *
 * Attribute / Stone rules are already live. This no longer opens a respec
 * dialog or sets `needsV099Respec`. It only stamps prepared + Stones-on and
 * clears any leftover migration flags from older worlds.
 */
export declare const V099_PREPARED_FLAG = "v099CorePrepared";
/** @deprecated Cleared on load; migration UI is retired. */
export declare const V099_RESPEC_FLAG = "needsV099Respec";
/** @deprecated Cleared on load; migration UI is retired. */
export declare const V099_LIFETIME_FLAG = "needsV099LifetimeXp";
/** GM opened this character's assigned Stones so they can be cleared and placed again. */
export declare const STONE_REDISTRIBUTE_FLAG = "stoneRedistribute";
export interface V099PrepareResult {
    changed: boolean;
    alreadyPrepared: boolean;
    earnedAttributeXp: number;
    earnedSource: 'snapshot' | 'package' | 'stored';
    lifetimeXp: number | null;
    lifetimeSource: string;
    needsLifetimeInput: boolean;
}
export declare function planV099Migration(actor: any): V099PrepareResult;
/**
 * Ensure the actor is on live Stone rules with no pending migration UI.
 * Does not rewrite Attribute values.
 */
export declare function v099PrepareUpdate(actor: any): Record<string, unknown> | null;
export declare function runV099CoreMigration(actors: any[]): Promise<number>;
export declare function registerV099SchemaSetting(): void;
//# sourceMappingURL=v099-migration.d.ts.map