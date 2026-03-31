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

const STONE_DRAG_MIME = 'application/x-mastery-stone-attribute';

/**
 * Konsole nach `StoneDnD` filtern.
 * Abschalten: in F12 `CONFIG.masterySystemDebugStoneDnD = false` (Standard ist an, bis ihr es dauerhaft ausmacht).
 */
const DEBUG_STONE_POWERS_DND = (globalThis as any).CONFIG?.masterySystemDebugStoneDnD !== false;

function dlogStoneDnD(...args: unknown[]): void {
  if (!DEBUG_STONE_POWERS_DND) return;
  console.log('Mastery System | [StoneDnD]', ...args);
}

/** Fallback wenn getData im Drop leer bleibt (z. B. Chromium/Foundry) */
let msLastDraggedStoneAttribute = '';

const ALL_STONE_ATTRS: AttributeKey[] = [
  'might',
  'agility',
  'vitality',
  'intellect',
  'resolve',
  'influence'
];

function getActorStonePoolKeysWithMax(actor: Actor): Set<string> {
  const sp = ((actor as any).system?.stonePools || {}) as Record<string, { max?: number }>;
  const keys = new Set<string>();
  for (const k of ALL_STONE_ATTRS) {
    const max = Number(sp[k]?.max) || 0;
    if (max > 0) keys.add(k);
  }
  return keys;
}

/**
 * Find the combatant row for this actor (linked sheet, prototype actor, or token document actorId).
 */
function resolveStonePowersCombatant(actor: Actor, combat: Combat): Combatant | null {
  const owner = getActionEconomyActor(actor) ?? actor;
  const sheetId = (actor as any).id as string;
  const worldId = (owner as any).id as string;
  const ids = new Set<string>([sheetId, worldId].filter(Boolean));

  for (const c of combat.combatants) {
    const ca = (c as any).actor;
    if (ca && ids.has(ca.id)) return c as Combatant;
  }
  for (const c of combat.combatants) {
    const td = (c as any).token;
    const aid = td?.actorId as string | undefined;
    if (aid && ids.has(aid)) return c as Combatant;
  }
  return null;
}

type DropSlotState = 'done' | 'active' | 'locked';

/** Max number of tier slots to show: 2^n − 1 ≤ spendable */
function visibleStoneDropSlotCount(spendable: number): number {
  if (spendable <= 0) return 0;
  return Math.floor(Math.log2(spendable + 1));
}

/** Slot visuals: active whenever genug Steine und nicht gesperrt — auch ohne laufenden Kampf (Aktivierung erst beim Drop/Button). */
function buildStoneDropSlots(
  usesThisTurn: number,
  spendable: number,
  nextCost: number,
  planLocked: boolean
): { index: number; displayCost: number; state: DropSlotState }[] {
  const visible = visibleStoneDropSlotCount(spendable);
  const count = Math.max(visible, usesThisTurn);
  const slots: { index: number; displayCost: number; state: DropSlotState }[] = [];
  for (let k = 0; k < count; k++) {
    const displayCost = calculateStoneCost(k);
    let state: DropSlotState;
    if (k < usesThisTurn) state = 'done';
    else if (k === usesThisTurn) {
      if (planLocked) state = 'locked';
      else if (spendable >= nextCost) state = 'active';
      else state = 'locked';
    } else state = 'locked';
    slots.push({ index: k, displayCost, state });
  }
  if (slots.length === 0) {
    const cost = calculateStoneCost(usesThisTurn);
    let state: DropSlotState = 'locked';
    if (!planLocked && spendable >= cost) state = 'active';
    slots.push({ index: usesThisTurn, displayCost: cost, state });
  }
  return slots;
}

/** DOM root for listeners (ApplicationV2 legt Inhalt unter part=content / .window-content). */
function getStonePowersContentRoot(app: any): HTMLElement | null {
  const el = app?.element as HTMLElement | undefined;
  if (!el) return null;
  return (
    (el.querySelector('[data-application-part="content"]') as HTMLElement) ||
    (el.querySelector('.window-content') as HTMLElement) ||
    el
  );
}

export class StonePowersDialog extends BaseDialog {
  private actor: Actor;
  private combatant: Combatant | null;
  private resolve?: (success: boolean) => void;
  private _generalAttrSelection: Record<string, AttributeKey> = {}; // Track selected attribute per generic power
  /** Partial drops toward multi-stone cost: key `${powerId}:${attr}:${uses}` */
  private _stoneDropAccumulators = new Map<string, number>();
  /** Entfernt Root‑Listener von #bindStoneDragAndDrop (bei jedem Render neu binden). */
  private _stoneDndCleanup?: () => void;

