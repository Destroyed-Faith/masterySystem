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
    <form class="weapon-creation-form">
      <div class="form-group weapon-form-group">
        <label class="weapon-form-label">Select Weapon:</label>
        <select name="weapon" id="weapon-select" class="weapon-select">
          <option value="">-- Select a Weapon --</option>
          <optgroup label="One-Handed Melee">
            ${oneHanded.filter((w: any) => !w.innateAbilities.some((a: string) => /^ranged/i.test(a.trim()))).map(createWeaponOption).join('')}
          </optgroup>
          <optgroup label="Two-Handed Melee">
            ${twoHanded.filter((w: any) => !w.innateAbilities.some((a: string) => /^ranged/i.test(a.trim()))).map(createWeaponOption).join('')}
          </optgroup>
          <optgroup label="Ranged">
            ${ranged.map(createWeaponOption).join('')}
          </optgroup>
        </select>
      </div>
      
      <div id="weapon-details" class="weapon-details-card" style="display: none;">
        <div class="weapon-detail-item"><strong>Damage:</strong> <span id="weapon-damage">—</span></div>
        <div class="weapon-detail-item"><strong>Hands:</strong> <span id="weapon-hands">—</span></div>
        <div class="weapon-detail-item"><strong>Properties:</strong> <span id="weapon-abilities">—</span></div>
        <div class="weapon-detail-item"><strong>Special:</strong> <span id="weapon-special">—</span></div>
        <div class="weapon-description-text"><em id="weapon-description">—</em></div>
      </div>
      
      <div class="form-group weapon-form-group weapon-checkbox-group">
        <label class="weapon-checkbox-label">
          <input type="checkbox" name="equipped" id="weapon-equipped" class="weapon-checkbox" />
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
  
  const dialog = new (Dialog as any)({
    title: 'Add Weapon',
    content: content,
    classes: ['mastery-system', 'weapon-creation-dialog'],
    buttons: {
      add: {
        icon: '<i class="fas fa-check"></i>',
        label: 'Add Weapon',
        callback: async (html: any) => {
          const $html = html as JQuery;
          const weaponName = $html.find('#weapon-select').val() as string;
          
          if (!weaponName) {
            ui.notifications?.warn('Please select a weapon.');
            return false;
          }
          
          const option = $html.find('#weapon-select option:selected')[0] as HTMLOptionElement;
          const equipped = $html.find('#weapon-equipped').is(':checked');
          
          // Determine weapon type (melee or ranged). Players Guide 7499–7521
          // describes range as Short / Medium / Long bands carried inside the
          // ability tag (`Ranged (8/16/32m)`), so an exact `'Ranged'` match is
          // wrong — match the prefix instead.
          const abilities = option.dataset.abilities ? option.dataset.abilities.split('|') : [];
          const rangedAbility = abilities.find((a: string) => /^ranged/i.test(a.trim())) || '';
          const isRanged = !!rangedAbility;

          // Try to extract band notation (e.g. `(8/16/32m)`) so we can store
          // the canonical band string instead of the legacy `'30m'` placeholder.
          // Falls back to the unmodified ability text when no parens are found.
          let rangeText = '';
          if (isRanged) {
            const m = rangedAbility.match(/\(([^)]+)\)/);
            rangeText = m ? m[1] : rangedAbility.replace(/^ranged\s*/i, '').trim() || '8/16/32m';
          }

          const hands = parseInt(option.dataset.hands || '1', 10);
          const itemData = {
            name: weaponName,
            type: 'weapon',
            system: {
              weaponType: isRanged ? 'ranged' : 'melee',
              damage: option.dataset.damage || '1d8',
              range: isRanged ? rangeText : '0m',
              specials: option.dataset.special && option.dataset.special !== '—'
                ? [option.dataset.special]
                : [],
              equipped: equipped,
              hands,
              innateAbilities: abilities,
              description: option.dataset.description || '',
              equipSlots: hands === 2 ? ['mainhand'] : ['mainhand', 'offhand']
            }
          };
          
          const createdItems = await (actor as any).createEmbeddedDocuments('Item', [itemData]);
          ui.notifications?.info(`Added weapon: ${weaponName}`);
          
          // Re-render the actor sheet to show the new weapon
          if ((actor as any).sheet && (actor as any).sheet.rendered) {
            (actor as any).sheet.render();
          }
          
          console.log('Mastery System | [WEAPON DIALOG] Weapon created', {
            weaponName,
            itemId: createdItems[0]?.id,
            actorId: (actor as any).id,
            itemsCount: (actor as any).items.size,
            allWeapons: Array.from((actor as any).items.values())
              .filter((i: any) => i.type === 'weapon')
              .map((i: any) => ({
                id: i.id,
                name: i.name,
                equipped: i.system?.equipped
              }))
          });
          
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

