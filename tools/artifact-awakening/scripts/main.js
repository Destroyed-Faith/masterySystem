import { ArtifactBuilder } from "./artifact-builder.js";

const DEBUG = false;
let activeArtifactBuilder = null;

Hooks.once('init', () => {
    if (DEBUG) console.log("Artifact Awakening | Initialized");

    Handlebars.registerHelper('ifEquals', function (a, b, options) {
        return (a === b) ? options.fn(this) : options.inverse(this);
    });

    Handlebars.registerHelper('lt', function (a, b) {
        return a < b;
    });

    // Am besten ganz oben im main.js oder bei init:
    $(document).on("click", ".artifact-open", function(ev) {
        const folderId = $(this).closest("li.directory-item.folder").data("folderId");
        const folder = game.folders.get(folderId);
        if (!folder) return;

        // Falls schon offen
        if (window.activeArtifactBuilder && window.activeArtifactBuilder.rendered) {
            window.activeArtifactBuilder.bringToTop();
            return;
        }

        const rootItem = game.items.find(it => it.folder?.id === folderId && /Level\s*1/i.test(it.name));
        if (!rootItem) {
            ui.notifications.warn("No base item (Level 1) found in folder.");
            return;
        }

        window.activeArtifactBuilder = new ArtifactBuilder({
            name: folder.name,
            folderId: folderId,
            rootItemId: rootItem.id
        });
        window.activeArtifactBuilder.render(true);
    });

});

Hooks.on("renderItemDirectory", (app, html, data) => {
    if (!game.user.isGM) return;

    const button = $(`<button class="create-artifact"><i class="fas fa-gem"></i> New Artifact</button>`);

    button.click(() => {
        if (DEBUG) console.log("Artifact Awakening | Open ArtifactBuilder");
        ArtifactBuilder.createNewArtifact();
    });

    const footer = html.find(".directory-footer");
    if (footer.length) {
        footer.append(button);
    } else {
        html.find(".directory-header .header-actions").append(button);
    }

    if (DEBUG) console.log("Artifact Awakening | Rendering FolderDirectory");

    html.find("li.directory-item.folder").each((i, el) => {
        const folderId = el.dataset.folderId;
        const folder = game.folders.get(folderId);

        if (DEBUG) console.log(`Artifact Awakening | Checking Folder ID: ${folderId}`);

        if (!folder) return;

        if (folder.type === "Item") {
            if (DEBUG) console.log(`Artifact Awakening | Item Folder found: ${folder.name}`);

            if ($(el).find(".artifact-open").length) {
                if (DEBUG) console.log("Artifact Awakening | Button already exists, skipping.");
                return;
            }

            const btn = $(`<a class="create-button artifact-open" title="Open Artifact" style="margin-left: 0.5em; cursor: pointer;"><i class="fas fa-gem"></i></a>`);
            const buttonClass = "artifact-open-" + folderId;
            btn.addClass(buttonClass);

            const buttonRow = $(el).find("header.folder-header");
            buttonRow.append(btn);

            html.off("click", `.${buttonClass}`).on("click", `.${buttonClass}`, ev => {
                if (DEBUG) console.log(`Artifact Awakening | Button clicked for Folder ${folder.name}`);

                const folderContents = game.items.filter(it => it.folder?.id === folderId);
                if (DEBUG) console.log(`Artifact Awakening | ${folderContents.length} items found in folder.`);

                const rootItem = game.items.find(it => it.folder?.id === folderId && /Level\s*1/i.test(it.name));
                if (!rootItem) {
                    ui.notifications.warn("No base item (Level 1) found in folder.");
                    return;
                }

                if (DEBUG) console.log(`Artifact Awakening | Root item found: ${rootItem.name} (${rootItem.id})`);

                if (activeArtifactBuilder && activeArtifactBuilder.rendered) return;

                if (activeArtifactBuilder && !activeArtifactBuilder._state < 2) {
                    activeArtifactBuilder.bringToTop();
                    return;
                }

                activeArtifactBuilder = new ArtifactBuilder({
                    name: folder.name,
                    folderId: folderId,
                    rootItemId: rootItem.id
                });
                activeArtifactBuilder.render(true);
            });

            if (DEBUG) console.log(`Artifact Awakening | Button added for ${folder.name}`);
        }
    });
});

Hooks.on("renderActorSheet", (app, html, data) => {
    if (!game.user.isGM && !app.actor.testUserPermission(game.user, "OWNER")) return;

    const header = html.closest('.app').find('.window-header');

    if (header.find(".artifact-selection-button").length > 0) return;

    const button = $(`<a class="artifact-selection-button" title="Select Artifact"><i class="fas fa-gem"></i> Artifact</a>`);
    header.find('.header-button.close').before(button);

    button.on("click", ev => {
        showArtifactSelectionDialog(app.actor);
    });
});

Handlebars.registerHelper('range', function(start, end, options) {
    let accum = '';
    for (let i = start; i <= end; ++i)
        accum += options.fn(i);
    return accum;
});

