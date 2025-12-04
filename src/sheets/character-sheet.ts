/**
 * Character Sheet for Mastery System
 * Main player character sheet with tabs for attributes, skills, powers, etc.
 */

import { MasteryActor } from '../documents/actor';
import { quickRoll } from '../dice/roll-handler';
import { showPowerCreationDialog } from './character-sheet-power-dialog.js';
import { showMagicPowerCreationDialog } from './character-sheet-magic-dialog.js';

export class MasteryCharacterSheet extends ActorSheet {
  /** @override */
  static get defaultOptions() {
    const options = foundry.utils.mergeObject(super.defaultOptions as any, {
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
  getData(options?: any) {
    const context: any = super.getData(options);
    const actorData = context.actor;
    
    // Add system data
    context.system = actorData.system;
    context.flags = actorData.flags;
    
    // Add configuration data
    context.config = (CONFIG as any).MASTERY;
    
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
    
    return context;
  }

  /**
   * Prepare items organized by type
   */
  #prepareItems() {
    const powers: any[] = [];
    const magicPowers: any[] = [];
    const echoes: any[] = [];
    const schticks: any[] = [];
    const artifacts: any[] = [];
    const conditions: any[] = [];
    const weapons: any[] = [];
    const armor: any[] = [];

    for (const item of this.actor.items) {
      const itemData = item as any;

      switch (item.type) {
        case 'special':
          if (itemData.system?.isMagicPower) {
            magicPowers.push(itemData);
          } else {
            powers.push(itemData);
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
      }
    }

    // Sort non-magic powers by tree and level
    powers.sort((a, b) => {
      const treeCompare = (a.system.tree || '').localeCompare(b.system.tree || '');
      if (treeCompare !== 0) return treeCompare;
      return (a.system.level || 0) - (b.system.level || 0);
    });

    // Sort magic powers by tree (spell school) and level
    magicPowers.sort((a, b) => {
      const treeCompare = (a.system.tree || '').localeCompare(b.system.tree || '');
      if (treeCompare !== 0) return treeCompare;
      return (a.system.level || 0) - (b.system.level || 0);
    });

    return {
      powers,
      magicPowers,
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
  #calculateDerivedValues(system: any) {
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
  #prepareSkills(skills: Record<string, number>) {
    const skillList: any[] = [];
    
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

  /** @override */
  activateListeners(html: JQuery) {
    super.activateListeners(html);
    
    // Everything below here is only needed if the sheet is editable
    if (!this.isEditable) return;
    
    // Attribute rolls
    html.find('.attribute-roll').on('click', this.#onAttributeRoll.bind(this));
    
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
   * Handle attribute roll
   */
  async #onAttributeRoll(event: JQuery.ClickEvent) {
    event.preventDefault();
    const element = event.currentTarget;
    const attribute = element.dataset.attribute;
    
    if (!attribute) return;
    
    // Prompt for TN
    const tn = await this.#promptForTN();
    if (tn === null) return;
    
    await quickRoll(
      this.actor,
      attribute,
      undefined,
      tn,
      `${attribute.charAt(0).toUpperCase() + attribute.slice(1)} Check`
    );
  }

  /**
   * Handle skill roll
   */
  async #onSkillRoll(event: JQuery.ClickEvent) {
    event.preventDefault();
    const element = event.currentTarget;
    const skill = element.dataset.skill;
    
    if (!skill) return;
    
    // Default to Wits for skill rolls (can be customized)
    const attribute = 'wits';
    
    // Prompt for TN
    const tn = await this.#promptForTN();
    if (tn === null) return;
    
    await quickRoll(
      this.actor,
      attribute,
      skill,
      tn,
      `${skill.charAt(0).toUpperCase() + skill.slice(1)} Check`
    );
  }

  /**
   * Prompt for Target Number
   */
  async #promptForTN(): Promise<number | null> {
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
            callback: (html: JQuery) => {
              const tn = parseInt(html.find('[name="tn"]').val() as string);
              resolve(tn);
            }
          },
          cancel: {
            label: 'Cancel',
            callback: () => resolve(null)
          }
        },
        default: 'roll',
        render: (html: JQuery) => {
          html.find('[data-tn]').on('click', (event) => {
            const tn = event.currentTarget.dataset.tn;
            if (tn) html.find('[name="tn"]').val(tn);
          });
        }
      }).render(true);
    });
  }

  /**
   * Add a new skill
   */
  async #onSkillAdd(event: JQuery.ClickEvent) {
    event.preventDefault();
    
    const skillName = await this.#promptForSkillName();
    if (!skillName) return;
    
    await this.actor.update({
      [`system.skills.${skillName}`]: 0
    });
  }

  /**
   * Prompt for skill name
   */
  async #promptForSkillName(): Promise<string | null> {
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
            callback: (html: JQuery) => {
              const name = html.find('[name="skillName"]').val() as string;
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
  async #onSkillDelete(event: JQuery.ClickEvent) {
    event.preventDefault();
    const element = event.currentTarget;
    const skill = element.dataset.skill;
    
    if (!skill) return;
    
    const confirmed = await Dialog.confirm({
      title: 'Delete Skill',
      content: `<p>Are you sure you want to delete the <strong>${skill}</strong> skill?</p>`
    });
    
    if (confirmed) {
      const skills = foundry.utils.deepClone(this.actor.system.skills) as any;
      delete skills[skill];
      await this.actor.update({ 'system.skills': skills });
    }
  }

  /**
   * Use a power
   */
  async #onPowerUse(event: JQuery.ClickEvent) {
    event.preventDefault();
    const element = event.currentTarget;
    const itemId = element.dataset.itemId;
    
    const item = this.actor.items.get(itemId);
    if (!item) return;
    
    // TODO: Implement power usage logic
    ui.notifications?.info(`Using power: ${item.name}`);
  }

  /**
   * Create a new item
   */
  async #onItemCreate(event: JQuery.ClickEvent) {
    event.preventDefault();
    const element = event.currentTarget;
    const type = element.dataset.type;

    // Mastery Tree powers: open selection dialog over 27 trees & their powers
    if (type === 'special') {
      await showPowerCreationDialog(this.actor);
      return;
    }

    // Magic powers: open spell-school based dialog
    if (type === 'magic-power') {
      await showMagicPowerCreationDialog(this.actor);
      return;
    }

    const itemData = {
      name: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
      type
    };

    await this.actor.createEmbeddedDocuments('Item', [itemData]);
  }

  /**
   * Edit an item
   */
  #onItemEdit(event: JQuery.ClickEvent) {
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
  async #onItemDelete(event: JQuery.ClickEvent) {
    event.preventDefault();
    const element = event.currentTarget.closest('.item');
    const itemId = element.dataset.itemId;
    const item = this.actor.items.get(itemId);
    
    if (!item) return;
    
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
  async #onHPAdjust(event: JQuery.ClickEvent) {
    event.preventDefault();
    const element = event.currentTarget;
    const adjustment = parseInt(element.dataset.adjustment || '0');
    
    if (adjustment > 0) {
      await (this.actor as MasteryActor).heal(adjustment);
    } else if (adjustment < 0) {
      await (this.actor as MasteryActor).applyDamage(Math.abs(adjustment));
    }
  }

  /**
   * Adjust Stress
   */
  async #onStressAdjust(event: JQuery.ClickEvent) {
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
  async #onStoneAdjust(event: JQuery.ClickEvent) {
    event.preventDefault();
    const element = event.currentTarget;
    const adjustment = parseInt(element.dataset.adjustment || '0');
    
    const current = this.actor.system.stones?.current || 0;
    const max = this.actor.system.stones?.maximum || 0;
    const newValue = Math.max(0, Math.min(max, current + adjustment));
    
    await this.actor.update({ 'system.stones.current': newValue });
  }
}
