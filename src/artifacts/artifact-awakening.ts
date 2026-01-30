/**
 * Artifact Awakening System
 * Manages artifact evolution trees and actor assignments
 */

import { ArtifactBuilder } from './artifact-builder.js';

/**
 * Initialize artifact awakening hooks
 */
export function initializeArtifactAwakening(): void {
  console.log('Mastery System | Initializing Artifact Awakening system');
  
  // Register global event delegation for artifact builder buttons
  // This ensures buttons work even if added dynamically
  $(document).off('click.ms-artifact-builder').on('click.ms-artifact-builder', '.ms-open-artifact-builder-btn', async (e: JQuery.ClickEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const folderId = $(e.currentTarget).data('folder-id') || $(e.currentTarget).attr('data-folder-id');
    if (!folderId) {
      console.error('Mastery System | No folder ID found on button');
      return;
    }
    console.log('🔵 Mastery System | Artifact builder button clicked for folder:', folderId);
    await openArtifactBuilderForFolder(folderId);
  });
  
  // Debug: Expose debug function to global scope
  (globalThis as any).debugArtifactButton = function() {
    console.log('=== Artifact Button Debug ===');
    console.log('1. GM Status:', game.user?.isGM);
    
    // Prüfe ob Hook registriert ist
    const hooks = (Hooks as any)._hooks?.renderItemDirectory || [];
    console.log('2. Registrierte renderItemDirectory Hooks:', hooks.length);
    
    const itemDirectory = ui.items || Object.values(ui.windows).find((w: any) => 
      w.constructor.name === 'ItemDirectory' || 
      (w as any).id === 'items' ||
      (w as any).title?.includes('Item')
    );
    
    if (!itemDirectory) {
      console.log('❌ Item Directory ist nicht geöffnet!');
      console.log('   Tipp: Öffne das Item Directory (Items-Menü) und führe dann den Hook manuell aus:');
      console.log('   Hooks.callAll("renderItemDirectory", ui.items, $(".window-app")');
      return;
    }
    
    console.log('3. Item Directory gefunden:', itemDirectory.constructor.name);
    
    const html = $(itemDirectory.element || (itemDirectory as any)._element || $('.sidebar-tab[data-tab="items"]'));
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
      actionButtons.find('button').each((i: number, btn: HTMLElement) => {
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

  // Extract button addition logic into a reusable function
  function addButtonsToItemDirectory(actualHtml: JQuery, app?: any): void {
    if (!game.user?.isGM) {
      return;
    }

    // Ensure we have a valid HTML element
    if (actualHtml.length === 0) {
      // Try to find the items tab
      actualHtml = $('.sidebar-tab[data-tab="items"]');
      if (actualHtml.length === 0) {
        actualHtml = $('#items');
      }
      if (actualHtml.length === 0 && app?.element) {
        actualHtml = $(app.element);
      }
      if (actualHtml.length === 0 && (ui as any).items?.element) {
        actualHtml = $((ui as any).items.element);
      }
    }

    if (actualHtml.length === 0) {
      console.warn('Mastery System | Could not find Item Directory element');
      return;
    }

    console.log('🔵 Mastery System | addButtonsToItemDirectory called', {
      actualHtmlLength: actualHtml.length,
      hasApp: !!app,
      appName: app?.constructor?.name
    });

    console.log('🔵 Mastery System | Final HTML Element', {
      actualHtmlLength: actualHtml.length,
      hasDirectoryHeader: actualHtml.find('.directory-header').length > 0,
      hasActionButtons: actualHtml.find('.action-buttons').length > 0,
      hasHeaderActions: actualHtml.find('.header-actions').length > 0,
      hasHeaderActionsFlexrow: actualHtml.find('.header-actions.action-buttons.flexrow').length > 0,
      hasFolderRows: actualHtml.find('.directory-item.folder').length > 0,
      allButtons: actualHtml.find('button').length,
      createEntryButtons: actualHtml.find('button[data-action="createEntry"]').length,
      createFolderButtons: actualHtml.find('button[data-action="createFolder"]').length
    });
    
    // DEBUG: Log the actual structure
    const headerActions = actualHtml.find('.header-actions.action-buttons.flexrow');
    if (headerActions.length > 0) {
      console.log('✅ Mastery System | Found header-actions container:', {
        html: headerActions[0].outerHTML.substring(0, 400),
        buttons: headerActions.find('button').map((_i, el) => ({
          class: el.className,
          dataAction: el.getAttribute('data-action'),
          text: el.textContent?.trim()
        })).get()
      });
    } else {
      console.error('❌ Mastery System | header-actions.action-buttons.flexrow NOT FOUND!');
      console.log('Available containers:', {
        headerActions: actualHtml.find('.header-actions').length,
        actionButtons: actualHtml.find('.action-buttons').length,
        flexrow: actualHtml.find('.flexrow').length,
        directoryHeader: actualHtml.find('.directory-header').length > 0 ? actualHtml.find('.directory-header')[0].outerHTML.substring(0, 500) : 'NOT FOUND'
      });
    }

    // ===== PART 1: Add "New Artifact" button =====
    const existingBtn = actualHtml.find('.ms-new-artifact-btn');
    console.log('🔵 Mastery System | Checking for existing New Artifact Button', {
      exists: existingBtn.length > 0
    });

    if (existingBtn.length === 0) {
      console.log('🟢 Mastery System | Creating New Artifact Button');
      const newArtifactBtn = $(`
        <button type="button" class="ms-new-artifact-btn" title="New Artifact">
          <i class="fas fa-gem"></i> New Artifact
        </button>
      `);

      newArtifactBtn.on('click', async () => {
        console.log('🟢 Mastery System | New Artifact Button clicked');
        await createNewArtifact();
      });

      // Place button in the header-actions.action-buttons.flexrow container
      // Try multiple selectors to find the container
      let actionButtons = actualHtml.find('.header-actions.action-buttons.flexrow');
      if (actionButtons.length === 0) {
        actionButtons = actualHtml.find('.directory-header .header-actions.action-buttons.flexrow');
      }
      if (actionButtons.length === 0) {
        actionButtons = actualHtml.find('.header-actions.flexrow');
      }
      if (actionButtons.length === 0) {
        actionButtons = actualHtml.find('.action-buttons.flexrow');
      }
      
      console.log('🔵 Mastery System | Searching for button container', {
        actionButtonsFound: actionButtons.length > 0,
        selector: actionButtons.length > 0 ? 'FOUND' : 'NOT FOUND',
        actionButtonsHTML: actionButtons.length > 0 ? actionButtons[0].outerHTML.substring(0, 300) : 'NOT FOUND',
        existingButtons: actionButtons.length > 0 ? actionButtons.find('button').length : 0
      });
      
      if (actionButtons.length > 0) {
        actionButtons.append(newArtifactBtn);
        console.log('✅ Mastery System | New Artifact Button zu Action Buttons Container hinzugefügt');
        console.log('🔍 Mastery System | Button nach dem Hinzufügen:', {
          containerHTML: actionButtons[0].outerHTML.substring(0, 400),
          buttonExists: actionButtons.find('.ms-new-artifact-btn').length > 0
        });
      } else {
        // Fallback: Try to find Create Folder button and insert after it
        const createFolderBtn = actualHtml.find('button[data-action="createFolder"], button.create-folder');
        console.log('🔵 Mastery System | Searching for Create Folder button', {
          found: createFolderBtn.length > 0
        });
        if (createFolderBtn.length > 0) {
          createFolderBtn.after(newArtifactBtn);
          console.log('✅ Mastery System | New Artifact Button nach Create Folder Button hinzugefügt');
        } else {
          // Fallback: Try to find Create Item button and insert after it
          const createItemBtn = actualHtml.find('button[data-action="createEntry"], button[data-action="createItem"], button.create-entry');
          console.log('🔵 Mastery System | Searching for Create Item button', {
            found: createItemBtn.length > 0
          });
          if (createItemBtn.length > 0) {
            createItemBtn.after(newArtifactBtn);
            console.log('✅ Mastery System | New Artifact Button nach Create Item Button hinzugefügt');
          } else {
            // Fallback: Try header-actions container
            const headerActions = actualHtml.find('.directory-header .header-actions');
            console.log('🔵 Mastery System | Searching for header-actions', {
              found: headerActions.length > 0
            });
            if (headerActions.length > 0) {
              headerActions.append(newArtifactBtn);
              console.log('✅ Mastery System | New Artifact Button zu Header Actions hinzugefügt');
            } else {
              // Last resort: try directory footer
              const footer = actualHtml.find('.directory-footer');
              console.log('🔵 Mastery System | Searching for footer', {
                found: footer.length > 0
              });
              if (footer.length > 0) {
                footer.append(newArtifactBtn);
                console.log('✅ Mastery System | New Artifact Button zu Footer hinzugefügt');
              } else {
                console.error('❌ Mastery System | Could not find any container for New Artifact Button!');
                console.log('🔍 Mastery System | Available elements:', {
                  directoryHeader: actualHtml.find('.directory-header').length,
                  allButtons: actualHtml.find('button').length,
                  allActionButtons: actualHtml.find('.action-buttons').length
                });
              }
            }
          }
        }
      }
    } else {
      console.log('⚠️ Mastery System | New Artifact Button already exists, skipping');
    }
    
    // FALLBACK: Also set up a delayed check to ensure button is added even if hook timing is off
    setTimeout(() => {
      const itemsTab = $('.sidebar-tab[data-tab="items"]');
      if (itemsTab.length > 0) {
        const existingBtn = itemsTab.find('.ms-new-artifact-btn');
        if (existingBtn.length === 0) {
          console.log('🔧 Mastery System | FALLBACK: Button missing after delay, adding now...');
          const actionButtons = itemsTab.find('.header-actions.action-buttons.flexrow');
          if (actionButtons.length > 0) {
            const newArtifactBtn = $(`
              <button type="button" class="ms-new-artifact-btn" title="New Artifact">
                <i class="fas fa-gem"></i> New Artifact
              </button>
            `);
            newArtifactBtn.on('click', async () => {
              console.log('🟢 Mastery System | New Artifact Button clicked (fallback)');
              await createNewArtifact();
            });
            actionButtons.append(newArtifactBtn);
            console.log('✅ Mastery System | FALLBACK: Button added successfully');
          } else {
            console.error('❌ Mastery System | FALLBACK: Could not find action buttons container');
          }
        }
      }
    }, 500);

    // ===== PART 2: Add diamond symbols to artifact folders =====

    // Find all folder rows (exclude buttons which also have data-folder-id)
    const folderRows = actualHtml
      .find('.directory-item.folder, .folder, [data-folder-id]')
      .filter((_index, el) => {
        const $el = $(el);
        if ($el.is('button') || $el.hasClass('ms-open-artifact-builder-btn')) return false;
        return !!($el.attr('data-folder-id') || $el.data('folderId'));
      });
    console.log('🔵 Mastery System | Folder rows found', {
      count: folderRows.length,
      totalItems: (game as any).items?.size || (game as any).items?.length || 0,
      folderIds: folderRows.map((_i, el) => $(el).attr('data-folder-id')).get()
    });
    folderRows.each((_index: number, folder: HTMLElement) => {
      const $folder = $(folder);
      const folderId = $folder.attr('data-folder-id') || $folder.data('folderId');
      console.log('Mastery System | Folder row', {
        folderId,
        className: $folder.attr('class'),
        hasExistingButton: $folder.find('.ms-open-artifact-builder-btn').length > 0
      });
      if (!folderId) return;

      // Check if button already exists (keep only one)
      const existingButtons = $folder.find('.ms-open-artifact-builder-btn');
      if (existingButtons.length > 1) {
        existingButtons.slice(1).remove();
      }
      if (existingButtons.length > 0) return;

      // Check if this folder contains artifact root items
      const folderData = app?.folders?.get(folderId) || (game as any).folders?.get(folderId);
      if (!folderData) {
        console.warn('Mastery System | Folder data not found for row', { folderId });
      }

      const allFolderItems = (game as any).items?.filter((item: any) => item.folder?.id === folderId) || [];
      console.log('Mastery System | Folder items snapshot', {
        folderId,
        itemCount: allFolderItems.length,
        items: allFolderItems.slice(0, 5).map((item: any) => ({
          id: item.id,
          name: item.name,
          type: item.type,
          isRootFlag: (item as any).getFlag?.('mastery-system', 'isRoot') === true
        }))
      });

      // Check if folder has a root artifact (Level 1-1 or isRoot flag)
      const folderItems = allFolderItems.filter((item: any) => {
        if (item.folder?.id !== folderId) return false;
        const isRootFlag = (item as any).getFlag?.('mastery-system', 'isRoot') === true;
        const isRootName = typeof item.name === 'string' && item.name.includes('Level 1-1');
        return isRootFlag || isRootName;
      });

      console.log('Mastery System | Folder root items', {
        folderId,
        rootCount: folderItems.length,
        rootNames: folderItems.map((item: any) => item.name)
      });

      if (folderItems.length === 0) {
        console.log('Mastery System | No root artifact in folder', {
          folderId,
          folderName: folderData?.name,
          allFolderItemNames: allFolderItems.map((item: any) => item.name)
        });
        return;
      }

      const builderBtn = $(`
        <button type="button" class="ms-open-artifact-builder-btn" title="Open Artifact Builder" data-folder-id="${folderId}">
          <i class="fas fa-gem"></i>
        </button>
      `);

      // Note: Click handler is registered via event delegation in initializeArtifactAwakening()
      // This ensures buttons work even if added dynamically or after DOM changes

      // Add button to folder header (Foundry v13 uses folder-header/folder-name)
      const folderHeader = $folder.find('.folder-header');
      console.log('🔵 Mastery System | Adding diamond button to folder', {
        folderId,
        hasFolderHeader: folderHeader.length > 0,
        folderHeaderHTML: folderHeader.length > 0 ? folderHeader[0].outerHTML.substring(0, 300) : 'NOT FOUND'
      });
      
      if (folderHeader.length > 0) {
        const createEntryBtn = folderHeader.find('.create-entry, [data-action="createEntry"]').last();
        if (createEntryBtn.length > 0) {
          createEntryBtn.after(builderBtn);
          console.log('✅ Mastery System | Builder button appended after create-entry', { folderId });
        } else {
          folderHeader.append(builderBtn);
          console.log('✅ Mastery System | Builder button appended to folder-header', { folderId });
        }
      } else {
        // Fallback: append directly to folder row
        $folder.append(builderBtn);
        console.log('✅ Mastery System | Builder button appended to row (fallback)', { folderId });
      }
    });
    
    // FALLBACK: Also check folder buttons after a delay
    setTimeout(() => {
      const itemsTab = $('.sidebar-tab[data-tab="items"]');
      const folderRows = itemsTab.find('.directory-item.folder');
      folderRows.each((_index: number, folder: HTMLElement) => {
        const $folder = $(folder);
        const folderId = $folder.attr('data-folder-id');
        if (!folderId || $folder.find('.ms-open-artifact-builder-btn').length > 0) return;
        
        const allFolderItems = (game as any).items?.filter((item: any) => item.folder?.id === folderId) || [];
        const folderItems = allFolderItems.filter((item: any) => {
          if (item.folder?.id !== folderId) return false;
          const isRootFlag = (item as any).getFlag?.('mastery-system', 'isRoot') === true;
          const isRootName = typeof item.name === 'string' && item.name.includes('Level 1-1');
          return isRootFlag || isRootName;
        });
        
        if (folderItems.length > 0) {
          const builderBtn = $(`
            <button type="button" class="ms-open-artifact-builder-btn" title="Open Artifact Builder" data-folder-id="${folderId}">
              <i class="fas fa-gem"></i>
            </button>
          `);
          builderBtn.on('click', async (e: JQuery.ClickEvent) => {
            e.preventDefault();
            e.stopPropagation();
            const folderId = $(e.currentTarget).data('folder-id');
            await openArtifactBuilderForFolder(folderId);
          });
          
          const folderHeader = $folder.find('.folder-header');
          if (folderHeader.length > 0) {
            const createEntryBtn = folderHeader.find('.create-entry, [data-action="createEntry"]').last();
            if (createEntryBtn.length > 0) {
              createEntryBtn.after(builderBtn);
              console.log('✅ Mastery System | FALLBACK: Builder button added to folder', { folderId });
            } else {
              folderHeader.append(builderBtn);
              console.log('✅ Mastery System | FALLBACK: Builder button appended to folder-header', { folderId });
            }
          }
        }
      });
    }, 500);
  }

  // Hook into Item Directory to add "New Artifact" button and folder diamond symbols (GM only)
  // Register hook with explicit error handling
  try {
    console.log('Mastery System | Registering renderItemDirectory hook...');
    const hookId = Hooks.on('renderItemDirectory', (app: any, html: JQuery | HTMLElement, _data: any) => {
      if (!game.user?.isGM) {
        return;
      }

      // Get the actual HTML element
      let actualHtml: JQuery = $('.sidebar-tab[data-tab="items"]');
      if (actualHtml.length === 0) {
        actualHtml = html instanceof jQuery ? (html as JQuery) : $(html);
      }
      if (actualHtml.length === 0 && app?.element) {
        actualHtml = $(app.element);
      }

      // Call the reusable function
      addButtonsToItemDirectory(actualHtml, app);
    });
  
    console.log('✅ Mastery System | renderItemDirectory hook registered with ID:', hookId);
  } catch (error) {
    console.error('❌ Mastery System | Error registering renderItemDirectory hook:', error);
    console.error('Error details:', error);
  }
  
  // Additional hook: Listen for when items tab becomes active
  Hooks.on('renderSidebarTab', (_app: any, html: JQuery | HTMLElement, _data: any) => {
    if (!game.user?.isGM) return;
    
    const tab = html instanceof jQuery ? (html as JQuery) : $(html);
    const tabName = tab.attr('data-tab');
    
    if (tabName === 'items') {
      console.log('🔵 Mastery System | Items tab rendered/activated, adding buttons...');
      
      // Trigger the button addition logic after a short delay
      setTimeout(() => {
        const itemsTab = $('.sidebar-tab[data-tab="items"]');
        if (itemsTab.length > 0) {
          addButtonsToItemDirectory(itemsTab);
        }
      }, 100);
    }
  });

  // Hook into ready to ensure buttons are added if Item Directory is already open
  Hooks.once('ready', () => {
    if (!game.user?.isGM) return;
    
    console.log('🔵 Mastery System | Ready hook: Checking for Item Directory...');
    
    // Wait a bit for UI to fully initialize
    setTimeout(() => {
      const itemsTab = $('.sidebar-tab[data-tab="items"]');
      if (itemsTab.length > 0) {
        console.log('✅ Mastery System | Item Directory found in ready hook, adding buttons...');
        addButtonsToItemDirectory(itemsTab);
      }
    }, 1000);
  });

  // Use MutationObserver to watch for DOM changes and add buttons when folders are added
  if (typeof MutationObserver !== 'undefined') {
    const observer = new MutationObserver((mutations) => {
      if (!game.user?.isGM) return;
      
      let shouldCheck = false;
      for (const mutation of mutations) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          // Check if any added nodes are folder elements
          for (const node of Array.from(mutation.addedNodes)) {
            if (node instanceof HTMLElement) {
              const $node = $(node);
              if ($node.hasClass('folder') || $node.hasClass('directory-item') || $node.find('.folder').length > 0) {
                shouldCheck = true;
                break;
              }
            }
          }
          if (shouldCheck) break;
        }
      }
      
      if (shouldCheck) {
        setTimeout(() => {
          const itemsTab = $('.sidebar-tab[data-tab="items"]');
          if (itemsTab.length > 0) {
            console.log('🔵 Mastery System | DOM changed, checking for missing buttons...');
            addButtonsToItemDirectory(itemsTab);
          }
        }, 200);
      }
    });

    // Start observing when Item Directory is available
    const startObserving = () => {
      const itemsTab = $('.sidebar-tab[data-tab="items"]');
      if (itemsTab.length > 0) {
        observer.observe(itemsTab[0], {
          childList: true,
          subtree: true
        });
        console.log('✅ Mastery System | MutationObserver started for Item Directory');
      } else {
        // Retry after a delay
        setTimeout(startObserving, 500);
      }
    };

    // Start observing after a delay to ensure DOM is ready
    setTimeout(startObserving, 1000);
  }

  // Hook into Actor Sheet to add "Artifact" button
  Hooks.on('renderActorSheet', (sheet: any, html: JQuery, _data: any) => {
    if (!game.user?.isGM) return;
    if (sheet.actor.type !== 'character') return;

    // Check if button already exists
    if (html.find('.ms-artifact-button').length > 0) return;

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
async function createNewArtifact(): Promise<void> {
  // Use DialogV2 for Foundry v13
  let content: string;
  try {
    content = await renderTemplate('systems/mastery-system/templates/artifacts/artifact-creation-dialog.hbs', {});
  } catch (error) {
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
        callback: async (html: JQuery) => {
          const name = html.find('#artifact-name').val() as string;
          if (!name || name.trim() === '') {
            ui.notifications?.warn('Please enter an artifact name.');
            return false;
          }

          try {
            // Get form values
            const attack = parseInt(html.find('#artifact-attack').val() as string, 10) || 0;
            const defense = parseInt(html.find('#artifact-defense').val() as string, 10) || 0;
            const damage = (html.find('#artifact-damage').val() as string) || '';
            const lore = (html.find('#artifact-lore').val() as string) || '';
            const stones = parseInt(html.find('#artifact-stones').val() as string, 10) || 0;
            const masteryRank = parseInt(html.find('#artifact-mastery-rank').val() as string, 10) || 1;

            // Create folder
            const folder = await (Folder as any).create({
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
                  nodeId: (foundry.utils as any).randomID(),
                  parentIds: [],
                  childIds: [],
                  isRoot: true
                }
              }
            };

            await (Item as any).create(rootItemData);
            ui.notifications?.info(`Created artifact: ${name.trim()}`);
            return true;
          } catch (error) {
            console.error('Mastery System | Error creating artifact', error);
            ui.notifications?.error('Failed to create artifact.');
            return false;
          }
        }
      },
      cancel: {
        icon: '<i class="fas fa-times"></i>',
        label: 'Cancel',
        callback: () => {}
      }
    },
    default: 'create',
    close: () => {}
  }, {
    width: 400
  }).render(true);
}

