/**
 * Debug Script für Artifact Button
 * In der Foundry Browser-Konsole (F12) ausführen
 */

console.log('=== Artifact Button Debug ===');

// 1. Prüfe ob der Hook registriert ist
const hooks = Hooks._hooks?.renderItemDirectory || [];
console.log('1. Registrierte renderItemDirectory Hooks:', hooks.length);

// 2. Prüfe ob GM
console.log('2. Ist GM:', game.user?.isGM);

// 3. Prüfe ob Item Directory offen ist
const itemDirectory = Object.values(ui.windows).find((w: any) => w.constructor.name === 'ItemDirectory');
console.log('3. Item Directory offen:', !!itemDirectory);

if (itemDirectory) {
  const html = $(itemDirectory.element || itemDirectory._element);
  
  // 4. Prüfe ob Button existiert
  const button = html.find('.ms-new-artifact-btn');
  console.log('4. Button gefunden:', button.length > 0);
  if (button.length > 0) {
    console.log('   Button HTML:', button[0].outerHTML);
    console.log('   Button Position:', button.parent().attr('class'));
  } else {
    console.log('   ❌ Button NICHT gefunden!');
  }
  
  // 5. Prüfe Container
  const actionButtons = html.find('.header-actions.action-buttons.flexrow');
  console.log('5. Action Buttons Container gefunden:', actionButtons.length > 0);
  if (actionButtons.length > 0) {
    console.log('   Container HTML:', actionButtons[0].outerHTML);
    console.log('   Buttons im Container:', actionButtons.find('button').length);
    actionButtons.find('button').each((i: number, btn: HTMLElement) => {
      console.log(`   Button ${i + 1}:`, btn.className, btn.getAttribute('data-action') || btn.textContent?.trim());
    });
  }
  
  // 6. Prüfe Create Item Button
  const createItemBtn = html.find('button[data-action="createEntry"]');
  console.log('6. Create Item Button gefunden:', createItemBtn.length > 0);
  
  // 7. Prüfe Create Folder Button
  const createFolderBtn = html.find('button[data-action="createFolder"]');
  console.log('7. Create Folder Button gefunden:', createFolderBtn.length > 0);
  
  // 8. Prüfe Header
  const header = html.find('.directory-header');
  console.log('8. Directory Header gefunden:', header.length > 0);
  if (header.length > 0) {
    console.log('   Header HTML:', header[0].outerHTML.substring(0, 500));
  }
  
  // 9. Versuche Button manuell hinzuzufügen (Test)
  if (button.length === 0 && actionButtons.length > 0) {
    console.log('9. Versuche Button manuell hinzuzufügen...');
    const testBtn = $(`
      <button type="button" class="ms-new-artifact-btn" title="New Artifact" style="background: red; color: white;">
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
}

console.log('=== Debug Ende ===');
console.log('Tipp: Öffne das Item Directory neu, wenn es bereits offen war.');

