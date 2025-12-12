/**
 * Damage Dialog for Mastery System
 * Appears after successful attack roll to calculate and apply damage
 */

export interface DamageDialogData {
  attacker: Actor;
  target: Actor;
  weapon: any | null;
  baseDamage: string;
  powerDamage: string;
  passiveDamage: string;
  raises: number;
  availableSpecials: SpecialOption[];
  weaponSpecials: string[];
}

export interface SpecialOption {
  id: string;
  name: string;
  type: 'power' | 'passive' | 'weapon';
  description: string;
  effect?: string;
}

export interface DamageResult {
  baseDamage: number;
  powerDamage: number;
  passiveDamage: number;
  raiseDamage: number;
  specialsUsed: string[];
  totalDamage: number;
}

/**
 * Show damage dialog after successful attack
 */
export async function showDamageDialog(
  attacker: Actor,
  target: Actor,
  weaponId: string | null,
  selectedPowerId: string | null,
  raises: number,
  flags?: any
): Promise<DamageResult | null> {
  console.log('Mastery System | DEBUG: showDamageDialog - starting', {
    attackerName: (attacker as any).name,
    targetName: (target as any).name,
    weaponId: weaponId,
    selectedPowerId: selectedPowerId,
    raises,
    raisesType: typeof raises,
    hasFlags: !!flags,
    flagsKeys: flags ? Object.keys(flags) : []
  });
  
  // Load weapon from actor by ID
  const items = (attacker as any).items || [];
  const weapon = weaponId ? items.find((item: any) => item.id === weaponId) : null;
  
  // Calculate base damage from weapon
  const baseDamage = weapon ? ((weapon.system as any)?.damage || (weapon.system as any)?.weaponDamage || '1d8') : '1d8';
  console.log('Mastery System | DEBUG: showDamageDialog - baseDamage', {
    weaponId,
    weaponFound: !!weapon,
    weaponName: weapon ? weapon.name : 'none',
    baseDamage
  });
  
  // Get weapon specials
  const weaponSpecials: string[] = weapon ? ((weapon.system as any)?.specials || []) : [];
  console.log('Mastery System | DEBUG: showDamageDialog - weaponSpecials', weaponSpecials);
  
  // Load selected power from actor by ID and get its data
  let powerDamage = '0';
  let powerSpecials: string[] = [];
  let selectedPowerData: any = null;
  
  if (selectedPowerId) {
    const selectedPower = items.find((item: any) => item.id === selectedPowerId);
    if (selectedPower) {
      const powerSystem = selectedPower.system as any;
      const powerLevel = powerSystem.level || 1;
      
      // Try to get level-specific data from power definitions
      let levelData: any = null;
      try {
        const powersModule = await import('../../utils/powers/index.js' as any);
        const powerDefinitions = powersModule.ALL_MASTERY_POWERS || [];
        const powerDef = powerDefinitions.find((p: any) => 
          p.name === selectedPower.name && p.tree === powerSystem.tree
        );
        if (powerDef && powerDef.levels) {
          levelData = powerDef.levels.find((l: any) => l.level === powerLevel);
        }
      } catch (e) {
        console.warn('Mastery System | Could not load power definitions for level data', e);
      }
      
      // Use level-specific data if available, otherwise fall back to system data
      if (levelData) {
        powerDamage = levelData.roll?.damage || powerSystem.roll?.damage || '0';
        if (levelData.special) {
          powerSpecials = levelData.special.split(',').map((s: string) => s.trim());
        } else {
          powerSpecials = powerSystem.specials || [];
        }
      } else {
        powerDamage = powerSystem.roll?.damage || '0';
        powerSpecials = powerSystem.specials || [];
      }
      
      selectedPowerData = {
        id: selectedPower.id,
        name: selectedPower.name,
        level: powerLevel,
        specials: powerSpecials,
        damage: powerDamage
      };
      
      console.log('Mastery System | DEBUG: showDamageDialog - power loaded from actor', {
        powerId: selectedPowerId,
        powerName: selectedPower.name,
        powerLevel: powerLevel,
        powerDamage,
        powerSpecials,
        hasLevelData: !!levelData
      });
    } else {
      console.warn('Mastery System | Selected power not found in actor items', selectedPowerId);
    }
  }
  console.log('Mastery System | DEBUG: showDamageDialog - powerDamage', powerDamage);
  
  // Calculate passive damage (from equipped passives)
  const passiveDamage = await calculatePassiveDamage(attacker);
  console.log('Mastery System | DEBUG: showDamageDialog - passiveDamage', passiveDamage);
  
  // Collect available specials
  const availableSpecials = await collectAvailableSpecials(attacker, weapon);
  console.log('Mastery System | DEBUG: showDamageDialog - availableSpecials', availableSpecials.length);
  
  // Create damage card as chat message instead of dialog
  return new Promise((resolve) => {
    const damageCardContent = createDamageCardContent(
      attacker,
      target,
      baseDamage,
      powerDamage,
      passiveDamage,
      raises,
      availableSpecials,
      weaponSpecials,
      resolve,
      selectedPowerData
    );
    
    const chatData: any = {
      user: (game as any).user?.id,
      speaker: ChatMessage.getSpeaker({ actor: attacker }),
      content: damageCardContent,
      style: CONST.CHAT_MESSAGE_STYLES.OTHER,
      flags: {
        'mastery-system': {
          damageType: 'selection',
          attackerId: (attacker as any).id,
          targetId: (target as any).id,
          weaponId: weaponId,
          selectedPowerId: selectedPowerId,
          baseDamage,
          powerDamage,
          passiveDamage,
          raises,
          availableSpecials,
          weaponSpecials
        }
      }
    };
    
    ChatMessage.create(chatData).then((message: any) => {
      console.log('Mastery System | DEBUG: Damage card created in chat', message.id);
      // Initialize the damage card UI
      setTimeout(() => {
        initializeDamageCard(message.id, resolve);
      }, 100);
    });
  });
}

