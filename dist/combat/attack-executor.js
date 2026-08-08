/**
 * Attack Executor
 * Creates melee/ranged attack chat cards with proper flags for the roll handler
 */
import { getAttackAttributeForPowerTreeOrSchool } from "../utils/power-roll-attribute.js";
import { resolveEquippedWeaponForAttackType } from "../utils/equipment-modifiers.js";
import { artifactToVirtualWeapon, createVirtualUnarmedWeapon, isVirtualUnarmedWeapon } from "../utils/unarmed-fallback.js";
import { evaluateThreatenedRanged } from "./threatened-ranged.js";
import { bandsFromNpcShortLong, rangeTextFromBands } from "../utils/range-bands.js";
import { formatNpcAttackSpecialsLine, getNpcAttackByIndex, npcAttackDiceCount, npcDamageDiceFormula } from "../utils/npc-attack-model.js";
import { resolvePowerMechanics } from "../utils/power-mechanics.js";
import { formatEffectReference } from "../utils/special-effects.js";
import { parseD8Count } from "../utils/dice-formula.js";
import { RAISE_INCREMENT } from "../utils/constants.js";
import { calculateBaseTN } from "./spell-roll-handler.js";
import { artifactLevelToTemplateRank } from "../utils/artifact-spell-pick.js";
import { buildAvailableRaiseOptions, computeRaiseTns, countRaiseSlots, declaredRaiseFromOptionId, formatSnapshotSummary, loadPowerSnapshotForArtifactOption, loadPowerSnapshotForItem, previewAfterRaiseCost, } from "./raise-resolution.js";
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
 * On-hit preview for the raise panel: weapon dice + power dice as a total
 * (e.g. "9d8 total (5d8 weapon + 4d8 power), Sundered(2)"). With no weapon
 * dice (spells, unarmed flat damage) this is the plain power snapshot summary.
 */
function formatOnHitSummary(snapshot, weaponDice) {
    const summary = formatSnapshotSummary(snapshot);
    const w = Math.max(0, Math.floor(weaponDice ?? 0));
    if (w <= 0)
        return summary;
    const p = Math.max(0, Math.floor(snapshot.damageDice));
    const totalPart = `${w + p}d8 total (${w}d8 weapon${p > 0 ? ` + ${p}d8 power` : ''})`;
    let rest = summary === '—' ? '' : summary;
    if (p > 0 && rest.startsWith(`${p}d8`)) {
        rest = rest.slice(`${p}d8`.length).replace(/^,\s*/, '');
    }
    return rest ? `${totalPart}, ${rest}` : totalPart;
}
/**
 * Get attribute value from actor
 */
