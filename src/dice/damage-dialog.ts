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
  type: 'power' | 'passive' | 'weapon' | 'power-special';
  description: string;
  effect?: string;
  value?: number; // For power specials like "Bleeding(3)" where 3 is the value
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
  console.log('Mastery System | [DAMAGE DIALOG] showDamageDialog - starting', {
    attackerId: (attacker as any).id,
    attackerName: (attacker as any).name,
    targetId: (target as any).id,
    targetName: (target as any).name,
    weaponId: weaponId,
    weaponIdType: typeof weaponId,
    weaponIdLength: weaponId ? weaponId.length : 0,
    selectedPowerId: selectedPowerId,
    selectedPowerIdType: typeof selectedPowerId,
    selectedPowerIdLength: selectedPowerId ? selectedPowerId.length : 0,
    raises: raises,
    raisesType: typeof raises,
    raisesIsNumber: typeof raises === 'number',
    raisesValue: raises,
    raisesIsZero: raises === 0,
    hasFlags: !!flags,
    flagsKeys: flags ? Object.keys(flags) : [],
    flagsWeaponId: flags?.weaponId,
    flagsSelectedPowerId: flags?.selectedPowerId,
    flagsRaises: flags?.raises
  });
  
  // Load weapon from actor by ID
  // Handle both Collection and Array
  let items: any[] = [];
  if ((attacker as any).items) {
    if (Array.isArray((attacker as any).items)) {
      items = (attacker as any).items;
    } else if ((attacker as any).items instanceof Map) {
      items = Array.from((attacker as any).items.values());
    } else if ((attacker as any).items.size !== undefined && (attacker as any).items.values) {
      // Foundry Collection-like object
      items = Array.from((attacker as any).items.values());
    } else {
      items = [];
    }
  }
  const weapon = weaponId ? items.find((item: any) => item.id === weaponId) : null;
  
  console.log('Mastery System | [DAMAGE DIALOG] Weapon loading', {
    weaponId: weaponId,
    totalItems: items.length,
    weaponItems: items.filter((item: any) => item.type === 'weapon').length,
    weaponFound: !!weapon,
    weaponName: weapon ? weapon.name : 'none',
    weaponIdMatch: weapon ? weapon.id === weaponId : false,
    allWeaponIds: items.filter((item: any) => item.type === 'weapon').map((item: any) => item.id)
  });
  
  // Find weapon (by ID or fallback to equipped weapon) - use same weapon for both damage and specials
  let weaponForDamage = weapon;
  if (!weaponForDamage && weaponId) {
    // If weapon not found by ID, try to find equipped weapon as fallback
    console.warn('Mastery System | [DAMAGE DIALOG] Weapon not found by ID, trying equipped weapon fallback', { weaponId });
    weaponForDamage = items.find((item: any) => 
      item.type === 'weapon' && (item.system as any)?.equipped === true
    );
    if (weaponForDamage) {
      console.log('Mastery System | [DAMAGE DIALOG] Using equipped weapon as fallback', {
        weaponName: weaponForDamage.name,
        weaponId: weaponForDamage.id
      });
    }
  }
  
  // Calculate base damage from weapon
  // Check both damage and weaponDamage fields, and also check roll.damage
  let baseDamage = '1d8';
  if (weaponForDamage) {
    const weaponSystem = weaponForDamage.system as any;
    // Priority: damage > weaponDamage > roll.damage > default
    baseDamage = weaponSystem?.damage || 
                  weaponSystem?.weaponDamage || 
                  weaponSystem?.roll?.damage || 
                  '1d8';
  }
  
  console.log('Mastery System | [DAMAGE DIALOG] Base damage calculated', {
    weaponId,
    weaponFound: !!weapon,
    weaponForDamageFound: !!weaponForDamage,
    weaponName: weaponForDamage ? weaponForDamage.name : 'none',
    baseDamage: baseDamage,
    weaponSystemDamage: weaponForDamage ? (weaponForDamage.system as any)?.damage : null,
    weaponSystemWeaponDamage: weaponForDamage ? (weaponForDamage.system as any)?.weaponDamage : null,
    weaponSystemRollDamage: weaponForDamage ? (weaponForDamage.system as any)?.roll?.damage : null,
    weaponSystemFull: weaponForDamage ? JSON.stringify(weaponForDamage.system, null, 2) : null
  });
  
  // Get weapon specials - use weaponForDamage (found weapon or fallback)
  const weaponSpecials: string[] = weaponForDamage ? ((weaponForDamage.system as any)?.specials || []) : [];
  console.log('Mastery System | DEBUG: showDamageDialog - weaponSpecials', {
    weaponSpecials,
    weaponName: weaponForDamage ? weaponForDamage.name : 'none',
    weaponSystemSpecials: weaponForDamage ? (weaponForDamage.system as any)?.specials : null,
    weaponSystemFull: weaponForDamage ? JSON.stringify(weaponForDamage.system, null, 2) : null
  });
  
  // Load selected power from actor by ID and get its data
  let powerDamage = '0';
  let powerSpecials: string[] = [];
  let selectedPowerData: any = null;
  
  // Ensure items is an array for power loading too
  let powerItems: any[] = [];
  if ((attacker as any).items) {
    if (Array.isArray((attacker as any).items)) {
      powerItems = (attacker as any).items;
    } else if ((attacker as any).items instanceof Map) {
      powerItems = Array.from((attacker as any).items.values());
    } else if ((attacker as any).items.size !== undefined && (attacker as any).items.values) {
      // Foundry Collection-like object
      powerItems = Array.from((attacker as any).items.values());
    } else {
      powerItems = [];
    }
  }
  
  console.log('Mastery System | [DAMAGE DIALOG] Power loading', {
    selectedPowerId: selectedPowerId,
    hasSelectedPowerId: !!selectedPowerId,
    totalItems: powerItems.length,
    specialItems: powerItems.filter((item: any) => item.type === 'special').length,
    allSpecialIds: powerItems.filter((item: any) => item.type === 'special').map((item: any) => ({
      id: item.id,
      name: item.name,
      powerType: (item.system as any)?.powerType
    }))
  });
  
  // Helper function to clean power damage string (remove "Weapon DMG +" prefix)
  const cleanPowerDamage = (damageStr: string): string => {
    if (!damageStr) return '0';
    // Remove "Weapon DMG +" or "Weapon Damage +" prefixes
    return damageStr.replace(/^Weapon\s+(DMG|Damage)\s*\+\s*/i, '').trim() || '0';
  };
  
  if (selectedPowerId) {
    const selectedPower = items.find((item: any) => item.id === selectedPowerId);
    console.log('Mastery System | [DAMAGE DIALOG] Power search result', {
      selectedPowerId: selectedPowerId,
      powerFound: !!selectedPower,
      powerName: selectedPower ? selectedPower.name : 'not found',
      powerIdMatch: selectedPower ? selectedPower.id === selectedPowerId : false
    });
    
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
        const rawPowerDamage = levelData.roll?.damage || powerSystem.roll?.damage || '0';
        powerDamage = cleanPowerDamage(rawPowerDamage);
        if (levelData.special) {
          powerSpecials = levelData.special.split(',').map((s: string) => s.trim());
        } else {
          powerSpecials = powerSystem.specials || [];
        }
      } else {
        const rawPowerDamage = powerSystem.roll?.damage || '0';
        powerDamage = cleanPowerDamage(rawPowerDamage);
        powerSpecials = powerSystem.specials || [];
      }
      
      selectedPowerData = {
        id: selectedPower.id,
        name: selectedPower.name,
        level: powerLevel,
        specials: powerSpecials,
        damage: powerDamage
      };
      
      console.log('Mastery System | [DAMAGE DIALOG] Power loaded from actor', {
        powerId: selectedPowerId,
        powerName: selectedPower.name,
        powerLevel: powerLevel,
        powerDamage: powerDamage,
        powerSpecials: powerSpecials,
        hasLevelData: !!levelData,
        levelDataSpecial: levelData?.special,
        levelDataDamage: levelData?.roll?.damage,
        systemSpecials: powerSystem.specials,
        systemDamage: powerSystem.roll?.damage
      });
    } else {
      console.error('Mastery System | [DAMAGE DIALOG] ERROR: Selected power not found in actor items', {
        selectedPowerId: selectedPowerId,
        totalItems: items.length,
        specialItems: items.filter((item: any) => item.type === 'special').length,
        allSpecialIds: items.filter((item: any) => item.type === 'special').map((item: any) => item.id)
      });
    }
  } else {
    console.log('Mastery System | [DAMAGE DIALOG] No power selected (selectedPowerId is null/undefined)', {
      selectedPowerId: selectedPowerId,
      selectedPowerIdType: typeof selectedPowerId
    });
  }
  console.log('Mastery System | [DAMAGE DIALOG] Final power damage', {
    powerDamage: powerDamage,
    hasSelectedPower: !!selectedPowerData,
    selectedPowerName: selectedPowerData?.name
  });
  
  // Calculate passive damage (from equipped passives)
  const passiveDamage = await calculatePassiveDamage(attacker);
  console.log('Mastery System | DEBUG: showDamageDialog - passiveDamage', passiveDamage);
  
  // Collect available specials (include power specials from selected power)
  // Use weaponForDamage (found weapon or fallback) to ensure weapon specials are included
  const availableSpecials = await collectAvailableSpecials(attacker, weaponForDamage, selectedPowerData);
  console.log('Mastery System | DEBUG: showDamageDialog - availableSpecials', {
    count: availableSpecials.length,
    specials: availableSpecials.map(s => ({ id: s.id, name: s.name, type: s.type }))
  });
  
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
      console.log('Mastery System | [DAMAGE CARD CREATED] Message flags check', {
        messageId: message.id,
        messageFlags: message.flags,
        masterySystemFlags: message.flags?.['mastery-system'],
        selectedPowerId: message.flags?.['mastery-system']?.selectedPowerId,
        weaponId: message.flags?.['mastery-system']?.weaponId,
        raises: message.flags?.['mastery-system']?.raises
      });
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
    // Create raise items with all specials directly in the dropdown
    const raiseItems = Array.from({ length: raises }, (_, i) => {
      const raiseIndex = i;
      // Include all available specials directly in the main dropdown
      let specialOptions = '';
      if (availableSpecials.length > 0) {
        specialOptions = availableSpecials.map(special => 
          `<option value="special:${special.id}">${special.name}</option>`
        ).join('');
      }
      
      return `
        <div class="raise-item" data-raise-index="${raiseIndex}">
          <label>Raise ${raiseIndex + 1}:</label>
          <select class="raise-selection" data-raise-index="${raiseIndex}">
            <option value="">-- Select --</option>
            <option value="damage">+1d8 Damage</option>
            ${specialOptions}
          </select>
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
  
  console.log('Mastery System | [DAMAGE CARD HTML] createDamageCardContent - values', {
    baseDamage: baseDamage,
    powerDamage: powerDamage,
    passiveDamage: passiveDamage,
    raises: raises,
    raisesType: typeof raises,
    raisesIsNumber: typeof raises === 'number',
    raisesIsGreaterThanZero: raises > 0,
    hasRaisesSection: !!raisesSection,
    raisesSectionLength: raisesSection.length,
    selectedPower: selectedPower ? {
      id: selectedPower.id,
      name: selectedPower.name,
      level: selectedPower.level,
      specials: selectedPower.specials,
      damage: selectedPower.damage,
      specialsCount: selectedPower.specials?.length || 0
    } : null,
    availableSpecialsCount: availableSpecials.length,
    weaponSpecialsCount: _weaponSpecials.length
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
          <i class="fas fa-dice"></i> Roll
        </button>
        <button class="cancel-damage-btn">
          <i class="fas fa-times"></i> Cancel
        </button>
      </div>
    </div>
  `;
  
  console.log('Mastery System | [DAMAGE CARD HTML] Generated HTML', {
    htmlLength: html.length,
    htmlPreview: html.substring(0, 500),
    containsBaseDamage: html.includes(baseDamage),
    containsPowerDamage: html.includes(powerDamage),
    containsRaises: html.includes(`Raises (${raises} available)`),
    containsSelectedPower: selectedPower ? html.includes(selectedPower.name) : false,
    containsPowerSpecials: selectedPower && selectedPower.specials.length > 0 ? 
      selectedPower.specials.some((s: string) => html.includes(s)) : false
  });
  
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
    console.log('Mastery System | [ROLL DAMAGE BUTTON] Button clicked', {
      messageId: messageId,
      buttonData: {
        attackerId: $(this).data('attacker-id'),
        targetId: $(this).data('target-id')
      }
    });
    
    const attackerId = $(this).data('attacker-id');
    const targetId = $(this).data('target-id');
    const attacker = (game as any).actors?.get(attackerId);
    const target = (game as any).actors?.get(targetId);
    
    if (!attacker || !target) {
      console.error('Mastery System | [ROLL DAMAGE BUTTON] Could not find attacker or target', {
        attackerId,
        targetId,
        attackerFound: !!attacker,
        targetFound: !!target
      });
      ui.notifications?.error('Could not find attacker or target');
      return;
    }
    
    const message = (game as any).messages?.get(messageId);
    if (!message) {
      console.error('Mastery System | [ROLL DAMAGE BUTTON] Could not find damage card message', {
        messageId,
        allMessageIds: Array.from((game as any).messages?.keys() || []).slice(0, 10)
      });
      ui.notifications?.error('Could not find damage card message');
      return;
    }
    
    const flags = message.getFlag('mastery-system') || message.flags?.['mastery-system'];
    console.log('Mastery System | [ROLL DAMAGE BUTTON] Flags retrieved', {
      messageId,
      hasFlags: !!flags,
      flagsKeys: flags ? Object.keys(flags) : [],
      baseDamage: flags?.baseDamage,
      powerDamage: flags?.powerDamage,
      passiveDamage: flags?.passiveDamage,
      raises: flags?.raises,
      raisesType: typeof flags?.raises,
      availableSpecials: flags?.availableSpecials?.length || 0
    });
    
    if (!flags) {
      console.error('Mastery System | [ROLL DAMAGE BUTTON] Could not find damage card data', {
        messageId,
        messageFlags: message.flags,
        messageFlagsKeys: Object.keys(message.flags || {})
      });
      ui.notifications?.error('Could not find damage card data');
      return;
    }
    
    // Collect raise selections
    const raiseSelections: Map<number, { type: 'special' | 'damage'; value: string }> = new Map();
    messageElement.find('.raise-selection').each(function() {
      const raiseIndex = parseInt($(this).data('raise-index'));
      const selectionValue = $(this).val() as string;
      if (selectionValue === 'damage') {
        raiseSelections.set(raiseIndex, { type: 'damage', value: '1d8' });
      } else if (selectionValue && selectionValue.startsWith('special:')) {
        const specialId = selectionValue.replace('special:', '');
        raiseSelections.set(raiseIndex, { type: 'special', value: specialId });
      }
    });
    
    console.log('Mastery System | [ROLL DAMAGE BUTTON] Raise selections collected', {
      messageId,
      raiseSelectionsSize: raiseSelections.size,
      raiseSelections: Array.from(raiseSelections.entries())
    });
    
    // Calculate damage
    console.log('Mastery System | [ROLL DAMAGE BUTTON] Calling calculateDamageResult', {
      messageId,
      baseDamage: flags.baseDamage,
      powerDamage: flags.powerDamage,
      passiveDamage: flags.passiveDamage,
      raises: flags.raises,
      raisesType: typeof flags.raises,
      availableSpecialsCount: flags.availableSpecials?.length || 0,
      raiseSelectionsSize: raiseSelections.size
    });
    
    const result = await calculateDamageResult(
      flags.baseDamage,
      flags.powerDamage,
      flags.passiveDamage,
      flags.raises,
      raiseSelections,
      flags.availableSpecials,
      attacker,
      target
    );
    
    console.log('Mastery System | [ROLL DAMAGE BUTTON] calculateDamageResult returned', {
      messageId,
      hasResult: !!result,
      resultKeys: result ? Object.keys(result) : [],
      totalDamage: result?.totalDamage,
      baseDamage: result?.baseDamage,
      powerDamage: result?.powerDamage,
      passiveDamage: result?.passiveDamage
    });
    
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
 * Now includes power specials (e.g., "Bleeding(3)") as individual options
 */
async function collectAvailableSpecials(actor: Actor, weapon: any | null, selectedPower?: any): Promise<SpecialOption[]> {
  const specials: SpecialOption[] = [];
  const items = (actor as any).items || [];
  
  // Get power specials from selected power (e.g., "Bleeding(3)")
  if (selectedPower && selectedPower.specials && selectedPower.specials.length > 0) {
    for (const specialName of selectedPower.specials) {
      // Parse special name like "Bleeding(3)" to extract name and value
      const match = specialName.match(/^([^(]+)(?:\((\d+)\))?$/);
      if (match) {
        const specialNameOnly = match[1].trim();
        const specialValue = match[2] ? parseInt(match[2]) : null;
        specials.push({
          id: `power-special-${specialNameOnly.toLowerCase().replace(/\s+/g, '-')}`,
          name: specialName, // Keep full name like "Bleeding(3)"
          type: 'power-special',
          description: `Power special: ${specialName}`,
          effect: specialName,
          value: specialValue ?? undefined
        });
      } else {
        // Fallback if no match
        specials.push({
          id: `power-special-${specialName.toLowerCase().replace(/\s+/g, '-')}`,
          name: specialName,
          type: 'power-special',
          description: `Power special: ${specialName}`,
          effect: specialName
        });
      }
    }
  }
  
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
 * Apply status effects from specials to target actor
 */
async function applyStatusEffectsToTarget(target: Actor, specialsUsed: string[]): Promise<void> {
  try {
    console.log('Mastery System | [APPLY STATUS EFFECTS] Applying to target', {
      targetId: (target as any).id,
      targetName: (target as any).name,
      specialsUsed
    });
    
    // Get current status effects from target
    const system = (target as any).system;
    if (!system.statusEffects) {
      system.statusEffects = [];
    }
    
    // Add new status effects from specials
    for (const specialName of specialsUsed) {
      // Parse special name like "Bleeding(3)" to extract name and value
      const match = specialName.match(/^([^(]+)(?:\((\d+)\))?$/);
      if (match) {
        const effectName = match[1].trim();
        const effectValue = match[2] ? parseInt(match[2]) : null;
        
        // Check if effect already exists
        const existingEffect = system.statusEffects.find((e: any) => e.name === effectName);
        if (existingEffect) {
          // Update existing effect (e.g., increase stack)
          if (effectValue !== null) {
            existingEffect.value = (existingEffect.value || 0) + effectValue;
          }
        } else {
          // Add new effect
          system.statusEffects.push({
            name: effectName,
            value: effectValue,
            source: 'combat',
            timestamp: Date.now()
          });
        }
      }
    }
    
    // Update target actor
    await (target as any).update({ 'system.statusEffects': system.statusEffects });
    
    console.log('Mastery System | [APPLY STATUS EFFECTS] Status effects applied', {
      targetId: (target as any).id,
      statusEffects: system.statusEffects
    });
  } catch (error) {
    console.error('Mastery System | [APPLY STATUS EFFECTS] Error applying status effects', error);
  }
}

/**
 * Apply damage to target actor
 */
async function applyDamageToTarget(target: Actor, damage: number, attacker: Actor): Promise<void> {
  try {
    console.log('Mastery System | [APPLY DAMAGE] Applying damage to target', {
      targetId: (target as any).id,
      targetName: (target as any).name,
      attackerId: (attacker as any).id,
      attackerName: (attacker as any).name,
      damage
    });
    
    // Create blood pool at target token position (if token exists on canvas)
    if (damage > 0 && canvas?.ready) {
      const targetToken = (target as any).getActiveTokens?.()?.[0] || 
                         (game as any).scenes?.active?.tokens?.find((t: any) => t.actor?.id === (target as any).id);
      
      if (targetToken) {
        try {
          // Import blood pool function
          const { createBloodPool } = await import('../utils/blood-pool');
          // Get blood color from actor
          const actorSystem = (target as any).system;
          const bloodColor = actorSystem?.bloodColor;
          // Create persistent blood pool (as Tile) with custom color
          await createBloodPool(targetToken, damage, true, bloodColor);
        } catch (error) {
          console.warn('Mastery System | Could not create blood pool', error);
        }
      }
    }
    
    // Get current health data
    const system = (target as any).system;
    if (!system.health || !system.health.bars || system.health.bars.length === 0) {
      console.error('Mastery System | [APPLY DAMAGE] Target has no health bars', {
        targetId: (target as any).id,
        hasHealth: !!system.health,
        hasBars: !!(system.health && system.health.bars),
        barsLength: system.health?.bars?.length || 0
      });
      return;
    }
    
    const currentBarIndex = system.health.currentBar || 0;
    const currentBar = system.health.bars[currentBarIndex];
    
    if (!currentBar) {
      console.error('Mastery System | [APPLY DAMAGE] Current health bar not found', {
        targetId: (target as any).id,
        currentBarIndex,
        barsLength: system.health.bars.length
      });
      return;
    }
    
    // Calculate new current HP
    const oldCurrent = currentBar.current;
    const newCurrent = Math.max(oldCurrent - damage, 0);
    currentBar.current = newCurrent;
    
    // Update the actor with the new health
    const updateData: any = {};
    updateData[`system.health.bars.${currentBarIndex}.current`] = newCurrent;
    
    await (target as any).update(updateData);
    
    console.log('Mastery System | [APPLY DAMAGE] Damage applied', {
      targetId: (target as any).id,
      targetName: (target as any).name,
      damage,
      oldCurrent,
      newCurrent,
      barIndex: currentBarIndex
    });
    
    // Refresh the actor sheet if it's open
    const sheet = (target as any).sheet;
    if (sheet && sheet.rendered) {
      sheet.render(false);
    }
  } catch (error) {
    console.error('Mastery System | [APPLY DAMAGE] Error applying damage', error);
  }
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
  availableSpecials: SpecialOption[],
  attacker: Actor,
  target: Actor
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
  
  // Total damage = Base Weapon + Power Damage + Raises (Passives separate)
  const totalDamage = baseDamageRolled + powerDamageRolled + raiseDamage;
  
  console.log('Mastery System | [CALCULATE DAMAGE] Final calculation', {
    baseDamageRolled,
    powerDamageRolled,
    passiveDamageRolled,
    raiseDamage,
    totalDamage,
    specialsUsed,
    calculation: `Base (${baseDamageRolled}) + Power (${powerDamageRolled}) + Raises (${raiseDamage}) = ${totalDamage}`
  });
  
  // Apply status effects from specials to target
  if (specialsUsed.length > 0 && target) {
    await applyStatusEffectsToTarget(target, specialsUsed);
  }
  
  // Apply damage to target
  if (target) {
    await applyDamageToTarget(target, totalDamage, attacker);
  }
  
  const result = {
    baseDamage: baseDamageRolled,
    powerDamage: powerDamageRolled,
    passiveDamage: passiveDamageRolled,
    raiseDamage,
    specialsUsed,
    totalDamage
  };
  
  console.log('Mastery System | [CALCULATE DAMAGE] Returning result', result);
  
  return result;
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