/**
 * Create HTML content for damage card in chat
 */
function createDamageCardContent(
  attacker: Actor,
  target: Actor,
  baseDamage: string,
  powerDamage: string,
  passiveDamage: string,
  raises: number,
  availableSpecials: SpecialOption[],
  _weaponSpecials: string[],
  _resolve: (result: DamageResult | null) => void,
  selectedPower?: any
): string {
  let raisesSection = '';
  if (raises > 0) {
    const raiseItems = Array.from({ length: raises }, (_, i) => {
      const raiseIndex = i;
      let specialOptions = '';
      if (availableSpecials.length > 0) {
        specialOptions = availableSpecials.map(special => 
          `<option value="${special.id}">${special.name} (${special.type})</option>`
        ).join('');
      }
      
      return `
        <div class="raise-item" data-raise-index="${raiseIndex}">
          <label>Raise ${raiseIndex + 1}:</label>
          <select class="raise-selection" data-raise-index="${raiseIndex}">
            <option value="">-- Select --</option>
            <option value="damage">+1d8 Damage</option>
            ${availableSpecials.length > 0 ? '<option value="special">Use Special</option>' : ''}
          </select>
          ${availableSpecials.length > 0 ? `
            <select class="special-select" data-raise-index="${raiseIndex}" style="display: none;">
              <option value="">-- Select Special --</option>
              ${specialOptions}
            </select>
          ` : ''}
        </div>
      `;
    }).join('');
    
    raisesSection = `
      <div class="raises-section">
        <h4><i class="fas fa-star"></i> Raises (${raises} available)</h4>
        <p class="raises-description">Each raise can be used for a Special (once per raise) or 1d8 additional damage.</p>
        <div class="raises-list">
          ${raiseItems}
        </div>
      </div>
    `;
  }
  
  console.log('Mastery System | DEBUG: createDamageCardContent - values', {
    baseDamage,
    powerDamage,
    passiveDamage,
    raises,
    hasRaisesSection: !!raisesSection,
    raisesSectionLength: raisesSection.length,
    selectedPower: selectedPower ? {
      name: selectedPower.name,
      level: selectedPower.level,
      specials: selectedPower.specials,
      damage: selectedPower.damage
    } : null
  });
  
  const html = `
    <div class="mastery-damage-card">
      <div class="damage-header">
        <h3><i class="fas fa-sword"></i> Damage Calculation</h3>
        <div class="damage-participants">
          <strong>${(attacker as any).name}</strong> → <strong>${(target as any).name}</strong>
        </div>
      </div>
      <div class="damage-details">
        <div class="damage-row">
          <span class="damage-label">Base Weapon Damage:</span>
          <span class="damage-value">${baseDamage || '0'}</span>
        </div>
        ${selectedPower ? `
          <div class="damage-row">
            <span class="damage-label">Power:</span>
            <span class="damage-value">${selectedPower.name} (Level ${selectedPower.level})</span>
          </div>
          ${selectedPower.specials && selectedPower.specials.length > 0 ? `
            <div class="damage-row">
              <span class="damage-label">Power Specials:</span>
              <span class="damage-value">${selectedPower.specials.join(', ')}</span>
            </div>
          ` : ''}
        ` : ''}
        <div class="damage-row">
          <span class="damage-label">Power Damage:</span>
          <span class="damage-value">${powerDamage || '0'}</span>
        </div>
        <div class="damage-row">
          <span class="damage-label">Passive Damage:</span>
          <span class="damage-value">${passiveDamage || '0'}</span>
        </div>
      </div>
      ${raisesSection}
      <div class="damage-actions">
        <button class="roll-damage-btn" data-attacker-id="${(attacker as any).id}" data-target-id="${(target as any).id}">
          <i class="fas fa-dice"></i> Roll Damage
        </button>
        <button class="cancel-damage-btn">
          <i class="fas fa-times"></i> Cancel
        </button>
      </div>
    </div>
  `;
  
  console.log('Mastery System | DEBUG: createDamageCardContent - generated HTML length', html.length);
  console.log('Mastery System | DEBUG: createDamageCardContent - HTML preview', html.substring(0, 500));
  
  return html;
}