export function getAttributeValue(actor, attributeName) {
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
export function getMasteryRank(actor) {
    if (!actor || !actor.system)
        return 2; // Default
    const system = actor.system;
    const rank = Math.floor(Number(system.mastery?.rank) || 0);
    if (rank >= 1)
        return Math.min(8, rank);
    const defaultMasteryRank = game.settings?.get('mastery-system', 'defaultMasteryRank') || 2;
    return Math.max(1, Math.min(8, Math.floor(Number(defaultMasteryRank) || 2)));
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
    const base = combat.evadeTotal ?? combat.evade ?? 6;
    const buffBonus = Number(combat.evadeFromActiveBuffs ?? 0);
    return base + buffBonus;
}
/** Spell Resistance from Ward passives + active buffs + Intellect stone (vs Spell-tagged Powers). */
function getTargetSpellResistance(targetActor) {
    if (!targetActor?.system)
        return 0;
    const combat = targetActor.system.combat ?? {};
    let stoneBonus = 0;
    try {
        const rs = targetActor.getFlag?.('mastery-system', 'roundState');
        stoneBonus = Math.max(0, Math.floor(Number(rs?.stoneBonuses?.spellResistanceBonus ?? 0) || 0));
    }
    catch {
        /* ignore */
    }
    return Math.max(0, Math.floor(Number(combat.spellResistanceTotal ?? 0) || 0)
        + Math.floor(Number(combat.spellResistanceFromActiveBuffs ?? 0) || 0)
        + stoneBonus);
}
/** True when the wielded weapon (real or artifact-virtual) has the Finesse innate. */
function weaponHasFinesse(weapon) {
    if (!weapon)
        return false;
    const innateAbilities = weapon.system?.innateAbilities || [];
    return innateAbilities.some((a) => String(a).toLowerCase().includes("finesse"));
}
/**
 * Determine which attribute to use for attack rolls.
 * - Spells: casting attribute on the item / option.
 * - Weapons with Finesse (incl. artifact Free Trait): Agility for To-Hit —
 *   also for weapon-carried attack powers (Melee Single Attack, Smite, …),
 *   where it beats the mastery-tree default (rules: "Attack Roll uses Agility").
 * - Powers: attribute from mastery tree / spell school (`system.tree`) via fixed list; if unknown tree, fall back to `roll.attribute`.
 * - Otherwise: Might for melee, Agility for ranged (weapon or maneuver).
 */
export function getAttackAttribute(_actor, weapon, option, attackType) {
    if (option.source === "power" && option.item) {
        const powerSystem = option.item.system || {};
        const artifactIsSpell = option.artifactIsSpell === true;
        // Active-as-Spell: casting attribute on the item beats every other signal.
        if (artifactIsSpell && option.artifactCastingAttribute) {
            return String(option.artifactCastingAttribute).toLowerCase();
        }
        if (powerSystem.isSpell && powerSystem.castingAttribute) {
            return String(powerSystem.castingAttribute).toLowerCase();
        }
        // Non-spell attack powers are weapon-carried (they roll the equipped
        // weapon's dice), so a Finesse weapon swaps the To-Hit to Agility even
        // when the mastery tree would default to Might.
        if (!artifactIsSpell && powerSystem.isSpell !== true && weaponHasFinesse(weapon)) {
            return "agility";
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
    if (weaponHasFinesse(weapon)) {
        return "agility";
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
    if (!attacker || !target) {
        console.error('Mastery System | [ATTACK EXECUTOR] Missing actor data', {
            hasAttacker: !!attacker,
            hasTarget: !!target
        });
        return;
    }
    // Log actor item summary for diagnostics
    const items = collectActorItems(attacker);
    let weapon = resolveWeaponForAttack(items, attackType);
    // Forced weapon (e.g. an artifact natural weapon like the Dragon Head Bite):
    // build a weapon-shaped object from the artifact's `artifactWeapon` profile so
    // this attack always uses it regardless of any conventional weapon equipped.
    const forcedWeaponItemId = option.forcedWeaponItemId;
    if (forcedWeaponItemId) {
        const forcedItem = items.find((i) => i.id === forcedWeaponItemId);
        if (forcedItem) {
            if (forcedItem.type === 'artifact') {
                // Handles both baked `artifactWeapon` blobs and damage derived live
                // from the base profile (e.g. bound general artifact weapons).
                const vw = artifactToVirtualWeapon(forcedItem);
                if (vw)
                    weapon = vw;
            }
            else if (forcedItem.type === 'weapon') {
                weapon = forcedItem;
            }
        }
    }
    const isNpcAttack = option.source === "npc-attack";
    const npcAttackRow = isNpcAttack
        ? getNpcAttackByIndex(attacker.system, option.npcAttackIndex ?? 0, option.npcPhaseIndex)
        : null;
    if (isNpcAttack) {
        weapon = null;
    }
    if (!weapon && !isNpcAttack && attackType === 'melee') {
        weapon = createVirtualUnarmedWeapon();
    }
    // Virtual unarmed has no embedded item id — omit weaponId so damage dialog uses fallback.
    let weaponId = weapon && !isVirtualUnarmedWeapon(weapon) ? weapon.id ?? null : null;
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
    // Base TN: Evade (weapon / martial) or Casting TN from Power Level (Active-as-Spell attack)
    let targetEvadeFromActor = getTargetEvade(target);
    const { resolveEvadeVsInvisibleAttacker, } = await import('./perception-gate.js');
    const { applyAttackCloakDisruption } = await import('./perception-combat-hooks.js');
    const evadeVsInvisible = await resolveEvadeVsInvisibleAttacker(target, attacker, {
        defenderToken: targetToken,
        attackerToken: attackerToken,
    });
    if (evadeVsInvisible.evadeMultiplier < 1) {
        targetEvadeFromActor = Math.max(0, Math.floor(targetEvadeFromActor * evadeVsInvisible.evadeMultiplier));
    }
    await applyAttackCloakDisruption(attacker);
    // Get power info if applicable
    let selectedPowerId = null;
    let selectedPowerLevel = null;
    let selectedPowerSpecials = [];
    let selectedPowerDamage = null;
    let tnKind = 'evade';
    let castingBaseTn = null;
    // AoE Attacks roll once against the fixed Area TN = 8 × Source Mastery Rank
    // and ignore individual Evade / Spell Resistance (Players Guide, Attack
    // Sequence step 2). Detect bursts even before secondaries are confirmed.
    const isAoeAttack = !!aoeMelee || option.burstMeleeAoE === true;
    const areaTn = 8 * Math.max(1, masteryRank);
    if (option.source === 'power' && option.item) {
        selectedPowerId = option.item.id;
        const powerSystem = option.item.system || {};
        const artifactIsSpell = option.artifactIsSpell === true;
        selectedPowerLevel = artifactIsSpell
            ? Number(artifactLevelToTemplateRank(option.artifactRowLevel || 1))
            : (powerSystem.level || null);
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
        if (powerSystem.isSpell === true || artifactIsSpell) {
            tnKind = 'casting';
            const lvl = Math.max(1, Math.floor(Number(selectedPowerLevel) ||
                Number(artifactLevelToTemplateRank(option.artifactRowLevel || 1))));
            castingBaseTn = calculateBaseTN(lvl) + getTargetSpellResistance(target);
        }
    }
    // NPC Spell attacks use the hard MR casting standard (8 × Mastery Rank),
    // not Evade and not PC power-level Casting TN.
    const npcIsSpell = isNpcAttack && (!!option.npcIsSpell || !!npcAttackRow?.npcIsSpell);
    if (npcIsSpell) {
        tnKind = 'casting';
        castingBaseTn = 8 * Math.max(1, masteryRank) + getTargetSpellResistance(target);
    }
    /** Whether the underlying power is a spell (kept for damage riders / raises). */
    const powerWasSpell = tnKind === 'casting';
    // Area TN overrides Evade AND Casting TN for AoE attacks.
    if (isAoeAttack) {
        tnKind = 'area';
    }
    /** Normal TN (Area, Casting or Evade) — unchanged by declared raises. */
    const normalTn = tnKind === 'area'
        ? areaTn
        : tnKind === 'casting' && castingBaseTn != null
            ? castingBaseTn
            : targetEvadeFromActor;
    const baseEvade = normalTn;
    let raiseContext = null;
    if (option.source === 'power' && option.item && !isNpcAttack) {
        try {
            let loaded = null;
            if (option.artifactIsSpell && option.artifactPowerTemplateId) {
                loaded = await loadPowerSnapshotForArtifactOption(option);
            }
            else if (option.item.type === 'power') {
                loaded = await loadPowerSnapshotForItem(option.item);
            }
            if (loaded) {
                const opts = buildAvailableRaiseOptions(loaded.snapshot, loaded.isSpell);
                if (opts.length > 0) {
                    raiseContext = {
                        masteryRank,
                        isSpell: loaded.isSpell,
                        baseSnapshot: loaded.snapshot,
                        raiseOptions: opts,
                    };
                }
                else if (loaded.isSpell) {
                    raiseContext = {
                        masteryRank,
                        isSpell: true,
                        baseSnapshot: loaded.snapshot,
                        raiseOptions: [],
                    };
                }
            }
        }
        catch (err) {
            console.warn('Mastery System | raise context load failed', err);
        }
    }
    // Non-spell attack powers are weapon-carried: the wielded weapon's dice roll
    // on top of the power's bonus dice, so the preview can show the real total.
    if (raiseContext && !raiseContext.isSpell) {
        raiseContext.weaponDamageDice = parseD8Count(weapon?.system?.damage);
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
        targetEvade: normalTn,
        baseEvade: normalTn,
        normalTn,
        weaponId: weaponId,
        // Artifact / natural-weapon attacks always roll this weapon's dice —
        // the damage dialog must not swap it for another equipped weapon.
        forcedWeaponItemId: forcedWeaponItemId ?? null,
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
        // NPC ranged: Short/Medium/Long from sheet Short(=gifted full pool) / Long(=max).
        weaponRange: isNpcAttack && attackType === "ranged"
            ? rangeTextFromBands(bandsFromNpcShortLong(Math.floor(Number(option.rangeMinMeters) || 0), Math.floor(Number(option.rangeMeters ?? option.range) || 0)))
            : undefined,
        useNpcAttackDicePool: isNpcAttack,
        npcAttackDicePool: isNpcAttack ? attributeValue : undefined,
        npcAttackSource: isNpcAttack,
        npcAttackIndex: isNpcAttack ? (option.npcAttackIndex ?? 0) : undefined,
        npcPhaseIndex: isNpcAttack ? (option.npcPhaseIndex ?? null) : undefined,
        npcAttackName: isNpcAttack
            ? (npcAttackRow?.name?.trim() || option.name || "NSC-Angriff")
            : undefined,
        npcAttackOptionId: isNpcAttack
            ? String(option.npcAttackUsageKey || option.id || '')
            : undefined,
        npcIsSpell: npcIsSpell || undefined,
        ...(raiseContext
            ? {
                powerIsSpell: raiseContext.isSpell,
                basePowerSnapshot: raiseContext.baseSnapshot,
                raiseOptions: raiseContext.raiseOptions,
            }
            : npcIsSpell
                ? { powerIsSpell: true }
                : {}),
        tnKind,
        ...(castingBaseTn != null ? { castingBaseTn } : {}),
        ...(tnKind === 'area' ? { areaTn } : {}),
        targetEvadeFromActor: tnKind !== 'evade' ? targetEvadeFromActor : undefined,
        halfEvadeVsInvisible: evadeVsInvisible.evadeMultiplier < 1,
    };
    // Debug log before creating message
    const weaponCandidateFromEquipped = weapon;
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
    // Artifact virtual weapons carry specials as `{ specialId, value }` refs;
    // conventional weapons as plain strings. Format both readably.
    const weaponSpecialLines = weapon
        ? []
            .concat(weapon.system?.specials || [])
            .map((x) => (x && typeof x === 'object' ? formatEffectReference(x) : String(x ?? '').trim()))
            .filter(Boolean)
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
          <p><strong>Disadvantage:</strong> only <strong>one</strong> die showing 8 may explode; other 8s stay flat. Pool size and Keep are unchanged.</p>
          <p>After this declaration, enemies who have you in <em>their</em> melee reach may spend a <strong>Reaction</strong>: <strong>${oppNames.length ? oppNames.join(", ") : "(none in reach)"}</strong></p>
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
            data-normal-tn="${normalTn}"
            data-target-evade="${normalTn}"
            data-base-evade="${normalTn}"
            data-raise-tn="${normalTn}"
            data-raise-slots="0"
            data-raise-plan="[]"
            data-aoe-melee="${aoeMeleeAttr}"
            data-aoe-secondary-ids="${aoeIdsAttr}"
            data-aoe-power-dice="${aoeDiceAttr}">
      <i class="fas fa-dice-d20"></i> Roll
    </button>
  `;
    const raisePlanHtml = raiseContext
        ? `
    <div class="raise-plan-panel">
      <div class="raise-tn-row">
        <span>Normal TN: <strong>${normalTn}</strong></span>
        <span>Raise TN: <strong class="raise-tn-display">${normalTn}</strong></span>
      </div>
      <div class="raise-preview-row">On hit (before raises): <strong class="raise-cost-display">${attackCardEsc(formatOnHitSummary(raiseContext.baseSnapshot, raiseContext.weaponDamageDice))}</strong></div>
      ${raiseContext.isSpell
            ? `<div class="spell-cost-split-row md-sublabel">
          Pay Raise cost with:
          <select class="spell-cost-select" disabled>
            <option value="">— declare a Raise first —</option>
          </select>
        </div>`
            : ''}
      ${tnKind === 'casting' || (tnKind === 'area' && powerWasSpell)
            ? `<div class="blood-raises-row md-sublabel">
          Blood Raises (+4 roll each, −4 HP each):
          <input type="number" class="blood-raises-input" min="0" max="8" value="0" style="width:3em" />
        </div>`
            : ''}
      <div class="raise-plan-rows"></div>
      <button type="button" class="add-raise-btn"><i class="fas fa-plus"></i> Add Raise</button>
    </div>`
        : '';
    const raisesTitle = tnKind === 'area'
        ? `Declare Raises before rolling. Each Raise adds +${RAISE_INCREMENT} to the Raise TN (Area TN stays ${normalTn}). Pay Raise Cost from the Power first.`
        : tnKind === 'casting'
            ? `Declare Raises before rolling. Each Raise adds +${RAISE_INCREMENT} to the Raise TN (Normal TN stays ${normalTn}). Pay Raise Cost from the Power first.`
            : `Declare Raises before rolling. Each Raise adds +${RAISE_INCREMENT} to the Raise TN (Normal TN / Evade stays ${normalTn}). Pay Raise Cost from the Power first.`;
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
        ${tnKind === 'area'
        ? `<div class="detail-row">
          <span class="detail-label">Area TN:</span>
          <span class="detail-value">${normalTn} (8 × Mastery Rank ${masteryRank}) — one roll, hits every target in the area</span>
        </div>`
        : tnKind === 'casting' && castingBaseTn != null
            ? `<div class="detail-row">
          <span class="detail-label">Casting TN:</span>
          <span class="detail-value">${castingBaseTn}${npcIsSpell
                ? ` (8 × Mastery Rank ${masteryRank})`
                : ` (Power Level ${Math.max(1, Math.floor(Number(selectedPowerLevel) || 1))})`}</span>
        </div>`
            : `<div class="detail-row">
          <span class="detail-label">Target Evade:</span>
          <span class="detail-value">${normalTn}${evadeVsInvisible.evadeMultiplier < 1 ? ' (half — failed Perception vs invisible attacker)' : ''}</span>
        </div>`}
        ${weapon ? `<div class="detail-row"><span class="detail-label">Weapon:</span><span class="detail-value">${attackCardEsc(weapon.name)}</span></div>` : ""}
        ${innatesHtml}
        ${weaponSpecialsHtml}
        ${npcAttackDetailHtml}
        ${selectedPowerId ? `<div class="detail-row"><span class="detail-label">Power:</span><span class="detail-value">${attackCardEsc(option.name)}</span></div>` : ""}
      </div>
      <div class="attack-controls">
        ${raisePlanHtml ? `<div class="raises-input-group" title="${attackCardEsc(raisesTitle)}">${raisePlanHtml}</div>` : ''}
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
                        setupRaisesHandler(messageElement, messageId, normalTn, raiseContext);
                    }
                }
                else {
                    setupRaisesHandler(messageElement, messageId, normalTn, raiseContext);
                }
            }, 100);
        }
    }
    catch (error) {
        console.error("Mastery System | [ATTACK EXECUTOR] Failed to create attack card", error);
        ui.notifications?.error("Failed to create attack card");
    }
}
export async function createMeleeAttackCard(attackerToken, targetToken, option, burstVolley = null, aoeMelee = null) {
    return createAttackCard(attackerToken, targetToken, option, "melee", null, burstVolley, aoeMelee);
}
export async function createRangedAttackCard(attackerToken, targetToken, option, aoeZone = null) {
    return createAttackCard(attackerToken, targetToken, option, "ranged", null, null, aoeZone);
}
/**
 * Setup raise-plan editor on attack cards (new Raise rules).
 */
function setupRaisesHandler(messageElement, messageId, normalTn, raiseContext) {
    const button = messageElement.find('.roll-attack-btn');
    button.attr('data-normal-tn', String(normalTn));
    button.attr('data-target-evade', String(normalTn));
    button.attr('data-base-evade', String(normalTn));
    button.attr('data-raise-tn', String(normalTn));
    button.attr('data-raise-slots', '0');
    button.attr('data-raise-plan', '[]');
    if (!raiseContext)
        return;
    const panel = messageElement.find('.raise-plan-panel');
    const maxSlots = 8;
    const buildOptionHtml = () => {
        const opts = raiseContext.raiseOptions
            .map((o) => `<option value="${o.id}">${o.label} (${o.slots} slot${o.slots > 1 ? 's' : ''})</option>`)
            .join('');
        return `<option value="">— Raise effect —</option>${opts}`;
    };
    const collectPlan = () => {
        const plan = [];
        panel.find('.raise-plan-row').each((_i, row) => {
            const id = $(row).find('.raise-effect-select').val();
            if (!id)
                return;
            const dr = declaredRaiseFromOptionId(id, raiseContext.raiseOptions);
            if (dr)
                plan.push(dr);
        });
        return plan;
    };
    const totalSpecialRank = raiseContext.baseSnapshot.specials.reduce((sum, sp) => sum + Math.max(0, sp.rank), 0);
    /** Distribute a special-value payment over the power's specials (largest rank first). */
    const spellAllocFromParts = (d8Paid, spPaid) => {
        const alloc = { damageDice: d8Paid, specialByKey: {} };
        if (spPaid > 0) {
            const sorted = [...raiseContext.baseSnapshot.specials].sort((a, b) => b.rank - a.rank);
            let rem = spPaid;
            for (const sp of sorted) {
                if (rem <= 0)
                    break;
                const take = Math.min(sp.rank, rem);
                if (take > 0) {
                    alloc.specialByKey[sp.key] = take;
                    rem -= take;
                }
            }
        }
        return alloc;
    };
    /**
     * Rebuild the spell-cost dropdown: every option is a complete, valid split
     * (d8 + special value = total cost), so nothing has to be typed and the
     * numbers can never disagree with the cost.
     */
    const rebuildSpellCostSelect = (costTotal) => {
        const sel = panel.find('.spell-cost-select');
        if (!sel.length)
            return;
        if (costTotal <= 0) {
            sel.prop('disabled', true).html('<option value="">— declare a Raise first —</option>');
            return;
        }
        const prev = String(sel.val() || '');
        const maxD8 = Math.min(costTotal, raiseContext.baseSnapshot.damageDice);
        const minD8 = Math.max(0, costTotal - totalSpecialRank);
        const optionHtml = [];
        for (let d8 = maxD8; d8 >= minD8; d8--) {
            const sp = costTotal - d8;
            const parts = [];
            if (d8 > 0)
                parts.push(`${d8}d8 damage`);
            if (sp > 0)
                parts.push(`${sp} Special value`);
            optionHtml.push(`<option value="${d8}|${sp}">${parts.join(' + ')}</option>`);
        }
        if (!optionHtml.length) {
            sel.prop('disabled', true).html(`<option value="">Not enough damage/Special to pay ${costTotal}</option>`);
            return;
        }
        sel.prop('disabled', false).html(optionHtml.join(''));
        if (prev && sel.find(`option[value="${prev}"]`).length) {
            sel.val(prev);
        }
    };
    const readSpellCostSelection = (costTotal) => {
        const raw = String(panel.find('.spell-cost-select').val() || '');
        const m = raw.match(/^(\d+)\|(\d+)$/);
        if (!m)
            return undefined;
        const d8Paid = parseInt(m[1], 10);
        const spPaid = parseInt(m[2], 10);
        if (d8Paid + spPaid !== costTotal)
            return undefined;
        return spellAllocFromParts(d8Paid, spPaid);
    };
    const updatePreview = () => {
        const plan = collectPlan();
        const slots = countRaiseSlots(plan);
        const { raiseTn } = computeRaiseTns(normalTn, slots);
        let spellCostOverride;
        if (raiseContext.isSpell) {
            const costTotal = slots > 0 ? raiseContext.masteryRank * slots : 0;
            rebuildSpellCostSelect(costTotal);
            if (slots > 0) {
                spellCostOverride = readSpellCostSelection(costTotal);
            }
            if (spellCostOverride) {
                button.attr('data-spell-cost', JSON.stringify(spellCostOverride));
            }
            else {
                button.removeAttr('data-spell-cost');
            }
        }
        const preview = previewAfterRaiseCost(raiseContext.baseSnapshot, plan, raiseContext.masteryRank, raiseContext.isSpell, spellCostOverride);
        panel.find('.raise-tn-display').text(String(raiseTn));
        panel.find('.raise-cost-display').text(formatOnHitSummary(preview, raiseContext.weaponDamageDice));
        button.attr('data-raise-tn', String(raiseTn));
        button.attr('data-raise-slots', String(slots));
        button.attr('data-raise-plan', JSON.stringify(plan));
        button.attr('data-raises', String(slots));
        const blood = Math.max(0, parseInt(panel.find('.blood-raises-input').val(), 10) || 0);
        button.attr('data-blood-raises', String(blood));
    };
    const addRow = () => {
        const currentSlots = countRaiseSlots(collectPlan());
        if (currentSlots >= maxSlots) {
            ui.notifications?.warn?.(`Maximum ${maxSlots} Raise slots.`);
            return;
        }
        const row = $(`
      <div class="raise-plan-row">
        <select class="raise-effect-select">${buildOptionHtml()}</select>
        <button type="button" class="remove-raise-btn" title="Remove"><i class="fas fa-times"></i></button>
      </div>
    `);
        panel.find('.raise-plan-rows').append(row);
        row.find('.raise-effect-select').on('change', () => {
            const slots = countRaiseSlots(collectPlan());
            if (slots > maxSlots) {
                ui.notifications?.warn?.(`Maximum ${maxSlots} Raise slots.`);
                row.find('.raise-effect-select').val('');
            }
            updatePreview();
        });
        row.find('.remove-raise-btn').on('click', (ev) => {
            ev.preventDefault();
            row.remove();
            updatePreview();
        });
        updatePreview();
    };
    panel.find('.add-raise-btn').off('click.masteryRaisePlan').on('click.masteryRaisePlan', (ev) => {
        ev.preventDefault();
        addRow();
    });
    panel.find('.spell-cost-select, .blood-raises-input')
        .off('input.masteryRaisePlan change.masteryRaisePlan')
        .on('input.masteryRaisePlan change.masteryRaisePlan', () => updatePreview());
    void messageId;
    updatePreview();
}
//# sourceMappingURL=attack-executor.js.map