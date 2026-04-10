/**
 * Artifact Builder Application
 * UI for managing artifact evolution tree nodes
 */
import { NodeEditor } from './node-editor.js';
import { normalizePowersForEditor } from '../utils/embedded-power-ui-constants.js';
import { syncArtifactInheritedFromParent } from '../utils/artifact-folder-sync.js';
import { pushWorldArtifactNodeToEmbeddedActors } from '../utils/artifact-embedded-sync.js';
import { inferArtifactEquipSlots } from '../utils/equip-slots.js';
import { readActorArtifactProgress, serializeActorArtifactProgress } from '../utils/artifact-actor-rules.js';
// Use V1 Application for reliable template rendering in v13
const BaseApplication = foundry?.appv1?.Application || Application;
export class ArtifactBuilder extends BaseApplication {
    rootItem;
    nodes = new Map();
    constructor(rootItem) {
        super();
        this.rootItem = rootItem;
        // Ensure ifEquals helper is registered (fallback in case it wasn't registered early enough)
        if (!Handlebars.helpers.ifEquals) {
            Handlebars.registerHelper('ifEquals', function (a, b, options) {
                if (a === b) {
                    return options.fn(this);
                }
                return options.inverse ? options.inverse(this) : '';
            });
        }
    }
    static get defaultOptions() {
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
    getData(options) {
        const data = super.getData ? super.getData(options) : {};
        // Load all artifact items in the folder
        const folderId = this.rootItem.folder?.id;
        const artifactItems = game.items?.filter((item) => item.folder?.id === folderId &&
            item.type === 'artifact') || [];
        // Build node map
        this.nodes.clear();
        const itemMap = new Map();
        for (const item of artifactItems) {
            const nodeId = item.getFlag('mastery-system', 'nodeId') || foundry.utils.randomID();
            const parentIds = item.getFlag('mastery-system', 'parentIds') || [];
            const childIds = item.getFlag('mastery-system', 'childIds') || [];
            this.nodes.set(nodeId, {
                nodeId,
                parentIds,
                childIds,
                itemId: item.id,
                level: item.system.level || 1,
                isRoot: item.getFlag('mastery-system', 'isRoot') === true
            });
            itemMap.set(item.id, item);
        }
        // Build actor assignments list (flag stores { nodeId, linked, ultimateUnlocked? } or legacy number)
        const actorLevels = this.rootItem.getFlag('mastery-system', 'actorLevels') || {};
        const rootNodeId = this.rootItem.getFlag('mastery-system', 'nodeId');
        const assignments = [];
        for (const [actorId, rawProg] of Object.entries(actorLevels)) {
            const actor = game.actors?.get(actorId);
            const prog = readActorArtifactProgress(rawProg, rootNodeId);
            assignments.push({
                actorId,
                actorName: actor ? actor.name : `Unknown actor (${actorId})`,
                linkedLabel: prog.linked ? 'Linked' : 'Not linked',
                orphan: !actor
            });
        }
        const assignedIds = new Set(Object.keys(actorLevels));
        const availableActors = (game.actors?.contents || []).filter((a) => a.type === 'character' && !assignedIds.has(a.id));
        const artifactName = this.getBaseArtifactName(this.rootItem.name);
        data.rootItem = this.rootItem;
        data.nodes = Array.from(this.nodes.values());
        data.artifactItems = itemMap;
        data.actorLevels = assignments;
        data.availableActors = availableActors;
        data.artifactName = artifactName;
        data.artifactImage = this.rootItem.img || 'icons/svg/mystery-man.svg';
        data.treeHTML = this.buildTreeHtml();
        return data;
    }
    activateListeners(html) {
        super.activateListeners(html);
        html.find('.artifact-image').on('click', () => {
            const fp = new FilePicker({
                type: 'image',
                current: this.rootItem.img || 'icons/svg/mystery-man.svg',
                callback: async (path) => {
                    await this.updateArtifactImage(path);
                }
            });
            fp.browse();
        });
        html.find('.save-artifact-name').on('click', async () => {
            const newName = (html.find('.artifact-name-input').val() || '').trim();
            if (!newName) {
                ui.notifications?.warn('Please enter an artifact name.');
                return;
            }
            await this.updateArtifactName(newName);
        });
        // Open node editor on node click
        html.on('click', '.node-content', async (e) => {
            const nodeId = $(e.currentTarget).closest('.node').data('node-id');
            await this.editNode(nodeId);
        });
        // Add child node button
        html.on('click', '.add-child-node', async (e) => {
            e.stopPropagation();
            const parentNodeId = $(e.currentTarget).data('node-id');
            await this.addChildNode(parentNodeId);
        });
        // Remove node (and entire subtree) — not shown for Level 1 root
        html.on('click', '.remove-node', async (e) => {
            e.stopPropagation();
            const nodeId = $(e.currentTarget).data('node-id');
            await this.removeNode(nodeId);
        });
        // Edit node button
        html.on('click', '.edit-node', async (e) => {
            const nodeId = $(e.currentTarget).data('node-id');
            await this.editNode(nodeId);
        });
        html.on('click', '.remove-actor-assignment', async (e) => {
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
            const actorId = html.find('#actor-select').val();
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
    async addChildNode(parentNodeId) {
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
        const parentItem = game.items?.get(parentNode.itemId);
        if (!parentItem)
            return;
        const parentSystem = parentItem.system;
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
        const folderId = this.rootItem.folder?.id;
        const rootName = this.rootItem.name.replace(' - Level 1-1', '').trim();
        const artifactName = `${rootName} - Level ${newLevel}-${parentNode.childIds.length + 1}`;
        const newNodeId = foundry.utils.randomID();
        const defaultWeapon = {
            weaponType: 'melee',
            damage: '1d8',
            range: '0m',
            hands: 1,
            innateAbilities: [],
            specials: []
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
                powers: normalizePowersForEditor(foundry.utils.duplicate(parentSystem.powers || [])),
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
        const newItem = await Item.create(newItemData);
        // Update parent's childIds
        const parentFlags = parentItem.getFlag('mastery-system', 'childIds') || [];
        parentFlags.push(newNodeId);
        await parentItem.setFlag('mastery-system', 'childIds', parentFlags);
        // Push merged profile + powers from parent to all descendants (including the new child)
        await this.syncInheritedBonusesToChildren(parentItem);
        // Re-render
        await this.render();
    }
    getBaseArtifactName(name) {
        return name.replace(/- Level \d+-\d+$/i, '').trim();
    }
    async updateArtifactName(newName) {
        const folderId = this.rootItem.folder?.id;
        if (!folderId)
            return;
        const folder = game.folders?.get(folderId);
        const currentBaseName = this.getBaseArtifactName(this.rootItem.name);
        if (newName === currentBaseName)
            return;
        const items = game.items?.filter((item) => item.folder?.id === folderId && item.type === 'artifact') || [];
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
        await this.render();
    }
    async updateArtifactImage(path) {
        const folderId = this.rootItem.folder?.id;
        if (!folderId)
            return;
        const items = game.items?.filter((item) => item.folder?.id === folderId && item.type === 'artifact') || [];
        for (const item of items) {
            await item.update({ img: path });
        }
        for (const item of items) {
            await pushWorldArtifactNodeToEmbeddedActors(item);
        }
        await this.render();
    }
    /** Stable labels: Level 1 (root), Level 2-1, Level 2-2, Level 3-1, … per tree row. */
    buildNodeLabelMap() {
        const labels = new Map();
        const nodes = Array.from(this.nodes.values());
        if (nodes.length === 0)
            return labels;
        const depthMap = new Map();
        for (const node of nodes) {
            const depth = this.calculateDepth(node.nodeId) - 1;
            if (!depthMap.has(depth))
                depthMap.set(depth, []);
            depthMap.get(depth).push(node);
        }
        const sortedDepths = Array.from(depthMap.keys()).sort((a, b) => a - b);
        for (const depth of sortedDepths) {
            const levelNodes = depthMap.get(depth) || [];
            levelNodes.sort((a, b) => {
                const aItem = game.items?.get(a.itemId);
                const bItem = game.items?.get(b.itemId);
                return (aItem?.name || '').localeCompare(bItem?.name || '');
            });
            levelNodes.forEach((node, index) => {
                const label = depth === 0 ? 'Level 1' : `Level ${depth + 1}-${index + 1}`;
                labels.set(node.nodeId, label);
            });
        }
        return labels;
    }
    getNodeItemName(node) {
        const item = game.items?.get(node.itemId);
        return item?.name || node.nodeId;
    }
    /** Number of strict descendants (not counting the node itself). */
    countDescendantNodes(nodeId) {
        const node = this.nodes.get(nodeId);
        if (!node)
            return 0;
        let n = 0;
        for (const cid of node.childIds) {
            n += 1 + this.countDescendantNodes(cid);
        }
        return n;
    }
    escapeAttr(text) {
        return String(text || '')
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }
    buildTreeHtml() {
        const nodes = Array.from(this.nodes.values());
        if (nodes.length === 0)
            return '';
        const labels = this.buildNodeLabelMap();
        const depthMap = new Map();
        for (const node of nodes) {
            const depth = this.calculateDepth(node.nodeId) - 1;
            if (!depthMap.has(depth))
                depthMap.set(depth, []);
            depthMap.get(depth).push(node);
        }
        const sortedDepths = Array.from(depthMap.keys()).sort((a, b) => a - b);
        let html = '';
        for (const depth of sortedDepths) {
            const levelNodes = depthMap.get(depth) || [];
            levelNodes.sort((a, b) => {
                const aItem = game.items?.get(a.itemId);
                const bItem = game.items?.get(b.itemId);
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
                const parentHint = hasParents && parentLabel
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
              ${canAddChild
                    ? `<button type="button" class="add-child-node" data-node-id="${node.nodeId}" title="Kindknoten hinzufügen / Add child"><i class="fas fa-plus-circle"></i></button>`
                    : ''}
              ${!isTreeRoot
                    ? `<button type="button" class="remove-node" data-node-id="${node.nodeId}" title="Knoten und alle Nachkommen löschen / Remove this branch"><i class="fas fa-minus-circle"></i></button>`
                    : ''}
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
    async removeNode(nodeId) {
        await this.removeNodeBranch(nodeId, true, true);
    }
    async removeNodeBranch(nodeId, askConfirm, doRender) {
        const node = this.nodes.get(nodeId);
        if (!node)
            return;
        if (node.parentIds.length === 0) {
            if (askConfirm) {
                ui.notifications?.warn('Der Level-1-Wurzelknoten kann hier nicht entfernt werden. Nutze die Item-Seitenleiste, um das Artefakt zu löschen. / The Level 1 root cannot be removed here; delete the artifact from the Items sidebar if needed.');
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
            if (!confirmed)
                return;
        }
        for (const childId of [...node.childIds]) {
            await this.removeNodeBranch(childId, false, false);
        }
        for (const parentId of node.parentIds) {
            const parentNode = this.nodes.get(parentId);
            const parentItem = parentNode ? game.items?.get(parentNode.itemId) : undefined;
            if (parentItem) {
                const childIds = parentItem.getFlag('mastery-system', 'childIds') || [];
                const updated = childIds.filter((id) => id !== nodeId);
                await parentItem.setFlag('mastery-system', 'childIds', updated);
            }
        }
        const item = game.items?.get(node.itemId);
        if (item) {
            await item.delete();
        }
        if (doRender) {
            await this.render();
        }
    }
    /**
     * Edit a node
     */
    async editNode(nodeId) {
        const node = this.nodes.get(nodeId);
        if (!node)
            return;
        const item = game.items?.get(node.itemId);
        if (!item)
            return;
        const self = this;
        const editor = new NodeEditor(item, {
            onSaved: async () => {
                await self.render();
            }
        });
        editor.render(true);
    }
    /** Register actor for this artifact tree (starts at root node when item is given). */
    async assignActorToTree(actorId) {
        const rootNodeId = this.rootItem.getFlag('mastery-system', 'nodeId');
        if (!rootNodeId) {
            ui.notifications?.error('Root artifact has no nodeId.');
            return;
        }
        const actorLevels = { ...(this.rootItem.getFlag('mastery-system', 'actorLevels') || {}) };
        const prev = readActorArtifactProgress(actorLevels[actorId], rootNodeId);
        actorLevels[actorId] = serializeActorArtifactProgress({
            nodeId: rootNodeId,
            linked: prev.linked,
            ultimateUnlocked: prev.ultimateUnlocked
        });
        await this.rootItem.setFlag('mastery-system', 'actorLevels', actorLevels);
        await this.render();
    }
    async removeActorFromArtifact(actorId) {
        const actorLevels = { ...(this.rootItem.getFlag('mastery-system', 'actorLevels') || {}) };
        delete actorLevels[actorId];
        await this.rootItem.setFlag('mastery-system', 'actorLevels', actorLevels);
        await this.render();
    }
    /**
     * Sync inherited bonuses/abilities from parent to children recursively
     * This implements the artifact kind element inheritance system
     */
    async syncInheritedBonusesToChildren(parentItem) {
        await syncArtifactInheritedFromParent(parentItem);
    }
    /**
     * Calculate depth of a node
     */
    calculateDepth(nodeId, visited = new Set()) {
        if (visited.has(nodeId))
            return 0; // Prevent cycles
        visited.add(nodeId);
        const node = this.nodes.get(nodeId);
        if (!node || node.parentIds.length === 0)
            return 1;
        let maxDepth = 0;
        for (const parentId of node.parentIds) {
            const depth = this.calculateDepth(parentId, new Set(visited));
            maxDepth = Math.max(maxDepth, depth);
        }
        return maxDepth + 1;
    }
}
//# sourceMappingURL=artifact-builder.js.map