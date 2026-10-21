/**
 * Attack Executor
 * Creates melee/ranged attack chat cards with proper flags for the roll handler
 */
import { getAttackAttributeForPowerTreeOrSchool } from "../utils/power-roll-attribute.js";
import { normalizeArtifactAttackAttribute } from "../utils/artifact-node-options.js";
import { resolveEquippedWeaponForAttackType } from "../utils/equipment-modifiers.js";
import { artifactToVirtualWeapon, createVirtualUnarmedWeapon, isVirtualUnarmedWeapon } from "../utils/unarmed-fallback.js";
import { evaluateThreatenedRanged, evaluateThreatenedSpellcasting, } from "./threatened-ranged.js";
import { npcMaxRangeM, rangeTextFromMax } from "../utils/range-bands.js";
import { formatNpcAttackSpecialsLine, getNpcAttackByIndex, npcAttackDiceCount, npcAttackExplodesOn7, npcAttackKeepDice, npcDamageDiceFormula } from "../utils/npc-attack-model.js";
import { resolvePowerMechanics } from "../utils/power-mechanics.js";
import { parseD8Count } from "../utils/dice-formula.js";
import { basicAttackMrDamageFormula } from "./basic-combat.js";
import { mergeWeaponSpecialsIntoSnapshot, parkWeaponSpecialsForRaises, weaponSpecialEntries, } from "../utils/weapon-specials.js";
import { RAISE_INCREMENT } from "../utils/constants.js";
import { getRulesMasteryRank } from "../utils/mastery-rank-sync.js";
import { castingBaseTnForMasteryRank } from "./spell-roll-handler.js";
import { artifactLevelToTemplateRank } from "../utils/artifact-spell-pick.js";
import { getTargetEvade, getTargetSpellResistance, spellResistanceAfterPenetration, } from "./target-defenses.js";
import { ENCOUNTER_SOCKET } from "./combat-permissions.js";
import { isDamageTransferPower, isDamageTransferTemplateId } from "./damage-transfer.js";
export { getTargetEvade, getTargetSpellResistance, spellResistanceAfterPenetration, } from "./target-defenses.js";
import { listActorSpellFocusSources } from "../utils/artifact-base-values.js";
import { buildAvailableRaiseOptions, computeRaiseTns, formatHitBreakdown, loadPowerSnapshotForArtifactOption, loadPowerSnapshotForItem, snapshotToDamageFormula, snapshotToSpecialStrings, } from "./raise-resolution.js";
/** Split one attack pool across two strikes. No Mastery Rank floor. */
export function divideSplitAttackPool(total) {
    const n = Math.max(0, Math.floor(Number(total) || 0));
    const first = Math.ceil(n / 2);
    const second = n - first;
    return { first, second };
}
/** Combatants other than the attacker. One alternative target is enough. */
export function listSplitSecondTargetIds(tokenIds, attackerTokenId) {
    const attacker = String(attackerTokenId || '');
    const seen = new Set();
    const out = [];
    for (const raw of tokenIds) {
        const id = String(raw || '').trim();
        if (!id || id === attacker || seen.has(id))
            continue;
        seen.add(id);
        out.push(id);
    }
    return out;
}
export function rememberSplitSharedRaises(pairId, raises) {
    const pending = pendingSplitStrike2.get(String(pairId || ''));
    if (!pending)
        return;
    pending.sharedRaisePlan = String(raises.plan ?? '[]');
    pending.sharedRaiseSlots = String(raises.slots ?? '0');
    pending.sharedRaiseFree = String(raises.free ?? '0');
    pending.sharedRaiseTn = String(raises.tn ?? '');
}
export function peekPendingSplit(pairId) {
    const pending = pendingSplitStrike2.get(String(pairId || ''));
    if (!pending)
        return null;
    return {
        targetTokenId: pending.targetTokenId,
        secondPool: pending.secondPool,
        sharedRaisePlan: pending.sharedRaisePlan,
    };
}
let splitSecondTargetResolver = null;
/** Tests and the attack card use this to choose the second Split Attack token. */
export function setSplitSecondTargetResolver(fn) {
    splitSecondTargetResolver = fn;
}
async function promptSplitSecondTarget(attackerToken, primaryTarget) {
    const Dialog = globalThis.Dialog;
    const combatants = globalThis.game?.combat?.combatants;
    const list = typeof combatants?.values === 'function' ? Array.from(combatants.values()) : [];
    const choices = list.filter((c) => listSplitSecondTargetIds([String(c?.token?.id || '')], String(attackerToken?.id || '')).length > 0);
    if (!Dialog?.wait || choices.length < 1)
        return null;
    const buttons = {};
    choices.forEach((c, i) => {
        const id = String(c.token.id);
        buttons[`t${i}`] = {
            label: id === String(primaryTarget?.id) ? `${c.name || c.token.name} (first target)` : String(c.name || c.token.name || id),
            callback: () => id,
        };
    });
    try {
        const picked = await Dialog.wait({
            title: 'Split Attack — second target',
            content: '<p>Choose the second target. The attack pool is already divided.</p>',
            buttons,
            default: 't0',
        });
        return picked ? String(picked) : null;
    }
    catch {
        return null;
    }
}
const pendingSplitStrike2 = new Map();
/**
 * After Strike 1 of a Split Attack fully resolves (hit or miss), post Strike 2.
 * Safe to call more than once — the pending entry is consumed on first spawn.
 */
export async function spawnSplitStrike2IfPending(splitPairId) {
    const pairId = String(splitPairId || '').trim();
    if (!pairId)
        return;
    const pending = pendingSplitStrike2.get(pairId);
    if (!pending)
        return;
    pendingSplitStrike2.delete(pairId);
    const canvasTokens = globalThis.canvas?.tokens;
    const attackerToken = canvasTokens?.get?.(pending.attackerTokenId) ||
        canvasTokens?.placeables?.find?.((t) => String(t?.id) === pending.attackerTokenId) ||
        null;
    const targetToken = canvasTokens?.get?.(pending.targetTokenId) ||
        canvasTokens?.placeables?.find?.((t) => String(t?.id) === pending.targetTokenId) ||
        null;
    if (!attackerToken || !targetToken) {
        console.warn('Mastery System | Split Strike 2: tokens missing', {
            pairId,
            attackerTokenId: pending.attackerTokenId,
            targetTokenId: pending.targetTokenId,
        });
        return;
    }
    await createAttackCard(attackerToken, targetToken, pending.option, pending.attackType, {
        splitPairId: pairId,
        splitIndex: 2,
        attributePool: pending.secondPool,
        secondPool: pending.secondPool,
        sharedRaisePlan: pending.sharedRaisePlan,
        sharedRaiseSlots: pending.sharedRaiseSlots,
        sharedRaiseFree: pending.sharedRaiseFree,
        sharedRaiseTn: pending.sharedRaiseTn,
    }, null, null);
}
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
 * Detect whether the selected power declares a Split-Attack. The attack /
 * casting pool is split between strikes (accuracy); each successful strike
 * deals full weapon + power damage. See Split Attack Rule.
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
        if (mech?.splitAttack === true)
            return true;
        const label = `${option.name || ''} ${option.item?.name || ''}`;
        return /\b(?:melee|ranged)\s+split attack\b/i.test(label);
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
function resolveWeaponForAttack(items, attackType, attacker) {
    return resolveEquippedWeaponForAttackType(items, attackType, attacker);
}
/**
 * On-hit preview for the raise panel: weapon dice + power dice as a total
 * (e.g. "9d8 total (5d8 weapon + 4d8 power), Sundered(2)"). With no weapon
 * dice (spells, unarmed flat damage) this is the plain power snapshot summary.
 */
