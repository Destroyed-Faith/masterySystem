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
    getData(options?: any): any;
    activateListeners(html: JQuery): void;
    /**
     * Add a child node to a parent
     */
    addChildNode(parentNodeId: string): Promise<void>;
    /**
     * Remove a node (recursively delete children)
     */
    removeNode(nodeId: string): Promise<void>;
    /**
     * Edit a node
     */
    editNode(nodeId: string): Promise<void>;
    /**
     * Assign artifact level to an actor
     */
    assignActorLevel(actorId: string, level: number): Promise<void>;
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