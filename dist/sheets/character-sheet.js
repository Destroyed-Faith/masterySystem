/**
 * Character Sheet for Mastery System
 * Main player character sheet with tabs for attributes, skills, powers, etc.
 */
import { SKILLS, SKILL_CATEGORIES } from '../utils/skills.js';
import { getEquippedPhysicalSkillPenaltyDice } from '../utils/equipment-modifiers.js';
import { DISADVANTAGES, getDisadvantageDefinition, calculateDisadvantagePoints, validateDisadvantageSelection, detailsForMentalRestrictionsDialog, detailsForPhysicalScarsDialog } from '../system/disadvantages.js';
import { getAllSchticks } from '../utils/schticks.js';
import { showPowerCreationDialog } from './character-sheet-power-dialog.js';
import { showEchoCardPickDialog, showEchoCreationDialog } from './character-sheet-echo-dialog.js';
import { buildFreshTraitUses, getCardOption, getEcho, getEchoCard, getEchoSubChoice, getUnlockedCardSlots } from '../utils/echos/index.js';
import { CATEGORY_LABELS, CATEGORY_ORDER, CREATION_POWER_REQUIREMENTS, CREATION_POWER_TOTAL, CREATION_POWERS_AT_RANK_2, countPowersByCategory, findDuplicatePowerLabel, resolvePowerCategoryFromItem } from '../utils/power-catalog.js';
import { getLanguage as getLanguageDef, normalizeKnownLanguages } from '../utils/languages.js';
import { showLanguagesDialog } from './languages-dialog.js';
import { findFirstFit, fitsInGrid, parseInventorySize, rectsOverlap } from '../utils/inventory-grid.js';
import { isLegacyUnarmedItem } from '../utils/unarmed-fallback.js';
import { loadZoneFromBands, movementPenaltyForLoad } from '../utils/encumbrance.js';
import { buildPostCreationSnapshot } from '../utils/xp-post-creation.js';
import { resetCharacterForRecreation, listEquippedGeneralArtifacts } from '../utils/reset-character.js';
import { getDefaultInventorySizeForItemData } from '../utils/seed-general-items.js';
import { getNormalizedEquipSlots, normalizeSlotKey } from '../utils/equip-slots.js';
import { attributeBandCost, powerLevelCost } from '../utils/constants.js';
import { calculateMaxPowerLevel, calculateMaxSkillRank } from '../utils/calculations.js';
import { getPowerDefinitionRank } from '../utils/power-definition-rank.js';
import { matchesMasteryWeaponCatalog } from '../utils/weapons.js';
import { buildRadialManeuverPrefsContext } from '../utils/radial-maneuver-prefs.js';
import { buildArtifactEvolutionCards } from '../artifacts/artifact-evolution-actions.js';
import { actorHasProgressionArtifacts } from '../utils/artifact-tree-grant.js';
import { applyAttributePendingChanges, calculateAttributePendingNetCost, calculatePowerPendingNetCost, calculateSingleSkillPendingXpNet, calculateSkillPendingNetCost, } from '../progression/progression-hub-actions.js';
// Removed: showWeaponCreationDialog, showArmorCreationDialog, showShieldCreationDialog
// Replaced with General Items Storage and Store dialogs
// Use namespaced ActorSheet when available to avoid deprecation warnings
const BaseActorSheet = foundry?.appv1?.sheets?.ActorSheet || ActorSheet;
/**
 * True when an item is an Echo-bound artifact that is locked into its slot
 * (Elven Stride, Wyrm/Serpent Scales, Dragon Claws, Dragon Head, etc.). Such
 * items are auto-equipped at creation and can never be unequipped, displaced,
 * or deleted by the player.
 */
