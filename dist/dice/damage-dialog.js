/**
 * Damage Dialog for Mastery System
 * Appears after successful attack roll to calculate and apply damage
 */
import { getPowerDefinitionRank } from '../utils/power-definition-rank.js';
import { collectMechanicsContributions } from '../utils/power-mechanics.js';
import { getPassiveSlots } from '../powers/passives.js';
import { resolveEquippedWeaponForAttackType } from '../utils/equipment-modifiers.js';
import { applyMeleeUnarmedFallback, artifactToVirtualWeapon } from '../utils/unarmed-fallback.js';
import { formatNpcSpecialLabel, getNpcAttackByIndex, npcDamageDiceFormula, npcSpecialEffectString } from '../utils/npc-attack-model.js';
import { previewTempHPConsumption } from '../combat/passive-triggers.js';
import { applyDefensiveMitigation, countNaturalEights } from '../combat/damage-mitigation.js';
import { artifactSystemHasSpellFocus } from '../utils/artifact-rules.js';
import { deriveArtifactWeaponDamage } from '../utils/artifact-base-derive.js';
import { getActorSpellFocusBonusDice } from '../utils/artifact-base-values.js';
import { bindChosenSpecialIntoLevelData, countRaiseSlots, computeTotalRaiseCost, resolvePowerSnapshot, snapshotToDamageFormula, snapshotToSpecialStrings, formatSnapshotSummary, } from '../combat/raise-resolution.js';
import { RAISE_INCREMENT } from '../utils/constants.js';
import { computeMarkFloorBonus, clampMarkSpend } from './mark-floor.js';
import { extractSmiteDice, isSmiteValidTarget, stripSmiteSpecials, } from '../utils/creature-type.js';
import { formatEffectReference } from '../utils/special-effects.js';
/**
 * Weapon specials come in two shapes: plain strings ("Penetration(4)") on
 * conventional weapons, and `{ specialId, value }` refs on artifact virtual
 * weapons. Normalize both to the display/parse string form.
 */
function normalizeWeaponSpecial(s) {
    if (s && typeof s === 'object')
        return formatEffectReference(s);
    return String(s ?? '').trim();
}
export { computeMarkFloorBonus, clampMarkSpend } from './mark-floor.js';
/**
 * Add `bonusDice` d8 to a damage formula. Empty / "0" → "Nd8"; pure "Xd8" →
 * "(X+N)d8"; anything else gets " + Nd8" appended.
 */
function addD8DiceToFormula(formula, bonusDice) {
    if (!bonusDice || bonusDice <= 0)
        return formula;
    const f = String(formula ?? '').trim();
    if (!f || f === '0')
        return `${bonusDice}d8`;
    const m = f.match(/^(\d+)d8$/i);
    if (m)
        return `${parseInt(m[1], 10) + bonusDice}d8`;
    return `${f} + ${bonusDice}d8`;
}
/** True when a power item is a damaging Spell (carries the `spell` tag). */
function isSpellPowerItem(powerItem) {
    const sys = powerItem?.system ?? {};
    if (sys.isSpell === true)
        return true;
    return Array.isArray(sys.tags) && sys.tags.includes('spell');
}
/** Embedded item by id (Foundry Collection.get, array, or Map values). */
function resolveEmbeddedItemOnActor(actor, itemId) {
    if (!actor?.items || !itemId)
        return undefined;
    const coll = actor.items;
    if (typeof coll.get === 'function') {
        const got = coll.get(itemId);
        if (got)
            return got;
    }
    let list = [];
    if (Array.isArray(coll))
        list = coll;
    else if (coll instanceof Map)
        list = Array.from(coll.values());
    else if (coll.size !== undefined && typeof coll.values === 'function') {
        list = Array.from(coll.values());
    }
    return list.find((item) => item?.id === itemId || item?._id === itemId);
}
/** Power item for damage card: embedded actor item or world item owned by actor. */
function resolvePowerItemForDamage(actor, powerId) {
    const embedded = resolveEmbeddedItemOnActor(actor, powerId);
    if (embedded?.type === 'power')
        return embedded;
    try {
        const gi = game.items?.get(powerId);
        if (gi?.type === 'power' && gi.actor?.id === actor?.id)
            return gi;
    }
    catch {
        /* ignore */
    }
    return undefined;
}
/** One roll-damage resolution per damage-card message (guards pop-up + chat double-click). */
const rollDamageMessageLocks = new Set();
/** Pending Promise resolver for each open damage chat card (re-bind after chat re-render). */
const damageCardPendingResolves = new Map();
const damageCardSettledMessageIds = new Set();
let damageCardChatHooksRegistered = false;
function completeDamageCard(messageId, result) {
    if (damageCardSettledMessageIds.has(messageId))
        return;
    const fn = damageCardPendingResolves.get(messageId);
    if (!fn)
        return;
    damageCardSettledMessageIds.add(messageId);
    damageCardPendingResolves.delete(messageId);
    fn(result);
}
/**
 * Re-attach Roll / Cancel listeners when the log re-renders (Foundry v13
 * `renderChatMessageHTML`). Without this, handlers are lost while an in-memory
 * roll lock can remain — the button stays dead after reload/reroll flows.
 */
export function registerDamageCardChatHooks() {
    if (damageCardChatHooksRegistered)
        return;
    damageCardChatHooksRegistered = true;
    Hooks.on('renderChatMessageHTML', (message, htmlRaw) => {
        try {
            const ms = message.flags?.['mastery-system'];
            if (ms?.damageType !== 'selection')
                return;
            const $root = htmlRaw instanceof HTMLElement ? $(htmlRaw) : htmlRaw;
            const inNode = $root.find('.mastery-damage-card').length > 0 ||
                $root.is('.mastery-damage-card') ||
                $root.closest('.message').find('.mastery-damage-card').length > 0;
            if (!inNode)
                return;
            attachDamageCardHandlers(message.id);
        }
        catch (e) {
            console.warn('Mastery System | damage card renderChatMessageHTML hook', e);
        }
    });
}
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
 * means Nd8 (NOT exploding), never N flat. Players Guide ~5854: damage dice
 * do not explode unless a rule (Crit, Brutal, …) explicitly says so.
 * Formulas that already contain dice notation are returned unchanged.
 */
function masteryCoercePlainNumberToNd8(sanitizedFormula) {
    const t = (sanitizedFormula || '').trim();
    if (!t || t === '0')
        return '0';
    if (/^\d+$/.test(t)) {
        const n = parseInt(t, 10);
        if (!Number.isFinite(n) || n <= 0)
            return '0';
        return `${Math.min(n, MAX_MASTERY_DAMAGE_DICE)}d8`;
    }
    return t;
}
/**
 * No-op kept for callers — Mastery damage never explodes by default. If a
 * specific power / special wants exploding damage it must build the formula
 * itself (e.g. `${n}d8x8`) via the appropriate template hook.
 */
