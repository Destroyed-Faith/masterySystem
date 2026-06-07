/**
 * Repair / sync embedded Echo artifacts against the world Builder-Tree.
 */
/** True when the embedded copy looks stale (missing progression data). */
export declare function echoEmbeddedArtifactNeedsSync(emb: any): boolean;
/**
 * Copy name/img/system from the matching world tree node onto the actor item.
 * @returns true when an update was applied.
 */
export declare function syncEmbeddedArtifactFromWorldNode(emb: any, actor: any): Promise<boolean>;
/**
 * Wire a legacy / fallback Echo artifact (no evolution root) to the world tree
 * and refresh its Level-1 data.
 */
export declare function repairEchoArtifactTreeLink(actor: any, emb: any): Promise<boolean>;
/**
 * Repair all echo artifacts on an actor: wire missing tree links, sync stale
 * Level-1 data from the world library, and ensure activation flags exist.
 */
export declare function repairActorEchoArtifacts(actor: any): Promise<number>;
/** Summarize abilities / base values from an embedded artifact for UI panels. */
export declare function summarizeEmbeddedArtifactDisplay(emb: any, active: boolean): {
    baseValues: any;
    abilities: {
        name: any;
        type: any;
        effect: any;
    }[];
    hasBaseValues: boolean;
    hasAbilities: boolean;
};
//# sourceMappingURL=artifact-echo-repair.d.ts.map