/**
 * Initialize damage card UI and event handlers
 */
function initializeDamageCard(messageId: string, resolve: (result: DamageResult | null) => void): void {
  const messageElement = $(`.message[data-message-id="${messageId}"]`);
  if (!messageElement.length) {
    console.warn('Mastery System | Could not find damage card message element', messageId);
    return;
  }
  
  // Handle raise selection changes
  messageElement.find('.raise-selection').on('change', function() {
    const raiseIndex = parseInt($(this).data('raise-index'));
    const selectionType = $(this).val() as string;
    const specialSelect = messageElement.find(`.special-select[data-raise-index="${raiseIndex}"]`);
    
    if (selectionType === 'damage') {
      specialSelect.hide();
    } else if (selectionType === 'special') {
      specialSelect.show();
    } else {
      specialSelect.hide();
    }
  });
  
  // Handle roll damage button
  messageElement.find('.roll-damage-btn').on('click', async function() {
    const attackerId = $(this).data('attacker-id');
    const targetId = $(this).data('target-id');
    const attacker = (game as any).actors?.get(attackerId);
    const target = (game as any).actors?.get(targetId);
    
    if (!attacker || !target) {
      ui.notifications?.error('Could not find attacker or target');
      return;
    }
    
    const message = (game as any).messages?.get(messageId);
    if (!message) {
      ui.notifications?.error('Could not find damage card message');
      return;
    }
    
    const flags = message.getFlag('mastery-system') || message.flags?.['mastery-system'];
    if (!flags) {
      ui.notifications?.error('Could not find damage card data');
      return;
    }
    
    // Collect raise selections
    const raiseSelections: Map<number, { type: 'special' | 'damage'; value: string }> = new Map();
    messageElement.find('.raise-selection').each(function() {
      const raiseIndex = parseInt($(this).data('raise-index'));
      const selectionType = $(this).val() as string;
      if (selectionType === 'damage') {
        raiseSelections.set(raiseIndex, { type: 'damage', value: '1d8' });
      } else if (selectionType === 'special') {
        const specialId = messageElement.find(`.special-select[data-raise-index="${raiseIndex}"]`).val() as string;
        if (specialId) {
          raiseSelections.set(raiseIndex, { type: 'special', value: specialId });
        }
      }
    });
    
    // Calculate damage
    const result = await calculateDamageResult(
      flags.baseDamage,
      flags.powerDamage,
      flags.passiveDamage,
      flags.raises,
      raiseSelections,
      flags.availableSpecials
    );
    
    resolve(result);
  });
  
  // Handle cancel button
  messageElement.find('.cancel-damage-btn').on('click', function() {
    resolve(null);
  });
}

