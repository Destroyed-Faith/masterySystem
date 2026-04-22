/**
 * Damage Dialog for Mastery System
 * Appears after successful attack roll to calculate and apply damage
 */
import { getPowerDefinitionRank } from '../utils/power-definition-rank.js';
import { resolveEquippedWeaponForAttackType } from '../utils/equipment-modifiers.js';
import { formatNpcSpecialLabel, getNpcAttackByIndex, npcDamageDiceFormula, npcSpecialEffectString } from '../utils/npc-attack-model.js';
import { previewTempHPConsumption } from '../combat/passive-triggers.js';
import { applyDefensiveMitigation, countNaturalEights } from '../combat/damage-mitigation.js';
/**
 * Show damage dialog after successful attack
 */
// Helper: Sanitize dice notation - extract full Foundry Roll formula from strings
// Supports full formulas like "1d8 + 1d8", "2d8 + 3d8 + 2", "Weapon DMG + 1d8 + 2"
function sanitizeDiceNotation(str) {
    if (!str || typeof str !== 'string')
        return '0';
    let cleaned = str.trim();
    if (!cleaned)
        return '0';
    // Remove prefixes like "Weapon DMG +", "Weapon Damage +"
    cleaned = cleaned.replace(/^Weapon\s+(DMG|Damage)\s*\+\s*/i, '');
    // Remove trailing words like "damage", "dmg" (case-insensitive, whole word)
    cleaned = cleaned.replace(/\s+(damage|dmg)\s*$/i, '');
    // Keep only dice/math chars: digits, d/D, + - * / ( ) and whitespace
    // Replace other chars with space, then collapse whitespace
    cleaned = cleaned.replace(/[^\d\s+dD+\-*/()]/g, ' ');
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    // Strip leading "+" if present
    if (cleaned.startsWith('+')) {
        cleaned = cleaned.substring(1).trim();
    }
    // If nothing remains, return "0"
    if (!cleaned)
        return '0';
    // Return the cleaned formula (can be full expression like "1d8 + 1d8 + 2")
    return cleaned;
}
const MAX_MASTERY_DAMAGE_DICE = 99;
/**
 * Mastery damage uses d8 only: a lone positive integer N (number or digit-only string)
 * means Nd8 (exploding), never N flat. Formulas that already contain dice notation are unchanged.
 */
