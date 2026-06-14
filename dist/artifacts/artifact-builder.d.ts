/**
 * Artifact Builder Application
 * UI for managing artifact evolution tree nodes
 */
declare const BaseApplication: any;
export declare class ArtifactBuilder extends BaseApplication {
    private rootItem;
    private nodes;
    constructor(rootItem: Item);
    static get defaultOptions(): any;
    /**
     * GM-only tool. Editing world artifact tree definitions is never available to
     * players — block the render (covers macros, hooks, or any leaked entry point)
     * so a player can never open or change these items.
     */
    render(...args: any[]): any;
    getData(options?: any): any;
    activateListeners(html: JQuery): void;
    /**
     * Add a child node to a parent
     */
    addChildNode(parentNodeId: string): Promise<void>;
    private getBaseArtifactName;
    private updateArtifactName;
    /**
     * GM: push the current world tree onto every linked actor's embedded copy,
     * each refreshed from the world node matching the actor's own evolution level.
     */
    private resyncToAllActors;
    private updateArtifactImage;
    /** Stable labels: Level 1 (root), Level 2-1, Level 2-2, Level 3-1, … per tree row. */
    private buildNodeLabelMap;
    private getNodeItemName;
    /** Number of strict descendants (not counting the node itself). */
    private countDescendantNodes;
    private escapeAttr;
    private buildTreeHtml;
    /**
     * Remove a node and all descendants; unlink from parents. Level 1 root cannot be removed here.
     */
    removeNode(nodeId: string): Promise<void>;
    private removeNodeBranch;
    /**
     * Edit a node
     */
    editNode(nodeId: string): Promise<void>;
    /** Register actor for this artifact tree (starts at root node when item is given). */
    assignActorToTree(actorId: string): Promise<void>;
    removeActorFromArtifact(actorId: string): Promise<void>;
    /**
     * Sync inherited bonuses/abilities from parent to children recursively
     * This implements the artifact kind element inheritance system
     */
    syncInheritedBonusesToChildren(parentItem: Item): Promise<void>;
    /**
     * Calculate depth of a node
     */
    private calculateDepth;
}
export {};
//# sourceMappingURL=artifact-builder.d.ts.map