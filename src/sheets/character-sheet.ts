/**
 * Character Sheet for Mastery System
 * Main player character sheet with tabs for attributes, skills, powers, etc.
 */

import { MasteryActor } from '../documents/actor';
import { quickRoll } from '../dice/roll-handler';
import { SKILLS } from '../utils/skills';
import {
  DISADVANTAGES,
  getDisadvantageDefinition,
  calculateDisadvantagePoints,
  validateDisadvantageSelection
} from '../system/disadvantages';
import { getAllMasteryTrees } from '../utils/mastery-trees';
import { getAllSpellSchools } from '../utils/spell-schools';
import { getAllSchticks } from '../utils/schticks';
import { showPowerCreationDialog } from './character-sheet-power-dialog.js';
import { showWeaponCreationDialog } from './character-sheet-weapon-dialog.js';
import { showArmorCreationDialog } from './character-sheet-armor-dialog.js';
import { showShieldCreationDialog } from './character-sheet-shield-dialog.js';

// Use namespaced ActorSheet when available to avoid deprecation warnings
const BaseActorSheet: any = (foundry as any)?.appv1?.sheets?.ActorSheet || (ActorSheet as any);

export class MasteryCharacterSheet extends BaseActorSheet {
  /** @override */
  static get defaultOptions() {
    const baseOptions = super.defaultOptions || {};
    const options = foundry.utils.mergeObject(baseOptions, {
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
  // Removed #onSpellAdd, #onPowerAdd, #openMagicPowerDialog, #openPowerDialog
  // Now using #onPowerAddCreation and #onSpellAddCreation for all power/spell additions

  /**
   * Add Power during character creation
   */
  async #onPowerAddCreation(event: JQuery.ClickEvent) {
    event.preventDefault();
    console.log('Mastery System | #onPowerAddCreation called', {
      actorId: this.actor.id,
      creationComplete: (this.actor as any).system?.creation?.complete
    });
    await this.#openPowerDialogCreation('mastery');
  }

  /**
   * Add Spell during character creation
   */
  async #onSpellAddCreation(event: JQuery.ClickEvent) {
    event.preventDefault();
    console.log('Mastery System | #onSpellAddCreation called', {
      actorId: this.actor.id,
      creationComplete: (this.actor as any).system?.creation?.complete
    });
    await this.#openPowerDialogCreation('magic');
  }

  /**
   * Open Power Creation Dialog with creation limits enforced
   */
  async #openPowerDialogCreation(context: 'mastery' | 'magic'): Promise<void> {
    console.log('Mastery System | #openPowerDialogCreation called', {
      context,
      actorId: this.actor.id,
      creationComplete: (this.actor as any).system?.creation?.complete
    });
    try {
      // Use the regular dialog - it now enforces creation limits automatically
      await showPowerCreationDialog(this.actor, context);
      console.log('Mastery System | Power dialog closed, re-rendering');
      // Re-render to update counters
      this.render();
    } catch (error) {
      console.error('Mastery System | Failed to open power creation dialog', error);
      ui.notifications?.error('Failed to open power selection dialog');
    }
  }

  /**
   * Handle power rank change during creation
   */
  async #onPowerRankChange(event: JQuery.ChangeEvent) {
    event.preventDefault();
    const $select = $(event.currentTarget);
    const itemId = $select.data('item-id');
    const newRank = parseInt($select.val() as string);
    
    const system = (this.actor as any).system;
    const masteryRank = system.mastery?.rank || 2;
    
    if (newRank > masteryRank) {
      ui.notifications?.error(`Power rank cannot exceed Mastery Rank ${masteryRank}`);
      const item = this.actor.items.get(itemId);
      if (item) {
        const currentLevel = (item.system as any).level || 1;
        $select.val(currentLevel);
      }
      return;
    }
    