function masteryCoercePlainNumberToNd8(sanitizedFormula) {
    const t = (sanitizedFormula || '').trim();
    if (!t || t === '0')
        return '0';
    if (/^\d+$/.test(t)) {
        const n = parseInt(t, 10);
        if (!Number.isFinite(n) || n <= 0)
            return '0';
        return `${Math.min(n, MAX_MASTERY_DAMAGE_DICE)}d8x`;
    }
    return t;
}
/** Apply Mastery exploding d8 (Foundry `x`) to Nd8 terms not already marked d8x/d8X. Avoids touching d10, d12, d80, etc. */
function masteryApplyExplodingD8(formula) {
    if (!formula || formula === '0')
        return formula;
    return formula.replace(/(\d+)d8(?![xX0-9])/g, '$1d8x');
}
function weaponOrPowerNumericToNd8(raw) {
    if (typeof raw === 'number' && Number.isFinite(raw)) {
        const n = Math.floor(raw);
        if (n <= 0)
            return '0';
        return `${Math.min(n, MAX_MASTERY_DAMAGE_DICE)}d8x`;
    }
    if (typeof raw === 'string') {
        const tr = raw.trim();
        if (/^\d+$/.test(tr)) {
            const n = parseInt(tr, 10);
            if (n <= 0)
                return '0';
            return `${Math.min(n, MAX_MASTERY_DAMAGE_DICE)}d8x`;
        }
    }
    return null;
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
    const asNd8 = weaponOrPowerNumericToNd8(baseDamageRaw);
    if (asNd8 !== null)
        return asNd8;
    if (typeof baseDamageRaw === 'string' && baseDamageRaw.trim().length > 0) {
        return baseDamageRaw.trim();
    }
    else if (baseDamageRaw !== null && baseDamageRaw !== undefined) {
        const str = String(baseDamageRaw).trim();
        const fromStr = weaponOrPowerNumericToNd8(str);
        if (fromStr !== null)
            return fromStr;
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
    let stoneDamageBonusDice = 0;
    try {
        const { getRoundState } = await import('../combat/action-economy.js');
        const combat = game.combat;
        if (actorToUse && combat) {
            const rs = getRoundState(actorToUse, combat);
            stoneDamageBonusDice = Math.max(0, Number(rs?.stoneBonuses?.damageBonus) || 0);
        }
    }
    catch (e) {
        console.warn('Mastery System | [DAMAGE DIALOG] Could not read Might stone damage bonus', e);
    }
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
    const isNpcAttackFlow = !!(flags?.npcAttackSource === true && actorToUse.type === 'npc');
    // Resolve weapon with priority: equipped melee weapon > equipped weapon > weaponId match > any weapon
    let weaponForDamage = null;
    // Method 1: If weaponId is provided, try to find it first (but verify it's still valid)
    if (!isNpcAttackFlow && weaponId && actorToUse) {
        if (actorToUse.items?.get) {
            weaponForDamage = actorToUse.items.get(weaponId);
        }
        else if (Array.isArray(actorToUse.items)) {
            weaponForDamage = actorToUse.items.find((item) => item.id === weaponId);
        }
        else if (actorToUse.items instanceof Map) {
            weaponForDamage = actorToUse.items.get(weaponId);
        }
        // If found by ID but unequipped, use strict equipped weapon for this attack type only
        if (weaponForDamage && weaponForDamage.system?.equipped !== true) {
            const atk = flags?.attackType === 'ranged' ? 'ranged' : 'melee';
            const strict = resolveEquippedWeaponForAttackType(items, atk);
            if (strict) {
                console.log('Mastery System | [DAMAGE DIALOG] weaponId not equipped; using equipped weapon for attack type', {
                    weaponId,
                    attackType: atk,
                    strictWeaponId: strict.id,
                    strictWeaponName: strict.name
                });
                weaponForDamage = strict;
            }
            else {
                weaponForDamage = null;
            }
        }
        else if (weaponForDamage) {
            console.log('Mastery System | [DAMAGE DIALOG] Found equipped weapon via direct actor lookup by ID', {
                weaponId: weaponId,
                weaponName: weaponForDamage.name,
                weaponType: weaponForDamage.type
            });
        }
    }
    // Method 1.5: If not found in actor items, try to get it directly from game.items
    if (!isNpcAttackFlow && !weaponForDamage && weaponId) {
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
    // Method 2: Find in items array by ID (if not already found)
    if (!isNpcAttackFlow && !weaponForDamage && weaponId) {
        weaponForDamage = items.find((item) => item.id === weaponId);
    }
    // Method 3: Equipped weapon matching attack type (from attack card flags)
    if (!isNpcAttackFlow && !weaponForDamage && flags && (flags.attackType === 'melee' || flags.attackType === 'ranged')) {
        weaponForDamage = resolveEquippedWeaponForAttackType(items, flags.attackType);
        if (weaponForDamage) {
            console.log('Mastery System | [DAMAGE DIALOG] Resolved weapon by attackType', {
                attackType: flags.attackType,
                weaponId: weaponForDamage.id,
                weaponName: weaponForDamage.name
            });
        }
    }
    // Method 4: Legacy — equipped melee, then any equipped (if attackType missing, e.g. old messages)
    if (!isNpcAttackFlow && !weaponForDamage) {
        weaponForDamage = items.find((item) => item.type === 'weapon' &&
            item.system?.equipped === true &&
            item.system?.weaponType === 'melee');
    }
    if (!isNpcAttackFlow && !weaponForDamage) {
        weaponForDamage = items.find((item) => item.type === 'weapon' && item.system?.equipped === true);
    }
    // Method 5: First weapon item on actor (last resort for base damage string)
    if (!isNpcAttackFlow && !weaponForDamage) {
        weaponForDamage = items.find((item) => item.type === 'weapon');
    }
    console.log('Mastery System | [DAMAGE DIALOG] Weapon loading', {
        isNpcAttackFlow,
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
    const baseDamage = isNpcAttackFlow ? '0' : resolveWeaponBaseDamage(weaponForDamage);
    // Sanitize base damage before use
    const sanitizedBaseDamage = sanitizeDiceNotation(baseDamage);
    // Weapon specials should come from the same resolved weapon (only once)
    const weaponSpecials = isNpcAttackFlow
        ? []
        : (weaponForDamage?.system?.specials ?? []);
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
        specialItems: powerItems.filter((item) => item.type === 'power').length,
        allSpecialIds: powerItems.filter((item) => item.type === 'power').map((item) => ({
            id: item.id,
            name: item.name,
            powerType: item.system?.powerType
        }))
    });
    // Helper function to clean power damage string (remove "Weapon DMG +" prefix)
    const cleanPowerDamage = (damageStr) => {
        if (damageStr === null || damageStr === undefined || damageStr === '')
            return '0';
        const raw = typeof damageStr === 'number' ? String(damageStr) : damageStr;
        // Remove "Weapon DMG +" or "Weapon Damage +" prefixes
        const stripped = raw.replace(/^Weapon\s+(DMG|Damage)\s*\+\s*/i, '').trim() || '0';
        const asNd8 = weaponOrPowerNumericToNd8(stripped);
        return asNd8 !== null ? asNd8 : stripped;
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
            const rawLevel = powerSystem.level || 1;
            let levelData = null;
            try {
                const powersModule = await import('../utils/powers/index.js');
                const treeName = powerSystem.tree;
                let powerDef = null;
                if (treeName && powersModule.getPower) {
                    powerDef = powersModule.getPower(treeName, selectedPower.name);
                }
                if (!powerDef) {
                    const defs = powersModule.ALL_MASTERY_POWERS || [];
                    powerDef = defs.find((p) => p.name === selectedPower.name);
                }
                if (powerDef && powerDef.levels) {
                    const definitionRank = getPowerDefinitionRank(rawLevel, powerSystem.levels || powerDef.levels);
                    if (Array.isArray(powerDef.levels)) {
                        levelData = powerDef.levels.find((l) => l.level === definitionRank);
                    }
                    else {
                        levelData = powerDef.levels[String(definitionRank)];
                    }
                }
            }
            catch (e) {
                console.warn('Mastery System | Could not load power definitions for level data', e);
            }
            if (levelData) {
                // New structure: effect.dice holds the bonus dice (e.g. "2d8")
                if (levelData.effect?.dice) {
                    powerDamage = cleanPowerDamage(levelData.effect.dice);
                }
                else if (levelData.roll?.damage) {
                    powerDamage = cleanPowerDamage(levelData.roll.damage);
                }
                else {
                    powerDamage = cleanPowerDamage(powerSystem.roll?.damage || '0');
                }
                // New structure: specials is array of { key, rank?, value? }
                if (levelData.specials && Array.isArray(levelData.specials)) {
                    powerSpecials = levelData.specials.map((s) => typeof s === 'string' ? s :
                        s.value !== undefined ? `${s.key}(${s.value})` :
                            s.rank !== undefined ? `${s.key}(${s.rank})` : s.key);
                }
                else if (levelData.special) {
                    powerSpecials = levelData.special.split(',').map((s) => s.trim());
                }
                else {
                    powerSpecials = powerSystem.specials || [];
                }
            }
            else {
                // Fallback: try effect.dice from item system (set during creation for new powers)
                const effectText = powerSystem.effect || '';
                const diceMatch = effectText.match(/(\d+d\d+)/);
                if (diceMatch) {
                    powerDamage = diceMatch[1];
                }
                else {
                    const rawPowerDamage = powerSystem.roll?.damage || '0';
                    powerDamage = cleanPowerDamage(rawPowerDamage);
                }
                powerSpecials = powerSystem.specials || [];
            }
            selectedPowerData = {
                id: selectedPower.id,
                name: selectedPower.name,
                level: rawLevel,
                specials: powerSpecials,
                damage: powerDamage
            };
            console.log('Mastery System | [DAMAGE DIALOG] Power loaded from actor', {
                powerId: selectedPowerId,
                powerName: selectedPower.name,
                powerLevel: rawLevel,
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
                specialItems: items.filter((item) => item.type === 'power').length,
                allSpecialIds: items.filter((item) => item.type === 'power').map((item) => item.id)
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
    let npcAutoDamageDice = 0;
    const npcAutoSpecialStrings = [];
    const npcLists = buildNpcSpecialOptionsFromActor(actorToUse);
    npcAutoSpecialStrings.push(...npcLists.autoEffectStrings);
    if (isNpcAttackFlow) {
        const atk = getNpcAttackByIndex(actorToUse.system, flags?.npcAttackIndex, flags?.npcPhaseIndex);
        powerDamage = npcDamageDiceFormula(atk);
        npcAutoDamageDice += Math.max(0, Math.floor(Number(atk?.autoRaises) || 0));
        const atkName = String(flags?.npcAttackName || atk?.name || 'NSC-Angriff');
        const inlineSpecials = [];
        if (atk?.special) {
            const eff = npcSpecialEffectString(atk.special, atk.specialValue);
            if (atk.autoApplySpecial) {
                if (eff)
                    npcAutoSpecialStrings.push(eff);
            }
            else if (eff) {
                inlineSpecials.push(eff);
            }
        }
        selectedPowerData = {
            id: 'npc-attack-inline',
            name: atkName,
            level: 1,
            specials: inlineSpecials,
            damage: powerDamage
        };
    }
    const npcAutoNoteLines = [];
    if (npcAutoDamageDice > 0) {
        npcAutoNoteLines.push(`+${npcAutoDamageDice}d8 automatisch`);
    }
    if (npcAutoSpecialStrings.length > 0) {
        npcAutoNoteLines.push(`Speziale: ${npcAutoSpecialStrings.join(', ')}`);
    }
    // Calculate passive damage (from equipped passives)
    const passiveDamage = await calculatePassiveDamage(attacker);
    console.log('Mastery System | DEBUG: showDamageDialog - passiveDamage', passiveDamage);
    // Collect available specials (include power specials from selected power)
    // Use weaponForDamage (found weapon or fallback) to ensure weapon specials are included
    const baseSpecials = await collectAvailableSpecials(actorToUse, weaponForDamage, selectedPowerData);
    const availableSpecials = [...baseSpecials, ...npcLists.options];
    console.log('Mastery System | DEBUG: showDamageDialog - availableSpecials', {
        count: availableSpecials.length,
        specials: availableSpecials.map(s => ({ id: s.id, name: s.name, type: s.type }))
    });
    const weaponInnateLines = weaponForDamage
        ? []
            .concat(weaponForDamage.system?.innateAbilities || [])
            .map((x) => String(x))
        : [];
    // Create damage card as chat message instead of dialog
    return new Promise((resolve) => {
        const damageCardContent = createDamageCardContent(attacker, target, baseDamage, powerDamage, passiveDamage, raises, availableSpecials, weaponSpecials, resolve, selectedPowerData, weaponInnateLines, npcAutoNoteLines);
        // Get targetTokenId if target is a token actor (for unlinked tokens)
        let targetTokenId = null;
        if (target.isToken) {
            // Target is already a token actor, find the token document
            const tokenDoc = canvas?.scene?.tokens?.find((t) => t.actor?.id === target.id);
            if (tokenDoc) {
                targetTokenId = tokenDoc.id;
            }
        }
        else {
            // Target is base actor, try to find token on canvas
            const tokenDoc = canvas?.scene?.tokens?.find((t) => t.actor?.id === target.id);
            if (tokenDoc) {
                targetTokenId = tokenDoc.id;
            }
        }
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
                    targetTokenId: targetTokenId, // Store token ID for proper target resolution
                    weaponId: weaponId,
                    selectedPowerId: selectedPowerId,
                    baseDamage,
                    powerDamage,
                    passiveDamage,
                    raises,
                    stoneDamageBonusDice,
                    availableSpecials,
                    weaponSpecials,
                    npcAutoDamageDice,
                    npcAutoSpecialStrings,
                    npcAttackSource: !!flags?.npcAttackSource,
                    splitAttack: !!flags?.splitAttack,
                    splitIndex: flags?.splitIndex ?? null,
                    splitPairId: flags?.splitPairId ?? null
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
function damageCardHtmlEsc(text) {
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
/**
 * Create HTML content for damage card in chat
 */
function createDamageCardContent(attacker, target, baseDamage, powerDamage, passiveDamage, raises, availableSpecials, _weaponSpecials, _resolve, selectedPower, weaponInnateLines = [], npcAutoNoteLines = []) {
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
        ${npcAutoNoteLines.length > 0
        ? `<div class="damage-row mastery-damage-npc-auto">
          <span class="damage-label">Automatisch:</span>
          <span class="damage-value">${npcAutoNoteLines.map(damageCardHtmlEsc).join(' · ')}</span>
        </div>`
        : ''}
        <div class="damage-row">
          <span class="damage-label">Base Weapon Damage:</span>
          <span class="damage-value">${baseDamage || '0'}</span>
        </div>
        ${weaponInnateLines.length > 0
        ? `<div class="damage-row">
          <span class="damage-label">Weapon innates (reference):</span>
          <span class="damage-value">${weaponInnateLines.map(damageCardHtmlEsc).join(', ')}</span>
        </div>`
        : ''}
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
 * Each raise can spend a given Special at most once across all raise dropdowns.
 */
function refreshRaiseSpecialExclusivity(messageElement) {
    const $selects = messageElement.find(".raise-selection");
    $selects.each(function () {
        const $sel = $(this);
        const myVal = $sel.val() || "";
        const takenElsewhere = new Set();
        $selects.each(function () {
            if (this === $sel[0])
                return;
            const v = $(this).val() || "";
            if (v.startsWith("special:"))
                takenElsewhere.add(v);
        });
        $sel.find("option").each(function () {
            const $opt = $(this);
            const val = $opt.attr("value") || "";
            if (!val.startsWith("special:")) {
                $opt.prop("disabled", false);
                return;
            }
            const blocked = takenElsewhere.has(val) && val !== myVal;
            $opt.prop("disabled", blocked);
        });
        const $chosen = $sel.find("option:selected");
        if ($chosen.length && $chosen.prop("disabled")) {
            $sel.val("");
        }
    });
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
    // Handle raise selection changes (legacy nested special-select + exclusivity for inline specials)
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
        refreshRaiseSpecialExclusivity(messageElement);
    });
    refreshRaiseSpecialExclusivity(messageElement);
    // Handle roll damage button
    messageElement.find('.roll-damage-btn').on('click', async function () {
        console.log('Mastery System | [ROLL DAMAGE BUTTON] Button clicked', {
            messageId: messageId,
            buttonData: {
                attackerId: $(this).data('attacker-id'),
                targetId: $(this).data('target-id')
            }
        });
        const message = game.messages?.get(messageId);
        if (!message) {
            console.error('Mastery System | [ROLL DAMAGE BUTTON] Could not find damage card message', {
                messageId,
                allMessageIds: Array.from(game.messages?.keys() || []).slice(0, 10)
            });
            ui.notifications?.error('Could not find damage card message');
            return;
        }
        // Get flags early so we can use targetTokenId for target resolution
        const flags = message.getFlag('mastery-system') || message.flags?.['mastery-system'];
        const attackerId = $(this).data('attacker-id');
        const targetId = $(this).data('target-id');
        const attacker = game.actors?.get(attackerId);
        // Resolve target: prefer token actor if targetTokenId exists in flags (for unlinked tokens)
        let target = null;
        if (flags?.targetTokenId) {
            // Try to get token document from current scene
            const tokenDoc = canvas?.scene?.tokens?.get(flags.targetTokenId);
            if (tokenDoc?.actor) {
                target = tokenDoc.actor;
                console.log('Mastery System | [ROLL DAMAGE BUTTON] Resolved target from token', {
                    targetTokenId: flags.targetTokenId,
                    targetId: target.id,
                    targetName: target.name,
                    isTokenActor: true
                });
            }
        }
        // Fallback to base actor if token not found
        if (!target) {
            target = game.actors?.get(targetId);
            console.log('Mastery System | [ROLL DAMAGE BUTTON] Resolved target from base actor', {
                targetId: targetId,
                targetName: target ? target.name : null,
                isTokenActor: false
            });
        }
        if (!attacker || !target) {
            console.error('Mastery System | [ROLL DAMAGE BUTTON] Could not find attacker or target', {
                attackerId,
                targetId,
                attackerFound: !!attacker,
                targetFound: !!target,
                targetTokenId: flags?.targetTokenId
            });
            ui.notifications?.error('Could not find attacker or target');
            return;
        }
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
        const result = await calculateDamageResult(flags.baseDamage, flags.powerDamage, flags.passiveDamage, flags.raises, raiseSelections, flags.availableSpecials, attacker, target, Math.max(0, Number(flags.stoneDamageBonusDice) || 0), Math.max(0, Number(flags.npcAutoDamageDice) || 0), Array.isArray(flags.npcAutoSpecialStrings) ? flags.npcAutoSpecialStrings : [], flags.selectedPowerId || null, !!flags.splitAttack);
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
function buildNpcSpecialOptionsFromActor(actor) {
    const options = [];
    const autoEffectStrings = [];
    if (actor.type !== 'npc')
        return { options, autoEffectStrings };
    const sys = actor.system || {};
    const combatSpec = Array.isArray(sys.npcCombatSpecials) ? sys.npcCombatSpecials : [];
    combatSpec.forEach((row, i) => {
        const name = String(row?.name || '').trim() || `Spezial ${i + 1}`;
        const effect = npcSpecialEffectString(name, row?.value);
        const display = formatNpcSpecialLabel(name, row?.value);
        if (row?.auto === true) {
            if (effect)
                autoEffectStrings.push(effect);
        }
        else if (effect) {
            options.push({
                id: `npc-c-${i}`,
                name: `[NSC] ${display}`,
                type: 'npc-combat',
                description: 'NSC-Spezial',
                effect
            });
        }
    });
    const raiseSpec = Array.isArray(sys.npcRaiseSpecials) ? sys.npcRaiseSpecials : [];
    raiseSpec.forEach((row, i) => {
        const name = String(row?.name || '').trim() || `Raise-Spezial ${i + 1}`;
        const effect = npcSpecialEffectString(name, row?.value);
        const display = formatNpcSpecialLabel(name, row?.value);
        if (row?.auto === true) {
            if (effect)
                autoEffectStrings.push(effect);
        }
        else if (effect) {
            options.push({
                id: `npc-r-${i}`,
                name: `[Raise] ${display}`,
                type: 'npc-raise',
                description: 'Für Raises gedacht',
                effect
            });
        }
    });
    return { options, autoEffectStrings };
}
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
    // Get attack powers (powers are stored as type 'power')
    const attackPowers = items.filter((item) => item.type === 'power' &&
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
 * Apply damage to target actor — full defensive pipeline:
 *   Phasing check (Phase 3) → Armor → DR% → 8s-minimum → Temp-HP → Health bars.
 *
 * `count8s` is the number of natural 8s rolled across all damage dice for
 * this strike; `applyDamageToTarget` uses it to enforce the floor rule
 * ("never below count8s if any 8 was rolled").
 */
async function applyDamageToTarget(target, damage, attacker, count8s = 0) {
    const empty = {
        rawDamage: Math.max(0, Math.floor(damage)),
        armorApplied: 0,
        drPercent: 0,
        mitigatedDamage: 0,
        tempHPAbsorbed: 0,
        barDamage: 0,
        min8sUsed: false,
        breakdownLine: '',
        phased: false,
    };
    try {
        console.log('Mastery System | [APPLY DAMAGE] Applying damage to target', {
            targetId: target.id,
            targetName: target.name,
            attackerId: attacker.id,
            attackerName: attacker.name,
            damage,
            count8s,
        });
        // Step 0: Phasing — opt-in prompt for the target owner. If consumed, the
        // strike inflicts no damage and skips all riders (the caller in the attack
        // pipeline is responsible for skipping on-hit specials when phased).
        try {
            const { promptPhasingConsume, consumePhasingCharge } = await import('../combat/phasing.js');
            const phased = await promptPhasingConsume(target, { attacker, rawDamage: damage });
            if (phased) {
                await consumePhasingCharge(target);
                const sheet = target.sheet;
                if (sheet && sheet.rendered)
                    sheet.render(false);
                return {
                    ...empty,
                    phased: true,
                    breakdownLine: `Raw ${empty.rawDamage} → Phased (ignored)`,
                };
            }
        }
        catch (err) {
            // Phasing module not yet loaded or target has no charges — treat as pass.
            console.debug?.('Mastery System | [APPLY DAMAGE] phasing skipped', err);
        }
        // Create blood pool at target token position (if token exists on canvas)
        if (damage > 0 && canvas?.ready) {
            const targetToken = target.getActiveTokens?.()?.[0] ||
                game.scenes?.active?.tokens?.find((t) => t.actor?.id === target.id);
            if (targetToken) {
                try {
                    const { createBloodPool } = await import('../utils/blood-pool.js');
                    const actorSystem = target.system;
                    const bloodColor = actorSystem?.bloodColor;
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
            return empty;
        }
        // Step 1: Flat Armor + percentage DR + 8s-min floor.
        const mitigation = applyDefensiveMitigation({
            rawDamage: damage,
            count8s,
            armorTotal: Number(system.combat?.armorTotal ?? 0),
            damageReductionPct: Number(system.combat?.damageReductionPct ?? 0),
        });
        const mitigated = mitigation.mitigatedDamage;
        // Step 2: Route tempHP reduction through the passive-trigger pool so that
        //         per-source book-keeping (Lean Ward one-shot, Dragon Scales
        //         refresh, …) stays consistent with the scalar mirror. The helper
        //         returns a partial actor-update patch so we can still commit
        //         tempHP + health-bar changes in a single atomic update below.
        const tempHPConsumption = previewTempHPConsumption(target, mitigated);
        const remaining = tempHPConsumption.remainingDamage;
        if (tempHPConsumption.reducedBy > 0) {
            console.log('Mastery System | [APPLY DAMAGE] TempHP absorbed', {
                tempHPBefore: system.health.tempHP,
                tempHPAfter: Math.max(0, (system.health.tempHP || 0) - tempHPConsumption.reducedBy),
                absorbed: tempHPConsumption.reducedBy,
                remaining
            });
        }
        // Step 3: Apply remaining damage to health bars with overflow
        let barDamage = 0;
        if (remaining > 0) {
            barDamage = remaining;
            // Import applyDamage helper from calculations.ts
            const { applyDamage: applyDamageToBars } = await import('../utils/calculations.js');
            // Copy bars array to mutate
            const bars = [...system.health.bars];
            let barIndex = system.health.currentBar || 0;
            // Apply damage using helper function (handles overflow between bars)
            barIndex = applyDamageToBars(bars, barIndex, remaining);
            // Clamp barIndex to valid range
            if (barIndex >= bars.length) {
                barIndex = bars.length - 1;
            }
            // Merge tempHP pool updates with bar updates for a single write.
            await target.update({
                ...tempHPConsumption.patch,
                'system.health.currentBar': barIndex,
                'system.health.bars': bars
            });
            console.log('Mastery System | [APPLY DAMAGE] Damage applied to bars', {
                targetId: target.id,
                targetName: target.name,
                damage,
                remaining,
                tempHPAbsorbed: tempHPConsumption.reducedBy,
                oldBarIndex: system.health.currentBar || 0,
                newBarIndex: barIndex,
                barsAfter: bars.map((b, i) => ({ index: i, current: b.current, max: b.max }))
            });
        }
        else if (Object.keys(tempHPConsumption.patch).length > 0) {
            // Only tempHP was reduced, no bar damage
            await target.update(tempHPConsumption.patch);
            console.log('Mastery System | [APPLY DAMAGE] Only tempHP reduced', {
                targetId: target.id,
                tempHPBefore: system.health.tempHP,
                tempHPAfter: Math.max(0, (system.health.tempHP || 0) - tempHPConsumption.reducedBy),
                damage
            });
        }
        // Refresh the actor sheet if it's open
        const sheet = target.sheet;
        if (sheet && sheet.rendered) {
            sheet.render(false);
        }
        const tail = [];
        if (tempHPConsumption.reducedBy > 0)
            tail.push(`TempHP ${tempHPConsumption.reducedBy}`);
        tail.push(`Bars ${barDamage}`);
        return {
            rawDamage: mitigation.rawDamage,
            armorApplied: mitigation.armorApplied,
            drPercent: mitigation.drPercent,
            mitigatedDamage: mitigation.mitigatedDamage,
            tempHPAbsorbed: tempHPConsumption.reducedBy,
            barDamage,
            min8sUsed: mitigation.min8sUsed,
            breakdownLine: `${mitigation.breakdownLine} → ${tail.join(' → ')}`,
            phased: false,
        };
    }
    catch (error) {
        console.error('Mastery System | [APPLY DAMAGE] Error applying damage', error);
        return empty;
    }
}
/**
 * Calculate damage result from selections
 */
async function calculateDamageResult(baseDamage, powerDamage, passiveDamage, raises, raiseSelections, availableSpecials, attacker, target, stoneDamageBonusDice = 0, npcAutoDamageDice = 0, npcAutoSpecialStrings = [], selectedPowerId = null, splitAttack = false) {
    // Roll base damage
    // Sanitize dice notations before rolling
    const sanitizedBaseDamage = sanitizeDiceNotation(baseDamage || '0');
    const sanitizedPowerDamage = sanitizeDiceNotation(powerDamage || '0');
    const sanitizedPassiveDamage = sanitizeDiceNotation(passiveDamage || '0');
    const rollDetails = [];
    const damageChatRolls = [];
    const baseRoll = await rollDiceWithDetail(sanitizedBaseDamage, 'Base weapon');
    const baseDamageRolled = baseRoll.total;
    if (baseRoll.line)
        rollDetails.push(baseRoll.line);
    if (baseRoll.roll)
        damageChatRolls.push(baseRoll.roll);
    let stoneMightDamageRolled = 0;
    if (stoneDamageBonusDice > 0) {
        const stoneRoll = await rollDiceWithDetail(`${stoneDamageBonusDice}d8`, 'Might stones');
        stoneMightDamageRolled = stoneRoll.total;
        if (stoneRoll.line)
            rollDetails.push(stoneRoll.line);
        if (stoneRoll.roll)
            damageChatRolls.push(stoneRoll.roll);
    }
    const powerRoll = await rollDiceWithDetail(sanitizedPowerDamage, 'Power');
    const powerDamageRolled = powerRoll.total;
    if (powerRoll.line)
        rollDetails.push(powerRoll.line);
    if (powerRoll.roll)
        damageChatRolls.push(powerRoll.roll);
    const passiveRoll = await rollDiceWithDetail(sanitizedPassiveDamage, 'Passive');
    const passiveDamageRolled = passiveRoll.total;
    if (passiveRoll.line)
        rollDetails.push(passiveRoll.line);
    if (passiveRoll.roll)
        damageChatRolls.push(passiveRoll.roll);
    // Calculate raise damage and collect specials
    let raiseDamage = 0;
    const specialsUsed = [];
    let raiseDiceCount = 0;
    for (let i = 0; i < raises; i++) {
        const selection = raiseSelections.get(i);
        if (selection) {
            if (selection.type === 'damage') {
                raiseDiceCount += 1;
                const r = await rollDiceWithDetail('1d8', `Raise ${raiseDiceCount} (+1d8)`);
                raiseDamage += r.total;
                if (r.line)
                    rollDetails.push(r.line);
                if (r.roll)
                    damageChatRolls.push(r.roll);
            }
            else if (selection.type === 'special') {
                const special = availableSpecials.find(s => s.id === selection.value);
                if (special) {
                    specialsUsed.push(special.effect || special.name);
                }
            }
        }
    }
    for (const line of npcAutoSpecialStrings) {
        if (line)
            specialsUsed.push(line);
    }
    let npcAutoDiceIdx = 0;
    for (let j = 0; j < npcAutoDamageDice; j++) {
        npcAutoDiceIdx += 1;
        const r = await rollDiceWithDetail('1d8', `NSC auto (+1d8) #${npcAutoDiceIdx}`);
        raiseDamage += r.total;
        if (r.line)
            rollDetails.push(r.line);
        if (r.roll)
            damageChatRolls.push(r.roll);
    }
    // Conditional damage riders (fires only when the target carries the gated condition).
    let conditionalDamageRolled = 0;
    const conditionalSpecialsUsed = [];
    try {
        const { collectConditionalDamageRiders } = await import('../utils/power-mechanics.js');
        const items = attacker?.items;
        let selectedPower = null;
        if (selectedPowerId && items) {
            selectedPower = items.get?.(selectedPowerId)
                ?? (Array.isArray(items) ? items.find((i) => i.id === selectedPowerId) : null);
        }
        const riders = collectConditionalDamageRiders(attacker, target, selectedPower);
        for (const rider of riders) {
            const r = await rollDiceWithDetail(rider.dice, `${rider.source} vs ${rider.condition}`);
            conditionalDamageRolled += r.total;
            if (r.line)
                rollDetails.push(r.line);
            if (r.roll)
                damageChatRolls.push(r.roll);
            conditionalSpecialsUsed.push(`${rider.source} (+${rider.dice} vs ${rider.condition})`);
        }
    }
    catch (e) {
        console.warn('Mastery System | [CALCULATE DAMAGE] conditional rider eval failed', e);
    }
    // Total damage = Base Weapon + Might stone bonus + Power Damage + Raises + Conditional (Passives separate)
    const totalDamage = baseDamageRolled + stoneMightDamageRolled + powerDamageRolled + raiseDamage + conditionalDamageRolled;
    console.log('Mastery System | [CALCULATE DAMAGE] Final calculation', {
        baseDamageRolled,
        stoneMightDamageRolled,
        stoneDamageBonusDice,
        powerDamageRolled,
        passiveDamageRolled,
        raiseDamage,
        totalDamage,
        specialsUsed,
        rollDetails,
        calculation: `Base (${baseDamageRolled}) + Might stones (${stoneMightDamageRolled}) + Power (${powerDamageRolled}) + Raises (${raiseDamage}) = ${totalDamage}`
    });
    // Apply status effects from specials to target
    if (specialsUsed.length > 0 && target) {
        await applyStatusEffectsToTarget(target, specialsUsed);
    }
    for (const note of conditionalSpecialsUsed)
        specialsUsed.push(note);
    // Count natural 8s across every damage roll we fired above — drives the
    // "never below count8s if any 8 was rolled" floor in the defensive pipeline.
    const count8s = countNaturalEights(damageChatRolls);
    // Split-Attack: each strike deals half damage (floor). Applied after all
    // rolls so that every damage-side modifier (raises, conditional riders,
    // NPC auto-dice, Might stones) contributes to the strike in proportion.
    const appliedDamage = splitAttack ? Math.max(0, Math.floor(totalDamage / 2)) : totalDamage;
    const appliedCount8s = splitAttack ? Math.floor(count8s / 2) : count8s;
    if (splitAttack) {
        console.log('Mastery System | [CALCULATE DAMAGE] Split-Attack halving', {
            rawTotalDamage: totalDamage,
            halvedDamage: appliedDamage,
            rawCount8s: count8s,
            halvedCount8s: appliedCount8s,
        });
    }
    // Apply damage to target
    let mitigation;
    if (target) {
        mitigation = await applyDamageToTarget(target, appliedDamage, attacker, appliedCount8s);
    }
    const result = {
        baseDamage: baseDamageRolled,
        powerDamage: powerDamageRolled,
        passiveDamage: passiveDamageRolled,
        raiseDamage,
        specialsUsed,
        totalDamage: appliedDamage,
        rollDetails: rollDetails.length ? rollDetails : undefined,
        damageChatRolls: damageChatRolls.length ? damageChatRolls : undefined,
        count8s: appliedCount8s,
        mitigation,
    };
    console.log('Mastery System | [CALCULATE DAMAGE] Returning result', result);
    return result;
}
/** Short text of individual dice results for chat (Foundry Roll v13). */
function summarizeRollDiceFaces(roll) {
    const formula = roll?.formula ?? '';
    try {
        const chunks = [];
        for (const term of roll.terms || []) {
            const results = term?.results;
            if (Array.isArray(results) && results.length > 0) {
                const faces = term.faces ?? "?";
                const vals = results
                    .filter((r) => r && r.active !== false)
                    .map((r) => r.result);
                if (vals.length)
                    chunks.push(`${vals.length}d${faces}: [${vals.join(", ")}]`);
            }
        }
        if (chunks.length)
            return `${formula} → ${chunks.join(" + ")}`;
    }
    catch {
        /* ignore */
    }
    return formula || "—";
}
/**
 * Roll one damage pool (Foundry v13+: must evaluate asynchronously — sync mode throws for standard dice).
 */
async function rollDiceWithDetail(diceNotation, label) {
    if (!diceNotation || diceNotation === "0") {
        return { total: 0, line: "", roll: null };
    }
    let formula = sanitizeDiceNotation(diceNotation);
    if (formula === "0") {
        return { total: 0, line: "", roll: null };
    }
    formula = masteryCoercePlainNumberToNd8(formula);
    if (formula === "0") {
        return { total: 0, line: "", roll: null };
    }
    formula = masteryApplyExplodingD8(formula);
    try {
        const RollCtor = globalThis.Roll;
        const roll = new RollCtor(formula);
        await roll.evaluate();
        const total = roll.total ?? 0;
        const detail = summarizeRollDiceFaces(roll);
        const line = `${label}: ${detail} → ${total}`;
        return { total, line, roll };
    }
    catch (error) {
        console.warn("Mastery System | Error rolling dice formula:", formula, error);
        return { total: 0, line: "", roll: null };
    }
}
/**
 * Roll dice from notation string using Foundry Roll
 * Supports full Foundry Roll formulas like "1d8 + 1d8", "2d8 + 3d8 + 2"
 */
async function rollDice(diceNotation) {
    return (await rollDiceWithDetail(diceNotation, "Roll")).total;
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