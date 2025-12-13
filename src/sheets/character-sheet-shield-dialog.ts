import { getAllShields } from '../utils/equipment.js';

export async function showShieldCreationDialog(actor: any): Promise<void> {
  const allShields = getAllShields();
  
  const shieldOptions = allShields.map(shield => {
    const typeLabel = shield.type === 'parry' ? 'Parry' : shield.type === 'medium' ? 'Medium' : 'Tower';
    const evadeText = shield.evadeBonus > 0 ? `+${shield.evadeBonus} Evade` : '';
    const penaltyText = shield.skillPenalty !== '—' ? `, ${shield.skillPenalty}` : '';
    return `<option 
      value="${shield.name}" 
      data-type="${shield.type}"
      data-shield-value="${shield.shieldValue}"
      data-evade-bonus="${shield.evadeBonus}"
      data-skill-penalty="${shield.skillPenalty}"
      data-description="${shield.description || ''}"
    >${shield.name} (${typeLabel}, +${shield.shieldValue} Shield${evadeText ? ', ' + evadeText : ''}${penaltyText})</option>`;
  }).join('');
  
  const content = `
    <form>
      <div class="form-group">
        <label>Select Shield:</label>
        <select name="shield" id="shield-select" style="width: 100%; margin-bottom: 10px;">
          <option value="">-- Select Shield --</option>
          ${shieldOptions}
        </select>
      </div>
      
      <div id="shield-details" style="margin-top: 15px; padding: 10px; background: rgba(0,0,0,0.1); border-radius: 4px; display: none;">
        <div><strong>Shield Value:</strong> <span id="shield-value">—</span></div>
        <div><strong>Type:</strong> <span id="shield-type">—</span></div>
        <div><strong>Evade Bonus:</strong> <span id="shield-evade">—</span></div>
        <div><strong>Skill Penalty:</strong> <span id="shield-penalty">—</span></div>
        <div style="margin-top: 8px;"><em id="shield-description">—</em></div>
      </div>
      
      <div class="form-group" style="margin-top: 15px;">
        <label>
          <input type="checkbox" name="equipped" id="shield-equipped" />
          Equip this shield immediately
        </label>
      </div>
    </form>
    
    <script>
      (function() {
        const select = document.getElementById('shield-select');
        const details = document.getElementById('shield-details');
        const valueSpan = document.getElementById('shield-value');
        const typeSpan = document.getElementById('shield-type');
        const evadeSpan = document.getElementById('shield-evade');
        const penaltySpan = document.getElementById('shield-penalty');
        const descriptionSpan = document.getElementById('shield-description');
        
        select.addEventListener('change', function() {
          const option = select.options[select.selectedIndex];
          if (option.value) {
            valueSpan.textContent = '+' + (option.dataset.shieldValue || '0');
            typeSpan.textContent = option.dataset.type ? option.dataset.type.charAt(0).toUpperCase() + option.dataset.type.slice(1) : '—';
            const evadeBonus = parseInt(option.dataset.evadeBonus || '0', 10);
            evadeSpan.textContent = evadeBonus > 0 ? '+' + evadeBonus : '—';
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
  
  const dialog = new (foundry.applications as any).Dialog({
    title: 'Add Shield',
    content: content,
    buttons: {
      add: {
        icon: '<i class="fas fa-check"></i>',
        label: 'Add Shield',
        callback: async (html: any) => {
          const $html = html as JQuery;
          const shieldName = $html.find('#shield-select').val() as string;
          
          if (!shieldName) {
            ui.notifications?.warn('Please select a shield.');
            return false;
          }
          
          const option = $html.find('#shield-select option:selected')[0] as HTMLOptionElement;
          const equipped = $html.find('#shield-equipped').is(':checked');
          
          const itemData = {
            name: shieldName,
            type: 'shield',
            system: {
              type: option.dataset.type || 'parry',
              shieldValue: parseInt(option.dataset.shieldValue || '0', 10),
              evadeBonus: parseInt(option.dataset.evadeBonus || '0', 10),
              skillPenalty: option.dataset.skillPenalty || '—',
              equipped: equipped,
              description: option.dataset.description || ''
            }
          };
          
          await (actor as any).createEmbeddedDocuments('Item', [itemData]);
          ui.notifications?.info(`Added shield: ${shieldName}`);
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

