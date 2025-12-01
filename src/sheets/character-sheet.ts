/**
 * Character Sheet for Mastery System
 * Main player character sheet with tabs for attributes, skills, powers, etc.
 */

import { MasteryActor } from '../documents/actor.js';
import { quickRoll } from '../dice/roll-handler.js';
import { getSkillsByCategory, SKILL_CATEGORIES, SKILLS } from '../utils/skills.js';
import { getAllMasteryTrees } from '../utils/mastery-trees.js';
import { getAllSpellSchools } from '../utils/spell-schools.js';
import { getAllRituals } from '../utils/rituals.js';

export class MasteryCharacterSheet extends foundry.appv1.sheets.ActorSheet {
  editMode: boolean = false;

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
  #prepareSkills(skills: Record<string, number>) {
    const skillsByCategory = getSkillsByCategory();
    const result: Record<string, any[]> = {};
    
    // Initialize all categories
    for (const category of Object.values(SKILL_CATEGORIES) as string[]) {
      result[category] = [];
    }
    
    // Add skills to their categories - use the actual keys from SKILLS
    for (const [key, skillDef] of Object.entries(skillsByCategory)) {
      const skillList = skillDef as any[];
      for (const skill of skillList) {
        // Find the actual key in SKILLS object
        let skillKey = '';
        for (const [skKey, skDef] of Object.entries(SKILLS)) {
          const sk = skDef as any;
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
  #normalizeSkillKey(skillName: string): string {
    // Try to find matching skill by name first
    for (const [key, skill] of Object.entries(SKILLS)) {
      const skillDef = skill as any;
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
    const mappings: Record<string, string> = {
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
  activateListeners(html: JQuery) {
    super.activateListeners(html);
    
    // Edit mode toggle
    html.find('.edit-mode-toggle').on('click', this.#onEditModeToggle.bind(this));
    
    // Everything below here is only needed if the sheet is editable
    if (!this.isEditable) return;
    
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
  #onEditModeToggle(event: JQuery.ClickEvent) {
    event.preventDefault();
    this.editMode = !this.editMode;
    this.render();
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
   * Handle saving throw roll
   */
  async #onSavingThrowRoll(event: JQuery.ClickEvent) {
    event.preventDefault();
    const element = event.currentTarget;
    const saveType = element.dataset.save; // body, will, or mind
    
    if (!saveType) return;
    
    const system = (this.actor as any).system;
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
      } else if (agility >= vitality) {
        attributeName = 'agility';
      } else {
        attributeName = 'vitality';
      }
    } else if (saveType === 'will') {
      // Use highest of resolve, influence
      const resolve = attributes.resolve?.value || 0;
      const influence = attributes.influence?.value || 0;
      if (resolve >= influence) {
        attributeName = 'resolve';
      } else {
        attributeName = 'influence';
      }
    } else if (saveType === 'mind') {
      // Use highest of intellect, wits
      const intellect = attributes.intellect?.value || 0;
      const wits = attributes.wits?.value || 0;
      if (intellect >= wits) {
        attributeName = 'intellect';
      } else {
        attributeName = 'wits';
      }
    }
    
    if (!attributeName) return;
    
    // Saving throws typically use a fixed TN (e.g., 16)
    const tn = 16;
    
    await quickRoll(
      this.actor,
      attributeName,
      undefined,
      tn,
      `${saveType.toUpperCase()} Saving Throw`
    );
  }

  /**
   * Handle skill roll
   */
  async #onSkillRoll(event: JQuery.ClickEvent) {
    event.preventDefault();
    const element = event.currentTarget;
    const skillKey = element.dataset.skill;
    
    if (!skillKey) return;
    
    // Get skill definition to determine which attribute to use
    const { getSkill } = await import('../utils/skills.js');
    let skillDef = getSkill(skillKey);
    
    // If not found by key, try to find by name
    if (!skillDef) {
      for (const skill of Object.values(SKILLS)) {
        const sk = skill as any;
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
      if (tn === null) return;
      await quickRoll(this.actor, 'wits', skillKey, tn, `${skillKey} Check`);
      return;
    }
    
    // Use first attribute from skill definition (primary attribute)
    const attribute = skillDef.attributes[0];
    
    // Prompt for TN
    const tn = await this.#promptForTN();
    if (tn === null) return;
    
    await quickRoll(
      this.actor,
      attribute,
      skillKey,
      tn,
      `${skillDef.name} Check`
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
    
    // Special handling for powers - show tree selection dialog
    if (type === 'special') {
      await this.#showPowerCreationDialog();
      return;
    }
    
    // Special handling for weapons - show weapon selection dialog
    if (type === 'weapon') {
      await this.#showWeaponCreationDialog();
      return;
    }
    
    // Special handling for armor - show armor selection dialog
    if (type === 'armor') {
      await this.#showArmorCreationDialog();
      return;
    }
    
    // Default item creation
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
    const { getTreesWithPowers } = await import('../utils/powers.js');
    const trees = getAllMasteryTrees();
    const treesWithPowers = getTreesWithPowers();
    
    // Create tree selection options (only trees that have powers)
    const treeOptions = trees
      .filter(tree => treesWithPowers.includes(tree.name))
      .map(tree => `<option value="${tree.name}">${tree.name}</option>`)
      .join('');
    
    const content = `
      <form>
        <div class="form-group">
          <label>Mastery Tree:</label>
          <select name="tree" id="power-tree-select" style="width: 100%; margin-bottom: 10px;">
            <option value="">-- Select a Tree --</option>
            ${treeOptions}
          </select>
        </div>
        <div class="form-group" id="power-select-group" style="display: none;">
          <label>Power:</label>
          <select name="power" id="power-select" style="width: 100%; margin-bottom: 10px;">
            <option value="">-- Select a Power --</option>
          </select>
        </div>
        <div class="form-group" id="power-details" style="display: none; margin-top: 15px; padding: 10px; background: #f5f5f5; border-radius: 5px;">
          <div id="power-description" style="margin-bottom: 10px; font-style: italic; color: #666;"></div>
          <div id="power-level-info" style="font-size: 0.9em; color: #333;"></div>
        </div>
        <div class="form-group" id="level-select-group" style="display: none;">
          <label>Level:</label>
          <select name="level" id="power-level-select" style="width: 100%; margin-bottom: 10px;">
            <option value="1">Level 1</option>
            <option value="2">Level 2</option>
            <option value="3">Level 3</option>
            <option value="4">Level 4</option>
          </select>
        </div>
      </form>
    `;
    
    const dialog = new Dialog({
      title: 'Create New Power',
      content: content,
      buttons: {
        create: {
          icon: '<i class="fas fa-check"></i>',
          label: 'Create',
          callback: async (html) => {
            const $html = html as JQuery;
            const tree = $html.find('#power-tree-select').val() as string;
            const powerName = $html.find('#power-select').val() as string;
            const level = parseInt(($html.find('#power-level-select').val() as string) || '1');
            
            if (!tree) {
              ui.notifications?.warn('Please select a Mastery Tree');
              return false;
            }
            
            if (!powerName) {
              ui.notifications?.warn('Please select a Power');
              return false;
            }
            
            const { getPower } = await import('../utils/powers.js');
            const power = getPower(tree, powerName);
            
            if (!power) {
              ui.notifications?.error('Power not found');
              return false;
            }
            
            const levelData = power.levels.find(l => l.level === level);
            if (!levelData) {
              ui.notifications?.error('Level data not found');
              return false;
            }
            
            // Map power type from the level data
            const powerTypeMap: Record<string, string> = {
              'Melee': 'active',
              'Ranged': 'active',
              'Buff': 'buff',
              'Utility': 'utility',
              'Passive': 'passive',
              'Reaction': 'reaction',
              'Movement': 'movement'
            };
            
            const powerType = powerTypeMap[levelData.type] || 'active';
            
            const itemData = {
              name: powerName,
              type: 'special',
              system: {
                tree: tree,
                powerType: powerType,
                level: level,
                description: power.description,
                tags: [],
                range: levelData.range,
                aoe: levelData.aoe === '—' ? '' : levelData.aoe,
                duration: levelData.duration,
                effect: levelData.effect,
                specials: levelData.special && levelData.special !== '—' ? [levelData.special] : [],
                ap: 30, // Default, can be calculated later
                cost: {
                  action: powerType === 'active' || powerType === 'buff' || powerType === 'utility',
                  movement: powerType === 'movement',
                  reaction: powerType === 'reaction',
                  stones: 0,
                  charges: 0
                },
                roll: {
                  attribute: 'might',
                  tn: 0,
                  damage: levelData.effect.includes('damage') ? levelData.effect : '',
                  healing: levelData.effect.includes('Heal') ? levelData.effect : '',
                  raises: ''
                },
                requirements: {
                  masteryRank: level,
                  other: ''
                }
              }
            };
            
            await this.actor.createEmbeddedDocuments('Item', [itemData]);
            ui.notifications?.info(`Created power: ${powerName} (Level ${level}) from ${tree} tree`);
            return true;
          }
        },
        cancel: {
          icon: '<i class="fas fa-times"></i>',
          label: 'Cancel',
          callback: () => false
        }
      },
      default: 'create',
      render: async (html: JQuery) => {
        // Register event handlers after dialog is rendered
        const treeSelect = html.find('#power-tree-select')[0] as HTMLSelectElement;
        const powerSelect = html.find('#power-select')[0] as HTMLSelectElement;
        const powerSelectGroup = html.find('#power-select-group');
        const powerDetails = html.find('#power-details');
        const powerDescription = html.find('#power-description');
        const powerLevelInfo = html.find('#power-level-info');
        const levelSelect = html.find('#power-level-select')[0] as HTMLSelectElement;
        const levelSelectGroup = html.find('#level-select-group');
        
        let powersData: Record<string, any> = {};
        
        treeSelect?.addEventListener('change', async function() {
          const treeName = this.value;
          if (powerSelect) {
            powerSelect.innerHTML = '<option value="">-- Select a Power --</option>';
          }
          powerSelectGroup.hide();
          powerDetails.hide();
          levelSelectGroup.hide();
          
          if (!treeName) return;
          
          try {
            const { getPowersByTree } = await import('../utils/powers.js');
            const powers = getPowersByTree(treeName);
            powersData = {};
            
            if (powers.length === 0) {
              if (powerSelect) {
                powerSelect.innerHTML = '<option value="">No powers available for this tree</option>';
              }
              powerSelectGroup.show();
              return;
            }
            
            powers.forEach(power => {
              powersData[power.name] = power;
              if (powerSelect) {
                const option = document.createElement('option');
                option.value = power.name;
                option.textContent = power.name;
                powerSelect.appendChild(option);
              }
            });
            
            powerSelectGroup.show();
          } catch (error) {
            console.error('Error loading powers:', error);
          }
        });
        
        powerSelect?.addEventListener('change', function() {
          const powerName = this.value;
          powerDetails.hide();
          levelSelectGroup.hide();
          
          if (!powerName || !powersData[powerName]) return;
          
          const power = powersData[powerName];
          powerDescription.text(power.description);
          
          // Show level info
          let levelInfo = '<strong>Available Levels:</strong><br>';
          power.levels.forEach((level: any) => {
            levelInfo += `Level ${level.level}: ${level.type} - ${level.effect}`;
            if (level.special && level.special !== '—') {
              levelInfo += ` (${level.special})`;
            }
            levelInfo += '<br>';
          });
          powerLevelInfo.html(levelInfo);
          
          powerDetails.show();
          levelSelectGroup.show();
        });
        
        levelSelect?.addEventListener('change', function() {
          const powerName = powerSelect.value;
          const level = parseInt(this.value);
          
          if (!powerName || !powersData[powerName]) return;
          
          const power = powersData[powerName];
          const levelData = power.levels.find((l: any) => l.level === level);
          
          if (levelData) {
            // Update level info to show selected level details
            let levelInfo = '<strong>Selected Level ' + level + ':</strong><br>';
            levelInfo += `Type: ${levelData.type}<br>`;
            levelInfo += `Range: ${levelData.range}<br>`;
            if (levelData.aoe && levelData.aoe !== '—') {
              levelInfo += `AoE: ${levelData.aoe}<br>`;
            }
            levelInfo += `Duration: ${levelData.duration}<br>`;
            levelInfo += `Effect: ${levelData.effect}<br>`;
            if (levelData.special && levelData.special !== '—') {
              levelInfo += `Special: ${levelData.special}<br>`;
            }
            powerLevelInfo.html(levelInfo);
          }
        });
      }
    });
    
    dialog.render(true);
  }

  /**
   * Show dialog for creating a weapon
   */
  async #showWeaponCreationDialog() {
    const content = `
      <form style="min-width: 500px;">
        <div class="form-group">
          <label>Weapon Type:</label>
          <select name="weaponType" id="weapon-type-select" style="width: 100%; margin-bottom: 10px;">
            <option value="">-- Select Weapon Type --</option>
            <option value="melee">Melee Weapons</option>
            <option value="ranged">Ranged Weapons</option>
          </select>
        </div>
        <div class="form-group" id="weapon-select-group" style="display: none;">
          <label>Weapon:</label>
          <select name="weapon" id="weapon-select" style="width: 100%; margin-bottom: 10px;">
            <option value="">-- Select a Weapon --</option>
          </select>
        </div>
        <div class="form-group" id="weapon-details" style="display: none; margin-top: 15px; padding: 10px; background: #f5f5f5; border-radius: 5px;">
          <div id="weapon-description" style="margin-bottom: 10px; font-style: italic; color: #666;"></div>
          <div id="weapon-stats" style="font-size: 0.9em; color: #333;"></div>
        </div>
      </form>
    `;
    
    const dialog = new Dialog({
      title: 'Create New Weapon',
      content: content,
      buttons: {
        create: {
          icon: '<i class="fas fa-check"></i>',
          label: 'Create',
          callback: async (html) => {
            const $html = html as JQuery;
            const weaponName = $html.find('#weapon-select').val() as string;
            
            if (!weaponName) {
              ui.notifications?.warn('Please select a Weapon');
              return false;
            }
            
            const { getAllWeapons } = await import('../utils/equipment.js');
            const weapons = getAllWeapons();
            const weapon = weapons.find(w => w.name === weaponName);
            
            if (!weapon) {
              ui.notifications?.error('Weapon not found');
              return false;
            }
            
            const itemData = {
              name: weapon.name,
              type: 'weapon',
              system: {
                weaponType: weapon.weaponType,
                damage: weapon.damage,
                range: weapon.weaponType === 'ranged' ? '16m' : '0m',
                specials: weapon.special && weapon.special !== '—' ? [weapon.special] : [],
                equipped: false,
                description: weapon.description || ''
              }
            };
            
            await this.actor.createEmbeddedDocuments('Item', [itemData]);
            ui.notifications?.info(`Created weapon: ${weapon.name}`);
            return true;
          }
        },
        cancel: {
          icon: '<i class="fas fa-times"></i>',
          label: 'Cancel',
          callback: () => false
        }
      },
      default: 'create',
      render: async (html: JQuery) => {
        const weaponTypeSelect = html.find('#weapon-type-select')[0] as HTMLSelectElement;
        const weaponSelect = html.find('#weapon-select')[0] as HTMLSelectElement;
        const weaponSelectGroup = html.find('#weapon-select-group');
        const weaponDetails = html.find('#weapon-details');
        const weaponDescription = html.find('#weapon-description');
        const weaponStats = html.find('#weapon-stats');
        
        weaponTypeSelect?.addEventListener('change', async function() {
          const type = this.value as 'melee' | 'ranged' | '';
          if (weaponSelect) {
            weaponSelect.innerHTML = '<option value="">-- Select a Weapon --</option>';
          }
          weaponSelectGroup.hide();
          weaponDetails.hide();
          
          if (!type) return;
          
          const { getWeaponsByType } = await import('../utils/equipment.js');
          const weapons = getWeaponsByType(type as 'melee' | 'ranged');
          
          weapons.forEach(weapon => {
            if (weaponSelect) {
              const option = document.createElement('option');
              option.value = weapon.name;
              option.textContent = weapon.name;
              weaponSelect.appendChild(option);
            }
          });
          
          weaponSelectGroup.show();
        });
        
        weaponSelect?.addEventListener('change', async function() {
          const weaponName = this.value;
          weaponDetails.hide();
          
          if (!weaponName) return;
          
          const { getAllWeapons } = await import('../utils/equipment.js');
          const weapons = getAllWeapons();
          const weapon = weapons.find(w => w.name === weaponName);
          
          if (!weapon) return;
          
          weaponDescription.text(weapon.description || '');
          
          let stats = '<strong>Weapon Stats:</strong><br>';
          stats += `Damage: ${weapon.damage}<br>`;
          stats += `Hands: ${weapon.hands}<br>`;
          stats += `Type: ${weapon.weaponType}<br>`;
          if (weapon.innateAbilities.length > 0) {
            stats += `Innate Abilities: ${weapon.innateAbilities.join(', ')}<br>`;
          }
          if (weapon.special && weapon.special !== '—') {
            stats += `Special: ${weapon.special}<br>`;
          }
          weaponStats.html(stats);
          
          weaponDetails.show();
        });
      }
    });
    
    dialog.render(true);
  }

  /**
   * Show dialog for creating armor
   */
  async #showArmorCreationDialog() {
    const { getAllArmor } = await import('../utils/equipment.js');
    const armorList = getAllArmor();
    
    const armorOptions = armorList.map(armor => 
      `<option value="${armor.name}">${armor.name} (${armor.type})</option>`
    ).join('');
    
    const content = `
      <form style="min-width: 500px;">
        <div class="form-group">
          <label>Armor:</label>
          <select name="armor" id="armor-select" style="width: 100%; margin-bottom: 10px;">
            <option value="">-- Select Armor --</option>
            ${armorOptions}
          </select>
        </div>
        <div class="form-group" id="armor-details" style="display: none; margin-top: 15px; padding: 10px; background: #f5f5f5; border-radius: 5px;">
          <div id="armor-description" style="margin-bottom: 10px; font-style: italic; color: #666;"></div>
          <div id="armor-stats" style="font-size: 0.9em; color: #333;"></div>
        </div>
      </form>
    `;
    
    const dialog = new Dialog({
      title: 'Create New Armor',
      content: content,
      buttons: {
        create: {
          icon: '<i class="fas fa-check"></i>',
          label: 'Create',
          callback: async (html) => {
            const $html = html as JQuery;
            const armorName = $html.find('#armor-select').val() as string;
            
            if (!armorName) {
              ui.notifications?.warn('Please select Armor');
              return false;
            }
            
            const { getAllArmor } = await import('../utils/equipment.js');
            const armorList = getAllArmor();
            const armor = armorList.find(a => a.name === armorName);
            
            if (!armor) {
              ui.notifications?.error('Armor not found');
              return false;
            }
            
            const itemData = {
              name: armor.name,
              type: 'armor',
              system: {
                type: armor.type,
                armorValue: armor.armorValue,
                equipped: false,
                description: armor.description
              }
            };
            
            await this.actor.createEmbeddedDocuments('Item', [itemData]);
            ui.notifications?.info(`Created armor: ${armor.name}`);
            return true;
          }
        },
        cancel: {
          icon: '<i class="fas fa-times"></i>',
          label: 'Cancel',
          callback: () => false
        }
      },
      default: 'create',
      render: async (html: JQuery) => {
        const armorSelect = html.find('#armor-select')[0] as HTMLSelectElement;
        const armorDetails = html.find('#armor-details');
        const armorDescription = html.find('#armor-description');
        const armorStats = html.find('#armor-stats');
        
        armorSelect?.addEventListener('change', async function() {
          const armorName = this.value;
          armorDetails.hide();
          
          if (!armorName) return;
          
          const { getAllArmor } = await import('../utils/equipment.js');
          const armorList = getAllArmor();
          const armor = armorList.find(a => a.name === armorName);
          
          if (!armor) return;
          
          armorDescription.text(armor.description);
          
          let stats = '<strong>Armor Stats:</strong><br>';
          stats += `Armor Value: +${armor.armorValue}<br>`;
          stats += `Type: ${armor.type}<br>`;
          if (armor.skillPenalty && armor.skillPenalty !== '—') {
            stats += `Skill Penalty: ${armor.skillPenalty}<br>`;
          }
          armorStats.html(stats);
          
          armorDetails.show();
        });
      }
    });
    
    dialog.render(true);
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

