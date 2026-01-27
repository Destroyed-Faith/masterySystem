/**
 * Quick test to check hook registration status
 * Run this in Foundry console (F12)
 */

(() => {
  console.log('=== Hook Status Check ===');
  
  // Check hooks
  const hooks = Hooks._hooks?.renderItemDirectory || [];
  console.log('renderItemDirectory hooks:', hooks.length);
  
  hooks.forEach((hook, idx) => {
    const fnStr = hook.fn?.toString() || '';
    const hasArtifact = fnStr.includes('Mastery System | renderItemDirectory Hook TRIGGERED');
    console.log(`Hook ${idx + 1}:`, {
      id: hook.id,
      name: hook.name || 'anonymous',
      hasArtifact: hasArtifact,
      fnLength: fnStr.length
    });
  });
  
  // Check if initializeArtifactAwakening was called
  console.log('initializeArtifactAwakening called:', hooks.some(h => 
    h.fn?.toString().includes('Mastery System | renderItemDirectory Hook TRIGGERED')
  ));
  
  // Try to trigger manually
  const itemDir = ui.items;
  if (itemDir && itemDir.rendered) {
    console.log('Item Directory is open, triggering hook...');
    const html = $(itemDir.element || itemDir._element || '.sidebar-tab[data-tab="items"]');
    Hooks.callAll('renderItemDirectory', itemDir, html, {});
    console.log('Hook triggered!');
  } else {
    console.log('Item Directory not open');
  }
})();

