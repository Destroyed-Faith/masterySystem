/**
 * Script to manually register and test the artifact builder hook
 * Run this in the Foundry VTT console (F12)
 */

(() => {
  console.log('=== Fix Artifact Builder Hook ===');
  
  // 1. Check if initializeArtifactAwakening was called
  console.log('1. Checking if initializeArtifactAwakening was called...');
  const hooks = Hooks._hooks?.renderItemDirectory || [];
  console.log('   Current renderItemDirectory hooks:', hooks.length);
  
  // 2. Try to manually call initializeArtifactAwakening
  console.log('2. Attempting to manually initialize...');
  try {
    // Try to import and call the function
    import('/systems/mastery-system/dist/artifacts/artifact-awakening.js').then((module) => {
      if (module.initializeArtifactAwakening) {
        console.log('   ✅ Module found, calling initializeArtifactAwakening...');
        module.initializeArtifactAwakening();
        
        // Check again after a moment
        setTimeout(() => {
          const hooksAfter = Hooks._hooks?.renderItemDirectory || [];
          console.log('   Hooks after initialization:', hooksAfter.length);
          if (hooksAfter.length > hooks.length) {
            console.log('   ✅ Hook registered successfully!');
          } else {
            console.log('   ⚠️ Hook still not registered, trying manual registration...');
            registerHookManually();
          }
        }, 500);
      } else {
        console.log('   ⚠️ initializeArtifactAwakening not found in module');
        registerHookManually();
      }
    }).catch((error) => {
      console.log('   ⚠️ Could not import module:', error);
      registerHookManually();
    });
  } catch (error) {
    console.log('   ⚠️ Error:', error);
    registerHookManually();
  }
  
  // Manual hook registration function
  function registerHookManually() {
    console.log('3. Manually registering renderItemDirectory hook...');
    
    Hooks.on('renderItemDirectory', (app, html, _data) => {
      console.log('🔵 MANUAL | renderItemDirectory Hook TRIGGERED', {
        isGM: game.user?.isGM,
        hasApp: !!app,
        appName: app?.constructor?.name
      });
      
      if (!game.user?.isGM) {
        console.log('🔴 MANUAL | Hook abgebrochen: Nicht GM');
        return;
      }
      
      // Get the actual HTML
      let actualHtml = $('.sidebar-tab[data-tab="items"]');
      if (actualHtml.length === 0) {
        actualHtml = html instanceof jQuery ? html : $(html);
      }
      
      // Find all folder rows
      const folderRows = actualHtml.find('.directory-item.folder, .folder, [data-folder-id]');
      console.log('🔵 MANUAL | Folder rows found:', folderRows.length);
      
      folderRows.each((_index, folder) => {
        const $folder = $(folder);
        const folderId = $folder.attr('data-folder-id') || $folder.data('folderId');
        if (!folderId) return;
        
        // Check if button already exists
        if ($folder.find('.ms-open-artifact-builder-btn').length > 0) return;
        
        // Check if folder has root artifacts
        const allFolderItems = Array.from(game.items || []).filter((item) => item.folder?.id === folderId);
        const folderItems = allFolderItems.filter((item) => {
          const isRootFlag = item.getFlag?.('mastery-system', 'isRoot') === true;
          const isRootName = typeof item.name === 'string' && item.name.includes('Level 1-1');
          return isRootFlag || isRootName;
        });
        
        if (folderItems.length === 0) return;
        
        console.log('🔵 MANUAL | Adding button to folder:', folderId);
        
        const builderBtn = $(`
          <button type="button" class="ms-open-artifact-builder-btn" title="Open Artifact Builder" data-folder-id="${folderId}" style="margin-left: 4px;">
            <i class="fas fa-gem"></i>
          </button>
        `);
        
        builderBtn.on('click', async (e) => {
          e.preventDefault();
          e.stopPropagation();
          const folderId = $(e.currentTarget).data('folder-id');
          console.log('MANUAL Button clicked for folder:', folderId);
          
          // Import and call openArtifactBuilderForFolder
          try {
            const module = await import('/systems/mastery-system/dist/artifacts/artifact-awakening.js');
            if (module.openArtifactBuilderForFolder) {
              await module.openArtifactBuilderForFolder(folderId);
            } else {
              ui.notifications?.error('openArtifactBuilderForFolder function not found');
            }
          } catch (error) {
            console.error('Error opening artifact builder:', error);
            ui.notifications?.error('Failed to open artifact builder');
          }
        });
        
        // Add button to folder header
        const folderHeader = $folder.find('.folder-header');
        if (folderHeader.length > 0) {
          const createEntryBtn = folderHeader.find('.create-entry, [data-action="createEntry"]').last();
          if (createEntryBtn.length > 0) {
            createEntryBtn.after(builderBtn);
            console.log('✅ MANUAL | Button added after create-entry');
          } else {
            folderHeader.append(builderBtn);
            console.log('✅ MANUAL | Button appended to folder-header');
          }
        } else {
          $folder.append(builderBtn);
          console.log('✅ MANUAL | Button appended to row (fallback)');
        }
      });
    });
    
    console.log('✅ MANUAL | Hook registered!');
    
    // Trigger the hook manually
    console.log('4. Triggering hook manually...');
    const itemDir = ui.items || Object.values(ui.windows || {}).find(w =>
      w?.constructor?.name === 'ItemDirectory' || 
      w?.id === 'items'
    );
    
    if (itemDir) {
      const html = $(itemDir.element || itemDir._element || '.sidebar-tab[data-tab="items"]');
      Hooks.callAll('renderItemDirectory', itemDir, html, {});
      console.log('✅ MANUAL | Hook triggered!');
    } else {
      console.log('   ⚠️ Item Directory not found');
    }
  }
  
  console.log('=== Fix Complete ===');
  console.log('Check the console for "MANUAL" logs to see if buttons were added.');
})();

