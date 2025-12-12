/**
 * Character Creation Wizard for Mastery System
 * Multi-step wizard for character creation with attribute, skill, and disadvantage allocation
 */
import { SKILLS } from '../utils/skills.js';
import { CREATION } from '../utils/constants.js';
import { DISADVANTAGES, getDisadvantageDefinition, calculateDisadvantagePoints, validateDisadvantageSelection } from '../system/disadvantages.js';
// Use Application (V1) for compatibility - ApplicationV2 requires mixins
const BaseApplication = Application;
export class CharacterCreationWizard extends BaseApplication {
    actor;
    state;
    constructor(actor, options) {
        super(options);
        this.actor = actor;
        this.state = this.initializeState();
    }
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            id: 'character-creation-wizard',
            title: 'Character Creation',
            template: 'systems/mastery-system/templates/dialogs/character-creation-wizard.hbs',
            width: 800,
            height: 700,
            resizable: true,
            classes: ['mastery-system', 'character-creation-wizard']
        });
    }
    initializeState() {
        const system = this.actor.system;
        const masteryRank = system.mastery?.rank || 2;
        // Initialize attributes at MR
        const attributes = {};
        const attributeKeys = ['might', 'agility', 'vitality', 'intellect', 'resolve', 'influence', 'wits'];
        for (const key of attributeKeys) {
            attributes[key] = masteryRank;
        }
        // Initialize skills at 0
        const skills = {};
        for (const key of Object.keys(SKILLS)) {
            skills[key] = 0;
        }
        return {
            step: 1,
            attributes,
            skills,
            disadvantages: [],
            attributePointsSpent: 0,
            skillPointsSpent: 0,
            disadvantagePointsSpent: 0
        };
    }
    getData(options) {
        const system = this.actor.system;
        const masteryRank = system.mastery?.rank || 2;
        const skillPointsConfig = CONFIG.MASTERY?.creation?.skillPoints || CREATION.SKILL_POINTS;
        // Calculate remaining points
        const attributePointsRemaining = CREATION.ATTRIBUTE_POINTS - this.state.attributePointsSpent;
        const skillPointsRemaining = skillPointsConfig - this.state.skillPointsSpent;
        // Check if steps are complete
        const attributesComplete = this.state.attributePointsSpent === CREATION.ATTRIBUTE_POINTS;
        const skillsComplete = this.state.skillPointsSpent === skillPointsConfig;
        const canProceed = attributesComplete && skillsComplete;
        return {
            ...super.getData(options),
            actor: this.actor,
            state: this.state,
            masteryRank,
            skillPointsConfig,
            attributePointsRemaining,
            skillPointsRemaining,
            attributesComplete,
            skillsComplete,
            canProceed,
            attributeKeys: ['might', 'agility', 'vitality', 'intellect', 'resolve', 'influence', 'wits'],
            attributeLabels: {
                might: 'Might',
                agility: 'Agility',
                vitality: 'Vitality',
                intellect: 'Intellect',
                resolve: 'Resolve',
                influence: 'Influence',
                wits: 'Wits'
            },
            skills: this.#prepareSkills(),
            disadvantages: DISADVANTAGES,
            selectedDisadvantages: this.state.disadvantages,
            disadvantageValidation: validateDisadvantageSelection(this.state.disadvantages),
            maxAttribute: CREATION.MAX_ATTRIBUTE_AT_CREATION,
            maxSkill: CREATION.MAX_SKILL_AT_CREATION,
            maxDisadvantagePoints: CREATION.MAX_DISADVANTAGE_POINTS
        };
    }
    #prepareSkills() {
        const skillsByCategory = new Map();
        for (const [key, def] of Object.entries(SKILLS)) {
            const category = def.category;
            if (!skillsByCategory.has(category)) {
                skillsByCategory.set(category, []);
            }
            skillsByCategory.get(category).push({
                key,
                name: def.name,
                value: this.state.skills[key] || 0
            });
        }
        // Sort within categories
        for (const skills of skillsByCategory.values()) {
            skills.sort((a, b) => a.name.localeCompare(b.name));
        }
        return Array.from(skillsByCategory.entries()).map(([category, skills]) => ({
            category,
            skills
        }));
    }
    // Implement required methods for Handlebars templates (Foundry VTT v13)
    async _renderHTML(_data) {
        const template = this.constructor.defaultOptions.template || this.options.template;
        if (!template) {
            throw new Error('Template path is required');
        }
        const templateData = await this.getData();
        const html = await foundry.applications.handlebars.renderTemplate(template, templateData);
        return $(html);
    }
    async _replaceHTML(element, html) {
        element.replaceWith(html);
    }
    activateListeners(html) {
        super.activateListeners(html);
        // Step navigation
        html.find('.step-nav-button').on('click', this.#onStepNav.bind(this));
        html.find('.step-button').on('click', this.#onStepButton.bind(this));
        // Attribute controls
        html.find('.attr-increase').on('click', this.#onAttributeIncrease.bind(this));
        html.find('.attr-decrease').on('click', this.#onAttributeDecrease.bind(this));
        // Skill controls
        html.find('.skill-increase').on('click', this.#onSkillIncrease.bind(this));
        html.find('.skill-decrease').on('click', this.#onSkillDecrease.bind(this));
        // Disadvantage controls
        html.find('.disadvantage-add').on('click', this.#onDisadvantageAdd.bind(this));
        html.find('.disadvantage-remove').on('click', this.#onDisadvantageRemove.bind(this));
        html.find('.disadvantage-edit').on('click', this.#onDisadvantageEdit.bind(this));
        // Finalize
        html.find('.finalize-button').on('click', this.#onFinalize.bind(this));
    }
    #onStepNav(event) {
        const step = parseInt($(event.currentTarget).data('step') || '1');
        if (step >= 1 && step <= 5) {
            this.state.step = step;
            this.render();
        }
    }
    #onStepButton(event) {
        const direction = $(event.currentTarget).data('direction');
        if (direction === 'next' && this.state.step < 5) {
            this.state.step++;
            this.render();
        }
        else if (direction === 'prev' && this.state.step > 1) {
            this.state.step--;
            this.render();
        }
    }
    #onAttributeIncrease(event) {
        const attribute = $(event.currentTarget).data('attribute');
        const current = this.state.attributes[attribute] || 0;
        if (current < CREATION.MAX_ATTRIBUTE_AT_CREATION && this.state.attributePointsSpent < CREATION.ATTRIBUTE_POINTS) {
            this.state.attributes[attribute] = current + 1;
            this.state.attributePointsSpent++;
            this.render();
        }
    }
    #onAttributeDecrease(event) {
        const attribute = $(event.currentTarget).data('attribute');
        const current = this.state.attributes[attribute] || 0;
        const masteryRank = (this.actor.system.mastery?.rank || 2);
        if (current > masteryRank && this.state.attributePointsSpent > 0) {
            this.state.attributes[attribute] = current - 1;
            this.state.attributePointsSpent--;
            this.render();
        }
    }
    #onSkillIncrease(event) {
        const skill = $(event.currentTarget).data('skill');
        const current = this.state.skills[skill] || 0;
        const skillPointsConfig = CONFIG.MASTERY?.creation?.skillPoints || CREATION.SKILL_POINTS;
        if (current < CREATION.MAX_SKILL_AT_CREATION && this.state.skillPointsSpent < skillPointsConfig) {
            this.state.skills[skill] = current + 1;
            this.state.skillPointsSpent++;
            this.render();
        }
    }
    #onSkillDecrease(event) {
        const skill = $(event.currentTarget).data('skill');
        const current = this.state.skills[skill] || 0;
        if (current > 0 && this.state.skillPointsSpent > 0) {
            this.state.skills[skill] = current - 1;
            this.state.skillPointsSpent--;
            this.render();
        }
    }
    #onDisadvantageAdd(event) {
        const disadvantageId = $(event.currentTarget).data('disadvantage-id');
        const def = getDisadvantageDefinition(disadvantageId);
        if (!def)
            return;
        // Open dialog to configure disadvantage
        this.#openDisadvantageDialog(def);
    }
    #onDisadvantageRemove(event) {
        const index = parseInt($(event.currentTarget).data('index') || '0');
        if (index >= 0 && index < this.state.disadvantages.length) {
            const removed = this.state.disadvantages.splice(index, 1)[0];
            this.state.disadvantagePointsSpent -= removed.points;
            this.render();
        }
    }
    #onDisadvantageEdit(event) {
        const index = parseInt($(event.currentTarget).data('index') || '0');
        if (index >= 0 && index < this.state.disadvantages.length) {
            const selection = this.state.disadvantages[index];
            const def = getDisadvantageDefinition(selection.id);
            if (def) {
                this.#openDisadvantageDialog(def, index, selection.details);
            }
        }
    }
    async #openDisadvantageDialog(def, editIndex, existingDetails) {
        const content = await renderTemplate('systems/mastery-system/templates/dialogs/disadvantage-config.hbs', {
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
                    callback: (html) => {
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
                        const validation = validateDisadvantageSelection([
                            ...this.state.disadvantages.filter((_, i) => i !== editIndex),
                            { id: def.id, details }
                        ]);
                        if (!validation.valid) {
                            ui.notifications?.error(validation.error || 'Invalid disadvantage selection');
                            return false;
                        }
                        if (editIndex !== undefined) {
                            // Edit existing
                            const oldPoints = this.state.disadvantages[editIndex].points;
                            this.state.disadvantages[editIndex] = {
                                id: def.id,
                                name: def.name,
                                points,
                                details,
                                description: def.description
                            };
                            this.state.disadvantagePointsSpent = this.state.disadvantagePointsSpent - oldPoints + points;
                        }
                        else {
                            // Add new
                            this.state.disadvantages.push({
                                id: def.id,
                                name: def.name,
                                points,
                                details,
                                description: def.description
                            });
                            this.state.disadvantagePointsSpent += points;
                        }
                        this.render();
                        return true;
                    }
                },
                cancel: {
                    icon: '<i class="fas fa-times"></i>',
                    label: 'Cancel'
                }
            },
            default: 'save'
        }).render(true);
    }
    async #onFinalize() {
        // Validate all steps
        const skillPointsConfig = CONFIG.MASTERY?.creation?.skillPoints || CREATION.SKILL_POINTS;
        if (this.state.attributePointsSpent !== CREATION.ATTRIBUTE_POINTS) {
            ui.notifications?.error(`Must spend exactly ${CREATION.ATTRIBUTE_POINTS} attribute points.`);
            return;
        }
        if (this.state.skillPointsSpent !== skillPointsConfig) {
            ui.notifications?.error(`Must spend exactly ${skillPointsConfig} skill points.`);
            return;
        }
        const validation = validateDisadvantageSelection(this.state.disadvantages);
        if (!validation.valid) {
            ui.notifications?.error(validation.error || 'Invalid disadvantage selection');
            return;
        }
        // Apply changes to actor
        const updateData = {
            'system.attributes': {},
            'system.skills': {},
            'system.disadvantages': this.state.disadvantages,
            'system.creation.complete': true
        };
        // Update attributes
        for (const [key, value] of Object.entries(this.state.attributes)) {
            updateData[`system.attributes.${key}.value`] = value;
        }
        // Update skills
        for (const [key, value] of Object.entries(this.state.skills)) {
            if (value > 0) {
                updateData[`system.skills.${key}`] = value;
            }
        }
        // Sync Faith Fractures
        const disadvantagePoints = this.state.disadvantagePointsSpent;
        const maxFF = (this.actor.system.faithFractures?.maximum || 10);
        updateData['system.faithFractures.current'] = Math.min(disadvantagePoints, maxFF);
        updateData['system.faithFractures.maximum'] = Math.max(disadvantagePoints, maxFF);
        try {
            await this.actor.update(updateData);
            ui.notifications?.info('Character creation complete!');
            this.close();
            // Re-render the actor sheet
            if (this.actor.sheet?.rendered) {
                this.actor.sheet.render();
            }
        }
        catch (error) {
            console.error('Mastery System | Failed to finalize character creation', error);
            ui.notifications?.error('Failed to finalize character creation');
        }
    }
}
/**
 * Open the Character Creation Wizard for an actor
 */
export function openCharacterCreationWizard(actor) {
    const wizard = new CharacterCreationWizard(actor);
    wizard.render(true);
    return wizard;
}
//# sourceMappingURL=character-creation-wizard.js.map