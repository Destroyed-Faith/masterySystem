/**
 * Weapon Creation Dialog for Character Sheet
 * 
 * Shows a dialog where players can select and add Weapons from the weapons list.
 */

/**
 * Show the weapon creation dialog for an actor
 * @param actor - The actor to add weapons to
 */
export async function showWeaponCreationDialog(actor: Actor): Promise<void> {
  // Dynamic import to avoid build issues
  const { getWeaponsByHands, getWeaponsByType } = await import('../utils/weapons.js' as any);
  
  const oneHanded = getWeaponsByHands(1);
  const twoHanded = getWeaponsByHands(2);
  const ranged = getWeaponsByType('ranged');
  
  // Create weapon options grouped by category
  const createWeaponOption = (weapon: any) => {
    const abilities = weapon.innateAbilities.join(', ') || '—';
    return `<option value="${weapon.name}" data-damage="${weapon.weaponDamage}" data-hands="${weapon.hands}" data-abilities="${weapon.innateAbilities.join('|')}" data-special="${weapon.special}" data-description="${(weapon.description || '').replace(/"/g, '&quot;')}">${weapon.name} (${weapon.weaponDamage}, ${weapon.hands}H, ${abilities})</option>`;
  };
  
  const content = `
    <form>
      <div class="form-group">
        <label>Select Weapon:</label>
        <select name="weapon" id="weapon-select" style="width: 100%; margin-bottom: 10px;">
          <option value="">-- Select a Weapon --</option>
          <optgroup label="One-Handed Melee">
            ${oneHanded.filter((w: any) => !w.innateAbilities.includes('Ranged')).map(createWeaponOption).join('')}
          </optgroup>
          <optgroup label="Two-Handed Melee">
            ${twoHanded.filter((w: any) => !w.innateAbilities.includes('Ranged')).map(createWeaponOption).join('')}
          </optgroup>
          <optgroup label="Ranged">
            ${ranged.map(createWeaponOption).join('')}
          </optgroup>
        </select>
      </div>
      
      <div id="weapon-details" style="margin-top: 15px; padding: 10px; background: rgba(0,0,0,0.1); border-radius: 4px; display: none;">
        <div><strong>Damage:</strong> <span id="weapon-damage">—</span></div>
        <div><strong>Hands:</strong> <span id="weapon-hands">—</span></div>
        <div><strong>Properties:</strong> <span id="weapon-abilities">—</span></div>
        <div><strong>Special:</strong> <span id="weapon-special">—</span></div>
        <div style="margin-top: 8px;"><em id="weapon-description">—</em></div>
      </div>
      
      <div class="form-group" style="margin-top: 15px;">
        <label>
          <input type="checkbox" name="equipped" id="weapon-equipped" />
          Equip this weapon immediately
        </label>
      </div>
    </form>
    
    <script>
      (function() {
        const select = document.getElementById('weapon-select');
        const details = document.getElementById('weapon-details');
        const damageSpan = document.getElementById('weapon-damage');
        const handsSpan = document.getElementById('weapon-hands');
        const abilitiesSpan = document.getElementById('weapon-abilities');
        const specialSpan = document.getElementById('weapon-special');
        const descriptionSpan = document.getElementById('weapon-description');
        
        select.addEventListener('change', function() {
          const option = select.options[select.selectedIndex];
          if (option.value) {
            damageSpan.textContent = option.dataset.damage || '—';
            handsSpan.textContent = (option.dataset.hands || '1') + ' Hand' + (option.dataset.hands === '2' ? 's' : '');
            const abilities = option.dataset.abilities ? option.dataset.abilities.split('|').join(', ') : '—';
            abilitiesSpan.textContent = abilities || '—';
            specialSpan.textContent = option.dataset.special || '—';
            descriptionSpan.textContent = option.dataset.description || '—';
            details.style.display = 'block';
          } else {
            details.style.display = 'none';
          }
        });
      })();
    </script>
  `;
  
  const dialog = new Dialog({
    title: 'Add Weapon',
    content: content,
    buttons: {
      add: {
        icon: '<i class="fas fa-check"></i>',
        label: 'Add Weapon',
        callback: async (html) => {
          const $html = html as JQuery;
          const weaponName = $html.find('#weapon-select').val() as string;
          
          if (!weaponName) {
            ui.notifications?.warn('Please select a weapon.');
            return false;
          }
          
          const option = $html.find('#weapon-select option:selected')[0] as HTMLOptionElement;
          const equipped = $html.find('#weapon-equipped').is(':checked');
          
          // Determine weapon type (melee or ranged)
          const abilities = option.dataset.abilities ? option.dataset.abilities.split('|') : [];
          const isRanged = abilities.includes('Ranged');
          
          const itemData = {
            name: weaponName,
            type: 'weapon',
            system: {
              weaponType: isRanged ? 'ranged' : 'melee',
              damage: option.dataset.damage || '1d8',
              range: isRanged ? '30m' : '0m',
              specials: option.dataset.special && option.dataset.special !== '—' 
                ? [option.dataset.special] 
                : [],
              equipped: equipped,
              hands: parseInt(option.dataset.hands || '1', 10),
              innateAbilities: abilities,
              description: option.dataset.description || ''
            }
          };
          
          await (actor as any).createEmbeddedDocuments('Item', [itemData]);
          ui.notifications?.info(`Added weapon: ${weaponName}`);
          return true;
        }
      },
      cancel: {
        icon: '<i class="fas fa-times"></i>',
        label: 'Cancel',
        callback: () => {}
      }
    },
    default: 'add',
    close: () => {}
  });
  
  dialog.render(true);
}

