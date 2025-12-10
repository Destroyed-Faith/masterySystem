/**
 * Character Sheet for Mastery System
 * Main player character sheet with tabs for attributes, skills, powers, etc.
 */

import { MasteryActor } from '../documents/actor';
import { quickRoll } from '../dice/roll-handler';
import { SKILLS } from '../utils/skills';

// Use namespaced ActorSheet when available to avoid deprecation warnings
const BaseActorSheet: any = (foundry as any)?.appv1?.sheets?.ActorSheet || (ActorSheet as any);

export class MasteryCharacterSheet extends BaseActorSheet {
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

  /**
   * Add Spell → open magic power dialog
   */
  async #onSpellAdd(event: JQuery.ClickEvent) {
    event.preventDefault();
    await this.#openMagicPowerDialog();
  }

  /**
   * Open the prebuilt Magic Power Creation Dialog (dropdown of schools/powers)
   */
  async #openMagicPowerDialog(): Promise<void> {
    try {
      const dialogModule = await import('../../dist/sheets/character-sheet-magic-dialog.js' as any);
      if (dialogModule?.showMagicPowerCreationDialog) {
        await dialogModule.showMagicPowerCreationDialog(this.actor);
      } else {
        ui.notifications?.error('Magic power dialog not found.');
      }
    } catch (error) {
      console.error('Mastery System | Failed to open magic power dialog', error);
      ui.notifications?.error('Failed to open magic power selection dialog');
    }
  }

  /**
   * Add a new Power → open power dialog (Mastery Trees)
   */
  async #onPowerAdd(event: JQuery.ClickEvent) {
    event.preventDefault();
    await this.#openPowerDialog();
  }

  /**
   * Open the Power Creation Dialog (dropdown of Mastery Trees/Powers)
   */
  async #openPowerDialog(): Promise<void> {
    try {
      const dialogModule = await import('../../dist/sheets/character-sheet-power-dialog.js' as any);
      if (dialogModule?.showPowerCreationDialog) {
        await dialogModule.showPowerCreationDialog(this.actor);
      } else {
        ui.notifications?.error('Power dialog not found.');
      }
    } catch (error) {
      console.error('Mastery System | Failed to open power dialog', error);
      ui.notifications?.error('Failed to open power selection dialog');
    }
  }

  /**
   * Add Weapon → open weapon dialog
   */
  async #onWeaponAdd(event: JQuery.ClickEvent) {
    event.preventDefault();
    await this.#openWeaponDialog();
  }

  /**
   * Open the Weapon Creation Dialog
   */
  async #openWeaponDialog(): Promise<void> {
    try {
      const dialogModule = await import('../../dist/sheets/character-sheet-weapon-dialog.js' as any);
      if (dialogModule?.showWeaponCreationDialog) {
        await dialogModule.showWeaponCreationDialog(this.actor);
      } else {
        ui.notifications?.error('Weapon dialog not found.');
      }
    } catch (error) {
      console.error('Mastery System | Failed to open weapon dialog', error);
      ui.notifications?.error('Failed to open weapon selection dialog');
    }
  }

  /**
   * Add Armor → open armor dialog (placeholder for now)
   */
  async #onArmorAdd(event: JQuery.ClickEvent) {
    event.preventDefault();
    ui.notifications?.info('Armor dialog coming soon!');
    // TODO: Implement armor dialog
  }

  /**
   * Toggle equipment equipped status
   */
  async #onEquipmentToggle(event: JQuery.ChangeEvent) {
    const itemId = $(event.currentTarget).data('item-id');
    const equipped = $(event.currentTarget).is(':checked');
    
    if (itemId) {
      const item = this.actor.items.get(itemId);
      if (item) {
        await item.update({ 'system.equipped': equipped });
      }
    }
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
    
    // Get Mastery Rank from settings (per player or global default)
    const playerMasteryRanks = (game as any).settings.get('mastery-system', 'playerMasteryRanks') || {};
    const defaultMasteryRank = (game as any).settings.get('mastery-system', 'defaultMasteryRank') || 2;
    const playerId = this.actor.getFlag('mastery-system', 'playerId') || this.actor.ownership?.default || '';
    const masteryRankFromSettings = playerMasteryRanks[playerId] || defaultMasteryRank;
    
    // Use setting value if actor doesn't have one set, otherwise use actor's value
    if (!context.system.mastery?.rank) {
      context.system.mastery = context.system.mastery || {};
      context.system.mastery.rank = masteryRankFromSettings;
    }
    
    // Add configuration data
    context.config = (CONFIG as any).MASTERY;
    
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
    
    // Ensure token image is available
    if (!context.actor.prototypeToken?.texture?.src) {
      context.actor.prototypeToken = context.actor.prototypeToken || {};
      context.actor.prototypeToken.texture = context.actor.prototypeToken.texture || {};
      context.actor.prototypeToken.texture.src = context.actor.img;
    }
    
    return context;
  }

  /** @override */
  async render(force?: boolean, options?: any) {
    console.log('Mastery System | Character Sheet render called', { force, options });
    const result = await super.render(force, options);
    console.log('Mastery System | Character Sheet render completed');
    return result;
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
  #prepareSkills(skillValues: Record<string, number> = {}) {
    const skillsByCategory: Record<string, any[]> = {};
    
    // Group skills by category
    for (const [key, definition] of Object.entries(SKILLS)) {
      const category = definition.category;
      if (!skillsByCategory[category]) {
        skillsByCategory[category] = [];
      }
      
      skillsByCategory[category].push({
        key,
        name: definition.name,
        category: definition.category,
        attributes: definition.attributes,
        value: skillValues[key] || 0
      });
    }
    
    // Sort skills within each category by name
    for (const category in skillsByCategory) {
      skillsByCategory[category].sort((a: any, b: any) => a.name.localeCompare(b.name));
    }
    
    // Convert to array of category objects
    const categoryOrder = ['Physical', 'Knowledge & Craft', 'Social', 'Survival', 'Martial'];
    const groupedSkills: any[] = [];
    
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
  activateListeners(html: JQuery) {
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
    
    // Roll buttons work for everyone
    html.find('.attribute-roll').on('click', this.#onAttributeRoll.bind(this));
    html.find('.skill-roll').on('click', this.#onSkillRoll.bind(this));
    html.find('.skill-roll-compact').on('click', this.#onSkillRoll.bind(this));
    
    // Point spending buttons (JavaScript will check permissions)
    html.find('.attribute-spend-point').on('click', this.#onAttributeSpendPoint.bind(this));
    html.find('.skill-spend-point').on('click', this.#onSkillSpendPoint.bind(this));
    
    // Profile image click handlers (work for everyone)
    // Use event delegation to handle clicks even if elements are added later
    const containers = html.find('.profile-img-container');
    
    console.log('Mastery System | Setting up profile image handlers', {
      containerFound: containers.length,
      htmlLength: html.length
    });
    
    // Use event delegation on all containers
    containers.off('click.profile-delegation').on('click.profile-delegation', (e: JQuery.ClickEvent) => {
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
      } else if (clickedZone.hasClass('profile-zone-show')) {
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
    if (!this.isEditable) return;
    
    // Add skill
    html.find('.skill-add').on('click', this.#onSkillAdd.bind(this));

    // Add power
    html.find('.add-power-btn').on('click', this.#onPowerAdd.bind(this));
    
    // Equipment handlers
    html.find('.add-weapon-btn').on('click', this.#onWeaponAdd.bind(this));
    html.find('.add-armor-btn').on('click', this.#onArmorAdd.bind(this));
    html.find('.equipment-item input[name="equipped"]').on('change', this.#onEquipmentToggle.bind(this));

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
  #calculateAttributeCost(currentValue: number): number {
    const nextValue = currentValue + 1;
    const tier = Math.floor((nextValue - 1) / 8);
    return tier + 1;
  }

  /**
   * Handle spending attribute points
   */
  async #onAttributeSpendPoint(event: JQuery.ClickEvent) {
    event.preventDefault();
    
    // Check if user is owner
    if (!this.actor.isOwner) {
      (ui as any).notifications?.warn('Only the owner can spend Attribute Points.');
      return;
    }
    
    const element = event.currentTarget;
    const attributeName = element.dataset.attribute;
    
    if (!attributeName) return;
    
    const currentValue = this.actor.system.attributes[attributeName]?.value || 0;
    const availablePoints = this.actor.system.points?.attribute || 0;
    const cost = this.#calculateAttributeCost(currentValue);
    
    // Check if we have enough points
    if (availablePoints < cost) {
      (ui as any).notifications?.warn(`Not enough Attribute Points! You need ${cost} points, but only have ${availablePoints}.`);
      return;
    }
    
    // Check max value
    if (currentValue >= 80) {
      (ui as any).notifications?.warn('This attribute is already at maximum value (80).');
      return;
    }
    
    // Update attribute and spend points
    const updates: any = {};
    updates[`system.attributes.${attributeName}.value`] = currentValue + 1;
    updates['system.points.attribute'] = availablePoints - cost;
    
    await this.actor.update(updates);
    
    (ui as any).notifications?.info(`${attributeName.charAt(0).toUpperCase() + attributeName.slice(1)} increased to ${currentValue + 1}! (Cost: ${cost} points, Remaining: ${availablePoints - cost})`);
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
   * Handle spending mastery points on skills
   * Cost: Level N → N+1 costs N points
   */
  async #onSkillSpendPoint(event: JQuery.ClickEvent) {
    event.preventDefault();
    
    // Check if user is owner
    if (!this.actor.isOwner) {
      (ui as any).notifications?.warn('Only the owner can spend Mastery Points.');
      return;
    }
    
    const element = event.currentTarget;
    const skillKey = element.dataset.skill;
    
    if (!skillKey) return;
    
    const currentValue = this.actor.system.skills?.[skillKey] || 0;
    const availablePoints = this.actor.system.points?.mastery || 0;
    const cost = currentValue; // Level N → N+1 costs N points
    
    // Check if we have enough points
    if (availablePoints < cost) {
      (ui as any).notifications?.warn(`Not enough Mastery Points! You need ${cost} points, but only have ${availablePoints}.`);
      return;
    }
    
    // Check max value (4 × Mastery Rank)
    const masteryRank = this.actor.system.mastery?.rank || 2;
    const maxSkill = 4 * masteryRank;
    
    if (currentValue >= maxSkill) {
      (ui as any).notifications?.warn(`This skill is already at maximum value (${maxSkill} = 4 × Mastery Rank ${masteryRank}).`);
      return;
    }
    
    // Update skill and spend points
    const updates: any = {};
    updates[`system.skills.${skillKey}`] = currentValue + 1;
    updates['system.points.mastery'] = availablePoints - cost;
    
    await this.actor.update(updates);
    
    const skillName = skillKey.charAt(0).toUpperCase() + skillKey.slice(1);
    (ui as any).notifications?.info(`${skillName} increased to ${currentValue + 1}! (Cost: ${cost} Mastery Points, Remaining: ${availablePoints - cost})`);
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
   * Handle profile image edit (upper zone)
   */
  async #onProfileEdit(event: JQuery.ClickEvent, imgType: string = 'portrait') {
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
        globalFilePicker: typeof (globalThis as any).FilePicker !== 'undefined',
        foundryFilePicker: typeof (foundry as any)?.applications?.apps?.FilePicker?.implementation !== 'undefined'
      });
      
      // Use Foundry's built-in image editing functionality
      // Try to use the shimmed FilePicker first, then fallback to foundry's implementation
      const FilePickerClass = (globalThis as any).FilePicker || 
                             (foundry as any)?.applications?.apps?.FilePicker?.implementation ||
                             FilePicker;
      
      console.log('Mastery System | FilePickerClass resolved', { FilePickerClass: FilePickerClass?.name || 'unknown' });
      
      // Get current image based on imgType - use strict comparison
      const isTokenEdit = (imgType === 'token'); // Store in const to ensure it's captured correctly in closure
      let currentImage: string;
      
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
      } else {
        currentImage = this.actor.img || '';
        console.log('Mastery System | Portrait image edit - current:', currentImage);
      }
      
      // Store isTokenEdit in a way that can't be modified
      const updateIsToken = isTokenEdit;
      
      const filePicker = new FilePickerClass({
        type: 'image',
        current: currentImage,
        callback: async (path: string) => {
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
            } else {
              // Update portrait image
              console.log('Mastery System | Updating PORTRAIT image to:', path);
              const updateData = { img: path };
              console.log('Mastery System | Update data:', updateData);
              await this.actor.update(updateData);
              console.log('Mastery System | Portrait image updated successfully');
            }
            // Re-render the sheet to show the new image
            this.render(false);
          } catch (updateError) {
            console.error('Mastery System | Error updating image:', updateError);
            ui.notifications?.error('Failed to update image.');
          }
        }
      });
      
      console.log('Mastery System | FilePicker created, rendering...');
      await filePicker.render(true);
      console.log('Mastery System | FilePicker rendered successfully');
    } catch (error) {
      console.error('Mastery System | Error opening file picker:', error);
      console.error('Mastery System | Error stack:', error instanceof Error ? error.stack : 'No stack');
      ui.notifications?.error('Failed to open image picker.');
    }
  }

  /**
   * Handle profile image show (lower zone)
   */
  async #onProfileShow(event: JQuery.ClickEvent, imgType: string = 'portrait') {
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
    let imgSrc: string;
    if (imgType === 'token') {
      imgSrc = this.actor.prototypeToken?.texture?.src || this.actor.img || '';
      console.log('Mastery System | Token image show - source:', imgSrc, {
        hasTokenSrc: !!this.actor.prototypeToken?.texture?.src,
        fallbackToPortrait: !this.actor.prototypeToken?.texture?.src
      });
    } else {
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
        ImagePopoutAvailable: typeof (foundry as any)?.applications?.apps?.ImagePopout?.implementation !== 'undefined',
        windowImagePopout: typeof (window as any).ImagePopout !== 'undefined'
      });
      
      // Try to use Foundry's ImagePopout if available
      const ImagePopoutClass = (foundry as any)?.applications?.apps?.ImagePopout?.implementation ||
                               (window as any).ImagePopout;
      
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
      } else {
        console.log('Mastery System | ImagePopout not available, using Dialog fallback');
        // Fallback: Create a simple dialog with the image
        const dialog = new Dialog({
          title: this.actor.name,
          content: `<div style="text-align: center;"><img src="${imgSrc}" style="max-width: 100%; max-height: 80vh; height: auto; border-radius: 4px;" /></div>`,
          buttons: {
            close: {
              label: 'Close',
              callback: () => {}
            }
          },
          default: 'close'
        } as any);
        console.log('Mastery System | Dialog created, rendering...');
        await dialog.render(true);
        console.log('Mastery System | Dialog rendered successfully');
      }
    } catch (error) {
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
              callback: () => {}
            }
          },
          default: 'close'
        } as any);
        await dialog.render(true);
        console.log('Mastery System | Fallback dialog rendered successfully');
      } catch (fallbackError) {
        console.error('Mastery System | Fallback dialog also failed', fallbackError);
        console.error('Mastery System | Fallback error stack:', fallbackError instanceof Error ? fallbackError.stack : 'No stack');
        ui.notifications?.error('Failed to display image.');
      }
    }
  }
}

