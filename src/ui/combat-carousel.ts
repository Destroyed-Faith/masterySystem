/**
 * Mastery Combat Carousel UI
 * Displays combatants as portrait cards with initiative, resources, and controls
 */

export class CombatCarouselApp extends Application {
  private static _instance: CombatCarouselApp | null = null;

  static override get defaultOptions(): any {
    const baseOptions = super.defaultOptions || {};
    return foundry.utils.mergeObject(baseOptions, {
      id: 'mastery-combat-carousel',
      template: 'systems/mastery-system/templates/ui/combat-carousel.hbs',
      classes: ['mastery-system', 'combat-carousel'],
      popOut: false,
      width: '100%',
      height: 'auto',
      resizable: false,
      minimizable: false,
      title: 'Combat Carousel'
    });
  }

  /**
   * Open the carousel (singleton pattern)
   */
  static open(): void {
    console.log('Mastery System | [CAROUSEL] Opening carousel');
    if (!CombatCarouselApp._instance) {
      console.log('Mastery System | [CAROUSEL] Creating new instance');
      CombatCarouselApp._instance = new CombatCarouselApp();
    }
    console.log('Mastery System | [CAROUSEL] Rendering carousel');
    CombatCarouselApp._instance.render(true, { focus: false });
    document.body.classList.add('mastery-carousel-open');
    console.log('Mastery System | [CAROUSEL] Carousel opened, body class added');
  }

  /**
   * Close the carousel
   */
  static close(): void {
    if (CombatCarouselApp._instance) {
      CombatCarouselApp._instance.close();
      CombatCarouselApp._instance = null;
    }
    document.body.classList.remove('mastery-carousel-open');
  }

  /**
   * Get the singleton instance
   */
  static get instance(): CombatCarouselApp | null {
    return CombatCarouselApp._instance;
  }

  override async getData(): Promise<any> {
    const combat = game.combats?.active;
    
    console.log('Mastery System | [CAROUSEL] getData called', { 
      hasCombat: !!combat,
      combatId: combat?.id,
      combatantsCount: combat?.combatants?.size || 0
    });
    
    if (!combat) {
      console.log('Mastery System | [CAROUSEL] No active combat, returning inactive');
      return { active: false };
    }

    // Get settings for resource paths
    const resource1Path = (game as any).settings.get('mastery-system', 'carouselResource1Path') || 'tracked.hp';
    const resource2Path = (game as any).settings.get('mastery-system', 'carouselResource2Path') || 'tracked.stress';
    const resource1Label = (game as any).settings.get('mastery-system', 'carouselResource1Label') || 'HP';
    const resource2Label = (game as any).settings.get('mastery-system', 'carouselResource2Label') || 'Stress';

    // Build combatants array
    const combatants: any[] = [];
    // Use combat.turns if available, otherwise sort combatants by initiative
    let turns = combat.turns || [];
    if (turns.length === 0 && combat.combatants) {
      turns = Array.from(combat.combatants.values()).sort((a: any, b: any) => {
        return (b.initiative ?? 0) - (a.initiative ?? 0);
      });
    }
    
    for (const combatant of turns) {
      const actor = combatant.actor;
      if (!actor) continue;

      const tokenId = combatant.tokenId || combatant.token?.id;
      const token = tokenId ? canvas.tokens?.get(tokenId) : null;

      // Get resources from tracked fields
      const resource1 = this.getResourceValue(actor, resource1Path);
      const resource2 = this.getResourceValue(actor, resource2Path);

      // Get status icons from token effects or actor effects
      const statusIcons: string[] = [];
      if (token?.document?.effects) {
        statusIcons.push(...token.document.effects.map((e: any) => e.icon || e.img || ''));
      } else if (actor.effects) {
        statusIcons.push(...actor.effects.map((e: any) => e.icon || e.img || '').filter((i: string) => i));
      }

      combatants.push({
        id: combatant.id,
        name: combatant.name || actor.name,
        img: combatant.img || actor.img,
        initiative: combatant.initiative ?? 0,
        isCurrent: combatant.id === combat.current?.combatantId,
        hidden: combatant.hidden || false,
        defeated: combatant.defeated || false,
        resource1: {
          ...resource1,
          label: resource1Label
        },
        resource2: {
          ...resource2,
          label: resource2Label
        },
        statusIcons: statusIcons.filter((icon: string) => icon),
        hasToken: !!token,
        tokenId: tokenId
      });
    }

    return {
      active: true,
      combatants,
      controlsAllowed: game.user?.isGM || false,
      currentRound: combat.round || 1,
      currentTurn: combat.turn || 0
    };
  }

