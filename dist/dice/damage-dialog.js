/**
 * Damage Dialog for Mastery System
 * Appears after successful attack roll to calculate and apply damage
 */
import { attributeScalingEnabled } from '../utils/calculations.js';
import { getRulesMasteryRank } from '../utils/mastery-rank-sync.js';
import { getPowerDefinitionRank } from '../utils/power-definition-rank.js';
import { collectMechanicsContributions, sumUnconditionalPassiveDamageFormula, } from '../utils/power-mechanics.js';
import { getPassiveSlots } from '../powers/passives.js';
import { resolveEquippedWeaponForAttackType } from '../utils/equipment-modifiers.js';
import { applyMeleeUnarmedFallback, artifactToVirtualWeapon } from '../utils/unarmed-fallback.js';
import { coerceNpcAttackSpecials, displayNpcSpecialName, getNpcAttackByIndex, npcDamageDiceFormula, npcSpecialEffectString } from '../utils/npc-attack-model.js';
import { previewTempHPConsumption } from '../combat/passive-triggers.js';
import { listAvailableMaximizationSources, remainingMaximizations, } from '../stones/stone-combat-effects.js';
import { applySpecialDeliveryBonuses } from '../combat/special-boost.js';
import { applyDefensiveMitigation, countNaturalEights } from '../combat/damage-mitigation.js';
import { applyLimitedToTransferPowerDamage, isInstantAoeFlags, martialWeaponDamageApplies, settleDamageTransfer, spellFocusDamageApplies, } from '../combat/damage-transfer.js';
import { hpLostFromHealthUpdate } from '../utils/blood-pool.js';
import { summonArmorAuraBonus, summonDamageAuraBonusDice } from '../combat/aura-modifiers.js';
import { artifactIsSpellFocusOnly } from '../utils/artifact-rules.js';
import { deriveArtifactWeaponDamage } from '../utils/artifact-base-derive.js';
import { getActorSpellFocusBonusDice, listActorSpellFocusSources } from '../utils/artifact-base-values.js';
import { bindChosenSpecialIntoLevelData, buildAvailableRaiseOptions, declaredRaiseFromOptionId, isRaiseAllocationComplete, resolvePowerSnapshot, snapshotToDamageFormula, snapshotToSpecialStrings, } from '../combat/raise-resolution.js';
import { forgetSharedRaiseAllocation, peekSharedRaiseAllocation, raiseAllocShareKey, rememberSharedRaiseAllocation, } from '../combat/shared-raise-allocation.js';
import { getAutofireSession } from '../combat/autofire-shared-damage.js';
// Shared Raise allocation for Split / AoE / Autofire of one Power use. Autofire keys
// off a unique `powerUseId` (`autofire:${powerUseId}`); see shared-raise-allocation.ts.
export { forgetSharedRaiseAllocation, peekSharedRaiseAllocation, rememberSharedRaiseAllocation, };
function cloneBaseForDisplay(base) {
    return {
        ...base,
        specials: base.specials.map((s) => ({ ...s })),
    };
}
function buildRaiseAllocPanelHtml(slots, options, preset, locked) {
    if (slots <= 0 || !options.length)
        return '';
    const rows = [];
    for (let i = 0; i < slots; i++) {
        const pre = preset[i];
        const preId = pre?.effect === 'damage'
            ? 'damage'
            : pre?.effect === 'specialPlus' && pre.targetSpecialKey
                ? `special:${pre.targetSpecialKey}`
                : '';
        const opts = options
            .map((o) => {
            const sel = o.id === preId ? ' selected' : '';
            return `<option value="${escapeHtmlAttr(o.id)}"${sel}>${escapeHtmlAttr(o.label)}</option>`;
        })
            .join('');
        rows.push(`
      <div class="raise-alloc-row">
        <span class="raise-alloc-index">${i + 1}.</span>
        <select class="raise-alloc-select" data-slot="${i}" ${locked ? 'disabled' : ''}>
          <option value="">— choose effect —</option>
          ${opts}
        </select>
      </div>`);
    }
    return `
    <div class="raises-section raise-alloc-panel" data-raise-alloc-slots="${slots}" data-raise-alloc-locked="${locked ? '1' : '0'}">
      <p class="raises-description"><strong>Allocate ${slots} Raise${slots === 1 ? '' : 's'}</strong> (Damage or existing Special). Same Special may receive multiple Raises.</p>
      <div class="raise-alloc-rows">${rows.join('')}</div>
      <p class="raise-alloc-preview md-sublabel"></p>
    </div>`;
}
function escapeHtmlAttr(raw) {
    return String(raw || '')
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}
import { computeMarkFloorBonus, clampMarkSpend, listUsefulMarkSpends } from './mark-floor.js';
import { resolveLiveActor, tokenIdOfActor } from '../system/status-target.js';
import { formatEffectReference } from '../utils/special-effects.js';
import { selectOnHitSpecialEffects } from '../utils/weapon-specials.js';
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
export { computeMarkFloorBonus, clampMarkSpend, listUsefulMarkSpends } from './mark-floor.js';
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
/** Count the d8 Damage Dice in a formula ("3d8+2" → 3, "d8" → 1). */
function countD8DiceInFormula(formula) {
    const f = String(formula ?? '').trim();
    if (!f || f === '0')
        return 0;
    let count = 0;
    const re = /(\d*)d8/gi;
    let m;
    while ((m = re.exec(f)) !== null) {
        count += m[1] ? parseInt(m[1], 10) : 1;
    }
    return count;
}
/** Remove up to `remove` d8 dice from a formula (Damage Negation). */
function removeD8DiceFromFormula(formula, remove) {
    let left = Math.max(0, Math.floor(Number(remove) || 0));
    const f = String(formula ?? '').trim();
    if (!f || f === '0' || left <= 0)
        return { formula: f, removed: 0 };
    let removedTotal = 0;
    const next = f.replace(/(\d*)d8/gi, (match, countStr) => {
        if (left <= 0)
            return match;
        const have = countStr ? parseInt(countStr, 10) : 1;
        const take = Math.min(have, left);
        left -= take;
        removedTotal += take;
        const rest = have - take;
        return rest > 0 ? `${rest}d8` : '0';
    });
    return { formula: next, removed: removedTotal };
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
    // Pure Spell Focus gear (Staff of the Dark) adds dice to Spells only.
    // Witch Staffs etc. keep Staff Damage AND Spell Focus — do not zero those.
    if (weapon.type === 'artifact' && artifactIsSpellFocusOnly(weaponSystem)) {
        return '0';
    }
    // Artifact weapons (e.g. Dragon Claws) keep their dice on
    // `system.artifactWeapon.damage` (e.g. "4d8"), NOT on `system.damage`.
    // Prefer it when present so artifacts don't fall back to the 1d8 default.
    // For standard one/two-handed profiles, derive the canonical dice live
    // (base + 1d8 per level, so two-handed Level 1 is 5d8) even when a baked
    // damage string is stale.
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
    const readMartialDamageDice = async () => {
        try {
            const { getRoundState } = await import('../combat/action-economy.js');
            const combat = game.combat;
            if (!actorToUse || !combat)
                return 0;
            const rs = getRoundState(actorToUse, combat);
            const martial = Math.max(0, Number(rs?.stoneBonuses?.meleeDamageBonusDice) || 0);
            const legacy = Math.max(0, Number(rs?.stoneBonuses?.damageBonus) || 0);
            // Same grant mirrored on two fields — take the higher, never sum.
            return Math.max(martial, legacy);
        }
        catch (e) {
            console.warn('Mastery System | [DAMAGE DIALOG] Could not read Martial Damage dice', e);
            return 0;
        }
    };
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
    // Resolve weapon with priority: forced > active Weapon Set > weaponId > equipped scan > unarmed
    let weaponForDamage = null;
    const attackTypeForWeapon = flags?.attackType === 'ranged' ? 'ranged' : 'melee';
    const weaponDelivery = !isNpcAttackFlow &&
        martialWeaponDamageApplies({
            ignoreWeaponDamage: flags?.ignoreWeaponDamage === true,
            powerIsSpell: flags?.powerIsSpell === true,
            npcIsSpell: flags?.npcIsSpell === true,
            // Instant AoE: Power damage only — never Weapon Damage.
            aoeMeleeWeapon: flags?.aoeMeleeWeapon,
            instantAoe: flags?.instantAoe,
        });
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
    // Method 1: Active Weapon Set (Claws / Tails / set main-hand) — must beat a
    // stale weaponId or leftover equipped conventional 1d8 item.
    if (weaponDelivery && !weaponForDamage && actorToUse) {
        weaponForDamage = resolveEquippedWeaponForAttackType(items, attackTypeForWeapon, actorToUse);
    }
    // Method 2: weaponId from the attack card (when set resolution found nothing)
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
        if (weaponForDamage && weaponForDamage.system?.equipped !== true) {
            const strict = resolveEquippedWeaponForAttackType(items, attackTypeForWeapon, actorToUse);
            weaponForDamage = strict || null;
        }
    }
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
    if (!isNpcAttackFlow && !weaponForDamage && weaponId) {
        weaponForDamage = items.find((item) => item.id === weaponId);
    }
    // Method 3: Virtual unarmed when no equipped weapon (melee only)
    if (weaponDelivery && !weaponForDamage) {
        weaponForDamage = applyMeleeUnarmedFallback(weaponForDamage, attackTypeForWeapon);
    }
    if (!weaponDelivery) {
        weaponForDamage = null;
    }
    // Resolve base damage using helper (returns string directly)
    let baseDamage = weaponDelivery ? resolveWeaponBaseDamage(weaponForDamage) : '0';
    // Weapon properties (PG "Weapon Properties"):
    //   Versatile — +2d8 weapon damage while wielded two-handed.
    //   Set — +1d8 weapon damage when the wielder did not move this round.
    if (weaponDelivery && weaponForDamage) {
        try {
            const { versatileBonusDice, setBonusDice } = await import('../utils/weapon-properties.js');
            const versatile = versatileBonusDice(weaponForDamage);
            const setBonus = setBonusDice(actorToUse, weaponForDamage);
            if (versatile > 0)
                baseDamage = addD8DiceToFormula(baseDamage, versatile);
            if (setBonus > 0)
                baseDamage = addD8DiceToFormula(baseDamage, setBonus);
        }
        catch (err) {
            console.warn('Mastery System | weapon property bonus failed', err);
        }
    }
    // Sanitize base damage before use
    const sanitizedBaseDamage = sanitizeDiceNotation(baseDamage);
    // Weapon specials should come from the same resolved weapon (only once)
    const weaponSpecials = !weaponDelivery
        ? []
        : (weaponForDamage?.system?.specials ?? [])
            .map(normalizeWeaponSpecial)
            .filter(Boolean);
    // Debug log after weapon resolve
    // Load selected power from actor by ID and get its data
    let powerDamage = '0';
    let powerSpecials = [];
    let selectedPowerData = null;
    // Basic Attack (no Active Power): Weapon Damage + MR × 2d8.
    let basicAttackMrDamage = '0';
    if (!isNpcAttackFlow && !selectedPowerId) {
        try {
            const { basicAttackMrDamageFormula } = await import('../combat/basic-combat.js');
            basicAttackMrDamage = basicAttackMrDamageFormula(actorToUse);
        }
        catch {
            basicAttackMrDamage = '0';
        }
    }
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
                    levelData = bindChosenSpecialIntoLevelData(levelData, powerSystem.chosenSpecial?.key, templateId || powerDef?.templateId, definitionRank);
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
            powerDamage = applyLimitedToTransferPowerDamage(powerDamage, {
                damageTransfer: flags?.damageTransfer === true || levelData?.mechanics?.damageTransfer === true,
                limited: flags?.limited === true || powerSystem?.limited === true,
            });
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
    const attackIsSpell = flags?.powerIsSpell === true ||
        flags?.npcIsSpell === true ||
        (!!selectedPowerId &&
            isSpellPowerItem(resolvePowerItemForDamage(actorToUse, selectedPowerId)));
    stoneDamageBonusDice = attackIsSpell ? 0 : await readMartialDamageDice();
    let raiseOutcomeLine = '';
    let shownPowerDamage = '';
    let shownRaiseDamage = '';
    let shownSpecials = '';
    let resolvedPowerSnapshot = null;
    let raiseAllocSlots = 0;
    let raiseAllocOptions = [];
    let raiseAllocPreset = [];
    let raiseAllocLocked = false;
    if (flags?.basePowerSnapshot && flags?.raiseOutcome) {
        const masteryRank = actorToUse
            ? getRulesMasteryRank(actorToUse)
            : Math.max(1, Math.floor(Number(flags.masteryRank) || 2));
        const isSpell = !!flags.powerIsSpell;
        const baseSnap = flags.basePowerSnapshot;
        const outcome = flags.raiseOutcome;
        raiseAllocSlots = Math.max(0, Math.floor(Number(flags.successfulRaiseSlots) || 0));
        raiseAllocOptions = Array.isArray(flags.raiseOptions)
            ? flags.raiseOptions
            : buildAvailableRaiseOptions(baseSnap, isSpell, {
                hasWeaponDamage: Math.max(0, Math.floor(Number(flags.weaponDamageDice) || 0)) > 0,
            });
        const shareKey = raiseAllocShareKey(flags);
        const shared = shareKey ? peekSharedRaiseAllocation(shareKey) : null;
        let declaredRaises = Array.isArray(flags.declaredRaises)
            ? [...flags.declaredRaises]
            : [];
        if (shared?.length) {
            declaredRaises = shared;
            raiseAllocLocked = true;
        }
        else if (declaredRaises.length && isRaiseAllocationComplete(declaredRaises, raiseAllocSlots, raiseAllocOptions)) {
            raiseAllocLocked = true;
        }
        if (String(outcome) !== 'full') {
            raiseOutcomeLine = 'Miss against Final TN — no damage or Specials.';
            resolvedPowerSnapshot = null;
            raiseAllocSlots = 0;
        }
        else if (
        // DF 2026: Spell Raises are allocated pre-roll; never offer post-roll allocation for Spells.
        !isSpell &&
            raiseAllocSlots > 0 &&
            !isRaiseAllocationComplete(declaredRaises, raiseAllocSlots, raiseAllocOptions)) {
            // Hit — wait for post-roll allocation on this card.
            raiseAllocPreset = declaredRaises;
            resolvedPowerSnapshot = cloneBaseForDisplay(baseSnap);
            powerDamage = snapshotToDamageFormula(baseSnap);
            const baseSpecials = snapshotToSpecialStrings(baseSnap);
            powerSpecials.length = 0;
            powerSpecials.push(...baseSpecials);
            shownPowerDamage = `${baseSnap.damageDice}d8`;
            shownSpecials = baseSpecials.join(', ');
            raiseOutcomeLine = `Allocate ${raiseAllocSlots} successful Raise${raiseAllocSlots === 1 ? '' : 's'} before rolling damage.`;
        }
        else {
            resolvedPowerSnapshot = resolvePowerSnapshot({
                base: baseSnap,
                declaredRaises,
                outcome: 'full',
                masteryRank,
                isSpell,
            });
            powerDamage = snapshotToDamageFormula(resolvedPowerSnapshot);
            const resolvedSpecials = snapshotToSpecialStrings(resolvedPowerSnapshot);
            if (!selectedPowerData) {
                selectedPowerData = {
                    id: selectedPowerId || 'artifact-power',
                    name: String(flags?.selectedPowerName || flags?.npcAttackName || 'Power'),
                    level: Math.max(1, Number(flags?.selectedPowerLevel) || 1),
                    specials: resolvedSpecials,
                    damage: powerDamage,
                };
            }
            else {
                selectedPowerData.damage = powerDamage;
                selectedPowerData.specials = resolvedSpecials;
            }
            powerSpecials.length = 0;
            powerSpecials.push(...resolvedSpecials);
            const basePowerDice = Math.max(0, Math.floor(Number(baseSnap.damageDice) || 0));
            const resolvedPowerDice = Math.max(0, Math.floor(resolvedPowerSnapshot.damageDice));
            shownPowerDamage = `${basePowerDice}d8`;
            const extra = resolvedPowerDice - basePowerDice;
            if (extra > 0)
                shownRaiseDamage = `+${extra}d8`;
            shownSpecials = resolvedSpecials.join(', ');
            raiseOutcomeLine = '';
            raiseAllocPreset = declaredRaises;
            if (raiseAllocSlots > 0)
                raiseAllocLocked = true;
        }
    }
    if (shownSpecials) {
        shownSpecials = applySpecialDeliveryBonuses(shownSpecials, actorToUse);
    }
    let npcAutoDamageDice = 0;
    let npcStressD8 = 0;
    const npcAutoSpecialStrings = [];
    if (isNpcAttackFlow) {
        const atk = getNpcAttackByIndex(actorToUse.system, flags?.npcAttackIndex, flags?.npcPhaseIndex);
        powerDamage = npcDamageDiceFormula(atk);
        npcStressD8 = Math.max(0, Math.floor(Number(atk?.npcStressD8) || 0));
        npcAutoDamageDice += 0; // legacy npc autoRaises removed with new Raise rules
        const atkName = String(flags?.npcAttackName || atk?.name || 'NSC-Angriff');
        // Speziale sitzen an der Power (specials[]), mit Legacy-Fallback.
        const specialRows = coerceNpcAttackSpecials(atk?.specials);
        const legacyOnly = specialRows.length === 0 && atk?.special
            ? [{ special: atk.special, specialValue: atk.specialValue }]
            : specialRows;
        const inlineSpecials = [];
        for (const row of legacyOnly) {
            const label = displayNpcSpecialName(String(row.special || '')) || String(row.special || '');
            const eff = npcSpecialEffectString(label, row.specialValue);
            if (eff)
                inlineSpecials.push(eff);
        }
        // Legacy single-special auto-apply (pre-specials[] rows).
        if ((!Array.isArray(atk?.specials) || !atk.specials.length) && atk?.autoApplySpecial && atk.special) {
            const eff = npcSpecialEffectString(atk.special, atk.specialValue);
            if (eff) {
                npcAutoSpecialStrings.push(eff);
                const idx = inlineSpecials.indexOf(eff);
                if (idx >= 0)
                    inlineSpecials.splice(idx, 1);
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
    // Basic Attack: fold MR × 2d8 into the power-damage slot for display + roll.
    if (!isNpcAttackFlow &&
        !selectedPowerId &&
        !flags?.basePowerSnapshot &&
        basicAttackMrDamage &&
        basicAttackMrDamage !== '0' &&
        (!powerDamage || powerDamage === '0')) {
        powerDamage = basicAttackMrDamage;
        selectedPowerData = {
            id: 'basic-attack',
            name: 'Basic Attack (MR × 2d8)',
            level: 1,
            specials: [],
            damage: powerDamage,
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
    const availableSpecials = await collectAvailableSpecials(actorToUse, weaponForDamage, selectedPowerData);
    const weaponInnateLines = weaponForDamage
        ? []
            .concat(weaponForDamage.system?.innateAbilities || [])
            .map((x) => String(x))
        : [];
    const { getActiveSpecialValue } = await import('../system/active-specials.js');
    const targetMarkValue = Math.max(0, getActiveSpecialValue(target, 'mark'));
    // Spell Focus AFTER raise/power formula resolve — earlier merges were wiped by
    // `snapshotToDamageFormula`. Staff of the Dark etc. add dice to Spell damage
    // (not Waffe); Waffe stays 0 for casting attacks (`ignoreWeaponDamage`).
    const powerDamageBeforeFocus = powerDamage;
    let spellFocusBonusDice = 0;
    // Instant AoE never adds Spell Focus (shared Power damage only).
    if (spellFocusDamageApplies({
        isSpell: attackIsSpell,
        isNpcAttackFlow,
        aoeMeleeWeapon: flags?.aoeMeleeWeapon,
        instantAoe: flags?.instantAoe,
    })) {
        try {
            spellFocusBonusDice = getActorSpellFocusBonusDice(actorToUse);
            if (spellFocusBonusDice > 0) {
                powerDamage = addD8DiceToFormula(powerDamage, spellFocusBonusDice);
                if (selectedPowerData)
                    selectedPowerData.damage = powerDamage;
            }
        }
        catch (err) {
            console.warn('Mastery System | spell focus bonus failed', err);
        }
    }
    const weaponDisplayName = weaponForDamage
        ? String(weaponForDamage.name || '').trim()
        : '';
    const spellFocusSources = attackIsSpell && !isNpcAttackFlow && spellFocusBonusDice > 0 && !isInstantAoeFlags(flags)
        ? listActorSpellFocusSources(actorToUse)
        : [];
    // Create damage card as chat message instead of dialog
    return new Promise((resolve) => {
        const damageCardContent = createDamageCardContent(attacker, target, baseDamage, powerDamage, passiveDamage, availableSpecials, weaponSpecials, resolve, selectedPowerData, weaponInnateLines, npcAutoNoteLines, raiseOutcomeLine, targetMarkValue, {
            // Keep Power line free of Focus dice when the Focus row is shown.
            power: shownPowerDamage || powerDamageBeforeFocus,
            raise: shownRaiseDamage,
            specials: shownSpecials,
            might: flags?.attackType === 'melee' && attributeScalingEnabled()
                ? Math.max(0, Math.floor(Number(actorToUse?.system?.scaling?.mightDamageBonus) || 0))
                : 0,
            martialDamageDice: stoneDamageBonusDice,
            spellFocusDice: spellFocusBonusDice,
            weaponName: weaponDisplayName,
            spellFocusSources,
            castingNoWeapon: !!flags?.ignoreWeaponDamage || isInstantAoeFlags(flags),
        }, formatSplitStrikeBanner(flags), {
            slots: raiseAllocSlots,
            options: raiseAllocOptions,
            preset: raiseAllocPreset,
            locked: raiseAllocLocked,
        });
        const targetTokenId = tokenIdOfActor(target, flags?.targetTokenId) || null;
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
                    basePowerSnapshot: flags?.basePowerSnapshot ?? null,
                    raiseOptions: raiseAllocOptions,
                    successfulRaiseSlots: raiseAllocSlots,
                    declaredRaises: raiseAllocPreset,
                    freeRaiseSlots: Math.max(0, Math.floor(Number(flags?.freeRaiseSlots) || 0)),
                    declaredRaiseSlots: Math.max(0, Math.floor(Number(flags?.declaredRaiseSlots) || 0)),
                    raiseTn: flags?.raiseTn ?? null,
                    aoeMeleeWeapon: flags?.aoeMeleeWeapon ?? null,
                    autofire: flags?.autofire ?? null,
                    powerUseId: flags?.powerUseId ?? flags?.autofireUseId ?? null,
                    autofireUseId: flags?.autofireUseId ?? flags?.powerUseId ?? null,
                    powerIsSpell: !!flags?.powerIsSpell,
                    weaponDamageDice: flags?.weaponDamageDice ?? null,
                    masteryRank: flags?.masteryRank ?? null,
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
                    // Triggering attack roll — Reaction: Evade compares against these.
                    attackTotal: Math.max(0, Math.floor(Number(flags?.attackTotal) || 0)) || null,
                    normalTn: Math.max(0, Math.floor(Number(flags?.normalTn ?? flags?.baseEvade ?? flags?.targetEvade) || 0)) || null,
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
function formatSplitStrikeBanner(flags) {
    if (!flags?.splitAttack)
        return '';
    const idx = Math.max(1, Math.floor(Number(flags.splitIndex) || 1));
    const powerName = String(flags.selectedPowerName || '').trim();
    const attackKind = flags.attackType === 'ranged' ? 'Ranged' : 'Melee';
    const title = powerName || `${attackKind} Split Attack`;
    return `${title} — Strike ${idx} of 2`;
}
function createDamageCardContent(attacker, target, baseDamage, powerDamage, passiveDamage, availableSpecials, _weaponSpecials, _resolve, selectedPower, weaponInnateLines = [], npcAutoNoteLines = [], raiseOutcomeLine = '', targetMarkValue = 0, hitSplit = {}, splitBanner = '', raiseAlloc = {}) {
    const allocPanel = buildRaiseAllocPanelHtml(Math.max(0, Math.floor(Number(raiseAlloc.slots) || 0)), Array.isArray(raiseAlloc.options) ? raiseAlloc.options : [], Array.isArray(raiseAlloc.preset) ? raiseAlloc.preset : [], !!raiseAlloc.locked);
    const raisesSection = [
        raiseOutcomeLine
            ? `<div class="raises-section raise-outcome-line"><p>${damageCardHtmlEsc(raiseOutcomeLine)}</p></div>`
            : '',
        allocPanel,
    ]
        .filter(Boolean)
        .join('');
    const targetWard = getIncomingWardTotal(target);
    const hasIncomingSpecials = !!(hitSplit.specials ||
        (Array.isArray(availableSpecials) && availableSpecials.length > 0) ||
        (Array.isArray(npcAutoNoteLines) && npcAutoNoteLines.some((l) => /Speziale/i.test(l))));
    const wardSection = targetWard > 0 && hasIncomingSpecials
        ? `<div class="damage-row ward-preview">
          <span class="damage-label">Ward (${damageCardHtmlEsc(String(target?.name || 'Target'))}):</span>
          <span class="damage-value">−${targetWard} on each incoming Special</span>
        </div>`
        : '';
    const weaponName = String(hitSplit.weaponName || '').trim();
    const weaponValue = baseDamage || '0';
    let weaponLabelDetail = weaponValue;
    if (weaponName) {
        weaponLabelDetail = `${weaponValue} — ${damageCardHtmlEsc(weaponName)}`;
    }
    else if (hitSplit.castingNoWeapon || weaponValue === '0') {
        weaponLabelDetail = hitSplit.castingNoWeapon
            ? '0 — Casting (kein Waffenschaden)'
            : '0';
    }
    const focusSources = Array.isArray(hitSplit.spellFocusSources) ? hitSplit.spellFocusSources : [];
    const focusDetail = focusSources.length > 0
        ? focusSources
            .map((s) => `+${Math.floor(Number(s.dice) || 0)}d8 — ${damageCardHtmlEsc(s.name)}`)
            .join('; ')
        : (hitSplit.spellFocusDice || 0) > 0
            ? `+${Math.floor(Number(hitSplit.spellFocusDice) || 0)}d8`
            : '';
    const markMax = Math.max(0, Math.floor(Number(targetMarkValue) || 0));
    let markSpendSection = '';
    if (markMax > 0) {
        // Spend is chosen on the post-roll damage card — this only announces Mark.
        markSpendSection = `
      <div class="raises-section mark-spend-section">
        <p class="raises-description">Mark(${markMax}) on target — after the roll, spend it on the damage card if it raises the total.</p>
      </div>`;
    }
    const splitHeader = splitBanner
        ? `<div class="damage-split-banner"><strong>${damageCardHtmlEsc(splitBanner)}</strong></div>`
        : '';
    const html = `
    <div class="mastery-damage-card">
      <div class="damage-header">
        ${splitHeader}
        <h3><i class="fas fa-sword"></i> Damage Calculation${splitBanner ? ` <span class="damage-split-sub">(${damageCardHtmlEsc(splitBanner)})</span>` : ''}</h3>
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
          <span class="damage-label">Waffe:</span>
          <span class="damage-value">${weaponLabelDetail}</span>
        </div>
        ${(hitSplit.martialDamageDice || 0) > 0
        ? `<div class="damage-row">
          <span class="damage-label">Martial Damage:</span>
          <span class="damage-value">${Math.floor(Number(hitSplit.martialDamageDice) || 0)}d8</span>
        </div>`
        : ''}
        ${focusDetail
        ? `<div class="damage-row">
          <span class="damage-label">Spell Focus:</span>
          <span class="damage-value">${focusDetail}</span>
        </div>`
        : ''}
        <div class="damage-row">
          <span class="damage-label">Power:</span>
          <span class="damage-value">${hitSplit.power || powerDamage || '0'}</span>
        </div>
        ${hitSplit.raise
        ? `<div class="damage-row">
          <span class="damage-label">Raise:</span>
          <span class="damage-value">${damageCardHtmlEsc(hitSplit.raise)}</span>
        </div>`
        : ''}
        ${hitSplit.specials
        ? `<div class="damage-row">
          <span class="damage-label">Special:</span>
          <span class="damage-value">${damageCardHtmlEsc(hitSplit.specials)}</span>
        </div>`
        : ''}
        ${wardSection}
        ${(hitSplit.might || 0) > 0
        ? `<div class="damage-row">
          <span class="damage-label">Might/8:</span>
          <span class="damage-value">+${hitSplit.might}, fest</span>
        </div>`
        : ''}
        ${passiveDamage && passiveDamage !== '0'
        ? `<div class="damage-row">
          <span class="damage-label">Passive:</span>
          <span class="damage-value">${passiveDamage}</span>
        </div>`
        : ''}
      </div>
      ${raisesSection}
      ${markSpendSection}
      <div class="damage-actions">
        <button type="button" class="roll-damage-btn" data-attacker-id="${attacker.id}" data-target-id="${target.id}" data-maximize="0">
          <i class="fas fa-dice"></i> Roll
        </button>
        ${(() => {
        const maxLeft = remainingMaximizations(attacker);
        if (maxLeft <= 0)
            return '';
        const sources = listAvailableMaximizationSources(attacker);
        const sourceSelect = sources.length > 1
            ? `<select class="max-source-select" title="Choose Maximization source">${sources
                .map((s) => `<option value="${s.source}">${s.label}</option>`)
                .join('')}</select>`
            : sources.length === 1
                ? `<span class="max-source-hint">${sources[0].label}</span>`
                : '';
        const preferred = sources[0]?.source || 'stone';
        return `${sourceSelect}<button type="button" class="roll-damage-btn roll-damage-max-btn" data-attacker-id="${attacker.id}" data-target-id="${target.id}" data-maximize="1" data-max-source="${preferred}" title="Spend 1 Maximization (${maxLeft} left). Every d8 becomes 8 (artificial, not natural).">
          <i class="fas fa-arrow-up"></i> Roll Maximum
        </button>`;
    })()}
        <button type="button" class="cancel-damage-btn">
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
    const allocPanel = messageElement.find('.raise-alloc-panel');
    if (allocPanel.length && allocPanel.attr('data-raise-alloc-locked') !== '1') {
        const refreshAllocPreview = () => {
            const slots = Math.max(0, Math.floor(Number(allocPanel.attr('data-raise-alloc-slots')) || 0));
            const chosen = allocPanel.find('.raise-alloc-select').toArray().map((el) => String($(el).val() || ''));
            const filled = chosen.filter(Boolean).length;
            allocPanel
                .find('.raise-alloc-preview')
                .text(filled >= slots ? 'Allocation complete.' : `Choose ${slots - filled} more Raise effect${slots - filled === 1 ? '' : 's'}.`);
        };
        allocPanel.find('.raise-alloc-select').off('change.msRaiseAlloc').on('change.msRaiseAlloc', refreshAllocPreview);
        refreshAllocPreview();
    }
    const syncMaxSource = () => {
        const selected = String(messageElement.find('.max-source-select').val() || '');
        if (selected) {
            messageElement.find('.roll-damage-max-btn').attr('data-max-source', selected);
        }
    };
    messageElement.find('.max-source-select').off('change.msMaxSource').on('change.msMaxSource', syncMaxSource);
    syncMaxSource();
    messageElement.find('.roll-damage-btn').off('click.msRollDamage').on('click.msRollDamage', async function () {
        const $btn = $(this);
        const lockKey = `roll-dmg:${messageId}`;
        if (rollDamageMessageLocks.has(lockKey)) {
            return;
        }
        rollDamageMessageLocks.add(lockKey);
        const $allRollBtns = messageElement.find('.roll-damage-btn');
        $allRollBtns.prop('disabled', true);
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
            let flags = message.getFlag('mastery-system') || message.flags?.['mastery-system'];
            const attackerId = $btn.data('attacker-id');
            const targetId = $btn.data('target-id');
            const attacker = resolveLiveActor(attackerId, flags?.attackerTokenId) || game.actors?.get(attackerId);
            const target = resolveLiveActor(targetId, flags?.targetTokenId);
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
            // Post-roll Raise allocation (required before damage when slots remain).
            const needSlots = Math.max(0, Math.floor(Number(flags.successfulRaiseSlots) || 0));
            const raiseOptions = Array.isArray(flags.raiseOptions) ? flags.raiseOptions : [];
            let allocatedPlan = Array.isArray(flags.declaredRaises)
                ? [...flags.declaredRaises]
                : [];
            const shareKey = raiseAllocShareKey(flags);
            const shared = shareKey ? peekSharedRaiseAllocation(shareKey) : null;
            if (shared?.length)
                allocatedPlan = shared;
            // DF 2026: Spells never allocate Raises post-roll — their plan was fixed pre-roll.
            const spellPlanComplete = !flags.powerIsSpell || isRaiseAllocationComplete(allocatedPlan, needSlots, raiseOptions);
            if (needSlots > 0 && flags.raiseOutcome === 'full' && flags.basePowerSnapshot && spellPlanComplete) {
                if (!isRaiseAllocationComplete(allocatedPlan, needSlots, raiseOptions)) {
                    const fromUi = [];
                    messageElement.find('.raise-alloc-select').each((_i, el) => {
                        const id = String($(el).val() || '');
                        if (!id)
                            return;
                        const dr = declaredRaiseFromOptionId(id, raiseOptions);
                        if (dr)
                            fromUi.push(dr);
                    });
                    if (!isRaiseAllocationComplete(fromUi, needSlots, raiseOptions)) {
                        ui.notifications?.warn('Allocate every successful Raise before rolling damage.');
                        return;
                    }
                    allocatedPlan = fromUi;
                }
                if (shareKey)
                    rememberSharedRaiseAllocation(shareKey, allocatedPlan);
                const mr = attacker
                    ? getRulesMasteryRank(attacker)
                    : Math.max(1, Math.floor(Number(flags.masteryRank) || 2));
                const resolved = resolvePowerSnapshot({
                    base: flags.basePowerSnapshot,
                    declaredRaises: allocatedPlan,
                    outcome: 'full',
                    masteryRank: mr,
                    isSpell: !!flags.powerIsSpell,
                });
                const resolvedSpecials = snapshotToSpecialStrings(resolved);
                // On-hit application reads `effect` / `name` strings (e.g. "Lacerate(5)"),
                // not bare numeric `value` — keep labels in sync with allocated Raises.
                const avail = Array.isArray(flags.availableSpecials)
                    ? flags.availableSpecials.map((s) => ({ ...s }))
                    : [];
                for (const label of resolvedSpecials) {
                    const m = String(label).match(/^([^(]+)\((\d+)\)$/);
                    if (!m)
                        continue;
                    const name = m[1].trim();
                    const rank = parseInt(m[2], 10);
                    const hit = avail.find((s) => {
                        const raw = String(s?.effect || s?.name || '').trim();
                        const base = raw.replace(/\(\d+\)\s*$/, '').trim().toLowerCase();
                        return base === name.toLowerCase() || raw.toLowerCase().startsWith(name.toLowerCase());
                    });
                    if (hit) {
                        hit.value = rank;
                        hit.name = label;
                        hit.effect = label;
                        if (hit.type === 'power-special') {
                            hit.description = `Power special: ${label}`;
                        }
                    }
                    else {
                        avail.push({
                            id: `power-special-${name.toLowerCase().replace(/\s+/g, '-')}`,
                            name: label,
                            type: 'power-special',
                            description: `Power special: ${label}`,
                            effect: label,
                            value: rank,
                        });
                    }
                }
                flags = {
                    ...flags,
                    declaredRaises: allocatedPlan,
                    powerDamage: snapshotToDamageFormula(resolved),
                    resolvedPowerSnapshot: resolved,
                    availableSpecials: avail,
                };
                try {
                    await message.setFlag?.('mastery-system', 'declaredRaises', allocatedPlan);
                    await message.setFlag?.('mastery-system', 'powerDamage', flags.powerDamage);
                    await message.setFlag?.('mastery-system', 'resolvedPowerSnapshot', resolved);
                }
                catch {
                    /* best-effort */
                }
            }
            // Roll vs Roll Maximum — button click only *requests* Maximization.
            // The charge is spent AFTER Damage Negation inside calculateDamageResult
            // (Players Guide: Negation → Maximization → roll). Cancel before that spends nothing.
            activeDamageMaximized = false;
            const wantMax = String($btn.attr('data-maximize') ?? $btn.data('maximize') ?? '0') === '1';
            const autofireSession = flags.autofire === true ? getAutofireSession(flags.powerUseId ?? flags.autofireUseId) : null;
            const maxSourceRawForRoll = String($btn.attr('data-max-source') || 'stone');
            const deferredMaximization = wantMax
                ? async () => {
                    try {
                        const { spendMaximization } = await import('../stones/stone-combat-effects.js');
                        const src = maxSourceRawForRoll === 'stone' || maxSourceRawForRoll === 'passive'
                            ? maxSourceRawForRoll
                            : null;
                        return await spendMaximization(attacker, src);
                    }
                    catch (err) {
                        console.debug?.('Mastery System | Damage Maximization spend skipped', err);
                        return false;
                    }
                }
                : undefined;
            const raiseSelections = new Map();
            // Mark spend is chosen AFTER the roll via a post-roll prompt inside
            // calculateDamageResult (exact "total → new total" options per spend).
            // Defer HP apply so the damage chat can post before the Reaction Window.
            const result = await calculateDamageResult(flags.baseDamage, flags.powerDamage, flags.passiveDamage, 0, raiseSelections, flags.availableSpecials, attacker, target, Math.max(0, Number(flags.stoneDamageBonusDice) || 0), Math.max(0, Number(flags.npcAutoDamageDice) || 0), Array.isArray(flags.npcAutoSpecialStrings) ? flags.npcAutoSpecialStrings : [], flags.selectedPowerId || null, !!flags.splitAttack, flags.attackType === 'ranged' ? 'ranged' : 'melee', true, {
                attackTotal: flags.attackTotal ?? null,
                evadeTn: flags.normalTn ?? flags.baseEvade ?? flags.targetEvade ?? null,
            }, true, false, {
                useId: autofireSession?.useId ?? null,
                spendMaximizationAfterNegation: deferredMaximization,
            });
            // Mechanical npcStressD8 / Stress on hit retired.
            completeDamageCard(messageId, result);
            rollDamageCompleted = true;
        }
        finally {
            activeDamageMaximized = false;
            rollDamageMessageLocks.delete(lockKey);
            if (!rollDamageCompleted) {
                $allRollBtns.prop('disabled', false);
            }
        }
    });
    messageElement.find('.cancel-damage-btn').off('click.msDmgCancel').on('click.msDmgCancel', function () {
        if (damageCardSettledMessageIds.has(messageId))
            return;
        rollDamageMessageLocks.delete(`roll-dmg:${messageId}`);
        messageElement.find('.roll-damage-btn').prop('disabled', false);
        completeDamageCard(messageId, null);
    });
}
/**
 * Unconditional Passive Damage (catalog "Passive: Damage" = damageRider.flat
 * on all damage rolls — melee, ranged, spell, artifact). Conditional riders
 * stay in `collectConditionalDamageRiders`.
 */
async function calculatePassiveDamage(actor) {
    try {
        return sumUnconditionalPassiveDamageFormula(actor);
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
    const boosted = (label) => applySpecialDeliveryBonuses(label, actor);
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
            const listed = boosted(specialName);
            const match = listed.match(/^([^(]+)(?:\((\d+)\))?$/);
            if (match) {
                const specialNameOnly = match[1].trim();
                const specialValue = match[2] ? parseInt(match[2]) : null;
                specials.push({
                    id: `power-special-${specialNameOnly.toLowerCase().replace(/\s+/g, '-')}`,
                    name: listed,
                    type: 'power-special',
                    description: `Power special: ${listed}`,
                    effect: listed,
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
            const listed = boosted(special);
            specials.push({
                id: `weapon-${special}`,
                name: listed,
                type: 'weapon',
                description: `Weapon special: ${listed}`,
                effect: listed
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
        const { readActorStatusEffects } = await import('../system/active-specials.js');
        const list = readActorStatusEffects(target);
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
            await (await import('../system/assign-status.js')).writeActorStatusList(target, next);
        }
    }
    catch (err) {
        console.warn('Mastery System | consumeTargetMark failed', err);
    }
}
import { applySpecialStringsToTarget as applyStatusEffectsToTarget, applyWardToIncomingSpecial, getIncomingWardTotal, } from '../combat/apply-special-effects.js';
export { applyWardToIncomingSpecial, getIncomingWardTotal };
/** Exported for AoE secondary hits (power dice only, same mitigation pipeline). */
export async function applyDamageToTargetFromAoe(target, damage, attacker, count8s = 0, attackContext) {
    return applyDamageToTarget(target, damage, attacker, count8s, attackContext);
}
/** Full defensive pipeline (phasing → reactions → armor/DR → temp HP → bars). */
export async function applyDamageToTarget(target, damage, attacker, count8s = 0, attackContext) {
    const empty = {
        rawDamage: Math.max(0, Math.floor(damage)),
        armorApplied: 0,
        reactionArmorApplied: 0,
        drPercent: 0,
        mitigatedDamage: 0,
        tempHPAbsorbed: 0,
        barDamage: 0,
        min8sUsed: false,
        breakdownLine: '',
        phased: false,
    };
    const transferEnabled = attackContext?.damageTransfer === true && attackContext?.attackSucceeded !== false;
    const finishTransfer = async (realHpLost) => {
        if (!transferEnabled)
            return 0;
        return settleDamageTransfer({
            enabled: true,
            attacker,
            realHpLost,
            instanceId: attackContext?.damageInstanceId,
        });
    };
    try {
        if (attackContext?.attackSucceeded === false) {
            return { ...empty, breakdownLine: 'Miss — no damage', transferHealing: 0 };
        }
        // Step 0: Phasing — opt-in prompt for the target owner. If consumed, the
        // strike inflicts no damage and skips all riders (the caller in the attack
        // pipeline is responsible for skipping on-hit specials when phased).
        if (!attackContext?.skipPhasing) {
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
                        transferHealing: await finishTransfer(0),
                        breakdownLine: `Raw ${empty.rawDamage} → Phased (ignored)`,
                    };
                }
            }
            catch (err) {
                // Phasing module not yet loaded or target has no charges — treat as pass.
                console.debug?.('Mastery System | [APPLY DAMAGE] phasing skipped', err);
            }
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
        let interposeActorId = null;
        let interposeActorName = null;
        const combat = globalThis.game?.combat ?? null;
        try {
            let reactMit = attackContext?.reactionMitigation;
            if (!reactMit && !attackContext?.skipReactionPrompt) {
                // Legacy fallback: defender phase only (primary path uses two-phase windows).
                const { runInteractiveReactionWindow } = await import('../combat/reaction-window-chat.js');
                const phaseResult = await runInteractiveReactionWindow({
                    defender: target,
                    attacker: attacker,
                    combat,
                    rawDamage: damage,
                    attackTotal: attackContext?.attackTotal ?? null,
                    evadeTn: attackContext?.evadeTn ?? null,
                    hit: true,
                    phase: 'defender',
                });
                reactMit = phaseResult.mitigation;
            }
            reactMit = reactMit ?? { reactionArmorFlat: 0, reactionDrPct: 0 };
            reactionArmorFlat = reactMit.reactionArmorFlat;
            reactionDrPct = reactMit.reactionDrPct;
            reactionInitiativeGain = Math.max(0, Math.floor(Number(reactMit.initiativeGain) || 0));
            interposeActorId = reactMit.interposeActorId ? String(reactMit.interposeActorId) : null;
            interposeActorName = reactMit.interposeActorName ? String(reactMit.interposeActorName) : null;
            if (reactMit.negatedByEvade || reactMit.phasedByReaction) {
                // Still grant post-resolve initiative if the reaction included it.
                if (reactionInitiativeGain > 0) {
                    try {
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
                        console.warn('Mastery System | [APPLY DAMAGE] initiative gain after evade negate failed', iniErr);
                    }
                }
                const eff = Math.max(0, Math.floor(Number(reactMit.effectiveEvade) || 0));
                const bonus = Math.max(0, Math.floor(Number(reactMit.reactionEvadeBonus) || 0));
                const atk = Math.max(0, Math.floor(Number(attackContext?.attackTotal) || 0));
                const line = reactMit.phasedByReaction
                    ? `Raw ${empty.rawDamage} → Ghost Slip / Phasing — ignored`
                    : `Raw ${empty.rawDamage} → Reaction Evade +${bonus} (Evade ${eff} > Attack ${atk}) — ignored`;
                return {
                    ...empty,
                    negatedByEvade: true,
                    phased: !!reactMit.phasedByReaction,
                    transferHealing: await finishTransfer(0),
                    breakdownLine: line,
                };
            }
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
            return { ...empty, transferHealing: await finishTransfer(0) };
        }
        // Snapshot pre-hit wound track so blood FX can distinguish chip vs level loss.
        const oldBarIndex = Math.max(0, Math.floor(Number(system.health.currentBar) || 0));
        const barsBefore = system.health.bars.map((b) => ({
            current: Number(b?.current) || 0,
        }));
        // Step 1: Flat Armor + Guard/reaction Armor + percentage DR + 8s-min floor.
        const baseArmorTotal = Number(system.combat?.armorTotal ?? 0) +
            Number(system.combat?.armorFromActiveBuffs ?? 0) +
            summonArmorAuraBonus(target);
        const mitigation = applyDefensiveMitigation({
            rawDamage: damage,
            count8s,
            armorTotal: baseArmorTotal,
            reactionArmorFlat,
            damageReductionPct: Number(system.combat?.damageReductionPct ?? 0),
            reactionDrPct,
            armorPenetration: Math.max(0, Math.floor(Number(attackContext?.armorPenetration) || 0)),
        });
        let mitigated = mitigation.mitigatedDamage;
        // Bulwark(X) — Reaction when hit: reduce this hit's FINAL damage by 50%
        // and consume 1 Bulwark (Players Guide "Bulwark(X)", Until Used).
        let bulwarkNote = '';
        if (mitigated > 0) {
            try {
                const { getActiveSpecialValue, statusEntryId } = await import('../system/active-specials.js');
                const bulwarkStacks = getActiveSpecialValue(target, 'bulwark');
                if (bulwarkStacks > 0) {
                    const { getAvailableReactionActions, spendReactionAction } = await import('../combat/action-economy.js');
                    const canReact = combat
                        ? getAvailableReactionActions(target, combat) > 0
                        : true;
                    if (canReact) {
                        const halved = Math.floor(mitigated / 2);
                        const use = await Dialog.confirm({
                            title: `Bulwark — ${target.name}`,
                            content: `<p><strong>${target.name}</strong> has <strong>Bulwark(${bulwarkStacks})</strong>.</p>` +
                                `<p>Spend <strong>1 Reaction</strong> and consume <strong>1 Bulwark</strong> to reduce this hit's final damage by 50% (${mitigated} → ${halved})?</p>`,
                            defaultYes: false,
                        });
                        if (use) {
                            const spent = combat ? await spendReactionAction(target, combat) : true;
                            if (spent) {
                                const { readActorStatusEffects } = await import('../system/active-specials.js');
                                const listNow = readActorStatusEffects(target).map((e) => ({ ...e }));
                                const idx = listNow.findIndex((e) => statusEntryId(e) === 'bulwark');
                                if (idx >= 0) {
                                    const cur = Math.max(0, Math.floor(Number(listNow[idx]?.value ?? 0)));
                                    if (cur > 1)
                                        listNow[idx] = { ...listNow[idx], value: cur - 1 };
                                    else
                                        listNow.splice(idx, 1);
                                    await (await import('../system/assign-status.js')).writeActorStatusList(target, listNow);
                                }
                                bulwarkNote = `Bulwark −50% (${mitigated} → ${halved})`;
                                mitigated = halved;
                            }
                        }
                    }
                }
            }
            catch (bulwarkErr) {
                console.warn('Mastery System | [APPLY DAMAGE] Bulwark reaction skipped', bulwarkErr);
            }
        }
        // Step 2: Route tempHP reduction through the passive-trigger pool so that
        //         per-source book-keeping (Lean Ward one-shot, Dragon Scales
        //         refresh, …) stays consistent with the scalar mirror. The helper
        //         returns a partial actor-update patch so we can still commit
        //         tempHP + health-bar changes in a single atomic update below.
        const tempHPConsumption = previewTempHPConsumption(target, mitigated);
        let remaining = tempHPConsumption.remainingDamage;
        // Interpose: ally takes half of the remaining HP damage (after armor/DR/tempHP).
        if (interposeActorId && remaining > 0) {
            const toAlly = Math.ceil(remaining / 2);
            const toTarget = Math.max(0, remaining - toAlly);
            remaining = toTarget;
            try {
                const g = globalThis;
                const ally = g.game?.actors?.get?.(interposeActorId) ||
                    g.canvas?.tokens?.placeables?.find((t) => t?.actor?.id === interposeActorId)?.actor ||
                    null;
                if (ally && toAlly > 0) {
                    await applyDamageToTarget(ally, toAlly, attacker, 0, {
                        skipPhasing: true,
                        skipReactionPrompt: true,
                    });
                    await g.ChatMessage?.create?.({
                        user: g.game?.user?.id,
                        speaker: g.ChatMessage?.getSpeaker?.({ actor: ally }),
                        content: `<p class="mastery-reaction-msg"><strong>${interposeActorName || ally.name}</strong> Interposes — takes <strong>${toAlly}</strong> damage (ally keeps ${toTarget}).</p>`,
                    });
                }
            }
            catch (interposeErr) {
                console.warn('Mastery System | Interpose damage split failed', interposeErr);
                remaining = tempHPConsumption.remainingDamage;
            }
        }
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
            // R-05 §8: a prepared Resolve Healing may be triggered before HP is reduced.
            let liveBars = system.health.bars;
            try {
                const { offerPendingResolveHealingBeforeDamage } = await import('../stones/stone-resolution-ui.js');
                const pendingHeal = await offerPendingResolveHealingBeforeDamage(target, remaining);
                if (pendingHeal.used > 0) {
                    const refreshed = target.system?.health?.bars;
                    if (Array.isArray(refreshed) && refreshed.length)
                        liveBars = refreshed;
                }
            }
            catch (pendingErr) {
                console.warn('Mastery System | pending Resolve Healing offer failed', pendingErr);
            }
            const bars = [...liveBars];
            let barIndex = applyDamageToBars(bars, 0, remaining);
            try {
                const { maybeApplyLastBreath } = await import('../stones/last-breath.js');
                const lastBreathBar = await maybeApplyLastBreath(target, bars);
                if (lastBreathBar != null)
                    barIndex = lastBreathBar;
            }
            catch (lastBreathErr) {
                console.warn('Mastery System | Last Breath failed', lastBreathErr);
            }
            // Clamp barIndex to valid range
            if (barIndex >= bars.length) {
                barIndex = bars.length - 1;
            }
            newBarIndex = barIndex;
            barsAfter = bars.map((b) => ({ current: Number(b?.current) || 0 }));
            // Merge tempHP pool updates with bar updates for a single write.
            try {
                await (await import('../combat/gm-relay.js')).updateActorViaGm(target, {
                    ...tempHPConsumption.patch,
                    'system.health.currentBar': barIndex,
                    'system.health.bars': bars,
                }, { masteryBloodHandled: true });
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
            // Boss phases: empty Health pool → next phase with a fresh pool.
            try {
                const { maybeAdvanceNpcBossPhase } = await import('../combat/npc-phase-advance.js');
                await maybeAdvanceNpcBossPhase(target);
            }
            catch (phaseErr) {
                console.warn('Mastery System | NPC phase advance failed', phaseErr);
            }
            try {
                const { syncNpcDefeatedPresentationAfterHpChange } = await import('../combat/defeated-token.js');
                await syncNpcDefeatedPresentationAfterHpChange(target, {
                    tokenId: tokenIdOfActor(target),
                });
            }
            catch (downErr) {
                console.warn('Mastery System | defeated token presentation failed', downErr);
            }
        }
        else if (Object.keys(tempHPConsumption.patch).length > 0) {
            // Only tempHP was reduced, no bar damage
            try {
                await (await import('../combat/gm-relay.js')).updateActorViaGm(target, tempHPConsumption.patch);
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
        // Reaction Temporary HP protects only this damage instance — strip leftovers.
        try {
            const { clearReactionInstanceTempHP } = await import('../combat/passive-triggers.js');
            await clearReactionInstanceTempHP(target);
        }
        catch (reactionThpErr) {
            console.warn('Mastery System | [APPLY DAMAGE] reaction Temp HP expiry failed', reactionThpErr);
        }
        // Blood FX under the hit token: light/medium stains for chips, heavy pool on level loss.
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
        // Reactive Overload — after actual HP loss, offer a chat note (Absorption table tracks Absorbed Damage).
        if (barDamage > 0) {
            try {
                const { maybeOfferReactiveOverloadChat } = await import('../combat/reaction-followups.js');
                await maybeOfferReactiveOverloadChat(target, barDamage, combat);
            }
            catch (overloadErr) {
                console.debug?.('Mastery System | Reactive Overload prompt skipped', overloadErr);
            }
        }
        // Rulebook attack sequence step 18: Absorption — after the damage instance
        // resolves, eligible actual HP loss may generate Temporary Colorless Stones.
        if (barDamage > 0) {
            try {
                const { breakOrdinaryStealth } = await import('../combat/perception-combat-hooks.js');
                await breakOrdinaryStealth(target, 'damage');
            }
            catch {
                /* stealth break is best-effort */
            }
            try {
                let scars = 0;
                const before = barsBefore;
                const after = barsAfter;
                const n = Math.min(before.length, after.length);
                for (let i = 0; i < n; i++) {
                    if (i === n - 1 && n > 1)
                        continue;
                    const wasOpen = Math.floor(Number(before[i]?.current) || 0) > 0;
                    const nowScarred = Math.floor(Number(after[i]?.current) || 0) <= 0;
                    if (wasOpen && nowScarred)
                        scars += 1;
                }
                if (scars > 0) {
                    const { grantAbsorptionForScarredBars } = await import('../combat/absorption.js');
                    await grantAbsorptionForScarredBars(target, scars);
                }
            }
            catch (absorbErr) {
                console.debug?.('Mastery System | Absorption harvest skipped', absorbErr);
            }
        }
        // Thorns — retaliate on final HP bar damage (Passive / Active Buff).
        if (barDamage > 0 && !attackContext?.skipThorns && attacker) {
            try {
                const { maybeApplyThornsRetaliation } = await import('../combat/thorns.js');
                await maybeApplyThornsRetaliation(target, attacker, barDamage);
            }
            catch (thornsErr) {
                console.debug?.('Mastery System | Thorns retaliation skipped', thornsErr);
            }
        }
        const tail = [];
        if (bulwarkNote) {
            tail.push(bulwarkNote);
        }
        if (tempHPConsumption.reducedBy > 0) {
            tail.push(`TempHP ${tempHPConsumption.reducedBy}`);
        }
        if (interposeActorId) {
            tail.push(`Interpose (${interposeActorName || 'ally'})`);
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
        const realHpLost = hpLostFromHealthUpdate({ barsBefore, barsAfter });
        const transferHealing = await finishTransfer(realHpLost);
        return {
            rawDamage: mitigation.rawDamage,
            armorApplied: mitigation.armorApplied,
            reactionArmorApplied: mitigation.reactionArmorApplied,
            drPercent: mitigation.drPercent,
            mitigatedDamage: mitigated,
            tempHPAbsorbed: tempHPConsumption.reducedBy,
            barDamage,
            min8sUsed: mitigation.min8sUsed,
            breakdownLine: `${mitigation.breakdownLine} → ${tail.join(' → ')}`,
            phased: false,
            transferHealing,
        };
    }
    catch (error) {
        console.error('Mastery System | [APPLY DAMAGE] Error applying damage', error);
        return empty;
    }
}
const pendingDamageFaithPrompts = new Map();
let damageFaithChatHooksRegistered = false;
function registerDamageFaithRerollChatHooks() {
    if (damageFaithChatHooksRegistered)
        return;
    damageFaithChatHooksRegistered = true;
    Hooks.on('renderChatMessageHTML', (message, htmlRaw) => {
        try {
            const ms = message.flags?.['mastery-system'];
            if (ms?.type !== 'damageFaithRerollPrompt' || ms?.resolved)
                return;
            attachDamageFaithPromptHandlers(message, htmlRaw);
        }
        catch (e) {
            console.warn('Mastery System | damage Faith Fracture prompt hook', e);
        }
    });
    game.socket?.on('system.mastery-system', (payload) => {
        if (payload?.type !== 'damageFaithChoice')
            return;
        const messageId = String(payload.messageId || '');
        if (!pendingDamageFaithPrompts.has(messageId))
            return;
        const message = game.messages?.get(messageId);
        if (!message)
            return;
        void settleDamageFaithPrompt(message, !!payload.wantsReroll);
    });
}
/** Rolling client, GM, or an OWNER of the attacker may press Keep / Reroll. */
function canDecideDamageFaithGate(messageId, attacker, user) {
    if (pendingDamageFaithPrompts.has(messageId))
        return true;
    if (user?.isGM)
        return true;
    if (!attacker || !user)
        return false;
    return (typeof attacker.testUserPermission === 'function' &&
        attacker.testUserPermission(user, 'OWNER'));
}
function damageFaithPromptEsc(text) {
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
/**
 * Single damage chat card that doubles as the Faith Keep / Reroll gate.
 * No separate "Damage rolled — kept" message — Keep strips the buttons and
 * the same card is updated with mitigation later.
 */
function buildDamageFaithGateHtml(opts) {
    const details = opts.rollDetails;
    const rollsHtml = details.length
        ? `<div class="mastery-damage-rolls"><strong>Rolled</strong><ul class="mastery-damage-roll-list">${details
            .map((line) => `<li>${damageFaithPromptEsc(line)}</li>`)
            .join('')}</ul></div>`
        : '';
    return `<div class="mastery-system-damage mastery-damage-faith-gate">
      <h3><i class="fas fa-sword"></i> Damage: ${opts.totalDamage}</h3>
      ${rollsHtml}
      <p><strong>Target:</strong> ${damageFaithPromptEsc(opts.targetName)}</p>
      <div class="mastery-damage-mitigation mastery-damage-pending">
        <div class="mastery-damage-mitigation-title"><i class="fas fa-hourglass-half"></i> Keep or Reroll?</div>
        <div class="mastery-damage-mitigation-breakdown">Roh ${opts.totalDamage} — HP not applied yet</div>
      </div>
      <p class="ms-damage-faith-hint">Spend <strong>1 Reroll Point</strong> (${opts.fracturesLeft} left) to reroll <em>all</em> damage dice once? One reroll per roll — the new result is final.</p>
      <div class="ms-damage-faith-buttons">
        <button type="button" class="ms-damage-faith-keep-btn"><i class="fas fa-check"></i> Keep</button>
        <button type="button" class="ms-damage-faith-reroll-btn"><i class="fas fa-sync-alt"></i> Reroll (1 Reroll Point)</button>
      </div>
    </div>`;
}
/** After Keep: same damage card without Faith buttons (still awaiting apply). */
function buildDamageFaithKeptPreviewHtml(opts) {
    const details = opts.rollDetails;
    const rollsHtml = details.length
        ? `<div class="mastery-damage-rolls"><strong>Rolled</strong><ul class="mastery-damage-roll-list">${details
            .map((line) => `<li>${damageFaithPromptEsc(line)}</li>`)
            .join('')}</ul></div>`
        : '';
    return `<div class="mastery-system-damage">
      <h3><i class="fas fa-sword"></i> Damage: ${opts.totalDamage}</h3>
      ${rollsHtml}
      <p><strong>Target:</strong> ${damageFaithPromptEsc(opts.targetName)}</p>
      <div class="mastery-damage-mitigation mastery-damage-pending">
        <div class="mastery-damage-mitigation-title"><i class="fas fa-hourglass-half"></i> Awaiting Reactions…</div>
        <div class="mastery-damage-mitigation-breakdown">Roh ${opts.totalDamage} — HP not applied yet</div>
      </div>
    </div>`;
}
async function settleDamageFaithPrompt(message, wantsReroll) {
    const messageId = String(message.id || '');
    const pending = pendingDamageFaithPrompts.get(messageId);
    if (!pending) {
        ui.notifications?.warn?.('Only the player who rolled this damage can choose Keep / Reroll here.');
        return;
    }
    pendingDamageFaithPrompts.delete(messageId);
    const flags = (message.flags?.['mastery-system'] ?? {});
    try {
        if (wantsReroll) {
            // Drop the gate card — the reroll posts a fresh damage result.
            await message.delete?.();
        }
        else {
            await message.update({
                content: buildDamageFaithKeptPreviewHtml({
                    targetName: String(flags.targetName || 'Target'),
                    totalDamage: Math.max(0, Math.floor(Number(flags.totalDamage) || 0)),
                    rollDetails: Array.isArray(flags.rollDetails) ? flags.rollDetails : [],
                }),
                flags: {
                    'mastery-system': {
                        ...flags,
                        type: 'damageFaithRerollPrompt',
                        resolved: 'keep',
                    },
                },
            });
        }
    }
    catch (e) {
        console.warn('Mastery System | could not settle damage Faith Fracture gate', e);
    }
    pending.resolve(wantsReroll);
}
function attachDamageFaithPromptHandlers(message, htmlRaw) {
    const $root = htmlRaw instanceof HTMLElement ? $(htmlRaw) : htmlRaw;
    const card = $root
        .filter('.mastery-damage-faith-gate')
        .add($root.find('.mastery-damage-faith-gate'))
        .first();
    if (!card.length)
        return;
    if (card.data('msFaithBound'))
        return;
    card.data('msFaithBound', true);
    const messageId = String(message.id || '');
    const flags = message.flags?.['mastery-system'] || {};
    const attackerId = String(flags.attackerId || '');
    const attacker = resolveLiveActor(attackerId, flags?.attackerTokenId) ||
        (attackerId ? game.actors?.get(attackerId) : null);
    const user = game.user;
    const canAct = canDecideDamageFaithGate(messageId, attacker, user);
    const keepBtn = card.find('.ms-damage-faith-keep-btn');
    const rerollBtn = card.find('.ms-damage-faith-reroll-btn');
    if (!canAct) {
        keepBtn.prop('disabled', true);
        rerollBtn.prop('disabled', true);
        keepBtn.attr('title', 'Waiting for the rolling player or GM…');
        rerollBtn.attr('title', 'Waiting for the rolling player or GM…');
        return;
    }
    keepBtn.prop('disabled', false);
    rerollBtn.prop('disabled', false);
    if (user?.isGM && !pendingDamageFaithPrompts.has(messageId)) {
        keepBtn.attr('title', 'GM: keep this damage roll (forwards to the rolling player)');
        rerollBtn.attr('title', 'GM: spend a Reroll Point for a damage reroll (forwards to the rolling player)');
    }
    const lock = async (wantsReroll) => {
        keepBtn.prop('disabled', true);
        rerollBtn.prop('disabled', true);
        if (pendingDamageFaithPrompts.has(messageId)) {
            await settleDamageFaithPrompt(message, wantsReroll);
            return;
        }
        // Decision made on another client (usually the GM while a player rolled).
        game.socket?.emit('system.mastery-system', {
            type: 'damageFaithChoice',
            messageId,
            wantsReroll,
        });
        ui.notifications?.info?.(wantsReroll
            ? 'Reroll sent to the rolling player…'
            : 'Keep sent to the rolling player…');
    };
    keepBtn.off('click.msDmgFaith').on('click.msDmgFaith', (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        void lock(false);
    });
    rerollBtn.off('click.msDmgFaith').on('click.msDmgFaith', (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        void lock(true);
    });
}
/**
 * Offer a one-time Faith Fracture reroll on the damage chat card itself
 * (Keep / Reroll). No separate "kept" message. Only for PCs with a Fracture.
 */
async function promptDamageFaithReroll(attacker, target, totalDamage, rollDetails, damageChatRolls = []) {
    const skip = { wantsReroll: false, messageId: null };
    try {
        if (attacker?.type !== 'character')
            return skip;
        const cur = Number(attacker?.system?.faithFractures?.current ?? 0) || 0;
        if (cur < 1)
            return skip;
        const user = game.user;
        if (!user?.isGM && !attacker.isOwner)
            return skip;
        registerDamageFaithRerollChatHooks();
        const attackerName = String(attacker.name || 'Attacker');
        const targetName = String(target?.name || 'Target');
        const content = buildDamageFaithGateHtml({
            targetName,
            totalDamage,
            fracturesLeft: cur,
            rollDetails,
        });
        const serializedRolls = (damageChatRolls || [])
            .map((r) => (typeof r?.toJSON === 'function' ? r.toJSON() : r))
            .filter(Boolean);
        const message = await ChatMessage.create({
            user: user?.id,
            speaker: ChatMessage.getSpeaker({ actor: attacker }),
            content,
            ...(serializedRolls.length > 0
                ? { rolls: serializedRolls, sound: CONFIG.sounds.dice }
                : { style: CONST?.CHAT_MESSAGE_STYLES?.OTHER }),
            flags: {
                'mastery-system': {
                    type: 'damageFaithRerollPrompt',
                    attackerId: attacker.id,
                    attackerTokenId: tokenIdOfActor(attacker) || '',
                    attackerName,
                    targetName,
                    totalDamage,
                    fracturesLeft: cur,
                    rollDetails: [...rollDetails],
                    resolved: false,
                },
            },
        });
        if (!message?.id)
            return skip;
        const wantsReroll = await new Promise((resolve) => {
            pendingDamageFaithPrompts.set(String(message.id), {
                resolve,
                attackerId: String(attacker.id || ''),
            });
            window.setTimeout(() => {
                const el = document.querySelector(`.chat-message[data-message-id="${message.id}"]`) ??
                    document.querySelector(`.message[data-message-id="${message.id}"]`);
                if (el)
                    attachDamageFaithPromptHandlers(message, el);
            }, 50);
        });
        if (wantsReroll)
            return { wantsReroll: true, messageId: null };
        return { wantsReroll: false, messageId: String(message.id) };
    }
    catch (e) {
        console.warn('Mastery System | [DAMAGE REROLL] prompt failed — applying without reroll', e);
        return skip;
    }
}
const pendingDamageMarkPrompts = new Map();
let damageMarkChatHooksRegistered = false;
function registerDamageMarkSpendChatHooks() {
    if (damageMarkChatHooksRegistered)
        return;
    damageMarkChatHooksRegistered = true;
    Hooks.on('renderChatMessageHTML', (message, htmlRaw) => {
        try {
            const ms = message.flags?.['mastery-system'];
            if (ms?.type !== 'damageMarkSpendPrompt' || ms?.resolved)
                return;
            attachDamageMarkPromptHandlers(message, htmlRaw);
        }
        catch (e) {
            console.warn('Mastery System | damage Mark spend prompt hook', e);
        }
    });
    game.socket?.on('system.mastery-system', (payload) => {
        if (payload?.type !== 'damageMarkChoice')
            return;
        const messageId = String(payload.messageId || '');
        if (!pendingDamageMarkPrompts.has(messageId))
            return;
        const message = game.messages?.get(messageId);
        if (!message)
            return;
        void settleDamageMarkPrompt(message, Math.max(0, Math.floor(Number(payload.spend) || 0)));
    });
}
function buildDamageMarkGateHtml(opts) {
    const details = opts.rollDetails;
    const rollsHtml = details.length
        ? `<div class="mastery-damage-rolls"><strong>Rolled</strong><ul class="mastery-damage-roll-list">${details
            .map((line) => `<li>${damageFaithPromptEsc(line)}</li>`)
            .join('')}</ul></div>`
        : '';
    const spendButtons = opts.options
        .map((opt) => {
        const next = opts.totalDamage + opt.bonus;
        const label = `Mark ${opt.spend}: ${opts.totalDamage} → ${next} (+${opt.bonus})`;
        return `<button type="button" class="ms-damage-mark-spend-btn" data-mark-spend="${opt.spend}">${damageFaithPromptEsc(label)}</button>`;
    })
        .join('');
    return `<div class="mastery-system-damage mastery-damage-mark-gate">
      <h3><i class="fas fa-sword"></i> Damage: ${opts.totalDamage}</h3>
      ${rollsHtml}
      <p><strong>Target:</strong> ${damageFaithPromptEsc(opts.targetName)}</p>
      <div class="mastery-damage-mitigation mastery-damage-pending">
        <div class="mastery-damage-mitigation-title"><i class="fas fa-bullseye"></i> Spend Mark?</div>
        <div class="mastery-damage-mitigation-breakdown">Roh ${opts.totalDamage} — HP not applied yet</div>
      </div>
      <p class="ms-damage-mark-hint">Mark(${opts.markOnTarget}) on ${damageFaithPromptEsc(opts.targetName)}. Spent Mark becomes the Damage Floor — dice below that value are raised. Only spends that raise the total are listed.</p>
      <div class="ms-damage-mark-buttons">
        ${spendButtons}
        <button type="button" class="ms-damage-mark-skip-btn"><i class="fas fa-times"></i> Do not spend</button>
      </div>
    </div>`;
}
/** After a Mark choice: same damage card without spend buttons (still awaiting apply). */
function buildDamageMarkSettledPreviewHtml(opts) {
    const details = opts.rollDetails;
    const rollsHtml = details.length
        ? `<div class="mastery-damage-rolls"><strong>Rolled</strong><ul class="mastery-damage-roll-list">${details
            .map((line) => `<li>${damageFaithPromptEsc(line)}</li>`)
            .join('')}</ul></div>`
        : '';
    const shownTotal = opts.totalDamage + Math.max(0, opts.bonus);
    const breakdown = opts.spend > 0
        ? `Roh ${opts.totalDamage} — Mark ${opts.spend} → ${shownTotal} — HP not applied yet`
        : `Roh ${opts.totalDamage} — Mark not spent — HP not applied yet`;
    return `<div class="mastery-system-damage">
      <h3><i class="fas fa-sword"></i> Damage: ${shownTotal}</h3>
      ${rollsHtml}
      <p><strong>Target:</strong> ${damageFaithPromptEsc(opts.targetName)}</p>
      <div class="mastery-damage-mitigation mastery-damage-pending">
        <div class="mastery-damage-mitigation-title"><i class="fas fa-hourglass-half"></i> Awaiting Reactions…</div>
        <div class="mastery-damage-mitigation-breakdown">${damageFaithPromptEsc(breakdown)}</div>
      </div>
    </div>`;
}
async function settleDamageMarkPrompt(message, spend) {
    const messageId = String(message.id || '');
    const pending = pendingDamageMarkPrompts.get(messageId);
    if (!pending) {
        ui.notifications?.warn?.('Only the player who rolled this damage can spend Mark here.');
        return;
    }
    pendingDamageMarkPrompts.delete(messageId);
    const flags = (message.flags?.['mastery-system'] ?? {});
    const mark = Math.max(0, Math.floor(Number(flags.markOnTarget) || 0));
    const chosen = clampMarkSpend(mark, spend);
    const options = Array.isArray(flags.options) ? flags.options : [];
    const bonus = chosen > 0 ? Math.max(0, options.find((o) => o.spend === chosen)?.bonus ?? 0) : 0;
    try {
        await message.update({
            content: buildDamageMarkSettledPreviewHtml({
                targetName: String(flags.targetName || 'Target'),
                totalDamage: Math.max(0, Math.floor(Number(flags.totalDamage) || 0)),
                rollDetails: Array.isArray(flags.rollDetails) ? flags.rollDetails : [],
                spend: chosen,
                bonus,
            }),
            flags: {
                'mastery-system': {
                    ...flags,
                    type: 'damageMarkSpendPrompt',
                    resolved: chosen > 0 ? `spend-${chosen}` : 'skip',
                },
            },
        });
    }
    catch (e) {
        console.warn('Mastery System | could not settle damage Mark spend gate', e);
    }
    pending.resolve(chosen);
}
function attachDamageMarkPromptHandlers(message, htmlRaw) {
    const $root = htmlRaw instanceof HTMLElement ? $(htmlRaw) : htmlRaw;
    const card = $root
        .filter('.mastery-damage-mark-gate')
        .add($root.find('.mastery-damage-mark-gate'))
        .first();
    if (!card.length)
        return;
    if (card.data('msMarkBound'))
        return;
    card.data('msMarkBound', true);
    const messageId = String(message.id || '');
    const flags = message.flags?.['mastery-system'] || {};
    const attackerId = String(flags.attackerId || '');
    const attacker = resolveLiveActor(attackerId, flags?.attackerTokenId) ||
        (attackerId ? game.actors?.get(attackerId) : null);
    const user = game.user;
    const canAct = pendingDamageMarkPrompts.has(messageId) ||
        !!user?.isGM ||
        (!!attacker &&
            typeof attacker.testUserPermission === 'function' &&
            attacker.testUserPermission(user, 'OWNER'));
    const spendBtns = card.find('.ms-damage-mark-spend-btn');
    const skipBtn = card.find('.ms-damage-mark-skip-btn');
    if (!canAct) {
        spendBtns.prop('disabled', true);
        skipBtn.prop('disabled', true);
        spendBtns.attr('title', 'Waiting for the rolling player or GM…');
        skipBtn.attr('title', 'Waiting for the rolling player or GM…');
        return;
    }
    const lock = async (spend) => {
        spendBtns.prop('disabled', true);
        skipBtn.prop('disabled', true);
        if (pendingDamageMarkPrompts.has(messageId)) {
            await settleDamageMarkPrompt(message, spend);
            return;
        }
        game.socket?.emit('system.mastery-system', {
            type: 'damageMarkChoice',
            messageId,
            spend,
        });
        ui.notifications?.info?.('Mark choice sent to the rolling player…');
    };
    spendBtns.off('click.msDmgMark').on('click.msDmgMark', (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        const raw = Number($(ev.currentTarget).attr('data-mark-spend'));
        void lock(Number.isFinite(raw) ? raw : 0);
    });
    skipBtn.off('click.msDmgMark').on('click.msDmgMark', (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        void lock(0);
    });
}
/**
 * Post-roll Mark spend on the damage chat card itself (no extra Dialog).
 * Shows only spends that raise the total, plus "Do not spend". If Faith Keep
 * already posted a card, that message is reused; otherwise a preview card
 * with the rolled dice is posted first.
 */
async function promptMarkSpend(attacker, target, markOnTarget, totalDamage, rollDetails, damageChatRolls, existingFloor, existingMessageId) {
    const skip = {
        spend: 0,
        messageId: existingMessageId ? String(existingMessageId) : null,
    };
    const mark = Math.max(0, Math.floor(Number(markOnTarget) || 0));
    if (mark <= 0)
        return skip;
    const options = listUsefulMarkSpends(damageChatRolls, mark, existingFloor);
    if (options.length === 0)
        return skip;
    try {
        const user = game.user;
        if (!user?.isGM && !attacker?.isOwner)
            return skip;
        registerDamageMarkSpendChatHooks();
        const attackerName = String(attacker?.name || 'Attacker');
        const targetName = String(target?.name || 'Target');
        const content = buildDamageMarkGateHtml({
            targetName,
            markOnTarget: mark,
            totalDamage,
            rollDetails,
            options,
        });
        const serializedRolls = (damageChatRolls || [])
            .map((r) => (typeof r?.toJSON === 'function' ? r.toJSON() : r))
            .filter(Boolean);
        const markFlags = {
            type: 'damageMarkSpendPrompt',
            attackerId: attacker?.id,
            attackerTokenId: attacker ? tokenIdOfActor(attacker) || '' : '',
            attackerName,
            targetName,
            totalDamage,
            markOnTarget: mark,
            rollDetails: [...rollDetails],
            options,
            resolved: false,
        };
        let message = null;
        const reuseId = existingMessageId ? String(existingMessageId) : '';
        if (reuseId) {
            try {
                const existing = game.messages?.get?.(reuseId);
                if (existing) {
                    const patch = {
                        content,
                        flags: { 'mastery-system': markFlags },
                    };
                    if (serializedRolls.length > 0) {
                        patch.rolls = serializedRolls;
                    }
                    await existing.update(patch);
                    message = existing;
                }
            }
            catch (err) {
                console.warn('Mastery System | [MARK SPEND] could not reuse damage card — posting new', err);
            }
        }
        if (!message) {
            message = (await ChatMessage.create({
                user: user?.id,
                speaker: ChatMessage.getSpeaker({ actor: attacker }),
                content,
                ...(serializedRolls.length > 0
                    ? { rolls: serializedRolls, sound: CONFIG.sounds.dice }
                    : { style: CONST?.CHAT_MESSAGE_STYLES?.OTHER }),
                flags: {
                    'mastery-system': markFlags,
                },
            }));
        }
        if (!message?.id)
            return skip;
        const spend = await new Promise((resolve) => {
            pendingDamageMarkPrompts.set(String(message.id), {
                resolve,
                attackerId: String(attacker?.id || ''),
            });
            window.setTimeout(() => {
                const el = document.querySelector(`.chat-message[data-message-id="${message.id}"]`) ??
                    document.querySelector(`.message[data-message-id="${message.id}"]`);
                if (el)
                    attachDamageMarkPromptHandlers(message, el);
            }, 50);
        });
        return { spend: clampMarkSpend(mark, spend), messageId: String(message.id) };
    }
    catch (e) {
        console.warn('Mastery System | [MARK SPEND] prompt failed — Mark not spent', e);
        return skip;
    }
}
/**
 * Calculate damage result from selections
 */
export async function calculateDamageResult(baseDamage, powerDamage, passiveDamage, raises, raiseSelections, availableSpecials, attacker, target, stoneDamageBonusDice = 0, npcAutoDamageDice = 0, npcAutoSpecialStrings = [], selectedPowerId = null, splitAttack = false, attackType = 'melee', 
/**
 * Offer a Faith Fracture damage reroll after rolling, before applying.
 * The reroll recursion passes `false` — any roll may be rerolled at most once.
 */
allowFaithReroll = true, attackContext, 
/**
 * When true, roll dice + status effects but do not apply HP yet.
 * Caller posts damage chat → Reaction Window → `applyDamageToTarget`.
 */
skipApply = false, 
/**
 * Phasing was already offered for this strike (e.g. Faith-Fracture reroll
 * recursion) — do not prompt again.
 */
skipPhasingPrompt = false, 
/**
 * Shared Damage Roll options:
 * - Autofire (`useId`): per-hit Negation via session; full pool rolled once; faces returned.
 * - All paths: `spendMaximizationAfterNegation` spends the charge AFTER Negation,
 *   only when remaining dice > 0 (Players Guide order).
 */
damageRollOpts) {
    // Rulebook attack sequence step 7: Phasing resolves after the hit is
    // confirmed but BEFORE any damage dice are rolled and BEFORE Specials
    // apply. If the target phases, the strike ends here — no damage roll,
    // no on-hit Specials, no riders.
    const autofireShared = damageRollOpts;
    const sharedSession = autofireShared?.useId ? getAutofireSession(autofireShared.useId) : null;
    if (target && !skipPhasingPrompt && !sharedSession) {
        try {
            const { promptPhasingConsume, consumePhasingCharge } = await import('../combat/phasing.js');
            const phased = await promptPhasingConsume(target, { attacker });
            if (phased) {
                await consumePhasingCharge(target);
                const sheet = target.sheet;
                if (sheet && sheet.rendered)
                    sheet.render(false);
                return {
                    baseDamage: 0,
                    powerDamage: 0,
                    passiveDamage: 0,
                    raiseDamage: 0,
                    specialsUsed: [],
                    totalDamage: 0,
                    rollDetails: ['Phased — hit ignored before the damage roll (no damage, no Specials)'],
                    count8s: 0,
                    mitigation: {
                        rawDamage: 0,
                        armorApplied: 0,
                        drPercent: 0,
                        mitigatedDamage: 0,
                        tempHPAbsorbed: 0,
                        barDamage: 0,
                        min8sUsed: false,
                        breakdownLine: 'Phased (ignored before damage roll)',
                        phased: true,
                    },
                };
            }
        }
        catch (err) {
            console.debug?.('Mastery System | [CALCULATE DAMAGE] pre-roll phasing skipped', err);
        }
    }
    // Rulebook attack sequence step 11: Damage Negation — the defender may
    // remove Damage Dice from the pool assigned to them BEFORE the dice are
    // rolled (half-pool cap, floor). Skipped on Faith-Fracture rerolls: the
    // reduced pool from the first roll is passed back in.
    let negationSkipRaiseDice = 0;
    const negationNotes = [];
    if (target && !skipPhasingPrompt) {
        try {
            let raiseDamagePicks = 0;
            for (let i = 0; i < raises; i++) {
                if (raiseSelections.get(i)?.type === 'damage')
                    raiseDamagePicks++;
            }
            const originalDice = countD8DiceInFormula(sanitizeDiceNotation(baseDamage || '0')) +
                Math.max(0, Math.floor(stoneDamageBonusDice)) +
                countD8DiceInFormula(sanitizeDiceNotation(powerDamage || '0')) +
                countD8DiceInFormula(sanitizeDiceNotation(passiveDamage || '0')) +
                raiseDamagePicks +
                Math.max(0, Math.floor(npcAutoDamageDice));
            if (sharedSession) {
                // Shared Autofire roll: collect every hit's Negation now (dice not revealed yet).
                // The pool is NOT stripped; each hit omits its own prefix after the one roll.
                await sharedSession.collectNegation(originalDice);
                for (const note of sharedSession.notes)
                    negationNotes.push(note);
            }
            else if (originalDice >= 2) {
                const { promptDamageNegationSpend } = await import('../combat/damage-negation.js');
                const spend = await promptDamageNegationSpend(target, { attacker, totalDice: originalDice });
                if (spend.diceRemoved > 0) {
                    let left = spend.diceRemoved;
                    const fromBase = removeD8DiceFromFormula(baseDamage || '0', left);
                    baseDamage = fromBase.formula;
                    left -= fromBase.removed;
                    if (left > 0 && stoneDamageBonusDice > 0) {
                        const take = Math.min(stoneDamageBonusDice, left);
                        stoneDamageBonusDice -= take;
                        left -= take;
                    }
                    if (left > 0) {
                        const fromPower = removeD8DiceFromFormula(powerDamage || '0', left);
                        powerDamage = fromPower.formula;
                        left -= fromPower.removed;
                    }
                    if (left > 0) {
                        const fromPassive = removeD8DiceFromFormula(passiveDamage || '0', left);
                        passiveDamage = fromPassive.formula;
                        left -= fromPassive.removed;
                    }
                    if (left > 0 && npcAutoDamageDice > 0) {
                        const take = Math.min(npcAutoDamageDice, left);
                        npcAutoDamageDice -= take;
                        left -= take;
                    }
                    negationSkipRaiseDice = Math.max(0, Math.min(raiseDamagePicks, left));
                    negationNotes.push(spend.note);
                }
            }
        }
        catch (err) {
            console.debug?.('Mastery System | [CALCULATE DAMAGE] Damage Negation skipped', err);
        }
    }
    // Maximization AFTER Damage Negation, BEFORE any dice are revealed.
    // Skip entirely when Negation removed the whole pool (no charge for a 0-dice roll).
    // Autofire: pool is not stripped here (per-hit omit later); Maximization applies to
    // the full shared pool when that pool still has dice.
    if (damageRollOpts?.spendMaximizationAfterNegation && !skipPhasingPrompt) {
        let raiseDamagePicksLeft = 0;
        for (let i = 0; i < raises; i++) {
            if (raiseSelections.get(i)?.type === 'damage')
                raiseDamagePicksLeft++;
        }
        raiseDamagePicksLeft = Math.max(0, raiseDamagePicksLeft - negationSkipRaiseDice);
        const remainingDice = countD8DiceInFormula(sanitizeDiceNotation(baseDamage || '0')) +
            Math.max(0, Math.floor(stoneDamageBonusDice)) +
            countD8DiceInFormula(sanitizeDiceNotation(powerDamage || '0')) +
            countD8DiceInFormula(sanitizeDiceNotation(passiveDamage || '0')) +
            raiseDamagePicksLeft +
            Math.max(0, Math.floor(npcAutoDamageDice));
        const { shouldSpendMaximizationAfterNegation } = await import('../combat/maximization-order.js');
        if (shouldSpendMaximizationAfterNegation({ wantMaximization: true, remainingDice })) {
            activeDamageMaximized = await damageRollOpts.spendMaximizationAfterNegation();
            if (!activeDamageMaximized) {
                ui.notifications?.warn('No Maximization remaining — rolling normally.');
            }
        }
        else {
            activeDamageMaximized = false;
        }
    }
    const poolFaces = [];
    // Roll base damage
    // Sanitize dice notations before rolling
    const sanitizedBaseDamage = sanitizeDiceNotation(baseDamage || '0');
    const sanitizedPowerDamage = sanitizeDiceNotation(powerDamage || '0');
    const sanitizedPassiveDamage = sanitizeDiceNotation(passiveDamage || '0');
    const rollDetails = [];
    const damageChatRolls = [];
    for (const note of negationNotes)
        rollDetails.push(note);
    // Maximization is chosen on the damage card (Roll vs Roll Maximum), not here.
    if (activeDamageMaximized) {
        rollDetails.push('Maximization: every d8 is 8 (not a natural 8, does not explode)');
    }
    const baseRoll = await rollDiceWithDetail(sanitizedBaseDamage, 'Base weapon', undefined, poolFaces);
    const baseDamageRolled = baseRoll.total;
    if (baseRoll.line)
        rollDetails.push(baseRoll.line);
    if (baseRoll.roll)
        damageChatRolls.push(baseRoll.roll);
    // Snapshot before Damage Negation may strip dice — still consume the grant.
    const martialGrantedAtStart = Math.max(0, Math.floor(Number(stoneDamageBonusDice) || 0));
    let stoneMightDamageRolled = 0;
    if (stoneDamageBonusDice > 0) {
        const stoneRoll = await rollDiceWithDetail(`${stoneDamageBonusDice}d8`, 'Martial Damage', undefined, poolFaces);
        stoneMightDamageRolled = stoneRoll.total;
        if (stoneRoll.line)
            rollDetails.push(stoneRoll.line);
        if (stoneRoll.roll)
            damageChatRolls.push(stoneRoll.roll);
    }
    // PG: bonus applies to the next Martial Attack this turn — consume once used.
    if (martialGrantedAtStart > 0 && attacker) {
        try {
            const { getRoundState, setRoundState } = await import('../combat/action-economy.js');
            const combat = game.combat ?? null;
            if (combat) {
                const rs = getRoundState(attacker, combat);
                if (rs.stoneBonuses) {
                    rs.stoneBonuses.meleeDamageBonusDice = 0;
                    rs.stoneBonuses.damageBonus = 0;
                    await setRoundState(attacker, rs);
                }
            }
        }
        catch (e) {
            console.warn('Mastery System | Could not consume Martial Damage bonus after roll', e);
        }
    }
    const powerRoll = await rollDiceWithDetail(sanitizedPowerDamage, 'Power', undefined, poolFaces);
    const powerDamageRolled = powerRoll.total;
    if (powerRoll.line)
        rollDetails.push(powerRoll.line);
    if (powerRoll.roll)
        damageChatRolls.push(powerRoll.roll);
    let summonAuraRolled = 0;
    const summonAuraDice = summonDamageAuraBonusDice(attacker);
    if (summonAuraDice > 0) {
        const auraRoll = await rollDiceWithDetail(`${summonAuraDice}d8`, 'Summon Damage Aura');
        summonAuraRolled = auraRoll.total;
        if (auraRoll.line)
            rollDetails.push(auraRoll.line);
        if (auraRoll.roll)
            damageChatRolls.push(auraRoll.roll);
    }
    const passiveRoll = await rollDiceWithDetail(sanitizedPassiveDamage, 'Passive', undefined, poolFaces);
    const passiveDamageRolled = passiveRoll.total;
    if (passiveRoll.line)
        rollDetails.push(passiveRoll.line);
    if (passiveRoll.roll)
        damageChatRolls.push(passiveRoll.roll);
    // Calculate raise damage and collect specials
    let raiseDamage = 0;
    const specialsUsed = [];
    let raiseDiceCount = 0;
    // Only Specials the Raise resolution put on the power snapshot apply.
    // A printed weapon Special stays off until that Raise is chosen.
    specialsUsed.push(...selectOnHitSpecialEffects(availableSpecials));
    for (let i = 0; i < raises; i++) {
        const selection = raiseSelections.get(i);
        if (selection) {
            if (selection.type === 'damage') {
                raiseDiceCount += 1;
                if (negationSkipRaiseDice > 0) {
                    negationSkipRaiseDice -= 1;
                    rollDetails.push(`Raise ${raiseDiceCount} (+1d8): removed by Damage Negation`);
                    continue;
                }
                const r = await rollDiceWithDetail('1d8', `Raise ${raiseDiceCount} (+1d8)`, undefined, poolFaces);
                raiseDamage += r.total;
                if (r.line)
                    rollDetails.push(r.line);
                if (r.roll)
                    damageChatRolls.push(r.roll);
            }
            else if (selection.type === 'special') {
                const special = availableSpecials.find(s => s.id === selection.value);
                if (special) {
                    const line = String(special.effect || special.name || '').trim();
                    if (line) {
                        // Tag Passive-sourced Specials so damage / Cleanse notes stay visible.
                        specialsUsed.push(special.type === 'passive' ? `${line} [Passive: ${special.name || 'Passive'}]` : line);
                    }
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
        const r = await rollDiceWithDetail('1d8', `NSC auto (+1d8) #${npcAutoDiceIdx}`, undefined, poolFaces);
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
    // Unconditional Active Buff damage riders — full listed damage on every hit
    // (Single / AoE / Autofire). Docs: active-buffs.md Active Buff: Damage.
    let activeBuffDamageRolled = 0;
    try {
        if (attacker) {
            const contributions = collectMechanicsContributions(attacker);
            for (const c of contributions) {
                if (c.sourceKind !== 'buff')
                    continue;
                const rider = c.mechanics?.damageRider;
                if (!rider?.flat || rider.vsCondition)
                    continue;
                const aw = c.mechanics?.applyWhen;
                if (aw && String(aw) !== 'activeBuff-active')
                    continue;
                const dice = String(rider.flat).trim().replace(/^\+\s*/, '');
                if (!dice || !/^\d*d\d+/i.test(dice))
                    continue;
                const r = await rollDiceWithDetail(dice, `${c.source} (buff damage)`);
                activeBuffDamageRolled += r.total;
                if (r.line)
                    rollDetails.push(r.line);
                if (r.roll)
                    damageChatRolls.push(r.roll);
            }
        }
    }
    catch (e) {
        console.warn('Mastery System | [CALCULATE DAMAGE] active buff damage rider failed', e);
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
    if (attackType === 'melee' && attacker && attributeScalingEnabled()) {
        try {
            const mb = Number(attacker?.system?.scaling?.mightDamageBonus ?? 0) || 0;
            if (mb > 0) {
                mightMeleeBonus = mb;
                rollDetails.push(`Might/8: +${mb}, fest`);
            }
        }
        catch {
            mightMeleeBonus = 0;
        }
    }
    // Instant Specials that resolve on the damage roll itself:
    //   Precision(X)      → on hit, +Xd8 bonus damage.
    //   Brutal Impact(X)  → each damage die counts as at least X.
    // Both are Instant (no stacking — highest value applies) and are filtered
    // out of the persisted status list further below.
    let precisionBonusRolled = 0;
    let brutalImpactBonus = 0;
    let brutalImpactFloor = 0;
    try {
        let precisionDice = 0;
        for (const s of specialsUsed) {
            const text = String(s).trim();
            const p = /^precision\s*\(\s*(\d+)\s*\)/i.exec(text);
            if (p)
                precisionDice = Math.max(precisionDice, parseInt(p[1], 10) || 0);
            const b = /^brutal\s*impact\s*\(\s*(\d+)\s*\)/i.exec(text);
            if (b)
                brutalImpactFloor = Math.max(brutalImpactFloor, parseInt(b[1], 10) || 0);
        }
        if (precisionDice > 0) {
            const r = await rollDiceWithDetail(`${precisionDice}d8`, `Precision(${precisionDice})`);
            precisionBonusRolled = r.total;
            if (r.line)
                rollDetails.push(r.line);
            if (r.roll)
                damageChatRolls.push(r.roll);
        }
        if (brutalImpactFloor > 0) {
            brutalImpactBonus = computeMarkFloorBonus(damageChatRolls, brutalImpactFloor);
            rollDetails.push(brutalImpactBonus > 0
                ? `Brutal Impact(${brutalImpactFloor}): damage dice floored at ${brutalImpactFloor} (+${brutalImpactBonus})`
                : `Brutal Impact(${brutalImpactFloor}): all damage dice already ≥ ${brutalImpactFloor}`);
        }
    }
    catch (e) {
        console.warn('Mastery System | [CALCULATE DAMAGE] instant special riders failed', e);
    }
    // Total damage = Weapon + Might + Power + Raises + Passive Damage (all hits) +
    // Conditional / Active Buff / Manual / Instant specials.
    // (Mark floor bonus is added after the post-roll Mark prompt below.)
    let totalDamage = baseDamageRolled
        + stoneMightDamageRolled
        + mightMeleeBonus
        + powerDamageRolled
        + summonAuraRolled
        + passiveDamageRolled
        + raiseDamage
        + conditionalDamageRolled
        + activeBuffDamageRolled
        + manualDamageRolled
        + manualDamageFlat
        + vulnerabilityBonusRolled
        + precisionBonusRolled
        + brutalImpactBonus;
    // Faith Fracture damage reroll — offered once on the damage chat card itself
    // (Keep / Reroll), AFTER seeing the dice but BEFORE Mark / status / HP apply.
    let prePostedChatMessageId;
    if (allowFaithReroll) {
        const faithChoice = await promptDamageFaithReroll(attacker, target, totalDamage, rollDetails, damageChatRolls);
        if (faithChoice.wantsReroll) {
            const prevTotal = totalDamage;
            const cur = Number(attacker?.system?.faithFractures?.current ?? 0) || 0;
            await attacker.update({ 'system.faithFractures.current': Math.max(0, cur - 1) });
            ui.notifications?.info(`${attacker.name} spent 1 Reroll Point — rerolling damage (was ${prevTotal}).`);
            const rerolled = await calculateDamageResult(baseDamage, powerDamage, passiveDamage, raises, raiseSelections, availableSpecials, attacker, target, stoneDamageBonusDice, npcAutoDamageDice, npcAutoSpecialStrings, selectedPowerId, splitAttack, attackType, false, attackContext, skipApply, true, // phasing was already offered before the first roll
            autofireShared
                ? { useId: autofireShared.useId } // Negation already committed; Maximization already spent
                : undefined);
            rerolled.rollDetails = [
                `Reroll — 1 Reroll Point spent (previous total: ${prevTotal})`,
                ...(rerolled.rollDetails ?? []),
            ];
            return rerolled;
        }
        if (faithChoice.messageId)
            prePostedChatMessageId = faithChoice.messageId;
    }
    // Mark(X) Damage Floor — chosen AFTER the roll on the damage chat card
    // ("Mark 4: 30 → 45"). No extra Dialog. Runs after the reroll gate so the
    // floor applies to the final dice; a reroll never consumes Mark twice.
    try {
        if (target) {
            const { getActiveSpecialValue } = await import('../system/active-specials.js');
            const mark = Math.max(0, getActiveSpecialValue(target, 'mark'));
            if (mark > 0) {
                const useful = listUsefulMarkSpends(damageChatRolls, mark, brutalImpactFloor);
                if (useful.length === 0) {
                    rollDetails.push(`Mark(${mark}) available — all damage dice already ≥ ${mark}, nothing to gain`);
                }
                else {
                    const markChoice = await promptMarkSpend(attacker, target, mark, totalDamage, rollDetails, damageChatRolls, brutalImpactFloor, prePostedChatMessageId);
                    if (markChoice.messageId)
                        prePostedChatMessageId = markChoice.messageId;
                    const spend = markChoice.spend;
                    if (spend > 0) {
                        const markFloorBonus = computeMarkFloorBonus(damageChatRolls, spend, brutalImpactFloor);
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
    // Penetration(X) is an INSTANT Special: it modifies this hit's Armor step
    // and must not persist as a status on the target. Collect its total here
    // and feed it into the mitigation pipeline via the attack context.
    let hitArmorPenetration = 0;
    for (const s of specialsUsed) {
        const m = /^penetration\s*\(\s*(\d+)\s*\)/i.exec(String(s).trim());
        if (m)
            hitArmorPenetration += Math.max(0, parseInt(m[1], 10) || 0);
    }
    // Armor Reduction ignores Armor on every damaging attack this round
    // (Might Stone Ability) plus Passive: Armor Reduction while slotted.
    if (attacker) {
        try {
            const combatRef = globalThis.game?.combat ?? null;
            if (combatRef) {
                const { getRoundState } = await import('../combat/action-economy.js');
                const rs = getRoundState(attacker, combatRef);
                hitArmorPenetration += Math.max(0, Math.floor(Number(rs?.stoneBonuses?.armorPenetration) || 0));
            }
        }
        catch (err) {
            console.debug?.('Mastery System | [CALCULATE DAMAGE] stone penetration lookup skipped', err);
        }
        try {
            const { slottedPassiveLevel, PASSIVE_ARMOR_REDUCTION_TEMPLATE_ID, } = await import('../combat/passive-combat-charges.js');
            const { passiveArmorReductionForLevel } = await import('../utils/powers/templates/passives.js');
            const arLvl = slottedPassiveLevel(attacker, PASSIVE_ARMOR_REDUCTION_TEMPLATE_ID);
            if (arLvl > 0) {
                hitArmorPenetration += Math.max(0, passiveArmorReductionForLevel(arLvl));
            }
        }
        catch (err) {
            console.debug?.('Mastery System | [CALCULATE DAMAGE] Passive Armor Reduction skipped', err);
        }
    }
    if (hitArmorPenetration > 0) {
        rollDetails.push(`Armor Penetration ${hitArmorPenetration} (reduces Armor for this hit)`);
    }
    // Apply status effects from specials to target (Exorcism/Requiem tag-gated inside apply).
    const statusSpecials = specialsUsed.filter((s) => {
        if (/^mark spent /i.test(s))
            return false;
        if (/vulnerability/i.test(s) && /→/.test(s))
            return false;
        if (/\(buff damage\)/i.test(s))
            return false;
        if (/^penetration\s*\(/i.test(s.trim()))
            return false; // instant — consumed by the Armor step
        if (/^precision\s*\(/i.test(s.trim()))
            return false; // instant — rolled into this hit's damage
        if (/^brutal\s*impact\s*\(/i.test(s.trim()))
            return false; // instant — damage-die floor for this hit
        return true;
    });
    let applicationLimitNotes = [];
    if (statusSpecials.length > 0 && target) {
        applicationLimitNotes = await applyStatusEffectsToTarget(target, statusSpecials, attacker);
        for (const note of applicationLimitNotes)
            rollDetails.push(note);
    }
    for (const note of conditionalSpecialsUsed)
        specialsUsed.push(note);
    // Count natural 8s across every damage roll we fired above — drives the
    // "never below count8s if any 8 was rolled" floor in the defensive pipeline.
    const count8s = countNaturalEights(damageChatRolls);
    // Split Attack splits accuracy (Attack/Casting Pool), not damage.
    // Each successful split deals the Power's full Damage Pool + payload.
    const appliedDamage = totalDamage;
    void splitAttack;
    const appliedCount8s = count8s;
    // Per-hit context forwarded to mitigation (direct or deferred path).
    // Phasing was already resolved before the damage roll — never re-prompt.
    const applyContext = {
        ...(attackContext ?? {}),
        armorPenetration: Math.max(0, Math.floor(Number(attackContext?.armorPenetration) || 0)) +
            hitArmorPenetration,
    };
    // Apply damage to target (unless deferred for Reaction Window chat order)
    let mitigation;
    if (target && !skipApply) {
        mitigation = await applyDamageToTarget(target, appliedDamage, attacker, appliedCount8s, {
            ...applyContext,
            skipPhasing: true,
        });
        // Instant Push/Pull: canvas destination picker (not a status). Deferred
        // apply paths call `resolveForcedMovementAfterDamage` after HP lands.
        if (!mitigation?.phased) {
            await resolveForcedMovementAfterDamage(attacker, target, specialsUsed);
        }
    }
    const result = {
        baseDamage: baseDamageRolled,
        powerDamage: powerDamageRolled,
        passiveDamage: passiveDamageRolled,
        raiseDamage,
        specialsUsed,
        applicationLimitNotes: applicationLimitNotes.length ? applicationLimitNotes : undefined,
        totalDamage: appliedDamage,
        rollDetails: rollDetails.length ? rollDetails : undefined,
        damageChatRolls: damageChatRolls.length ? damageChatRolls : undefined,
        count8s: appliedCount8s,
        mitigation,
        pendingApply: skipApply || undefined,
        attackContext: skipApply ? applyContext : undefined,
        prePostedChatMessageId,
    };
    if (sharedSession) {
        const maximizedPool = poolFaces.length > 0 && poolFaces.every((f) => f.artificial);
        result.sharedDice = {
            orderedDieFaces: poolFaces.map((f) => f.face),
            artificial: maximizedPool,
            // Brutal Impact / Mark floors were added to the full total per die: omitted dice
            // must give back max(face, floor), not just the raw face.
            dieFloor: Math.max(brutalImpactFloor, markSpendToConsume),
        };
    }
    return result;
}
/**
 * After HP is applied for a hit, open Push/Pull destination picking when the
 * specials list includes Push(X) / Pull(X). Safe no-op when metres are 0.
 */
export async function resolveForcedMovementAfterDamage(attacker, target, specialsUsed, labelPrefix) {
    if (!target || !attacker)
        return;
    try {
        const { resolveForcedMovementFromSpecials } = await import('../combat/forced-movement.js');
        await resolveForcedMovementFromSpecials({
            movedActor: target,
            referenceActor: attacker,
            specialLines: specialsUsed,
            labelPrefix,
        });
    }
    catch (err) {
        console.warn('Mastery System | Push/Pull after damage failed', err);
    }
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
let activeDamageMaximized = false;
async function rollDiceWithDetail(diceNotation, label, maximize = activeDamageMaximized, 
/**
 * Shared Autofire roll: collects every d8 of this pool in roll order (an artificial
 * 8 per die under Maximization) so each hit can omit its own prefix afterwards.
 */
faceSink) {
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
    if (maximize && faceSink) {
        // Maximization replaces d8s with flat 8s (no Roll terms): record one artificial 8 per die.
        const n = countD8DiceInFormula(formula);
        for (let i = 0; i < n; i++)
            faceSink.push({ face: 8, artificial: true });
    }
    if (maximize) {
        const { maximizeDamageFormula } = await import('../stones/stone-combat-effects.js');
        formula = maximizeDamageFormula(formula);
    }
    else {
        formula = masteryApplyExplodingD8(formula);
    }
    try {
        const RollCtor = globalThis.Roll;
        const roll = new RollCtor(formula);
        await roll.evaluate();
        const total = roll.total ?? 0;
        const detail = summarizeRollDiceFaces(roll);
        const line = `${label}: ${detail} → ${total}`;
        if (faceSink && !maximize) {
            for (const term of roll.terms || []) {
                if (term?.faces !== 8 || !Array.isArray(term?.results))
                    continue;
                for (const r of term.results) {
                    if (r && r.active !== false)
                        faceSink.push({ face: Number(r.result) || 0, artificial: false });
                }
            }
        }
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