  static DEFAULT_OPTIONS = {
    id: "mastery-stone-powers",
    classes: ["mastery-system", "stone-powers-dialog"],
    position: { width: 900, height: 380 },
    window: { title: 'Steinmächte', resizable: true }
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
    const combat = game.combat;
    const combatActive = !!combat;
    if (!this.combatant && combat) {
      this.combatant = resolveStonePowersCombatant(this.actor, combat);
    }

    const system = (this.actor as any).system;
    const stonePools = system.stonePools || {};
    const availablePowers = getAvailableStonePowers(this.actor);
    
    // Filter pools to only show those with max > 0
    const pools = ALL_STONE_ATTRS
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
    
    const combatMissingFromTracker = combatActive && !this.combatant;
    const hasCombat = combatActive && !!this.combatant;
    const stonePlanLocked = !!(combat && this.combatant && isStonePowersConfigurationLocked(this.actor, combat));
    const prefsUseDefaults = !!(system.stonePowersPrefs?.useDefaultsEachRound);
    const user = game.user;
    const canSavePrefs =
      !stonePlanLocked && !!user && (user.isGM || (this.actor as any).isOwner);
    
    // Determine default attribute for generic powers
    // First pool with current > 0, else first pool with max > 0
    const defaultGeneralAttrKey: AttributeKey = (() => {
      const withCurrent = pools.find(p => p.current > 0);
      if (withCurrent) return withCurrent.key as AttributeKey;
      if (pools.length > 0) return pools[0].key as AttributeKey;
      return 'might'; // Fallback
    })();
    
    const spendableForAttr = (key: AttributeKey): number =>
      pools.find((p) => p.key === key)?.available ?? 0;

    const preparePowerData = (power: any, attrKey: AttributeKey) => {
      const usesThisTurn =
        hasCombat && combat ? getStoneUsageCount(this.actor, attrKey, power.id, combat) : 0;
      const nextCost = calculateStoneCost(usesThisTurn);
      const pool = getStonePool(this.actor, attrKey);
      const canAfford = pool.current >= nextCost && hasCombat;
      const spendable = spendableForAttr(attrKey);
      const description = power.description || power.effect || '';
      const dropSlots = buildStoneDropSlots(usesThisTurn, spendable, nextCost, stonePlanLocked);
      const gem = getStoneGemStyle(attrKey);

      return {
        id: power.id,
        name: power.name,
        description,
        attribute: power.attribute,
        nextCost,
        canAfford,
        selectedAttrKey: attrKey,
        usesThisTurn,
        dropSlots,
        slotGemStyle: gem ?? { fill: '#888888', stroke: '#aaaaaa' }
      };
    };

    const resolveGenericAttrAndStats = (powerId: string) => {
      let attrKey: AttributeKey | null = null;
      for (const [accKey, n] of this._stoneDropAccumulators) {
        if (n <= 0 || !accKey.startsWith(`${powerId}:`)) continue;
        const rest = accKey.slice(powerId.length + 1);
        const i = rest.lastIndexOf(':');
        if (i <= 0) continue;
        attrKey = rest.slice(0, i) as AttributeKey;
        break;
      }

      if (!attrKey) {
        attrKey =
          (this._generalAttrSelection[powerId] as AttributeKey | undefined) || defaultGeneralAttrKey;
        if (!pools.some((p) => p.key === attrKey)) attrKey = defaultGeneralAttrKey;
      }

      let usesThisTurn =
        hasCombat && combat ? getStoneUsageCount(this.actor, attrKey, powerId, combat) : 0;
      let spendable = spendableForAttr(attrKey);
      let nextCost = calculateStoneCost(usesThisTurn);

      const hasPartial = [...this._stoneDropAccumulators].some(
        ([k, n]) => n > 0 && k.startsWith(`${powerId}:`)
      );
      if (
        !hasPartial &&
        !stonePlanLocked &&
        spendable < nextCost &&
        pools.some((p) => spendableForAttr(p.key as AttributeKey) >= nextCost)
      ) {
        const alt = pools.find((p) => spendableForAttr(p.key as AttributeKey) >= nextCost);
        if (alt) {
          attrKey = alt.key as AttributeKey;
          spendable = spendableForAttr(attrKey);
          usesThisTurn =
            hasCombat && combat ? getStoneUsageCount(this.actor, attrKey, powerId, combat) : 0;
          nextCost = calculateStoneCost(usesThisTurn);
        }
      }

      this._generalAttrSelection[powerId] = attrKey;
      return { attrKey, usesThisTurn, spendable, nextCost };
    };
    
    // Separate generic and attribute-specific powers
    const genericPowers = availablePowers.filter(p => p.attribute === 'generic');
    const attributeSpecificPowers = availablePowers.filter(p => p.attribute !== 'generic');
    
    const generalPowers = genericPowers.map((power) => {
      const { attrKey, usesThisTurn, spendable, nextCost } = resolveGenericAttrAndStats(power.id);
      const pool = getStonePool(this.actor, attrKey);
      const canAfford = pool.current >= nextCost && hasCombat;
      const description = power.description || power.effect || '';
      const dropSlots = buildStoneDropSlots(usesThisTurn, spendable, nextCost, stonePlanLocked);
      const gem = getStoneGemStyle(attrKey);
      return {
        id: power.id,
        name: power.name,
        description,
        attribute: power.attribute,
        nextCost,
        canAfford,
        selectedAttrKey: attrKey,
        usesThisTurn,
        dropSlots,
        slotGemStyle: gem ?? { fill: '#888888', stroke: '#aaaaaa' }
      };
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
      }
      /* Keine Pool-Zeile für dieses Attribut: Macht wird nicht gelistet (z. B. ohne Steintyp). */
    }
    
    return {
      actor: this.actor,
      pools,
      powersByAttribute,
      generalPowers,
      defaultGeneralAttrKey,
      combatActive,
      combatMissingFromTracker,
      hasCombat,
      stonePlanLocked,
      /** Ziehen erlaubt sobald Runde nicht gesperrt (auch ohne Kampf — Ausführung nur im Kampf). */
      dragStonesEnabled: !stonePlanLocked,
      prefsUseDefaults,
      canSavePrefs,
      combatRound: combat?.round,
      combatLabel: combat ? `Runde ${combat.round}` : ''
    };
  }
  
