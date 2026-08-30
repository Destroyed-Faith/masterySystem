export async function showWeaponCreationDialog(actor) {
    // Dynamic import to avoid build issues
    const { getWeaponsByHands, getWeaponsByType, getWeapon } = await import('../utils/weapons.js');
    const oneHanded = getWeaponsByHands(1);
    const twoHanded = getWeaponsByHands(2);
    const ranged = getWeaponsByType('ranged');
    // Create weapon options grouped by category
    const createWeaponOption = (weapon) => {
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
            ${oneHanded.filter((w) => !w.innateAbilities.some((a) => /^ranged/i.test(a.trim()))).map(createWeaponOption).join('')}
          </optgroup>
          <optgroup label="Two-Handed Melee">
            ${twoHanded.filter((w) => !w.innateAbilities.some((a) => /^ranged/i.test(a.trim()))).map(createWeaponOption).join('')}
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
    const dialog = new Dialog({
        title: 'Add Weapon',
        content: content,
        classes: ['mastery-system', 'weapon-creation-dialog'],
        buttons: {
            add: {
                icon: '<i class="fas fa-check"></i>',
                label: 'Add Weapon',
                callback: async (html) => {
                    const $html = html;
                    const weaponName = $html.find('#weapon-select').val();
                    if (!weaponName) {
                        ui.notifications?.warn('Please select a weapon.');
                        return false;
                    }
                    const option = $html.find('#weapon-select option:selected')[0];
                    const equipped = $html.find('#weapon-equipped').is(':checked');
                    // Determine weapon type (melee or ranged). The range is carried
                    // inside the ability tag (`Ranged (32 m)`), so an exact `'Ranged'`
                    // match is wrong — match the prefix instead.
                    const abilities = option.dataset.abilities ? option.dataset.abilities.split('|') : [];
                    const rangedAbility = abilities.find((a) => /^ranged/i.test(a.trim())) || '';
                    const isRanged = !!rangedAbility;
                    // Extract the flat maximum (e.g. `(32 m)`) so we store the printed
                    // distance instead of a placeholder.
                    let rangeText = '';
                    if (isRanged) {
                        const m = rangedAbility.match(/\(([^)]+)\)/);
                        rangeText = m ? m[1] : rangedAbility.replace(/^ranged\s*/i, '').trim() || '32m';
                    }
                    const hands = parseInt(option.dataset.hands || '1', 10);
                    const catalog = getWeapon(weaponName);
                    const needsAmmo = catalog?.requiresAmmunition === true;
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
                            equipSlots: needsAmmo || hands !== 2 ? ['mainhand', 'offhand'] : ['mainhand'],
                            ...(needsAmmo
                                ? { requiresAmmunition: true, ammunitionType: catalog.ammunitionType }
                                : {}),
                        }
                    };
                    const createdItems = await actor.createEmbeddedDocuments('Item', [itemData]);
                    ui.notifications?.info(`Added weapon: ${weaponName}`);
                    // Re-render the actor sheet to show the new weapon
                    if (actor.sheet && actor.sheet.rendered) {
                        actor.sheet.render();
                    }
                    return true;
                }
            },
            cancel: {
                icon: '<i class="fas fa-times"></i>',
                label: 'Cancel',
                callback: () => { }
            }
        },
        default: 'add',
        close: () => { }
    });
    dialog.render(true);
}
//# sourceMappingURL=character-sheet-weapon-dialog.js.map