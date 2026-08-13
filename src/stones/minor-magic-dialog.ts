/**
 * Minor Magic Item workshop — pick a purchased Active, a form, and 1 Stone.
 */

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;
const BaseDialog = HandlebarsApplicationMixin(ApplicationV2) as typeof ApplicationV2;

import { poolSpendableStones } from '../utils/artifact-actor-rules.js';
import { getStoneGemStyle } from '../utils/stone-attribute-ui.js';
import {
  MINOR_MAGIC_FORM_LABELS,
  MINOR_MAGIC_FORMS,
  MINOR_MAGIC_STONE_COST,
  createMinorMagicItem,
  defaultMinorMagicName,
  listEligibleMinorMagicPowers,
  minorMagicLimit,
  minorMagicSheetView,
  snapshotPowerForMinorMagic,
  snapshotSummaryLines,
  type MinorMagicForm,
} from '../utils/minor-magic-items.js';

const POOL_ATTRS = [
  'might',
  'agility',
  'vitality',
  'intellect',
  'resolve',
  'influence',
  'wits',
] as const;

const ATTR_LABELS: Record<(typeof POOL_ATTRS)[number], string> = {
  might: 'Might',
  agility: 'Agility',
  vitality: 'Vitality',
  intellect: 'Intellect',
  resolve: 'Resolve',
  influence: 'Influence',
  wits: 'Wits',
};

export class MinorMagicDialog extends BaseDialog {
  private actor: Actor;
  private selectedPowerId = '';
  private itemForm: MinorMagicForm = 'potion';
  private itemName = '';
  private placed: string[] = [];

  static DEFAULT_OPTIONS = {
    id: 'mastery-minor-magic',
    classes: ['mastery-system', 'minor-magic-app'],
    position: { width: 820, height: 720 },
    window: { title: 'Minor Magic Items', resizable: true },
  };

  static PARTS = {
    content: { template: 'systems/mastery-system/templates/dialogs/minor-magic.hbs' },
  };

  static async show(actor: Actor, powerId?: string): Promise<void> {
    const app = new MinorMagicDialog(actor, powerId);
    await (app as any).render({ force: true });
  }

  constructor(actor: Actor, powerId?: string) {
    super({});
    this.actor = actor;
    const powers = listEligibleMinorMagicPowers(actor as any);
    this.selectedPowerId = powerId && powers.some((p) => p.id === powerId) ? powerId : (powers[0]?.id ?? '');
    this.#syncDefaultName();
  }

