/**
 * Artifact Builder Application
 * UI for managing artifact evolution tree nodes
 */

import { NodeEditor } from './node-editor.js';

interface ArtifactNodeData {
  nodeId: string;
  parentIds: string[];
  childIds: string[];
  itemId: string;
  level: number;
  isRoot?: boolean;
}

// Use ApplicationV2 with HandlebarsApplicationMixin if available
const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;
const BaseApplication = HandlebarsApplicationMixin ? HandlebarsApplicationMixin(ApplicationV2) : ApplicationV2;

export class ArtifactBuilder extends BaseApplication {
  private rootItem: Item;
  private nodes: Map<string, ArtifactNodeData> = new Map();

  constructor(rootItem: Item) {
    super();
    this.rootItem = rootItem;
  }

  static get defaultOptions(): any {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: 'artifact-builder',
      title: 'Artifact Builder',
      template: 'systems/mastery-system/templates/artifacts/builder.hbs',
      width: 1000,
      height: 700,
      resizable: true,
      classes: ['mastery-system', 'artifact-builder']
    });
  }

  getData(options?: any): any {
    const data: any = super.getData ? super.getData(options) : {};
    
    // Load all artifact items in the folder
    const folderId = (this.rootItem as any).folder?.id;
    const artifactItems = (game as any).items?.filter((item: any) => 
      item.folder?.id === folderId && 
      item.type === 'artifact'
    ) || [];

    // Build node map
    this.nodes.clear();
    const itemMap: Map<string, any> = new Map();
    for (const item of artifactItems) {
      const nodeId = item.getFlag('mastery-system', 'nodeId') || (foundry.utils as any).randomID();
      const parentIds = item.getFlag('mastery-system', 'parentIds') || [];
      const childIds = item.getFlag('mastery-system', 'childIds') || [];
      
      this.nodes.set(nodeId, {
        nodeId,
        parentIds,
        childIds,
        itemId: item.id,
        level: (item.system as any).level || 1,
        isRoot: item.getFlag('mastery-system', 'isRoot') === true
      });
      itemMap.set(item.id, item);
    }

    // Build actor assignments list
    const actorLevels = (this.rootItem as any).getFlag('mastery-system', 'actorLevels') || {};
    const assignments: any[] = [];
    for (const [actorId, level] of Object.entries(actorLevels)) {
      const actor = (game as any).actors?.get(actorId);
      if (actor) {
        assignments.push({
          actorId,
          actorName: actor.name,
          level
        });
      }
    }

    // Get available actors
    const availableActors = ((game as any).actors?.contents || []).filter((a: any) => a.type === 'character');

    data.rootItem = this.rootItem;
    data.nodes = Array.from(this.nodes.values());
    data.artifactItems = itemMap;
    data.actorLevels = assignments;
    data.availableActors = availableActors;
    
    return data;
  }

  activateListeners(html: JQuery): void {
    super.activateListeners(html);

    // Add child node button
    html.find('.add-child-node').on('click', async (e: JQuery.ClickEvent) => {
      const parentNodeId = $(e.currentTarget).data('node-id');
      await this.addChildNode(parentNodeId);
    });

    // Remove node button
    html.find('.remove-node').on('click', async (e: JQuery.ClickEvent) => {
      const nodeId = $(e.currentTarget).data('node-id');
      await this.removeNode(nodeId);
    });

    // Edit node button
    html.find('.edit-node').on('click', async (e: JQuery.ClickEvent) => {
      const nodeId = $(e.currentTarget).data('node-id');
      await this.editNode(nodeId);
    });

    // Actor assignment controls
    html.find('.assign-actor-level').on('change', async (e: JQuery.ChangeEvent) => {
      const actorId = $(e.currentTarget).data('actor-id');
      const level = parseInt($(e.currentTarget).val() as string, 10);
      await this.assignActorLevel(actorId, level);
    });

    // Add actor assignment
    html.find('.add-actor-assignment').on('click', async () => {
      const actorId = html.find('#actor-select').val() as string;
      if (!actorId) {
        ui.notifications?.warn('Please select an actor.');
        return;
      }
      await this.assignActorLevel(actorId, 1);
    });
  }

  /**
   * Add a child node to a parent
   */
  async addChildNode(parentNodeId: string): Promise<void> {
    const parentNode = this.nodes.get(parentNodeId);
    if (!parentNode) {
      ui.notifications?.error('Parent node not found.');
      return;
    }

    // Check max children (2)
    if (parentNode.childIds.length >= 2) {
      ui.notifications?.warn('Maximum 2 children per node.');
      return;
    }

    // Check max depth (10)
    const depth = this.calculateDepth(parentNodeId);
    if (depth >= 10) {
      ui.notifications?.warn('Maximum depth of 10 reached.');
      return;
    }

    // Determine new level
    const parentItem = (game as any).items?.get(parentNode.itemId);
    if (!parentItem) return;

    const parentLevel = (parentItem.system as any).level || 1;
    const newLevel = parentLevel + 1;

    // Create new artifact item
    const folderId = (this.rootItem as any).folder?.id;
    const artifactName = (this.rootItem as any).name.replace('Level 1-1', `Level ${newLevel}-${parentNode.childIds.length + 1}`);
    const newNodeId = (foundry.utils as any).randomID();

    const newItemData = {
      name: artifactName,
      type: 'artifact',
      folder: folderId,
      system: {
        level: newLevel,
        equipped: false,
        effects: [],
        bonuses: {
          attack: 0,
          damage: '',
          defense: 0,
          specials: []
        },
        lore: '',
        requirements: {
          stones: 0,
          masteryRank: 1
        },
        description: ''
      },
      flags: {
        'mastery-system': {
          nodeId: newNodeId,
          parentIds: [parentNodeId],
          childIds: []
        }
      }
    };

    await (Item as any).create(newItemData);

    // Update parent's childIds
    const parentFlags = parentItem.getFlag('mastery-system', 'childIds') || [];
    parentFlags.push(newNodeId);
    await parentItem.setFlag('mastery-system', 'childIds', parentFlags);

    // Re-render
    await (this as any).render();
  }

  /**
   * Remove a node (recursively delete children)
   */
  async removeNode(nodeId: string): Promise<void> {
    const node = this.nodes.get(nodeId);
    if (!node) return;

    // Recursively remove children
    for (const childId of node.childIds) {
      await this.removeNode(childId);
    }

    // Remove from parent's childIds
    for (const parentId of node.parentIds) {
      const parentItem = (game as any).items?.get(this.nodes.get(parentId)?.itemId);
      if (parentItem) {
        const childIds = parentItem.getFlag('mastery-system', 'childIds') || [];
        const updated = childIds.filter((id: string) => id !== nodeId);
        await parentItem.setFlag('mastery-system', 'childIds', updated);
      }
    }

    // Delete the item
    const item = (game as any).items?.get(node.itemId);
    if (item) {
      await item.delete();
    }

    // Re-render
    await (this as any).render();
  }

  /**
   * Edit a node
   */
  async editNode(nodeId: string): Promise<void> {
    const node = this.nodes.get(nodeId);
    if (!node) return;

    const item = (game as any).items?.get(node.itemId);
    if (!item) return;

    const editor = new NodeEditor(item);
    (editor as any).render(true);
  }

  /**
   * Assign artifact level to an actor
   */
  async assignActorLevel(actorId: string, level: number): Promise<void> {
    const actorLevels = (this.rootItem as any).getFlag('mastery-system', 'actorLevels') || {};
    if (level > 0) {
      actorLevels[actorId] = level;
    } else {
      delete actorLevels[actorId];
    }
    await (this.rootItem as any).setFlag('mastery-system', 'actorLevels', actorLevels);
    await (this as any).render();
  }

  /**
   * Calculate depth of a node
   */
  private calculateDepth(nodeId: string, visited: Set<string> = new Set()): number {
    if (visited.has(nodeId)) return 0; // Prevent cycles
    visited.add(nodeId);

    const node = this.nodes.get(nodeId);
    if (!node || node.parentIds.length === 0) return 1;

    let maxDepth = 0;
    for (const parentId of node.parentIds) {
      const depth = this.calculateDepth(parentId, new Set(visited));
      maxDepth = Math.max(maxDepth, depth);
    }

    return maxDepth + 1;
  }
}