function formatOnHitSummary(snapshot, weaponDice, weaponName) {
    return formatHitBreakdown(weaponDice, snapshot.damageDice, {
        specials: snapshot.specials,
        weaponName,
    });
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
    return getRulesMasteryRank(actor);
}
/** True when the wielded weapon (real or artifact-virtual) has the Finesse innate. */
export function weaponHasFinesse(weapon) {
    if (!weapon)
        return false;
    const sys = weapon.system || {};
    const lines = [];
    if (Array.isArray(sys.innateAbilities))
        lines.push(...sys.innateAbilities);
    if (Array.isArray(sys.artifactWeapon?.innateAbilities)) {
        lines.push(...sys.artifactWeapon.innateAbilities);
    }
    if (sys.freeTrait)
        lines.push(sys.freeTrait);
    if (sys.artifactWeapon?.freeTrait)
        lines.push(sys.artifactWeapon.freeTrait);
    if (lines.some((a) => String(a).toLowerCase().includes("finesse")))
        return true;
    const specials = [];
    if (Array.isArray(sys.specials))
        specials.push(...sys.specials);
    if (Array.isArray(sys.artifactWeapon?.specials))
        specials.push(...sys.artifactWeapon.specials);
    return specials.some((s) => {
        const id = s && typeof s === "object" ? s.specialId : s;
        return String(id ?? "").toLowerCase().includes("finesse");
    });
}
/**
 * Determine which attribute to use for attack rolls.
 * - Spells: casting attribute on the item / option.
 * - Weapons with Finesse (incl. artifact Free Trait): Agility for To-Hit —
 *   also for weapon-carried attack powers (Melee Single Attack, Targeted Special, …),
 *   where it beats the mastery-tree default (rules: "Attack Roll uses Agility").
 * - Powers: attribute from mastery tree / spell school (`system.tree`) via fixed list; if unknown tree, fall back to `roll.attribute`.
 * - Otherwise: Might for melee, Agility for ranged (weapon or maneuver).
 */
