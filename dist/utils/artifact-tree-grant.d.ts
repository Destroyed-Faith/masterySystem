/**
 * Grant / wire embedded artifacts to world Builder-Trees for evolution.
 */
export interface WireArtifactResult {
    ok: boolean;
    reason?: string;
    alreadyWired?: boolean;
}
/** Infer catalog key from item display name (Echo + General artifacts). */
export declare function inferArtifactKeyFromName(name: string): string | null;
/**
 * Wire an embedded artifact to its world evolution tree.
 * Idempotent when already wired to the same tree.
 */
export declare function wireEmbeddedArtifactToWorldTree(actor: Actor, embeddedItem: any, options?: {
    sourceWorldItem?: any;
    notify?: boolean;
}): Promise<WireArtifactResult>;
/**
 * Grant the Level-1 root of an artifact tree to an actor (Echo or General).
 */
export declare function grantArtifactTreeToActor(actor: Actor, artifactKey: string): Promise<any | null>;
/** @deprecated Use grantArtifactTreeToActor — kept for existing imports. */
export declare function grantEchoArtifactTreeToActor(actor: Actor, echoArtifactKey: string): Promise<any | null>;
/** True when actor has any embedded artifact (wired or wireable). */
export declare function actorHasProgressionArtifacts(actor: Actor): boolean;
/** Embedded artifacts missing evolution wiring but potentially repairable. */
export declare function listUnwiredEmbeddedArtifacts(actor: Actor): any[];
//# sourceMappingURL=artifact-tree-grant.d.ts.map