/**
 * Passive Selection Dialog for Combat Start
 *
 * Shows an overlay at combat start where players select and activate their passive abilities.
 * Supports multiple characters per player with step-by-step navigation.
 * 
 * Migrated to Foundry VTT v13 ApplicationV2 + HandlebarsApplicationMixin
 */

import {
  getPassiveSlots,
  getAvailablePassives,
  getSlottedPassiveIds,
  slotPassive,
  unslotPassive
} from '../powers/passives.js';
import { shouldShowEncounterDialogLocally } from '../combat/combat-permissions.js';
import { getActionEconomyActor } from '../combat/action-economy.js';
const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

// Type workaround for Mixin
const BaseDialog = HandlebarsApplicationMixin(ApplicationV2) as typeof ApplicationV2;

export type PassiveSelectionOutcome = { confirmed: boolean; alreadyOpen?: boolean };

export class PassiveSelectionDialog extends BaseDialog {
  private currentIndex: number = 0;
  private pcs: Combatant[];
  private resolve?: (outcome: PassiveSelectionOutcome) => void;
  private readOnly: boolean = false;
  private _outcomeResolved = false;

  static DEFAULT_OPTIONS = {
    id: "mastery-passive-selection",
    classes: ["mastery-system", "passive-selection"],
    position: { width: 800 },
    window: { title: "Combat: Select Passives", resizable: true }
  };

  static PARTS = {
    content: { template: "systems/mastery-system/templates/dialogs/passive-selection.hbs" }
  };

  /**
   * Show passive selection dialog for a single combatant
   * @param combatant The combatant to show the dialog for
   * @param readOnly If true, dialog is read-only (view only, cannot change choices)
   */
  static async showForCombatant(
    combatant: Combatant,
    readOnly: boolean = false
  ): Promise<PassiveSelectionOutcome> {
    const user = game.user;
    if (!user || (!user.isGM && !combatant.actor?.isOwner)) {
      return { confirmed: false };
    }

    const existing = foundry.applications.instances.get("mastery-passive-selection") as PassiveSelectionDialog;
    if (existing) {
      existing.bringToFront();
      return { confirmed: false, alreadyOpen: true };
    }

    return new Promise<PassiveSelectionOutcome>((resolve) => {
      const app = new PassiveSelectionDialog([combatant], resolve, readOnly);
      app.render(true);
    });
  }

  /**
   * Show passive selection dialog for all player-controlled combatants
   */
  static async showForCombat(combat: Combat): Promise<PassiveSelectionOutcome> {
    const user = game.user;
    if (!user) return { confirmed: false };

    const existing = foundry.applications.instances.get("mastery-passive-selection");
    if (existing) {
      (existing as any).bringToFront();
      return { confirmed: false, alreadyOpen: true };
    }

    const pcs = combat.combatants.filter((c: Combatant) =>
      c.actor?.type === 'character' && shouldShowEncounterDialogLocally(c.actor)
    );

    if (pcs.length === 0) {
      return { confirmed: false };
    }

    return new Promise<PassiveSelectionOutcome>((resolve) => {
      const app = new PassiveSelectionDialog(pcs, resolve, false);
      app.render(true);
    });
  }

  constructor(
    pcs: Combatant[],
    resolve: (outcome: PassiveSelectionOutcome) => void,
    readOnly: boolean = false
  ) {
    super({});
    this.pcs = pcs;
    this.resolve = resolve;
    this.readOnly = readOnly;
  }

  get currentCombatant(): Combatant | null {
    return this.pcs[this.currentIndex] ?? null;
  }

  get currentActor(): Actor | null {
    const raw = this.currentCombatant?.actor ?? null;
    if (!raw) return null;
    return getActionEconomyActor(raw) ?? raw;
  }

  /**
   * Who this is for belongs in the window bar, not in a header block above the
   * slots — that block cost the vertical room the slot grid needs.
   */
  get title(): string {
    const name = String((this.currentActor as { name?: string } | null)?.name ?? '').trim();
    const step = this.pcs.length > 1 ? ` (${this.currentIndex + 1}/${this.pcs.length})` : '';
    return name ? `Combat: Select Passives for ${name}${step}` : 'Combat: Select Passives';
  }

  protected async _prepareContext(_options: any): Promise<any> {
    const actor = this.currentActor;
    if (!actor) return {};

    const slots = getPassiveSlots(actor);
    const available = getAvailablePassives(actor);
    const slottedIds = getSlottedPassiveIds(actor);
    const selectablePassives = available.filter((p: any) => !slottedIds.has(String(p.id)));

    return {
      actor,
      slots,
      availablePassives: selectablePassives,
      isFirst: this.currentIndex === 0,
      isLast: this.currentIndex === this.pcs.length - 1,
      isGM: game.user?.isGM ?? false,
      readOnly: this.readOnly
    };
  }