/**
 * Calculate passive damage bonuses
 */
async function calculatePassiveDamage(actor: Actor): Promise<string> {
  try {
    console.log('Mastery System | DEBUG: calculatePassiveDamage - starting', { actorName: (actor as any).name });
    // Import passive functions to get slots (try multiple paths)
    let passivesModule;
    try {
      console.log('Mastery System | DEBUG: calculatePassiveDamage - trying ../../dist/powers/passives.js');
      passivesModule = await import('../../dist/powers/passives.js' as any);
      console.log('Mastery System | DEBUG: calculatePassiveDamage - loaded passives module', { hasModule: !!passivesModule });
    } catch (e) {
      console.warn('Mastery System | DEBUG: calculatePassiveDamage - first import failed', e);
      // Try alternative path
      try {
        console.log('Mastery System | DEBUG: calculatePassiveDamage - trying ../../utils/powers/passives.js');
        passivesModule = await import('../../utils/powers/passives.js' as any);
        console.log('Mastery System | DEBUG: calculatePassiveDamage - loaded passives module from utils', { hasModule: !!passivesModule });
      } catch (e2) {
        console.warn('Mastery System | Could not load passives module, skipping passive damage', e2);
        return '0';
      }
    }
    const { getPassiveSlots } = passivesModule;
    
    const slots = getPassiveSlots(actor);
    const activePassives = slots.filter((slot: any) => slot.active && slot.passive);
    
  let totalDamage = 0;
  let damageDice = '';
  
  // Check each active passive for damage bonuses
  for (const slot of activePassives) {
    const passive = slot.passive;
    // Check if passive has damage bonus in its definition
    if (passive.damageBonus) {
      if (typeof passive.damageBonus === 'number') {
        totalDamage += passive.damageBonus;
      } else if (typeof passive.damageBonus === 'string') {
        // Parse dice notation like "1d8"
        damageDice += (damageDice ? ' + ' : '') + passive.damageBonus;
      }
    }
  }
  
  if (damageDice && totalDamage > 0) {
    return `${damageDice} + ${totalDamage}`;
  } else if (damageDice) {
    return damageDice;
  } else if (totalDamage > 0) {
    return totalDamage.toString();
  }
  
  return '0';
  } catch (error) {
    console.warn('Mastery System | Could not calculate passive damage:', error);
    return '0';
  }
}

/**
 * Collect all available specials (powers, passives, weapon specials)
 */
async function collectAvailableSpecials(actor: Actor, weapon: any | null): Promise<SpecialOption[]> {
  const specials: SpecialOption[] = [];
  const items = (actor as any).items || [];
  
  // Get attack powers (note: powers are stored as type 'special', not 'power')
  const attackPowers = items.filter((item: any) => 
    item.type === 'special' && 
    (item.system as any)?.powerType === 'active' &&
    (item.system as any)?.canUseOnAttack === true
  );
  
  for (const power of attackPowers) {
    const system = power.system as any;
    specials.push({
      id: power.id,
      name: power.name,
      type: 'power',
      description: system.description || '',
      effect: system.effect || ''
    });
  }
  
  // Get passives that can be used on attack (from passive slots)
  try {
    console.log('Mastery System | DEBUG: collectAvailableSpecials - loading passives module');
    // Try multiple paths for passives module
    let passivesModule;
    try {
      console.log('Mastery System | DEBUG: collectAvailableSpecials - trying ../../dist/powers/passives.js');
      passivesModule = await import('../../dist/powers/passives.js' as any);
      console.log('Mastery System | DEBUG: collectAvailableSpecials - loaded passives module', { hasModule: !!passivesModule });
    } catch (e) {
      console.warn('Mastery System | DEBUG: collectAvailableSpecials - first import failed', e);
      try {
        console.log('Mastery System | DEBUG: collectAvailableSpecials - trying ../../utils/powers/passives.js');
        passivesModule = await import('../../utils/powers/passives.js' as any);
        console.log('Mastery System | DEBUG: collectAvailableSpecials - loaded passives module from utils', { hasModule: !!passivesModule });
      } catch (e2) {
        console.warn('Mastery System | Could not load passives module for specials', e2);
        return specials; // Return what we have so far
      }
    }
    const { getPassiveSlots } = passivesModule;
    
    const slots = getPassiveSlots(actor);
    const activePassives = slots.filter((slot: any) => slot.active && slot.passive);
    
    for (const slot of activePassives) {
      const passive = slot.passive;
      // Check if passive can be used on attack (this would need to be defined in passive data)
      if (passive.canUseOnAttack !== false) { // Default to true if not specified
        specials.push({
          id: `passive-${slot.slotIndex}`,
          name: passive.name,
          type: 'passive',
          description: passive.description || '',
          effect: passive.effect || ''
        });
      }
    }
  } catch (error) {
    console.warn('Mastery System | Could not load passives for specials:', error);
  }
  
  // Get weapon specials
  if (weapon && (weapon.system as any)?.specials) {
    const weaponSpecials = (weapon.system as any).specials as string[];
    for (const special of weaponSpecials) {
      specials.push({
        id: `weapon-${special}`,
        name: special,
        type: 'weapon',
        description: `Weapon special: ${special}`,
        effect: special
      });
    }
  }
  
  return specials;
}

