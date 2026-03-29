/**
 * Attack Executor
 * Creates melee/ranged attack chat cards with proper flags for the roll handler
 */
import { logActorItemSummary } from "../utils/debug-helpers.js";
import { evaluateThreatenedRanged } from "./threatened-ranged.js";
/**
 * Safely collect items from actor (handles Collection, Array, Map)
 */
function collectActorItems(actor) {
    if (!actor || !actor.items)
        return [];
    if (Array.isArray(actor.items)) {
        return actor.items;
    }
    else if (actor.items instanceof Map) {
        return Array.from(actor.items.values());
    }
    else if (actor.items.size !== undefined && actor.items.values) {
        // Foundry Collection-like object
        return Array.from(actor.items.values());
    }
    return [];
}
function resolveWeaponForAttack(items, attackType) {
    if (attackType === "ranged") {
        let weapon = items.find((i) => i.type === "weapon" &&
            i.system?.equipped === true &&
            i.system?.weaponType === "ranged");
        if (!weapon) {
            weapon = items.find((i) => i.type === "weapon" && i.system?.weaponType === "ranged");
        }
        if (!weapon) {
            weapon = items.find((i) => i.type === "weapon" && i.system?.equipped === true);
        }
        if (!weapon)
            weapon = items.find((i) => i.type === "weapon");
        return weapon || null;
    }
    let weapon = items.find((i) => i.type === "weapon" &&
        i.system?.equipped === true &&
        i.system?.weaponType === "melee");
    if (!weapon) {
        weapon = items.find((i) => i.type === "weapon" && i.system?.equipped === true);
    }
    if (!weapon) {
        weapon = items.find((i) => i.type === "weapon");
    }
    if (!weapon) {
        weapon = items.find((i) => {
            const system = i.system || {};
            return ((system.damage || system.weaponDamage || system.weaponType) &&
                (system.equipped === true ||
                    i.name?.toLowerCase().includes("axe") ||
                    i.name?.toLowerCase().includes("sword") ||
                    i.name?.toLowerCase().includes("weapon")));
        });
    }
    return weapon || null;
}
/**
 * Get attribute value from actor
 */
function getAttributeValue(actor, attributeName) {
    if (!actor || !actor.system) {
        console.warn('Mastery System | [ATTACK EXECUTOR] getAttributeValue: No actor or system', {
            hasActor: !!actor,
            hasSystem: !!actor?.system,
            attributeName
        });
        return 0;
    }
    const system = actor.system;
    const attributes = system.attributes || {};
    const attrKey = attributeName.toLowerCase();
    const attr = attributes[attrKey] || {};
    const value = attr.value ?? attr.stones ?? 0;
    // Debug logging
    if (value === 0 || value < 2) {
        console.warn('Mastery System | [ATTACK EXECUTOR] getAttributeValue: Low or zero value detected', {
            attributeName,
            attrKey,
            attr,
            value,
            allAttributes: Object.keys(attributes),
            attributesData: attributes
        });
    }
    return value;
}
/**
 * Get mastery rank from actor
 */
function getMasteryRank(actor) {
    if (!actor || !actor.system)
        return 2; // Default
    const system = actor.system;
    if (system.mastery?.rank) {
        return system.mastery.rank;
    }
    // Fallback to settings
    const playerMasteryRanks = game.settings?.get('mastery-system', 'playerMasteryRanks') || {};
    const defaultMasteryRank = game.settings?.get('mastery-system', 'defaultMasteryRank') || 2;
    const playerId = actor.getFlag?.('mastery-system', 'playerId') || actor.ownership?.default || '';
    return playerMasteryRanks[playerId] || defaultMasteryRank;
}
/**
 * Get evade value from target actor
 * Uses evadeTotal if available (includes shield bonus), otherwise falls back to base evade
 */
function getTargetEvade(targetActor) {
    if (!targetActor || !targetActor.system)
        return 6; // Default
    const system = targetActor.system;
    const combat = system.combat || {};
    return combat.evadeTotal ?? combat.evade ?? 6;
}
/**
 * Determine which attribute to use for attack
 */
function getAttackAttribute(_actor, weapon, option) {
    if (option.source === 'power' && option.item) {
        const powerSystem = option.item.system || {};
        const attr = powerSystem.roll?.attribute || powerSystem.attribute;
        if (attr) {
            return attr.toLowerCase();
        }
    }
    // Check weapon for Finesse (uses Agility)
    if (weapon) {
        const weaponSystem = weapon.system;
        const innateAbilities = weaponSystem.innateAbilities || [];
        const hasFinesse = innateAbilities.some((a) => a.toLowerCase().includes('finesse'));
        if (hasFinesse) {
            return 'agility';
        }
    }
    // Default to Might for melee attacks
    return 'might';
}
/**
 * Create a melee or ranged attack chat card with roll button (Threatened Ranged for qualifying ranged attacks).
 */