  async _onRender(_context: any, _options: any): Promise<void> {
    super._onRender?.(_context, _options);

    const root = getStonePowersContentRoot(this);
    if (!root) {
      console.warn('Mastery System | StonePowersDialog: kein Content-Root für Event-Handler');
      return;
    }

    const appWindow = ((this as any).element as HTMLElement | undefined) ?? root;
    this.#bindStoneDragAndDrop(root, appWindow);
    this.#syncAccumulatorGems(appWindow);
    
    const savePrefsBtn = root.querySelector('.js-save-stone-prefs') as HTMLElement | null;
    if (savePrefsBtn) {
      savePrefsBtn.onclick = async (ev: MouseEvent) => {
        ev.preventDefault();
        if (savePrefsBtn.classList.contains('is-disabled')) return;
        await this.#saveStonePowersPrefs(root);
      };
    }

    root.querySelectorAll('.js-activate-power').forEach((el) => {
      const btn = el as HTMLElement;
      btn.onclick = async (ev: MouseEvent) => {
        ev.preventDefault();
        if ((btn as HTMLButtonElement).disabled) return;
        const powerId = btn.dataset.powerId;
        const attributeKey = btn.dataset.attributeKey as AttributeKey;

        if (!powerId) return;

        if (!this.combatant || !game.combat) {
          ui.notifications?.warn(
            'Steinmächte kannst du nur aktivieren, wenn ein Kampf läuft und die Figur im Tracker steht.'
          );
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

  /** Zeigt Steine im aktiven Ablagefeld während Teil-Aktivierung (Kosten größer 1). */
  #syncAccumulatorGems(root: HTMLElement): void {
    root.querySelectorAll('.ms-stone-slot-fill .ms-slot-gem-partial').forEach((n) => n.remove());
    for (const [accKey, count] of this._stoneDropAccumulators) {
      if (count <= 0) continue;
      const firstColon = accKey.indexOf(':');
      if (firstColon < 0) continue;
      const powerId = accKey.slice(0, firstColon);
      const rest = accKey.slice(firstColon + 1);
      const lastColon = rest.lastIndexOf(':');
      if (lastColon <= 0) continue;
      const payAttr = rest.slice(0, lastColon) as AttributeKey;
      const slot = root.querySelector(
        `.ms-stone-drop-slot.slot-active[data-power-id="${powerId}"]`
      ) as HTMLElement | null;
      if (!slot) continue;
      const fill = slot.querySelector('.ms-stone-slot-fill') as HTMLElement | null;
      if (!fill) continue;
      const style = getStoneGemStyle(payAttr);
      const fillC = style?.fill ?? '#888888';
      const strokeC = style?.stroke ?? '#aaaaaa';
      for (let i = 0; i < count; i++) {
        const gem = document.createElement('span');
        gem.className = 'ms-stone-gem-chip ms-slot-gem-partial';
        gem.style.background = fillC;
        gem.style.boxShadow = `0 0 0 2px ${strokeC} inset, 0 1px 3px rgba(0,0,0,0.45)`;
        fill.appendChild(gem);
      }
    }
  }

  /**
   * @param root Content-Part (Queries für Buttons)
   * @param bindTarget App-Fenster-Element: DnD hier binden (Foundry V2: Slots liegen zuverlässig darunter)
   */
  #bindStoneDragAndDrop(root: HTMLElement, bindTarget: HTMLElement): void {
    this._stoneDndCleanup?.();
    this._stoneDndCleanup = undefined;

    const combat = game.combat;
    const canExecute = !!combat && !!this.combatant;
    const locked = !!(combat && this.combatant && isStonePowersConfigurationLocked(this.actor, combat));
    const allowDrag = !locked;
    const poolKeys = getActorStonePoolKeysWithMax(this.actor);

    dlogStoneDnD('bind DnD', {
      bindTarget: {
        tag: bindTarget.tagName,
        id: bindTarget.id,
        cls: bindTarget.className?.toString?.()?.slice(0, 120)
      },
      root: { tag: root.tagName, cls: root.className?.toString?.()?.slice(0, 80) },
      allowDrag,
      locked,
      canExecute,
      poolKeys: [...poolKeys]
    });

    let lastDragOverLogKey = '';

    const clearDragOver = () => {
      bindTarget.querySelectorAll('.ms-stone-drop-slot.is-drag-over').forEach((n) => n.classList.remove('is-drag-over'));
    };

    root.querySelectorAll('.js-stone-draggable').forEach((el: Element) => {
      const gem = el as HTMLElement;
      gem.draggable = allowDrag;
      gem.classList.toggle('is-drag-disabled', !allowDrag);

      gem.ondragstart = (ev: DragEvent) => {
        if (!allowDrag || !ev.dataTransfer) {
          dlogStoneDnD('dragstart skipped', { allowDrag, hasDT: !!ev.dataTransfer });
          return;
        }
        const attr = gem.dataset.attributeKey || '';
        msLastDraggedStoneAttribute = attr;
        ev.dataTransfer.setData(STONE_DRAG_MIME, attr);
        ev.dataTransfer.setData('text/plain', attr);
        ev.dataTransfer.effectAllowed = 'copy';
        gem.classList.add('is-dragging');
        dlogStoneDnD('dragstart', { attr, types: ev.dataTransfer.types ? [...ev.dataTransfer.types] : [] });
      };
      gem.ondragend = () => {
        gem.classList.remove('is-dragging');
        clearDragOver();
        lastDragOverLogKey = '';
        dlogStoneDnD('dragend', { msLastDraggedStoneAttribute });
      };
    });

    const resolveDropSlot = (ev: DragEvent, logMiss: boolean): HTMLElement | null => {
      const raw = ev.target;
      const el =
        raw instanceof Element
          ? raw
          : raw && (raw as Node).parentElement instanceof Element
            ? ((raw as Node).parentElement as Element)
            : null;
      if (!el) {
        if (logMiss) dlogStoneDnD('resolveDropSlot: no element', { rawType: raw?.constructor?.name });
        return null;
      }
      if (!bindTarget.contains(el)) {
        if (logMiss)
          dlogStoneDnD('resolveDropSlot: target outside bindTarget', {
            elTag: el.tagName,
            inBind: bindTarget.contains(el)
          });
        return null;
      }
      const slot = el.closest('.ms-stone-drop-slot') as HTMLElement | null;
      if (!slot || !bindTarget.contains(slot)) {
        if (logMiss)
          dlogStoneDnD('resolveDropSlot: no .ms-stone-drop-slot ancestor', {
            elTag: el.tagName,
            elClass: (el as HTMLElement).className
          });
        return null;
      }
      return slot;
    };

    /** Ein Listener auf dem Content‑Root: vermeidet, dass Kind‑Elemente dragover „schlucken“. */
    const onRootDragOver = (ev: DragEvent) => {
      if (!allowDrag || locked) {
        return;
      }
      const slot = resolveDropSlot(ev, false);
      if (!slot?.classList.contains('slot-active')) {
        clearDragOver();
        return;
      }
      ev.preventDefault();
      if (ev.dataTransfer) ev.dataTransfer.dropEffect = 'copy';
      clearDragOver();
      slot.classList.add('is-drag-over');
      const k = `${slot.dataset.powerId ?? ''}:${slot.dataset.slotIndex ?? ''}`;
      if (k !== lastDragOverLogKey) {
        lastDragOverLogKey = k;
        dlogStoneDnD('dragover → highlight', {
          powerId: slot.dataset.powerId,
          slotIndex: slot.dataset.slotIndex,
          state: Array.from(slot.classList).filter((c) => c.startsWith('slot-'))
        });
      }
    };

    const onBindDragLeave = (ev: DragEvent) => {
      const rel = ev.relatedTarget as Node | null;
      if (rel && bindTarget.contains(rel)) return;
      clearDragOver();
    };

    const onBindDrop = async (ev: DragEvent) => {
      const pathTags = (ev.composedPath?.() || [])
        .slice(0, 12)
        .map((n) => (n instanceof Element ? n.tagName + (n.id ? `#${n.id}` : '') : String(n)));
      dlogStoneDnD('drop event', {
        target: ev.target instanceof Element ? ev.target.tagName + '.' + (ev.target as HTMLElement).className?.toString?.()?.slice(0, 80) : ev.target,
        pathHead: pathTags,
        dataTypes: ev.dataTransfer ? [...(ev.dataTransfer.types || [])] : [],
        mime: ev.dataTransfer?.getData(STONE_DRAG_MIME),
        plain: ev.dataTransfer?.getData('text/plain'),
        msLastDraggedStoneAttribute
      });

      const slot = resolveDropSlot(ev, true);
      if (!slot) {
        dlogStoneDnD('drop abort: kein Slot (resolveDropSlot null)');
        if (msLastDraggedStoneAttribute) ev.preventDefault();
        return;
      }
      ev.preventDefault();
      clearDragOver();
      if (locked) {
        dlogStoneDnD('drop abort: stonePlanLocked');
        ui.notifications?.warn('Diese Runde ist für Steinmächte gesperrt.');
        return;
      }
      if (!slot.classList.contains('slot-active')) {
        dlogStoneDnD('drop abort: Slot nicht slot-active', { classes: Array.from(slot.classList) });
        return;
      }

      const dragged =
        ev.dataTransfer?.getData(STONE_DRAG_MIME) ||
        ev.dataTransfer?.getData('text/plain') ||
        msLastDraggedStoneAttribute ||
        '';
      const powerId =
        slot.dataset.powerId ||
        (slot.closest('.power-drop-slots') as HTMLElement | null)?.dataset.powerId ||
        '';
      const isGeneric =
        slot.dataset.isGeneric === 'true' ||
        slot.getAttribute('data-is-generic') === 'true';
      dlogStoneDnD('drop resolved slot', {
        powerId,
        isGeneric,
        dragged,
        slotDataset: { ...slot.dataset }
      });

      let payAttr: AttributeKey;
      if (isGeneric) {
        payAttr = dragged as AttributeKey;
        if (!powerId || !dragged) {
          dlogStoneDnD('drop abort: generic ohne powerId oder dragged', { powerId, dragged });
          return;
        }
        if (!poolKeys.has(dragged)) {
          dlogStoneDnD('drop abort: poolKeys hat dragged nicht', { dragged, poolKeys: [...poolKeys] });
          ui.notifications?.warn('Dieser Stein gehört zu keinem Pool auf diesem Bogen.');
          return;
        }
        for (const [k, v] of this._stoneDropAccumulators) {
          if (v <= 0 || !k.startsWith(`${powerId}:`)) continue;
          const rest = k.slice(powerId.length + 1);
          const i = rest.lastIndexOf(':');
          const existingAttr = i > 0 ? rest.slice(0, i) : '';
          if (existingAttr && existingAttr !== dragged) {
            dlogStoneDnD('drop abort: anderer Typ in Akku', { existingAttr, dragged, k });
            ui.notifications?.warn('Für diese Aktivierung denselben Stein-Typ verwenden.');
            return;
          }
          break;
        }
        this._generalAttrSelection[powerId] = payAttr;
      } else {
        payAttr = (slot.dataset.payAttribute || '') as AttributeKey;
        if (!powerId || !payAttr) {
          dlogStoneDnD('drop abort: Attribut-Macht ohne powerId/payAttr', { powerId, payAttr });
          return;
        }
        if (dragged !== payAttr) {
          dlogStoneDnD('drop abort: falscher Stein', { dragged, payAttr });
          ui.notifications?.warn('Falscher Stein — Attribut passt nicht zu diesem Feld.');
          return;
        }
      }

      const uses = getStoneUsageCount(this.actor, payAttr, powerId, combat);
      const nextCost = calculateStoneCost(uses);
      const accKey = `${powerId}:${payAttr}:${uses}`;
      const cur = this._stoneDropAccumulators.get(accKey) || 0;
      if (cur >= nextCost) {
        dlogStoneDnD('drop abort: Akku schon voll', { accKey, cur, nextCost });
        return;
      }
      const next = cur + 1;
      this._stoneDropAccumulators.set(accKey, next);

      this.#syncAccumulatorGems(bindTarget);
      dlogStoneDnD('drop Akku+1', { accKey, next, nextCost, partial: next < nextCost });

      if (next < nextCost) {
        return;
      }

      if (!canExecute) {
        dlogStoneDnD('drop Ende Übung: canExecute false (kein Kampf/Tracker)', { canExecute });
        return;
      }

      this._stoneDropAccumulators.delete(accKey);
      this.#syncAccumulatorGems(bindTarget);
      dlogStoneDnD('activateStonePower aufrufen', { powerId, payAttr });

      try {
        const success = await activateStonePower({
          actor: this.actor,
          combatant: this.combatant,
          abilityId: powerId,
          attributeKey: payAttr
        });
        dlogStoneDnD('activateStonePower Ergebnis', { success });
        if (success) {
          ui.notifications?.info(`${STONE_POWERS[powerId]?.name || powerId} aktiviert`);
          await (this as any).render({ force: true });
        } else {
          if (next > 1) this._stoneDropAccumulators.set(accKey, next - 1);
          else this._stoneDropAccumulators.delete(accKey);
          this.#syncAccumulatorGems(bindTarget);
          ui.notifications?.warn('Aktivierung fehlgeschlagen.');
        }
      } catch (error) {
        console.error('Mastery System | stone drop activate', error);
        if (next > 1) this._stoneDropAccumulators.set(accKey, next - 1);
        else this._stoneDropAccumulators.delete(accKey);
        this.#syncAccumulatorGems(bindTarget);
        ui.notifications?.error('Steinmacht konnte nicht aktiviert werden.');
      }
    };

    const useCapture = true;
    bindTarget.addEventListener('dragover', onRootDragOver, useCapture);
    bindTarget.addEventListener('dragleave', onBindDragLeave);
    bindTarget.addEventListener('drop', onBindDrop, useCapture);

    this._stoneDndCleanup = () => {
      bindTarget.removeEventListener('dragover', onRootDragOver, useCapture);
      bindTarget.removeEventListener('dragleave', onBindDragLeave);
      bindTarget.removeEventListener('drop', onBindDrop, useCapture);
    };
  }

  async #saveStonePowersPrefs(root: HTMLElement): Promise<void> {
    const doc = getActionEconomyActor(this.actor) ?? this.actor;
    const useEl = root.querySelector('.js-stone-prefs-use-defaults') as HTMLInputElement | null;
    const useDefaultsEachRound = !!useEl?.checked;
    const map: Record<string, string> = {};
    for (const [pid, attr] of Object.entries(this._generalAttrSelection)) {
      map[pid] = attr;
    }

    await doc.update({
      'system.stonePowersPrefs': {
        useDefaultsEachRound,
        defaultAttributesByPowerId: map
      }
    } as any);

    ui.notifications?.info('Steinmacht-Standard gespeichert (wird bei neuen Runden übernommen, solange aktiviert).');
  }
  
  async _onClose(_options: any): Promise<void> {
    this._stoneDndCleanup?.();
    this._stoneDndCleanup = undefined;
    if (this.resolve) {
      this.resolve(false);
      this.resolve = undefined;
    }
    return super._onClose(_options);
  }
}