function masteryApplyExplodingD8(formula) {
    return formula;
}
function weaponOrPowerNumericToNd8(raw) {
    if (typeof raw === 'number' && Number.isFinite(raw)) {
        const n = Math.floor(raw);
        if (n <= 0)
            return '0';
        return `${Math.min(n, MAX_MASTERY_DAMAGE_DICE)}d8`;
    }
    if (typeof raw === 'string') {
        const tr = raw.trim();
        if (/^\d+$/.test(tr)) {
            const n = parseInt(tr, 10);
            if (n <= 0)
                return '0';
            return `${Math.min(n, MAX_MASTERY_DAMAGE_DICE)}d8`;
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
    // Spell Focus weapons route their value into Spell damage and deal NO normal
    // weapon damage — even though they keep their melee/ranged base profile.
    if (weapon.type === 'artifact' && artifactSystemHasSpellFocus(weaponSystem)) {
        return '0';
    }
    // Artifact weapons (e.g. Dragon Claws) keep their dice on
    // `system.artifactWeapon.damage` (e.g. "4d8"), NOT on `system.damage`.
    // Prefer it when present so artifacts don't fall back to the 1d8 default.
    // For standard one/two-handed profiles, derive the canonical base+level dice
    // live (2d8/4d8 base + 1d8/level) so existing artifacts always reflect the
    // current rule even when their baked damage string is stale.
    const artifactLevel = Math.max(1, Math.min(10, Number(weaponSystem.currentLevel) || Number(weaponSystem.level) || 1));
    const derivedArtifactDamage = weapon.type === 'artifact' ? deriveArtifactWeaponDamage(weaponSystem.baseProfile, artifactLevel) : null;
    const artifactWeaponDamage = derivedArtifactDamage ??
        (typeof weaponSystem.artifactWeapon?.damage === 'string'
            ? weaponSystem.artifactWeapon.damage.trim()
            : '');
    const baseDamageRaw = (artifactWeaponDamage.length > 0 ? artifactWeaponDamage : undefined) ??
        weaponSystem.damage ??
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
    // CRITICAL: Always get fresh actor from game to ensure we have latest items.
    // The attacker parameter might be a stale reference — BUT for an UNLINKED
    // token the synthetic token actor shares the base actor's id, so
    // `game.actors.get(id)` would return the world/prototype actor (default
    // attributes, possibly missing the equipped weapon + the token's delta).
    // Keep the token actor as-is in that case; only re-fetch for world actors.
    const freshAttacker = attacker?.isToken
        ? attacker
        : (attacker?.id ? game.actors?.get(attacker.id) : attacker);
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
    const isNpcAttackFlow = !!(flags?.npcAttackSource === true && actorToUse.type === 'npc');
    // Resolve weapon with priority: forced weapon > equipped melee weapon > equipped weapon > weaponId match > any weapon
    let weaponForDamage = null;
    // Method 0: Forced weapon (artifact / natural weapon attack) — this attack
    // always rolls that weapon's dice, regardless of what else is equipped and
    // regardless of attack type (a melee artifact weapon also backs the
    // artifact's own ranged attack rows).
    if (!isNpcAttackFlow && flags?.forcedWeaponItemId) {
        const forced = items.find((item) => item.id === flags.forcedWeaponItemId);
        if (forced?.type === 'artifact') {
            const vw = artifactToVirtualWeapon(forced);
            if (vw)
                weaponForDamage = vw;
        }
        else if (forced?.type === 'weapon') {
            weaponForDamage = forced;
        }
    }
    // Method 1: If weaponId is provided, try to find it first (but verify it's still valid)
    if (!isNpcAttackFlow && !weaponForDamage && weaponId && actorToUse) {
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
                weaponForDamage = strict;
            }
            else {
                weaponForDamage = null;
            }
        }
    }
    // Method 1.5: If not found in actor items, try to get it directly from game.items
    if (!isNpcAttackFlow && !weaponForDamage && weaponId) {
        try {
            const weaponItem = game.items?.get(weaponId);
            if (weaponItem && weaponItem.actor?.id === actorToUse?.id) {
                weaponForDamage = weaponItem;
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
    }
    // Method 4: Virtual unarmed when no equipped weapon (melee only)
    if (!isNpcAttackFlow && !weaponForDamage) {
        const atk = flags?.attackType === 'ranged' || flags?.attackType === 'melee'
            ? flags.attackType
            : 'melee';
        weaponForDamage = applyMeleeUnarmedFallback(weaponForDamage, atk);
    }
    // Resolve base damage using helper (returns string directly)
    const baseDamage = isNpcAttackFlow ? '0' : resolveWeaponBaseDamage(weaponForDamage);
    // Sanitize base damage before use
    const sanitizedBaseDamage = sanitizeDiceNotation(baseDamage);
    // Weapon specials should come from the same resolved weapon (only once)
    const weaponSpecials = isNpcAttackFlow
        ? []
        : (weaponForDamage?.system?.specials ?? [])
            .map(normalizeWeaponSpecial)
            .filter(Boolean);
    // Debug log after weapon resolve
    // Load selected power from actor by ID and get its data
    let powerDamage = '0';
    let powerSpecials = [];
    let selectedPowerData = null;
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
        const selectedPower = resolvePowerItemForDamage(actorToUse, selectedPowerId);
        if (selectedPower) {
            const powerSystem = selectedPower.system;
            const rawLevel = powerSystem.level || 1;
            let levelData = null;
            try {
                const powersModule = await import('../utils/powers/index.js');
                const templates = powersModule.ALL_POWER_TEMPLATES || [];
                const templateId = powerSystem.templateId;
                let powerDef = null;
                if (templateId) {
                    powerDef = templates.find((t) => t?.templateId === templateId);
                }
                if (!powerDef) {
                    powerDef = templates.find((t) => t?.templateName === selectedPower.name || t?.name === selectedPower.name);
                }
                if (powerDef && powerDef.levels) {
                    const definitionRank = getPowerDefinitionRank(rawLevel, powerSystem.levels || powerDef.levels);
                    // Prefer the item's own bound levels (SPECIAL placeholder already
                    // replaced by chosenSpecial at item creation) over the raw template.
                    const levelsSource = powerSystem.levels || powerDef.levels;
                    if (Array.isArray(levelsSource)) {
                        levelData = levelsSource.find((l) => l.level === definitionRank);
                    }
                    else {
                        levelData = levelsSource[String(definitionRank)];
                    }
                    levelData = bindChosenSpecialIntoLevelData(levelData, powerSystem.chosenSpecial?.key);
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
        }
        else {
            console.error('Mastery System | [DAMAGE DIALOG] ERROR: Selected power not found in actor items', {
                selectedPowerId: selectedPowerId,
                totalItems: items.length,
                specialItems: items.filter((item) => item.type === 'power').length,
                allSpecialIds: items.filter((item) => item.type === 'power').map((item) => item.id)
            });
            const fbDmg = flags?.selectedPowerDamage;
            const fbSpecs = flags?.selectedPowerSpecials;
            const hasFbDamage = fbDmg != null && String(fbDmg).trim() !== '';
            const hasFbSpecs = Array.isArray(fbSpecs) && fbSpecs.length > 0;
            if (hasFbDamage || hasFbSpecs) {
                powerDamage = hasFbDamage ? cleanPowerDamage(fbDmg) : '0';
                powerSpecials = hasFbSpecs ? [...fbSpecs] : [];
                selectedPowerData = {
                    id: selectedPowerId,
                    name: 'Power',
                    level: Math.max(1, Number(flags?.selectedPowerLevel) || 1),
                    specials: powerSpecials,
                    damage: powerDamage
                };
                console.warn('Mastery System | [DAMAGE DIALOG] Using attack-card flag fallback for power data', {
                    selectedPowerId,
                    powerDamage,
                    powerSpecialsCount: powerSpecials.length
                });
            }
        }
    }
    else {
    }
    // Spell Focus: weapon-slot artifacts that route their value into Spell
    // damage add their bonus dice whenever a damaging Spell is being resolved.
    let spellFocusBonusDice = 0;
    if (selectedPowerId) {
        try {
            const spellPower = resolvePowerItemForDamage(actorToUse, selectedPowerId);
            if (spellPower && isSpellPowerItem(spellPower)) {
                spellFocusBonusDice = getActorSpellFocusBonusDice(actorToUse);
                if (spellFocusBonusDice > 0) {
                    powerDamage = addD8DiceToFormula(powerDamage, spellFocusBonusDice);
                    if (selectedPowerData)
                        selectedPowerData.damage = powerDamage;
                }
            }
        }
        catch (err) {
            console.warn('Mastery System | spell focus bonus failed', err);
        }
    }
    let raiseOutcomeLine = '';
    let resolvedPowerSnapshot = null;
    if (flags?.basePowerSnapshot && flags?.raiseOutcome) {
        const masteryRank = Math.max(1, Math.floor(Number(actorToUse.system?.mastery?.rank) || flags.masteryRank || 2));
        const isSpell = !!flags.powerIsSpell;
        const declaredRaises = Array.isArray(flags.declaredRaises)
            ? [...flags.declaredRaises]
            : [];
        // Same safety net as the roll handler: the Raise TN actually rolled
        // against implies how many Raise slots were declared. If the transported
        // plan lost entries (fragile DOM attr), pad with default damage Raises so
        // the Raise Cost is subtracted on a partial outcome.
        const normalTnFromFlags = Math.max(0, Math.floor(Number(flags.normalTn) || 0));
        const raiseTnFromFlags = Math.max(0, Math.floor(Number(flags.raiseTn) || 0));
        const tnImpliedSlots = normalTnFromFlags > 0 && raiseTnFromFlags > normalTnFromFlags
            ? Math.round((raiseTnFromFlags - normalTnFromFlags) / RAISE_INCREMENT)
            : 0;
        for (let i = countRaiseSlots(declaredRaises); i < tnImpliedSlots; i++) {
            declaredRaises.push({ effect: 'damage', slots: 1 });
        }
        const outcome = flags.raiseOutcome;
        resolvedPowerSnapshot = resolvePowerSnapshot({
            base: flags.basePowerSnapshot,
            declaredRaises,
            outcome,
            masteryRank,
            isSpell,
            stoneBonusRaises: Math.max(0, Number(flags.stoneBonusRaises) || 0),
            spellCostOverride: flags.spellCostOverride,
        });
        powerDamage = snapshotToDamageFormula(resolvedPowerSnapshot);
        const resolvedSpecials = snapshotToSpecialStrings(resolvedPowerSnapshot);
        if (selectedPowerData) {
            selectedPowerData.damage = powerDamage;
            selectedPowerData.specials = resolvedSpecials;
        }
        powerSpecials.length = 0;
        powerSpecials.push(...resolvedSpecials);
        const lostCost = computeTotalRaiseCost(countRaiseSlots(declaredRaises), masteryRank);
        const lostCostLabel = isSpell ? `${lostCost} value` : `${lostCost}d8`;
        raiseOutcomeLine =
            outcome === 'partial'
                ? `Raise failed — applying ${formatSnapshotSummary(resolvedPowerSnapshot)} (Raise cost of ${lostCostLabel} lost)`
                : outcome === 'full'
                    ? `Raise succeeded — ${formatSnapshotSummary(resolvedPowerSnapshot)}`
                    : '';
    }
    let npcAutoDamageDice = 0;
    let npcStressD8 = 0;
    const npcAutoSpecialStrings = [];
    const npcLists = buildNpcSpecialOptionsFromActor(actorToUse);
    npcAutoSpecialStrings.push(...npcLists.autoEffectStrings);
    if (isNpcAttackFlow) {
        const atk = getNpcAttackByIndex(actorToUse.system, flags?.npcAttackIndex, flags?.npcPhaseIndex);
        powerDamage = npcDamageDiceFormula(atk);
        npcStressD8 = Math.max(0, Math.floor(Number(atk?.npcStressD8) || 0));
        npcAutoDamageDice += 0; // legacy npc autoRaises removed with new Raise rules
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
    // Collect available specials (include power specials from selected power)
    // Use weaponForDamage (found weapon or fallback) to ensure weapon specials are included
    const baseSpecials = await collectAvailableSpecials(actorToUse, weaponForDamage, selectedPowerData);
    const availableSpecials = [...baseSpecials, ...npcLists.options];
    const weaponInnateLines = weaponForDamage
        ? []
            .concat(weaponForDamage.system?.innateAbilities || [])
            .map((x) => String(x))
        : [];
    const { getActiveSpecialValue } = await import('../system/active-specials.js');
    const targetMarkValue = Math.max(0, getActiveSpecialValue(target, 'mark'));
    // Create damage card as chat message instead of dialog
    return new Promise((resolve) => {
        const damageCardContent = createDamageCardContent(attacker, target, baseDamage, powerDamage, passiveDamage, availableSpecials, weaponSpecials, resolve, selectedPowerData, weaponInnateLines, npcAutoNoteLines, raiseOutcomeLine, targetMarkValue);
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
                    raises: 0,
                    raiseOutcome: flags?.raiseOutcome ?? null,
                    raiseOutcomeLine,
                    resolvedPowerSnapshot,
                    stoneDamageBonusDice,
                    availableSpecials,
                    weaponSpecials,
                    npcAutoDamageDice,
                    npcAutoSpecialStrings,
                    npcAttackSource: !!flags?.npcAttackSource,
                    npcStressD8,
                    splitAttack: !!flags?.splitAttack,
                    splitIndex: flags?.splitIndex ?? null,
                    splitPairId: flags?.splitPairId ?? null,
                    targetMarkValue,
                }
            }
        };
        ChatMessage.create(chatData).then((message) => {
            damageCardPendingResolves.set(message.id, resolve);
            registerDamageCardChatHooks();
            setTimeout(() => attachDamageCardHandlers(message.id), 100);
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
function createDamageCardContent(attacker, target, baseDamage, powerDamage, passiveDamage, availableSpecials, _weaponSpecials, _resolve, selectedPower, weaponInnateLines = [], npcAutoNoteLines = [], raiseOutcomeLine = '', targetMarkValue = 0) {
    const raisesSection = raiseOutcomeLine
        ? `<div class="raises-section raise-outcome-line"><p>${damageCardHtmlEsc(raiseOutcomeLine)}</p></div>`
        : '';
    const markMax = Math.max(0, Math.floor(Number(targetMarkValue) || 0));
    let markSpendSection = '';
    if (markMax > 0) {
        // Mark spend is chosen AFTER the damage roll (post-roll prompt with exact
        // "total → new total" options) — the card only announces it.
        markSpendSection = `
      <div class="raises-section mark-spend-section">
        <h4><i class="fas fa-bullseye"></i> Mark(${markMax}) on target</h4>
        <p class="raises-description">After the damage roll you may spend any amount of Mark. Spent Mark becomes the Damage Floor for this roll (dice below that value are raised) — the prompt shows exactly how much each option gains. Anyone who hits this target may spend Mark.</p>
      </div>`;
    }
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
              <span class="damage-label">Power Special Effects:</span>
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
      ${markSpendSection}
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
    return html;
}
/**
 * Bind damage-card UI (roll, cancel). Safe to call again after chat HTML refresh.
 */
export function attachDamageCardHandlers(messageId) {
    if (damageCardSettledMessageIds.has(messageId))
        return;
    if (!damageCardPendingResolves.has(messageId))
        return;
    const messageElement = $(`.message[data-message-id="${messageId}"]`);
    if (!messageElement.length) {
        console.warn('Mastery System | Could not find damage card message element', messageId);
        return;
    }
    messageElement.find('.roll-damage-btn').off('click.msRollDamage').on('click.msRollDamage', async function () {
        const $btn = $(this);
        const lockKey = `roll-dmg:${messageId}`;
        if (rollDamageMessageLocks.has(lockKey)) {
            return;
        }
        rollDamageMessageLocks.add(lockKey);
        $btn.prop('disabled', true);
        let rollDamageCompleted = false;
        try {
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
            const attackerId = $btn.data('attacker-id');
            const targetId = $btn.data('target-id');
            const attacker = game.actors?.get(attackerId);
            // Resolve target: prefer token actor if targetTokenId exists in flags (for unlinked tokens)
            let target = null;
            if (flags?.targetTokenId) {
                // Try to get token document from current scene
                const tokenDoc = canvas?.scene?.tokens?.get(flags.targetTokenId);
                if (tokenDoc?.actor) {
                    target = tokenDoc.actor;
                }
            }
            // Fallback to base actor if token not found
            if (!target) {
                target = game.actors?.get(targetId);
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
            if (!flags) {
                console.error('Mastery System | [ROLL DAMAGE BUTTON] Could not find damage card data', {
                    messageId,
                    messageFlags: message.flags,
                    messageFlagsKeys: Object.keys(message.flags || {})
                });
                ui.notifications?.error('Could not find damage card data');
                return;
            }
            // Raise effects are pre-declared on the attack card — no post-roll picker.
            const raiseSelections = new Map();
            // Mark spend is chosen AFTER the roll via a post-roll prompt inside
            // calculateDamageResult (exact "total → new total" options per spend).
            const result = await calculateDamageResult(flags.baseDamage, flags.powerDamage, flags.passiveDamage, 0, raiseSelections, flags.availableSpecials, attacker, target, Math.max(0, Number(flags.stoneDamageBonusDice) || 0), Math.max(0, Number(flags.npcAutoDamageDice) || 0), Array.isArray(flags.npcAutoSpecialStrings) ? flags.npcAutoSpecialStrings : [], flags.selectedPowerId || null, !!flags.splitAttack, flags.attackType === 'ranged' ? 'ranged' : 'melee');
            // NSC signature attacks: Nd8 Stress on hit (plain dice; Stress Armor
            // mitigates inside applyStressToActor). Applies alongside the HP damage.
            const stressDice = Math.max(0, Math.floor(Number(flags.npcStressD8) || 0));
            if (stressDice > 0 && target) {
                try {
                    const stressRoll = await new globalThis.Roll(`${stressDice}d8`).evaluate({ async: true });
                    const stressTotal = Math.max(0, Math.floor(Number(stressRoll?.total) || 0));
                    const { applyStressToActor } = await import('../combat/spell-roll-handler.js');
                    await applyStressToActor(target, stressTotal);
                    result.rollDetails = [
                        ...(result.rollDetails ?? []),
                        `Stress: ${stressDice}d8 → ${stressTotal}`,
                    ];
                    await ChatMessage.create({
                        user: game.user?.id,
                        speaker: ChatMessage.getSpeaker({ actor: attacker }),
                        content: `<p><i class="fas fa-brain"></i> <strong>${target.name}</strong> erleidet <strong>${stressTotal} Stress</strong> (${stressDice}d8).</p>`,
                    });
                }
                catch (err) {
                    console.warn('Mastery System | NPC stress damage failed', err);
                }
            }
            completeDamageCard(messageId, result);
            rollDamageCompleted = true;
        }
        finally {
            rollDamageMessageLocks.delete(lockKey);
            if (!rollDamageCompleted) {
                $btn.prop('disabled', false);
            }
        }
    });
    messageElement.find('.cancel-damage-btn').off('click.msDmgCancel').on('click.msDmgCancel', function () {
        if (damageCardSettledMessageIds.has(messageId))
            return;
        rollDamageMessageLocks.delete(`roll-dmg:${messageId}`);
        const $btn = messageElement.find('.roll-damage-btn');
        $btn.prop('disabled', false);
        completeDamageCard(messageId, null);
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
/**
 * Sums `rollDice.damage` (d8 count) from only **slotted passive** mechanics
 * contributions — same source as the character attack breakdown.
 */
async function calculatePassiveDamage(actor) {
    try {
        const contributions = collectMechanicsContributions(actor);
        let d8 = 0;
        for (const c of contributions) {
            if (c.sourceKind !== 'passive')
                continue;
            const n = c.mechanics?.rollDice?.damage;
            if (typeof n === 'number' && n > 0)
                d8 += Math.floor(n);
        }
        return d8 > 0 ? `${d8}d8` : '0';
    }
    catch (e) {
        console.warn('Mastery System | [DAMAGE DIALOG] calculatePassiveDamage failed', e);
        return '0';
    }
}
/**
 * Collect all available specials (powers, passives, weapon specials)
 * Now includes power specials (e.g., "Lacerate(3)") as individual options
 */
async function collectAvailableSpecials(actor, weapon, selectedPower) {
    const specials = [];
    const items = actor.items || [];
    // Get power specials from selected power (e.g., "Lacerate(3)")
    if (selectedPower && selectedPower.specials && selectedPower.specials.length > 0) {
        for (const specialName of selectedPower.specials) {
            // Defense-in-depth: Split-Attack and Autofire are attack *modes*, not
            // Raise-Specials. Legacy power items may still carry these strings in
            // their `specials` array — filter them out so they never appear in the
            // raise-special picker.
            const normalized = String(specialName || '').trim().toLowerCase();
            if (normalized.startsWith('split-attack') ||
                normalized.startsWith('split attack') ||
                normalized.startsWith('autofire')) {
                continue;
            }
            // Parse special name like "Lacerate(3)" to extract name and value
            const match = specialName.match(/^([^(]+)(?:\((\d+)\))?$/);
            if (match) {
                const specialNameOnly = match[1].trim();
                const specialValue = match[2] ? parseInt(match[2]) : null;
                specials.push({
                    id: `power-special-${specialNameOnly.toLowerCase().replace(/\s+/g, '-')}`,
                    name: specialName, // Keep full name like "Lacerate(3)"
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
    const byId = (id) => items.find((item) => item.id === id || item._id === id || (item.name != null && String(item.name) === id));
    for (const slot of getPassiveSlots(actor)) {
        if (!slot.passive?.id)
            continue;
        const power = byId(String(slot.passive.id));
        if (!power || power.type !== 'power')
            continue;
        const ps = power.system || {};
        if (ps.powerType !== 'passive' || !ps.canUseOnAttack)
            continue;
        if (specials.some((s) => s.id === power.id))
            continue;
        specials.push({
            id: power.id,
            name: power.name,
            type: 'passive',
            description: ps.description || ps.effect || '',
            effect: ps.effect || ps.description || ''
        });
    }
    // Get weapon specials (use the weaponSpecials already resolved above, not duplicate)
    // Note: weaponSpecials is already set from weaponForDamage earlier in the function
    if (weapon && weapon.system?.specials) {
        const weaponSpecialsFromWeapon = weapon.system.specials || [];
        for (const raw of weaponSpecialsFromWeapon) {
            const special = normalizeWeaponSpecial(raw);
            if (!special)
                continue;
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
 * Reduce a target's Mark by the spent amount (removing it at 0). Mark is a
 * global counter on the target; spending it applies the Damage Floor.
 */
async function consumeTargetMark(target, spend) {
    if (!spend || spend <= 0)
        return;
    try {
        const system = target.system;
        const list = Array.isArray(system?.statusEffects) ? system.statusEffects : [];
        let changed = false;
        const next = list
            .map((e) => {
            const id = e?.id ?? '';
            const name = String(e?.name ?? '').toLowerCase();
            if (id === 'mark' || name === 'mark') {
                const remaining = Math.max(0, Math.floor(Number(e.value ?? 0)) - spend);
                changed = true;
                return { ...e, value: remaining };
            }
            return e;
        })
            .filter((e) => !((e?.id === 'mark' || String(e?.name ?? '').toLowerCase() === 'mark') && Math.floor(Number(e.value ?? 0)) <= 0));
        if (changed) {
            await target.update({ 'system.statusEffects': next });
        }
    }
    catch (err) {
        console.warn('Mastery System | consumeTargetMark failed', err);
    }
}
/**
 * Apply status effects from specials to target actor.
 * Challenge uses challenger-bound merge rules (sourceUuid + stack/replace).
 */
async function applyStatusEffectsToTarget(target, specialsUsed, attacker) {
    try {
        // Get current status effects from target
        const system = target.system;
        if (!system.statusEffects) {
            system.statusEffects = [];
        }
        let list = Array.isArray(system.statusEffects) ? [...system.statusEffects] : [];
        const { getEffect } = await import('../utils/special-effects.js');
        const { mergeChallengeEntry } = await import('../system/pool-reduction.js');
        const sourceName = String(attacker?.name ?? 'combat');
        const sourceUuid = attacker ? String(attacker.uuid ?? attacker.id ?? '') || null : null;
        // Add new status effects from specials
        for (const specialName of specialsUsed) {
            // Parse special name like "Lacerate(3)" to extract name and value
            const match = specialName.match(/^([^(]+)(?:\((\d+)\))?$/);
            if (match) {
                const effectName = match[1].trim();
                const effectValue = match[2] ? parseInt(match[2]) : null;
                const effectId = getEffect(effectName)?.id;
                const isChallenge = effectId === 'challenge' || effectName.toLowerCase() === 'challenge';
                if (isChallenge && effectValue !== null && effectValue > 0) {
                    list = mergeChallengeEntry(list, effectValue, sourceName, sourceUuid);
                    continue;
                }
                // Check if effect already exists (match by canonical id when known).
                const existingEffect = list.find((e) => (effectId && e.id === effectId) || e.name === effectName);
                if (existingEffect) {
                    // Update existing effect (e.g., increase stack)
                    if (effectValue !== null) {
                        existingEffect.value = (existingEffect.value || 0) + effectValue;
                    }
                    if (effectId && !existingEffect.id)
                        existingEffect.id = effectId;
                }
                else {
                    // Add new effect
                    list.push({
                        id: effectId,
                        name: effectName,
                        value: effectValue,
                        source: sourceName,
                        ...(sourceUuid ? { sourceUuid } : {}),
                        timestamp: Date.now()
                    });
                }
            }
        }
        // Update target actor
        await target.update({ 'system.statusEffects': list });
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
/** Exported for AoE secondary hits (power dice only, same mitigation pipeline). */
export async function applyDamageToTargetFromAoe(target, damage, attacker, count8s = 0) {
    return applyDamageToTarget(target, damage, attacker, count8s);
}
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
        // Recompute combat totals before defender reactions so DR gating and the
        // reaction dialog see the same `system.combat` as mitigation (token vs
        // prototype mismatch otherwise strips reaction DR%).
        if (typeof target.prepareDerivedData === 'function') {
            try {
                target.prepareDerivedData();
            }
            catch (prepErr) {
                console.warn('Mastery System | [APPLY DAMAGE] prepareDerivedData before reactions failed', prepErr);
            }
        }
        let reactionArmorFlat = 0;
        let reactionDrPct = 0;
        let reactionInitiativeGain = 0;
        try {
            const combat = globalThis.game?.combat ?? null;
            const { promptDefenderReactionsBeforeMitigation } = await import('../combat/defender-reactions.js');
            const reactMit = await promptDefenderReactionsBeforeMitigation({
                defender: target,
                attacker: attacker,
                combat,
                rawDamage: damage,
            });
            reactionArmorFlat = reactMit.reactionArmorFlat;
            reactionDrPct = reactMit.reactionDrPct;
            reactionInitiativeGain = Math.max(0, Math.floor(Number(reactMit.initiativeGain) || 0));
        }
        catch (err) {
            console.debug?.('Mastery System | [APPLY DAMAGE] defender reactions skipped', err);
        }
        if (typeof target.prepareDerivedData === 'function') {
            try {
                target.prepareDerivedData();
            }
            catch (prepErr) {
                console.warn('Mastery System | [APPLY DAMAGE] prepareDerivedData before mitigation failed', prepErr);
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
        // Snapshot pre-hit wound track so blood FX can distinguish chip vs level loss.
        const oldBarIndex = Math.max(0, Math.floor(Number(system.health.currentBar) || 0));
        const barsBefore = system.health.bars.map((b) => ({
            current: Number(b?.current) || 0,
        }));
        // Step 1: Flat Armor + percentage DR + 8s-min floor.
        const baseArmorTotal = Number(system.combat?.armorTotal ?? 0) + Number(system.combat?.armorFromActiveBuffs ?? 0);
        const mitigation = applyDefensiveMitigation({
            rawDamage: damage,
            count8s,
            armorTotal: baseArmorTotal + reactionArmorFlat,
            damageReductionPct: Number(system.combat?.damageReductionPct ?? 0),
            reactionDrPct,
        });
        const mitigated = mitigation.mitigatedDamage;
        // Step 2: Route tempHP reduction through the passive-trigger pool so that
        //         per-source book-keeping (Lean Ward one-shot, Dragon Scales
        //         refresh, …) stays consistent with the scalar mirror. The helper
        //         returns a partial actor-update patch so we can still commit
        //         tempHP + health-bar changes in a single atomic update below.
        const tempHPConsumption = previewTempHPConsumption(target, mitigated);
        const remaining = tempHPConsumption.remainingDamage;
        // Step 3: Apply remaining damage to health bars with overflow
        let barDamage = 0;
        let newBarIndex = oldBarIndex;
        let barsAfter = barsBefore;
        if (remaining > 0) {
            barDamage = remaining;
            // Import applyDamage helper from calculations.ts
            const { applyDamage: applyDamageToBars } = await import('../utils/calculations.js');
            // Copy bars array to mutate. Always deplete from bar 0 (left / Healthy) first
            // so the segmented HP strip matches the wound track; do not use currentBar
            // as the starting index.
            const bars = [...system.health.bars];
            let barIndex = applyDamageToBars(bars, 0, remaining);
            // Clamp barIndex to valid range
            if (barIndex >= bars.length) {
                barIndex = bars.length - 1;
            }
            newBarIndex = barIndex;
            barsAfter = bars.map((b) => ({ current: Number(b?.current) || 0 }));
            // Merge tempHP pool updates with bar updates for a single write.
            try {
                await target.update({
                    ...tempHPConsumption.patch,
                    'system.health.currentBar': barIndex,
                    'system.health.bars': bars
                });
            }
            catch (e) {
                if (mitigated > 0) {
                    console.warn('Mastery System | [APPLY DAMAGE] actor.update (bars) failed with mitigation > 0', {
                        err: e,
                        targetId: target.id,
                        targetName: target.name,
                        mitigated,
                        remaining,
                        barDamage,
                    });
                }
                throw e;
            }
        }
        else if (Object.keys(tempHPConsumption.patch).length > 0) {
            // Only tempHP was reduced, no bar damage
            try {
                await target.update(tempHPConsumption.patch);
            }
            catch (e) {
                if (mitigated > 0) {
                    console.warn('Mastery System | [APPLY DAMAGE] actor.update (tempHP) failed with mitigation > 0', {
                        err: e,
                        targetId: target.id,
                        targetName: target.name,
                        mitigated,
                        patch: tempHPConsumption.patch,
                    });
                }
                throw e;
            }
        }
        // Blood FX under the hit token: splatters for HP chips, mega puddle on health-level loss.
        if (barDamage > 0 && globalThis.canvas?.ready) {
            try {
                const { didLoseHealthLevel, showDamageBloodEffect } = await import('../utils/blood-pool.js');
                const healthLevelLost = didLoseHealthLevel({
                    oldBarIndex,
                    newBarIndex,
                    barsBefore,
                    barsAfter,
                });
                const tokens = target.getActiveTokens?.() ?? [];
                let targetToken = tokens[0] ?? null;
                if (!targetToken) {
                    const sceneTokens = globalThis.game?.scenes?.active?.tokens;
                    const doc = sceneTokens?.find?.((t) => t.actor?.id === target.id);
                    targetToken = doc?.object ?? doc ?? null;
                }
                if (targetToken) {
                    await showDamageBloodEffect(targetToken, {
                        barDamage,
                        healthLevelLost,
                        bloodColor: system.bloodColor,
                    });
                }
            }
            catch (error) {
                console.warn('Mastery System | Could not create blood effect', error);
            }
        }
        // Refresh the actor sheet if it's open
        const sheet = target.sheet;
        if (sheet && sheet.rendered) {
            sheet.render(false);
        }
        if (reactionInitiativeGain > 0) {
            try {
                const combat = globalThis.game?.combat ?? null;
                if (combat) {
                    const { applyMidCombatInitiativeGain } = await import('../combat/initiative-gain.js');
                    const iniResult = await applyMidCombatInitiativeGain(combat, target, reactionInitiativeGain);
                    if (iniResult.applied) {
                        const defName = String(target.name ?? 'Defender');
                        await globalThis.ChatMessage?.create?.({
                            user: globalThis.game?.user?.id,
                            speaker: globalThis.ChatMessage?.getSpeaker?.({ actor: target }),
                            content: `<p class="mastery-reaction-msg"><strong>${defName}</strong> gains <strong>+${reactionInitiativeGain} Initiative</strong> after the attack resolves. ${iniResult.note}</p>`,
                        });
                    }
                }
            }
            catch (iniErr) {
                console.warn('Mastery System | [APPLY DAMAGE] initiative gain after attack failed', iniErr);
            }
        }
        const tail = [];
        if (tempHPConsumption.reducedBy > 0) {
            tail.push(`TempHP ${tempHPConsumption.reducedBy}`);
        }
        if (barDamage > 0) {
            tail.push(`Bars ${barDamage}`);
        }
        else if (mitigated > 0 && tempHPConsumption.reducedBy > 0) {
            tail.push('HP bars 0 (all from Temp-HP this hit)');
        }
        else {
            tail.push('Bars 0');
        }
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
 * Offer a one-time Faith Fracture reroll of the just-rolled damage dice.
 * Shown only when the attacker is a player character with a Faith Fracture
 * left and the current user may act for them (owner or GM). Resolves `false`
 * on decline/close so the damage simply applies.
 */
async function promptDamageFaithReroll(attacker, totalDamage, rollDetails) {
    try {
        if (attacker?.type !== 'character')
            return false;
        const cur = Number(attacker?.system?.faithFractures?.current ?? 0) || 0;
        if (cur < 1)
            return false;
        const user = game.user;
        if (!user?.isGM && !attacker.isOwner)
            return false;
        const esc = (s) => String(s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
        const detailsHtml = rollDetails.length
            ? `<ul style="margin:0.35em 0;font-size:0.85em;opacity:0.9">${rollDetails
                .map((line) => `<li>${esc(line)}</li>`)
                .join('')}</ul>`
            : '';
        return await new Promise((resolve) => {
            new Dialog({
                title: 'Damage rolled — keep or reroll?',
                content: `<p style="margin-bottom:0.35em"><strong>Total damage: ${totalDamage}</strong></p>
          ${detailsHtml}
          <p style="margin:0.35em 0 0">Spend <strong>1 Faith Fracture</strong> (${cur} left) to reroll <em>all</em> damage dice once? One reroll per roll — the new result is final.</p>`,
                buttons: {
                    apply: {
                        icon: '<i class="fas fa-check"></i>',
                        label: 'Keep & apply',
                        callback: () => resolve(false),
                    },
                    reroll: {
                        icon: '<i class="fas fa-sync-alt"></i>',
                        label: 'Reroll (1 Faith Fracture)',
                        callback: () => resolve(true),
                    },
                },
                default: 'apply',
                close: () => resolve(false),
            }).render(true);
        });
    }
    catch (e) {
        console.warn('Mastery System | [DAMAGE REROLL] prompt failed — applying without reroll', e);
        return false;
    }
}
/**
 * Post-roll Mark spend prompt: the attacker sees the rolled total and picks
 * how much Mark to spend from a dropdown that shows the exact outcome of
 * every option ("Mark 4: 30 → 45 damage (+15)"). Returns the chosen spend
 * (0 = keep the Mark on the target).
 */
async function promptMarkSpend(target, markOnTarget, totalDamage, damageChatRolls) {
    const mark = Math.max(0, Math.floor(Number(markOnTarget) || 0));
    if (mark <= 0)
        return 0;
    try {
        const options = [
            `<option value="0" selected>0 — do not spend Mark (keep ${mark} on target)</option>`,
        ];
        for (let n = 1; n <= mark; n++) {
            const bonus = computeMarkFloorBonus(damageChatRolls, n);
            const label = bonus > 0
                ? `Mark ${n}: ${totalDamage} → ${totalDamage + bonus} damage (+${bonus})`
                : `Mark ${n}: ${totalDamage} → ${totalDamage} damage (no gain)`;
            options.push(`<option value="${n}">${label}</option>`);
        }
        return await new Promise((resolve) => {
            new Dialog({
                title: `Mark(${mark}) on ${target.name} — spend?`,
                content: `<p style="margin-bottom:0.35em"><strong>Damage rolled: ${totalDamage}</strong></p>
          <p style="margin:0 0 0.5em">Spent Mark becomes the Damage Floor for this roll — every damage die below the spent value is raised to it. The target's Mark is reduced by the amount spent.</p>
          <div class="form-group">
            <label for="ms-mark-spend-post">Spend Mark:</label>
            <select id="ms-mark-spend-post" name="markSpendPost" style="width:100%">
              ${options.join('\n              ')}
            </select>
          </div>`,
                buttons: {
                    apply: {
                        icon: '<i class="fas fa-bullseye"></i>',
                        label: 'Apply',
                        callback: (html) => {
                            const chosen = Number($(html).find('#ms-mark-spend-post').val());
                            resolve(clampMarkSpend(mark, chosen));
                        },
                    },
                    skip: {
                        icon: '<i class="fas fa-times"></i>',
                        label: 'Do not spend',
                        callback: () => resolve(0),
                    },
                },
                default: 'apply',
                close: () => resolve(0),
            }).render(true);
        });
    }
    catch (e) {
        console.warn('Mastery System | [MARK SPEND] prompt failed — Mark not spent', e);
        return 0;
    }
}
/**
 * Calculate damage result from selections
 */
async function calculateDamageResult(baseDamage, powerDamage, passiveDamage, raises, raiseSelections, availableSpecials, attacker, target, stoneDamageBonusDice = 0, npcAutoDamageDice = 0, npcAutoSpecialStrings = [], selectedPowerId = null, splitAttack = false, attackType = 'melee', 
/**
 * Offer a Faith Fracture damage reroll after rolling, before applying.
 * The reroll recursion passes `false` — any roll may be rerolled at most once.
 */
allowFaithReroll = true) {
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
    // Base power specials from the resolved snapshot apply on every successful hit.
    for (const special of availableSpecials) {
        if (special.type === 'power-special' && special.effect) {
            specialsUsed.push(special.effect);
        }
        // Weapon Smite(X) is an instant on-hit rider (not a Raise pick / lasting status).
        if (special.type === 'weapon' &&
            special.effect &&
            /^smite\s*\(/i.test(String(special.effect).trim())) {
            specialsUsed.push(special.effect);
        }
    }
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
    // Smite(X): instant +Xd8 vs Undead / Fiend only — never a lasting status.
    let smiteBonusRolled = 0;
    const smiteDice = extractSmiteDice(specialsUsed);
    if (smiteDice > 0) {
        if (isSmiteValidTarget(target)) {
            const r = await rollDiceWithDetail(`${smiteDice}d8`, `Smite(${smiteDice})`);
            smiteBonusRolled = r.total;
            if (r.line)
                rollDetails.push(r.line);
            if (r.roll)
                damageChatRolls.push(r.roll);
            specialsUsed.push(`Smite(${smiteDice}) → +${smiteDice}d8`);
        }
        else {
            rollDetails.push(`Smite(${smiteDice}) — target is not Undead/Fiend (no bonus)`);
        }
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
    // Manual damage bonus from the attacker's character sheet
    // (`system.manual.rolls.damage` + `system.manual.rolls.any`).
    // Extra d8 are rolled into the existing `damageChatRolls` array so 3D dice /
    // chat output include them; the flat portion is added straight into the
    // subtotal.
    let manualDamageRolled = 0;
    let manualDamageFlat = 0;
    try {
        if (attacker) {
            const { readManualAdjustments, manualRollBonusForKind } = await import('../utils/manual-adjustments.js');
            const adj = readManualAdjustments(attacker);
            const bonus = manualRollBonusForKind(adj, 'damage');
            if (bonus.dice > 0) {
                const r = await rollDiceWithDetail(`${bonus.dice}d8`, 'Manual Bonus (damage)');
                manualDamageRolled = r.total;
                if (r.line)
                    rollDetails.push(r.line);
                if (r.roll)
                    damageChatRolls.push(r.roll);
            }
            if (bonus.flat !== 0) {
                manualDamageFlat = bonus.flat;
                const sign = bonus.flat > 0 ? '+' : '';
                rollDetails.push(`Manual Bonus (damage): ${sign}${bonus.flat} flat`);
            }
        }
    }
    catch (e) {
        console.warn('Mastery System | [CALCULATE DAMAGE] manual damage bonus failed', e);
    }
    // Diminishing vulnerability riders on the defender:
    //   Hex(X)      → +1d8 per 2 Hex (rounded up) when hit by a Spell.
    //   Sundered(X) → +1d8 per 2 Sundered (rounded up) when hit by a non-Spell.
    // Mark(X) Damage Floor is chosen AFTER the roll (post-roll prompt below).
    let vulnerabilityBonusRolled = 0;
    // Deferred until after the Faith-Fracture reroll gate — a reroll must not
    // consume the target's Mark twice.
    let markSpendToConsume = 0;
    try {
        if (target) {
            const { getActiveSpecialValue } = await import('../system/active-specials.js');
            const selectedPower = selectedPowerId
                ? resolvePowerItemForDamage(attacker, selectedPowerId)
                : null;
            const isSpell = selectedPower ? isSpellPowerItem(selectedPower) : false;
            const hex = getActiveSpecialValue(target, 'hex');
            const sundered = getActiveSpecialValue(target, 'sundered');
            const vulnValue = isSpell ? hex : sundered;
            if (vulnValue > 0) {
                const bonusDice = Math.ceil(vulnValue / 2);
                const label = isSpell ? `Hex(${hex})` : `Sundered(${sundered})`;
                const r = await rollDiceWithDetail(`${bonusDice}d8`, `${label} vulnerability`);
                vulnerabilityBonusRolled += r.total;
                if (r.line)
                    rollDetails.push(r.line);
                if (r.roll)
                    damageChatRolls.push(r.roll);
                specialsUsed.push(`${label} → +${bonusDice}d8`);
            }
        }
    }
    catch (e) {
        console.warn('Mastery System | [CALCULATE DAMAGE] vulnerability riders failed', e);
    }
    // Players Guide attribute scaling (~5957–5965): Might/8 = +2 melee damage
    // per successful melee/unarmed strike. Applies as a flat bonus, never on
    // ranged/spell strikes. Read directly from the actor's pre-derived
    // `system.scaling.mightDamageBonus` so any rank-up / mid-session bump is
    // reflected immediately.
    let mightMeleeBonus = 0;
    if (attackType === 'melee' && attacker) {
        try {
            const mb = Number(attacker?.system?.scaling?.mightDamageBonus ?? 0) || 0;
            if (mb > 0) {
                mightMeleeBonus = mb;
                rollDetails.push(`Might melee bonus: +${mb}`);
            }
        }
        catch {
            mightMeleeBonus = 0;
        }
    }
    // Total damage = Base Weapon + Might stone bonus + Might/8 melee bonus + Power Damage + Raises + Conditional + Manual + Smite (Passives separate)
    // (Mark floor bonus is added after the post-roll Mark prompt below.)
    let totalDamage = baseDamageRolled
        + stoneMightDamageRolled
        + mightMeleeBonus
        + powerDamageRolled
        + raiseDamage
        + conditionalDamageRolled
        + manualDamageRolled
        + manualDamageFlat
        + vulnerabilityBonusRolled
        + smiteBonusRolled;
    // Faith Fracture damage reroll — offered once, AFTER seeing the result but
    // BEFORE anything touches the target (no status effects, no Mark spend, no
    // damage application yet, so the reroll can simply re-run the dice phase).
    if (allowFaithReroll) {
        const wantsReroll = await promptDamageFaithReroll(attacker, totalDamage, rollDetails);
        if (wantsReroll) {
            const prevTotal = totalDamage;
            const cur = Number(attacker?.system?.faithFractures?.current ?? 0) || 0;
            await attacker.update({ 'system.faithFractures.current': Math.max(0, cur - 1) });
            ui.notifications?.info(`${attacker.name} spent 1 Faith Fracture — rerolling damage (was ${prevTotal}).`);
            const rerolled = await calculateDamageResult(baseDamage, powerDamage, passiveDamage, raises, raiseSelections, availableSpecials, attacker, target, stoneDamageBonusDice, npcAutoDamageDice, npcAutoSpecialStrings, selectedPowerId, splitAttack, attackType, false);
            rerolled.rollDetails = [
                `Reroll — 1 Faith Fracture spent (previous total: ${prevTotal})`,
                ...(rerolled.rollDetails ?? []),
            ];
            return rerolled;
        }
    }
    // Mark(X) Damage Floor — chosen AFTER the roll so the attacker sees exactly
    // what each spend gains ("Mark 4: 30 → 45 damage"). Runs after the reroll
    // gate: the floor applies to the final dice, and a reroll never consumes
    // Mark twice.
    try {
        if (target) {
            const { getActiveSpecialValue } = await import('../system/active-specials.js');
            const mark = Math.max(0, getActiveSpecialValue(target, 'mark'));
            if (mark > 0) {
                const maxBonus = computeMarkFloorBonus(damageChatRolls, mark);
                if (maxBonus <= 0) {
                    rollDetails.push(`Mark(${mark}) available — all damage dice already ≥ ${mark}, nothing to gain`);
                }
                else {
                    const spend = await promptMarkSpend(target, mark, totalDamage, damageChatRolls);
                    if (spend > 0) {
                        const markFloorBonus = computeMarkFloorBonus(damageChatRolls, spend);
                        totalDamage += markFloorBonus;
                        rollDetails.push(`Mark(${mark}) spend ${spend} → floor ${spend} (+${markFloorBonus})`);
                        specialsUsed.push(`Mark spent ${spend} (floor ${spend})`);
                        markSpendToConsume = spend;
                    }
                    else {
                        rollDetails.push(`Mark(${mark}) available — not spent`);
                    }
                }
            }
        }
    }
    catch (e) {
        console.warn('Mastery System | [CALCULATE DAMAGE] Mark prompt failed', e);
    }
    // Mark spend deferred from the dice phase (see markSpendToConsume above).
    if (markSpendToConsume > 0 && target) {
        try {
            await consumeTargetMark(target, markSpendToConsume);
        }
        catch (e) {
            console.warn('Mastery System | [CALCULATE DAMAGE] Mark consumption failed', e);
        }
    }
    // Apply status effects from specials to target (Smite is instant — never persisted).
    const statusSpecials = stripSmiteSpecials(specialsUsed).filter((s) => {
        // Drop narrative smite result lines and similar non-status notes.
        if (/^smite\(/i.test(s) && /→/.test(s))
            return false;
        if (/^mark spent /i.test(s))
            return false;
        if (/vulnerability/i.test(s) && /→/.test(s))
            return false;
        return true;
    });
    if (statusSpecials.length > 0 && target) {
        await applyStatusEffectsToTarget(target, statusSpecials, attacker);
    }
    for (const note of conditionalSpecialsUsed)
        specialsUsed.push(note);
    // Count natural 8s across every damage roll we fired above — drives the
    // "never below count8s if any 8 was rolled" floor in the defensive pipeline.
    const count8s = countNaturalEights(damageChatRolls);
    // Split-Attack damage rule:
    //   Raises go 1:1 into the strike they were declared on (the player
    //   buys raises per strike during the attack roll, so they already
    //   reflect the halved attack pool). Every other damage source (base
    //   weapon, Might stones, power damage, conditional riders, manual
    //   bonuses, NPC auto-dice) represents the *full* output of the
    //   attacker and is split evenly between the two strikes → halved.
    //   Implementation: subtract raises, floor-divide the remainder, then
    //   add raises back in full so each strike's damage equals
    //     floor((base+weapon+stones+power+riders+manual+npc)/2) + raises.
    const nonRaiseDamage = Math.max(0, totalDamage - raiseDamage);
    const appliedDamage = splitAttack
        ? Math.max(0, Math.floor(nonRaiseDamage / 2)) + raiseDamage
        : totalDamage;
    // count8s feeds the "never below count8s" floor in the defensive
    // pipeline. Halving it would under-report 8s that came from the raise
    // dice of *this* strike; we keep the full count (it is per-strike).
    const appliedCount8s = count8s;
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
//# sourceMappingURL=damage-dialog.js.map