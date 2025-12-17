/**
 * Passive Selection Dialog for Combat Start
 *
 * Shows an overlay at combat start where players select and activate their passive abilities.
 * Supports multiple characters per player with step-by-step navigation.
 */

export class PassiveSelectionDialog extends Application {
  private currentIndex: number;
  private pcs: Combatant[];
  private resolve?: () => void;

  static override get defaultOptions(): any {
    const opts = super.defaultOptions;
    opts.id = 'mastery-passive-selection';
    opts.template = 'systems/mastery-system/templates/dialogs/passive-selection.hbs';
    opts.classes = ['mastery-system', 'passive-selection'];
    opts.width = 800;
    opts.height = 'auto';
    opts.title = 'Combat: Select Passives';
    opts.popOut = true;
    opts.resizable = false;
    return opts;
  }

  /**
   * Show passive selection dialog for all player-controlled combatants
   * @param combat - The active combat
   * @returns Promise that resolves when all players finish selection
   */
  static async showForCombat(combat: Combat): Promise<void> {
    const user = game.user;
    if (!user) return;

    // Get all player character combatants owned by current user
    const pcs = combat.combatants.filter((c: Combatant) =>
      c.actor?.type === 'character' &&
      (user.isGM || c.actor?.isOwner)
    );

    if (pcs.length === 0) {
      console.log('Mastery System | No player characters for passive selection');
      return;
    }

    return new Promise<void>(resolve => {
      const app = new PassiveSelectionDialog(pcs, resolve);
      app.render(true);
    });
  }

  constructor(pcs: Combatant[], resolve: () => void) {
    super({});
    this.pcs = pcs;
    this.currentIndex = 0;
    this.resolve = resolve;
  }

  get currentCombatant(): Combatant | null {
    return this.pcs[this.currentIndex] ?? null;
  }

  get currentActor(): Actor | null {
    return this.currentCombatant?.actor ?? null;
  }

  override async getData(): Promise<any> {
    const actor = this.currentActor;
    if (!actor) return {};

    // Import passive functions dynamically (they are compiled JS modules)
    const passivesModule = await import(new URL('../powers/passives.js', import.meta.url).toString());
    const { getPassiveSlots, getAvailablePassives } = passivesModule;

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
      isGM: game.user?.isGM ?? false
    };
  }

  override activateListeners(html: JQuery): void {
    super.activateListeners(html);

    // Slot a passive
    html.find('.js-slot-passive').on('click', async (ev) => {
      ev.preventDefault();
      const actor = this.currentActor;
      if (!actor) return;

      const slotIndex = Number($(ev.currentTarget).data('slot-index') ?? 0);
      const passiveId = String($(ev.currentTarget).data('passive-id') ?? '');
      
      if (!passiveId) return;

      const passivesModule = await import(new URL('../powers/passives.js', import.meta.url).toString());
      await passivesModule.slotPassive(actor, slotIndex, passiveId);
      this.render(false);
    });

    // Toggle passive active/inactive
    html.find('.js-toggle-passive').on('click', async (ev) => {
      ev.preventDefault();
      const actor = this.currentActor;
      if (!actor) return;

      const slotIndex = Number($(ev.currentTarget).data('slot-index') ?? 0);
      
      const passivesModule = await import(new URL('../powers/passives.js', import.meta.url).toString());
      await passivesModule.activatePassive(actor, slotIndex);
      this.render(false);
    });

    // Unslot a passive
    html.find('.js-unslot-passive').on('click', async (ev) => {
      ev.preventDefault();
      const actor = this.currentActor;
      if (!actor) return;

      const slotIndex = Number($(ev.currentTarget).data('slot-index') ?? 0);
      
      const passivesModule = await import(new URL('../powers/passives.js', import.meta.url).toString());
      await passivesModule.unslotPassive(actor, slotIndex);
      this.render(false);
    });

    // Next character
    html.find('.js-next-character').on('click', (ev) => {
      ev.preventDefault();
      if (this.currentIndex < this.pcs.length - 1) {
        this.currentIndex++;
        this.render(false);
      } else {
        this.close();
      }
    });

    // Previous character
    html.find('.js-prev-character').on('click', (ev) => {
      ev.preventDefault();
      if (this.currentIndex > 0) {
        this.currentIndex--;
        this.render(false);
      }
    });

    // GM skip all
    html.find('.js-gm-skip').on('click', (ev) => {
      ev.preventDefault();
      if (game.user?.isGM) {
        this.close();
      }
    });
  }

  override async close(options?: any): Promise<void> {
    if (this.resolve) {
      this.resolve();
      this.resolve = undefined;
    }
    return super.close(options);
  }
}