  /**
   * Safely get resource value from actor system using path
   */
  private getResourceValue(actor: any, path: string): { value: number; max: number } {
    try {
      // Resolve path like "tracked.hp" to actor.system.tracked.hp
      const parts = path.split('.');
      let current: any = actor.system;
      
      for (const part of parts) {
        if (current && typeof current === 'object' && part in current) {
          current = current[part];
        } else {
          return { value: 0, max: 0 };
        }
      }
      
      if (current && typeof current === 'object') {
        return {
          value: Number(current.value ?? 0),
          max: Number(current.max ?? 0)
        };
      }
    } catch (error) {
      console.warn('Mastery System | Failed to get resource from path', path, error);
    }
    return { value: 0, max: 0 };
  }

  // Implement required methods for Foundry VTT v13 Application
  async _renderHTML(_data?: any): Promise<JQuery> {
    console.log('Mastery System | [CAROUSEL] _renderHTML called');
    const template = (this.constructor as any).defaultOptions?.template || this.options.template;
    if (!template) {
      console.error('Mastery System | [CAROUSEL] Template path missing!');
      throw new Error('Template path is required');
    }
    console.log('Mastery System | [CAROUSEL] Template path:', template);
    const templateData = await this.getData();
    console.log('Mastery System | [CAROUSEL] Template data:', {
      active: templateData.active,
      combatantsCount: templateData.combatants?.length || 0
    });
    const html = await foundry.applications.handlebars.renderTemplate(template, templateData);
    console.log('Mastery System | [CAROUSEL] Template rendered, HTML length:', html.length);
    return $(html);
  }

  async _replaceHTML(element: JQuery, html: JQuery): Promise<void> {
    element.replaceWith(html);
  }

  override activateListeners(html: JQuery): void {
    super.activateListeners(html);

    // Portrait click - pan to token
    html.find('.carousel-portrait').on('click', async (ev) => {
      const combatantId = $(ev.currentTarget).data('combatant-id');
      if (!combatantId) return;

      const combat = game.combats?.active;
      if (!combat) return;

      const combatant = combat.combatants.get(combatantId);
      if (!combatant) return;

      const tokenId = combatant.tokenId || combatant.token?.id;
      const token = tokenId ? canvas.tokens?.get(tokenId) : null;

      if (token) {
        token.control({ releaseOthers: true });
        canvas.animatePan({
          x: token.center.x,
          y: token.center.y,
          scale: canvas.stage.scale.x
        });
      }
    });

    // Combat controls
    html.find('.js-prev-turn').on('click', async (ev) => {
      ev.preventDefault();
      const combat = game.combats?.active;
      if (combat) {
        await combat.previousTurn();
      }
    });

    html.find('.js-next-turn').on('click', async (ev) => {
      ev.preventDefault();
      const combat = game.combats?.active;
      if (combat) {
        await combat.nextTurn();
      }
    });

    html.find('.js-next-round').on('click', async (ev) => {
      ev.preventDefault();
      const combat = game.combats?.active;
      if (combat) {
        await combat.nextRound();
      }
    });

    html.find('.js-end-combat').on('click', async (ev) => {
      ev.preventDefault();
      if (game.user?.isGM) {
        const combat = game.combats?.active;
        if (combat) {
          await combat.endCombat();
        }
      }
    });

    // Portrait controls (shown on hover)
    html.find('.js-toggle-defeated').on('click', async (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      const combatantId = $(ev.currentTarget).closest('.carousel-portrait').data('combatant-id');
      if (!combatantId) return;

      const combat = game.combats?.active;
      if (!combat) return;

      const combatant = combat.combatants.get(combatantId);
      if (!combatant) return;

      // Only GM or owner can toggle defeated
      const actor = combatant.actor;
      if (!game.user?.isGM && !actor?.isOwner) return;

      await combatant.update({ defeated: !combatant.defeated });
    });

    html.find('.js-toggle-hidden').on('click', async (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      const combatantId = $(ev.currentTarget).closest('.carousel-portrait').data('combatant-id');
      if (!combatantId) return;

      const combat = game.combats?.active;
      if (!combat) return;

      const combatant = combat.combatants.get(combatantId);
      if (!combatant) return;

      // Only GM can toggle hidden
      if (!game.user?.isGM) return;

      await combatant.update({ hidden: !combatant.hidden });
    });

    html.find('.js-ping').on('click', async (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      const combatantId = $(ev.currentTarget).closest('.carousel-portrait').data('combatant-id');
      if (!combatantId) return;

      const combat = game.combats?.active;
      if (!combat) return;

      const combatant = combat.combatants.get(combatantId);
      if (!combatant) return;

      const tokenId = combatant.tokenId || combatant.token?.id;
      const token = tokenId ? canvas.tokens?.get(tokenId) : null;

      if (token) {
        canvas.ping(token.center);
      }
    });
  }
}

