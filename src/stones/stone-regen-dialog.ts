/**
 * Stone Regeneration Dialog
 * 
 * Shown at the start of each round for PCs to allocate their
 * Mastery Rank worth of stone regeneration across attributes
 */

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

// Type workaround for Mixin
const BaseDialog = HandlebarsApplicationMixin(ApplicationV2) as typeof ApplicationV2;

type AttributeKey = 'might' | 'agility' | 'vitality' | 'intellect' | 'resolve' | 'influence';

export class StoneRegenDialog extends BaseDialog {
  private actor: Actor;
  private regenPoints: number;
  private allocation: Record<AttributeKey, number>;
  private resolve?: (allocation: Record<AttributeKey, number> | null) => void;
  
  static DEFAULT_OPTIONS = {
    id: "mastery-stone-regen",
    classes: ["mastery-system", "stone-regen-dialog"],
    position: { width: 500 },
    window: { title: "Stone Regeneration", resizable: false }
  };
  
  static PARTS = {
    content: { template: "systems/mastery-system/templates/dialogs/stone-regen.hbs" }
  };
  
  /**
   * Show stone regen dialog for an actor
   */
  static async showForActor(actor: Actor, regenPoints: number): Promise<Record<AttributeKey, number> | null> {
    return new Promise(resolve => {
      const app = new StoneRegenDialog(actor, regenPoints, resolve);
      (app as any).render({ force: true });
    });
  }
  
  constructor(actor: Actor, regenPoints: number, resolve: (allocation: Record<AttributeKey, number> | null) => void) {
    super({});
    this.actor = actor;
    this.regenPoints = regenPoints;
    this.resolve = resolve;
    
    // Initialize allocation to 0 for all attributes
    this.allocation = {
      might: 0,
      agility: 0,
      vitality: 0,
      intellect: 0,
      resolve: 0,
      influence: 0
    };
  }
  
  async _prepareContext(_options: any): Promise<any> {
    const system = (this.actor as any).system;
    const stonePools = system.stonePools || {};
    
    const attributes: AttributeKey[] = ['might', 'agility', 'vitality', 'intellect', 'resolve', 'influence'];
    
    const pools = attributes.map(attr => {
      const pool = stonePools[attr] || { current: 0, max: 0, sustained: 0 };
      const effectiveMax = pool.max - (pool.sustained || 0);
      const canRegen = pool.current < effectiveMax;
      
      return {
        key: attr,
        name: attr.charAt(0).toUpperCase() + attr.slice(1),
        current: pool.current,
        max: pool.max,
        sustained: pool.sustained || 0,
        effectiveMax,
        allocated: this.allocation[attr],
        canRegen
      };
    });
    
    const totalAllocated = Object.values(this.allocation).reduce((sum, val) => sum + val, 0);
    const remaining = this.regenPoints - totalAllocated;
    
    return {
      actor: this.actor,
      regenPoints: this.regenPoints,
      pools,
      totalAllocated,
      remaining,
      canConfirm: remaining === 0
    };
  }
  
  async _onRender(_context: any, _options: any): Promise<void> {
    super._onRender?.(_context, _options);
    
    const root = (this as any).element;
    
    // + buttons
    root.querySelectorAll('.js-add-point').forEach((btn: HTMLElement) => {
      btn.onclick = async (ev: MouseEvent) => {
        ev.preventDefault();
        const attr = btn.dataset.attribute as AttributeKey;
        if (!attr) return;
        
        const totalAllocated = Object.values(this.allocation).reduce((sum, val) => sum + val, 0);
        if (totalAllocated >= this.regenPoints) {
          ui.notifications.warn('All regen points allocated!');
          return;
        }
        
        const system = (this.actor as any).system;
        const pool = system.stonePools?.[attr] || { current: 0, max: 0, sustained: 0 };
        const effectiveMax = pool.max - (pool.sustained || 0);
        const newValue = pool.current + this.allocation[attr] + 1;
        
        if (newValue > effectiveMax) {
          ui.notifications.warn(`Cannot exceed ${effectiveMax} ${attr} stones!`);
          return;
        }
        
        this.allocation[attr]++;
        await (this as any).render({ force: true });
      };
    });
    
    // - buttons
    root.querySelectorAll('.js-remove-point').forEach((btn: HTMLElement) => {
      btn.onclick = async (ev: MouseEvent) => {
        ev.preventDefault();
        const attr = btn.dataset.attribute as AttributeKey;
        if (!attr) return;
        
        if (this.allocation[attr] > 0) {
          this.allocation[attr]--;
          await (this as any).render({ force: true });
        }
      };
    });
    
    // Confirm button
    const confirmBtn = root.querySelector('.js-confirm');
    if (confirmBtn) {
      (confirmBtn as HTMLElement).onclick = async (ev: MouseEvent) => {
        ev.preventDefault();
        
        const totalAllocated = Object.values(this.allocation).reduce((sum, val) => sum + val, 0);
        if (totalAllocated !== this.regenPoints) {
          ui.notifications.warn(`You must allocate all ${this.regenPoints} regen points!`);
          return;
        }
        
        if (this.resolve) {
          this.resolve(this.allocation);
          this.resolve = undefined;
        }
        await (this as any).close({ closeSource: "button" });
      };
    }
    
    // Skip button
    const skipBtn = root.querySelector('.js-skip');
    if (skipBtn) {
      (skipBtn as HTMLElement).onclick = async (ev: MouseEvent) => {
        ev.preventDefault();
        
        if (this.resolve) {
          this.resolve(null); // No regen
          this.resolve = undefined;
        }
        await (this as any).close({ closeSource: "button" });
      };
    }
  }
  
  async _onClose(_options: any): Promise<void> {
    if (this.resolve) {
      this.resolve(null);
      this.resolve = undefined;
    }
    return super._onClose(_options);
  }
}