/**
 * Calculate damage result from selections
 */
async function calculateDamageResult(
  baseDamage: string,
  powerDamage: string,
  passiveDamage: string,
  raises: number,
  raiseSelections: Map<number, { type: 'special' | 'damage'; value: string }>,
  availableSpecials: SpecialOption[]
): Promise<DamageResult> {
  // Roll base damage
  const baseDamageRolled = await rollDice(baseDamage || '0');
  
  // Roll power damage
  const powerDamageRolled = await rollDice(powerDamage || '0');
  
  // Roll passive damage
  const passiveDamageRolled = await rollDice(passiveDamage || '0');
  
  // Calculate raise damage and collect specials
  let raiseDamage = 0;
  const specialsUsed: string[] = [];
  
  for (let i = 0; i < raises; i++) {
    const selection = raiseSelections.get(i);
    if (selection) {
      if (selection.type === 'damage') {
        raiseDamage += await rollDice('1d8');
      } else if (selection.type === 'special') {
        const special = availableSpecials.find(s => s.id === selection.value);
        if (special) {
          specialsUsed.push(special.name);
        }
      }
    }
  }
  
  const totalDamage = baseDamageRolled + powerDamageRolled + passiveDamageRolled + raiseDamage;
  
  return {
    baseDamage: baseDamageRolled,
    powerDamage: powerDamageRolled,
    passiveDamage: passiveDamageRolled,
    raiseDamage,
    specialsUsed,
    totalDamage
  };
}

/**
 * Roll dice from notation string
 */
async function rollDice(diceNotation: string): Promise<number> {
  if (!diceNotation || diceNotation === '0') return 0;
  
  // Parse dice notation (e.g., "2d8+3" or "1d8")
  const match = diceNotation.match(/(\d+)d(\d+)([+-]\d+)?/);
  if (!match) {
    // Try to parse as flat number
    const num = parseInt(diceNotation);
    return isNaN(num) ? 0 : num;
  }
  
  const numDice = parseInt(match[1]);
  const dieSize = parseInt(match[2]);
  const modifier = match[3] ? parseInt(match[3]) : 0;
  
  let total = 0;
  for (let i = 0; i < numDice; i++) {
    total += Math.floor(Math.random() * dieSize) + 1;
  }
  
  return total + modifier;
}

