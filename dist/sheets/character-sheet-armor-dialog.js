import { getAllArmor } from '../utils/equipment.js';
export async function showArmorCreationDialog(actor) {
    const allArmor = getAllArmor();
    const armorOptions = allArmor.map(armor => {
        const typeLabel = armor.type.charAt(0).toUpperCase() + armor.type.slice(1);
        return `<option 
      value="${armor.name}" 
      data-type="${armor.type}"
      data-armor-value="${armor.armorValue}"
      data-skill-penalty="${armor.skillPenalty}"
      data-description="${armor.description || ''}"
    >${armor.name} (${typeLabel}, +${armor.armorValue} Armor)</option>`;
    }).join('');
    const content = `
    <form class="armor-creation-form">
      <div class="form-group armor-form-group">
        <label class="armor-form-label">Select Armor:</label>
        <select name="armor" id="armor-select" class="armor-form-select">
          <option value="">-- Select Armor --</option>
          ${armorOptions}
        </select>
      </div>
      
      <div id="armor-details" class="armor-details-card" style="display: none;">
        <div class="armor-detail-item"><strong>Armor Value:</strong> <span id="armor-value">—</span></div>
        <div class="armor-detail-item"><strong>Type:</strong> <span id="armor-type">—</span></div>
        <div class="armor-detail-item"><strong>Skill Penalty:</strong> <span id="armor-penalty">—</span></div>
        <div class="armor-description-text"><em id="armor-description">—</em></div>
      </div>
      
      <div class="form-group armor-form-group armor-checkbox-group">
        <label class="armor-checkbox-label">
          <input type="checkbox" name="equipped" id="armor-equipped" class="armor-checkbox" />
          Equip this armor immediately
        </label>
      </div>
    </form>
    
    <script>
      (function() {
        const select = document.getElementById('armor-select');
        const details = document.getElementById('armor-details');
        const valueSpan = document.getElementById('armor-value');
        const typeSpan = document.getElementById('armor-type');
        const penaltySpan = document.getElementById('armor-penalty');
        const descriptionSpan = document.getElementById('armor-description');
        
        select.addEventListener('change', function() {
          const option = select.options[select.selectedIndex];
          if (option.value) {
            valueSpan.textContent = '+' + (option.dataset.armorValue || '0');
            typeSpan.textContent = option.dataset.type ? option.dataset.type.charAt(0).toUpperCase() + option.dataset.type.slice(1) : '—';
            penaltySpan.textContent = option.dataset.skillPenalty || '—';
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
        title: 'Add Armor',
        content: content,
        classes: ['mastery-system', 'armor-creation-dialog'],
        buttons: {
            add: {
                icon: '<i class="fas fa-check"></i>',
                label: 'Add Armor',
                callback: async (html) => {
                    const $html = html;
                    const armorName = $html.find('#armor-select').val();
                    if (!armorName) {
                        ui.notifications?.warn('Please select an armor.');
                        return false;
                    }
                    const option = $html.find('#armor-select option:selected')[0];
                    const equipped = $html.find('#armor-equipped').is(':checked');
                    const itemData = {
                        name: armorName,
                        type: 'armor',
                        system: {
                            type: option.dataset.type || 'light',
                            armorValue: parseInt(option.dataset.armorValue || '0', 10),
                            skillPenalty: option.dataset.skillPenalty || '—',
                            equipped: equipped,
                            description: option.dataset.description || ''
                        }
                    };
                    await actor.createEmbeddedDocuments('Item', [itemData]);
                    ui.notifications?.info(`Added armor: ${armorName}`);
                    // Re-render the actor sheet to show the new armor
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
//# sourceMappingURL=character-sheet-armor-dialog.js.map