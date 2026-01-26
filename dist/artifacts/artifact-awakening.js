/**
 * Artifact Awakening System
 * Manages artifact evolution trees and actor assignments
 */
import { ArtifactBuilder } from './artifact-builder.js';
/**
 * Initialize artifact awakening hooks
 */
export function initializeArtifactAwakening() {
    console.log('Mastery System | Initializing Artifact Awakening system');
    // Hook into Item Directory to add "New Artifact" button (GM only)
    Hooks.on('renderItemDirectory', (_app, html, _data) => {
        if (!game.user?.isGM)
            return;
        // Check if button already exists
        if (html.find('.ms-new-artifact-btn').length > 0)
            return;
        const newArtifactBtn = $(`
      <button type="button" class="ms-new-artifact-btn" title="New Artifact">
        <i class="fas fa-gem"></i> New Artifact
      </button>
    `);
        newArtifactBtn.on('click', async () => {
            await createNewArtifact();
        });
        // Place button next to "Create Item" and "Create Folder" buttons
        // Look for the header actions container where these buttons are
        const headerActions = html.find('.directory-header .header-actions, .directory-header .action-buttons, .directory-header .controls');
        if (headerActions.length > 0) {
            // Insert after existing buttons
            headerActions.append(newArtifactBtn);
            return;
        }
        // Try to find where "Create Item" button is
        const createItemBtn = html.find('button[data-action="createItem"], button.create-item, .create-entity');
        if (createItemBtn.length > 0) {
            // Insert after Create Item button
            createItemBtn.after(newArtifactBtn);
            return;
        }
        // Try header directly
        const header = html.find('.directory-header');
        if (header.length > 0) {
            // Create actions container if needed
            let actionsContainer = header.find('.header-actions, .action-buttons');
            if (actionsContainer.length === 0) {
                actionsContainer = $('<div class="header-actions"></div>');
                header.append(actionsContainer);
            }
            actionsContainer.append(newArtifactBtn);
            return;
        }
        // Fallback: try directory footer
        const footer = html.find('.directory-footer');
        if (footer.length > 0) {
            footer.append(newArtifactBtn);
            return;
        }
        // Last resort: prepend to window content
        const windowContent = html.find('.window-content');
        if (windowContent.length > 0) {
            windowContent.prepend(newArtifactBtn);
        }
    });
    // Hook into Item Directory folder rows to add "Open Artifact Builder" button
    Hooks.on('renderItemDirectory', (app, html, _data) => {
        if (!game.user?.isGM)
            return;
        // Find all folder rows
        html.find('.folder').each((_index, folder) => {
            const $folder = $(folder);
            const folderId = $folder.attr('data-folder-id');
            if (!folderId)
                return;
            // Check if button already exists
            if ($folder.find('.ms-open-artifact-builder-btn').length > 0)
                return;
            // Check if this folder contains artifact root items
            const folderData = app.folders?.get(folderId);
            if (!folderData)
                return;
            // Check if folder has a root artifact (Level 1-1)
            const folderItems = game.items?.filter((item) => item.folder?.id === folderId &&
                item.type === 'artifact' &&
                item.name.includes('Level 1-1')) || [];
            if (folderItems.length === 0)
                return;
            const builderBtn = $(`
        <button type="button" class="ms-open-artifact-builder-btn" title="Open Artifact Builder" data-folder-id="${folderId}">
          <i class="fas fa-gem"></i>
        </button>
      `);
            builderBtn.on('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                const folderId = $(e.currentTarget).data('folder-id');
                await openArtifactBuilderForFolder(folderId);
            });
            // Add button to folder header
            const folderHeader = $folder.find('.folder-header');
            if (folderHeader.length > 0) {
                folderHeader.append(builderBtn);
            }
        });
    });
    // Hook into Actor Sheet to add "Artifact" button
    Hooks.on('renderActorSheet', (sheet, html, _data) => {
        if (!game.user?.isGM)
            return;
        if (sheet.actor.type !== 'character')
            return;
        // Check if button already exists
        if (html.find('.ms-artifact-button').length > 0)
            return;
        const artifactBtn = $(`
      <button type="button" class="ms-artifact-button" title="Manage Artifacts">
        <i class="fas fa-gem"></i> Artifact
      </button>
    `);
        artifactBtn.on('click', async () => {
            await showArtifactDialogForActor(sheet.actor);
        });
        // Add to sheet header
        const header = html.find('.sheet-header');
        if (header.length > 0) {
            header.append(artifactBtn);
        }
    });
}
/**
 * Create a new artifact (folder + root item)
 */
