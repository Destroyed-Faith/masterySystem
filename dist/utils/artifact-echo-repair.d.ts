/**
 * Repair / sync embedded artifacts against the world Builder-Tree.
 */
/** True when the embedded copy looks stale (missing progression data). */
export declare function embeddedArtifactNeedsSync(emb: any): boolean;
/** @deprecated Use embeddedArtifactNeedsSync */
export declare function echoEmbeddedArtifactNeedsSync(emb: any): boolean;
/**
 * Copy name/img/system from the matching world tree node onto the actor item.
 * @returns true when an update was applied.
 */
export declare function syncEmbeddedArtifactFromWorldNode(emb: any, actor: any): Promise<boolean>;
/**
 * Wire a legacy embedded artifact (no evolution root) to the world tree
 * and refresh its node data.
 */
export declare function repairArtifactEvolutionLink(actor: any, emb: any): Promise<boolean>;
/** @deprecated Use repairArtifactEvolutionLink */
export declare function repairEchoArtifactTreeLink(actor: any, emb: any): Promise<boolean>;
/**
 * Repair all tree-linked artifacts on an actor: wire missing links, sync stale
 * data from the world library, and ensure activation flags exist.
 */
export declare function repairArtifactEvolutionLinks(actor: any): Promise<number>;
/** @deprecated Use repairArtifactEvolutionLinks */
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