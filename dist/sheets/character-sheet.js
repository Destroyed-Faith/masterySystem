/**
 * Character Sheet for Mastery System
 * Main player character sheet with tabs for attributes, skills, powers, etc.
 */
import { quickRoll } from '../dice/roll-handler.js';
import { SKILLS } from '../utils/skills.js';
import { DISADVANTAGES, getDisadvantageDefinition, calculateDisadvantagePoints, validateDisadvantageSelection } from '../system/disadvantages.js';
import { getAllMasteryTrees } from '../utils/mastery-trees.js';
import { getAllSpellSchools } from '../utils/spell-schools.js';
import { getAllSchticks } from '../utils/schticks.js';
import { showPowerCreationDialog } from './character-sheet-power-dialog.js';
import { findFirstFit, fitsInGrid, parseInventorySize, rectsOverlap } from '../utils/inventory-grid.js';
import { getDefaultInventorySizeForItemData } from '../utils/seed-general-items.js';
// Removed: showWeaponCreationDialog, showArmorCreationDialog, showShieldCreationDialog
// Replaced with General Items Storage and Store dialogs
// Use namespaced ActorSheet when available to avoid deprecation warnings
const BaseActorSheet = foundry?.appv1?.sheets?.ActorSheet || ActorSheet;
export class MasteryCharacterSheet extends BaseActorSheet {
    _showStash = false;
    _pendingAttributeChanges = {}; // Track pending attribute increases
    _pendingPowerLevelChanges = {}; // Track pending power level increases
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
                { dragSelector: '.df-draggable-item', dropSelector: '.df-dropzone' }
            ],
            scrollY: ['.attributes', '.skills', '.powers', '.equipment']
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
     * Add Power during character creation
     */
    async #onPowerAddCreation(event) {
        event.preventDefault();
        console.log('Mastery System | #onPowerAddCreation called', {
            actorId: this.actor.id,
            creationComplete: this.actor.system?.creation?.complete
        });
        await this.#openPowerDialogCreation('mastery');
    }
    /**
     * Add Spell during character creation
     */
    async #onSpellAddCreation(event) {
        event.preventDefault();
        console.log('Mastery System | #onSpellAddCreation called', {
            actorId: this.actor.id,
            creationComplete: this.actor.system?.creation?.complete
        });
        await this.#openPowerDialogCreation('magic');
    }
    /**
     * Open Power Creation Dialog with creation limits enforced
     */
    async #openPowerDialogCreation(context) {
        console.log('Mastery System | #openPowerDialogCreation called', {
            context,
            actorId: this.actor.id,
            creationComplete: this.actor.system?.creation?.complete
        });
        try {
            // Use the regular dialog - it now enforces creation limits automatically
            await showPowerCreationDialog(this.actor, context);
            console.log('Mastery System | Power dialog closed, re-rendering');
            // Re-render to update counters
            this.render();
        }
        catch (error) {
            console.error('Mastery System | Failed to open power creation dialog', error);
            ui.notifications?.error('Failed to open power selection dialog');
        }
    }
    /**
     * Handle power rank change during creation
     */
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
    /** @override */
    async getData(options) {
        const context = await super.getData(options);
        const actorData = context.actor;
        // Add system data
        context.system = actorData.system;
        context.flags = actorData.flags;
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
        const skillPointsConfig = CONFIG.MASTERY?.creation?.skillPoints || 16;
        // Calculate attribute points spent
        let attributePointsSpent = 0;
        const attributeKeys = ['might', 'agility', 'vitality', 'intellect', 'resolve', 'influence', 'wits'];
        for (const key of attributeKeys) {
            const attrValue = context.system.attributes?.[key]?.value || masteryRank;
            if (attrValue > masteryRank) {
                attributePointsSpent += attrValue - masteryRank;
            }
        }
        // Calculate skill points spent
        let skillPointsSpent = 0;
        for (const skillValue of Object.values(context.system.skills || {})) {
            skillPointsSpent += (typeof skillValue === 'number' ? skillValue : 0);
        }
        // Calculate disadvantage points
        const disadvantagePoints = (context.system.disadvantages || []).reduce((sum, d) => sum + (d.points || 0), 0);
        // Check if disadvantages phase is reviewed (user has visited the tab or interacted with disadvantages)
        const disadvantagesReviewed = context.system.creation?.disadvantagesReviewed === true ||
            (context.system.disadvantages && Array.isArray(context.system.disadvantages));
        // Calculate powers & magic creation status
        const items = this.#prepareItems();
        const powers = items.powers || [];
        const selectedTrees = this.#getSelectedTrees(powers);
        // During creation, all powers count (trees are optional)
        const selectedPowers = powers;
        const powersAtRank2 = selectedPowers.filter((p) => (p.system?.level || 1) === 2);
        // Load tree/school data with bonuses for selected trees
        const allTrees = getAllMasteryTrees();
        const allSchools = getAllSpellSchools();
        const selectedTreesData = selectedTrees.map((treeName) => {
            // Try to find in mastery trees first
            let treeData = allTrees.find((t) => t.name === treeName);
            if (treeData) {
                return {
                    name: treeData.name,
                    type: 'mastery',
                    bonus: treeData.bonus || null,
                    focus: treeData.focus,
                    roles: treeData.roles || []
                };
            }
            // Try spell schools
            const schoolData = allSchools.find((s) => s.name === treeName || s.fullName === treeName);
            if (schoolData) {
                return {
                    name: schoolData.name,
                    type: 'spell',
                    bonus: schoolData.bonus || null,
                    focus: schoolData.focus,
                    roles: schoolData.roles || []
                };
            }
            // Fallback if not found
            return {
                name: treeName,
                type: 'unknown',
                bonus: null,
                focus: '',
                roles: []
            };
        });
        console.log('Mastery System | getData - Powers Status:', {
            totalPowers: powers.length,
            selectedTrees: selectedTrees,
            selectedTreesCount: selectedTrees.length,
            selectedPowersCount: selectedPowers.length,
            powersAtRank2Count: powersAtRank2.length,
            creationComplete: context.creationComplete,
            selectedTreesData: selectedTreesData
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
            attributePointsRemaining: 16 - attributePointsSpent,
            attributePointsSpent,
            skillPointsRemaining: skillPointsConfig - skillPointsSpent,
            skillPointsSpent,
            disadvantagePoints,
            disadvantagesReviewed,
            powersSelected: selectedPowers.length,
            powersRequired: 4,
            treesSelected: selectedTrees.length,
            treesRequired: 0, // Trees are now optional
            powersAtRank2: powersAtRank2.length,
            powersAtRank2Required: 2, // Max 2, not exactly 2
            powersAtRank2Max: 2,
            selectedTrees: selectedTrees,
            selectedTreesData: selectedTreesData,
            schticksRows: schticksRows,
            availableSchticks: availableSchticks,
            availableSchticksById: availableSchticksById,
            rankTooltips: rankTooltips,
            schticksValid: schticksValidation.ok,
            powersValid: selectedPowers.length === 4 && powersAtRank2.length <= 2,
            canFinalize: attributePointsSpent === 16 &&
                skillPointsSpent === skillPointsConfig &&
                selectedPowers.length === 4 &&
                powersAtRank2.length <= 2
        };
        console.log('Mastery System | getData - Final Context Check:', {
            creationComplete: context.creationComplete,
            creationCompleteType: typeof context.creationComplete,
            creationCompleteValue: String(context.creationComplete),
            systemCreationComplete: context.system.creation?.complete,
            creation: {
                treesSelected: context.creation?.treesSelected,
                powersSelected: context.creation?.powersSelected,
                powersAtRank2: context.creation?.powersAtRank2
            },
            itemsPowers: items.powers?.length || 0,
            willShowCreationUI: !context.creationComplete
        });
        // Get Mastery Rank from settings (per player or global default)
        const playerMasteryRanks = game.settings.get('mastery-system', 'playerMasteryRanks') || {};
        const defaultMasteryRank = game.settings.get('mastery-system', 'defaultMasteryRank') || 2;
        const playerId = this.actor.getFlag('mastery-system', 'playerId') || this.actor.ownership?.default || '';
        const masteryRankFromSettings = playerMasteryRanks[playerId] || defaultMasteryRank;
        // Use setting value if actor doesn't have one set, otherwise use actor's value
        if (!context.system.mastery?.rank) {
            context.system.mastery = context.system.mastery || {};
            context.system.mastery.rank = masteryRankFromSettings;
        }
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
        // Prepare disadvantages
        context.disadvantages = context.system.disadvantages || [];
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
        // Add status effects for the status bar (includes active buffs and other effects)
        context.statusEffects = [];
        try {
            if (this.actor.effects) {
                const effects = this.actor.effects || [];
                for (const effect of effects) {
                    const icon = effect.icon || effect.img || '';
                    if (icon) {
                        const flags = effect.flags?.['mastery-system'] || {};
                        const isActiveBuff = flags?.activeBuff === true;
                        let tooltip = effect.name;
                        let description = effect.description || effect.system?.description?.value || effect.system?.description || '';
                        if (isActiveBuff) {
                            const currentRound = game.combat?.round || 1;
                            const activatedRound = flags.activatedRound || 1;
                            const masteryRank = flags.masteryRank || 2;
                            const roundsRemaining = Math.max(0, masteryRank - (currentRound - activatedRound));
                            tooltip = `${effect.name}\nDuration: ${roundsRemaining} round${roundsRemaining !== 1 ? 's' : ''} remaining`;
                        }
                        context.statusEffects.push({
                            id: effect.id,
                            name: effect.name,
                            icon: icon,
                            tooltip: tooltip,
                            description: description,
                            isActiveBuff: isActiveBuff
                        });
                    }
                }
            }
            console.log('Mastery System | [CHARACTER SHEET] Status effects for bar:', context.statusEffects.length, context.statusEffects);
        }
        catch (error) {
            console.error('Mastery System | [CHARACTER SHEET] Failed to load status effects', error);
            context.statusEffects = [];
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
                    gear.push(itemData);
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
        // Sort powers by tree and level
        powers.sort((a, b) => {
            const treeCompare = (a.system.tree || '').localeCompare(b.system.tree || '');
            if (treeCompare !== 0)
                return treeCompare;
            return (a.system.level || 0) - (b.system.level || 0);
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
     * Prepare Equipment UI Context
     */
    #prepareEquipmentUi(items) {
        const BAND_COLS = 24;
        const BAND_ROWS = 9;
        const BAND_SIZE = BAND_COLS * BAND_ROWS;
        const STASH_COLS = 10;
        const STASH_ROWS = 6;
        const STASH_SIZE = STASH_COLS * STASH_ROWS;
        // Collect all equipment items
        const equipmentItems = [
            ...(items.weapons || []),
            ...(items.armor || []),
            ...(items.shields || []),
            ...(items.gear || []),
            ...(items.artifacts || [])
        ];
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
        const stashItems = [];
        const notItems = [];
        const encItems = [];
        const heavyItems = [];
        const slotMap = {};
        for (const item of equipmentItems) {
            const flags = item.getFlag?.('mastery-system', 'equipment') || {};
            const container = flags.container ?? 'inventory';
            const band = flags.band ?? 'not';
            const slot = flags.slot ?? null;
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
                    slotMap['chest'] = item;
                    continue;
                }
            }
            // Treat backpack items as inventory items (they go into encumbrance bands)
            // Backpack container flag is kept for future use, but items are displayed in bands
            if (slot) {
                // Only first item per slot (ring1/ring2 handled separately)
                if (!slotMap[slot] || (slot === 'ring1' || slot === 'ring2')) {
                    if (slot === 'ring1' || slot === 'ring2') {
                        if (!slotMap[slot]) {
                            slotMap[slot] = item;
                        }
                    }
                    else {
                        slotMap[slot] = item;
                    }
                }
            }
            else if (container === 'stash') {
                stashItems.push(item);
            }
            else {
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
            stashCount: stashItems.length,
            slotCount: Object.keys(slotMap).length
        });
        // Convert to cells
        const notCellsData = toCells(notItems, BAND_COLS, BAND_ROWS);
        const encCellsData = toCells(encItems, BAND_COLS, BAND_ROWS);
        const heavyCellsData = toCells(heavyItems, BAND_COLS, BAND_ROWS);
        const stashCellsData = toCells(stashItems, STASH_COLS, STASH_ROWS);
        // Slot definitions
        const slotDefs = [
            { key: 'cloak', label: 'Cloak/Cape' },
            { key: 'belt', label: 'Belt' },
            { key: 'mainhand', label: 'Mainhand' },
            { key: 'offhand', label: 'Offhand' },
            { key: 'helmet', label: 'Helmet' },
            { key: 'chest', label: 'Chest' },
            { key: 'wrist', label: 'Wrist' },
            { key: 'glove', label: 'Glove' },
            { key: 'waist', label: 'Waist' },
            { key: 'leggings', label: 'Leggings' },
            { key: 'boot', label: 'Boot' },
            { key: 'necklace', label: 'Necklace' },
            { key: 'ring1', label: 'Ring 1' },
            { key: 'ring2', label: 'Ring 2' }
        ];
        return {
            showStash: this._showStash,
            bandCols: BAND_COLS,
            bandRows: BAND_ROWS,
            stashCols: STASH_COLS,
            stashRows: STASH_ROWS,
            inventory: {
                notCells: notCellsData.cells,
                encCells: encCellsData.cells,
                heavyCells: heavyCellsData.cells,
                notOverflow: notCellsData.overflow,
                encOverflow: encCellsData.overflow,
                heavyOverflow: heavyCellsData.overflow
            },
            stash: {
                cells: stashCellsData.cells,
                overflow: stashCellsData.overflow
            },
            equipSlots: slotDefs.map(def => ({
                ...def,
                item: slotMap[def.key] || null
            }))
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
        const categoryOrder = ['Physical', 'Knowledge & Craft', 'Social', 'Survival', 'Martial'];
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
    /** @override */
    activateListeners(html) {
        console.log('Mastery System | activateListeners START', {
            htmlLength: html.length,
            actorName: this.actor?.name,
            htmlIsJQuery: html instanceof jQuery,
            htmlContent: html[0]?.tagName
        });
        super.activateListeners(html);
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
        // Check if creation is incomplete - don't lock, just disable non-creation fields
        const creationComplete = this.actor.system?.creation?.complete !== false;
        if (!creationComplete) {
            this.#lockSheetForCreation(html);
        }
        // Roll buttons work for everyone
        html.find('.attribute-roll').on('click', this.#onAttributeRoll.bind(this));
        html.find('.skill-roll').on('click', this.#onSkillRoll.bind(this));
        html.find('.skill-roll-compact').on('click', this.#onSkillRoll.bind(this));
        html.find('.save-roll-btn').on('click', this.#onSavingThrowRoll.bind(this));
        // Safe Haven Rest button
        html.find('.safe-haven-rest').on('click', this.#onSafeHavenRest.bind(this));
        // Point spending buttons (JavaScript will check permissions)
        html.find('.attribute-spend-point').on('click', this.#onAttributeSpendPoint.bind(this));
        html.find('.skill-spend-point').on('click', this.#onSkillSpendPoint.bind(this));
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
        // Initialize pending changes tracking
        this._pendingAttributeChanges = {};
        // Initialize UI state for attribute XP distribution
        this.#updateAttributeXPUI();
        // Character Creation mode buttons
        html.find('.attr-increase').on('click', this.#onCreationAttributeIncrease.bind(this));
        html.find('.attr-decrease').on('click', this.#onCreationAttributeDecrease.bind(this));
        html.find('.skill-increase').on('click', this.#onCreationSkillIncrease.bind(this));
        html.find('.skill-decrease').on('click', this.#onCreationSkillDecrease.bind(this));
        html.find('.finalize-creation').on('click', this.#onFinalizeCreation.bind(this));
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
        html.find('.add-spell-creation-btn').on('click', this.#onSpellAddCreation.bind(this));
        html.find('.power-rank-select').on('change', this.#onPowerRankChange.bind(this));
        // Equipment handlers
        html.find('.general-items-btn').on('click', this.#onGeneralItemsClick.bind(this));
        html.find('.store-btn').on('click', this.#onStoreClick.bind(this));
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
        });
        html.off('drop.ms-equipment-drop').on('drop.ms-equipment-drop', '[data-df-drop]', async (ev) => {
            ev.preventDefault();
            ev.stopPropagation();
            const target = ev.currentTarget;
            console.log('Mastery System | [Equipment Drop] Delegated drop handler', {
                targetClass: target?.className,
                dropType: target?.dataset?.dfDrop,
                band: target?.dataset?.band,
                slot: target?.dataset?.slot
            });
            const dragEvent = (ev.originalEvent ?? ev);
            dragEvent.__msDropTarget = target || undefined;
            await this._onDrop(dragEvent);
        });
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
        // Stash toggle
        html.find('.df-stash-toggle').on('click', (ev) => {
            ev.preventDefault();
            this._showStash = !this._showStash;
            this.render();
        });
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
        // Stash toggle
        html.find('.df-stash-toggle').on('click', (ev) => {
            ev.preventDefault();
            this._showStash = !this._showStash;
            this.render();
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
        // HP adjustment
        html.find('.hp-adjust').on('click', this.#onHPAdjust.bind(this));
        // Stress adjustment
        html.find('.stress-adjust').on('click', this.#onStressAdjust.bind(this));
        // Stone adjustment
        html.find('.stone-adjust').on('click', this.#onStoneAdjust.bind(this));
    }
    /**
     * Calculate cost to increase an attribute from current value to next value
     * Cost tiers: 1-8 = 1pt, 9-16 = 2pt, 17-24 = 3pt, etc.
     */
    #calculateAttributeCost(currentValue) {
        const nextValue = currentValue + 1;
        const tier = Math.floor((nextValue - 1) / 8);
        return tier + 1;
    }
    /**
     * Calculate cost to increase a power to a specific level
     * Level 1: 2 MP, Level 2: 4 MP, Level 3: 8 MP, Level 4: 16 MP,
     * Level 5: 24 MP, Level 6: 32 MP, Level 7-12: 40 MP per level
     */
    #calculatePowerLevelCost(targetLevel) {
        if (targetLevel <= 0)
            return 0;
        if (targetLevel === 1)
            return 2;
        if (targetLevel === 2)
            return 4;
        if (targetLevel === 3)
            return 8;
        if (targetLevel === 4)
            return 16;
        if (targetLevel === 5)
            return 24;
        if (targetLevel === 6)
            return 32;
        if (targetLevel >= 7 && targetLevel <= 12)
            return 40;
        return 0; // Invalid level
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
     * Calculate net pending cost (signed) for all pending power level changes
     * Positive pending: costs for increasing
     * Negative pending: refunds for decreasing
     */
    #calculatePowerPendingNetCost(pendingMap) {
        let net = 0;
        for (const [powerId, pending] of Object.entries(pendingMap)) {
            if (!pending)
                continue;
            const powerItem = this.actor.items.get(powerId);
            if (!powerItem)
                continue;
            const currentLevel = powerItem.system.level ?? 1;
            if (pending > 0) {
                // Increasing: sum cost(targetLevel = currentLevel + i) for i=1..pending
                for (let i = 1; i <= pending; i++) {
                    const targetLevel = currentLevel + i;
                    net += this.#calculatePowerLevelCost(targetLevel);
                }
            }
            else {
                // Decreasing: subtract cost(refundLevel = currentLevel - i) for i=0..abs(pending)-1
                const steps = Math.abs(pending);
                for (let i = 0; i < steps; i++) {
                    const refundLevel = currentLevel - i; // refund the level you are dropping FROM
                    net -= this.#calculatePowerLevelCost(refundLevel);
                }
            }
        }
        return net;
    }
    /**
     * Get XP state, ensuring all fields exist (backward compatibility)
     */
    #getXpState(actor) {
        const system = actor.system || {};
        const points = system.points || {};
        const xp = system.xp || {};
        return {
            available: points.xp ?? 0,
            totalEarned: xp.totalEarned ?? 0,
            totalSpent: xp.totalSpent ?? 0,
            spentAttributes: xp.spentAttributes ?? 0,
            history: xp.history ?? []
        };
    }
    /**
     * Push XP history entry and truncate to last 200 entries
     */
    #pushXpHistory(actor, entry) {
        const system = actor.system || {};
        if (!system.xp) {
            system.xp = { totalEarned: 0, totalSpent: 0, spentAttributes: 0, history: [] };
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
     * Handle spending attribute points
     */
    async #onAttributeSpendPoint(event) {
        event.preventDefault();
        // Check if user is owner
        if (!this.actor.isOwner) {
            ui.notifications?.warn('Only the owner can spend Attribute Points.');
            return;
        }
        const element = event.currentTarget;
        const attributeName = element.dataset.attribute;
        if (!attributeName)
            return;
        // Save scroll position
        const attributesTab = this.element.find('.tab.attributes');
        const scrollTop = attributesTab.scrollTop();
        const currentValue = this.actor.system.attributes[attributeName]?.value || 0;
        const xpState = this.#getXpState(this.actor);
        const cost = this.#calculateAttributeCost(currentValue);
        // Check if we have enough points
        if (xpState.available < cost) {
            ui.notifications?.warn(`Not enough XP! You need ${cost} points, but only have ${xpState.available}.`);
            return;
        }
        // Check max value
        if (currentValue >= 80) {
            ui.notifications?.warn('This attribute is already at maximum value (80).');
            return;
        }
        // Update attribute and spend points
        const updates = {};
        updates[`system.attributes.${attributeName}.value`] = currentValue + 1;
        updates['system.points.xp'] = xpState.available - cost;
        await this.actor.update(updates);
        await this.render();
        // Restore scroll position
        const newAttributesTab = this.element.find('.tab.attributes');
        if (newAttributesTab.length) {
            newAttributesTab.scrollTop(scrollTop);
        }
        ui.notifications?.info(`${attributeName.charAt(0).toUpperCase() + attributeName.slice(1)} increased to ${currentValue + 1}! (Cost: ${cost} points, Remaining: ${xpState.available - cost})`);
    }
    /**
     * Handle pending attribute increase (XP distribution mode)
     */
    #onAttributeIncreaseXP(event) {
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
        const pendingIncrease = this._pendingAttributeChanges[attributeName] || 0;
        const newValue = currentValue + pendingIncrease;
        console.log('Mastery System | #onAttributeIncreaseXP: Current state', {
            attributeName,
            currentValue,
            pendingIncrease,
            newValue,
            pendingChanges: this._pendingAttributeChanges
        });
        // Check max value
        if (newValue >= 80) {
            console.warn('Mastery System | #onAttributeIncreaseXP: Max value reached', { newValue });
            ui.notifications?.warn('This attribute cannot exceed maximum value (80).');
            return;
        }
        // Calculate cost for the next increase
        const cost = this.#calculateAttributeCost(newValue);
        console.log('Mastery System | #onAttributeIncreaseXP: Cost calculation', {
            newValue,
            cost
        });
        // Calculate total cost of all pending changes
        let totalPendingCost = 0;
        for (const [attr, pending] of Object.entries(this._pendingAttributeChanges)) {
            if (pending > 0) {
                const attrCurrent = this.actor.system.attributes[attr]?.value || 0;
                const attrPending = this._pendingAttributeChanges[attr] || 0;
                for (let i = 0; i < pending; i++) {
                    const valueAtIncrease = attrCurrent + attrPending - i;
                    totalPendingCost += this.#calculateAttributeCost(valueAtIncrease);
                }
            }
        }
        totalPendingCost += cost; // Add cost for this new increase
        const xpState = this.#getXpState(this.actor);
        console.log('Mastery System | #onAttributeIncreaseXP: Cost check', {
            totalPendingCost,
            cost,
            availablePoints: xpState.available
        });
        // Check if we have enough points
        if (totalPendingCost > xpState.available) {
            console.warn('Mastery System | #onAttributeIncreaseXP: Not enough points', {
                totalPendingCost,
                availablePoints: xpState.available
            });
            ui.notifications?.warn(`Not enough XP! This increase would cost ${cost} points, but you only have ${xpState.available - (totalPendingCost - cost)} remaining.`);
            return;
        }
        // Add pending increase
        this._pendingAttributeChanges[attributeName] = (this._pendingAttributeChanges[attributeName] || 0) + 1;
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
        const pendingIncrease = this._pendingAttributeChanges[attributeName] || 0;
        console.log('Mastery System | #onAttributeDecreaseXP: Current pending', {
            attributeName,
            pendingIncrease,
            allPendingChanges: this._pendingAttributeChanges
        });
        if (pendingIncrease <= 0) {
            console.warn('Mastery System | #onAttributeDecreaseXP: No pending increase to decrease', {
                attributeName,
                pendingIncrease
            });
            return;
        }
        // Remove pending increase
        this._pendingAttributeChanges[attributeName] = pendingIncrease - 1;
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
     * Update the attribute XP distribution UI
     */
    #updateAttributeXPUI() {
        const html = this.element;
        // Calculate total pending cost
        let totalPendingCost = 0;
        for (const [attr, pending] of Object.entries(this._pendingAttributeChanges)) {
            if (pending > 0) {
                const attrCurrent = this.actor.system.attributes[attr]?.value || 0;
                for (let i = 0; i < pending; i++) {
                    const valueAtIncrease = attrCurrent + pending - i;
                    totalPendingCost += this.#calculateAttributeCost(valueAtIncrease);
                }
            }
        }
        const xpState = this.#getXpState(this.actor);
        const remainingPoints = xpState.available - totalPendingCost;
        // Update pending changes count
        const totalPendingChanges = Object.values(this._pendingAttributeChanges).reduce((sum, val) => sum + val, 0);
        html.find('#pending-attribute-changes-count').text(totalPendingChanges);
        html.find('#remaining-attribute-xp').text(Math.max(0, remainingPoints));
        // Update each attribute's pending display
        const attributeKeys = ['might', 'agility', 'vitality', 'intellect', 'resolve', 'influence', 'wits'];
        for (const attrKey of attributeKeys) {
            const pending = this._pendingAttributeChanges[attrKey] || 0;
            const pendingChangeEl = html.find(`.attribute-pending-change[data-attribute="${attrKey}"]`);
            const pendingIncreaseEl = pendingChangeEl.find('.pending-increase');
            if (pending > 0) {
                pendingChangeEl.show();
                pendingIncreaseEl.text(pending);
            }
            else {
                pendingChangeEl.hide();
            }
            // Update decrease button state
            const decreaseBtn = html.find(`.attr-decrease-xp[data-attribute="${attrKey}"]`);
            if (pending > 0) {
                decreaseBtn.prop('disabled', false);
            }
            else {
                decreaseBtn.prop('disabled', true);
            }
            // Update increase button state (check if we can afford another increase)
            const increaseBtn = html.find(`.attr-increase-xp[data-attribute="${attrKey}"]`);
            const currentValue = this.actor.system.attributes[attrKey]?.value || 0;
            const newValue = currentValue + pending;
            if (newValue >= 80) {
                increaseBtn.prop('disabled', true);
            }
            else {
                const nextCost = this.#calculateAttributeCost(newValue);
                increaseBtn.prop('disabled', remainingPoints < nextCost);
            }
        }
        // Update confirm/cancel buttons
        const confirmBtn = html.find('#confirm-attribute-changes-btn');
        const cancelBtn = html.find('#cancel-attribute-changes-btn');
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
     * Confirm and apply pending attribute changes
     */
    async #onConfirmAttributeChanges(event) {
        event.preventDefault();
        event.stopPropagation();
        // Check if user is owner
        if (!this.actor.isOwner) {
            ui.notifications?.warn('Only the owner can confirm Attribute Point changes.');
            return;
        }
        // Get XP state
        const xpState = this.#getXpState(this.actor);
        // Calculate total cost and validate
        let totalCost = 0;
        const updates = {};
        const attributeChanges = [];
        const attributeKeys = ['might', 'agility', 'vitality', 'intellect', 'resolve', 'influence', 'wits'];
        for (const attrKey of attributeKeys) {
            const pending = this._pendingAttributeChanges[attrKey] || 0;
            if (pending > 0) {
                const currentValue = this.actor.system.attributes[attrKey]?.value || 0;
                let attrCost = 0;
                for (let i = 0; i < pending; i++) {
                    const valueAtIncrease = currentValue + i;
                    attrCost += this.#calculateAttributeCost(valueAtIncrease);
                }
                totalCost += attrCost;
                updates[`system.attributes.${attrKey}.value`] = currentValue + pending;
                attributeChanges.push({
                    attr: attrKey,
                    from: currentValue,
                    to: currentValue + pending,
                    cost: attrCost
                });
            }
        }
        // Check available XP
        if (totalCost > xpState.available) {
            ui.notifications?.error(`Not enough XP! Total cost: ${totalCost}, Available: ${xpState.available}`);
            return;
        }
        // Enforce 50% attribute cap (based on totalEarned)
        const maxAttributeSpend = Math.floor(xpState.totalEarned / 2);
        if ((xpState.spentAttributes + totalCost) > maxAttributeSpend) {
            ui.notifications?.error(`Attribute XP cap reached! Spent: ${xpState.spentAttributes}, Max allowed: ${maxAttributeSpend} (50% of ${xpState.totalEarned} total earned). ` +
                `Earn or spend more XP on non-attributes first.`);
            return;
        }
        // Prepare before state for history
        const beforeState = {
            available: xpState.available,
            totalEarned: xpState.totalEarned,
            totalSpent: xpState.totalSpent,
            spentAttributes: xpState.spentAttributes
        };
        // Apply updates
        updates['system.points.xp'] = xpState.available - totalCost;
        updates['system.xp.totalSpent'] = xpState.totalSpent + totalCost;
        updates['system.xp.spentAttributes'] = xpState.spentAttributes + totalCost;
        // Ensure XP structure exists
        if (!this.actor.system.xp) {
            updates['system.xp.totalEarned'] = xpState.totalEarned;
            updates['system.xp.history'] = [];
        }
        await this.actor.update(updates);
        // Add history entry
        const user = game.user;
        const historyEntry = {
            ts: Date.now(),
            userId: user?.id || '',
            userName: user?.name || 'System',
            kind: 'spend',
            category: 'attribute',
            amount: totalCost,
            details: { changes: attributeChanges },
            before: beforeState,
            after: {
                available: xpState.available - totalCost,
                totalEarned: xpState.totalEarned,
                totalSpent: xpState.totalSpent + totalCost,
                spentAttributes: xpState.spentAttributes + totalCost
            }
        };
        this.#pushXpHistory(this.actor, historyEntry);
        await this.actor.update({ 'system.xp.history': this.actor.system.xp.history });
        // Clear pending changes
        this._pendingAttributeChanges = {};
        // Show notification
        ui.notifications?.info(`Attribute changes confirmed! Cost: ${totalCost} XP, Remaining: ${xpState.available - totalCost}`);
        // Re-render
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
    #onPowerIncreaseLevel(event) {
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
        // Check max level (12)
        if (effectiveLevel >= 12) {
            console.warn('Mastery System | #onPowerIncreaseLevel: Max level reached', { effectiveLevel });
            ui.notifications?.warn('This power cannot exceed maximum level (12).');
            return;
        }
        // Simulate the new pending state
        const simulateMap = { ...this._pendingPowerLevelChanges, [itemId]: pending + 1 };
        const netCost = this.#calculatePowerPendingNetCost(simulateMap);
        const availableXP = this.actor.system.points?.xp || 0;
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
        const availableXP = this.actor.system.points?.xp || 0;
        const remainingXP = availableXP - netPendingCost; // Can be negative if refunding
        // Calculate total absolute pending changes (for display)
        const totalPendingChanges = Object.values(this._pendingPowerLevelChanges).reduce((sum, val) => sum + Math.abs(val), 0);
        // Update pending changes count and remaining XP
        html.find('#pending-power-level-changes-count').text(totalPendingChanges);
        html.find('#remaining-power-level-mp').text(Math.max(0, remainingXP));
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
            if (effectiveLevel >= 12) {
                increaseBtn.prop('disabled', true);
            }
            else {
                const nextLevel = effectiveLevel + 1;
                const nextCost = this.#calculatePowerLevelCost(nextLevel);
                // Check if we can afford this increase (considering all pending changes)
                const simulateMap = { ...this._pendingPowerLevelChanges, [itemId]: pending + 1 };
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
        const availableXP = this.actor.system.points?.xp || 0;
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
            spentAttributes: xpState.spentAttributes
        };
        // Track power changes for history
        const powerChanges = [];
        // Apply updates
        for (const [powerId, pending] of Object.entries(this._pendingPowerLevelChanges)) {
            if (pending !== 0) {
                const powerItem = this.actor.items.get(powerId);
                if (powerItem) {
                    const currentLevel = powerItem.system.level || 1;
                    const minLevel = this.#getPowerMinLevel(powerItem);
                    const newLevel = Math.max(minLevel, Math.min(12, currentLevel + pending)); // Clamp to [minLevel..12]
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
                    await powerItem.update({ 'system.level': newLevel });
                }
            }
        }
        // Update XP (netCost can be negative for refunds)
        const newXP = availableXP - netCost;
        const updates = {
            'system.points.xp': newXP
        };
        // Update totalSpent (only if netCost is positive)
        if (netCost > 0) {
            updates['system.xp.totalSpent'] = xpState.totalSpent + netCost;
        }
        // Ensure XP structure exists
        if (!this.actor.system.xp) {
            updates['system.xp.totalEarned'] = xpState.totalEarned;
            updates['system.xp.spentAttributes'] = 0;
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
                    totalSpent: netCost > 0 ? xpState.totalSpent + netCost : xpState.totalSpent,
                    spentAttributes: xpState.spentAttributes
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
     * Handle attribute roll
     */
    async #onAttributeRoll(event) {
        event.preventDefault();
        const element = event.currentTarget;
        const attribute = element.dataset.attribute;
        if (!attribute)
            return;
        // Prompt for TN
        const tn = await this.#promptForTN();
        if (tn === null)
            return;
        await quickRoll(this.actor, attribute, undefined, tn, `${attribute.charAt(0).toUpperCase() + attribute.slice(1)} Check`);
    }
    /**
     * Handle skill roll
     */
    async #onSkillRoll(event) {
        event.preventDefault();
        const element = event.currentTarget;
        const skillKey = element.dataset.skill;
        if (!skillKey)
            return;
        // Get skill definition from SKILLS
        const skillDef = SKILLS[skillKey];
        if (!skillDef) {
            ui.notifications?.error(`Skill "${skillKey}" not found in skill definitions.`);
            return;
        }
        // Prompt for roll options (attribute, base TN, raises)
        const rollOptions = await this.#promptForSkillRollOptions(skillKey, skillDef);
        if (!rollOptions)
            return; // User cancelled
        // Perform the roll
        const system = this.actor.system;
        const attributeValue = system.attributes?.[rollOptions.attributeKey]?.value || 0;
        const masteryRank = system.mastery?.rank || 2;
        const { masteryRoll } = await import('../dice/roll-handler.js');
        await masteryRoll({
            numDice: attributeValue,
            keepDice: masteryRank,
            skill: 0, // No auto skill bonus
            tn: rollOptions.finalTN,
            label: `${skillDef.name} Check`,
            flavor: `Attribute: ${rollOptions.attributeKey.charAt(0).toUpperCase() + rollOptions.attributeKey.slice(1)}, Base TN: ${rollOptions.baseTN}, Raises: ${rollOptions.raises}`,
            actorId: this.actor.id,
            skillKey: skillKey,
            isSkillRoll: true,
            baseModifier: 0
        });
        // Skill point spending is now handled via chat buttons (no modal dialog)
    }
    /**
     * Prompt for skill roll options (attribute, base TN, raises)
     */
    async #promptForSkillRollOptions(_skillKey, skillDef) {
        const system = this.actor.system;
        const masteryRank = system.mastery?.rank || 2;
        const standardTN = masteryRank * 8;
        // Calculate difficulty TNs based on MR
        const difficulties = {
            trivial: standardTN - 8,
            easy: standardTN - 4,
            standard: standardTN,
            challenging: standardTN + 4,
            hard: standardTN + 8,
            veryHard: standardTN + 12,
            heroic: standardTN + 16
        };
        const hasMultipleAttributes = skillDef.attributes.length > 1;
        const defaultAttribute = skillDef.attributes[0];
        const content = `
      <form>
        ${hasMultipleAttributes ? `
          <div class="form-group">
            <label>Attribute:</label>
            <select name="attribute" id="skill-roll-attribute" style="width: 100%;">
              ${skillDef.attributes.map((attr) => `
                <option value="${attr}" ${attr === defaultAttribute ? 'selected' : ''}>
                  ${attr.charAt(0).toUpperCase() + attr.slice(1)} (${system.attributes?.[attr]?.value || 0})
                </option>
              `).join('')}
            </select>
          </div>
        ` : `
          <input type="hidden" name="attribute" value="${defaultAttribute}" />
          <div class="form-group">
            <label>Attribute:</label>
            <div style="padding: 4px; color: var(--df-text-muted, #888);">
              ${defaultAttribute.charAt(0).toUpperCase() + defaultAttribute.slice(1)} (${system.attributes?.[defaultAttribute]?.value || 0})
            </div>
          </div>
        `}
        
        <div class="form-group">
          <label>Base Target Number:</label>
          <select name="baseTN" id="skill-roll-baseTN" style="width: 100%;">
            <option value="${difficulties.trivial}">Trivial (${difficulties.trivial})</option>
            <option value="${difficulties.easy}">Easy (${difficulties.easy})</option>
            <option value="${difficulties.standard}" selected>Standard (${difficulties.standard})</option>
            <option value="${difficulties.challenging}">Challenging (${difficulties.challenging})</option>
            <option value="${difficulties.hard}">Hard (${difficulties.hard})</option>
            <option value="${difficulties.veryHard}">Very Hard (${difficulties.veryHard})</option>
            <option value="${difficulties.heroic}">Heroic (${difficulties.heroic})</option>
            <option value="custom">Custom</option>
          </select>
        </div>
        
        <div class="form-group" id="custom-tn-group" style="display: none;">
          <label>Custom Target Number:</label>
          <input type="number" name="customTN" id="skill-roll-customTN" value="${difficulties.standard}" min="0" step="1" style="width: 100%;" />
        </div>
        
        <div class="form-group">
          <label>Raises:</label>
          <input type="number" name="raises" id="skill-roll-raises" value="0" min="0" step="1" style="width: 100%;" />
          <div style="font-size: 11px; color: var(--df-text-muted, #888); margin-top: 4px;">
            Final TN: <span id="final-tn-display">${difficulties.standard}</span>
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
                        label: 'Roll',
                        callback: (html) => {
                            const attributeKey = html.find('[name="attribute"]').val();
                            const baseTNSelect = html.find('[name="baseTN"]').val();
                            let baseTN;
                            if (baseTNSelect === 'custom') {
                                baseTN = parseInt(html.find('[name="customTN"]').val()) || 0;
                            }
                            else {
                                baseTN = parseInt(baseTNSelect) || difficulties.standard;
                            }
                            const raises = parseInt(html.find('[name="raises"]').val()) || 0;
                            const finalTN = baseTN + (raises * 4);
                            resolve({
                                attributeKey,
                                baseTN,
                                raises,
                                finalTN
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
                    // Show/hide custom TN input
                    html.find('[name="baseTN"]').on('change', function () {
                        const isCustom = $(this).val() === 'custom';
                        html.find('#custom-tn-group').toggle(isCustom);
                    });
                    // Update final TN display
                    const updateFinalTN = () => {
                        const baseTNSelect = html.find('[name="baseTN"]').val();
                        let baseTN;
                        if (baseTNSelect === 'custom') {
                            baseTN = parseInt(html.find('[name="customTN"]').val()) || 0;
                        }
                        else {
                            baseTN = parseInt(baseTNSelect) || difficulties.standard;
                        }
                        const raises = parseInt(html.find('[name="raises"]').val()) || 0;
                        const finalTN = baseTN + (raises * 4);
                        html.find('#final-tn-display').text(finalTN);
                    };
                    html.find('[name="baseTN"], [name="customTN"], [name="raises"]').on('change input', updateFinalTN);
                    updateFinalTN();
                }
            });
            dialog.render(true);
        });
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
        await this.actor.update({ 'system.skillsSpent': skillsSpent });
        console.log('Mastery System | Safe Haven Rest: Reset all skill points', {
            actorId: this.actor.id,
            actorName: this.actor.name,
            skillsReset: Object.keys(skillsSpent).length
        });
        ui.notifications?.info('All Skill Points restored!');
        this.render();
    }
    /**
     * Handle saving throw roll
     */
    async #onSavingThrowRoll(event) {
        event.preventDefault();
        const element = event.currentTarget;
        const saveType = element.dataset.saveType; // 'body', 'mind', or 'spirit'
        if (!saveType)
            return;
        const actorData = this.actor.system;
        const vitality = actorData.attributes?.vitality?.value || 2;
        // Calculate which attribute to use and numDice
        let numDice;
        if (saveType === 'body') {
            const might = actorData.attributes?.might?.value || 2;
            const agility = actorData.attributes?.agility?.value || 2;
            numDice = Math.max(might, agility);
        }
        else if (saveType === 'mind') {
            const intellect = actorData.attributes?.intellect?.value || 2;
            const wits = actorData.attributes?.wits?.value || 2;
            numDice = Math.max(intellect, wits);
        }
        else if (saveType === 'spirit') {
            const resolve = actorData.attributes?.resolve?.value || 2;
            const influence = actorData.attributes?.influence?.value || 2;
            numDice = Math.max(resolve, influence);
        }
        else {
            return;
        }
        // Get mastery rank (number to keep)
        const keepDice = actorData.mastery?.rank || 2;
        // Apply health penalty (reduces dice pool)
        const { getCurrentPenalty } = await import('../utils/calculations.js');
        const healthBars = actorData.health?.bars || [];
        const currentBar = actorData.health?.currentBar ?? 0;
        const healthPenalty = getCurrentPenalty(healthBars, currentBar);
        // Health penalty reduces the dice pool (numDice)
        numDice = Math.max(1, numDice + healthPenalty); // Minimum 1 die
        // Skill bonus = Vitality
        const skill = vitality;
        // Prompt for TN
        const tn = await this.#promptForTN();
        if (tn === null)
            return;
        // Build label
        const saveName = saveType.charAt(0).toUpperCase() + saveType.slice(1);
        let flavorText = `+${vitality} (Vitality)`;
        // Add health penalty to flavor if applicable
        if (healthPenalty < 0) {
            const penaltyText = healthPenalty === -1 ? '1' : healthPenalty === -2 ? '2' : healthPenalty === -4 ? '4' : String(Math.abs(healthPenalty));
            flavorText += ` (Health penalty: -${penaltyText} dice)`;
        }
        const { masteryRoll } = await import('../dice/roll-handler.js');
        await masteryRoll({
            numDice,
            keepDice,
            skill,
            tn,
            label: `${saveName} Save`,
            flavor: flavorText,
            actorId: this.actor.id
        });
    }
    /**
     * Handle spending mastery points on skills
     * Cost: Level N → N+1 costs N points
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
        // Save scroll position
        const skillsTab = this.element.find('.tab.skills');
        const scrollTop = skillsTab.scrollTop();
        const currentValue = this.actor.system.skills?.[skillKey] || 0;
        const newRank = currentValue + 1;
        const xpState = this.#getXpState(this.actor);
        // Cost: newRank * 2 (e.g., 0->1 costs 2, 1->2 costs 4, etc.)
        const cost = newRank * 2;
        // Check if we have enough points
        if (xpState.available < cost) {
            ui.notifications?.warn(`Not enough XP! You need ${cost} points, but only have ${xpState.available}.`);
            return;
        }
        // Check max value (4 × Mastery Rank)
        const masteryRank = this.actor.system.mastery?.rank || 2;
        const maxSkill = 4 * masteryRank;
        if (currentValue >= maxSkill) {
            ui.notifications?.warn(`This skill is already at maximum value (${maxSkill} = 4 × Mastery Rank ${masteryRank}).`);
            return;
        }
        // Prepare before state for history
        const beforeState = {
            available: xpState.available,
            totalEarned: xpState.totalEarned,
            totalSpent: xpState.totalSpent,
            spentAttributes: xpState.spentAttributes
        };
        // Update skill and spend points
        const updates = {};
        updates[`system.skills.${skillKey}`] = newRank;
        updates['system.points.xp'] = xpState.available - cost;
        updates['system.xp.totalSpent'] = xpState.totalSpent + cost;
        // Ensure XP structure exists
        if (!this.actor.system.xp) {
            updates['system.xp.totalEarned'] = xpState.totalEarned;
            updates['system.xp.spentAttributes'] = 0;
            updates['system.xp.history'] = [];
        }
        await this.actor.update(updates);
        // Add history entry
        const user = game.user;
        const historyEntry = {
            ts: Date.now(),
            userId: user?.id || '',
            userName: user?.name || 'System',
            kind: 'spend',
            category: 'skill',
            amount: cost,
            details: { skillKey, from: currentValue, to: newRank, cost },
            before: beforeState,
            after: {
                available: xpState.available - cost,
                totalEarned: xpState.totalEarned,
                totalSpent: xpState.totalSpent + cost,
                spentAttributes: xpState.spentAttributes
            }
        };
        this.#pushXpHistory(this.actor, historyEntry);
        await this.actor.update({ 'system.xp.history': this.actor.system.xp.history });
        await this.render();
        // Restore scroll position
        const newSkillsTab = this.element.find('.tab.skills');
        if (newSkillsTab.length) {
            newSkillsTab.scrollTop(scrollTop);
        }
        const skillName = skillKey.charAt(0).toUpperCase() + skillKey.slice(1);
        ui.notifications?.info(`${skillName} increased to ${newRank}! (Cost: ${cost} XP, Remaining: ${xpState.available - cost})`);
    }
    /**
     * Prompt for Target Number
     */
    async #promptForTN() {
        const content = `
      <form>
        <div class="form-group">
          <label>Target Number:</label>
          <input type="number" name="tn" value="16" step="1" min="0"/>
        </div>
        <div class="form-group">
          <label>Preset Difficulties:</label>
          <div class="button-group">
            <button type="button" data-tn="8">Trivial (8)</button>
            <button type="button" data-tn="12">Easy (12)</button>
            <button type="button" data-tn="16">Standard (16)</button>
            <button type="button" data-tn="20">Challenging (20)</button>
            <button type="button" data-tn="24">Difficult (24)</button>
            <button type="button" data-tn="28">Extreme (28)</button>
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
                        label: 'Roll',
                        callback: (html) => {
                            const tn = parseInt(html.find('[name="tn"]').val());
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
                    html.find('[data-tn]').on('click', (event) => {
                        const tn = event.currentTarget.dataset.tn;
                        if (tn)
                            html.find('[name="tn"]').val(tn);
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
                    ui.notifications?.info(`Power "${itemName}" removed. ${remainingPowers.length} of 4 Powers selected.`);
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
        // Disable non-creation inputs (name, bio, etc.)
        // But allow power-rank-select during creation
        html.find('input[name="name"], textarea').prop('disabled', true);
        html.find('select:not(.power-rank-select)').prop('disabled', true);
        // Disable buttons except creation controls
        const buttonsToDisable = html.find('button:not(.attr-increase):not(.attr-decrease):not(.skill-increase):not(.skill-decrease):not(.finalize-creation):not(.force-unlock-creation):not(.add-disadvantage-btn):not(.disadvantage-edit-btn):not(.disadvantage-remove-btn):not(.add-power-creation-btn):not(.add-spell-creation-btn):not(.power-rank-select):not(.item-delete)');
        console.log('Mastery System | Disabling buttons:', buttonsToDisable.length);
        buttonsToDisable.prop('disabled', true);
        // Ensure creation buttons are enabled
        const creationButtons = html.find('.attr-increase, .attr-decrease, .skill-increase, .skill-decrease, .finalize-creation, .force-unlock-creation, .add-disadvantage-btn, .disadvantage-edit-btn, .disadvantage-remove-btn, .add-power-creation-btn, .add-spell-creation-btn, .item-delete');
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
     * Character Creation: Increase Attribute
     */
    async #onCreationAttributeIncrease(event) {
        event.preventDefault();
        const attribute = $(event.currentTarget).data('attribute');
        if (!attribute)
            return;
        const system = this.actor.system;
        const masteryRank = system.mastery?.rank || 2;
        const currentValue = system.attributes?.[attribute]?.value || masteryRank;
        // Calculate current points spent
        let attributePointsSpent = 0;
        const attributeKeys = ['might', 'agility', 'vitality', 'intellect', 'resolve', 'influence', 'wits'];
        for (const key of attributeKeys) {
            const attrValue = system.attributes?.[key]?.value || masteryRank;
            if (attrValue > masteryRank) {
                attributePointsSpent += attrValue - masteryRank;
            }
        }
        // Validate
        if (currentValue >= 8) {
            ui.notifications?.warn('Attribute cannot exceed 8 during character creation.');
            return;
        }
        if (attributePointsSpent >= 16) {
            ui.notifications?.warn('All attribute points have been allocated.');
            return;
        }
        // Update
        await this.actor.update({
            [`system.attributes.${attribute}.value`]: currentValue + 1
        });
        this.render();
    }
    /**
     * Character Creation: Decrease Attribute
     */
    async #onCreationAttributeDecrease(event) {
        event.preventDefault();
        const attribute = $(event.currentTarget).data('attribute');
        if (!attribute)
            return;
        const system = this.actor.system;
        const masteryRank = system.mastery?.rank || 2;
        const currentValue = system.attributes?.[attribute]?.value || masteryRank;
        // Validate
        if (currentValue <= masteryRank) {
            ui.notifications?.warn('Attribute cannot go below Mastery Rank.');
            return;
        }
        // Update
        await this.actor.update({
            [`system.attributes.${attribute}.value`]: currentValue - 1
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
        const skillPointsConfig = CONFIG.MASTERY?.creation?.skillPoints || 16;
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
          <select name="disadvantageId" id="disadvantageId" style="width: 100%;">
            <option value="">-- Select a Disadvantage --</option>
            ${disadvantageOptions.map(opt => `<option value="${opt.value}">${opt.label}</option>`).join('')}
          </select>
        </div>
        ${disadvantageOptions.length === 0 ? '<p style="color: red;">No disadvantages available. Please check the console.</p>' : ''}
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
            default: 'configure',
            render: (html) => {
                console.log('Mastery System | Dialog rendered, HTML:', html);
            }
        });
        console.log('Mastery System | Dialog created, calling render(true)...');
        try {
            await dialog.render(true);
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
     * Open Disadvantage Configuration Dialog
     */
    async #openDisadvantageConfigDialog(def, editIndex, existingDetails) {
        const content = await foundry.applications.handlebars.renderTemplate('systems/mastery-system/templates/dialogs/disadvantage-config.hbs', {
            disadvantage: def,
            details: existingDetails || {}
        });
        new Dialog({
            title: `${editIndex !== undefined ? 'Edit' : 'Add'} ${def.name}`,
            content,
            buttons: {
                save: {
                    icon: '<i class="fas fa-check"></i>',
                    label: 'Save',
                    callback: async (html) => {
                        const details = {};
                        for (const field of def.fields || []) {
                            if (field.type === 'number') {
                                details[field.name] = parseInt($(html).find(`[name="${field.name}"]`).val()) || 0;
                            }
                            else if (field.type === 'select') {
                                details[field.name] = $(html).find(`[name="${field.name}"]`).val();
                            }
                            else {
                                details[field.name] = $(html).find(`[name="${field.name}"]`).val() || '';
                            }
                        }
                        const points = calculateDisadvantagePoints(def.id, details);
                        const system = this.actor.system;
                        const currentDisadvantages = [...(system.disadvantages || [])];
                        // Remove the one being edited if editing
                        if (editIndex !== undefined) {
                            currentDisadvantages.splice(editIndex, 1);
                        }
                        // Add new selection
                        const newSelection = { id: def.id, details };
                        const validation = validateDisadvantageSelection([...currentDisadvantages, newSelection]);
                        if (!validation.valid) {
                            ui.notifications?.error(validation.error || 'Invalid disadvantage selection');
                            return false;
                        }
                        // Update actor
                        if (editIndex !== undefined) {
                            currentDisadvantages[editIndex] = {
                                id: def.id,
                                name: def.name,
                                points,
                                details,
                                description: def.description
                            };
                        }
                        else {
                            currentDisadvantages.push({
                                id: def.id,
                                name: def.name,
                                points,
                                details,
                                description: def.description
                            });
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
        }).render(true);
    }
    /**
     * Finalize Character Creation
     */
    async #onFinalizeCreation(event) {
        event.preventDefault();
        const system = this.actor.system;
        const masteryRank = system.mastery?.rank || 2;
        const skillPointsConfig = CONFIG.MASTERY?.creation?.skillPoints || 16;
        // Calculate points spent
        let attributePointsSpent = 0;
        const attributeKeys = ['might', 'agility', 'vitality', 'intellect', 'resolve', 'influence', 'wits'];
        for (const key of attributeKeys) {
            const attrValue = system.attributes?.[key]?.value || masteryRank;
            if (attrValue > masteryRank) {
                attributePointsSpent += attrValue - masteryRank;
            }
        }
        let skillPointsSpent = 0;
        for (const skillValue of Object.values(system.skills || {})) {
            skillPointsSpent += (typeof skillValue === 'number' ? skillValue : 0);
        }
        const disadvantagePoints = (system.disadvantages || []).reduce((sum, d) => sum + (d.points || 0), 0);
        // Validate powers & magic
        const powers = this.actor.items.filter((item) => item.type === 'power');
        const powersAtRank2 = powers.filter((p) => (p.system?.level || 1) === 2);
        // Validate all requirements
        if (attributePointsSpent !== 16) {
            ui.notifications?.error(`Must spend exactly 16 attribute points. Currently spent: ${attributePointsSpent}`);
            return;
        }
        if (skillPointsSpent !== skillPointsConfig) {
            ui.notifications?.error(`Must spend exactly ${skillPointsConfig} skill points. Currently spent: ${skillPointsSpent}`);
            return;
        }
        // Trees are now optional - no validation needed
        if (powers.length !== 4) {
            ui.notifications?.error(`Must select exactly 4 Powers. Currently selected: ${powers.length}`);
            return;
        }
        if (powersAtRank2.length > 2) {
            ui.notifications?.error(`Maximum 2 Powers can be at Rank 2. Currently at Rank 2: ${powersAtRank2.length}`);
            return;
        }
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
        // Ensure schticks are persisted (they should already be set, but ensure they're in the update)
        if (schticksRanks.length > 0) {
            updateData['system.schticks.ranks'] = schticksRanks;
        }
        // Initialize XP bookkeeping
        updateData['system.points.xp'] = 0;
        updateData['system.xp.totalEarned'] = 0;
        updateData['system.xp.totalSpent'] = 0;
        updateData['system.xp.spentAttributes'] = 0;
        updateData['system.xp.history'] = [];
        try {
            await this.actor.update(updateData);
            // Ensure all power items have minLevel set to their current level
            const powerItems = this.actor.items.filter((item) => item.type === 'power');
            for (const power of powerItems) {
                const lvl = power.system.level ?? 1;
                const min = power.system.minLevel;
                if (min === undefined || min === null) {
                    await power.update({ 'system.minLevel': lvl });
                }
            }
            ui.notifications?.info('Character creation complete!');
            this.render();
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
        console.log('Mastery System | [Equipment Drop] Resolved item', {
            itemId: droppedItem?.id,
            itemName: droppedItem?.name,
            itemUuid: droppedItem?.uuid,
            itemParent: droppedItem?.parent?.id
        });
        if (!droppedItem) {
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
            const itemData = foundry.utils.deepClone(droppedItem.toObject());
            delete itemData._id;
            delete itemData.folder;
            console.log('Mastery System | [Equipment Drop] Creating embedded copy', {
                sourceId: droppedItem?.id,
                sourceName: droppedItem?.name,
                targetActor: this.actor?.id
            });
            const [created] = await this.actor.createEmbeddedDocuments('Item', [itemData], { render: false });
            console.log('Mastery System | [Equipment Drop] Embedded create result', {
                createdId: created?.id,
                createdName: created?.name
            });
            if (!created)
                return false;
            droppedItem = created;
        }
        // Internal item - update flags
        await this.#updateItemEquipmentFlags(droppedItem, target, event);
        this._lastDroppedItemId = droppedItem?.id;
        this._lastDroppedItemName = droppedItem?.name;
        await new Promise(resolve => setTimeout(resolve, 0));
        await this.render(true, { focus: false });
        return true;
    }
    /**
     * Helper: Update item equipment flags based on drop target
     */
    async #updateItemEquipmentFlags(item, target, event) {
        const dropType = target.dataset.dfDrop;
        if (!dropType)
            return;
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
        // Helper: Get item currently in a slot
        const getSlotItem = (slotKey) => {
            const items = Array.from(this.actor.items.values());
            for (const it of items) {
                const flags = it.getFlag('mastery-system', 'equipment') || {};
                if (flags.slot === slotKey) {
                    return it;
                }
            }
            // Backward compatibility
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
            else if (slotKey === 'chest') {
                const armor = items.filter((it) => it.type === 'armor' && it.system?.equipped === true);
                if (armor.length > 0)
                    return armor[0];
            }
            return null;
        };
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
                const cell = event?.target?.closest?.('.df-cell');
                if (cell) {
                    const col = Number(cell.dataset?.col || 0);
                    const row = Number(cell.dataset?.row || 0);
                    if (col > 0 && row > 0) {
                        const BAND_COLS = 24;
                        const BAND_ROWS = 9;
                        const size = parseInventorySize(item?.system?.inventorySize);
                        const w = Math.min(BAND_COLS, size.w);
                        const h = Math.min(BAND_ROWS, size.h);
                        const candidate = { x: col, y: row, w, h };
                        const items = Array.from(this.actor.items.values());
                        const rects = items
                            .filter((it) => it.id !== item.id)
                            .map((it) => {
                            const flags = it.getFlag?.('mastery-system', 'equipment') || {};
                            if (flags.container !== 'inventory' || flags.band !== band || !flags.grid?.x || !flags.grid?.y)
                                return null;
                            const s = parseInventorySize(it.system?.inventorySize);
                            return { x: flags.grid.x, y: flags.grid.y, w: Math.min(BAND_COLS, s.w), h: Math.min(BAND_ROWS, s.h) };
                        })
                            .filter(Boolean);
                        const fits = fitsInGrid(candidate.x, candidate.y, candidate.w, candidate.h, BAND_COLS, BAND_ROWS)
                            && !rects.some(rect => rectsOverlap(rect, candidate));
                        if (fits) {
                            newFlags.grid = { x: candidate.x, y: candidate.y };
                        }
                        else {
                            ui.notifications?.warn('No space for this item at the target position.');
                            return;
                        }
                    }
                    else {
                        return;
                    }
                }
                else {
                    return;
                }
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
            // Simple validation: 2H weapon vs shield
            if (slot === 'mainhand' && item.type === 'weapon' && item.system?.hands === 2) {
                const offhandItem = getSlotItem('offhand');
                if (offhandItem) {
                    ui.notifications?.warn('Cannot equip 2-handed weapon while offhand is occupied.');
                    return;
                }
            }
            else if (slot === 'offhand' && item.type === 'shield') {
                const mainhandItem = getSlotItem('mainhand');
                if (mainhandItem && mainhandItem.type === 'weapon' && mainhandItem.system?.hands === 2) {
                    ui.notifications?.warn('Cannot equip shield while 2-handed weapon is equipped.');
                    return;
                }
            }
            // Clear previous item in slot
            const previousItem = getSlotItem(slot);
            if (previousItem && previousItem.id !== item.id) {
                const prevFlags = previousItem.getFlag('mastery-system', 'equipment') || {};
                const newPrevFlags = { ...prevFlags, slot: null };
                await previousItem.update({
                    'flags.mastery-system.equipment': newPrevFlags,
                    'system.equipped': false
                });
            }
            // Set new item in slot
            newFlags.container = 'inventory';
            newFlags.slot = slot;
            newFlags.band = newFlags.band || 'not';
            await item.update({
                'flags.mastery-system.equipment': newFlags,
                'system.equipped': true
            });
            console.log('Mastery System | [Equipment Drop] Update flags slot', { newFlags });
        }
    }
}
//# sourceMappingURL=character-sheet.js.map