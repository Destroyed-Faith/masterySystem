/**
 * One-time v0.9.9.0 migration for player characters.
 *
 * Computes preserved Attribute XP and Lifetime XP, then flags the actor for
 * a single respec. Running again does not recompute or rewrite Attributes.
 */
export declare const V099_PREPARED_FLAG = "v099CorePrepared";
export declare const V099_RESPEC_FLAG = "needsV099Respec";
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
export declare function v099PrepareUpdate(actor: any): Record<string, unknown> | null;
export declare function runV099CoreMigration(actors: any[]): Promise<number>;
export declare function registerV099SchemaSetting(): void;
//# sourceMappingURL=v099-migration.d.ts.map