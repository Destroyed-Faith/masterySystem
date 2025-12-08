/**
 * Character Sheet for Mastery System
 * Main player character sheet with tabs for attributes, skills, powers, etc.
 */
import { quickRoll } from '../dice/roll-handler.js';
import { SKILLS } from '../utils/skills.js';
// Use namespaced ActorSheet when available to avoid deprecation warnings
const BaseActorSheet = foundry?.appv1?.sheets?.ActorSheet || ActorSheet;
export class MasteryCharacterSheet extends BaseActorSheet {
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
    /**
     * Add Spell → open magic power dialog
     */
    async #onSpellAdd(event) {
        event.preventDefault();
        await this.#openMagicPowerDialog();
    }
    /**
     * Open the prebuilt Magic Power Creation Dialog (dropdown of schools/powers)
     */
    async #openMagicPowerDialog() {
        try {
            const dialogModule = await import('../../dist/sheets/character-sheet-magic-dialog.js');
            if (dialogModule?.showMagicPowerCreationDialog) {
                await dialogModule.showMagicPowerCreationDialog(this.actor);
            }
            else {
                ui.notifications?.error('Magic power dialog not found.');
            }
        }
        catch (error) {
            console.error('Mastery System | Failed to open magic power dialog', error);
            ui.notifications?.error('Failed to open magic power selection dialog');
        }
    }
    /**
     * Add a new Power → open power dialog (Mastery Trees)
     */
    async #onPowerAdd(event) {
        event.preventDefault();
        await this.#openPowerDialog();
    }
    /**
     * Open the Power Creation Dialog (dropdown of Mastery Trees/Powers)
     */
    async #openPowerDialog() {
        try {
            const dialogModule = await import('../../dist/sheets/character-sheet-power-dialog.js');
            if (dialogModule?.showPowerCreationDialog) {
                await dialogModule.showPowerCreationDialog(this.actor);
            }
            else {
                ui.notifications?.error('Power dialog not found.');
            }
        }
        catch (error) {
            console.error('Mastery System | Failed to open power dialog', error);
            ui.notifications?.error('Failed to open power selection dialog');
        }
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
        const TextEditorImpl = foundry.applications?.ux?.TextEditor?.implementation || TextEditor;
        context.enrichedBio = {
            notes: TextEditorImpl.enrichHTML(context.system.bio?.notes || ''),
            background: TextEditorImpl.enrichHTML(context.system.notes?.background || '')
        };
        // Prepare items by type
        context.items = this.#prepareItems();
        // Calculate derived values
        context.derivedValues = this.#calculateDerivedValues(context.system);
        // Add skills list (sorted alphabetically)
        context.skills = this.#prepareSkills(context.system.skills);
        return context;
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
        const weapons = [];
        const armor = [];
        for (const item of this.actor.items) {
            const itemData = item;
            switch (item.type) {
                case 'special':
                    powers.push(itemData);
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
        return {
            powers,
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
    #prepareSkills(skillValues = {}) {
        const skillList = [];
        for (const [key, definition] of Object.entries(SKILLS)) {
            skillList.push({
                key,
                name: definition.name,
                category: definition.category,
                attributes: definition.attributes,
                value: skillValues[key] || 0
            });
        }
        // Sort by category first, then by name
        skillList.sort((a, b) => {
            if (a.category !== b.category) {
                return a.category.localeCompare(b.category);
            }
            return a.name.localeCompare(b.name);
        });
        return skillList;
    }
    /** @override */
    activateListeners(html) {
        super.activateListeners(html);
        // Everything below here is only needed if the sheet is editable
        if (!this.isEditable)
            return;
        // Attribute rolls
        html.find('.attribute-roll').on('click', this.#onAttributeRoll.bind(this));
        // Attribute point spending
        html.find('.attribute-spend-point').on('click', this.#onAttributeSpendPoint.bind(this));
        // Skill rolls
        html.find('.skill-roll').on('click', this.#onSkillRoll.bind(this));
        // Add skill
        html.find('.skill-add').on('click', this.#onSkillAdd.bind(this));
        // Add power
        html.find('.add-power-btn').on('click', this.#onPowerAdd.bind(this));
        // Add spell
        html.find('.add-spell-btn').on('click', this.#onSpellAdd.bind(this));
        // Delete skill
        html.find('.skill-delete').on('click', this.#onSkillDelete.bind(this));
        // Power use
        html.find('.power-use').on('click', this.#onPowerUse.bind(this));
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
     * Handle spending attribute points
     */
    async #onAttributeSpendPoint(event) {
        event.preventDefault();
        const element = event.currentTarget;
        const attributeName = element.dataset.attribute;
        if (!attributeName)
            return;
        const currentValue = this.actor.system.attributes[attributeName]?.value || 0;
        const availablePoints = this.actor.system.points?.attribute || 0;
        const cost = this.#calculateAttributeCost(currentValue);
        // Check if we have enough points
        if (availablePoints < cost) {
            ui.notifications?.warn(`Not enough Attribute Points! You need ${cost} points, but only have ${availablePoints}.`);
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
        updates['system.points.attribute'] = availablePoints - cost;
        await this.actor.update(updates);
        ui.notifications?.info(`${attributeName.charAt(0).toUpperCase() + attributeName.slice(1)} increased to ${currentValue + 1}! (Cost: ${cost} points, Remaining: ${availablePoints - cost})`);
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
        const skill = element.dataset.skill;
        if (!skill)
            return;
        // Default to Wits for skill rolls (can be customized)
        const attribute = 'wits';
        // Prompt for TN
        const tn = await this.#promptForTN();
        if (tn === null)
            return;
        await quickRoll(this.actor, attribute, skill, tn, `${skill.charAt(0).toUpperCase() + skill.slice(1)} Check`);
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
}
//# sourceMappingURL=character-sheet.js.map