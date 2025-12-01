/**
 * Character Sheet for Mastery System
 * Main player character sheet with tabs for attributes, skills, powers, etc.
 */
import { quickRoll } from '../dice/roll-handler.js';
import { getSkillsByCategory, SKILL_CATEGORIES, SKILLS } from '../utils/skills.js';
import { getAllMasteryTrees } from '../utils/mastery-trees.js';
import { getAllSpellSchools } from '../utils/spell-schools.js';
import { getAllRituals } from '../utils/rituals.js';
export class MasteryCharacterSheet extends foundry.appv1.sheets.ActorSheet {
    editMode = false;
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
        // Edit mode state (stored in sheet data)
        context.editMode = this.editMode || false;
        // Enrich biography info for display
        context.enrichedBio = {
            notes: foundry.applications.ux.TextEditor.implementation.enrichHTML(context.system.bio?.notes || ''),
            background: foundry.applications.ux.TextEditor.implementation.enrichHTML(context.system.notes?.background || '')
        };
        // Prepare items by type
        context.items = this.#prepareItems();
        // Calculate derived values
        context.derivedValues = this.#calculateDerivedValues(context.system);
        // Add skills list (grouped by category)
        context.skillsByCategory = this.#prepareSkills(context.system.skills);
        // Add mastery trees
        context.masteryTrees = getAllMasteryTrees();
        // Add spell schools
        context.spellSchools = getAllSpellSchools();
        // Add rituals
        context.rituals = getAllRituals();
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
        // Calculate saving throws (highest value from relevant attributes)
        const attributes = system.attributes || {};
        // BODY: might, agility, vitality (physical)
        const bodyAttrs = [
            attributes.might?.value || 0,
            attributes.agility?.value || 0,
            attributes.vitality?.value || 0
        ];
        const bodySave = Math.max(...bodyAttrs);
        // WILL: resolve, influence (willpower)
        const willAttrs = [
            attributes.resolve?.value || 0,
            attributes.influence?.value || 0
        ];
        const willSave = Math.max(...willAttrs);
        // MIND: intellect, wits (mental)
        const mindAttrs = [
            attributes.intellect?.value || 0,
            attributes.wits?.value || 0
        ];
        const mindSave = Math.max(...mindAttrs);
        return {
            totalStones: system.stones?.total || 0,
            currentStones: system.stones?.current || 0,
            vitalityStones: system.stones?.vitality || 0,
            currentHP: this.actor.totalHP || 0,
            maxHP: this.actor.maxHP || 0,
            currentPenalty: this.actor.currentPenalty || 0,
            keepDice: system.mastery?.rank || 1,
            savingThrows: {
                body: bodySave,
                will: willSave,
                mind: mindSave
            }
        };
    }
    /**
     * Prepare skills for display, grouped by category
     */
    #prepareSkills(skills) {
        const skillsByCategory = getSkillsByCategory();
        const result = {};
        // Initialize all categories
        for (const category of Object.values(SKILL_CATEGORIES)) {
            result[category] = [];
        }
        // Add skills to their categories - use the actual keys from SKILLS
        for (const [key, skillDef] of Object.entries(skillsByCategory)) {
            const skillList = skillDef;
            for (const skill of skillList) {
                // Find the actual key in SKILLS object
                let skillKey = '';
                for (const [skKey, skDef] of Object.entries(SKILLS)) {
                    const sk = skDef;
                    if (sk?.name === skill.name) {
                        skillKey = skKey;
                        break;
                    }
                }
                // If not found, use normalized key
                if (!skillKey) {
                    skillKey = this.#normalizeSkillKey(skill.name);
                }
                // Try multiple key formats to find the value
                const value = skills?.[skillKey]
                    || skills?.[skill.name.toLowerCase()]
                    || skills?.[skill.name.toLowerCase().replace(/\s+/g, '')]
                    || skills?.[skill.name.toLowerCase().replace(/\s+/g, '').replace(/\//g, '')]
                    || 0;
                result[key].push({
                    key: skillKey,
                    name: skill.name,
                    value: value,
                    attributes: skill.attributes,
                    category: skill.category
                });
            }
        }
        return result;
    }
    /**
     * Normalize skill key to match stored format
     * Maps skill names to their keys in SKILLS object
     */
    #normalizeSkillKey(skillName) {
        // Try to find matching skill by name first
        for (const [key, skill] of Object.entries(SKILLS)) {
            const skillDef = skill;
            if (skillDef?.name?.toLowerCase() === skillName.toLowerCase()) {
                return key;
            }
        }
        // If not found, try camelCase conversion
        const normalized = skillName
            .toLowerCase()
            .replace(/\s+/g, '')
            .replace(/\//g, '')
            .replace(/-/g, '');
        // Handle special cases
        const mappings = {
            'sleightofhand': 'sleightOfHand',
            'herbalismalchemy': 'herbalismAlchemy',
            'herbalism/alchemy': 'herbalismAlchemy',
            'handtohand': 'handToHand',
            'hand-to-hand': 'handToHand',
            'meleeweapons': 'meleeWeapons',
            'melee weapons': 'meleeWeapons',
            'rangedweapons': 'rangedWeapons',
            'ranged weapons': 'rangedWeapons',
            'defensivecombat': 'defensiveCombat',
            'defensive combat': 'defensiveCombat',
            'combatreflexes': 'combatReflexes',
            'combat reflexes': 'combatReflexes',
            'animalhandling': 'animalHandling',
            'animal handling': 'animalHandling',
            'weathersense': 'weatherSense',
            'weather sense': 'weatherSense',
            'foraging': 'foraging'
        };
        return mappings[normalized] || normalized;
    }
    /** @override */
    activateListeners(html) {
        super.activateListeners(html);
        // Edit mode toggle
        html.find('.edit-mode-toggle').on('click', this.#onEditModeToggle.bind(this));
        // Everything below here is only needed if the sheet is editable
        if (!this.isEditable)
            return;
        // Attribute rolls
        html.find('.attribute-roll').on('click', this.#onAttributeRoll.bind(this));
        // Saving throw rolls
        html.find('.saving-throw-roll').on('click', this.#onSavingThrowRoll.bind(this));
        // Skill rolls
        html.find('.skill-roll').on('click', this.#onSkillRoll.bind(this));
        // Add skill
        html.find('.skill-add').on('click', this.#onSkillAdd.bind(this));
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
     * Toggle edit mode for header fields
     */
    #onEditModeToggle(event) {
        event.preventDefault();
        this.editMode = !this.editMode;
        this.render();
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
     * Handle saving throw roll
     */
    async #onSavingThrowRoll(event) {
        event.preventDefault();
        const element = event.currentTarget;
        const saveType = element.dataset.save; // body, will, or mind
        if (!saveType)
            return;
        const system = this.actor.system;
        const attributes = system.attributes || {};
        // Determine which attribute to use for the saving throw
        let attributeName = '';
        if (saveType === 'body') {
            // Use highest of might, agility, vitality
            const might = attributes.might?.value || 0;
            const agility = attributes.agility?.value || 0;
            const vitality = attributes.vitality?.value || 0;
            if (might >= agility && might >= vitality) {
                attributeName = 'might';
            }
            else if (agility >= vitality) {
                attributeName = 'agility';
            }
            else {
                attributeName = 'vitality';
            }
        }
        else if (saveType === 'will') {
            // Use highest of resolve, influence
            const resolve = attributes.resolve?.value || 0;
            const influence = attributes.influence?.value || 0;
            if (resolve >= influence) {
                attributeName = 'resolve';
            }
            else {
                attributeName = 'influence';
            }
        }
        else if (saveType === 'mind') {
            // Use highest of intellect, wits
            const intellect = attributes.intellect?.value || 0;
            const wits = attributes.wits?.value || 0;
            if (intellect >= wits) {
                attributeName = 'intellect';
            }
            else {
                attributeName = 'wits';
            }
        }
        if (!attributeName)
            return;
        // Saving throws typically use a fixed TN (e.g., 16)
        const tn = 16;
        await quickRoll(this.actor, attributeName, undefined, tn, `${saveType.toUpperCase()} Saving Throw`);
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
        // Get skill definition to determine which attribute to use
        const { getSkill } = await import('../utils/skills.js');
        let skillDef = getSkill(skillKey);
        // If not found by key, try to find by name
        if (!skillDef) {
            for (const skill of Object.values(SKILLS)) {
                const sk = skill;
                const normalizedKey = this.#normalizeSkillKey(sk.name);
                if (normalizedKey === skillKey) {
                    skillDef = sk;
                    break;
                }
            }
        }
        if (!skillDef) {
            console.warn(`Skill ${skillKey} not found in skill definitions`);
            // Fallback: use wits as default
            const tn = await this.#promptForTN();
            if (tn === null)
                return;
            await quickRoll(this.actor, 'wits', skillKey, tn, `${skillKey} Check`);
            return;
        }
        // Use first attribute from skill definition (primary attribute)
        const attribute = skillDef.attributes[0];
        // Prompt for TN
        const tn = await this.#promptForTN();
        if (tn === null)
            return;
        await quickRoll(this.actor, attribute, skillKey, tn, `${skillDef.name} Check`);
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
        // Special handling for powers - show tree selection dialog
        if (type === 'special') {
            await this.#showPowerCreationDialog();
            return;
        }
        const itemData = {
            name: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
            type
        };
        await this.actor.createEmbeddedDocuments('Item', [itemData]);
    }
    /**
     * Show dialog for creating a power with tree selection
     */
    async #showPowerCreationDialog() {
        const { getAllMasteryTrees } = await import('../utils/mastery-trees.js');
        const trees = getAllMasteryTrees();
        // Create tree selection options
        const treeOptions = trees.map(tree => `<option value="${tree.name}">${tree.name}</option>`).join('');
        const content = `
      <form>
        <div class="form-group">
          <label>Mastery Tree:</label>
          <select name="tree" id="power-tree-select" style="width: 100%; margin-bottom: 10px;">
            <option value="">-- Select a Tree --</option>
            ${treeOptions}
          </select>
        </div>
        <div class="form-group">
          <label>Power Name:</label>
          <input type="text" name="name" id="power-name-input" placeholder="Enter power name" style="width: 100%; margin-bottom: 10px;"/>
        </div>
        <div class="form-group">
          <label>Power Type:</label>
          <select name="powerType" id="power-type-select" style="width: 100%; margin-bottom: 10px;">
            <option value="active">Active</option>
            <option value="buff">Buff</option>
            <option value="utility">Utility</option>
            <option value="passive">Passive</option>
            <option value="reaction">Reaction</option>
            <option value="movement">Movement</option>
          </select>
        </div>
        <div class="form-group">
          <label>Level:</label>
          <input type="number" name="level" id="power-level-input" value="1" min="1" max="4" style="width: 100%; margin-bottom: 10px;"/>
        </div>
      </form>
    `;
        new Dialog({
            title: 'Create New Power',
            content: content,
            buttons: {
                create: {
                    icon: '<i class="fas fa-check"></i>',
                    label: 'Create',
                    callback: async (html) => {
                        const $html = html;
                        const tree = $html.find('#power-tree-select').val();
                        const name = $html.find('#power-name-input').val() || 'New Power';
                        const powerType = $html.find('#power-type-select').val() || 'active';
                        const level = parseInt($html.find('#power-level-input').val() || '1');
                        if (!tree) {
                            ui.notifications?.warn('Please select a Mastery Tree');
                            return;
                        }
                        const itemData = {
                            name: name,
                            type: 'special',
                            system: {
                                tree: tree,
                                powerType: powerType,
                                level: level,
                                description: '',
                                tags: [],
                                range: '0m',
                                aoe: '',
                                duration: 'instant',
                                effect: '',
                                specials: [],
                                ap: 30,
                                cost: {
                                    action: true,
                                    movement: false,
                                    reaction: false,
                                    stones: 0,
                                    charges: 0
                                },
                                roll: {
                                    attribute: 'might',
                                    tn: 0,
                                    damage: '',
                                    healing: '',
                                    raises: ''
                                },
                                requirements: {
                                    masteryRank: level,
                                    other: ''
                                }
                            }
                        };
                        await this.actor.createEmbeddedDocuments('Item', [itemData]);
                        ui.notifications?.info(`Created power: ${name} from ${tree} tree`);
                    }
                },
                cancel: {
                    icon: '<i class="fas fa-times"></i>',
                    label: 'Cancel',
                    callback: () => { }
                }
            },
            default: 'create'
        }).render(true);
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