  #selectedPower(): any | null {
    if (!this.selectedPowerId) return null;
    return (this.actor as any).items?.get?.(this.selectedPowerId) ?? null;
  }

  #syncDefaultName(): void {
    const power = this.#selectedPower();
    this.itemName = power ? defaultMinorMagicName(this.itemForm, power.name) : '';
  }

  #canCreate(): boolean {
    const view = minorMagicSheetView(this.actor);
    return !!this.#selectedPower() && this.placed.length === MINOR_MAGIC_STONE_COST && view.remaining > 0;
  }

  async _prepareContext(_options: any): Promise<any> {
    const powers = listEligibleMinorMagicPowers(this.actor as any);
    const power = this.#selectedPower();
    const snapshot = power ? snapshotPowerForMinorMagic(this.actor, power) : null;
    const view = minorMagicSheetView(this.actor);

    const placedCount: Record<string, number> = {};
    for (const attr of this.placed) placedCount[attr] = (placedCount[attr] ?? 0) + 1;

    const pools = POOL_ATTRS.map((attr) => {
      const style = getStoneGemStyle(attr) ?? { fill: '#888888', stroke: '#aaaaaa' };
      const spendable = Math.max(0, poolSpendableStones(this.actor, attr) - (placedCount[attr] ?? 0));
      return {
        attr,
        label: ATTR_LABELS[attr],
        spendable,
        gemSlots: Array.from({ length: spendable }, (_, index) => ({
          attr,
          index,
          fill: style.fill,
          stroke: style.stroke,
        })),
      };
    }).filter((p) => p.spendable > 0 || (placedCount[p.attr] ?? 0) > 0);

    const placedAttr = this.placed[0];
    const slot = placedAttr
      ? {
          filled: true,
          label: ATTR_LABELS[placedAttr as (typeof POOL_ATTRS)[number]] ?? placedAttr,
          gemStyle: getStoneGemStyle(placedAttr) ?? { fill: '#888888', stroke: '#aaaaaa' },
        }
      : { filled: false };

    return {
      tabs: powers.map((p) => ({
        id: p.id,
        name: p.name,
        active: p.id === this.selectedPowerId,
      })),
      hasPowers: powers.length > 0,
      formOptions: MINOR_MAGIC_FORMS.map((id) => ({
        id,
        label: MINOR_MAGIC_FORM_LABELS[id],
        selected: id === this.itemForm,
      })),
      itemName: this.itemName,
      snapshot,
      snapshotLines: snapshot ? snapshotSummaryLines(snapshot) : [],
      limit: view.limit,
      held: view.held,
      remaining: view.remaining,
      pools,
      slot,
      canCreate: this.#canCreate(),
      ruleTips: [
        {
          label: 'What it stores',
          text: 'One use of a single Active Power you purchased and advanced. Artifact Powers, granted Powers, Active Buffs, and temporary Powers cannot be stored.',
        },
        {
          label: 'Snapshot',
          text: 'The item records Power Level, purchased Effects and Specials, your Attack Pool, Damage, Healing, Area, and Targets at the moment of creation. Later changes do not update it.',
        },
        {
          label: 'Form',
          text: 'Potion, grenade, rune, prepared weapon, trap, or charm is flavor only. The stored Power does not change. A Single Target Power stays Single Target even if you call it a grenade.',
        },
        {
          label: 'Limit',
          text: `You may maintain a number of Minor Magic Items equal to your Mastery Rank (${view.limit}). Items still count if given away, until used, triggered, destroyed, or dismissed.`,
        },
        {
          label: 'Stone',
          text: 'Creating burns 1 Stone of any color. That Stone cannot return on a Safe Haven Rest while the item exists. After it is used, triggered, destroyed, or dismissed, the Stone returns on the next Safe Haven Rest.',
        },
        {
          label: 'Attack',
          text: 'If the stored Power needs an attack, roll normally with the recorded Attack Pool. It does not hit automatically. Offensive items deal only the stored Power’s Damage — never the form-weapon’s Damage Dice or Specials.',
        },
      ],
    };
  }

  async #refresh(): Promise<void> {
    await this.render({ force: true });
  }

  async _onRender(_context: any, _options: any): Promise<void> {
    await (super._onRender as any)?.(_context, _options);
    const root = (this as any).element as HTMLElement;
    if (!root) return;

    root.querySelectorAll('.js-mm-tab').forEach((el) => {
      el.addEventListener('click', () => {
        const id = (el as HTMLElement).dataset.id ?? '';
        if (!id || id === this.selectedPowerId) return;
        this.selectedPowerId = id;
        this.#syncDefaultName();
        void this.#refresh();
      });
    });

    root.querySelector('.js-mm-form')?.addEventListener('change', (ev) => {
      const value = (ev.target as HTMLSelectElement).value;
      if (MINOR_MAGIC_FORMS.includes(value as MinorMagicForm)) {
        this.itemForm = value as MinorMagicForm;
        this.#syncDefaultName();
        void this.#refresh();
      }
    });

    root.querySelector('.js-mm-name')?.addEventListener('change', (ev) => {
      this.itemName = (ev.target as HTMLInputElement).value;
    });

    root.querySelectorAll('.js-mm-pool-gem').forEach((el) => {
      el.addEventListener('click', () => {
        if (this.placed.length >= MINOR_MAGIC_STONE_COST) return;
        const attr = (el as HTMLElement).dataset.attr;
        if (!attr) return;
        this.placed = [attr];
        void this.#refresh();
      });
    });

    root.querySelector('.js-mm-slot-filled')?.addEventListener('click', () => {
      this.placed = [];
      void this.#refresh();
    });

    root.querySelector('.js-mm-create')?.addEventListener('click', () => {
      void this.#create();
    });
  }

  async #create(): Promise<void> {
    if (!this.#canCreate()) return;
    const name = ((this as any).element?.querySelector('.js-mm-name') as HTMLInputElement | null)?.value
      ?? this.itemName;
    const result = await createMinorMagicItem(this.actor, {
      powerId: this.selectedPowerId,
      form: this.itemForm,
      name,
      stoneAttr: this.placed[0],
    });
    if (!result.ok) {
      (ui as any).notifications?.warn(result.error);
      return;
    }
    (ui as any).notifications?.info(`${result.item.name} added to inventory.`);
    await this.close();
  }
}
