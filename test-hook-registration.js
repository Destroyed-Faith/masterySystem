/**
 * Test script to manually register the hook
 * Run this in the Foundry VTT console (F12)
 */

(() => {
  console.log('=== Testing Hook Registration ===');
  
  // Check if function exists
  console.log('1. Checking if initializeArtifactAwakening exists...');
  const initFunc = window.initializeArtifactAwakening || game.modules.get('mastery-system')?.api?.initializeArtifactAwakening;
  console.log('   Function found:', !!initFunc);
  
  // Try to manually register the hook
  console.log('2. Manually registering renderItemDirectory hook...');
  
  Hooks.on('renderItemDirectory', (app, html, _data) => {
    console.log('🔵 TEST | renderItemDirectory Hook TRIGGERED', {
      isGM: game.user?.isGM,
      hasApp: !!app,
      appName: app?.constructor?.name
    });
    
    if (!game.user?.isGM) {
      console.log('🔴 TEST | Hook abgebrochen: Nicht GM');
      return;
    }
    
    // Get the actual HTML
    let actualHtml = $('.sidebar-tab[data-tab="items"]');
    if (actualHtml.length === 0) {
      actualHtml = html instanceof jQuery ? html : $(html);
    }
    
    // Find all folder rows
    const folderRows = actualHtml.find('.directory-item.folder, .folder, [data-folder-id]');
    console.log('🔵 TEST | Folder rows found:', folderRows.length);
    
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
      
      console.log('🔵 TEST | Adding button to folder:', folderId);
      
      const builderBtn = $(`
        <button type="button" class="ms-open-artifact-builder-btn" title="Open Artifact Builder" data-folder-id="${folderId}" style="background: red; color: white; padding: 2px 4px; margin-left: 4px;">
          <i class="fas fa-gem"></i>
        </button>
      `);
      
      builderBtn.on('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        const folderId = $(e.currentTarget).data('folder-id');
        console.log('TEST Button clicked for folder:', folderId);
        ui.notifications?.info(`Button clicked for folder: ${folderId}`);
      });
      
      // Add button to folder header
      const folderHeader = $folder.find('.folder-header');
      if (folderHeader.length > 0) {
        const createEntryBtn = folderHeader.find('.create-entry, [data-action="createEntry"]').last();
        if (createEntryBtn.length > 0) {
          createEntryBtn.after(builderBtn);
          console.log('✅ TEST | Button added after create-entry');
        } else {
          folderHeader.append(builderBtn);
          console.log('✅ TEST | Button appended to folder-header');
        }
      } else {
        $folder.append(builderBtn);
        console.log('✅ TEST | Button appended to row (fallback)');
      }
    });
  });
  
  console.log('3. Hook registered. Checking hooks...');
  const hooks = Hooks._hooks?.renderItemDirectory || [];
  console.log('   Total renderItemDirectory hooks:', hooks.length);
  
  console.log('4. Triggering renderItemDirectory hook manually...');
  const itemDir = ui.items || Object.values(ui.windows || {}).find(w =>
    w?.constructor?.name === 'ItemDirectory' || 
    w?.id === 'items'
  );
  
  if (itemDir) {
    const html = $(itemDir.element || itemDir._element || '.sidebar-tab[data-tab="items"]');
    Hooks.callAll('renderItemDirectory', itemDir, html, {});
    console.log('   Hook triggered!');
  } else {
    console.log('   ⚠️ Item Directory not found');
  }
  
  console.log('=== Test Complete ===');
})();

