/**
 * Script to check if Artifact Builder buttons exist in Item Directory
 * Run this in the Foundry VTT console (F12)
 */

(() => {
  console.log('=== Artifact Builder Button Check ===');
  
  // Method 1: Try ui.items first (Foundry VTT v13 standard)
  let itemDir = ui.items;
  
  // Method 2: Fallback to ui.windows search
  if (!itemDir) {
    itemDir = Object.values(ui.windows || {}).find(w =>
      w?.constructor?.name === 'ItemDirectory' || 
      w?.id === 'items' ||
      w?.title?.includes('Item')
    );
  }
  
  // Method 3: Try to find by DOM element
  if (!itemDir) {
    const itemsTab = document.querySelector('.sidebar-tab[data-tab="items"]');
    if (itemsTab) {
      console.log('⚠️ Item Directory app not found, but items tab exists in DOM');
      // Continue with DOM-based search
    }
  }
  
  if (!itemDir) {
    console.log('❌ Item Directory nicht gefunden');
    console.log('   Verfügbare ui.windows:', Object.keys(ui.windows || {}).length);
    console.log('   ui.items vorhanden:', !!ui.items);
    console.log('   Items Tab im DOM:', !!document.querySelector('.sidebar-tab[data-tab="items"]'));
    
    // Try DOM-based approach anyway
    const itemsTab = $('.sidebar-tab[data-tab="items"]');
    if (itemsTab.length > 0) {
      console.log('   Versuche DOM-basierte Suche...');
      const root = itemsTab;
      const buttons = root.find('.ms-open-artifact-builder-btn');
      console.log('   Buttons im DOM gefunden:', buttons.length);
      if (buttons.length > 0) {
        buttons.each((i, el) => {
          const $el = $(el);
          console.log(`   Button ${i + 1}:`, {
            folderId: $el.data('folder-id'),
            parent: $el.parent().attr('class'),
            html: $el[0].outerHTML.substring(0, 100)
          });
        });
      }
      
      const folders = root.find('.directory-item.folder, .folder, [data-folder-id]');
      console.log('   Folder rows im DOM:', folders.length);
      folders.slice(0, 5).each((i, el) => {
        const $f = $(el);
        console.log(`   Folder ${i + 1}:`, {
          id: $f.attr('data-folder-id') || $f.data('folderId'),
          hasButton: $f.find('.ms-open-artifact-builder-btn').length > 0,
          className: $f.attr('class')
        });
      });
    }
    return;
  }
  
  console.log('✓ Item Directory gefunden:', itemDir.constructor?.name || 'Unknown');
  console.log('   - ID:', itemDir.id);
  console.log('   - Rendered:', itemDir.rendered);
  console.log('   - Element:', !!itemDir.element);
  console.log('   - _element:', !!itemDir._element);
  
  // Get the root element - try multiple methods
  let root = null;
  if (itemDir.element) {
    root = $(itemDir.element);
  } else if (itemDir._element) {
    root = $(itemDir._element);
  } else {
    // Fallback to sidebar tab
    root = $('.sidebar-tab[data-tab="items"]');
  }
  
  if (!root || root.length === 0) {
    console.log('❌ Konnte Root-Element nicht finden');
    return;
  }
  
  console.log('   Root-Element gefunden, Länge:', root.length);
  
  // Search for buttons
  const buttons = root.find('.ms-open-artifact-builder-btn');
  console.log('✓ Buttons gefunden:', buttons.length);
  
  if (buttons.length > 0) {
    buttons.each((i, el) => {
      const $el = $(el);
      console.log(`   Button ${i + 1}:`, {
        folderId: $el.data('folder-id'),
        parent: $el.parent().attr('class'),
        visible: $el.is(':visible'),
        html: $el[0].outerHTML.substring(0, 150)
      });
    });
  } else {
    console.log('   ⚠️ Keine Buttons gefunden');
  }
  
  // Check folders
  const folders = root.find('.directory-item.folder, .folder, [data-folder-id]');
  console.log('✓ Folder rows gefunden:', folders.length);
  
  if (folders.length > 0) {
    const foldersWithButton = folders.filter((i, el) => {
      return $(el).find('.ms-open-artifact-builder-btn').length > 0;
    });
    console.log('   Folders mit Button:', foldersWithButton.length);
    
    folders.slice(0, 10).each((i, el) => {
      const $f = $(el);
      const hasButton = $f.find('.ms-open-artifact-builder-btn').length > 0;
      if (hasButton || i < 3) { // Show first 3 and all with buttons
        console.log(`   Folder ${i + 1}:`, {
          id: $f.attr('data-folder-id') || $f.data('folderId'),
          name: $f.find('.folder-name, .folder-header').text().trim().substring(0, 30),
          hasButton: hasButton,
          className: $f.attr('class')?.substring(0, 50)
        });
      }
    });
  }
  
  // Check if renderItemDirectory hook is registered
  const hooks = Hooks._hooks?.renderItemDirectory || [];
  console.log('✓ Registrierte renderItemDirectory Hooks:', hooks.length);
  if (hooks.length > 0) {
    hooks.forEach((hook, idx) => {
      console.log(`   Hook ${idx + 1}:`, {
        name: hook.name || 'anonymous',
        id: hook.id
      });
    });
  }
  
  console.log('=== Done ===');
})();

