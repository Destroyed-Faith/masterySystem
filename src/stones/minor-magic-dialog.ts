/**
 * Minor Magic Item panel — pick a purchased Active and a form.
 * Lives on the character sheet tab. Create / replace only during a Safe Haven Rest.
 */

import {
  MINOR_MAGIC_FORM_LABELS,
  MINOR_MAGIC_FORMS,
  MINOR_MAGIC_REST_REQUIRED,
  canManageMinorMagic,
  createMinorMagicItem,
  defaultMinorMagicName,
  listEligibleMinorMagicPowers,
  minorMagicSheetView,
  snapshotPowerForMinorMagic,
  snapshotSummaryLines,
  type MinorMagicForm,
} from '../utils/minor-magic-items.js';

export class MinorMagicPanel {
  actor: Actor;
  selectedPowerId = '';
  itemForm: MinorMagicForm = 'potion';
  itemName = '';
  private onRefresh: () => void | Promise<void>;

  constructor(actor: Actor, opts: { onRefresh: () => void | Promise<void> }) {
    this.actor = actor;
    this.onRefresh = opts.onRefresh;
    this.#ensurePower();
  }

  #ensurePower(): void {
    const powers = listEligibleMinorMagicPowers(this.actor);
    if (this.selectedPowerId && powers.some((p) => p.id === this.selectedPowerId)) {
      if (!this.itemName) this.#syncDefaultName();
      return;
    }
    this.selectedPowerId = powers[0]?.id ?? '';
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
    return !!this.#selectedPower() && view.remaining > 0 && canManageMinorMagic(this.actor);
  }

  prepareContext(): Record<string, unknown> {
    this.#ensurePower();
    const powers = listEligibleMinorMagicPowers(this.actor);
    const power = this.#selectedPower();
    const snapshot = power ? snapshotPowerForMinorMagic(this.actor, power) : null;
    const view = minorMagicSheetView(this.actor);

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
      canManage: view.canManage,
      canCreate: this.#canCreate(),
      restHint: view.canManage ? '' : MINOR_MAGIC_REST_REQUIRED,
      ruleTips: [
        {
          label: 'Safe Haven',
          text: 'Create, replace, or dismiss only during a Safe Haven Rest. Use the Safe Haven Rest button on this tab, then fill empty places. Existing items stay and still count, even if someone else carries them.',
        },
        {
          label: 'What it stores',
          text: 'One use of a single Active Power you purchased and advanced. Artifact Powers, granted Powers, Active Buffs, and temporary Powers cannot be stored. No Stones, currency, or special materials.',
        },
        {
          label: 'Snapshot',
          text: 'The item records Power Level, purchased Effects and Specials, your Attack Pool, Damage, Healing, Area, and Targets at the moment of creation. Later changes do not update it.',
        },
        {
          label: 'Form',
          text: 'Potion, grenade, rune, prepared weapon, trap, or charm is flavor only. Any object named in the description must be present, but gives no mechanical benefit. A Single Target Power stays Single Target even if you call it a grenade.',
        },
        {
          label: 'Limit',
          text: `You may maintain a number of Minor Magic Items equal to your Mastery Rank (${view.limit}).`,
        },
        {
          label: 'Attack',
          text: 'If the stored Power needs an attack, roll normally with the recorded Attack Pool. It does not hit automatically. Offensive items deal only the stored Power’s Damage — never the form-weapon’s Damage Dice or Specials.',
        },
      ],
    };
  }

  bind(root: HTMLElement): void {
    root.querySelectorAll('.js-mm-tab').forEach((el) => {
      el.addEventListener('click', (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        const id = (el as HTMLElement).dataset.id ?? '';
        if (!id || id === this.selectedPowerId) return;
        this.selectedPowerId = id;
        this.#syncDefaultName();
        void this.onRefresh();
      });
    });

    root.querySelector('.js-mm-form')?.addEventListener('change', (ev) => {
      const value = (ev.target as HTMLSelectElement).value;
      if (MINOR_MAGIC_FORMS.includes(value as MinorMagicForm)) {
        this.itemForm = value as MinorMagicForm;
        this.#syncDefaultName();
        void this.onRefresh();
      }
    });

    root.querySelector('.js-mm-name')?.addEventListener('change', (ev) => {
      this.itemName = (ev.target as HTMLInputElement).value;
    });

    root.querySelector('.js-mm-create')?.addEventListener('click', (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      const name = (root.querySelector('.js-mm-name') as HTMLInputElement | null)?.value ?? this.itemName;
      void this.#create(name);
    });
  }

  async #create(name: string): Promise<void> {
    if (!this.#canCreate()) return;
    const result = await createMinorMagicItem(this.actor, {
      powerId: this.selectedPowerId,
      form: this.itemForm,
      name,
    });
    if (!result.ok) {
      (ui as any).notifications?.warn(result.error);
      return;
    }
    (ui as any).notifications?.info(`${result.item.name} added to inventory.`);
    this.#syncDefaultName();
    await this.onRefresh();
  }
}

/** @deprecated Panel is on the sheet now. */
export const MinorMagicDialog = {
  async show(actor: Actor): Promise<void> {
    const sheet = (actor as any).sheet as { openMinorMagicPanel?: () => Promise<void> } | undefined;
    if (sheet?.openMinorMagicPanel) {
      await sheet.openMinorMagicPanel();
      return;
    }
    (ui as any).notifications?.warn('Open the character sheet to create a Minor Magic Item.');
  },
};
