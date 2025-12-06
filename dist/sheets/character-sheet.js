/**
 * Character Sheet for Mastery System
 * Main player character sheet with tabs for attributes, skills, powers, etc.
 */
import { quickRoll } from '../dice/roll-handler.js';
import { getActionStatus, useAction, unuseAction, convertAttackAction, undoConversion } from '../combat/actions.js';
import { getResourceStatus, spendStones, addStress, reduceStress } from '../combat/resources.js';
import { performCheckWithDialog } from '../rolls/checks.js';
import { performAttackWithDialog } from '../rolls/attacks.js';
import { getPassiveSlots, getAvailablePassives, slotPassive, unslotPassive, activatePassive } from '../powers/passives.js';
import { getHealthLevelsData } from '../combat/health.js';
import { getCharges, burnStoneForCharges } from '../powers/charges.js';
import { getActiveBuffs } from '../powers/buffs.js';
import { getAvailableManeuvers, performManeuver } from '../combat/maneuvers.js';
import { SKILLS } from '../utils/skills.js';
export class MasteryCharacterSheet extends ActorSheet {
    /** @override */
    static get defaultOptions() {
        const options = foundry.utils.mergeObject(super.defaultOptions, {
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
            dragDrop: [{ dragSelector: '.item-list .item', dropSelector: null }],
            scrollY: ['.attributes', '.skills', '.powers', '.equipment']
        });
        console.log('Mastery System | Character Sheet defaultOptions:', options);
        return options;
    }
    /** @override */
    get template() {
        const templatePath = 'systems/mastery-system/templates/actor/character-sheet.hbs';
        console.log('Mastery System | Character Sheet template path:', templatePath);
        return templatePath;
    }
    /** @override */
    getData(options) {
        const context = super.getData(options);
        const actorData = context.actor;
        // Add system data
        context.system = actorData.system;
        context.flags = actorData.flags;
        // Add configuration data
        context.config = CONFIG.MASTERY;
        // Enrich biography info for display
        context.enrichedBio = {
            notes: TextEditor.enrichHTML(context.system.bio?.notes || ''),
            background: TextEditor.enrichHTML(context.system.notes?.background || '')
        };
        // Prepare items by type
        context.items = this.#prepareItems();
        // Calculate derived values
        context.derivedValues = this.#calculateDerivedValues(context.system);
        // Add skills list (sorted alphabetically)
        context.skills = this.#prepareSkills(context.system.skills);
        // Add action economy status
        context.actions = getActionStatus(this.actor);
        // Add resource status
        context.resources = getResourceStatus(this.actor);
        // Add powers filtered by type for action panel
        context.activePowers = this.#prepareActivePowers();
        // Add passive powers data
        context.passiveSlots = getPassiveSlots(this.actor);
        context.availablePassives = getAvailablePassives(this.actor);
        context.masteryRank = context.system.mastery?.rank || 2;
        // Add health levels data
        context.healthLevels = getHealthLevelsData(this.actor);
        // Add mastery charges data
        context.masteryCharges = getCharges(this.actor);
        // Add active buffs
        context.activeBuffs = getActiveBuffs(this.actor);
        // Add available maneuvers
        context.availableManeuvers = getAvailableManeuvers(this.actor);
        context.hasMovement = context.actions.movement.remaining > 0;
        // Add skills organized by category
        context.skills = this.#prepareSkillsList();
        return context;
    }
    /**
     * Prepare skills list with values from actor
     */
    #prepareSkillsList() {
        const skillsList = [];
        const actorSkills = this.actor.system.skills || {};
        for (const [key, definition] of Object.entries(SKILLS)) {
            skillsList.push({
                key,
                name: definition.name,
                category: definition.category,
                attributes: definition.attributes,
                value: actorSkills[key] || 0
            });
        }
        // Sort by category, then by name
        skillsList.sort((a, b) => {
            if (a.category !== b.category) {
                return a.category.localeCompare(b.category);
            }
            return a.name.localeCompare(b.name);
        });
        return skillsList;
    }
    /**
     * Prepare items organized by type
     */
    #prepareItems() {
        const powers = [];
        const spells = [];
        const echoes = [];
        const schticks = [];
        const artifacts = [];
        const conditions = [];
        const weapons = [];
        const armor = [];
        for (const item of this.actor.items) {
            const itemData = item;
            switch (item.type) {
                case 'special':
                    powers.push(itemData);
                    break;
                case 'spell':
                    spells.push(itemData);
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
            }
        }
        // Sort powers by tree and level
        powers.sort((a, b) => {
            const treeCompare = (a.system.tree || '').localeCompare(b.system.tree || '');
            if (treeCompare !== 0)
                return treeCompare;
            return (a.system.level || 0) - (b.system.level || 0);
        });
        // Sort spells by school and level
        spells.sort((a, b) => {
            const schoolCompare = (a.system.school || '').localeCompare(b.system.school || '');
            if (schoolCompare !== 0)
                return schoolCompare;
            return (a.system.level || 0) - (b.system.level || 0);
        });
        return {
            powers,
            spells,
            echoes,
            schticks,
            artifacts,
            conditions,
            weapons,
            armor
        };
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
    #prepareSkills(skills) {
        const skillList = [];
        for (const [name, value] of Object.entries(skills || {})) {
            skillList.push({
                name,
                value,
                label: name.charAt(0).toUpperCase() + name.slice(1)
            });
        }
        // Sort alphabetically
        skillList.sort((a, b) => a.label.localeCompare(b.label));
        return skillList;
    }
    /**
     * Prepare active powers for action panel
     * Filters powers by type: Movement, Active, Utility, Reaction
     */
    #prepareActivePowers() {
        const powers = [];
        for (const item of this.actor.items) {
            if (item.type !== 'special')
                continue;
            const powerType = item.system.powerType;
            // Filter by combat-usable power types
            if (['movement', 'active', 'utility', 'reaction'].includes(powerType)) {
                powers.push({
                    id: item.id,
                    name: item.name,
                    powerType,
                    level: item.system.level || 1,
                    range: item.system.range || '0m',
                    cost: item.system.cost || {},
                    equipped: item.system.equipped !== false // Default to equipped if not specified
                });
            }
        }
        // Sort by power type then level
        powers.sort((a, b) => {
            const typeOrder = { movement: 0, active: 1, utility: 2, reaction: 3 };
            const typeCompare = (typeOrder[a.powerType] || 99) - (typeOrder[b.powerType] || 99);
            if (typeCompare !== 0)
                return typeCompare;
            return a.level - b.level;
        });
        return powers;
    }
    /** @override */
    activateListeners(html) {
        super.activateListeners(html);
        // Attribute adjustments
        html.find('.attribute-adjust').on('click', this.#onAttributeAdjust.bind(this));
        html.find('.attribute-roll').on('click', this.#onAttributeRoll.bind(this));
        // Saving Throws (3 types: body, mind, spirit)
        html.find('.save-roll-btn').on('click', this.#onSavingThrowRoll.bind(this));
        // Skills rolls (compact)
        html.find('.skill-roll-compact').on('click', this.#onSkillRollWithDialog.bind(this));
        // Everything below here is only needed if the sheet is editable
        if (!this.isEditable)
            return;
        // Skill rolls (now with dialog)
        html.find('.skill-roll').on('click', this.#onSkillRollWithDialog.bind(this));
        // Attack rolls
        html.find('.weapon-attack').on('click', this.#onWeaponAttack.bind(this));
        html.find('.power-attack').on('click', this.#onPowerAttack.bind(this));
        // Add Power/Spell buttons
        html.find('.add-power-btn').on('click', () => this.#onAddPowerOrSpell('special'));
        html.find('.add-spell-btn').on('click', () => this.#onAddPowerOrSpell('spell'));
        // Add skill
        html.find('.skill-add').on('click', this.#onSkillAdd.bind(this));
        // Delete skill
        html.find('.skill-delete').on('click', this.#onSkillDelete.bind(this));
        // Power use
        html.find('.power-use').on('click', this.#onPowerUse.bind(this));
        // Action economy buttons
        html.find('.action-use').on('click', this.#onActionUse.bind(this));
        html.find('.action-unuse').on('click', this.#onActionUnuse.bind(this));
        html.find('.action-convert').on('click', this.#onActionConvert.bind(this));
        html.find('.action-undo-convert').on('click', this.#onActionUndoConvert.bind(this));
        // Resource management buttons
        html.find('.spend-stones-btn').on('click', this.#onSpendStones.bind(this));
        html.find('.add-stress-btn').on('click', this.#onAddStress.bind(this));
        html.find('.reduce-stress-btn').on('click', this.#onReduceStress.bind(this));
        // Power selection for action use
        html.find('.use-power-action').on('click', this.#onUsePowerWithAction.bind(this));
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
        // Passive Powers
        html.find('.passive-slot').on('click', this.#onPassiveSlotClick.bind(this));
        html.find('.passive-activate').on('click', this.#onPassiveActivate.bind(this));
        html.find('.passive-remove').on('click', this.#onPassiveRemove.bind(this));
        // Health Levels
        html.find('.health-box').on('click', this.#onHealthBoxClick.bind(this));
        // Mastery Charges
        html.find('.burn-stone-btn').on('click', this.#onBurnStone.bind(this));
        // Movement Maneuvers
        html.find('.maneuver-btn').on('click', this.#onManeuverUse.bind(this));
        // Buff removal (if needed)
        html.find('.buff-remove').on('click', this.#onBuffRemove.bind(this));
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
    /**
     * Skill roll with new dialog system
     */
    async #onSkillRollWithDialog(event) {
        event.preventDefault();
        const element = event.currentTarget;
        const skillKey = element.dataset.skill;
        if (!skillKey)
            return;
        // Determine best attribute for this skill (default to wits)
        // TODO: Pull from skill definitions
        const attribute = 'wits';
        const skillName = skillKey.charAt(0).toUpperCase() + skillKey.slice(1);
        await performCheckWithDialog(this.actor, {
            attribute,
            skill: skillKey,
            label: `${skillName} Check`,
            tn: 16 // Default to Standard
        });
    }
    /**
     * Weapon attack
     */
    async #onWeaponAttack(event) {
        event.preventDefault();
        const element = event.currentTarget;
        const itemId = element.dataset.itemId;
        const weapon = this.actor.items.get(itemId);
        if (!weapon)
            return;
        // Get target from current targets
        const targets = Array.from(game.user?.targets || []);
        if (targets.length === 0) {
            ui.notifications?.warn('Please target an enemy first!');
            return;
        }
        const target = targets[0].actor;
        if (!target)
            return;
        await performAttackWithDialog(this.actor, target, weapon);
    }
    /**
     * Power attack
     */
    async #onPowerAttack(event) {
        event.preventDefault();
        const element = event.currentTarget;
        const powerId = element.dataset.powerId;
        const power = this.actor.items.get(powerId);
        if (!power)
            return;
        // Get target from current targets
        const targets = Array.from(game.user?.targets || []);
        if (targets.length === 0) {
            ui.notifications?.warn('Please target an enemy first!');
            return;
        }
        const target = targets[0].actor;
        if (!target)
            return;
        await performAttackWithDialog(this.actor, target, power);
    }
    /**
     * Prompt for Target Number
     */
    async #promptForTN(defaultValue = 16) {
        const content = `
      <form>
        <div class="form-group">
          <label>Target Number:</label>
          <input type="number" name="tn" value="${defaultValue}" step="1" min="0"/>
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
        const itemId = element.dataset.itemId;
        const item = this.actor.items.get(itemId);
        if (!item)
            return;
        // TODO: Implement power usage logic
        ui.notifications?.info(`Using power: ${item.name}`);
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
        const element = event.currentTarget.closest('.item');
        const itemId = element.dataset.itemId;
        const item = this.actor.items.get(itemId);
        if (item) {
            item.sheet?.render(true);
        }
    }
    /**
     * Delete an item
     */
    async #onItemDelete(event) {
        event.preventDefault();
        const element = event.currentTarget.closest('.item');
        const itemId = element.dataset.itemId;
        const item = this.actor.items.get(itemId);
        if (!item)
            return;
        const confirmed = await Dialog.confirm({
            title: 'Delete Item',
            content: `<p>Are you sure you want to delete <strong>${item.name}</strong>?</p>`
        });
        if (confirmed) {
            await item.delete();
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
     * Handle attribute adjustment (+/- buttons)
     */
    async #onAttributeAdjust(event) {
        event.preventDefault();
        const element = event.currentTarget;
        const attribute = element.dataset.attribute;
        const adjustment = parseInt(element.dataset.adjustment || '0');
        if (!attribute)
            return;
        const currentValue = this.actor.system.attributes?.[attribute]?.value || 0;
        const newValue = Math.max(0, Math.min(40, currentValue + adjustment));
        await this.actor.update({
            [`system.attributes.${attribute}.value`]: newValue
        });
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
     * Mark an action as used
     */
    async #onActionUse(event) {
        event.preventDefault();
        const element = event.currentTarget;
        const actionType = element.dataset.actionType;
        if (actionType) {
            await useAction(this.actor, actionType);
            this.render(false);
        }
    }
    /**
     * Unmark an action
     */
    async #onActionUnuse(event) {
        event.preventDefault();
        const element = event.currentTarget;
        const actionType = element.dataset.actionType;
        if (actionType) {
            await unuseAction(this.actor, actionType);
            this.render(false);
        }
    }
    /**
     * Convert an Attack Action
     */
    async #onActionConvert(event) {
        event.preventDefault();
        const element = event.currentTarget;
        const targetType = element.dataset.targetType;
        if (targetType) {
            const success = await convertAttackAction(this.actor, targetType);
            if (success) {
                this.render(false);
            }
        }
    }
    /**
     * Undo a conversion
     */
    async #onActionUndoConvert(event) {
        event.preventDefault();
        const element = event.currentTarget;
        const conversionType = element.dataset.conversionType;
        if (conversionType) {
            const success = await undoConversion(this.actor, conversionType);
            if (success) {
                this.render(false);
            }
        }
    }
    /**
     * Spend Stones dialog
     */
    async #onSpendStones(event) {
        event.preventDefault();
        const dialog = new Dialog({
            title: 'Spend Stones',
            content: `
        <form>
          <div class="form-group">
            <label>Amount:</label>
            <input type="number" name="amount" value="1" min="0" max="${this.actor.system.resources?.stones?.current || 0}"/>
          </div>
          <div class="form-group">
            <label>Reason:</label>
            <input type="text" name="reason" value="power activation"/>
          </div>
        </form>
      `,
            buttons: {
                spend: {
                    icon: '<i class="fas fa-check"></i>',
                    label: 'Spend',
                    callback: async (html) => {
                        const amount = parseInt(html.find('[name="amount"]').val() || '0');
                        const reason = html.find('[name="reason"]').val() || 'power activation';
                        const success = await spendStones(this.actor, amount, reason);
                        if (success) {
                            this.render(false);
                        }
                    }
                },
                cancel: {
                    icon: '<i class="fas fa-times"></i>',
                    label: 'Cancel'
                }
            },
            default: 'spend'
        });
        dialog.render(true);
    }
    /**
     * Add Stress dialog
     */
    async #onAddStress(event) {
        event.preventDefault();
        const dialog = new Dialog({
            title: 'Add Stress',
            content: `
        <form>
          <div class="form-group">
            <label>Amount:</label>
            <input type="number" name="amount" value="1" min="0"/>
          </div>
          <div class="form-group">
            <label>Reason:</label>
            <input type="text" name="reason" value="stressful event"/>
          </div>
        </form>
      `,
            buttons: {
                add: {
                    icon: '<i class="fas fa-plus"></i>',
                    label: 'Add',
                    callback: async (html) => {
                        const amount = parseInt(html.find('[name="amount"]').val() || '0');
                        const reason = html.find('[name="reason"]').val() || 'stressful event';
                        await addStress(this.actor, amount, reason);
                        this.render(false);
                    }
                },
                cancel: {
                    icon: '<i class="fas fa-times"></i>',
                    label: 'Cancel'
                }
            },
            default: 'add'
        });
        dialog.render(true);
    }
    /**
     * Reduce Stress dialog
     */
    async #onReduceStress(event) {
        event.preventDefault();
        const dialog = new Dialog({
            title: 'Reduce Stress',
            content: `
        <form>
          <div class="form-group">
            <label>Amount:</label>
            <input type="number" name="amount" value="1" min="0" max="${this.actor.system.resources?.stress?.current || 0}"/>
          </div>
          <div class="form-group">
            <label>Reason:</label>
            <input type="text" name="reason" value="stress relief"/>
          </div>
        </form>
      `,
            buttons: {
                reduce: {
                    icon: '<i class="fas fa-minus"></i>',
                    label: 'Reduce',
                    callback: async (html) => {
                        const amount = parseInt(html.find('[name="amount"]').val() || '0');
                        const reason = html.find('[name="reason"]').val() || 'stress relief';
                        await reduceStress(this.actor, amount, reason);
                        this.render(false);
                    }
                },
                cancel: {
                    icon: '<i class="fas fa-times"></i>',
                    label: 'Cancel'
                }
            },
            default: 'reduce'
        });
        dialog.render(true);
    }
    /**
     * Use a power with an action
     */
    async #onUsePowerWithAction(event) {
        event.preventDefault();
        const element = event.currentTarget;
        const powerId = element.dataset.powerId;
        const power = this.actor.items.get(powerId);
        if (!power)
            return;
        const powerType = power.system.powerType;
        let actionType = 'attack';
        // Determine action type from power type
        if (powerType === 'movement') {
            actionType = 'movement';
        }
        else if (powerType === 'reaction') {
            actionType = 'reaction';
        }
        else {
            actionType = 'attack'; // Active, Utility use Attack Action
        }
        // Use the action
        const success = await useAction(this.actor, actionType);
        if (success) {
            // Post chat message
            await ChatMessage.create({
                user: game.user?.id,
                speaker: ChatMessage.getSpeaker({ actor: this.actor }),
                content: `
          <div class="mastery-power-use">
            <div class="power-header">
              <img src="${this.actor.img}" alt="${this.actor.name}" class="actor-portrait"/>
              <h3>${this.actor.name} uses ${power.name}</h3>
            </div>
            <div class="power-details">
              <p><strong>Type:</strong> ${powerType.charAt(0).toUpperCase() + powerType.slice(1)}</p>
              <p><strong>Action Used:</strong> ${actionType.charAt(0).toUpperCase() + actionType.slice(1)}</p>
              <p><strong>Range:</strong> ${power.system.range || '0m'}</p>
              ${power.system.cost?.stones ? `<p><strong>Stone Cost:</strong> ${power.system.cost.stones}</p>` : ''}
            </div>
          </div>
        `,
                type: CONST.CHAT_MESSAGE_TYPES.OTHER,
                flags: {
                    'mastery-system': {
                        type: 'power-use',
                        powerId,
                        actionType
                    }
                }
            });
            this.render(false);
        }
    }
    /**
     * Handle passive slot click (slot/unslot passive)
     */
    async #onPassiveSlotClick(event) {
        event.preventDefault();
        const element = event.currentTarget;
        const slotIndex = parseInt(element.dataset.slotIndex || '0');
        const hasPassive = element.dataset.hasPassive === 'true';
        if (hasPassive) {
            // Already has a passive, ask if they want to remove it
            return;
        }
        // Show dialog to select passive
        await this.#showPassiveSelectDialog(slotIndex);
    }
    /**
     * Show passive selection dialog
     */
    async #showPassiveSelectDialog(slotIndex) {
        const availablePassives = getAvailablePassives(this.actor);
        const slots = getPassiveSlots(this.actor);
        // Filter out passives whose category is already used
        const usedCategories = slots
            .filter((s, idx) => idx !== slotIndex && s.passive)
            .map(s => s.passive.category);
        const selectablePassives = availablePassives.filter(p => !usedCategories.includes(p.category));
        if (selectablePassives.length === 0) {
            ui.notifications?.warn('No passives available! All categories are used or no passives learned.');
            return;
        }
        const passiveList = selectablePassives.map(p => `
      <div class="passive-option" data-id="${p.id}">
        <h4>${p.name}</h4>
        <span class="category">${p.category}</span>
        <p>${p.description}</p>
      </div>
    `).join('');
        return new Promise((resolve) => {
            const dialog = new Dialog({
                title: `Select Passive for Slot ${slotIndex + 1}`,
                content: `
          <div class="passive-select-dialog">
            <p>Choose a passive power to slot:</p>
            <div class="passive-list">${passiveList}</div>
          </div>
        `,
                buttons: {
                    cancel: {
                        icon: '<i class="fas fa-times"></i>',
                        label: 'Cancel',
                        callback: () => resolve()
                    }
                },
                render: (html) => {
                    html.find('.passive-option').on('click', async (e) => {
                        const passiveId = e.currentTarget.dataset.id;
                        await slotPassive(this.actor, slotIndex, passiveId);
                        this.render(false);
                        dialog.close();
                        resolve();
                    });
                },
                close: () => resolve()
            }, {
                width: 500,
                classes: ['mastery-system', 'passive-select-dialog']
            });
            dialog.render(true);
        });
    }
    /**
     * Handle passive activate/deactivate
     */
    async #onPassiveActivate(event) {
        event.preventDefault();
        event.stopPropagation();
        const element = event.currentTarget;
        const slotIndex = parseInt(element.dataset.slotIndex || '0');
        await activatePassive(this.actor, slotIndex);
        this.render(false);
    }
    /**
     * Handle passive remove from slot
     */
    async #onPassiveRemove(event) {
        event.preventDefault();
        event.stopPropagation();
        const element = event.currentTarget;
        const slotIndex = parseInt(element.dataset.slotIndex || '0');
        await unslotPassive(this.actor, slotIndex);
        this.render(false);
    }
    /**
     * Handle health box click (mark damage/heal)
     */
    async #onHealthBoxClick(event) {
        event.preventDefault();
        const element = event.currentTarget;
        const damaged = element.classList.contains('damaged');
        const { applyDamageToHealthLevels, healHealthLevels } = await import('../combat/health.js');
        if (damaged) {
            // Heal one box
            await healHealthLevels(this.actor, 1);
        }
        else {
            // Damage one box
            await applyDamageToHealthLevels(this.actor, 1);
        }
        this.render(false);
    }
    /**
     * Handle burn stone for charges
     */
    async #onBurnStone(event) {
        event.preventDefault();
        const success = await burnStoneForCharges(this.actor);
        if (success) {
            this.render(false);
        }
    }
    /**
     * Handle saving throw roll
     * @param event - Click event
     */
    async #onSavingThrowRoll(event) {
        event.preventDefault();
        const element = event.currentTarget;
        const saveType = element.dataset.saveType;
        if (!saveType)
            return;
        // Prompt for TN (default to Mastery Rank based DC)
        const masteryRank = this.actor.system.mastery?.rank || 2;
        const defaultTN = 12 * masteryRank;
        const tn = await this.#promptForTN(defaultTN);
        if (tn === null)
            return;
        // Import and perform save
        const { performSave } = await import('../rolls/checks.js');
        await performSave(this.actor, saveType, tn, 'General');
    }
    /**
     * Handle add power or spell
     * Opens a dialog to select from predefined Mastery Trees or Spell Schools
     * @param itemType - Type of item to create ('special' or 'spell')
     */
    async #onAddPowerOrSpell(itemType) {
        if (itemType === 'special') {
            // Show Mastery Trees selection dialog
            await this.#showMasteryTreeSelectionDialog();
        }
        else if (itemType === 'spell') {
            // Show Spell Schools selection dialog
            await this.#showSpellSchoolSelectionDialog();
        }
    }
    /**
     * Show dialog to select a Mastery Tree, then a specific power
     */
    async #showMasteryTreeSelectionDialog() {
        const { getAllMasteryTrees } = await import('../utils/mastery-trees.js');
        const { getPowersForTree } = await import('../utils/mastery-powers.js');
        const trees = getAllMasteryTrees();
        // Build HTML for tree selection
        let html = '<div class="mastery-tree-selection"><h3>Select Mastery Tree</h3>';
        html += '<p>Choose a Mastery Tree to see available powers:</p>';
        html += '<div class="tree-list" style="max-height: 400px; overflow-y: auto;">';
        for (const tree of trees) {
            const powers = getPowersForTree(tree.name);
            const hasPowers = powers.length > 0 && powers[0].name !== 'Placeholder Power';
            html += `
        <div class="tree-option ${!hasPowers ? 'disabled' : ''}" data-tree-name="${tree.name}" style="
          padding: 12px;
          margin: 8px 0;
          border: 2px solid ${hasPowers ? '#8b0000' : '#ccc'};
          border-radius: 8px;
          cursor: ${hasPowers ? 'pointer' : 'not-allowed'};
          transition: all 0.2s;
          background: ${hasPowers ? '#fff' : '#f5f5f5'};
          opacity: ${hasPowers ? '1' : '0.6'};
        ">
          <h4 style="margin: 0 0 5px 0; color: ${hasPowers ? '#8b0000' : '#999'};">${tree.name}</h4>
          <p style="margin: 0 0 5px 0; font-size: 12px; color: #666;">${tree.focus}</p>
          <div style="display: flex; gap: 5px; flex-wrap: wrap; margin-bottom: 5px;">
            ${tree.roles.map(role => `<span style="font-size: 10px; padding: 2px 6px; background: #e0e0e0; border-radius: 3px;">${role}</span>`).join('')}
          </div>
          ${hasPowers ? `<p style="margin: 5px 0 0 0; font-size: 11px; color: #8b0000;"><strong>${powers.length} Powers available</strong></p>` : '<p style="margin: 5px 0 0 0; font-size: 11px; color: #999; font-style: italic;">Coming soon...</p>'}
          ${tree.bonus ? `<p style="margin: 5px 0 0 0; font-size: 11px; font-style: italic; color: #444;"><strong>Bonus:</strong> ${tree.bonus}</p>` : ''}
        </div>
      `;
        }
        html += '</div></div>';
        // Show dialog
        return new Promise((resolve) => {
            const dialog = new Dialog({
                title: 'Add Mastery Power',
                content: html,
                buttons: {
                    cancel: {
                        label: 'Cancel',
                        callback: () => resolve()
                    }
                },
                default: 'cancel',
                render: (html) => {
                    // Add click handlers to tree options (only for non-disabled)
                    html.find('.tree-option:not(.disabled)').on('click', async (event) => {
                        const treeName = $(event.currentTarget).data('tree-name');
                        dialog.close();
                        // Show power selection for this tree
                        await this.#showPowerSelectionDialog(treeName);
                        resolve();
                    });
                    // Add hover effects
                    html.find('.tree-option:not(.disabled)').on('mouseenter', function () {
                        $(this).css({
                            'transform': 'translateX(5px)',
                            'box-shadow': '0 4px 12px rgba(139, 0, 0, 0.3)',
                            'border-color': '#a00000'
                        });
                    }).on('mouseleave', function () {
                        $(this).css({
                            'transform': 'translateX(0)',
                            'box-shadow': 'none',
                            'border-color': '#8b0000'
                        });
                    });
                }
            });
            dialog.render(true);
        });
    }
    /**
     * Show dialog to select a specific power from a tree
     */
    async #showPowerSelectionDialog(treeName) {
        const { getPowersForTree } = await import('../utils/mastery-powers.js');
        const powers = getPowersForTree(treeName);
        // Build HTML for power selection
        let html = `<div class="power-selection"><h3>${treeName} Powers</h3>`;
        html += '<p>Choose a power to add to your character:</p>';
        html += '<div class="power-list" style="max-height: 500px; overflow-y: auto;">';
        for (const power of powers) {
            html += `
        <div class="power-option" data-power-name="${power.name}" style="
          padding: 15px;
          margin: 10px 0;
          border: 3px solid #8b0000;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s;
          background: #fff;
        ">
          <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
            <h4 style="margin: 0; color: #8b0000;">${power.name}</h4>
            <span style="font-size: 11px; padding: 3px 8px; background: #8b0000; color: #fff; border-radius: 4px; text-transform: uppercase;">${power.powerType}</span>
          </div>
          <p style="margin: 0 0 10px 0; font-size: 13px; color: #666; font-style: italic;">${power.description}</p>
          
          <div style="background: #f9f9f9; padding: 10px; border-radius: 6px; border-left: 4px solid #8b0000;">
            <strong style="font-size: 12px; color: #333;">Levels:</strong>
            <ul style="margin: 5px 0 0 0; padding-left: 20px; font-size: 11px; color: #555;">
              ${power.levels.slice(0, 2).map(level => `
                <li><strong>Level ${level.level}:</strong> ${level.effect}</li>
              `).join('')}
              ${power.levels.length > 2 ? '<li style="color: #999; font-style: italic;">... and more</li>' : ''}
            </ul>
          </div>
        </div>
      `;
        }
        html += '</div><button type="button" class="back-btn" style="margin-top: 15px; padding: 8px 16px; background: #666; color: #fff; border: none; border-radius: 4px; cursor: pointer;">← Back to Trees</button></div>';
        // Show dialog
        return new Promise((resolve) => {
            const dialog = new Dialog({
                title: `Add ${treeName} Power`,
                content: html,
                buttons: {
                    cancel: {
                        label: 'Cancel',
                        callback: () => resolve()
                    }
                },
                default: 'cancel',
                render: (html) => {
                    // Add click handlers to power options
                    html.find('.power-option').on('click', async (event) => {
                        const powerName = $(event.currentTarget).data('power-name');
                        const { getPower } = await import('../utils/mastery-powers.js');
                        const powerDef = getPower(treeName, powerName);
                        if (!powerDef)
                            return;
                        // Create item with full power data
                        const itemData = {
                            name: powerDef.name,
                            type: 'special',
                            system: {
                                description: powerDef.description,
                                tree: treeName,
                                level: 1,
                                equipped: false,
                                powerType: powerDef.powerType,
                                passiveCategory: powerDef.passiveCategory || '',
                                range: powerDef.levels[0].range || '0m',
                                aoe: powerDef.levels[0].aoe || '',
                                duration: powerDef.levels[0].duration || 'instant',
                                effect: powerDef.levels[0].effect,
                                cost: powerDef.levels[0].cost || { action: true },
                                roll: powerDef.levels[0].roll || {},
                                requirements: { masteryRank: 1 }
                            }
                        };
                        await this.actor.createEmbeddedDocuments('Item', [itemData]);
                        dialog.close();
                        this.render(false);
                        ui.notifications?.info(`Added ${powerName} from ${treeName} tree!`);
                        resolve();
                    });
                    // Back button
                    html.find('.back-btn').on('click', async () => {
                        dialog.close();
                        await this.#showMasteryTreeSelectionDialog();
                        resolve();
                    });
                    // Add hover effects
                    html.find('.power-option').on('mouseenter', function () {
                        $(this).css({
                            'transform': 'scale(1.02)',
                            'box-shadow': '0 6px 18px rgba(139, 0, 0, 0.4)',
                            'border-color': '#a00000'
                        });
                    }).on('mouseleave', function () {
                        $(this).css({
                            'transform': 'scale(1)',
                            'box-shadow': 'none',
                            'border-color': '#8b0000'
                        });
                    });
                }
            });
            dialog.render(true);
        });
    }
    /**
     * Show dialog to select a Spell School
     */
    async #showSpellSchoolSelectionDialog() {
        const { getAllSpellSchools } = await import('../utils/spell-schools.js');
        const schools = getAllSpellSchools();
        // Build HTML for school selection
        let html = '<div class="spell-school-selection"><h3>Select Spell School</h3>';
        html += '<p>Choose a Spell School to add spells from:</p>';
        html += '<div class="school-list" style="max-height: 400px; overflow-y: auto;">';
        for (const school of schools) {
            html += `
        <div class="school-option" data-school-key="${school.name.toLowerCase().replace(/\s+/g, '')}" style="
          padding: 12px;
          margin: 8px 0;
          border: 2px solid #8b0000;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          background: #fff;
        ">
          <h4 style="margin: 0 0 5px 0; color: #8b0000;">${school.fullName}</h4>
          <p style="margin: 0 0 5px 0; font-size: 12px; color: #666;">${school.focus}</p>
          <div style="display: flex; gap: 5px; flex-wrap: wrap;">
            ${school.roles.map(role => `<span style="font-size: 10px; padding: 2px 6px; background: #e0e0e0; border-radius: 3px;">${role}</span>`).join('')}
          </div>
          ${school.bonus ? `<p style="margin: 5px 0 0 0; font-size: 11px; font-style: italic; color: #444;"><strong>Bonus:</strong> ${school.bonus}</p>` : ''}
        </div>
      `;
        }
        html += '</div></div>';
        // Show dialog
        return new Promise((resolve) => {
            const dialog = new Dialog({
                title: 'Add Spell',
                content: html,
                buttons: {
                    cancel: {
                        label: 'Cancel',
                        callback: () => resolve()
                    }
                },
                default: 'cancel',
                render: (html) => {
                    // Add click handlers to school options
                    html.find('.school-option').on('click', async (event) => {
                        const schoolKey = $(event.currentTarget).data('school-key');
                        const schoolName = schools.find(s => s.name.toLowerCase().replace(/\s+/g, '') === schoolKey)?.name || schoolKey;
                        // Create a spell for this school
                        const itemData = {
                            name: `New ${schoolName} Spell`,
                            type: 'spell',
                            system: {
                                description: `A spell from the ${schoolName} school.`,
                                school: schoolName,
                                level: 1,
                                prepared: false,
                                spellType: 'active',
                                castingTime: '1 action',
                                range: '0m',
                                duration: 'instant'
                            }
                        };
                        await this.actor.createEmbeddedDocuments('Item', [itemData]);
                        dialog.close();
                        this.render(false);
                        resolve();
                    });
                    // Add hover effects
                    html.find('.school-option').on('mouseenter', function () {
                        $(this).css({
                            'transform': 'translateX(5px)',
                            'box-shadow': '0 4px 12px rgba(139, 0, 0, 0.3)',
                            'border-color': '#a00000'
                        });
                    }).on('mouseleave', function () {
                        $(this).css({
                            'transform': 'translateX(0)',
                            'box-shadow': 'none',
                            'border-color': '#8b0000'
                        });
                    });
                }
            });
            dialog.render(true);
        });
    }
    /**
     * Handle maneuver use
     */
    async #onManeuverUse(event) {
        event.preventDefault();
        const element = event.currentTarget;
        const maneuverType = element.dataset.maneuver;
        if (!maneuverType)
            return;
        // Get target if needed (for Charge)
        let target = null;
        if (maneuverType === 'charge') {
            const targets = Array.from(game.user?.targets || []);
            if (targets.length === 0) {
                ui.notifications?.warn('Charge requires a target!');
                return;
            }
            target = targets[0].actor;
        }
        await performManeuver(this.actor, maneuverType, target);
        this.render(false);
    }
    /**
     * Handle buff removal
     */
    async #onBuffRemove(event) {
        event.preventDefault();
        const element = event.currentTarget;
        const buffId = element.dataset.buffId;
        if (!buffId)
            return;
        const { removeBuff } = await import('../powers/buffs.js');
        await removeBuff(this.actor, buffId);
        this.render(false);
    }
}
//# sourceMappingURL=character-sheet.js.map