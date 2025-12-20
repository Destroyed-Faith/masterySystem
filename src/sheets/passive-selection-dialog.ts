/**
 * Passive Selection Dialog for Combat Start
 *
 * Shows an overlay at combat start where players select and activate their passive abilities.
 * Supports multiple characters per player with step-by-step navigation.
 * 
 * Migrated to Foundry VTT v13 ApplicationV2 + HandlebarsApplicationMixin
 */

import { getPassiveSlots, getAvailablePassives, slotPassive, activatePassive, unslotPassive } from '../powers/passives.js';

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

// Type workaround for Mixin
const BaseDialog = HandlebarsApplicationMixin(ApplicationV2) as typeof ApplicationV2;

export class PassiveSelectionDialog extends BaseDialog {
  private currentIndex: number = 0;
  private pcs: Combatant[];
  private resolve?: () => void;
  private readOnly: boolean = false;

  static DEFAULT_OPTIONS = {
    id: "mastery-passive-selection",
    classes: ["mastery-system", "passive-selection"],
    position: { width: 800 },
    window: { title: "Combat: Select Passives", resizable: false }
  };

  static PARTS = {
    content: { template: "systems/mastery-system/templates/dialogs/passive-selection.hbs" }
  };

  /**
   * Show passive selection dialog for a single combatant
   * @param combatant The combatant to show the dialog for
   * @param readOnly If true, dialog is read-only (view only, cannot change choices)
   */
  static async showForCombatant(combatant: Combatant, readOnly: boolean = false): Promise<void> {
    console.log('Mastery System | [PASSIVE DIALOG] showForCombatant', {
      combatantId: combatant.id,
      actorName: (combatant.actor as any)?.name,
      readOnly
    });

    const user = game.user;
    if (!user || (!user.isGM && !combatant.actor?.isOwner)) {
      return;
    }

    // Check singleton
    const existing = foundry.applications.instances.get("mastery-passive-selection") as PassiveSelectionDialog;
    if (existing) {
      existing.bringToFront();
      return;
    }

    return new Promise<void>(resolve => {
      const app = new PassiveSelectionDialog([combatant], resolve, readOnly);
      app.render(true);
    });
  }

  /**
   * Show passive selection dialog for all player-controlled combatants
   */
  static async showForCombat(combat: Combat): Promise<void> {
    console.log('Mastery System | [PASSIVE DIALOG] showForCombat', {
      combatId: combat.id,
      combatants: combat.combatants.size
    });

    const user = game.user;
    if (!user) return;

    // Check singleton
    const existing = foundry.applications.instances.get("mastery-passive-selection");
    if (existing) {
      (existing as any).bringToFront();
      return;
    }

    // Filter player characters owned by current user
    const pcs = combat.combatants.filter((c: Combatant) =>
      c.actor?.type === 'character' && (user.isGM || c.actor?.isOwner)
    );

    if (pcs.length === 0) {
      console.log('Mastery System | [PASSIVE DIALOG] No player characters for passive selection');
      return;
    }

    return new Promise<void>(resolve => {
      const app = new PassiveSelectionDialog(pcs, resolve);
      app.render(true);
    });
  }

  constructor(pcs: Combatant[], resolve: () => void, readOnly: boolean = false) {
    super({});
    this.pcs = pcs;
    this.resolve = resolve;
    this.readOnly = readOnly;
  }

  get currentCombatant(): Combatant | null {
    return this.pcs[this.currentIndex] ?? null;
  }

  get currentActor(): Actor | null {
    return this.currentCombatant?.actor ?? null;
  }

  protected async _prepareContext(_options: any): Promise<any> {
    const actor = this.currentActor;
    if (!actor) return {};

    const slots = getPassiveSlots(actor);
    const available = getAvailablePassives(actor);
    const masteryRank = (actor.system as any).mastery?.rank ?? 2;

    // Get used categories to filter available passives
    const usedCategories = slots
      .filter((s: any) => s.passive)
      .map((s: any) => s.passive!.category);

    const selectablePassives = available.filter((p: any) => 
      !usedCategories.includes(p.category)
    );

    return {
      actor,
      slots,
      availablePassives: selectablePassives,
      masteryRank,
      currentIndex: this.currentIndex + 1,
      total: this.pcs.length,
      isFirst: this.currentIndex === 0,
      isLast: this.currentIndex === this.pcs.length - 1,
      isGM: game.user?.isGM ?? false,
      readOnly: this.readOnly
    };
  }

  protected async _onRender(_context: any, _options: any): Promise<void> {
    const root = (this as any).element as HTMLElement;

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
      root.querySelectorAll<HTMLElement>('.js-toggle-passive, .js-unslot-passive').forEach(btn => {
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

      // Toggle passive active/inactive
      root.querySelectorAll<HTMLElement>('.js-toggle-passive').forEach(btn => {
        btn.onclick = async (ev) => {
          ev.preventDefault();
          const actor = this.currentActor;
          if (!actor) return;

          const slotIndex = Number(btn.dataset.slotIndex ?? 0);
          await activatePassive(actor, slotIndex);
          await (this as any).render({ force: true });
        };
      });

      // Unslot passive
      root.querySelectorAll<HTMLElement>('.js-unslot-passive').forEach(btn => {
        btn.onclick = async (ev) => {
          ev.preventDefault();
          const actor = this.currentActor;
          if (!actor) return;

          const slotIndex = Number(btn.dataset.slotIndex ?? 0);
          await unslotPassive(actor, slotIndex);
          await (this as any).render({ force: true });
        };
      });
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

    // Close button
    const closeBtn = root.querySelector<HTMLElement>('.js-close-dialog');
    if (closeBtn) {
      closeBtn.onclick = async (ev) => {
        ev.preventDefault();
        await this._closeExplicit();
      };
    }
  }

  private async _closeExplicit(): Promise<void> {
    if (this.resolve) {
      this.resolve();
      this.resolve = undefined;
    }
    await this.close({ closeSource: "button" });
  }

  async close(options?: any): Promise<this> {
    if (this.resolve) {
      this.resolve();
      this.resolve = undefined;
    }
    return super.close(options);
  }
}