function attackAttributeOverrideFromWeapon(weapon) {
    if (!weapon)
        return null;
    const sys = weapon.system || {};
    return (normalizeArtifactAttackAttribute(sys.attackAttribute) ||
        normalizeArtifactAttackAttribute(sys.artifactWeapon?.attackAttribute));
}
function resolveWeaponForAttribute(actor, weapon, option, attackType) {
    if (weapon)
        return weapon;
    if (!actor || option.source === "npc-attack")
        return null;
    const items = collectActorItems(actor);
    const forcedWeaponItemId = option.forcedWeaponItemId;
    if (forcedWeaponItemId) {
        const forcedItem = items.find((i) => i.id === forcedWeaponItemId);
        if (forcedItem?.type === "artifact")
            return artifactToVirtualWeapon(forcedItem);
        if (forcedItem?.type === "weapon")
            return forcedItem;
    }
    return resolveWeaponForAttack(items, attackType, actor);
}
export function getAttackAttribute(actor, weapon, option, attackType) {
    const resolvedWeapon = resolveWeaponForAttribute(actor, weapon, option, attackType);
    const attributeOverride = attackAttributeOverrideFromWeapon(resolvedWeapon);
    if (option.storedAttackPool?.attribute) {
        return String(option.storedAttackPool.attribute).toLowerCase();
    }
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
        if (attributeOverride) {
            return attributeOverride;
        }
        // Non-spell attack powers are weapon-carried (they roll the equipped
        // weapon's dice), so a Finesse weapon swaps the To-Hit to Agility even
        // when the mastery tree would default to Might.
        if (!artifactIsSpell && powerSystem.isSpell !== true && weaponHasFinesse(resolvedWeapon)) {
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
    if (attributeOverride) {
        return attributeOverride;
    }
    if (weaponHasFinesse(resolvedWeapon)) {
        return "agility";
    }
    return attackType === "ranged" ? "agility" : "might";
}
/** Queue strike 2 against a chosen token. One other combatant is a valid choice. */
export async function openSplitPair(attackerToken, targetToken, option, attackType) {
    const pairId = newSplitPairId();
    let secondTargetId = String(targetToken?.id || '');
    const picked = splitSecondTargetResolver
        ? await splitSecondTargetResolver(attackerToken, targetToken, option)
        : await promptSplitSecondTarget(attackerToken, targetToken);
    if (picked && listSplitSecondTargetIds([String(picked)], String(attackerToken?.id || '')).includes(String(picked))) {
        secondTargetId = String(picked);
    }
    pendingSplitStrike2.set(pairId, {
        attackerTokenId: String(attackerToken?.id || ''),
        targetTokenId: secondTargetId,
        attackType,
        option,
        secondPool: 0,
    });
    return { pairId, secondTargetId };
}
/**
 * Create a melee or ranged attack chat card with roll button (Threatened Ranged for qualifying ranged attacks).
 */
export async function createAttackCard(attackerToken, targetToken, option, attackType, split = null, burstVolley = null, aoeMelee = null) {
    // Instant AoE: Power damage only. Never Weapon Damage; never Spell Focus
    // (the damage dialog also skips both when the aoeMeleeWeapon/instantAoe flag is set).
    if (aoeMelee && option.ignoreWeaponDamage !== true) {
        option = { ...option, ignoreWeaponDamage: true };
    }
    // Autofire is handled before createAttackCard (chain targeting → one card
    // with autofireChainTokenIds). Do not treat it as Split-Attack.
    // Split-Attack dispatcher: when a power declares `mechanics.splitAttack`,
    // post Strike 1 only. Strike 2 waits until Strike 1 fully finishes (hit or
    // miss + damage), so the chat stays readable as one-after-another.
    if (!split && !burstVolley && !aoeMelee && detectSplitAttack(option)) {
        const opened = await openSplitPair(attackerToken, targetToken, option, attackType);
        const pairId = opened.pairId;
        await createAttackCard(attackerToken, targetToken, option, attackType, {
            splitPairId: pairId,
            splitIndex: 1,
            attributePool: 0, // recomputed below with the real base pool.
        }, null, null);
        return null;
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
        return null;
    }
    try {
        const { notATargetDecision, NOT_A_TARGET_FLAG } = await import('../stones/stone-combat-effects.js');
        const combatNow = globalThis.game?.combat;
        const others = combatNow?.combatants
            ? Array.from(typeof combatNow.combatants.values === 'function' ? combatNow.combatants.values() : combatNow.combatants)
                .filter((c) => {
                const id = String(c?.actor?.id || '');
                return id && id !== String(attacker.id) && id !== String(target.id);
            }).length
            : 1;
        const decision = notATargetDecision(target.getFlag?.('mastery-system', NOT_A_TARGET_FLAG), String(attacker.id || ''), others, String(combatNow?.id || ''), Math.max(1, Math.floor(Number(combatNow?.round) || 1)));
        if (decision.block) {
            if (decision.next)
                await target.setFlag?.('mastery-system', NOT_A_TARGET_FLAG, decision.next);
            ui.notifications?.warn(decision.reason || 'Not a Target.');
            return null;
        }
    }
    catch (err) {
        console.warn('Mastery System | Not a Target check failed', err);
    }
    // Log actor item summary for diagnostics
    const items = collectActorItems(attacker);
    let weapon = resolveWeaponForAttack(items, attackType, attacker);
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
    const isNpcActor = attacker?.type === 'npc' || attacker?.type === 'summon';
    // Basic Attack on an NPC still hits with the sheet row (index 0), not Might.
    // isNpcAttack stays false so weapon damage is not stripped.
    const sheetAttackRow = npcAttackRow ??
        (isNpcActor ? getNpcAttackByIndex(attacker.system, 0, null) : null);
    const poolFromNpc = sheetAttackRow
        ? npcAttackDiceCount(sheetAttackRow)
        : attacker?.type === 'npc'
            ? 6
            : 0;
    const useSheetPool = isNpcActor && (sheetAttackRow != null || attacker?.type === 'npc');
    if (isNpcAttack || option.ignoreWeaponDamage) {
        weapon = null;
    }
    if (!weapon && !isNpcAttack && !option.ignoreWeaponDamage && attackType === 'melee') {
        weapon = createVirtualUnarmedWeapon();
    }
    // Virtual unarmed has no embedded item id — omit weaponId so damage dialog uses fallback.
    let weaponId = weapon && !isVirtualUnarmedWeapon(weapon) ? weapon.id ?? null : null;
    // Determine attack attribute
    const attribute = getAttackAttribute(attacker, weapon, option, attackType);
    let attributeValue = option.storedAttackPool && Number(option.storedAttackPool.numDice) > 0
        ? Math.max(0, Math.floor(Number(option.storedAttackPool.numDice)))
        : useSheetPool
            ? poolFromNpc
            : getAttributeValue(attacker, attribute);
    const masteryRank = getMasteryRank(attacker);
    let splitSecondPool = 0;
    if (split?.splitIndex === 2) {
        attributeValue = Math.max(0, Math.floor(Number(split.attributePool) || 0));
    }
    else if (split) {
        const parts = divideSplitAttackPool(attributeValue);
        attributeValue = parts.first;
        splitSecondPool = parts.second;
        const pending = split.splitPairId ? pendingSplitStrike2.get(split.splitPairId) : undefined;
        if (pending)
            pending.secondPool = splitSecondPool;
    }
    // Debug: Log attribute reading
    // Base TN: Evade (weapon / martial) or Casting TN from Power Level (Active-as-Spell attack)
    let targetEvadeFromActor = getTargetEvade(target, attacker);
    // Attacking does not interrupt Invisibility; ordinary Stealth hiding ends.
    const { endOrdinaryStealthOnAttack } = await import('./perception-gate.js');
    await endOrdinaryStealthOnAttack(attacker);
    try {
        const { applySurprisePriorityForAttack } = await import('./surprise.js');
        await applySurprisePriorityForAttack(attacker, target, globalThis.game?.combat);
    }
    catch (err) {
        console.warn('Mastery System | Surprise Priority check failed', err);
    }
    // Get power info if applicable
    let selectedPowerId = null;
    let selectedPowerLevel = null;
    let selectedPowerSpecials = [];
    let selectedPowerDamage = null;
    let tnKind = 'evade';
    let castingBaseTn = null;
    /** Spell or Mental Power Base TN, before Spell Resistance. */
    let spellBaseTnValue = null;
    // AoE: one roll compared separately against each creature's Evade (martial)
    // or Final Spell TN (spell). The card's display TN is the primary/anchor
    // target; secondaries are checked independently after the roll.
    if (option.source === 'power' && option.item) {
        selectedPowerId = option.item.id;
        const powerSystem = option.item.system || {};
        const artifactIsSpell = option.artifactIsSpell === true;
        selectedPowerLevel = option.artifactPowerTemplateId
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
            // Spell Base TN = (8 × caster Mastery Rank) − 2 (Players Guide "Casting
            // Roll"); Mental Powers add +4. The Power Level does NOT set the TN.
            const powerTags = Array.isArray(powerSystem.tags)
                ? powerSystem.tags.map((t) => String(t))
                : [];
            const isMentalPower = powerTags.includes('mental') ||
                /mental/i.test(String(powerSystem.templateId ?? '')) ||
                /mind-illusion|mind-probe|mental-control/i.test(String(powerSystem.templateId ?? ''));
            spellBaseTnValue = castingBaseTnForMasteryRank(masteryRank, { mental: isMentalPower });
            castingBaseTn = spellBaseTnValue + spellResistanceAfterPenetration(target, attacker);
        }
    }
    // NPC Spell attacks use Spell Base TN (8 × Mastery Rank − 2),
    // not Evade and not PC power-level Casting TN.
    const npcIsSpell = isNpcAttack && (!!option.npcIsSpell || !!npcAttackRow?.npcIsSpell);
    const npcCrit = isNpcAttack &&
        (npcAttackExplodesOn7(option) || npcAttackExplodesOn7(npcAttackRow));
    if (npcIsSpell) {
        tnKind = 'casting';
        spellBaseTnValue = castingBaseTnForMasteryRank(Math.max(1, masteryRank));
        castingBaseTn = spellBaseTnValue + spellResistanceAfterPenetration(target, attacker);
    }
    /** Normal TN for the card's anchor target — unchanged by declared raises. */
    const normalTn = tnKind === 'casting' && castingBaseTn != null
        ? castingBaseTn
        : targetEvadeFromActor;
    const baseEvade = normalTn;
    let raiseContext = null;
    const powerOnHitKeys = new Set();
    if (option.source === 'power' && option.item && !isNpcAttack) {
        try {
            let loaded = null;
            if (option.artifactPowerTemplateId) {
                loaded = await loadPowerSnapshotForArtifactOption(option);
            }
            else if (option.item.type === 'power') {
                loaded = await loadPowerSnapshotForItem(option.item);
            }
            if (loaded) {
                for (const sp of loaded.snapshot.specials) {
                    if (sp.key)
                        powerOnHitKeys.add(sp.key);
                }
                selectedPowerSpecials = snapshotToSpecialStrings(loaded.snapshot);
                if (!selectedPowerDamage) {
                    selectedPowerDamage = snapshotToDamageFormula(loaded.snapshot);
                }
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
            else if (option.artifactRowSpecial) {
                selectedPowerSpecials = String(option.artifactRowSpecial)
                    .split(',')
                    .map((s) => s.trim())
                    .filter((s) => s && s !== '—' && s !== '-');
            }
        }
        catch (err) {
            console.warn('Mastery System | raise context load failed', err);
        }
    }
    if (!raiseContext && isNpcAttack && npcAttackRow) {
        const rows = Array.isArray(npcAttackRow.specials) ? npcAttackRow.specials : [];
        const specials = rows
            .map((s) => ({
            key: String(s?.special || '').trim().toLowerCase(),
            rank: Math.max(0, Math.floor(Number(s?.specialValue) || 0)),
        }))
            .filter((s) => s.key);
        const snap = {
            damageDice: Math.max(0, Math.floor(Number(npcAttackRow.damageDiceCount) || 0)),
            specials,
            rangeM: null,
            aoeRadiusM: null,
            durationSteps: 0,
            hasRange: false,
            hasAoe: false,
            hasDuration: false,
        };
        raiseContext = {
            masteryRank,
            isSpell: npcIsSpell,
            baseSnapshot: snap,
            raiseOptions: buildAvailableRaiseOptions(snap, npcIsSpell),
        };
    }
    if (raiseContext && !raiseContext.isSpell && !option.ignoreWeaponDamage && weapon) {
        raiseContext.baseSnapshot = mergeWeaponSpecialsIntoSnapshot(raiseContext.baseSnapshot, weaponSpecialEntries(weapon));
        raiseContext.raiseOptions = buildAvailableRaiseOptions(raiseContext.baseSnapshot, false);
    }
    if (!raiseContext && !isNpcAttack && !option.ignoreWeaponDamage && option.id === 'weapon-attack') {
        const snap = {
            damageDice: parseD8Count(basicAttackMrDamageFormula(attacker)),
            specials: weapon && !isVirtualUnarmedWeapon(weapon) ? weaponSpecialEntries(weapon) : [],
            rangeM: null,
            aoeRadiusM: null,
            durationSteps: 0,
            hasRange: false,
            hasAoe: false,
            hasDuration: false,
        };
        raiseContext = {
            masteryRank,
            isSpell: false,
            baseSnapshot: snap,
            raiseOptions: buildAvailableRaiseOptions(snap, false),
        };
    }
    if (!raiseContext && !isNpcAttack && !option.ignoreWeaponDamage && weapon && !isVirtualUnarmedWeapon(weapon)) {
        const entries = weaponSpecialEntries(weapon);
        if (entries.length > 0) {
            const snap = {
                damageDice: 0,
                specials: entries,
                rangeM: null,
                aoeRadiusM: null,
                durationSteps: 0,
                hasRange: false,
                hasAoe: false,
                hasDuration: false,
            };
            raiseContext = {
                masteryRank,
                isSpell: false,
                baseSnapshot: snap,
                raiseOptions: buildAvailableRaiseOptions(snap, false),
            };
        }
    }
    let raiseOptionSource = raiseContext?.baseSnapshot ?? null;
    if (raiseContext && !raiseContext.isSpell && !isNpcAttack) {
        const parked = parkWeaponSpecialsForRaises(raiseContext.baseSnapshot, powerOnHitKeys);
        raiseContext.baseSnapshot = parked.onHit;
        raiseOptionSource = parked.raiseSource;
    }
    // Non-spell attack powers are weapon-carried: the wielded weapon's dice roll
    // on top of the power's bonus dice, so the preview can show the real total.
    if (raiseContext && !raiseContext.isSpell) {
        raiseContext.weaponDamageDice = option.ignoreWeaponDamage
            ? 0
            : parseD8Count(weapon?.system?.damage);
        if (weapon && !option.ignoreWeaponDamage) {
            raiseContext.weaponName = String(weapon.name || '').trim() || undefined;
        }
        raiseContext.raiseOptions = buildAvailableRaiseOptions(raiseOptionSource ?? raiseContext.baseSnapshot, false, { hasWeaponDamage: (raiseContext.weaponDamageDice ?? 0) > 0 });
    }
    const emptyThreat = {
        appliesRule: false,
        threatened: false,
        threateningEnemyTokenIds: [],
        opportunityEnemyTokenIds: [],
        rollDisadvantage: false,
        debugReason: undefined,
    };
    const trRanged = attackType === 'ranged' ? evaluateThreatenedRanged(attackerToken, option) : emptyThreat;
    // R-03: all spell casting rolls are disadvantaged in enemy melee reach.
    const trSpell = tnKind === 'casting' ? evaluateThreatenedSpellcasting(attackerToken) : emptyThreat;
    const tr = {
        appliesRule: trRanged.appliesRule || trSpell.appliesRule,
        threatened: trRanged.threatened || trSpell.threatened,
        threateningEnemyTokenIds: [
            ...new Set([
                ...(trRanged.threateningEnemyTokenIds || []),
                ...(trSpell.threateningEnemyTokenIds || []),
            ]),
        ],
        opportunityEnemyTokenIds: trRanged.opportunityEnemyTokenIds || [],
        rollDisadvantage: !!(trRanged.rollDisadvantage || trSpell.rollDisadvantage),
        debugReason: trSpell.threatened
            ? trSpell.debugReason
            : trRanged.debugReason,
    };
    const optionPaysAction = option.costsAction !== false;
    let costsThisCard = optionPaysAction;
    if (burstVolley) {
        costsThisCard = optionPaysAction && burstVolley.volleyIndex === 1;
    }
    else if (split) {
        costsThisCard = optionPaysAction && split.splitIndex === 1;
    }
    // Reaction Counterattack: pause the original attack until this card resolves.
    const fromReactionCounterattack = !!option.tags?.includes('counterattack') ||
        /^counterattack\b/i.test(String(option.name || ''));
    const flagsObj = {
        attackType,
        // Split second strike / melee burst follow-up cards do not consume another action on roll.
        costsAction: costsThisCard,
        ...(fromReactionCounterattack
            ? { fromReactionCounterattack: true, awaitAttackResolution: true }
            : {}),
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
        selectedPowerName: option.source === 'power' ? String(option.name || '') : '',
        selectedPowerSpecials: selectedPowerSpecials,
        selectedPowerDamage: selectedPowerDamage || "",
        consumableItemId: option.consumableItemId || null,
        ignoreWeaponDamage: option.ignoreWeaponDamage === true || tnKind === 'casting',
        damageTransfer: isDamageTransferTemplateId(option.artifactPowerTemplateId) ||
            (option.source === 'power' &&
                (isDamageTransferPower(option.item) || resolvePowerMechanics(option.item)?.damageTransfer === true)),
        limited: option.item?.system?.limited === true || undefined,
        // Split-attack bookkeeping (both strikes share pairId for "Strike N of 2"
        // labels). Damage is full per successful strike — only the attack pool is split.
        splitAttack: !!split,
        splitPoolAssigned: !!split,
        splitIndex: split?.splitIndex ?? null,
        splitPairId: split?.splitPairId ?? null,
        meleeBurstVolleyId: burstVolley?.volleyId ?? null,
        meleeBurstVolleyIndex: burstVolley?.volleyIndex ?? null,
        meleeBurstVolleyTotal: burstVolley?.volleyTotal ?? null,
        // Instant AoE flags (aoeMeleeWeapon = legacy name, instantAoe = preferred).
        aoeMeleeWeapon: !!aoeMelee,
        instantAoe: !!aoeMelee,
        aoeMeleeSecondaryTokenIds: aoeMelee && aoeMelee.secondaryTokenIds?.length ? aoeMelee.secondaryTokenIds.join(",") : "",
        aoeMeleePowerBonusDice: aoeMelee && aoeMelee.powerBonusDice > 0 ? Math.floor(aoeMelee.powerBonusDice) : 0,
        // Autofire ordered chain (includes the card's primary as index 0).
        autofire: Array.isArray(option.autofireChainTokenIds)
            && option.autofireChainTokenIds.length > 0,
        autofireChainTokenIds: Array.isArray(option.autofireChainTokenIds)
            ? option.autofireChainTokenIds.map((id) => String(id)).join(',')
            : '',
        threatenedRanged: tr.threatened,
        /** Rule can apply even when nobody is currently in reach (Phase 2 re-scan). */
        threatenedRangedAppliesRule: tr.appliesRule,
        rollDisadvantage: tr.rollDisadvantage,
        threateningEnemyTokenIds: tr.threateningEnemyTokenIds,
        opportunityEnemyTokenIds: tr.opportunityEnemyTokenIds,
        threatenedRangedDebugReason: tr.debugReason ?? null,
        // NPC ranged: the sheet's Max field is the flat maximum range.
        weaponRange: isNpcAttack && attackType === "ranged"
            ? rangeTextFromMax(npcMaxRangeM(Math.floor(Number(option.rangeMeters ?? option.range) || 0)))
            : undefined,
        useNpcAttackDicePool: useSheetPool,
        npcAttackDicePool: useSheetPool ? attributeValue : undefined,
        // PG statblocks print the Keep per attack ("6d8, Keep 1"); unset ⇒ MR.
        npcAttackKeepDice: useSheetPool ? npcAttackKeepDice(sheetAttackRow, masteryRank) : undefined,
        npcAttackSource: isNpcAttack,
        npcAttackIndex: isNpcAttack ? (option.npcAttackIndex ?? 0) : undefined,
        npcPhaseIndex: isNpcAttack ? (option.npcPhaseIndex ?? null) : undefined,
        npcAttackName: useSheetPool
            ? (sheetAttackRow?.name?.trim() || (isNpcAttack ? option.name : '') || "Waffenangriff")
            : undefined,
        npcAttackOptionId: isNpcAttack
            ? String(option.npcAttackUsageKey || option.id || '')
            : undefined,
        npcIsSpell: npcIsSpell || undefined,
        npcCrit: npcCrit || undefined,
        ...(raiseContext
            ? {
                powerIsSpell: raiseContext.isSpell,
                basePowerSnapshot: raiseContext.baseSnapshot,
                raiseOptions: raiseContext.raiseOptions,
                weaponDamageDice: raiseContext.weaponDamageDice ?? 0,
                weaponName: raiseContext.weaponName || '',
            }
            : npcIsSpell
                ? { powerIsSpell: true }
                : {}),
        tnKind,
        ...(castingBaseTn != null ? { castingBaseTn } : {}),
        /** Spell Base TN without this target's SR — used for per-creature Spell AoE checks. */
        ...(tnKind === 'casting' && castingBaseTn != null
            ? {
                spellBaseTn: spellBaseTnValue ??
                    castingBaseTn - getTargetSpellResistance(target),
                persistentSpellZone: !!option.zoneDurationNote && !/instant/i.test(String(option.zoneDurationNote)),
                spellZoneCenterX: option.spellZoneCenterX ?? null,
                spellZoneCenterY: option.spellZoneCenterY ?? null,
                spellZoneRadius: option.aoeRadiusMeters ?? null,
                spellZoneDuration: option.zoneDurationNote ?? null,
                spellZonePowerId: option.powerId ?? option.item?.id ?? null,
                spellZoneTemplateId: option.templateId ?? option.item?.system?.templateId ?? null,
                sourceMasteryRank: masteryRank,
            }
            : {}),
        targetEvadeFromActor: tnKind !== 'evade' ? targetEvadeFromActor : undefined,
        halfEvadeVsInvisible: false,
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
    const npcSpecialsLine = isNpcAttack && npcAttackRow ? formatNpcAttackSpecialsLine(npcAttackRow) : "";
    const npcAttackDetailHtml = isNpcAttack && npcAttackRow
        ? `<div class="detail-row"><span class="detail-label">NSC-Pool:</span><span class="detail-value">${attributeValue}d8</span></div>
        <div class="detail-row"><span class="detail-label">Schaden:</span><span class="detail-value">${attackCardEsc(npcDamageDiceFormula(npcAttackRow))}</span></div>
        ${npcAttackRow.armor
            ? `<div class="detail-row"><span class="detail-label">Rüstung:</span><span class="detail-value">${attackCardEsc(String(npcAttackRow.armor))}</span></div>`
            : ""}
        ${npcCrit
            ? `<div class="detail-row"><span class="detail-label">Crit:</span><span class="detail-value">Attack dice explode on 7–8</span></div>`
            : ""}
        ${npcSpecialsLine
            ? `<div class="detail-row"><span class="detail-label">Spezial:</span><span class="detail-value">${attackCardEsc(npcSpecialsLine)}</span></div>`
            : ""}`
        : "";
    const oppNames = tr.opportunityEnemyTokenIds
        .map((id) => canvas.tokens?.get(id)?.name)
        .filter(Boolean);
    const threatenedTitle = trSpell.threatened
        ? 'Threatened Spellcasting'
        : 'Threatened Ranged';
    const threatenedHtml = tr.threatened
        ? `<div class="mastery-threatened-ranged" style="border-left:4px solid #c0392b;padding:8px;margin:8px 0;background:rgba(192,57,43,0.08);">
          <p><strong>${threatenedTitle}</strong></p>
          <p><strong>Disadvantage:</strong> only <strong>one</strong> die showing 8 may explode; other 8s stay flat. Pool size and Keep are unchanged.</p>
          ${trRanged.threatened
            ? `<p>On <strong>declaration</strong> of this attack, enemies who have you in <em>their</em> melee reach may immediately spend a <strong>legal Reaction</strong> (hit/target-triggered reactions do not qualify): <strong>${oppNames.length ? oppNames.join(", ") : "(none in reach)"}</strong></p>`
            : `<p>Caster is inside enemy melee reach — Casting Roll has Disadvantage.</p>`}
        </div>`
        : "";
    const aoeIdsAttr = aoeMelee && aoeMelee.secondaryTokenIds?.length
        ? attackCardEsc(aoeMelee.secondaryTokenIds.join("|"))
        : "";
    const aoeDiceAttr = aoeMelee && aoeMelee.powerBonusDice > 0 ? String(Math.floor(aoeMelee.powerBonusDice)) : "0";
    const aoeMeleeAttr = aoeMelee ? "1" : "0";
    const skipAwaitedHtml = fromReactionCounterattack
        ? `<button type="button" class="ms-skip-awaited-attack-btn" title="Skip this Counterattack and continue the original attack's damage">
        <i class="fas fa-forward"></i> Skip — continue original damage
      </button>
      <p class="ms-awaited-attack-hint" style="opacity:0.9;font-size:0.9em;margin:0.35em 0 0;">
        Original damage is <strong>paused</strong> until you Roll this Counterattack (or Skip).
      </p>`
        : '';
    // Crit UI: separate Roll / Roll with Crit (no checkbox when no charges).
    let critButtonHtml = '';
    try {
        const actionEco = await import('./action-economy.js');
        const { critAppliesToAttackRoll, listAvailableCriticalSources, syncCriticalRoundQuota, combatRoundKey } = await import('./critical-resolution.js');
        const spellDamageDice = Math.max(0, Math.floor(Number(raiseContext?.baseSnapshot?.damageDice) || 0)) +
            Math.max(0, Math.floor(Number(aoeMelee?.powerBonusDice) || 0));
        const critLegal = critAppliesToAttackRoll({
            spell: tnKind === 'casting',
            damageDice: spellDamageDice,
        }) || npcCrit;
        if (critLegal) {
            const economyForStones = actionEco.getActionEconomyActor(attacker) ?? attacker;
            const combatRef = globalThis.game?.combat;
            const rsCrit = actionEco.getRoundState(economyForStones, combatRef);
            const critBank = Math.max(0, Math.floor(Number(rsCrit?.stoneBonuses?.critRaises ?? 0) || 0));
            let buffCriticalX = 0;
            try {
                const { getActiveBuffCriticalTier } = await import('../utils/active-buffs.js');
                buffCriticalX = getActiveBuffCriticalTier(attacker);
            }
            catch {
                buffCriticalX = 0;
            }
            const syncedQuota = syncCriticalRoundQuota(rsCrit.criticalQuota, combatRoundKey(combatRef), buffCriticalX);
            let passiveCritCharges = 0;
            try {
                const { getPassiveCriticalRemaining, grantPassiveCombatCharges } = await import('./passive-combat-charges.js');
                if (combatRef?.id)
                    await grantPassiveCombatCharges(economyForStones, combatRef);
                passiveCritCharges = getPassiveCriticalRemaining(economyForStones, combatRef);
            }
            catch {
                passiveCritCharges = 0;
            }
            const sources = listAvailableCriticalSources({
                buffQuotaRemaining: syncedQuota.remaining,
                stoneCritCharges: critBank,
                passiveCritCharges,
            });
            if (npcCrit || sources.length > 0) {
                const sourceSelect = sources.length > 1
                    ? `<select class="crit-source-select" title="Choose Crit source">${sources
                        .map((s) => `<option value="${s.source}">${attackCardEsc(s.label)}</option>`)
                        .join('')}</select>`
                    : sources.length === 1
                        ? `<span class="crit-source-hint">${attackCardEsc(sources[0].label)}</span>`
                        : `<span class="crit-source-hint">NPC Crit</span>`;
                critButtonHtml = `
    <span class="crit-roll-controls">
      ${sourceSelect}
      <button type="button" class="roll-attack-btn roll-attack-btn--crit"
              data-use-crit="1"
              data-attacker-id="${attacker.id}"
              data-target-id="${target.id}"
              data-target-token-id="${targetToken.id}"
              data-attribute="${attribute}"
              data-attribute-value="${attributeValue}"
              data-mastery-rank="${masteryRank}"
              data-normal-tn="${normalTn}"
              data-target-evade="${normalTn}"
              data-base-evade="${normalTn}"
              data-raise-tn="${split?.splitIndex === 2 && split.sharedRaiseTn ? attackCardEsc(split.sharedRaiseTn) : normalTn}"
              data-raise-slots="${split?.splitIndex === 2 ? attackCardEsc(split.sharedRaiseSlots || '0') : '0'}"
              data-free-raises="${split?.splitIndex === 2 ? attackCardEsc(split.sharedRaiseFree || '0') : '0'}"
              data-raise-plan="${split?.splitIndex === 2 ? attackCardEsc(split.sharedRaisePlan || '[]') : '[]'}"
              data-aoe-melee="${aoeMeleeAttr}"
              data-aoe-secondary-ids="${aoeIdsAttr}"
              data-aoe-power-dice="${aoeDiceAttr}"
              data-crit-source="${sources[0]?.source || 'npc'}"
              title="Spend one Crit application. Natural 7s and 8s explode.">
        <i class="fas fa-bolt"></i> Roll with Crit
      </button>
    </span>`;
            }
        }
    }
    catch (err) {
        console.warn('Mastery System | crit button preview failed', err);
    }
    const buttonAttrs = `
            data-attacker-id="${attacker.id}"
            data-target-id="${target.id}"
            data-target-token-id="${targetToken.id}"
            data-attribute="${attribute}"
            data-attribute-value="${attributeValue}"
            data-mastery-rank="${masteryRank}"
            data-normal-tn="${normalTn}"
            data-target-evade="${normalTn}"
            data-base-evade="${normalTn}"
            data-raise-tn="${split?.splitIndex === 2 && split.sharedRaiseTn ? attackCardEsc(split.sharedRaiseTn) : normalTn}"
            data-raise-slots="${split?.splitIndex === 2 ? attackCardEsc(split.sharedRaiseSlots || '0') : '0'}"
            data-free-raises="${split?.splitIndex === 2 ? attackCardEsc(split.sharedRaiseFree || '0') : '0'}"
            data-raise-plan="${split?.splitIndex === 2 ? attackCardEsc(split.sharedRaisePlan || '[]') : '[]'}"
            data-aoe-melee="${aoeMeleeAttr}"
            data-aoe-secondary-ids="${aoeIdsAttr}"
            data-aoe-power-dice="${aoeDiceAttr}"
            data-use-crit="0"`;
    const buttonHtml = `
    <button class="roll-attack-btn" ${buttonAttrs}>
      <i class="fas fa-dice-d20"></i> Roll
    </button>
    ${critButtonHtml}
    ${skipAwaitedHtml}
  `;
    const raisePaidOptions = Array.from({ length: 9 }, (_, paid) => {
        const finalTn = normalTn + paid * RAISE_INCREMENT;
        const label = paid === 0
            ? 'Keine Raises'
            : `${paid} Raise${paid === 1 ? '' : 's'} — TN ${finalTn}`;
        return `<option value="${paid}">${attackCardEsc(label)}</option>`;
    }).join('');
    const raisePlanHtml = raiseContext
        ? `
    <div class="raise-plan-panel">
      <p class="raise-tn-rule hint">+${RAISE_INCREMENT} TN je Paid Raise. Free Raises erhöhen die TN nicht. Effekte nach dem Treffer zuweisen.</p>
      <div class="raise-count-row">
        <label class="raise-count-label">Paid Raises
          <select class="raise-paid-count" aria-label="Paid Raises">${raisePaidOptions}</select>
        </label>
        <label class="raise-count-label raise-free-gm-only" title="Nur GM — oder aus Intellect Stone Free Raises">
          Free Raises <span class="raise-free-pool-hint md-sublabel"></span>
          <input type="number" class="raise-free-count" min="0" max="8" step="1" value="0" />
        </label>
      </div>
      <p class="raise-plan-live md-sublabel">Effekte nach einem Treffer zuweisen.</p>
    </div>`
        : '';
    const raisesTitle = tnKind === 'casting'
        ? `Paid Raises im Dropdown wählen (TN steht in der Option). Free Raises nur GM / Stones. Effekte nach dem Treffer.${aoeMelee ? ' AoE: ein Wurf, jede Kreatur gegen ihre eigene Final TN.' : ''}`
        : `Paid Raises im Dropdown wählen (Base ${normalTn}). Free Raises nur GM / Stones. Effekte nach dem Treffer.${aoeMelee ? ' AoE: ein Wurf, jede Kreatur gegen ihre eigene Final TN.' : ''}`;
    const evadeNote = '';
    const keepShown = useSheetPool ? npcAttackKeepDice(sheetAttackRow, masteryRank) : masteryRank;
    const attrLabel = attribute.charAt(0).toUpperCase() + attribute.slice(1);
    const poolLabel = useSheetPool
        ? (sheetAttackRow?.name?.trim() || 'Angriff')
        : attrLabel;
    const wurfLine = `${attributeValue}k${keepShown} (${poolLabel})`;
    const tnLabel = tnKind === 'casting'
        ? aoeMelee
            ? 'Anchor TN'
            : 'Casting TN'
        : aoeMelee
            ? 'Anchor Evade'
            : 'Target Evade';
    const tnValue = tnKind === 'casting' && castingBaseTn != null ? castingBaseTn : normalTn;
    const hitLine = raiseContext
        ? formatOnHitSummary(raiseContext.baseSnapshot, raiseContext.weaponDamageDice, raiseContext.weaponName)
        : '';
    const spellFocusSources = tnKind === 'casting' ? listActorSpellFocusSources(attacker) : [];
    const spellFocusLine = spellFocusSources.length > 0
        ? spellFocusSources.map((s) => `+${s.dice}d8 ${s.name}`).join('; ')
        : '';
    const content = `
    <div class="mastery-attack-card">
      <div class="attack-header">
        <h3><i class="fas ${headerIcon}"></i> ${optionName}</h3>
        <p class="attack-participants"><strong>${attackerName}</strong> → ${aoeMelee
        ? `<strong>AoE</strong> (${1 + (aoeMelee.secondaryTokenIds?.length ?? 0)} Ziel(e) — ein Wurf, kein Primärziel)`
        : `<strong>${targetName}</strong>`}</p>
      </div>
      ${threatenedHtml}
      <div class="attack-details">
        <div class="detail-row">
          <span class="detail-label">Wurf:</span>
          <span class="detail-value">${wurfLine}</span>
        </div>
        ${tr.rollDisadvantage
        ? `<div class="detail-row"><span class="detail-label">Nachteil:</span><span class="detail-value">nur eine 8 explodiert</span></div>`
        : ""}
        ${tnKind === 'casting'
        ? `<label class="detail-row willing-spell-target-label"><input type="checkbox" class="willing-spell-target" /> Willing target — Spell Resistance 0 (chosen before the Casting Roll)</label>`
        : ''}
        <div class="detail-row">
          <span class="detail-label">${tnLabel}:</span>
          <span class="detail-value">${tnValue}${evadeNote}${aoeMelee ? ' — jede Kreatur extra' : ''}${raiseContext
        ? ` · Raises im Dropdown`
        : ''}</span>
        </div>
        ${weapon ? `<div class="detail-row"><span class="detail-label">Weapon:</span><span class="detail-value">${attackCardEsc(weapon.name)}</span></div>` : ""}
        ${spellFocusLine
        ? `<div class="detail-row"><span class="detail-label">Spell Focus:</span><span class="detail-value">${attackCardEsc(spellFocusLine)}</span></div>`
        : ''}
        ${npcAttackDetailHtml}
        ${hitLine
        ? `<div class="detail-row"><span class="detail-label">On hit:</span><span class="detail-value raise-cost-display">${attackCardEsc(hitLine)}</span></div>`
        : ''}
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
            ui.notifications?.info?.(`Threatened Ranged: Nachteil auf den Fernangriff. Bedrohende Gegner dürfen sofort eine legale Reaktion nutzen: ${oppNames.join(", ") || "—"}`);
            // PG 9725: the Reaction window opens immediately AFTER DECLARATION —
            // before the attack roll, not after the attack resolves.
            try {
                const { runInteractiveReactionWindow } = await import('./reaction-window-chat.js');
                await runInteractiveReactionWindow({
                    defender: target,
                    attacker: attacker,
                    combat: game.combat ?? null,
                    rawDamage: 0,
                    attackTotal: null,
                    evadeTn: normalTn,
                    hit: false,
                    phase: 'others',
                    opportunityEnemyTokenIds: tr.opportunityEnemyTokenIds,
                    silentIfEmpty: true,
                });
            }
            catch (trErr) {
                console.warn('Mastery System | Threatened Ranged declaration window failed', trErr);
            }
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
                        setupRaisesHandler(altElement, messageId, normalTn, raiseContext);
                    }
                }
                else {
                    setupRaisesHandler(messageElement, messageId, normalTn, raiseContext);
                }
            }, 100);
            return String(messageId);
        }
    }
    catch (error) {
        console.error("Mastery System | [ATTACK EXECUTOR] Failed to create attack card", error);
        ui.notifications?.error("Failed to create attack card");
    }
    return null;
}
export async function createMeleeAttackCard(attackerToken, targetToken, option, burstVolley = null, aoeMelee = null) {
    return createAttackCard(attackerToken, targetToken, option, "melee", null, burstVolley, aoeMelee);
}
export async function createRangedAttackCard(attackerToken, targetToken, option, aoeZone = null) {
    return createAttackCard(attackerToken, targetToken, option, "ranged", null, null, aoeZone);
}
const raisePlanAppliers = new Map();
export function applyRemoteRaisePlan(payload) {
    const id = String(payload?.messageId || '');
    const apply = raisePlanAppliers.get(id);
    const paid = Math.max(0, Math.floor(Number(payload?.paid ?? payload?.draft?.paid) || 0));
    const free = Math.max(0, Math.floor(Number(payload?.free ?? payload?.draft?.free) || 0));
    if (apply) {
        apply({ paid, free }, String(payload.summary || ''));
        return;
    }
    const live = globalThis.document?.querySelector?.(`.message[data-message-id="${CSS.escape(id)}"] .raise-plan-live`);
    if (live)
        live.textContent = String(payload.summary || '');
}
function broadcastRaisePlan(messageId, draft, summary) {
    const gameAny = globalThis.game;
    gameAny?.socket?.emit?.(ENCOUNTER_SOCKET, {
        type: 'raisePlanLive',
        messageId,
        fromUserId: gameAny.user?.id ?? null,
        paid: draft.paid,
        free: draft.free,
        draft,
        summary,
    });
}
let raisePlanHooksRegistered = false;
export function registerRaisePlanChatHooks() {
    if (raisePlanHooksRegistered)
        return;
    raisePlanHooksRegistered = true;
    const HooksAny = globalThis.Hooks;
    if (!HooksAny?.on)
        return;
    HooksAny.on('renderChatMessageHTML', (message, htmlRaw) => {
        try {
            const flags = message?.flags?.['mastery-system'];
            if (!flags?.raiseOptions || !Array.isArray(flags.raiseOptions) || !flags.basePowerSnapshot)
                return;
            const jq = globalThis.$;
            if (!jq)
                return;
            const $root = htmlRaw instanceof HTMLElement ? jq(htmlRaw) : htmlRaw;
            if (!$root?.find)
                return;
            const panel = $root.find('.raise-plan-panel');
            if (!panel.length)
                return;
            const host = panel.closest('.message');
            setupRaisesHandler(host.length ? host : $root, String(message.id), Number(flags.normalTn) || 0, {
                masteryRank: Math.max(1, Math.floor(Number(flags.masteryRank) || 1)),
                isSpell: !!flags.powerIsSpell,
                baseSnapshot: flags.basePowerSnapshot,
                raiseOptions: flags.raiseOptions,
                weaponDamageDice: Number(flags.weaponDamageDice) || 0,
                weaponName: String(flags.weaponName || '').trim() || undefined,
            });
        }
        catch (err) {
            console.warn('Mastery System | raise plan chat hook failed', err);
        }
    });
}
function setupRaisesHandler(messageElement, messageId, normalTn, raiseContext) {
    const panel = messageElement.find('.raise-plan-panel');
    const button = messageElement.find('.roll-attack-btn').first();
    const syncCritSource = () => {
        const selected = String(messageElement.find('.crit-source-select').val() || '');
        if (selected) {
            messageElement.find('.roll-attack-btn--crit').attr('data-crit-source', selected);
        }
    };
    messageElement.find('.crit-source-select').on('change', syncCritSource);
    syncCritSource();
    const gameAny = globalThis.game;
    const msg = gameAny?.messages?.get?.(messageId);
    const msFlags = msg?.getFlag?.('mastery-system') || msg?.flags?.['mastery-system'] || {};
    const persistedPaid = Math.max(0, Math.floor(Number(msFlags.declaredRaiseSlots) || 0));
    const persistedFree = Math.max(0, Math.floor(Number(msFlags.freeRaiseSlots) || 0));
    const persistedTn = Math.max(0, Math.floor(Number(msFlags.raiseTn) || 0) || normalTn + persistedPaid * RAISE_INCREMENT);
    button.attr('data-normal-tn', String(normalTn));
    button.attr('data-target-evade', String(normalTn));
    button.attr('data-base-evade', String(normalTn));
    // Never wipe persisted Raises on chat re-render (Faith Fracture / HUD refresh).
    if (persistedPaid > 0 || persistedFree > 0 || Number(msFlags.raiseTn) > 0) {
        button.attr('data-raise-tn', String(persistedTn));
        button.attr('data-raise-slots', String(persistedPaid));
        button.attr('data-free-raises', String(persistedFree));
    }
    else if (!button.attr('data-raise-slots')) {
        button.attr('data-raise-tn', String(normalTn));
        button.attr('data-raise-slots', '0');
        button.attr('data-free-raises', '0');
    }
    if (!button.attr('data-raise-plan'))
        button.attr('data-raise-plan', '[]');
    messageElement.find('.roll-attack-btn--crit').each((_, el) => {
        const $el = globalThis.$(el);
        $el.attr('data-normal-tn', String(normalTn));
        $el.attr('data-target-evade', String(normalTn));
        $el.attr('data-base-evade', String(normalTn));
    });
    if (!raiseContext || !panel.length)
        return;
    if (panel.attr('data-raise-bound') === '1') {
        // Already wired — button attrs were refreshed from flags above. Do not
        // overwrite the select (player may still be choosing Raises).
        return;
    }
    panel.attr('data-raise-bound', '1');
    const maxSlots = 8;
    const isGM = !!gameAny?.user?.isGM;
    const freeRaisePool = () => {
        try {
            const id = String(button.attr('data-attacker-id') || '');
            const actor = gameAny?.actors?.get?.(id);
            const rs = actor?.getFlag?.('mastery-system', 'roundState');
            return Math.max(0, Math.floor(Number(rs?.stoneBonuses?.freeRaises) || 0));
        }
        catch {
            return 0;
        }
    };
    let applyingRemote = false;
    // Split Strike 2 / persisted flags / stone Free Raises (auto-filled once).
    const presetPaid = Math.max(persistedPaid, Math.floor(Number(button.attr('data-raise-slots')) || 0));
    const poolNow = freeRaisePool();
    const freeAlreadySet = msFlags.freeRaiseSlots != null ||
        button.attr('data-free-raises-set') === '1' ||
        Math.floor(Number(button.attr('data-free-raises')) || 0) > 0 ||
        persistedFree > 0;
    const presetFree = freeAlreadySet
        ? Math.max(persistedFree, Math.floor(Number(button.attr('data-free-raises')) || 0))
        : poolNow;
    panel.find('.raise-paid-count').val(String(presetPaid));
    panel.find('.raise-free-count').val(String(presetFree));
    panel.find('.raise-free-count').attr('max', String(Math.max(poolNow, presetFree, 8)));
    if (!freeAlreadySet && presetFree > 0) {
        button.attr('data-free-raises-set', '1');
    }
    // Players never edit Free Raises — Stones auto-fill or GM adjusts.
    if (!isGM) {
        panel.find('.raise-free-count').prop('disabled', true).attr('readonly', 'readonly');
        panel.find('.raise-free-gm-only').attr('title', 'Free Raises: nur der GM oder Intellect Stones');
    }
    const readCounts = () => {
        const paid = Math.max(0, Math.min(maxSlots, Math.floor(Number(panel.find('.raise-paid-count').val()) || 0)));
        let free = Math.max(0, Math.min(maxSlots, Math.floor(Number(panel.find('.raise-free-count').val()) || 0)));
        if (!isGM) {
            // Players cannot change Free Raises — keep persisted / button value.
            free = Math.max(persistedFree, Math.floor(Number(button.attr('data-free-raises')) || 0));
            panel.find('.raise-free-count').val(String(free));
        }
        return { paid, free };
    };
    const persistCounts = async (paid, free, finalTn) => {
        try {
            const m = gameAny?.messages?.get?.(messageId);
            if (!m?.setFlag)
                return;
            await m.setFlag('mastery-system', 'declaredRaiseSlots', paid);
            await m.setFlag('mastery-system', 'freeRaiseSlots', free);
            await m.setFlag('mastery-system', 'raiseTn', finalTn);
            await m.setFlag('mastery-system', 'normalTn', normalTn);
        }
        catch (err) {
            console.warn('Mastery System | persist raise counts failed', err);
        }
    };
    const updatePreview = (broadcast = false) => {
        let { paid, free } = readCounts();
        const pool = freeRaisePool();
        panel
            .find('.raise-free-pool-hint')
            .text(pool > 0 ? `(Steine: ${pool})` : '');
        if (isGM && free > pool && pool >= 0) {
            // GM may still force Free Raises above the pool for adjudication.
        }
        if (paid + free > maxSlots) {
            free = Math.max(0, maxSlots - paid);
            panel.find('.raise-free-count').val(String(free));
        }
        panel.find('.raise-paid-count').val(String(paid));
        const { finalTn } = computeRaiseTns(normalTn, paid);
        const summary = paid + free > 0
            ? `Paid ${paid} · Free ${free} → Final TN ${finalTn}. Effekte nach dem Treffer.`
            : `Keine Raises — TN ${finalTn}.`;
        panel.find('.raise-plan-live').text(free > 0
            ? `Free Raises: ${free} (keine TN-Erhöhung). Effekte nach dem Treffer.`
            : 'Effekte nach einem Treffer zuweisen.');
        messageElement.find('.raise-cost-display').text(formatHitBreakdown(raiseContext.weaponDamageDice, raiseContext.baseSnapshot.damageDice, {
            raiseDice: 0,
            specials: raiseContext.baseSnapshot.specials,
            weaponName: raiseContext.weaponName,
        }));
        messageElement.find('.roll-attack-btn').each((_, el) => {
            const $btn = globalThis.$(el);
            $btn.attr('data-raise-tn', String(finalTn));
            $btn.attr('data-raise-slots', String(paid));
            $btn.attr('data-free-raises', String(free));
            $btn.attr('data-raise-plan', '[]');
            $btn.attr('data-raises', String(paid + free));
            $btn.attr('data-blood-raises', '0');
            $btn.removeAttr('data-raise-cost-waived');
            $btn.removeAttr('data-spell-cost');
        });
        void persistCounts(paid, free, finalTn);
        if (broadcast && !applyingRemote)
            broadcastRaisePlan(messageId, { paid, free }, summary);
    };
    raisePlanAppliers.set(messageId, (draft, _summary) => {
        applyingRemote = true;
        try {
            panel.find('.raise-paid-count').val(String(draft.paid));
            if (isGM)
                panel.find('.raise-free-count').val(String(draft.free));
            updatePreview(false);
        }
        finally {
            applyingRemote = false;
        }
    });
    panel
        .find('.raise-paid-count')
        .off('input.masteryRaisePlan change.masteryRaisePlan')
        .on('input.masteryRaisePlan change.masteryRaisePlan', () => updatePreview(true));
    if (isGM) {
        panel
            .find('.raise-free-count')
            .off('input.masteryRaisePlan change.masteryRaisePlan')
            .on('input.masteryRaisePlan change.masteryRaisePlan', () => updatePreview(true));
    }
    updatePreview(false);
}
//# sourceMappingURL=attack-executor.js.map