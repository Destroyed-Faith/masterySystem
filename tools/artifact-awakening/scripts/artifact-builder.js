import {drawLine} from './lines.js';
import {ActivityEditor} from "./activity-editor.js"; // <<< NEU!
import {NodeEditor} from "./node-editor.js"; // <<< NEU!

const DEBUG = false;

export class ArtifactBuilder extends FormApplication {

    constructor(object = {}, options = {}) {
        super(options);

        const defaults = {
            name: "Neues Artefakt",
            folderId: null,
            rootItemId: null,
            nodes: []
        };

        this.artifact = foundry.utils.mergeObject(defaults, object);


        if (this.artifact.nodes.length === 0) {

            const item = game.items.get(this.artifact.rootItemId);

            if (item) {
                console.log(`Artifact Awakening | Initialisiere Node aus Item: ${item.name} (${item.id})`);

                this.artifact.nodes.push({
                    id: item.id,
                    name: item.name,
                    img: item.img,
                    bonuses: [],
                    activities: [],
                    children: [],
                    parents: []
                });
            } else {
                console.warn(`Artifact Awakening | Konnte Item mit ID ${this.artifact.rootItemId} nicht finden! Node wird nicht initialisiert.`);
            }
        } else {
            console.log("Artifact Awakening | Lade vorhandene Nodes:", this.artifact.nodes);
        }

        console.log("Artifact Awakening | Lade Nodes aus Items im Ordner neu.");
        this._rebuildNodesFromItems();
    }


    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            id: "artifact-builder",
            title: "Node Editor",
            template: "modules/artifact-awakening/templates/artifact-builder.hbs",
            width: 800,
            height: 700,
            classes: ["dnd5e2", "sheet", "item", "artifact-awakening"],
            submitOnChange: false,
            closeOnSubmit: false,
            resizable: true,
            popOut: true
        });
    }

    async getData() {
        console.log("getData aufgerufen.");
        const rootNode = this.artifact.nodes.find(n => !n.parent);
        const treeHTML = rootNode ? this._buildTreeHTML(rootNode) : "";
        const tree = this._buildTree(this.artifact.nodes);

        const playerActors = game.actors.contents.filter(a => a.type !== "npc");
        const rootItem = game.items.get(this.artifact.rootItemId);
        if (rootItem) {
            this.artifact.img = rootItem.img;
            this.artifact.flags = rootItem.flags;
        }

        let maxDepth = 1;
        this.artifact.nodes.forEach(node => {
            const depth = this._getNodeDepth(node, new Map(this.artifact.nodes.map(n => [n.id, n]))) + 1;
            if (depth > maxDepth) maxDepth = depth;
        });

        const flags = rootItem?.flags?.["artifact-awakening"] || {};
        const actorLevels = flags.actorLevels || {};
        const assignedActorId = Object.keys(actorLevels)[0] || "";
        const assignedLevel = assignedActorId ? actorLevels[assignedActorId] : 1;

        return {
            artifact: this.artifact,
            tree: tree,
            treeHTML: treeHTML,
            actors: playerActors,
            levels: Array.from({length: maxDepth}, (_, i) => i + 1),
            assignedActorId,
            assignedLevel
        };
    }


    activateListeners(html) {
        super.activateListeners(html);
        if (DEBUG) console.log("activateListeners re-bound");

        let maxLevel = 10;
        if (this.artifact.nodes.length > 0) {
            maxLevel = Math.max(...this.artifact.nodes.map(n => this._getNodeDepth(n, new Map(this.artifact.nodes.map(nn => [nn.id, nn]))) + 1));
        }
        const levelOptions = Array.from({length: maxLevel}, (_, i) =>
            `<option value="${i + 1}">Level ${i + 1}</option>`).join("");

        this.element.off("click", ".node-content");

        this.element.on("click", ".node-content", ev => {
            const nodeId = $(ev.currentTarget).closest(".node").data("node-id");
            const node = this.artifact.nodes.find(n => n.id === nodeId);
            if (!node) return;
            if (DEBUG) console.log("Node editor invoked with node:", node);
            if (DEBUG) console.log("Node editor invoked with this:", this);
            NodeEditor.show(node, this);
        });

        html.find(".remove-activity").on("click", ev => {
            const index = $(ev.currentTarget).data("index");
            node.activities.splice(index, 1);
            this.render(true);
        });

        this.element.off("click", ".add-child");
        this.element.on("click", ".add-child", async ev => {
            const parentId = $(ev.currentTarget).data("parent");
            const parentNode = this.artifact.nodes.find(n => n.id === parentId);
            if (!parentNode) return;

            const childCount = this.artifact.nodes.filter(n => n.parents?.includes(parentId)).length;
            if (childCount >= 2) return ui.notifications.warn("This node already has two children.");

            const parentDepth = this._getNodeDepth(parentNode, new Map(this.artifact.nodes.map(n => [n.id, n])));
            if (parentDepth >= 9) return ui.notifications.warn("Maximum depth reached.");

            await this._addChildNode(parentNode);
        });

        this.element.off("click", ".remove-node");
        this.element.on("click", ".remove-node", async ev => {
            const nodeId = $(ev.currentTarget).data("node");

            const removeRecursive = async id => {
                const children = this.artifact.nodes.filter(n => n.parents?.includes(id));
                for (let child of children) {
                    await removeRecursive(child.id);
                }

                const item = game.items.get(id);
                if (item) {
                    await item.delete();
                    if (DEBUG) console.log(`Artifact Awakening | Item ${item.name} deleted.`);
                } else {
                    if (DEBUG) console.warn(`Artifact Awakening | No item found for node ${id}`);
                }

                this.artifact.nodes = this.artifact.nodes.filter(n => n.id !== id);
            };

            await removeRecursive(nodeId);
            await this._rebuildNodesFromItems();
            this.render(true);
        });

        html.find(".add-passive-bonus").on("click", ev => {
            const id = $(ev.currentTarget).data("node");
            const node = this.artifact.nodes.find(n => n.id === id);
            if (node) {
                node.bonuses.push({type: "custom", value: 1});
                this.render(true);
            }
        });

        this.element.off("click", ".connect-parent");
        this.element.on("click", ".connect-parent", ev => {
            const childId = $(ev.currentTarget).data("node");
            const childNode = this.artifact.nodes.find(n => n.id === childId);
            if (!childNode) return;

            const nodeMap = new Map(this.artifact.nodes.map(n => [n.id, n]));
            const childDepth = this._getNodeDepth(childNode, nodeMap);

            let htmlContent = this.artifact.nodes.map(potentialParent => {
                if (potentialParent.id === childNode.id) return "";
                const parentDepth = this._getNodeDepth(potentialParent, nodeMap);
                if (parentDepth !== childDepth - 1) return "";

                const childCount = this.artifact.nodes.filter(n => n.parents?.includes(potentialParent.id)).length;
                const alreadyParent = childNode.parents.includes(potentialParent.id);
                return `
                <div>
                    <label>
                        <input type="checkbox" name="parentNode" value="${potentialParent.id}"
                            ${alreadyParent ? "checked" : ""}
                            ${!alreadyParent && childCount >= 2 ? "disabled" : ""}>
                        ${potentialParent.name} ${childCount >= 2 ? "(already has two children)" : ""}
                    </label>
                </div>
            `;
            }).join("") || "<p>No valid parent nodes available.</p>";

            new Dialog({
                title: "Select Parents",
                content: htmlContent,
                buttons: {
                    ok: {
                        label: "Save",
                        callback: async dlgHtml => {
                            const selected = dlgHtml.find("input[name='parentNode']:checked").map((_, el) => $(el).val()).get();
                            if (!selected.length) return ui.notifications.error("At least one parent must be selected.");

                            childNode.parents = selected;

                            const childItem = game.items.get(childNode.id);
                            const parentNodeIds = selected.map(pid => {
                                const pItem = game.items.get(pid);
                                return pItem?.getFlag("artifact-awakening", "nodeId") || pid;
                            });

                            await childItem.update({[`flags.artifact-awakening.parentIds`]: parentNodeIds});
                            if (DEBUG) console.log(`Parent IDs saved to item ${childItem.name}:`, parentNodeIds);

                            for (const parentId of selected) {
                                const parentItem = game.items.get(parentId);
                                let childIds = parentItem.getFlag("artifact-awakening", "childIds") || [];
                                const thisNodeId = childItem.getFlag("artifact-awakening", "nodeId") || childItem.id;

                                if (!childIds.includes(thisNodeId)) {
                                    childIds.push(thisNodeId);
                                    await parentItem.update({[`flags.artifact-awakening.childIds`]: childIds});
                                    if (DEBUG) console.log(`Child ID added to parent ${parentItem.name}: ${thisNodeId}`);
                                }
                            }

                            this.render(true);
                        }
                    },
                    cancel: {label: "Cancel"}
                }
            }).render(true);
        });

        this.element.on("click", "input[name='parentNode']", ev => {
        });

        this.element.off("click", ".header-button.close").on("click", ".header-button.close", ev => {
            if (DEBUG) console.log("Close button clicked.");
            this.close();
        });

        setTimeout(() => {
            this._drawConnections();
        }, 50);

        this.element.off("click", ".save-actor-level").on("click", ".save-actor-level", async ev => {
            const actorId = this.element.find(".actor-select").val();
            const level = parseInt(this.element.find(".actor-visible-level").val());

            if (!actorId) return ui.notifications.warn("Please select an actor.");

            const rootItem = game.items.get(this.artifact.rootItemId);
            if (!rootItem) return ui.notifications.error("Root item not found.");

            let actorLevels = {};
            actorLevels[actorId] = level;

            await rootItem.setFlag("artifact-awakening", "actorLevels", actorLevels);
            await rootItem.update({"ownership": {[actorId]: 2}});

            this.artifact.flags = this.artifact.flags || {};
            this.artifact.flags["artifact-awakening"] = this.artifact.flags["artifact-awakening"] || {};
            this.artifact.flags["artifact-awakening"].actorLevels = actorLevels;

            ui.notifications.info(`Level ${level} saved for actor.`);
            this.render(true);
        });

        html.find(".add-actor-level-row").off().on("click", ev => {
            if (DEBUG) console.log(".add-actor-level-row triggered");

            const allocationContainer = html.find(".actor-allocation-rows");

            if (allocationContainer.find(".actor-level-row.new-row").length > 0) {
                ui.notifications.info("There is already a new row.");
                return;
            }

            const assignedActorIds = [];
            allocationContainer.find(".actor-level-row select.actor-select").each((i, sel) => {
                const val = $(sel).val();
                if (val) assignedActorIds.push(val);
            });

            let maxLevel = 10;
            if (this.artifact.nodes.length > 0) {
                maxLevel = Math.max(...this.artifact.nodes.map(n => this._getNodeDepth(n, new Map(this.artifact.nodes.map(nn => [nn.id, nn]))) + 1));
            }

            const levelOptions = Array.from({length: maxLevel}, (_, i) =>
                `<option value="${i + 1}">Level ${i + 1}</option>`).join("");

            const actorOptions = game.actors.contents
                .filter(a => a.type !== "npc")
                .map(a => `<option value="${a.id}" ${assignedActorIds.includes(a.id) ? "disabled" : ""}>${a.name}</option>`)
                .join("");

            const newRowHTML = `
            <div class="actor-level-row new-row" style="display: flex; gap: 0.5em; align-items: center;">
                <select class="actor-select">
                    <option value="">-- Select Actor --</option>
                    ${actorOptions}
                </select>
                <select class="actor-visible-level">
                    ${levelOptions}
                </select>
                <button class="save-actor-level" title="Save">Save</button>
            </div>
        `;

            allocationContainer.append(newRowHTML);
            this.activateListeners(this.element);
        });

        html.find(".remove-actor-level-row").off().on("click", ev => {
            const row = $(ev.currentTarget).closest(".actor-level-row");
            const actorId = row.find(".actor-select").val();
            if (!actorId) return;

            delete this.artifact.flags["artifact-awakening"].actorLevels[actorId];
            this.render(true);
        });

        this.element.off("click", "[data-edit='img']").on("click", "[data-edit='img']", ev => {
            const fp = new FilePicker({
                type: "image",
                current: this.artifact.img || "icons/svg/mystery-man.svg",
                callback: async path => {
                    const item = game.items.get(this.artifact.rootItemId);
                    if (item) await item.update({img: path});
                    this.artifact.img = path;
                    await this._updateLinkedArtifactsAndFolder();
                    this.render(true);
                }
            });
            fp.browse();
        });

        this.element.off("click", ".save-artifact-name").on("click", ".save-artifact-name", async ev => {
            const nameInput = this.element.find("input[name='name']");
            const newName = nameInput.val()?.trim();
            if (!newName || newName === this.artifact.name) return;

            const existingFolder = game.folders.find(f => f.name === newName && f.id !== this.artifact.folderId);
            if (existingFolder) {
                ui.notifications.warn(`Another artifact or folder with the name "${newName}" already exists.`);
                return;
            }

            const item = game.items.get(this.artifact.rootItemId);
            if (item) {
                let levelPart = "";
                const match = item.name.match(/- Level .+$/);
                if (match) levelPart = match[0];
                await item.update({name: `${newName}${levelPart}`});
            }

            this.artifact.name = newName;
            await this._updateLinkedArtifactsAndFolder();
        });


        html.on("click", ".select-artifact-level", async ev => {
            if (DEBUG) console.log("Button click detected.");
            const button = $(ev.currentTarget);
            const actorId = button.data("actor-id");
            const artifactId = button.data("artifact-id");

            if (DEBUG) console.log(`Data received: actorId = ${actorId}, artifactId = ${artifactId}`);
            const actor = game.actors.get(actorId);
            const artifactItem = game.items.get(artifactId);

            if (!actor || !artifactItem) {
                ui.notifications.error(templates / artifact - selection.hbs);
                return;
            }

            const actorLevels = artifactItem.getFlag("artifact-awakening", "actorLevels") || {};
            const selectedLevel = actorLevels[actorId];
            if (!selectedLevel) {
                ui.notifications.warn("No level assigned to this actor.");
                return;
            }

            const baseName = artifactItem.name.replace(/- Level \d+-\d+$/, "").trim();
            if (DEBUG) console.log("Base name:", baseName, "| Target level:", selectedLevel);

            const levelRegexGlobal = new RegExp(`^${this.escapeRegExp(baseName)}.*Level ${selectedLevel}-\\d+`, "i");
            const existingAny = actor.items.find(it => levelRegexGlobal.test(it.name));

            if (DEBUG) console.log(`Checking if actor already has an item at level ${selectedLevel}...`);
            if (existingAny) {
                if (DEBUG) console.warn(`Actor already has: ${existingAny.name}`);
                ui.notifications.warn(`You already have an artifact at level ${selectedLevel}: ${existingAny.name}`);
                return;
            }

            if (DEBUG) console.log("No existing item found at this level. Proceeding...");

            const folderId = artifactItem.folder?.id;
            const nodes = game.items.filter(i => i.folder?.id === folderId);

            const node = nodes.find(n => {
                const matchesLevel = n.name.includes(`Level ${selectedLevel}-`);
                const matchesBase = n.name.startsWith(baseName);
                return matchesLevel && matchesBase;
            });

            const itemToGive = node || artifactItem;
            const itemName = itemToGive.name;

            if (DEBUG) console.log(`Adding item: ${itemName}`);

            const newItem = foundry.utils.duplicate(itemToGive.toObject());
            await actor.createEmbeddedDocuments("Item", [newItem]);

            ui.notifications.info(`Artifact "${itemName}" has been added.`);
        });
    }

    async escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    async _updateObject(event, formData) {
        if (DEBUG) console.log("Artifact saved:", this.artifact);
    }

    _buildTree(nodes) {
        const nodeMap = new Map();
        const roots = [];

        for (let node of nodes) {
            node.childrenObjects = [];
            nodeMap.set(node.id, node);
        }

        for (let node of nodes) {
            if (node.parent) {
                const parentNode = nodeMap.get(node.parent);
                if (parentNode) parentNode.childrenObjects.push(node);
            } else roots.push(node);
        }

        return roots;
    }

    _getNodeDepth(node, nodeMap) {
        const findDepth = (n, visited = new Set()) => {
            if (!n || visited.has(n.id)) return 0;
            visited.add(n.id);
            const parents = n.parents || (n.parent ? [n.parent] : []);
            if (!parents.length) return 0;
            return Math.max(...parents.map(pid => findDepth(nodeMap.get(pid), visited))) + 1;
        };
        return findDepth(node);
    }

    _buildTreeHTML(node) {
        let html = "";
        const maxDepth = 10;
        const levelMap = new Map();
        const nodeMap = new Map(this.artifact.nodes.map(n => [n.id, n]));

        this.artifact.nodes.forEach(n => {
            const d = this._getNodeDepth(n, nodeMap);
            if (!levelMap.has(d)) levelMap.set(d, []);
            levelMap.get(d).push(n);
        });

        for (let depth = 0; depth <= maxDepth; depth++) {
            const levelNodes = levelMap.get(depth);
            if (!levelNodes) continue;

            html += `<div class="children node-level-${depth}">`;
            levelNodes.forEach((node, i) => {
                node.name = depth === 0 ? "Level 1" : `Level ${depth + 1}-${i + 1}`;
                html += `
                <div class="node" data-node-id="${node.id}">
                    <div class="node-content"><strong>${node.name}</strong></div>
                    <span class="node-actions">
                        <i class="fas fa-plus-circle add-child" data-parent="${node.id}"></i>
                        <i class="fas fa-link connect-parent" data-node="${node.id}"></i>
                        ${(!node.parents?.length ? "" : `<i class="fas fa-minus-circle remove-node" data-node="${node.id}"></i>`)}
                    </span>
                </div>
            `;
            });
            html += `</div>`;
        }

        return html;
    }


    _drawConnections() {
        let svg = this.element.find("svg#connection-lines");
        if (!svg.length) {
            svg = $(`<svg id="connection-lines" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 0;"></svg>`);
            this.element.prepend(svg);
        }
        svg.empty();

        this.artifact.nodes.forEach(node => {
            if (!node.parents?.length) return;

            const childEl = this.element.find(`.node[data-node-id="${node.id}"]`);
            node.parents.forEach(parentId => {
                const parentEl = this.element.find(`.node[data-node-id="${parentId}"]`);
                if (!childEl.length || !parentEl.length) return;

                const childOffset = childEl.offset();
                const parentOffset = parentEl.offset();
                const containerOffset = this.element.offset();

                const x1 = parentOffset.left - containerOffset.left + parentEl.outerWidth() / 2;
                const y1 = parentOffset.top - containerOffset.top + parentEl.outerHeight();
                const x2 = childOffset.left - containerOffset.left + childEl.outerWidth() / 2;
                const y2 = childOffset.top - containerOffset.top;

                drawLine(svg[0], x1, y1, x2, y2, "black", 3);
            });
        });
    }

    static async createNewArtifact() {
        const response = await new Promise(resolve => {
            const content = `
            <p>Wie soll das Artefakt heißen?</p>
            <input type='text' id='artifact-name' value='Neues Artefakt'>
            <p>Item-Typ:</p>
            <label><input type='radio' name='item-type' value='weapon' checked> Waffe</label><br>
            <label><input type='radio' name='item-type' value='equipment'> Ausrüstung</label>
        `;
            new Dialog({
                title: "Neues Artefakt",
                content,
                buttons: {
                    ok: {
                        label: "Erstellen",
                        callback: html => {
                            const name = html.find("#artifact-name").val();
                            const type = html.find("input[name='item-type']:checked").val();
                            resolve({name, type});
                        }
                    },
                    cancel: {
                        label: "Abbrechen",
                        callback: () => resolve(null)
                    }
                }
            }).render(true);
        });

        if (!response) return;

        const artifactName = response.name;
        const itemType = response.type;

        let folderName = artifactName || "Neues Artefakt";
        let uniqueName = folderName;
        let counter = 1;

        while (game.folders.find(f => f.name === uniqueName && f.type === "Item")) {
            uniqueName = `${folderName} (${counter++})`;
        }

        let folder = await Folder.create({name: uniqueName, type: "Item"});

        const img = itemType === "weapon" ? "icons/svg/sword.svg" : "icons/svg/armor.svg";

        const nodeId = foundry.utils.randomID();

        const item = await Item.create({
            name: `${uniqueName} - Level 1-1`,
            type: itemType,
            img: img,
            flags: {
                "artifact-awakening": {
                    nodeId: nodeId,
                    parentIds: [],
                    childIds: []
                }
            },
            folder: folder.id
        });

        const artifactData = {
            name: uniqueName,
            folderId: folder.id,
            rootItemId: item.id
        };

        new ArtifactBuilder(artifactData).render(true);
    }

    async _addChildNode(parentNode) {
        const parentItem = game.items.get(parentNode.id);
        const folderId = parentItem.folder.id;

        // Level und Nummer bestimmen (optional, nur noch für Namen)
        const level = this._calculateNodeLevel(parentNode) + 1;

        // Bessere Nummer: Zähle alle Nodes mit diesem Level global
        const allSameLevel = this.artifact.nodes.filter(n =>
            this._calculateNodeLevel(n) === level
        );
        const childNumber = allSameLevel.length + 1;

        const itemName = `${this.artifact.name} - Level ${level}-${childNumber}`;

        // Neue nodeId erstellen
        const nodeId = foundry.utils.randomID();
        console.log("Item.create übersprungen.");

        //Neues Item erstellen
        const item = await Item.create({
            name: itemName,
            type: parentItem.type,
            img: parentItem.img,
            flags: {
                "artifact-awakening": {
                    nodeId: nodeId,
                    parentIds: parentItem.getFlag("artifact-awakening", "nodeId") ?
                        [parentItem.getFlag("artifact-awakening", "nodeId")] : [],
                    childIds: []
                }
            },
            folder: folderId
        });

        // Eltern-Item aktualisieren → Kind hinzufügen
        let parentChildIds = parentItem.getFlag("artifact-awakening", "childIds") || [];
        parentChildIds.push(nodeId);
        await parentItem.update({
            [`flags.artifact-awakening.childIds`]: parentChildIds
        });

        // Node für den Baum anlegen
        const childNode = {
            id: item.id,
            name: item.name,
            bonuses: [],
            activities: [],
            children: [],
            parents: [parentNode.id]
        };

        // Node zur Struktur hinzufügen
        parentNode.children.push(item.id);
        this.artifact.nodes.push(childNode);

        if (DEBUG) console.log(`Artifact Awakening | New item and node created: ${itemName} (Node ID: ${nodeId})`);

        this.render(true);
        this.bringToTop();
        if (DEBUG) console.log("After render(true): this.element =", this.element);
    }

    _calculateNodeLevel(node, depth = 1) {
        if (!node.parents || node.parents.length === 0) return depth;
        const parentNode = this.artifact.nodes.find(n => n.id === node.parents[0]);
        if (!parentNode) return depth;
        return this._calculateNodeLevel(parentNode, depth + 1);
    }

    _rebuildNodesFromItems() {
        const folder = game.folders.get(this.artifact.folderId);
        if (!folder) {
            if (DEBUG) console.warn("Artifact Awakening | Folder not found.");
            return;
        }

        const items = game.items.filter(i => i.folder?.id === folder.id);
        if (DEBUG) console.log(`Artifact Awakening | ${items.length} items found in folder.`);

        const nodes = items.map(item => ({
            id: item.id,
            name: item.name,
            bonuses: [],
            activities: [],
            children: [],
            parents: []
        }));

        const nodeMap = new Map();
        for (const node of nodes) {
            const item = game.items.get(node.id);
            const nodeId = item.getFlag("artifact-awakening", "nodeId") || node.id;
            nodeMap.set(nodeId, node);
        }

        if (DEBUG) console.log("---- NodeMap content ----");
        for (const [nid, n] of nodeMap.entries()) {
            if (DEBUG) console.log(`NodeId: ${nid} | Item Name: ${n.name} | Foundry Item ID: ${n.id}`);
        }

        for (const node of nodes) {
            const item = game.items.get(node.id);
            const nodeId = item.getFlag("artifact-awakening", "nodeId") || node.id;

            const parentIds = item.getFlag("artifact-awakening", "parentIds") || [];

            for (const parentNodeId of parentIds) {
                const parentNode = Array.from(nodeMap.values()).find(n => {
                    const parentItem = game.items.get(n.id);
                    const pNodeId = parentItem?.getFlag("artifact-awakening", "nodeId") || n.id;
                    return pNodeId === parentNodeId;
                });

                if (parentNode) {
                    node.parents.push(parentNode.id);
                    parentNode.children.push(node.id);
                    if (DEBUG) console.log(`Artifact Awakening | ${node.name} → Parent: ${parentNode.name}`);
                } else {
                    if (DEBUG) console.warn(`Artifact Awakening | WARNING: Parent item with nodeId ${parentNodeId} not found for ${node.name}!`);
                }
            }
        }

        this.artifact.nodes = nodes;

        if (DEBUG) console.log(`Artifact Awakening | ${this.artifact.nodes.length} nodes reconstructed from flags.`);
    }

    async _updateLinkedArtifactsAndFolder() {
        const folderId = this.artifact.folderId;
        if (!folderId) return;

        const folder = game.folders.get(folderId);
        if (!folder) return;

        const items = game.items.filter(it => it.folder?.id === folderId && it.id !== this.artifact.rootItemId);

        for (let item of items) {
            let levelPart = "";
            const match = item.name.match(/- Level .+$/);
            if (match) {
                levelPart = match[0];
            }

            await item.update({
                name: `${this.artifact.name}${levelPart}`,
                img: this.artifact.img
            });
        }

        let targetName = this.artifact.name;
        if (folder.name !== targetName) {
            const existing = game.folders.find(f => f.name === targetName && f.id !== folder.id);
            if (existing) {
                ui.notifications.warn(`Another folder named "${targetName}" already exists. Folder name will not be changed.`);
            } else {
                await folder.update({name: targetName});
            }
        }
    }
}
Hooks.on("renderArtifactBuilder", (app, html, data) => {
    if (DEBUG) console.log("Hook: ArtifactBuilder re-rendered");
    app.activateListeners(html);
});
