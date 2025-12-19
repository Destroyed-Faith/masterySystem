/**
 * Stone Powers Activation Dialog
 * 
 * Allows players to activate stone powers during combat
 */

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

// Type workaround for Mixin
const BaseDialog = HandlebarsApplicationMixin(ApplicationV2) as typeof ApplicationV2;

type AttributeKey = 'might' | 'agility' | 'vitality' | 'intellect' | 'resolve' | 'influence';

import { STONE_POWERS, activateStonePower, getAvailableStonePowers } from './stone-activation.js';
import { getStoneUsageCount, calculateStoneCost, getStonePool } from '../combat/action-economy.js';

export class StonePowersDialog extends BaseDialog {
  private actor: Actor;
  private combatant: Combatant | null;
  private resolve?: (success: boolean) => void;
  private _generalAttrSelection: Record<string, AttributeKey> = {}; // Track selected attribute per generic power
  
  static DEFAULT_OPTIONS = {
    id: "mastery-stone-powers",
    classes: ["mastery-system", "stone-powers-dialog"],
    position: { width: 600, height: 500 },
    window: { title: "Activate Stone Powers", resizable: true }
  };
  
  static PARTS = {
    content: { template: "systems/mastery-system/templates/dialogs/stone-powers.hbs" }
  };
  
  /**
   * Show stone powers dialog for an actor
   */
  static async showForActor(actor: Actor, combatant?: Combatant | null): Promise<boolean> {
    return new Promise(resolve => {
      const app = new StonePowersDialog(actor, combatant || null, resolve);
      (app as any).render({ force: true });
    });
  }
  
  constructor(actor: Actor, combatant: Combatant | null, resolve: (success: boolean) => void) {
    super({});
    this.actor = actor;
    this.combatant = combatant;
    this.resolve = resolve;
  }
  
  async _prepareContext(_options: any): Promise<any> {
    // Resolve combatant if not provided
    if (!this.combatant && game.combat) {
      this.combatant = game.combat.combatants.find((c: any) => c.actor?.id === (this.actor as any).id) || null;
    }
    
    const system = (this.actor as any).system;
    const stonePools = system.stonePools || {};
    const availablePowers = getAvailableStonePowers(this.actor);
    
    const attributes: AttributeKey[] = ['might', 'agility', 'vitality', 'intellect', 'resolve', 'influence'];
    
    // Filter pools to only show those with max > 0
    const pools = attributes
      .map(attr => {
        const pool = stonePools[attr];
        // Handle both object and direct value access
        const current = (pool?.current ?? pool?.value ?? 0);
        const max = (pool?.max ?? pool?.maximum ?? 0);
        const sustained = (pool?.sustained ?? 0);
        
        return {
          key: attr,
          name: attr.charAt(0).toUpperCase() + attr.slice(1),
          current: Number(current) || 0,
          max: Number(max) || 0,
          sustained: Number(sustained) || 0,
          available: (Number(current) || 0) - (Number(sustained) || 0)
        };
      })
      .filter(pool => pool.max > 0);  // Only show pools with stones
    
    // Check if actor is in combat
    const hasCombat = !!game.combat && !!this.combatant;
    const combat = game.combat;
    
    // Prepare spendable attributes for General Powers selector
    const spendableAttributes = pools.map(pool => ({
      key: pool.key,
      label: pool.name,
      current: pool.current,
      max: pool.max
    }));
    
    // Determine default attribute for generic powers
    // First pool with current > 0, else first pool with max > 0
    const defaultGeneralAttrKey: AttributeKey = (() => {
      const withCurrent = pools.find(p => p.current > 0);
      if (withCurrent) return withCurrent.key as AttributeKey;
      if (pools.length > 0) return pools[0].key as AttributeKey;
      return 'might'; // Fallback
    })();
    
    // Helper to prepare power data with cost calculation
    const preparePowerData = (power: any, attrKey: AttributeKey) => {
      // Calculate next cost based on usage count
      const usesThisTurn = hasCombat && combat 
        ? getStoneUsageCount(this.actor, attrKey, power.id, combat)
        : 0;
      const nextCost = calculateStoneCost(usesThisTurn);
      
      // Check if can afford
      const pool = getStonePool(this.actor, attrKey);
      const canAfford = pool.current >= nextCost && hasCombat;
      
      // Use description as primary, fallback to effect if description is empty
      const description = power.description || power.effect || '';
      
      return {
        id: power.id,
        name: power.name,
        description: description,
        attribute: power.attribute,
        nextCost: nextCost,
        canAfford: canAfford,
        selectedAttrKey: attrKey // For generic powers, this is the selected attribute
      };
    };
    
    // Separate generic and attribute-specific powers
    const genericPowers = availablePowers.filter(p => p.attribute === 'generic');
    const attributeSpecificPowers = availablePowers.filter(p => p.attribute !== 'generic');
    
    // Prepare General Powers with selected attributes
    const generalPowers = genericPowers.map(power => {
      // Get selected attribute for this power, or use default
      const selectedAttrKey = this._generalAttrSelection[power.id] || defaultGeneralAttrKey;
      return preparePowerData(power, selectedAttrKey);
    });
    
    // Organize attribute-specific powers by attribute section
    // Create entries for all attributes that have pools (max > 0)
    const powersByAttribute: Record<string, any[]> = {};
    
    // First, initialize arrays for all pools that exist
    for (const pool of pools) {
      powersByAttribute[pool.key] = [];
    }
    
    // Then, add powers to their respective attribute sections
    for (const power of attributeSpecificPowers) {
      const attr = power.attribute as AttributeKey;
      // Only add if this attribute has a pool (was initialized above)
      if (powersByAttribute[attr]) {
        powersByAttribute[attr].push(preparePowerData(power, attr));
      } else {
        // Debug: log powers that don't match any pool
        console.warn('Mastery System | Power not assigned - no pool for attribute:', {
          powerId: power.id,
          powerAttribute: power.attribute,
          availablePools: Object.keys(powersByAttribute)
        });
      }
    }
    
    // Debug logging to help diagnose issues
    console.log('Mastery System | Stone Powers Dialog Context:', {
      pools: pools.map(p => ({ key: p.key, current: p.current, max: p.max })),
      availablePowersCount: availablePowers.length,
      genericPowersCount: genericPowers.length,
      attributeSpecificPowersCount: attributeSpecificPowers.length,
      generalPowersCount: generalPowers.length,
      powersByAttributeKeys: Object.keys(powersByAttribute),
      powersByAttributeCounts: Object.entries(powersByAttribute).map(([key, arr]) => ({ attr: key, count: arr.length, powers: arr.map(p => p.id) }))
    });
    
    // Additional detailed logging
    console.log('Mastery System | Detailed Power Assignment:', {
      spendableAttributesCount: spendableAttributes.length,
      spendableAttributes: spendableAttributes,
      defaultGeneralAttrKey: defaultGeneralAttrKey,
      generalPowers: generalPowers.map(p => ({ id: p.id, name: p.name, selectedAttrKey: p.selectedAttrKey })),
      mightPowers: powersByAttribute['might']?.map(p => ({ id: p.id, name: p.name })) || [],
      vitalityPowers: powersByAttribute['vitality']?.map(p => ({ id: p.id, name: p.name })) || [],
      attributeSpecificPowersSample: attributeSpecificPowers.slice(0, 5).map(p => ({ id: p.id, attribute: p.attribute, name: p.name }))
    });
    
    return {
      actor: this.actor,
      pools,
      powersByAttribute,
      generalPowers,
      spendableAttributes,
      defaultGeneralAttrKey,
      hasCombat
    };
  }
  