// DamageDialog class removed - now using chat messages instead
// The following code is kept for reference but not used:
/* eslint-disable @typescript-eslint/no-unused-vars */
/*
class DamageDialog extends Application {
  private data: DamageDialogData;
  private resolve: (result: DamageResult | null) => void;
  private raiseSelections: Map<number, { type: 'special' | 'damage'; value: string }> = new Map();
  
  constructor(data: DamageDialogData, resolve: (result: DamageResult | null) => void) {
    super({});
    this.data = data;
    this.resolve = resolve;
    console.log('Mastery System | DEBUG: DamageDialog constructor', {
      hasData: !!data,
      raises: data.raises,
      baseDamage: data.baseDamage,
      availableSpecials: data.availableSpecials?.length || 0
    });
  }
  
  static override get defaultOptions(): any {
    const opts = super.defaultOptions || {};
    console.log('Mastery System | DEBUG: DamageDialog defaultOptions - super.defaultOptions', super.defaultOptions);
    opts.id = 'mastery-damage-dialog';
    opts.title = 'Calculate Damage';
    opts.template = 'systems/mastery-system/templates/dice/damage-dialog.hbs';
    opts.width = 600;
    opts.height = 'auto';
    opts.resizable = true;
    opts.classes = ['mastery-damage-dialog'];
    opts.popOut = true;
    console.log('Mastery System | DEBUG: DamageDialog defaultOptions - final opts', opts);
    return opts;
  }
  
  // Implement required methods for Handlebars templates (Foundry VTT v13)
  async _renderHTML(data: any): Promise<JQuery> {
    const template = (this.constructor as any).defaultOptions.template || this.options.template;
    if (!template) {
      throw new Error('Template path is required');
    }
    console.log('Mastery System | DEBUG: DamageDialog _renderHTML - rendering template', { 
      template, 
      hasData: !!data,
      dataKeys: data ? Object.keys(data) : [],
      dataValue: data
    });
    // Always call getData() to ensure we have the correct data structure
    const templateData = await this.getData();
    console.log('Mastery System | DEBUG: DamageDialog _renderHTML - templateData from getData()', {
      hasData: !!templateData,
      keys: templateData ? Object.keys(templateData) : [],
      baseDamage: templateData?.baseDamage,
      powerDamage: templateData?.powerDamage,
      passiveDamage: templateData?.passiveDamage,
      raises: templateData?.raises,
      availableSpecials: templateData?.availableSpecials?.length || 0,
      weaponSpecials: templateData?.weaponSpecials?.length || 0,
      attacker: templateData?.attacker ? (templateData.attacker as any).name : 'none',
      target: templateData?.target ? (templateData.target as any).name : 'none',
      fullData: JSON.stringify(templateData, null, 2).substring(0, 1000)
    });
    const html = await foundry.applications.handlebars.renderTemplate(template, templateData);
    console.log('Mastery System | DEBUG: DamageDialog _renderHTML - template rendered', { 
      htmlLength: html.length,
      htmlType: typeof html,
      htmlPreview: html.substring ? html.substring(0, 500) : String(html).substring(0, 500)
    });
    const $html = $(html);
    console.log('Mastery System | DEBUG: DamageDialog _renderHTML - jQuery object created', {
      length: $html.length,
      htmlContent: $html.html()?.substring(0, 500)
    });
    return $html;
  }
  
  async _replaceHTML(element: JQuery, html: JQuery): Promise<void> {
    console.log('Mastery System | DEBUG: DamageDialog _replaceHTML - replacing element', {
      elementLength: element.length,
      elementHtml: element.html()?.substring(0, 200),
      htmlLength: html.length,
      htmlContent: html.html()?.substring(0, 500)
    });
    element.replaceWith(html);
    console.log('Mastery System | DEBUG: DamageDialog _replaceHTML - element replaced');
  }
  
  override async getData(): Promise<any> {
    console.log('Mastery System | DEBUG: DamageDialog getData() - called', {
      hasData: !!this.data,
      raises: this.data?.raises,
      baseDamage: this.data?.baseDamage,
      powerDamage: this.data?.powerDamage,
      passiveDamage: this.data?.passiveDamage,
      availableSpecials: this.data?.availableSpecials?.length || 0,
      weaponSpecials: this.data?.weaponSpecials?.length || 0,
      attacker: (this.data?.attacker as any)?.name,
      target: (this.data?.target as any)?.name
    });
    const data = {
      attacker: this.data?.attacker || null,
      target: this.data?.target || null,
      weapon: this.data?.weapon || null,
      baseDamage: this.data?.baseDamage || '0',
      powerDamage: this.data?.powerDamage || '0',
      passiveDamage: this.data?.passiveDamage || '0',
      raises: this.data?.raises || 0,
      availableSpecials: this.data?.availableSpecials || [],
      weaponSpecials: this.data?.weaponSpecials || [],
      raiseSelections: Array.from(this.raiseSelections.entries()).map(([index, selection]) => ({
        index,
        ...selection
      }))
    };
    console.log('Mastery System | DEBUG: DamageDialog getData() - returning', {
      hasData: !!data,
      raises: data.raises,
      baseDamage: data.baseDamage,
      powerDamage: data.powerDamage,
      passiveDamage: data.passiveDamage,
      availableSpecials: data.availableSpecials?.length || 0,
      weaponSpecials: data.weaponSpecials?.length || 0,
      raiseSelectionsCount: data.raiseSelections?.length || 0,
      attackerName: data.attacker ? (data.attacker as any).name : 'none',
      targetName: data.target ? (data.target as any).name : 'none'
    });
    return data;
  }
  
  override activateListeners(html: JQuery): void {
    super.activateListeners(html);
    
    // Handle raise selection changes
    html.find('.raise-selection').on('change', (ev) => {
      const raiseIndex = parseInt($(ev.currentTarget).data('raise-index'));
      const selectionType = $(ev.currentTarget).val() as string;
      
      if (selectionType === 'damage') {
        this.raiseSelections.set(raiseIndex, { type: 'damage', value: '1d8' });
      } else if (selectionType === 'special') {
        // Show special selection dropdown
        const specialSelect = html.find(`.special-select[data-raise-index="${raiseIndex}"]`);
        specialSelect.show();
      } else {
        this.raiseSelections.delete(raiseIndex);
        html.find(`.special-select[data-raise-index="${raiseIndex}"]`).hide();
      }
      
      this.render();
    });
    
    // Handle special selection
    html.find('.special-select').on('change', (ev) => {
      const raiseIndex = parseInt($(ev.currentTarget).data('raise-index'));
      const specialId = $(ev.currentTarget).val() as string;
      this.raiseSelections.set(raiseIndex, { type: 'special', value: specialId });
    });
    
    // Handle roll damage button
    html.find('.roll-damage-btn').on('click', async () => {
      const result = await this.calculateDamage();
      this.resolve(result);
      this.close();
    });
    
    // Handle cancel button
    html.find('.cancel-btn').on('click', () => {
      this.resolve(null);
      this.close();
    });
  }
  
  private async calculateDamage(): Promise<DamageResult> {
    // Roll base damage
    const baseDamage = await this.rollDice(this.data.baseDamage);
    
    // Roll power damage
    const powerDamage = await this.rollDice(this.data.powerDamage || '0');
    
    // Roll passive damage
    const passiveDamage = await this.rollDice(this.data.passiveDamage || '0');
    
    // Calculate raise damage and collect specials
    let raiseDamage = 0;
    const specialsUsed: string[] = [];
    
    for (let i = 0; i < this.data.raises; i++) {
      const selection = this.raiseSelections.get(i);
      if (selection) {
        if (selection.type === 'damage') {
          raiseDamage += await this.rollDice('1d8');
        } else if (selection.type === 'special') {
          const special = this.data.availableSpecials.find(s => s.id === selection.value);
          if (special) {
            specialsUsed.push(special.name);
          }
        }
      }
    }
    
    const totalDamage = baseDamage + powerDamage + passiveDamage + raiseDamage;
    
    return {
      baseDamage,
      powerDamage,
      passiveDamage,
      raiseDamage,
      specialsUsed,
      totalDamage
    };
  }
  
  private async rollDice(diceNotation: string): Promise<number> {
    if (!diceNotation || diceNotation === '0') return 0;
    
    // Parse dice notation (e.g., "2d8+3" or "1d8")
    const match = diceNotation.match(/(\d+)d(\d+)([+-]\d+)?/);
    if (!match) {
      // Try to parse as flat number
      const num = parseInt(diceNotation);
      return isNaN(num) ? 0 : num;
    }
    
    const numDice = parseInt(match[1]);
    const dieSize = parseInt(match[2]);
    const modifier = match[3] ? parseInt(match[3]) : 0;
    
    let total = 0;
    for (let i = 0; i < numDice; i++) {
      total += Math.floor(Math.random() * dieSize) + 1;
    }
    
    return total + modifier;
  }
}
*/