/**
 * Open artifact builder for a folder
 */
export async function openArtifactBuilderForFolder(folderId: string): Promise<void> {
  const folder = (game as any).folders?.get(folderId);
  if (!folder) {
    ui.notifications?.error('Folder not found.');
    return;
  }

  // Find root artifact item (Level 1-1) - allow non-artifact type if name matches
  const rootItem = (game as any).items?.find((item: any) => 
    item.folder?.id === folderId && 
    (item.name?.includes('Level 1-1') || (item as any).getFlag?.('mastery-system', 'isRoot') === true)
  );

  if (!rootItem) {
    ui.notifications?.error('Root artifact item not found in this folder.');
    return;
  }

  // Open artifact builder
  const builder = new ArtifactBuilder(rootItem);
  (builder as any).render(true);
}

/**
 * Show artifact dialog for an actor
 */
async function showArtifactDialogForActor(actor: Actor): Promise<void> {
  // Find all root artifacts with actor assignments
  const rootArtifacts = (game as any).items?.filter((item: any) => {
    if (item.type !== 'artifact') return false;
    const flags = item.getFlag('mastery-system', 'isRoot');
    return flags === true;
  }) || [];

  // Filter to artifacts assigned to this actor
  const assignedArtifacts = rootArtifacts.filter((item: any) => {
    const actorLevels = item.getFlag('mastery-system', 'actorLevels') || {};
    return actorLevels[(actor as any).id] !== undefined;
  });

  // Build artifact list HTML
  let artifactListHtml = '<div class="artifact-list">';
  if (assignedArtifacts.length === 0) {
    artifactListHtml += '<p>No artifacts assigned to this actor.</p>';
  } else {
    for (const artifact of assignedArtifacts) {
      const actorLevels = artifact.getFlag('mastery-system', 'actorLevels') || {};
      const level = actorLevels[(actor as any).id] || 1;
      
      // Find the item at this level
      const folderId = artifact.folder?.id;
      const levelItem = (game as any).items?.find((item: any) => 
        item.folder?.id === folderId && 
        item.type === 'artifact' &&
        (item.system as any).level === level
      );

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
    title: `Artifacts: ${(actor as any).name}`,
    content: artifactListHtml,
    buttons: {
      close: {
        icon: '<i class="fas fa-times"></i>',
        label: 'Close',
        callback: () => {}
      }
    },
    default: 'close',
    close: () => {}
  }, {
    width: 500
  });

  dialog.render(true);

  // Handle give artifact button - use setTimeout to ensure dialog is rendered
  setTimeout(() => {
    const dialogElement = dialog.element;
    if (dialogElement) {
      $(dialogElement).find('.give-artifact').on('click', async (e: JQuery.ClickEvent) => {
    const itemId = $(e.currentTarget).data('item-id');
    const item = (game as any).items?.get(itemId);
    if (!item) {
      ui.notifications?.error('Item not found.');
      return;
    }

    // Check if actor already has this item
    const existingItem = (actor as any).items.find((i: any) => i.name === (item as any).name && i.type === 'artifact');
    if (existingItem) {
      ui.notifications?.warn('Actor already has this artifact.');
      return;
    }

    // Create embedded item
    const itemData = (item as any).toObject();
    await (actor as any).createEmbeddedDocuments('Item', [itemData]);
    ui.notifications?.info(`Gave ${(item as any).name} to ${(actor as any).name}`);
      });
    }
  }, 100);
}

