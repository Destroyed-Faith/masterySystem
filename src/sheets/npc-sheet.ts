/**
 * NPC Sheet for Mastery System
 * Simplified sheet for non-player characters
 */

import { MasteryCharacterSheet } from './character-sheet';

export class MasteryNpcSheet extends MasteryCharacterSheet {
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions as any, {
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
  getData(options?: any) {
    const context: any = super.getData(options);
    
    // Normalize health.bars: convert object to array if needed
    if (context.system?.health?.bars) {
      const bars = context.system.health.bars;
      // Check if bars is an object (not an array)
      if (!Array.isArray(bars) && typeof bars === 'object') {
        // Convert object with numeric keys to array
        const barsArray = Object.keys(bars)
          .sort((a, b) => parseInt(a) - parseInt(b))
          .map(key => bars[key]);
        context.system.health.bars = barsArray;
      }
      
      // Ensure each bar has required fields
      if (Array.isArray(context.system.health.bars)) {
        context.system.health.bars = context.system.health.bars.map((bar: any, index: number) => ({
          name: bar.name || `Bar ${index + 1}`,
          max: bar.max || 30,
          current: bar.current ?? (bar.max ?? 30),
          penalty: bar.penalty || 0
        }));
      }
    }
    
    // Normalize phases health bars too
    if (context.system?.phases && Array.isArray(context.system.phases)) {
      context.system.phases = context.system.phases.map((phase: any) => {
        if (phase.health?.bars) {
          const phaseBars = phase.health.bars;
          if (!Array.isArray(phaseBars) && typeof phaseBars === 'object') {
            // Convert object with numeric keys to array
            const barsArray = Object.keys(phaseBars)
              .sort((a, b) => parseInt(a) - parseInt(b))
              .map(key => phaseBars[key]);
            phase.health.bars = barsArray;
          }
          // Ensure each bar has required fields
          if (Array.isArray(phase.health.bars)) {
            phase.health.bars = phase.health.bars.map((bar: any, index: number) => ({
              name: bar.name || `Bar ${index + 1}`,
              max: bar.max || 30,
              current: bar.current ?? (bar.max ?? 30),
              penalty: bar.penalty || 0
            }));
          }
        }
        return phase;
      });
    }
    
    return context;
  }

  /** @override */
  activateListeners(html: JQuery) {
    super.activateListeners(html);
    
    // Blood color picker synchronization
    // When color picker changes, update text field
    const syncColorPickerToText = (e: any) => {
      const colorPicker = $(e.currentTarget);
      const textInput = colorPicker.siblings('.blood-color-text');
      const colorValue = colorPicker.val() as string;
      if (textInput.length > 0 && colorValue) {
        textInput.val(colorValue);
        textInput.data('last-valid-value', colorValue);
        textInput.removeClass('invalid');
      }
    };
    
    html.find('.blood-color-picker, input[type="color"][name="system.bloodColor"]')
      .on('input' as any, syncColorPickerToText)
      .on('change', syncColorPickerToText);
    
    // When text field changes, update color picker and validate
    const syncTextToColorPicker = (e: any) => {
      const textInput = $(e.currentTarget);
      const colorPicker = textInput.siblings('.blood-color-picker, input[type="color"][name="system.bloodColor"]');
      const colorValue = (textInput.val() as string || '').trim();
      
      // Validate hex color format
      if (/^#[0-9A-Fa-f]{6}$/.test(colorValue)) {
        if (colorPicker.length > 0) {
          colorPicker.val(colorValue);
          // Trigger change on the named input to ensure it's saved
          colorPicker.trigger('change');
        }
        textInput.data('last-valid-value', colorValue);
        textInput.removeClass('invalid');
      } else if (colorValue.length > 0) {
        // Invalid format, mark as invalid but don't revert yet (user might still be typing)
        textInput.addClass('invalid');
      }
    };
    
    html.find('.blood-color-text')
      .on('input' as any, syncTextToColorPicker)
      .on('change', syncTextToColorPicker);
    
    // On blur, revert to last valid value if current is invalid
    html.find('.blood-color-text').on('blur', (e: JQuery.BlurEvent) => {
      const textInput = $(e.currentTarget);
      const colorValue = (textInput.val() as string || '').trim();
      
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
  async #onRemoveStatusEffect(event: JQuery.ClickEvent) {
    event.preventDefault();
    const index = parseInt($(event.currentTarget).data('effect-index') || '0');
    const phaseIndex = $(event.currentTarget).data('phase-index');
    
    const system = (this.actor as any).system;
    
    if (phaseIndex !== undefined && phaseIndex !== null) {
      // Phase-based status effect
      if (!system.phases || !system.phases[phaseIndex] || !system.phases[phaseIndex].statusEffects) {
        return;
      }
      if (index >= 0 && index < system.phases[phaseIndex].statusEffects.length) {
        system.phases[phaseIndex].statusEffects.splice(index, 1);
        await (this.actor as any).update({ [`system.phases.${phaseIndex}.statusEffects`]: system.phases[phaseIndex].statusEffects });
      }
    } else {
      // Normal status effect
      if (!system.statusEffects || !Array.isArray(system.statusEffects)) {
        return;
      }
      if (index >= 0 && index < system.statusEffects.length) {
        system.statusEffects.splice(index, 1);
        await (this.actor as any).update({ 'system.statusEffects': system.statusEffects });
      }
    }
  }

  /**
   * Add a new attack value to the NPC (normal or phase-based)
   */
  async #onAttackValueAdd(event: JQuery.ClickEvent) {
    event.preventDefault();
    const phaseIndex = $(event.currentTarget).data('phase-index');
    
    const system = (this.actor as any).system;
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
      await (this.actor as any).update({ [`system.phases.${phaseIndex}.attackValues`]: system.phases[phaseIndex].attackValues });
    } else {
      // Normal attack value
      if (!system.attackValues) {
        system.attackValues = [];
      }
      system.attackValues.push(newAttack);
      await (this.actor as any).update({ 'system.attackValues': system.attackValues });
    }
  }

  /**
   * Delete an attack value from the NPC (normal or phase-based)
   */
  async #onAttackValueDelete(event: JQuery.ClickEvent) {
    event.preventDefault();
    const index = parseInt($(event.currentTarget).data('attack-index') || '0');
    const phaseIndex = $(event.currentTarget).data('phase-index');
    
    const system = (this.actor as any).system;
    
    if (phaseIndex !== undefined && phaseIndex !== null) {
      // Phase-based attack value
      if (!system.phases || !system.phases[phaseIndex] || !system.phases[phaseIndex].attackValues) {
        return;
      }
      if (index >= 0 && index < system.phases[phaseIndex].attackValues.length) {
        system.phases[phaseIndex].attackValues.splice(index, 1);
        await (this.actor as any).update({ [`system.phases.${phaseIndex}.attackValues`]: system.phases[phaseIndex].attackValues });
      }
    } else {
      // Normal attack value
      if (!system.attackValues || !Array.isArray(system.attackValues)) {
        return;
      }
      if (index >= 0 && index < system.attackValues.length) {
        system.attackValues.splice(index, 1);
        await (this.actor as any).update({ 'system.attackValues': system.attackValues });
      }
    }
  }

  /**
   * Add a new phase to the NPC
   */
  async #onPhaseAdd(event: JQuery.ClickEvent) {
    event.preventDefault();
    
    const system = (this.actor as any).system;
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
    await (this.actor as any).update({ 'system.phases': system.phases });
  }

  /**
   * Delete a phase from the NPC
   */
  async #onPhaseDelete(event: JQuery.ClickEvent) {
    event.preventDefault();
    const phaseIndex = parseInt($(event.currentTarget).data('phase-index') || '0');
    
    const system = (this.actor as any).system;
    if (!system.phases || !Array.isArray(system.phases)) {
      return;
    }
    
    if (phaseIndex >= 0 && phaseIndex < system.phases.length) {
      system.phases.splice(phaseIndex, 1);
      await (this.actor as any).update({ 'system.phases': system.phases });
    }
  }
}

