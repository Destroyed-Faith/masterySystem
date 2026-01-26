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

// Use V1 Application for reliable template rendering in v13
const BaseApplication: any = (foundry as any)?.appv1?.Application || (Application as any);

export class ArtifactBuilder extends BaseApplication {
  private rootItem: Item;
  private nodes: Map<string, ArtifactNodeData> = new Map();

  constructor(rootItem: Item) {
    super();
    this.rootItem = rootItem;
  }

  static get defaultOptions(): any {
    return foundry.utils.mergeObject(super.defaultOptions || {}, {
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

    const rootSystem = (this.rootItem.system as any) || {};
    const rootBonuses = rootSystem.bonuses || { damage: '' };
    const artifactName = this.getBaseArtifactName((this.rootItem as any).name);
    const artifactDamage = rootBonuses.damage || '';

    const damageOptions = [
      { value: '', label: 'None' },
      { value: '1d4', label: '1d4' },
      { value: '1d6', label: '1d6' },
      { value: '1d8', label: '1d8' },
      { value: '1d10', label: '1d10' },
      { value: '1d12', label: '1d12' },
      { value: '2d6', label: '2d6' }
    ];
    const damageIsCustom = artifactDamage !== '' && !damageOptions.some((opt) => opt.value === artifactDamage);

    data.rootItem = this.rootItem;
    data.nodes = Array.from(this.nodes.values());
    data.artifactItems = itemMap;
    data.actorLevels = assignments;
    data.availableActors = availableActors;
    data.artifactName = artifactName;
    data.artifactImage = (this.rootItem as any).img || 'icons/svg/mystery-man.svg';
    data.artifactDamage = artifactDamage;
    data.damageOptions = damageOptions;
    data.damageIsCustom = damageIsCustom;
    data.treeHTML = this.buildTreeHtml();
    
    return data;
  }

  activateListeners(html: JQuery): void {
    super.activateListeners(html);

    html.find('.artifact-image').on('click', () => {
      const fp = new (FilePicker as any)({
        type: 'image',
        current: (this.rootItem as any).img || 'icons/svg/mystery-man.svg',
        callback: async (path: string) => {
          await this.updateArtifactImage(path);
        }
      });
      fp.browse();
    });

    html.find('.save-artifact-name').on('click', async () => {
      const newName = (html.find('.artifact-name-input').val() as string || '').trim();
      if (!newName) {
        ui.notifications?.warn('Please enter an artifact name.');
        return;
      }
      await this.updateArtifactName(newName);
    });

    html.find('.artifact-damage-select').on('change', async (e: JQuery.ChangeEvent) => {
      const value = $(e.currentTarget).val() as string;
      if (value === 'custom') {
        html.find('.artifact-damage-custom').removeClass('hidden').focus();
      } else {
        html.find('.artifact-damage-custom').addClass('hidden');
        await this.updateArtifactDamage(value);
      }
    });

    html.find('.artifact-damage-custom').on('change', async (e: JQuery.ChangeEvent) => {
      const value = ($(e.currentTarget).val() as string || '').trim();
      await this.updateArtifactDamage(value);
    });

    // Open node editor on node click
    html.on('click', '.node-content', async (e: JQuery.ClickEvent) => {
      const nodeId = $(e.currentTarget).closest('.node').data('node-id');
      await this.editNode(nodeId);
    });

    // Add child node button
    html.on('click', '.add-child-node', async (e: JQuery.ClickEvent) => {
      const parentNodeId = $(e.currentTarget).data('node-id');
      await this.addChildNode(parentNodeId);
    });

    // Disconnect parent links
    html.on('click', '.disconnect-parent', async (e: JQuery.ClickEvent) => {
      const nodeId = $(e.currentTarget).data('node-id');
      await this.disconnectParents(nodeId);
    });

    // Remove node button
    html.on('click', '.remove-node', async (e: JQuery.ClickEvent) => {
      const nodeId = $(e.currentTarget).data('node-id');
      await this.removeNode(nodeId);
    });

    // Edit node button
    html.on('click', '.edit-node', async (e: JQuery.ClickEvent) => {
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

    const parentSystem = parentItem.system as any;
    const parentLevel = parentSystem.level || 1;
    const newLevel = parentLevel + 1;

    // Inherit bonuses from parent (artifact kind elements inheritance)
    const parentBonuses = parentSystem.bonuses || {
      attack: 0,
      damage: '',
      defense: 0,
      specials: []
    };
    
    // Inherit parent bonuses - children get parent's bonuses by default
    const inheritedBonuses = {
      attack: parentBonuses.attack || 0,
      damage: parentBonuses.damage || '',
      defense: parentBonuses.defense || 0,
      specials: [...(parentBonuses.specials || [])] // Copy array
    };

    // Inherit requirements (can be adjusted later)
    const parentRequirements = parentSystem.requirements || {
      stones: 0,
      masteryRank: 1
    };

    // Create new artifact item
    const folderId = (this.rootItem as any).folder?.id;
    const rootName = (this.rootItem as any).name.replace(' - Level 1-1', '').trim();
    const artifactName = `${rootName} - Level ${newLevel}-${parentNode.childIds.length + 1}`;
    const newNodeId = (foundry.utils as any).randomID();

    const newItemData = {
      name: artifactName,
      type: 'artifact',
      folder: folderId,
      system: {
        level: newLevel,
        equipped: false,
        effects: [],
        bonuses: inheritedBonuses, // Inherited from parent
        lore: parentSystem.lore || '', // Inherit lore
        requirements: {
          stones: parentRequirements.stones || 0,
          masteryRank: parentRequirements.masteryRank || 1
        },
        description: parentSystem.description || ''
      },
      flags: {
        'mastery-system': {
          nodeId: newNodeId,
          parentIds: [parentNodeId],
          childIds: []
        }
      }
    };

    const newItem = await (Item as any).create(newItemData);

    // Update parent's childIds
    const parentFlags = (parentItem as any).getFlag('mastery-system', 'childIds') || [];
    parentFlags.push(newNodeId);
    await (parentItem as any).setFlag('mastery-system', 'childIds', parentFlags);

    // Sync inherited bonuses/abilities to all children recursively
    await this.syncInheritedBonusesToChildren(newItem);

    // Re-render
    await (this as any).render();
  }

  private getBaseArtifactName(name: string): string {
    return name.replace(/- Level \d+-\d+$/i, '').trim();
  }

  private async updateArtifactName(newName: string): Promise<void> {
    const folderId = (this.rootItem as any).folder?.id;
    if (!folderId) return;

    const folder = (game as any).folders?.get(folderId);
    const currentBaseName = this.getBaseArtifactName((this.rootItem as any).name);
    if (newName === currentBaseName) return;

    const items = (game as any).items?.filter((item: any) => item.folder?.id === folderId && item.type === 'artifact') || [];
    for (const item of items) {
      const levelSuffixMatch = item.name.match(/- Level .+$/);
      const levelSuffix = levelSuffixMatch ? levelSuffixMatch[0] : '';
      await item.update({ name: `${newName}${levelSuffix}` });
    }

    if (folder && folder.name !== newName) {
      await folder.update({ name: newName });
    }

    await (this as any).render();
  }

  private async updateArtifactDamage(damage: string): Promise<void> {
    await (this.rootItem as any).update({
      'system.bonuses.damage': damage
    });
    await this.syncInheritedBonusesToChildren(this.rootItem);
    await (this as any).render();
  }

  private async updateArtifactImage(path: string): Promise<void> {
    const folderId = (this.rootItem as any).folder?.id;
    if (!folderId) return;

    const items = (game as any).items?.filter((item: any) => item.folder?.id === folderId && item.type === 'artifact') || [];
    for (const item of items) {
      await item.update({ img: path });
    }
    await (this as any).render();
  }

  private buildTreeHtml(): string {
    const nodes = Array.from(this.nodes.values());
    if (nodes.length === 0) return '';

    const depthMap: Map<number, ArtifactNodeData[]> = new Map();
    for (const node of nodes) {
      const depth = this.calculateDepth(node.nodeId) - 1;
      if (!depthMap.has(depth)) depthMap.set(depth, []);
      depthMap.get(depth)?.push(node);
    }

    const sortedDepths = Array.from(depthMap.keys()).sort((a, b) => a - b);
    let html = '';

    for (const depth of sortedDepths) {
      const levelNodes = depthMap.get(depth) || [];
      levelNodes.sort((a, b) => {
        const aItem = (game as any).items?.get(a.itemId);
        const bItem = (game as any).items?.get(b.itemId);
        return (aItem?.name || '').localeCompare(bItem?.name || '');
      });

      html += `<div class="node-level-row level-${depth}">`;
      levelNodes.forEach((node, index) => {
        const label = depth === 0 ? `Level 1` : `Level ${depth + 1}-${index + 1}`;
        const hasParents = node.parentIds.length > 0;
        const canAddChild = node.childIds.length < 2;

        html += `
          <div class="node" data-node-id="${node.nodeId}">
            <div class="node-content">${label}</div>
            <div class="node-actions">
              ${canAddChild ? `<button type="button" class="add-child-node" data-node-id="${node.nodeId}" title="Add Child"><i class="fas fa-plus-circle"></i></button>` : ''}
              ${hasParents ? `<button type="button" class="disconnect-parent" data-node-id="${node.nodeId}" title="Disconnect"><i class="fas fa-unlink"></i></button>` : ''}
            </div>
          </div>
        `;
      });
      html += `</div>`;
    }

    return html;
  }

  private async disconnectParents(nodeId: string): Promise<void> {
    const node = this.nodes.get(nodeId);
    if (!node || node.parentIds.length === 0) return;

    const parentOptions = node.parentIds.map((parentId) => {
      const parentNode = this.nodes.get(parentId);
      const parentItem = parentNode ? (game as any).items?.get(parentNode.itemId) : null;
      const label = parentItem?.name || parentId;
      return `<label><input type="checkbox" name="parentNode" value="${parentId}" checked> ${label}</label>`;
    }).join('<br>');

    const selectedParentIds = await new Promise<string[]>((resolve) => {
      new Dialog({
        title: 'Disconnect Parents',
        content: `<form>${parentOptions}</form>`,
        buttons: {
          ok: {
            label: 'Disconnect',
            callback: (html: JQuery) => {
              const selected = html.find('input[name="parentNode"]:checked').map((_i, el) => $(el).val()).get() as string[];
              resolve(selected);
            }
          },
          cancel: {
            label: 'Cancel',
            callback: () => resolve([])
          }
        },
        default: 'ok'
      }).render(true);
    });

    if (selectedParentIds.length === 0) return;
    const childItem = (game as any).items?.get(node.itemId);
    if (!childItem) return;

    // Remove selected parents from child
    const remainingParents = node.parentIds.filter((parentId) => !selectedParentIds.includes(parentId));
    await (childItem as any).setFlag('mastery-system', 'parentIds', remainingParents);

    // Remove child from each parent
    for (const parentId of selectedParentIds) {
      const parentNode = this.nodes.get(parentId);
      if (!parentNode) continue;
      const parentItem = (game as any).items?.get(parentNode.itemId);
      if (!parentItem) continue;
      const childIds = (parentItem as any).getFlag('mastery-system', 'childIds') || [];
      const updatedChildIds = childIds.filter((id: string) => id !== nodeId);
      await (parentItem as any).setFlag('mastery-system', 'childIds', updatedChildIds);
    }

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
   * Sync inherited bonuses/abilities from parent to children recursively
   * This implements the artifact kind element inheritance system
   */
  async syncInheritedBonusesToChildren(parentItem: Item): Promise<void> {
    const parentSystem = (parentItem.system as any);
    const parentBonuses = parentSystem.bonuses || {
      attack: 0,
      damage: '',
      defense: 0,
      specials: []
    };

    const parentFlags = (parentItem as any).getFlag('mastery-system', 'childIds') || [];
    if (parentFlags.length === 0) return;

    // Get all child items
    const childItems: Item[] = [];
    for (const childNodeId of parentFlags) {
      const childNode = this.nodes.get(childNodeId);
      if (childNode) {
        const childItem = (game as any).items?.get(childNode.itemId);
        if (childItem) {
          childItems.push(childItem);
        }
      }
    }

    // Update each child with inherited bonuses
    for (const childItem of childItems) {
      // Inherit bonuses from parent (children inherit parent's bonuses)
      const updates: any = {
        'system.bonuses.attack': parentBonuses.attack || 0,
        'system.bonuses.damage': parentBonuses.damage || '',
        'system.bonuses.defense': parentBonuses.defense || 0,
        'system.bonuses.specials': [...(parentBonuses.specials || [])]
      };

      await childItem.update(updates);

      // Recursively sync to grandchildren
      await this.syncInheritedBonusesToChildren(childItem);
    }
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