async function showArtifactSelectionDialog(actor) {
    if (DEBUG) console.log(`Artifact Awakening | Starting selection for Actor "${actor.name}"`);

    const artifacts = [];

    for (const item of game.items) {
        if (DEBUG) console.log(`Checking item: ${item.name}`);

        const flags = item.flags?.["artifact-awakening"];
        if (!flags) continue;

        const baseName = item.name.replace(/- Level \d+-\d+$/, "").trim();
        const allWithSameBase = game.items.filter(it => it.name.startsWith(baseName));
        const rootItem = allWithSameBase.find(it => it.name.match(/Level 1-1/));

        if (!rootItem) continue;

        const actorLevels = rootItem.flags?.["artifact-awakening"]?.actorLevels || {};
        const assignedLevel = actorLevels[actor.id];
        if (!assignedLevel) continue;

        const match = item.name.match(/Level (\d+)-/);
        const itemLevel = match ? parseInt(match[1]) : null;
        if (!itemLevel || itemLevel !== assignedLevel) continue;

        if (!item.testUserPermission(game.user, "OBSERVER")) continue;

        if (!artifacts.some(a => a.id === item.id)) {
            artifacts.push({
                ...item,
                actorId: actor.id,
                id: item.id,
                name: item.name
            });
        }
    }

    const content = await renderTemplate("modules/artifact-awakening/templates/artifact-selection.hbs", {
        artifacts: artifacts,
        actor: actor
    });

    new Dialog({
        title: "Select Artifact",
        content: content,
        buttons: {},
        render: html => {
            html.find(".artifact-name").on("click", ev => {
                const itemId = $(ev.currentTarget).data("item-id");
                const item = game.items.get(itemId);
                if (item) item.sheet.render(true);
            });

            html.on("click", ".select-artifact-level", async ev => {
                const button = $(ev.currentTarget);
                const actorId = button.data("actor-id");
                const artifactId = button.data("artifact-id");

                const actor = game.actors.get(actorId);
                const artifactItem = game.items.get(artifactId);

                if (!actor || !artifactItem) {
                    ui.notifications.error("Actor or artifact not found.");
                    return;
                }

                const baseName = artifactItem.name.replace(/- Level \d+-\d+$/, "").trim();
                const levelMatch = artifactItem.name.match(/Level (\d+)-/);
                const level = levelMatch ? parseInt(levelMatch[1]) : null;

                if (!level) {
                    ui.notifications.error("Could not determine the item's level.");
                    return;
                }

                const existing = actor.items.find(it =>
                    it.name.startsWith(baseName) && it.name.includes(`Level ${level}-`)
                );

                if (existing) {
                    ui.notifications.warn("You already have this artifact level.");
                    return;
                }

                const newItem = foundry.utils.duplicate(artifactItem.toObject());
                await actor.createEmbeddedDocuments("Item", [newItem]);
                ui.notifications.info(`${artifactItem.name} added to ${actor.name}!`);
            });
        }
    }).render(true);
}

Hooks.on("closeItemSheet", (app, html, data) => {
    const item = app.item;
    if (!item) return;
    const folderId = item.folder?.id;
    if (!folderId) return;

    if (DEBUG) console.log(`Item closed: "${item.name}" in folder "${game.folders.get(folderId)?.name}"`);
    if (DEBUG) console.log("system.activities:", item.system.activities);

    const freshItem = game.items.get(item.id);
    syncArtifactActivitiesToChildren(freshItem);
});

async function syncArtifactActivitiesToChildren(parentItem) {
    const folderId = parentItem.folder?.id;
    if (!folderId) return;

    const folder = game.folders.get(folderId);
    if (!folder || folder.type !== "Item") return;

    const allItems = game.items.filter(it => it.folder?.id === folderId);

    let parentActivities = parentItem.system.activities || {};
    if (parentActivities instanceof Map) {
        if (DEBUG) console.log(`Activities were a Map, converting.`);
        parentActivities = Object.fromEntries(parentActivities.entries());
    }

    const activityCount = Object.keys(parentActivities).length;
    if (DEBUG) console.log(`Copying ${activityCount} activities to children.`);

    const plainActivities = cloneActivities(parentActivities);

    const artifactFlags = parentItem.flags["artifact-awakening"] || {};
    const initialChildNodeIds = artifactFlags.childIds || [];

    const itemMap = {};
    for (const item of allItems) {
        const nid = item.flags["artifact-awakening"]?.nodeId;
        if (nid) itemMap[nid] = item;
    }

    const queue = [...initialChildNodeIds];

    while (queue.length > 0) {
        const nodeId = queue.shift();
        const item = itemMap[nodeId];
        if (!item) continue;

        if (DEBUG) console.log(`Updating item "${item.name}" with activities.`);
        if (DEBUG) console.log(`New activities for "${item.name}":`, plainActivities);

        await item.update({
            "system.activities": plainActivities
        });

        const refreshedItem = await fromUuid(item.uuid);
        if (DEBUG) console.log(`After update, activities in item "${refreshedItem.name}":`, refreshedItem.system.activities);

        const nextChildIds = item.flags["artifact-awakening"]?.childIds || [];
        queue.push(...nextChildIds);
    }
}

function cloneActivities(parentActivities) {
    const plainActivities = {};
    for (const [key, act] of Object.entries(parentActivities)) {
        const activityName = act.name ?? "(no name)";
        const activityType = act.type ?? "(no type)";
        const hasName = !!act.name;
        const hasType = !!act.type;
        const isAttack = act.type === "attack";

        if (DEBUG) {
            console.log(`Checking activity "${key}":`);
            console.log(`     Name: ${activityName}`);
            console.log(`     Type: ${activityType}`);
            console.log(`     Has name? ${hasName}`);
            console.log(`     Has type? ${hasType}`);
            console.log(`     Is attack? ${isAttack}`);
        }

        if (!hasName || !hasType || isAttack) {
            if (DEBUG) console.log(`Skipping activity "${activityName}".`);
            continue;
        }

        const clone = foundry.utils.deepClone(act.toObject ? act.toObject() : act);
        delete clone._id;

        clone.name = act.name ?? "Unnamed";
        clone.type = act.type ?? "custom";

        plainActivities[key] = clone;

        if (DEBUG) console.log(`Cloned activity "${clone.name}".`);
    }
    return plainActivities;
}
