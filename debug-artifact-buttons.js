/**
 * Debug script to check why Artifact Builder buttons are not appearing
 * Run this in the Foundry VTT console (F12)
 */

(() => {
  console.log('=== Artifact Builder Buttons Debug ===');
  
  // 1. Check if user is GM
  console.log('1. GM Status:', game.user?.isGM);
  if (!game.user?.isGM) {
    console.log('   ⚠️ Not GM - buttons only show for GMs');
    return;
  }
  
  // 2. Check if renderItemDirectory hook is registered
  const hooks = Hooks._hooks?.renderItemDirectory || [];
  console.log('2. Registrierte renderItemDirectory Hooks:', hooks.length);
  hooks.forEach((hook, idx) => {
    console.log(`   Hook ${idx + 1}:`, {
      name: hook.name || 'anonymous',
      id: hook.id,
      fn: hook.fn?.toString().substring(0, 100) + '...'
    });
  });
  
  // 3. Check Item Directory
  const itemDir = ui.items || Object.values(ui.windows || {}).find(w =>
    w?.constructor?.name === 'ItemDirectory' || 
    w?.id === 'items'
  );
  console.log('3. Item Directory:', {
    found: !!itemDir,
    name: itemDir?.constructor?.name,
    rendered: itemDir?.rendered
  });
  
  // 4. Check folders in game
  const allFolders = Array.from(game.folders || []);
  const itemFolders = allFolders.filter((f) => f.type === 'Item');
  console.log('4. Item Folders in game:', itemFolders.length);
  
  // 5. Check items in folders
  const allItems = Array.from(game.items || []);
  console.log('5. Total Items:', allItems.length);
  
  // 6. Check for root artifacts
  const rootArtifacts = allItems.filter((item) => {
    const isRootFlag = item.getFlag?.('mastery-system', 'isRoot') === true;
    const isRootName = typeof item.name === 'string' && item.name.includes('Level 1-1');
    return isRootFlag || isRootName;
  });
  console.log('6. Root Artifacts found:', rootArtifacts.length);
  rootArtifacts.slice(0, 5).forEach((item, idx) => {
    console.log(`   Root ${idx + 1}:`, {
      name: item.name,
      folderId: item.folder?.id,
      folderName: game.folders?.get(item.folder?.id)?.name,
      isRootFlag: item.getFlag?.('mastery-system', 'isRoot'),
      hasLevel1_1: item.name?.includes('Level 1-1')
    });
  });
  
  // 7. Check folders with root artifacts
  const foldersWithRoots = new Map();
  rootArtifacts.forEach((item) => {
    const folderId = item.folder?.id;
    if (folderId) {
      if (!foldersWithRoots.has(folderId)) {
        foldersWithRoots.set(folderId, []);
      }
      foldersWithRoots.get(folderId).push(item);
    }
  });
  console.log('7. Folders with root artifacts:', foldersWithRoots.size);
  foldersWithRoots.forEach((items, folderId) => {
    const folder = game.folders?.get(folderId);
    console.log(`   Folder "${folder?.name}" (${folderId}):`, {
      rootCount: items.length,
      rootNames: items.map((i) => i.name)
    });
  });
  
  // 8. Check DOM for folder rows
  const itemsTab = $('.sidebar-tab[data-tab="items"]');
  console.log('8. Items Tab in DOM:', {
    found: itemsTab.length > 0,
    visible: itemsTab.is(':visible')
  });
  
  if (itemsTab.length > 0) {
    const folderRows = itemsTab.find('.directory-item.folder, .folder, [data-folder-id]');
    console.log('   Folder rows in DOM:', folderRows.length);
    
    folderRows.slice(0, 5).each((i, el) => {
      const $f = $(el);
      const folderId = $f.attr('data-folder-id') || $f.data('folderId');
      const hasButton = $f.find('.ms-open-artifact-builder-btn').length > 0;
      const folderName = $f.find('.folder-name, .folder-header .folder-name').text().trim();
      const hasRoot = foldersWithRoots.has(folderId);
      
      console.log(`   Folder row ${i + 1}:`, {
        folderId,
        folderName: folderName.substring(0, 30),
        hasButton,
        hasRoot,
        className: $f.attr('class')?.substring(0, 50)
      });
    });
  }
  
  // 9. Manually trigger the hook
  console.log('9. Manually triggering renderItemDirectory hook...');
  if (itemDir) {
    const html = $(itemDir.element || itemDir._element || '.sidebar-tab[data-tab="items"]');
    Hooks.callAll('renderItemDirectory', itemDir, html, {});
    console.log('   Hook triggered, check console for Mastery System logs');
  } else {
    console.log('   ⚠️ Cannot trigger - Item Directory not found');
  }
  
  // 10. Check after a delay
  setTimeout(() => {
    console.log('10. Checking buttons after 1 second...');
    const itemsTab2 = $('.sidebar-tab[data-tab="items"]');
    const buttons = itemsTab2.find('.ms-open-artifact-builder-btn');
    console.log('   Buttons found:', buttons.length);
    if (buttons.length > 0) {
      buttons.each((i, el) => {
        const $el = $(el);
        console.log(`   Button ${i + 1}:`, {
          folderId: $el.data('folder-id'),
          visible: $el.is(':visible'),
          parent: $el.parent().attr('class')
        });
      });
    }
  }, 1000);
  
  console.log('=== Debug Complete ===');
  console.log('Tipp: Öffne die Konsole und suche nach "Mastery System" Logs, um zu sehen, ob der Hook getriggert wird.');
})();