export async function createAttackCard(attackerToken, targetToken, option, attackType) {
    // Use token actor (for unlinked tokens) or base actor
    // For unlinked tokens, token.actor is a synthetic actor with delta data
    // For linked tokens, token.actor is the base actor
    const attacker = attackerToken.actor;
    const target = targetToken.actor;
    // For unlinked tokens, we might need to merge token delta with base actor data
    // But for now, use the token actor as-is and let the debug logs show what's happening
    const isUnlinked = attackerToken.actorLink === false;
    const baseActorId = attackerToken.actorLink ? null : attackerToken.actorId;
    const baseActor = baseActorId ? game.actors?.get(baseActorId) : null;
    // Debug: Log actor information
    console.log('Mastery System | [ATTACK EXECUTOR] Actor resolution', {
        attackerTokenId: attackerToken.id,
        attackerActorId: attacker?.id,
        attackerActorType: attacker?.type,
        attackerName: attacker?.name,
        isUnlinked: isUnlinked,
        baseActorId: baseActorId,
        baseActorName: baseActor?.name,
        tokenActorMight: attacker?.system?.attributes?.might?.value,
        baseActorMight: baseActor?.system?.attributes?.might?.value,
        actorSystem: attacker?.system?.attributes
    });
    if (!attacker || !target) {
        console.error('Mastery System | [ATTACK EXECUTOR] Missing actor data', {
            hasAttacker: !!attacker,
            hasTarget: !!target
        });
        return;
    }
    // Log actor item summary for diagnostics
    logActorItemSummary(attacker, 'attack-card:create');
    const items = collectActorItems(attacker);
    let weapon = resolveWeaponForAttack(items, attackType);
    if (!weapon && attackType === "melee") {
        weapon = items.find((i) => {
            const system = i.system || {};
            return ((system.damage || system.weaponDamage || system.weaponType) &&
                (system.equipped === true ||
                    i.name?.toLowerCase().includes("axe") ||
                    i.name?.toLowerCase().includes("sword") ||
                    i.name?.toLowerCase().includes("weapon")));
        });
        if (weapon) {
            console.warn("Mastery System | [ATTACK EXECUTOR] Found weapon-like item with wrong type", {
                itemId: weapon.id,
                itemName: weapon.name,
                itemType: weapon.type
            });
        }
    }
    const weaponId = weapon?.id ?? null;
    // Set flags with weaponId (always, even if null)
    if (!weapon) {
        console.warn('Mastery System | [ATTACK EXECUTOR] Actor has no weapon items; baseDamage will fallback.', {
            attackerId: attacker.id,
            attackerName: attacker.name,
            totalItems: items.length,
            itemTypes: Object.keys(items.reduce((acc, item) => {
                const type = item.type || 'unknown';
                acc[type] = (acc[type] || 0) + 1;
                return acc;
            }, {}))
        });
    }
    console.log('Mastery System | [ATTACK EXECUTOR] Weapon resolution', {
        attackerId: attacker.id,
        totalItems: items.length,
        weaponItems: items.filter((i) => i.type === 'weapon').length,
        weaponFound: !!weapon,
        weaponId: weaponId,
        weaponName: weapon?.name || null
    });
    // Determine attack attribute
    const attribute = getAttackAttribute(attacker, weapon, option);
    const attributeValue = getAttributeValue(attacker, attribute);
    const masteryRank = getMasteryRank(attacker);
    // Debug: Log attribute reading
    console.log('Mastery System | [ATTACK EXECUTOR] Attribute calculation', {
        attribute,
        attributeValue,
        masteryRank,
        attackerId: attacker.id,
        attackerName: attacker.name,
        actorSystem: attacker.system?.attributes,
        mightValue: attacker.system?.attributes?.might?.value,
        mightStones: attacker.system?.attributes?.might?.stones
    });
    // Get target evade
    const targetEvade = getTargetEvade(target);
    const baseEvade = targetEvade;
    // Get power info if applicable
    let selectedPowerId = null;
    let selectedPowerLevel = null;
    let selectedPowerSpecials = [];
    let selectedPowerDamage = null;
    if (option.source === 'power' && option.item) {
        selectedPowerId = option.item.id;
        const powerSystem = option.item.system || {};
        selectedPowerLevel = powerSystem.level || null;
        // Extract specials and damage from power data
        if (option.item.name) {
            // Try to get from option data if available
            const powerData = option.powerData;
            if (powerData) {
                selectedPowerSpecials = powerData.specials || [];
                selectedPowerDamage = powerData.damage || null;
            }
        }
    }
    const tr = attackType === "ranged"
        ? evaluateThreatenedRanged(attackerToken, option)
        : {
            appliesRule: false,
            threatened: false,
            threateningEnemyTokenIds: [],
            opportunityEnemyTokenIds: [],
            rollDisadvantage: false
        };
    const flagsObj = {
        attackType,
        attackerId: attacker.id,
        targetId: target.id,
        targetTokenId: targetToken.id,
        attribute: attribute,
        attributeValue: attributeValue,
        masteryRank: masteryRank,
        targetEvade: targetEvade,
        baseEvade: baseEvade,
        weaponId: weaponId,
        selectedPowerId: selectedPowerId,
        selectedPowerLevel: selectedPowerLevel,
        selectedPowerSpecials: selectedPowerSpecials,
        selectedPowerDamage: selectedPowerDamage || "",
        threatenedRanged: tr.threatened,
        rollDisadvantage: tr.rollDisadvantage,
        threateningEnemyTokenIds: tr.threateningEnemyTokenIds,
        opportunityEnemyTokenIds: tr.opportunityEnemyTokenIds
    };
    // Debug log before creating message
    const weaponCandidateFromEquipped = weapon;
    console.log('Mastery System | [WEAPON-ID DEBUG]', {
        messageType: 'attack-card:create:before',
        attackerId: attacker.id,
        targetId: target.id,
        weaponId: weaponId,
        selectedPowerId: selectedPowerId,
        raises: 0,
        flagsKeys: Object.keys(flagsObj),
        weaponCandidateFromEquipped: weaponCandidateFromEquipped ? {
            id: weaponCandidateFromEquipped.id,
            name: weaponCandidateFromEquipped.name,
            type: weaponCandidateFromEquipped.type
        } : null
    });
    const attackerName = attacker.name || "Unknown";
    const targetName = target.name || "Unknown";
    const optionName = option.name || "Attack";
    const headerIcon = attackType === "ranged" ? "fa-bullseye" : "fa-sword";
    const attackKindLabel = attackType === "ranged" ? "Ranged" : "Melee";
    const oppNames = tr.opportunityEnemyTokenIds
        .map((id) => canvas.tokens?.get(id)?.name)
        .filter(Boolean);
    const threatenedHtml = tr.threatened
        ? `<div class="mastery-threatened-ranged" style="border-left:4px solid #c0392b;padding:8px;margin:8px 0;background:rgba(192,57,43,0.08);">
          <p><strong>Threatened Ranged</strong></p>
          <p><strong>Disadvantage:</strong> keep one fewer die on the attack roll.</p>
          <p>After this declaration, these enemies in <em>your</em> melee reach may spend a <strong>Reaction</strong> for an <strong>Opportunity Attack</strong> against you: <strong>${oppNames.length ? oppNames.join(", ") : "(none in reach)"}</strong></p>
        </div>`
        : "";
    const buttonHtml = `
    <button class="roll-attack-btn" 
            data-attacker-id="${attacker.id}"
            data-target-id="${target.id}"
            data-target-token-id="${targetToken.id}"
            data-attribute="${attribute}"
            data-attribute-value="${attributeValue}"
            data-mastery-rank="${masteryRank}"
            data-target-evade="${targetEvade}"
            data-base-evade="${baseEvade}"
            data-raises="0">
      <i class="fas fa-dice-d20"></i> Roll
    </button>
  `;
    // Build raises dropdown (1-8)
    const raisesOptions = Array.from({ length: 8 }, (_, i) => {
        const value = i + 1;
        return `<option value="${value}">${value}</option>`;
    }).join('');
    const raisesDropdown = `
    <div class="raises-input-group">
      <label for="raises-select-${attacker.id}-${target.id}">Raises:</label>
      <select id="raises-select-${attacker.id}-${target.id}" class="raises-select" data-message-id="">
        <option value="0" selected>0</option>
        ${raisesOptions}
      </select>
    </div>
  `;
    const content = `
    <div class="mastery-attack-card">
      <div class="attack-header">
        <h3><i class="fas ${headerIcon}"></i> ${optionName}</h3>
        <p class="attack-participants"><strong>${attackerName}</strong> → <strong>${targetName}</strong></p>
      </div>
      ${threatenedHtml}
      <div class="attack-details">
        <div class="detail-row">
          <span class="detail-label">Attack:</span>
          <span class="detail-value">${attackKindLabel}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Attribute:</span>
          <span class="detail-value">${attribute.charAt(0).toUpperCase() + attribute.slice(1)} (${attributeValue})</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Mastery Rank:</span>
          <span class="detail-value">${masteryRank}</span>
        </div>
        ${tr.rollDisadvantage
        ? `<div class="detail-row"><span class="detail-label">Disadvantage:</span><span class="detail-value">Yes (Threatened Ranged)</span></div>`
        : ""}
        <div class="detail-row">
          <span class="detail-label">Target Evade:</span>
          <span class="detail-value">${targetEvade}</span>
        </div>
        ${weapon ? `<div class="detail-row"><span class="detail-label">Weapon:</span><span class="detail-value">${weapon.name}</span></div>` : ""}
        ${selectedPowerId ? `<div class="detail-row"><span class="detail-label">Power:</span><span class="detail-value">${option.name}</span></div>` : ""}
      </div>
      <div class="attack-controls">
        ${raisesDropdown}
        ${buttonHtml}
      </div>
    </div>
  `;
    // Create chat message
    const speaker = ChatMessage.getSpeaker({
        actor: attacker,
        token: attackerToken.document
    });
    try {
        const message = await ChatMessage.create({
            speaker,
            content,
            style: CONST.CHAT_MESSAGE_STYLES.OTHER,
            flags: {
                'mastery-system': flagsObj
            }
        });
        console.log("Mastery System | [WEAPON-ID DEBUG]", {
            messageType: "attack-card:create:after",
            messageId: message.id,
            createdFlags: message.flags?.["mastery-system"]
        });
        if (tr.threatened) {
            Hooks.call("masterySystem.threatenedRangedDeclared", {
                attackerTokenId: attackerToken.id,
                attackerActorId: attacker.id,
                threateningEnemyTokenIds: tr.threateningEnemyTokenIds,
                opportunityEnemyTokenIds: tr.opportunityEnemyTokenIds,
                targetTokenId: targetToken.id,
                optionId: option.id
            });
            ui.notifications?.info?.(`Threatened Ranged: Nachteil auf den Fernangriff. Gelegenheitsangriff (Reaktion) für: ${oppNames.join(", ") || "—"}`);
        }
        if (message) {
            const messageId = message.id;
            // Wait a bit for the DOM to be ready
            setTimeout(() => {
                const messageElement = $(`.message[data-message-id="${messageId}"]`);
                if (messageElement.length === 0) {
                    // Try alternative selector
                    const altElement = $(`[data-message-id="${messageId}"]`);
                    if (altElement.length) {
                        setupRaisesHandler(altElement, messageId, baseEvade);
                    }
                }
                else {
                    setupRaisesHandler(messageElement, messageId, baseEvade);
                }
            }, 100);
        }
        console.log("Mastery System | [ATTACK EXECUTOR] Attack card created", {
            attackType,
            attackerId: attacker.id,
            targetId: target.id,
            optionId: option.id,
            attribute,
            attributeValue,
            masteryRank,
            targetEvade,
            threatenedRanged: tr.threatened
        });
    }
    catch (error) {
        console.error("Mastery System | [ATTACK EXECUTOR] Failed to create attack card", error);
        ui.notifications?.error("Failed to create attack card");
    }
}
export async function createMeleeAttackCard(attackerToken, targetToken, option) {
    return createAttackCard(attackerToken, targetToken, option, "melee");
}
export async function createRangedAttackCard(attackerToken, targetToken, option) {
    return createAttackCard(attackerToken, targetToken, option, "ranged");
}
/**
 * Setup raises dropdown change handler
 */
function setupRaisesHandler(messageElement, messageId, baseEvade) {
    const raisesSelect = messageElement.find('.raises-select');
    if (raisesSelect.length) {
        raisesSelect.attr('data-message-id', messageId);
        // Add change handler to update button data-raises
        raisesSelect.off('change').on('change', function () {
            const raises = parseInt($(this).val()) || 0;
            const button = messageElement.find('.roll-attack-btn');
            button.attr('data-raises', raises.toString());
            // Update target-evade based on raises (each raise adds +2 to TN)
            const adjustedEvade = baseEvade + (raises * 2);
            button.attr('data-target-evade', adjustedEvade.toString());
            console.log('Mastery System | [ATTACK CARD] Raises updated', {
                raises,
                baseEvade,
                adjustedEvade
            });
        });
    }
}
//# sourceMappingURL=attack-executor.js.map