  async _onRender(_context: any, _options: any): Promise<void> {
    super._onRender?.(_context, _options);
    
    const root = (this as any).element;
    
    // General Powers attribute selector change handlers
    root.querySelectorAll('.js-general-attr-select').forEach((select: HTMLSelectElement) => {
      select.onchange = async (ev: Event) => {
        ev.preventDefault();
        const powerId = select.dataset.powerId;
        const selectedAttrKey = select.value as AttributeKey;
        
        if (!powerId) return;
        
        // Store selection
        this._generalAttrSelection[powerId] = selectedAttrKey;
        
        // Re-render to update costs and button states
        await (this as any).render({ force: true });
      };
    });
    
    // Activate power buttons
    root.querySelectorAll('.js-activate-power').forEach((btn: HTMLElement) => {
      btn.onclick = async (ev: MouseEvent) => {
        ev.preventDefault();
        const powerId = btn.dataset.powerId;
        const attributeKey = btn.dataset.attributeKey as AttributeKey;
        
        if (!powerId) return;
        
        if (!this.combatant || !game.combat) {
          ui.notifications?.warn('Stone powers can only be activated during combat');
          return;
        }
        
        try {
          const success = await activateStonePower({
            actor: this.actor,
            combatant: this.combatant,
            abilityId: powerId,
            attributeKey: attributeKey || undefined
          });
          
          if (success) {
            ui.notifications?.info(`Activated ${STONE_POWERS[powerId]?.name || powerId}`);
            await (this as any).render({ force: true });
          } else {
            ui.notifications?.warn(`Failed to activate ${STONE_POWERS[powerId]?.name || powerId}`);
          }
        } catch (error) {
          console.error('Mastery System | Error activating stone power', error);
          ui.notifications?.error('Failed to activate stone power');
        }
      };
    });
    
    // Close button
    const closeBtn = root.querySelector('.js-close');
    if (closeBtn) {
      (closeBtn as HTMLElement).onclick = async (ev: MouseEvent) => {
        ev.preventDefault();
        if (this.resolve) {
          this.resolve(false);
          this.resolve = undefined;
        }
        await (this as any).close({ closeSource: "button" });
      };
    }
  }
  
  async _onClose(_options: any): Promise<void> {
    if (this.resolve) {
      this.resolve(false);
      this.resolve = undefined;
    }
    return super._onClose(_options);
  }
}
