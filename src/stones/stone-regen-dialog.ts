/**
 * Stone Regeneration Dialog
 *
 * Round 2+: the player chooses which spent stones come back (Mastery Rank points).
 * Stone Powers opens afterwards.
 */

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

const BaseDialog = HandlebarsApplicationMixin(ApplicationV2) as typeof ApplicationV2;

type AttributeKey = 'might' | 'agility' | 'vitality' | 'intellect' | 'resolve' | 'influence' | 'wits';

const REGEN_ATTRS: AttributeKey[] = [
  'might',
  'agility',
  'vitality',
  'intellect',
  'resolve',
  'influence',
  'wits',
];

export class StoneRegenDialog extends BaseDialog {
  private actor: Actor;
  private regenPoints: number;
  private allocation: Record<AttributeKey, number>;
  private resolve?: (allocation: Record<AttributeKey, number> | null) => void;

  static DEFAULT_OPTIONS = {
    id: 'mastery-stone-regen',
    classes: ['mastery-system', 'stone-regen-dialog'],
    position: { width: 520 },
    window: { title: 'Steine zurückholen', resizable: false },
  };

  static PARTS = {
    content: { template: 'systems/mastery-system/templates/dialogs/stone-regen.hbs' },
  };

  static async showForActor(actor: Actor, regenPoints: number): Promise<Record<AttributeKey, number> | null> {
    return new Promise((resolve) => {
      const app = new StoneRegenDialog(actor, regenPoints, resolve);
      (app as any).render({ force: true });
    });
  }

  constructor(
    actor: Actor,
    regenPoints: number,
    resolve: (allocation: Record<AttributeKey, number> | null) => void,
  ) {
    super({});
    this.actor = actor;
    this.regenPoints = Math.max(0, Math.floor(Number(regenPoints) || 0));
    this.resolve = resolve;
    this.allocation = {
      might: 0,
      agility: 0,
      vitality: 0,
      intellect: 0,
      resolve: 0,
      influence: 0,
      wits: 0,
    };
  }

  async _prepareContext(_options: any): Promise<any> {
    const system = (this.actor as any).system;
    const stonePools = system.stonePools || {};
    const totalAllocated = Object.values(this.allocation).reduce((sum, val) => sum + val, 0);
    const remaining = this.regenPoints - totalAllocated;

    const pools = REGEN_ATTRS.map((attr) => {
      const pool = stonePools[attr] || { current: 0, max: 0, sustained: 0 };
      const max = Number(pool.max) || 0;
      const current = Number(pool.current) || 0;
      const sustained = Number(pool.sustained) || 0;
      const effectiveMax = Math.max(0, max - sustained);
      const allocated = this.allocation[attr];
      const room = Math.max(0, effectiveMax - current - allocated);
      const canRegen = max > 0 && room > 0 && remaining > 0;
      return {
        key: attr,
        name: attr.charAt(0).toUpperCase() + attr.slice(1),
        current,
        max,
        sustained,
        effectiveMax,
        allocated,
        canRegen,
        hidden: max <= 0 && attr === 'wits',
      };
    }).filter((p) => !p.hidden);

    const canTakeMore = pools.some((p) => p.canRegen);
    return {
      actor: this.actor,
      regenPoints: this.regenPoints,
      pools,
      totalAllocated,
      remaining,
      canConfirm: remaining === 0 || !canTakeMore,
    };
  }

  async _onRender(_context: any, _options: any): Promise<void> {
    super._onRender?.(_context, _options);
    const root = (this as any).element;

    root.querySelectorAll('.js-add-point').forEach((btn: HTMLElement) => {
      btn.onclick = async (ev: MouseEvent) => {
        ev.preventDefault();
        const attr = btn.dataset.attribute as AttributeKey;
        if (!attr) return;
        const totalAllocated = Object.values(this.allocation).reduce((sum, val) => sum + val, 0);
        if (totalAllocated >= this.regenPoints) {
          ui.notifications.warn('Alle Rückhol-Punkte sind verteilt.');
          return;
        }
        const system = (this.actor as any).system;
        const pool = system.stonePools?.[attr] || { current: 0, max: 0, sustained: 0 };
        const effectiveMax = Math.max(0, (Number(pool.max) || 0) - (Number(pool.sustained) || 0));
        if (Number(pool.current) + this.allocation[attr] + 1 > effectiveMax) {
          ui.notifications.warn(`${attr}: Pool ist voll.`);
          return;
        }
        this.allocation[attr]++;
        await (this as any).render({ force: true });
      };
    });

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

    const confirmBtn = root.querySelector('.js-confirm');
    if (confirmBtn) {
      (confirmBtn as HTMLElement).onclick = async (ev: MouseEvent) => {
        ev.preventDefault();
        if (this.resolve) {
          this.resolve(this.allocation);
          this.resolve = undefined;
        }
        await (this as any).close({ closeSource: 'button' });
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
