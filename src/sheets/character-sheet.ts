/**
 * Character Sheet for Mastery System
 * Main player character sheet with tabs for attributes, skills, powers, etc.
 */

import { MasteryActor } from '../documents/actor';
import { quickRoll } from '../dice/roll-handler';
import { getActionStatus, useAction, unuseAction, convertAttackAction, undoConversion } from '../combat/actions';
import { getResourceStatus, spendStones, addStress, reduceStress } from '../combat/resources';
import { performCheckWithDialog } from '../rolls/checks';
import { performAttackWithDialog } from '../rolls/attacks';

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
    
    // Add action economy status
    context.actions = getActionStatus(this.actor);
    
    // Add resource status
    context.resources = getResourceStatus(this.actor);
    
    // Add powers filtered by type for action panel
    context.activePowers = this.#prepareActivePowers();
    
    return context;
  }

  /**
   * Prepare items organized by type
   */
  #prepareItems() {
    const powers: any[] = [];
    const echoes: any[] = [];
    const schticks: any[] = [];
    const artifacts: any[] = [];
    const conditions: any[] = [];
    const weapons: any[] = [];
    const armor: any[] = [];
    
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
      if (treeCompare !== 0) return treeCompare;
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

  /**
   * Prepare active powers for action panel
   * Filters powers by type: Movement, Active, Utility, Reaction
   */
  #prepareActivePowers() {
    const powers: any[] = [];
    
    for (const item of this.actor.items) {
      if (item.type !== 'special') continue;
      
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
      const typeOrder: any = { movement: 0, active: 1, utility: 2, reaction: 3 };
      const typeCompare = (typeOrder[a.powerType] || 99) - (typeOrder[b.powerType] || 99);
      if (typeCompare !== 0) return typeCompare;
      return a.level - b.level;
    });
    
    return powers;
  }

  /** @override */
  activateListeners(html: JQuery) {
    super.activateListeners(html);
    
    // Everything below here is only needed if the sheet is editable
    if (!this.isEditable) return;
    
    // Attribute rolls
    html.find('.attribute-roll').on('click', this.#onAttributeRoll.bind(this));
    
    // Skill rolls (now with dialog)
    html.find('.skill-roll').on('click', this.#onSkillRollWithDialog.bind(this));
    
    // Attack rolls
    html.find('.weapon-attack').on('click', this.#onWeaponAttack.bind(this));
    html.find('.power-attack').on('click', this.#onPowerAttack.bind(this));
    
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
  /**
   * Skill roll with new dialog system
   */
  async #onSkillRollWithDialog(event: JQuery.ClickEvent) {
    event.preventDefault();
    const element = event.currentTarget;
    const skillKey = element.dataset.skill;
    
    if (!skillKey) return;
    
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
  async #onWeaponAttack(event: JQuery.ClickEvent) {
    event.preventDefault();
    const element = event.currentTarget;
    const itemId = element.dataset.itemId;
    const weapon = this.actor.items.get(itemId);
    
    if (!weapon) return;
    
    // Get target from current targets
    const targets = Array.from((game as any).user?.targets || []) as any[];
    if (targets.length === 0) {
      ui.notifications?.warn('Please target an enemy first!');
      return;
    }
    
    const target = targets[0].actor;
    if (!target) return;
    
    await performAttackWithDialog(this.actor, target, weapon);
  }

  /**
   * Power attack
   */
  async #onPowerAttack(event: JQuery.ClickEvent) {
    event.preventDefault();
    const element = event.currentTarget;
    const powerId = element.dataset.powerId;
    const power = this.actor.items.get(powerId);
    
    if (!power) return;
    
    // Get target from current targets
    const targets = Array.from((game as any).user?.targets || []) as any[];
    if (targets.length === 0) {
      ui.notifications?.warn('Please target an enemy first!');
      return;
    }
    
    const target = targets[0].actor;
    if (!target) return;
    
    await performAttackWithDialog(this.actor, target, power);
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

  /**
   * Mark an action as used
   */
  async #onActionUse(event: JQuery.ClickEvent) {
    event.preventDefault();
    const element = event.currentTarget;
    const actionType = element.dataset.actionType as 'attack' | 'movement' | 'reaction';
    
    if (actionType) {
      await useAction(this.actor, actionType);
      this.render(false);
    }
  }

  /**
   * Unmark an action
   */
  async #onActionUnuse(event: JQuery.ClickEvent) {
    event.preventDefault();
    const element = event.currentTarget;
    const actionType = element.dataset.actionType as 'attack' | 'movement' | 'reaction';
    
    if (actionType) {
      await unuseAction(this.actor, actionType);
      this.render(false);
    }
  }

  /**
   * Convert an Attack Action
   */
  async #onActionConvert(event: JQuery.ClickEvent) {
    event.preventDefault();
    const element = event.currentTarget;
    const targetType = element.dataset.targetType as 'movement' | 'reaction';
    
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
  async #onActionUndoConvert(event: JQuery.ClickEvent) {
    event.preventDefault();
    const element = event.currentTarget;
    const conversionType = element.dataset.conversionType as 'movement' | 'reaction';
    
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
  async #onSpendStones(event: JQuery.ClickEvent) {
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
          callback: async (html: JQuery) => {
            const amount = parseInt((html.find('[name="amount"]').val() as string) || '0');
            const reason = (html.find('[name="reason"]').val() as string) || 'power activation';
            
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
  async #onAddStress(event: JQuery.ClickEvent) {
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
          callback: async (html: JQuery) => {
            const amount = parseInt((html.find('[name="amount"]').val() as string) || '0');
            const reason = (html.find('[name="reason"]').val() as string) || 'stressful event';
            
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
  async #onReduceStress(event: JQuery.ClickEvent) {
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
          callback: async (html: JQuery) => {
            const amount = parseInt((html.find('[name="amount"]').val() as string) || '0');
            const reason = (html.find('[name="reason"]').val() as string) || 'stress relief';
            
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
  async #onUsePowerWithAction(event: JQuery.ClickEvent) {
    event.preventDefault();
    const element = event.currentTarget;
    const powerId = element.dataset.powerId;
    const power = this.actor.items.get(powerId);
    
    if (!power) return;
    
    const powerType = power.system.powerType;
    let actionType: 'attack' | 'movement' | 'reaction' = 'attack';
    
    // Determine action type from power type
    if (powerType === 'movement') {
      actionType = 'movement';
    } else if (powerType === 'reaction') {
      actionType = 'reaction';
    } else {
      actionType = 'attack'; // Active, Utility use Attack Action
    }
    
    // Use the action
    const success = await useAction(this.actor, actionType);
    
    if (success) {
      // Post chat message
      await ChatMessage.create({
        user: (game as any).user?.id,
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
}