    const item = this.actor.items.get(itemId);
    if (item) {
      await item.update({ 'system.level': newRank });
      this.render();
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
      await showWeaponCreationDialog(this.actor);
    } catch (error) {
      console.error('Mastery System | Failed to open weapon dialog', error);
      ui.notifications?.error('Failed to open weapon selection dialog');
    }
  }

  /**
   * Add Armor → open armor dialog
   */
  async #onArmorAdd(event: JQuery.ClickEvent) {
    event.preventDefault();
    await this.#openArmorDialog();
  }

  /**
   * Open the Armor Creation Dialog
   */
  async #openArmorDialog(): Promise<void> {
    try {
      await showArmorCreationDialog(this.actor);
    } catch (error) {
      console.error('Mastery System | Error loading armor dialog:', error);
      ui.notifications?.error('Failed to load armor dialog.');
    }
  }

  /**
   * Add Shield → open shield dialog
   */
  async #onShieldAdd(event: JQuery.ClickEvent) {
    event.preventDefault();
    await this.#openShieldDialog();
  }

  /**
   * Open the Shield Creation Dialog
   */
  async #openShieldDialog(): Promise<void> {
    try {
      await showShieldCreationDialog(this.actor);
    } catch (error) {
      console.error('Mastery System | Error loading shield dialog:', error);
      ui.notifications?.error('Failed to load shield dialog.');
    }
  }

  /**
   * Toggle equipment equipped status (Radio button handler)
   */
  async #onEquipmentToggle(event: JQuery.ChangeEvent) {
    const $radio = $(event.currentTarget);
    const itemId = $radio.val() as string || $radio.data('item-id') || $radio.attr('data-item-id');
    // const itemType = $radio.attr('name'); // 'equipped-weapon', 'equipped-armor', or 'equipped-shield' - unused
    const equipped = $radio.is(':checked');
    
    if (!itemId) {
      console.warn('Mastery System | [EQUIP TOGGLE] Could not find item ID', {
        radio: event.currentTarget,
        radioData: $radio.data(),
        radioAttrs: Array.from(event.currentTarget.attributes).map((attr: any) => ({
          name: attr.name,
          value: attr.value
        }))
      });
      ui.notifications?.warn('Could not find item to equip/unequip.');
      return;
    }
    
    const item = this.actor.items.get(itemId);
    
    if (!item) {
      console.warn('Mastery System | [EQUIP TOGGLE] Item not found in actor.items', {
        itemId,
        actorId: this.actor.id,
        allItemIds: Array.from(this.actor.items.keys())
      });
      ui.notifications?.warn(`Item with ID ${itemId} not found.`);
      return;
    }
    
    // Validation: 2-handed weapons cannot be used with shields
    if (item.type === 'weapon' && equipped) {
      const weaponHands = (item.system as any)?.hands || 1;
      if (weaponHands === 2) {
        // Check if a shield is equipped
        const equippedShield = Array.from(this.actor.items.values()).find((i: any) => 
          i.type === 'shield' && (i.system as any)?.equipped === true
        );
        
        if (equippedShield) {
          ui.notifications?.warn(`Cannot equip 2-handed weapon "${(item as any).name}" while shield "${(equippedShield as any).name}" is equipped.`);
          // Revert radio button
          $radio.prop('checked', false);
          return;
        }
      }
    }
    
    // Validation: Shields cannot be equipped with 2-handed weapons
    if (item.type === 'shield' && equipped) {
      const equippedWeapon = Array.from(this.actor.items.values()).find((i: any) => 
        i.type === 'weapon' && (i.system as any)?.equipped === true
      );
      
      if (equippedWeapon) {
        const weaponHands = ((equippedWeapon as any).system as any)?.hands || 1;
        if (weaponHands === 2) {
          ui.notifications?.warn(`Cannot equip shield "${(item as any).name}" while 2-handed weapon "${(equippedWeapon as any).name}" is equipped.`);
          // Revert radio button
          $radio.prop('checked', false);
          return;
        }
      }
    }
    
    try {
      // First, unequip all other items of the same type
      const updates: any[] = [];
      for (const otherItem of this.actor.items) {
        if (otherItem.id !== itemId && otherItem.type === item.type && (otherItem.system as any)?.equipped) {
          updates.push({ _id: otherItem.id, 'system.equipped': false });
        }
      }
      
      // Then equip/unequip the selected item
      if (equipped) {
        updates.push({ _id: itemId, 'system.equipped': true });
      } else {
        updates.push({ _id: itemId, 'system.equipped': false });
      }
      
      if (updates.length > 0) {
        await this.actor.updateEmbeddedDocuments('Item', updates);
        console.log('Mastery System | [EQUIP TOGGLE] Updated items', {
          itemId,
          itemName: item.name,
          equipped,
          itemType: item.type,
          updatesCount: updates.length
        });
        
        // Re-render the sheet to update the display
        this.render();
      }
    } catch (error) {
      console.error('Mastery System | [EQUIP TOGGLE] Error updating item', error);
      ui.notifications?.error(`Failed to update item: ${error}`);
      // Revert radio button state
      $radio.prop('checked', !equipped);
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
    
    // Check if character creation is complete
    // If complete is undefined, treat as incomplete (new character)
    const creationCompleteRaw = context.system.creation?.complete;
    context.creationComplete = creationCompleteRaw === true;
    
    console.log('Mastery System | getData - Creation Status:', {
      creationCompleteRaw,
      creationComplete: context.creationComplete,
      systemCreation: context.system.creation,
      hasCreation: !!context.system.creation
    });
    
    // Calculate creation point counters (always calculate, but only show if not complete)
    const masteryRank = context.system.mastery?.rank || 2;
    const skillPointsConfig = (CONFIG as any).MASTERY?.creation?.skillPoints || 16;
    
    // Calculate attribute points spent
    let attributePointsSpent = 0;
    const attributeKeys = ['might', 'agility', 'vitality', 'intellect', 'resolve', 'influence', 'wits'];
    for (const key of attributeKeys) {
      const attrValue = context.system.attributes?.[key]?.value || masteryRank;
      if (attrValue > masteryRank) {
        attributePointsSpent += attrValue - masteryRank;
      }
    }
    
    // Calculate skill points spent
    let skillPointsSpent = 0;
    for (const skillValue of Object.values(context.system.skills || {})) {
      skillPointsSpent += (typeof skillValue === 'number' ? skillValue : 0);
    }
    
    // Calculate disadvantage points
    const disadvantagePoints = (context.system.disadvantages || []).reduce((sum: number, d: any) => sum + (d.points || 0), 0);
    
    // Check if disadvantages phase is reviewed (user has visited the tab or interacted with disadvantages)
    const disadvantagesReviewed = context.system.creation?.disadvantagesReviewed === true || 
                                  (context.system.disadvantages && Array.isArray(context.system.disadvantages));
    
    // Calculate powers & magic creation status
    const items = this.#prepareItems();
    const powers = items.powers || [];
    const selectedTrees = this.#getSelectedTrees(powers);
    // During creation, all powers count (trees are optional)
    const selectedPowers = powers;
    const powersAtRank2 = selectedPowers.filter((p: any) => (p.system?.level || 1) === 2);
    
    // Load tree/school data with bonuses for selected trees
    const allTrees = getAllMasteryTrees();
    const allSchools = getAllSpellSchools();
    
    const selectedTreesData = selectedTrees.map((treeName: string) => {
      // Try to find in mastery trees first
      let treeData = allTrees.find((t: any) => t.name === treeName);
      
      if (treeData) {
        return {
          name: treeData.name,
          type: 'mastery',
          bonus: treeData.bonus || null,
          focus: treeData.focus,
          roles: treeData.roles || []
        };
      }
      
      // Try spell schools
      const schoolData = allSchools.find((s: any) => s.name === treeName || s.fullName === treeName);
      
      if (schoolData) {
        return {
          name: schoolData.name,
          type: 'spell',
          bonus: schoolData.bonus || null,
          focus: schoolData.focus,
          roles: schoolData.roles || []
        };
      }
      
      // Fallback if not found
      return {
        name: treeName,
        type: 'unknown',
        bonus: null,
        focus: '',
        roles: []
      };
    });
    
    console.log('Mastery System | getData - Powers Status:', {
      totalPowers: powers.length,
      selectedTrees: selectedTrees,
      selectedTreesCount: selectedTrees.length,
      selectedPowersCount: selectedPowers.length,
      powersAtRank2Count: powersAtRank2.length,
      creationComplete: context.creationComplete,
      selectedTreesData: selectedTreesData
    });
    
    // Schticks data - per rank structure
    const schticksRanks = context.system.schticks?.ranks || [];
    const availableSchticks = getAllSchticks();
    
    // Create lookup map for schticks by ID
    const availableSchticksById: Record<string, any> = {};
    availableSchticks.forEach((s: any) => {
      availableSchticksById[s.id] = s;
    });
    
    // Prepare schticks rows - one per mastery rank
    const schticksRows: Array<{rank: number, schtickName: string, manifestation: string}> = [];
    for (let rank = 1; rank <= masteryRank; rank++) {
      const rankData = schticksRanks.find((r: any) => r.rank === rank);
      schticksRows.push({
        rank,
        schtickName: rankData?.schtickName || '',
        manifestation: rankData?.manifestation || ''
      });
    }
    
    // Validate schticks - each rank should have a schtick selected
    const schticksValidation = this.#validateSchticksPerRank(schticksRows, masteryRank);
    
    // Tooltip texts for each rank
    const rankTooltips: Record<number, {description: string, example: string}> = {
      1: {
        description: 'Subtle signs or small curiosities; a hint of what\'s to come.',
        example: 'Eyes gleam pale blue; breath mists even indoors.'
      },
      2: {
        description: 'Clear aesthetic or behavioral quirk visible to others.',
        example: 'Tears fall as tiny snowflakes; touch feels cool as marble.'
      },
      3: {
        description: 'Your power visibly marks your entire body or presence.',
        example: 'Skin fades to icy blue; faint frost lines trace your veins.'
      },
      4: {
        description: 'Your aura influences nearby objects or the air itself.',
        example: 'Objects frost slightly when touched; cold lingers where you stand.'
      },
      5: {
        description: 'Reality subtly bends around your nature; myth and truth blur.',
        example: 'A halo of frost shimmers in moonlight; snow falls when you grieve.'
      }
    };
    
    // Always provide creation data for template (even if complete)
    context.creation = {
      masteryRank,
      skillPointsConfig,
      attributePointsRemaining: 16 - attributePointsSpent,
      attributePointsSpent,
      skillPointsRemaining: skillPointsConfig - skillPointsSpent,
      skillPointsSpent,
      disadvantagePoints,
      disadvantagesReviewed,
      powersSelected: selectedPowers.length,
      powersRequired: 4,
      treesSelected: selectedTrees.length,
      treesRequired: 0, // Trees are now optional
      powersAtRank2: powersAtRank2.length,
      powersAtRank2Required: 2, // Max 2, not exactly 2
      powersAtRank2Max: 2,
      selectedTrees: selectedTrees,
      selectedTreesData: selectedTreesData,
      schticksRows: schticksRows,
      availableSchticks: availableSchticks,
      availableSchticksById: availableSchticksById,
      rankTooltips: rankTooltips,
      schticksValid: schticksValidation.ok,
      powersValid: selectedPowers.length === 4 && powersAtRank2.length <= 2,
      canFinalize: attributePointsSpent === 16 && 
                   skillPointsSpent === skillPointsConfig && 
                   selectedPowers.length === 4 && 
                   powersAtRank2.length <= 2
    };
    
    console.log('Mastery System | getData - Final Context Check:', {
      creationComplete: context.creationComplete,
      creationCompleteType: typeof context.creationComplete,
      creationCompleteValue: String(context.creationComplete),
      systemCreationComplete: context.system.creation?.complete,
      creation: {
        treesSelected: context.creation?.treesSelected,
        powersSelected: context.creation?.powersSelected,
        powersAtRank2: context.creation?.powersAtRank2
      },
      itemsPowers: items.powers?.length || 0,
      willShowCreationUI: !context.creationComplete
    });
    
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
    
    // Note: armorTotal and evadeTotal are now calculated in actor.prepareDerivedData()
    // No need to calculate here - just use the derived values from system.combat
    
    // Add skills list (sorted alphabetically)
    context.skills = this.#prepareSkills(context.system.skills);
    
    // Prepare disadvantages
    context.disadvantages = context.system.disadvantages || [];
    context.disadvantagePointsTotal = context.disadvantages.reduce((sum: number, d: any) => sum + (d.points || 0), 0);
    
    // Ensure token image is available
    if (!context.actor.prototypeToken?.texture?.src) {
      context.actor.prototypeToken = context.actor.prototypeToken || {};
      context.actor.prototypeToken.texture = context.actor.prototypeToken.texture || {};
      context.actor.prototypeToken.texture.src = context.actor.img;
    }
    
    // Ensure context.items contains the prepared items structure (weapons, armor, shields, etc.)
    // This is already set in line 453, but we ensure it's not overwritten
    if (!context.items || !context.items.weapons) {
      context.items = this.#prepareItems();
    }
    
    return context;
  }

  /** @override */
  async render(force?: boolean, options?: any) {
    console.log('Mastery System | Character Sheet render called', { force, options });
    
    // Save scroll positions for all tabs and the main window before rendering
    const scrollPositions: Record<string, number> = {};
    if (this.element && this.element.length > 0) {
      // Save scroll position for each tab
      const tabs = this.element.find('.tab');
      tabs.each((index: number, tab: HTMLElement) => {
        const $tab = $(tab);
        const tabName = $tab.attr('data-tab') || `tab-${index}`;
        const scrollTop = $tab.scrollTop();
        if (scrollTop !== undefined && scrollTop > 0) {
          scrollPositions[tabName] = scrollTop;
        }
      });
      
      // Also save scroll position for the main sheet body (in case tabs don't have their own scroll)
      const sheetBody = this.element.find('.sheet-body');
      if (sheetBody.length > 0) {
        const bodyScrollTop = sheetBody.scrollTop();
        if (bodyScrollTop !== undefined && bodyScrollTop > 0) {
          scrollPositions['sheet-body'] = bodyScrollTop;
        }
      }
    }
    
    const result = await super.render(force, options);
    
    // Restore scroll positions after rendering
    if (this.element && this.element.length > 0 && Object.keys(scrollPositions).length > 0) {
      // Use requestAnimationFrame to ensure DOM is fully updated
      requestAnimationFrame(() => {
        // Restore tab scroll positions
        const tabs = this.element.find('.tab');
        tabs.each((index: number, tab: HTMLElement) => {
          const $tab = $(tab);
          const tabName = $tab.attr('data-tab') || `tab-${index}`;
          if (scrollPositions[tabName] !== undefined) {
            $tab.scrollTop(scrollPositions[tabName]);
          }
        });
        
        // Restore sheet body scroll position
        if (scrollPositions['sheet-body'] !== undefined) {
          const sheetBody = this.element.find('.sheet-body');
          if (sheetBody.length > 0) {
            sheetBody.scrollTop(scrollPositions['sheet-body']);
          }
        }
      });
    }
    
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
    const shields: any[] = [];
    const weapons: any[] = [];
    const armor: any[] = [];
    
    // Ensure we iterate over all items correctly (handle both Collection and Array)
    const items = this.actor.items;
    const itemsArray = Array.isArray(items) ? items : Array.from(items.values());
    
    for (const item of itemsArray) {
      const itemData = item;
      
      switch (item.type) {
        case 'power':
          powers.push(itemData);
          break;
        case 'gear':
          // Gear items are handled separately if needed
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
        case 'shield':
          shields.push(itemData);
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
      shields,
      conditions,
      weapons,
      armor
    };
  }

  /**
   * Get unique trees from selected powers (including spell schools)
   */
  #getSelectedTrees(powers: any[]): string[] {
    const trees = new Set<string>();
    for (const power of powers) {
      const tree = power.system?.tree;
      if (tree) {
        trees.add(tree);
      }
    }
    return Array.from(trees);
  }

  /**
   * Validate schticks per rank - each rank should have a schtick name
   */
  #validateSchticksPerRank(rows: Array<{rank: number, schtickName: string, manifestation: string}>, masteryRank: number): { ok: boolean; message?: string } {
    for (let rank = 1; rank <= masteryRank; rank++) {
      const row = rows.find(r => r.rank === rank);
      if (!row || !row.schtickName || row.schtickName.trim() === '') {
        return {
          ok: false,
          message: `You must enter a Schtick name for Rank ${rank}.`
        };
      }
    }
    return { ok: true };
  }

  /**
   * Handle schtick name change per rank
   */
  async #onSchtickNameChange(event: JQuery.BlurEvent) {
    const input = event.currentTarget as HTMLInputElement;
    const rank = parseInt(input.dataset.rank || '0');
    const schtickName = input.value.trim();
    
    if (!rank || rank < 1) {
      console.error('Mastery System | Invalid rank for schtick name:', rank);
      return;
    }
    
    console.log('Mastery System | Schtick name change:', {
      rank,
      schtickName
    });
    
    const currentRanks = (this.actor as any).system?.schticks?.ranks || [];
    const rankIndex = currentRanks.findIndex((r: any) => r.rank === rank);
    
    let newRanks: Array<{rank: number, schtickName: string, manifestation: string}>;
    if (rankIndex >= 0) {
      // Update existing rank
      newRanks = [...currentRanks];
      newRanks[rankIndex] = {
        ...newRanks[rankIndex],
        schtickName: schtickName
      };
    } else {
      // Add new rank entry
      newRanks = [...currentRanks, {
        rank,
        schtickName: schtickName,
        manifestation: ''
      }];
    }
    
    // Update actor
    await (this.actor as any).update({
      'system.schticks.ranks': newRanks
    });
    
    console.log('Mastery System | Schticks ranks updated:', {
      newRanks,
      count: newRanks.length
    });
    
    // Re-render to update UI
    this.render();
  }

  /**
   * Handle schtick manifestation change
   */
  async #onSchtickManifestationChange(event: JQuery.BlurEvent) {
    const input = event.currentTarget as HTMLInputElement;
    const rank = parseInt(input.dataset.rank || '0');
    const manifestation = input.value.trim();
    
    if (!rank || rank < 1) {
      console.error('Mastery System | Invalid rank for manifestation:', rank);
      return;
    }
    
    console.log('Mastery System | Schtick manifestation change:', {
      rank,
      manifestation
    });
    
    const currentRanks = (this.actor as any).system?.schticks?.ranks || [];
    const rankIndex = currentRanks.findIndex((r: any) => r.rank === rank);
    
    let newRanks: Array<{rank: number, schtickName: string, manifestation: string}>;
    if (rankIndex >= 0) {
      // Update existing rank manifestation
      newRanks = [...currentRanks];
      newRanks[rankIndex] = {
        ...newRanks[rankIndex],
        manifestation
      };
    } else {
      // This shouldn't happen - manifestation without schtick
      console.warn('Mastery System | Manifestation changed but no schtick name for rank:', rank);
      return;
    }
    
    // Update actor
    await (this.actor as any).update({
      'system.schticks.ranks': newRanks
    });
    
    console.log('Mastery System | Schtick manifestation updated for rank', rank);
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
    
    // Character Creation buttons
    const unlockButton = html.find('.force-unlock-creation');
    if (unlockButton.length > 0) {
      unlockButton.off('click.force-unlock').on('click.force-unlock', (e: JQuery.ClickEvent) => {
        e.preventDefault();
        e.stopPropagation();
        this.#onForceUnlockCreation(e);
      });
    }
    
    // Check if creation is incomplete - don't lock, just disable non-creation fields
    const creationComplete = (this.actor as any).system?.creation?.complete !== false;
    if (!creationComplete) {
      this.#lockSheetForCreation(html);
    }
    
    // Roll buttons work for everyone
    html.find('.attribute-roll').on('click', this.#onAttributeRoll.bind(this));
    html.find('.skill-roll').on('click', this.#onSkillRoll.bind(this));
    html.find('.skill-roll-compact').on('click', this.#onSkillRoll.bind(this));
    html.find('.save-roll-btn').on('click', this.#onSavingThrowRoll.bind(this));
    
    // Point spending buttons (JavaScript will check permissions)
    html.find('.attribute-spend-point').on('click', this.#onAttributeSpendPoint.bind(this));
    html.find('.skill-spend-point').on('click', this.#onSkillSpendPoint.bind(this));
    
    // Character Creation mode buttons
    html.find('.attr-increase').on('click', this.#onCreationAttributeIncrease.bind(this));
    html.find('.attr-decrease').on('click', this.#onCreationAttributeDecrease.bind(this));
    html.find('.skill-increase').on('click', this.#onCreationSkillIncrease.bind(this));
    html.find('.skill-decrease').on('click', this.#onCreationSkillDecrease.bind(this));
    html.find('.finalize-creation').on('click', this.#onFinalizeCreation.bind(this));
    
    // Stone Powers button handler
    html.find('[data-action="openStonePowers"]').on('click', async (ev: JQuery.ClickEvent) => {
      ev.preventDefault();
      
      // Get current combatant if in combat
      let combatant: any = null;
      if (game.combat) {
        const combatants = game.combat.combatants;
        combatant = Array.from(combatants).find((c: any) => c.actor?.id === this.actor.id) || null;
      }
      
      const { StonePowersDialog } = await import('../stones/stone-powers-dialog.js');
      await StonePowersDialog.showForActor(this.actor, combatant);
    });
    
    // Schticks selection (per rank)
    html.find('.schtick-input').on('blur', this.#onSchtickNameChange.bind(this));
    html.find('.schtick-manifestation-input').on('blur', this.#onSchtickManifestationChange.bind(this));
    
    // Disadvantages buttons (only during creation)
    const addDisadvantageBtn = html.find('.add-disadvantage-btn');
    console.log('Mastery System | Setting up add-disadvantage-btn listener', {
      buttonFound: addDisadvantageBtn.length,
      buttonElement: addDisadvantageBtn[0],
      isDisabled: addDisadvantageBtn.prop('disabled'),
      creationComplete: creationComplete
    });
    
    if (addDisadvantageBtn.length > 0) {
      addDisadvantageBtn.off('click.add-disadvantage').on('click.add-disadvantage', (e: JQuery.ClickEvent) => {
        console.log('Mastery System | add-disadvantage-btn clicked!', {
          event: e,
          target: e.target,
          currentTarget: e.currentTarget,
          isDefaultPrevented: e.isDefaultPrevented()
        });
        this.#onAddDisadvantage(e);
      });
      // Also try direct binding as fallback
      addDisadvantageBtn.on('click', (e: JQuery.ClickEvent) => {
        console.log('Mastery System | add-disadvantage-btn clicked (direct binding)', e);
        e.preventDefault();
        e.stopPropagation();
        this.#onAddDisadvantage(e);
      });
    } else {
      console.warn('Mastery System | add-disadvantage-btn not found in HTML!');
    }
    
    html.find('.disadvantage-edit-btn').on('click', this.#onEditDisadvantage.bind(this));
    html.find('.disadvantage-remove-btn').on('click', this.#onRemoveDisadvantage.bind(this));
    
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
    
    // Mark disadvantages as reviewed when user visits the disadvantages tab
    if (!creationComplete) {
      // Use event delegation for tab clicks
      html.on('click', 'a[data-tab="disadvantages"]', async () => {
        const system = (this.actor as any).system;
        if (!system.creation?.disadvantagesReviewed) {
          await this.actor.update({ 'system.creation.disadvantagesReviewed': true });
          // Re-render to update the banner
          this.render();
        }
      });
    }
    
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
    // Power/Spell creation buttons (always visible)
    html.find('.add-power-creation-btn').on('click', this.#onPowerAddCreation.bind(this));
    html.find('.add-spell-creation-btn').on('click', this.#onSpellAddCreation.bind(this));
    html.find('.power-rank-select').on('change', this.#onPowerRankChange.bind(this));
    
    // Equipment handlers
    html.find('.add-weapon-btn').on('click', this.#onWeaponAdd.bind(this));
    html.find('.add-armor-btn').on('click', this.#onArmorAdd.bind(this));
    html.find('.add-shield-btn').on('click', this.#onShieldAdd.bind(this));
    html.find('.equipment-item input[type="radio"][name^="equipped-"]').on('change', this.#onEquipmentToggle.bind(this));

    // Add spell
    // Removed add-spell-btn handler - using add-spell-creation-btn instead
    
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
    
    // Save scroll position
    const attributesTab = this.element.find('.tab.attributes');
    const scrollTop = attributesTab.scrollTop();
    
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
    
    await this.render();
    
    // Restore scroll position
    const newAttributesTab = this.element.find('.tab.attributes');
    if (newAttributesTab.length) {
      newAttributesTab.scrollTop(scrollTop);
    }
    
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
   * Handle saving throw roll
   */
  async #onSavingThrowRoll(event: JQuery.ClickEvent) {
    event.preventDefault();
    const element = event.currentTarget;
    const saveType = element.dataset.saveType; // 'body', 'mind', or 'spirit'
    
    if (!saveType) return;
    
    const actorData = this.actor.system as any;
    const vitality = actorData.attributes?.vitality?.value || 2;
    
    // Calculate which attribute to use and numDice
    let numDice: number;
    
    if (saveType === 'body') {
      const might = actorData.attributes?.might?.value || 2;
      const agility = actorData.attributes?.agility?.value || 2;
      numDice = Math.max(might, agility);
    } else if (saveType === 'mind') {
      const intellect = actorData.attributes?.intellect?.value || 2;
      const wits = actorData.attributes?.wits?.value || 2;
      numDice = Math.max(intellect, wits);
    } else if (saveType === 'spirit') {
      const resolve = actorData.attributes?.resolve?.value || 2;
      const influence = actorData.attributes?.influence?.value || 2;
      numDice = Math.max(resolve, influence);
    } else {
      return;
    }
    
    // Get mastery rank (number to keep)
    const keepDice = actorData.mastery?.rank || 2;
    
    // Apply health penalty (reduces dice pool)
    const { getCurrentPenalty } = await import('../utils/calculations.js');
    const healthBars = actorData.health?.bars || [];
    const currentBar = actorData.health?.currentBar ?? 0;
    const healthPenalty = getCurrentPenalty(healthBars, currentBar);
    
    // Health penalty reduces the dice pool (numDice)
    numDice = Math.max(1, numDice + healthPenalty); // Minimum 1 die
    
    // Skill bonus = Vitality
    const skill = vitality;
    
    // Prompt for TN
    const tn = await this.#promptForTN();
    if (tn === null) return;
    
    // Build label
    const saveName = saveType.charAt(0).toUpperCase() + saveType.slice(1);
    let flavorText = `+${vitality} (Vitality)`;
    
    // Add health penalty to flavor if applicable
    if (healthPenalty < 0) {
      const penaltyText = healthPenalty === -1 ? '1' : healthPenalty === -2 ? '2' : healthPenalty === -4 ? '4' : String(Math.abs(healthPenalty));
      flavorText += ` (Health penalty: -${penaltyText} dice)`;
    }
    
    const { masteryRoll } = await import('../dice/roll-handler.js');
    await masteryRoll({
      numDice,
      keepDice,
      skill,
      tn,
      label: `${saveName} Save`,
      flavor: flavorText,
      actorId: (this.actor as any).id
    });
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
    
    // Save scroll position
    const skillsTab = this.element.find('.tab.skills');
    const scrollTop = skillsTab.scrollTop();
    
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
    
    await this.render();
    
    // Restore scroll position
    const newSkillsTab = this.element.find('.tab.skills');
    if (newSkillsTab.length) {
      newSkillsTab.scrollTop(scrollTop);
    }
    
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
    event.stopPropagation();
    
    // Try to find the item ID from various possible element structures
    const $button = $(event.currentTarget);
    const $item = $button.closest('.item, .equipment-item');
    
    // Try multiple methods to get the item ID
    let itemId = $item.data('item-id') || 
                 $item.attr('data-item-id') || 
                 $item.data('itemId') ||
                 $button.data('item-id') || 
                 $button.attr('data-item-id') ||
                 $button.data('itemId');
    
    // If still not found, try to get from parent's data attributes
    if (!itemId && $item.length > 0) {
      const itemElement = $item[0];
      itemId = itemElement.getAttribute('data-item-id') || 
               itemElement.getAttribute('data-itemId');
    }
    
    if (!itemId) {
      console.error('Mastery System | [DELETE ITEM] Could not find item ID', {
        button: event.currentTarget,
        buttonHtml: $button[0]?.outerHTML,
        closestItem: $item[0],
        closestItemHtml: $item[0]?.outerHTML,
        buttonData: $button.data(),
        itemData: $item.data(),
        itemAttrs: $item.length > 0 ? Array.from($item[0].attributes).map((attr: any) => ({
          name: attr.name,
          value: attr.value
        })) : []
      });
      ui.notifications?.error('Could not find item to delete. Please check the console for details.');
      return;
    }
    
    const item = this.actor.items.get(itemId);
    
    if (!item) {
      console.error('Mastery System | [DELETE ITEM] Item not found in actor.items', {
        itemId,
        actorId: this.actor.id,
        allItemIds: Array.from(this.actor.items.keys()),
        allItems: Array.from(this.actor.items.values()).map((i: any) => ({
          id: i.id,
          name: i.name,
          type: i.type
        }))
      });
      ui.notifications?.error(`Item with ID ${itemId} not found in actor.`);
      return;
    }
    
    const confirmed = await Dialog.confirm({
      title: 'Delete Item',
      content: `<p>Are you sure you want to delete <strong>${item.name}</strong>?</p>`
    });
    
    if (confirmed) {
      try {
        await item.delete();
        console.log('Mastery System | [DELETE ITEM] Item deleted successfully', {
          itemId,
          itemName: item.name,
          itemType: item.type
        });
        // Re-render the sheet to update the display
        this.render();
      } catch (error) {
        console.error('Mastery System | [DELETE ITEM] Error deleting item', error);
        ui.notifications?.error(`Failed to delete item: ${error}`);
      }
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

  /**
   * Lock sheet when character creation is incomplete
   * Only disable non-creation fields, allow creation controls
   */
  #lockSheetForCreation(html: JQuery) {
    console.log('Mastery System | #lockSheetForCreation called');
    
    // Disable non-creation inputs (name, bio, etc.)
    // But allow power-rank-select during creation
    html.find('input[name="name"], textarea').prop('disabled', true);
    html.find('select:not(.power-rank-select)').prop('disabled', true);
    
    // Disable buttons except creation controls
    const buttonsToDisable = html.find('button:not(.attr-increase):not(.attr-decrease):not(.skill-increase):not(.skill-decrease):not(.finalize-creation):not(.force-unlock-creation):not(.add-disadvantage-btn):not(.disadvantage-edit-btn):not(.disadvantage-remove-btn):not(.add-power-creation-btn):not(.add-spell-creation-btn):not(.power-rank-select)');
    console.log('Mastery System | Disabling buttons:', buttonsToDisable.length);
    buttonsToDisable.prop('disabled', true);
    
    // Ensure creation buttons are enabled
    const creationButtons = html.find('.attr-increase, .attr-decrease, .skill-increase, .skill-decrease, .finalize-creation, .force-unlock-creation, .add-disadvantage-btn, .disadvantage-edit-btn, .disadvantage-remove-btn, .add-power-creation-btn, .add-spell-creation-btn');
    console.log('Mastery System | Enabling creation buttons:', {
      total: creationButtons.length,
      addDisadvantageBtn: html.find('.add-disadvantage-btn').length,
      addPowerCreationBtn: html.find('.add-power-creation-btn').length,
      addSpellCreationBtn: html.find('.add-spell-creation-btn').length,
      addDisadvantageBtnDisabled: html.find('.add-disadvantage-btn').prop('disabled'),
      addPowerCreationBtnDisabled: html.find('.add-power-creation-btn').prop('disabled'),
      addSpellCreationBtnDisabled: html.find('.add-spell-creation-btn').prop('disabled')
    });
    creationButtons.prop('disabled', false);
    
    // Also enable power rank selects (they're select elements, not buttons)
    html.find('.power-rank-select').prop('disabled', false);
    
    // Double-check all creation buttons are enabled
    const addDisadvantageBtn = html.find('.add-disadvantage-btn');
    const addPowerCreationBtn = html.find('.add-power-creation-btn');
    const addSpellCreationBtn = html.find('.add-spell-creation-btn');
    
    if (addDisadvantageBtn.length > 0) {
      addDisadvantageBtn.prop('disabled', false);
      console.log('Mastery System | add-disadvantage-btn explicitly enabled, final state:', addDisadvantageBtn.prop('disabled'));
    } else {
      console.warn('Mastery System | add-disadvantage-btn not found during lockSheetForCreation!');
    }
    
    if (addPowerCreationBtn.length > 0) {
      addPowerCreationBtn.prop('disabled', false);
      console.log('Mastery System | add-power-creation-btn explicitly enabled, final state:', addPowerCreationBtn.prop('disabled'));
    } else {
      console.log('Mastery System | add-power-creation-btn not found (might be normal if creation complete)');
    }
    
    if (addSpellCreationBtn.length > 0) {
      addSpellCreationBtn.prop('disabled', false);
      console.log('Mastery System | add-spell-creation-btn explicitly enabled, final state:', addSpellCreationBtn.prop('disabled'));
    } else {
      console.log('Mastery System | add-spell-creation-btn not found (might be normal if creation complete)');
    }
    
    // Add CSS class for styling
    html.addClass('creation-incomplete');
  }


  /**
   * Force unlock creation (GM only)
   */
  async #onForceUnlockCreation(event: JQuery.ClickEvent) {
    event.preventDefault();
    event.stopPropagation();
    console.log('Mastery System | Force Unlock clicked');
    
    if (!(game as any).user?.isGM) {
      ui.notifications?.warn('Only the GM can force unlock character creation.');
      return;
    }

    const confirmed = await Dialog.confirm({
      title: 'Force Unlock Character Creation',
      content: '<p>Are you sure you want to mark this character\'s creation as complete? This will unlock the sheet for editing.</p>'
    });

    if (confirmed) {
      try {
        await this.actor.update({ 'system.creation.complete': true });
        ui.notifications?.info('Character creation marked as complete.');
        this.render();
      } catch (error) {
        console.error('Mastery System | Failed to force unlock', error);
        ui.notifications?.error('Failed to unlock character creation.');
      }
    }
  }

  /**
   * Character Creation: Increase Attribute
   */
  async #onCreationAttributeIncrease(event: JQuery.ClickEvent) {
    event.preventDefault();
    const attribute = $(event.currentTarget).data('attribute');
    if (!attribute) return;
    
    const system = (this.actor as any).system;
    const masteryRank = system.mastery?.rank || 2;
    const currentValue = system.attributes?.[attribute]?.value || masteryRank;
    // Calculate current points spent
    let attributePointsSpent = 0;
    const attributeKeys = ['might', 'agility', 'vitality', 'intellect', 'resolve', 'influence', 'wits'];
    for (const key of attributeKeys) {
      const attrValue = system.attributes?.[key]?.value || masteryRank;
      if (attrValue > masteryRank) {
        attributePointsSpent += attrValue - masteryRank;
      }
    }
    
    // Validate
    if (currentValue >= 8) {
      ui.notifications?.warn('Attribute cannot exceed 8 during character creation.');
      return;
    }
    if (attributePointsSpent >= 16) {
      ui.notifications?.warn('All attribute points have been allocated.');
      return;
    }
    
    // Update
    await this.actor.update({
      [`system.attributes.${attribute}.value`]: currentValue + 1
    });
    
    this.render();
  }

  /**
   * Character Creation: Decrease Attribute
   */
  async #onCreationAttributeDecrease(event: JQuery.ClickEvent) {
    event.preventDefault();
    const attribute = $(event.currentTarget).data('attribute');
    if (!attribute) return;
    
    const system = (this.actor as any).system;
    const masteryRank = system.mastery?.rank || 2;
    const currentValue = system.attributes?.[attribute]?.value || masteryRank;
    
    // Validate
    if (currentValue <= masteryRank) {
      ui.notifications?.warn('Attribute cannot go below Mastery Rank.');
      return;
    }
    
    // Update
    await this.actor.update({
      [`system.attributes.${attribute}.value`]: currentValue - 1
    });
    
    this.render();
  }

  /**
   * Character Creation: Increase Skill
   */
  async #onCreationSkillIncrease(event: JQuery.ClickEvent) {
    event.preventDefault();
    const skill = $(event.currentTarget).data('skill');
    if (!skill) return;
    
    // Save scroll position
    const skillsTab = this.element.find('.tab.skills');
    const scrollTop = skillsTab.scrollTop();
    
    const system = (this.actor as any).system;
    const currentValue = system.skills?.[skill] || 0;
    const skillPointsConfig = (CONFIG as any).MASTERY?.creation?.skillPoints || 16;
    
    // Calculate current points spent
    let skillPointsSpent = 0;
    for (const skillValue of Object.values(system.skills || {})) {
      skillPointsSpent += (typeof skillValue === 'number' ? skillValue : 0);
    }
    
    // Validate
    if (currentValue >= 4) {
      ui.notifications?.warn('Skill cannot exceed 4 during character creation.');
      return;
    }
    if (skillPointsSpent >= skillPointsConfig) {
      ui.notifications?.warn('All skill points have been allocated.');
      return;
    }
    
    // Update
    await this.actor.update({
      [`system.skills.${skill}`]: currentValue + 1
    });
    
    await this.render();
    
    // Restore scroll position
    const newSkillsTab = this.element.find('.tab.skills');
    if (newSkillsTab.length) {
      newSkillsTab.scrollTop(scrollTop);
    }
  }

  /**
   * Character Creation: Decrease Skill
   */
  async #onCreationSkillDecrease(event: JQuery.ClickEvent) {
    event.preventDefault();
    const skill = $(event.currentTarget).data('skill');
    if (!skill) return;
    
    // Save scroll position
    const skillsTab = this.element.find('.tab.skills');
    const scrollTop = skillsTab.scrollTop();
    
    const system = (this.actor as any).system;
    const currentValue = system.skills?.[skill] || 0;
    
    // Validate
    if (currentValue <= 0) {
      ui.notifications?.warn('Skill cannot go below 0.');
      return;
    }
    
    // Update
    await this.actor.update({
      [`system.skills.${skill}`]: currentValue - 1
    });
    
    await this.render();
    
    // Restore scroll position
    const newSkillsTab = this.element.find('.tab.skills');
    if (newSkillsTab.length) {
      newSkillsTab.scrollTop(scrollTop);
    }
  }

  /**
   * Add Disadvantage during Creation
   */
  async #onAddDisadvantage(event: JQuery.ClickEvent) {
    console.log('Mastery System | ========== #onAddDisadvantage START ==========');
    console.log('Mastery System | Event details:', {
      type: event.type,
      target: event.target,
      currentTarget: event.currentTarget,
      isDefaultPrevented: event.isDefaultPrevented(),
      isPropagationStopped: event.isPropagationStopped()
    });
    
    event.preventDefault();
    event.stopPropagation();
    
    console.log('Mastery System | Actor details:', {
      actorId: this.actor.id,
      actorName: this.actor.name,
      isOwner: this.actor.isOwner,
      system: this.actor.system
    });
    
    // Debug: Check if DISADVANTAGES is loaded
    console.log('Mastery System | DISADVANTAGES check:', {
      exists: typeof DISADVANTAGES !== 'undefined',
      isArray: Array.isArray(DISADVANTAGES),
      length: DISADVANTAGES?.length || 0,
      content: DISADVANTAGES
    });
    
    if (!DISADVANTAGES || DISADVANTAGES.length === 0) {
      const errorMsg = 'Disadvantages list is not loaded. Please check the console for errors.';
      console.error('Mastery System | ERROR: DISADVANTAGES is empty or undefined!', {
        DISADVANTAGES: DISADVANTAGES,
        type: typeof DISADVANTAGES
      });
      ui.notifications?.error(errorMsg);
      return;
    }
    
    console.log('Mastery System | DISADVANTAGES loaded successfully, proceeding with dialog creation...');
    
    // Show selection dialog
    const disadvantageOptions = DISADVANTAGES.map(d => ({
      value: d.id,
      label: `${d.name} (${Array.isArray(d.basePoints) ? d.basePoints.join('/') : d.basePoints} pts)`
    }));
    
    console.log('Mastery System | Disadvantage options:', disadvantageOptions);
    
    const content = `
      <form>
        <div class="form-group">
          <label>Select Disadvantage:</label>
          <select name="disadvantageId" id="disadvantageId" style="width: 100%;">
            <option value="">-- Select a Disadvantage --</option>
            ${disadvantageOptions.map(opt => `<option value="${opt.value}">${opt.label}</option>`).join('')}
          </select>
        </div>
        ${disadvantageOptions.length === 0 ? '<p style="color: red;">No disadvantages available. Please check the console.</p>' : ''}
      </form>
    `;
    
    console.log('Mastery System | Creating Dialog with content:', {
      contentLength: content.length,
      optionsCount: disadvantageOptions.length,
      firstOption: disadvantageOptions[0]
    });
    
    const dialog = new Dialog({
      title: 'Add Disadvantage',
      content,
      buttons: {
        configure: {
          label: 'Configure',
          callback: async (html: JQuery) => {
            console.log('Mastery System | Configure button clicked in dialog');
            const disadvantageId = html.find('[name="disadvantageId"]').val() as string;
            console.log('Mastery System | Selected disadvantage ID:', disadvantageId);
            
            if (!disadvantageId) {
              ui.notifications?.warn('Please select a disadvantage.');
              return false;
            }
            
            const def = getDisadvantageDefinition(disadvantageId);
            console.log('Mastery System | Disadvantage definition:', def);
            
            if (!def) {
              ui.notifications?.error(`Disadvantage definition not found for ID: ${disadvantageId}`);
              return false;
            }
            
            // Open configuration dialog
            console.log('Mastery System | Opening configuration dialog for:', def.name);
            await this.#openDisadvantageConfigDialog(def);
            return true;
          }
        },
        cancel: {
          label: 'Cancel',
          callback: () => {
            console.log('Mastery System | Dialog cancelled');
          }
        }
      },
      default: 'configure',
      render: (html: JQuery) => {
        console.log('Mastery System | Dialog rendered, HTML:', html);
      }
    } as any);
    
    console.log('Mastery System | Dialog created, calling render(true)...');
    try {
      await dialog.render(true);
      console.log('Mastery System | Dialog rendered successfully!');
    } catch (error) {
      console.error('Mastery System | ERROR rendering dialog:', error);
      ui.notifications?.error('Failed to open disadvantage dialog. Check console for details.');
    }
    console.log('Mastery System | ========== #onAddDisadvantage END ==========');
  }

  /**
   * Edit Disadvantage during Creation
   */
  async #onEditDisadvantage(event: JQuery.ClickEvent) {
    event.preventDefault();
    const index = parseInt($(event.currentTarget).data('index') || '0');
    const system = (this.actor as any).system;
    const disadvantages = system.disadvantages || [];
    
    if (index < 0 || index >= disadvantages.length) return;
    
    const selection = disadvantages[index];
    const def = getDisadvantageDefinition(selection.id);
    if (!def) return;
    
    await this.#openDisadvantageConfigDialog(def, index, selection.details);
  }

  /**
   * Remove Disadvantage during Creation
   */
  async #onRemoveDisadvantage(event: JQuery.ClickEvent) {
    event.preventDefault();
    const index = parseInt($(event.currentTarget).data('index') || '0');
    const system = (this.actor as any).system;
    const disadvantages = [...(system.disadvantages || [])];
    
    if (index < 0 || index >= disadvantages.length) return;
    
    const removed = disadvantages[index];
    disadvantages.splice(index, 1);
    
    // Mark disadvantages as reviewed
    const updateData: any = { 'system.disadvantages': disadvantages };
    if (!(this.actor as any).system.creation?.disadvantagesReviewed) {
      updateData['system.creation.disadvantagesReviewed'] = true;
    }
    
    await this.actor.update(updateData);
    ui.notifications?.info(`Removed ${removed.name}`);
    this.render();
  }

  /**
   * Open Disadvantage Configuration Dialog
   */
  async #openDisadvantageConfigDialog(
    def: any,
    editIndex?: number,
    existingDetails?: Record<string, any>
  ) {
    const content = await foundry.applications.handlebars.renderTemplate('systems/mastery-system/templates/dialogs/disadvantage-config.hbs', {
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
          callback: async (html: JQuery) => {
            const details: Record<string, any> = {};
            for (const field of def.fields || []) {
              if (field.type === 'number') {
                details[field.name] = parseInt($(html).find(`[name="${field.name}"]`).val() as string) || 0;
              } else if (field.type === 'select') {
                details[field.name] = $(html).find(`[name="${field.name}"]`).val() as string;
              } else {
                details[field.name] = $(html).find(`[name="${field.name}"]`).val() as string || '';
              }
            }

            const points = calculateDisadvantagePoints(def.id, details);
            const system = (this.actor as any).system;
            const currentDisadvantages = [...(system.disadvantages || [])];
            
            // Remove the one being edited if editing
            if (editIndex !== undefined) {
              currentDisadvantages.splice(editIndex, 1);
            }
            
            // Add new selection
            const newSelection = { id: def.id, details };
            const validation = validateDisadvantageSelection([...currentDisadvantages, newSelection]);

            if (!validation.valid) {
              ui.notifications?.error(validation.error || 'Invalid disadvantage selection');
              return false;
            }

            // Update actor
            if (editIndex !== undefined) {
              currentDisadvantages[editIndex] = {
                id: def.id,
                name: def.name,
                points,
                details,
                description: def.description
              };
            } else {
              currentDisadvantages.push({
                id: def.id,
                name: def.name,
                points,
                details,
                description: def.description
              });
            }

            // Mark disadvantages as reviewed
            const updateData: any = { 'system.disadvantages': currentDisadvantages };
            if (!(this.actor as any).system.creation?.disadvantagesReviewed) {
              updateData['system.creation.disadvantagesReviewed'] = true;
            }
            
            await this.actor.update(updateData);
            ui.notifications?.info(`${editIndex !== undefined ? 'Updated' : 'Added'} ${def.name} (${points} points)`);
            this.render();
            return true;
          }
        },
        cancel: {
          icon: '<i class="fas fa-times"></i>',
          label: 'Cancel',
          callback: () => {}
        }
      },
      default: 'save'
    } as any).render(true);
  }

  /**
   * Finalize Character Creation
   */
  async #onFinalizeCreation(event: JQuery.ClickEvent) {
    event.preventDefault();
    
    const system = (this.actor as any).system;
    const masteryRank = system.mastery?.rank || 2;
    const skillPointsConfig = (CONFIG as any).MASTERY?.creation?.skillPoints || 16;
    
    // Calculate points spent
    let attributePointsSpent = 0;
    const attributeKeys = ['might', 'agility', 'vitality', 'intellect', 'resolve', 'influence', 'wits'];
    for (const key of attributeKeys) {
      const attrValue = system.attributes?.[key]?.value || masteryRank;
      if (attrValue > masteryRank) {
        attributePointsSpent += attrValue - masteryRank;
      }
    }
    
    let skillPointsSpent = 0;
    for (const skillValue of Object.values(system.skills || {})) {
      skillPointsSpent += (typeof skillValue === 'number' ? skillValue : 0);
    }
    
    const disadvantagePoints = (system.disadvantages || []).reduce((sum: number, d: any) => sum + (d.points || 0), 0);
    
    // Validate powers & magic
    const powers = this.actor.items.filter((item: any) => item.type === 'power');
    const powersAtRank2 = powers.filter((p: any) => (p.system?.level || 1) === 2);
    
    // Validate all requirements
    if (attributePointsSpent !== 16) {
      ui.notifications?.error(`Must spend exactly 16 attribute points. Currently spent: ${attributePointsSpent}`);
      return;
    }
    if (skillPointsSpent !== skillPointsConfig) {
      ui.notifications?.error(`Must spend exactly ${skillPointsConfig} skill points. Currently spent: ${skillPointsSpent}`);
      return;
    }
    // Trees are now optional - no validation needed
    if (powers.length !== 4) {
      ui.notifications?.error(`Must select exactly 4 Powers. Currently selected: ${powers.length}`);
      return;
    }
    if (powersAtRank2.length > 2) {
      ui.notifications?.error(`Maximum 2 Powers can be at Rank 2. Currently at Rank 2: ${powersAtRank2.length}`);
      return;
    }
    
    // Validate power ranks don't exceed Mastery Rank
    const invalidPowers = powers.filter((p: any) => (p.system?.level || 1) > masteryRank);
    if (invalidPowers.length > 0) {
      ui.notifications?.error(`Power ranks cannot exceed Mastery Rank ${masteryRank}. Invalid: ${invalidPowers.map((p: any) => p.name).join(', ')}`);
      return;
    }
    
    // Validate schticks per rank
    const schticksRanks = system.schticks?.ranks || [];
    const schticksRows: Array<{rank: number, schtickName: string, manifestation: string}> = [];
    for (let rank = 1; rank <= masteryRank; rank++) {
      const rankData = schticksRanks.find((r: any) => r.rank === rank);
      schticksRows.push({
        rank,
        schtickName: rankData?.schtickName || '',
        manifestation: rankData?.manifestation || ''
      });
    }
    // Schticks validation removed - no longer required
    console.log('Mastery System | Finalizing character creation - persisting schticks:', schticksRanks);
    
    // Sync Faith Fractures: Disadvantage Points = Starting Faith Fractures (both current and maximum)
    const updateData: any = {
      'system.creation.complete': true,
      'system.faithFractures.current': disadvantagePoints,
      'system.faithFractures.maximum': disadvantagePoints
    };
    
    // Ensure schticks are persisted (they should already be set, but ensure they're in the update)
    if (schticksRanks.length > 0) {
      updateData['system.schticks.ranks'] = schticksRanks;
    }
    
    try {
      await this.actor.update(updateData);
      ui.notifications?.info('Character creation complete!');
      this.render();
    } catch (error) {
      console.error('Mastery System | Failed to finalize character creation', error);
      ui.notifications?.error('Failed to finalize character creation.');
    }
  }

  /** @override */
  async _onSubmit(event: Event, options?: any) {
    // Block updates if creation is incomplete
    const creationComplete = (this.actor as any).system?.creation?.complete !== false;
    if (!creationComplete && !(game as any).user?.isGM) {
      event.preventDefault();
      ui.notifications?.warn('Character creation is incomplete. Please complete character creation first.');
      return false;
    }
    
    return super._onSubmit(event, options);
  }
}

