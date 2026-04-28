/**
 * Attack Executor
 * Creates melee/ranged attack chat cards with proper flags for the roll handler
 */
import { logActorItemSummary } from "../utils/debug-helpers.js";
import { getAttackAttributeForPowerTreeOrSchool } from "../utils/power-roll-attribute.js";
import { resolveEquippedWeaponForAttackType } from "../utils/equipment-modifiers.js";
import { evaluateThreatenedRanged } from "./threatened-ranged.js";
import { formatNpcAttackSpecialsLine, getNpcAttackByIndex, npcAttackDiceCount, npcDamageDiceFormula } from "../utils/npc-attack-model.js";
import { resolvePowerMechanics } from "../utils/power-mechanics.js";
import { RAISE_INCREMENT } from "../utils/constants.js";
import { calculateBaseTN } from "./spell-roll-handler.js";
function newSplitPairId() {
    try {
        if (typeof foundry !== 'undefined' && foundry.utils?.randomID) {
            return foundry.utils.randomID(16);
        }
    }
    catch {
        /* fall through */
    }
    return `split-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;
}
/**
 * Detect whether the selected power declares a Split-Attack. The attack pool
 * and damage pool are split evenly (Math.floor) between two independent
 * strikes sharing one attack-action. See [agent.md] rules for scope.
 */
function detectSplitAttack(option) {
    try {
        if (option.source === 'npc-attack') {
            return !!option.npcSplitAttack;
        }
        if (option.source !== 'power' || !option.item)
            return false;
        const tid = String(option.item.system?.templateId || '');
        if (tid === 'active-melee-weapon-split' || tid === 'active-ranged-weapon-split') {
            return true;
        }
        const mech = resolvePowerMechanics(option.item);
        return mech?.splitAttack === true;
    }
    catch {
        return false;
    }
}
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
function attackCardEsc(text) {
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}
function resolveWeaponForAttack(items, attackType) {
    return resolveEquippedWeaponForAttackType(items, attackType);
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
 * Determine which attribute to use for attack rolls.
 * - Powers: attribute from mastery tree / spell school (`system.tree`) via fixed list; if unknown tree, fall back to `roll.attribute`.
 * - Weapons with Finesse: Agility (melee or ranged).
 * - Otherwise: Might for melee, Agility for ranged (weapon or maneuver).
 */
function getAttackAttribute(_actor, weapon, option, attackType) {
    if (option.source === "power" && option.item) {
        const powerSystem = option.item.system || {};
        // Active-as-Spell: casting attribute on the item beats every other signal.
        if (powerSystem.isSpell && powerSystem.castingAttribute) {
            return String(powerSystem.castingAttribute).toLowerCase();
        }
        const fromTreeOrSchool = getAttackAttributeForPowerTreeOrSchool(powerSystem.tree);
        if (fromTreeOrSchool) {
            return fromTreeOrSchool;
        }
        const attr = powerSystem.roll?.attribute || powerSystem.attribute;
        if (attr) {
            return String(attr).toLowerCase();
        }
    }
    if (option.source === "npc-attack") {
        return attackType === "ranged" ? "agility" : "might";
    }
    if (weapon) {
        const weaponSystem = weapon.system;
        const innateAbilities = weaponSystem.innateAbilities || [];
        const hasFinesse = innateAbilities.some((a) => String(a).toLowerCase().includes("finesse"));
        if (hasFinesse) {
            return "agility";
        }
    }
    return attackType === "ranged" ? "agility" : "might";
}
/**
 * Create a melee or ranged attack chat card with roll button (Threatened Ranged for qualifying ranged attacks).
 */
export async function createAttackCard(attackerToken, targetToken, option, attackType, split = null, burstVolley = null, aoeMelee = null) {
    // Split-Attack dispatcher: when a power declares `mechanics.splitAttack`,
    // we recurse into two strikes sharing one attack action. Pool + damage are
    // halved per strike (floor — odd remainder falls off symmetrically).
    if (!split && !burstVolley && !aoeMelee && detectSplitAttack(option)) {
        const pairId = newSplitPairId();
        // Strike 1 resolves first; Strike 2 is scheduled immediately after so
        // both cards appear in chat for the target owner to resolve.
        await createAttackCard(attackerToken, targetToken, option, attackType, {
            splitPairId: pairId,
            splitIndex: 1,
            attributePool: 0, // recomputed below with the real base pool.
        }, null, null);
        await createAttackCard(attackerToken, targetToken, option, attackType, {
            splitPairId: pairId,
            splitIndex: 2,
            attributePool: 0,
        }, null, null);
        return;
    }
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
    const isNpcAttack = option.source === "npc-attack";
    const npcAttackRow = isNpcAttack
        ? getNpcAttackByIndex(attacker.system, option.npcAttackIndex ?? 0, option.npcPhaseIndex)
        : null;
    if (isNpcAttack) {
        weapon = null;
    }
    let weaponId = weapon?.id ?? null;
    // Set flags with weaponId (always, even if null)
    if (!weapon && !isNpcAttack) {
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
    const attribute = getAttackAttribute(attacker, weapon, option, attackType);
    const poolFromNpc = npcAttackDiceCount(npcAttackRow);
    let attributeValue = isNpcAttack && poolFromNpc > 0 ? poolFromNpc : getAttributeValue(attacker, attribute);
    const masteryRank = getMasteryRank(attacker);
    // Split-Attack: halve the attack pool (floor) on every strike.
    if (split) {
        attributeValue = Math.max(0, Math.floor(attributeValue / 2));
    }
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
    // Base TN: Evade (weapon / martial) or Casting TN from Power Level (Active-as-Spell attack)
    const targetEvadeFromActor = getTargetEvade(target);
    // Get power info if applicable
    let selectedPowerId = null;
    let selectedPowerLevel = null;
    let selectedPowerSpecials = [];
    let selectedPowerDamage = null;
    let tnKind = 'evade';
    let castingBaseTn = null;
    if (option.source === 'power' && option.item) {
        selectedPowerId = option.item.id;
        const powerSystem = option.item.system || {};
        selectedPowerLevel = powerSystem.level || null;
        // Extract specials and damage from option.powerData or embedded item system (damage-card fallback).
        if (option.item.name) {
            const powerData = option.powerData;
            if (powerData) {
                selectedPowerSpecials = powerData.specials || [];
                selectedPowerDamage = powerData.damage || null;
            }
        }
        if (selectedPowerSpecials.length === 0 && Array.isArray(powerSystem.specials)) {
            selectedPowerSpecials = [...powerSystem.specials];
        }
        if (!selectedPowerDamage && powerSystem.roll?.damage != null) {
            selectedPowerDamage = String(powerSystem.roll.damage);
        }
        if (powerSystem.isSpell === true) {
            tnKind = 'casting';
            const lvl = Math.max(1, Math.floor(Number(selectedPowerLevel) || 1));
            castingBaseTn = calculateBaseTN(lvl);
        }
    }
    /** Base TN before declared raises (+4 each). Stored in flags.targetEvade for roll-handler compat. */
    const baseTnBeforeRaises = tnKind === 'casting' && castingBaseTn != null ? castingBaseTn : targetEvadeFromActor;
    const targetEvade = baseTnBeforeRaises;
    const baseEvade = baseTnBeforeRaises;
    const tr = attackType === "ranged"
        ? evaluateThreatenedRanged(attackerToken, option)
        : {
            appliesRule: false,
            threatened: false,
            threateningEnemyTokenIds: [],
            opportunityEnemyTokenIds: [],
            rollDisadvantage: false
        };
    const optionPaysAction = option.costsAction !== false;
    let costsThisCard = optionPaysAction;
    if (burstVolley) {
        costsThisCard = optionPaysAction && burstVolley.volleyIndex === 1;
    }
    else if (split) {
        costsThisCard = optionPaysAction && split.splitIndex === 1;
    }
    const flagsObj = {
        attackType,
        // Split second strike / melee burst follow-up cards do not consume another action on roll.
        costsAction: costsThisCard,
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
        // Split-attack bookkeeping (both strikes carry the same pairId so the
        // damage dialog and chat handlers can render "Strike 1 of 2" markers and
        // halve the damage pool per strike).
        splitAttack: !!split,
        splitIndex: split?.splitIndex ?? null,
        splitPairId: split?.splitPairId ?? null,
        meleeBurstVolleyId: burstVolley?.volleyId ?? null,
        meleeBurstVolleyIndex: burstVolley?.volleyIndex ?? null,
        meleeBurstVolleyTotal: burstVolley?.volleyTotal ?? null,
        aoeMeleeWeapon: !!(aoeMelee && (aoeMelee.secondaryTokenIds?.length ?? 0) > 0),
        aoeMeleeSecondaryTokenIds: aoeMelee && aoeMelee.secondaryTokenIds?.length ? aoeMelee.secondaryTokenIds.join(",") : "",
        aoeMeleePowerBonusDice: aoeMelee && aoeMelee.powerBonusDice > 0 ? Math.floor(aoeMelee.powerBonusDice) : 0,
        threatenedRanged: tr.threatened,
        rollDisadvantage: tr.rollDisadvantage,
        threateningEnemyTokenIds: tr.threateningEnemyTokenIds,
        opportunityEnemyTokenIds: tr.opportunityEnemyTokenIds,
        useNpcAttackDicePool: isNpcAttack,
        npcAttackDicePool: isNpcAttack ? attributeValue : undefined,
        npcAttackSource: isNpcAttack,
        npcAttackIndex: isNpcAttack ? (option.npcAttackIndex ?? 0) : undefined,
        npcPhaseIndex: isNpcAttack ? (option.npcPhaseIndex ?? null) : undefined,
        npcAttackName: isNpcAttack
            ? (npcAttackRow?.name?.trim() || option.name || "NSC-Angriff")
            : undefined,
        tnKind,
        ...(castingBaseTn != null ? { castingBaseTn } : {}),
        targetEvadeFromActor: tnKind === 'casting' ? targetEvadeFromActor : undefined
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
    const baseOptionName = option.name || "Attack";
    const optionName = burstVolley
        ? `${baseOptionName} — Target ${burstVolley.volleyIndex} of ${burstVolley.volleyTotal}`
        : split
            ? `${baseOptionName} — Strike ${split.splitIndex} of 2`
            : aoeMelee && aoeMelee.secondaryTokenIds?.length
                ? `${baseOptionName} (AoE)`
                : baseOptionName;
    const headerIcon = attackType === "ranged" ? "fa-bullseye" : "fa-sword";
    const attackKindLabel = attackType === "ranged" ? "Ranged" : "Melee";
    const innateLines = weapon
        ? [].concat(weapon.system?.innateAbilities || []).map((x) => String(x))
        : [];
    const weaponSpecialLines = weapon
        ? [].concat(weapon.system?.specials || []).map((x) => String(x))
        : [];
    const innatesHtml = innateLines.length > 0
        ? `<div class="detail-row"><span class="detail-label">Weapon innates:</span><span class="detail-value">${innateLines.map(attackCardEsc).join(", ")}</span></div>`
        : "";
    const weaponSpecialsHtml = weaponSpecialLines.length > 0
        ? `<div class="detail-row"><span class="detail-label">Weapon specials:</span><span class="detail-value">${weaponSpecialLines.map(attackCardEsc).join(", ")}</span></div>`
        : "";
    const npcSpecialsLine = isNpcAttack && npcAttackRow ? formatNpcAttackSpecialsLine(npcAttackRow) : "";
    const npcAttackDetailHtml = isNpcAttack && npcAttackRow
        ? `<div class="detail-row"><span class="detail-label">NSC-Pool:</span><span class="detail-value">${attributeValue}d8</span></div>
        <div class="detail-row"><span class="detail-label">Schaden:</span><span class="detail-value">${attackCardEsc(npcDamageDiceFormula(npcAttackRow))}</span></div>
        ${npcAttackRow.armor
            ? `<div class="detail-row"><span class="detail-label">Rüstung:</span><span class="detail-value">${attackCardEsc(String(npcAttackRow.armor))}</span></div>`
            : ""}
        ${npcSpecialsLine
            ? `<div class="detail-row"><span class="detail-label">Spezial:</span><span class="detail-value">${attackCardEsc(npcSpecialsLine)}</span></div>`
            : ""}`
        : "";
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
    const aoeIdsAttr = aoeMelee && aoeMelee.secondaryTokenIds?.length
        ? attackCardEsc(aoeMelee.secondaryTokenIds.join("|"))
        : "";
    const aoeDiceAttr = aoeMelee && aoeMelee.powerBonusDice > 0 ? String(Math.floor(aoeMelee.powerBonusDice)) : "0";
    const aoeMeleeAttr = aoeMelee && aoeMelee.secondaryTokenIds?.length ? "1" : "0";
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
            data-raises="0"
            data-auto-raises="0"
            data-aoe-melee="${aoeMeleeAttr}"
            data-aoe-secondary-ids="${aoeIdsAttr}"
            data-aoe-power-dice="${aoeDiceAttr}">
      <i class="fas fa-dice-d20"></i> Roll
    </button>
  `;
    // Build raises dropdown (1-8)
    const raisesOptions = Array.from({ length: 8 }, (_, i) => {
        const value = i + 1;
        return `<option value="${value}">${value}</option>`;
    }).join('');
    const raisesTitle = tnKind === 'casting'
        ? `Each step adds +${RAISE_INCREMENT} to the Casting TN before the roll (Power Level → Base TN). The same value caps how many Raises may be spent on damage (0 = no cap).`
        : `Each step adds +${RAISE_INCREMENT} to the target Evade TN before the roll. The same value caps how many Raises may be spent on damage (0 = no cap).`;
    const raisesDropdown = `
    <div class="raises-input-group" title="${attackCardEsc(raisesTitle)}">
      <label for="raises-select-${attacker.id}-${target.id}">Raises:</label>
      <select id="raises-select-${attacker.id}-${target.id}" class="raises-select" data-message-id="">
        <option value="0" selected>0</option>
        ${raisesOptions}
      </select>
    </div>
  `;
    // Build auto-raises dropdown (0 to floor(attribute/4)) — each auto-raise
    // removes 4 dice from the pool for a guaranteed +1 raise on success.
    const maxAutoRaises = Math.max(0, Math.floor((attributeValue || 0) / 4));
    const autoRaiseOptions = Array.from({ length: maxAutoRaises }, (_, i) => {
        const value = i + 1;
        return `<option value="${value}">${value} (−${value * 4} dice)</option>`;
    }).join('');
    const autoRaisesDropdown = `
    <div class="raises-input-group auto-raises-input-group" title="Voluntarily shrink your pool by 4 dice per Auto-Raise to get a guaranteed +1 Raise on success.">
      <label for="auto-raises-select-${attacker.id}-${target.id}">Auto-Raises:</label>
      <select id="auto-raises-select-${attacker.id}-${target.id}" class="auto-raises-select" data-message-id="">
        <option value="0" selected>0</option>
        ${autoRaiseOptions}
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
        ${tnKind === 'casting' && castingBaseTn != null
        ? `<div class="detail-row">
          <span class="detail-label">Casting TN:</span>
          <span class="detail-value">${castingBaseTn} (Power Level ${Math.max(1, Math.floor(Number(selectedPowerLevel) || 1))})</span>
        </div>`
        : `<div class="detail-row">
          <span class="detail-label">Target Evade:</span>
          <span class="detail-value">${targetEvade}</span>
        </div>`}
        ${weapon ? `<div class="detail-row"><span class="detail-label">Weapon:</span><span class="detail-value">${attackCardEsc(weapon.name)}</span></div>` : ""}
        ${innatesHtml}
        ${weaponSpecialsHtml}
        ${npcAttackDetailHtml}
        ${selectedPowerId ? `<div class="detail-row"><span class="detail-label">Power:</span><span class="detail-value">${attackCardEsc(option.name)}</span></div>` : ""}
      </div>
      <div class="attack-controls">
        ${raisesDropdown}
        ${autoRaisesDropdown}
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
export async function createMeleeAttackCard(attackerToken, targetToken, option, burstVolley = null, aoeMelee = null) {
    return createAttackCard(attackerToken, targetToken, option, "melee", null, burstVolley, aoeMelee);
}
export async function createRangedAttackCard(attackerToken, targetToken, option) {
    return createAttackCard(attackerToken, targetToken, option, "ranged", null, null, null);
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
            // Each declared raise increases the attack TN by +RAISE_INCREMENT (same
            // step the roll engine uses for margin Raises — was +2, which was wrong).
            const adjustedEvade = baseEvade + raises * RAISE_INCREMENT;
            button.attr('data-target-evade', adjustedEvade.toString());
            console.log('Mastery System | [ATTACK CARD] Raises updated', {
                raises,
                baseEvade,
                adjustedEvade
            });
        });
    }
    // Auto-Raises dropdown — each auto-raise shrinks the pool by 4 dice and
    // grants +1 raise on success. Stored on the roll button as `data-auto-raises`.
    const autoRaisesSelect = messageElement.find('.auto-raises-select');
    if (autoRaisesSelect.length) {
        autoRaisesSelect.attr('data-message-id', messageId);
        autoRaisesSelect.off('change').on('change', function () {
            const autoRaises = Math.max(0, parseInt($(this).val()) || 0);
            const button = messageElement.find('.roll-attack-btn');
            button.attr('data-auto-raises', autoRaises.toString());
            console.log('Mastery System | [ATTACK CARD] Auto-Raises updated', {
                autoRaises,
                diceCost: autoRaises * 4
            });
        });
    }
}
//# sourceMappingURL=attack-executor.js.map