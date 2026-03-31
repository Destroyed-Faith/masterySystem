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
import {
  getStoneUsageCount,
  calculateStoneCost,
  getStonePool,
  isStonePowersConfigurationLocked,
  getActionEconomyActor
} from '../combat/action-economy.js';
import { getStoneGemStyle } from '../utils/stone-attribute-ui.js';

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

    const prefs = (actor as any).system?.stonePowersPrefs;
    if (prefs?.useDefaultsEachRound && prefs.defaultAttributesByPowerId) {
      for (const [powerId, attr] of Object.entries(prefs.defaultAttributesByPowerId)) {
        if (typeof attr === 'string') {
          this._generalAttrSelection[powerId] = attr as AttributeKey;
        }
      }
    }
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
      .map((attr) => {
        const pool = stonePools[attr];
        const current = pool?.current ?? pool?.value ?? 0;
        const max = pool?.max ?? pool?.maximum ?? 0;
        const sustained = pool?.sustained ?? 0;
        const available = (Number(current) || 0) - (Number(sustained) || 0);
        const gemStyle = getStoneGemStyle(attr) ?? { fill: '#888888', stroke: '#aaaaaa' };
        const gemSlots = Array.from({ length: Math.max(0, available) }, (_, i) => ({ index: i }));

        return {
          key: attr,
          name: attr.charAt(0).toUpperCase() + attr.slice(1),
          current: Number(current) || 0,
          max: Number(max) || 0,
          sustained: Number(sustained) || 0,
          available,
          gemStyle,
          gemSlots
        };
      })
      .filter((pool) => pool.max > 0);
    
    const hasCombat = !!game.combat && !!this.combatant;
    const combat = game.combat;
    const stonePlanLocked = !!(combat && this.combatant && isStonePowersConfigurationLocked(this.actor, combat));
    const prefsUseDefaults = !!(system.stonePowersPrefs?.useDefaultsEachRound);
    const user = game.user;
    const canSavePrefs =
      !stonePlanLocked && !!user && (user.isGM || (this.actor as any).isOwner);
    
    // Prepare spendable attributes for General Powers selector
    const spendableAttributes = pools.map((pool) => ({
      key: pool.key,
      label: pool.name,
      current: pool.current,
      max: pool.max,
      gemStyle: pool.gemStyle
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
    
    const generalPowers = genericPowers.map((power) => {
      let selectedAttrKey =
        (this._generalAttrSelection[power.id] as AttributeKey | undefined) || defaultGeneralAttrKey;
      if (!pools.some((p) => p.key === selectedAttrKey)) {
        selectedAttrKey = defaultGeneralAttrKey;
      }
      this._generalAttrSelection[power.id] = selectedAttrKey;
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
        // Debug: log powers that don't match any pool (only for non-generic powers)
        // This is normal for attributes without pools (agility, intellect, etc.)
        // Changed to debug level to reduce console noise
        console.debug('Mastery System | Power not assigned - no pool for attribute:', {
          powerId: power.id,
          powerAttribute: power.attribute,
          availablePools: Object.keys(powersByAttribute)
        });
      }
    }
    
    return {
      actor: this.actor,
      pools,
      powersByAttribute,
      generalPowers,
      spendableAttributes,
      defaultGeneralAttrKey,
      hasCombat,
      stonePlanLocked,
      prefsUseDefaults,
      canSavePrefs,
      combatRound: combat?.round,
      combatLabel: combat ? `Runde ${combat.round}` : ''
    };
  }
  
  async _onRender(_context: any, _options: any): Promise<void> {
    super._onRender?.(_context, _options);
    
    const root = (this as any).element;
    
    root.querySelectorAll('.js-general-attr-select').forEach((select: HTMLSelectElement) => {
      select.onchange = async (ev: Event) => {
        ev.preventDefault();
        if (select.disabled) return;
        const powerId = select.dataset.powerId;
        const selectedAttrKey = select.value as AttributeKey;

        if (!powerId) return;

        this._generalAttrSelection[powerId] = selectedAttrKey;

        await (this as any).render({ force: true });
      };
    });
    
    const savePrefsBtn = root.querySelector('.js-save-stone-prefs') as HTMLElement | null;
    if (savePrefsBtn) {
      savePrefsBtn.onclick = async (ev: MouseEvent) => {
        ev.preventDefault();
        if (savePrefsBtn.classList.contains('is-disabled')) return;
        await this.#saveStonePowersPrefs(root);
      };
    }

    root.querySelectorAll('.js-activate-power').forEach((btn: HTMLElement) => {
      btn.onclick = async (ev: MouseEvent) => {
        ev.preventDefault();
        if ((btn as HTMLButtonElement).disabled) return;
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

  async #saveStonePowersPrefs(root: HTMLElement): Promise<void> {
    const doc = getActionEconomyActor(this.actor) ?? this.actor;
    const useEl = root.querySelector('.js-stone-prefs-use-defaults') as HTMLInputElement | null;
    const useDefaultsEachRound = !!useEl?.checked;
    const map: Record<string, string> = {};

    root.querySelectorAll('.js-general-attr-select').forEach((sel) => {
      const s = sel as HTMLSelectElement;
      const id = s.dataset.powerId;
      if (id) map[id] = s.value;
    });

    await doc.update({
      'system.stonePowersPrefs': {
        useDefaultsEachRound,
        defaultAttributesByPowerId: map
      }
    } as any);

    ui.notifications?.info('Steinmacht-Standard gespeichert (wird bei neuen Runden übernommen, solange aktiviert).');
  }
  
  async _onClose(_options: any): Promise<void> {
    if (this.resolve) {
      this.resolve(false);
      this.resolve = undefined;
    }
    return super._onClose(_options);
  }
}
