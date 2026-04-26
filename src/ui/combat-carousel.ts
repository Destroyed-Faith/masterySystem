/**
 * Mastery Combat Carousel UI
 * Displays combatants as portrait cards with initiative, resources, and controls
 *
 * Stone Powers: Pro PC-Karte ein Button (Owner/GM), solange die Zuordnung nicht durch
 * `stonePowersConfigLock` gesperrt ist (erste Bewegung/Angriff/Reaktion in der Runde).
 * Vorplanen für eine künftige Runde N+1 während Runde N ohne Rundenwechsel wäre ein
 * separates Datenmodell — hier nicht umgesetzt.
 *
 * Migrated to Foundry VTT v13 ApplicationV2 + HandlebarsApplicationMixin
 */

import { requestEndTurn } from '../combat/end-turn.js';
import { isStonePowersConfigurationLocked } from '../combat/action-economy.js';
import { StonePowersDialog } from '../stones/stone-powers-dialog.js';
const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

// Type workaround for Mixin
const BaseCarousel = HandlebarsApplicationMixin(ApplicationV2) as typeof ApplicationV2;

type CarouselHookEntry = { event: string; id: number };

export class CombatCarouselApp extends BaseCarousel {
  private static _instance: CombatCarouselApp | null = null;
  private hookEntries: CarouselHookEntry[] = [];

  static DEFAULT_OPTIONS = {
    id: 'mastery-combat-carousel',
    classes: ['mastery-system', 'combat-carousel'],
    position: { width: 'auto' }, // Use CSS for full width instead of "100%"
    window: {
      title: 'Combat Carousel',
      frame: false, // No window frame (ApplicationV2 equivalent of popOut: false)
      positioned: false, // Let CSS handle positioning
      resizable: false,
      minimizable: false
    }
  };

  static PARTS = {
    content: { template: 'systems/mastery-system/templates/ui/combat-carousel.hbs' }
  };

  /**
   * Open the carousel (singleton pattern)
   */
  static open(): void {
    console.log('Mastery System | [CAROUSEL] Opening carousel');
    
    // Check for existing instance
    const existingApp = foundry.applications.instances.get('mastery-combat-carousel') as CombatCarouselApp | undefined;
    if (existingApp) {
      (existingApp as any).bringToFront();
      return;
    }
    
    if (!CombatCarouselApp._instance) {
      console.log('Mastery System | [CAROUSEL] Creating new instance');
      CombatCarouselApp._instance = new CombatCarouselApp();
    }
    console.log('Mastery System | [CAROUSEL] Rendering carousel');
    (CombatCarouselApp._instance as any).render({ force: true, focus: false });
  }

  /**
   * Close the carousel
   */
  static close(): void {
    if (CombatCarouselApp._instance) {
      (CombatCarouselApp._instance as any).close();
      CombatCarouselApp._instance = null;
    }
  }

  /**
   * Get the singleton instance
   */
  static get instance(): CombatCarouselApp | null {
    return CombatCarouselApp._instance;
  }

  /**
   * Refresh the carousel (re-render with current combat state)
   */
  static refresh(): void {
    const instance = CombatCarouselApp.instance;
    if (instance && (instance as any).rendered) {
      console.log('Mastery System | [CAROUSEL] Refreshing carousel');
      (instance as any).render({ force: true });
    }
  }