async function createNewArtifact() {
    const dialog = new Dialog({
        title: 'Create New Artifact',
        content: `
      <form class="artifact-creation-form">
        <div class="form-group">
          <label>Artifact Name:</label>
          <input type="text" id="artifact-name" placeholder="Enter artifact name..." />
        </div>
      </form>
    `,
        buttons: {
            create: {
                icon: '<i class="fas fa-check"></i>',
                label: 'Create',
                callback: async (html) => {
                    const name = html.find('#artifact-name').val();
                    if (!name || name.trim() === '') {
                        ui.notifications?.warn('Please enter an artifact name.');
                        return false;
                    }
                    try {
                        // Create folder
                        const folder = await Folder.create({
                            name: name.trim(),
                            type: 'Item',
                            folder: null
                        });
                        // Create root artifact item
                        const rootItemData = {
                            name: `${name.trim()} - Level 1-1`,
                            type: 'artifact',
                            folder: folder.id,
                            system: {
                                level: 1,
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
                                    nodeId: foundry.utils.randomID(),
                                    parentIds: [],
                                    childIds: [],
                                    isRoot: true
                                }
                            }
                        };
                        await Item.create(rootItemData);
                        ui.notifications?.info(`Created artifact: ${name.trim()}`);
                        return true;
                    }
                    catch (error) {
                        console.error('Mastery System | Error creating artifact', error);
                        ui.notifications?.error('Failed to create artifact.');
                        return false;
                    }
                }
            },
            cancel: {
                icon: '<i class="fas fa-times"></i>',
                label: 'Cancel',
                callback: () => { }
            }
        },
        default: 'create',
        close: () => { }
    });
    dialog.render(true);
}
/**
 * Open artifact builder for a folder
 */
async function openArtifactBuilderForFolder(folderId) {
    const folder = game.folders?.get(folderId);
    if (!folder) {
        ui.notifications?.error('Folder not found.');
        return;
    }
    // Find root artifact item (Level 1-1)
    const rootItem = game.items?.find((item) => item.folder?.id === folderId &&
        item.type === 'artifact' &&
        item.name.includes('Level 1-1'));
    if (!rootItem) {
        ui.notifications?.error('Root artifact item not found in this folder.');
        return;
    }
    // Open artifact builder
    const builder = new ArtifactBuilder(rootItem);
    builder.render(true);
}
/**
 * Show artifact dialog for an actor
 */
async function showArtifactDialogForActor(actor) {
    // Find all root artifacts with actor assignments
    const rootArtifacts = game.items?.filter((item) => {
        if (item.type !== 'artifact')
            return false;
        const flags = item.getFlag('mastery-system', 'isRoot');
        return flags === true;
    }) || [];
    // Filter to artifacts assigned to this actor
    const assignedArtifacts = rootArtifacts.filter((item) => {
        const actorLevels = item.getFlag('mastery-system', 'actorLevels') || {};
        return actorLevels[actor.id] !== undefined;
    });
    // Build artifact list HTML
    let artifactListHtml = '<div class="artifact-list">';
    if (assignedArtifacts.length === 0) {
        artifactListHtml += '<p>No artifacts assigned to this actor.</p>';
    }
    else {
        for (const artifact of assignedArtifacts) {
            const actorLevels = artifact.getFlag('mastery-system', 'actorLevels') || {};
            const level = actorLevels[actor.id] || 1;
            // Find the item at this level
            const folderId = artifact.folder?.id;
            const levelItem = game.items?.find((item) => item.folder?.id === folderId &&
                item.type === 'artifact' &&
                item.system.level === level);
            artifactListHtml += `
        <div class="artifact-entry" data-artifact-id="${artifact.id}" data-level="${level}">
          <h4>${artifact.name.replace(' - Level 1-1', '')} (Level ${level})</h4>
          ${levelItem ? `
            <button type="button" class="give-artifact" data-item-id="${levelItem.id}">
              <i class="fas fa-gift"></i> Give to Actor
            </button>
          ` : '<p>Item not found for this level.</p>'}
        </div>
      `;
        }
    }
    artifactListHtml += '</div>';
    const dialog = new Dialog({
        title: `Artifacts: ${actor.name}`,
        content: artifactListHtml,
        buttons: {
            close: {
                icon: '<i class="fas fa-times"></i>',
                label: 'Close',
                callback: () => { }
            }
        },
        default: 'close',
        close: () => { }
    });
    dialog.render(true);
    // Handle give artifact button
    $(dialog.element).find('.give-artifact').on('click', async (e) => {
        const itemId = $(e.currentTarget).data('item-id');
        const item = game.items?.get(itemId);
        if (!item) {
            ui.notifications?.error('Item not found.');
            return;
        }
        // Check if actor already has this item
        const existingItem = actor.items.find((i) => i.name === item.name && i.type === 'artifact');
        if (existingItem) {
            ui.notifications?.warn('Actor already has this artifact.');
            return;
        }
        // Create embedded item
        const itemData = item.toObject();
        await actor.createEmbeddedDocuments('Item', [itemData]);
        ui.notifications?.info(`Gave ${item.name} to ${actor.name}`);
    });
}
//# sourceMappingURL=artifact-awakening.js.map