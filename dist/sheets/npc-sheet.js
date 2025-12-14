/**
 * NPC Sheet for Mastery System
 * Simplified sheet for non-player characters
 */
import { MasteryCharacterSheet } from './character-sheet.js';
export class MasteryNpcSheet extends MasteryCharacterSheet {
    /** @override */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ['mastery-system', 'sheet', 'actor', 'npc'],
            template: 'systems/mastery-system/templates/actor/npc-sheet.hbs',
            width: 600,
            height: 700,
            tabs: [
                {
                    navSelector: '.sheet-tabs',
                    contentSelector: '.sheet-body',
                    initial: 'phase-0'
                }
            ]
        });
    }
    /** @override */
    get template() {
        return 'systems/mastery-system/templates/actor/npc-sheet.hbs';
    }
    /** @override */
    activateListeners(html) {
        super.activateListeners(html);
        // Status effect removal (both normal and phase-based)
        html.find('.effect-remove').on('click', this.#onRemoveStatusEffect.bind(this));
        // Attack value management (both normal and phase-based)
        html.find('.attack-value-add').on('click', this.#onAttackValueAdd.bind(this));
        html.find('.attack-value-delete').on('click', this.#onAttackValueDelete.bind(this));
        // Phase management
        html.find('.phase-add-btn').on('click', this.#onPhaseAdd.bind(this));
        html.find('.phase-delete-btn').on('click', this.#onPhaseDelete.bind(this));
    }
    /**
     * Remove a status effect from the NPC (normal or phase-based)
     */
    async #onRemoveStatusEffect(event) {
        event.preventDefault();
        const index = parseInt($(event.currentTarget).data('effect-index') || '0');
        const phaseIndex = $(event.currentTarget).data('phase-index');
        const system = this.actor.system;
        if (phaseIndex !== undefined && phaseIndex !== null) {
            // Phase-based status effect
            if (!system.phases || !system.phases[phaseIndex] || !system.phases[phaseIndex].statusEffects) {
                return;
            }
            if (index >= 0 && index < system.phases[phaseIndex].statusEffects.length) {
                system.phases[phaseIndex].statusEffects.splice(index, 1);
                await this.actor.update({ [`system.phases.${phaseIndex}.statusEffects`]: system.phases[phaseIndex].statusEffects });
            }
        }
        else {
            // Normal status effect
            if (!system.statusEffects || !Array.isArray(system.statusEffects)) {
                return;
            }
            if (index >= 0 && index < system.statusEffects.length) {
                system.statusEffects.splice(index, 1);
                await this.actor.update({ 'system.statusEffects': system.statusEffects });
            }
        }
    }
    /**
     * Add a new attack value to the NPC (normal or phase-based)
     */
    async #onAttackValueAdd(event) {
        event.preventDefault();
        const phaseIndex = $(event.currentTarget).data('phase-index');
        const system = this.actor.system;
        const newAttack = {
            name: '',
            attackDice: '',
            damage: '',
            special: '',
            specialValue: undefined
        };
        if (phaseIndex !== undefined && phaseIndex !== null) {
            // Phase-based attack value
            if (!system.phases || !system.phases[phaseIndex]) {
                return;
            }
            if (!system.phases[phaseIndex].attackValues) {
                system.phases[phaseIndex].attackValues = [];
            }
            system.phases[phaseIndex].attackValues.push(newAttack);
            await this.actor.update({ [`system.phases.${phaseIndex}.attackValues`]: system.phases[phaseIndex].attackValues });
        }
        else {
            // Normal attack value
            if (!system.attackValues) {
                system.attackValues = [];
            }
            system.attackValues.push(newAttack);
            await this.actor.update({ 'system.attackValues': system.attackValues });
        }
    }
    /**
     * Delete an attack value from the NPC (normal or phase-based)
     */
    async #onAttackValueDelete(event) {
        event.preventDefault();
        const index = parseInt($(event.currentTarget).data('attack-index') || '0');
        const phaseIndex = $(event.currentTarget).data('phase-index');
        const system = this.actor.system;
        if (phaseIndex !== undefined && phaseIndex !== null) {
            // Phase-based attack value
            if (!system.phases || !system.phases[phaseIndex] || !system.phases[phaseIndex].attackValues) {
                return;
            }
            if (index >= 0 && index < system.phases[phaseIndex].attackValues.length) {
                system.phases[phaseIndex].attackValues.splice(index, 1);
                await this.actor.update({ [`system.phases.${phaseIndex}.attackValues`]: system.phases[phaseIndex].attackValues });
            }
        }
        else {
            // Normal attack value
            if (!system.attackValues || !Array.isArray(system.attackValues)) {
                return;
            }
            if (index >= 0 && index < system.attackValues.length) {
                system.attackValues.splice(index, 1);
                await this.actor.update({ 'system.attackValues': system.attackValues });
            }
        }
    }
    /**
     * Add a new phase to the NPC
     */
    async #onPhaseAdd(event) {
        event.preventDefault();
        const system = this.actor.system;
        if (!system.phases) {
            system.phases = [];
        }
        const phaseNumber = system.phases.length + 1;
        const newPhase = {
            name: `Phase ${phaseNumber}`,
            health: {
                bars: [
                    {
                        name: 'Healthy',
                        max: 30,
                        current: 30,
                        penalty: 0
                    }
                ],
                currentBar: 0,
                tempHP: 0
            },
            combat: {
                initiative: 0,
                evade: 10,
                armor: 0,
                speed: 6
            },
            savingThrows: {
                body: 0,
                mind: 0,
                spirit: 0
            },
            attackValues: [],
            statusEffects: []
        };
        system.phases.push(newPhase);
        await this.actor.update({ 'system.phases': system.phases });
    }
    /**
     * Delete a phase from the NPC
     */
    async #onPhaseDelete(event) {
        event.preventDefault();
        const phaseIndex = parseInt($(event.currentTarget).data('phase-index') || '0');
        const system = this.actor.system;
        if (!system.phases || !Array.isArray(system.phases)) {
            return;
        }
        if (phaseIndex >= 0 && phaseIndex < system.phases.length) {
            system.phases.splice(phaseIndex, 1);
            await this.actor.update({ 'system.phases': system.phases });
        }
    }
}
//# sourceMappingURL=npc-sheet.js.map