  async _prepareContext(_options: any): Promise<any> {
    const combat = game.combats?.active;
    
    console.log('Mastery System | [CAROUSEL] _prepareContext called', { 
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
    // Use combat.turns if available and has items, otherwise sort combatants by initiative
    let turns = combat.turns || [];
    if (turns.length === 0 && combat.combatants) {
      // Sort by initiative descending (highest first)
      turns = Array.from(combat.combatants.values()).sort((a: any, b: any) => {
        const aInit = a.initiative ?? 0;
        const bInit = b.initiative ?? 0;
        // If initiatives are equal, maintain original order
        if (aInit === bInit) return 0;
        return bInit - aInit;
      });
    } else if (turns.length > 0) {
      // Ensure turns are sorted by initiative (in case Foundry didn't sort them)
      turns = [...turns].sort((a: any, b: any) => {
        const aInit = a.initiative ?? 0;
        const bInit = b.initiative ?? 0;
        if (aInit === bInit) return 0;
        return bInit - aInit;
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

      // Portrait status icons removed — combat strip + HP already convey state; icons duplicated buffs/passives and confused players.
      const statusIcons: Array<{ icon: string; name?: string; tooltip?: string; kind?: string; cssClass?: string }> = [];

      // Build the segmented HP bar: one segment per health-bar (wound level).
      // Dynamically includes extra bars from passives/equipment. Each segment
      // carries a `severity` index (0=healthy-green, 1=yellow, 2=orange, 3=red,
      // 4+=dark-red) derived from its position so extra bars degrade further.
      const hpSegments: Array<{
        name: string;
        current: number;
        max: number;
        severity: number;
        widthPct: number;
      }> = [];
      let hpTotalCurrent = 0;
      let hpTotalMax = 0;
      try {
        const bars = (actor.system as any)?.health?.bars;
        if (Array.isArray(bars) && bars.length > 0) {
          for (const bar of bars) {
            const cur = Math.max(0, Math.floor(Number(bar?.current ?? 0) || 0));
            const mx = Math.max(0, Math.floor(Number(bar?.max ?? 0) || 0));
            hpTotalCurrent += cur;
            hpTotalMax += mx;
          }
          if (hpTotalMax > 0) {
            bars.forEach((bar: any, idx: number) => {
              const cur = Math.max(0, Math.floor(Number(bar?.current ?? 0) || 0));
              const mx = Math.max(0, Math.floor(Number(bar?.max ?? 0) || 0));
              const severity = Math.min(4, idx); // clamp so extras still render
              const widthPct = mx > 0 ? (mx / hpTotalMax) * 100 : 0;
              hpSegments.push({
                name: String(bar?.name ?? `Bar ${idx + 1}`),
                current: cur,
                max: mx,
                severity,
                widthPct,
              });
            });
          }
        }
      } catch (err) {
        console.warn('Mastery System | [CAROUSEL] Failed to build HP segments:', err);
      }

      // Use actor portrait, not token image
      const portraitImg = actor.img || (actor.prototypeToken as any)?.texture?.src || combatant.img;

      // At-a-glance combat totals (same numbers as the character-sheet header strip).
      let combatStrip: {
        armor: number;
        evade: number;
        showDr: boolean;
        drPct: number;
        stripTooltip?: string;
      } | null = null;
      try {
        // Re-run derived prep so `conditionExpr` that depends on token positions
        // (e.g. adjacent enemies) matches the canvas after any token has moved.
        try {
          if (typeof (actor as any).prepareDerivedData === 'function') {
            (actor as any).prepareDerivedData();
          }
        } catch {
          /* ignore */
        }
        const c: any = (actor.system as any)?.combat ?? {};
        const drPct = Math.max(0, Math.min(100, Math.floor(Number(c.damageReductionPct ?? 0) || 0)));
        const stripTooltip = (() => {
          try {
            const a = Math.floor(Number(c.armorTotal ?? 0) || 0);
            const e = Math.floor(Number(c.evadeTotal ?? 0) || 0);
            const dr = drPct;
            const ar = (c.armorBreakdownRows as any[]) || [];
            const ev = (c.evadeBreakdownRows as any[]) || [];
            const drR = (c.damageReductionRows as any[]) || [];
            const line = (rows: any[], max: number) =>
              rows
                .slice(0, max)
                .map((r: any) => `${r.label}: ${r.display ?? r.value}`)
                .join('\n');
            return [
              `Armor ${a}`,
              line(ar, 8),
              '',
              `Evade ${e}`,
              line(ev, 8),
              '',
              `DR ${dr}%`,
              line(drR, 8),
            ]
              .filter(Boolean)
              .join('\n');
          } catch {
            return '';
          }
        })();
        combatStrip = {
          armor: Math.floor(Number(c.armorTotal ?? 0) || 0),
          evade: Math.floor(Number(c.evadeTotal ?? 0) || 0),
          showDr: true,
          drPct,
          stripTooltip,
        };
      } catch {
        combatStrip = null;
      }
      
      combatants.push({
        id: combatant.id,
        name: combatant.name || actor.name,
        img: portraitImg,
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
        statusIcons: statusIcons.filter((item: any) => item && item.icon),
        hpTotalCurrent,
        hpTotalMax,
        hpSegments,
        combatStrip,
        hasToken: !!token,
        tokenId: tokenId,
        showStonePowersButton:
          actor.type === 'character' && !!(game.user?.isGM || actor.isOwner),
        stonePlanLocked:
          actor.type === 'character' && isStonePowersConfigurationLocked(actor, combat)
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

  async _onRender(_context: any, _options: any): Promise<void> {
    super._onRender?.(_context, _options);

    const root = (this as any).element;
    
    // Add body class when carousel is rendered
    document.body.classList.add('mastery-carousel-open');
    console.log('Mastery System | [CAROUSEL] Carousel rendered, body class added');

    // Register hooks for live updates (only once per render)
    this.registerUpdateHooks();

    // Portrait click - pan to token
    root.querySelectorAll('.carousel-portrait').forEach((portrait: HTMLElement) => {
      portrait.onclick = async (_ev: MouseEvent) => {
        const combatantId = portrait.dataset.combatantId;
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
      };
    });

    // Combat controls - Previous Turn
    root.querySelectorAll('.js-prev-turn').forEach((btn: HTMLElement) => {
      btn.onclick = async (ev: MouseEvent) => {
        ev.preventDefault();
        const combat = game.combats?.active;
        if (combat) {
          await combat.previousTurn();
        }
      };
    });

    // Combat controls - Next Turn
    root.querySelectorAll('.js-next-turn').forEach((btn: HTMLElement) => {
      btn.onclick = async (ev: MouseEvent) => {
        ev.preventDefault();
        const combat = game.combats?.active;
        if (combat) {
          await combat.nextTurn();
        }
      };
    });

    // Combat controls - Next Round
    root.querySelectorAll('.js-next-round').forEach((btn: HTMLElement) => {
      btn.onclick = async (ev: MouseEvent) => {
        ev.preventDefault();
        const combat = game.combats?.active;
        if (combat) {
          await combat.nextRound();
        }
      };
    });

    // Combat controls - End Combat
    root.querySelectorAll('.js-end-combat').forEach((btn: HTMLElement) => {
      btn.onclick = async (ev: MouseEvent) => {
        ev.preventDefault();
        if (game.user?.isGM) {
          const combat = game.combats?.active;
          if (combat) {
            await combat.endCombat();
          }
        }
      };
    });

    // Portrait controls - Toggle Defeated
    root.querySelectorAll('.js-toggle-defeated').forEach((btn: HTMLElement) => {
      btn.onclick = async (ev: MouseEvent) => {
        ev.preventDefault();
        ev.stopPropagation();
        
        const portrait = (btn.closest('.carousel-portrait') as HTMLElement | null);
        if (!portrait) return;
        
        const combatantId = portrait.dataset.combatantId;
        if (!combatantId) return;

        const combat = game.combats?.active;
        if (!combat) return;

        const combatant = combat.combatants.get(combatantId);
        if (!combatant) return;

        // Only GM or owner can toggle defeated
        const actor = combatant.actor;
        if (!game.user?.isGM && !actor?.isOwner) return;

        await combatant.update({ defeated: !combatant.defeated });
      };
    });

    // Portrait controls - Toggle Hidden
    root.querySelectorAll('.js-toggle-hidden').forEach((btn: HTMLElement) => {
      btn.onclick = async (ev: MouseEvent) => {
        ev.preventDefault();
        ev.stopPropagation();
        
        const portrait = (btn.closest('.carousel-portrait') as HTMLElement | null);
        if (!portrait) return;
        
        const combatantId = portrait.dataset.combatantId;
        if (!combatantId) return;

        const combat = game.combats?.active;
        if (!combat) return;

        const combatant = combat.combatants.get(combatantId);
        if (!combatant) return;

        // Only GM can toggle hidden
        if (!game.user?.isGM) return;

        await combatant.update({ hidden: !combatant.hidden });
      };
    });

    // Portrait controls - Ping
    root.querySelectorAll('.js-ping').forEach((btn: HTMLElement) => {
      btn.onclick = async (ev: MouseEvent) => {
        ev.preventDefault();
        ev.stopPropagation();
        
        const portrait = (btn.closest('.carousel-portrait') as HTMLElement | null);
        if (!portrait) return;
        
        const combatantId = portrait.dataset.combatantId;
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
      };
    });
    
    // Stone Powers (PC owners + GM)
    root.querySelectorAll('.js-carousel-stone-powers').forEach((btn: HTMLElement) => {
      btn.onclick = async (ev: MouseEvent) => {
        ev.preventDefault();
        ev.stopPropagation();
        if ((btn as HTMLButtonElement).disabled) return;

        const combatantId = btn.dataset.combatantId;
        if (!combatantId) return;

        const combat = game.combats?.active;
        if (!combat) return;

        const combatant = combat.combatants.get(combatantId);
        if (!combatant) return;

        const actor = combatant.actor;
        if (!actor || actor.type !== 'character') return;

        try {
          await StonePowersDialog.showForActor(actor as Actor, combatant);
        } catch (e) {
          console.error('Mastery System | Carousel Stone Powers failed', e);
        }
      };
    });

    // End Turn button (on current combatant card)
    root.querySelectorAll('.js-end-turn').forEach((btn: HTMLElement) => {
      btn.onclick = async (ev: MouseEvent) => {
        ev.preventDefault();
        ev.stopPropagation();
        
        await requestEndTurn();
      };
    });
  }

  async _onClose(_options: any): Promise<void> {
    // Remove hooks
    this.unregisterUpdateHooks();
    
    // Remove body class when carousel is closed
    document.body.classList.remove('mastery-carousel-open');
    console.log('Mastery System | [CAROUSEL] Carousel closed, body class removed');
    return super._onClose(_options);
  }

  /**
   * Register hooks for live HP/Stress updates
   */
  private registerUpdateHooks(): void {
    // Unregister any existing hooks first
    this.unregisterUpdateHooks();

    const reg = (event: string, id: number) => this.hookEntries.push({ event, id });

    // Hook: Update actor (for linked tokens)
    reg(
      'updateActor',
      Hooks.on('updateActor', (actor: any, updateData: any) => {
        const actorId = actor?.id || actor?._id;
        if (!actorId || !this.isRelevantActor(actorId)) return;

        const hasRelevantChange = this.hasRelevantChange(updateData, 'actor');
        if (hasRelevantChange) {
          this.debouncedRefresh();
        }
      }),
    );

    // Hook: Update token (for unlinked tokens + any token move for adjacency-based passives)
    reg(
      'updateToken',
      Hooks.on('updateToken', (tokenDoc: any, updateData: any) => {
        const posChanged =
          updateData &&
          (updateData.x !== undefined ||
            updateData.y !== undefined ||
            updateData.elevation !== undefined);
        if (posChanged && game.combats?.active?.started) {
          this.debouncedRefresh();
          return;
        }
        if (!this.isRelevantToken(tokenDoc.id)) return;

        const hasRelevantChange = this.hasRelevantChange(updateData, 'token');
        if (hasRelevantChange) {
          this.debouncedRefresh();
        }
      }),
    );

    // ActiveEffects do not always bubble into `updateActor.system` — refresh strip when buffs change.
    const onEffectChange = (effect: any) => {
      try {
        const parent = effect?.parent;
        const aid = parent?.id;
        if (aid && parent?.documentName === 'Actor' && this.isRelevantActor(aid)) {
          this.debouncedRefresh();
        }
      } catch {
        /* ignore */
      }
    };
    reg('createActiveEffect', Hooks.on('createActiveEffect', onEffectChange));
    reg('updateActiveEffect', Hooks.on('updateActiveEffect', onEffectChange));
    reg('deleteActiveEffect', Hooks.on('deleteActiveEffect', onEffectChange));
  }

  /**
   * Unregister update hooks
   */
  private unregisterUpdateHooks(): void {
    for (const { event, id } of this.hookEntries) {
      Hooks.off(event, id);
    }
    this.hookEntries = [];
  }

  /**
   * Check if an actor is relevant to any combatant in the carousel
   */
  private isRelevantActor(actorId: string): boolean {
    const combat = game.combat;
    if (!combat) return false;

    for (const combatant of combat.combatants) {
      if (combatant.actor?.id === actorId) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check if a token is relevant to any combatant in the carousel
   */
  private isRelevantToken(tokenId: string): boolean {
    const combat = game.combat;
    if (!combat) return false;

    for (const combatant of combat.combatants) {
      const combatantTokenId = combatant.tokenId || (combatant.token as any)?.id;
      if (combatantTokenId === tokenId) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check if update data contains relevant HP/Stress changes
   */
  private hasRelevantChange(updateData: any, source: 'actor' | 'token'): boolean {
    if (!updateData) return false;

    // For simplicity, always refresh if system data changed
    // (optimization: could check specific paths like system.tracked.hp, system.tracked.stress, system.health)
    if (source === 'actor') {
      return (
        updateData.system !== undefined ||
        updateData.flags?.['mastery-system'] !== undefined
      );
    } else {
      // For tokens, check delta.system or actorData.system
      return updateData.delta?.system !== undefined || 
             updateData.actorData?.system !== undefined ||
             updateData.system !== undefined;
    }
  }

  /**
   * Debounced refresh to avoid excessive re-renders
   */
  private refreshTimeout: number | null = null;
  private debouncedRefresh(): void {
    if (this.refreshTimeout !== null) {
      clearTimeout(this.refreshTimeout);
    }
    
    this.refreshTimeout = window.setTimeout(() => {
      if ((this as any).rendered) {
        CombatCarouselApp.refresh();
      }
      this.refreshTimeout = null;
    }, 150);
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
}
