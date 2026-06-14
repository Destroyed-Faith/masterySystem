/**
 * Artifact Builder Application
 * UI for managing artifact evolution tree nodes
 */

import { NodeEditor } from './node-editor.js';
import { deriveLevelProgressionFromPicks } from './progression-compiler.js';
import { syncArtifactInheritedFromParent } from '../utils/artifact-folder-sync.js';
import {
  pushWorldArtifactNodeToEmbeddedActors,
  resyncArtifactTreeToAllActors,
} from '../utils/artifact-embedded-sync.js';
import { inferArtifactEquipSlots } from '../utils/equip-slots.js';
import {
  readActorArtifactProgress,
  serializeActorArtifactProgress
} from '../utils/artifact-actor-rules.js';

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
    
    // Ensure ifEquals helper is registered (fallback in case it wasn't registered early enough)
    if (!Handlebars.helpers.ifEquals) {
      Handlebars.registerHelper('ifEquals', function(this: any, a: any, b: any, options: any) {
        if (a === b) {
          return options.fn(this);
        }
        return options.inverse ? options.inverse(this) : '';
      });
    }
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

    // Build actor assignments list (flag stores { nodeId, linked } or legacy number)
    const actorLevels = (this.rootItem as any).getFlag('mastery-system', 'actorLevels') || {};
    const rootNodeId = (this.rootItem as any).getFlag('mastery-system', 'nodeId') as string;
    const assignments: any[] = [];
    for (const [actorId, rawProg] of Object.entries(actorLevels)) {
      const actor = (game as any).actors?.get(actorId);
      const prog = readActorArtifactProgress(rawProg, rootNodeId);
      assignments.push({
        actorId,
        actorName: actor ? actor.name : `Unknown actor (${actorId})`,
        linkedLabel: prog.linked ? 'Linked' : 'Not linked',
        orphan: !actor
      });
    }

    const assignedIds = new Set(Object.keys(actorLevels));
    const availableActors = ((game as any).actors?.contents || []).filter(
      (a: any) => a.type === 'character' && !assignedIds.has(a.id)
    );

    const artifactName = this.getBaseArtifactName((this.rootItem as any).name);

    data.rootItem = this.rootItem;
    data.nodes = Array.from(this.nodes.values());
    data.artifactItems = itemMap;
    data.actorLevels = assignments;
    data.availableActors = availableActors;
    data.artifactName = artifactName;
    data.artifactImage = (this.rootItem as any).img || 'icons/svg/mystery-man.svg';
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

    html.find('.resync-artifact-actors').on('click', async () => {
      await this.resyncToAllActors();
    });

    // Open node editor on node click
    html.on('click', '.node-content', async (e: JQuery.ClickEvent) => {
      const nodeId = $(e.currentTarget).closest('.node').data('node-id');
      await this.editNode(nodeId);
    });

    // Add child node button
    html.on('click', '.add-child-node', async (e: JQuery.ClickEvent) => {
      e.stopPropagation();
      const parentNodeId = $(e.currentTarget).data('node-id');
      await this.addChildNode(parentNodeId);
    });

    // Remove node (and entire subtree) — not shown for Level 1 root
    html.on('click', '.remove-node', async (e: JQuery.ClickEvent) => {
      e.stopPropagation();
      const nodeId = $(e.currentTarget).data('node-id');
      await this.removeNode(nodeId);
    });

    // Edit node button
    html.on('click', '.edit-node', async (e: JQuery.ClickEvent) => {
      const nodeId = $(e.currentTarget).data('node-id');
      await this.editNode(nodeId);
    });

    html.on('click', '.remove-actor-assignment', async (e: JQuery.ClickEvent) => {
      e.preventDefault();
      const actorId = String($(e.currentTarget).attr('data-actor-id') || '').trim();
      if (!actorId) {
        ui.notifications?.warn('Could not read actor id for this assignment.');
        return;
      }
      await this.removeActorFromArtifact(actorId);
    });

    // Add actor assignment (eligible for Level 1 handout; evolution state lives on root flags)
    html.find('.add-actor-assignment').on('click', async () => {
      const actorId = html.find('#actor-select').val() as string;
      if (!actorId) {
        ui.notifications?.warn('Please select an actor.');
        return;
      }
      await this.assignActorToTree(actorId);
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

    const defaultWeapon = {
      weaponType: 'melee' as const,
      damage: '1d8',
      range: '0m',
      hands: 1,
      innateAbilities: [] as string[],
      specials: [] as string[]
    };
    const defaultArmor = { type: 'light', armorValue: 0, evadeModifier: 0, skillPenalty: '' };
    const defaultShield = { type: 'parry', shieldValue: 0, evadeBonus: 0, skillPenalty: '' };

    const childWeapon = foundry.utils.duplicate(parentSystem.artifactWeapon || defaultWeapon);
    const artifactKind = parentSystem.artifactKind || 'weapon';
    const gearSlot = parentSystem.gearSlot || '';
    const equipSlots = inferArtifactEquipSlots({
      artifactKind,
      gearSlot,
      artifactWeapon: childWeapon
    });

    const newItemData = {
      name: artifactName,
      type: 'artifact',
      folder: folderId,
      system: {
        level: newLevel,
        equipped: false,
        effects: [],
        artifactKind,
        gearSlot,
        artifactWeapon: childWeapon,
        artifactArmor: foundry.utils.duplicate(parentSystem.artifactArmor || defaultArmor),
        artifactShield: foundry.utils.duplicate(parentSystem.artifactShield || defaultShield),
        bonuses: inheritedBonuses,
        lore: parentSystem.lore || '',
        requirements: {
          stones: parentRequirements.stones || 0,
          masteryRank: parentRequirements.masteryRank || 1
        },
        description: parentSystem.description || '',
        slot: parentSystem.slot || '',
        baseProfile: parentSystem.baseProfile || '',
        baseValues: foundry.utils.duplicate(parentSystem.baseValues || []),
        stoneFunction: parentSystem.stoneFunction ?? null,
        progressionPicks: foundry.utils.duplicate(parentSystem.progressionPicks || []),
        levelProgression: deriveLevelProgressionFromPicks(parentSystem.progressionPicks || []),
        powers: [],
        ...(equipSlots ? { equipSlots } : {})
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

    // Push merged profile + powers from parent to all descendants (including the new child)
    await this.syncInheritedBonusesToChildren(parentItem);

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

    for (const item of items) {
      await pushWorldArtifactNodeToEmbeddedActors(item);
    }

    if (folder && folder.name !== newName) {
      await folder.update({ name: newName });
    }

    await (this as any).render();
  }

  /**
   * GM: push the current world tree onto every linked actor's embedded copy,
   * each refreshed from the world node matching the actor's own evolution level.
   */
  private async resyncToAllActors(): Promise<void> {
    if (!game.user?.isGM) {
      ui.notifications?.warn('Only a GM can resync artifacts to actors.');
      return;
    }

    const confirmed = await Dialog.confirm({
      title: 'Resync artifact to all actors',
      content:
        '<p>Overwrite the <strong>name, image and stats</strong> of this artifact on every linked actor with the current Builder version?</p>' +
        '<p>Each actor keeps their own evolution level; only the content of that level is refreshed. Activation and equip state are preserved.</p>',
      yes: () => true,
      no: () => false,
      defaultYes: false,
    });
    if (!confirmed) return;

    const res = await resyncArtifactTreeToAllActors(this.rootItem);
    if (res.items > 0) {
      ui.notifications?.info(
        `Resynced ${res.items} artifact${res.items === 1 ? '' : 's'} on ${res.actors} actor${res.actors === 1 ? '' : 's'}.`,
      );
    } else {
      ui.notifications?.info('No linked actor copies found to resync.');
    }
  }

  private async updateArtifactImage(path: string): Promise<void> {
    const folderId = (this.rootItem as any).folder?.id;
    if (!folderId) return;

    const items = (game as any).items?.filter((item: any) => item.folder?.id === folderId && item.type === 'artifact') || [];
    for (const item of items) {
      await item.update({ img: path });
    }
    for (const item of items) {
      await pushWorldArtifactNodeToEmbeddedActors(item);
    }
    await (this as any).render();
  }

  /** Stable labels: Level 1 (root), Level 2-1, Level 2-2, Level 3-1, … per tree row. */
  private buildNodeLabelMap(): Map<string, string> {
    const labels = new Map<string, string>();
    const nodes = Array.from(this.nodes.values());
    if (nodes.length === 0) return labels;

    const depthMap: Map<number, ArtifactNodeData[]> = new Map();
    for (const node of nodes) {
      const depth = this.calculateDepth(node.nodeId) - 1;
      if (!depthMap.has(depth)) depthMap.set(depth, []);
      depthMap.get(depth)!.push(node);
    }

    const sortedDepths = Array.from(depthMap.keys()).sort((a, b) => a - b);
    for (const depth of sortedDepths) {
      const levelNodes = depthMap.get(depth) || [];
      levelNodes.sort((a, b) => {
        const aItem = (game as any).items?.get(a.itemId);
        const bItem = (game as any).items?.get(b.itemId);
        return (aItem?.name || '').localeCompare(bItem?.name || '');
      });
      levelNodes.forEach((node, index) => {
        const label = depth === 0 ? 'Level 1' : `Level ${depth + 1}-${index + 1}`;
        labels.set(node.nodeId, label);
      });
    }
    return labels;
  }

  private getNodeItemName(node: ArtifactNodeData): string {
    const item = (game as any).items?.get(node.itemId);
    return (item?.name as string) || node.nodeId;
  }

  /** Number of strict descendants (not counting the node itself). */
  private countDescendantNodes(nodeId: string): number {
    const node = this.nodes.get(nodeId);
    if (!node) return 0;
    let n = 0;
    for (const cid of node.childIds) {
      n += 1 + this.countDescendantNodes(cid);
    }
    return n;
  }

  private escapeAttr(text: string): string {
    return String(text || '')
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  private buildTreeHtml(): string {
    const nodes = Array.from(this.nodes.values());
    if (nodes.length === 0) return '';

    const labels = this.buildNodeLabelMap();
    const depthMap: Map<number, ArtifactNodeData[]> = new Map();
    for (const node of nodes) {
      const depth = this.calculateDepth(node.nodeId) - 1;
      if (!depthMap.has(depth)) depthMap.set(depth, []);
      depthMap.get(depth)!.push(node);
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
      for (const node of levelNodes) {
        const label = labels.get(node.nodeId) || '?';
        const hasParents = node.parentIds.length > 0;
        const primaryParentId = node.parentIds[0];
        const parentLabel = primaryParentId ? labels.get(primaryParentId) : '';
        const extraParents = node.parentIds.length > 1 ? ` (+${node.parentIds.length - 1})` : '';
        const canAddChild = node.childIds.length < 2;
        const isTreeRoot = !hasParents;
        const itemName = this.getNodeItemName(node);
        const itemTitle = this.escapeAttr(itemName);

        const parentHint =
          hasParents && parentLabel
            ? `<div class="node-parent-hint" title="Direkter Elternknoten im Baum / Direct parent in tree"><i class="fas fa-arrow-up" aria-hidden="true"></i><span>von <strong>${parentLabel}</strong>${extraParents}</span></div>`
            : '';

        const nameLine = itemName
          ? `<div class="node-item-name" title="${itemTitle}">${this.escapeAttr(itemName)}</div>`
          : '';

        html += `
          <div class="node" data-node-id="${node.nodeId}">
            <div class="node-main">
              ${parentHint}
              <div class="node-content" title="Knoten bearbeiten / Edit node — ${itemTitle}">${label}</div>
              ${nameLine}
            </div>
            <div class="node-actions">
              ${
                canAddChild
                  ? `<button type="button" class="add-child-node" data-node-id="${node.nodeId}" title="Kindknoten hinzufügen / Add child"><i class="fas fa-plus-circle"></i></button>`
                  : ''
              }
              ${
                !isTreeRoot
                  ? `<button type="button" class="remove-node" data-node-id="${node.nodeId}" title="Knoten und alle Nachkommen löschen / Remove this branch"><i class="fas fa-minus-circle"></i></button>`
                  : ''
              }
            </div>
          </div>
        `;
      }
      html += `</div>`;
    }

    return html;
  }

  /**
   * Remove a node and all descendants; unlink from parents. Level 1 root cannot be removed here.
   */
  async removeNode(nodeId: string): Promise<void> {
    await this.removeNodeBranch(nodeId, true, true);
  }

  private async removeNodeBranch(nodeId: string, askConfirm: boolean, doRender: boolean): Promise<void> {
    const node = this.nodes.get(nodeId);
    if (!node) return;

    if (node.parentIds.length === 0) {
      if (askConfirm) {
        ui.notifications?.warn(
          'Der Level-1-Wurzelknoten kann hier nicht entfernt werden. Nutze die Item-Seitenleiste, um das Artefakt zu löschen. / The Level 1 root cannot be removed here; delete the artifact from the Items sidebar if needed.'
        );
      }
      return;
    }

    if (askConfirm) {
      const descendants = this.countDescendantNodes(nodeId);
      const totalDelete = 1 + descendants;
      const name = this.getNodeItemName(node);
      const confirmed = await Dialog.confirm({
        title: 'Evolutionsknoten entfernen? / Remove evolution node?',
        content: `<p><strong>${name}</strong> und <strong>${totalDelete}</strong> Knoten in diesem Ast (alle Nachkommen) unwiderruflich löschen?</p><p>Delete <strong>${totalDelete}</strong> node(s) in this branch (including all descendants)? This cannot be undone.</p>`
      });
      if (!confirmed) return;
    }

    for (const childId of [...node.childIds]) {
      await this.removeNodeBranch(childId, false, false);
    }

    for (const parentId of node.parentIds) {
      const parentNode = this.nodes.get(parentId);
      const parentItem = parentNode ? ((game as any).items?.get(parentNode.itemId) as Item | undefined) : undefined;
      if (parentItem) {
        const childIds = ((parentItem as any).getFlag('mastery-system', 'childIds') as string[]) || [];
        const updated = childIds.filter((id: string) => id !== nodeId);
        await (parentItem as any).setFlag('mastery-system', 'childIds', updated);
      }
    }

    const item = (game as any).items?.get(node.itemId);
    if (item) {
      await item.delete();
    }

    if (doRender) {
      await (this as any).render();
    }
  }

  /**
   * Edit a node
   */
  async editNode(nodeId: string): Promise<void> {
    const node = this.nodes.get(nodeId);
    if (!node) return;

    const item = (game as any).items?.get(node.itemId);
    if (!item) return;

    const self = this;
    const editor = new NodeEditor(item, {
      onSaved: async () => {
        await (self as any).render();
      }
    });
    (editor as any).render(true);
  }

  /** Register actor for this artifact tree (starts at root node when item is given). */
  async assignActorToTree(actorId: string): Promise<void> {
    const rootNodeId = (this.rootItem as any).getFlag('mastery-system', 'nodeId') as string;
    if (!rootNodeId) {
      ui.notifications?.error('Root artifact has no nodeId.');
      return;
    }
    const actorLevels = { ...((this.rootItem as any).getFlag('mastery-system', 'actorLevels') || {}) };
    const prev = readActorArtifactProgress(actorLevels[actorId], rootNodeId);
    actorLevels[actorId] = serializeActorArtifactProgress({
      nodeId: rootNodeId,
      linked: prev.linked,
    });
    await (this.rootItem as any).setFlag('mastery-system', 'actorLevels', actorLevels);
    await (this as any).render();
  }

  async removeActorFromArtifact(actorId: string): Promise<void> {
    const actorLevels = { ...((this.rootItem as any).getFlag('mastery-system', 'actorLevels') || {}) };
    delete actorLevels[actorId];
    await (this.rootItem as any).setFlag('mastery-system', 'actorLevels', actorLevels);
    await (this as any).render();
  }

  /**
   * Sync inherited bonuses/abilities from parent to children recursively
   * This implements the artifact kind element inheritance system
   */
  async syncInheritedBonusesToChildren(parentItem: Item): Promise<void> {
    await syncArtifactInheritedFromParent(parentItem);
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