function isEchoLockedItem(item) {
    if (!item || item.type !== 'artifact')
        return false;
    const fl = item.getFlag?.('mastery-system', 'echoLocked');
    if (fl === true)
        return true;
    // Fall back to the binding/echoBound markers set by the generator.
    if (item.getFlag?.('mastery-system', 'echoBound') === true)
        return true;
    return String(item.system?.binding || '') === 'echo';
}
export class MasteryCharacterSheet extends BaseActorSheet {
    /** Preserves <details open> for Token-Radial prefs across re-renders (checkbox updates call render). */
    _radialManeuverPrefsDetailsOpen;
    /**
     * Preserves <details open> for the grouped powers list.
     * `undefined` means first paint: expanded (see getData: `!== false`).
     */
    _powersListDetailsOpen;
    /** Last pointer-down on equipment tile (for click vs drag distinction). */
    #itemInfoPointerDown = null;
    _pendingAttributeChanges = {}; // Signed pending attribute deltas (XP mode)
    _pendingPowerLevelChanges = {}; // Track pending power level increases
    _pendingSkillRankChanges = {}; // Track pending skill rank changes (signed)
    #setHeaderXpDisplay(value) {
        const html = this.element;
        const el = html.find('#sheet-xp-display');
        if (!el.length)
            return;
        const n = Number(value);
        const total = Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
        const free = Math.max(0, Math.floor(Number(this.actor.system?.points?.xpFree ?? 0)));
        el.text(free > 0 ? `${total} (★${free})` : String(total));
        el.attr('title', free > 0 ? `${total} XP gesamt, davon ${free} Free XP (frei verteilbar)` : 'Verfügbare XP');
    }
    /** @override */
    static get defaultOptions() {
        const baseOptions = super.defaultOptions || {};
        const options = foundry.utils.mergeObject(baseOptions, {
            classes: ['mastery-system', 'sheet', 'actor', 'character'],
            template: 'systems/mastery-system/templates/actor/character-sheet.hbs',
            width: 720,
            height: 800,
            tabs: [
                {
                    navSelector: '.sheet-tabs',
                    contentSelector: '.sheet-body',
                    initial: 'attributes'
                }
            ],
            dragDrop: [
                { dragSelector: '.item-list .item', dropSelector: null },
                // Equipment grid/slots/trash use custom `[data-df-drop]` handlers — Foundry's
                // default `.df-dropzone` drop would duplicate items and break placement.
                { dragSelector: '.df-draggable-item', dropSelector: null }
            ],
            // `.sheet-body` is the actual overflow-y:auto container (see
            // character-sheet.css). The per-tab selectors stay for safety in case
            // Foundry internally iterates them, but without `.sheet-body` the
            // scroll position was lost on every re-render (e.g. after clicking
            // the Skill/Attribute/Power "+" buttons in creation mode).
            scrollY: ['.sheet-body', '.echo', '.attributes', '.skills', '.powers', '.equipment']
        });
        console.log('Mastery System | Character Sheet defaultOptions:', options);
        return options;
    }
    /**
     * Add Spell → open magic power dialog
     */
    // Removed #onSpellAdd, #onPowerAdd, #openMagicPowerDialog, #openPowerDialog
    // Now using #onPowerAddCreation and #onSpellAddCreation for all power/spell additions
    /**
     * Add Power (unified dialog with category/tag/special filters).
     * The optional data-category attribute on the button pre-selects a filter.
     */
    async #onPowerAddCreation(event) {
        event.preventDefault();
        const presetCategory = $(event.currentTarget).data('category') || undefined;
        console.log('Mastery System | #onPowerAddCreation called', {
            actorId: this.actor.id,
            creationComplete: this.actor.system?.creation?.complete,
            presetCategory
        });
        await this.#openPowerDialogCreation(presetCategory);
    }
    /**
     * Open Power Creation Dialog with creation limits enforced
     */
    async #openPowerDialogCreation(presetCategory) {
        console.log('Mastery System | #openPowerDialogCreation called', {
            presetCategory,
            actorId: this.actor.id,
            creationComplete: this.actor.system?.creation?.complete
        });
        try {
            await showPowerCreationDialog(this.actor, presetCategory ? { presetCategory } : undefined);
            console.log('Mastery System | Power dialog closed, re-rendering');
            this.render();
        }
        catch (error) {
            console.error('Mastery System | Failed to open power creation dialog', error);
            ui.notifications?.error('Failed to open power selection dialog');
        }
    }
    /**
     * Open the Echo Creation Dialog (Echo + sub-choice + veiled form + start card).
     */
    async #onEchoChoose(event) {
        event.preventDefault();
        try {
            await showEchoCreationDialog(this.actor);
            this.render();
        }
        catch (error) {
            console.error('Mastery System | Failed to open Echo creation dialog', error);
            ui.notifications?.error('Failed to open Echo selection dialog');
        }
    }
    /**
     * Open the Echo Card Pick Dialog (add one more card from the selected Echo's deck).
     */
    async #onEchoCardAdd(event) {
        event.preventDefault();
        try {
            await showEchoCardPickDialog(this.actor);
            this.render();
        }
        catch (error) {
            console.error('Mastery System | Failed to open Echo card pick dialog', error);
            ui.notifications?.error('Failed to open Echo card picker');
        }
    }
    /**
     * Handle power rank change during creation
     */
    async #onRadialManeuverHideAll(event) {
        event.stopPropagation();
        if (!this.isEditable)
            return;
        const el = event.currentTarget;
        const sys = this.actor.system;
        await this.actor.update({
            'system.radialManeuverPrefs': {
                ...(sys.radialManeuverPrefs || {}),
                hideAllStandard: el.checked
            }
        });
        this.render();
    }
    async #onRadialManeuverHideOne(event) {
        event.stopPropagation();
        if (!this.isEditable)
            return;
        const el = event.currentTarget;
        if (el.disabled)
            return;
        const id = el.dataset.maneuverId;
        if (!id)
            return;
        // Foundry verschachtelte Updates mergen hideIds — einzelne Keys per -= entfernen, sonst bleibt „ausblenden“ aktiv.
        if (el.checked) {
            await this.actor.update({
                [`system.radialManeuverPrefs.hideIds.${id}`]: true
            });
        }
        else {
            await this.actor.update({
                [`system.radialManeuverPrefs.hideIds.-=${id}`]: null
            });
        }
        this.render();
    }
    async #onPowerRadialCheckboxChange(event) {
        event.stopPropagation();
        const el = event.currentTarget;
        const itemId = el.dataset.itemId;
        if (!itemId)
            return;
        const item = this.actor.items.get(itemId);
        if (!item || item.type !== 'power')
            return;
        await item.update({ 'system.showInRadialMenu': el.checked });
        this.render();
    }
    async #onPowerRankChange(event) {
        event.preventDefault();
        const $select = $(event.currentTarget);
        const itemId = $select.data('item-id');
        const newRank = parseInt($select.val());
        const system = this.actor.system;
        const masteryRank = system.mastery?.rank || 2;
        if (newRank > masteryRank) {
            ui.notifications?.error(`Power rank cannot exceed Mastery Rank ${masteryRank}`);
            const item = this.actor.items.get(itemId);
            if (item) {
                const currentRank = item.system.rank || item.system.level || 1;
                $select.val(currentRank);
            }
            return;
        }
        const item = this.actor.items.get(itemId);
        if (item) {
            // Update both rank (new structure) and level (legacy) for backwards compatibility
            // Also update minLevel to match (during creation, minLevel should track rank changes)
            const updateData = {
                'system.rank': newRank,
                'system.level': newRank, // Keep level for backwards compatibility
                'system.minLevel': newRank // Update minLevel to match new rank during creation
            };
            await item.update(updateData);
            this.render();
        }
    }
    /**
     * Open General Items Storage Dialog
     */
    async #onGeneralItemsClick(event) {
        event.preventDefault();
        await this.#openGeneralItemsStorage();
    }
    /**
     * Open General Items Storage Window
     */
    async #openGeneralItemsStorage() {
        try {
            console.log('Mastery System | [Storage Debug] CharacterSheet open storage', {
                actorId: this.actor?.id,
                actorName: this.actor?.name
            });
            const { GeneralItemsStorageDialog } = await import('./general-items-storage-dialog.js');
            await GeneralItemsStorageDialog.showForActor(this.actor);
        }
        catch (error) {
            console.error('Mastery System | Failed to open General Items Storage', error);
            ui.notifications?.error('Failed to open General Items Storage');
        }
    }
    /**
     * Open Store Dialog (GM only)
     */
    async #onStoreClick(event) {
        event.preventDefault();
        if (!game.user?.isGM) {
            ui.notifications?.warn('Only the GM can access the Store');
            return;
        }
        await this.#openStore();
    }
    /**
     * Open Store Window (GM only)
     */
    async #openStore() {
        try {
            const { StoreDialog } = await import('./store-dialog.js');
            await StoreDialog.showForActor(this.actor);
        }
        catch (error) {
            console.error('Mastery System | Failed to open Store', error);
            ui.notifications?.error('Failed to open Store');
        }
    }
    /**
     * Toggle equipment equipped status (Radio button handler)
     */
    async #onEquipmentToggle(event) {
        const $radio = $(event.currentTarget);
        const itemId = $radio.val() || $radio.data('item-id') || $radio.attr('data-item-id');
        // const itemType = $radio.attr('name'); // 'equipped-weapon', 'equipped-armor', or 'equipped-shield' - unused
        const equipped = $radio.is(':checked');
        if (!itemId) {
            console.warn('Mastery System | [EQUIP TOGGLE] Could not find item ID', {
                radio: event.currentTarget,
                radioData: $radio.data(),
                radioAttrs: Array.from(event.currentTarget.attributes).map((attr) => ({
                    name: attr.name,
                    value: attr.value
                }))
            });
            ui.notifications?.warn('Could not find item to equip/unequip.');
            return;
        }
        const item = this.actor.items.get(itemId);
        if (!item) {
            console.warn('Mastery System | [EQUIP TOGGLE] Item not found in actor.items', {
                itemId,
                actorId: this.actor.id,
                allItemIds: Array.from(this.actor.items.keys())
            });
            ui.notifications?.warn(`Item with ID ${itemId} not found.`);
            return;
        }
        // Validation: 2-handed weapons cannot be used with shields
        if (item.type === 'weapon' && equipped) {
            const weaponHands = item.system?.hands || 1;
            if (weaponHands === 2) {
                // Check if a shield is equipped
                const equippedShield = Array.from(this.actor.items.values()).find((i) => i.type === 'shield' && i.system?.equipped === true);
                if (equippedShield) {
                    ui.notifications?.warn(`Cannot equip 2-handed weapon "${item.name}" while shield "${equippedShield.name}" is equipped.`);
                    // Revert radio button
                    $radio.prop('checked', false);
                    return;
                }
            }
        }
        // Validation: Shields cannot be equipped with 2-handed weapons
        if (item.type === 'shield' && equipped) {
            const equippedWeapon = Array.from(this.actor.items.values()).find((i) => i.type === 'weapon' && i.system?.equipped === true);
            if (equippedWeapon) {
                const weaponHands = equippedWeapon.system?.hands || 1;
                if (weaponHands === 2) {
                    ui.notifications?.warn(`Cannot equip shield "${item.name}" while 2-handed weapon "${equippedWeapon.name}" is equipped.`);
                    // Revert radio button
                    $radio.prop('checked', false);
                    return;
                }
            }
        }
        try {
            // First, unequip all other items of the same type
            const updates = [];
            for (const otherItem of this.actor.items) {
                if (otherItem.id !== itemId && otherItem.type === item.type && otherItem.system?.equipped) {
                    updates.push({ _id: otherItem.id, 'system.equipped': false });
                }
            }
            // Then equip/unequip the selected item
            if (equipped) {
                updates.push({ _id: itemId, 'system.equipped': true });
            }
            else {
                updates.push({ _id: itemId, 'system.equipped': false });
            }
            if (updates.length > 0) {
                await this.actor.updateEmbeddedDocuments('Item', updates);
                console.log('Mastery System | [EQUIP TOGGLE] Updated items', {
                    itemId,
                    itemName: item.name,
                    equipped,
                    itemType: item.type,
                    updatesCount: updates.length
                });
                // Re-render the sheet to update the display
                this.render();
            }
        }
        catch (error) {
            console.error('Mastery System | [EQUIP TOGGLE] Error updating item', error);
            ui.notifications?.error(`Failed to update item: ${error}`);
            // Revert radio button state
            $radio.prop('checked', !equipped);
        }
    }
    /** @override */
    get template() {
        const templatePath = 'systems/mastery-system/templates/actor/character-sheet.hbs';
        console.log('Mastery System | Character Sheet template path:', templatePath);
        return templatePath;
    }
    /**
     * Refresh XP distribution controls when the GM ends an Upgrade Step or
     * grants XP from world settings while this sheet is open.
     */
    _onUpdate(changed, _options, _userId) {
        if (typeof super._onUpdate === 'function') {
            super._onUpdate(changed, _options, _userId);
        }
        const keys = Object.keys(changed ?? {});
        const xpTouched = keys.some((k) => k.startsWith('system.points') ||
            k.startsWith('system.xp.currentStep') ||
            k === 'system.xp');
        if (!xpTouched || !this.rendered)
            return;
        try {
            this.#updateAttributeXPUI();
            this.#updateSkillXPUI();
            this.#updatePowerLevelUI();
        }
        catch {
            // Sheet may be mid-render; a full render is still safer than stale locks.
            this.render(false);
        }
    }
    /** @override */
    async getData(options) {
        const context = await super.getData(options);
        const actorData = context.actor;
        // Add system data
        context.system = actorData.system;
        context.flags = actorData.flags;
        if (this.actor.type === 'character') {
            context.maxPurchasablePowerLevel = this.#getMaxPurchasablePowerLevel();
        }
        // Check if character creation is complete
        // Treat undefined as complete (no migration, older actors should not be stuck in creation UI)
        const creationCompleteRaw = context.system.creation?.complete;
        context.creationComplete = creationCompleteRaw !== false;
        console.log('Mastery System | getData - Creation Status:', {
            creationCompleteRaw,
            creationComplete: context.creationComplete,
            systemCreation: context.system.creation,
            hasCreation: !!context.system.creation
        });
        // Calculate creation point counters (always calculate, but only show if not complete)
        const masteryRank = context.system.mastery?.rank || 2;
        const skillPointsConfig = CONFIG.MASTERY?.creation?.skillPoints || 40;
        const maxDisadvantagePoints = CONFIG.MASTERY?.creation?.maxDisadvantagePoints ?? 8;
        const minDisadvantagePoints = CONFIG.MASTERY?.creation?.minDisadvantagePoints ?? 2;
        // Calculate attribute distribution status (2×8, 2×6, 2×4, 1×2 model)
        const attributeKeys = ['might', 'agility', 'vitality', 'intellect', 'resolve', 'influence', 'wits'];
        const attrValues = attributeKeys.map(key => context.system.attributes?.[key]?.value || masteryRank);
        const assignedValues = attrValues.filter(v => [2, 4, 6, 8].includes(v));
        const count8 = assignedValues.filter(v => v === 8).length;
        const count6 = assignedValues.filter(v => v === 6).length;
        const count4 = assignedValues.filter(v => v === 4).length;
        const count2 = assignedValues.filter(v => v === 2).length;
        const attributeDistributionValid = count8 === 2 && count6 === 2 && count4 === 2 && count2 === 1;
        /** Per-attribute dropdown: hide tier options already fully used elsewhere (2×8, 2×6, 2×4, 1×2). */
        const attrTierMax = { 8: 2, 6: 2, 4: 2, 2: 1 };
        const attrCreationSelect = {};
        const attrs = context.system.attributes || {};
        for (const ex of attributeKeys) {
            let o2 = 0, o4 = 0, o6 = 0, o8 = 0;
            for (const k of attributeKeys) {
                if (k === ex)
                    continue;
                const v = attrs[k]?.value;
                if (v === 8)
                    o8++;
                else if (v === 6)
                    o6++;
                else if (v === 4)
                    o4++;
                else if (v === 2)
                    o2++;
            }
            const cur = attrs[ex]?.value;
            const curInSet = cur === 2 || cur === 4 || cur === 6 || cur === 8;
            const can = (val) => {
                if (!curInSet)
                    return true;
                if (cur === val)
                    return true;
                const used = val === 8 ? o8 : val === 6 ? o6 : val === 4 ? o4 : o2;
                const max = attrTierMax[val] ?? 0;
                return used < max;
            };
            attrCreationSelect[ex] = { s2: can(2), s4: can(4), s6: can(6), s8: can(8) };
        }
        // Calculate skill points spent
        let skillPointsSpent = 0;
        for (const skillValue of Object.values(context.system.skills || {})) {
            skillPointsSpent += (typeof skillValue === 'number' ? skillValue : 0);
        }
        // Calculate disadvantage points
        const disadvantagePoints = (context.system.disadvantages || []).reduce((sum, d) => sum + (d.points || 0), 0);
        const disadvantagesValid = disadvantagePoints >= minDisadvantagePoints && disadvantagePoints <= maxDisadvantagePoints;
        // Check if disadvantages phase is reviewed (user has visited the tab or interacted with disadvantages)
        const disadvantagesReviewed = context.system.creation?.disadvantagesReviewed === true ||
            (context.system.disadvantages && Array.isArray(context.system.disadvantages));
        // Calculate powers & magic creation status
        const items = this.#prepareItems();
        const powers = items.powers || [];
        const selectedTrees = this.#getSelectedTrees(powers);
        // During creation, all powers count (trees are optional)
        const selectedPowers = powers;
        // Per-category counters (new structure uses system.category, legacy uses system.powerType)
        const categoryCounts = {
            active: 0, activeBuff: 0, movement: 0, reaction: 0, passive: 0
        };
        for (const p of selectedPowers) {
            const sys = p.system || {};
            let cat = sys.category;
            if (!cat) {
                const pt = sys.powerType;
                if (pt === 'buff')
                    cat = 'activeBuff';
                else if (pt === 'utility')
                    cat = 'active';
                else if (pt === 'active' || pt === 'passive' || pt === 'reaction' || pt === 'movement')
                    cat = pt;
            }
            if (cat && cat in categoryCounts)
                categoryCounts[cat]++;
        }
        /** Starting character: 2 Active, 2 Passive, 1 Reaction, 1 Movement, 1 Active Buff — all Rank 2. */
        const totalPowersRequired = CREATION_POWER_TOTAL;
        const totalPowersSelected = powers.length;
        const powersAtRank2 = powers.filter((p) => Number(p.system?.level ?? 1) >= 2).length;
        const categoryRequirements = CATEGORY_ORDER.map(cat => ({
            key: cat,
            label: CATEGORY_LABELS[cat],
            required: CREATION_POWER_REQUIREMENTS[cat],
            selected: categoryCounts[cat],
            valid: categoryCounts[cat] === CREATION_POWER_REQUIREMENTS[cat]
        }));
        const categoriesValid = CATEGORY_ORDER.every(cat => categoryCounts[cat] === CREATION_POWER_REQUIREMENTS[cat]) &&
            totalPowersSelected === CREATION_POWER_TOTAL &&
            powersAtRank2 === CREATION_POWERS_AT_RANK_2;
        // --- Echo view ------------------------------------------------------------
        const rawEcho = (context.system.echo || {});
        const echoKey = rawEcho.key || '';
        const echoDef = getEcho(echoKey);
        const echoSubChoice = echoDef?.subChoices?.length
            ? getEchoSubChoice(echoKey, rawEcho.subChoiceKey || null)
            : undefined;
        const veiledDef = echoDef?.veiledForm && rawEcho.veiledFormKey
            ? getEcho(rawEcho.veiledFormKey)
            : undefined;
        const selectedCardIds = Array.isArray(rawEcho.selectedCardIds)
            ? rawEcho.selectedCardIds.filter((id) => typeof id === 'string')
            : [];
        const cardUses = (rawEcho.cardUses && typeof rawEcho.cardUses === 'object')
            ? { ...rawEcho.cardUses }
            : {};
        const unlockedCardSlots = echoDef ? getUnlockedCardSlots(masteryRank) : 0;
        const canAddCard = !!echoDef && selectedCardIds.length < unlockedCardSlots;
        const deckView = echoDef
            ? echoDef.deck.map(c => ({
                id: c.id,
                name: c.name,
                trigger: c.trigger,
                options: c.options,
                selected: selectedCardIds.includes(c.id),
                used: cardUses[c.id] === true
            }))
            : [];
        const echoCreationValid = !!echoDef
            && (!echoDef.subChoices?.length || !!rawEcho.subChoiceKey)
            && (!echoDef.veiledForm || !!rawEcho.veiledFormKey)
            && selectedCardIds.length >= 1;
        const echoView = echoDef
            ? {
                key: echoKey,
                def: echoDef,
                subChoice: echoSubChoice || null,
                veiled: veiledDef || null,
                deck: deckView,
                selectedCardIds,
                unlockedCardSlots,
                canAddCard,
                creationValid: echoCreationValid
            }
            : null;
        context.echoView = echoView;
        /**
         * Languages view (Players Guide 3100–3127). Common Tongue is always
         * known; the picker enforces ≥ 1 additional language at character
         * creation. The handlebars template renders `languagesView.list` as
         * tag chips and `languagesView.creationValid` toggles a warning hint.
         */
        {
            const knownRaw = context.system?.languages?.known ?? ['common'];
            const norm = normalizeKnownLanguages(knownRaw);
            context.languagesView = {
                list: norm.cleaned
                    .map((key) => getLanguageDef(key))
                    .filter((d) => !!d)
                    .map((d) => ({ key: d.key, name: d.name, isCommon: !!d.isCommon })),
                pickedNonCommon: norm.pickedNonCommon,
                creationValid: norm.creationValid,
            };
        }
        console.log('Mastery System | getData - Powers Status:', {
            totalPowers: powers.length,
            selectedTrees: selectedTrees,
            selectedTreesCount: selectedTrees.length,
            selectedPowersCount: selectedPowers.length,
            categoryCounts,
            creationComplete: context.creationComplete
        });
        // Schticks data - per rank structure
        const schticksRanks = context.system.schticks?.ranks || [];
        const availableSchticks = getAllSchticks();
        // Create lookup map for schticks by ID
        const availableSchticksById = {};
        availableSchticks.forEach((s) => {
            availableSchticksById[s.id] = s;
        });
        // Prepare schticks rows - one per mastery rank
        const schticksRows = [];
        for (let rank = 1; rank <= masteryRank; rank++) {
            const rankData = schticksRanks.find((r) => r.rank === rank);
            schticksRows.push({
                rank,
                schtickName: rankData?.schtickName || '',
                manifestation: rankData?.manifestation || ''
            });
        }
        // Validate schticks - each rank should have a schtick selected
        const schticksValidation = this.#validateSchticksPerRank(schticksRows, masteryRank);
        // Tooltip texts for each rank
        const rankTooltips = {
            1: {
                description: 'Subtle signs or small curiosities; a hint of what\'s to come.',
                example: 'Eyes gleam pale blue; breath mists even indoors.'
            },
            2: {
                description: 'Clear aesthetic or behavioral quirk visible to others.',
                example: 'Tears fall as tiny snowflakes; touch feels cool as marble.'
            },
            3: {
                description: 'Your power visibly marks your entire body or presence.',
                example: 'Skin fades to icy blue; faint frost lines trace your veins.'
            },
            4: {
                description: 'Your aura influences nearby objects or the air itself.',
                example: 'Objects frost slightly when touched; cold lingers where you stand.'
            },
            5: {
                description: 'Reality subtly bends around your nature; myth and truth blur.',
                example: 'A halo of frost shimmers in moonlight; snow falls when you grieve.'
            }
        };
        // Always provide creation data for template (even if complete)
        context.creation = {
            masteryRank,
            skillPointsConfig,
            attrCount8: count8,
            attrCount6: count6,
            attrCount4: count4,
            attrCount2: count2,
            attrCreationSelect,
            attributeDistributionValid,
            skillPointsRemaining: skillPointsConfig - skillPointsSpent,
            skillPointsSpent,
            disadvantagePoints,
            disadvantagePointsMin: minDisadvantagePoints,
            disadvantagePointsMax: maxDisadvantagePoints,
            disadvantagesValid,
            disadvantagesReviewed,
            powersSelected: selectedPowers.length,
            powersRequired: totalPowersRequired,
            powersAtRank2,
            powersAtRank2Required: CREATION_POWERS_AT_RANK_2,
            categoryRequirements,
            categoryCounts,
            categoriesValid,
            selectedTrees: selectedTrees,
            schticksRows: schticksRows,
            availableSchticks: availableSchticks,
            availableSchticksById: availableSchticksById,
            rankTooltips: rankTooltips,
            schticksValid: schticksValidation.ok,
            powersValid: categoriesValid,
            echoCreationValid,
            languagesCreationValid: context.languagesView?.creationValid !== false,
            canFinalize: attributeDistributionValid &&
                skillPointsSpent === skillPointsConfig &&
                categoriesValid &&
                disadvantagesValid &&
                echoCreationValid &&
                context.languagesView?.creationValid !== false
        };
        console.log('Mastery System | getData - Final Context Check:', {
            creationComplete: context.creationComplete,
            creationCompleteType: typeof context.creationComplete,
            creationCompleteValue: String(context.creationComplete),
            systemCreationComplete: context.system.creation?.complete,
            creation: {
                powersSelected: context.creation?.powersSelected,
                categoryCounts: context.creation?.categoryCounts
            },
            itemsPowers: items.powers?.length || 0,
            willShowCreationUI: !context.creationComplete
        });
        context.isGM = !!game.user?.isGM;
        context.defaultMasteryRank = game.settings.get('mastery-system', 'defaultMasteryRank') || 2;
        // Add configuration data
        context.config = CONFIG.MASTERY;
        // Enrich biography info for display
        const TextEditorImpl = foundry.applications?.ux?.TextEditor?.implementation || TextEditor;
        context.enrichedBio = {
            notes: TextEditorImpl.enrichHTML(context.system.bio?.notes || ''),
            background: TextEditorImpl.enrichHTML(context.system.notes?.background || '')
        };
        // Prepare items by type
        context.items = this.#prepareItems();
        // Calculate derived values
        context.derivedValues = this.#calculateDerivedValues(context.system);
        // Note: armorTotal and evadeTotal are now calculated in actor.prepareDerivedData()
        // No need to calculate here - just use the derived values from system.combat
        // Add skills list (sorted alphabetically)
        context.skills = this.#prepareSkills(context.system.skills || {}, context.system.skillsSpent || {});
        // Prepare disadvantages (named-card layout for physical / mental limitations)
        const rawDisadvantages = context.system.disadvantages || [];
        context.disadvantages = rawDisadvantages.map((d) => {
            const out = { ...d };
            if (d.id === 'mental-restrictions') {
                out.cardMode = 'named';
                out.categoryShort = 'Mental Restriction';
                const sev = d.details?.severity;
                out.summaryLine =
                    sev === 'easy'
                        ? '1 pt — Easy (Resolve k1 TN 6)'
                        : sev === 'hard'
                            ? '3 pt — Hard (Resolve k1 TN 14)'
                            : '2 pt — Normal (Resolve k1 TN 10)';
            }
            else if (d.id === 'physical-scars') {
                out.cardMode = 'named';
                out.categoryShort = 'Physical Limitation';
                const t = parseInt(String(d.details?.tier ?? '1'), 10);
                out.summaryLine =
                    t === 3 ? '3 pt — Severe' : t === 2 ? '2 pt — Significant' : '1 pt — Minor';
            }
            else {
                out.cardMode = 'default';
            }
            return out;
        });
        context.disadvantagePointsTotal = context.disadvantages.reduce((sum, d) => sum + (d.points || 0), 0);
        // Ensure token image is available
        if (!context.actor.prototypeToken?.texture?.src) {
            context.actor.prototypeToken = context.actor.prototypeToken || {};
            context.actor.prototypeToken.texture = context.actor.prototypeToken.texture || {};
            context.actor.prototypeToken.texture.src = context.actor.img;
        }
        // Ensure context.items contains the prepared items structure (weapons, armor, shields, etc.)
        // This is already set in line 453, but we ensure it's not overwritten
        if (!context.items || !context.items.weapons) {
            context.items = this.#prepareItems();
        }
        // Build Equipment UI Context
        context.equipmentUi = this.#prepareEquipmentUi(context.items);
        context.hasProgressionArtifacts = actorHasProgressionArtifacts(this.actor);
        context.hasArtifactEvolution = context.hasProgressionArtifacts;
        context.radialManeuverPrefsPanel = buildRadialManeuverPrefsContext(context.system);
        context.radialManeuverPrefsDetailsOpen = this._radialManeuverPrefsDetailsOpen === true;
        if (context.creationComplete) {
            context.powersByTypeGroups = this.#buildPowersByTypeGroups(context.items?.powers || []);
            /* Default: collapsed; open after finalize or when user expanded in this session. */
            context.powersListDetailsOpen = this._powersListDetailsOpen === true;
            context.powersGroupsExpanded = this._powersListDetailsOpen === true;
        }
        else {
            context.powersByTypeGroups = [];
            context.powersListDetailsOpen = false;
            context.powersGroupsExpanded = false;
        }
        // Add active buffs data - ALWAYS set as array, even if empty
        context.activeBuffs = [];
        try {
            const { getActiveBuffs } = await import('../utils/active-buffs.js');
            const activeBuffs = getActiveBuffs(this.actor);
            console.log('Mastery System | [CHARACTER SHEET] Found active buffs:', activeBuffs.length, activeBuffs);
            if (activeBuffs && activeBuffs.length > 0) {
                context.activeBuffs = activeBuffs.map((effect) => {
                    const flags = effect.flags?.['mastery-system'] || {};
                    const power = flags.powerId ? this.actor.items.get(flags.powerId) : null;
                    const currentRound = game.combat?.round || 1;
                    const activatedRound = flags.activatedRound || 1;
                    const masteryRank = flags.masteryRank || 2;
                    const roundsRemaining = Math.max(0, masteryRank - (currentRound - activatedRound));
                    const buffData = {
                        id: effect.id,
                        name: effect.name,
                        icon: effect.icon || effect.img || 'icons/svg/aura.svg',
                        description: effect.description || effect.system?.description?.value || effect.system?.description || '',
                        powerId: flags.powerId,
                        powerName: flags.powerName || power?.name || effect.name,
                        masteryRank: masteryRank,
                        activatedRound: activatedRound,
                        currentRound: currentRound,
                        roundsRemaining: roundsRemaining
                    };
                    console.log('Mastery System | [CHARACTER SHEET] Processed buff:', buffData);
                    return buffData;
                });
            }
            console.log('Mastery System | [CHARACTER SHEET] Final activeBuffs array:', context.activeBuffs.length, context.activeBuffs);
        }
        catch (error) {
            console.error('Mastery System | [CHARACTER SHEET] Failed to load active buffs', error);
            context.activeBuffs = [];
        }
        // Intentionally no icon strip on Attributes (was confusing vs. Powers-tab buff list).
        context.statusEffects = [];
        // Passive slotting happens exclusively in combat (Combat-Start dialog).
        // The character-sheet "Passive Slots" manager was removed: it implied a
        // false pre-selection outside combat and was unrelated to the in-combat
        // passive slots.
        // Compact combat-stats: only while this actor is in the **active** encounter.
        try {
            const g = globalThis;
            const combat = g.game?.combats?.active ?? g.game?.combat;
            const inEncounter = !!combat?.started &&
                Array.from(combat.combatants ?? []).some((c) => c.actor?.id === this.actor?.id);
            if (!inEncounter) {
                context.combatStatsView = null;
            }
            else {
                try {
                    if (typeof this.actor.prepareDerivedData === 'function') {
                        this.actor.prepareDerivedData();
                    }
                }
                catch {
                    /* ignore */
                }
                const sys = this.actor.system ?? {};
                const healthBars = Array.isArray(sys.health?.bars) ? sys.health.bars : [];
                const stressBars = Array.isArray(sys.stress?.bars) ? sys.stress.bars : [];
                const sumCurMax = (bars) => bars.reduce((acc, b) => {
                    acc.current += Math.max(0, Math.floor(Number(b?.current ?? 0) || 0));
                    acc.max += Math.max(0, Math.floor(Number(b?.max ?? 0) || 0));
                    return acc;
                }, { current: 0, max: 0 });
                const hp = sumCurMax(healthBars);
                const stress = sumCurMax(stressBars);
                const combat = sys.combat ?? {};
                const iniEqTotal = Number(combat.initiativeEquipmentTotal ?? 0) || 0;
                const iniD8Mech = Number(combat.initiativeD8FromMechanics ?? 0) || 0;
                const iniMR = Number(combat.initiativeMasteryRank ?? sys.mastery?.rank ?? 2) || 2;
                const iniDice = Math.max(0, iniMR + iniD8Mech);
                const rowTip = (rows, cap) => (Array.isArray(rows) ? rows : [])
                    .slice(0, cap)
                    .map((r) => `${String(r.label ?? '').trim()}: ${r.display ?? r.value}`)
                    .join(' · ');
                context.combatStatsView = {
                    armor: Number(combat.armorTotal ?? 0) || 0,
                    evade: Number(combat.evadeTotal ?? 8) || 8,
                    drPct: Number(combat.damageReductionPct ?? 0) || 0,
                    initiativeDice: iniDice,
                    initiativeEquipmentDisplay: String(combat.initiativeEquipmentTotalDisplay ?? (iniEqTotal >= 0 ? `+${iniEqTotal}` : String(iniEqTotal))),
                    hp: { current: hp.current, max: hp.max },
                    stress: { current: stress.current, max: stress.max },
                    armorBreakdownTip: rowTip(combat.armorBreakdownRows, 14),
                    evadeBreakdownTip: rowTip(combat.evadeBreakdownRows, 14),
                    drBreakdownTip: rowTip(combat.damageReductionRows, 10),
                };
            }
        }
        catch (err) {
            console.error('Mastery System | Failed to build combatStatsView', err);
            context.combatStatsView = null;
        }
        // Ensure context is always an object
        if (!context || typeof context !== 'object') {
            console.error('Mastery System | getData returned invalid context', context);
            return {};
        }
        return context;
    }
    /** @override */
    async render(force, options) {
        console.log('Mastery System | Character Sheet render called', { force, options });
        if (this.element && this.element.length > 0) {
            const det = this.element.find('.radial-maneuver-prefs-details')[0];
            if (det instanceof HTMLDetailsElement) {
                this._radialManeuverPrefsDetailsOpen = det.open;
            }
            const pld = this.element.find('.powers-list-details')[0];
            if (pld instanceof HTMLDetailsElement) {
                this._powersListDetailsOpen = pld.open;
            }
        }
        // Save scroll positions for all tabs and the main window before rendering
        const scrollPositions = {};
        if (this.element && this.element.length > 0) {
            // Save scroll position for each tab
            const tabs = this.element.find('.tab');
            tabs.each((index, tab) => {
                const $tab = $(tab);
                const tabName = $tab.attr('data-tab') || `tab-${index}`;
                const scrollTop = $tab.scrollTop();
                if (scrollTop !== undefined && scrollTop > 0) {
                    scrollPositions[tabName] = scrollTop;
                }
            });
            // Also save scroll position for the main sheet body (in case tabs don't have their own scroll)
            const sheetBody = this.element.find('.sheet-body');
            if (sheetBody.length > 0) {
                const bodyScrollTop = sheetBody.scrollTop();
                if (bodyScrollTop !== undefined && bodyScrollTop > 0) {
                    scrollPositions['sheet-body'] = bodyScrollTop;
                }
            }
        }
        const result = await super.render(force, options);
        void this.#migrateAttributeBaselinesIfNeeded();
        // Restore scroll positions after rendering
        if (this.element && this.element.length > 0 && Object.keys(scrollPositions).length > 0) {
            // Use requestAnimationFrame to ensure DOM is fully updated
            requestAnimationFrame(() => {
                // Restore tab scroll positions
                const tabs = this.element.find('.tab');
                tabs.each((index, tab) => {
                    const $tab = $(tab);
                    const tabName = $tab.attr('data-tab') || `tab-${index}`;
                    if (scrollPositions[tabName] !== undefined) {
                        $tab.scrollTop(scrollPositions[tabName]);
                    }
                });
                // Restore sheet body scroll position
                if (scrollPositions['sheet-body'] !== undefined) {
                    const sheetBody = this.element.find('.sheet-body');
                    if (sheetBody.length > 0) {
                        sheetBody.scrollTop(scrollPositions['sheet-body']);
                    }
                }
            });
        }
        console.log('Mastery System | Character Sheet render completed');
        return result;
    }
    /**
     * Prepare items organized by type
     */
    #prepareItems() {
        const powers = [];
        const echoes = [];
        const schticks = [];
        const artifacts = [];
        const conditions = [];
        const shields = [];
        const weapons = [];
        const armor = [];
        const gear = [];
        // Ensure we iterate over all items correctly (handle both Collection and Array)
        const items = this.actor.items;
        const itemsArray = Array.isArray(items) ? items : Array.from(items.values());
        for (const item of itemsArray) {
            const itemData = item;
            switch (item.type) {
                case 'power':
                    powers.push(itemData);
                    break;
                case 'gear':
                    if (matchesMasteryWeaponCatalog(item.name || '')) {
                        weapons.push(itemData);
                    }
                    else {
                        gear.push(itemData);
                    }
                    break;
                case 'echo':
                    echoes.push(itemData);
                    break;
                case 'schtick':
                    schticks.push(itemData);
                    break;
                case 'artifact':
                    artifacts.push(itemData);
                    break;
                case 'condition':
                    conditions.push(itemData);
                    break;
                case 'weapon':
                    weapons.push(itemData);
                    break;
                case 'armor':
                    armor.push(itemData);
                    break;
                case 'shield':
                    shields.push(itemData);
                    break;
                default: {
                    if (matchesMasteryWeaponCatalog(item.name || '')) {
                        weapons.push(itemData);
                        break;
                    }
                    const equipmentFlags = item.getFlag?.('mastery-system', 'equipment');
                    if (equipmentFlags) {
                        gear.push(itemData);
                    }
                    break;
                }
            }
        }
        // Enrich powers with level data from power definitions and ensure data integrity
        // Note: Level data enrichment is done in getData where we have async context
        for (const power of powers) {
            // Ensure specials is always an array
            if (power.system && !Array.isArray(power.system.specials)) {
                power.system.specials = power.system.specials ? [power.system.specials] : [];
            }
        }
        // Sort powers: alphabetical by name, then radial-menu visibility (shown in menu first)
        powers.sort((a, b) => {
            const nameCmp = (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' });
            if (nameCmp !== 0)
                return nameCmp;
            const ra = a.system?.showInRadialMenu !== false ? 1 : 0;
            const rb = b.system?.showInRadialMenu !== false ? 1 : 0;
            return rb - ra;
        });
        return {
            powers,
            echoes,
            schticks,
            artifacts,
            shields,
            conditions,
            weapons,
            armor,
            gear
        };
    }
    /**
     * Bucket key for sheet grouping (Powers tab, post-creation). Spell / unknown → `other` (shown as „Sonstiges“).
     */
    #powerTypeGroupKey(power) {
        const cat = resolvePowerCategoryFromItem(power);
        if (cat)
            return cat;
        const raw = String(power?.system?.powerType ?? '')
            .trim()
            .toLowerCase()
            .replace(/\s+/g, '');
        const t = raw.replace(/_/g, '-');
        if (t === 'movement')
            return 'movement';
        if (t === 'active' || t === 'utility')
            return 'active';
        if (t === 'active-buff' || t === 'activebuff' || t === 'buff')
            return 'activeBuff';
        if (t === 'passive')
            return 'passive';
        if (t === 'reaction')
            return 'reaction';
        return 'other';
    }
    /** Vertical groups for the Powers tab (same UX idea as radial maneuver prefs rowsByGroup). */
    #buildPowersByTypeGroups(powers) {
        const buckets = {
            movement: [],
            active: [],
            activeBuff: [],
            passive: [],
            reaction: [],
            other: []
        };
        for (const p of powers) {
            buckets[this.#powerTypeGroupKey(p)].push(p);
        }
        const order = ['movement', 'active', 'activeBuff', 'passive', 'reaction', 'other'];
        const labels = {
            movement: 'Movement',
            active: 'Actives',
            activeBuff: 'Active Buffs',
            passive: 'Passives',
            reaction: 'Reactions',
            other: 'Sonstiges'
        };
        const out = [];
        for (const key of order) {
            const list = buckets[key];
            if (list.length === 0)
                continue;
            out.push({ groupKey: key, groupLabel: labels[key], powers: list });
        }
        return out;
    }
    /**
     * Prepare Equipment UI Context
     */
    #prepareEquipmentUi(items) {
        const BAND_COLS = 24;
        const BAND_ROWS = 9;
        const BAND_SIZE = BAND_COLS * BAND_ROWS;
        // Collect all equipment items (legacy auto-seeded Unarmed weapons are virtual — hide/remove them)
        const equipmentItems = [
            ...(items.weapons || []),
            ...(items.armor || []),
            ...(items.shields || []),
            ...(items.gear || []),
            ...(items.artifacts || [])
        ].filter((item) => !isLegacyUnarmedItem(item));
        // Helper: convert items array to cells array
        const toCells = (itemList, cols, rows) => {
            const cells = [];
            for (let row = 1; row <= rows; row++) {
                for (let col = 1; col <= cols; col++) {
                    cells.push({
                        row,
                        col,
                        item: null,
                        occupied: false,
                        spanW: 1,
                        spanH: 1
                    });
                }
            }
            let overflow = 0;
            const rects = [];
            const getIndex = (col, row) => (row - 1) * cols + (col - 1);
            const unplaced = [];
            for (const item of itemList) {
                const size = parseInventorySize(item?.system?.inventorySize);
                const w = Math.min(cols, size.w);
                const h = Math.min(rows, size.h);
                const flags = item?.getFlag?.('mastery-system', 'equipment') || item?.flags?.['mastery-system']?.equipment || {};
                const grid = flags?.grid;
                if (grid?.x && grid?.y && fitsInGrid(grid.x, grid.y, w, h, cols, rows)) {
                    const candidate = { x: grid.x, y: grid.y, w, h };
                    const overlaps = rects.some(rect => rectsOverlap(rect, candidate));
                    if (!overlaps) {
                        rects.push(candidate);
                        const topIndex = getIndex(candidate.x, candidate.y);
                        const topCell = cells[topIndex];
                        if (topCell) {
                            topCell.item = item;
                            topCell.spanW = w;
                            topCell.spanH = h;
                        }
                        for (let dy = 0; dy < h; dy++) {
                            for (let dx = 0; dx < w; dx++) {
                                if (dx === 0 && dy === 0)
                                    continue;
                                const idx = getIndex(candidate.x + dx, candidate.y + dy);
                                if (cells[idx]) {
                                    cells[idx].occupied = true;
                                }
                            }
                        }
                        continue;
                    }
                }
                unplaced.push(item);
            }
            for (const item of unplaced) {
                const size = parseInventorySize(item?.system?.inventorySize);
                const w = Math.min(cols, size.w);
                const h = Math.min(rows, size.h);
                const pos = findFirstFit(rects, w, h, cols, rows);
                if (!pos) {
                    overflow++;
                    continue;
                }
                rects.push({ x: pos.x, y: pos.y, w, h });
                const topIndex = getIndex(pos.x, pos.y);
                const topCell = cells[topIndex];
                if (topCell) {
                    topCell.item = item;
                    topCell.spanW = w;
                    topCell.spanH = h;
                }
                for (let dy = 0; dy < h; dy++) {
                    for (let dx = 0; dx < w; dx++) {
                        if (dx === 0 && dy === 0)
                            continue;
                        const idx = getIndex(pos.x + dx, pos.y + dy);
                        if (cells[idx]) {
                            cells[idx].occupied = true;
                        }
                    }
                }
            }
            return { cells, overflow };
        };
        // Read flags and split items
        const inventoryItems = [];
        const notItems = [];
        const encItems = [];
        const heavyItems = [];
        const slotMap = {};
        for (const item of equipmentItems) {
            const flags = item.getFlag?.('mastery-system', 'equipment') || {};
            const container = flags.container ?? 'inventory';
            const band = flags.band ?? 'not';
            // Normalize legacy slot keys (helmet/chest/boot/necklace/ring1/ring2)
            // to the canonical 7-slot vocabulary at read time.
            const slot = normalizeSlotKey(flags.slot) ?? null;
            // Backward compatibility: if item.system.equipped is true and no slot flag
            if (!slot && item.system?.equipped === true) {
                if (item.type === 'weapon') {
                    slotMap['mainhand'] = item;
                    continue;
                }
                else if (item.type === 'shield') {
                    slotMap['offhand'] = item;
                    continue;
                }
                else if (item.type === 'armor') {
                    slotMap['body'] = item;
                    continue;
                }
            }
            // Treat backpack items as inventory items (they go into encumbrance bands)
            // Backpack container flag is kept for future use, but items are displayed in bands
            if (slot) {
                if (!slotMap[slot]) {
                    slotMap[slot] = item;
                }
            }
            else {
                // Legacy stash flags: show in carry inventory (stash panel removed from sheet).
                inventoryItems.push(item);
                notItems.push(item);
            }
        }
        const lastDroppedId = this._lastDroppedItemId;
        if (lastDroppedId) {
            const lastItem = equipmentItems.find(it => it.id === lastDroppedId);
            console.log('Mastery System | [Equipment Drop] Last dropped item in UI', {
                lastDroppedId,
                found: !!lastItem,
                lastItemType: lastItem?.type,
                lastItemName: lastItem?.name,
                lastItemFlags: lastItem?.getFlag?.('mastery-system', 'equipment') || null
            });
        }
        console.log('Mastery System | [Equipment Drop] Equipment UI counts', {
            equipmentTotal: equipmentItems.length,
            notCount: notItems.length,
            encCount: encItems.length,
            heavyCount: heavyItems.length,
            slotCount: Object.keys(slotMap).length
        });
        // Convert to cells
        const notCellsData = toCells(notItems, BAND_COLS, BAND_ROWS);
        const encCellsData = toCells(encItems, BAND_COLS, BAND_ROWS);
        const heavyCellsData = toCells(heavyItems, BAND_COLS, BAND_ROWS);
        // Slot definitions — canonical 7-slot vocabulary (Artefacts.md).
        const slotDefs = [
            { key: 'mainhand', label: 'Main Hand' },
            { key: 'offhand', label: 'Off Hand' },
            { key: 'body', label: 'Body' },
            { key: 'head', label: 'Head' },
            { key: 'feet', label: 'Feet' },
            { key: 'amulet', label: 'Amulet' },
            { key: 'ring', label: 'Ring' }
        ];
        // Players Guide 7575–7579: Load zone & movement penalty.
        // Map the legacy 3-band (Normal / Encumbered / Overloaded) representation
        // onto the canonical 24 × 9 / Zone-1-2-3 model so the load and the
        // movement penalty stay synchronized regardless of which band view we
        // ship in the UI.
        const loadZone = loadZoneFromBands({
            normalCount: notItems.length,
            encumberedCount: encItems.length,
            overloadedCount: heavyItems.length,
        });
        const movementPenaltyM = movementPenaltyForLoad(loadZone);
        const evolutionCards = buildArtifactEvolutionCards(this.actor);
        const cardByEmbId = new Map(evolutionCards.map((c) => [c.embeddedId, c]));
        const mapArtifactMeta = (item) => {
            if (!item || item.type !== 'artifact')
                return null;
            const card = cardByEmbId.get(item.id);
            if (card) {
                return {
                    currentSystemLevel: card.currentSystemLevel,
                    linked: card.linked,
                    embeddedId: item.id,
                    unwired: false,
                };
            }
            const sys = item.system || {};
            const level = Math.max(1, Number(sys.currentLevel ?? sys.level ?? 1));
            return {
                currentSystemLevel: level,
                linked: false,
                embeddedId: item.id,
                unwired: true,
            };
        };
        return {
            bandCols: BAND_COLS,
            bandRows: BAND_ROWS,
            inventory: {
                notCells: notCellsData.cells,
                encCells: encCellsData.cells,
                heavyCells: heavyCellsData.cells,
                notOverflow: notCellsData.overflow,
                encOverflow: encCellsData.overflow,
                heavyOverflow: heavyCellsData.overflow,
                loadZone,
                loadZoneLabel: loadZone === 'overloaded' ? 'Overloaded'
                    : loadZone === 'encumbered' ? 'Encumbered'
                        : 'Normal Load',
                movementPenaltyM,
            },
            equipSlots: slotDefs.map((def) => {
                const item = slotMap[def.key] || null;
                return {
                    ...def,
                    item,
                    artifactMeta: mapArtifactMeta(item),
                };
            }),
        };
    }
    /**
     * Get unique trees from selected powers (including spell schools)
     */
    #getSelectedTrees(powers) {
        const trees = new Set();
        for (const power of powers) {
            const tree = power.system?.tree;
            if (tree) {
                trees.add(tree);
            }
        }
        return Array.from(trees);
    }
    /**
     * Validate schticks per rank - each rank should have a schtick name
     */
    #validateSchticksPerRank(rows, masteryRank) {
        for (let rank = 1; rank <= masteryRank; rank++) {
            const row = rows.find(r => r.rank === rank);
            if (!row || !row.schtickName || row.schtickName.trim() === '') {
                return {
                    ok: false,
                    message: `You must enter a Schtick name for Rank ${rank}.`
                };
            }
        }
        return { ok: true };
    }
    /**
     * Handle schtick name change per rank
     */
    async #onSchtickNameChange(event) {
        if (!this.actor.isOwner) {
            ui.notifications?.warn('Only the owner can edit Schticks.');
            return;
        }
        const input = event.currentTarget;
        const rank = parseInt(input.dataset.rank || '0');
        const schtickName = input.value.trim();
        if (!rank || rank < 1) {
            console.error('Mastery System | Invalid rank for schtick name:', rank);
            return;
        }
        console.log('Mastery System | Schtick name change:', {
            rank,
            schtickName
        });
        const currentRanks = this.actor.system?.schticks?.ranks || [];
        const rankIndex = currentRanks.findIndex((r) => r.rank === rank);
        let newRanks;
        if (rankIndex >= 0) {
            // Update existing rank
            newRanks = [...currentRanks];
            newRanks[rankIndex] = {
                ...newRanks[rankIndex],
                schtickName: schtickName
            };
        }
        else {
            // Add new rank entry
            newRanks = [...currentRanks, {
                    rank,
                    schtickName: schtickName,
                    manifestation: ''
                }];
        }
        // Update actor
        await this.actor.update({
            'system.schticks.ranks': newRanks
        });
        console.log('Mastery System | Schticks ranks updated:', {
            newRanks,
            count: newRanks.length
        });
        // Re-render to update UI
        this.render();
    }
    /**
     * Handle schtick manifestation change
     */
    async #onSchtickManifestationChange(event) {
        if (!this.actor.isOwner) {
            ui.notifications?.warn('Only the owner can edit Schticks.');
            return;
        }
        const input = event.currentTarget;
        const rank = parseInt(input.dataset.rank || '0');
        const manifestation = input.value.trim();
        if (!rank || rank < 1) {
            console.error('Mastery System | Invalid rank for manifestation:', rank);
            return;
        }
        console.log('Mastery System | Schtick manifestation change:', {
            rank,
            manifestation
        });
        const currentRanks = this.actor.system?.schticks?.ranks || [];
        const rankIndex = currentRanks.findIndex((r) => r.rank === rank);
        let newRanks;
        if (rankIndex >= 0) {
            // Update existing rank manifestation
            newRanks = [...currentRanks];
            newRanks[rankIndex] = {
                ...newRanks[rankIndex],
                manifestation
            };
        }
        else {
            // This shouldn't happen - manifestation without schtick
            console.warn('Mastery System | Manifestation changed but no schtick name for rank:', rank);
            return;
        }
        // Update actor
        await this.actor.update({
            'system.schticks.ranks': newRanks
        });
        console.log('Mastery System | Schtick manifestation updated for rank', rank);
    }
    /**
     * Calculate derived values for display
     */
    #calculateDerivedValues(system) {
        return {
            totalStones: system.stones?.total || 0,
            currentStones: system.stones?.current || 0,
            vitalityStones: system.stones?.vitality || 0,
            currentHP: this.actor.totalHP || 0,
            maxHP: this.actor.maxHP || 0,
            currentPenalty: this.actor.currentPenalty || 0,
            keepDice: system.mastery?.rank || 1
        };
    }
    /**
     * Prepare skills for display
     */
    #prepareSkills(skillValues = {}, skillsSpent = {}) {
        const skillsByCategory = {};
        // Group skills by category
        for (const [key, definition] of Object.entries(SKILLS)) {
            const category = definition.category;
            if (!skillsByCategory[category]) {
                skillsByCategory[category] = [];
            }
            const value = skillValues[key] || 0;
            const spent = skillsSpent[key] || 0;
            const remaining = Math.max(0, value - spent);
            skillsByCategory[category].push({
                key,
                name: definition.name,
                category: definition.category,
                attributes: definition.attributes,
                value,
                spent,
                remaining
            });
        }
        // Sort skills within each category by name
        for (const category in skillsByCategory) {
            skillsByCategory[category].sort((a, b) => a.name.localeCompare(b.name));
        }
        // Convert to array of category objects
        const categoryOrder = [
            'Awareness',
            'Physical',
            'Knowledge & Craft',
            'Social',
            'Survival',
            'Martial'
        ];
        const groupedSkills = [];
        for (const category of categoryOrder) {
            if (skillsByCategory[category] && skillsByCategory[category].length > 0) {
                groupedSkills.push({
                    category,
                    skills: skillsByCategory[category]
                });
            }
        }
        return groupedSkills;
    }
    /**
     * GM-only MR dropdown. Injects the control when an older template still renders
     * a read-only span (e.g. before 0.9.29 was installed on the world).
     */
    #bindGmMasteryRankSelect(html) {
        if (!game.user?.isGM)
            return;
        const box = html.find('.mastery-rank-box');
        if (!box.length)
            return;
        let select = box.find('.mastery-rank-select');
        if (!select.length) {
            const rank = Math.max(1, Math.min(8, Math.floor(Number(this.actor.system?.mastery?.rank) || 2)));
            const options = [1, 2, 3, 4, 5, 6, 7, 8]
                .map((n) => `<option value="${n}"${n === rank ? ' selected' : ''}>${n}</option>`)
                .join('');
            box.find('.rank-value').replaceWith(`<select class="mastery-rank-select" data-dtype="Number" title="GM: Mastery Rank für diesen Charakter" aria-label="Mastery Rank">${options}</select>`);
            select = box.find('.mastery-rank-select');
            const suggested = Math.floor(Number(this.actor.system?.mastery?.suggestedRank) || 0);
            if (suggested >= 1 && suggested <= 8 && !box.find('.rank-stone-hint').length) {
                box.append(`<span class="rank-stone-hint" title="Empfehlung aus Total Stones (nur Hinweis, kein Auto-Rank-Up)">↗${suggested}</span>`);
            }
        }
        select.off('change.masteryRank').on('change.masteryRank', async (ev) => {
            const newRank = Math.max(1, Math.min(8, Math.floor(Number($(ev.currentTarget).val()) || 2)));
            const oldRank = Math.max(1, Math.floor(Number(this.actor.system?.mastery?.rank) || 2));
            if (newRank === oldRank)
                return;
            try {
                await this.actor.update({ 'system.mastery.rank': newRank });
                if (newRank > oldRank) {
                    const { applyRankUpBundle } = await import('../utils/mastery-rank-sync.js');
                    await applyRankUpBundle(this.actor, newRank - oldRank);
                }
                await this.render(false);
            }
            catch (err) {
                console.warn('[mastery-system] MR update failed', err);
                ui.notifications?.error('Mastery Rank konnte nicht gespeichert werden.');
            }
        });
    }
    /** @override */
    activateListeners(html) {
        console.log('Mastery System | activateListeners START', {
            htmlLength: html.length,
            actorName: this.actor?.name,
            htmlIsJQuery: html instanceof jQuery,
            htmlContent: html[0]?.tagName
        });
        super.activateListeners(html);
        this.#bindGmMasteryRankSelect(html);
        console.log('Mastery System | activateListeners called AFTER super', {
            htmlLength: html.length,
            actorName: this.actor?.name
        });
        // Character Creation buttons
        const unlockButton = html.find('.force-unlock-creation');
        if (unlockButton.length > 0) {
            unlockButton.off('click.force-unlock').on('click.force-unlock', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.#onForceUnlockCreation(e);
            });
        }
        // GM-only: Reset Character (wipes everything except name + portrait,
        // returns earned XP to the spendable pool, flips creation to incomplete).
        const resetButton = html.find('.reset-character');
        if (resetButton.length > 0) {
            resetButton.off('click.reset-character').on('click.reset-character', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.#onResetCharacter(e);
            });
        }
        // Passive slotting is handled exclusively by the in-combat dialog; the
        // character-sheet passive-slot manager (and its handlers) were removed.
        // Check if creation is incomplete - don't lock, just disable non-creation fields
        const creationComplete = this.actor.system?.creation?.complete !== false;
        if (!creationComplete) {
            this.#lockSheetForCreation(html);
        }
        html.find('.minor-expressions-open').on('click', async (ev) => {
            ev.preventDefault();
            if (!this.actor.isOwner) {
                ui.notifications?.warn('Nur der Besitzer kann Minor Expressions wählen.');
                return;
            }
            const attr = ev.currentTarget.dataset.attribute;
            if (!attr)
                return;
            const { showMinorExpressionsDialog } = await import('./minor-expressions-dialog.js');
            await showMinorExpressionsDialog(this.actor, { focusAttribute: attr });
            this.render(false);
        });
        /**
         * Players Guide 3100–3127: open the Languages picker dialog. The
         * Common Tongue is always pre-selected and locked; players choose
         * additional languages reflecting their origin/training.
         */
        html.find('.open-languages-btn').on('click', async (ev) => {
            ev.preventDefault();
            if (!this.actor.isOwner && !game.user?.isGM) {
                ui.notifications?.warn('Only the owner (or GM) can edit languages.');
                return;
            }
            await showLanguagesDialog(this.actor);
            this.render(false);
        });
        // Roll buttons work for everyone
        html.find('.attribute-roll').on('click', this.#onAttributeRoll.bind(this));
        html.find('.skill-roll').on('click', this.#onSkillRoll.bind(this));
        html.find('.skill-roll-compact').on('click', this.#onSkillRoll.bind(this));
        html.find('.save-roll-btn').on('click', this.#onSavingThrowRoll.bind(this));
        // Safe Haven Rest button
        html.find('.safe-haven-rest').on('click', this.#onSafeHavenRest.bind(this));
        html.find('.gm-award-faith-fracture').on('click', this.#onGmAwardFaithFracture.bind(this));
        // Point spending buttons (JavaScript will check permissions)
        // Note: legacy `.attribute-spend-point` immediate-spend handler removed —
        // the only attribute spend path is now the pending/confirm flow via
        // `.attr-increase-xp` (which respects the once-per-step rule).
        html.find('.skill-spend-point').on('click', this.#onSkillSpendPoint.bind(this));
        html.find('.skill-refund-point').on('click', this.#onSkillRefundPoint.bind(this));
        html.find('.confirm-skill-changes').on('click', this.#onConfirmSkillChanges.bind(this));
        html.find('.cancel-skill-changes').on('click', this.#onCancelSkillChanges.bind(this));
        // New attribute XP distribution system (with confirmation)
        const increaseButtons = html.find('.attr-increase-xp');
        const decreaseButtons = html.find('.attr-decrease-xp');
        console.log('Mastery System | Setting up attribute XP buttons', {
            increaseButtonsCount: increaseButtons.length,
            decreaseButtonsCount: decreaseButtons.length,
            htmlLength: html.length,
            increaseButtons: increaseButtons.map((_i, el) => ({
                element: el,
                attribute: $(el).data('attribute'),
                disabled: $(el).prop('disabled')
            })).get(),
            decreaseButtons: decreaseButtons.map((_i, el) => ({
                element: el,
                attribute: $(el).data('attribute'),
                disabled: $(el).prop('disabled')
            })).get()
        });
        // Use event delegation to ensure handlers work even if buttons are dynamically added
        html.off('click', '.attr-increase-xp').on('click', '.attr-increase-xp', this.#onAttributeIncreaseXP.bind(this));
        html.off('click', '.attr-decrease-xp').on('click', '.attr-decrease-xp', this.#onAttributeDecreaseXP.bind(this));
        // Also try direct binding as fallback
        increaseButtons.off('click.attr-xp').on('click.attr-xp', this.#onAttributeIncreaseXP.bind(this));
        decreaseButtons.off('click.attr-xp').on('click.attr-xp', this.#onAttributeDecreaseXP.bind(this));
        html.find('.confirm-attribute-changes').on('click', this.#onConfirmAttributeChanges.bind(this));
        html.find('.cancel-attribute-changes').on('click', this.#onCancelAttributeChanges.bind(this));
        // Pending XP maps persist across re-renders until Confirm/Cancel (do not reset here).
        // Initialize UI state for attribute XP distribution
        this.#updateAttributeXPUI();
        this.#updateSkillXPUI();
        // Character Creation mode buttons
        html.find('.attr-creation-select').on('change', this.#onCreationAttributeChange.bind(this));
        html.find('.skill-increase').on('click', this.#onCreationSkillIncrease.bind(this));
        html.find('.skill-decrease').on('click', this.#onCreationSkillDecrease.bind(this));
        html.find('.finalize-creation').on('click', this.#onFinalizeCreation.bind(this));
        html.find('.reset-creation-attributes').on('click', this.#onResetCreationAttributes.bind(this));
        // Stone Powers button handler
        html.find('[data-action="openStonePowers"]').on('click', async (ev) => {
            ev.preventDefault();
            // Get current combatant if in combat
            let combatant = null;
            if (game.combat) {
                const combatants = game.combat.combatants;
                combatant = Array.from(combatants).find((c) => c.actor?.id === this.actor.id) || null;
            }
            const { StonePowersDialog } = await import('../stones/stone-powers-dialog.js');
            await StonePowersDialog.showForActor(this.actor, combatant);
        });
        html.find('[data-action="openArtifactEvolution"]').on('click', async (ev) => {
            ev.preventDefault();
            if (!this.actor.isOwner)
                return;
            const { openArtifactEvolutionDialog } = await import('../artifacts/artifact-evolution-dialog.js');
            await openArtifactEvolutionDialog(this.actor);
        });
        html.find('[data-action="openProgressionHub"]').on('click', async (ev) => {
            ev.preventDefault();
            if (!this.actor.isOwner)
                return;
            const $btn = $(ev.currentTarget);
            const section = String($btn.data('expandSection') || $btn.attr('data-expand-section') || 'overview');
            const { openProgressionHubDialog } = await import('../artifacts/progression-hub-dialog.js');
            await openProgressionHubDialog(this.actor, { expandSection: section });
        });
        html.on('click', '.df-artifact-badge[data-action="openProgressionArtifacts"]', async (ev) => {
            ev.preventDefault();
            ev.stopPropagation();
            if (!this.actor.isOwner)
                return;
            const { openProgressionHubDialog } = await import('../artifacts/progression-hub-dialog.js');
            await openProgressionHubDialog(this.actor, { expandSection: 'artifacts' });
        });
        html.on('click', '[data-action="artifact-activate"]', async (ev) => {
            ev.preventDefault();
            ev.stopPropagation();
            if (!this.actor.isOwner)
                return;
            const $btn = $(ev.currentTarget);
            const { linkArtifactForActor } = await import('../artifacts/artifact-evolution-actions.js');
            const ok = await linkArtifactForActor(this.actor, String($btn.data('root-id')), String($btn.data('emb-id')));
            if (ok)
                this.render(false);
        });
        html.on('click', '[data-action="artifact-upgrade"]', async (ev) => {
            ev.preventDefault();
            ev.stopPropagation();
            if (!this.actor.isOwner)
                return;
            const $btn = $(ev.currentTarget);
            const { upgradeArtifactForActor } = await import('../artifacts/artifact-evolution-actions.js');
            const ok = await upgradeArtifactForActor(this.actor, String($btn.data('root-id')), String($btn.data('emb-id')), String($btn.data('target-world-id')), String($btn.data('target-node-id')));
            if (ok)
                this.render(false);
        });
        // Schticks selection (per rank)
        html.find('.schtick-input').on('blur', this.#onSchtickNameChange.bind(this));
        html.find('.schtick-manifestation-input').on('blur', this.#onSchtickManifestationChange.bind(this));
        // Disadvantages buttons (only during creation)
        const addDisadvantageBtn = html.find('.add-disadvantage-btn');
        console.log('Mastery System | Setting up add-disadvantage-btn listener', {
            buttonFound: addDisadvantageBtn.length,
            buttonElement: addDisadvantageBtn[0],
            isDisabled: addDisadvantageBtn.prop('disabled'),
            creationComplete: creationComplete
        });
        if (addDisadvantageBtn.length > 0) {
            addDisadvantageBtn.off('click.add-disadvantage').on('click.add-disadvantage', (e) => {
                console.log('Mastery System | add-disadvantage-btn clicked!', {
                    event: e,
                    target: e.target,
                    currentTarget: e.currentTarget,
                    isDefaultPrevented: e.isDefaultPrevented()
                });
                this.#onAddDisadvantage(e);
            });
            // Also try direct binding as fallback
            addDisadvantageBtn.on('click', (e) => {
                console.log('Mastery System | add-disadvantage-btn clicked (direct binding)', e);
                e.preventDefault();
                e.stopPropagation();
                this.#onAddDisadvantage(e);
            });
        }
        else {
            console.warn('Mastery System | add-disadvantage-btn not found in HTML!');
        }
        html.find('.disadvantage-edit-btn').on('click', this.#onEditDisadvantage.bind(this));
        html.find('.disadvantage-remove-btn').on('click', this.#onRemoveDisadvantage.bind(this));
        // Blood color picker synchronization
        // When color picker changes, update text field
        const syncColorPickerToText = (e) => {
            const colorPicker = $(e.currentTarget);
            const textInput = colorPicker.siblings('.blood-color-text');
            const colorValue = colorPicker.val();
            if (textInput.length > 0 && colorValue) {
                textInput.val(colorValue);
                textInput.data('last-valid-value', colorValue);
                textInput.removeClass('invalid');
            }
        };
        html.find('.blood-color-picker, input[type="color"][name="system.bloodColor"]')
            .on('input', syncColorPickerToText)
            .on('change', syncColorPickerToText);
        // When text field changes, update color picker and validate
        const syncTextToColorPicker = (e) => {
            const textInput = $(e.currentTarget);
            const colorPicker = textInput.siblings('.blood-color-picker, input[type="color"][name="system.bloodColor"]');
            const colorValue = (textInput.val() || '').trim();
            // Validate hex color format
            if (/^#[0-9A-Fa-f]{6}$/.test(colorValue)) {
                if (colorPicker.length > 0) {
                    colorPicker.val(colorValue);
                    // Trigger change on the named input to ensure it's saved
                    colorPicker.trigger('change');
                }
                textInput.data('last-valid-value', colorValue);
                textInput.removeClass('invalid');
            }
            else if (colorValue.length > 0) {
                // Invalid format, mark as invalid but don't revert yet (user might still be typing)
                textInput.addClass('invalid');
            }
        };
        html.find('.blood-color-text')
            .on('input', syncTextToColorPicker)
            .on('change', syncTextToColorPicker);
        // On blur, revert to last valid value if current is invalid
        html.find('.blood-color-text').on('blur', (e) => {
            const textInput = $(e.currentTarget);
            const colorValue = (textInput.val() || '').trim();
            if (!/^#[0-9A-Fa-f]{6}$/.test(colorValue)) {
                // Invalid format, revert to last valid value or default
                const lastValid = textInput.data('last-valid-value') || '#8b0000';
                textInput.val(lastValid);
                textInput.removeClass('invalid');
                const colorPicker = textInput.siblings('.blood-color-picker, input[type="color"][name="system.bloodColor"]');
                if (colorPicker.length > 0) {
                    colorPicker.val(lastValid);
                    colorPicker.trigger('change');
                }
            }
        });
        // Mark disadvantages as reviewed when user visits the disadvantages tab
        if (!creationComplete) {
            // Use event delegation for tab clicks
            html.on('click', 'a[data-tab="disadvantages"]', async () => {
                const system = this.actor.system;
                if (!system.creation?.disadvantagesReviewed) {
                    await this.actor.update({ 'system.creation.disadvantagesReviewed': true });
                    // Re-render to update the banner
                    this.render();
                }
            });
        }
        // Profile image click handlers (work for everyone)
        // Use event delegation to handle clicks even if elements are added later
        const containers = html.find('.profile-img-container');
        console.log('Mastery System | Setting up profile image handlers', {
            containerFound: containers.length,
            htmlLength: html.length
        });
        // Use event delegation on all containers
        containers.off('click.profile-delegation').on('click.profile-delegation', (e) => {
            const target = $(e.target);
            const clickedZone = target.closest('.profile-zone');
            const container = target.closest('.profile-img-container');
            // Get imgType from zone's data attribute first (most specific), then container, fallback to 'portrait'
            const zoneImgType = clickedZone.attr('data-img-type');
            const containerImgType = container.attr('data-image-type');
            const imgType = zoneImgType || containerImgType || 'portrait';
            // Also check if container has the token class
            const isTokenContainer = container.hasClass('profile-img-container-token');
            console.log('Mastery System | Container clicked', {
                target: target[0]?.className,
                clickedZone: clickedZone.length,
                zoneClass: clickedZone[0]?.className,
                zoneDataImgType: zoneImgType,
                containerDataImageType: containerImgType,
                containerClasses: container.attr('class'),
                isTokenContainer: isTokenContainer,
                finalImgType: imgType,
                isToken: imgType === 'token',
                isPortrait: imgType === 'portrait'
            });
            // Determine final imgType - prioritize zone attribute, then container class, then container attribute
            let finalImgType = imgType;
            if (!zoneImgType && isTokenContainer) {
                finalImgType = 'token';
                console.log('Mastery System | Overriding imgType to token based on container class');
            }
            if (clickedZone.hasClass('profile-zone-edit')) {
                console.log('Mastery System | EDIT zone clicked via delegation', {
                    imgType: finalImgType,
                    isToken: finalImgType === 'token',
                    willCallOnProfileEdit: true
                });
                e.preventDefault();
                e.stopPropagation();
                // Pass imgType as string to ensure it's not modified
                this.#onProfileEdit(e, String(finalImgType));
            }
            else if (clickedZone.hasClass('profile-zone-show')) {
                console.log('Mastery System | SHOW zone clicked via delegation', { imgType: finalImgType });
                e.preventDefault();
                e.stopPropagation();
                this.#onProfileShow(e, String(finalImgType));
            }
        });
        // Also set up direct handlers as backup
        setTimeout(() => {
            const editZone = html.find('.profile-zone-edit');
            const showZone = html.find('.profile-zone-show');
            console.log('Mastery System | Direct handler setup', {
                editZoneFound: editZone.length,
                showZoneFound: showZone.length
            });
            editZone.off('click.profile-edit').on('click.profile-edit', (e) => {
                console.log('Mastery System | EDIT zone clicked (direct)', e);
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                const zone = $(e.currentTarget);
                const container = zone.closest('.profile-img-container');
                const zoneImgType = zone.attr('data-img-type');
                const containerImgType = container.attr('data-image-type');
                const isTokenContainer = container.hasClass('profile-img-container-token');
                // Determine imgType - prioritize zone attribute, then container class, then container attribute
                let imgType = zoneImgType || (isTokenContainer ? 'token' : null) || containerImgType || 'portrait';
                console.log('Mastery System | Direct handler imgType detection', {
                    zoneImgType: zoneImgType,
                    containerImgType: containerImgType,
                    isTokenContainer: isTokenContainer,
                    finalImgType: imgType
                });
                this.#onProfileEdit(e, String(imgType));
            });
            showZone.off('click.profile-show').on('click.profile-show', (e) => {
                console.log('Mastery System | SHOW zone clicked (direct)', e);
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                const zone = $(e.currentTarget);
                const container = zone.closest('.profile-img-container');
                const zoneImgType = zone.attr('data-img-type');
                const containerImgType = container.attr('data-image-type');
                const isTokenContainer = container.hasClass('profile-img-container-token');
                // Determine imgType - prioritize zone attribute, then container class, then container attribute
                let imgType = zoneImgType || (isTokenContainer ? 'token' : null) || containerImgType || 'portrait';
                console.log('Mastery System | Direct handler imgType detection (show)', {
                    zoneImgType: zoneImgType,
                    containerImgType: containerImgType,
                    isTokenContainer: isTokenContainer,
                    finalImgType: imgType
                });
                this.#onProfileShow(e, String(imgType));
            });
        }, 100);
        // Everything below here is only needed if the sheet is editable
        if (!this.isEditable)
            return;
        // Add skill
        html.find('.skill-add').on('click', this.#onSkillAdd.bind(this));
        // Add power
        // Power/Spell creation buttons (always visible)
        html.find('.add-power-creation-btn').on('click', this.#onPowerAddCreation.bind(this));
        // Echo creation / deck interactions
        html.find('.choose-echo-btn').on('click', this.#onEchoChoose.bind(this));
        html.find('.add-echo-card-btn').on('click', this.#onEchoCardAdd.bind(this));
        html.find('.echo-card-use-btn').on('click', this.#onEchoRoll.bind(this));
        html.find('.power-rank-select').on('change', this.#onPowerRankChange.bind(this));
        html
            .off('change', '.power-radial-checkbox')
            .on('change', '.power-radial-checkbox', this.#onPowerRadialCheckboxChange.bind(this));
        html
            .off('change', '.radial-maneuver-hide-all')
            .on('change', '.radial-maneuver-hide-all', this.#onRadialManeuverHideAll.bind(this));
        html
            .off('change', '.radial-maneuver-hide-one')
            .on('change', '.radial-maneuver-hide-one', this.#onRadialManeuverHideOne.bind(this));
        // Equipment handlers
        html.find('.general-items-btn').on('click', this.#onGeneralItemsClick.bind(this));
        html.find('.store-btn').on('click', this.#onStoreClick.bind(this));
        if (this.actor.isOwner) {
            void this.#purgeLegacyUnarmedItems();
        }
        const dropTargets = html.find('[data-df-drop]');
        console.log('Mastery System | [Equipment Drop] Drop targets in sheet', {
            count: dropTargets.length,
            samples: dropTargets
                .slice(0, 5)
                .map((_i, el) => ({
                dropType: el.dataset?.dfDrop,
                band: el.dataset?.band,
                slot: el.dataset?.slot,
                className: el.className
            }))
                .toArray()
        });
        html.off('dragover.ms-equipment-drop').on('dragover.ms-equipment-drop', '[data-df-drop]', (ev) => {
            ev.preventDefault();
            ev.stopPropagation();
            const target = ev.currentTarget;
            if (target?.dataset?.dfDrop === 'equip-trash') {
                html.find('.df-equip-trash').removeClass('df-drop-valid');
                $(target).addClass('df-drop-valid');
            }
        });
        html.off('drop.ms-equipment-drop').on('drop.ms-equipment-drop', '[data-df-drop]', async (ev) => {
            ev.preventDefault();
            ev.stopPropagation();
            ev.stopImmediatePropagation?.();
            const target = ev.currentTarget;
            const dragEvent = (ev.originalEvent ?? ev);
            const path = (dragEvent.composedPath?.() || []);
            const cellFromPath = path.find(el => el?.classList?.contains?.('df-cell'));
            const cellFromTarget = ev.target?.closest?.('.df-cell');
            dragEvent.__msDropTarget = target || undefined;
            dragEvent.__msDropCell = cellFromTarget || cellFromPath || undefined;
            console.log('Mastery System | [Equipment Drop] Delegated drop handler', {
                targetClass: target?.className,
                dropType: target?.dataset?.dfDrop,
                band: target?.dataset?.band,
                slot: target?.dataset?.slot,
                cellCol: dragEvent.__msDropCell?.dataset?.col,
                cellRow: dragEvent.__msDropCell?.dataset?.row
            });
            await this._onDrop(dragEvent);
        });
        const invEquipSelector = '.tab.equipment .df-enc-band .df-draggable-item';
        const ContextMenuCls = foundry.applications?.ux?.ContextMenu;
        if (ContextMenuCls) {
            new ContextMenuCls(html, invEquipSelector, this.#inventoryEquipContextMenuEntries(), {
                eventName: 'contextmenu',
                jQuery: false
            });
        }
        if (!window.__msGlobalDropDebugBound) {
            window.__msGlobalDropDebugBound = true;
            console.log('Mastery System | [Storage Debug] Global drag/drop listeners bound');
            console.log('Mastery System | [Storage Debug] Global drop debug active');
            document.addEventListener('dragstart', (ev) => {
                const target = ev.target;
                if (!target)
                    return;
                const storageItem = target.closest('.storage-item');
                if (!storageItem)
                    return;
                const itemId = storageItem.dataset?.itemId;
                console.log('Mastery System | [Storage Debug] document dragstart', {
                    targetClass: target.className,
                    itemId
                });
                const dataTransfer = ev.dataTransfer;
                if (!dataTransfer) {
                    console.log('Mastery System | [Storage Debug] document dragstart missing dataTransfer', {
                        itemId
                    });
                    return;
                }
                const sourceItem = game.items?.get(itemId);
                if (!sourceItem) {
                    console.log('Mastery System | [Storage Debug] document dragstart missing source item', {
                        itemId
                    });
                    return;
                }
                const dragData = sourceItem.toDragData ? sourceItem.toDragData() : { type: 'Item', uuid: sourceItem.uuid };
                const payload = JSON.stringify(dragData);
                dataTransfer.effectAllowed = 'copy';
                dataTransfer.setData('text/plain', payload);
                dataTransfer.setData('application/json', payload);
                window.__msDragInventorySize = sourceItem?.system?.inventorySize || '1x1';
                window.__msDragItemId = sourceItem?.id;
                console.log('Mastery System | [Storage Debug] document dragstart set dataTransfer', {
                    itemId,
                    types: Array.from(dataTransfer.types || [])
                });
            });
            document.addEventListener('drop', (ev) => {
                const target = ev.target;
                if (!target)
                    return;
                if (target.closest('.stone-powers-dialog'))
                    return;
                // If drop happens inside the character sheet, let sheet handlers handle it.
                if (target.closest('.mastery-system.sheet.actor.character')) {
                    console.log('Mastery System | [Storage Debug] document drop skipped (sheet handled)', {
                        targetClass: target.className
                    });
                    return;
                }
                const path = (ev.composedPath?.() || []);
                const dropTarget = target.closest('[data-df-drop]');
                const pathDropTarget = path.find(el => el?.dataset?.dfDrop);
                const resolvedDropTarget = dropTarget || pathDropTarget || null;
                console.log('Mastery System | [Storage Debug] document drop', {
                    targetClass: target.className,
                    dropType: resolvedDropTarget?.dataset?.dfDrop,
                    band: resolvedDropTarget?.dataset?.band,
                    slot: resolvedDropTarget?.dataset?.slot,
                    dataTransferTypes: Array.from(ev.dataTransfer?.types || []),
                    pathHasDropTarget: !!pathDropTarget
                });
                if (resolvedDropTarget) {
                    const dragEvent = ev;
                    dragEvent.__msDropTarget = resolvedDropTarget;
                    console.log('Mastery System | [Equipment Drop] Global document drop invoking _onDrop', {
                        dropType: resolvedDropTarget.dataset?.dfDrop,
                        band: resolvedDropTarget.dataset?.band,
                        slot: resolvedDropTarget.dataset?.slot
                    });
                    this._onDrop(dragEvent);
                }
            });
            document.addEventListener('dragover', (ev) => {
                const target = ev.target;
                if (!target)
                    return;
                const dropTarget = target.closest('[data-df-drop]');
                if (!dropTarget)
                    return;
                const last = window.__msLastDropTargetKey;
                const key = `${dropTarget.dataset?.dfDrop || ''}:${dropTarget.dataset?.band || ''}:${dropTarget.dataset?.slot || ''}`;
                if (last !== key) {
                    window.__msLastDropTargetKey = key;
                    console.log('Mastery System | [Storage Debug] document dragover target', {
                        dropType: dropTarget?.dataset?.dfDrop,
                        band: dropTarget?.dataset?.band,
                        slot: dropTarget?.dataset?.slot
                    });
                }
            });
        }
        html.find('.equipment-item input[type="radio"][name^="equipped-"]').on('change', this.#onEquipmentToggle.bind(this));
        const sheetEl = html.get(0);
        if (sheetEl) {
            const existingHandler = sheetEl.__msDragstartCaptureHandler;
            if (existingHandler)
                sheetEl.removeEventListener('dragstart', existingHandler, true);
            const captureHandler = (ev) => {
                const target = ev.target;
                const tileEl = target?.closest?.('.df-item-tile');
                if (!tileEl)
                    return;
                const itemId = tileEl.dataset?.itemId || $(tileEl).data('item-id');
                const sizeAttr = tileEl?.dataset?.inventorySize;
                const sourceItem = itemId ? this.actor?.items?.get(itemId) : undefined;
                const computedSize = sourceItem ? getDefaultInventorySizeForItemData(sourceItem) : undefined;
                const resolvedSize = sourceItem?.system?.inventorySize || sizeAttr || computedSize || '1x1';
                window.__msDragInventorySize = resolvedSize;
                window.__msDragItemId = sourceItem?.id || itemId;
                tileEl.dataset.dragging = 'true';
                tileEl.dataset.dragSize = resolvedSize;
                if (ev.dataTransfer) {
                    ev.dataTransfer.setData('application/x-mastery-inventory-size', resolvedSize);
                }
                console.log('Mastery System | [Equipment Grid Debug] dragstart capture', {
                    itemId: sourceItem?.id || itemId,
                    systemSize: sourceItem?.system?.inventorySize,
                    sizeAttr,
                    computedSize,
                    resolvedSize
                });
            };
            sheetEl.__msDragstartCaptureHandler = captureHandler;
            sheetEl.addEventListener('dragstart', captureHandler, true);
            console.log('Mastery System | [Equipment Grid Debug] dragstart capture bound');
        }
        html.off('dragstart.df-grid').on('dragstart.df-grid', '.df-item-tile', (ev) => {
            const tileEl = ev.currentTarget;
            const itemId = $(tileEl).data('item-id');
            const sizeAttr = tileEl?.dataset?.inventorySize;
            const sourceItem = this.actor?.items?.get(itemId);
            const dragEvent = (ev?.originalEvent ?? ev);
            const dataTransfer = dragEvent?.dataTransfer ?? null;
            if (sourceItem) {
                const computedSize = getDefaultInventorySizeForItemData(sourceItem);
                const resolvedSize = sourceItem.system?.inventorySize || sizeAttr || computedSize || '1x1';
                window.__msDragInventorySize = resolvedSize;
                window.__msDragItemId = sourceItem.id;
                tileEl.dataset.dragging = 'true';
                tileEl.dataset.dragSize = resolvedSize;
                if (dataTransfer) {
                    dataTransfer.setData('application/x-mastery-inventory-size', resolvedSize);
                }
                console.log('Mastery System | [Equipment Grid Debug] dragstart tile', {
                    itemId: sourceItem.id,
                    systemSize: sourceItem.system?.inventorySize,
                    sizeAttr,
                    computedSize,
                    resolvedSize
                });
                return;
            }
            if (dragEvent) {
                const TextEditorImpl = foundry.applications?.ux?.TextEditor?.implementation || TextEditor;
                const data = TextEditorImpl.getDragEventData(dragEvent);
                if (data?.data?._id) {
                    const actorItem = this.actor?.items?.get(data.data._id);
                    if (actorItem) {
                        const computedSize = getDefaultInventorySizeForItemData(actorItem);
                        const resolvedSize = actorItem.system?.inventorySize || sizeAttr || computedSize || '1x1';
                        window.__msDragInventorySize = resolvedSize;
                        window.__msDragItemId = actorItem.id;
                        tileEl.dataset.dragging = 'true';
                        tileEl.dataset.dragSize = resolvedSize;
                        if (dataTransfer) {
                            dataTransfer.setData('application/x-mastery-inventory-size', resolvedSize);
                        }
                    }
                }
            }
        });
        html.off('dragend.df-grid').on('dragend.df-grid', '.df-item-tile', () => {
            html.find('.df-item-tile[data-dragging="true"]').removeAttr('data-dragging').removeAttr('data-drag-size');
            html.find('.df-equip-trash').removeClass('df-drop-valid');
            delete window.__msDragInventorySize;
            delete window.__msDragItemId;
        });
        console.log('Mastery System | [Equipment Grid Debug] dragstart handler bound');
        const clearDropHighlight = () => {
            html.find('.df-cell.df-drop-valid, .df-cell.df-drop-invalid')
                .removeClass('df-drop-valid df-drop-invalid');
        };
        const resolveDragSize = (ev) => {
            const logDragSize = (source, details) => {
                const key = JSON.stringify({ source, ...details });
                if (window.__msLastDragSizeDebug === key)
                    return;
                window.__msLastDragSizeDebug = key;
                console.log('Mastery System | [Equipment Grid Debug] resolveDragSize', { source, ...details });
            };
            const getDragDataFromDataTransfer = (dt) => {
                if (!dt)
                    return { types: [], raw: '', parsed: undefined, size: undefined };
                const types = Array.from(dt.types || []);
                const raw = dt.getData('application/json') || dt.getData('text/plain') || '';
                const size = dt.getData('application/x-mastery-inventory-size') || undefined;
                let parsed = undefined;
                if (raw) {
                    try {
                        parsed = JSON.parse(raw);
                    }
                    catch {
                        parsed = undefined;
                    }
                }
                return { types, raw, parsed, size };
            };
            const resolveSizeFromItem = (item, source, details) => {
                const systemSize = item?.system?.inventorySize;
                const computedSize = systemSize ? undefined : getDefaultInventorySizeForItemData(item);
                const resolvedSize = systemSize || computedSize || undefined;
                logDragSize(source, { ...details, systemSize, computedSize, resolvedSize });
                return parseInventorySize(resolvedSize);
            };
            const resolveSizeFromDragData = (data, source, details) => {
                if (!data)
                    return null;
                const dataId = data?.data?._id || data?._id;
                if (dataId) {
                    const actorItem = this.actor?.items?.get(dataId);
                    if (actorItem) {
                        return resolveSizeFromItem(actorItem, `${source}.actorItem`, { ...details, dataId });
                    }
                }
                const dataItemId = data?.id || data?.data?.id;
                if (dataItemId) {
                    const worldItem = game.items?.get(dataItemId);
                    if (worldItem) {
                        return resolveSizeFromItem(worldItem, `${source}.worldItem`, { ...details, dataId: dataItemId });
                    }
                }
                const uuid = data?.uuid || data?.data?.uuid;
                if (typeof uuid === 'string' && uuid.includes('.Item.')) {
                    const itemId = uuid.split('.Item.')[1];
                    const actorId = uuid.startsWith('Actor.') ? uuid.split('.')[1] : undefined;
                    const actorItem = actorId && actorId === this.actor?.id ? this.actor?.items?.get(itemId) : undefined;
                    if (actorItem) {
                        return resolveSizeFromItem(actorItem, `${source}.uuid.actorItem`, { ...details, uuid, itemId, actorId });
                    }
                    const worldItem = game.items?.get(itemId);
                    if (worldItem) {
                        return resolveSizeFromItem(worldItem, `${source}.uuid.worldItem`, { ...details, uuid, itemId });
                    }
                }
                return null;
            };
            // Priority 1: Check window global first (set by dragstart handlers)
            const explicit = window.__msDragInventorySize;
            if (explicit) {
                logDragSize('window', { explicit });
                return parseInventorySize(explicit);
            }
            // Priority 2: Check for dragging tile (the item being dragged)
            const draggingTile = html.find('.df-item-tile[data-dragging="true"]').get(0)
                || document.querySelector('.df-item-tile[data-dragging="true"]')
                || undefined;
            if (draggingTile) {
                const dragSize = draggingTile.dataset?.dragSize || draggingTile.dataset?.inventorySize;
                const draggingItemId = draggingTile.dataset?.itemId;
                const draggingItem = draggingItemId ? this.actor?.items?.get(draggingItemId) : undefined;
                if (dragSize) {
                    logDragSize('dragging.tile', { itemId: draggingItemId, dragSize });
                    return parseInventorySize(dragSize);
                }
                if (draggingItem) {
                    return resolveSizeFromItem(draggingItem, 'dragging.tile.item', { itemId: draggingItemId });
                }
            }
            // Priority 3: Check dataTransfer for size information
            const dragEvent = (ev?.originalEvent ?? ev);
            if (dragEvent) {
                const dtInfo = getDragDataFromDataTransfer(dragEvent.dataTransfer ?? null);
                if (dtInfo.size) {
                    logDragSize('dataTransfer.size', { size: dtInfo.size, types: dtInfo.types });
                    return parseInventorySize(dtInfo.size);
                }
                const TextEditorImpl = foundry.applications?.ux?.TextEditor?.implementation || TextEditor;
                const data = TextEditorImpl.getDragEventData(dragEvent);
                const resolvedFromDragData = resolveSizeFromDragData(data, 'dragData', {
                    dataId: data?.data?._id,
                    id: data?.id,
                    uuid: data?.uuid
                });
                if (resolvedFromDragData)
                    return resolvedFromDragData;
                const resolvedFromDataTransfer = resolveSizeFromDragData(dtInfo.parsed, 'dataTransfer', {
                    types: dtInfo.types,
                    raw: dtInfo.raw ? dtInfo.raw.slice(0, 200) : ''
                });
                if (resolvedFromDataTransfer)
                    return resolvedFromDataTransfer;
                logDragSize('dragData.unhandled', {
                    dataId: data?.data?._id,
                    id: data?.id,
                    uuid: data?.uuid,
                    dataTransferTypes: dtInfo.types,
                    dataTransferRaw: dtInfo.raw ? dtInfo.raw.slice(0, 200) : ''
                });
            }
            // Priority 4 (LAST): Only check target tile if we're hovering over an existing item
            // This should NOT be used for drag size of the item being dragged!
            const targetTile = ev?.target?.closest?.('.df-item-tile');
            if (targetTile && !targetTile.dataset?.dragging) {
                const sizeAttr = targetTile.dataset?.inventorySize;
                const tileItemId = targetTile.dataset?.itemId;
                const tileActorItem = tileItemId ? this.actor?.items?.get(tileItemId) : undefined;
                if (sizeAttr) {
                    logDragSize('tile.dataset', {
                        itemId: tileItemId,
                        sizeAttr
                    });
                    return parseInventorySize(sizeAttr);
                }
                if (tileActorItem) {
                    return resolveSizeFromItem(tileActorItem, 'tile.item', { itemId: tileItemId });
                }
                logDragSize('tile.dataset.missing', { itemId: tileItemId, sizeAttr });
                return parseInventorySize(undefined);
            }
            logDragSize('fallback', { explicit });
            return parseInventorySize(undefined);
        };
        html.off('dragover.df-grid').on('dragover.df-grid', '.df-enc-band .df-cell, .df-enc-band', (ev) => {
            ev.preventDefault();
            const cellEl = ev.target?.closest?.('.df-cell');
            if (!cellEl)
                return;
            const col = Number(cellEl.dataset?.col || 0);
            const row = Number(cellEl.dataset?.row || 0);
            if (!col || !row)
                return;
            clearDropHighlight();
            const size = resolveDragSize(ev);
            const BAND_COLS = 24;
            const BAND_ROWS = 9;
            const w = Math.min(BAND_COLS, size.w);
            const h = Math.min(BAND_ROWS, size.h);
            const candidate = { x: col, y: row, w, h };
            const debugKey = `${col}:${row}:${w}:${h}`;
            if (window.__msLastDragoverDebug !== debugKey) {
                window.__msLastDragoverDebug = debugKey;
                console.log('Mastery System | [Equipment Grid Debug] dragover size', {
                    col,
                    row,
                    w,
                    h,
                    raw: window.__msDragInventorySize
                });
            }
            const items = Array.from(this.actor.items.values());
            const rects = items
                .filter((it) => it.id !== window.__msDragItemId)
                .map((it) => {
                const flags = it.getFlag?.('mastery-system', 'equipment') || {};
                if (flags.container !== 'inventory' || !flags.grid?.x || !flags.grid?.y)
                    return null;
                const s = parseInventorySize(it.system?.inventorySize);
                return { x: flags.grid.x, y: flags.grid.y, w: Math.min(BAND_COLS, s.w), h: Math.min(BAND_ROWS, s.h) };
            })
                .filter(Boolean);
            const cellOccupied = (x, y) => rects.some(rect => rectsOverlap(rect, { x, y, w: 1, h: 1 }));
            for (let dy = 0; dy < h; dy++) {
                for (let dx = 0; dx < w; dx++) {
                    const x = col + dx;
                    const y = row + dy;
                    const targetCell = html.find(`.df-enc-band .df-cell[data-col="${x}"][data-row="${y}"]`).first();
                    if (targetCell.length > 0) {
                        const outOfBounds = !fitsInGrid(x, y, 1, 1, BAND_COLS, BAND_ROWS);
                        const occupied = cellOccupied(x, y);
                        targetCell.addClass(outOfBounds || occupied ? 'df-drop-invalid' : 'df-drop-valid');
                    }
                }
            }
        });
        html.off('dragleave.df-grid').on('dragleave.df-grid', '.df-enc-band', () => {
            clearDropHighlight();
        });
        html.off('drop.df-grid').on('drop.df-grid', '.df-enc-band', () => {
            clearDropHighlight();
        });
        // Add spell
        // Removed add-spell-btn handler - using add-spell-creation-btn instead
        // Delete skill
        html.find('.skill-delete').on('click', this.#onSkillDelete.bind(this));
        // Power use
        html.find('.power-use').on('click', this.#onPowerUse.bind(this));
        html.find('.power-use-btn').on('click', this.#onPowerUse.bind(this));
        // Power details toggle
        html.find('.power-toggle-details').on('click', this.#onPowerToggleDetails.bind(this));
        html
            .off('change.msPowerRename', '.power-display-name-input')
            .on('change.msPowerRename', '.power-display-name-input', this.#onPowerDisplayNameChange.bind(this));
        html
            .off('keydown.msPowerRename', '.power-display-name-input')
            .on('keydown.msPowerRename', '.power-display-name-input', (ev) => {
            if (ev.key === 'Enter') {
                ev.preventDefault();
                ev.currentTarget?.blur();
            }
        });
        // Power mechanics editor (structured block)
        html.find('.power-edit-mechanics').on('click', this.#onPowerEditMechanics.bind(this));
        // Power level increase/decrease (with confirmation)
        html.off('click', '.power-increase-level').on('click', '.power-increase-level', this.#onPowerIncreaseLevel.bind(this));
        html.off('click', '.power-decrease-level').on('click', '.power-decrease-level', this.#onPowerDecreaseLevel.bind(this));
        html.find('.confirm-power-level-changes').on('click', this.#onConfirmPowerLevelChanges.bind(this));
        html.find('.cancel-power-level-changes').on('click', this.#onCancelPowerLevelChanges.bind(this));
        // Initialize pending power level changes tracking
        this._pendingPowerLevelChanges = {};
        // Initialize UI state for power level distribution
        this.#updatePowerLevelUI();
        // Active buff removal
        html.find('.active-buff-remove').on('click', this.#onActiveBuffRemove.bind(this));
        // Item controls
        html.find('.item-create').on('click', this.#onItemCreate.bind(this));
        html.find('.item-edit').on('click', this.#onItemEdit.bind(this));
        html.find('.item-delete').on('click', this.#onItemDelete.bind(this));
        html.off('pointerdown.iteminfo').on('pointerdown.iteminfo', '.tab.equipment .df-item-tile', (ev) => {
            const t = ev.target;
            if (t.closest('.item-edit, .item-delete, a, button'))
                return;
            const orig = ev.originalEvent;
            if (!orig)
                return;
            const tile = ev.currentTarget;
            const itemId = tile.dataset?.itemId;
            if (!itemId)
                return;
            this.#itemInfoPointerDown = { itemId, x: orig.clientX, y: orig.clientY };
        });
        html.off('click.iteminfo').on('click.iteminfo', '.tab.equipment .df-item-tile', async (ev) => {
            const t = ev.target;
            if (t.closest('.item-edit, .item-delete, a, button'))
                return;
            const orig = ev.originalEvent;
            if (!orig)
                return;
            const tile = ev.currentTarget;
            const itemId = tile.dataset?.itemId;
            if (!itemId || !this.#itemInfoPointerDown || this.#itemInfoPointerDown.itemId !== itemId) {
                this.#itemInfoPointerDown = null;
                return;
            }
            const dx = orig.clientX - this.#itemInfoPointerDown.x;
            const dy = orig.clientY - this.#itemInfoPointerDown.y;
            this.#itemInfoPointerDown = null;
            if (Math.hypot(dx, dy) > 12)
                return;
            const item = this.actor.items.get(itemId);
            if (!item)
                return;
            ev.preventDefault();
            ev.stopPropagation();
            const { ItemInfoDialog } = await import('./item-info-dialog.js');
            await ItemInfoDialog.show(item);
        });
        // HP adjustment
        html.find('.hp-adjust').on('click', this.#onHPAdjust.bind(this));
        // Stress adjustment
        html.find('.stress-adjust').on('click', this.#onStressAdjust.bind(this));
        // Stone adjustment
        html.find('.stone-adjust').on('click', this.#onStoneAdjust.bind(this));
    }
    /**
     * Calculate cost to increase an attribute from current value to next value.
     * New spec: bands 1–8 / 9–16 / … / 73–80 cost 1 / 2 / … / 10 XP per +1.
     */
    #calculateAttributeCost(currentValue) {
        return attributeBandCost(currentValue + 1);
    }
    /** Floor for attribute value when refunding XP (set at creation finalize; migrated for older actors). */
    #getAttributeXpBaseline(attributeKey) {
        const system = this.actor.system;
        const current = Number(system.attributes?.[attributeKey]?.value ?? 2) || 0;
        const b = system.xp?.attributeBaselines?.[attributeKey];
        if (typeof b === 'number' && !Number.isNaN(b)) {
            // Defensive clamp: a stored baseline must never exceed the current value.
            // If a stale/too-high baseline was snapshotted (e.g. before a GM reset or
            // a rebuild lowered the attribute, or off the world actor vs. an unlinked
            // token), the floor would otherwise sit ABOVE the current value and
            // wrongly reject even simple increases ("Invalid attribute change …").
            return Math.min(b, current);
        }
        return current;
    }
    /** One-time: snapshot current attributes as XP refund floors for legacy completed characters. */
    async #migrateAttributeBaselinesIfNeeded() {
        const system = this.actor.system;
        if (system.creation?.complete === false)
            return;
        if (!this.actor.isOwner)
            return;
        if (!system.xp)
            return;
        const keys = ['might', 'agility', 'vitality', 'intellect', 'resolve', 'influence', 'wits'];
        const existing = system.xp.attributeBaselines;
        if (existing && typeof existing === 'object' && keys.every(k => typeof existing[k] === 'number'))
            return;
        const baselines = {};
        for (const k of keys)
            baselines[k] = system.attributes?.[k]?.value ?? 2;
        try {
            await this.actor.update({ 'system.xp.attributeBaselines': baselines });
        }
        catch (e) {
            console.warn('Mastery System | attributeBaselines migration failed', e);
        }
    }
    /**
     * Net XP effect of pending attribute deltas (positive = spend, negative = refund).
     */
    #calculateAttributePendingNetCost(pendingMap) {
        return calculateAttributePendingNetCost(this.actor, pendingMap);
    }
    /**
     * Calculate cost to raise a power to a specific level.
     * New spec: `cost = 2 × newLevel` for levels 1–16 (2, 4, 6, …, 32 XP).
     */
    #calculatePowerLevelCost(targetLevel) {
        return powerLevelCost(targetLevel);
    }
    /**
     * Get a power's minimum level (baseline from character creation)
     */
    #getPowerMinLevel(item) {
        const lvl = item.system.level ?? 1;
        const min = item.system.minLevel;
        if (typeof min === 'number' && !Number.isNaN(min))
            return min;
        // fallback: treat current level as baseline if missing
        return lvl;
    }
    /**
     * Max Power Level a character of the actor's MR may purchase.
     * MR 1–2 → 4, MR 3 → 8, MR 4 → 12, MR 5+ → 16.
     */
    #getMaxPurchasablePowerLevel() {
        const mr = Math.max(1, Math.floor(Number(this.actor.system?.mastery?.rank) || 1));
        return calculateMaxPowerLevel(mr);
    }
    /**
     * Calculate net pending cost (signed) for all pending power level changes
     * Positive pending: costs for increasing
     * Negative pending: refunds for decreasing
     */
    #calculatePowerPendingNetCost(pendingMap) {
        return calculatePowerPendingNetCost(this.actor, pendingMap);
    }
    /**
     * Get XP state, ensuring all fields exist (backward compatibility)
     */
    #getXpState(actor) {
        const system = actor.system || {};
        const points = system.points || {};
        const xp = system.xp || {};
        const regularAvailable = points.xp ?? 0;
        const freeAvailable = points.xpFree ?? 0;
        return {
            // Combined spendable XP (Free + regular) — used for affordability checks.
            available: regularAvailable + freeAvailable,
            regularAvailable,
            freeAvailable,
            freeEarned: xp.freeEarned ?? 0,
            freeSpent: xp.freeSpent ?? 0,
            totalEarned: xp.totalEarned ?? 0,
            totalSpent: xp.totalSpent ?? 0,
            history: xp.history ?? []
        };
    }
    /**
     * Two-pool XP accounting (free-first). Given a net cost (positive = spend,
     * negative = refund), return the new balances for both pools. Free XP is
     * spent before regular XP; refunds refill the free pool first (capped at
     * `freeEarned`) so up/down testing in the free phase does not leak XP into
     * the regular pool.
     */
    #applyXpCost(xpState, netCost) {
        let regular = xpState.regularAvailable;
        let free = xpState.freeAvailable;
        let totalSpent = xpState.totalSpent;
        let freeSpent = xpState.freeSpent;
        if (netCost > 0) {
            const fromFree = Math.min(free, netCost);
            const fromReg = netCost - fromFree;
            free -= fromFree;
            regular -= fromReg;
            freeSpent += fromFree;
            totalSpent += fromReg;
        }
        else if (netCost < 0) {
            const refund = -netCost;
            const toFree = Math.max(0, Math.min(refund, xpState.freeEarned - free));
            const toReg = refund - toFree;
            free += toFree;
            regular += toReg;
            freeSpent = Math.max(0, freeSpent - toFree);
            totalSpent = Math.max(0, totalSpent - toReg);
        }
        return { pointsXp: regular, pointsXpFree: free, totalSpent: Math.max(0, totalSpent), freeSpent: Math.max(0, freeSpent) };
    }
    /**
     * Push XP history entry and truncate to last 200 entries
     */
    #pushXpHistory(actor, entry) {
        const system = actor.system || {};
        if (!system.xp) {
            system.xp = { totalEarned: 0, totalSpent: 0, history: [] };
        }
        if (!system.xp.history) {
            system.xp.history = [];
        }
        system.xp.history.push(entry);
        // Truncate to last 200 entries
        if (system.xp.history.length > 200) {
            system.xp.history = system.xp.history.slice(-200);
        }
    }
    /**
     * Handle pending attribute increase (XP distribution mode)
     */
    async #onAttributeIncreaseXP(event) {
        event.preventDefault();
        event.stopPropagation();
        console.log('Mastery System | #onAttributeIncreaseXP called', {
            target: event.currentTarget,
            targetType: typeof event.currentTarget,
            targetIsElement: event.currentTarget instanceof HTMLElement,
            attribute: $(event.currentTarget).data('attribute'),
            actorId: this.actor?.id,
            actorName: this.actor?.name,
            isOwner: this.actor?.isOwner
        });
        // Check if user is owner
        if (!this.actor.isOwner) {
            console.warn('Mastery System | #onAttributeIncreaseXP: User is not owner');
            ui.notifications?.warn('Only the owner can distribute Attribute Points.');
            return;
        }
        const $target = $(event.currentTarget);
        const attributeName = $target.data('attribute');
        console.log('Mastery System | #onAttributeIncreaseXP: Attribute name', {
            attributeName,
            targetData: $target.data(),
            targetAttrs: Array.from(event.currentTarget.attributes).map(a => `${a.name}="${a.value}"`)
        });
        if (!attributeName) {
            console.error('Mastery System | #onAttributeIncreaseXP: No attribute name found', {
                target: event.currentTarget,
                targetData: $target.data(),
                targetAttrs: Array.from(event.currentTarget.attributes).map(a => `${a.name}="${a.value}"`)
            });
            return;
        }
        const currentValue = this.actor.system.attributes[attributeName]?.value || 0;
        const pending = this._pendingAttributeChanges[attributeName] || 0;
        const nextPending = pending + 1;
        const effectiveAfter = currentValue + nextPending;
        console.log('Mastery System | #onAttributeIncreaseXP: Current state', {
            attributeName,
            currentValue,
            pending,
            nextPending,
            effectiveAfter,
            pendingChanges: this._pendingAttributeChanges
        });
        if (effectiveAfter > 80) {
            console.warn('Mastery System | #onAttributeIncreaseXP: Max value exceeded', { effectiveAfter });
            ui.notifications?.warn('This attribute cannot exceed maximum value (80).');
            return;
        }
        /**
         * New spec — once-per-step rule. Each Attribute may be increased by
         * at most +1 per Upgrade Step. The pending delta is therefore capped
         * at +1, and if the attribute has *already* been bumped earlier in
         * this same step (and not refunded back below its step-start value)
         * we reject the click.
         */
        // Free-XP phase is exempt from the once-per-step "+1" cap.
        if (!this.#hasFreeXp()) {
            if (nextPending > 1) {
                ui.notifications?.warn(`${attributeName.charAt(0).toUpperCase() + attributeName.slice(1)} can only be increased by +1 per Upgrade Step. End the current step first to increase it again.`);
                return;
            }
            const stepRule = await import('../utils/xp-step-rule.js');
            const step = stepRule.readStep(this.actor);
            if (nextPending > 0 && stepRule.isBumped(step, 'attribute', attributeName)) {
                ui.notifications?.warn(`${attributeName.charAt(0).toUpperCase() + attributeName.slice(1)} was already increased this Upgrade Step. End the current step first to increase it again.`);
                return;
            }
        }
        const simulateMap = { ...this._pendingAttributeChanges, [attributeName]: nextPending };
        if (simulateMap[attributeName] === 0)
            delete simulateMap[attributeName];
        const netPendingCost = this.#calculateAttributePendingNetCost(simulateMap);
        const xpState = this.#getXpState(this.actor);
        console.log('Mastery System | #onAttributeIncreaseXP: Cost check', {
            netPendingCost,
            availablePoints: xpState.available
        });
        if (netPendingCost > xpState.available) {
            console.warn('Mastery System | #onAttributeIncreaseXP: Not enough points', {
                netPendingCost,
                availablePoints: xpState.available
            });
            ui.notifications?.warn(`Not enough XP for this change (net ${netPendingCost} vs ${xpState.available} available).`);
            return;
        }
        this._pendingAttributeChanges[attributeName] = nextPending;
        if (this._pendingAttributeChanges[attributeName] === 0) {
            delete this._pendingAttributeChanges[attributeName];
        }
        console.log('Mastery System | #onAttributeIncreaseXP: Added pending increase', {
            attributeName,
            newPending: this._pendingAttributeChanges[attributeName],
            allPendingChanges: this._pendingAttributeChanges
        });
        // Update UI
        this.#updateAttributeXPUI();
    }
    /**
     * Handle pending attribute decrease (XP distribution mode)
     */
    #onAttributeDecreaseXP(event) {
        event.preventDefault();
        event.stopPropagation();
        console.log('Mastery System | #onAttributeDecreaseXP called', {
            target: event.currentTarget,
            targetType: typeof event.currentTarget,
            targetIsElement: event.currentTarget instanceof HTMLElement,
            attribute: $(event.currentTarget).data('attribute'),
            actorId: this.actor?.id,
            actorName: this.actor?.name
        });
        const $target = $(event.currentTarget);
        const attributeName = $target.data('attribute');
        console.log('Mastery System | #onAttributeDecreaseXP: Attribute name', {
            attributeName,
            targetData: $target.data(),
            targetAttrs: Array.from(event.currentTarget.attributes).map(a => `${a.name}="${a.value}"`)
        });
        if (!attributeName) {
            console.error('Mastery System | #onAttributeDecreaseXP: No attribute name found', {
                target: event.currentTarget,
                targetData: $target.data(),
                targetAttrs: Array.from(event.currentTarget.attributes).map(a => `${a.name}="${a.value}"`)
            });
            return;
        }
        const currentValue = this.actor.system.attributes[attributeName]?.value || 0;
        const pending = this._pendingAttributeChanges[attributeName] || 0;
        const baseline = this.#getAttributeXpBaseline(attributeName);
        const nextPending = pending - 1;
        const effectiveAfter = currentValue + nextPending;
        console.log('Mastery System | #onAttributeDecreaseXP: Current pending', {
            attributeName,
            pending,
            nextPending,
            effectiveAfter,
            baseline,
            allPendingChanges: this._pendingAttributeChanges
        });
        if (effectiveAfter < baseline) {
            ui.notifications?.warn(`Cannot lower ${attributeName} below ${baseline} (creation baseline). Ask the GM to unlock creation if you need a full rebuild.`);
            return;
        }
        this._pendingAttributeChanges[attributeName] = nextPending;
        if (this._pendingAttributeChanges[attributeName] === 0) {
            delete this._pendingAttributeChanges[attributeName];
        }
        console.log('Mastery System | #onAttributeDecreaseXP: Removed pending increase', {
            attributeName,
            newPending: this._pendingAttributeChanges[attributeName],
            allPendingChanges: this._pendingAttributeChanges
        });
        // Update UI
        this.#updateAttributeXPUI();
    }
    /**
     * Free-XP phase: while the character has any Free XP available
     * (`system.points.xpFree > 0`), upgrades are spent freely — no once-per-step
     * "+1" cap on Attributes / Skills / Powers. Free XP is always spent before
     * regular XP; once it is exhausted, the normal once-per-step rule applies to
     * the regular pool again.
     */
    #hasFreeXp() {
        return (this.actor.system?.points?.xpFree ?? 0) > 0;
    }
    /**
     * Update the attribute XP distribution UI
     */
    #updateAttributeXPUI() {
        const html = this.element;
        const netPendingCost = this.#calculateAttributePendingNetCost(this._pendingAttributeChanges);
        const xpState = this.#getXpState(this.actor);
        const remainingPoints = xpState.available - netPendingCost;
        this.#setHeaderXpDisplay(remainingPoints);
        const totalAbsPending = Object.values(this._pendingAttributeChanges).reduce((sum, val) => sum + Math.abs(val), 0);
        html.find('#pending-attribute-changes-count').text(totalAbsPending);
        html.find('#remaining-attribute-xp').text(Math.max(0, remainingPoints));
        /**
         * New spec — once-per-step rule. Each Attribute may only be increased
         * by +1 per Upgrade Step. Disable "+" if the attribute is already at
         * its pending cap of +1 OR if it was already bumped earlier this step.
         */
        const bumpedAttributes = new Set(Array.isArray(this.actor.system?.xp?.currentStep?.attributes)
            ? this.actor.system.xp.currentStep.attributes.map((v) => String(v ?? ''))
            : []);
        const attributeKeys = ['might', 'agility', 'vitality', 'intellect', 'resolve', 'influence', 'wits'];
        for (const attrKey of attributeKeys) {
            const pending = this._pendingAttributeChanges[attrKey] || 0;
            const pendingChangeEl = html.find(`.attribute-pending-change[data-attribute="${attrKey}"]`);
            const pendingDeltaEl = pendingChangeEl.find('.pending-delta');
            if (pending !== 0) {
                pendingChangeEl.show();
                pendingDeltaEl.text(pending > 0 ? `+${pending}` : `${pending}`);
            }
            else {
                pendingChangeEl.hide();
                pendingDeltaEl.text('');
            }
            const currentValue = this.actor.system.attributes[attrKey]?.value || 0;
            const baseline = this.#getAttributeXpBaseline(attrKey);
            const decreaseBtn = html.find(`.attr-decrease-xp[data-attribute="${attrKey}"]`);
            const canDecrease = currentValue + pending - 1 >= baseline;
            decreaseBtn.prop('disabled', !canDecrease);
            const increaseBtn = html.find(`.attr-increase-xp[data-attribute="${attrKey}"]`);
            const nextPending = pending + 1;
            const effectiveAfter = currentValue + nextPending;
            // Free-XP phase: spend freely (no per-step cap).
            const wouldExceedStepCap = !this.#hasFreeXp() &&
                (nextPending > 1 || (nextPending > 0 && bumpedAttributes.has(attrKey)));
            if (effectiveAfter > 80 || wouldExceedStepCap) {
                increaseBtn.prop('disabled', true);
                if (wouldExceedStepCap) {
                    increaseBtn.attr('title', this.#hasFreeXp()
                        ? ''
                        : 'Bereits in diesem Upgrade Step erhöht. GM: Step beenden (Flagge) oder Free XP (★) für freie Verteilung.');
                }
            }
            else {
                increaseBtn.removeAttr('title');
                if (this.#hasFreeXp()) {
                    increaseBtn.attr('title', 'Free XP aktiv — frei verteilbar (kein Step-Limit).');
                }
                const simulateMap = { ...this._pendingAttributeChanges, [attrKey]: nextPending };
                if (simulateMap[attrKey] === 0)
                    delete simulateMap[attrKey];
                const simNet = this.#calculateAttributePendingNetCost(simulateMap);
                increaseBtn.prop('disabled', simNet > xpState.available);
            }
        }
        const confirmBtn = html.find('#confirm-attribute-changes-btn');
        const cancelBtn = html.find('#cancel-attribute-changes-btn');
        if (totalAbsPending > 0) {
            confirmBtn.prop('disabled', false);
            cancelBtn.prop('disabled', false);
        }
        else {
            confirmBtn.prop('disabled', true);
            cancelBtn.prop('disabled', true);
        }
    }
    /**
     * Confirm and apply pending attribute changes
     */
    async #onConfirmAttributeChanges(event) {
        event.preventDefault();
        event.stopPropagation();
        if (!this.actor.isOwner) {
            ui.notifications?.warn('Only the owner can confirm Attribute Point changes.');
            return;
        }
        const xpState = this.#getXpState(this.actor);
        const totalNetCost = this.#calculateAttributePendingNetCost(this._pendingAttributeChanges);
        const attributeKeys = ['might', 'agility', 'vitality', 'intellect', 'resolve', 'influence', 'wits'];
        const attributeChanges = [];
        for (const attrKey of attributeKeys) {
            const pending = this._pendingAttributeChanges[attrKey] || 0;
            if (!pending)
                continue;
            const currentValue = this.actor.system.attributes[attrKey]?.value || 0;
            const newValue = currentValue + pending;
            let attrCost = 0;
            if (pending > 0) {
                for (let i = 0; i < pending; i++) {
                    attrCost += this.#calculateAttributeCost(currentValue + i);
                }
            }
            else {
                for (let i = 0; i < Math.abs(pending); i++) {
                    const dropFrom = currentValue - i;
                    const baseline = this.#getAttributeXpBaseline(attrKey);
                    if (dropFrom <= baseline)
                        break;
                    attrCost -= this.#calculateAttributeCost(dropFrom - 1);
                }
            }
            attributeChanges.push({ attr: attrKey, from: currentValue, to: newValue, cost: attrCost });
        }
        const beforeState = {
            available: xpState.available,
            totalEarned: xpState.totalEarned,
            totalSpent: xpState.totalSpent,
        };
        const result = await applyAttributePendingChanges(this.actor, this._pendingAttributeChanges);
        if (!result.ok) {
            ui.notifications?.error(result.error || 'Could not apply attribute changes.');
            return;
        }
        const user = game.user;
        if (attributeChanges.length > 0) {
            const afterXp = this.#getXpState(this.actor);
            const historyEntry = {
                ts: Date.now(),
                userId: user?.id || '',
                userName: user?.name || 'System',
                kind: (totalNetCost > 0 ? 'spend' : 'adjust'),
                category: 'attribute',
                amount: Math.abs(totalNetCost),
                details: { changes: attributeChanges, netCost: totalNetCost },
                note: totalNetCost < 0
                    ? 'refund via attribute decrease'
                    : totalNetCost === 0
                        ? 'attribute redistribution (0 net XP)'
                        : undefined,
                before: beforeState,
                after: {
                    available: afterXp.available,
                    totalEarned: afterXp.totalEarned,
                    totalSpent: afterXp.totalSpent,
                },
            };
            this.#pushXpHistory(this.actor, historyEntry);
            await this.actor.update({ 'system.xp.history': this.actor.system.xp.history });
        }
        this._pendingAttributeChanges = {};
        if (totalNetCost > 0) {
            ui.notifications?.info(`Attribute changes confirmed! Cost: ${totalNetCost} XP, Remaining: ${this.#getXpState(this.actor).available}`);
        }
        else if (totalNetCost < 0) {
            ui.notifications?.info(`Attribute changes confirmed! Refund: ${Math.abs(totalNetCost)} XP, Remaining: ${this.#getXpState(this.actor).available}`);
        }
        else {
            ui.notifications?.info('Attribute changes confirmed.');
        }
        await this.render();
    }
    /**
     * Cancel pending attribute changes
     */
    #onCancelAttributeChanges(event) {
        event.preventDefault();
        event.stopPropagation();
        // Clear pending changes
        this._pendingAttributeChanges = {};
        // Update UI
        this.#updateAttributeXPUI();
        ui.notifications?.info('Pending attribute changes cancelled.');
    }
    /**
     * Handle pending power level increase
     */
    async #onPowerIncreaseLevel(event) {
        event.preventDefault();
        event.stopPropagation();
        console.log('Mastery System | #onPowerIncreaseLevel called', {
            target: event.currentTarget,
            itemId: $(event.currentTarget).data('item-id')
        });
        // Check if user is owner
        if (!this.actor.isOwner) {
            ui.notifications?.warn('Only the owner can distribute XP.');
            return;
        }
        const $button = $(event.currentTarget);
        const itemId = $button.data('item-id');
        if (!itemId) {
            console.error('Mastery System | #onPowerIncreaseLevel: No item ID found');
            return;
        }
        const item = this.actor.items.get(itemId);
        if (!item || item.type !== 'power') {
            console.error('Mastery System | #onPowerIncreaseLevel: Item not found or not a power');
            return;
        }
        const currentLevel = item.system.level || 1;
        const pending = this._pendingPowerLevelChanges[itemId] || 0;
        const effectiveLevel = currentLevel + pending;
        console.log('Mastery System | #onPowerIncreaseLevel: Current state', {
            itemId,
            currentLevel,
            pending,
            effectiveLevel
        });
        const levelCap = this.#getMaxPurchasablePowerLevel();
        if (effectiveLevel >= levelCap) {
            console.warn('Mastery System | #onPowerIncreaseLevel: Max level reached', { effectiveLevel, levelCap });
            ui.notifications?.warn(`This power cannot exceed your current maximum (level ${levelCap}; MR 1-2 cap 4, MR 3 cap 8, MR 4 cap 12, MR 5+ cap 16).`);
            return;
        }
        /**
         * Once-per-step rule. Each Power may be increased by at most +1 per
         * Upgrade Step — UNLESS the character is in the Free-XP phase, where
         * upgrades may be stacked freely.
         */
        if (!this.#hasFreeXp()) {
            if (pending + 1 > 1) {
                ui.notifications?.warn(`${item.name} can only be increased by +1 Level per Upgrade Step. End the current step first to increase it again.`);
                return;
            }
            const stepRule = await import('../utils/xp-step-rule.js');
            const step = stepRule.readStep(this.actor);
            if (pending + 1 > 0 && stepRule.isBumped(step, 'power', itemId)) {
                ui.notifications?.warn(`${item.name} was already increased this Upgrade Step. End the current step first to increase it again.`);
                return;
            }
        }
        // Simulate the new pending state
        const simulateMap = { ...this._pendingPowerLevelChanges, [itemId]: pending + 1 };
        const netCost = this.#calculatePowerPendingNetCost(simulateMap);
        // Combined spendable XP (Free pool is spent first, then regular).
        const availableXP = (this.actor.system.points?.xp || 0) + (this.actor.system.points?.xpFree || 0);
        console.log('Mastery System | #onPowerIncreaseLevel: Cost check', {
            netCost,
            availableXP,
            nextLevel: effectiveLevel + 1,
            nextCost: this.#calculatePowerLevelCost(effectiveLevel + 1)
        });
        // Check affordability
        if (netCost > availableXP) {
            console.warn('Mastery System | #onPowerIncreaseLevel: Not enough XP', {
                netCost,
                availableXP
            });
            const nextCost = this.#calculatePowerLevelCost(effectiveLevel + 1);
            ui.notifications?.warn(`Not enough XP! This increase would cost ${nextCost} XP, but you only have ${availableXP - (netCost - nextCost)} remaining.`);
            return;
        }
        // Add pending increase (can be negative, so we increment)
        this._pendingPowerLevelChanges[itemId] = pending + 1;
        if (this._pendingPowerLevelChanges[itemId] === 0) {
            delete this._pendingPowerLevelChanges[itemId];
        }
        console.log('Mastery System | #onPowerIncreaseLevel: Added pending increase', {
            itemId,
            newPending: this._pendingPowerLevelChanges[itemId],
            allPendingChanges: this._pendingPowerLevelChanges
        });
        // Update UI
        this.#updatePowerLevelUI();
    }
    /**
     * Handle pending power level decrease
     */
    #onPowerDecreaseLevel(event) {
        event.preventDefault();
        event.stopPropagation();
        console.log('Mastery System | #onPowerDecreaseLevel called', {
            target: event.currentTarget,
            itemId: $(event.currentTarget).data('item-id')
        });
        // Check if user is owner
        if (!this.actor.isOwner) {
            ui.notifications?.warn('Only the owner can distribute XP.');
            return;
        }
        const $button = $(event.currentTarget);
        const itemId = $button.data('item-id');
        if (!itemId) {
            console.error('Mastery System | #onPowerDecreaseLevel: No item ID found');
            return;
        }
        const item = this.actor.items.get(itemId);
        if (!item || item.type !== 'power') {
            console.error('Mastery System | #onPowerDecreaseLevel: Item not found or not a power');
            return;
        }
        const currentLevel = item.system.level || 1;
        const minLevel = this.#getPowerMinLevel(item);
        const pending = this._pendingPowerLevelChanges[itemId] || 0;
        const effectiveLevel = currentLevel + pending;
        console.log('Mastery System | #onPowerDecreaseLevel: Current state', {
            itemId,
            currentLevel,
            minLevel,
            pending,
            effectiveLevel
        });
        // Check if we can go below minLevel
        if (effectiveLevel <= minLevel) {
            console.warn('Mastery System | #onPowerDecreaseLevel: Cannot go below minLevel', {
                effectiveLevel,
                minLevel
            });
            ui.notifications?.warn(`This power cannot go below level ${minLevel} (baseline from character creation).`);
            return;
        }
        // Decrease pending (can go negative)
        this._pendingPowerLevelChanges[itemId] = pending - 1;
        if (this._pendingPowerLevelChanges[itemId] === 0) {
            delete this._pendingPowerLevelChanges[itemId];
        }
        console.log('Mastery System | #onPowerDecreaseLevel: Decreased pending', {
            itemId,
            newPending: this._pendingPowerLevelChanges[itemId],
            allPendingChanges: this._pendingPowerLevelChanges
        });
        // Update UI
        this.#updatePowerLevelUI();
    }
    /**
     * Update the power level distribution UI
     */
    #updatePowerLevelUI() {
        const html = this.element;
        // Calculate net pending cost (signed)
        const netPendingCost = this.#calculatePowerPendingNetCost(this._pendingPowerLevelChanges);
        // Combined spendable XP (Free pool is spent first, then regular).
        const availableXP = (this.actor.system.points?.xp || 0) + (this.actor.system.points?.xpFree || 0);
        const remainingXP = availableXP - netPendingCost; // Can be negative if refunding
        this.#setHeaderXpDisplay(remainingXP);
        // Calculate total absolute pending changes (for display)
        const totalPendingChanges = Object.values(this._pendingPowerLevelChanges).reduce((sum, val) => sum + Math.abs(val), 0);
        // Update pending changes count and remaining XP
        html.find('#pending-power-level-changes-count').text(totalPendingChanges);
        html.find('#remaining-power-level-mp').text(Math.max(0, remainingXP));
        // Once-per-step rule: powers already bumped this step have "+" disabled.
        const bumpedPowers = new Set(Array.isArray(this.actor.system?.xp?.currentStep?.powers)
            ? this.actor.system.xp.currentStep.powers.map((v) => String(v ?? ''))
            : []);
        // Update each power's pending display and button states
        const powers = this.actor.items.filter((item) => item.type === 'power');
        for (const power of powers) {
            const itemId = power.id;
            const pending = this._pendingPowerLevelChanges[itemId] || 0;
            const currentLevel = power.system.level || 1;
            const effectiveLevel = currentLevel + pending;
            const minLevel = this.#getPowerMinLevel(power);
            // Update pending change display (signed)
            const pendingChangeEl = html.find(`.power-level-pending-change[data-item-id="${itemId}"]`);
            const pendingDeltaEl = pendingChangeEl.find('.pending-delta');
            if (pending !== 0) {
                pendingChangeEl.show();
                pendingDeltaEl.text(pending > 0 ? `+${pending}` : `${pending}`);
            }
            else {
                pendingChangeEl.hide();
            }
            // Update decrease button state
            const decreaseBtn = html.find(`.power-decrease-level[data-item-id="${itemId}"]`);
            decreaseBtn.prop('disabled', effectiveLevel <= minLevel);
            // Update increase button state
            const increaseBtn = html.find(`.power-increase-level[data-item-id="${itemId}"]`);
            const nextPending = pending + 1;
            // Free-XP phase: spend freely (no per-step cap).
            const wouldExceedStepCap = !this.#hasFreeXp() &&
                (nextPending > 1 || (nextPending > 0 && bumpedPowers.has(itemId)));
            if (effectiveLevel >= this.#getMaxPurchasablePowerLevel() || wouldExceedStepCap) {
                increaseBtn.prop('disabled', true);
                if (wouldExceedStepCap) {
                    increaseBtn.attr('title', this.#hasFreeXp()
                        ? ''
                        : 'Bereits in diesem Upgrade Step erhöht. GM: Step beenden (Flagge) oder Free XP (★) für freie Verteilung.');
                }
            }
            else {
                increaseBtn.removeAttr('title');
                if (this.#hasFreeXp()) {
                    increaseBtn.attr('title', 'Free XP aktiv — frei verteilbar (kein Step-Limit).');
                }
                const simulateMap = { ...this._pendingPowerLevelChanges, [itemId]: nextPending };
                const simulateNetCost = this.#calculatePowerPendingNetCost(simulateMap);
                increaseBtn.prop('disabled', simulateNetCost > availableXP);
            }
        }
        // Update confirm/cancel buttons
        const confirmBtn = html.find('#confirm-power-level-changes-btn');
        const cancelBtn = html.find('#cancel-power-level-changes-btn');
        if (totalPendingChanges > 0) {
            confirmBtn.prop('disabled', false);
            cancelBtn.prop('disabled', false);
        }
        else {
            confirmBtn.prop('disabled', true);
            cancelBtn.prop('disabled', true);
        }
    }
    /**
     * Confirm and apply pending power level changes
     */
    async #onConfirmPowerLevelChanges(event) {
        event.preventDefault();
        event.stopPropagation();
        // Check if user is owner
        if (!this.actor.isOwner) {
            ui.notifications?.warn('Only the owner can confirm Power Level changes.');
            return;
        }
        // Get XP state
        const xpState = this.#getXpState(this.actor);
        const availableXP = xpState.available; // combined Free + regular
        // Calculate net cost (signed - can be negative for refunds)
        const netCost = this.#calculatePowerPendingNetCost(this._pendingPowerLevelChanges);
        // Validate affordability (only check if net cost is positive)
        if (netCost > availableXP) {
            ui.notifications?.error(`Not enough XP! Net cost: ${netCost}, Available: ${availableXP}`);
            return;
        }
        // Prepare before state for history
        const beforeState = {
            available: xpState.available,
            totalEarned: xpState.totalEarned,
            totalSpent: xpState.totalSpent,
        };
        // Track power changes for history
        const powerChanges = [];
        const cap = this.#getMaxPurchasablePowerLevel();
        for (const [powerId, pending] of Object.entries(this._pendingPowerLevelChanges)) {
            if (pending > 0) {
                const p = this.actor.items.get(powerId);
                if (p) {
                    const cl = p.system.level || 1;
                    if (cl + pending > cap) {
                        ui.notifications?.error(`Pending level increases exceed your current maximum (${cap}). Adjust or cancel.`);
                        return;
                    }
                }
            }
        }
        // Apply updates
        for (const [powerId, pending] of Object.entries(this._pendingPowerLevelChanges)) {
            if (pending !== 0) {
                const powerItem = this.actor.items.get(powerId);
                if (powerItem) {
                    const currentLevel = powerItem.system.level || 1;
                    const minLevel = this.#getPowerMinLevel(powerItem);
                    const newLevel = Math.max(minLevel, Math.min(cap, currentLevel + pending)); // Clamp to [minLevel..cap]
                    // Calculate cost for this power's change
                    let powerCost = 0;
                    if (pending > 0) {
                        for (let i = 0; i < pending; i++) {
                            const targetLevel = currentLevel + i + 1;
                            powerCost += this.#calculatePowerLevelCost(targetLevel);
                        }
                    }
                    else {
                        const steps = Math.abs(pending);
                        for (let i = 0; i < steps; i++) {
                            const refundLevel = currentLevel - i;
                            powerCost -= this.#calculatePowerLevelCost(refundLevel);
                        }
                    }
                    powerChanges.push({
                        powerId,
                        powerName: powerItem.name,
                        from: currentLevel,
                        to: newLevel,
                        cost: powerCost
                    });
                    const sys = powerItem.system;
                    const powerUpdate = { 'system.level': newLevel };
                    if (sys.levels && typeof sys.levels === 'object' && !Array.isArray(sys.levels)) {
                        powerUpdate['system.rank'] = getPowerDefinitionRank(newLevel, sys.levels);
                    }
                    await powerItem.update(powerUpdate);
                }
            }
        }
        // Two-pool accounting: Free XP is spent before regular XP.
        const acct = this.#applyXpCost(xpState, netCost);
        const newXP = acct.pointsXp + acct.pointsXpFree; // combined remaining
        /**
         * Once-per-step rule. Each Power may only be increased by +1 per Upgrade
         * Step — UNLESS the character is in the Free-XP phase (unrestricted).
         * Mark each positively-bumped power; un-bump on refund.
         */
        const unrestrictedPow = this.#hasFreeXp();
        const stepRulePow = await import('../utils/xp-step-rule.js');
        let stepAfterPow = stepRulePow.readStep(this.actor);
        for (const change of powerChanges) {
            if (unrestrictedPow)
                continue;
            const pending = this._pendingPowerLevelChanges[change.powerId] || 0;
            if (pending > 0) {
                if (stepRulePow.isBumped(stepAfterPow, 'power', change.powerId)) {
                    ui.notifications?.error(`Step rule: ${change.powerName} was already increased this Upgrade Step. End the current step first.`);
                    return;
                }
                stepAfterPow = stepRulePow.recordBump(stepAfterPow, 'power', change.powerId);
            }
            else if (pending < 0) {
                stepAfterPow = stepRulePow.undoBump(stepAfterPow, 'power', change.powerId);
            }
        }
        const updates = {
            'system.points.xp': acct.pointsXp,
            'system.points.xpFree': acct.pointsXpFree,
            'system.xp.totalSpent': acct.totalSpent,
            'system.xp.freeSpent': acct.freeSpent,
            'system.xp.currentStep.attributes': [...stepAfterPow.attributes],
            'system.xp.currentStep.skills': [...stepAfterPow.skills],
            'system.xp.currentStep.powers': [...stepAfterPow.powers],
            'system.xp.currentStep.artifacts': [...stepAfterPow.artifacts],
        };
        // Ensure XP structure exists
        if (!this.actor.system.xp) {
            updates['system.xp.totalEarned'] = xpState.totalEarned;
            updates['system.xp.history'] = [];
        }
        await this.actor.update(updates);
        // Add history entry
        const user = game.user;
        if (Math.abs(netCost) > 0) {
            const historyEntry = {
                ts: Date.now(),
                userId: user?.id || '',
                userName: user?.name || 'System',
                kind: (netCost > 0 ? 'spend' : 'adjust'),
                category: 'power',
                amount: Math.abs(netCost),
                details: { changes: powerChanges, netCost },
                note: netCost < 0 ? 'refund via downgrade' : undefined,
                before: beforeState,
                after: {
                    available: newXP,
                    totalEarned: xpState.totalEarned,
                    totalSpent: acct.totalSpent,
                }
            };
            this.#pushXpHistory(this.actor, historyEntry);
            await this.actor.update({ 'system.xp.history': this.actor.system.xp.history });
        }
        // Clear pending changes
        this._pendingPowerLevelChanges = {};
        // Show notification
        if (netCost > 0) {
            ui.notifications?.info(`Power level changes confirmed! Cost: ${netCost} XP, Remaining: ${newXP}`);
        }
        else if (netCost < 0) {
            ui.notifications?.info(`Power level changes confirmed! Refund: ${Math.abs(netCost)} XP, Remaining: ${newXP}`);
        }
        else {
            ui.notifications?.info('Power level changes confirmed!');
        }
        // Re-render
        await this.render();
    }
    /**
     * Cancel pending power level changes
     */
    #onCancelPowerLevelChanges(event) {
        event.preventDefault();
        event.stopPropagation();
        // Clear pending changes
        this._pendingPowerLevelChanges = {};
        // Update UI
        this.#updatePowerLevelUI();
        ui.notifications?.info('Pending power level changes cancelled.');
    }
    /**
     * Handle attribute roll — same chat card as skill rolls (TN, success, raises; flavor lists base TN + raises)
     */
    async #onAttributeRoll(event) {
        event.preventDefault();
        const element = event.currentTarget;
        const attribute = element.dataset.attribute;
        if (!attribute)
            return;
        const rollOptions = await this.#promptForAttributeRollOptions(attribute);
        if (!rollOptions)
            return;
        const actorData = this.actor.system;
        let numDice = actorData.attributes?.[attribute]?.value || 0;
        const keepDice = actorData.mastery?.rank || 2;
        // Players Guide minimum-pool rule (~5888–5899) — apply *before* the
        // health penalty so the percentage scales with the post-floor pool.
        numDice = Math.max(numDice, keepDice);
        const { getCurrentPenalty } = await import('../utils/calculations.js');
        const healthBars = actorData.health?.bars || [];
        const currentBar = actorData.health?.currentBar ?? 0;
        const healthPenalty = getCurrentPenalty(healthBars, currentBar, numDice);
        numDice = Math.max(1, numDice + healthPenalty);
        const attrLabel = attribute.charAt(0).toUpperCase() + attribute.slice(1);
        let flavor = `Attribute: ${attrLabel}, Base TN: ${rollOptions.baseTN}, Raises: ${rollOptions.raises}`;
        if (healthPenalty < 0) {
            flavor += ` (Health penalty: ${healthPenalty} dice)`;
        }
        const { masteryRoll } = await import('../dice/roll-handler.js');
        await masteryRoll({
            numDice,
            keepDice,
            skill: 0,
            tn: rollOptions.finalTN,
            label: `${attrLabel} Check`,
            flavor,
            actorId: this.actor.id,
            isSkillRoll: false,
            baseModifier: 0,
            autoRaises: rollOptions.autoRaises
        });
    }
    /**
     * Prompt for attribute roll: difficulty, optional custom TN, raises (+4 TN each) — mirrors skill roll dialog
     */
    async #promptForAttributeRollOptions(attributeKey) {
        const system = this.actor.system;
        const masteryRank = system.mastery?.rank || 2;
        const standardTN = masteryRank * 8;
        const difficulties = {
            trivial: standardTN - 8,
            easy: standardTN - 4,
            standard: standardTN,
            challenging: standardTN + 4,
            hard: standardTN + 8,
            veryHard: standardTN + 12,
            heroic: standardTN + 16
        };
        const attrLabel = attributeKey.charAt(0).toUpperCase() + attributeKey.slice(1);
        const attrDice = system.attributes?.[attributeKey]?.value ?? 0;
        const content = `
      <form class="mastery-dialog-form">
        <div class="md-group">
          <label class="md-label">Attribute</label>
          <div class="md-attr-display">
            ${attrLabel} (${attrDice}d8, keep ${masteryRank})
          </div>
        </div>

        <div class="md-group md-group-difficulty">
          <label class="md-label">Difficulty</label>
          <select name="baseTN" id="attr-roll-baseTN" class="md-select md-select-difficulty">
            <option value="${difficulties.trivial}">Trivial (${difficulties.trivial})</option>
            <option value="${difficulties.easy}">Easy (${difficulties.easy})</option>
            <option value="${difficulties.standard}" selected>Standard (${difficulties.standard})</option>
            <option value="${difficulties.challenging}">Challenging (${difficulties.challenging})</option>
            <option value="${difficulties.hard}">Hard (${difficulties.hard})</option>
            <option value="${difficulties.veryHard}">Very Hard (${difficulties.veryHard})</option>
            <option value="${difficulties.heroic}">Heroic (${difficulties.heroic})</option>
            <option value="custom">Custom…</option>
          </select>
        </div>

        <div class="md-group" id="attr-custom-tn-group" style="display: none;">
          <label class="md-label">Custom TN</label>
          <input type="number" name="customTN" id="attr-roll-customTN" value="${difficulties.standard}" min="0" step="1" class="md-input" />
        </div>

        <div class="md-group">
          <label class="md-label">Raises <span class="md-sublabel">(+4 TN each)</span></label>
          <input type="number" name="raises" id="attr-roll-raises" value="0" min="0" step="1" class="md-input" />
          <div class="md-final-tn">
            Final TN: <strong><span id="attr-final-tn-display">${difficulties.standard}</span></strong>
          </div>
        </div>

        <div class="md-group">
          <label class="md-label">Auto-Raises <span class="md-sublabel">(−4 dice each, +1 raise on success)</span></label>
          <input type="number" name="autoRaises" id="attr-roll-auto-raises" value="0" min="0" step="1" class="md-input" />
          <div class="md-final-tn">
            Dice Pool: <strong><span id="attr-auto-raise-pool-display">${attrDice}d8</span></strong>
          </div>
        </div>
      </form>
    `;
        return new Promise((resolve) => {
            const dialog = new Dialog({
                title: `Roll ${attrLabel}`,
                content,
                buttons: {
                    roll: {
                        label: '<i class="fas fa-dice-d20"></i> Roll',
                        callback: (html) => {
                            const baseTNSelect = html.find('[name="baseTN"]').val();
                            let baseTN;
                            if (baseTNSelect === 'custom') {
                                baseTN = parseInt(html.find('[name="customTN"]').val()) || 0;
                            }
                            else {
                                baseTN = parseInt(baseTNSelect) || difficulties.standard;
                            }
                            const raises = parseInt(html.find('[name="raises"]').val()) || 0;
                            const finalTN = baseTN + raises * 4;
                            const autoRaises = Math.max(0, parseInt(html.find('[name="autoRaises"]').val()) || 0);
                            resolve({ baseTN, raises, finalTN, autoRaises });
                        }
                    },
                    cancel: {
                        label: 'Cancel',
                        callback: () => resolve(null)
                    }
                },
                default: 'roll',
                render: (html) => {
                    const $html = html instanceof HTMLElement ? $(html) : $(html);
                    setTimeout(() => {
                        $html.closest('.window-app.dialog').addClass('mastery-system mastery-roll-dialog mastery-skill-roll-dialog');
                    }, 0);
                    $html.find('[name="baseTN"]').on('change', function () {
                        const isCustom = $(this).val() === 'custom';
                        $html.find('#attr-custom-tn-group').toggle(isCustom);
                    });
                    const updateFinalTN = () => {
                        const baseTNSelect = $html.find('[name="baseTN"]').val();
                        let baseTN;
                        if (baseTNSelect === 'custom') {
                            baseTN = parseInt($html.find('[name="customTN"]').val()) || 0;
                        }
                        else {
                            baseTN = parseInt(baseTNSelect) || difficulties.standard;
                        }
                        const raises = parseInt($html.find('[name="raises"]').val()) || 0;
                        const finalTN = baseTN + raises * 4;
                        $html.find('#attr-final-tn-display').text(String(finalTN));
                    };
                    const updateAutoRaisePool = () => {
                        const autoRaises = Math.max(0, parseInt($html.find('[name="autoRaises"]').val()) || 0);
                        const cost = autoRaises * 4;
                        const finalPool = Math.max(1, attrDice - cost);
                        const text = autoRaises > 0
                            ? `${attrDice} − ${cost} = ${finalPool}d8 (+${autoRaises} auto raise${autoRaises > 1 ? 's' : ''})`
                            : `${attrDice}d8`;
                        $html.find('#attr-auto-raise-pool-display').text(text);
                    };
                    $html.find('[name="baseTN"], [name="customTN"], [name="raises"]').on('change input', updateFinalTN);
                    $html.find('[name="autoRaises"]').on('change input', updateAutoRaisePool);
                    updateFinalTN();
                    updateAutoRaisePool();
                }
            }, {
                width: 600,
                height: 440,
                resizable: true
            });
            dialog.render(true);
        });
    }
    /**
     * Handle skill roll
     */
    async #onSkillRoll(event) {
        event.preventDefault();
        const element = event.currentTarget;
        const skillKey = element.dataset.skill;
        const forcedAttribute = (element.dataset.attribute || '').trim().toLowerCase() || undefined;
        if (!skillKey)
            return;
        // Get skill definition from SKILLS
        const skillDef = SKILLS[skillKey];
        if (!skillDef) {
            ui.notifications?.error(`Skill "${skillKey}" not found in skill definitions.`);
            return;
        }
        if (forcedAttribute &&
            !skillDef.attributes.map((a) => a.toLowerCase()).includes(forcedAttribute)) {
            ui.notifications?.error(`Invalid attribute for ${skillDef.name}.`);
            return;
        }
        // Prompt for roll options (attribute, base TN, raises)
        const rollOptions = await this.#promptForSkillRollOptions(skillKey, skillDef, forcedAttribute);
        if (!rollOptions)
            return; // User cancelled
        // Perform the roll
        const system = this.actor.system;
        const attributeValue = system.attributes?.[rollOptions.attributeKey]?.value || 0;
        const masteryRank = system.mastery?.rank || 2;
        // Players Guide skill rules (~1880–1893): the skill is "active" only
        // when its rating ≥ MR. Below that threshold the player rolls **half
        // the attribute** (rounded down, never < 1) and may not spend skill
        // points after the roll. The minimum-pool floor (max(attribute, MR))
        // applies in both modes.
        const skillRating = Number(system?.skills?.[skillKey] ?? 0);
        const fullPoolReady = skillRating >= masteryRank;
        let baseAttrPool = attributeValue;
        let halfPoolFlavor = '';
        if (!fullPoolReady) {
            const halved = Math.max(1, Math.floor(attributeValue / 2));
            halfPoolFlavor = ` Half-pool: skill rating ${skillRating} < MR ${masteryRank} → ⌊${attributeValue}/2⌋ = ${halved}d8, no skill points may be spent.`;
            baseAttrPool = halved;
        }
        let numDice = Math.max(baseAttrPool, masteryRank);
        let equipPenaltyFlavor = '';
        if (skillDef.category === SKILL_CATEGORIES.PHYSICAL) {
            const penDice = getEquippedPhysicalSkillPenaltyDice(this.actor);
            if (penDice > 0) {
                numDice = Math.max(1, numDice - penDice);
                equipPenaltyFlavor = ` Equipped armor/shield physical penalty: −${penDice}d8 (rolling ${numDice} dice).`;
            }
        }
        const { masteryRoll } = await import('../dice/roll-handler.js');
        await masteryRoll({
            numDice,
            keepDice: masteryRank,
            skill: 0, // No auto skill bonus
            tn: rollOptions.finalTN,
            label: `${skillDef.name} Check`,
            flavor: `Attribute: ${rollOptions.attributeKey.charAt(0).toUpperCase() + rollOptions.attributeKey.slice(1)}, Base TN: ${rollOptions.baseTN}, Raises: ${rollOptions.raises}.${equipPenaltyFlavor}${halfPoolFlavor}`,
            actorId: this.actor.id,
            // Half-pool mode: the rule says no points may be spent, so we hide
            // the spend buttons entirely by suppressing the skill-roll flag.
            skillKey: fullPoolReady ? skillKey : undefined,
            isSkillRoll: fullPoolReady,
            baseModifier: 0,
            rollKind: 'skill',
            autoFailIntent: 'skill',
            checkContext: { skillKey },
            autoRaises: rollOptions.autoRaises
        });
        // Skill point spending is now handled via chat buttons (no modal dialog)
    }
    /**
     * Prompt for skill roll options (attribute, base TN, raises).
     *
     * Used by normal skill rolls as well as Echo card rolls. Echo rolls call this
     * directly after resolving the card's skill (so the dialog picks the right
     * attribute list).
     */
    async #promptForSkillRollOptions(_skillKey, skillDef, forcedAttribute) {
        const system = this.actor.system;
        const masteryRank = system.mastery?.rank || 2;
        // Players Guide skill-difficulty chapter (~1860–1879): Standard TN = 8 ×
        // Challenge MR (the GM-set difficulty), NOT 8 × the rolling actor's MR.
        // We default the Challenge to the actor's own MR so a self-test starts
        // at the familiar TN, but expose a 1–16 picker so any GM challenge MR
        // can be selected directly.
        const buildDifficulties = (challengeMR) => {
            const std = Math.max(1, Math.floor(challengeMR)) * 8;
            return {
                trivial: std - 8,
                easy: std - 4,
                standard: std,
                challenging: std + 4,
                hard: std + 8,
                veryHard: std + 12,
                heroic: std + 16,
            };
        };
        const challengeMR = Math.max(1, Math.min(16, masteryRank));
        const difficulties = buildDifficulties(challengeMR);
        const attrList = skillDef.attributes || [];
        const lockedAttr = forcedAttribute && attrList.map((a) => a.toLowerCase()).includes(forcedAttribute)
            ? attrList.find((a) => a.toLowerCase() === forcedAttribute) || forcedAttribute
            : null;
        const hasMultipleAttributes = attrList.length > 1 && !lockedAttr;
        const defaultAttribute = lockedAttr || attrList[0];
        // Players Guide full-pool / minimum-pool rules (~1880–1893):
        //   - The skill is only "on" if the rating is ≥ MR; with a smaller
        //     rating only **half the attribute** can roll (rounded down,
        //     never below 1) and the skill is unusable for spending.
        //   - The minimum pool floor is `max(attribute, MR)`.
        const skillRating = Number(system?.skills?.[_skillKey] ?? 0);
        const skillsSpent = Number(system?.skillsSpent?.[_skillKey] ?? 0);
        const remainingPool = Math.max(0, skillRating - skillsSpent);
        const fullPoolReady = skillRating >= masteryRank;
        const buildPoolPreview = (attr) => {
            const attrValue = Number(system?.attributes?.[attr]?.value ?? 0);
            const usableAttr = fullPoolReady ? attrValue : Math.max(1, Math.floor(attrValue / 2));
            const floored = Math.max(usableAttr, masteryRank);
            return { attrValue, usableAttr, floored };
        };
        const initialPreview = buildPoolPreview(defaultAttribute);
        const content = `
      <form class="mastery-dialog-form">
        ${hasMultipleAttributes ? `
          <div class="md-group">
            <label class="md-label">Attribute</label>
            <select name="attribute" id="skill-roll-attribute" class="md-select">
              ${skillDef.attributes.map((attr) => `
                <option value="${attr}" ${attr === defaultAttribute ? 'selected' : ''}>
                  ${attr.charAt(0).toUpperCase() + attr.slice(1)} (${system.attributes?.[attr]?.value || 0})
                </option>
              `).join('')}
            </select>
          </div>
        ` : `
          <input type="hidden" name="attribute" value="${defaultAttribute}" />
          <div class="md-group">
            <label class="md-label">Attribute</label>
            <div class="md-attr-display">
              ${defaultAttribute.charAt(0).toUpperCase() + defaultAttribute.slice(1)} (${system.attributes?.[defaultAttribute]?.value || 0})
            </div>
          </div>
        `}

        <div class="md-group">
          <label class="md-label">Skill Pool <span class="md-sublabel">(rating ${skillRating} / pool left ${remainingPool}; ≥ MR ${masteryRank} for full effect)</span></label>
          <div class="md-attr-display" id="skill-pool-status">
            ${fullPoolReady
            ? `Full pool — rolling ${initialPreview.floored}d8 (attribute ${initialPreview.attrValue}, MR floor ${masteryRank}).`
            : `Half pool only — skill rating ${skillRating} &lt; MR ${masteryRank}; rolling ${initialPreview.floored}d8 (⌊${initialPreview.attrValue}/2⌋ = ${initialPreview.usableAttr}, MR floor ${masteryRank}). No skill points may be spent.`}
          </div>
        </div>

        <div class="md-group">
          <label class="md-label">Challenge MR <span class="md-sublabel">(GM difficulty — Standard TN = 8 × Challenge MR)</span></label>
          <select name="challengeMR" id="skill-roll-challengeMR" class="md-select">
            ${Array.from({ length: 16 }, (_, i) => i + 1)
            .map((mr) => `<option value="${mr}" ${mr === challengeMR ? 'selected' : ''}>MR ${mr} (Standard ${mr * 8})</option>`)
            .join('')}
          </select>
        </div>

        <div class="md-group md-group-difficulty">
          <label class="md-label">Difficulty</label>
          <select name="baseTN" id="skill-roll-baseTN" class="md-select md-select-difficulty">
            <option value="trivial">Trivial (<span data-bucket="trivial">${difficulties.trivial}</span>)</option>
            <option value="easy">Easy (<span data-bucket="easy">${difficulties.easy}</span>)</option>
            <option value="standard" selected>Standard (<span data-bucket="standard">${difficulties.standard}</span>)</option>
            <option value="challenging">Challenging (<span data-bucket="challenging">${difficulties.challenging}</span>)</option>
            <option value="hard">Hard (<span data-bucket="hard">${difficulties.hard}</span>)</option>
            <option value="veryHard">Very Hard (<span data-bucket="veryHard">${difficulties.veryHard}</span>)</option>
            <option value="heroic">Heroic (<span data-bucket="heroic">${difficulties.heroic}</span>)</option>
            <option value="custom">Custom…</option>
          </select>
        </div>
        
        <div class="md-group" id="custom-tn-group" style="display: none;">
          <label class="md-label">Custom TN</label>
          <input type="number" name="customTN" id="skill-roll-customTN" value="${difficulties.standard}" min="0" step="1" class="md-input" />
        </div>
        
        <div class="md-group">
          <label class="md-label">Raises <span class="md-sublabel">(+4 TN each)</span></label>
          <input type="number" name="raises" id="skill-roll-raises" value="0" min="0" step="1" class="md-input" />
          <div class="md-final-tn">
            Final TN: <strong><span id="final-tn-display">${difficulties.standard}</span></strong>
          </div>
        </div>

        <div class="md-group">
          <label class="md-label">Auto-Raises <span class="md-sublabel">(−4 dice each, +1 raise on success)</span></label>
          <input type="number" name="autoRaises" id="skill-roll-auto-raises" value="0" min="0" step="1" class="md-input" />
          <div class="md-final-tn">
            Dice Pool: <strong><span id="auto-raise-pool-display">—</span></strong>
          </div>
        </div>
      </form>
    `;
        return new Promise((resolve) => {
            const dialog = new Dialog({
                title: `Roll ${skillDef.name}`,
                content,
                buttons: {
                    roll: {
                        label: '<i class="fas fa-dice-d20"></i> Roll',
                        callback: (html) => {
                            const attributeKey = html.find('[name="attribute"]').val();
                            const challengeMRVal = Math.max(1, Math.min(16, parseInt(html.find('[name="challengeMR"]').val()) || challengeMR));
                            const challengeBuckets = buildDifficulties(challengeMRVal);
                            const bucket = html.find('[name="baseTN"]').val();
                            let baseTN;
                            if (bucket === 'custom') {
                                baseTN = parseInt(html.find('[name="customTN"]').val()) || 0;
                            }
                            else {
                                baseTN =
                                    challengeBuckets[bucket] ?? challengeBuckets.standard;
                            }
                            const raises = parseInt(html.find('[name="raises"]').val()) || 0;
                            const finalTN = baseTN + (raises * 4);
                            const autoRaises = Math.max(0, parseInt(html.find('[name="autoRaises"]').val()) || 0);
                            resolve({
                                attributeKey,
                                baseTN,
                                raises,
                                finalTN,
                                autoRaises
                            });
                        }
                    },
                    cancel: {
                        label: 'Cancel',
                        callback: () => resolve(null)
                    }
                },
                default: 'roll',
                render: (html) => {
                    const $html = (html instanceof HTMLElement) ? $(html) : $(html);
                    // Apply dialog class
                    setTimeout(() => {
                        $html
                            .closest('.window-app.dialog')
                            .addClass('mastery-system mastery-roll-dialog mastery-skill-roll-dialog');
                    }, 0);
                    $html.find('[name="baseTN"]').on('change', function () {
                        const isCustom = $(this).val() === 'custom';
                        $html.find('#custom-tn-group').toggle(isCustom);
                    });
                    const refreshDifficultyLabels = () => {
                        const mr = Math.max(1, Math.min(16, parseInt($html.find('[name="challengeMR"]').val()) || challengeMR));
                        const buckets = buildDifficulties(mr);
                        for (const key of Object.keys(buckets)) {
                            $html.find(`[data-bucket="${key}"]`).text(String(buckets[key]));
                        }
                        const customField = $html.find('[name="customTN"]');
                        if (!customField.is(':focus'))
                            customField.val(String(buckets.standard));
                    };
                    const updateFinalTN = () => {
                        const mr = Math.max(1, Math.min(16, parseInt($html.find('[name="challengeMR"]').val()) || challengeMR));
                        const buckets = buildDifficulties(mr);
                        const bucket = $html.find('[name="baseTN"]').val();
                        let baseTN;
                        if (bucket === 'custom') {
                            baseTN = parseInt($html.find('[name="customTN"]').val()) || 0;
                        }
                        else {
                            baseTN = buckets[bucket] ?? buckets.standard;
                        }
                        const raises = parseInt($html.find('[name="raises"]').val()) || 0;
                        const finalTN = baseTN + (raises * 4);
                        $html.find('#final-tn-display').text(finalTN);
                    };
                    const updateAutoRaisePool = () => {
                        const attr = $html.find('[name="attribute"]').val() || defaultAttribute;
                        const preview = buildPoolPreview(attr);
                        const autoRaises = Math.max(0, parseInt($html.find('[name="autoRaises"]').val()) || 0);
                        const cost = autoRaises * 4;
                        const baseAfterFloor = preview.floored;
                        const finalPool = Math.max(1, baseAfterFloor - cost);
                        const text = autoRaises > 0
                            ? `${baseAfterFloor} − ${cost} = ${finalPool}d8 (+${autoRaises} auto raise${autoRaises > 1 ? 's' : ''})`
                            : `${baseAfterFloor}d8`;
                        $html.find('#auto-raise-pool-display').text(text);
                        $html.find('#skill-pool-status').text(fullPoolReady
                            ? `Full pool — rolling ${preview.floored}d8 (attribute ${preview.attrValue}, MR floor ${masteryRank}).`
                            : `Half pool only — skill rating ${skillRating} < MR ${masteryRank}; rolling ${preview.floored}d8 (⌊${preview.attrValue}/2⌋ = ${preview.usableAttr}, MR floor ${masteryRank}). No skill points may be spent.`);
                    };
                    $html
                        .find('[name="baseTN"], [name="customTN"], [name="raises"], [name="challengeMR"]')
                        .on('change input', updateFinalTN);
                    $html.find('[name="challengeMR"]').on('change input', refreshDifficultyLabels);
                    $html.find('[name="attribute"], [name="autoRaises"]').on('change input', updateAutoRaisePool);
                    refreshDifficultyLabels();
                    updateFinalTN();
                    updateAutoRaisePool();
                }
            }, {
                width: 600,
                height: 440,
                resizable: true
            });
            dialog.render(true);
        });
    }
    /**
     * Handle Echo Card "Use" button.
     *
     * - Validates that the card is currently selected and not already used today.
     * - Posts a narrative ChatMessage (with optional flashback).
     * - Opens the standard Skill Roll dialog pre-tuned to the card option's skill.
     * - On a completed (non-cancelled) roll, marks the card as used for today.
     */
    async #onEchoRoll(event) {
        event.preventDefault();
        const el = event.currentTarget;
        const cardId = el?.dataset?.cardId || '';
        const optionId = el?.dataset?.optionId || '';
        if (!cardId || !optionId) {
            ui.notifications?.error('Missing card or option id on Echo roll.');
            return;
        }
        const system = this.actor.system;
        const echo = system?.echo || {};
        const echoKey = echo.key;
        if (!echoKey) {
            ui.notifications?.warn('No Echo selected for this character.');
            return;
        }
        const selectedCardIds = Array.isArray(echo.selectedCardIds) ? echo.selectedCardIds : [];
        if (!selectedCardIds.includes(cardId)) {
            ui.notifications?.error('That Echo card is not part of your deck.');
            return;
        }
        const cardUses = (echo.cardUses || {});
        if (cardUses[cardId] === true) {
            ui.notifications?.warn('Card already used today. It restores on the next Safe Haven Rest.');
            return;
        }
        const card = getEchoCard(echoKey, cardId);
        const option = getCardOption(echoKey, cardId, optionId);
        if (!card || !option) {
            ui.notifications?.error('Echo card option not found.');
            return;
        }
        const skillDef = SKILLS[option.skill];
        if (!skillDef) {
            ui.notifications?.error(`Skill "${option.skill}" for Echo card is not defined.`);
            return;
        }
        // Narrative flashback: post a chat message before the roll.
        const def = getEcho(echoKey);
        const echoName = def?.name || echoKey;
        await ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor: this.actor }),
            content: `
        <div class="echo-roll-flavor">
          <div><strong>${echoName} \u2014 ${card.name}</strong></div>
          <div><em>${option.label}</em></div>
          <div class="echo-roll-desc">${option.description}</div>
        </div>
      `
        });
        const rollOptions = await this.#promptForSkillRollOptions(option.skill, skillDef);
        if (!rollOptions)
            return;
        const attributeValue = system.attributes?.[rollOptions.attributeKey]?.value || 0;
        const masteryRank = system.mastery?.rank || 2;
        let numDice = attributeValue;
        let equipPenaltyFlavor = '';
        if (skillDef.category === SKILL_CATEGORIES.PHYSICAL) {
            const penDice = getEquippedPhysicalSkillPenaltyDice(this.actor);
            if (penDice > 0) {
                numDice = Math.max(1, numDice - penDice);
                equipPenaltyFlavor = ` Equipped armor/shield physical penalty: \u2212${penDice}d8 (rolling ${numDice} dice).`;
            }
        }
        const { masteryRoll } = await import('../dice/roll-handler.js');
        await masteryRoll({
            numDice,
            keepDice: masteryRank,
            skill: 0,
            tn: rollOptions.finalTN,
            label: `Echo: ${card.name} \u2014 ${option.label}`,
            flavor: `Attribute: ${rollOptions.attributeKey.charAt(0).toUpperCase() + rollOptions.attributeKey.slice(1)}, Base TN: ${rollOptions.baseTN}, Raises: ${rollOptions.raises}. Skill: ${skillDef.name}.${equipPenaltyFlavor}`,
            actorId: this.actor.id,
            skillKey: option.skill,
            isSkillRoll: true,
            baseModifier: 0,
            rollKind: 'skill',
            autoFailIntent: 'skill',
            checkContext: { skillKey: option.skill },
            autoRaises: rollOptions.autoRaises
        });
        await this.actor.update({
            [`system.echo.cardUses.${cardId}`]: true
        });
        this.render();
    }
    /**
     * Handle Safe Haven Rest - reset all skillsSpent to 0
     */
    async #onSafeHavenRest(event) {
        event.preventDefault();
        // Check if user is owner
        if (!this.actor.isOwner) {
            ui.notifications?.warn('Only the owner can use Safe Haven Rest.');
            return;
        }
        const { SKILLS } = await import('../utils/skills.js');
        const skillsSpent = {};
        // Reset all skills to 0 spent
        for (const skillKey of Object.keys(SKILLS)) {
            skillsSpent[skillKey] = 0;
        }
        // Also reset any existing skills in actor.system.skills
        const system = this.actor.system;
        if (system.skills && typeof system.skills === 'object') {
            for (const skillKey of Object.keys(system.skills)) {
                if (!skillsSpent.hasOwnProperty(skillKey)) {
                    skillsSpent[skillKey] = 0;
                }
            }
        }
        const faithMax = Math.max(0, Number(system.faithFractures?.maximum) || 0);
        // --- Echo reset -----------------------------------------------------------
        const echo = system.echo || {};
        const masteryRank = Math.max(1, Number(system?.mastery?.rank) || 1);
        const echoUpdates = {};
        let echoChanged = false;
        if (echo && echo.key) {
            echoUpdates['system.echo.cardUses'] = {};
            echoUpdates['system.echo.traitUses'] = buildFreshTraitUses(echo.key, echo.subChoiceKey || null, masteryRank);
            echoChanged = true;
        }
        // Players Guide ~6998+ Safe Haven Rest:
        //  • All HP bars topped to max, including Incapacitated.
        //  • All Stress bars cleared.
        //  • All Scarred bars cleared.
        //  • Mastery Charges reset to MR.
        //  • Sealed / Lost / Bound stones release back to the Stone pool.
        //  • Stone-Bound forms revert.
        //  • Skills, Vitality save uses, Faith Fractures and Echo uses refresh.
        const updates = {
            'system.skillsSpent': skillsSpent,
            'system.saves.vitalitySpent': 0,
            'system.saves.vitalityUsesRemaining': 4,
            ...(faithMax > 0 ? { 'system.faithFractures.current': faithMax } : {}),
            ...echoUpdates,
        };
        // HP bars — restore every bar to its max (including Incapacitated which
        // is a single box). Tempt-HP and Scarred slots are cleared too.
        const hpBars = Array.isArray(system?.health?.bars) ? system.health.bars : [];
        if (hpBars.length > 0) {
            const restoredBars = hpBars.map((b) => ({ ...b, current: b.max }));
            updates['system.health.bars'] = restoredBars;
            updates['system.health.currentBar'] = 0;
            updates['system.health.tempHP'] = 0;
            // Scarred slots (when present) end at the same time.
            updates['system.health.scarred'] = 0;
        }
        // Stress bars — Players Guide ~6493: a Safe Haven Rest fully clears
        // both the active stress total and the scarred stress reservoir.
        const stressBars = Array.isArray(system?.stress?.bars) ? system.stress.bars : [];
        if (stressBars.length > 0) {
            const restoredStress = stressBars.map((b) => ({ ...b, current: b.max }));
            updates['system.stress.bars'] = restoredStress;
            updates['system.stress.currentBar'] = 0;
            updates['system.stress.scarred'] = 0;
        }
        // Mastery Charges — Players Guide rest chapter: reset to Mastery Rank.
        if (system?.mastery && Object.prototype.hasOwnProperty.call(system.mastery, 'charges')) {
            updates['system.mastery.charges'] = masteryRank;
        }
        // Sealed / Lost / Bound stones — Safe Haven Rest releases all of them.
        if (system?.stones) {
            if (Object.prototype.hasOwnProperty.call(system.stones, 'sealed')) {
                updates['system.stones.sealed'] = 0;
            }
            if (Object.prototype.hasOwnProperty.call(system.stones, 'lost')) {
                updates['system.stones.lost'] = 0;
            }
            if (Object.prototype.hasOwnProperty.call(system.stones, 'bound')) {
                updates['system.stones.bound'] = 0;
            }
            if (Object.prototype.hasOwnProperty.call(system.stones, 'bondedFormActive')) {
                updates['system.stones.bondedFormActive'] = false;
            }
        }
        // Status effects — diminishing & timed effects all end on a long rest.
        if (Array.isArray(system?.statusEffects) && system.statusEffects.length > 0) {
            updates['system.statusEffects'] = [];
        }
        // Blood Raise HP loss flag — combat-specific; clear so future healing
        // is not blocked by the leftover marker.
        try {
            if (this.actor.getFlag?.('mastery-system', 'bloodRaiseHpLost') != null) {
                await this.actor.unsetFlag?.('mastery-system', 'bloodRaiseHpLost');
            }
        }
        catch (err) {
            console.warn('Mastery System | Safe Haven blood raise flag clear failed', err);
        }
        await this.actor.update(updates);
        console.log('Mastery System | Safe Haven Rest: Full restoration applied', {
            actorId: this.actor.id,
            actorName: this.actor.name,
            skillsReset: Object.keys(skillsSpent).length,
            echoReset: echoChanged,
            hpBarsRestored: hpBars.length,
            stressBarsRestored: stressBars.length,
            masteryChargesReset: !!system?.mastery && Object.prototype.hasOwnProperty.call(system.mastery, 'charges'),
            stonesReleased: !!system?.stones,
        });
        ui.notifications?.info('Safe Haven Rest: HP, Stress, Scars, Stones, Mastery Charges, Skills, Vitality saves, Faith Fractures and Echo uses fully restored.');
        this.render();
    }
    /**
     * GM: restore +1 Faith Fracture for good disadvantage roleplay (capped at maximum).
     */
    async #onGmAwardFaithFracture(event) {
        event.preventDefault();
        if (!game.user?.isGM) {
            ui.notifications?.warn('Only a GM can award Faith Fractures.');
            return;
        }
        const system = this.actor.system;
        const max = Math.max(0, Number(system.faithFractures?.maximum) || 0);
        const cur = Math.max(0, Number(system.faithFractures?.current) || 0);
        if (max <= 0) {
            ui.notifications?.warn('This actor has no Faith Fracture pool (maximum is 0).');
            return;
        }
        if (cur >= max) {
            ui.notifications?.info(`${this.actor.name} is already at maximum Faith Fractures (${max}).`);
            return;
        }
        await this.actor.update({ 'system.faithFractures.current': cur + 1 });
        ui.notifications?.info(`${this.actor.name}: +1 Faith Fracture (${cur + 1}/${max}).`);
        this.render();
    }
    /**
     * Handle saving throw roll
     * Per Player's Guide: Roll higher of two attributes in category, keep MR.
     * Body = max(Might, Agility), Mind = max(Intellect, Wits), Spirit = max(Resolve, Influence)
     * DC = source MR × 8 (prompted from user)
     */
    async #onSavingThrowRoll(event) {
        event.preventDefault();
        const element = event.currentTarget;
        const saveType = element.dataset.saveType; // 'body', 'mind', or 'spirit'
        if (!saveType)
            return;
        const actorData = this.actor.system;
        let numDice;
        let usedAttr1;
        let usedAttr2;
        let chosenAttr;
        if (saveType === 'body') {
            const might = actorData.attributes?.might?.value || 2;
            const agility = actorData.attributes?.agility?.value || 2;
            numDice = Math.max(might, agility);
            usedAttr1 = `Might ${might}`;
            usedAttr2 = `Agility ${agility}`;
            chosenAttr = might >= agility ? 'Might' : 'Agility';
        }
        else if (saveType === 'mind') {
            const intellect = actorData.attributes?.intellect?.value || 2;
            const wits = actorData.attributes?.wits?.value || 2;
            numDice = Math.max(intellect, wits);
            usedAttr1 = `Intellect ${intellect}`;
            usedAttr2 = `Wits ${wits}`;
            chosenAttr = intellect >= wits ? 'Intellect' : 'Wits';
        }
        else if (saveType === 'spirit') {
            const resolve = actorData.attributes?.resolve?.value || 2;
            const influence = actorData.attributes?.influence?.value || 2;
            numDice = Math.max(resolve, influence);
            usedAttr1 = `Resolve ${resolve}`;
            usedAttr2 = `Influence ${influence}`;
            chosenAttr = resolve >= influence ? 'Resolve' : 'Influence';
        }
        else {
            return;
        }
        const keepDice = actorData.mastery?.rank || 2;
        // Players Guide minimum-pool rule (~5888–5899).
        numDice = Math.max(numDice, keepDice);
        const { getCurrentPenalty } = await import('../utils/calculations.js');
        const healthBars = actorData.health?.bars || [];
        const currentBar = actorData.health?.currentBar ?? 0;
        const healthPenalty = getCurrentPenalty(healthBars, currentBar, numDice);
        numDice = Math.max(1, numDice + healthPenalty);
        const tn = await this.#promptForTN();
        if (tn === null)
            return;
        const saveName = saveType.charAt(0).toUpperCase() + saveType.slice(1);
        let flavorText = `Using ${chosenAttr} (${usedAttr1} / ${usedAttr2})`;
        if (healthPenalty < 0) {
            flavorText += ` | Health penalty: ${healthPenalty} dice`;
        }
        const saveRollKind = saveType === 'body' ? 'saveBody' :
            saveType === 'mind' ? 'saveMind' : 'saveSpirit';
        const { masteryRoll } = await import('../dice/roll-handler.js');
        await masteryRoll({
            numDice,
            keepDice,
            skill: 0,
            tn,
            label: `${saveName} Save`,
            flavor: flavorText,
            actorId: this.actor.id,
            isSaveRoll: true,
            rollKind: saveRollKind
        });
    }
    /**
     * Handle spending XP on skills.
     *
     * New spec: Skills use the same banded XP table as Attributes
     * (1 / 2 / … / 10 XP per +1, by band). Each Skill may be increased by
     * at most +1 per Upgrade Step.
     */
    async #onSkillSpendPoint(event) {
        event.preventDefault();
        // Check if user is owner
        if (!this.actor.isOwner) {
            ui.notifications?.warn('Only the owner can spend XP.');
            return;
        }
        const element = event.currentTarget;
        const skillKey = element.dataset.skill;
        if (!skillKey)
            return;
        const currentRaw = this.actor.system.skills?.[skillKey] ?? 0;
        const current = Number(currentRaw) || 0;
        const pending = this._pendingSkillRankChanges[skillKey] || 0;
        const effective = current + pending;
        const masteryRank = this.actor.system.mastery?.rank || 2;
        const maxSkill = calculateMaxSkillRank(masteryRank);
        if (effective >= maxSkill) {
            ui.notifications?.warn(`${skillKey} cannot exceed ${maxSkill} at Mastery Rank ${masteryRank} (MR × 4).`);
            return;
        }
        // Once-per-step rule (skipped during the Free-XP phase).
        if (!this.#hasFreeXp()) {
            if (pending + 1 > 1) {
                ui.notifications?.warn(`${skillKey} can only be increased by +1 per Upgrade Step. End the current step first to increase it again.`);
                return;
            }
            const stepRule = await import('../utils/xp-step-rule.js');
            const step = stepRule.readStep(this.actor);
            if (pending + 1 > 0 && stepRule.isBumped(step, 'skill', skillKey)) {
                ui.notifications?.warn(`${skillKey} was already increased this Upgrade Step. End the current step first to increase it again.`);
                return;
            }
        }
        const simulateMap = { ...this._pendingSkillRankChanges, [skillKey]: pending + 1 };
        const netCost = this.#calculateSkillPendingNetCost(simulateMap);
        // Combined spendable XP (Free pool is spent first, then regular).
        const availableXP = (this.actor.system.points?.xp || 0) + (this.actor.system.points?.xpFree || 0);
        if (netCost > availableXP) {
            const nextCost = attributeBandCost(effective + 1);
            ui.notifications?.warn(`Not enough XP! This increase would cost ${nextCost} XP, but you only have ${availableXP}.`);
            return;
        }
        this._pendingSkillRankChanges[skillKey] = pending + 1;
        if (this._pendingSkillRankChanges[skillKey] === 0)
            delete this._pendingSkillRankChanges[skillKey];
        this.#updateSkillXPUI();
    }
    /**
     * Decrease a skill rank and refund XP
     * Refund model: dropping from rank R -> R-1 refunds the banded XP cost of R (reverse of buy cost).
     */
    async #onSkillRefundPoint(event) {
        event.preventDefault();
        event.stopPropagation();
        // Check if user is owner
        if (!this.actor.isOwner) {
            ui.notifications?.warn('Only the owner can adjust skills.');
            return;
        }
        const element = event.currentTarget;
        const skillKey = element.dataset?.skill;
        if (!skillKey)
            return;
        const currentRaw = this.actor.system.skills?.[skillKey] ?? 0;
        const current = Number(currentRaw) || 0;
        const pending = this._pendingSkillRankChanges[skillKey] || 0;
        const effective = current + pending;
        if (effective <= 0)
            return;
        this._pendingSkillRankChanges[skillKey] = pending - 1;
        if (this._pendingSkillRankChanges[skillKey] === 0)
            delete this._pendingSkillRankChanges[skillKey];
        this.#updateSkillXPUI();
    }
    /**
     * Calculate net pending cost (signed) for all pending skill rank changes.
     *
     * New spec: Skills use the banded Attribute table — `attributeBandCost(R)`
     * is the XP cost of buying rank R. Refunds are symmetric.
     */
    #calculateSkillPendingNetCost(pendingMap) {
        return calculateSkillPendingNetCost(this.actor, pendingMap);
    }
    /** Net XP cost (positive) or refund (negative) for one skill's pending rank delta only. */
    #calculateSingleSkillPendingXpNet(skillKey, pending) {
        return calculateSingleSkillPendingXpNet(this.actor, skillKey, pending);
    }
    /**
     * Update the skill XP distribution UI (pending/remaining + enable/disable buttons)
     */
    #updateSkillXPUI() {
        const html = this.element;
        // Combined spendable XP (Free pool is spent first, then regular).
        const availableXP = (this.actor.system.points?.xp || 0) + (this.actor.system.points?.xpFree || 0);
        const netPendingCost = this.#calculateSkillPendingNetCost(this._pendingSkillRankChanges);
        const remainingXP = availableXP - netPendingCost;
        this.#setHeaderXpDisplay(remainingXP);
        const totalPendingChanges = Object.values(this._pendingSkillRankChanges).reduce((sum, v) => sum + Math.abs(v), 0);
        html.find('#pending-skill-changes-count').text(String(totalPendingChanges));
        html.find('#remaining-skill-xp').text(String(Math.max(0, remainingXP)));
        const netSummary = html.find('#pending-skill-xp-net');
        if (netSummary.length) {
            if (netPendingCost === 0) {
                netSummary.text('0');
            }
            else if (netPendingCost > 0) {
                netSummary.text(`−${netPendingCost} spend`);
            }
            else {
                netSummary.text(`+${Math.abs(netPendingCost)} refund`);
            }
        }
        // Enable/disable confirm/cancel
        const confirmBtn = html.find('#confirm-skill-changes-btn');
        const cancelBtn = html.find('#cancel-skill-changes-btn');
        confirmBtn.prop('disabled', totalPendingChanges <= 0);
        cancelBtn.prop('disabled', totalPendingChanges <= 0);
        // Enable/disable per-skill +/- buttons + per-row pending labels
        const masteryRank = this.actor.system.mastery?.rank || 2;
        const maxSkill = calculateMaxSkillRank(masteryRank);
        const bumpedSkills = new Set(Array.isArray(this.actor.system?.xp?.currentStep?.skills)
            ? this.actor.system.xp.currentStep.skills.map((v) => String(v ?? ''))
            : []);
        for (const skillKey of Object.keys(SKILLS)) {
            const currentRaw = this.actor.system.skills?.[skillKey] ?? 0;
            const current = Number(currentRaw) || 0;
            const pending = this._pendingSkillRankChanges[skillKey] || 0;
            const effective = current + pending;
            const minusBtn = html.find(`.skill-refund-point[data-skill="${skillKey}"]`);
            minusBtn.prop('disabled', effective <= 0);
            const plusBtn = html.find(`.skill-spend-point[data-skill="${skillKey}"]`);
            const nextPending = pending + 1;
            // Free-XP phase: spend freely (no per-step cap).
            const wouldExceedStepCap = !this.#hasFreeXp() &&
                (nextPending > 1 || (nextPending > 0 && bumpedSkills.has(skillKey)));
            if (effective >= maxSkill || wouldExceedStepCap) {
                plusBtn.prop('disabled', true);
                if (wouldExceedStepCap) {
                    plusBtn.attr('title', this.#hasFreeXp()
                        ? ''
                        : 'Bereits in diesem Upgrade Step erhöht. GM: Step beenden (Flagge) oder Free XP (★) für freie Verteilung.');
                }
            }
            else {
                plusBtn.removeAttr('title');
                if (this.#hasFreeXp()) {
                    plusBtn.attr('title', 'Free XP aktiv — frei verteilbar (kein Step-Limit).');
                }
                const simulateMap = { ...this._pendingSkillRankChanges, [skillKey]: nextPending };
                const simulateNet = this.#calculateSkillPendingNetCost(simulateMap);
                plusBtn.prop('disabled', simulateNet > availableXP);
            }
            const pendingLine = html.find(`.skill-pending-xp[data-skill="${skillKey}"]`);
            const rankBadge = html.find(`.skill-rank-pending-badge[data-skill="${skillKey}"]`);
            if (pending === 0) {
                pendingLine.text('').removeClass('has-pending').attr('title', 'XP reserved on this skill until Confirm');
                rankBadge.text('');
            }
            else {
                const xpNet = this.#calculateSingleSkillPendingXpNet(skillKey, pending);
                const rankLabel = pending > 0
                    ? `+${pending} rank${pending === 1 ? '' : 's'}`
                    : `${pending} rank${pending === -1 ? '' : 's'}`;
                let xpLabel = '';
                if (xpNet > 0) {
                    xpLabel = ` · ${xpNet} XP`;
                }
                else if (xpNet < 0) {
                    xpLabel = ` · +${Math.abs(xpNet)} XP back`;
                }
                pendingLine.text(`${rankLabel}${xpLabel}`).addClass('has-pending');
                rankBadge.text(`→${effective}`);
            }
        }
    }
    /**
     * Confirm and apply pending skill rank changes
     */
    async #onConfirmSkillChanges(event) {
        event.preventDefault();
        event.stopPropagation();
        if (!this.actor.isOwner) {
            ui.notifications?.warn('Only the owner can confirm Skill changes.');
            return;
        }
        const xpState = this.#getXpState(this.actor);
        const availableXP = xpState.available; // combined Free + regular
        const netCost = this.#calculateSkillPendingNetCost(this._pendingSkillRankChanges);
        if (netCost > availableXP) {
            ui.notifications?.error(`Not enough XP! Net cost: ${netCost}, Available: ${availableXP}`);
            return;
        }
        const masteryRank = this.actor.system.mastery?.rank || 2;
        const maxSkill = calculateMaxSkillRank(masteryRank);
        const updates = {};
        const changes = [];
        for (const [skillKey, pending] of Object.entries(this._pendingSkillRankChanges)) {
            if (!pending)
                continue;
            const currentRaw = this.actor.system.skills?.[skillKey] ?? 0;
            const current = Number(currentRaw) || 0;
            const desired = current + pending;
            if (pending > 0 && desired > maxSkill) {
                ui.notifications?.error(`${skillKey} cannot exceed ${maxSkill} at Mastery Rank ${masteryRank} (MR × 4).`);
                return;
            }
            const target = Math.max(0, Math.min(maxSkill, desired));
            if (target === current)
                continue;
            updates[`system.skills.${skillKey}`] = target;
            changes.push({
                skillKey,
                from: current,
                to: target,
                delta: pending,
                cost: this.#calculateSingleSkillPendingXpNet(skillKey, pending),
            });
        }
        /**
         * New spec — once-per-step rule. Each Skill may only be increased by
         * +1 per Upgrade Step. Mark each positively-bumped skill; un-bump on
         * refund.
         */
        const stepRuleSk = await import('../utils/xp-step-rule.js');
        let stepAfterSk = stepRuleSk.readStep(this.actor);
        // Free-XP phase: do not enforce or record per-step bumps.
        const unrestrictedSk = this.#hasFreeXp();
        for (const change of changes) {
            if (unrestrictedSk)
                continue;
            if (change.delta > 0) {
                if (stepRuleSk.isBumped(stepAfterSk, 'skill', change.skillKey)) {
                    ui.notifications?.error(`Step rule: ${change.skillKey} was already increased this Upgrade Step. End the current step first.`);
                    return;
                }
                stepAfterSk = stepRuleSk.recordBump(stepAfterSk, 'skill', change.skillKey);
            }
            else if (change.delta < 0) {
                stepAfterSk = stepRuleSk.undoBump(stepAfterSk, 'skill', change.skillKey);
            }
        }
        // Two-pool accounting: Free XP is spent before regular XP.
        const acctSk = this.#applyXpCost(xpState, netCost);
        updates['system.points.xp'] = acctSk.pointsXp;
        updates['system.points.xpFree'] = acctSk.pointsXpFree;
        updates['system.xp.totalSpent'] = acctSk.totalSpent;
        updates['system.xp.freeSpent'] = acctSk.freeSpent;
        updates['system.xp.currentStep.attributes'] = [...stepAfterSk.attributes];
        updates['system.xp.currentStep.skills'] = [...stepAfterSk.skills];
        updates['system.xp.currentStep.powers'] = [...stepAfterSk.powers];
        updates['system.xp.currentStep.artifacts'] = [...stepAfterSk.artifacts];
        if (!this.actor.system.xp) {
            updates['system.xp.totalEarned'] = xpState.totalEarned;
            updates['system.xp.history'] = [];
        }
        const beforeState = {
            available: xpState.available,
            totalEarned: xpState.totalEarned,
            totalSpent: xpState.totalSpent,
        };
        await this.actor.update(updates);
        if (netCost !== 0) {
            const user = game.user;
            const historyEntry = {
                ts: Date.now(),
                userId: user?.id || '',
                userName: user?.name || 'System',
                kind: (netCost > 0 ? 'spend' : 'adjust'),
                category: 'skill',
                amount: Math.abs(netCost),
                details: { changes, netCost },
                note: netCost < 0 ? 'refund via downgrade' : undefined,
                before: beforeState,
                after: {
                    available: availableXP - netCost,
                    totalEarned: xpState.totalEarned,
                    totalSpent: acctSk.totalSpent,
                }
            };
            this.#pushXpHistory(this.actor, historyEntry);
            await this.actor.update({ 'system.xp.history': this.actor.system.xp.history });
        }
        this._pendingSkillRankChanges = {};
        await this.render();
    }
    /**
     * Cancel pending skill rank changes
     */
    #onCancelSkillChanges(event) {
        event.preventDefault();
        event.stopPropagation();
        this._pendingSkillRankChanges = {};
        this.#updateSkillXPUI();
        ui.notifications?.info('Pending skill changes cancelled.');
    }
    /**
     * Prompt for Target Number
     */
    async #promptForTN() {
        const system = this.actor.system;
        const masteryRank = system.mastery?.rank || 2;
        const standardTN = masteryRank * 8;
        const presets = [
            { label: 'Trivial', value: standardTN - 8 },
            { label: 'Easy', value: standardTN - 4 },
            { label: 'Standard', value: standardTN },
            { label: 'Challenging', value: standardTN + 4 },
            { label: 'Hard', value: standardTN + 8 },
            { label: 'Very Hard', value: standardTN + 12 },
            { label: 'Heroic', value: standardTN + 16 },
        ];
        const content = `
      <form class="mastery-dialog-form">
        <div class="md-group">
          <label class="md-label">Target Number</label>
          <input type="number" name="tn" value="${standardTN}" step="1" min="0" class="md-input" />
        </div>
        <div class="md-group">
          <label class="md-label">Quick Select</label>
          <div class="md-tn-presets">
            ${presets.map(p => `<button type="button" class="md-tn-btn${p.value === standardTN ? ' active' : ''}" data-tn="${p.value}">${p.label} (${p.value})</button>`).join('')}
          </div>
        </div>
      </form>
    `;
        return new Promise((resolve) => {
            new Dialog({
                title: 'Set Target Number',
                content,
                buttons: {
                    roll: {
                        label: '<i class="fas fa-dice-d20"></i> Roll',
                        callback: (html) => {
                            const $html = (html instanceof HTMLElement) ? $(html) : $(html);
                            const tn = parseInt($html.find('[name="tn"]').val());
                            resolve(tn);
                        }
                    },
                    cancel: {
                        label: 'Cancel',
                        callback: () => resolve(null)
                    }
                },
                default: 'roll',
                render: (html) => {
                    const $html = (html instanceof HTMLElement) ? $(html) : $(html);
                    setTimeout(() => {
                        $html.closest('.window-app.dialog').addClass('mastery-system mastery-roll-dialog');
                    }, 0);
                    $html.find('.md-tn-btn').on('click', (event) => {
                        const tn = event.currentTarget.dataset.tn;
                        if (tn) {
                            $html.find('[name="tn"]').val(tn);
                            $html.find('.md-tn-btn').removeClass('active');
                            $(event.currentTarget).addClass('active');
                        }
                    });
                    $html.find('[name="tn"]').on('input', () => {
                        $html.find('.md-tn-btn').removeClass('active');
                    });
                }
            }).render(true);
        });
    }
    /**
     * Add a new skill
     */
    async #onSkillAdd(event) {
        event.preventDefault();
        const skillName = await this.#promptForSkillName();
        if (!skillName)
            return;
        await this.actor.update({
            [`system.skills.${skillName}`]: 0
        });
    }
    /**
     * Prompt for skill name
     */
    async #promptForSkillName() {
        return new Promise((resolve) => {
            new Dialog({
                title: 'Add Skill',
                content: `
          <form>
            <div class="form-group">
              <label>Skill Name:</label>
              <input type="text" name="skillName" placeholder="Enter skill name"/>
            </div>
          </form>
        `,
                buttons: {
                    add: {
                        label: 'Add',
                        callback: (html) => {
                            const name = html.find('[name="skillName"]').val();
                            resolve(name.trim() || null);
                        }
                    },
                    cancel: {
                        label: 'Cancel',
                        callback: () => resolve(null)
                    }
                },
                default: 'add'
            }).render(true);
        });
    }
    /**
     * Delete a skill
     */
    async #onSkillDelete(event) {
        event.preventDefault();
        const element = event.currentTarget;
        const skill = element.dataset.skill;
        if (!skill)
            return;
        const confirmed = await Dialog.confirm({
            title: 'Delete Skill',
            content: `<p>Are you sure you want to delete the <strong>${skill}</strong> skill?</p>`
        });
        if (confirmed) {
            const skills = foundry.utils.deepClone(this.actor.system.skills);
            delete skills[skill];
            await this.actor.update({ 'system.skills': skills });
        }
    }
    /**
     * Use a power
     */
    async #onPowerUse(event) {
        event.preventDefault();
        const element = event.currentTarget;
        const itemId = element.dataset.itemId || element.dataset.powerId;
        const item = this.actor.items.get(itemId);
        if (!item)
            return;
        // Check if this is an active buff
        const { isActiveBuff, activateActiveBuff, isPowerActiveAsBuff } = await import('../utils/active-buffs.js');
        if (isActiveBuff(item)) {
            // Check if already active
            if (isPowerActiveAsBuff(this.actor, item.id)) {
                ui.notifications?.warn(`${item.name} is already active!`);
                return;
            }
            // Activate the buff
            const success = await activateActiveBuff(this.actor, item);
            if (success) {
                // Re-render to show the active buff
                this.render();
            }
            return;
        }
        // For non-buff powers, show notification (actual attack/utility logic handled elsewhere)
        ui.notifications?.info(`Using power: ${item.name}`);
    }
    /**
     * Toggle power details expansion
     */
    #onActiveBuffRemove(event) {
        event.preventDefault();
        event.stopPropagation();
        const element = event.currentTarget;
        const effectId = element.dataset.effectId;
        if (!effectId) {
            ui.notifications?.warn('No effect ID found.');
            return;
        }
        const effect = this.actor.effects.get(effectId);
        if (!effect) {
            ui.notifications?.warn('Effect not found.');
            return;
        }
        effect.delete().then(() => {
            this.render();
            ui.notifications?.info(`${effect.name} removed.`);
        }).catch((error) => {
            console.error('Mastery System | Failed to remove active buff', error);
            ui.notifications?.error('Failed to remove active buff.');
        });
    }
    async #onPowerDisplayNameChange(event) {
        const el = event.currentTarget;
        if (!el)
            return;
        const itemId = el.getAttribute('data-item-id');
        if (!itemId)
            return;
        const item = this.actor.items.get(itemId);
        if (!item || item.type !== 'power')
            return;
        const next = el.value.trim();
        if (!next) {
            el.value = item.name;
            ui.notifications?.warn('Power name cannot be empty.');
            return;
        }
        if (next === item.name)
            return;
        try {
            await item.update({ name: next });
        }
        catch (e) {
            console.error('Mastery System | Failed to rename power', e);
            el.value = item.name;
            ui.notifications?.error('Could not rename power.');
        }
    }
    async #onPowerEditMechanics(event) {
        event.preventDefault();
        event.stopPropagation();
        if (!event.currentTarget)
            return;
        const $button = $(event.currentTarget);
        const itemId = $button.attr('data-item-id') || $button.data('item-id') || $button.data('itemId');
        if (!itemId) {
            ui.notifications?.warn('Could not resolve power id for mechanics editor.');
            return;
        }
        const actor = this.actor;
        const power = actor?.items?.get?.(itemId)
            ?? (Array.isArray(actor?.items) ? actor.items.find((i) => i.id === itemId) : null);
        if (!power) {
            ui.notifications?.warn('Power not found on this actor.');
            return;
        }
        const { openPowerMechanicsEditor } = await import('./power-mechanics-editor-dialog.js');
        await openPowerMechanicsEditor({ actor, power });
    }
    #onPowerToggleDetails(event) {
        event.preventDefault();
        event.stopPropagation();
        console.log('Mastery System | [TOGGLE DETAILS] Handler called', {
            currentTarget: event.currentTarget,
            target: event.target
        });
        // Safety check for null event target
        if (!event.currentTarget) {
            console.error('Mastery System | [TOGGLE DETAILS] event.currentTarget is null');
            return;
        }
        const $button = $(event.currentTarget);
        console.log('Mastery System | [TOGGLE DETAILS] Button jQuery object', {
            buttonLength: $button.length,
            buttonIsJQuery: $button instanceof jQuery
        });
        // Try multiple methods to get the item ID - prioritize button's own data attribute
        let itemId = $button.attr('data-item-id') ||
            $button.data('item-id') ||
            $button.data('itemId');
        // If still not found, try to get from the button element directly
        if (!itemId && event.currentTarget) {
            const buttonElement = event.currentTarget;
            if (buttonElement) {
                // Check if dataset exists before accessing it
                if (buttonElement.dataset) {
                    itemId = buttonElement.dataset.itemId || buttonElement.getAttribute('data-item-id');
                }
                else {
                    itemId = buttonElement.getAttribute('data-item-id') ||
                        buttonElement.getAttribute('data-itemId');
                }
            }
        }
        // Also try to find from parent power-card
        if (!itemId) {
            const $powerCard = $button.closest('.power-card');
            if ($powerCard.length > 0) {
                itemId = $powerCard.attr('data-item-id') ||
                    $powerCard.data('item-id') ||
                    $powerCard.data('itemId');
                if (!itemId && $powerCard[0]) {
                    const cardElement = $powerCard[0];
                    if (cardElement && cardElement.dataset) {
                        itemId = cardElement.dataset.itemId || cardElement.getAttribute('data-item-id');
                    }
                    else if (cardElement) {
                        itemId = cardElement.getAttribute('data-item-id') ||
                            cardElement.getAttribute('data-itemId');
                    }
                }
            }
        }
        if (!itemId) {
            console.error('Mastery System | [TOGGLE DETAILS] Could not find item ID', {
                button: event.currentTarget,
                buttonHtml: $button[0]?.outerHTML,
                buttonData: $button.data(),
                buttonAttrs: $button[0] ? Array.from($button[0].attributes).map(a => `${a.name}="${a.value}"`).join(', ') : 'N/A',
                parentCard: $button.closest('.power-card')[0]?.outerHTML
            });
            return;
        }
        // Ensure this.element is a jQuery object
        if (!this.element || typeof this.element.find !== 'function') {
            console.error('Mastery System | [TOGGLE DETAILS] this.element is not a jQuery object', {
                element: this.element,
                elementType: typeof this.element,
                hasFind: this.element && typeof this.element.find === 'function'
            });
            // Try to get element from the button's closest sheet
            const $sheet = $button.closest('.sheet');
            if ($sheet.length > 0) {
                const powerCard = $sheet.find(`.power-card[data-item-id="${itemId}"]`);
                if (powerCard.length > 0) {
                    this.#togglePowerDetails(powerCard, $button);
                    return;
                }
            }
            return;
        }
        const powerCard = this.element.find(`.power-card[data-item-id="${itemId}"]`);
        if (powerCard.length === 0) {
            console.error('Mastery System | [TOGGLE DETAILS] Power card not found', {
                itemId,
                allPowerCards: this.element.find('.power-card').map((_i, el) => $(el).attr('data-item-id')).get()
            });
            return;
        }
        this.#togglePowerDetails(powerCard, $button);
    }
    /**
     * Toggle power details visibility
     */
    #togglePowerDetails(powerCard, $button) {
        const detailsSection = powerCard.find('.power-details-expanded');
        const compactDescription = powerCard.find('.power-description-compact');
        const toggleIcon = $button.find('i');
        console.log('Mastery System | [TOGGLE DETAILS] Toggling details', {
            itemId: powerCard.attr('data-item-id'),
            detailsVisible: detailsSection.is(':visible'),
            compactVisible: compactDescription.is(':visible'),
            toggleIconLength: toggleIcon.length
        });
        if (detailsSection.is(':visible')) {
            // Collapse: hide details, show compact description
            detailsSection.slideUp(200);
            compactDescription.slideDown(200);
            toggleIcon.removeClass('fa-chevron-up').addClass('fa-chevron-down');
        }
        else {
            // Expand: hide compact description, show full details
            compactDescription.slideUp(200);
            detailsSection.slideDown(200);
            toggleIcon.removeClass('fa-chevron-down').addClass('fa-chevron-up');
        }
    }
    /**
     * Create a new item
     */
    async #onItemCreate(event) {
        event.preventDefault();
        const element = event.currentTarget;
        const type = element.dataset.type;
        const itemData = {
            name: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
            type
        };
        await this.actor.createEmbeddedDocuments('Item', [itemData]);
    }
    /**
     * Edit an item
     */
    #onItemEdit(event) {
        event.preventDefault();
        event.stopPropagation();
        // Safety check for null event target
        if (!event.currentTarget) {
            console.error('Mastery System | [EDIT ITEM] event.currentTarget is null');
            ui.notifications?.error('Could not find item to edit: invalid event target.');
            return;
        }
        // Try to find the item ID from various possible element structures
        const $button = $(event.currentTarget);
        // First try to get from button's own data attribute
        let itemId = $button.attr('data-item-id') ||
            $button.data('item-id') ||
            $button.data('itemId');
        // If still not found, try to get from button element directly
        if (!itemId) {
            const buttonElement = event.currentTarget;
            if (buttonElement) {
                // Check if dataset exists before accessing it
                if (buttonElement.dataset) {
                    itemId = buttonElement.dataset.itemId || buttonElement.getAttribute('data-item-id');
                }
                else {
                    itemId = buttonElement.getAttribute('data-item-id') ||
                        buttonElement.getAttribute('data-itemId');
                }
            }
        }
        // Try to find from parent item containers
        if (!itemId) {
            const $item = $button.closest('.item, .equipment-item, .power-card, .creation-power, .df-item-tile');
            if ($item.length > 0) {
                itemId = $item.attr('data-item-id') ||
                    $item.data('item-id') ||
                    $item.data('itemId');
                // If still not found, try to get from parent's data attributes
                if (!itemId && $item[0]) {
                    const itemElement = $item[0];
                    if (itemElement && itemElement.dataset) {
                        itemId = itemElement.dataset.itemId || itemElement.getAttribute('data-item-id');
                    }
                    else if (itemElement) {
                        itemId = itemElement.getAttribute('data-item-id') ||
                            itemElement.getAttribute('data-itemId');
                    }
                }
            }
        }
        // Also try to find from the button's parent elements
        if (!itemId) {
            const buttonElement = event.currentTarget;
            if (buttonElement) {
                let parent = buttonElement.parentElement;
                let attempts = 0;
                while (parent && attempts < 5) {
                    // Check if dataset exists before accessing it
                    if (parent && parent.dataset) {
                        itemId = parent.dataset.itemId || parent.getAttribute('data-item-id');
                    }
                    else if (parent) {
                        itemId = parent.getAttribute('data-item-id') ||
                            parent.getAttribute('data-itemId');
                    }
                    if (itemId)
                        break;
                    parent = parent?.parentElement || null;
                    attempts++;
                }
            }
        }
        if (!itemId) {
            console.error('Mastery System | [EDIT ITEM] Could not find item ID', {
                button: event.currentTarget,
                buttonHtml: $button[0]?.outerHTML,
                buttonAttrs: $button[0] ? Array.from($button[0].attributes).map(a => `${a.name}="${a.value}"`).join(', ') : 'N/A',
                closestItem: $button.closest('.item, .power-card')[0],
                closestItemHtml: $button.closest('.item, .power-card')[0]?.outerHTML,
                buttonParent: event.currentTarget?.parentElement?.outerHTML
            });
            ui.notifications?.error('Could not find item to edit. Please check the console for details.');
            return;
        }
        const item = this.actor.items.get(itemId);
        if (item) {
            item.sheet?.render(true);
        }
        else {
            ui.notifications?.error(`Item with ID ${itemId} not found in actor.`);
        }
    }
    /**
     * Delete an item
     */
    async #onItemDelete(event) {
        event.preventDefault();
        event.stopPropagation();
        // Try to find the item ID from various possible element structures
        const $button = $(event.currentTarget);
        const $item = $button.closest('.item, .equipment-item, .power-card, .creation-power');
        // Try multiple methods to get the item ID
        let itemId = $item.data('item-id') ||
            $item.attr('data-item-id') ||
            $item.data('itemId') ||
            $button.data('item-id') ||
            $button.attr('data-item-id') ||
            $button.data('itemId');
        // If still not found, try to get from parent's data attributes
        if (!itemId && $item.length > 0) {
            const itemElement = $item[0];
            itemId = itemElement.getAttribute('data-item-id') ||
                itemElement.getAttribute('data-itemId');
        }
        if (!itemId) {
            console.error('Mastery System | [DELETE ITEM] Could not find item ID', {
                button: event.currentTarget,
                buttonHtml: $button[0]?.outerHTML,
                closestItem: $item[0],
                closestItemHtml: $item[0]?.outerHTML,
                buttonData: $button.data(),
                itemData: $item.data(),
                itemAttrs: $item.length > 0 ? Array.from($item[0].attributes).map((attr) => ({
                    name: attr.name,
                    value: attr.value
                })) : []
            });
            ui.notifications?.error('Could not find item to delete. Please check the console for details.');
            return;
        }
        const item = this.actor.items.get(itemId);
        if (!item) {
            console.error('Mastery System | [DELETE ITEM] Item not found in actor.items', {
                itemId,
                actorId: this.actor.id,
                allItemIds: Array.from(this.actor.items.keys()),
                allItems: Array.from(this.actor.items.values()).map((i) => ({
                    id: i.id,
                    name: i.name,
                    type: i.type
                }))
            });
            ui.notifications?.error(`Item with ID ${itemId} not found in actor.`);
            return;
        }
        const confirmed = await Dialog.confirm({
            title: 'Delete Item',
            content: `<p>Are you sure you want to delete <strong>${item.name}</strong>?</p>`
        });
        if (confirmed) {
            try {
                const itemType = item.type;
                const itemName = item.name;
                const isPower = itemType === 'power';
                // Check if we're in character creation mode
                const system = this.actor.system;
                const creationComplete = system?.creation?.complete !== false;
                const inCreationMode = !creationComplete;
                await item.delete();
                console.log('Mastery System | [DELETE ITEM] Item deleted successfully', {
                    itemId,
                    itemName,
                    itemType,
                    inCreationMode
                });
                // Show appropriate notification
                if (isPower && inCreationMode) {
                    // Count remaining powers
                    const remainingPowers = this.actor.items.filter((i) => i.type === 'power');
                    ui.notifications?.info(`Power "${itemName}" removed. ${remainingPowers.length} of ${CREATION_POWER_TOTAL} Powers selected.`);
                }
                else {
                    ui.notifications?.info(`"${itemName}" deleted.`);
                }
                // Re-render the sheet to update the display
                this.render();
            }
            catch (error) {
                console.error('Mastery System | [DELETE ITEM] Error deleting item', error);
                ui.notifications?.error(`Failed to delete item: ${error}`);
            }
        }
    }
    /**
     * Adjust HP
     */
    async #onHPAdjust(event) {
        event.preventDefault();
        const element = event.currentTarget;
        const adjustment = parseInt(element.dataset.adjustment || '0');
        if (adjustment > 0) {
            await this.actor.heal(adjustment);
        }
        else if (adjustment < 0) {
            await this.actor.applyDamage(Math.abs(adjustment));
        }
    }
    /**
     * Adjust Stress
     */
    async #onStressAdjust(event) {
        event.preventDefault();
        const element = event.currentTarget;
        const adjustment = parseInt(element.dataset.adjustment || '0');
        const current = this.actor.system.stress?.current || 0;
        const max = this.actor.system.stress?.maximum || 100;
        const newValue = Math.max(0, Math.min(max, current + adjustment));
        await this.actor.update({ 'system.stress.current': newValue });
    }
    /**
     * Adjust Stones
     */
    async #onStoneAdjust(event) {
        event.preventDefault();
        const element = event.currentTarget;
        const adjustment = parseInt(element.dataset.adjustment || '0');
        const current = this.actor.system.stones?.current || 0;
        const max = this.actor.system.stones?.maximum || 0;
        const newValue = Math.max(0, Math.min(max, current + adjustment));
        await this.actor.update({ 'system.stones.current': newValue });
    }
    /**
     * Handle profile image edit (upper zone)
     */
    async #onProfileEdit(event, imgType = 'portrait') {
        console.log('Mastery System | #onProfileEdit called', {
            eventType: event.type,
            target: event.target,
            currentTarget: event.currentTarget,
            isEditable: this.isEditable,
            actorName: this.actor.name,
            imgType: imgType,
            isToken: imgType === 'token'
        });
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        if (!this.isEditable) {
            console.log('Mastery System | Sheet is not editable, showing warning');
            ui.notifications?.warn('You do not have permission to edit this character.');
            return;
        }
        try {
            console.log('Mastery System | Attempting to open FilePicker', {
                currentImg: this.actor.img,
                FilePickerAvailable: typeof FilePicker !== 'undefined',
                globalFilePicker: typeof globalThis.FilePicker !== 'undefined',
                foundryFilePicker: typeof foundry?.applications?.apps?.FilePicker?.implementation !== 'undefined'
            });
            // Use Foundry's built-in image editing functionality
            // Try to use the shimmed FilePicker first, then fallback to foundry's implementation
            const FilePickerClass = globalThis.FilePicker ||
                foundry?.applications?.apps?.FilePicker?.implementation ||
                FilePicker;
            console.log('Mastery System | FilePickerClass resolved', { FilePickerClass: FilePickerClass?.name || 'unknown' });
            // Get current image based on imgType - use strict comparison
            const isTokenEdit = (imgType === 'token'); // Store in const to ensure it's captured correctly in closure
            let currentImage;
            console.log('Mastery System | Determining image type for edit', {
                imgType: imgType,
                imgTypeType: typeof imgType,
                isTokenEdit: isTokenEdit,
                strictComparison: imgType === 'token',
                currentActorImg: this.actor.img,
                currentTokenImg: this.actor.prototypeToken?.texture?.src
            });
            if (isTokenEdit) {
                currentImage = this.actor.prototypeToken?.texture?.src || this.actor.img || '';
                console.log('Mastery System | Token image edit - current:', currentImage);
            }
            else {
                currentImage = this.actor.img || '';
                console.log('Mastery System | Portrait image edit - current:', currentImage);
            }
            // Store isTokenEdit in a way that can't be modified
            const updateIsToken = isTokenEdit;
            const filePicker = new FilePickerClass({
                type: 'image',
                current: currentImage,
                callback: async (path) => {
                    console.log('Mastery System | FilePicker callback triggered', {
                        path,
                        imgType: imgType,
                        imgTypeType: typeof imgType,
                        isTokenEdit: updateIsToken,
                        strictComparison: imgType === 'token',
                        actorImg: this.actor.img,
                        tokenImg: this.actor.prototypeToken?.texture?.src
                    });
                    try {
                        if (updateIsToken) {
                            // Update token image
                            console.log('Mastery System | Updating TOKEN image to:', path);
                            const updateData = { 'prototypeToken.texture.src': path };
                            console.log('Mastery System | Update data:', updateData);
                            await this.actor.update(updateData);
                            console.log('Mastery System | Token image updated successfully');
                        }
                        else {
                            // Update portrait image
                            console.log('Mastery System | Updating PORTRAIT image to:', path);
                            const updateData = { img: path };
                            console.log('Mastery System | Update data:', updateData);
                            await this.actor.update(updateData);
                            console.log('Mastery System | Portrait image updated successfully');
                        }
                        // Re-render the sheet to show the new image
                        this.render(false);
                    }
                    catch (updateError) {
                        console.error('Mastery System | Error updating image:', updateError);
                        ui.notifications?.error('Failed to update image.');
                    }
                }
            });
            console.log('Mastery System | FilePicker created, rendering...');
            await filePicker.render(true);
            console.log('Mastery System | FilePicker rendered successfully');
        }
        catch (error) {
            console.error('Mastery System | Error opening file picker:', error);
            console.error('Mastery System | Error stack:', error instanceof Error ? error.stack : 'No stack');
            ui.notifications?.error('Failed to open image picker.');
        }
    }
    /**
     * Handle profile image show (lower zone)
     */
    async #onProfileShow(event, imgType = 'portrait') {
        console.log('Mastery System | #onProfileShow called', {
            eventType: event.type,
            target: event.target,
            currentTarget: event.currentTarget,
            actorName: this.actor.name,
            imgType: imgType,
            isToken: imgType === 'token'
        });
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        // Get image source based on imgType
        let imgSrc;
        if (imgType === 'token') {
            imgSrc = this.actor.prototypeToken?.texture?.src || this.actor.img || '';
            console.log('Mastery System | Token image show - source:', imgSrc, {
                hasTokenSrc: !!this.actor.prototypeToken?.texture?.src,
                fallbackToPortrait: !this.actor.prototypeToken?.texture?.src
            });
        }
        else {
            imgSrc = this.actor.img || '';
            console.log('Mastery System | Portrait image show - source:', imgSrc);
        }
        console.log('Mastery System | Image source check', { imgSrc, isDefault: imgSrc === 'icons/svg/mystery-man.svg' });
        if (!imgSrc || imgSrc === 'icons/svg/mystery-man.svg') {
            console.log('Mastery System | No valid image to display');
            ui.notifications?.warn('No image to display.');
            return;
        }
        try {
            console.log('Mastery System | Attempting to show image popup', {
                imgSrc,
                ImagePopoutAvailable: typeof foundry?.applications?.apps?.ImagePopout?.implementation !== 'undefined',
                windowImagePopout: typeof window.ImagePopout !== 'undefined'
            });
            // Try to use Foundry's ImagePopout if available
            const ImagePopoutClass = foundry?.applications?.apps?.ImagePopout?.implementation ||
                window.ImagePopout;
            if (ImagePopoutClass) {
                console.log('Mastery System | Using ImagePopout class', { className: ImagePopoutClass.name || 'unknown' });
                const popout = new ImagePopoutClass(imgSrc, {
                    title: this.actor.name,
                    shareable: true,
                    uuid: this.actor.uuid
                });
                console.log('Mastery System | ImagePopout created, rendering...');
                await popout.render(true);
                console.log('Mastery System | ImagePopout rendered successfully');
            }
            else {
                console.log('Mastery System | ImagePopout not available, using Dialog fallback');
                // Fallback: Create a simple dialog with the image
                const dialog = new Dialog({
                    title: this.actor.name,
                    content: `<div style="text-align: center;"><img src="${imgSrc}" style="max-width: 100%; max-height: 80vh; height: auto; border-radius: 4px;" /></div>`,
                    buttons: {
                        close: {
                            label: 'Close',
                            callback: () => { }
                        }
                    },
                    default: 'close'
                });
                console.log('Mastery System | Dialog created, rendering...');
                await dialog.render(true);
                console.log('Mastery System | Dialog rendered successfully');
            }
        }
        catch (error) {
            console.error('Mastery System | Failed to show image popup', error);
            console.error('Mastery System | Error stack:', error instanceof Error ? error.stack : 'No stack');
            // Fallback: Create a simple dialog with the image
            try {
                console.log('Mastery System | Attempting fallback dialog');
                const dialog = new Dialog({
                    title: this.actor.name,
                    content: `<div style="text-align: center;"><img src="${imgSrc}" style="max-width: 100%; max-height: 80vh; height: auto; border-radius: 4px;" /></div>`,
                    buttons: {
                        close: {
                            label: 'Close',
                            callback: () => { }
                        }
                    },
                    default: 'close'
                });
                await dialog.render(true);
                console.log('Mastery System | Fallback dialog rendered successfully');
            }
            catch (fallbackError) {
                console.error('Mastery System | Fallback dialog also failed', fallbackError);
                console.error('Mastery System | Fallback error stack:', fallbackError instanceof Error ? fallbackError.stack : 'No stack');
                ui.notifications?.error('Failed to display image.');
            }
        }
    }
    /**
     * Lock sheet when character creation is incomplete
     * Only disable non-creation fields, allow creation controls
     */
    #lockSheetForCreation(html) {
        console.log('Mastery System | #lockSheetForCreation called');
        html.find('input[name="name"], textarea').prop('disabled', true);
        html.find('select:not(.power-rank-select):not(.attr-creation-select)').prop('disabled', true);
        // Disable buttons except creation controls
        const buttonsToDisable = html.find('button:not(.attr-increase):not(.attr-decrease):not(.skill-increase):not(.skill-decrease):not(.finalize-creation):not(.reset-creation-attributes):not(.force-unlock-creation):not(.reset-character):not(.add-disadvantage-btn):not(.disadvantage-edit-btn):not(.disadvantage-remove-btn):not(.add-power-creation-btn):not(.add-spell-creation-btn):not(.power-rank-select):not(.item-delete):not(.power-toggle-details):not(.power-edit-mechanics):not(.general-items-btn):not(.choose-echo-btn):not(.add-echo-card-btn):not(.echo-card-use-btn):not(.open-languages-btn)');
        console.log('Mastery System | Disabling buttons:', buttonsToDisable.length);
        buttonsToDisable.prop('disabled', true);
        // Ensure creation buttons are enabled
        const creationButtons = html.find('.attr-increase, .attr-decrease, .skill-increase, .skill-decrease, .finalize-creation, .reset-creation-attributes, .force-unlock-creation, .reset-character, .add-disadvantage-btn, .disadvantage-edit-btn, .disadvantage-remove-btn, .add-power-creation-btn, .add-spell-creation-btn, .item-delete, .general-items-btn, .choose-echo-btn, .add-echo-card-btn, .echo-card-use-btn, .open-languages-btn');
        console.log('Mastery System | Enabling creation buttons:', {
            total: creationButtons.length,
            addDisadvantageBtn: html.find('.add-disadvantage-btn').length,
            addPowerCreationBtn: html.find('.add-power-creation-btn').length,
            addSpellCreationBtn: html.find('.add-spell-creation-btn').length,
            addDisadvantageBtnDisabled: html.find('.add-disadvantage-btn').prop('disabled'),
            addPowerCreationBtnDisabled: html.find('.add-power-creation-btn').prop('disabled'),
            addSpellCreationBtnDisabled: html.find('.add-spell-creation-btn').prop('disabled')
        });
        creationButtons.prop('disabled', false);
        // Also enable power rank selects (they're select elements, not buttons)
        html.find('.power-rank-select').prop('disabled', false);
        html.find('.power-radial-checkbox').prop('disabled', false);
        html.find('.power-display-name-input').prop('disabled', false);
        // Double-check all creation buttons are enabled
        const addDisadvantageBtn = html.find('.add-disadvantage-btn');
        const addPowerCreationBtn = html.find('.add-power-creation-btn');
        const addSpellCreationBtn = html.find('.add-spell-creation-btn');
        if (addDisadvantageBtn.length > 0) {
            addDisadvantageBtn.prop('disabled', false);
            console.log('Mastery System | add-disadvantage-btn explicitly enabled, final state:', addDisadvantageBtn.prop('disabled'));
        }
        else {
            console.warn('Mastery System | add-disadvantage-btn not found during lockSheetForCreation!');
        }
        if (addPowerCreationBtn.length > 0) {
            addPowerCreationBtn.prop('disabled', false);
            console.log('Mastery System | add-power-creation-btn explicitly enabled, final state:', addPowerCreationBtn.prop('disabled'));
        }
        else {
            console.log('Mastery System | add-power-creation-btn not found (might be normal if creation complete)');
        }
        if (addSpellCreationBtn.length > 0) {
            addSpellCreationBtn.prop('disabled', false);
            console.log('Mastery System | add-spell-creation-btn explicitly enabled, final state:', addSpellCreationBtn.prop('disabled'));
        }
        else {
            console.log('Mastery System | add-spell-creation-btn not found (might be normal if creation complete)');
        }
        const generalItemsBtn = html.find('.general-items-btn');
        if (generalItemsBtn.length > 0) {
            generalItemsBtn.prop('disabled', false);
        }
        const languagesBtn = html.find('.open-languages-btn');
        if (languagesBtn.length > 0) {
            languagesBtn.prop('disabled', false);
        }
        // Add CSS class for styling
        html.addClass('creation-incomplete');
    }
    /**
     * Force unlock creation (GM only)
     */
    async #onForceUnlockCreation(event) {
        event.preventDefault();
        event.stopPropagation();
        console.log('Mastery System | Force Unlock clicked');
        if (!game.user?.isGM) {
            ui.notifications?.warn('Only the GM can force unlock character creation.');
            return;
        }
        const confirmed = await Dialog.confirm({
            title: 'Force Unlock Character Creation',
            content: '<p>Are you sure you want to mark this character\'s creation as complete? This will unlock the sheet for editing.</p>'
        });
        if (confirmed) {
            try {
                await this.actor.update({ 'system.creation.complete': true });
                ui.notifications?.info('Character creation marked as complete.');
                this.render();
            }
            catch (error) {
                console.error('Mastery System | Failed to force unlock', error);
                ui.notifications?.error('Failed to unlock character creation.');
            }
        }
    }
    /**
     * GM-only: Full character reset. Wipes every embedded Item (powers, gear,
     * weapons, armor, schticks, artifacts, conditions, echo items), clears
     * every system.* field (attributes, skills, echo, disadvantages, passive
     * slots, manual adjustments, stress/health bars, …), flips creation back
     * to incomplete, and refunds the full lifetime earned-XP amount into
     * `system.points.xp` so the player can re-distribute it from scratch.
     *
     * Preserves the actor's `name`, `img`, `prototypeToken`, `ownership`,
     * `folder`, `flags`, and `system.xp.totalEarned` / `.history`.
     *
     * Requires two confirmations because the action is destructive and
     * cannot be undone without a world backup.
     */
    async #onResetCharacter(event) {
        event.preventDefault();
        event.stopPropagation();
        if (!game.user?.isGM) {
            ui.notifications?.warn('Only the GM can reset a character.');
            return;
        }
        const actor = this.actor;
        const totalEarned = Number(actor?.system?.xp?.totalEarned ?? 0);
        const itemCount = (() => {
            try {
                const iter = actor?.items;
                if (!iter)
                    return 0;
                let n = 0;
                for (const _ of iter)
                    n++;
                return n;
            }
            catch {
                return 0;
            }
        })();
        const firstConfirm = await Dialog.confirm({
            title: 'Reset Character?',
            content: `
        <div class="mastery-reset-char-warning">
          <p><strong>Destructive action — cannot be undone without a world backup.</strong></p>
          <p>This will <strong>wipe</strong> the character and drop them back into Character Creation:</p>
          <ul style="margin: 4px 0 8px 20px;">
            <li><strong>Removed:</strong> all powers, gear, weapons, armor, schticks, Echo artifacts, conditions (<em>${itemCount}</em> item(s) total), all attribute / skill values, Echo, disadvantages, passive slot assignments, manual adjustments, active effects, faith fractures, minor expressions.</li>
            <li><strong>General artifacts:</strong> reset to Level 1 / inactive and kept on the character; you will be asked whether equipped ones stay on the paperdoll.</li>
            <li><strong>Kept:</strong> name, portrait/token, ownership, folder, flags, and the lifetime earned XP (<em>${totalEarned}</em> XP).</li>
            <li><strong>After reset:</strong> the full <em>${totalEarned}</em> XP is added back to the player's available pool for re-distribution once creation is finalized again.</li>
          </ul>
          <p>Continue?</p>
        </div>
      `,
            yes: () => true,
            no: () => false,
            defaultYes: false,
        });
        if (!firstConfirm)
            return;
        // Second guard because this really is irreversible.
        const secondConfirm = await Dialog.confirm({
            title: 'Really reset?',
            content: '<p>Last warning: every item, attribute, skill, and power on this character will be deleted. Name and portrait stay. Continue?</p>',
            yes: () => true,
            no: () => false,
            defaultYes: false,
        });
        if (!secondConfirm)
            return;
        const equippedGeneral = listEquippedGeneralArtifacts(actor);
        let keepEquippedGeneralArtifacts = false;
        if (equippedGeneral.length > 0) {
            const names = equippedGeneral.map((a) => a.name).join(', ');
            keepEquippedGeneralArtifacts = await Dialog.confirm({
                title: 'General-Artefakte ausgerüstet lassen?',
                content: `
          <div class="mastery-reset-char-artifacts">
            <p>Dieser Charakter hat <strong>${equippedGeneral.length}</strong> ausgerüstete(s) General-Artefakt(e):</p>
            <p><em>${names}</em></p>
            <p>Sie werden auf <strong>Stufe 1 / inaktiv</strong> zurückgesetzt.</p>
            <p>Sollen sie <strong>weiterhin ausgerüstet</strong> bleiben?</p>
            <p class="notes">Echo-Artefakte werden entfernt und sind davon ausgenommen.</p>
          </div>
        `,
                yes: () => true,
                no: () => false,
                defaultYes: true,
                yesLabel: 'Ja, ausgerüstet lassen',
                noLabel: 'Nein, ins Inventar',
            });
        }
        const gmUser = game.user;
        try {
            const result = await resetCharacterForRecreation(actor, {
                gmUserId: String(gmUser?.id ?? ''),
                gmUserName: String(gmUser?.name ?? 'GM'),
                keepEquippedGeneralArtifacts,
            });
            if (!result.ok) {
                ui.notifications?.error(`Reset failed: ${result.error ?? 'unknown error'}`);
                return;
            }
            const keptNote = result.keptGeneralArtifactCount > 0
                ? ` ${result.keptGeneralArtifactCount} General-Artefakt(e) zurückgesetzt${keepEquippedGeneralArtifacts ? ' (ausgerüstet)' : ' (ins Inventar)'}.`
                : '';
            ui.notifications?.info(`Character reset. ${result.removedItemCount} item(s) removed, ${result.returnedXp} XP returned to the pool.${keptNote}`);
            await this.render(true);
        }
        catch (err) {
            console.error('Mastery System | Reset character failed:', err);
            ui.notifications?.error('Reset failed — see console for details.');
        }
    }
    /**
     * Character Creation: reset all attributes to 2 so dropdowns show full options again.
     */
    #onResetCreationAttributes(event) {
        event.preventDefault();
        event.stopPropagation();
        if (!this.actor.isOwner) {
            ui.notifications?.warn('Only the character owner can reset attributes during creation.');
            return;
        }
        const attributeKeys = ['might', 'agility', 'vitality', 'intellect', 'resolve', 'influence', 'wits'];
        new Dialog({
            title: 'Reset attributes?',
            content: '<p class="mastery-reset-attrs-msg">Set <strong>all seven attributes</strong> to <strong>2</strong>. You can then pick the distribution again (2×8, 2×6, 2×4, 1×2). Skills, powers, and disadvantages are unchanged.</p>',
            buttons: {
                reset: {
                    icon: '<i class="fas fa-undo"></i>',
                    label: 'Reset all to 2',
                    callback: async () => {
                        const updates = {};
                        for (const k of attributeKeys) {
                            updates[`system.attributes.${k}.value`] = 2;
                        }
                        await this.actor.update(updates);
                        ui.notifications?.info('Attributes reset. Choose values again from the dropdowns.');
                        await this.render();
                    }
                },
                cancel: {
                    label: 'Cancel',
                    callback: () => { }
                }
            },
            default: 'cancel'
        }).render(true);
    }
    /**
     * Character Creation: Attribute value changed via select dropdown
     */
    async #onCreationAttributeChange(event) {
        const select = event.currentTarget;
        const attribute = select.dataset.attribute;
        if (!attribute)
            return;
        const newValue = parseInt(select.value);
        if (isNaN(newValue))
            return;
        const system = this.actor.system;
        const masteryRank = system.mastery?.rank || 2;
        const attributeKeys = ['might', 'agility', 'vitality', 'intellect', 'resolve', 'influence', 'wits'];
        // Count how many of each value are already assigned (excluding current attribute)
        let count8 = 0, count6 = 0, count4 = 0, count2 = 0;
        for (const key of attributeKeys) {
            if (key === attribute)
                continue;
            const v = system.attributes?.[key]?.value || masteryRank;
            if (v === 8)
                count8++;
            else if (v === 6)
                count6++;
            else if (v === 4)
                count4++;
            else if (v === 2)
                count2++;
        }
        // Validate the new assignment (2×8, 2×6, 2×4, 1×2)
        if (newValue === 8 && count8 >= 2) {
            ui.notifications?.warn('Already 2 attributes at 8. Choose a different value.');
            this.render();
            return;
        }
        if (newValue === 6 && count6 >= 2) {
            ui.notifications?.warn('Already 2 attributes at 6. Choose a different value.');
            this.render();
            return;
        }
        if (newValue === 4 && count4 >= 2) {
            ui.notifications?.warn('Already 2 attributes at 4. Choose a different value.');
            this.render();
            return;
        }
        if (newValue === 2 && count2 >= 1) {
            ui.notifications?.warn('Already 1 attribute at 2. Choose a different value.');
            this.render();
            return;
        }
        await this.actor.update({
            [`system.attributes.${attribute}.value`]: newValue
        });
        this.render();
    }
    /**
     * Character Creation: Increase Skill
     */
    async #onCreationSkillIncrease(event) {
        event.preventDefault();
        const skill = $(event.currentTarget).data('skill');
        if (!skill)
            return;
        // Save scroll position
        const skillsTab = this.element.find('.tab.skills');
        const scrollTop = skillsTab.scrollTop();
        const system = this.actor.system;
        const currentValue = system.skills?.[skill] || 0;
        const skillPointsConfig = CONFIG.MASTERY?.creation?.skillPoints || 40;
        // Calculate current points spent
        let skillPointsSpent = 0;
        for (const skillValue of Object.values(system.skills || {})) {
            skillPointsSpent += (typeof skillValue === 'number' ? skillValue : 0);
        }
        // Validate
        if (currentValue >= 4) {
            ui.notifications?.warn('Skill cannot exceed 4 during character creation.');
            return;
        }
        if (skillPointsSpent >= skillPointsConfig) {
            ui.notifications?.warn('All skill points have been allocated.');
            return;
        }
        // Update
        await this.actor.update({
            [`system.skills.${skill}`]: currentValue + 1
        });
        await this.render();
        // Restore scroll position
        const newSkillsTab = this.element.find('.tab.skills');
        if (newSkillsTab.length) {
            newSkillsTab.scrollTop(scrollTop);
        }
    }
    /**
     * Character Creation: Decrease Skill
     */
    async #onCreationSkillDecrease(event) {
        event.preventDefault();
        const skill = $(event.currentTarget).data('skill');
        if (!skill)
            return;
        // Save scroll position
        const skillsTab = this.element.find('.tab.skills');
        const scrollTop = skillsTab.scrollTop();
        const system = this.actor.system;
        const currentValue = system.skills?.[skill] || 0;
        // Validate
        if (currentValue <= 0) {
            ui.notifications?.warn('Skill cannot go below 0.');
            return;
        }
        // Update
        await this.actor.update({
            [`system.skills.${skill}`]: currentValue - 1
        });
        await this.render();
        // Restore scroll position
        const newSkillsTab = this.element.find('.tab.skills');
        if (newSkillsTab.length) {
            newSkillsTab.scrollTop(scrollTop);
        }
    }
    /**
     * Add Disadvantage during Creation
     */
    async #onAddDisadvantage(event) {
        console.log('Mastery System | ========== #onAddDisadvantage START ==========');
        console.log('Mastery System | Event details:', {
            type: event.type,
            target: event.target,
            currentTarget: event.currentTarget,
            isDefaultPrevented: event.isDefaultPrevented(),
            isPropagationStopped: event.isPropagationStopped()
        });
        event.preventDefault();
        event.stopPropagation();
        const creationComplete = this.actor.system?.creation?.complete !== false;
        const isGm = game.user?.isGM === true;
        if (creationComplete && !isGm) {
            ui.notifications?.warn('Only a GM can add disadvantages after character creation.');
            return;
        }
        console.log('Mastery System | Actor details:', {
            actorId: this.actor.id,
            actorName: this.actor.name,
            isOwner: this.actor.isOwner,
            system: this.actor.system
        });
        // Debug: Check if DISADVANTAGES is loaded
        console.log('Mastery System | DISADVANTAGES check:', {
            exists: typeof DISADVANTAGES !== 'undefined',
            isArray: Array.isArray(DISADVANTAGES),
            length: DISADVANTAGES?.length || 0,
            content: DISADVANTAGES
        });
        if (!DISADVANTAGES || DISADVANTAGES.length === 0) {
            const errorMsg = 'Disadvantages list is not loaded. Please check the console for errors.';
            console.error('Mastery System | ERROR: DISADVANTAGES is empty or undefined!', {
                DISADVANTAGES: DISADVANTAGES,
                type: typeof DISADVANTAGES
            });
            ui.notifications?.error(errorMsg);
            return;
        }
        console.log('Mastery System | DISADVANTAGES loaded successfully, proceeding with dialog creation...');
        // Show selection dialog
        const disadvantageOptions = DISADVANTAGES.map(d => ({
            value: d.id,
            label: `${d.name} (${Array.isArray(d.basePoints) ? d.basePoints.join('/') : d.basePoints} pts)`
        }));
        console.log('Mastery System | Disadvantage options:', disadvantageOptions);
        const content = `
      <form>
        <div class="form-group">
          <label>Select Disadvantage:</label>
          <select name="disadvantageId" id="disadvantageId">
            <option value="">-- Select a Disadvantage --</option>
            ${disadvantageOptions.map(opt => `<option value="${opt.value}">${opt.label}</option>`).join('')}
          </select>
        </div>
        ${disadvantageOptions.length === 0 ? '<p style="color: #8b0000; font-weight: 600;">No disadvantages available. Please check the console.</p>' : ''}
      </form>
    `;
        console.log('Mastery System | Creating Dialog with content:', {
            contentLength: content.length,
            optionsCount: disadvantageOptions.length,
            firstOption: disadvantageOptions[0]
        });
        const dialog = new Dialog({
            title: 'Add Disadvantage',
            content,
            width: 440,
            height: 320,
            resizable: true,
            buttons: {
                configure: {
                    label: 'Configure',
                    callback: async (html) => {
                        console.log('Mastery System | Configure button clicked in dialog');
                        const disadvantageId = html.find('[name="disadvantageId"]').val();
                        console.log('Mastery System | Selected disadvantage ID:', disadvantageId);
                        if (!disadvantageId) {
                            ui.notifications?.warn('Please select a disadvantage.');
                            return false;
                        }
                        const def = getDisadvantageDefinition(disadvantageId);
                        console.log('Mastery System | Disadvantage definition:', def);
                        if (!def) {
                            ui.notifications?.error(`Disadvantage definition not found for ID: ${disadvantageId}`);
                            return false;
                        }
                        // Open configuration dialog
                        console.log('Mastery System | Opening configuration dialog for:', def.name);
                        await this.#openDisadvantageConfigDialog(def);
                        return true;
                    }
                },
                cancel: {
                    label: 'Cancel',
                    callback: () => {
                        console.log('Mastery System | Dialog cancelled');
                    }
                }
            },
            default: 'configure'
        });
        console.log('Mastery System | Dialog created, calling render(true)...');
        try {
            await dialog.render(true);
            this.#setupDisadvantageDialogChrome(dialog, 'selection');
            console.log('Mastery System | Dialog rendered successfully!');
        }
        catch (error) {
            console.error('Mastery System | ERROR rendering dialog:', error);
            ui.notifications?.error('Failed to open disadvantage dialog. Check console for details.');
        }
        console.log('Mastery System | ========== #onAddDisadvantage END ==========');
    }
    /**
     * Edit Disadvantage during Creation
     */
    async #onEditDisadvantage(event) {
        event.preventDefault();
        const creationComplete = this.actor.system?.creation?.complete !== false;
        const isGm = game.user?.isGM === true;
        if (creationComplete && !isGm) {
            ui.notifications?.warn('Only a GM can edit disadvantages after character creation.');
            return;
        }
        const index = parseInt($(event.currentTarget).data('index') || '0');
        const system = this.actor.system;
        const disadvantages = system.disadvantages || [];
        if (index < 0 || index >= disadvantages.length)
            return;
        const selection = disadvantages[index];
        const def = getDisadvantageDefinition(selection.id);
        if (!def)
            return;
        await this.#openDisadvantageConfigDialog(def, index, selection.details);
    }
    /**
     * Remove Disadvantage during Creation
     */
    async #onRemoveDisadvantage(event) {
        event.preventDefault();
        const creationComplete = this.actor.system?.creation?.complete !== false;
        const isGm = game.user?.isGM === true;
        if (creationComplete && !isGm) {
            ui.notifications?.warn('Only a GM can remove disadvantages after character creation.');
            return;
        }
        const index = parseInt($(event.currentTarget).data('index') || '0');
        const system = this.actor.system;
        const disadvantages = [...(system.disadvantages || [])];
        if (index < 0 || index >= disadvantages.length)
            return;
        const removed = disadvantages[index];
        disadvantages.splice(index, 1);
        // Mark disadvantages as reviewed
        const updateData = { 'system.disadvantages': disadvantages };
        if (!this.actor.system.creation?.disadvantagesReviewed) {
            updateData['system.creation.disadvantagesReviewed'] = true;
        }
        await this.actor.update(updateData);
        ui.notifications?.info(`Removed ${removed.name}`);
        this.render();
    }
    /**
     * Apply disadvantage dialog styling only to this Dialog's shell.
     * Do not use $(innerHtml).closest('.application') — in v13 that can match Foundry's root UI and break the whole layout.
     */
    #setupDisadvantageDialogChrome(dialog, kind) {
        const shell = dialog.element;
        if (!shell?.length)
            return;
        if (kind === 'selection') {
            shell.addClass('mastery-system disadvantage-selection-dialog');
            queueMicrotask(() => {
                setTimeout(() => this.#attachDisadvantageDialogResizeHandle(shell, 360, 260), 80);
            });
        }
        else {
            shell.addClass('mastery-system disadvantage-config-dialog-styled');
            queueMicrotask(() => {
                setTimeout(() => this.#attachDisadvantageDialogResizeHandle(shell, 500, 340), 80);
            });
        }
    }
    /**
     * Legacy Dialog may not show a resize grip; add bottom-right resize if still missing after paint.
     */
    #wireDisadvantageExamplePresets(root, def) {
        const presets = def?.examplePresets;
        if (!presets?.length || !root?.length)
            return;
        const $sel = root.find('.js-disadvantage-example-preset');
        if (!$sel.length)
            return;
        if (def.presetFillsNameAndContext) {
            $sel.off('change.ms-preset').on('change.ms-preset', () => {
                const raw = String($sel.val() ?? '');
                const idx = parseInt(raw, 10);
                if (!Number.isFinite(idx) || idx < 0 || idx >= presets.length)
                    return;
                const p = presets[idx];
                if (!p)
                    return;
                const $form = this.#disadvantageDialogFormRoot(root);
                $form.find('[name="sheetTitle"]').val(p.label);
                $form.find('[name="name"]').val(p.label);
                $form.find('[name="context"]').val(p.text || '');
            });
            return;
        }
        let targetName = def.presetTargetField;
        if (!targetName) {
            const ta = (def.fields || []).find((f) => f.type === 'textarea');
            targetName = ta?.name;
        }
        if (!targetName)
            return;
        $sel.off('change.ms-preset').on('change.ms-preset', () => {
            const raw = String($sel.val() ?? '');
            const idx = parseInt(raw, 10);
            if (!Number.isFinite(idx) || idx < 0 || idx >= presets.length)
                return;
            const text = presets[idx]?.text;
            if (text == null)
                return;
            root.find(`[name="${targetName}"]`).val(text);
        });
    }
    #attachDisadvantageDialogResizeHandle(root, minWidth, minHeight) {
        if (!root?.length)
            return;
        if (root.find('> .window-resizable-handle').length)
            return;
        const appEl = root[0];
        const handle = $('<div class="window-resizable-handle" title="Resize" role="presentation"></div>');
        root.append(handle);
        handle.on('mousedown.disadvantageResize', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const startX = e.clientX;
            const startY = e.clientY;
            const rect = appEl.getBoundingClientRect();
            const startW = rect.width;
            const startH = rect.height;
            const maxW = Math.max(minWidth, Math.min(1000, window.innerWidth - 24));
            const maxH = Math.max(minHeight, Math.min(900, window.innerHeight - 24));
            const onMove = (move) => {
                const dw = move.clientX - startX;
                const dh = move.clientY - startY;
                const w = Math.min(maxW, Math.max(minWidth, startW + dw));
                const h = Math.min(maxH, Math.max(minHeight, startH + dh));
                appEl.style.width = `${w}px`;
                appEl.style.height = `${h}px`;
            };
            const onUp = () => {
                document.removeEventListener('mousemove', onMove);
                document.removeEventListener('mouseup', onUp);
            };
            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup', onUp);
        });
    }
    /** Scope field queries to the disadvantage dialog (avoids stray `[name="…"]` matches). */
    #disadvantageDialogFormRoot(html) {
        const $h = $(html);
        if ($h.is('.disadvantage-config-dialog'))
            return $h;
        const inner = $h.find('.disadvantage-config-dialog').first();
        return inner.length ? inner : $h;
    }
    /**
     * Open Disadvantage Configuration Dialog
     */
    async #openDisadvantageConfigDialog(def, editIndex, existingDetails) {
        const mergedDetails = def.id === 'mental-restrictions'
            ? detailsForMentalRestrictionsDialog(existingDetails)
            : def.id === 'physical-scars'
                ? detailsForPhysicalScarsDialog(existingDetails)
                : existingDetails || {};
        const content = await foundry.applications.handlebars.renderTemplate('systems/mastery-system/templates/dialogs/disadvantage-config.hbs', {
            disadvantage: def,
            details: mergedDetails
        });
        const configDialog = new Dialog({
            title: `${editIndex !== undefined ? 'Edit' : 'Add'} ${def.name}`,
            content,
            width: 600,
            height: 560,
            resizable: true,
            buttons: {
                save: {
                    icon: '<i class="fas fa-check"></i>',
                    label: 'Save',
                    callback: async (html) => {
                        const $root = this.#disadvantageDialogFormRoot($(html));
                        const details = {};
                        for (const field of def.fields || []) {
                            if (field.type === 'number') {
                                details[field.name] = parseInt($root.find(`[name="${field.name}"]`).val()) || 0;
                            }
                            else if (field.type === 'select') {
                                details[field.name] = $root.find(`[name="${field.name}"]`).val();
                            }
                            else if (field.type === 'textarea') {
                                details[field.name] = String($root.find(`[name="${field.name}"]`).val() || '').trim();
                            }
                            else {
                                details[field.name] = String($root.find(`[name="${field.name}"]`).val() || '').trim();
                            }
                        }
                        delete details.name;
                        if (def.id === 'physical-scars' && details.tier && String(details.sheetTitle || '').trim()) {
                            delete details.scar;
                            delete details.description;
                        }
                        if (def.id === 'mental-restrictions' && String(details.sheetTitle || '').trim()) {
                            delete details.restriction;
                            delete details.type;
                        }
                        // Validate required fields are not empty
                        for (const field of def.fields || []) {
                            if (field.required && !details[field.name]?.toString().trim()) {
                                ui.notifications?.warn(`"${field.label}" is required and cannot be empty.`);
                                return false;
                            }
                        }
                        const points = calculateDisadvantagePoints(def.id, details);
                        const system = this.actor.system;
                        const currentDisadvantages = [...(system.disadvantages || [])];
                        const newSelection = { id: def.id, details };
                        const forValidation = editIndex !== undefined
                            ? currentDisadvantages.filter((_, i) => i !== editIndex)
                            : [...currentDisadvantages];
                        const validation = validateDisadvantageSelection([...forValidation, newSelection]);
                        if (!validation.valid) {
                            ui.notifications?.error(validation.error || 'Invalid disadvantage selection');
                            return false;
                        }
                        const entry = {
                            id: def.id,
                            name: def.name,
                            points,
                            details,
                            description: def.description
                        };
                        if (editIndex !== undefined) {
                            currentDisadvantages[editIndex] = entry;
                        }
                        else {
                            currentDisadvantages.push(entry);
                        }
                        // Mark disadvantages as reviewed
                        const updateData = { 'system.disadvantages': currentDisadvantages };
                        if (!this.actor.system.creation?.disadvantagesReviewed) {
                            updateData['system.creation.disadvantagesReviewed'] = true;
                        }
                        await this.actor.update(updateData);
                        ui.notifications?.info(`${editIndex !== undefined ? 'Updated' : 'Added'} ${def.name} (${points} points)`);
                        this.render();
                        return true;
                    }
                },
                cancel: {
                    icon: '<i class="fas fa-times"></i>',
                    label: 'Cancel',
                    callback: () => { }
                }
            },
            default: 'save'
        });
        await configDialog.render(true);
        this.#wireDisadvantageExamplePresets(configDialog.element, def);
        this.#setupDisadvantageDialogChrome(configDialog, 'config');
    }
    /**
     * Finalize Character Creation
     */
    async #onFinalizeCreation(event) {
        event.preventDefault();
        const system = this.actor.system;
        const masteryRank = system.mastery?.rank || 2;
        const skillPointsConfig = CONFIG.MASTERY?.creation?.skillPoints || 40;
        const attributeKeys = ['might', 'agility', 'vitality', 'intellect', 'resolve', 'influence', 'wits'];
        let skillPointsSpent = 0;
        for (const skillValue of Object.values(system.skills || {})) {
            skillPointsSpent += (typeof skillValue === 'number' ? skillValue : 0);
        }
        const disadvantagePoints = (system.disadvantages || []).reduce((sum, d) => sum + (d.points || 0), 0);
        const maxDisadvantagePts = CONFIG.MASTERY?.creation?.maxDisadvantagePoints ?? 8;
        const minDisadvantagePts = CONFIG.MASTERY?.creation?.minDisadvantagePoints ?? 2;
        // Validate powers & magic
        const powers = this.actor.items.filter((item) => item.type === 'power');
        const creationCategoryCounts = countPowersByCategory(powers);
        // Validate attribute distribution (2×8, 2×6, 2×4, 1×2)
        const attrValues = attributeKeys.map(key => system.attributes?.[key]?.value || masteryRank);
        const c8 = attrValues.filter((v) => v === 8).length;
        const c6 = attrValues.filter((v) => v === 6).length;
        const c4 = attrValues.filter((v) => v === 4).length;
        const c2 = attrValues.filter((v) => v === 2).length;
        if (c8 !== 2 || c6 !== 2 || c4 !== 2 || c2 !== 1) {
            ui.notifications?.error(`Attributes must be 2×8, 2×6, 2×4, 1×2. Currently: ${c8}×8, ${c6}×6, ${c4}×4, ${c2}×2`);
            return;
        }
        if (skillPointsSpent !== skillPointsConfig) {
            ui.notifications?.error(`Must spend exactly ${skillPointsConfig} skill points. Currently spent: ${skillPointsSpent}`);
            return;
        }
        for (const cat of CATEGORY_ORDER) {
            const need = CREATION_POWER_REQUIREMENTS[cat];
            const have = creationCategoryCounts[cat];
            if (have !== need) {
                ui.notifications?.error(`Must choose exactly ${need} ${CATEGORY_LABELS[cat]} power(s). Currently: ${have}.`);
                return;
            }
        }
        const duplicatePower = findDuplicatePowerLabel(powers);
        if (duplicatePower) {
            ui.notifications?.error(`Duplicate power "${duplicatePower}". Each power template can only be chosen once.`);
            return;
        }
        if (powers.length !== CREATION_POWER_TOTAL) {
            ui.notifications?.error(`Must choose exactly ${CREATION_POWER_TOTAL} starting Powers. Currently: ${powers.length}.`);
            return;
        }
        const startingPowersAtRank2 = powers.filter((p) => Number(p.system?.level ?? 1) >= 2).length;
        if (startingPowersAtRank2 !== CREATION_POWERS_AT_RANK_2) {
            ui.notifications?.error(`All ${CREATION_POWER_TOTAL} starting Powers must be at Rank 2 (currently ${startingPowersAtRank2}).`);
            return;
        }
        if (disadvantagePoints < minDisadvantagePts) {
            ui.notifications?.error(`You must take at least ${minDisadvantagePts} points of disadvantages to finish creation (currently ${disadvantagePoints}).`);
            return;
        }
        if (disadvantagePoints > maxDisadvantagePts) {
            ui.notifications?.error(`Disadvantages cannot exceed ${maxDisadvantagePts} points (currently ${disadvantagePoints}).`);
            return;
        }
        const rawEcho = system.echo || {};
        const echoDef = getEcho(rawEcho.key);
        const echoSubChoice = echoDef?.subChoices?.length
            ? getEchoSubChoice(rawEcho.key, rawEcho.subChoiceKey || null)
            : undefined;
        if (!echoDef) {
            ui.notifications?.error('Choose an Echo before finalizing character creation.');
            return;
        }
        if (echoDef.subChoices?.length && !rawEcho.subChoiceKey) {
            ui.notifications?.error(`Choose a ${echoDef.subChoiceLabel || 'sub-choice'} for your Echo before finalizing.`);
            return;
        }
        if (echoDef.veiledForm && !rawEcho.veiledFormKey) {
            ui.notifications?.error('Choose a Veiled Form for your Dragonborn before finalizing.');
            return;
        }
        const startCards = Array.isArray(rawEcho.selectedCardIds)
            ? rawEcho.selectedCardIds.filter((id) => typeof id === 'string')
            : [];
        if (startCards.length < 1) {
            ui.notifications?.error('Pick at least one Echo start card before finalizing.');
            return;
        }
        const langNorm = normalizeKnownLanguages(system.languages?.known);
        if (!langNorm.creationValid) {
            ui.notifications?.error('Pick at least one additional language (besides Common) before finalizing.');
            return;
        }
        void echoSubChoice;
        // Validate power ranks don't exceed Mastery Rank
        const invalidPowers = powers.filter((p) => (p.system?.level || 1) > masteryRank);
        if (invalidPowers.length > 0) {
            ui.notifications?.error(`Power ranks cannot exceed Mastery Rank ${masteryRank}. Invalid: ${invalidPowers.map((p) => p.name).join(', ')}`);
            return;
        }
        // Validate schticks per rank
        const schticksRanks = system.schticks?.ranks || [];
        const schticksRows = [];
        for (let rank = 1; rank <= masteryRank; rank++) {
            const rankData = schticksRanks.find((r) => r.rank === rank);
            schticksRows.push({
                rank,
                schtickName: rankData?.schtickName || '',
                manifestation: rankData?.manifestation || ''
            });
        }
        // Schticks validation removed - no longer required
        console.log('Mastery System | Finalizing character creation - persisting schticks:', schticksRanks);
        // Sync Faith Fractures: Disadvantage Points = Starting Faith Fractures (both current and maximum)
        const updateData = {
            'system.creation.complete': true,
            'system.faithFractures.current': disadvantagePoints,
            'system.faithFractures.maximum': disadvantagePoints
        };
        // Always persist full per-rank schtick rows (merged 1..MR) so actor data matches the sheet after finalize
        updateData['system.schticks.ranks'] = schticksRows;
        const attributeBaselines = {};
        for (const key of attributeKeys) {
            attributeBaselines[key] = system.attributes?.[key]?.value ?? 2;
        }
        const postCreationProgress = buildPostCreationSnapshot(this.actor);
        // XP: preserve GM-granted (or other) pool earned before finalize — do not zero the sheet on complete.
        const points = system.points || {};
        const xpExisting = system.xp || {};
        let preservedAvailable = Math.max(0, Number(points.xp) || 0);
        let preservedTotalEarned = Math.max(0, Number(xpExisting.totalEarned) || 0);
        const preservedTotalSpent = Math.max(0, Number(xpExisting.totalSpent) || 0);
        const preservedHistory = Array.isArray(xpExisting.history) ? [...xpExisting.history] : [];
        if (preservedTotalEarned === 0 && preservedAvailable > 0) {
            preservedTotalEarned = preservedAvailable;
        }
        if (preservedAvailable === 0 && preservedTotalEarned > preservedTotalSpent) {
            preservedAvailable = preservedTotalEarned - preservedTotalSpent;
        }
        updateData['system.points.xp'] = preservedAvailable;
        updateData['system.xp.totalEarned'] = preservedTotalEarned;
        updateData['system.xp.totalSpent'] = preservedTotalSpent;
        updateData['system.xp.attributeBaselines'] = attributeBaselines;
        updateData['system.xp.postCreationProgress'] = postCreationProgress;
        updateData['system.xp.history'] = preservedHistory;
        // Free XP pool: preserve any already-granted Free XP across finalize.
        updateData['system.points.xpFree'] = Math.max(0, Number(points.xpFree) || 0);
        updateData['system.xp.freeEarned'] = Math.max(0, Number(xpExisting.freeEarned) || 0);
        updateData['system.xp.freeSpent'] = Math.max(0, Number(xpExisting.freeSpent) || 0);
        // Initialize the once-per-step bump bucket at finalize.
        updateData['system.xp.currentStep'] = { attributes: [], skills: [], powers: [], artifacts: [] };
        try {
            await this.actor.update(updateData, { render: false });
            // Ensure all power items have minLevel set to their current level
            const powerItems = this.actor.items.filter((item) => item.type === 'power');
            for (const power of powerItems) {
                const lvl = power.system.level ?? 1;
                const min = power.system.minLevel;
                if (min === undefined || min === null) {
                    await power.update({ 'system.minLevel': lvl });
                }
            }
            const refreshed = game.actors?.get(this.actor.id) ?? this.actor;
            const savedPowers = refreshed.items.filter((item) => item.type === 'power');
            const savedCounts = countPowersByCategory(savedPowers);
            const echoLabel = [
                echoDef.name,
                echoSubChoice?.name,
                echoDef.veiledForm && rawEcho.veiledFormKey ? `veiled as ${getEcho(rawEcho.veiledFormKey)?.name || rawEcho.veiledFormKey}` : '',
            ].filter(Boolean).join(' · ');
            if (savedPowers.length !== CREATION_POWER_TOTAL) {
                ui.notifications?.warn(`Character creation marked complete, but only ${savedPowers.length} of ${CREATION_POWER_TOTAL} Powers are on this actor. Check the Items tab in the sidebar — if powers are missing, re-add them before playing.`);
            }
            else {
                ui.notifications?.info(`Character creation complete — ${savedPowers.length} Powers saved (${CATEGORY_ORDER.map(c => `${savedCounts[c]} ${CATEGORY_LABELS[c]}`).join(', ')}). Echo: ${echoLabel}.`);
            }
            this._powersListDetailsOpen = true;
            this.render(false);
        }
        catch (error) {
            console.error('Mastery System | Failed to finalize character creation', error);
            ui.notifications?.error('Failed to finalize character creation.');
        }
    }
    /** @override */
    async _onSubmit(event, options) {
        // Block updates if creation is incomplete
        const creationComplete = this.actor.system?.creation?.complete !== false;
        if (!creationComplete && !game.user?.isGM) {
            event.preventDefault();
            ui.notifications?.warn('Character creation is incomplete. Please complete character creation first.');
            return false;
        }
        return super._onSubmit(event, options);
    }
    /**
     * Wire a freshly embedded artifact to the world evolution tree when possible.
     */
    async #tryWireDroppedArtifact(embedded, sourceWorld) {
        if (!embedded || embedded.type !== 'artifact')
            return;
        if (embedded.getFlag?.('mastery-system', 'evolutionRootItemId'))
            return;
        const sourceNodeId = sourceWorld?.getFlag?.('mastery-system', 'nodeId');
        const embeddedNodeId = embedded.getFlag?.('mastery-system', 'nodeId');
        if (!sourceNodeId && !embeddedNodeId) {
            const { inferArtifactKeyFromName } = await import('../utils/artifact-tree-grant.js');
            if (!inferArtifactKeyFromName(embedded.name) && !sourceWorld)
                return;
        }
        const { wireEmbeddedArtifactToWorldTree } = await import('../utils/artifact-tree-grant.js');
        await wireEmbeddedArtifactToWorldTree(this.actor, embedded, { sourceWorldItem: sourceWorld });
    }
    /**
     * Handle drag and drop for equipment
     */
    async _onDrop(event) {
        if (event.__msDropHandled) {
            console.log('Mastery System | [Equipment Drop] Skipping duplicate drop event');
            return false;
        }
        event.__msDropHandled = true;
        const TextEditorImpl = foundry.applications?.ux?.TextEditor?.implementation || TextEditor;
        const data = TextEditorImpl.getDragEventData(event);
        const path = (event.composedPath?.() || []);
        const pathDropTarget = path.find(el => el?.dataset?.dfDrop);
        const resolvedTarget = event.__msDropTarget
            || event.target?.closest('[data-df-drop]')
            || pathDropTarget
            || null;
        const target = resolvedTarget;
        console.log('Mastery System | [Equipment Drop] Event', {
            hasTarget: !!target,
            dropType: target?.dataset?.dfDrop,
            band: target?.dataset?.band,
            slot: target?.dataset?.slot,
            dragData: data,
            dataTransferTypes: Array.from(event.dataTransfer?.types || []),
            pathHasDropTarget: !!pathDropTarget,
            hasOverrideTarget: !!event.__msDropTarget
        });
        if (!target) {
            return super._onDrop(event);
        }
        // Get dropped item
        let droppedItem = null;
        if (data.uuid) {
            droppedItem = await fromUuid(data.uuid);
        }
        else if (data.data?._id) {
            droppedItem = this.actor.items.get(data.data._id);
        }
        if (!droppedItem) {
            const dragItemId = window.__msDragItemId;
            if (dragItemId) {
                droppedItem = this.actor.items.get(dragItemId);
            }
        }
        console.log('Mastery System | [Equipment Drop] Resolved item', {
            itemId: droppedItem?.id,
            itemName: droppedItem?.name,
            itemUuid: droppedItem?.uuid,
            itemParent: droppedItem?.parent?.id
        });
        if (!droppedItem) {
            let sourceWorldItem = null;
            if (data.uuid) {
                try {
                    sourceWorldItem = await fromUuid(data.uuid);
                }
                catch {
                    sourceWorldItem = null;
                }
            }
            // External item - let parent handle creation first
            const itemCountBefore = this.actor.items.size;
            const result = await super._onDrop(event);
            if (!result)
                return false;
            // Wait a bit for item to be created, then find it
            await new Promise(resolve => setTimeout(resolve, 100));
            const itemCountAfter = this.actor.items.size;
            if (itemCountAfter > itemCountBefore) {
                // Find the newly created item (last item in collection)
                const itemsArray = Array.from(this.actor.items.values());
                droppedItem = itemsArray[itemsArray.length - 1];
                if (droppedItem) {
                    console.log('Mastery System | [Equipment Drop] New embedded item created via super._onDrop', {
                        itemId: droppedItem.id,
                        itemName: droppedItem.name
                    });
                    await this.#tryWireDroppedArtifact(droppedItem, sourceWorldItem);
                    // New item created, now set flags
                    await this.#updateItemEquipmentFlags(droppedItem, target, event);
                    this._lastDroppedItemId = droppedItem?.id;
                    this._lastDroppedItemName = droppedItem?.name;
                    await new Promise(resolve => setTimeout(resolve, 0));
                    await this.render(true, { focus: false });
                }
            }
            return true;
        }
        // World/compendium item dropped on sheet - create embedded copy first
        if (!droppedItem.parent || droppedItem.parent.id !== this.actor.id) {
            const sourceWorldItem = droppedItem;
            const itemData = this.#sanitizeItemDataForActorEmbed(droppedItem.toObject());
            console.log('Mastery System | [Equipment Drop] Creating embedded copy', {
                sourceId: droppedItem?.id,
                sourceName: droppedItem?.name,
                targetActor: this.actor?.id
            });
            try {
                const [created] = await this.actor.createEmbeddedDocuments('Item', [itemData], { render: false });
                console.log('Mastery System | [Equipment Drop] Embedded create result', {
                    createdId: created?.id,
                    createdName: created?.name
                });
                if (!created)
                    return false;
                droppedItem = created;
                await this.#tryWireDroppedArtifact(created, sourceWorldItem);
            }
            catch (error) {
                console.error('Mastery System | [Equipment Drop] Failed to create embedded item', error);
                ui.notifications?.error(`Could not add ${droppedItem.name} to this character.`);
                return false;
            }
        }
        // Internal item - update flags
        await this.#updateItemEquipmentFlags(droppedItem, target, event);
        this._lastDroppedItemId = droppedItem?.id;
        this._lastDroppedItemName = droppedItem?.name;
        await new Promise(resolve => setTimeout(resolve, 0));
        await this.render(true, { focus: false });
        return true;
    }
    /** Item currently occupying an equipment slot (flags + legacy equipped). */
    #getItemInEquipSlot(slotKey) {
        const items = Array.from(this.actor.items.values());
        for (const it of items) {
            const flags = it.getFlag('mastery-system', 'equipment') || {};
            if (flags.slot === slotKey) {
                return it;
            }
        }
        if (slotKey === 'mainhand') {
            const weapons = items.filter((it) => it.type === 'weapon' && it.system?.equipped === true);
            if (weapons.length > 0)
                return weapons[0];
        }
        else if (slotKey === 'offhand') {
            const shields = items.filter((it) => it.type === 'shield' && it.system?.equipped === true);
            if (shields.length > 0)
                return shields[0];
        }
        else if (slotKey === 'body') {
            const armor = items.filter((it) => it.type === 'armor' && it.system?.equipped === true);
            if (armor.length > 0)
                return armor[0];
        }
        return null;
    }
    /**
     * Move an embedded item into a paperdoll slot (same rules as drag-drop onto that slot).
     * @returns whether the item was updated successfully
     */
    async #applyEquipToSlot(item, slot) {
        if (!item?.id || item.parent?.id !== this.actor.id) {
            ui.notifications?.warn('Item must be on this actor to equip.');
            return false;
        }
        const allowed = getNormalizedEquipSlots(item);
        if (!allowed) {
            ui.notifications?.warn('This item cannot be equipped. Set system.equipSlots on the item (non-empty list of slot keys).');
            return false;
        }
        if (!allowed.includes(slot)) {
            ui.notifications?.warn(`This item can only be equipped in: ${allowed.join(', ')}`);
            return false;
        }
        if (slot === 'offhand' && item.type === 'weapon') {
            ui.notifications?.warn('Weapons can only be equipped in the main hand. Use the off hand for a shield.');
            return false;
        }
        if (slot === 'mainhand' && item.type === 'weapon' && item.system?.hands === 2) {
            const offhandItem = this.#getItemInEquipSlot('offhand');
            if (offhandItem) {
                ui.notifications?.warn('Cannot equip 2-handed weapon while offhand is occupied.');
                return false;
            }
        }
        else if (slot === 'offhand' && item.type === 'shield') {
            const mainhandItem = this.#getItemInEquipSlot('mainhand');
            if (mainhandItem && mainhandItem.type === 'weapon' && mainhandItem.system?.hands === 2) {
                ui.notifications?.warn('Cannot equip shield while 2-handed weapon is equipped.');
                return false;
            }
        }
        const previousItem = this.#getItemInEquipSlot(slot);
        if (previousItem && previousItem.id !== item.id) {
            // Echo-bound artifacts permanently occupy their slot and cannot be
            // displaced (e.g. Elven Stride on Feet, Dragon Head on Head).
            if (isEchoLockedItem(previousItem)) {
                ui.notifications?.warn(`${previousItem.name} is Echo-bound and permanently occupies the ${slot} slot. Nothing else can be equipped there.`);
                return false;
            }
            const prevFlags = previousItem.getFlag('mastery-system', 'equipment') || {};
            const newPrevFlags = { ...prevFlags, slot: null };
            await previousItem.update({
                'flags.mastery-system.equipment': newPrevFlags,
                'system.equipped': false
            });
        }
        const currentFlags = item.getFlag('mastery-system', 'equipment') || {};
        const newFlags = { ...currentFlags, container: 'inventory', slot, band: currentFlags.band || 'not' };
        await item.update({
            'flags.mastery-system.equipment': newFlags,
            'system.equipped': true
        });
        console.log('Mastery System | [Equip] Applied slot', { itemId: item.id, slot });
        return true;
    }
    /**
     * Resolve actor Item from a context-menu target (jQuery or HTMLElement).
     */
    #itemFromInventoryTileContextTarget(target) {
        let el = null;
        if (target && typeof target.jquery === 'string') {
            const jq = target;
            el = jq[0] || null;
        }
        else if (target instanceof HTMLElement) {
            el = target;
        }
        if (!el)
            return null;
        const tile = el.closest('.df-draggable-item');
        const id = tile?.dataset?.itemId;
        if (!id)
            return null;
        const item = this.actor.items.get(id);
        return item?.parent?.id === this.actor.id ? item : null;
    }
    /** Right-click equip: slots shown in equipment tab inventory / stash grids. */
    #inventoryEquipContextMenuEntries() {
        const slots = [
            { key: 'mainhand', label: 'Main Hand' },
            { key: 'offhand', label: 'Off Hand' },
            { key: 'body', label: 'Body' },
            { key: 'head', label: 'Head' },
            { key: 'feet', label: 'Feet' },
            { key: 'amulet', label: 'Amulet' },
            { key: 'ring', label: 'Ring' },
        ];
        const entries = [
            {
                name: 'Equip (main hand)',
                icon: '<i class="fas fa-hand-fist"></i>',
                group: 'quick',
                condition: (target) => {
                    const item = this.#itemFromInventoryTileContextTarget(target);
                    return !!item && !!getNormalizedEquipSlots(item)?.includes('mainhand');
                },
                callback: async (target) => {
                    const item = this.#itemFromInventoryTileContextTarget(target);
                    if (!item)
                        return;
                    if (await this.#applyEquipToSlot(item, 'mainhand')) {
                        await this.render(true, { focus: false });
                    }
                }
            },
            {
                name: 'Equip (off hand)',
                icon: '<i class="fas fa-shield-alt"></i>',
                group: 'quick',
                condition: (target) => {
                    const item = this.#itemFromInventoryTileContextTarget(target);
                    return (!!item &&
                        item.type !== 'weapon' &&
                        !!getNormalizedEquipSlots(item)?.includes('offhand'));
                },
                callback: async (target) => {
                    const item = this.#itemFromInventoryTileContextTarget(target);
                    if (!item)
                        return;
                    if (await this.#applyEquipToSlot(item, 'offhand')) {
                        await this.render(true, { focus: false });
                    }
                }
            },
            {
                name: 'Equip (body)',
                icon: '<i class="fas fa-tshirt"></i>',
                group: 'quick',
                condition: (target) => {
                    const item = this.#itemFromInventoryTileContextTarget(target);
                    return !!item && !!getNormalizedEquipSlots(item)?.includes('body');
                },
                callback: async (target) => {
                    const item = this.#itemFromInventoryTileContextTarget(target);
                    if (!item)
                        return;
                    if (await this.#applyEquipToSlot(item, 'body')) {
                        await this.render(true, { focus: false });
                    }
                }
            }
        ];
        for (const { key, label } of slots) {
            entries.push({
                name: `Equip: ${label}`,
                icon: '<i class="fas fa-arrow-right"></i>',
                group: 'slot',
                condition: (target) => {
                    const item = this.#itemFromInventoryTileContextTarget(target);
                    if (!item || !getNormalizedEquipSlots(item)?.includes(key))
                        return false;
                    if (key === 'offhand' && item.type === 'weapon')
                        return false;
                    return true;
                },
                callback: async (target) => {
                    const item = this.#itemFromInventoryTileContextTarget(target);
                    if (!item)
                        return;
                    if (await this.#applyEquipToSlot(item, key)) {
                        await this.render(true, { focus: false });
                    }
                }
            });
        }
        entries.push({
            name: 'Cannot equip (no equip slots on item)',
            icon: '<i class="fas fa-info-circle"></i>',
            group: 'info',
            condition: (target) => {
                const item = this.#itemFromInventoryTileContextTarget(target);
                return !!item && !getNormalizedEquipSlots(item);
            },
            callback: () => {
                ui.notifications?.info('Set system.equipSlots on this item to a non-empty array of slot keys (e.g. ["mainhand"], ["body"], ["ring"]).');
            }
        });
        return entries;
    }
    /** Strip legacy auto-seeded Unarmed weapon items (virtual unarmed replaces them). */
    async #purgeLegacyUnarmedItems() {
        const legacyIds = Array.from(this.actor.items.values())
            .filter((item) => isLegacyUnarmedItem(item))
            .map((item) => item.id)
            .filter(Boolean);
        if (legacyIds.length === 0)
            return;
        try {
            await this.actor.deleteEmbeddedDocuments('Item', legacyIds, { masterySystemForceDelete: true });
            console.log(`Mastery System | Removed ${legacyIds.length} legacy Unarmed item(s) from ${this.actor.name}`);
            await this.render(false);
        }
        catch (error) {
            console.warn(`Mastery System | Could not remove legacy Unarmed from ${this.actor.name}:`, error);
        }
    }
    /** Clone item data for embedding on this actor without stale cross-document ids. */
    #sanitizeItemDataForActorEmbed(itemData) {
        const data = foundry.utils.deepClone(itemData);
        delete data._id;
        delete data.folder;
        delete data.ownership;
        delete data.sort;
        return data;
    }
    /** Resolve the inventory grid cell under a drop event (if any). */
    #resolveDropCell(event) {
        if (!event)
            return null;
        const fromEvent = event.__msDropCell;
        if (fromEvent?.classList?.contains('df-cell'))
            return fromEvent;
        const fromTarget = event.target?.closest?.('.df-cell');
        if (fromTarget)
            return fromTarget;
        const path = (event.composedPath?.() || []);
        return path.find(el => el?.classList?.contains?.('df-cell')) || null;
    }
    /** Collect occupied inventory rects for a band (excluding one item id). */
    #inventoryBandRects(band, excludeItemId) {
        const BAND_COLS = 24;
        const BAND_ROWS = 9;
        return Array.from(this.actor.items.values())
            .filter((it) => it.id !== excludeItemId)
            .map((it) => {
            const flags = it.getFlag?.('mastery-system', 'equipment') || {};
            if (flags.container !== 'inventory' || flags.band !== band || !flags.grid?.x || !flags.grid?.y)
                return null;
            const s = parseInventorySize(it.system?.inventorySize);
            return {
                x: flags.grid.x,
                y: flags.grid.y,
                w: Math.min(BAND_COLS, s.w),
                h: Math.min(BAND_ROWS, s.h)
            };
        })
            .filter(Boolean);
    }
    /**
     * Helper: Update item equipment flags based on drop target
     */
    async #updateItemEquipmentFlags(item, target, event) {
        const dropType = target.dataset.dfDrop;
        if (!dropType)
            return;
        // Echo-bound artifacts are locked into their slot — they cannot be moved to
        // the stash or an inventory band (i.e. unequipped).
        if (isEchoLockedItem(item) && (dropType === 'stash' || dropType === 'band')) {
            ui.notifications?.warn(`${item.name} is Echo-bound and cannot be unequipped.`);
            return;
        }
        const currentFlags = item.getFlag('mastery-system', 'equipment') || {};
        const newFlags = { ...currentFlags };
        console.log('Mastery System | [Equipment Drop] Update flags start', {
            itemId: item?.id,
            itemName: item?.name,
            dropType,
            band: target.dataset?.band,
            slot: target.dataset?.slot,
            currentFlags
        });
        if (dropType === 'stash') {
            newFlags.container = 'stash';
            newFlags.band = null;
            newFlags.slot = null;
            await item.update({
                'flags.mastery-system.equipment': newFlags,
                'system.equipped': false
            });
            console.log('Mastery System | [Equipment Drop] Update flags stash', { newFlags });
        }
        else if (dropType === 'band') {
            const band = target.dataset.band;
            if (band === 'not' || band === 'enc' || band === 'heavy') {
                newFlags.container = 'inventory';
                newFlags.band = band;
                newFlags.slot = null;
                const BAND_COLS = 24;
                const BAND_ROWS = 9;
                const size = parseInventorySize(item?.system?.inventorySize);
                const w = Math.min(BAND_COLS, size.w);
                const h = Math.min(BAND_ROWS, size.h);
                const cell = this.#resolveDropCell(event);
                let gridPos = null;
                if (cell) {
                    const col = Number(cell.dataset?.col || 0);
                    const row = Number(cell.dataset?.row || 0);
                    if (col > 0 && row > 0) {
                        const candidate = { x: col, y: row, w, h };
                        const rects = this.#inventoryBandRects(band, item.id);
                        const fits = fitsInGrid(candidate.x, candidate.y, candidate.w, candidate.h, BAND_COLS, BAND_ROWS)
                            && !rects.some(rect => rectsOverlap(rect, candidate));
                        if (fits) {
                            gridPos = { x: col, y: row };
                        }
                    }
                }
                if (!gridPos) {
                    const rects = this.#inventoryBandRects(band, item.id);
                    gridPos = findFirstFit(rects, w, h, BAND_COLS, BAND_ROWS);
                }
                if (!gridPos) {
                    ui.notifications?.warn('No space for this item in inventory.');
                    return;
                }
                newFlags.grid = gridPos;
                await item.update({
                    'flags.mastery-system.equipment': newFlags,
                    'system.equipped': false
                });
                console.log('Mastery System | [Equipment Drop] Update flags band', { newFlags });
            }
        }
        else if (dropType === 'equip-slot') {
            const slot = target.dataset.slot;
            if (!slot)
                return;
            await this.#applyEquipToSlot(item, slot);
        }
        else if (dropType === 'equip-trash') {
            if (isEchoLockedItem(item)) {
                ui.notifications?.warn(`${item.name} is Echo-bound and cannot be deleted.`);
                return;
            }
            if (isLegacyUnarmedItem(item)) {
                await this.actor.deleteEmbeddedDocuments('Item', [item.id], { masterySystemForceDelete: true });
                ui.notifications?.info('Removed legacy Unarmed item (melee uses virtual unarmed).');
                return;
            }
            const confirmed = await Dialog.confirm({
                title: 'Delete Item',
                content: `<p>Delete <strong>${item.name}</strong> permanently?</p>`,
                yes: () => true,
                no: () => false,
                defaultYes: false,
            });
            if (confirmed) {
                await item.delete();
                ui.notifications?.info(`Deleted ${item.name}.`);
            }
        }
    }
}
//# sourceMappingURL=character-sheet.js.map