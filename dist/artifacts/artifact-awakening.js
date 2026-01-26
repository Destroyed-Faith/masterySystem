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
    // Debug: Expose debug function to global scope
    globalThis.debugArtifactButton = function () {
        console.log('=== Artifact Button Debug ===');
        console.log('1. GM Status:', game.user?.isGM);
        // Prüfe ob Hook registriert ist
        const hooks = Hooks._hooks?.renderItemDirectory || [];
        console.log('2. Registrierte renderItemDirectory Hooks:', hooks.length);
        const itemDirectory = Object.values(ui.windows).find((w) => w.constructor.name === 'ItemDirectory' ||
            w.id === 'items' ||
            w.title?.includes('Item'));
        if (!itemDirectory) {
            console.log('❌ Item Directory ist nicht geöffnet!');
            console.log('   Tipp: Öffne das Item Directory (Items-Menü) und führe dann den Hook manuell aus:');
            console.log('   Hooks.callAll("renderItemDirectory", ui.items, $(".window-app")');
            return;
        }
        console.log('3. Item Directory gefunden:', itemDirectory.constructor.name);
        const html = $(itemDirectory.element || itemDirectory._element);
        const button = html.find('.ms-new-artifact-btn');
        console.log('4. Button gefunden:', button.length > 0);
        if (button.length > 0) {
            console.log('   Button HTML:', button[0].outerHTML);
            console.log('   Button Parent:', button.parent().attr('class'));
        }
        const actionButtons = html.find('.header-actions.action-buttons.flexrow, .action-buttons.flexrow');
        console.log('5. Action Buttons Container:', actionButtons.length > 0);
        if (actionButtons.length > 0) {
            console.log('   Container Classes:', actionButtons.attr('class'));
            console.log('   Buttons im Container:', actionButtons.find('button').length);
            actionButtons.find('button').each((i, btn) => {
                console.log(`   Button ${i + 1}:`, btn.className, btn.getAttribute('data-action') || btn.textContent?.trim());
            });
        }
        const createItemBtn = html.find('button[data-action="createEntry"], button[data-action="createItem"]');
        const createFolderBtn = html.find('button[data-action="createFolder"]');
        console.log('6. Create Item Button:', createItemBtn.length > 0);
        console.log('7. Create Folder Button:', createFolderBtn.length > 0);
        const header = html.find('.directory-header');
        console.log('8. Directory Header:', header.length > 0);
        if (header.length > 0) {
            console.log('   Header HTML (erste 500 Zeichen):', header[0].outerHTML.substring(0, 500));
        }
        // Versuche Button manuell hinzuzufügen
        if (button.length === 0 && actionButtons.length > 0) {
            console.log('9. Versuche Button manuell hinzuzufügen...');
            const testBtn = $(`
        <button type="button" class="ms-new-artifact-btn" title="New Artifact" style="background: red; color: white; padding: 4px 8px;">
          <i class="fas fa-gem"></i> New Artifact (TEST)
        </button>
      `);
            testBtn.on('click', () => {
                console.log('Test Button wurde geklickt!');
                ui.notifications?.info('Test Button funktioniert!');
            });
            actionButtons.append(testBtn);
            console.log('   ✅ Test Button hinzugefügt!');
        }
        console.log('=== Debug Ende ===');
    };
    // Hook into Item Directory to add "New Artifact" button (GM only)
    Hooks.on('renderItemDirectory', (app, html, _data) => {
        // Ensure html is a jQuery object
        let htmlJQuery;
        if (html instanceof jQuery) {
            htmlJQuery = html;
        }
        else if (html instanceof HTMLElement) {
            htmlJQuery = $(html);
        }
        else {
            htmlJQuery = $(html);
        }
        // Get the correct HTML element from the app if html is empty
        let actualHtml = htmlJQuery;
        if (!htmlJQuery || htmlJQuery.length === 0) {
            if (app?.element) {
                actualHtml = $(app.element);
            }
            else if (app?._element) {
                actualHtml = $(app._element);
            }
            else {
                // Try to find the Item Directory window
                const itemDir = Object.values(ui.windows).find((w) => w.constructor.name === 'ItemDirectory' ||
                    w.id === 'items');
                if (itemDir) {
                    actualHtml = $(itemDir.element || itemDir._element);
                }
            }
        }
        // Ensure actualHtml is a jQuery object
        if (!(actualHtml instanceof jQuery)) {
            actualHtml = $(actualHtml);
        }
        console.log('Mastery System | renderItemDirectory Hook ausgelöst', {
            isGM: game.user?.isGM,
            htmlLength: htmlJQuery.length,
            actualHtmlLength: actualHtml.length,
            buttonExists: actualHtml.find('.ms-new-artifact-btn').length > 0,
            appName: app?.constructor?.name
        });
        if (!game.user?.isGM) {
            console.log('Mastery System | Hook abgebrochen: Nicht GM');
            return;
        }
        // Check if button already exists
        if (actualHtml.find('.ms-new-artifact-btn').length > 0) {
            console.log('Mastery System | Button existiert bereits');
            return;
        }
        const newArtifactBtn = $(`
      <button type="button" class="ms-new-artifact-btn" title="New Artifact">
        <i class="fas fa-gem"></i> New Artifact
      </button>
    `);
        newArtifactBtn.on('click', async () => {
            await createNewArtifact();
        });
        // Place button in the header-actions.action-buttons.flexrow container
        // This is where "Create Item" and "Create Folder" buttons are located
        const actionButtons = actualHtml.find('.directory-header .header-actions.action-buttons.flexrow, .directory-header .action-buttons.flexrow');
        console.log('Mastery System | Suche nach Action Buttons Container', {
            actionButtonsFound: actionButtons.length > 0,
            headerFound: actualHtml.find('.directory-header').length > 0,
            allHeaders: actualHtml.find('.directory-header').length,
            allActionButtons: actualHtml.find('.action-buttons').length
        });
        if (actionButtons.length > 0) {
            // Insert after Create Folder button (last button in the container)
            actionButtons.append(newArtifactBtn);
            console.log('Mastery System | Button zu Action Buttons Container hinzugefügt');
            return;
        }
        // Fallback: Try to find Create Folder button and insert after it
        const createFolderBtn = actualHtml.find('button[data-action="createFolder"], button.create-folder');
        if (createFolderBtn.length > 0) {
            createFolderBtn.after(newArtifactBtn);
            console.log('Mastery System | Button nach Create Folder Button hinzugefügt');
            return;
        }
        // Fallback: Try to find Create Item button and insert after it
        const createItemBtn = actualHtml.find('button[data-action="createEntry"], button[data-action="createItem"], button.create-entry');
        if (createItemBtn.length > 0) {
            createItemBtn.after(newArtifactBtn);
            console.log('Mastery System | Button nach Create Item Button hinzugefügt');
            return;
        }
        // Fallback: Try header-actions container
        const headerActions = actualHtml.find('.directory-header .header-actions');
        if (headerActions.length > 0) {
            headerActions.append(newArtifactBtn);
            console.log('Mastery System | Button zu Header Actions hinzugefügt');
            return;
        }
        // Last resort: try directory footer
        const footer = actualHtml.find('.directory-footer');
        if (footer.length > 0) {
            footer.append(newArtifactBtn);
            console.log('Mastery System | Button zu Footer hinzugefügt');
            return;
        }
        // Last last resort: try window-content
        const windowContent = actualHtml.find('.window-content');
        if (windowContent.length > 0) {
            const header = windowContent.find('.directory-header');
            if (header.length > 0) {
                header.prepend(newArtifactBtn);
                console.log('Mastery System | Button zu Window Content Header hinzugefügt');
                return;
            }
        }
        console.warn('Mastery System | Button konnte nicht platziert werden - kein Container gefunden', {
            actualHtmlLength: actualHtml.length,
            hasWindowContent: actualHtml.find('.window-content').length > 0,
            hasDirectoryHeader: actualHtml.find('.directory-header').length > 0,
            allButtons: actualHtml.find('button').length
        });
    });
    // Hook into Item Directory folder rows to add "Open Artifact Builder" button
    Hooks.on('renderItemDirectory', (app, html, _data) => {
        if (!game.user?.isGM)
            return;
        // Ensure html is a jQuery object
        let htmlJQuery;
        if (html instanceof jQuery) {
            htmlJQuery = html;
        }
        else if (html instanceof HTMLElement) {
            htmlJQuery = $(html);
        }
        else {
            htmlJQuery = $(html);
        }
        // Fallback to app.element if html is empty
        if (!htmlJQuery || htmlJQuery.length === 0) {
            if (app?.element) {
                htmlJQuery = $(app.element);
            }
            else if (app?._element) {
                htmlJQuery = $(app._element);
            }
        }
        // Debug info for folder button rendering
        console.log('Mastery System | renderItemDirectory (folder buttons)', {
            isGM: game.user?.isGM,
            htmlLength: (htmlJQuery && htmlJQuery.length) || 0,
            appName: app?.constructor?.name,
            hasAppElement: !!app?.element,
            hasAppInternalElement: !!app?._element
        });
        // Find all folder rows
        const folderRows = htmlJQuery.find('.directory-item.folder, .folder, [data-folder-id]');
        console.log('Mastery System | Folder rows found', {
            count: folderRows.length
        });
        folderRows.each((_index, folder) => {
            const $folder = $(folder);
            const folderId = $folder.attr('data-folder-id') || $folder.data('folderId');
            console.log('Mastery System | Folder row', {
                folderId,
                className: $folder.attr('class'),
                hasExistingButton: $folder.find('.ms-open-artifact-builder-btn').length > 0
            });
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
            if (folderItems.length === 0) {
                console.log('Mastery System | No root artifact in folder', { folderId });
                return;
            }
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
            // Add button to folder header (Foundry v13 uses folder-header/folder-name)
            const folderHeader = $folder.find('.folder-header, .folder-name, .directory-item');
            if (folderHeader.length > 0) {
                folderHeader.first().append(builderBtn);
                console.log('Mastery System | Builder button appended', { folderId });
            }
            else {
                // Fallback: append directly to folder row
                $folder.append(builderBtn);
                console.log('Mastery System | Builder button appended to row', { folderId });
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
    // Use DialogV2 for Foundry v13
    let content;
    try {
        content = await renderTemplate('systems/mastery-system/templates/artifacts/artifact-creation-dialog.hbs', {});
    }
    catch (error) {
        // Fallback if template doesn't exist
        content = `
      <form class="artifact-creation-form">
        <div class="form-group">
          <label>Artifact Name:</label>
          <input type="text" id="artifact-name" name="artifact-name" placeholder="Enter artifact name..." />
        </div>
      </form>
    `;
    }
    new Dialog({
        title: 'Create New Artifact',
        content: content,
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
                        // Get form values
                        const attack = parseInt(html.find('#artifact-attack').val(), 10) || 0;
                        const defense = parseInt(html.find('#artifact-defense').val(), 10) || 0;
                        const damage = html.find('#artifact-damage').val() || '';
                        const lore = html.find('#artifact-lore').val() || '';
                        const stones = parseInt(html.find('#artifact-stones').val(), 10) || 0;
                        const masteryRank = parseInt(html.find('#artifact-mastery-rank').val(), 10) || 1;
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
                                    attack: attack,
                                    damage: damage,
                                    defense: defense,
                                    specials: []
                                },
                                lore: lore,
                                requirements: {
                                    stones: stones,
                                    masteryRank: masteryRank
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
    }, {
        width: 400
    }).render(true);
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
    }, {
        width: 500
    });
    dialog.render(true);
    // Handle give artifact button - use setTimeout to ensure dialog is rendered
    setTimeout(() => {
        const dialogElement = dialog.element;
        if (dialogElement) {
            $(dialogElement).find('.give-artifact').on('click', async (e) => {
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
    }, 100);
}
//# sourceMappingURL=artifact-awakening.js.map