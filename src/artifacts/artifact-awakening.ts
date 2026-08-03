/**
 * Artifact Awakening System
 * Manages artifact evolution trees and actor assignments
 */

import { ArtifactBuilder } from './artifact-builder.js';

/**
 * Initialize artifact awakening hooks
 */
export function initializeArtifactAwakening(): void {
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
    await openArtifactBuilderForFolder(folderId);
  });
  
  // Debug: Expose debug function to global scope
  (globalThis as any).debugArtifactButton = function() {
    // Prüfe ob Hook registriert ist
    const hooks = (Hooks as any)._hooks?.renderItemDirectory || [];
    const itemDirectory = ui.items || Object.values(ui.windows).find((w: any) => 
      w.constructor.name === 'ItemDirectory' || 
      (w as any).id === 'items' ||
      (w as any).title?.includes('Item')
    );
    
    if (!itemDirectory) {
      return;
    }
    const html = $(itemDirectory.element || (itemDirectory as any)._element || $('.sidebar-tab[data-tab="items"]'));
    const button = html.find('.ms-new-artifact-btn');
    const actionButtons = html.find('.header-actions.action-buttons.flexrow, .action-buttons.flexrow');
    if (actionButtons.length > 0) {
      actionButtons.find('button').each((i: number, btn: HTMLElement) => {
      });
    }
    
    const createItemBtn = html.find('button[data-action="createEntry"], button[data-action="createItem"]');
    const createFolderBtn = html.find('button[data-action="createFolder"]');
    const header = html.find('.directory-header');
    // Versuche Button manuell hinzuzufügen
    if (button.length === 0 && actionButtons.length > 0) {
      const testBtn = $(`
        <button type="button" class="ms-new-artifact-btn" title="New Artifact" style="background: red; color: white; padding: 4px 8px;">
          <i class="fas fa-gem"></i> New Artifact (TEST)
        </button>
      `);
      testBtn.on('click', () => {
        ui.notifications?.info('Test Button funktioniert!');
      });
      actionButtons.append(testBtn);
    }
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
    // DEBUG: Log the actual structure
    const headerActions = actualHtml.find('.header-actions.action-buttons.flexrow');
    if (headerActions.length > 0) {
    } else {
      console.error('❌ Mastery System | header-actions.action-buttons.flexrow NOT FOUND!');
    }

    // ===== PART 1: Add "New Artifact" button =====
    const existingBtn = actualHtml.find('.ms-new-artifact-btn');
    if (existingBtn.length === 0) {
      const newArtifactBtn = $(`
        <button type="button" class="ms-new-artifact-btn" title="New Artifact">
          <i class="fas fa-gem"></i> New Artifact
        </button>
      `);

      newArtifactBtn.on('click', async () => {
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
      if (actionButtons.length > 0) {
        actionButtons.append(newArtifactBtn);
      } else {
        // Fallback: Try to find Create Folder button and insert after it
        const createFolderBtn = actualHtml.find('button[data-action="createFolder"], button.create-folder');
        if (createFolderBtn.length > 0) {
          createFolderBtn.after(newArtifactBtn);
        } else {
          // Fallback: Try to find Create Item button and insert after it
          const createItemBtn = actualHtml.find('button[data-action="createEntry"], button[data-action="createItem"], button.create-entry');
          if (createItemBtn.length > 0) {
            createItemBtn.after(newArtifactBtn);
          } else {
            // Fallback: Try header-actions container
            const headerActions = actualHtml.find('.directory-header .header-actions');
            if (headerActions.length > 0) {
              headerActions.append(newArtifactBtn);
            } else {
              // Last resort: try directory footer
              const footer = actualHtml.find('.directory-footer');
              if (footer.length > 0) {
                footer.append(newArtifactBtn);
              } else {
                console.error('❌ Mastery System | Could not find any container for New Artifact Button!');
              }
            }
          }
        }
      }
    } else {
    }
    
    // FALLBACK: Also set up a delayed check to ensure button is added even if hook timing is off
    setTimeout(() => {
      const itemsTab = $('.sidebar-tab[data-tab="items"]');
      if (itemsTab.length > 0) {
        const existingBtn = itemsTab.find('.ms-new-artifact-btn');
        if (existingBtn.length === 0) {
          const actionButtons = itemsTab.find('.header-actions.action-buttons.flexrow');
          if (actionButtons.length > 0) {
            const newArtifactBtn = $(`
              <button type="button" class="ms-new-artifact-btn" title="New Artifact">
                <i class="fas fa-gem"></i> New Artifact
              </button>
            `);
            newArtifactBtn.on('click', async () => {
              await createNewArtifact();
            });
            actionButtons.append(newArtifactBtn);
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
    folderRows.each((_index: number, folder: HTMLElement) => {
      const $folder = $(folder);
      const folderId = $folder.attr('data-folder-id') || $folder.data('folderId');
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
      // Check if folder has a root artifact (Level 1-1 or isRoot flag)
      const folderItems = allFolderItems.filter((item: any) => {
        if (item.folder?.id !== folderId) return false;
        const isRootFlag = (item as any).getFlag?.('mastery-system', 'isRoot') === true;
        const isRootName = typeof item.name === 'string' && item.name.includes('Level 1-1');
        return isRootFlag || isRootName;
      });
      if (folderItems.length === 0) {
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
      if (folderHeader.length > 0) {
        const createEntryBtn = folderHeader.find('.create-entry, [data-action="createEntry"]').last();
        if (createEntryBtn.length > 0) {
          createEntryBtn.after(builderBtn);
        } else {
          folderHeader.append(builderBtn);
        }
      } else {
        // Fallback: append directly to folder row
        $folder.append(builderBtn);
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
            } else {
              folderHeader.append(builderBtn);
            }
          }
        }
      });
    }, 500);
  }

  // Hook into Item Directory to add "New Artifact" button and folder diamond symbols (GM only)
  // Register hook with explicit error handling
  try {
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
    // Wait a bit for UI to fully initialize
    setTimeout(() => {
      const itemsTab = $('.sidebar-tab[data-tab="items"]');
      if (itemsTab.length > 0) {
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
      } else {
        // Retry after a delay
        setTimeout(startObserving, 500);
      }
    };

    // Start observing after a delay to ensure DOM is ready
    setTimeout(startObserving, 1000);
  }
}

/**
 * Find the next free placeholder artifact name (Placeholder-1, Placeholder-2, …).
 * A name is considered taken if either an Item folder of that name exists or a
 * root artifact item (`<name> - Level 1-1`) already exists.
 */
function findFreePlaceholderArtifactName(): string {
  const folders: any[] = (game as any).folders?.contents || [];
  const items: any[] = (game as any).items?.contents || [];
  const isTaken = (name: string): boolean => {
    const folderTaken = folders.some((f) => f?.type === 'Item' && f?.name === name);
    const itemTaken = items.some(
      (it) => typeof it?.name === 'string' && it.name === `${name} - Level 1-1`
    );
    return folderTaken || itemTaken;
  };
  let n = 1;
  while (isTaken(`Placeholder-${n}`)) n++;
  return `Placeholder-${n}`;
}

/**
 * Create a new artifact (folder + root item) and open the Artifact Builder
 * immediately. No intermediate dialog: the artifact is created under an
 * auto-incremented placeholder name so the folder can be laid out right away,
 * and the GM edits everything in the builder / node editor.
 */
async function createNewArtifact(): Promise<void> {
  if (!game.user?.isGM) {
    ui.notifications?.warn('Only the GM can create artifacts.');
    return;
  }
  try {
    const baseName = findFreePlaceholderArtifactName();

    const folder = await (Folder as any).create({
      name: baseName,
      type: 'Item',
      folder: null
    });

    const rootItemData = {
      name: `${baseName} - Level 1-1`,
      type: 'artifact',
      folder: folder.id,
      system: {
        level: 1,
        equipped: false,
        effects: [],
        bonuses: { attack: 0, damage: '', defense: 0, specials: [] },
        lore: '',
        requirements: { stones: 0, masteryRank: 1 },
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

    const rootItem = await (Item as any).create(rootItemData);
    if (!rootItem) {
      ui.notifications?.error('Failed to create artifact.');
      return;
    }

    ui.notifications?.info(`Created artifact: ${baseName}`);

    const builder = new ArtifactBuilder(rootItem);
    (builder as any).render(true);
  } catch (error) {
    console.error('Mastery System | Error creating artifact', error);
    ui.notifications?.error('Failed to create artifact.');
  }
}

/**
 * Open artifact builder for a folder
 */
export async function openArtifactBuilderForFolder(folderId: string): Promise<void> {
  if (!game.user?.isGM) {
    ui.notifications?.warn('Only the GM can open the Artifact Builder.');
    return;
  }
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