  protected async _onRender(_context: any, _options: any): Promise<void> {
    const root = (this as any).element as HTMLElement;

    // Stepping to the next character re-renders the content only, so the frame
    // keeps the old name unless it is written here.
    const titleEl = root.querySelector?.('.window-title') as HTMLElement | null;
    if (titleEl) titleEl.textContent = this.title;

    // If read-only, disable all interactive elements
    if (this.readOnly) {
      root.classList.add('read-only');
      root.querySelectorAll<HTMLElement>('.draggable-passive').forEach(el => {
        el.draggable = false;
        el.style.opacity = '0.6';
        el.style.cursor = 'not-allowed';
      });
      root.querySelectorAll<HTMLElement>('.droppable-slot').forEach(slot => {
        slot.style.pointerEvents = 'none';
        slot.style.opacity = '0.6';
      });
      root.querySelectorAll<HTMLElement>('.js-unslot-passive').forEach(btn => {
        btn.style.display = 'none';
      });
      root.querySelectorAll<HTMLElement>('.available-passives-section').forEach(section => {
        section.style.display = 'none';
      });
    } else {
      // Drag & Drop handlers
      root.querySelectorAll<HTMLElement>('.draggable-passive').forEach(el => {
        el.draggable = true;
        el.ondragstart = (ev: DragEvent) => {
          const passiveId = el.dataset.passiveId || '';
          if (ev.dataTransfer) {
            ev.dataTransfer.effectAllowed = 'move';
            ev.dataTransfer.setData('text/plain', passiveId);
          }
          el.classList.add('dragging');
        };
        el.ondragend = () => {
          el.classList.remove('dragging');
          root.querySelectorAll('.droppable-slot').forEach(slot => slot.classList.remove('drag-over'));
        };
      });

      // Drop zones
      root.querySelectorAll<HTMLElement>('.droppable-slot').forEach(slot => {
        slot.ondragover = (ev: DragEvent) => {
          ev.preventDefault();
          if (ev.dataTransfer) ev.dataTransfer.dropEffect = 'move';
          slot.classList.add('drag-over');
        };
        slot.ondragleave = () => {
          slot.classList.remove('drag-over');
        };
        slot.ondrop = async (ev: DragEvent) => {
          ev.preventDefault();
          const actor = this.currentActor;
          if (!actor) return;

          const slotIndex = Number(slot.dataset.slotIndex ?? 0);
          const passiveId = ev.dataTransfer?.getData('text/plain') || '';

          if (!passiveId || !slot.classList.contains('empty')) return;

          await slotPassive(actor, slotIndex, passiveId);
          await (this as any).render({ force: true });
        };
      });

      // Capture-phase so the X wins over ApplicationV2 form submit / slot drag.
      if (!(root as any)._msUnslotBound) {
        (root as any)._msUnslotBound = true;
        root.addEventListener(
          'click',
          (ev: Event) => {
            const btn = (ev.target as HTMLElement | null)?.closest?.('.js-unslot-passive') as HTMLElement | null;
            if (!btn || !root.contains(btn)) return;
            ev.preventDefault();
            ev.stopPropagation();
            void this.#unslotClicked(btn);
          },
          true,
        );
      }
    }

    // Navigation: Next
    const nextBtn = root.querySelector<HTMLElement>('.js-next-character');
    if (nextBtn) {
      nextBtn.onclick = async (ev) => {
        ev.preventDefault();
        if (this.currentIndex < this.pcs.length - 1) {
          this.currentIndex++;
          await (this as any).render({ force: true });
        } else {
          await this._closeExplicit();
        }
      };
    }

    // Navigation: Previous
    const prevBtn = root.querySelector<HTMLElement>('.js-prev-character');
    if (prevBtn) {
      prevBtn.onclick = async (ev) => {
        ev.preventDefault();
        if (this.currentIndex > 0) {
          this.currentIndex--;
          await (this as any).render({ force: true });
        }
      };
    }

    // GM skip all
    const skipBtn = root.querySelector<HTMLElement>('.js-gm-skip');
    if (skipBtn) {
      skipBtn.onclick = async (ev) => {
        ev.preventDefault();
        if (game.user?.isGM) {
          await this._closeExplicit();
        }
      };
    }

    // Close button removed from footer - use header close button instead
  }

  async #unslotClicked(btn: HTMLElement): Promise<void> {
    if (this.readOnly) return;
    const actor = this.currentActor;
    if (!actor) return;
    const slotIndex = Number(btn.dataset.slotIndex ?? 0);
    try {
      await unslotPassive(actor, slotIndex);
    } catch (err) {
      const actorId = String((actor as { id?: string }).id ?? '');
      const world = actorId ? (game.actors?.get(actorId) as Actor | undefined) : undefined;
      if (world && world !== actor) {
        try {
          await unslotPassive(world, slotIndex);
        } catch (err2) {
          console.error('Mastery System | Could not clear passive slot', err2);
          ui.notifications?.error('Passive konnte nicht aus dem Slot entfernt werden.');
          return;
        }
      } else {
        console.error('Mastery System | Could not clear passive slot', err);
        ui.notifications?.error('Passive konnte nicht aus dem Slot entfernt werden.');
        return;
      }
    }
    await (this as any).render({ force: true });
  }

  private finishOutcome(confirmed: boolean): void {
    if (this._outcomeResolved) return;
    this._outcomeResolved = true;
    if (this.resolve) {
      this.resolve({ confirmed });
      this.resolve = undefined;
    }
  }

  private async _closeExplicit(): Promise<void> {
    this.finishOutcome(true);
    await super.close({ closeSource: 'button', committed: true } as any);
  }

  async close(options?: any): Promise<this> {
    const committed = options?.committed === true;
    if (!this._outcomeResolved) {
      this.finishOutcome(committed);
    }
    return super.close(options);
  }
}
