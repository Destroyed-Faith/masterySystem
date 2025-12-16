/**
 * Damage Dialog for Mastery System
 * Appears after successful attack roll to calculate and apply damage
 */
/**
 * Show damage dialog after successful attack
 */
// Helper: Sanitize dice notation - extract dice expression from strings like "3d8 damage" or "Weapon DMG + 1d8"
function sanitizeDiceNotation(str) {
    if (!str || typeof str !== 'string')
        return str || '0';
    // Handle cases like "+3d8" (leading +)
    let cleaned = str.trim();
    if (cleaned.startsWith('+')) {
        cleaned = cleaned.substring(1).trim();
    }
    // Match dice notation patterns: XdY, XdY+Z, XdY-Z, etc.
    const dicePattern = /(\d+d\d+(?:\s*[+\-]\s*\d+)?)/i;
    const match = cleaned.match(dicePattern);
    if (match) {
        // Extract the dice notation and clean up whitespace
        return match[1].replace(/\s+/g, '');
    }
    // If no dice pattern found, try to extract numbers and operators
    // This handles cases like "+3" or "-2" modifiers
    const modifierPattern = /([+\-]\s*\d+)/;
    const modifierMatch = cleaned.match(modifierPattern);
    if (modifierMatch) {
        return modifierMatch[1].replace(/\s+/g, '');
    }
    // Try to match just a number (flat damage)
    const numberPattern = /^\d+$/;
    if (numberPattern.test(cleaned)) {
        return cleaned;
    }
    // Return original if no pattern matches (might be valid notation we don't recognize)
    return cleaned;
}
// Helper: Resolve weapon base damage from weapon system
function resolveWeaponBaseDamage(weapon) {
    if (!weapon || !weapon.system) {
        return '1d8';
    }
    const weaponSystem = weapon.system;
    const baseDamageRaw = weaponSystem.damage ??
        weaponSystem.weaponDamage ??
        weaponSystem.roll?.damage ??
        weaponSystem.damage?.value ??
        weaponSystem.weaponDamage?.value ??
        null;
    if (typeof baseDamageRaw === 'string' && baseDamageRaw.trim().length > 0) {
        return baseDamageRaw.trim();
    }
    else if (baseDamageRaw !== null && baseDamageRaw !== undefined) {
        // Try to stringify if it's an object
        const str = String(baseDamageRaw).trim();
        return str || '1d8';
    }
    return '1d8';
}
export async function showDamageDialog(attacker, target, weaponId, selectedPowerId, raises, flags) {
    // Debug log at entry
    console.log('Mastery System | [WEAPON-ID DEBUG]', {
        messageType: 'damage-dialog:entry',
        weaponIdArg: weaponId,
        selectedPowerIdArg: selectedPowerId,
        raisesArg: raises,
        attackerId: attacker.id,
        targetId: target.id
    });
    console.log('Mastery System | [DAMAGE DIALOG] showDamageDialog - starting', {
        attackerId: attacker.id,
        attackerName: attacker.name,
        targetId: target.id,
        targetName: target.name,
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
    // CRITICAL: Always get fresh actor from game to ensure we have latest items
    // The attacker parameter might be a stale reference
    const freshAttacker = attacker.id ? game.actors?.get(attacker.id) : attacker;
    const actorToUse = freshAttacker || attacker;
    // Load items from fresh actor - use multiple methods to ensure we get all items
    let items = [];
    if (actorToUse && actorToUse.items) {
        if (Array.isArray(actorToUse.items)) {
            items = actorToUse.items;
        }
        else if (actorToUse.items instanceof Map) {
            items = Array.from(actorToUse.items.values());
        }
        else if (actorToUse.items.size !== undefined && actorToUse.items.values) {
            items = Array.from(actorToUse.items.values());
        }
    }
    // Debug: Log all items to see what we have
    console.log('Mastery System | [DAMAGE DIALOG] Items collection', {
        attackerId: attacker.id,
        freshActorId: actorToUse?.id,
        itemsCount: items.length,
        itemsTypes: items.map((i) => ({ id: i.id, name: i.name, type: i.type })),
        actorItemsType: typeof actorToUse?.items,
        actorItemsIsArray: Array.isArray(actorToUse?.items),
        actorItemsIsMap: actorToUse?.items instanceof Map,
        actorItemsSize: actorToUse?.items?.size
    });
    // Resolve weapon: first by ID (try direct lookup first), then fallback to equipped weapon, then first weapon
    let weaponForDamage = null;
    // Method 1: Direct lookup by ID from fresh actor
    if (weaponId && actorToUse) {
        if (actorToUse.items?.get) {
            weaponForDamage = actorToUse.items.get(weaponId);
        }
        else if (Array.isArray(actorToUse.items)) {
            weaponForDamage = actorToUse.items.find((item) => item.id === weaponId);
        }
        else if (actorToUse.items instanceof Map) {
            weaponForDamage = actorToUse.items.get(weaponId);
        }
        if (weaponForDamage) {
            console.log('Mastery System | [DAMAGE DIALOG] Found weapon via direct actor lookup by ID', {
                weaponId: weaponId,
                weaponName: weaponForDamage.name,
                weaponType: weaponForDamage.type
            });
        }
    }
    // Method 1.5: If not found in actor items, try to get it directly from game.items
    if (!weaponForDamage && weaponId) {
        try {
            const weaponItem = game.items?.get(weaponId);
            if (weaponItem && weaponItem.actor?.id === actorToUse?.id) {
                weaponForDamage = weaponItem;
                console.log('Mastery System | [DAMAGE DIALOG] Found weapon via game.items lookup', {
                    weaponId: weaponId,
                    weaponName: weaponForDamage.name,
                    weaponType: weaponForDamage.type,
                    actorId: weaponItem.actor?.id
                });
            }
        }
        catch (e) {
            console.warn('Mastery System | [DAMAGE DIALOG] Error looking up weapon from game.items', e);
        }
    }
    // Method 2: Find in items array by ID
    if (!weaponForDamage && weaponId) {
        weaponForDamage = items.find((item) => item.id === weaponId);
    }
    // Method 3: Find equipped weapon
    if (!weaponForDamage) {
        weaponForDamage = items.find((item) => item.type === 'weapon' && item.system?.equipped === true);
    }
    // Method 4: Find any weapon
    if (!weaponForDamage) {
        weaponForDamage = items.find((item) => item.type === 'weapon');
    }
    // Method 5: Fallback - Look for items with weapon properties (in case type is wrong)
    if (!weaponForDamage) {
        weaponForDamage = items.find((item) => {
            const system = item.system || {};
            return (system.damage || system.weaponDamage || system.weaponType) &&
                (system.equipped === true || item.name?.toLowerCase().includes('axe') || item.name?.toLowerCase().includes('sword') || item.name?.toLowerCase().includes('weapon'));
        });
        if (weaponForDamage) {
            console.warn('Mastery System | [DAMAGE DIALOG] Found weapon-like item with wrong type', {
                itemId: weaponForDamage.id,
                itemName: weaponForDamage.name,
                itemType: weaponForDamage.type,
                hasDamage: !!weaponForDamage.system?.damage,
                hasWeaponDamage: !!weaponForDamage.system?.weaponDamage,
                equipped: weaponForDamage.system?.equipped
            });
        }
    }
    console.log('Mastery System | [DAMAGE DIALOG] Weapon loading', {
        weaponId: weaponId,
        totalItems: items.length,
        weaponItems: items.filter((item) => item.type === 'weapon').length,
        weaponFound: !!weaponForDamage,
        weaponName: weaponForDamage?.name || 'none',
        weaponIdMatch: weaponForDamage ? weaponForDamage.id === weaponId : false,
        allWeaponIds: items.filter((item) => item.type === 'weapon').map((item) => item.id),
        usedFreshActor: !!freshAttacker
    });
    // Resolve base damage using helper (returns string directly)
    const baseDamage = resolveWeaponBaseDamage(weaponForDamage);
    // Sanitize base damage before use
    const sanitizedBaseDamage = sanitizeDiceNotation(baseDamage);
    // Weapon specials should come from the same resolved weapon (only once)
    const weaponSpecials = weaponForDamage?.system?.specials ?? [];
    // Debug log after weapon resolve
    console.log('Mastery System | [WEAPON-ID DEBUG]', {
        messageType: 'damage-dialog:weapon-resolve',
        weaponResolved: !!weaponForDamage,
        weaponName: weaponForDamage?.name || null,
        weaponIdResolved: weaponForDamage?.id || null,
        weaponSystemKeys: weaponForDamage ? Object.keys(weaponForDamage.system || {}) : [],
        baseDamageRaw: baseDamage,
        baseDamageSanitized: sanitizedBaseDamage
    });
    console.log("Mastery System | [DAMAGE DIALOG] Base damage resolved", {
        weaponId,
        weaponFound: !!weaponForDamage,
        weaponName: weaponForDamage?.name,
        baseDamage: baseDamage,
        baseDamageSanitized: sanitizedBaseDamage
    });
    // Load selected power from actor by ID and get its data
    let powerDamage = '0';
    let powerSpecials = [];
    let selectedPowerData = null;
    // Ensure items is an array for power loading too
    let powerItems = [];
    if (attacker.items) {
        if (Array.isArray(attacker.items)) {
            powerItems = attacker.items;
        }
        else if (attacker.items instanceof Map) {
            powerItems = Array.from(attacker.items.values());
        }
        else if (attacker.items.size !== undefined && attacker.items.values) {
            // Foundry Collection-like object
            powerItems = Array.from(attacker.items.values());
        }
        else {
            powerItems = [];
        }
    }
    console.log('Mastery System | [DAMAGE DIALOG] Power loading', {
        selectedPowerId: selectedPowerId,
        hasSelectedPowerId: !!selectedPowerId,
        totalItems: powerItems.length,
        specialItems: powerItems.filter((item) => item.type === 'special').length,
        allSpecialIds: powerItems.filter((item) => item.type === 'special').map((item) => ({
            id: item.id,
            name: item.name,
            powerType: item.system?.powerType
        }))
    });
    // Helper function to clean power damage string (remove "Weapon DMG +" prefix)
    const cleanPowerDamage = (damageStr) => {
        if (!damageStr)
            return '0';
        // Remove "Weapon DMG +" or "Weapon Damage +" prefixes
        return damageStr.replace(/^Weapon\s+(DMG|Damage)\s*\+\s*/i, '').trim() || '0';
    };
    if (selectedPowerId) {
        const selectedPower = items.find((item) => item.id === selectedPowerId);
        console.log('Mastery System | [DAMAGE DIALOG] Power search result', {
            selectedPowerId: selectedPowerId,
            powerFound: !!selectedPower,
            powerName: selectedPower ? selectedPower.name : 'not found',
            powerIdMatch: selectedPower ? selectedPower.id === selectedPowerId : false
        });
        if (selectedPower) {
            const powerSystem = selectedPower.system;
            const powerLevel = powerSystem.level || 1;
            // Try to get level-specific data from power definitions
            let levelData = null;
            try {
                const powersModule = await import('../utils/powers/index.js');
                const powerDefinitions = powersModule.ALL_MASTERY_POWERS || [];
                const powerDef = powerDefinitions.find((p) => p.name === selectedPower.name && p.tree === powerSystem.tree);
                if (powerDef && powerDef.levels) {
                    levelData = powerDef.levels.find((l) => l.level === powerLevel);
                }
            }
            catch (e) {
                console.warn('Mastery System | Could not load power definitions for level data', e);
            }
            // Use level-specific data if available, otherwise fall back to system data
            if (levelData) {
                const rawPowerDamage = levelData.roll?.damage || powerSystem.roll?.damage || '0';
                powerDamage = cleanPowerDamage(rawPowerDamage);
                if (levelData.special) {
                    powerSpecials = levelData.special.split(',').map((s) => s.trim());
                }
                else {
                    powerSpecials = powerSystem.specials || [];
                }
            }
            else {
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
        }
        else {
            console.error('Mastery System | [DAMAGE DIALOG] ERROR: Selected power not found in actor items', {
                selectedPowerId: selectedPowerId,
                totalItems: items.length,
                specialItems: items.filter((item) => item.type === 'special').length,
                allSpecialIds: items.filter((item) => item.type === 'special').map((item) => item.id)
            });
        }
    }
    else {
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
        const damageCardContent = createDamageCardContent(attacker, target, baseDamage, powerDamage, passiveDamage, raises, availableSpecials, weaponSpecials, resolve, selectedPowerData);
        const chatData = {
            user: game.user?.id,
            speaker: ChatMessage.getSpeaker({ actor: attacker }),
            content: damageCardContent,
            style: CONST.CHAT_MESSAGE_STYLES.OTHER,
            flags: {
                'mastery-system': {
                    damageType: 'selection',
                    attackerId: attacker.id,
                    targetId: target.id,
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
        ChatMessage.create(chatData).then((message) => {
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
function createDamageCardContent(attacker, target, baseDamage, powerDamage, passiveDamage, raises, availableSpecials, _weaponSpecials, _resolve, selectedPower) {
    let raisesSection = '';
    if (raises > 0) {
        // Create raise items with all specials directly in the dropdown
        const raiseItems = Array.from({ length: raises }, (_, i) => {
            const raiseIndex = i;
            // Include all available specials directly in the main dropdown
            let specialOptions = '';
            if (availableSpecials.length > 0) {
                specialOptions = availableSpecials.map(special => `<option value="special:${special.id}">${special.name}</option>`).join('');
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
          <strong>${attacker.name}</strong> → <strong>${target.name}</strong>
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
        <button class="roll-damage-btn" data-attacker-id="${attacker.id}" data-target-id="${target.id}">
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
            selectedPower.specials.some((s) => html.includes(s)) : false
    });
    return html;
}
/**
 * Initialize damage card UI and event handlers
 */
function initializeDamageCard(messageId, resolve) {
    const messageElement = $(`.message[data-message-id="${messageId}"]`);
    if (!messageElement.length) {
        console.warn('Mastery System | Could not find damage card message element', messageId);
        return;
    }
    // Handle raise selection changes
    messageElement.find('.raise-selection').on('change', function () {
        const raiseIndex = parseInt($(this).data('raise-index'));
        const selectionType = $(this).val();
        const specialSelect = messageElement.find(`.special-select[data-raise-index="${raiseIndex}"]`);
        if (selectionType === 'damage') {
            specialSelect.hide();
        }
        else if (selectionType === 'special') {
            specialSelect.show();
        }
        else {
            specialSelect.hide();
        }
    });
    // Handle roll damage button
    messageElement.find('.roll-damage-btn').on('click', async function () {
        console.log('Mastery System | [ROLL DAMAGE BUTTON] Button clicked', {
            messageId: messageId,
            buttonData: {
                attackerId: $(this).data('attacker-id'),
                targetId: $(this).data('target-id')
            }
        });
        const attackerId = $(this).data('attacker-id');
        const targetId = $(this).data('target-id');
        const attacker = game.actors?.get(attackerId);
        const target = game.actors?.get(targetId);
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
        const message = game.messages?.get(messageId);
        if (!message) {
            console.error('Mastery System | [ROLL DAMAGE BUTTON] Could not find damage card message', {
                messageId,
                allMessageIds: Array.from(game.messages?.keys() || []).slice(0, 10)
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
        const raiseSelections = new Map();
        messageElement.find('.raise-selection').each(function () {
            const raiseIndex = parseInt($(this).data('raise-index'));
            const selectionValue = $(this).val();
            if (selectionValue === 'damage') {
                raiseSelections.set(raiseIndex, { type: 'damage', value: '1d8' });
            }
            else if (selectionValue && selectionValue.startsWith('special:')) {
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
        const result = await calculateDamageResult(flags.baseDamage, flags.powerDamage, flags.passiveDamage, flags.raises, raiseSelections, flags.availableSpecials, attacker, target);
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
    messageElement.find('.cancel-damage-btn').on('click', function () {
        resolve(null);
    });
}
/**
 * Calculate passive damage bonuses
 */
async function calculatePassiveDamage(_actor) {
    // Note: getPassiveSlots doesn't exist in a separate module
    // For now, skip passive damage calculation until passives module is properly implemented
    console.warn('Mastery System | [DAMAGE DIALOG] getPassiveSlots not available, skipping passive damage');
    return '0';
}
/**
 * Collect all available specials (powers, passives, weapon specials)
 * Now includes power specials (e.g., "Bleeding(3)") as individual options
 */
async function collectAvailableSpecials(actor, weapon, selectedPower) {
    const specials = [];
    const items = actor.items || [];
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
            }
            else {
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
    const attackPowers = items.filter((item) => item.type === 'special' &&
        item.system?.powerType === 'active' &&
        item.system?.canUseOnAttack === true);
    for (const power of attackPowers) {
        const system = power.system;
        specials.push({
            id: power.id,
            name: power.name,
            type: 'power',
            description: system.description || '',
            effect: system.effect || ''
        });
    }
    // Get passives that can be used on attack (from passive slots)
    // Note: getPassiveSlots doesn't exist in a separate module
    // For now, skip passive specials until passives module is properly implemented
    console.warn('Mastery System | [DAMAGE DIALOG] getPassiveSlots not available, skipping passive specials');
    // Get weapon specials (use the weaponSpecials already resolved above, not duplicate)
    // Note: weaponSpecials is already set from weaponForDamage earlier in the function
    if (weapon && weapon.system?.specials) {
        const weaponSpecialsFromWeapon = weapon.system.specials;
        for (const special of weaponSpecialsFromWeapon) {
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
async function applyStatusEffectsToTarget(target, specialsUsed) {
    try {
        console.log('Mastery System | [APPLY STATUS EFFECTS] Applying to target', {
            targetId: target.id,
            targetName: target.name,
            specialsUsed
        });
        // Get current status effects from target
        const system = target.system;
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
                const existingEffect = system.statusEffects.find((e) => e.name === effectName);
                if (existingEffect) {
                    // Update existing effect (e.g., increase stack)
                    if (effectValue !== null) {
                        existingEffect.value = (existingEffect.value || 0) + effectValue;
                    }
                }
                else {
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
        await target.update({ 'system.statusEffects': system.statusEffects });
        console.log('Mastery System | [APPLY STATUS EFFECTS] Status effects applied', {
            targetId: target.id,
            statusEffects: system.statusEffects
        });
    }
    catch (error) {
        console.error('Mastery System | [APPLY STATUS EFFECTS] Error applying status effects', error);
    }
}
/**
 * Apply damage to target actor
 */
async function applyDamageToTarget(target, damage, attacker) {
    try {
        console.log('Mastery System | [APPLY DAMAGE] Applying damage to target', {
            targetId: target.id,
            targetName: target.name,
            attackerId: attacker.id,
            attackerName: attacker.name,
            damage
        });
        // Create blood pool at target token position (if token exists on canvas)
        if (damage > 0 && canvas?.ready) {
            const targetToken = target.getActiveTokens?.()?.[0] ||
                game.scenes?.active?.tokens?.find((t) => t.actor?.id === target.id);
            if (targetToken) {
                try {
                    // Import blood pool function
                    const { createBloodPool } = await import('../utils/blood-pool');
                    // Get blood color from actor
                    const actorSystem = target.system;
                    const bloodColor = actorSystem?.bloodColor;
                    // Create persistent blood pool (as Tile) with custom color
                    await createBloodPool(targetToken, damage, true, bloodColor);
                }
                catch (error) {
                    console.warn('Mastery System | Could not create blood pool', error);
                }
            }
        }
        // Get current health data
        const system = target.system;
        if (!system.health || !system.health.bars || system.health.bars.length === 0) {
            console.error('Mastery System | [APPLY DAMAGE] Target has no health bars', {
                targetId: target.id,
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
                targetId: target.id,
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
        const updateData = {};
        updateData[`system.health.bars.${currentBarIndex}.current`] = newCurrent;
        await target.update(updateData);
        console.log('Mastery System | [APPLY DAMAGE] Damage applied', {
            targetId: target.id,
            targetName: target.name,
            damage,
            oldCurrent,
            newCurrent,
            barIndex: currentBarIndex
        });
        // Refresh the actor sheet if it's open
        const sheet = target.sheet;
        if (sheet && sheet.rendered) {
            sheet.render(false);
        }
    }
    catch (error) {
        console.error('Mastery System | [APPLY DAMAGE] Error applying damage', error);
    }
}
/**
 * Calculate damage result from selections
 */
async function calculateDamageResult(baseDamage, powerDamage, passiveDamage, raises, raiseSelections, availableSpecials, attacker, target) {
    // Roll base damage
    // Sanitize dice notations before rolling
    const sanitizedBaseDamage = sanitizeDiceNotation(baseDamage || '0');
    const sanitizedPowerDamage = sanitizeDiceNotation(powerDamage || '0');
    const sanitizedPassiveDamage = sanitizeDiceNotation(passiveDamage || '0');
    const baseDamageRolled = await rollDice(sanitizedBaseDamage);
    // Roll power damage
    const powerDamageRolled = await rollDice(sanitizedPowerDamage);
    // Roll passive damage
    const passiveDamageRolled = await rollDice(sanitizedPassiveDamage);
    // Calculate raise damage and collect specials
    let raiseDamage = 0;
    const specialsUsed = [];
    for (let i = 0; i < raises; i++) {
        const selection = raiseSelections.get(i);
        if (selection) {
            if (selection.type === 'damage') {
                raiseDamage += await rollDice('1d8');
            }
            else if (selection.type === 'special') {
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
async function rollDice(diceNotation) {
    if (!diceNotation || diceNotation === '0')
        return 0;
    // Sanitize dice notation first (in case it wasn't already sanitized)
    const sanitized = sanitizeDiceNotation(diceNotation);
    // Parse dice notation (e.g., "2d8+3" or "1d8")
    const match = sanitized.match(/(\d+)d(\d+)([+-]\d+)?/);
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
    // Sanitize dice notations before rolling
    const sanitizedBaseDamage = sanitizeDiceNotation(this.data.baseDamage);
    const sanitizedPowerDamage = sanitizeDiceNotation(this.data.powerDamage || '0');
    const sanitizedPassiveDamage = sanitizeDiceNotation(this.data.passiveDamage || '0');
    
    // Roll base damage
    const baseDamage = await this.rollDice(sanitizedBaseDamage);
    
    // Roll power damage
    const powerDamage = await this.rollDice(sanitizedPowerDamage);
    
    // Roll passive damage
    const passiveDamage = await this.rollDice(sanitizedPassiveDamage);
    
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
//# sourceMappingURL=damage-dialog.js.map