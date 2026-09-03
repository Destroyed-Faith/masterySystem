/**
 * Character Sheet for Mastery System
 * Main player character sheet with tabs for attributes, skills, powers, etc.
 */

import { MasteryActor } from '../documents/actor';
import { SKILLS, SKILL_CATEGORIES } from '../utils/skills';
import { getEquippedPhysicalSkillPenaltyDice } from '../utils/equipment-modifiers.js';
import {
  buildSkillRollPoolPreview,
  getSkillRollDicePool,
  isSkillFullPoolReady,
  reducedSkillAttributePool,
  skillFullPoolThreshold,
} from '../dice/roll-context-build.js';
import {
  DISADVANTAGES,
  getDisadvantageDefinition,
  calculateDisadvantagePoints,
  validateDisadvantageSelection,
  detailsForMentalRestrictionsDialog,
  detailsForPhysicalScarsDialog
} from '../system/disadvantages';
import { getAllSchticks } from '../utils/schticks';
import { showEchoCardPickDialog, showEchoCreationDialog } from './character-sheet-echo-dialog.js';
import { openCharacterPrintSheet } from './character-print.js';
import {
  getCardOption,
  getEcho,
  getEchoCard,
  getEchoSubChoice,
  getUnlockedCardSlots,
  isEchoCardLicensed,
  removeSelectedEchoCard
} from '../utils/echos/index.js';
import { CATEGORY_LABELS, CATEGORY_ORDER, CREATION_OFFENSIVE_RANK, creationPowerRequirementsForMasteryRank, countPowersByCategory, findDuplicatePowerLabel, resolvePowerCategoryFromItem } from '../utils/power-catalog.js';
import { hasTowerWizardPackage } from '../creation/tower-wizard/tower-wizard-apply.js';
import { showTowerWizardDialog } from '../creation/tower-wizard/tower-wizard-dialog.js';
import { showPowerCreationDialog } from './character-sheet-power-dialog.js';
import { validateTowerWizardCreation } from '../creation/tower-wizard/tower-wizard-validation.js';
import { getLanguage as getLanguageDef, normalizeKnownLanguages } from '../utils/languages.js';
import { showLanguagesDialog } from './languages-dialog.js';
import type { PowerCategory } from '../types/item.js';
import { collectInventoryBandRects, findFirstFit, fitsInGrid, itemInventorySize, occupiesInventoryGrid, parseInventorySize, rectsOverlap } from '../utils/inventory-grid';
import { isLegacyUnarmedItem } from '../utils/unarmed-fallback.js';
import { loadZoneFromBands, movementPenaltyForLoad, LOAD_ZONE_LABEL, ZONE_WIDTH_COLS } from '../utils/encumbrance.js';
import { getFilePickerClass } from '../utils/foundry-v14.js';
import {
  bindImageUrlBar,
  buildImageUrlBarHtml,
  copyDocumentImageLink,
} from '../ui/image-url-share.js';
import { SummonBondDialog } from '../stones/summon-bond-dialog.js';
import { RitualWorkshopController } from '../stones/ritual-workshop-dialog.js';
import { MinorMagicPanel } from '../stones/minor-magic-dialog.js';
import {
  canGiveBackMinorMagic,
  dismissMinorMagicItem,
  giveMinorMagicItemToActor,
  listMinorMagicGiveTargets,
  minorMagicSheetView,
  readMinorMagicFlag,
  returnMinorMagicItemToCreator,
  useMinorMagicItem,
} from '../utils/minor-magic-items.js';
import { applySafeHavenRest, SAFE_HAVEN_REST_INFO } from '../utils/safe-haven-rest.js';
import {
  buildConsumableSlotView,
  equippedConsumableActionRows,
  equipConsumableToSlot,
  isConsumableItem,
  itemOccupyingConsumableSlot,
  listCarriedConsumableItems,
  readConsumableSlotIndex,
  transferConsumableToActor,
  unequipConsumable,
  useEquippedConsumable,
  validateUnequipConsumable,
} from '../utils/consumable-slots.js';
import {
  dissolveSummonBond,
  getSummonBondsFromActor,
  tokensSummary,
} from '../stones/summon-bond-bind.js';
import { deleteSummonActor } from '../stones/familiar-actor-factory.js';
import { buildPostCreationSnapshot } from '../utils/xp-post-creation.js';
import { creationGuideFlags } from '../utils/creation-tab-guide.js';
import { findLegacyDialogRoot, scheduleCenterLegacyDialog } from '../utils/legacy-dialog-resize.js';
import { resetCharacterForRecreation, listEquippedGeneralArtifacts } from '../utils/reset-character.js';
import {
  buildCancelSkillsRedistributeUpdates,
  buildFinishSkillsRedistributeUpdates,
  buildStartSkillsRedistributeUpdates,
  canStartSkillsRedistribute,
  getCreationSkillBudget,
  isSkillsRedistributing,
  nextCreationSkillValue,
  prevCreationSkillValue,
  validateCreationSkillAllocation,
} from '../utils/skills-redistribute.js';
import { getDefaultInventorySizeForItemData } from '../utils/seed-general-items';
import { bindReliableControlClick, makeFoundryTooltipInert } from '../ui/tooltip-passthrough.js';
import { getNormalizedEquipSlots, listCarriedItemsForPaperdollSlot, normalizeSlotKey } from '../utils/equip-slots.js';
import {
  canMarkTwoHandedGrip,
  ensureWeaponSets,
  isHiddenInInactiveWeaponSet,
  isNaturallyTwoHandedItem,
  peekWeaponSets,
  swapWeaponSet,
  syncActiveWeaponSetFromHands,
} from '../utils/weapon-sets.js';
import {
  canLoadAmmunitionOnto,
  findAmmoContainerFromDropPath,
  isAmmoContainer,
  isAmmunitionItem,
  loadAmmunitionIntoContainer,
  quiverAmmunitionLabel,
  requiresAmmunition,
  validateHandEquip,
} from '../utils/ammunition.js';
import { XP_COSTS, attributeBandCost, powerLevelCost } from '../utils/constants';
import { calculateMaxPowerLevel, calculateMaxSkillRank } from '../utils/calculations.js';
import { buildSkillUseBoxes } from '../utils/skill-use-boxes.js';
import { getPowerDefinitionRank } from '../utils/power-definition-rank.js';
import { getPowerMinLevel as resolvePowerMinLevel } from '../utils/power-xp-refund.js';
import { matchesMasteryWeaponCatalog } from '../utils/weapons';
import { buildRadialManeuverPrefsContext, isOptInRadialManeuverId } from '../utils/radial-maneuver-prefs.js';
import { buildCombatSensesPanelContext, normalizeCombatSensesData } from '../combat/combat-sense-collection.js';
import type { CombatSenseId } from '../combat/combat-senses.js';
import { getActiveBuffs } from '../utils/active-buffs.js';
import { resyncActorPowerTemplates } from '../migrations/power-template-resync-migration.js';
import { buildArtifactEvolutionCards } from '../artifacts/artifact-evolution-actions.js';
import { isArtifactLinkedOnActor } from '../utils/artifact-actor-rules.js';
import { actorHasProgressionArtifacts } from '../utils/artifact-tree-grant.js';
import {
  applyAttributePendingChanges,
  applyPowerPendingChanges,
  applySkillPendingChanges,
  calculateAttributePendingNetCost,
  calculatePowerPendingNetCost,
  calculateSingleSkillPendingXpNet,
  calculateSkillPendingNetCost,
} from '../progression/progression-hub-actions.js';
import { appendXpHistory, buildBandedStepEntries, currentXpUser } from '../utils/xp-history.js';
import type { MinorExpressionAttribute } from '../utils/minor-expressions.js';
import { isEchoBoundArtifact, isEchoArtifactInventoryHidden } from '../utils/echo-artifact-equip.js';
// Removed: showWeaponCreationDialog, showArmorCreationDialog, showShieldCreationDialog
// Replaced with General Items Storage and Store dialogs

import { bindManualSheetTabs, bindEditImage } from './sheet-v2-compat.js';
import {
  buildCharacterStatusRows,
  reduceCharacterStatusRow,
  removeCharacterStatusRow,
} from './character-status-panel.js';
import { canCurrentUserUpdateDocument } from '../combat/combat-permissions.js';
import { coerceStatusEffectsArray } from '../system/active-specials.js';

// ApplicationV2 actor sheet base (Foundry v13+): DocumentSheetV2 form handling
// + Handlebars part rendering.
const BaseActorSheet: any = foundry.applications.api.HandlebarsApplicationMixin(
  foundry.applications.sheets.ActorSheetV2,
);

/**
 * True when an item is an Echo-bound artifact that is locked into its slot
 * (Elven Stride, Wyrm/Serpent Scales, Dragon Claws, Dragon Head, etc.). Such
 * items are auto-equipped at creation and can never be unequipped, displaced,
 * or deleted by the player.
 */
function isEchoLockedItem(item: any): boolean {
  return isEchoBoundArtifact(item);
}

const EQUIP_SLOT_FILL_MENU_ID = 'df-equip-slot-fill-menu';

function localizeSheet(key: string, fallback: string, data?: Record<string, string>): string {
  const i18n = (globalThis as any).game?.i18n;
  const raw = data
    ? i18n?.format?.(key, data)
    : i18n?.localize?.(key);
  if (typeof raw === 'string' && raw && raw !== key) return raw;
  if (!data) return fallback;
  return Object.entries(data).reduce((text, [k, v]) => text.replace(`{${k}}`, v), fallback);
}

function escapeSheetHtml(value: string): string {
  const fn = (globalThis as any).foundry?.utils?.escapeHTML;
  if (typeof fn === 'function') return fn(value);
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export class MasteryCharacterSheet extends BaseActorSheet {
  /** Preserves <details open> for Token-Radial prefs across re-renders (checkbox updates call render). */
  private _radialManeuverPrefsDetailsOpen?: boolean;
  /**
   * Preserves <details open> for the grouped powers list.
   * `undefined` means first paint: expanded (see getData: `!== false`).
   */
  private _powersListDetailsOpen?: boolean;

  /** Block nested render() while a paint is in flight. */
  #isRendering = false;
  /** One attribute-baseline migration attempt per sheet instance. */
  #attributeBaselinesMigrationDone = false;
  /** Prevent overlapping catalog power resyncs from nested sheet renders. */
  #powerCatalogResyncInFlight = false;

  /** Last pointer-down on equipment tile (for click vs drag distinction). */
  #itemInfoPointerDown: { itemId: string; x: number; y: number } | null = null;
  #equipSlotFillMenuAbort: AbortController | null = null;
  #sheetGmMenuAbort: AbortController | null = null;
  private _pendingAttributeChanges: Record<string, number> = {}; // Signed pending attribute deltas (XP mode)
  private _pendingPowerLevelChanges: Record<string, number> = {}; // Track pending power level increases
  private _pendingSkillRankChanges: Record<string, number> = {}; // Track pending skill rank changes (signed)

  #setHeaderXpDisplay(value: number) {
    const html = $(this.element);
    const el = html.find('#sheet-xp-display');
    if (!el.length) return;
    const n = Number(value);
    const total = Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
    const free = Math.max(0, Math.floor(Number((this.actor.system as any)?.points?.xpFree ?? 0)));
    el.text(free > 0 ? `${total} (★${free})` : String(total));
    el.attr('title', free > 0 ? `${total} XP gesamt, davon ${free} Free XP (frei verteilbar)` : 'Verfügbare XP');
  }

  /** Active tab, preserved across re-renders (see sheet-v2-compat tabs helper). */
  activeTab?: string;
  #ritualWorkshop?: RitualWorkshopController;
  #minorMagicPanel?: MinorMagicPanel;

  #getRitualWorkshop(): RitualWorkshopController {
    if (!this.#ritualWorkshop) {
      this.#ritualWorkshop = new RitualWorkshopController(this.actor as Actor, {
        onRefresh: () => this.render(false),
      });
    }
    this.#ritualWorkshop.actor = this.actor as Actor;
    return this.#ritualWorkshop;
  }

  #getMinorMagicPanel(): MinorMagicPanel {
    if (!this.#minorMagicPanel) {
      this.#minorMagicPanel = new MinorMagicPanel(this.actor as Actor, {
        onRefresh: () => this.render(false),
      });
    }
    this.#minorMagicPanel.actor = this.actor as Actor;
    return this.#minorMagicPanel;
  }

  async openRitualWorkshop(ritualId?: string): Promise<void> {
    if (ritualId) this.#getRitualWorkshop().select(ritualId);
    this.activeTab = 'rituals';
    await this.render(true);
    (this as any).bringToFront?.();
  }

  async openMinorMagicPanel(): Promise<void> {
    this.activeTab = 'minor-magic';
    await this.render(true);
    (this as any).bringToFront?.();
  }

  async close(options?: any): Promise<this> {
    this.#closeEquipSlotFillMenu();
    this.#sheetGmMenuAbort?.abort();
    this.#sheetGmMenuAbort = null;
    return super.close(options);
  }

  #bindSheetGmMenu(html: JQuery): void {
    this.#sheetGmMenuAbort?.abort();
    this.#sheetGmMenuAbort = null;
    const menu = html.find('.sheet-gm-menu')[0] as HTMLElement | undefined;
    if (!menu) return;
    const toggle = menu.querySelector('.sheet-gm-menu-toggle') as HTMLButtonElement | null;
    const list = menu.querySelector('.sheet-gm-menu-list') as HTMLElement | null;
    if (!toggle || !list) return;

    const setOpen = (open: boolean) => {
      menu.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      list.hidden = !open;
    };

    toggle.addEventListener('click', (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      setOpen(list.hidden);
    });
    list.addEventListener('click', (ev) => {
      if ((ev.target as HTMLElement | null)?.closest('button')) setOpen(false);
    });

    const abort = new AbortController();
    this.#sheetGmMenuAbort = abort;
    const dismiss = (ev: Event) => {
      if (ev.type === 'keydown' && (ev as KeyboardEvent).key !== 'Escape') return;
      if (ev.type === 'pointerdown' && menu.contains(ev.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener('pointerdown', dismiss, { capture: true, signal: abort.signal });
    document.addEventListener('keydown', dismiss, { signal: abort.signal });
  }

  /** Initial tab when the sheet is first opened; subclasses override. */
  protected get _initialTab(): string {
    return 'attributes';
  }

  /** @override */
  static DEFAULT_OPTIONS: any = {
    classes: ['mastery-system', 'sheet', 'actor', 'character'],
    position: { width: 720, height: 800 },
    window: {
      resizable: true,
      controls: [
        {
          icon: 'fas fa-print',
          label: 'Charakterbogen',
          action: 'msPrintSheet',
        },
        {
          icon: 'fas fa-suitcase',
          label: 'Equipment-Modul',
          action: 'msPrintSheetWithBasics',
        },
        {
          icon: 'fas fa-compress',
          label: 'Quick Play',
          action: 'msPrintCompactSheet',
        },
        {
          icon: 'fas fa-link',
          label: 'MASTERY.image.copyLink',
          action: 'msCopyPictureLink',
        },
      ],
    },
    form: { submitOnChange: true, closeOnSubmit: false },
    actions: {
      msPrintSheet: function (this: any) {
        void openCharacterPrintSheet(this.actor);
      },
      msPrintSheetWithBasics: function (this: any) {
        // Optional Equipment (+ Summons) module pages after the three core pages.
        void openCharacterPrintSheet(this.actor, { includeModules: true });
      },
      msPrintCompactSheet: function (this: any) {
        void openCharacterPrintSheet(this.actor, { layout: 'compact' });
      },
      msCopyPictureLink: function (this: any) {
        void copyDocumentImageLink(this.actor);
      },
    },
  };

  /** @override */
  static PARTS = {
    body: {
      template: 'systems/mastery-system/templates/actor/character-sheet.hbs',
    },
  };

  /**
   * The "Print" header control only makes sense for player characters —
   * NPC / Summon subclasses inherit the control via DEFAULT_OPTIONS merging.
   * @override
   */
  _getHeaderControls(): any[] {
    const controls = super._getHeaderControls?.() ?? [];
    if (this.actor?.type === 'character') return controls;
    return controls.filter(
      (c: any) =>
        c?.action !== 'msPrintSheet' &&
        c?.action !== 'msPrintSheetWithBasics' &&
        c?.action !== 'msPrintCompactSheet',
    );
  }

  /**
   * Add Spell → open magic power dialog
   */
  // Removed #onSpellAdd, #onPowerAdd, #openMagicPowerDialog, #openPowerDialog
  // Now using #onPowerAddCreation and #onSpellAddCreation for all power/spell additions

  /**
   * Add Power (unified dialog with category/tag/special filters).
   * The optional data-category attribute on the button pre-selects a filter.
   */
  async #onPowerAddCreation(event: JQuery.ClickEvent) {
    event.preventDefault();
    await this.#onOpenTowerWizard(event);
  }

  async #onOpenTowerWizard(event: JQuery.ClickEvent) {
    event.preventDefault();
    try {
      await showTowerWizardDialog(this.actor);
      this.render();
    } catch (error) {
      console.error('Mastery System | Failed to open Tower Wizard', error);
      ui.notifications?.error('Failed to open Combat Package Wizard');
    }
  }

  /**
   * Buy a single catalog Power at Level 1 (post-creation). Same picker for
   * players and GM; XP is charged on the character.
   */
  async #onAddPower(event: JQuery.ClickEvent) {
    event.preventDefault();
    try {
      await showPowerCreationDialog(this.actor);
      this.render();
    } catch (error) {
      console.error('Mastery System | Failed to open Add Power dialog', error);
      ui.notifications?.error('Failed to open the Add Power dialog');
    }
  }

  async #onOpenManualCombatPackage(event: JQuery.ClickEvent) {
    event.preventDefault();
    try {
      await showTowerWizardDialog(this.actor, { manualBuildMode: true });
      this.render();
    } catch (error) {
      console.error('Mastery System | Failed to open Manual Combat Package', error);
      ui.notifications?.error('Failed to open Manual Combat Package');
    }
  }

  /**
   * Open the Echo Creation Dialog (Echo + sub-choice + veiled form + start card).
   */
  async #onEchoChoose(event: JQuery.ClickEvent) {
    event.preventDefault();
    try {
      await showEchoCreationDialog(this.actor);
      this.render();
    } catch (error) {
      console.error('Mastery System | Failed to open Echo creation dialog', error);
      ui.notifications?.error('Failed to open Echo selection dialog');
    }
  }

  /**
   * Open the Echo Card Pick Dialog (add one more card from the selected Echo's deck).
   */
  async #onEchoCardAdd(event: JQuery.ClickEvent) {
    event.preventDefault();
    try {
      await showEchoCardPickDialog(this.actor);
      this.render();
    } catch (error) {
      console.error('Mastery System | Failed to open Echo card pick dialog', error);
      ui.notifications?.error('Failed to open Echo card picker');
    }
  }

  /**
   * GM only: take an Echo Card off the character at any time.
   * The slot becomes free; the daily-use flag for that card is cleared.
   */
  async #onEchoCardRemove(event: JQuery.ClickEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (!(game as any).user?.isGM) {
      ui.notifications?.warn((game as any).i18n.localize('MASTERY.echo.gmOnlyRemove'));
      return;
    }
    const cardId = String((event.currentTarget as HTMLElement)?.dataset?.cardId || '').trim();
    const system = (this.actor as any).system;
    const echo = system?.echo || {};
    const selectedCardIds: string[] = Array.isArray(echo.selectedCardIds) ? echo.selectedCardIds : [];
    const cardUses = (echo.cardUses && typeof echo.cardUses === 'object') ? echo.cardUses : {};
    const card = getEchoCard(echo.key, cardId);
    const cardName = card?.name || cardId;
    const next = removeSelectedEchoCard(selectedCardIds, cardUses, cardId);
    if (!next.removed) {
      ui.notifications?.warn((game as any).i18n.localize('MASTERY.echo.notFound'));
      return;
    }
    const confirmed = await Dialog.confirm({
      title: (game as any).i18n.localize('MASTERY.echo.removeCardTitle'),
      content: (game as any).i18n.format('MASTERY.echo.removeCardConfirm', { name: cardName })
    });
    if (!confirmed) return;
    await this.actor.update({
      'system.echo.selectedCardIds': next.selectedCardIds,
      'system.echo.cardUses': next.cardUses
    });
    ui.notifications?.info((game as any).i18n.format('MASTERY.echo.removed', { name: cardName }));
  }

  /**
   * Combat Senses — manual grants and darkvision (explicit update; avoids form sync loops).
   */
  async #onCombatSenseGrantToggle(event: JQuery.ChangeEvent) {
    event.stopPropagation();
    if (!this.isEditable || !this.actor.isOwner) return;
    const el = event.currentTarget as HTMLInputElement;
    if (el.disabled) return;
    const senseId = String($(el).data('sense-id') || '').trim() as CombatSenseId;
    if (!senseId) return;
    const data = normalizeCombatSensesData((this.actor.system as any)?.combatSenses);
    const next = [...data.grantedSenseIds];
    const idx = next.indexOf(senseId);
    if (el.checked) {
      if (idx >= 0) return;
      next.push(senseId);
    } else {
      if (idx < 0) return;
      next.splice(idx, 1);
    }
    await this.actor.update({ 'system.combatSenses.grantedSenseIds': next }, { render: false });
    await this.render(false);
  }

  async #onCombatSenseDarkvisionToggle(event: JQuery.ChangeEvent) {
    event.stopPropagation();
    if (!this.isEditable || !this.actor.isOwner) return;
    const el = event.currentTarget as HTMLInputElement;
    const current = !!normalizeCombatSensesData((this.actor.system as any)?.combatSenses).hasDarkvision;
    if (el.checked === current) return;
    await this.actor.update({ 'system.combatSenses.hasDarkvision': el.checked }, { render: false });
    await this.render(false);
  }

  async #onRadialManeuverHideAll(event: JQuery.ChangeEvent) {
    event.stopPropagation();
    if (!this.isEditable) return;
    const el = event.currentTarget as HTMLInputElement;
    const sys = this.actor.system as any;
    await this.actor.update({
      'system.radialManeuverPrefs': {
        ...(sys.radialManeuverPrefs || {}),
        hideAllStandard: el.checked
      }
    });
    this.render();
  }

  async #onRadialManeuverHideOne(event: JQuery.ChangeEvent) {
    event.stopPropagation();
    if (!this.isEditable) return;
    const el = event.currentTarget as HTMLInputElement;
    if (el.disabled) return;
    const id = el.dataset.maneuverId;
    if (!id) return;
    // Opt-in maneuvers (Basic Attack): shown only via showIds; checkbox remains "ausblenden".
    if (isOptInRadialManeuverId(id)) {
      if (el.checked) {
        await this.actor.update({
          [`system.radialManeuverPrefs.showIds.-=${id}`]: null,
        });
      } else {
        await this.actor.update({
          [`system.radialManeuverPrefs.showIds.${id}`]: true,
        });
      }
      this.render();
      return;
    }
    // Foundry verschachtelte Updates mergen hideIds — einzelne Keys per -= entfernen, sonst bleibt „ausblenden“ aktiv.
    if (el.checked) {
      await this.actor.update({
        [`system.radialManeuverPrefs.hideIds.${id}`]: true
      });
    } else {
      await this.actor.update({
        [`system.radialManeuverPrefs.hideIds.-=${id}`]: null
      });
    }
    this.render();
  }

  async #onPowerRadialCheckboxChange(event: JQuery.ChangeEvent) {
    event.stopPropagation();
    const el = event.currentTarget as HTMLInputElement;
    const itemId = el.dataset.itemId;
    if (!itemId) return;
    const item = this.actor.items.get(itemId);
    if (!item || item.type !== 'power') return;
    await item.update({ 'system.showInRadialMenu': el.checked });
    this.render();
  }

  async #onPowerRankChange(event: JQuery.ChangeEvent) {
    event.preventDefault();
    const $select = $(event.currentTarget);
    const itemId = $select.data('item-id');
    const newRank = parseInt($select.val() as string);
    
    const system = (this.actor as any).system;
    const masteryRank = system.mastery?.rank || 2;
    const maxPowerLevel = calculateMaxPowerLevel(masteryRank);
    
    if (newRank > maxPowerLevel) {
      ui.notifications?.error(`Power Level cannot exceed ${maxPowerLevel} at Mastery Rank ${masteryRank}`);
      const item = this.actor.items.get(itemId);
      if (item) {
        const currentRank = (item.system as any).rank || (item.system as any).level || 1;
        $select.val(currentRank);
      }
      return;
    }
    
    const item = this.actor.items.get(itemId);
    if (item) {
      // Update both rank (new structure) and level (legacy) for backwards compatibility
      // Also update minLevel to match (during creation, minLevel should track rank changes)
      const updateData: any = {
        'system.rank': newRank,
        'system.level': newRank, // Keep level for backwards compatibility
        'system.minLevel': newRank // Update minLevel to match new rank during creation
      };
      
      await item.update(updateData);
      this.render();
    }
  }

  /**
   * Open General Items Storage Dialog
   */
  async #onGeneralItemsClick(event: JQuery.ClickEvent) {
    event.preventDefault();
    await this.#openGeneralItemsStorage();
  }

  /**
   * Open General Items Storage Window
   */
  async #openGeneralItemsStorage(): Promise<void> {
    try {
      const { GeneralItemsStorageDialog } = await import('./general-items-storage-dialog.js');
      await GeneralItemsStorageDialog.showForActor(this.actor);
    } catch (error) {
      console.error('Mastery System | Failed to open General Items Storage', error);
      ui.notifications?.error('Failed to open General Items Storage');
    }
  }

  /**
   * Open Store Dialog (GM only)
   */
  async #onStoreClick(event: JQuery.ClickEvent) {
    event.preventDefault();
    if (!game.user?.isGM) {
      ui.notifications?.warn('Only the GM can access the Store');
      return;
    }
    await this.#openStore();
  }

  /**
   * Open Store Window (GM only)
   */
  async #openStore(): Promise<void> {
    try {
      const { StoreDialog } = await import('./store-dialog.js');
      await StoreDialog.showForActor(this.actor);
    } catch (error) {
      console.error('Mastery System | Failed to open Store', error);
      ui.notifications?.error('Failed to open Store');
    }
  }

  /**
   * Toggle equipment equipped status (Radio button handler)
   */
  async #onEquipmentToggle(event: JQuery.ChangeEvent) {
    const $radio = $(event.currentTarget);
    const itemId = $radio.val() as string || $radio.data('item-id') || $radio.attr('data-item-id');
    // const itemType = $radio.attr('name'); // 'equipped-weapon', 'equipped-armor', or 'equipped-shield' - unused
    const equipped = $radio.is(':checked');
    
    if (!itemId) {
      console.warn('Mastery System | [EQUIP TOGGLE] Could not find item ID', {
        radio: event.currentTarget,
        radioData: $radio.data(),
        radioAttrs: Array.from(event.currentTarget.attributes).map((attr: any) => ({
          name: attr.name,
          value: attr.value
        }))
      });
      ui.notifications?.warn('Could not find item to equip/unequip.');
      return;
    }
    
    const item = this.actor.items.get(itemId);
    
    if (!item) {
      console.warn('Mastery System | [EQUIP TOGGLE] Item not found in actor.items', {
        itemId,
        actorId: this.actor.id,
        allItemIds: Array.from(this.actor.items.keys())
      });
      ui.notifications?.warn(`Item with ID ${itemId} not found.`);
      return;
    }
    
    // Validation: 2-handed weapons cannot be used with shields
    if (item.type === 'weapon' && equipped) {
      const weaponHands = (item.system as any)?.hands || 1;
      if (weaponHands === 2) {
        // Check if a shield is equipped
        const equippedShield = Array.from(this.actor.items.values()).find((i: any) => 
          i.type === 'shield' && (i.system as any)?.equipped === true
        );
        
        if (equippedShield) {
          ui.notifications?.warn(`Cannot equip 2-handed weapon "${(item as any).name}" while shield "${(equippedShield as any).name}" is equipped.`);
          // Revert radio button
          $radio.prop('checked', false);
          return;
        }
      }
    }
    
    // Validation: Shields cannot be equipped with 2-handed weapons
    if (item.type === 'shield' && equipped) {
      const equippedWeapon = Array.from(this.actor.items.values()).find((i: any) => 
        i.type === 'weapon' && (i.system as any)?.equipped === true
      );
      
      if (equippedWeapon) {
        const weaponHands = ((equippedWeapon as any).system as any)?.hands || 1;
        if (weaponHands === 2) {
          ui.notifications?.warn(`Cannot equip shield "${(item as any).name}" while 2-handed weapon "${(equippedWeapon as any).name}" is equipped.`);
          // Revert radio button
          $radio.prop('checked', false);
          return;
        }
      }
    }
    
    try {
      // First, unequip all other items of the same type
      const updates: any[] = [];
      for (const otherItem of this.actor.items) {
        if (otherItem.id !== itemId && otherItem.type === item.type && (otherItem.system as any)?.equipped) {
          updates.push({ _id: otherItem.id, 'system.equipped': false });
        }
      }
      
      // Then equip/unequip the selected item
      if (equipped) {
        updates.push({ _id: itemId, 'system.equipped': true });
      } else {
        updates.push({ _id: itemId, 'system.equipped': false });
      }
      
      if (updates.length > 0) {
        await this.actor.updateEmbeddedDocuments('Item', updates);
        // Re-render the sheet to update the display
        this.render();
      }
    } catch (error) {
      console.error('Mastery System | [EQUIP TOGGLE] Error updating item', error);
      ui.notifications?.error(`Failed to update item: ${error}`);
      // Revert radio button state
      $radio.prop('checked', !equipped);
    }
  }

  /**
   * Refresh XP distribution controls when the GM ends an Upgrade Step or
   * grants XP from world settings while this sheet is open.
   */
  _onUpdate(changed: Record<string, unknown>, options: unknown, _userId: string) {
    const opts = (options ?? {}) as { render?: boolean };
    if (opts.render === false) return;
    // Never re-render mid–initial mount — actor migrations / form sync otherwise
    // interrupt super.render() before activateListeners runs.
    if (!this.rendered || this.#isRendering) return;

    if (typeof super._onUpdate === 'function') {
      super._onUpdate(changed, options, _userId);
    }
    const keys = Object.keys(changed ?? {});
    const xpTouched = keys.some(
      (k) =>
        k.startsWith('system.points') ||
        k.startsWith('system.xp.currentStep') ||
        k === 'system.xp',
    );
    if (!xpTouched || !this.rendered) return;
    try {
      this.#updateAttributeXPUI();
      this.#updateSkillXPUI();
      this.#updatePowerLevelUI();
    } catch {
      // Sheet may be mid-render; a full render is still safer than stale locks.
      this.render(false);
    }
  }

  /**
   * Rebuild the context shape the V1 `ActorSheet.getData()` used to provide,
   * since the whole sheet (and its templates) were written against it.
   */
  protected _buildV1BaseContext(_options?: any): any {
    const actor: any = this.actor;
    const items = actor.items.contents.slice().sort((a: any, b: any) => (a.sort || 0) - (b.sort || 0));
    return {
      actor,
      document: actor,
      items,
      limited: actor.limited,
      owner: actor.isOwner,
      editable: this.isEditable,
      cssClass: actor.isOwner ? 'editable' : 'locked',
      options: this.options,
      title: this.title,
    };
  }

  /** @override */
  async _prepareContext(options?: any) {
    // Refresh baked power levels from the live catalog when the sheet opens so
    // template reprices (Evade etc.) show immediately. Idempotent / cheap when synced.
    void this.#resyncOwnedPowerTemplatesFromCatalog();

    const context: any = this._buildV1BaseContext(options);
    const actorData = context.actor;
    
    // Add system data
    context.system = actorData.system;
    context.flags = actorData.flags;

    // Rich-text bio fields are rendered via <prose-mirror> (ApplicationV2);
    // enrich the stored HTML for the read-only display state.
    try {
      const enrich = (v: unknown) =>
        foundry.applications.ux.TextEditor.implementation.enrichHTML(String(v ?? ''), {
          secrets: actorData.isOwner,
          relativeTo: actorData,
        } as any);
      const bio = (actorData.system as any)?.bio ?? {};
      context.enrichedBio = {
        echo: await enrich(bio.echo),
        concept: await enrich(bio.concept),
        appearance: await enrich(bio.appearance),
        notes: await enrich(bio.notes),
        description: await enrich(bio.description),
      };
    } catch {
      context.enrichedBio = {};
    }
    if (this.actor.type === 'character') {
      context.maxPurchasablePowerLevel = this.#getMaxPurchasablePowerLevel();
    }

    // Check if character creation is complete
    // Treat undefined as complete (no migration, older actors should not be stuck in creation UI)
    const creationCompleteRaw = context.system.creation?.complete;
    context.creationComplete = creationCompleteRaw !== false;
    // Calculate creation point counters (always calculate, but only show if not complete)
    const masteryRank = context.system.mastery?.rank || 2;
    const skillPointsConfig = (CONFIG as any).MASTERY?.creation?.skillPoints || 40;
    const maxDisadvantagePoints = (CONFIG as any).MASTERY?.creation?.maxDisadvantagePoints ?? 8;
    const minDisadvantagePoints = (CONFIG as any).MASTERY?.creation?.minDisadvantagePoints ?? 2;
    
    // Calculate attribute distribution status (2×8, 2×6, 2×4, 1×2 model)
    const attributeKeys = ['might', 'agility', 'vitality', 'intellect', 'resolve', 'influence', 'wits'];
    const attrValues = attributeKeys.map(key => context.system.attributes?.[key]?.value || masteryRank);
    const assignedValues = attrValues.filter(v => [2, 4, 6, 8].includes(v));
    const count8 = assignedValues.filter(v => v === 8).length;
    const count6 = assignedValues.filter(v => v === 6).length;
    const count4 = assignedValues.filter(v => v === 4).length;
    const count2 = assignedValues.filter(v => v === 2).length;
    const attributeDistributionValid = count8 === 2 && count6 === 2 && count4 === 2 && count2 === 1;

    /** Per-attribute dropdown: hide tier options already fully used elsewhere (2×8, 2×6, 2×4, 1×2). */
    const attrTierMax: Record<number, number> = { 8: 2, 6: 2, 4: 2, 2: 1 };
    const attrCreationSelect: Record<string, { s2: boolean; s4: boolean; s6: boolean; s8: boolean }> = {};
    const attrs = context.system.attributes || {};
    for (const ex of attributeKeys) {
      let o2 = 0,
        o4 = 0,
        o6 = 0,
        o8 = 0;
      for (const k of attributeKeys) {
        if (k === ex) continue;
        const v = attrs[k]?.value;
        if (v === 8) o8++;
        else if (v === 6) o6++;
        else if (v === 4) o4++;
        else if (v === 2) o2++;
      }
      const cur = attrs[ex]?.value;
      const curInSet = cur === 2 || cur === 4 || cur === 6 || cur === 8;
      const can = (val: number) => {
        if (!curInSet) return true;
        if (cur === val) return true;
        const used = val === 8 ? o8 : val === 6 ? o6 : val === 4 ? o4 : o2;
        const max = attrTierMax[val] ?? 0;
        return used < max;
      };
      attrCreationSelect[ex] = { s2: can(2), s4: can(4), s6: can(6), s8: can(8) };
    }

    const attrCreationOk: Record<string, boolean> = {};
    for (const ex of attributeKeys) {
      const cur = Number(attrs[ex]?.value);
      const max = attrTierMax[cur] ?? 0;
      const used = assignedValues.filter((v) => v === cur).length;
      attrCreationOk[ex] = max > 0 && used <= max;
    }
    
    // Calculate skill points spent
    let skillPointsSpent = 0;
    for (const skillValue of Object.values(context.system.skills || {})) {
      skillPointsSpent += (typeof skillValue === 'number' ? skillValue : 0);
    }
    
    // Calculate disadvantage points
    const disadvantagePoints = (context.system.disadvantages || []).reduce((sum: number, d: any) => sum + (d.points || 0), 0);
    const disadvantagesValid =
      disadvantagePoints >= minDisadvantagePoints && disadvantagePoints <= maxDisadvantagePoints;
    
    // Check if disadvantages phase is reviewed (user has visited the tab or interacted with disadvantages)
    const disadvantagesReviewed = context.system.creation?.disadvantagesReviewed === true || 
                                  (context.system.disadvantages && Array.isArray(context.system.disadvantages));
    
    // Calculate powers & magic creation status
    const items = this.#prepareItems();
    const powers = items.powers || [];
    const selectedTrees = this.#getSelectedTrees(powers);
    // During creation, all powers count (trees are optional)
    const selectedPowers = powers;

    // Per-category counters (new structure uses system.category, legacy uses system.powerType)
    const categoryCounts: Record<PowerCategory, number> = {
      active: 0, activeBuff: 0, movement: 0, reaction: 0, passive: 0
    };
    for (const p of selectedPowers) {
      const sys = (p as any).system || {};
      let cat: PowerCategory | undefined = sys.category;
      if (!cat) {
        const pt = sys.powerType;
        if (pt === 'buff') cat = 'activeBuff';
        else if (pt === 'utility') cat = 'active';
        else if (pt === 'active' || pt === 'passive' || pt === 'reaction' || pt === 'movement') cat = pt;
      }
      if (cat && cat in categoryCounts) categoryCounts[cat]++;
    }

    /** Starting character: Combat Package via Tower Wizard (mixed ranks).
     * PG "Starting Powers": Passives = available Passive Slots (MR 1 → 1). */
    const creationRequirements = creationPowerRequirementsForMasteryRank(masteryRank);
    const totalPowersRequired = Object.values(creationRequirements).reduce((s, n) => s + n, 0);
    const totalPowersSelected = powers.length;
    const activesAtRank2 = powers.filter((p: any) => {
      const cat = resolvePowerCategoryFromItem(p);
      return cat === 'active' && Number((p.system as any)?.level ?? 1) >= CREATION_OFFENSIVE_RANK;
    }).length;
    const categoryRequirements = CATEGORY_ORDER
      .filter((cat) => creationRequirements[cat] > 0)
      .map(cat => ({
      key: cat,
      label: CATEGORY_LABELS[cat],
      required: creationRequirements[cat],
      selected: categoryCounts[cat],
      valid: categoryCounts[cat] === creationRequirements[cat]
    }));
    const categoriesValid = validateTowerWizardCreation(this.actor) === null;

    // --- Echo view ------------------------------------------------------------
    const rawEcho = (context.system.echo || {}) as any;
    const echoKey = rawEcho.key || '';
    const echoDef = getEcho(echoKey);
    const echoSubChoice = echoDef?.subChoices?.length
      ? getEchoSubChoice(echoKey, rawEcho.subChoiceKey || null)
      : undefined;
    const veiledDef = echoDef?.veiledForm && rawEcho.veiledFormKey
      ? getEcho(rawEcho.veiledFormKey)
      : undefined;
    const selectedCardIds: string[] = Array.isArray(rawEcho.selectedCardIds)
      ? rawEcho.selectedCardIds.filter((id: any) => typeof id === 'string')
      : [];
    const cardUses: Record<string, boolean> = (rawEcho.cardUses && typeof rawEcho.cardUses === 'object')
      ? { ...rawEcho.cardUses }
      : {};

    const unlockedCardSlots = echoDef ? getUnlockedCardSlots(masteryRank) : 0;
    const overflowCardCount = Math.max(0, selectedCardIds.length - unlockedCardSlots);
    const canAddCard = !!echoDef && selectedCardIds.length < unlockedCardSlots;

    const deckView = echoDef
      ? echoDef.deck.map(c => {
          const selected = selectedCardIds.includes(c.id);
          const licensed = selected && isEchoCardLicensed(selectedCardIds, masteryRank, c.id);
          return {
            id: c.id,
            name: c.name,
            trigger: c.trigger,
            options: c.options,
            selected,
            licensed,
            overflow: selected && !licensed,
            used: cardUses[c.id] === true
          };
        })
      : [];

    const echoCreationValid = !!echoDef
      && (!echoDef.subChoices?.length || !!rawEcho.subChoiceKey)
      && (!echoDef.veiledForm || !!rawEcho.veiledFormKey)
      && selectedCardIds.length >= 1;

    const echoView = echoDef
      ? {
          key: echoKey,
          def: echoDef,
          subChoice: echoSubChoice || null,
          veiled: veiledDef || null,
          deck: deckView,
          selectedCardIds,
          unlockedCardSlots,
          overflowCardCount,
          canAddCard,
          creationValid: echoCreationValid
        }
      : null;

    context.echoView = echoView;

    /**
     * Languages view (Players Guide 3100–3127). Common Tongue is always
     * known; the picker enforces ≥ 1 additional language at character
     * creation. The handlebars template renders `languagesView.list` as
     * tag chips and `languagesView.creationValid` toggles a warning hint.
     */
    {
      const knownRaw = (context.system?.languages?.known as unknown) ?? ['common'];
      const echoKey = String(context.system?.echo?.key || '');
      const norm = normalizeKnownLanguages(knownRaw, echoKey);
      context.languagesView = {
        list: norm.cleaned
          .map((key: string) => getLanguageDef(key))
          .filter((d): d is NonNullable<ReturnType<typeof getLanguageDef>> => !!d)
          .map((d) => ({ key: d.key, name: d.name, isCommon: !!d.isCommon })),
        pickedNonCommon: norm.pickedNonCommon,
        creationValid: norm.creationValid,
      };
    }
    // Schticks data - per rank structure
    const schticksRanks = context.system.schticks?.ranks || [];
    const availableSchticks = getAllSchticks();
    
    // Create lookup map for schticks by ID
    const availableSchticksById: Record<string, any> = {};
    availableSchticks.forEach((s: any) => {
      availableSchticksById[s.id] = s;
    });
    
    // Prepare schticks rows - one per mastery rank
    const schticksRows: Array<{rank: number, schtickName: string, manifestation: string}> = [];
    for (let rank = 1; rank <= masteryRank; rank++) {
      const rankData = schticksRanks.find((r: any) => r.rank === rank);
      schticksRows.push({
        rank,
        schtickName: rankData?.schtickName || '',
        manifestation: rankData?.manifestation || ''
      });
    }
    
    // Validate schticks - each rank should have a schtick selected
    const schticksValidation = this.#validateSchticksPerRank(schticksRows, masteryRank);
    
    // Tooltip texts for each rank
    const rankTooltips: Record<number, {description: string, example: string}> = {
      1: {
        description: 'Subtle signs or small curiosities; a hint of what\'s to come.',
        example: 'Eyes gleam pale blue; breath mists even indoors.'
      },
      2: {
        description: 'Clear aesthetic or behavioral quirk visible to others.',
        example: 'Tears fall as tiny snowflakes; touch feels cool as marble.'
      },
      3: {
        description: 'Your power visibly marks your entire body or presence.',
        example: 'Skin fades to icy blue; faint frost lines trace your veins.'
      },
      4: {
        description: 'Your aura influences nearby objects or the air itself.',
        example: 'Objects frost slightly when touched; cold lingers where you stand.'
      },
      5: {
        description: 'Reality subtly bends around your nature; myth and truth blur.',
        example: 'A halo of frost shimmers in moonlight; snow falls when you grieve.'
      }
    };
    
    // Always provide creation data for template (even if complete)
    const { maxPerSkill: maxSkillAtCreation, step: skillStep } = getCreationSkillBudget();
    context.creation = {
      masteryRank,
      skillPointsConfig,
      maxSkillAtCreation,
      skillStep,
      attrCount8: count8,
      attrCount6: count6,
      attrCount4: count4,
      attrCount2: count2,
      attrCreationSelect,
      attrCreationOk,
      attributeDistributionValid,
      skillPointsRemaining: skillPointsConfig - skillPointsSpent,
      skillPointsSpent,
      disadvantagePoints,
      disadvantagePointsMin: minDisadvantagePoints,
      disadvantagePointsMax: maxDisadvantagePoints,
      disadvantagesValid,
      disadvantagesReviewed,
      powersSelected: selectedPowers.length,
      powersRequired: totalPowersRequired,
      activesAtRank2,
      activesAtRank2Required: CREATION_OFFENSIVE_RANK,
      towerWizardPackageId: context.system.creation?.towerWizardPackageId || '',
      towerWizardConfigured: hasTowerWizardPackage(this.actor),
      categoryRequirements,
      categoryCounts,
      categoriesValid,
      selectedTrees: selectedTrees,
      schticksRows: schticksRows,
      availableSchticks: availableSchticks,
      availableSchticksById: availableSchticksById,
      rankTooltips: rankTooltips,
      schticksValid: schticksValidation.ok,
      powersValid: categoriesValid,
      echoCreationValid,
      languagesCreationValid: context.languagesView?.creationValid !== false,
      canFinalize: attributeDistributionValid &&
                   skillPointsSpent === skillPointsConfig &&
                   validateCreationSkillAllocation(context.system).ok &&
                   categoriesValid &&
                   disadvantagesValid &&
                   echoCreationValid &&
                   context.languagesView?.creationValid !== false
    };
    context.creationGuideTabs = creationGuideFlags({
      creationComplete: context.creationComplete,
      attributesDone: attributeDistributionValid,
      echoDone: echoCreationValid && context.languagesView?.creationValid !== false,
      skillsDone:
        skillPointsSpent === skillPointsConfig &&
        validateCreationSkillAllocation(context.system).ok,
      powersDone: categoriesValid,
      equipmentReviewed: context.system.creation?.equipmentReviewed === true,
      disadvantagesDone: disadvantagesValid,
    });
    context.isGM = !!(game as any).user?.isGM;
    context.canEditMasteryRank =
      context.isGM || (!context.creationComplete && this.actor.isOwner);
    context.defaultMasteryRank = (game as any).settings.get('mastery-system', 'defaultMasteryRank') || 2;

    // Post-creation skill redistribute (40 pts, max 4) when no XP yet.
    const skillsRedistributing = isSkillsRedistributing(this.actor);
    context.skillsRedistributing = skillsRedistributing;
    context.skillsAllocationMode = !context.creationComplete || skillsRedistributing;
    const startGate = canStartSkillsRedistribute(this.actor);
    context.canStartSkillsRedistribute =
      !!context.creationComplete &&
      !skillsRedistributing &&
      startGate.ok &&
      (!!this.actor.isOwner || context.isGM);
    context.canFinishSkillsRedistribute =
      skillsRedistributing &&
      skillPointsSpent === skillPointsConfig &&
      (!!this.actor.isOwner || context.isGM);

    // Add configuration data
    context.config = (CONFIG as any).MASTERY;
    
    // Enrich biography info for display
    const TextEditorImpl = foundry.applications?.ux?.TextEditor?.implementation || TextEditor;
    context.enrichedBio = {
      notes: await TextEditorImpl.enrichHTML(context.system.bio?.notes || ''),
      background: await TextEditorImpl.enrichHTML(context.system.notes?.background || '')
    };
    
    // Prepare items by type
    context.items = this.#prepareItems();
    
    // Calculate derived values
    context.derivedValues = this.#calculateDerivedValues(context.system);
    
    // Note: armorTotal and evadeTotal are now calculated in actor.prepareDerivedData()
    // No need to calculate here - just use the derived values from system.combat
    
    // Add skills list (sorted alphabetically)
    context.skills = this.#prepareSkills(context.system.skills || {}, context.system.skillsSpent || {});

    // Prepare disadvantages (named-card layout for physical / mental limitations)
    const rawDisadvantages = context.system.disadvantages || [];
    context.disadvantages = rawDisadvantages.map((d: any) => {
      const out = { ...d };
      if (d.id === 'mental-restrictions') {
        (out as any).cardMode = 'named';
        (out as any).categoryShort = 'Mental Restriction';
        const sev = d.details?.severity;
        (out as any).summaryLine =
          sev === 'easy'
            ? '1 pt — Easy (Resolve k1 TN 6)'
            : sev === 'hard'
              ? '3 pt — Hard (Resolve k1 TN 14)'
              : '2 pt — Normal (Resolve k1 TN 10)';
      } else if (d.id === 'physical-scars') {
        (out as any).cardMode = 'named';
        (out as any).categoryShort = 'Physical Limitation';
        const t = parseInt(String(d.details?.tier ?? '1'), 10);
        (out as any).summaryLine =
          t === 3 ? '3 pt — Severe' : t === 2 ? '2 pt — Significant' : '1 pt — Minor';
      } else {
        (out as any).cardMode = 'default';
      }
      return out;
    });
    context.disadvantagePointsTotal = context.disadvantages.reduce((sum: number, d: any) => sum + (d.points || 0), 0);

    context.ritualWorkshop = this.#getRitualWorkshop().prepareContext();
    context.minorMagicView = minorMagicSheetView(this.actor);
    context.minorMagicPanel = this.#getMinorMagicPanel().prepareContext();

    context.summonBondsView = getSummonBondsFromActor(this.actor).map((b) => {
      const tok = tokensSummary(b);
      return {
        id: b.id,
        name: b.name,
        movementMode: b.movementMode,
        movementM: b.movementM,
        boundStoneCount: b.boundStoneCount,
        tokensAvailable: tok.available,
        tokensRemaining: tok.remaining,
        bodyCount: b.bodies?.length ?? 1,
        needsRedistribution: !!b.needsRedistribution,
        hasActor: (b.bodies || []).some((body) => !!body.summonActorId),
      };
    });
    
    // Ensure token image is available
    if (!context.actor.prototypeToken?.texture?.src) {
      context.actor.prototypeToken = context.actor.prototypeToken || {};
      context.actor.prototypeToken.texture = context.actor.prototypeToken.texture || {};
      context.actor.prototypeToken.texture.src = context.actor.img;
    }
    
    // Ensure context.items contains the prepared items structure (weapons, armor, shields, etc.)
    // This is already set in line 453, but we ensure it's not overwritten
    if (!context.items || !context.items.weapons) {
      context.items = this.#prepareItems();
    }
    
    // Build Equipment UI Context
    context.equipmentUi = this.#prepareEquipmentUi(context.items);
    context.consumableSlots = buildConsumableSlotView(this.actor);
    context.equippedConsumableActions = equippedConsumableActionRows(this.actor);

    context.hasProgressionArtifacts = actorHasProgressionArtifacts(this.actor);
    context.hasArtifactEvolution = context.hasProgressionArtifacts;

    const spendablePts = (context.system as any)?.points ?? {};
    context.hasSpendableXp =
      ((Number(spendablePts.xp) || 0) + (Number(spendablePts.xpFree) || 0)) > 0;

    context.radialManeuverPrefsPanel = buildRadialManeuverPrefsContext(context.system);
    context.radialManeuverPrefsDetailsOpen = this._radialManeuverPrefsDetailsOpen === true;
    context.combatSensesPanel = buildCombatSensesPanelContext(this.actor);
    context.encounterSetupStatus = null;
    context.showInitiativeShopButton = false;
    try {
      const combat = game.combat;
      const combatant = combat
        ? Array.from(combat.combatants).find((c: any) => c.actor?.id === this.actor.id)
        : null;
      if (combat && combatant && this.actor.type === 'character') {
        const { buildEncounterSetupStatus } = await import('../combat/encounter-setup-status.js');
        const setupStatus = buildEncounterSetupStatus(combatant as Combatant, combat);
        const hasOpenSetup = !!setupStatus?.rows?.some((row) => !row.done);
        context.encounterSetupStatus = hasOpenSetup ? setupStatus : null;
        context.showInitiativeShopButton = false;
      }
    } catch (err) {
      console.warn('Mastery System | encounter setup status failed', err);
    }
    if (context.creationComplete) {
      context.powersByTypeGroups = this.#buildPowersByTypeGroups(context.items?.powers || []);
      context.powersListDetailsOpen = true;
      context.powersGroupsExpanded = true;
    } else {
      context.powersByTypeGroups = [];
      context.powersListDetailsOpen = false;
      context.powersGroupsExpanded = false;
    }

    // Add active buffs data - ALWAYS set as array, even if empty
    context.activeBuffs = [];
    try {
      const activeBuffs = getActiveBuffs(this.actor);
      if (activeBuffs && activeBuffs.length > 0) {
        context.activeBuffs = activeBuffs.map((effect: any) => {
          const flags = effect.flags?.['mastery-system'] || {};
          const power = flags.powerId ? this.actor.items.get(flags.powerId) : null;
          const currentRound = game.combat?.round || 1;
          const activatedRound = flags.activatedRound || 1;
          const masteryRank = flags.masteryRank || 2;
          const roundsRemaining = Math.max(0, masteryRank - (currentRound - activatedRound));
          
          const buffData = {
            id: effect.id,
            name: effect.name,
            icon: effect.icon || effect.img || 'icons/svg/aura.svg',
            description: effect.description || effect.system?.description?.value || effect.system?.description || '',
            powerId: flags.powerId,
            powerName: flags.powerName || power?.name || effect.name,
            masteryRank: masteryRank,
            activatedRound: activatedRound,
            currentRound: currentRound,
            roundsRemaining: roundsRemaining
          };
          return buffData;
        });
      }
    } catch (error) {
      console.error('Mastery System | [CHARACTER SHEET] Failed to load active buffs', error);
      context.activeBuffs = [];
    }
    
    // Intentionally no icon strip on Attributes (was confusing vs. Powers-tab buff list).
    context.statusEffects = [];
    const statusRows = buildCharacterStatusRows(this.actor);
    context.characterStatusRows = statusRows;
    context.hasCharacterStatusRows = statusRows.length > 0;
    context.canEditCharacterStatus = canCurrentUserUpdateDocument(this.actor);
    
    // Passive slotting happens exclusively in combat (Combat-Start dialog).
    // The character-sheet "Passive Slots" manager was removed: it implied a
    // false pre-selection outside combat and was unrelated to the in-combat
    // passive slots.

    // Compact combat-stats: only while this actor is in the **active** encounter.
    try {
      const g = globalThis as any;
      const combat = g.game?.combats?.active ?? g.game?.combat;
      const inEncounter =
        !!combat?.started &&
        Array.from(combat.combatants ?? []).some((c: any) => c.actor?.id === this.actor?.id);
      if (!inEncounter) {
        context.combatStatsView = null;
      } else {
        try {
          if (typeof (this.actor as any).prepareDerivedData === 'function') {
            (this.actor as any).prepareDerivedData();
          }
        } catch {
          /* ignore */
        }
        const sys: any = (this.actor as any).system ?? {};
        const healthBars = Array.isArray(sys.health?.bars) ? sys.health.bars : [];
        const stressBars = Array.isArray(sys.stress?.bars) ? sys.stress.bars : [];
        const sumCurMax = (bars: any[]) => bars.reduce(
          (acc, b) => {
            acc.current += Math.max(0, Math.floor(Number(b?.current ?? 0) || 0));
            acc.max += Math.max(0, Math.floor(Number(b?.max ?? 0) || 0));
            return acc;
          },
          { current: 0, max: 0 },
        );
        const hp = sumCurMax(healthBars);
        const stress = sumCurMax(stressBars);
        const combat: any = sys.combat ?? {};
        const iniEqTotal = Number(combat.initiativeEquipmentTotal ?? 0) || 0;
        const iniD8Mech = Number(combat.initiativeD8FromMechanics ?? 0) || 0;
        const iniMR = Number(combat.initiativeMasteryRank ?? sys.mastery?.rank ?? 2) || 2;
        const iniDice = Math.max(0, iniMR + iniD8Mech);
        const rowTip = (rows: any[] | undefined, cap: number) =>
          (Array.isArray(rows) ? rows : [])
            .slice(0, cap)
            .map((r: any) => `${String(r.label ?? '').trim()}: ${r.display ?? r.value}`)
            .join(' · ');
        context.combatStatsView = {
          armor: Number(combat.armorTotal ?? 0) || 0,
          evade: Number(combat.evadeTotal ?? 8) || 8,
          drPct: Number(combat.damageReductionPct ?? 0) || 0,
          initiativeDice: iniDice,
          initiativeEquipmentDisplay: String(combat.initiativeEquipmentTotalDisplay ?? (iniEqTotal >= 0 ? `+${iniEqTotal}` : String(iniEqTotal))),
          hp: { current: hp.current, max: hp.max },
          stress: { current: stress.current, max: stress.max },
          armorBreakdownTip: rowTip(combat.armorBreakdownRows, 14),
          evadeBreakdownTip: rowTip(combat.evadeBreakdownRows, 14),
          drBreakdownTip: rowTip(combat.damageReductionRows, 10),
        };
      }
    } catch (err) {
      console.error('Mastery System | Failed to build combatStatsView', err);
      context.combatStatsView = null;
    }

    // Ensure context is always an object
    if (!context || typeof context !== 'object') {
      console.error('Mastery System | getData returned invalid context', context);
      return {};
    }
    
    return context;
  }

  /** @override */
  async render(options?: any, _options?: any) {
    if (this.#isRendering) {
      return this;
    }
    this.#isRendering = true;
    try {
      return await this.#renderSheet(options, _options);
    } finally {
      this.#isRendering = false;
    }
  }

  async #renderSheet(options?: any, _options?: any) {
    const $el = this.rendered && this.element ? $(this.element) : null;

    if ($el && $el.length > 0) {
      const det = $el.find('.radial-maneuver-prefs-details')[0];
      if (det instanceof HTMLDetailsElement) {
        this._radialManeuverPrefsDetailsOpen = det.open;
      }
      const pld = $el.find('.powers-list-details')[0];
      if (pld instanceof HTMLDetailsElement) {
        this._powersListDetailsOpen = pld.open;
      }
    }

    // Save scroll positions for all tabs and the main window before rendering.
    // Character sheets scroll `.sheet-body` so the header stays put; other
    // ApplicationV2 sheets still scroll `.window-content`.
    const scrollPositions: Record<string, number> = {};
    if ($el && $el.length > 0) {
      // Save scroll position for each tab
      const tabs = $el.find('.tab');
      tabs.each((index: number, tab: HTMLElement) => {
        const $tab = $(tab);
        const tabName = $tab.attr('data-tab') || `tab-${index}`;
        const scrollTop = $tab.scrollTop();
        if (scrollTop !== undefined && scrollTop > 0) {
          scrollPositions[tabName] = scrollTop;
        }
      });
      
      // Also save scroll position for the main sheet body (in case tabs don't have their own scroll)
      const sheetBody = $el.find('.sheet-body');
      if (sheetBody.length > 0) {
        const bodyScrollTop = sheetBody.scrollTop();
        if (bodyScrollTop !== undefined && bodyScrollTop > 0) {
          scrollPositions['sheet-body'] = bodyScrollTop;
        }
      }

      const windowContent = $el.find('.window-content').first();
      if (windowContent.length > 0) {
        const windowScrollTop = windowContent.scrollTop();
        if (windowScrollTop !== undefined && windowScrollTop > 0) {
          scrollPositions['window-content'] = windowScrollTop;
        }
      }
    }
    
    const result = await super.render(options, _options);
    
    // Restore scroll positions after rendering
    if (this.element && Object.keys(scrollPositions).length > 0) {
      const restoreScroll = () => {
        if (!this.element) return;
        const $now = $(this.element);
        // Restore tab scroll positions
        const tabs = $now.find('.tab');
        tabs.each((index: number, tab: HTMLElement) => {
          const $tab = $(tab);
          const tabName = $tab.attr('data-tab') || `tab-${index}`;
          if (scrollPositions[tabName] !== undefined) {
            $tab.scrollTop(scrollPositions[tabName]);
          }
        });
        
        // Restore sheet body scroll position
        if (scrollPositions['sheet-body'] !== undefined) {
          const sheetBody = $now.find('.sheet-body');
          if (sheetBody.length > 0) {
            sheetBody.scrollTop(scrollPositions['sheet-body']);
          }
        }

        if (scrollPositions['window-content'] !== undefined) {
          const windowContent = $now.find('.window-content').first();
          if (windowContent.length > 0) {
            windowContent.scrollTop(scrollPositions['window-content']);
          }
        }
      };
      // Use double rAF so ApplicationV2 layout settles before restoring scroll.
      requestAnimationFrame(() => requestAnimationFrame(restoreScroll));
    }
    
    return result;
  }

  /**
   * ApplicationV2 render bridge: re-wire the classic V1 behaviors (tabs,
   * drag & drop, portrait editing, jQuery listeners) after every render,
   * because the part's DOM is replaced each time.
   * @override
   */
  async _onRender(context: any, options: any) {
    await super._onRender?.(context, options);
    const root = this.element as HTMLElement;
    if (!root) return;

    bindManualSheetTabs(root, this, this._initialTab);
    bindEditImage(root, this.actor);

    // V1 `dragDrop` option replacement: the equipment grid uses `.df-draggable-item`,
    // item rows use `.item-list .item`. ActorSheetV2 only auto-binds `.draggable`.
    try {
      const DragDropImpl: any =
        (foundry.applications as any)?.ux?.DragDrop?.implementation ??
        (foundry.applications as any)?.ux?.DragDrop;
      for (const dragSelector of ['.item-list .item', '.df-draggable-item']) {
        new DragDropImpl({
          dragSelector,
          dropSelector: null,
          permissions: {
            dragstart: () => this.isEditable,
            drop: () => this.isEditable,
          },
          callbacks: {
            dragstart: (this as any)._onDragStart?.bind(this),
            dragover: (this as any)._onDragOver?.bind(this),
            drop: (this as any)._onDrop?.bind(this),
          },
        }).bind(root);
      }
    } catch (e) {
      console.warn('Mastery System | Failed to bind sheet drag & drop', e);
    }

    this.#closeEquipSlotFillMenu();
    this.activateListeners($(root));
  }

  /**
   * Idempotent catalog → owned-power levels refresh. Re-renders once if anything changed.
   */
  async #resyncOwnedPowerTemplatesFromCatalog(): Promise<void> {
    if (this.#powerCatalogResyncInFlight) return;
    this.#powerCatalogResyncInFlight = true;
    try {
      const updated = await resyncActorPowerTemplates(this.actor);
      if (updated > 0 && this.rendered) {
        this.render(false);
      }
    } catch (err) {
      console.warn('Mastery System | sheet power catalog resync failed', err);
    } finally {
      this.#powerCatalogResyncInFlight = false;
    }
  }

  /**
   * Prepare items organized by type
   */
  #prepareItems() {
    const powers: any[] = [];
    const echoes: any[] = [];
    const schticks: any[] = [];
    const artifacts: any[] = [];
    const conditions: any[] = [];
    const shields: any[] = [];
    const weapons: any[] = [];
    const armor: any[] = [];
    const gear: any[] = [];
    
    // Ensure we iterate over all items correctly (handle both Collection and Array)
    const items = this.actor.items;
    const itemsArray = Array.isArray(items) ? items : Array.from(items.values());
    
    for (const item of itemsArray) {
      const itemData = item;
      
      switch (item.type) {
        case 'power':
          powers.push(itemData);
          break;
        case 'gear':
          if (matchesMasteryWeaponCatalog(item.name || '')) {
            weapons.push(itemData);
          } else {
            gear.push(itemData);
          }
          break;
        case 'echo':
          echoes.push(itemData);
          break;
        case 'schtick':
          schticks.push(itemData);
          break;
        case 'artifact':
          artifacts.push(itemData);
          break;
        case 'condition':
          conditions.push(itemData);
          break;
        case 'weapon':
          weapons.push(itemData);
          break;
        case 'armor':
          armor.push(itemData);
          break;
        case 'shield':
          shields.push(itemData);
          break;
        default: {
          if (matchesMasteryWeaponCatalog(item.name || '')) {
            weapons.push(itemData);
            break;
          }
          const equipmentFlags = item.getFlag?.('mastery-system', 'equipment');
          if (equipmentFlags) {
            gear.push(itemData);
          }
          break;
        }
      }
    }
    
    // Enrich powers with level data from power definitions and ensure data integrity
    // Note: Level data enrichment is done in getData where we have async context
    for (const power of powers) {
      // Ensure specials is always an array
      if (power.system && !Array.isArray((power.system as any).specials)) {
        (power.system as any).specials = (power.system as any).specials ? [(power.system as any).specials] : [];
      }
    }
    
    // Sort powers: alphabetical by name, then radial-menu visibility (shown in menu first)
    powers.sort((a, b) => {
      const nameCmp = (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' });
      if (nameCmp !== 0) return nameCmp;
      const ra = (a.system as any)?.showInRadialMenu !== false ? 1 : 0;
      const rb = (b.system as any)?.showInRadialMenu !== false ? 1 : 0;
      return rb - ra;
    });
    
    return {
      powers,
      echoes,
      schticks,
      artifacts,
      shields,
      conditions,
      weapons,
      armor,
      gear
    };
  }

  /**
   * Bucket key for sheet grouping (Powers tab, post-creation). Spell / unknown → `other` (shown as „Sonstiges“).
   */
  #powerTypeGroupKey(power: any): 'movement' | 'active' | 'activeBuff' | 'passive' | 'reaction' | 'other' {
    const cat = resolvePowerCategoryFromItem(power);
    if (cat) return cat;
    const raw = String((power?.system as any)?.powerType ?? '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '');
    const t = raw.replace(/_/g, '-');
    if (t === 'movement') return 'movement';
    if (t === 'active' || t === 'utility') return 'active';
    if (t === 'active-buff' || t === 'activebuff' || t === 'buff') return 'activeBuff';
    if (t === 'passive') return 'passive';
    if (t === 'reaction') return 'reaction';
    return 'other';
  }

  /** Vertical groups for the Powers tab (same UX idea as radial maneuver prefs rowsByGroup). */
  #buildPowersByTypeGroups(powers: any[]): { groupKey: string; groupLabel: string; powers: any[] }[] {
    const buckets: Record<'movement' | 'active' | 'activeBuff' | 'passive' | 'reaction' | 'other', any[]> = {
      movement: [],
      active: [],
      activeBuff: [],
      passive: [],
      reaction: [],
      other: []
    };
    for (const p of powers) {
      buckets[this.#powerTypeGroupKey(p)].push(p);
    }
    const order: (keyof typeof buckets)[] = ['movement', 'active', 'activeBuff', 'passive', 'reaction', 'other'];
    const labels: Record<keyof typeof buckets, string> = {
      movement: 'Movement',
      active: 'Actives',
      activeBuff: 'Active Buffs',
      passive: 'Passives',
      reaction: 'Reactions',
      other: 'Sonstiges'
    };
    const out: { groupKey: string; groupLabel: string; powers: any[] }[] = [];
    for (const key of order) {
      const list = buckets[key];
      if (list.length === 0) continue;
      out.push({ groupKey: key, groupLabel: labels[key], powers: list });
    }
    return out;
  }

  /**
   * Prepare Equipment UI Context
   */
  #prepareEquipmentUi(items: any) {
    const BAND_COLS = ZONE_WIDTH_COLS;
    const BAND_ROWS = 9;
    const BAND_SIZE = BAND_COLS * BAND_ROWS;

    // Collect all equipment items (legacy auto-seeded Unarmed weapons are virtual — hide/remove them)
    const equipmentItems: any[] = [
      ...(items.weapons || []),
      ...(items.armor || []),
      ...(items.shields || []),
      ...(items.gear || []),
      ...(items.artifacts || [])
    ].filter((item: any) => !isLegacyUnarmedItem(item));

    // Helper: convert items array to cells array
    const toCells = (itemList: any[], cols: number, rows: number) => {
      const cells = [];
      for (let row = 1; row <= rows; row++) {
        for (let col = 1; col <= cols; col++) {
          cells.push({
            row,
            col,
            item: null,
            occupied: false,
            spanW: 1,
            spanH: 1
          });
        }
      }
      let overflow = 0;
      const rects: Array<{ x: number; y: number; w: number; h: number }> = [];
      const getIndex = (col: number, row: number) => (row - 1) * cols + (col - 1);
      const unplaced: any[] = [];

      for (const item of itemList) {
        const size = itemInventorySize(item);
        const w = Math.min(cols, size.w);
        const h = Math.min(rows, size.h);
        const flags = item?.getFlag?.('mastery-system', 'equipment') || item?.flags?.['mastery-system']?.equipment || {};
        const grid = flags?.grid;
        const hasStoredGrid = !!(grid?.x && grid?.y);
        if (hasStoredGrid && fitsInGrid(grid.x, grid.y, w, h, cols, rows)) {
          const candidate = { x: grid.x, y: grid.y, w, h };
          const overlaps = rects.some(rect => rectsOverlap(rect, candidate));
          if (!overlaps) {
            rects.push(candidate);
            const topIndex = getIndex(candidate.x, candidate.y);
            const topCell = cells[topIndex];
            if (topCell) {
              topCell.item = item;
              topCell.spanW = w;
              topCell.spanH = h;
            }
            for (let dy = 0; dy < h; dy++) {
              for (let dx = 0; dx < w; dx++) {
                if (dx === 0 && dy === 0) continue;
                const idx = getIndex(candidate.x + dx, candidate.y + dy);
                if (cells[idx]) {
                  cells[idx].occupied = true;
                }
              }
            }
            continue;
          }
        }
        // Keep a stored-but-blocked position as overflow instead of snapping it to the top.
        unplaced.push({ item, relocate: !hasStoredGrid });
      }

      for (const { item, relocate } of unplaced) {
        if (!relocate) {
          overflow++;
          continue;
        }
        const size = itemInventorySize(item);
        const w = Math.min(cols, size.w);
        const h = Math.min(rows, size.h);
        const pos = findFirstFit(rects, w, h, cols, rows);
        if (!pos) {
          overflow++;
          continue;
        }
        rects.push({ x: pos.x, y: pos.y, w, h });
        const topIndex = getIndex(pos.x, pos.y);
        const topCell = cells[topIndex];
        if (topCell) {
          topCell.item = item;
          topCell.spanW = w;
          topCell.spanH = h;
        }
        for (let dy = 0; dy < h; dy++) {
          for (let dx = 0; dx < w; dx++) {
            if (dx === 0 && dy === 0) continue;
            const idx = getIndex(pos.x + dx, pos.y + dy);
            if (cells[idx]) {
              cells[idx].occupied = true;
            }
          }
        }
      }
      return { cells, overflow };
    };

    // Read flags and split items
    const inventoryItems: any[] = [];
    const notItems: any[] = [];
    const encItems: any[] = [];
    const heavyItems: any[] = [];
    const slotMap: Record<string, any> = {};

    for (const item of equipmentItems) {
      const flags = item.getFlag?.('mastery-system', 'equipment') || {};
      const container = flags.container ?? 'inventory';
      const band = flags.band ?? 'not';
      // Normalize legacy slot keys (helmet/chest/boot/necklace/ring1/ring2)
      // to the canonical 7-slot vocabulary at read time.
      const slot = normalizeSlotKey(flags.slot) ?? null;

      // Backward compatibility: if item.system.equipped is true and no slot flag
      if (!slot && (item.system as any)?.equipped === true) {
        if (item.type === 'weapon') {
          slotMap['mainhand'] = item;
          continue;
        } else if (item.type === 'shield') {
          slotMap['offhand'] = item;
          continue;
        } else if (item.type === 'armor') {
          slotMap['body'] = item;
          continue;
        }
      }

      // Treat backpack items as inventory items (they go into encumbrance bands)
      // Backpack container flag is kept for future use, but items are displayed in bands
      if (slot) {
        if (!slotMap[slot]) {
          slotMap[slot] = item;
        }
      } else if (isHiddenInInactiveWeaponSet(this.actor, item)) {
        // Prepared on the inactive weapon set — still on the character, not in the grid.
        continue;
      } else if (isEchoArtifactInventoryHidden(item)) {
        // Echo-bound artifacts belong on the paperdoll only — skip inventory clutter.
        continue;
      } else if (readConsumableSlotIndex(item) != null) {
        // Occupies a Consumable Slot — still owned, but shown in that slot, not the grid.
        continue;
      } else {
        inventoryItems.push(item);
        if (band === 'enc') {
          encItems.push(item);
        } else if (band === 'heavy') {
          heavyItems.push(item);
        } else {
          notItems.push(item);
        }
      }
    }

    const lastDroppedId = (this as any)._lastDroppedItemId as string | undefined;
    if (lastDroppedId) {
      const lastItem = equipmentItems.find(it => it.id === lastDroppedId);
    }
    // Convert to cells
    const notCellsData = toCells(notItems, BAND_COLS, BAND_ROWS);
    const encCellsData = toCells(encItems, BAND_COLS, BAND_ROWS);
    const heavyCellsData = toCells(heavyItems, BAND_COLS, BAND_ROWS);

    // Slot definitions — canonical 7-slot vocabulary (Artefacts.md).
    const slotDefs = [
      { key: 'mainhand', label: 'Main Hand' },
      { key: 'offhand', label: 'Off Hand' },
      { key: 'body', label: 'Body' },
      { key: 'head', label: 'Head' },
      { key: 'feet', label: 'Feet' },
      { key: 'amulet', label: 'Amulet' },
      { key: 'ring', label: 'Ring' }
    ];

    const weaponSets = peekWeaponSets(this.actor);
    const activeHands = weaponSets.sets[weaponSets.active] || { mainhand: null, offhand: null };
    if (activeHands.mainhand && activeHands.mainhand === activeHands.offhand) {
      const twoHandItem = equipmentItems.find((it: any) => it.id === activeHands.mainhand);
      if (twoHandItem && !slotMap['offhand']) slotMap['offhand'] = twoHandItem;
      if (twoHandItem && !slotMap['mainhand']) slotMap['mainhand'] = twoHandItem;
    } else {
      const mainItem = slotMap['mainhand'];
      if (mainItem && isNaturallyTwoHandedItem(mainItem) && !slotMap['offhand']) {
        slotMap['offhand'] = mainItem;
      }
    }

    // Players Guide 7575–7579: Load zone & movement penalty.
    // Map the legacy 3-band (Normal / Encumbered / Overloaded) representation
    // onto the canonical 24 × 9 / Zone-1-2-3 model so the load and the
    // movement penalty stay synchronized regardless of which band view we
    // ship in the UI.
    const loadZone = loadZoneFromBands({
      normalCount: notItems.length,
      encumberedCount: encItems.length,
      overloadedCount: heavyItems.length,
    });
    const movementPenaltyM = movementPenaltyForLoad(loadZone);

    const evolutionCards = buildArtifactEvolutionCards(this.actor);
    const cardByEmbId = new Map(evolutionCards.map((c) => [c.embeddedId, c]));

    const mapArtifactMeta = (item: any) => {
      if (!item || item.type !== 'artifact') return null;
      const card = cardByEmbId.get(item.id);
      if (card) {
        return {
          currentSystemLevel: card.currentSystemLevel,
          linked: card.linked,
          embeddedId: item.id,
          unwired: false,
        };
      }
      const sys = (item.system as any) || {};
      const level = Math.max(1, Number(sys.currentLevel ?? sys.level ?? 1));
      return {
        currentSystemLevel: level,
        linked: isArtifactLinkedOnActor(this.actor, item),
        embeddedId: item.id,
        unwired: true,
      };
    };

    return {
      bandCols: BAND_COLS,
      bandRows: BAND_ROWS,
      inventory: {
        notCells: notCellsData.cells,
        encCells: encCellsData.cells,
        heavyCells: heavyCellsData.cells,
        notOverflow: notCellsData.overflow,
        encOverflow: encCellsData.overflow,
        heavyOverflow: heavyCellsData.overflow,
        loadZone,
        loadZoneLabel: LOAD_ZONE_LABEL[loadZone],
        movementPenaltyM,
      },
      equipSlots: slotDefs.map((def) => {
        const item = slotMap[def.key] || null;
        return {
          ...def,
          item,
          ammoLabel: quiverAmmunitionLabel(item),
          artifactMeta: mapArtifactMeta(item),
        };
      }),
      weaponSets: {
        active: weaponSets.active,
        buttons: ([1, 2] as const).map((index) => {
          const roman = index === 2 ? 'II' : 'I';
          return {
            index,
            label: roman,
            active: weaponSets.active === index,
            title:
              (globalThis as any).game?.i18n?.format?.('MASTERY.weaponSets.switchTitle', { n: roman }) ||
              `Weaponslots ${roman}`,
          };
        }),
      },
    };
  }

  /**
   * Get unique trees from selected powers (including spell schools)
   */
  #getSelectedTrees(powers: any[]): string[] {
    const trees = new Set<string>();
    for (const power of powers) {
      const tree = power.system?.tree;
      if (tree) {
        trees.add(tree);
      }
    }
    return Array.from(trees);
  }

  /**
   * Validate schticks per rank - each rank should have a schtick name
   */
  #validateSchticksPerRank(rows: Array<{rank: number, schtickName: string, manifestation: string}>, masteryRank: number): { ok: boolean; message?: string } {
    for (let rank = 1; rank <= masteryRank; rank++) {
      const row = rows.find(r => r.rank === rank);
      if (!row || !row.schtickName || row.schtickName.trim() === '') {
        return {
          ok: false,
          message: `You must enter a Schtick name for Rank ${rank}.`
        };
      }
    }
    return { ok: true };
  }

  /**
   * Handle schtick name change per rank
   */
  async #onSchtickNameChange(event: JQuery.BlurEvent) {
    if (!this.actor.isOwner) {
      (ui as any).notifications?.warn('Only the owner can edit Schticks.');
      return;
    }
    const input = event.currentTarget as HTMLInputElement;
    const rank = parseInt(input.dataset.rank || '0');
    const schtickName = input.value.trim();
    
    if (!rank || rank < 1) {
      console.error('Mastery System | Invalid rank for schtick name:', rank);
      return;
    }
    const currentRanks = (this.actor as any).system?.schticks?.ranks || [];
    const rankIndex = currentRanks.findIndex((r: any) => r.rank === rank);
    
    let newRanks: Array<{rank: number, schtickName: string, manifestation: string}>;
    if (rankIndex >= 0) {
      // Update existing rank
      newRanks = [...currentRanks];
      newRanks[rankIndex] = {
        ...newRanks[rankIndex],
        schtickName: schtickName
      };
    } else {
      // Add new rank entry
      newRanks = [...currentRanks, {
        rank,
        schtickName: schtickName,
        manifestation: ''
      }];
    }
    
    // Update actor
    await (this.actor as any).update({
      'system.schticks.ranks': newRanks
    });
    // Re-render to update UI
    this.render();
  }

  /**
   * Handle schtick manifestation change
   */
  async #onSchtickManifestationChange(event: JQuery.BlurEvent) {
    if (!this.actor.isOwner) {
      (ui as any).notifications?.warn('Only the owner can edit Schticks.');
      return;
    }
    const input = event.currentTarget as HTMLInputElement;
    const rank = parseInt(input.dataset.rank || '0');
    const manifestation = input.value.trim();
    
    if (!rank || rank < 1) {
      console.error('Mastery System | Invalid rank for manifestation:', rank);
      return;
    }
    const currentRanks = (this.actor as any).system?.schticks?.ranks || [];
    const rankIndex = currentRanks.findIndex((r: any) => r.rank === rank);
    
    let newRanks: Array<{rank: number, schtickName: string, manifestation: string}>;
    if (rankIndex >= 0) {
      // Update existing rank manifestation
      newRanks = [...currentRanks];
      newRanks[rankIndex] = {
        ...newRanks[rankIndex],
        manifestation
      };
    } else {
      // This shouldn't happen - manifestation without schtick
      console.warn('Mastery System | Manifestation changed but no schtick name for rank:', rank);
      return;
    }
    
    // Update actor
    await (this.actor as any).update({
      'system.schticks.ranks': newRanks
    });
  }

  /**
   * Calculate derived values for display
   */
  #calculateDerivedValues(system: any) {
    return {
      totalStones: system.stones?.total || 0,
      currentStones: system.stones?.current || 0,
      vitalityStones: system.stones?.vitality || 0,
      currentHP: this.actor.totalHP || 0,
      maxHP: this.actor.maxHP || 0,
      currentPenalty: this.actor.currentPenalty || 0,
      keepDice: system.mastery?.rank || 1
    };
  }

  /**
   * Prepare skills for display
   */
  #prepareSkills(skillValues: Record<string, number> = {}, skillsSpent: Record<string, number> = {}) {
    const skillsByCategory: Record<string, any[]> = {};
    const masteryRank = Math.max(
      1,
      Math.floor(Number((this.actor as any).system?.mastery?.rank) || 2)
    );
    
    // Group skills by category
    for (const [key, definition] of Object.entries(SKILLS)) {
      const category = definition.category;
      if (!skillsByCategory[category]) {
        skillsByCategory[category] = [];
      }
      
      const value = skillValues[key] || 0;
      const spent = skillsSpent[key] || 0;
      const remaining = Math.max(0, value - spent);
      const useBoxes = buildSkillUseBoxes(value, spent, masteryRank);
      
      const rollPools = definition.attributes.map((attributeKey: string) =>
        buildSkillRollPoolPreview(this.actor as Actor, key, attributeKey, value),
      );

      skillsByCategory[category].push({
        key,
        name: definition.name,
        category: definition.category,
        attributes: definition.attributes,
        description: definition.description ?? '',
        multiAttributeRoll: definition.attributes.length > 1 && key !== 'perception',
        rollPools,
        value,
        spent,
        remaining,
        useBoxes,
        pointsPerUse: masteryRank,
      });
    }
    
    // Sort skills within each category by name
    for (const category in skillsByCategory) {
      skillsByCategory[category].sort((a: any, b: any) => a.name.localeCompare(b.name));
    }
    
    // Convert to array of category objects.
    // Category labels come from SKILL_CATEGORIES (Awareness key → "Perception").
    const categoryOrder = [
      SKILL_CATEGORIES.AWARENESS,
      SKILL_CATEGORIES.PHYSICAL,
      SKILL_CATEGORIES.KNOWLEDGE_CRAFT,
      SKILL_CATEGORIES.SOCIAL,
      SKILL_CATEGORIES.SURVIVAL,
      SKILL_CATEGORIES.MARTIAL,
    ];
    const groupedSkills: any[] = [];
    const seen = new Set<string>();
    
    for (const category of categoryOrder) {
      if (skillsByCategory[category] && skillsByCategory[category].length > 0) {
        groupedSkills.push({
          category,
          skills: skillsByCategory[category]
        });
        seen.add(category);
      }
    }
    // Don't drop categories if labels drift again.
    for (const category of Object.keys(skillsByCategory)) {
      if (!seen.has(category) && skillsByCategory[category].length > 0) {
        groupedSkills.push({
          category,
          skills: skillsByCategory[category],
        });
      }
    }
    
    return groupedSkills;
  }

  /**
   * MR dropdown for GM (any time) and actor owner during character creation.
   */
  #bindMasteryRankSelect(html: JQuery): void {
    const creationComplete = (this.actor as any).system?.creation?.complete !== false;
    const canEdit =
      !!(game as any).user?.isGM || (!creationComplete && this.actor.isOwner);
    if (!canEdit) return;

    const box = html.find('.mastery-rank-box');
    if (!box.length) return;

    let select = box.find('.mastery-rank-select');
    if (!select.length) {
      const rank = Math.max(
        1,
        Math.min(8, Math.floor(Number((this.actor.system as any)?.mastery?.rank) || 2))
      );
      const options = [1, 2, 3, 4, 5, 6, 7, 8]
        .map((n) => `<option value="${n}"${n === rank ? ' selected' : ''}>${n}</option>`)
        .join('');
      box.find('.rank-value').replaceWith(
        `<select class="mastery-rank-select" data-dtype="Number" title="Mastery Rank" aria-label="Mastery Rank">${options}</select>`
      );
      select = box.find('.mastery-rank-select');

      const suggested = Math.floor(Number((this.actor.system as any)?.mastery?.suggestedRank) || 0);
      if (suggested >= 1 && suggested <= 8 && !box.find('.rank-stone-hint').length) {
        box.append(
          `<span class="rank-stone-hint" title="Empfehlung aus Total Stones (nur Hinweis, kein Auto-Rank-Up)">↗${suggested}</span>`
        );
      }
    }

    select.prop('disabled', false);

    select.off('change.masteryRank').on('change.masteryRank', async (ev: JQuery.ChangeEvent) => {
      const newRank = Math.max(1, Math.min(8, Math.floor(Number($(ev.currentTarget).val()) || 2)));
      const oldRank = Math.max(1, Math.floor(Number((this.actor.system as any)?.mastery?.rank) || 2));
      if (newRank === oldRank) return;
      try {
        await this.actor.update({ 'system.mastery.rank': newRank });
        if (newRank > oldRank) {
          const { applyRankUpBundle } = await import('../utils/mastery-rank-sync.js');
          await applyRankUpBundle(this.actor, newRank - oldRank);
        }
        await this.render(false);
      } catch (err) {
        console.warn('[mastery-system] MR update failed', err);
        (ui as any).notifications?.error('Mastery Rank konnte nicht gespeichert werden.');
      }
    });
  }

  #bindBattleSensesHandlers(root: JQuery) {
    root
      .off('change', '.js-combat-sense-grant')
      .on('change', '.js-combat-sense-grant', this.#onCombatSenseGrantToggle.bind(this));
    root
      .off('change', '.js-combat-sense-darkvision')
      .on('change', '.js-combat-sense-darkvision', this.#onCombatSenseDarkvisionToggle.bind(this));
  }

  async #mountBattleSensesArea(html: JQuery): Promise<void> {
    const mount = html.find('[data-battle-senses-mount]');
    if (!mount.length) return;
    try {
      const combatSensesPanel = buildCombatSensesPanelContext(this.actor);
      const markup = await foundry.applications.handlebars.renderTemplate(
        'systems/mastery-system/templates/actor/partials/combat-senses-config.hbs',
        { editable: this.isEditable, combatSensesPanel },
      );
      mount.html(markup).attr('aria-busy', 'false');
      this.#bindBattleSensesHandlers(mount);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('Mastery System | Failed to mount combat senses config', message, err);
      mount.html(
        '<p class="stat-summary-hint battle-senses-error">Combat Senses could not be loaded.</p>',
      ).attr('aria-busy', 'false');
    }
  }

  /** @override */
  activateListeners(html: JQuery) {
    // (ApplicationV2: no super.activateListeners — form change/submit handling
    // is wired by DocumentSheetV2 via DEFAULT_OPTIONS.form.)

    void this.#mountBattleSensesArea(html);
    void ensureWeaponSets(this.actor);

    if (!this.#attributeBaselinesMigrationDone) {
      this.#attributeBaselinesMigrationDone = true;
      void this.#migrateAttributeBaselinesIfNeeded();
    }
    
    this.#bindSheetGmMenu(html);

    // Character Creation buttons
    const unlockButton = html.find('.force-unlock-creation');
    if (unlockButton.length > 0) {
      unlockButton.off('click.force-unlock').on('click.force-unlock', (e: JQuery.ClickEvent) => {
        e.preventDefault();
        e.stopPropagation();
        this.#onForceUnlockCreation(e);
      });
    }

    // GM-only: Reset Character (wipes everything except name + portrait,
    // returns earned XP to the spendable pool, flips creation to incomplete).
    const resetButton = html.find('.reset-character');
    if (resetButton.length > 0) {
      resetButton.off('click.reset-character').on('click.reset-character', (e: JQuery.ClickEvent) => {
        e.preventDefault();
        e.stopPropagation();
        this.#onResetCharacter(e);
      });
    }

    html
      .find('.start-skills-redistribute')
      .off('click.skills-redistribute')
      .on('click.skills-redistribute', (e: JQuery.ClickEvent) => {
        e.preventDefault();
        e.stopPropagation();
        void this.#onStartSkillsRedistribute();
      });
    html
      .find('.finish-skills-redistribute')
      .off('click.skills-redistribute')
      .on('click.skills-redistribute', (e: JQuery.ClickEvent) => {
        e.preventDefault();
        e.stopPropagation();
        void this.#onFinishSkillsRedistribute();
      });
    html
      .find('.cancel-skills-redistribute')
      .off('click.skills-redistribute')
      .on('click.skills-redistribute', (e: JQuery.ClickEvent) => {
        e.preventDefault();
        e.stopPropagation();
        void this.#onCancelSkillsRedistribute();
      });

    // Passive slotting is handled exclusively by the in-combat dialog; the
    // character-sheet passive-slot manager (and its handlers) were removed.

    // Check if creation is incomplete - don't lock, just disable non-creation fields.
    // NPCs / summons inherit `creation.complete: false` from the actor template
    // but are not in chargen — locking them disables the name field.
    const actorType = String((this.actor as any)?.type || '');
    const isNpcLike = actorType === 'npc' || actorType === 'summon';
    const creationComplete = (this.actor as any).system?.creation?.complete !== false;
    if (!isNpcLike && !creationComplete) {
      this.#lockSheetForCreation(html);
    }

    this.#armSheetButtonsAgainstTooltipSteal(html);

    this.#bindMasteryRankSelect(html);
    
    html.find('.minor-expressions-open').on('click', async (ev: JQuery.ClickEvent) => {
      ev.preventDefault();
      if (!this.actor.isOwner) {
        (ui as any).notifications?.warn('Nur der Besitzer kann Minor Expressions wählen.');
        return;
      }
      const attr = (ev.currentTarget as HTMLElement).dataset.attribute as MinorExpressionAttribute | undefined;
      if (!attr) return;
      const { showMinorExpressionsDialog } = await import('./minor-expressions-dialog.js');
      await showMinorExpressionsDialog(this.actor, { focusAttribute: attr });
      this.render(false);
    });

    /**
     * Players Guide 3100–3127: open the Languages picker dialog. The
     * Common Tongue is always pre-selected and locked; players choose
     * additional languages reflecting their origin/training.
     */
    bindReliableControlClick(html, '.open-languages-btn', async (ev: JQuery.TriggeredEvent) => {
      ev.preventDefault();
      if (!this.actor.isOwner && !(game as any).user?.isGM) {
        (ui as any).notifications?.warn('Only the owner (or GM) can edit languages.');
        return;
      }
      await showLanguagesDialog(this.actor);
      this.render(false);
    });

    // Roll buttons work for everyone
    bindReliableControlClick(html, '.attribute-roll', this.#onAttributeRoll.bind(this));
    bindReliableControlClick(html, '.skill-roll, .skill-roll-compact', this.#onSkillRoll.bind(this));
    bindReliableControlClick(html, '.safe-haven-rest', this.#onSafeHavenRest.bind(this));
    bindReliableControlClick(html, '.gm-restore-health-bar', this.#onGmRestoreHealthBar.bind(this));
    bindReliableControlClick(html, '.gm-restore-stress-bar', this.#onGmRestoreStressBar.bind(this));
    bindReliableControlClick(html, '.social-combat-btn', this.#onSocialCombat.bind(this));
    bindReliableControlClick(html, '.gm-award-faith-fracture', this.#onGmAwardFaithFracture.bind(this));
    bindReliableControlClick(html, '.gm-edit-xp', this.#onGmEditXp.bind(this));
    
    // Point spending buttons (JavaScript will check permissions)
    // Note: legacy `.attribute-spend-point` immediate-spend handler removed —
    // the only attribute spend path is now the pending/confirm flow via
    // `.attr-increase-xp` (which respects the once-per-step rule).
    html.find('.skill-spend-point').on('click', this.#onSkillSpendPoint.bind(this));
    html.find('.skill-refund-point').on('click', this.#onSkillRefundPoint.bind(this));
    html.find('.confirm-skill-changes').on('click', this.#onConfirmSkillChanges.bind(this));
    html.find('.cancel-skill-changes').on('click', this.#onCancelSkillChanges.bind(this));
    
    // New attribute XP distribution system (with confirmation)
    const increaseButtons = html.find('.attr-increase-xp');
    const decreaseButtons = html.find('.attr-decrease-xp');
    // Use event delegation to ensure handlers work even if buttons are dynamically added
    html.off('click', '.attr-increase-xp').on('click', '.attr-increase-xp', this.#onAttributeIncreaseXP.bind(this));
    html.off('click', '.attr-decrease-xp').on('click', '.attr-decrease-xp', this.#onAttributeDecreaseXP.bind(this));
    
    // Also try direct binding as fallback
    increaseButtons.off('click.attr-xp').on('click.attr-xp', this.#onAttributeIncreaseXP.bind(this));
    decreaseButtons.off('click.attr-xp').on('click.attr-xp', this.#onAttributeDecreaseXP.bind(this));
    html.find('.confirm-attribute-changes').on('click', this.#onConfirmAttributeChanges.bind(this));
    html.find('.cancel-attribute-changes').on('click', this.#onCancelAttributeChanges.bind(this));
    
    // Pending XP maps persist across re-renders until Confirm/Cancel (do not reset here).

    // Initialize UI state for attribute XP distribution
    this.#updateAttributeXPUI();
    this.#updateSkillXPUI();
    
    // Character Creation mode buttons
    html.find('.attr-creation-select').on('change', this.#onCreationAttributeChange.bind(this));
    html.find('.attribute-value--creation').attr({ tabindex: 0, role: 'button' });
    html.find('.attribute-value--creation').on('click', (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      const wrap = ev.currentTarget as HTMLElement;
      const select = wrap.querySelector('select.attr-creation-select') as HTMLSelectElement | null;
      if (!select) return;
      this.#toggleAttrCreationMenu(wrap, select);
    });
    html.find('.attribute-value--creation').on('keydown', (ev) => {
      if (ev.key !== 'Enter' && ev.key !== ' ' && ev.key !== 'ArrowDown') return;
      ev.preventDefault();
      (ev.currentTarget as HTMLElement).click();
    });
    bindReliableControlClick(html, '.skill-increase', this.#onCreationSkillIncrease.bind(this));
    bindReliableControlClick(html, '.skill-decrease', this.#onCreationSkillDecrease.bind(this));
    bindReliableControlClick(html, '.finalize-creation', this.#onFinalizeCreation.bind(this));
    bindReliableControlClick(html, '.reset-creation-attributes', this.#onResetCreationAttributes.bind(this));
    
    html.find('.js-character-status-remove').on('click', this.#onRemoveCharacterStatus.bind(this));
    html.find('.js-character-status-reduce').on('click', this.#onReduceCharacterStatus.bind(this));

    html.find('[data-action="forceEncounterSetup"]').on('click', async (ev: JQuery.ClickEvent) => {
      ev.preventDefault();
      if (!game.user?.isGM) return;
      const kind = String($(ev.currentTarget).attr('data-kind') || '') as 'passives' | 'stones' | 'initiative';
      const combat = game.combat;
      const combatant = combat
        ? Array.from(combat.combatants).find((c: any) => c.actor?.id === this.actor.id)
        : null;
      if (!combatant || !kind) return;
      const { forceEncounterDialog } = await import('../combat/encounter-setup-status.js');
      await forceEncounterDialog(kind, combatant as Combatant);
    });
    html.find('[data-action="forceEncounterSetupAll"]').on('click', async (ev: JQuery.ClickEvent) => {
      ev.preventDefault();
      if (!game.user?.isGM) return;
      const kind = String($(ev.currentTarget).attr('data-kind') || '') as 'passives' | 'stones' | 'initiative';
      if (!kind) return;
      const { forceEncounterDialogForAll } = await import('../combat/encounter-setup-status.js');
      await forceEncounterDialogForAll(kind);
    });

    html.find('[data-action="openInitiativeShop"]').on('click', async (ev: JQuery.ClickEvent) => {
      ev.preventDefault();
      const combat = game.combat;
      const combatant = combat
        ? Array.from(combat.combatants).find((c: any) => c.actor?.id === this.actor.id)
        : null;
      if (!combat || !combatant) {
        ui.notifications?.warn(game.i18n?.localize('MASTERY.encounterSetup.noCombat') || 'Kein aktiver Kampf.');
        return;
      }
      const { openInitiativeShopForTrackerRescue } = await import('../combat/initiative-roll.js');
      await openInitiativeShopForTrackerRescue(combatant as Combatant, combat);
    });

    html.find('[data-action="openStonePowers"]').on('click', async (ev: JQuery.ClickEvent) => {
      ev.preventDefault();
      
      // Get current combatant if in combat
      let combatant: any = null;
      if (game.combat) {
        const combatants = game.combat.combatants;
        combatant = Array.from(combatants).find((c: any) => c.actor?.id === this.actor.id) || null;
      }
      
      const { StonePowersDialog } = await import('../stones/stone-powers-dialog.js');
      await StonePowersDialog.showForActor(this.actor, combatant);
    });

    html.on('click', '[data-action="switchWeaponSet"]', async (ev: JQuery.ClickEvent) => {
      ev.preventDefault();
      ev.stopPropagation();
      if (!canCurrentUserUpdateDocument(this.actor)) return;
      const raw = Number((ev.currentTarget as HTMLElement)?.dataset?.weaponSet);
      const target = raw === 2 ? 2 : raw === 1 ? 1 : null;
      if (!target) return;
      await swapWeaponSet(this.actor, target);
    });

    bindReliableControlClick(html, '[data-action="openArtifactEvolution"]', async (ev: JQuery.TriggeredEvent) => {
      ev.preventDefault();
      if (!this.actor.isOwner) return;
      const { openArtifactEvolutionDialog } = await import('../artifacts/artifact-evolution-dialog.js');
      await openArtifactEvolutionDialog(this.actor);
    });

    bindReliableControlClick(html, '[data-action="openProgressionHub"]', async (ev: JQuery.TriggeredEvent) => {
      ev.preventDefault();
      if (!this.actor.isOwner) return;
      const $btn = $(ev.currentTarget);
      const section = String($btn.data('expandSection') || $btn.attr('data-expand-section') || 'overview');
      const { openProgressionHubDialog } = await import('../artifacts/progression-hub-dialog.js');
      await openProgressionHubDialog(this.actor, { expandSection: section as any });
    });

    html.on('click', '.df-artifact-badge[data-action="openProgressionArtifacts"]', async (ev: JQuery.ClickEvent) => {
      ev.preventDefault();
      ev.stopPropagation();
      if (!this.actor.isOwner) return;
      const { openProgressionHubDialog } = await import('../artifacts/progression-hub-dialog.js');
      await openProgressionHubDialog(this.actor, { expandSection: 'artifacts' });
    });

    html.on('click', '[data-action="artifact-activate"]', async (ev: JQuery.ClickEvent) => {
      ev.preventDefault();
      ev.stopPropagation();
      if (!this.actor.isOwner) return;
      const $btn = $(ev.currentTarget);
      const { linkArtifactForActor } = await import('../artifacts/artifact-evolution-actions.js');
      const ok = await linkArtifactForActor(
        this.actor,
        String($btn.data('root-id')),
        String($btn.data('emb-id')),
      );
      if (ok) this.render(false);
    });

    html.on('click', '[data-action="artifact-upgrade"]', async (ev: JQuery.ClickEvent) => {
      ev.preventDefault();
      ev.stopPropagation();
      if (!this.actor.isOwner) return;
      const $btn = $(ev.currentTarget);
      const { upgradeArtifactForActor } = await import('../artifacts/artifact-evolution-actions.js');
      const ok = await upgradeArtifactForActor(
        this.actor,
        String($btn.data('root-id')),
        String($btn.data('emb-id')),
        String($btn.data('target-world-id')),
        String($btn.data('target-node-id')),
      );
      if (ok) this.render(false);
    });
    
    // Schticks selection (per rank)
    html.find('.schtick-input').on('blur', this.#onSchtickNameChange.bind(this));
    html.find('.schtick-manifestation-input').on('blur', this.#onSchtickManifestationChange.bind(this));
    
    bindReliableControlClick(html, '.add-disadvantage-btn', this.#onAddDisadvantage.bind(this));
    bindReliableControlClick(html, '.disadvantage-edit-btn', this.#onEditDisadvantage.bind(this));
    bindReliableControlClick(html, '.disadvantage-remove-btn', this.#onRemoveDisadvantage.bind(this));
    
    // Blood color picker synchronization
    // When color picker changes, update text field
    const syncColorPickerToText = (e: any) => {
      const colorPicker = $(e.currentTarget);
      const textInput = colorPicker.siblings('.blood-color-text');
      const colorValue = colorPicker.val() as string;
      if (textInput.length > 0 && colorValue) {
        textInput.val(colorValue);
        textInput.data('last-valid-value', colorValue);
        textInput.removeClass('invalid');
      }
    };
    
    html.find('.blood-color-picker, input[type="color"][name="system.bloodColor"]')
      .on('input' as any, syncColorPickerToText)
      .on('change', syncColorPickerToText);
    
    // When text field changes, update color picker and validate
    const syncTextToColorPicker = (e: any) => {
      const textInput = $(e.currentTarget);
      const colorPicker = textInput.siblings('.blood-color-picker, input[type="color"][name="system.bloodColor"]');
      const colorValue = (textInput.val() as string || '').trim();
      
      // Validate hex color format
      if (/^#[0-9A-Fa-f]{6}$/.test(colorValue)) {
        if (colorPicker.length > 0) {
          colorPicker.val(colorValue);
          // Trigger change on the named input to ensure it's saved
          colorPicker.trigger('change');
        }
        textInput.data('last-valid-value', colorValue);
        textInput.removeClass('invalid');
      } else if (colorValue.length > 0) {
        // Invalid format, mark as invalid but don't revert yet (user might still be typing)
        textInput.addClass('invalid');
      }
    };
    
    html.find('.blood-color-text')
      .on('input' as any, syncTextToColorPicker)
      .on('change', syncTextToColorPicker);
    
    // On blur, revert to last valid value if current is invalid
    html.find('.blood-color-text').on('blur', (e: JQuery.BlurEvent) => {
      const textInput = $(e.currentTarget);
      const colorValue = (textInput.val() as string || '').trim();
      
      if (!/^#[0-9A-Fa-f]{6}$/.test(colorValue)) {
        // Invalid format, revert to last valid value or default
        const lastValid = textInput.data('last-valid-value') || '#8b0000';
        textInput.val(lastValid);
        textInput.removeClass('invalid');
        
        const colorPicker = textInput.siblings('.blood-color-picker, input[type="color"][name="system.bloodColor"]');
        if (colorPicker.length > 0) {
          colorPicker.val(lastValid);
          colorPicker.trigger('change');
        }
      }
    });
    
    // Mark creation-tour tabs as reviewed when the player opens them.
    if (!creationComplete) {
      html.on('click', 'a[data-tab="disadvantages"]', async () => {
        const system = (this.actor as any).system;
        if (!system.creation?.disadvantagesReviewed) {
          await this.actor.update({ 'system.creation.disadvantagesReviewed': true });
          this.render();
        }
      });
      html.on('click', 'a[data-tab="equipment"]', async () => {
        const system = (this.actor as any).system;
        if (!system.creation?.equipmentReviewed) {
          await this.actor.update({ 'system.creation.equipmentReviewed': true });
          this.render();
        }
      });
    }

    html.off('click.summonBonds');
    html.on('click.summonBonds', '.js-sheet-summon-bond-new', async (ev) => {
      ev.preventDefault();
      await SummonBondDialog.showCreate(this.actor);
      this.render(false);
    });
    html.on('click.summonBonds', '.js-sheet-summon-bond-ritual', async (ev) => {
      ev.preventDefault();
      const id = (ev.currentTarget as HTMLElement).dataset.bondId;
      if (!id) return;
      await SummonBondDialog.showRitual(this.actor, id);
      this.render(false);
    });
    const ritualRoot = html.find('.tab.rituals .rw-root').get(0);
    if (ritualRoot) this.#getRitualWorkshop().bind(ritualRoot);

    const minorRoot = html.find('.tab.minor-magic .mm-root').get(0);
    if (minorRoot) this.#getMinorMagicPanel().bind(minorRoot);

    html.off('click.minorMagic');
    html.on('click.minorMagic', '.js-sheet-minor-magic-use', async (ev) => {
      ev.preventDefault();
      const id = (ev.currentTarget as HTMLElement).dataset.itemId;
      const item = id ? this.actor.items.get(id) : null;
      if (!item) return;
      const res = readConsumableSlotIndex(item) != null
        ? await useEquippedConsumable(this.actor, item)
        : { ok: false as const, error: (globalThis as any).game?.i18n?.localize?.('MASTERY.consumable.notEquipped') || 'Only equipped consumables can be used as an Attack Action.' };
      if (!res.ok) (ui as any).notifications?.warn(res.error);
      this.render(false);
    });
    html.off('click.consumableUse');
    html.on('click.consumableUse', '.js-use-equipped-consumable', async (ev) => {
      ev.preventDefault();
      const id = (ev.currentTarget as HTMLElement).dataset.itemId;
      const item = id ? this.actor.items.get(id) : null;
      if (!item) return;
      const res = await useEquippedConsumable(this.actor, item);
      if (!res.ok) (ui as any).notifications?.warn(res.error);
      this.render(false);
    });
    html.on('click.minorMagic', '.js-sheet-minor-magic-trap', async (ev) => {
      ev.preventDefault();
      const id = (ev.currentTarget as HTMLElement).dataset.itemId;
      const item = id ? this.actor.items.get(id) : null;
      if (!item) return;
      const trigger = window.prompt?.('Simple trigger for this Trap (prototype):', 'A creature enters the chosen area');
      if (trigger == null) return;
      const res = await useMinorMagicItem(this.actor, item, 'trap', trigger.trim() || 'A creature enters the chosen area');
      if (!res.ok) (ui as any).notifications?.warn(res.error);
      this.render(false);
    });
    html.on('click.minorMagic', '.js-sheet-minor-magic-dismiss', async (ev) => {
      ev.preventDefault();
      const id = (ev.currentTarget as HTMLElement).dataset.itemId;
      const item = id ? this.actor.items.get(id) : null;
      if (!item) return;
      const res = await dismissMinorMagicItem(this.actor, item);
      if (!res.ok) (ui as any).notifications?.warn(res.error);
      this.render(false);
    });
    html.on('click.minorMagic', '.js-sheet-minor-magic-give', async (ev) => {
      ev.preventDefault();
      const id = (ev.currentTarget as HTMLElement).dataset.itemId;
      const item = id ? this.actor.items.get(id) : null;
      if (!item) return;
      const given = await this.#giveMinorMagicItem(item);
      if (given) this.render(false);
    });
    html.on('click.minorMagic', '.js-sheet-minor-magic-give-back', async (ev) => {
      ev.preventDefault();
      const id = (ev.currentTarget as HTMLElement).dataset.itemId;
      const item = id ? this.actor.items.get(id) : null;
      if (!item) return;
      const returned = await this.#returnMinorMagicItem(item);
      if (returned) this.render(false);
    });

    html.on('click.summonBonds', '.js-sheet-summon-bond-dissolve', async (ev) => {
      ev.preventDefault();
      const id = (ev.currentTarget as HTMLElement).dataset.bondId;
      if (!id) return;
      const bond = getSummonBondsFromActor(this.actor).find((b) => b.id === id);
      if (!bond) return;
      const confirmed =
        typeof (globalThis as any).foundry?.applications?.api?.DialogV2?.confirm === 'function'
          ? await (globalThis as any).foundry.applications.api.DialogV2.confirm({
              window: { title: 'Dissolve Summon Bond' },
              content: `<p>Dissolve this Summon Bond? Bound Stones return to the owner. Existing summon tokens will be removed. Body actors may be archived or deleted according to system settings.</p><p><strong>${bond.name}</strong></p>`,
            })
          : (globalThis as any).confirm?.(`Dissolve this Summon Bond? Bound Stones return to the owner. Existing summon tokens will be removed.\n\n${bond.name}`);
      if (!confirmed) return;
      const res = await dissolveSummonBond(this.actor, id, deleteSummonActor);
      if (res.removed) {
        ui.notifications?.info(`Dissolved Summon Bond "${res.removed.name}".`);
      }
      this.render(false);
    });
    
    // Profile image click handlers (work for everyone)
    // Use event delegation to handle clicks even if elements are added later
    const containers = html.find('.profile-img-container');
    // Use event delegation on all containers
    containers.off('click.profile-delegation').on('click.profile-delegation', (e: JQuery.ClickEvent) => {
      const target = $(e.target);
      const clickedZone = target.closest('.profile-zone');
      const container = target.closest('.profile-img-container');
      
      // Get imgType from zone's data attribute first (most specific), then container, fallback to 'portrait'
      const zoneImgType = clickedZone.attr('data-img-type');
      const containerImgType = container.attr('data-image-type');
      const imgType = zoneImgType || containerImgType || 'portrait';
      
      // Also check if container has the token class
      const isTokenContainer = container.hasClass('profile-img-container-token');
      // Determine final imgType - prioritize zone attribute, then container class, then container attribute
      let finalImgType = imgType;
      if (!zoneImgType && isTokenContainer) {
        finalImgType = 'token';
      }
      
      if (clickedZone.hasClass('profile-zone-edit')) {
        e.preventDefault();
        e.stopPropagation();
        // Pass imgType as string to ensure it's not modified
        this.#onProfileEdit(e, String(finalImgType));
      } else if (clickedZone.hasClass('profile-zone-show')) {
        e.preventDefault();
        e.stopPropagation();
        this.#onProfileShow(e, String(finalImgType));
      }
    });
    
    // Also set up direct handlers as backup
    setTimeout(() => {
      const editZone = html.find('.profile-zone-edit');
      const showZone = html.find('.profile-zone-show');
      editZone.off('click.profile-edit').on('click.profile-edit', (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        const zone = $(e.currentTarget);
        const container = zone.closest('.profile-img-container');
        const zoneImgType = zone.attr('data-img-type');
        const containerImgType = container.attr('data-image-type');
        const isTokenContainer = container.hasClass('profile-img-container-token');
        
        // Determine imgType - prioritize zone attribute, then container class, then container attribute
        let imgType = zoneImgType || (isTokenContainer ? 'token' : null) || containerImgType || 'portrait';
        this.#onProfileEdit(e, String(imgType));
      });
      
      showZone.off('click.profile-show').on('click.profile-show', (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        const zone = $(e.currentTarget);
        const container = zone.closest('.profile-img-container');
        const zoneImgType = zone.attr('data-img-type');
        const containerImgType = container.attr('data-image-type');
        const isTokenContainer = container.hasClass('profile-img-container-token');
        
        // Determine imgType - prioritize zone attribute, then container class, then container attribute
        let imgType = zoneImgType || (isTokenContainer ? 'token' : null) || containerImgType || 'portrait';
        this.#onProfileShow(e, String(imgType));
      });
    }, 100);

    html.find('.remove-echo-card-btn').on('click', this.#onEchoCardRemove.bind(this));

    // Everything below here is only needed if the sheet is editable
    if (!this.isEditable) return;
    
    // Add skill
    html.find('.skill-add').on('click', this.#onSkillAdd.bind(this));

    // Add power
    // Power/Spell creation buttons (always visible)
    bindReliableControlClick(html, '.open-tower-wizard-btn', this.#onOpenTowerWizard.bind(this));
    bindReliableControlClick(html, '.open-manual-combat-package-btn', this.#onOpenManualCombatPackage.bind(this));
    bindReliableControlClick(html, '.add-power-btn, .gm-add-power-btn', this.#onAddPower.bind(this));

    // Echo creation / deck interactions
    bindReliableControlClick(html, '.choose-echo-btn', this.#onEchoChoose.bind(this));
    bindReliableControlClick(html, '.add-echo-card-btn', this.#onEchoCardAdd.bind(this));
    bindReliableControlClick(html, '.echo-card-use-btn', this.#onEchoRoll.bind(this));
    html.find('.power-rank-select').on('change', this.#onPowerRankChange.bind(this));
    html
      .off('change', '.power-radial-checkbox')
      .on('change', '.power-radial-checkbox', this.#onPowerRadialCheckboxChange.bind(this));
    html
      .off('change', '.radial-maneuver-hide-all')
      .on('change', '.radial-maneuver-hide-all', this.#onRadialManeuverHideAll.bind(this));
    html
      .off('change', '.radial-maneuver-hide-one')
      .on('change', '.radial-maneuver-hide-one', this.#onRadialManeuverHideOne.bind(this));
    
    // Equipment handlers
    bindReliableControlClick(html, '.general-items-btn', this.#onGeneralItemsClick.bind(this));
    bindReliableControlClick(html, '.store-btn', this.#onStoreClick.bind(this));
    if (this.actor.isOwner) {
      void this.#purgeLegacyUnarmedItems();
    }

    const dropTargets = html.find('[data-df-drop]');
    html.off('dragover.ms-equipment-drop').on('dragover.ms-equipment-drop', '[data-df-drop]', (ev: JQuery.DragOverEvent) => {
      ev.preventDefault();
      ev.stopPropagation();
      const target = ev.currentTarget as HTMLElement;
      if (target?.dataset?.dfDrop === 'equip-trash') {
        html.find('.df-equip-trash').removeClass('df-drop-valid');
        $(target).addClass('df-drop-valid');
      }
    });
    html.off('drop.ms-equipment-drop').on('drop.ms-equipment-drop', '[data-df-drop]', async (ev: JQuery.DropEvent) => {
      ev.preventDefault();
      ev.stopPropagation();
      ev.stopImmediatePropagation?.();
      const target = ev.currentTarget as HTMLElement | null;
      const dragEvent = (ev.originalEvent ?? ev) as unknown as DragEvent;
      const path = (dragEvent.composedPath?.() || []) as HTMLElement[];
      const cellFromPath = path.find(el => el?.classList?.contains?.('df-cell'));
      const cellFromTarget = (ev.target as HTMLElement)?.closest?.('.df-cell') as HTMLElement | null;
      (dragEvent as any).__msDropTarget = target || undefined;
      (dragEvent as any).__msDropCell = cellFromTarget || cellFromPath || undefined;
      await this._onDrop(dragEvent);
    });

    const invEquipSelector =
      '.tab.equipment .df-enc-band .df-draggable-item, .tab.equipment .df-consumable-slot .df-draggable-item';
    const ContextMenuCls = (foundry as any).applications?.ux?.ContextMenu;
    const rootEl = ((html as any)?.[0] ?? (this.element as any) ?? null) as HTMLElement | null;
    if (ContextMenuCls && rootEl) {
      new ContextMenuCls(rootEl, invEquipSelector, this.#inventoryEquipContextMenuEntries(), {
        eventName: 'contextmenu',
        jQuery: false
      } as any);
    }
    if (rootEl) {
      rootEl.removeEventListener('contextmenu', this.#onEquipSlotContextMenu, true);
      rootEl.addEventListener('contextmenu', this.#onEquipSlotContextMenu, true);
      const hint = localizeSheet(
        'MASTERY.inventory.slotFillHint',
        'Right-click to choose an item from inventory',
      );
      html.find('.df-equip-slot, .df-consumable-slot').each((_, el) => {
        const node = el as HTMLElement;
        const existing = String(node.getAttribute('title') || '').trim();
        if (existing.includes(hint)) return;
        node.setAttribute('title', existing ? `${existing} — ${hint}` : hint);
      });
    }

    if (!(window as any).__msGlobalDropDebugBound) {
      (window as any).__msGlobalDropDebugBound = true;
      document.addEventListener('dragstart', (ev: DragEvent) => {
        const target = ev.target as HTMLElement | null;
        if (!target) return;
        const storageItem = target.closest('.storage-item');
        if (!storageItem) return;
        const itemId = (storageItem as HTMLElement).dataset?.itemId;
        const dataTransfer = ev.dataTransfer;
        if (!dataTransfer) {
          return;
        }
        const sourceItem = (game as any).items?.get(itemId);
        if (!sourceItem) {
          return;
        }
        const dragData = sourceItem.toDragData ? sourceItem.toDragData() : { type: 'Item', uuid: sourceItem.uuid };
        const payload = JSON.stringify(dragData);
        dataTransfer.effectAllowed = 'copy';
        dataTransfer.setData('text/plain', payload);
        dataTransfer.setData('application/json', payload);
        (window as any).__msDragInventorySize = sourceItem?.system?.inventorySize || '1x1';
        (window as any).__msDragItemId = sourceItem?.id;
      });
      document.addEventListener('drop', (ev: DragEvent) => {
        const target = ev.target as HTMLElement | null;
        if (!target) return;
        if (target.closest('.stone-powers-dialog')) return;
        // If drop happens inside the character sheet, let sheet handlers handle it.
        if (target.closest('.mastery-system.sheet.actor.character')) {
          return;
        }
        const path = (ev.composedPath?.() || []) as HTMLElement[];
        const dropTarget = target.closest('[data-df-drop]') as HTMLElement | null;
        const pathDropTarget = path.find(el => el?.dataset?.dfDrop) as HTMLElement | undefined;
        const resolvedDropTarget = dropTarget || pathDropTarget || null;
        if (resolvedDropTarget) {
          const dragEvent = ev as DragEvent;
          (dragEvent as any).__msDropTarget = resolvedDropTarget;
          this._onDrop(dragEvent);
        }
      });
      document.addEventListener('dragover', (ev: DragEvent) => {
        const target = ev.target as HTMLElement | null;
        if (!target) return;
        const dropTarget = target.closest('[data-df-drop]') as HTMLElement | null;
        if (!dropTarget) return;
        const last = (window as any).__msLastDropTargetKey;
        const key = `${dropTarget.dataset?.dfDrop || ''}:${dropTarget.dataset?.band || ''}:${dropTarget.dataset?.slot || ''}`;
        if (last !== key) {
          (window as any).__msLastDropTargetKey = key;
        }
      });
    }
    
    html.find('.equipment-item input[type="radio"][name^="equipped-"]').on('change', this.#onEquipmentToggle.bind(this));

    const sheetEl = html.get(0) as HTMLElement | undefined;
    if (sheetEl) {
      const existingHandler = (sheetEl as any).__msDragstartCaptureHandler as ((ev: DragEvent) => void) | undefined;
      if (existingHandler) sheetEl.removeEventListener('dragstart', existingHandler, true);
      const captureHandler = (ev: DragEvent) => {
        const target = ev.target as HTMLElement | null;
        const tileEl = target?.closest?.('.df-item-tile') as HTMLElement | null;
        if (!tileEl) return;
        const itemId = tileEl.dataset?.itemId || $(tileEl).data('item-id');
        const sizeAttr = tileEl?.dataset?.inventorySize;
        const sourceItem = itemId ? this.actor?.items?.get(itemId) : undefined;
        const computedSize = sourceItem ? getDefaultInventorySizeForItemData(sourceItem) : undefined;
        const resolvedSize = sourceItem?.system?.inventorySize || sizeAttr || computedSize || '1x1';
        (window as any).__msDragInventorySize = resolvedSize;
        (window as any).__msDragItemId = sourceItem?.id || itemId;
        tileEl.dataset.dragging = 'true';
        tileEl.dataset.dragSize = resolvedSize;
        if (ev.dataTransfer) {
          ev.dataTransfer.setData('application/x-mastery-inventory-size', resolvedSize);
        }
      };
      (sheetEl as any).__msDragstartCaptureHandler = captureHandler;
      sheetEl.addEventListener('dragstart', captureHandler, true);
    }

    html.off('dragstart.df-grid').on('dragstart.df-grid', '.df-item-tile', (ev: any) => {
      const tileEl = ev.currentTarget as HTMLElement;
      const itemId = $(tileEl).data('item-id');
      const sizeAttr = tileEl?.dataset?.inventorySize;
      const sourceItem = this.actor?.items?.get(itemId);
      const dragEvent = (ev?.originalEvent ?? ev) as DragEvent | undefined;
      const dataTransfer = dragEvent?.dataTransfer ?? null;
      if (sourceItem) {
        const computedSize = getDefaultInventorySizeForItemData(sourceItem);
        const resolvedSize = sourceItem.system?.inventorySize || sizeAttr || computedSize || '1x1';
        (window as any).__msDragInventorySize = resolvedSize;
        (window as any).__msDragItemId = sourceItem.id;
        tileEl.dataset.dragging = 'true';
        tileEl.dataset.dragSize = resolvedSize;
        if (dataTransfer) {
          dataTransfer.setData('application/x-mastery-inventory-size', resolvedSize);
        }
        return;
      }

      if (dragEvent) {
        const TextEditorImpl = foundry.applications?.ux?.TextEditor?.implementation || TextEditor;
        const data = TextEditorImpl.getDragEventData(dragEvent);
        if (data?.data?._id) {
          const actorItem = this.actor?.items?.get(data.data._id);
          if (actorItem) {
            const computedSize = getDefaultInventorySizeForItemData(actorItem);
            const resolvedSize = actorItem.system?.inventorySize || sizeAttr || computedSize || '1x1';
            (window as any).__msDragInventorySize = resolvedSize;
            (window as any).__msDragItemId = actorItem.id;
            tileEl.dataset.dragging = 'true';
            tileEl.dataset.dragSize = resolvedSize;
            if (dataTransfer) {
              dataTransfer.setData('application/x-mastery-inventory-size', resolvedSize);
            }
          }
        }
      }
    });
    html.off('dragend.df-grid').on('dragend.df-grid', '.df-item-tile', () => {
      html.find('.df-item-tile[data-dragging="true"]').removeAttr('data-dragging').removeAttr('data-drag-size');
      html.find('.df-equip-trash').removeClass('df-drop-valid');
      delete (window as any).__msDragInventorySize;
      delete (window as any).__msDragItemId;
    });
    const clearDropHighlight = () => {
      html.find('.df-cell.df-drop-valid, .df-cell.df-drop-invalid')
        .removeClass('df-drop-valid df-drop-invalid');
    };

    const resolveDragSize = (ev: any) => {
      const logDragSize = (source: string, details: Record<string, unknown>) => {
        const key = JSON.stringify({ source, ...details });
        if ((window as any).__msLastDragSizeDebug === key) return;
        (window as any).__msLastDragSizeDebug = key;
      };
      const getDragDataFromDataTransfer = (dt: DataTransfer | null) => {
        if (!dt) return { types: [] as string[], raw: '', parsed: undefined as any, size: undefined as string | undefined };
        const types = Array.from(dt.types || []);
        const raw = dt.getData('application/json') || dt.getData('text/plain') || '';
        const size = dt.getData('application/x-mastery-inventory-size') || undefined;
        let parsed: any = undefined;
        if (raw) {
          try {
            parsed = JSON.parse(raw);
          } catch {
            parsed = undefined;
          }
        }
        return { types, raw, parsed, size };
      };
      const resolveSizeFromItem = (item: any, source: string, details: Record<string, unknown>) => {
        const systemSize = item?.system?.inventorySize as string | undefined;
        const computedSize = systemSize ? undefined : getDefaultInventorySizeForItemData(item);
        const resolvedSize = systemSize || computedSize || undefined;
        logDragSize(source, { ...details, systemSize, computedSize, resolvedSize });
        const size = parseInventorySize(resolvedSize);
        // PG "Item Rotation": rotated items drag with their swapped footprint.
        const flags = item?.getFlag?.('mastery-system', 'equipment') || item?.flags?.['mastery-system']?.equipment || {};
        return flags?.rotated === true ? { w: size.h, h: size.w } : size;
      };
      const resolveSizeFromDragData = (data: any, source: string, details: Record<string, unknown>) => {
        if (!data) return null;
        const dataId = data?.data?._id || data?._id;
        if (dataId) {
          const actorItem = this.actor?.items?.get(dataId);
          if (actorItem) {
            return resolveSizeFromItem(actorItem, `${source}.actorItem`, { ...details, dataId });
          }
        }
        const dataItemId = data?.id || data?.data?.id;
        if (dataItemId) {
          const worldItem = (game as any).items?.get(dataItemId);
          if (worldItem) {
            return resolveSizeFromItem(worldItem, `${source}.worldItem`, { ...details, dataId: dataItemId });
          }
        }
        const uuid = data?.uuid || data?.data?.uuid;
        if (typeof uuid === 'string' && uuid.includes('.Item.')) {
          const itemId = uuid.split('.Item.')[1];
          const actorId = uuid.startsWith('Actor.') ? uuid.split('.')[1] : undefined;
          const actorItem = actorId && actorId === this.actor?.id ? this.actor?.items?.get(itemId) : undefined;
          if (actorItem) {
            return resolveSizeFromItem(actorItem, `${source}.uuid.actorItem`, { ...details, uuid, itemId, actorId });
          }
          const worldItem = (game as any).items?.get(itemId);
          if (worldItem) {
            return resolveSizeFromItem(worldItem, `${source}.uuid.worldItem`, { ...details, uuid, itemId });
          }
        }
        return null;
      };
      // Priority 1: Check window global first (set by dragstart handlers)
      const explicit = (window as any).__msDragInventorySize as string | undefined;
      if (explicit) {
        logDragSize('window', { explicit });
        return parseInventorySize(explicit);
      }

      // Priority 2: Check for dragging tile (the item being dragged)
      const draggingTile = html.find('.df-item-tile[data-dragging="true"]').get(0)
        || (document.querySelector('.df-item-tile[data-dragging="true"]') as HTMLElement | null)
        || undefined;
      if (draggingTile) {
        const dragSize = draggingTile.dataset?.dragSize || draggingTile.dataset?.inventorySize;
        const draggingItemId = draggingTile.dataset?.itemId;
        const draggingItem = draggingItemId ? this.actor?.items?.get(draggingItemId) : undefined;
        if (dragSize) {
          logDragSize('dragging.tile', { itemId: draggingItemId, dragSize });
          return parseInventorySize(dragSize);
        }
        if (draggingItem) {
          return resolveSizeFromItem(draggingItem, 'dragging.tile.item', { itemId: draggingItemId });
        }
      }

      // Priority 3: Check dataTransfer for size information
      const dragEvent = (ev?.originalEvent ?? ev) as DragEvent | undefined;
      if (dragEvent) {
        const dtInfo = getDragDataFromDataTransfer(dragEvent.dataTransfer ?? null);
        if (dtInfo.size) {
          logDragSize('dataTransfer.size', { size: dtInfo.size, types: dtInfo.types });
          return parseInventorySize(dtInfo.size);
        }

        const TextEditorImpl = foundry.applications?.ux?.TextEditor?.implementation || TextEditor;
        const data = TextEditorImpl.getDragEventData(dragEvent);
        const resolvedFromDragData = resolveSizeFromDragData(data, 'dragData', {
          dataId: data?.data?._id,
          id: data?.id,
          uuid: data?.uuid
        });
        if (resolvedFromDragData) return resolvedFromDragData;

        const resolvedFromDataTransfer = resolveSizeFromDragData(dtInfo.parsed, 'dataTransfer', {
          types: dtInfo.types,
          raw: dtInfo.raw ? dtInfo.raw.slice(0, 200) : ''
        });
        if (resolvedFromDataTransfer) return resolvedFromDataTransfer;

        logDragSize('dragData.unhandled', {
          dataId: data?.data?._id,
          id: data?.id,
          uuid: data?.uuid,
          dataTransferTypes: dtInfo.types,
          dataTransferRaw: dtInfo.raw ? dtInfo.raw.slice(0, 200) : ''
        });
      }

      // Priority 4 (LAST): Only check target tile if we're hovering over an existing item
      // This should NOT be used for drag size of the item being dragged!
      const targetTile = (ev?.target as HTMLElement | null)?.closest?.('.df-item-tile') as HTMLElement | null;
      if (targetTile && !targetTile.dataset?.dragging) {
        const sizeAttr = (targetTile as HTMLElement).dataset?.inventorySize;
        const tileItemId = (targetTile as HTMLElement).dataset?.itemId;
        const tileActorItem = tileItemId ? this.actor?.items?.get(tileItemId) : undefined;
        if (sizeAttr) {
          logDragSize('tile.dataset', {
            itemId: tileItemId,
            sizeAttr
          });
          return parseInventorySize(sizeAttr);
        }
        if (tileActorItem) {
          return resolveSizeFromItem(tileActorItem, 'tile.item', { itemId: tileItemId });
        }
        logDragSize('tile.dataset.missing', { itemId: tileItemId, sizeAttr });
        return parseInventorySize(undefined);
      }

      logDragSize('fallback', { explicit });
      return parseInventorySize(undefined);
    };

    html.off('dragover.df-grid').on('dragover.df-grid', '.df-enc-band .df-cell, .df-enc-band', (ev: any) => {
      ev.preventDefault();
      const cellEl = (ev.target as HTMLElement)?.closest?.('.df-cell') as HTMLElement | null;
      if (!cellEl) return;
      const bandEl = cellEl.closest('.df-enc-band') as HTMLElement | null;
      const band = bandEl?.dataset?.band;
      if (band !== 'not' && band !== 'enc' && band !== 'heavy') return;
      const col = Number(cellEl.dataset?.col || 0);
      const row = Number(cellEl.dataset?.row || 0);
      if (!col || !row) return;

      clearDropHighlight();

      const dragItem = this.#resolveDraggedActorOrWorldItem();
      const hoverItem = this.#itemAtInventoryCell(band, col, row);
      if (canLoadAmmunitionOnto(dragItem, hoverItem)) {
        const flags = hoverItem.getFlag?.('mastery-system', 'equipment') || {};
        const size = itemInventorySize(hoverItem);
        const ox = Number(flags.grid?.x || col);
        const oy = Number(flags.grid?.y || row);
        const bandCells = html.find(`.df-enc-band[data-band="${band}"] .df-cell`);
        for (let dy = 0; dy < size.h; dy++) {
          for (let dx = 0; dx < size.w; dx++) {
            bandCells.filter(`[data-col="${ox + dx}"][data-row="${oy + dy}"]`).addClass('df-drop-valid');
          }
        }
        return;
      }

      const size = resolveDragSize(ev);
      const BAND_COLS = ZONE_WIDTH_COLS;
      const BAND_ROWS = 9;
      const w = Math.min(BAND_COLS, size.w);
      const h = Math.min(BAND_ROWS, size.h);
      const footprintFits = fitsInGrid(col, row, w, h, BAND_COLS, BAND_ROWS);
      const dragItemId = (window as any).__msDragItemId as string | undefined;
      const rects = this.#inventoryBandRects(band, dragItemId);

      const cellOccupied = (x: number, y: number) =>
        rects.some(rect => rectsOverlap(rect, { x, y, w: 1, h: 1 }));

      const bandCells = html.find(`.df-enc-band[data-band="${band}"] .df-cell`);
      for (let dy = 0; dy < h; dy++) {
        for (let dx = 0; dx < w; dx++) {
          const x = col + dx;
          const y = row + dy;
          const targetCell = bandCells.filter(`[data-col="${x}"][data-row="${y}"]`);
          if (targetCell.length > 0) {
            const occupied = cellOccupied(x, y);
            targetCell.addClass(!footprintFits || occupied ? 'df-drop-invalid' : 'df-drop-valid');
          }
        }
      }
    });

    html.off('dragleave.df-grid').on('dragleave.df-grid', '.df-enc-band', () => {
      clearDropHighlight();
    });

    html.off('drop.df-grid').on('drop.df-grid', '.df-enc-band', () => {
      clearDropHighlight();
    });
    
    // Add spell
    // Removed add-spell-btn handler - using add-spell-creation-btn instead
    
    // Delete skill
    html.find('.skill-delete').on('click', this.#onSkillDelete.bind(this));
    
    // Power use
    html.find('.power-use').on('click', this.#onPowerUse.bind(this));
    html.find('.power-use-btn').on('click', this.#onPowerUse.bind(this));
    
    // Power details toggle
    html.find('.power-toggle-details').on('click', this.#onPowerToggleDetails.bind(this));

    html
      .off('change.msPowerRename', '.power-display-name-input')
      .on('change.msPowerRename', '.power-display-name-input', this.#onPowerDisplayNameChange.bind(this));
    html
      .off('keydown.msPowerRename', '.power-display-name-input')
      .on('keydown.msPowerRename', '.power-display-name-input', (ev: JQuery.TriggeredEvent) => {
        if ((ev as JQuery.KeyDownEvent).key === 'Enter') {
          ev.preventDefault();
          (ev.currentTarget as HTMLInputElement)?.blur();
        }
      });

    // Power mechanics editor (structured block)
    html.find('.power-edit-mechanics').on('click', this.#onPowerEditMechanics.bind(this));
    
    // Power level increase/decrease (with confirmation)
    html.off('click', '.power-increase-level').on('click', '.power-increase-level', this.#onPowerIncreaseLevel.bind(this));
    html.off('click', '.power-decrease-level').on('click', '.power-decrease-level', this.#onPowerDecreaseLevel.bind(this));
    html.find('.confirm-power-level-changes').on('click', this.#onConfirmPowerLevelChanges.bind(this));
    html.find('.cancel-power-level-changes').on('click', this.#onCancelPowerLevelChanges.bind(this));
    
    // Initialize pending power level changes tracking
    this._pendingPowerLevelChanges = {};
    
    // Initialize UI state for power level distribution
    this.#updatePowerLevelUI();
    
    // Active buff removal
    html.find('.active-buff-remove').on('click', this.#onActiveBuffRemove.bind(this));
    
    // Item controls
    html.find('.item-create').on('click', this.#onItemCreate.bind(this));
    html.find('.item-edit').on('click', this.#onItemEdit.bind(this));
    html.find('.item-delete').on('click', this.#onItemDelete.bind(this));

    html.off('pointerdown.iteminfo').on('pointerdown.iteminfo', '.tab.equipment .df-item-tile', (ev: JQuery.TriggeredEvent) => {
      const t = ev.target as HTMLElement;
      if (t.closest('.item-edit, .item-delete, a, button')) return;
      const orig = ev.originalEvent as PointerEvent | undefined;
      if (!orig) return;
      const tile = ev.currentTarget as HTMLElement;
      const itemId = tile.dataset?.itemId;
      if (!itemId) return;
      this.#itemInfoPointerDown = { itemId, x: orig.clientX, y: orig.clientY };
    });

    html.off('click.iteminfo').on('click.iteminfo', '.tab.equipment .df-item-tile', async (ev: JQuery.TriggeredEvent) => {
      const t = ev.target as HTMLElement;
      if (t.closest('.item-edit, .item-delete, a, button')) return;
      const orig = ev.originalEvent as MouseEvent | undefined;
      if (!orig) return;
      const tile = ev.currentTarget as HTMLElement;
      const itemId = tile.dataset?.itemId;
      if (!itemId || !this.#itemInfoPointerDown || this.#itemInfoPointerDown.itemId !== itemId) {
        this.#itemInfoPointerDown = null;
        return;
      }
      const dx = orig.clientX - this.#itemInfoPointerDown.x;
      const dy = orig.clientY - this.#itemInfoPointerDown.y;
      this.#itemInfoPointerDown = null;
      if (Math.hypot(dx, dy) > 12) return;

      const item = this.actor.items.get(itemId);
      if (!item) return;

      ev.preventDefault();
      ev.stopPropagation();

      const { ItemInfoDialog } = await import('./item-info-dialog.js');
      await ItemInfoDialog.show(item);
    });
    
    // HP adjustment
    html.find('.hp-adjust').on('click', this.#onHPAdjust.bind(this));
    
    // Stress adjustment
    html.find('.stress-adjust').on('click', this.#onStressAdjust.bind(this));
    
    // Stone adjustment
    html.find('.stone-adjust').on('click', this.#onStoneAdjust.bind(this));
  }

  /**
   * Calculate cost to increase an attribute from current value to next value.
   * New spec: bands 1–8 / 9–16 / … / 73–80 cost 1 / 2 / … / 10 XP per +1.
   */
  #calculateAttributeCost(currentValue: number): number {
    return attributeBandCost(currentValue + 1);
  }

  /** Floor for attribute value when refunding XP (set at creation finalize; migrated for older actors). */
  #getAttributeXpBaseline(attributeKey: string): number {
    const system = this.actor.system as any;
    const current = Number(system.attributes?.[attributeKey]?.value ?? 2) || 0;
    const b = system.xp?.attributeBaselines?.[attributeKey];
    if (typeof b === 'number' && !Number.isNaN(b)) {
      // Defensive clamp: a stored baseline must never exceed the current value.
      // If a stale/too-high baseline was snapshotted (e.g. before a GM reset or
      // a rebuild lowered the attribute, or off the world actor vs. an unlinked
      // token), the floor would otherwise sit ABOVE the current value and
      // wrongly reject even simple increases ("Invalid attribute change …").
      return Math.min(b, current);
    }
    return current;
  }

  /** One-time: snapshot current attributes as XP refund floors for legacy completed characters. */
  async #migrateAttributeBaselinesIfNeeded(): Promise<void> {
    const system = this.actor.system as any;
    if (system.creation?.complete === false) return;
    if (!this.actor.isOwner) return;
    if (!system.xp) return;
    const keys = ['might', 'agility', 'vitality', 'intellect', 'resolve', 'influence', 'wits'];
    const existing = system.xp.attributeBaselines;
    if (existing && typeof existing === 'object' && keys.every(k => typeof existing[k] === 'number')) return;

    const baselines: Record<string, number> = {};
    for (const k of keys) baselines[k] = system.attributes?.[k]?.value ?? 2;
    try {
      await this.actor.update({ 'system.xp.attributeBaselines': baselines }, { render: false });
    } catch (e) {
      console.warn('Mastery System | attributeBaselines migration failed', e);
    }
  }

  /**
   * Net XP effect of pending attribute deltas (positive = spend, negative = refund).
   */
  #calculateAttributePendingNetCost(pendingMap: Record<string, number>): number {
    return calculateAttributePendingNetCost(this.actor, pendingMap);
  }

  /**
   * Calculate cost to raise a power to a specific level.
   * New spec: `cost = newLevel` for levels 1–16 (1, 2, 3, …, 16 XP).
   */
  #calculatePowerLevelCost(targetLevel: number): number {
    return powerLevelCost(targetLevel);
  }

  /**
   * Get a power's minimum level (baseline from character creation)
   */
  #getPowerMinLevel(item: any): number {
    // Shared baseline (floored at the category creation rank) so a corrupt or
    // missing minLevel cannot let a Power be downgraded below its creation rank.
    return resolvePowerMinLevel(item);
  }

  /**
   * Max Power Level a character of the actor's MR may purchase.
   * MR 1–2 → 4, MR 3 → 8, MR 4 → 12, MR 5+ → 16.
   */
  #getMaxPurchasablePowerLevel(): number {
    const mr = Math.max(1, Math.floor(Number((this.actor.system as any)?.mastery?.rank) || 1));
    return calculateMaxPowerLevel(mr);
  }

  /**
   * Calculate net pending cost (signed) for all pending power level changes
   * Positive pending: costs for increasing
   * Negative pending: refunds for decreasing
   */
  #calculatePowerPendingNetCost(pendingMap: Record<string, number>): number {
    return calculatePowerPendingNetCost(this.actor, pendingMap);
  }

  /**
   * Get XP state, ensuring all fields exist (backward compatibility)
   */
  #getXpState(actor: any): {
    available: number;
    regularAvailable: number;
    freeAvailable: number;
    freeEarned: number;
    freeSpent: number;
    totalEarned: number;
    totalSpent: number;
    history: any[];
  } {
    const system = actor.system || {};
    const points = system.points || {};
    const xp = system.xp || {};

    const regularAvailable = points.xp ?? 0;
    const freeAvailable = points.xpFree ?? 0;

    return {
      // Combined spendable XP (Free + regular) — used for affordability checks.
      available: regularAvailable + freeAvailable,
      regularAvailable,
      freeAvailable,
      freeEarned: xp.freeEarned ?? 0,
      freeSpent: xp.freeSpent ?? 0,
      totalEarned: xp.totalEarned ?? 0,
      totalSpent: xp.totalSpent ?? 0,
      history: xp.history ?? []
    };
  }

  /**
   * Two-pool XP accounting (free-first). Given a net cost (positive = spend,
   * negative = refund), return the new balances for both pools. Free XP is
   * spent before regular XP; refunds refill the free pool first (capped at
   * `freeEarned`) so up/down testing in the free phase does not leak XP into
   * the regular pool.
   */
  #applyXpCost(
    xpState: { regularAvailable: number; freeAvailable: number; freeEarned: number; freeSpent: number; totalSpent: number },
    netCost: number
  ): { pointsXp: number; pointsXpFree: number; totalSpent: number; freeSpent: number } {
    let regular = xpState.regularAvailable;
    let free = xpState.freeAvailable;
    let totalSpent = xpState.totalSpent;
    let freeSpent = xpState.freeSpent;

    if (netCost > 0) {
      const fromFree = Math.min(free, netCost);
      const fromReg = netCost - fromFree;
      free -= fromFree;
      regular -= fromReg;
      freeSpent += fromFree;
      totalSpent += fromReg;
    } else if (netCost < 0) {
      const refund = -netCost;
      const toFree = Math.max(0, Math.min(refund, xpState.freeEarned - free));
      const toReg = refund - toFree;
      free += toFree;
      regular += toReg;
      freeSpent = Math.max(0, freeSpent - toFree);
      totalSpent = Math.max(0, totalSpent - toReg);
    }

    return { pointsXp: regular, pointsXpFree: free, totalSpent: Math.max(0, totalSpent), freeSpent: Math.max(0, freeSpent) };
  }

  /**
   * Handle pending attribute increase (XP distribution mode)
   */
  async #onAttributeIncreaseXP(event: JQuery.ClickEvent) {
    event.preventDefault();
    event.stopPropagation();
    // Check if user is owner
    if (!this.actor.isOwner) {
      console.warn('Mastery System | #onAttributeIncreaseXP: User is not owner');
      (ui as any).notifications?.warn('Only the owner can distribute Attribute Points.');
      return;
    }
    
    const $target = $(event.currentTarget);
    const attributeName = $target.data('attribute') as string;
    if (!attributeName) {
      console.error('Mastery System | #onAttributeIncreaseXP: No attribute name found', {
        target: event.currentTarget,
        targetData: $target.data(),
        targetAttrs: Array.from((event.currentTarget as HTMLElement).attributes).map(a => `${a.name}="${a.value}"`)
      });
      return;
    }
    
    const currentValue = this.actor.system.attributes[attributeName]?.value || 0;
    const pending = this._pendingAttributeChanges[attributeName] || 0;
    const nextPending = pending + 1;
    const effectiveAfter = currentValue + nextPending;
    if (effectiveAfter > 80) {
      console.warn('Mastery System | #onAttributeIncreaseXP: Max value exceeded', { effectiveAfter });
      (ui as any).notifications?.warn('This attribute cannot exceed maximum value (80).');
      return;
    }

    /**
     * New spec — once-per-step rule. Each Attribute may be increased by
     * at most +1 per Upgrade Step. The pending delta is therefore capped
     * at +1, and if the attribute has *already* been bumped earlier in
     * this same step (and not refunded back below its step-start value)
     * we reject the click.
     */
    // Free-XP phase is exempt from the once-per-step "+1" cap.
    if (!this.#hasFreeXp()) {
      if (nextPending > 1) {
        (ui as any).notifications?.warn(
          `${attributeName.charAt(0).toUpperCase() + attributeName.slice(1)} can only be increased by +1 per session. Use Free XP to raise it again.`,
        );
        return;
      }
      const stepRule = await import('../utils/xp-step-rule.js');
      const step = stepRule.readStep(this.actor);
      if (nextPending > 0 && stepRule.isBumped(step, 'attribute', attributeName)) {
        (ui as any).notifications?.warn(
          `${attributeName.charAt(0).toUpperCase() + attributeName.slice(1)} was already increased this session. Use Free XP to raise it again.`,
        );
        return;
      }
    }

    const simulateMap = { ...this._pendingAttributeChanges, [attributeName]: nextPending };
    if (simulateMap[attributeName] === 0) delete simulateMap[attributeName];

    const netPendingCost = this.#calculateAttributePendingNetCost(simulateMap);
    const xpState = this.#getXpState(this.actor);
    if (netPendingCost > xpState.available) {
      console.warn('Mastery System | #onAttributeIncreaseXP: Not enough points', {
        netPendingCost,
        availablePoints: xpState.available
      });
      (ui as any).notifications?.warn(
        `Not enough XP for this change (net ${netPendingCost} vs ${xpState.available} available).`
      );
      return;
    }

    this._pendingAttributeChanges[attributeName] = nextPending;
    if (this._pendingAttributeChanges[attributeName] === 0) {
      delete this._pendingAttributeChanges[attributeName];
    }
    // Update UI
    this.#updateAttributeXPUI();
  }

  /**
   * Handle pending attribute decrease (XP distribution mode)
   */
  #onAttributeDecreaseXP(event: JQuery.ClickEvent) {
    event.preventDefault();
    event.stopPropagation();
    const $target = $(event.currentTarget);
    const attributeName = $target.data('attribute') as string;
    if (!attributeName) {
      console.error('Mastery System | #onAttributeDecreaseXP: No attribute name found', {
        target: event.currentTarget,
        targetData: $target.data(),
        targetAttrs: Array.from((event.currentTarget as HTMLElement).attributes).map(a => `${a.name}="${a.value}"`)
      });
      return;
    }
    
    const currentValue = this.actor.system.attributes[attributeName]?.value || 0;
    const pending = this._pendingAttributeChanges[attributeName] || 0;
    const baseline = this.#getAttributeXpBaseline(attributeName);
    const nextPending = pending - 1;
    const effectiveAfter = currentValue + nextPending;
    if (effectiveAfter < baseline) {
      (ui as any).notifications?.warn(
        `Cannot lower ${attributeName} below ${baseline} (creation baseline). Ask the GM to unlock creation if you need a full rebuild.`
      );
      return;
    }
    
    this._pendingAttributeChanges[attributeName] = nextPending;
    if (this._pendingAttributeChanges[attributeName] === 0) {
      delete this._pendingAttributeChanges[attributeName];
    }
    // Update UI
    this.#updateAttributeXPUI();
  }

  /**
   * Free-XP phase: while the character has any Free XP available
   * (`system.points.xpFree > 0`), upgrades are spent freely — no once-per-step
   * "+1" cap on Attributes / Skills / Powers. Free XP is always spent before
   * regular XP; once it is exhausted, the normal once-per-step rule applies to
   * the regular pool again.
   */
  #hasFreeXp(): boolean {
    return ((this.actor.system as any)?.points?.xpFree ?? 0) > 0;
  }

  /**
   * Update the attribute XP distribution UI
   */
  #updateAttributeXPUI() {
    const html = $(this.element);
    const netPendingCost = this.#calculateAttributePendingNetCost(this._pendingAttributeChanges);
    const xpState = this.#getXpState(this.actor);
    const remainingPoints = xpState.available - netPendingCost;
    this.#setHeaderXpDisplay(remainingPoints);
    
    const totalAbsPending = Object.values(this._pendingAttributeChanges).reduce((sum, val) => sum + Math.abs(val), 0);
    html.find('#pending-attribute-changes-count').text(totalAbsPending);
    html.find('#remaining-attribute-xp').text(Math.max(0, remainingPoints));
    
    /**
     * New spec — once-per-step rule. Each Attribute may only be increased
     * by +1 per Upgrade Step. Disable "+" if the attribute is already at
     * its pending cap of +1 OR if it was already bumped earlier this step.
     */
    const bumpedAttributes = new Set<string>(
      Array.isArray((this.actor.system as any)?.xp?.currentStep?.attributes)
        ? ((this.actor.system as any).xp.currentStep.attributes as unknown[]).map((v) => String(v ?? ''))
        : [],
    );
    const attributeKeys = ['might', 'agility', 'vitality', 'intellect', 'resolve', 'influence', 'wits'];
    for (const attrKey of attributeKeys) {
      const pending = this._pendingAttributeChanges[attrKey] || 0;
      const pendingChangeEl = html.find(`.attribute-pending-change[data-attribute="${attrKey}"]`);
      const pendingDeltaEl = pendingChangeEl.find('.pending-delta');

      if (pending !== 0) {
        pendingChangeEl.show();
        pendingDeltaEl.text(pending > 0 ? `+${pending}` : `${pending}`);
      } else {
        pendingChangeEl.hide();
        pendingDeltaEl.text('');
      }

      const currentValue = this.actor.system.attributes[attrKey]?.value || 0;
      const baseline = this.#getAttributeXpBaseline(attrKey);

      const decreaseBtn = html.find(`.attr-decrease-xp[data-attribute="${attrKey}"]`);
      const canDecrease = currentValue + pending - 1 >= baseline;
      decreaseBtn.prop('disabled', !canDecrease);

      const increaseBtn = html.find(`.attr-increase-xp[data-attribute="${attrKey}"]`);
      const nextPending = pending + 1;
      const effectiveAfter = currentValue + nextPending;
      // Free-XP phase: spend freely (no per-step cap).
      const wouldExceedStepCap =
        !this.#hasFreeXp() &&
        (nextPending > 1 || (nextPending > 0 && bumpedAttributes.has(attrKey)));
      if (effectiveAfter > 80 || wouldExceedStepCap) {
        increaseBtn.prop('disabled', true);
        if (wouldExceedStepCap) {
          increaseBtn.attr(
            'title',
            this.#hasFreeXp()
              ? ''
              : 'Bereits in dieser Sitzung erhöht. Free XP (★) hebt das Limit auf.',
          );
        }
      } else {
        increaseBtn.removeAttr('title');
        if (this.#hasFreeXp()) {
          increaseBtn.attr('title', 'Free XP aktiv — frei verteilbar (kein Step-Limit).');
        }
        const simulateMap = { ...this._pendingAttributeChanges, [attrKey]: nextPending };
        if (simulateMap[attrKey] === 0) delete simulateMap[attrKey];
        const simNet = this.#calculateAttributePendingNetCost(simulateMap);
        increaseBtn.prop('disabled', simNet > xpState.available);
      }
    }
    
    const confirmBtn = html.find('#confirm-attribute-changes-btn');
    const cancelBtn = html.find('#cancel-attribute-changes-btn');
    if (totalAbsPending > 0) {
      confirmBtn.prop('disabled', false);
      cancelBtn.prop('disabled', false);
    } else {
      confirmBtn.prop('disabled', true);
      cancelBtn.prop('disabled', true);
    }
  }

  /**
   * Confirm and apply pending attribute changes
   */
  async #onConfirmAttributeChanges(event: JQuery.ClickEvent) {
    event.preventDefault();
    event.stopPropagation();
    
    if (!this.actor.isOwner) {
      (ui as any).notifications?.warn('Only the owner can confirm Attribute Point changes.');
      return;
    }
    
    const xpState = this.#getXpState(this.actor);
    const totalNetCost = this.#calculateAttributePendingNetCost(this._pendingAttributeChanges);

    const result = await applyAttributePendingChanges(this.actor, this._pendingAttributeChanges);
    if (!result.ok) {
      (ui as any).notifications?.error(result.error || 'Could not apply attribute changes.');
      return;
    }

    this._pendingAttributeChanges = {};
    
    if (totalNetCost > 0) {
      (ui as any).notifications?.info(
        `Attribute changes confirmed! Cost: ${totalNetCost} XP, Remaining: ${this.#getXpState(this.actor).available}`,
      );
    } else if (totalNetCost < 0) {
      (ui as any).notifications?.info(
        `Attribute changes confirmed! Refund: ${Math.abs(totalNetCost)} XP, Remaining: ${this.#getXpState(this.actor).available}`,
      );
    } else {
      (ui as any).notifications?.info('Attribute changes confirmed.');
    }
    
    await this.render();
  }

  /**
   * Cancel pending attribute changes
   */
  #onCancelAttributeChanges(event: JQuery.ClickEvent) {
    event.preventDefault();
    event.stopPropagation();
    
    // Clear pending changes
    this._pendingAttributeChanges = {};
    
    // Update UI
    this.#updateAttributeXPUI();
    
    (ui as any).notifications?.info('Pending attribute changes cancelled.');
  }

  /**
   * Handle pending power level increase
   */
  async #onPowerIncreaseLevel(event: JQuery.ClickEvent) {
    event.preventDefault();
    event.stopPropagation();
    // Check if user is owner
    if (!this.actor.isOwner) {
      (ui as any).notifications?.warn('Only the owner can distribute XP.');
      return;
    }
    
    const $button = $(event.currentTarget);
    const itemId = $button.data('item-id') as string;
    if (!itemId) {
      console.error('Mastery System | #onPowerIncreaseLevel: No item ID found');
      return;
    }
    
    const item = this.actor.items.get(itemId);
    if (!item || item.type !== 'power') {
      console.error('Mastery System | #onPowerIncreaseLevel: Item not found or not a power');
      return;
    }
    
    const currentLevel = (item.system as any).level || 1;
    const pending = this._pendingPowerLevelChanges[itemId] || 0;
    const effectiveLevel = currentLevel + pending;
    const levelCap = this.#getMaxPurchasablePowerLevel();
    if (effectiveLevel >= levelCap) {
      console.warn('Mastery System | #onPowerIncreaseLevel: Max level reached', { effectiveLevel, levelCap });
      (ui as any).notifications?.warn(
        `This power cannot exceed your current maximum (level ${levelCap}; MR 1-2 cap 4, MR 3 cap 8, MR 4 cap 12, MR 5+ cap 16).`,
      );
      return;
    }

    /**
     * Once-per-step rule. Each Power may be increased by at most +1 per
     * Upgrade Step — UNLESS the character is in the Free-XP phase, where
     * upgrades may be stacked freely.
     */
    if (!this.#hasFreeXp()) {
      if (pending + 1 > 1) {
        (ui as any).notifications?.warn(
          `${item.name} can only be increased by +1 Level per session. Use Free XP to raise it again.`,
        );
        return;
      }
      const stepRule = await import('../utils/xp-step-rule.js');
      const step = stepRule.readStep(this.actor);
      if (pending + 1 > 0 && stepRule.isBumped(step, 'power', itemId)) {
        (ui as any).notifications?.warn(
          `${item.name} was already increased this session. Use Free XP to raise it again.`,
        );
        return;
      }
    }

    // Simulate the new pending state
    const simulateMap = { ...this._pendingPowerLevelChanges, [itemId]: pending + 1 };
    const netCost = this.#calculatePowerPendingNetCost(simulateMap);
    // Combined spendable XP (Free pool is spent first, then regular).
    const availableXP = (this.actor.system.points?.xp || 0) + (this.actor.system.points?.xpFree || 0);
    // Check affordability
    if (netCost > availableXP) {
      console.warn('Mastery System | #onPowerIncreaseLevel: Not enough XP', {
        netCost,
        availableXP
      });
      const nextCost = this.#calculatePowerLevelCost(effectiveLevel + 1);
      (ui as any).notifications?.warn(`Not enough XP! This increase would cost ${nextCost} XP, but you only have ${availableXP - (netCost - nextCost)} remaining.`);
      return;
    }
    
    // Add pending increase (can be negative, so we increment)
    this._pendingPowerLevelChanges[itemId] = pending + 1;
    if (this._pendingPowerLevelChanges[itemId] === 0) {
      delete this._pendingPowerLevelChanges[itemId];
    }
    // Update UI
    this.#updatePowerLevelUI();
  }

  /**
   * Handle pending power level decrease
   */
  #onPowerDecreaseLevel(event: JQuery.ClickEvent) {
    event.preventDefault();
    event.stopPropagation();
    // Check if user is owner
    if (!this.actor.isOwner) {
      (ui as any).notifications?.warn('Only the owner can distribute XP.');
      return;
    }
    
    const $button = $(event.currentTarget);
    const itemId = $button.data('item-id') as string;
    if (!itemId) {
      console.error('Mastery System | #onPowerDecreaseLevel: No item ID found');
      return;
    }
    
    const item = this.actor.items.get(itemId);
    if (!item || item.type !== 'power') {
      console.error('Mastery System | #onPowerDecreaseLevel: Item not found or not a power');
      return;
    }
    
    const currentLevel = (item.system as any).level || 1;
    const minLevel = this.#getPowerMinLevel(item);
    const pending = this._pendingPowerLevelChanges[itemId] || 0;
    const effectiveLevel = currentLevel + pending;
    // Check if we can go below minLevel
    if (effectiveLevel <= minLevel) {
      console.warn('Mastery System | #onPowerDecreaseLevel: Cannot go below minLevel', {
        effectiveLevel,
        minLevel
      });
      (ui as any).notifications?.warn(`This power cannot go below level ${minLevel} (baseline from character creation).`);
      return;
    }
    
    // Decrease pending (can go negative)
    this._pendingPowerLevelChanges[itemId] = pending - 1;
    if (this._pendingPowerLevelChanges[itemId] === 0) {
      delete this._pendingPowerLevelChanges[itemId];
    }
    // Update UI
    this.#updatePowerLevelUI();
  }

  /**
   * Update the power level distribution UI
   */
  #updatePowerLevelUI() {
    const html = $(this.element);
    
    // Calculate net pending cost (signed)
    const netPendingCost = this.#calculatePowerPendingNetCost(this._pendingPowerLevelChanges);
    // Combined spendable XP (Free pool is spent first, then regular).
    const availableXP = (this.actor.system.points?.xp || 0) + (this.actor.system.points?.xpFree || 0);
    const remainingXP = availableXP - netPendingCost; // Can be negative if refunding
    this.#setHeaderXpDisplay(remainingXP);
    
    // Calculate total absolute pending changes (for display)
    const totalPendingChanges = Object.values(this._pendingPowerLevelChanges).reduce((sum, val) => sum + Math.abs(val), 0);
    
    // Update pending changes count and remaining XP
    html.find('#pending-power-level-changes-count').text(totalPendingChanges);
    html.find('#remaining-power-level-mp').text(Math.max(0, remainingXP));
    
    // Once-per-step rule: powers already bumped this step have "+" disabled.
    const bumpedPowers = new Set<string>(
      Array.isArray((this.actor.system as any)?.xp?.currentStep?.powers)
        ? ((this.actor.system as any).xp.currentStep.powers as unknown[]).map((v) => String(v ?? ''))
        : [],
    );

    // Update each power's pending display and button states
    const powers = this.actor.items.filter((item: any) => item.type === 'power');
    for (const power of powers) {
      const itemId = power.id;
      const pending = this._pendingPowerLevelChanges[itemId] || 0;
      const currentLevel = (power.system as any).level || 1;
      const effectiveLevel = currentLevel + pending;
      const minLevel = this.#getPowerMinLevel(power);
      
      // Update pending change display (signed)
      const pendingChangeEl = html.find(`.power-level-pending-change[data-item-id="${itemId}"]`);
      const pendingDeltaEl = pendingChangeEl.find('.pending-delta');
      
      if (pending !== 0) {
        pendingChangeEl.show();
        pendingDeltaEl.text(pending > 0 ? `+${pending}` : `${pending}`);
      } else {
        pendingChangeEl.hide();
      }
      
      // Update decrease button state
      const decreaseBtn = html.find(`.power-decrease-level[data-item-id="${itemId}"]`);
      decreaseBtn.prop('disabled', effectiveLevel <= minLevel);
      
      // Update increase button state
      const increaseBtn = html.find(`.power-increase-level[data-item-id="${itemId}"]`);
      const nextPending = pending + 1;
      // Free-XP phase: spend freely (no per-step cap).
      const wouldExceedStepCap =
        !this.#hasFreeXp() &&
        (nextPending > 1 || (nextPending > 0 && bumpedPowers.has(itemId)));
      if (effectiveLevel >= this.#getMaxPurchasablePowerLevel() || wouldExceedStepCap) {
        increaseBtn.prop('disabled', true);
        if (wouldExceedStepCap) {
          increaseBtn.attr(
            'title',
            this.#hasFreeXp()
              ? ''
              : 'Bereits in dieser Sitzung erhöht. Free XP (★) hebt das Limit auf.',
          );
        }
      } else {
        increaseBtn.removeAttr('title');
        if (this.#hasFreeXp()) {
          increaseBtn.attr('title', 'Free XP aktiv — frei verteilbar (kein Step-Limit).');
        }
        const simulateMap = { ...this._pendingPowerLevelChanges, [itemId]: nextPending };
        const simulateNetCost = this.#calculatePowerPendingNetCost(simulateMap);
        increaseBtn.prop('disabled', simulateNetCost > availableXP);
      }
    }
    
    // Update confirm/cancel buttons
    const confirmBtn = html.find('#confirm-power-level-changes-btn');
    const cancelBtn = html.find('#cancel-power-level-changes-btn');
    if (totalPendingChanges > 0) {
      confirmBtn.prop('disabled', false);
      cancelBtn.prop('disabled', false);
    } else {
      confirmBtn.prop('disabled', true);
      cancelBtn.prop('disabled', true);
    }
  }

  /**
   * Confirm and apply pending power level changes
   */
  async #onConfirmPowerLevelChanges(event: JQuery.ClickEvent) {
    event.preventDefault();
    event.stopPropagation();
    
    // Check if user is owner
    if (!this.actor.isOwner) {
      (ui as any).notifications?.warn('Only the owner can confirm Power Level changes.');
      return;
    }
    
    // Get XP state
    const xpState = this.#getXpState(this.actor);
    const availableXP = xpState.available; // combined Free + regular
    
    // Calculate net cost (signed - can be negative for refunds)
    const netCost = this.#calculatePowerPendingNetCost(this._pendingPowerLevelChanges);
    
    // Validate affordability (only check if net cost is positive)
    if (netCost > availableXP) {
      (ui as any).notifications?.error(`Not enough XP! Net cost: ${netCost}, Available: ${availableXP}`);
      return;
    }
    
    // Prepare before state for history
    const beforeState = {
      available: xpState.available,
      totalEarned: xpState.totalEarned,
      totalSpent: xpState.totalSpent,
    };
    const powerLevelsBefore: Record<string, number> = {};
    const powerNamesBefore: Record<string, string> = {};
    for (const powerId of Object.keys(this._pendingPowerLevelChanges)) {
      const item = this.actor.items.get(powerId);
      if (!item) continue;
      powerLevelsBefore[powerId] = Number((item.system as any)?.level ?? 1) || 1;
      powerNamesBefore[powerId] = String(item.name || powerId);
    }

    // Track power changes for history
    const powerChanges: Array<{powerId: string; powerName: string; from: number; to: number; cost: number}> = [];

    const cap = this.#getMaxPurchasablePowerLevel();
    for (const [powerId, pending] of Object.entries(this._pendingPowerLevelChanges)) {
      if (pending > 0) {
        const p = this.actor.items.get(powerId);
        if (p) {
          const cl = (p.system as any).level || 1;
          if (cl + pending > cap) {
            (ui as any).notifications?.error(
              `Pending level increases exceed your current maximum (${cap}). Adjust or cancel.`,
            );
            return;
          }
        }
      }
    }

    // Apply updates
    for (const [powerId, pending] of Object.entries(this._pendingPowerLevelChanges)) {
      if (pending !== 0) {
        const powerItem = this.actor.items.get(powerId);
        if (powerItem) {
          const currentLevel = (powerItem.system as any).level || 1;
          const minLevel = this.#getPowerMinLevel(powerItem);
          const newLevel = Math.max(minLevel, Math.min(cap, currentLevel + pending)); // Clamp to [minLevel..cap]
          
          // Calculate cost for this power's change
          let powerCost = 0;
          if (pending > 0) {
            for (let i = 0; i < pending; i++) {
              const targetLevel = currentLevel + i + 1;
              powerCost += this.#calculatePowerLevelCost(targetLevel);
            }
          } else {
            const steps = Math.abs(pending);
            for (let i = 0; i < steps; i++) {
              const refundLevel = currentLevel - i;
              powerCost -= this.#calculatePowerLevelCost(refundLevel);
            }
          }
          
          powerChanges.push({
            powerId,
            powerName: powerItem.name,
            from: currentLevel,
            to: newLevel,
            cost: powerCost
          });
          
          const sys = powerItem.system as any;
          const powerUpdate: Record<string, unknown> = { 'system.level': newLevel };
          if (sys.levels && typeof sys.levels === 'object' && !Array.isArray(sys.levels)) {
            powerUpdate['system.rank'] = getPowerDefinitionRank(newLevel, sys.levels);
          }
          await powerItem.update(powerUpdate);
        }
      }
    }
    
    // Two-pool accounting: Free XP is spent before regular XP.
    const acct = this.#applyXpCost(xpState, netCost);
    const newXP = acct.pointsXp + acct.pointsXpFree; // combined remaining
    /**
     * Once-per-step rule. Each Power may only be increased by +1 per Upgrade
     * Step — UNLESS the character is in the Free-XP phase (unrestricted).
     * Mark each positively-bumped power; un-bump on refund.
     */
    const unrestrictedPow = this.#hasFreeXp();
    const stepRulePow = await import('../utils/xp-step-rule.js');
    let stepAfterPow = stepRulePow.readStep(this.actor);
    for (const change of powerChanges) {
      if (unrestrictedPow) continue;
      const pending = this._pendingPowerLevelChanges[change.powerId] || 0;
      if (pending > 0) {
        if (stepRulePow.isBumped(stepAfterPow, 'power', change.powerId)) {
          (ui as any).notifications?.error(
            `${change.powerName} was already increased this session. Use Free XP to raise it again.`,
          );
          return;
        }
        stepAfterPow = stepRulePow.recordBump(stepAfterPow, 'power', change.powerId);
      } else if (pending < 0) {
        stepAfterPow = stepRulePow.undoBump(stepAfterPow, 'power', change.powerId);
      }
    }

    const updates: any = {
      'system.points.xp': acct.pointsXp,
      'system.points.xpFree': acct.pointsXpFree,
      'system.xp.totalSpent': acct.totalSpent,
      'system.xp.freeSpent': acct.freeSpent,
      'system.xp.currentStep.attributes': [...stepAfterPow.attributes],
      'system.xp.currentStep.skills': [...stepAfterPow.skills],
      'system.xp.currentStep.powers': [...stepAfterPow.powers],
      'system.xp.currentStep.artifacts': [...stepAfterPow.artifacts],
    };

    // Ensure XP structure exists
    if (!this.actor.system.xp) {
      updates['system.xp.totalEarned'] = xpState.totalEarned;
      updates['system.xp.history'] = [];
    }

    const powerHistory = buildBandedStepEntries({
      category: 'power',
      pendingMap: this._pendingPowerLevelChanges,
      getCurrent: key => powerLevelsBefore[key] ?? 1,
      getLabel: key => powerNamesBefore[key] || key,
      costForTarget: powerLevelCost,
      before: beforeState,
      after: {
        available: newXP,
        totalEarned: xpState.totalEarned,
        totalSpent: acct.totalSpent,
      },
      user: currentXpUser(),
    });
    if (powerHistory.length) {
      updates['system.xp.history'] = appendXpHistory(this.actor, powerHistory);
    }

    await this.actor.update(updates);
    
    // Clear pending changes
    this._pendingPowerLevelChanges = {};
    
    // Show notification
    if (netCost > 0) {
      (ui as any).notifications?.info(`Power level changes confirmed! Cost: ${netCost} XP, Remaining: ${newXP}`);
    } else if (netCost < 0) {
      (ui as any).notifications?.info(`Power level changes confirmed! Refund: ${Math.abs(netCost)} XP, Remaining: ${newXP}`);
    } else {
      (ui as any).notifications?.info('Power level changes confirmed!');
    }
    
    // Re-render
    await this.render();
  }

  /**
   * Cancel pending power level changes
   */
  #onCancelPowerLevelChanges(event: JQuery.ClickEvent) {
    event.preventDefault();
    event.stopPropagation();
    
    // Clear pending changes
    this._pendingPowerLevelChanges = {};
    
    // Update UI
    this.#updatePowerLevelUI();
    
    (ui as any).notifications?.info('Pending power level changes cancelled.');
  }

  /**
   * Handle attribute roll — same chat card as skill rolls (TN, success, raises; flavor lists base TN + raises)
   */
  async #onAttributeRoll(event: JQuery.ClickEvent) {
    event.preventDefault();
    const element = event.currentTarget;
    const attribute = element.dataset.attribute;

    if (!attribute) return;

    const rollOptions = await this.#promptForAttributeRollOptions(attribute);
    if (!rollOptions) return;

    const actorData = (this.actor as any).system;
    let numDice = actorData.attributes?.[attribute]?.value || 0;
    const keepDice = actorData.mastery?.rank || 2;
    // Players Guide minimum-pool rule (~5888–5899) — apply *before* the
    // health penalty so the percentage scales with the post-floor pool.
    numDice = Math.max(numDice, keepDice);
    const { applyHealthAndEncumbrancePenalties } = await import('../utils/encumbrance.js');
    const poolPenalties = applyHealthAndEncumbrancePenalties(numDice, this.actor as any);
    numDice = poolPenalties.numDice;

    const attrLabel = attribute.charAt(0).toUpperCase() + attribute.slice(1);
    let flavor = `Attribute: ${attrLabel}, Base TN: ${rollOptions.baseTN}, Raises: ${rollOptions.raises}`;
    if (poolPenalties.healthPenaltyDice > 0) {
      flavor += ` (Health penalty: −${poolPenalties.healthPenaltyDice} dice)`;
    }

    const raiseTn = rollOptions.baseTN + rollOptions.raises * 4;
    let stoneBonusRaises = 0;
    try {
      const { getRoundState } = await import('../combat/action-economy.js');
      const combat = (game as any).combat;
      if (combat) {
        const rs = getRoundState(this.actor as Actor, combat);
        stoneBonusRaises = Math.max(0, Number(rs?.stoneBonuses?.freeRaises) || 0);
      }
    } catch {
      /* ignore */
    }

    const { masteryRoll } = await import('../dice/roll-handler.js');
    await masteryRoll({
      numDice,
      keepDice,
      skill: 0,
      tn: rollOptions.baseTN,
      normalTn: rollOptions.baseTN,
      raiseTn,
      declaredRaiseSlots: rollOptions.raises,
      stoneBonusRaises,
      raiseModel: 'skill',
      label: `${attrLabel} Check`,
      flavor,
      actorId: (this.actor as any).id,
      isSkillRoll: false,
      baseModifier: 0,
    });
  }

  /**
   * Prompt for attribute roll: difficulty, optional custom TN, raises (+4 TN each) — mirrors skill roll dialog
   */
  async #promptForAttributeRollOptions(
    attributeKey: string
  ): Promise<{ baseTN: number; raises: number; finalTN: number } | null> {
    const system = (this.actor as any).system;
    const masteryRank = system.mastery?.rank || 2;
    const standardTN = masteryRank * 8;
    const difficulties = {
      trivial: standardTN - 8,
      easy: standardTN - 4,
      standard: standardTN,
      challenging: standardTN + 4,
      hard: standardTN + 8,
      veryHard: standardTN + 12,
      heroic: standardTN + 16
    };
    const attrLabel = attributeKey.charAt(0).toUpperCase() + attributeKey.slice(1);
    const attrDice = system.attributes?.[attributeKey]?.value ?? 0;

    const content = `
      <form class="mastery-dialog-form">
        <div class="md-group">
          <label class="md-label">Attribute</label>
          <div class="md-attr-display">
            ${attrLabel} (${attrDice}d8, keep ${masteryRank})
          </div>
        </div>

        <div class="md-group md-group-difficulty">
          <label class="md-label">Difficulty</label>
          <select name="baseTN" id="attr-roll-baseTN" class="md-select md-select-difficulty">
            <option value="${difficulties.trivial}">Trivial (${difficulties.trivial})</option>
            <option value="${difficulties.easy}">Easy (${difficulties.easy})</option>
            <option value="${difficulties.standard}" selected>Standard (${difficulties.standard})</option>
            <option value="${difficulties.challenging}">Challenging (${difficulties.challenging})</option>
            <option value="${difficulties.hard}">Hard (${difficulties.hard})</option>
            <option value="${difficulties.veryHard}">Very Hard (${difficulties.veryHard})</option>
            <option value="${difficulties.heroic}">Heroic (${difficulties.heroic})</option>
            <option value="custom">Custom…</option>
          </select>
        </div>

        <div class="md-group" id="attr-custom-tn-group" style="display: none;">
          <label class="md-label">Custom TN</label>
          <input type="number" name="customTN" id="attr-roll-customTN" value="${difficulties.standard}" min="0" step="1" class="md-input" />
        </div>

        <div class="md-group">
          <label class="md-label">Raises <span class="md-sublabel">(+4 Raise TN each; Normal TN unchanged)</span></label>
          <input type="number" name="raises" id="attr-roll-raises" value="0" min="0" step="1" class="md-input" />
          <div class="md-final-tn">
            Normal TN: <strong><span id="attr-normal-tn-display">${difficulties.standard}</span></strong>
            · Raise TN: <strong><span id="attr-final-tn-display">${difficulties.standard}</span></strong>
          </div>
        </div>
      </form>
    `;

    return new Promise((resolve) => {
      const dialog = new Dialog(
        {
          title: `Roll ${attrLabel}`,
          content,
          buttons: {
            roll: {
              label: '<i class="fas fa-dice-d20"></i> Roll',
              callback: (html: JQuery) => {
                const baseTNSelect = html.find('[name="baseTN"]').val() as string;
                let baseTN: number;
                if (baseTNSelect === 'custom') {
                  baseTN = parseInt(html.find('[name="customTN"]').val() as string) || 0;
                } else {
                  baseTN = parseInt(baseTNSelect) || difficulties.standard;
                }
                const raises = parseInt(html.find('[name="raises"]').val() as string) || 0;
                const finalTN = baseTN + raises * 4;
                resolve({ baseTN, raises, finalTN });
              }
            },
            cancel: {
              label: 'Cancel',
              callback: () => resolve(null)
            }
          },
          default: 'roll',
          render: (html: JQuery) => {
            const $html = html instanceof HTMLElement ? $(html) : $(html as any);
            setTimeout(() => {
              $html.closest('.window-app.dialog').addClass('mastery-system mastery-roll-dialog mastery-skill-roll-dialog');
            }, 0);

            $html.find('[name="baseTN"]').on('change', function () {
              const isCustom = $(this).val() === 'custom';
              $html.find('#attr-custom-tn-group').toggle(isCustom);
            });

            const updateFinalTN = () => {
              const baseTNSelect = $html.find('[name="baseTN"]').val() as string;
              let baseTN: number;
              if (baseTNSelect === 'custom') {
                baseTN = parseInt($html.find('[name="customTN"]').val() as string) || 0;
              } else {
                baseTN = parseInt(baseTNSelect) || difficulties.standard;
              }
              const raises = parseInt($html.find('[name="raises"]').val() as string) || 0;
              const raiseTn = baseTN + raises * 4;
              $html.find('#attr-normal-tn-display').text(String(baseTN));
              $html.find('#attr-final-tn-display').text(String(raiseTn));
            };

            $html.find('[name="baseTN"], [name="customTN"], [name="raises"]').on('change input', updateFinalTN);
            updateFinalTN();
          }
        } as any,
        {
          width: 600,
          height: 440,
          resizable: true
        } as any
      );
      dialog.render(true);
    });
  }

  /**
   * Handle skill roll
   */
  async #onSkillRoll(event: JQuery.ClickEvent) {
    event.preventDefault();
    const element = event.currentTarget;
    const skillKey = element.dataset.skill;
    const forcedAttribute = (element.dataset.attribute || '').trim().toLowerCase() || undefined;

    if (!skillKey) return;

    // Get skill definition from SKILLS
    const skillDef = SKILLS[skillKey];
    if (!skillDef) {
      ui.notifications?.error(`Skill "${skillKey}" not found in skill definitions.`);
      return;
    }

    if (
      forcedAttribute &&
      !skillDef.attributes.map((a: string) => a.toLowerCase()).includes(forcedAttribute)
    ) {
      ui.notifications?.error(`Invalid attribute for ${skillDef.name}.`);
      return;
    }

    // Prompt for roll options (attribute, base TN, raises)
    const rollOptions = await this.#promptForSkillRollOptions(skillKey, skillDef, forcedAttribute);
    if (!rollOptions) return; // User cancelled
    
    // Perform the roll
    const system = (this.actor as any).system;
    const attributeValue = system.attributes?.[rollOptions.attributeKey]?.value || 0;
    const masteryRank = system.mastery?.rank || 2;

    // Players Guide skill pool (~1964–1999): full attribute pool when skill ≥
    // 2×MR; otherwise round(attr/2) (minimum MR dice). Skill points may still be
    // spent after the roll in either mode.
    const skillRating = Number(system?.skills?.[skillKey] ?? 0);
    const poolThreshold = skillFullPoolThreshold(masteryRank);
    const pool = getSkillRollDicePool(this.actor as Actor, skillKey, rollOptions.attributeKey);

    let reducedPoolFlavor = '';
    if (pool.halfPool) {
      const reduced = reducedSkillAttributePool(attributeValue);
      reducedPoolFlavor = ` Reduced pool: skill rating ${skillRating} < ${poolThreshold} (2×MR) → round(${attributeValue}/2) = ${reduced}d8.`;
    }
    const numDice = pool.numDice;
    let equipPenaltyFlavor = '';
    if (pool.equipPenalty > 0) {
      equipPenaltyFlavor = ` Equipped armor/shield physical penalty: −${pool.equipPenalty}d8 (rolling ${numDice} dice).`;
    }
    const finalizeFlavor = (pool.finalizeNotes ?? [])
      .map((n) => ` ${n}.`)
      .join('');

    const raiseTn = rollOptions.baseTN + rollOptions.raises * 4;
    let stoneBonusRaises = 0;
    try {
      const { getRoundState } = await import('../combat/action-economy.js');
      const combat = (game as any).combat;
      if (combat) {
        const rs = getRoundState(this.actor as Actor, combat);
        stoneBonusRaises = Math.max(0, Number(rs?.stoneBonuses?.freeRaises) || 0);
      }
    } catch {
      /* ignore */
    }

    const { masteryRoll } = await import('../dice/roll-handler.js');
    await masteryRoll({
      numDice,
      keepDice: masteryRank,
      skill: 0,
      tn: rollOptions.baseTN,
      normalTn: rollOptions.baseTN,
      raiseTn,
      declaredRaiseSlots: rollOptions.raises,
      stoneBonusRaises,
      raiseModel: 'skill',
      label: `${skillDef.name} Check`,
      flavor: `Attribute: ${rollOptions.attributeKey.charAt(0).toUpperCase() + rollOptions.attributeKey.slice(1)}, Base TN: ${rollOptions.baseTN}, Raises: ${rollOptions.raises}.${equipPenaltyFlavor}${finalizeFlavor}${reducedPoolFlavor}`,
      actorId: (this.actor as any).id,
      skillKey,
      isSkillRoll: true,
      baseModifier: 0,
      rollKind: 'skill',
      autoFailIntent: 'skill',
      checkContext: { skillKey },
    });
    
    // Skill point spending is now handled via chat buttons (no modal dialog)
  }
  
  /**
   * Prompt for skill roll options (attribute, base TN, raises).
   *
   * Used by normal skill rolls as well as Echo card rolls. Echo rolls call this
   * directly after resolving the card's skill (so the dialog picks the right
   * attribute list).
   */
  async #promptForSkillRollOptions(
    _skillKey: string,
    skillDef: any,
    forcedAttribute?: string,
    opts?: { marginOnly?: boolean },
  ): Promise<{
    attributeKey: string;
    baseTN: number;
    raises: number;
    finalTN: number;
  } | null> {
    const system = (this.actor as any).system;
    const masteryRank = system.mastery?.rank || 2;

    // Players Guide skill-difficulty chapter (~1860–1879): Standard TN = 8 ×
    // Challenge MR (the GM-set difficulty), NOT 8 × the rolling actor's MR.
    // We default the Challenge to the actor's own MR so a self-test starts
    // at the familiar TN, but expose a 1–16 picker so any GM challenge MR
    // can be selected directly.
    const buildDifficulties = (challengeMR: number) => {
      const std = Math.max(1, Math.floor(challengeMR)) * 8;
      return {
        trivial: std - 8,
        easy: std - 4,
        standard: std,
        challenging: std + 4,
        hard: std + 8,
        veryHard: std + 12,
        heroic: std + 16,
      };
    };
    const challengeMR = Math.max(1, Math.min(16, masteryRank));
    const difficulties = buildDifficulties(challengeMR);

    const attrList: string[] = skillDef.attributes || [];
    const lockedAttr =
      forcedAttribute && attrList.map((a: string) => a.toLowerCase()).includes(forcedAttribute)
        ? attrList.find((a: string) => a.toLowerCase() === forcedAttribute) || forcedAttribute
        : null;
    const hasMultipleAttributes = attrList.length > 1 && !lockedAttr;
    const defaultAttribute = lockedAttr || attrList[0];

    // Players Guide full-pool / minimum-pool rules (~1964–1999).
    const skillRating = Number(system?.skills?.[_skillKey] ?? 0);
    const skillsSpent = Number(system?.skillsSpent?.[_skillKey] ?? 0);
    const remainingPool = Math.max(0, skillRating - skillsSpent);
    const fullPoolReady = isSkillFullPoolReady(skillRating, masteryRank);
    const poolThreshold = skillFullPoolThreshold(masteryRank);
    const buildPoolPreview = (attr: string) => {
      const attrValue = Number(system?.attributes?.[attr]?.value ?? 0);
      const usableAttr = fullPoolReady ? attrValue : Math.max(1, Math.floor(attrValue / 2));
      const floored = Math.max(usableAttr, masteryRank);
      return { attrValue, usableAttr, floored };
    };
    const initialPreview = buildPoolPreview(defaultAttribute);
    const marginOnly = !!opts?.marginOnly;

    const content = `
      <form class="mastery-dialog-form">
        ${hasMultipleAttributes ? `
          <div class="md-group">
            <label class="md-label">Attribute</label>
            <select name="attribute" id="skill-roll-attribute" class="md-select">
              ${skillDef.attributes.map((attr: string) => `
                <option value="${attr}" ${attr === defaultAttribute ? 'selected' : ''}>
                  ${attr.charAt(0).toUpperCase() + attr.slice(1)} (${system.attributes?.[attr]?.value || 0})
                </option>
              `).join('')}
            </select>
          </div>
        ` : `
          <input type="hidden" name="attribute" value="${defaultAttribute}" />
          <div class="md-group">
            <label class="md-label">Attribute</label>
            <div class="md-attr-display">
              ${defaultAttribute.charAt(0).toUpperCase() + defaultAttribute.slice(1)} (${system.attributes?.[defaultAttribute]?.value || 0})
            </div>
          </div>
        `}

        <div class="md-group">
          <label class="md-label">Skill Pool <span class="md-sublabel">(rating ${skillRating} / pool left ${remainingPool}; ≥ ${poolThreshold} for full pool)</span></label>
          <div class="md-attr-display" id="skill-pool-status">
            ${fullPoolReady
              ? `Full pool — rolling ${initialPreview.floored}d8 (attribute ${initialPreview.attrValue}, MR floor ${masteryRank}).`
              : `Half pool — skill rating ${skillRating} &lt; ${poolThreshold} (2×MR); rolling ${initialPreview.floored}d8 (⌊${initialPreview.attrValue}/2⌋ = ${initialPreview.usableAttr}, MR floor ${masteryRank}).`}
          </div>
        </div>

        <div class="md-group">
          <label class="md-label">Challenge MR <span class="md-sublabel">(GM difficulty — Standard TN = 8 × Challenge MR)</span></label>
          <select name="challengeMR" id="skill-roll-challengeMR" class="md-select">
            ${Array.from({ length: 16 }, (_, i) => i + 1)
              .map(
                (mr) =>
                  `<option value="${mr}" ${mr === challengeMR ? 'selected' : ''}>MR ${mr} (Standard ${mr * 8})</option>`,
              )
              .join('')}
          </select>
        </div>

        <div class="md-group md-group-difficulty">
          <label class="md-label">Difficulty</label>
          <select name="baseTN" id="skill-roll-baseTN" class="md-select md-select-difficulty">
            <option value="trivial">Trivial (<span data-bucket="trivial">${difficulties.trivial}</span>)</option>
            <option value="easy">Easy (<span data-bucket="easy">${difficulties.easy}</span>)</option>
            <option value="standard" selected>Standard (<span data-bucket="standard">${difficulties.standard}</span>)</option>
            <option value="challenging">Challenging (<span data-bucket="challenging">${difficulties.challenging}</span>)</option>
            <option value="hard">Hard (<span data-bucket="hard">${difficulties.hard}</span>)</option>
            <option value="veryHard">Very Hard (<span data-bucket="veryHard">${difficulties.veryHard}</span>)</option>
            <option value="heroic">Heroic (<span data-bucket="heroic">${difficulties.heroic}</span>)</option>
            <option value="custom">Custom…</option>
          </select>
        </div>
        
        <div class="md-group" id="custom-tn-group" style="display: none;">
          <label class="md-label">Custom TN</label>
          <input type="number" name="customTN" id="skill-roll-customTN" value="${difficulties.standard}" min="0" step="1" class="md-input" />
        </div>
        
        ${
          marginOnly
            ? `<div class="md-group"><p class="md-sublabel">Raises are counted after the roll (+4 over TN each).</p></div>`
            : `
        <div class="md-group">
          <label class="md-label">Raises <span class="md-sublabel">(+4 Raise TN each; Normal TN unchanged)</span></label>
          <input type="number" name="raises" id="skill-roll-raises" value="0" min="0" step="1" class="md-input" />
          <div class="md-final-tn">
            Normal TN: <strong><span id="normal-tn-display">${difficulties.standard}</span></strong>
            · Raise TN: <strong><span id="final-tn-display">${difficulties.standard}</span></strong>
          </div>
        </div>`
        }
      </form>
    `;
    
    return new Promise((resolve) => {
      const dialog = new Dialog(
        {
        title: `Roll ${skillDef.name}`,
        content,
        buttons: {
          roll: {
            label: '<i class="fas fa-dice-d20"></i> Roll',
            callback: (html: JQuery) => {
              const attributeKey = html.find('[name="attribute"]').val() as string;
              const challengeMRVal = Math.max(
                1,
                Math.min(16, parseInt(html.find('[name="challengeMR"]').val() as string) || challengeMR),
              );
              const challengeBuckets = buildDifficulties(challengeMRVal);
              const bucket = html.find('[name="baseTN"]').val() as string;
              let baseTN: number;
              if (bucket === 'custom') {
                baseTN = parseInt(html.find('[name="customTN"]').val() as string) || 0;
              } else {
                baseTN =
                  challengeBuckets[bucket as keyof typeof challengeBuckets] ?? challengeBuckets.standard;
              }

              const raises = marginOnly
                ? 0
                : parseInt(html.find('[name="raises"]').val() as string) || 0;
              const finalTN = baseTN + raises * 4;

              resolve({
                attributeKey,
                baseTN,
                raises,
                finalTN,
              });
            }
          },
          cancel: {
            label: 'Cancel',
            callback: () => resolve(null)
          }
        },
        default: 'roll',
        render: (html: JQuery) => {
          const $html = (html instanceof HTMLElement) ? $(html) : $(html as any);
          
          // Apply dialog class
          setTimeout(() => {
            $html
              .closest('.window-app.dialog')
              .addClass('mastery-system mastery-roll-dialog mastery-skill-roll-dialog');
          }, 0);

          $html.find('[name="baseTN"]').on('change', function() {
            const isCustom = $(this).val() === 'custom';
            $html.find('#custom-tn-group').toggle(isCustom);
          });

          const refreshDifficultyLabels = () => {
            const mr = Math.max(
              1,
              Math.min(
                16,
                parseInt($html.find('[name="challengeMR"]').val() as string) || challengeMR,
              ),
            );
            const buckets = buildDifficulties(mr);
            for (const key of Object.keys(buckets) as Array<keyof typeof buckets>) {
              $html.find(`[data-bucket="${key}"]`).text(String(buckets[key]));
            }
            const customField = $html.find('[name="customTN"]');
            if (!customField.is(':focus')) customField.val(String(buckets.standard));
          };

          const updateFinalTN = () => {
            const mr = Math.max(
              1,
              Math.min(
                16,
                parseInt($html.find('[name="challengeMR"]').val() as string) || challengeMR,
              ),
            );
            const buckets = buildDifficulties(mr);
            const bucket = $html.find('[name="baseTN"]').val() as string;
            let baseTN: number;
            if (bucket === 'custom') {
              baseTN = parseInt($html.find('[name="customTN"]').val() as string) || 0;
            } else {
              baseTN = buckets[bucket as keyof typeof buckets] ?? buckets.standard;
            }
            const raises = parseInt($html.find('[name="raises"]').val() as string) || 0;
            const raiseTn = baseTN + raises * 4;
            $html.find('#normal-tn-display').text(String(baseTN));
            $html.find('#final-tn-display').text(String(raiseTn));
          };

          const updatePoolStatus = () => {
            const attr = (
              $html.find('[name="attribute"]').val() as string
            ) || defaultAttribute;
            const preview = buildPoolPreview(attr);
            $html.find('#skill-pool-status').text(
              fullPoolReady
                ? `Full pool — rolling ${preview.floored}d8 (attribute ${preview.attrValue}, MR floor ${masteryRank}).`
                : `Half pool — skill rating ${skillRating} < ${poolThreshold} (2×MR); rolling ${preview.floored}d8 (⌊${preview.attrValue}/2⌋ = ${preview.usableAttr}, MR floor ${masteryRank}).`,
            );
          };

          $html
            .find('[name="baseTN"], [name="customTN"], [name="challengeMR"]')
            .on('change input', () => {
              refreshDifficultyLabels();
              if (!marginOnly) updateFinalTN();
            });
          if (!marginOnly) {
            $html.find('[name="raises"]').on('change input', updateFinalTN);
            updateFinalTN();
          }
          $html.find('[name="attribute"]').on('change input', updatePoolStatus);
          refreshDifficultyLabels();
          updatePoolStatus();
        }
        } as any,
        {
          width: 600,
          height: 440,
          resizable: true
        } as any
      );

      dialog.render(true);
    });
  }

  /**
   * Handle Echo Card "Use" button.
   *
   * - Validates that the card is currently selected and not already used today.
   * - Posts a narrative ChatMessage (with optional flashback).
   * - Opens the standard Skill Roll dialog pre-tuned to the card option's skill.
   * - On a completed (non-cancelled) roll, marks the card as used for today.
   */
  async #onEchoRoll(event: JQuery.ClickEvent) {
    event.preventDefault();
    const el = event.currentTarget as HTMLButtonElement;
    const cardId = el?.dataset?.cardId || '';
    const optionId = el?.dataset?.optionId || '';
    if (!cardId || !optionId) {
      ui.notifications?.error('Missing card or option id on Echo roll.');
      return;
    }

    const system = (this.actor as any).system;
    const echo = system?.echo || {};
    const echoKey = echo.key as string | undefined;
    if (!echoKey) {
      ui.notifications?.warn('No Echo selected for this character.');
      return;
    }
    const selectedCardIds: string[] = Array.isArray(echo.selectedCardIds) ? echo.selectedCardIds : [];
    if (!selectedCardIds.includes(cardId)) {
      ui.notifications?.error('That Echo card is not part of your deck.');
      return;
    }
    const masteryRank = Math.max(1, Number(system?.mastery?.rank) || 1);
    if (!isEchoCardLicensed(selectedCardIds, masteryRank, cardId)) {
      ui.notifications?.warn((game as any).i18n.localize('MASTERY.echo.unlicensedUse'));
      return;
    }
    const cardUses = (echo.cardUses || {}) as Record<string, boolean>;
    if (cardUses[cardId] === true) {
      ui.notifications?.warn('Card already used today. It restores on the next Safe Haven Rest.');
      return;
    }

    const card = getEchoCard(echoKey, cardId);
    const option = getCardOption(echoKey, cardId, optionId);
    if (!card || !option) {
      ui.notifications?.error('Echo card option not found.');
      return;
    }

    const skillDef = SKILLS[option.skill];
    if (!skillDef) {
      ui.notifications?.error(`Skill "${option.skill}" for Echo card is not defined.`);
      return;
    }

    // Narrative flashback: post a chat message before the roll.
    const def = getEcho(echoKey);
    const echoName = def?.name || echoKey;
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: `
        <div class="echo-roll-flavor">
          <div><strong>${echoName} \u2014 ${card.name}</strong></div>
          <div><em>${option.label}</em></div>
          <div class="echo-roll-desc">${option.description}</div>
        </div>
      `
    } as any);

    const rollOptions = await this.#promptForSkillRollOptions(option.skill, skillDef, undefined, {
      marginOnly: true,
    });
    if (!rollOptions) return;

    const attributeValue = system.attributes?.[rollOptions.attributeKey]?.value || 0;

    let numDice = attributeValue;
    let equipPenaltyFlavor = '';
    if (skillDef.category === SKILL_CATEGORIES.PHYSICAL) {
      const penDice = getEquippedPhysicalSkillPenaltyDice(this.actor);
      if (penDice > 0) {
        numDice = Math.max(1, numDice - penDice);
        equipPenaltyFlavor = ` Equipped armor/shield physical penalty: \u2212${penDice}d8 (rolling ${numDice} dice).`;
      }
    }

    const { masteryRoll } = await import('../dice/roll-handler.js');
    await masteryRoll({
      numDice,
      keepDice: masteryRank,
      skill: 0,
      tn: rollOptions.baseTN,
      normalTn: rollOptions.baseTN,
      label: `Echo: ${card.name} \u2014 ${option.label}`,
      flavor: `Attribute: ${rollOptions.attributeKey.charAt(0).toUpperCase() + rollOptions.attributeKey.slice(1)}, Base TN: ${rollOptions.baseTN}. Skill: ${skillDef.name}. Raises counted after roll (+4 over TN).${equipPenaltyFlavor}`,
      actorId: (this.actor as any).id,
      skillKey: option.skill,
      isSkillRoll: true,
      baseModifier: 0,
      rollKind: 'skill',
      raiseModel: 'margin',
      autoFailIntent: 'skill',
      checkContext: { skillKey: option.skill },
    });

    await (this.actor as any).update({
      [`system.echo.cardUses.${cardId}`]: true
    });
    this.render();
  }

  async #onSocialCombat(event: JQuery.ClickEvent) {
    event.preventDefault();
    const party: Actor[] = [this.actor as Actor];
    const { showSocialCombatDialog } = await import('../ui/social-combat-dialog.js');
    await showSocialCombatDialog(party);
  }

  /**
   * GM: restore this health bar and all more-severe bars below it
   * (e.g. Bruised → also Injured…Incapacitated).
   */
  async #onGmRestoreHealthBar(event: JQuery.ClickEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (!(game as any).user?.isGM) {
      (ui as any).notifications?.warn('Only a GM can restore health bars.');
      return;
    }

    const btn = event.currentTarget as HTMLElement;
    const fromIndex = Math.floor(Number(btn?.dataset?.barIndex));
    if (!Number.isFinite(fromIndex) || fromIndex < 0) return;

    const system = (this.actor as any).system;
    const rawBars = Array.isArray(system?.health?.bars) ? system.health.bars : [];
    if (!rawBars.length) return;
    const hpBars = rawBars.map((b: any) => ({ ...b }));

    const { restoreHealthBarsFrom } = await import('../utils/calculations.js');
    const currentBar = restoreHealthBarsFrom(hpBars, fromIndex);
    // Avoid Foundry's auto sheet re-render (scroll jump); our render() preserves scroll.
    await this.actor.update(
      {
        'system.health.bars': hpBars,
        'system.health.currentBar': currentBar,
      },
      { render: false },
    );

    const startName = String(hpBars[fromIndex]?.name ?? `Bar ${fromIndex + 1}`);
    (ui as any).notifications?.info?.(
      `Health restored from ${startName} through Incapacitated.`,
    );
    await this.render();
  }

  /**
   * GM: restore this stress bar and all more-severe bars below it
   * (e.g. Stressed → also Not Well…Breaking). Same cascade as HP restore.
   */
  async #onGmRestoreStressBar(event: JQuery.ClickEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (!(game as any).user?.isGM) {
      (ui as any).notifications?.warn('Only a GM can restore stress bars.');
      return;
    }

    const btn = event.currentTarget as HTMLElement;
    const fromIndex = Math.floor(Number(btn?.dataset?.barIndex));
    if (!Number.isFinite(fromIndex) || fromIndex < 0) return;

    const system = (this.actor as any).system;
    const rawBars = Array.isArray(system?.stress?.bars) ? system.stress.bars : [];
    if (!rawBars.length) return;
    const stressBars = rawBars.map((b: any) => ({ ...b }));

    const { restoreHealthBarsFrom } = await import('../utils/calculations.js');
    const currentBar = restoreHealthBarsFrom(stressBars, fromIndex);

    // Single update + render:false so unsetFlag/auto-render cannot jump scroll to top.
    const updateData: Record<string, unknown> = {
      'system.stress.bars': stressBars,
      'system.stress.currentBar': currentBar,
    };
    try {
      if (this.actor.getFlag?.('mastery-system', 'stressBreakdownPending') != null) {
        updateData['flags.mastery-system.-=stressBreakdownPending'] = null;
      }
    } catch {
      /* ignore */
    }

    await this.actor.update(updateData, { render: false });

    const startName = String(stressBars[fromIndex]?.name ?? `Bar ${fromIndex + 1}`);
    const endName = String(stressBars[stressBars.length - 1]?.name ?? 'Breaking');
    (ui as any).notifications?.info?.(
      `Stress restored from ${startName} through ${endName}.`,
    );
    await this.render();
  }

  /**
   * Handle Safe Haven Rest - reset all skillsSpent to 0
   */
  async #onSafeHavenRest(event: JQuery.ClickEvent) {
    event.preventDefault();

    if (!this.actor.isOwner) {
      (ui as any).notifications?.warn('Only the owner can use Safe Haven Rest.');
      return;
    }

    await applySafeHavenRest(this.actor);
    this.activeTab = 'minor-magic';
    (ui as any).notifications?.info(SAFE_HAVEN_REST_INFO);
    this.render();
  }

  /**
   * GM: restore +1 Faith Fracture for good disadvantage roleplay (capped at maximum).
   */
  async #onGmAwardFaithFracture(event: JQuery.ClickEvent) {
    event.preventDefault();
    if (!(game as any).user?.isGM) {
      (ui as any).notifications?.warn('Only a GM can award Reroll Points.');
      return;
    }

    const system = (this.actor as any).system;
    const max = Math.max(0, Number(system.faithFractures?.maximum) || 0);
    const cur = Math.max(0, Number(system.faithFractures?.current) || 0);

    if (max <= 0) {
      (ui as any).notifications?.warn('This actor has no Reroll Point pool (maximum is 0).');
      return;
    }
    if (cur >= max) {
      (ui as any).notifications?.info(`${this.actor.name} is already at maximum Reroll Points (${max}).`);
      return;
    }

    await this.actor.update({ 'system.faithFractures.current': cur + 1 });
    (ui as any).notifications?.info(`${this.actor.name}: +1 Reroll Point (${cur + 1}/${max}).`);
    this.render();
  }

  async #onRemoveCharacterStatus(event: JQuery.ClickEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (!canCurrentUserUpdateDocument(this.actor)) return;
    const btn = event.currentTarget as HTMLElement;
    const kind = String(btn.dataset.statusKind ?? '');
    const index = Number(btn.dataset.effectIndex ?? -1);
    const rows = buildCharacterStatusRows(this.actor);
    const row =
      kind === 'tempHP'
        ? rows.find((r) => r.kind === 'tempHP')
        : rows.find((r) => r.kind === 'special' && r.index === index);
    if (!row) return;
    await removeCharacterStatusRow(this.actor, row);
  }

  async #onReduceCharacterStatus(event: JQuery.ClickEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (!canCurrentUserUpdateDocument(this.actor)) return;
    const btn = event.currentTarget as HTMLElement;
    const index = Number(btn.dataset.effectIndex ?? -1);
    const steps = Math.max(1, Number(btn.dataset.steps ?? 1) || 1);
    const rows = buildCharacterStatusRows(this.actor);
    const row = rows.find((r) => r.kind === 'special' && r.index === index);
    if (!row) return;
    await reduceCharacterStatusRow(this.actor, row, steps);
  }

  /**
   * GM: directly edit the character's available XP from the header bar.
   * Sets `system.points.xp` and keeps the accounting invariant
   * (available = totalEarned − totalSpent) by adjusting `totalEarned`.
   */
  async #onGmEditXp(event: JQuery.ClickEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (!(game as any).user?.isGM) {
      (ui as any).notifications?.warn('Only a GM can edit XP.');
      return;
    }

    const system = (this.actor as any).system ?? {};
    const points = system.points ?? {};
    const xp = system.xp ?? {};
    const current = Math.max(0, Math.floor(Number(points.xp) || 0));
    const totalSpent = Math.max(0, Math.floor(Number(xp.totalSpent) || 0));
    const totalEarned = Math.max(0, Math.floor(Number(xp.totalEarned) || 0));

    const content = `
      <form class="gm-edit-xp-form">
        <p>Verfügbare XP für <strong>${this.actor.name}</strong> setzen.</p>
        <div class="form-group">
          <label style="display:block;margin-bottom:4px;">Verfügbare XP</label>
          <input type="number" name="xp" value="${current}" step="1" min="0" style="width:100%;" autofocus />
        </div>
        <p style="opacity:0.75;font-size:0.85rem;margin:6px 0 0;">Aktuell: ${current} verfügbar · ${totalEarned} verdient · ${totalSpent} ausgegeben.</p>
      </form>`;

    const newAvail = await new Promise<number | null>((resolve) => {
      let settled = false;
      const finish = (v: number | null) => { if (!settled) { settled = true; resolve(v); } };
      new Dialog({
        title: `XP bearbeiten (GM): ${this.actor.name}`,
        content,
        buttons: {
          save: {
            icon: '<i class="fas fa-check"></i>',
            label: 'Speichern',
            callback: (html: any) => {
              const raw = $(html).find('input[name="xp"]').val();
              const val = parseInt(String(raw), 10);
              finish(Number.isFinite(val) ? Math.max(0, val) : null);
            },
          },
          cancel: {
            icon: '<i class="fas fa-times"></i>',
            label: 'Abbrechen',
            callback: () => finish(null),
          },
        },
        default: 'save',
        close: () => finish(null),
      }).render(true);
    });

    if (newAvail === null || newAvail === current) return;

    const delta = newAvail - current;
    const newTotalEarned = totalSpent + newAvail;
    const user = (game as any).user;
    const history = Array.isArray(xp.history) ? [...xp.history] : [];
    history.push({
      ts: Date.now(),
      userId: user?.id || '',
      userName: user?.name || 'GM',
      kind: 'adjust',
      category: 'xp',
      amount: delta,
      note: 'GM manual XP edit (sheet header)',
      before: { available: current, totalEarned, totalSpent },
      after: { available: newAvail, totalEarned: newTotalEarned, totalSpent },
    });

    await this.actor.update({
      'system.points.xp': newAvail,
      'system.xp.totalEarned': newTotalEarned,
      'system.xp.history': history.slice(-200),
    });
    (ui as any).notifications?.info(
      `${this.actor.name}: XP auf ${newAvail} gesetzt (${delta >= 0 ? '+' : ''}${delta}).`,
    );
    this.render();
  }

  /**
   * Handle spending XP on skills.
   *
   * New spec: Skills use the same banded XP table as Attributes
   * (1 / 2 / … / 10 XP per +1, by band). Each Skill may be increased by
   * at most +1 per Upgrade Step.
   */
  async #onSkillSpendPoint(event: JQuery.ClickEvent) {
    event.preventDefault();

    if (isSkillsRedistributing(this.actor)) {
      (ui as any).notifications?.warn('Finish or cancel skill redistribution before spending XP on skills.');
      return;
    }
    
    // Check if user is owner
    if (!this.actor.isOwner) {
      (ui as any).notifications?.warn('Only the owner can spend XP.');
      return;
    }
    
    const element = event.currentTarget;
    const skillKey = element.dataset.skill;
    
    if (!skillKey) return;

    const currentRaw = this.actor.system.skills?.[skillKey] ?? 0;
    const current = Number(currentRaw) || 0;
    const pending = this._pendingSkillRankChanges[skillKey] || 0;
    const effective = current + pending;

    const masteryRank = this.actor.system.mastery?.rank || 2;
    const maxSkill = calculateMaxSkillRank(masteryRank);
    if (effective >= maxSkill) {
      (ui as any).notifications?.warn(
        `${skillKey} cannot exceed ${maxSkill} at Mastery Rank ${masteryRank} (MR × 4).`,
      );
      return;
    }

    // Once-per-step rule (skipped during the Free-XP phase).
    if (!this.#hasFreeXp()) {
      if (pending + 1 > 1) {
        (ui as any).notifications?.warn(
          `${skillKey} can only be increased by +1 per session. Use Free XP to raise it again.`,
        );
        return;
      }
      const stepRule = await import('../utils/xp-step-rule.js');
      const step = stepRule.readStep(this.actor);
      if (pending + 1 > 0 && stepRule.isBumped(step, 'skill', skillKey)) {
        (ui as any).notifications?.warn(
          `${skillKey} was already increased this session. Use Free XP to raise it again.`,
        );
        return;
      }
    }

    const simulateMap = { ...this._pendingSkillRankChanges, [skillKey]: pending + 1 };
    const netCost = this.#calculateSkillPendingNetCost(simulateMap);
    // Combined spendable XP (Free pool is spent first, then regular).
    const availableXP = (this.actor.system.points?.xp || 0) + (this.actor.system.points?.xpFree || 0);
    if (netCost > availableXP) {
      const nextCost = attributeBandCost(effective + 1);
      (ui as any).notifications?.warn(`Not enough XP! This increase would cost ${nextCost} XP, but you only have ${availableXP}.`);
      return;
    }

    this._pendingSkillRankChanges[skillKey] = pending + 1;
    if (this._pendingSkillRankChanges[skillKey] === 0) delete this._pendingSkillRankChanges[skillKey];
    this.#updateSkillXPUI();
  }

  /**
   * Decrease a skill rank and refund XP
   * Refund model: dropping from rank R -> R-1 refunds the banded XP cost of R (reverse of buy cost).
   */
  async #onSkillRefundPoint(event: JQuery.ClickEvent) {
    event.preventDefault();
    event.stopPropagation();

    if (isSkillsRedistributing(this.actor)) {
      (ui as any).notifications?.warn('Finish or cancel skill redistribution before adjusting skills with XP.');
      return;
    }
    
    // Check if user is owner
    if (!this.actor.isOwner) {
      (ui as any).notifications?.warn('Only the owner can adjust skills.');
      return;
    }
    
    const element = event.currentTarget as HTMLElement;
    const skillKey = (element as any).dataset?.skill as string | undefined;
    if (!skillKey) return;
    
    const currentRaw = this.actor.system.skills?.[skillKey] ?? 0;
    const current = Number(currentRaw) || 0;
    const pending = this._pendingSkillRankChanges[skillKey] || 0;
    const effective = current + pending;
    if (effective <= 0) return;
    
    this._pendingSkillRankChanges[skillKey] = pending - 1;
    if (this._pendingSkillRankChanges[skillKey] === 0) delete this._pendingSkillRankChanges[skillKey];
    this.#updateSkillXPUI();
  }

  /**
   * Calculate net pending cost (signed) for all pending skill rank changes.
   *
   * New spec: Skills use the banded Attribute table — `attributeBandCost(R)`
   * is the XP cost of buying rank R. Refunds are symmetric.
   */
  #calculateSkillPendingNetCost(pendingMap: Record<string, number>): number {
    return calculateSkillPendingNetCost(this.actor, pendingMap);
  }

  /** Net XP cost (positive) or refund (negative) for one skill's pending rank delta only. */
  #calculateSingleSkillPendingXpNet(skillKey: string, pending: number): number {
    return calculateSingleSkillPendingXpNet(this.actor, skillKey, pending);
  }

  /**
   * Update the skill XP distribution UI (pending/remaining + enable/disable buttons)
   */
  #updateSkillXPUI() {
    const html = $(this.element);
    // Combined spendable XP (Free pool is spent first, then regular).
    const availableXP = (this.actor.system.points?.xp || 0) + (this.actor.system.points?.xpFree || 0);
    const netPendingCost = this.#calculateSkillPendingNetCost(this._pendingSkillRankChanges);
    const remainingXP = availableXP - netPendingCost;
    this.#setHeaderXpDisplay(remainingXP);
    const totalPendingChanges = Object.values(this._pendingSkillRankChanges).reduce((sum, v) => sum + Math.abs(v), 0);

    html.find('#pending-skill-changes-count').text(String(totalPendingChanges));
    html.find('#remaining-skill-xp').text(String(Math.max(0, remainingXP)));

    const netSummary = html.find('#pending-skill-xp-net');
    if (netSummary.length) {
      if (netPendingCost === 0) {
        netSummary.text('0');
      } else if (netPendingCost > 0) {
        netSummary.text(`−${netPendingCost} spend`);
      } else {
        netSummary.text(`+${Math.abs(netPendingCost)} refund`);
      }
    }

    // Enable/disable confirm/cancel
    const confirmBtn = html.find('#confirm-skill-changes-btn');
    const cancelBtn = html.find('#cancel-skill-changes-btn');
    confirmBtn.prop('disabled', totalPendingChanges <= 0);
    cancelBtn.prop('disabled', totalPendingChanges <= 0);

    // Enable/disable per-skill +/- buttons + per-row pending labels
    const masteryRank = this.actor.system.mastery?.rank || 2;
    const maxSkill = calculateMaxSkillRank(masteryRank);
    const bumpedSkills = new Set<string>(
      Array.isArray((this.actor.system as any)?.xp?.currentStep?.skills)
        ? ((this.actor.system as any).xp.currentStep.skills as unknown[]).map((v) => String(v ?? ''))
        : [],
    );
    for (const skillKey of Object.keys(SKILLS)) {
      const currentRaw = this.actor.system.skills?.[skillKey] ?? 0;
      const current = Number(currentRaw) || 0;
      const pending = this._pendingSkillRankChanges[skillKey] || 0;
      const effective = current + pending;

      const minusBtn = html.find(`.skill-refund-point[data-skill="${skillKey}"]`);
      minusBtn.prop('disabled', effective <= 0);

      const plusBtn = html.find(`.skill-spend-point[data-skill="${skillKey}"]`);
      const nextPending = pending + 1;
      // Free-XP phase: spend freely (no per-step cap).
      const wouldExceedStepCap =
        !this.#hasFreeXp() &&
        (nextPending > 1 || (nextPending > 0 && bumpedSkills.has(skillKey)));
      if (effective >= maxSkill || wouldExceedStepCap) {
        plusBtn.prop('disabled', true);
        if (wouldExceedStepCap) {
          plusBtn.attr(
            'title',
            this.#hasFreeXp()
              ? ''
              : 'Bereits in dieser Sitzung erhöht. Free XP (★) hebt das Limit auf.',
          );
        }
      } else {
        plusBtn.removeAttr('title');
        if (this.#hasFreeXp()) {
          plusBtn.attr('title', 'Free XP aktiv — frei verteilbar (kein Step-Limit).');
        }
        const simulateMap = { ...this._pendingSkillRankChanges, [skillKey]: nextPending };
        const simulateNet = this.#calculateSkillPendingNetCost(simulateMap);
        plusBtn.prop('disabled', simulateNet > availableXP);
      }

      const pendingLine = html.find(`.skill-pending-xp[data-skill="${skillKey}"]`);
      const rankBadge = html.find(`.skill-rank-pending-badge[data-skill="${skillKey}"]`);
      if (pending === 0) {
        pendingLine.text('').removeClass('has-pending').attr('title', 'XP reserved on this skill until Confirm');
        rankBadge.text('');
      } else {
        const xpNet = this.#calculateSingleSkillPendingXpNet(skillKey, pending);
        const rankLabel =
          pending > 0
            ? `+${pending} rank${pending === 1 ? '' : 's'}`
            : `${pending} rank${pending === -1 ? '' : 's'}`;
        let xpLabel = '';
        if (xpNet > 0) {
          xpLabel = ` · ${xpNet} XP`;
        } else if (xpNet < 0) {
          xpLabel = ` · +${Math.abs(xpNet)} XP back`;
        }
        pendingLine.text(`${rankLabel}${xpLabel}`).addClass('has-pending');
        rankBadge.text(`→${effective}`);
      }

      this.#applySkillDicePoolPreview(skillKey, effective, pending !== 0);
    }
  }

  /** Update dice-pool labels beside skill roll buttons (respects pending rank changes). */
  #applySkillDicePoolPreview(skillKey: string, skillRating: number, pending = false): void {
    const definition = SKILLS[skillKey];
    if (!definition) return;

    for (const attributeKey of definition.attributes) {
      const preview = buildSkillRollPoolPreview(
        this.actor as Actor,
        skillKey,
        attributeKey,
        skillRating,
      );
      const el = $(this.element).find(
        `.skill-roll-pool-btn[data-skill="${skillKey}"][data-attribute="${attributeKey}"]`,
      );
      if (!el.length) continue;
      el.text(preview.rollLabel);
      el.attr('title', preview.tooltip);
      el.toggleClass('half-pool', preview.halfPool);
      el.toggleClass('full-pool', preview.fullPoolReady);
      el.toggleClass('pending-pool', pending);
    }
  }

  /**
   * Confirm and apply pending skill rank changes
   */
  async #onConfirmSkillChanges(event: JQuery.ClickEvent) {
    event.preventDefault();
    event.stopPropagation();
    
    if (!this.actor.isOwner) {
      (ui as any).notifications?.warn('Only the owner can confirm Skill changes.');
      return;
    }
    
    const xpState = this.#getXpState(this.actor);
    const availableXP = xpState.available; // combined Free + regular
    const netCost = this.#calculateSkillPendingNetCost(this._pendingSkillRankChanges);
    
    if (netCost > availableXP) {
      (ui as any).notifications?.error(`Not enough XP! Net cost: ${netCost}, Available: ${availableXP}`);
      return;
    }
    
    const masteryRank = this.actor.system.mastery?.rank || 2;
    const maxSkill = calculateMaxSkillRank(masteryRank);

    const updates: any = {};
    const changes: Array<{ skillKey: string; from: number; to: number; delta: number; cost: number }> = [];

    for (const [skillKey, pending] of Object.entries(this._pendingSkillRankChanges)) {
      if (!pending) continue;
      const currentRaw = this.actor.system.skills?.[skillKey] ?? 0;
      const current = Number(currentRaw) || 0;
      const desired = current + pending;
      if (pending > 0 && desired > maxSkill) {
        (ui as any).notifications?.error(
          `${skillKey} cannot exceed ${maxSkill} at Mastery Rank ${masteryRank} (MR × 4).`,
        );
        return;
      }
      const target = Math.max(0, Math.min(maxSkill, desired));
      if (target === current) continue;
      updates[`system.skills.${skillKey}`] = target;
      changes.push({
        skillKey,
        from: current,
        to: target,
        delta: pending,
        cost: this.#calculateSingleSkillPendingXpNet(skillKey, pending),
      });
    }

    /**
     * New spec — once-per-step rule. Each Skill may only be increased by
     * +1 per Upgrade Step. Mark each positively-bumped skill; un-bump on
     * refund.
     */
    const stepRuleSk = await import('../utils/xp-step-rule.js');
    let stepAfterSk = stepRuleSk.readStep(this.actor);
    // Free-XP phase: do not enforce or record per-step bumps.
    const unrestrictedSk = this.#hasFreeXp();
    for (const change of changes) {
      if (unrestrictedSk) continue;
      if (change.delta > 0) {
        if (stepRuleSk.isBumped(stepAfterSk, 'skill', change.skillKey)) {
          (ui as any).notifications?.error(
            `${change.skillKey} was already increased this session. Use Free XP to raise it again.`,
          );
          return;
        }
        stepAfterSk = stepRuleSk.recordBump(stepAfterSk, 'skill', change.skillKey);
      } else if (change.delta < 0) {
        stepAfterSk = stepRuleSk.undoBump(stepAfterSk, 'skill', change.skillKey);
      }
    }
    // Two-pool accounting: Free XP is spent before regular XP.
    const acctSk = this.#applyXpCost(xpState, netCost);
    updates['system.points.xp'] = acctSk.pointsXp;
    updates['system.points.xpFree'] = acctSk.pointsXpFree;
    updates['system.xp.totalSpent'] = acctSk.totalSpent;
    updates['system.xp.freeSpent'] = acctSk.freeSpent;
    updates['system.xp.currentStep.attributes'] = [...stepAfterSk.attributes];
    updates['system.xp.currentStep.skills'] = [...stepAfterSk.skills];
    updates['system.xp.currentStep.powers'] = [...stepAfterSk.powers];
    updates['system.xp.currentStep.artifacts'] = [...stepAfterSk.artifacts];

    if (!this.actor.system.xp) {
      updates['system.xp.totalEarned'] = xpState.totalEarned;
      updates['system.xp.history'] = [];
    }

    const beforeState = {
      available: xpState.available,
      totalEarned: xpState.totalEarned,
      totalSpent: xpState.totalSpent,
    };

    const skillHistory = buildBandedStepEntries({
      category: 'skill',
      pendingMap: this._pendingSkillRankChanges,
      getCurrent: key => Number(this.actor.system.skills?.[key] ?? 0) || 0,
      getLabel: key => SKILLS[key]?.name || key,
      costForTarget: attributeBandCost,
      before: beforeState,
      after: {
        available: availableXP - netCost,
        totalEarned: xpState.totalEarned,
        totalSpent: acctSk.totalSpent,
      },
      user: currentXpUser(),
    });
    if (skillHistory.length) {
      updates['system.xp.history'] = appendXpHistory(this.actor, skillHistory);
    }

    await this.actor.update(updates);
    
    this._pendingSkillRankChanges = {};
    await this.render();
  }

  /**
   * Cancel pending skill rank changes
   */
  #onCancelSkillChanges(event: JQuery.ClickEvent) {
    event.preventDefault();
    event.stopPropagation();
    this._pendingSkillRankChanges = {};
    this.#updateSkillXPUI();
    (ui as any).notifications?.info('Pending skill changes cancelled.');
  }

  /**
   * Prompt for Target Number
   */
  async #promptForTN(): Promise<{ tn: number; raises: number } | null> {
    const system = (this.actor as any).system;
    const masteryRank = system.mastery?.rank || 2;
    const standardTN = masteryRank * 8;

    const presets = [
      { label: 'Trivial', value: standardTN - 8 },
      { label: 'Easy', value: standardTN - 4 },
      { label: 'Standard', value: standardTN },
      { label: 'Challenging', value: standardTN + 4 },
      { label: 'Hard', value: standardTN + 8 },
      { label: 'Very Hard', value: standardTN + 12 },
      { label: 'Heroic', value: standardTN + 16 },
    ];

    const content = `
      <form class="mastery-dialog-form">
        <div class="md-group">
          <label class="md-label">Target Number</label>
          <input type="number" name="tn" value="${standardTN}" step="1" min="0" class="md-input" />
        </div>
        <div class="md-group">
          <label class="md-label">Quick Select</label>
          <div class="md-tn-presets">
            ${presets.map(p => `<button type="button" class="md-tn-btn${p.value === standardTN ? ' active' : ''}" data-tn="${p.value}">${p.label} (${p.value})</button>`).join('')}
          </div>
        </div>
        <div class="md-group">
          <label class="md-label">Raises <span class="md-sublabel">(+4 Raise TN each; Normal TN unchanged)</span></label>
          <input type="number" name="raises" value="0" min="0" step="1" class="md-input" />
          <div class="md-final-tn">
            Normal TN: <strong><span id="save-normal-tn-display">${standardTN}</span></strong>
            · Raise TN: <strong><span id="save-raise-tn-display">${standardTN}</span></strong>
          </div>
        </div>
      </form>
    `;
    
    return new Promise((resolve) => {
      new Dialog({
        title: 'Set Target Number',
        content,
        buttons: {
          roll: {
            label: '<i class="fas fa-dice-d20"></i> Roll',
            callback: (html: JQuery) => {
              const $html = (html instanceof HTMLElement) ? $(html) : $(html as any);
              const tn = parseInt($html.find('[name="tn"]').val() as string);
              const raises = parseInt($html.find('[name="raises"]').val() as string) || 0;
              resolve({ tn, raises });
            }
          },
          cancel: {
            label: 'Cancel',
            callback: () => resolve(null)
          }
        },
        default: 'roll',
        render: (html: JQuery) => {
          const $html = (html instanceof HTMLElement) ? $(html) : $(html as any);

          setTimeout(() => {
            $html.closest('.window-app.dialog').addClass('mastery-system mastery-roll-dialog');
          }, 0);

          const updateRaiseTn = () => {
            const tn = parseInt($html.find('[name="tn"]').val() as string) || 0;
            const raises = parseInt($html.find('[name="raises"]').val() as string) || 0;
            $html.find('#save-normal-tn-display').text(String(tn));
            $html.find('#save-raise-tn-display').text(String(tn + raises * 4));
          };

          $html.find('.md-tn-btn').on('click', (event) => {
            const tn = (event.currentTarget as HTMLElement).dataset.tn;
            if (tn) {
              $html.find('[name="tn"]').val(tn);
              $html.find('.md-tn-btn').removeClass('active');
              $(event.currentTarget).addClass('active');
              updateRaiseTn();
            }
          });

          $html.find('[name="tn"], [name="raises"]').on('input change', () => {
            $html.find('.md-tn-btn').removeClass('active');
            updateRaiseTn();
          });
        }
      }).render(true);
    });
  }

  /**
   * Add a new skill
   */
  async #onSkillAdd(event: JQuery.ClickEvent) {
    event.preventDefault();
    
    const skillName = await this.#promptForSkillName();
    if (!skillName) return;
    
    await this.actor.update({
      [`system.skills.${skillName}`]: 0
    });
  }

  /**
   * Prompt for skill name
   */
  async #promptForSkillName(): Promise<string | null> {
    return new Promise((resolve) => {
      new Dialog({
        title: 'Add Skill',
        content: `
          <form>
            <div class="form-group">
              <label>Skill Name:</label>
              <input type="text" name="skillName" placeholder="Enter skill name"/>
            </div>
          </form>
        `,
        buttons: {
          add: {
            label: 'Add',
            callback: (html: JQuery) => {
              const name = html.find('[name="skillName"]').val() as string;
              resolve(name.trim() || null);
            }
          },
          cancel: {
            label: 'Cancel',
            callback: () => resolve(null)
          }
        },
        default: 'add'
      }).render(true);
    });
  }

  /**
   * Delete a skill
   */
  async #onSkillDelete(event: JQuery.ClickEvent) {
    event.preventDefault();
    const element = event.currentTarget;
    const skill = element.dataset.skill;
    
    if (!skill) return;
    
    const confirmed = await Dialog.confirm({
      title: 'Delete Skill',
      content: `<p>Are you sure you want to delete the <strong>${skill}</strong> skill?</p>`
    });
    
    if (confirmed) {
      const skills = foundry.utils.deepClone(this.actor.system.skills) as any;
      delete skills[skill];
      await this.actor.update({ 'system.skills': skills });
    }
  }

  /**
   * Use a power
   */
  async #onPowerUse(event: JQuery.ClickEvent) {
    event.preventDefault();
    const element = event.currentTarget;
    const itemId = element.dataset.itemId || (element as HTMLElement).dataset.powerId;
    
    const item = this.actor.items.get(itemId);
    if (!item) return;
    
    // Check if this is an active buff
    const { isActiveBuff, activateActiveBuff, isPowerActiveAsBuff } = await import('../utils/active-buffs.js');
    
    if (isActiveBuff(item)) {
      // Check if already active
      if (isPowerActiveAsBuff(this.actor, item.id)) {
        ui.notifications?.warn(`${item.name} is already active!`);
        return;
      }
      
      // Activate the buff
      const success = await activateActiveBuff(this.actor, item);
      if (success) {
        // Re-render to show the active buff
        this.render();
      }
      return;
    }
    
    // For non-buff powers, show notification (actual attack/utility logic handled elsewhere)
    ui.notifications?.info(`Using power: ${item.name}`);
  }

  /**
   * Toggle power details expansion
   */
  #onActiveBuffRemove(event: JQuery.ClickEvent) {
    event.preventDefault();
    event.stopPropagation();
    
    const element = event.currentTarget;
    const effectId = element.dataset.effectId;
    
    if (!effectId) {
      ui.notifications?.warn('No effect ID found.');
      return;
    }
    
    const effect = this.actor.effects.get(effectId);
    if (!effect) {
      ui.notifications?.warn('Effect not found.');
      return;
    }
    
    effect.delete().then(() => {
      this.render();
      ui.notifications?.info(`${effect.name} removed.`);
    }).catch((error: any) => {
      console.error('Mastery System | Failed to remove active buff', error);
      ui.notifications?.error('Failed to remove active buff.');
    });
  }

  async #onPowerDisplayNameChange(event: JQuery.ChangeEvent) {
    event.preventDefault();
    event.stopPropagation();
    const el = event.currentTarget as HTMLInputElement | null;
    if (!el) return;
    const itemId = el.getAttribute('data-item-id');
    if (!itemId) return;
    const item = this.actor.items.get(itemId) as any;
    if (!item || item.type !== 'power') return;
    const next = el.value.trim();
    if (!next) {
      el.value = item.name;
      (ui as any).notifications?.warn('Power name cannot be empty.');
      return;
    }
    if (next === item.name) return;
    try {
      await item.update({ name: next });
    } catch (e) {
      console.error('Mastery System | Failed to rename power', e);
      el.value = item.name;
      (ui as any).notifications?.error('Could not rename power.');
    }
  }

  async #onPowerEditMechanics(event: JQuery.ClickEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (!event.currentTarget) return;
    const $button = $(event.currentTarget);
    const itemId = $button.attr('data-item-id') || $button.data('item-id') || $button.data('itemId');
    if (!itemId) {
      ui.notifications?.warn('Could not resolve power id for mechanics editor.');
      return;
    }
    const actor: any = this.actor;
    const power = actor?.items?.get?.(itemId)
      ?? (Array.isArray(actor?.items) ? actor.items.find((i: any) => i.id === itemId) : null);
    if (!power) {
      ui.notifications?.warn('Power not found on this actor.');
      return;
    }
    const { openPowerMechanicsEditor } = await import('./power-mechanics-editor-dialog.js');
    await openPowerMechanicsEditor({ actor, power });
  }

  #onPowerToggleDetails(event: JQuery.ClickEvent) {
    event.preventDefault();
    event.stopPropagation();
    // Safety check for null event target
    if (!event.currentTarget) {
      console.error('Mastery System | [TOGGLE DETAILS] event.currentTarget is null');
      return;
    }
    
    const $button = $(event.currentTarget);
    // Try multiple methods to get the item ID - prioritize button's own data attribute
    let itemId = $button.attr('data-item-id') || 
                 $button.data('item-id') || 
                 $button.data('itemId');
    
    // If still not found, try to get from the button element directly
    if (!itemId && event.currentTarget) {
      const buttonElement = event.currentTarget as HTMLElement;
      if (buttonElement) {
        // Check if dataset exists before accessing it
        if (buttonElement.dataset) {
          itemId = buttonElement.dataset.itemId || buttonElement.getAttribute('data-item-id');
        } else {
          itemId = buttonElement.getAttribute('data-item-id') || 
                   buttonElement.getAttribute('data-itemId');
        }
      }
    }
    
    // Also try to find from parent power-card
    if (!itemId) {
      const $powerCard = $button.closest('.power-card');
      if ($powerCard.length > 0) {
        itemId = $powerCard.attr('data-item-id') || 
                 $powerCard.data('item-id') || 
                 $powerCard.data('itemId');
        if (!itemId && $powerCard[0]) {
          const cardElement = $powerCard[0] as HTMLElement;
          if (cardElement && cardElement.dataset) {
            itemId = cardElement.dataset.itemId || cardElement.getAttribute('data-item-id');
          } else if (cardElement) {
            itemId = cardElement.getAttribute('data-item-id') || 
                     cardElement.getAttribute('data-itemId');
          }
        }
      }
    }
    
    if (!itemId) {
      console.error('Mastery System | [TOGGLE DETAILS] Could not find item ID', {
        button: event.currentTarget,
        buttonHtml: $button[0]?.outerHTML,
        buttonData: $button.data(),
        buttonAttrs: $button[0] ? Array.from(($button[0] as HTMLElement).attributes).map(a => `${a.name}="${a.value}"`).join(', ') : 'N/A',
        parentCard: $button.closest('.power-card')[0]?.outerHTML
      });
      return;
    }
    
    if (!this.element) {
      // Sheet root missing (mid-teardown) — try the button's closest sheet.
      const $sheet = $button.closest('.sheet');
      if ($sheet.length > 0) {
        const powerCard = $sheet.find(`.power-card[data-item-id="${itemId}"]`);
        if (powerCard.length > 0) {
          this.#togglePowerDetails(powerCard, $button);
          return;
        }
      }
      return;
    }
    
    const powerCard = $(this.element).find(`.power-card[data-item-id="${itemId}"]`);
    
    if (powerCard.length === 0) {
      console.error('Mastery System | [TOGGLE DETAILS] Power card not found', {
        itemId,
        allPowerCards: $(this.element).find('.power-card').map((_i: number, el: HTMLElement) => $(el).attr('data-item-id')).get()
      });
      return;
    }
    
    this.#togglePowerDetails(powerCard, $button);
  }

  /**
   * Toggle power details visibility
   */
  #togglePowerDetails(powerCard: JQuery, $button: JQuery) {
    const detailsSection = powerCard.find('.power-details-expanded');
    const compactDescription = powerCard.find('.power-description-compact');
    const toggleIcon = $button.find('i');
    if (detailsSection.is(':visible')) {
      // Collapse: hide details, show compact description
      detailsSection.slideUp(200);
      compactDescription.slideDown(200);
      toggleIcon.removeClass('fa-chevron-up').addClass('fa-chevron-down');
    } else {
      // Expand: hide compact description, show full details
      compactDescription.slideUp(200);
      detailsSection.slideDown(200);
      toggleIcon.removeClass('fa-chevron-down').addClass('fa-chevron-up');
    }
  }

  /**
   * Create a new item
   */
  async #onItemCreate(event: JQuery.ClickEvent) {
    event.preventDefault();
    const element = event.currentTarget;
    const type = element.dataset.type;
    
    const itemData = {
      name: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
      type
    };
    
    await this.actor.createEmbeddedDocuments('Item', [itemData]);
  }

  /**
   * Edit an item
   */
  #onItemEdit(event: JQuery.ClickEvent) {
    event.preventDefault();
    event.stopPropagation();
    
    // Safety check for null event target
    if (!event.currentTarget) {
      console.error('Mastery System | [EDIT ITEM] event.currentTarget is null');
      ui.notifications?.error('Could not find item to edit: invalid event target.');
      return;
    }
    
    // Try to find the item ID from various possible element structures
    const $button = $(event.currentTarget);
    
    // First try to get from button's own data attribute
    let itemId = $button.attr('data-item-id') || 
                 $button.data('item-id') || 
                 $button.data('itemId');
    
    // If still not found, try to get from button element directly
    if (!itemId) {
      const buttonElement = event.currentTarget as HTMLElement;
      if (buttonElement) {
        // Check if dataset exists before accessing it
        if (buttonElement.dataset) {
          itemId = buttonElement.dataset.itemId || buttonElement.getAttribute('data-item-id');
        } else {
          itemId = buttonElement.getAttribute('data-item-id') || 
                   buttonElement.getAttribute('data-itemId');
        }
      }
    }
    
    // Try to find from parent item containers
    if (!itemId) {
      const $item = $button.closest('.item, .equipment-item, .power-card, .creation-power, .df-item-tile');
      if ($item.length > 0) {
        itemId = $item.attr('data-item-id') || 
                 $item.data('item-id') || 
                 $item.data('itemId');
        
        // If still not found, try to get from parent's data attributes
        if (!itemId && $item[0]) {
          const itemElement = $item[0] as HTMLElement;
          if (itemElement && itemElement.dataset) {
            itemId = itemElement.dataset.itemId || itemElement.getAttribute('data-item-id');
          } else if (itemElement) {
            itemId = itemElement.getAttribute('data-item-id') || 
                     itemElement.getAttribute('data-itemId');
          }
        }
      }
    }
    
    // Also try to find from the button's parent elements
    if (!itemId) {
      const buttonElement = event.currentTarget as HTMLElement;
      if (buttonElement) {
        let parent = buttonElement.parentElement;
        let attempts = 0;
        while (parent && attempts < 5) {
          // Check if dataset exists before accessing it
          if (parent && parent.dataset) {
            itemId = parent.dataset.itemId || parent.getAttribute('data-item-id');
          } else if (parent) {
            itemId = parent.getAttribute('data-item-id') || 
                     parent.getAttribute('data-itemId');
          }
          if (itemId) break;
          parent = parent?.parentElement || null;
          attempts++;
        }
      }
    }
    
    if (!itemId) {
      console.error('Mastery System | [EDIT ITEM] Could not find item ID', {
        button: event.currentTarget,
        buttonHtml: $button[0]?.outerHTML,
        buttonAttrs: $button[0] ? Array.from(($button[0] as HTMLElement).attributes).map(a => `${a.name}="${a.value}"`).join(', ') : 'N/A',
        closestItem: $button.closest('.item, .power-card')[0],
        closestItemHtml: $button.closest('.item, .power-card')[0]?.outerHTML,
        buttonParent: (event.currentTarget as HTMLElement)?.parentElement?.outerHTML
      });
      ui.notifications?.error('Could not find item to edit. Please check the console for details.');
      return;
    }
    
    const item = this.actor.items.get(itemId);
    
    if (item) {
      item.sheet?.render(true);
    } else {
      ui.notifications?.error(`Item with ID ${itemId} not found in actor.`);
    }
  }

  /**
   * Delete an item
   */
  async #onItemDelete(event: JQuery.ClickEvent) {
    event.preventDefault();
    event.stopPropagation();
    
    // Try to find the item ID from various possible element structures
    const $button = $(event.currentTarget);
    const $item = $button.closest('.item, .equipment-item, .power-card, .creation-power');
    
    // Try multiple methods to get the item ID
    let itemId = $item.data('item-id') || 
                 $item.attr('data-item-id') || 
                 $item.data('itemId') ||
                 $button.data('item-id') || 
                 $button.attr('data-item-id') ||
                 $button.data('itemId');
    
    // If still not found, try to get from parent's data attributes
    if (!itemId && $item.length > 0) {
      const itemElement = $item[0];
      itemId = itemElement.getAttribute('data-item-id') || 
               itemElement.getAttribute('data-itemId');
    }
    
    if (!itemId) {
      console.error('Mastery System | [DELETE ITEM] Could not find item ID', {
        button: event.currentTarget,
        buttonHtml: $button[0]?.outerHTML,
        closestItem: $item[0],
        closestItemHtml: $item[0]?.outerHTML,
        buttonData: $button.data(),
        itemData: $item.data(),
        itemAttrs: $item.length > 0 ? Array.from($item[0].attributes).map((attr: any) => ({
          name: attr.name,
          value: attr.value
        })) : []
      });
      ui.notifications?.error('Could not find item to delete. Please check the console for details.');
      return;
    }
    
    const item = this.actor.items.get(itemId);
    
    if (!item) {
      console.error('Mastery System | [DELETE ITEM] Item not found in actor.items', {
        itemId,
        actorId: this.actor.id,
        allItemIds: Array.from(this.actor.items.keys()),
        allItems: Array.from(this.actor.items.values()).map((i: any) => ({
          id: i.id,
          name: i.name,
          type: i.type
        }))
      });
      ui.notifications?.error(`Item with ID ${itemId} not found in actor.`);
      return;
    }
    
    const confirmed = await Dialog.confirm({
      title: 'Delete Item',
      content: `<p>Are you sure you want to delete <strong>${item.name}</strong>?</p>`
    });
    
    if (confirmed) {
      try {
        const itemType = item.type;
        const itemName = item.name;
        const isPower = itemType === 'power';
        
        // Check if we're in character creation mode
        const system = (this.actor as any).system;
        const creationComplete = system?.creation?.complete !== false;
        const inCreationMode = !creationComplete;
        
        await item.delete();
        // Show appropriate notification
        if (isPower && inCreationMode) {
          // Count remaining powers
          const remainingPowers = this.actor.items.filter((i: any) => i.type === 'power');
          const powerTotal = Object.values(
            creationPowerRequirementsForMasteryRank(Number(system?.mastery?.rank) || 2),
          ).reduce((s, n) => s + n, 0);
          ui.notifications?.info(`Power "${itemName}" removed. ${remainingPowers.length} of ${powerTotal} Powers selected.`);
        } else {
          ui.notifications?.info(`"${itemName}" deleted.`);
        }
        
        // Re-render the sheet to update the display
        this.render();
      } catch (error) {
        console.error('Mastery System | [DELETE ITEM] Error deleting item', error);
        ui.notifications?.error(`Failed to delete item: ${error}`);
      }
    }
  }

  /**
   * Adjust HP
   */
  async #onHPAdjust(event: JQuery.ClickEvent) {
    event.preventDefault();
    const element = event.currentTarget;
    const adjustment = parseInt(element.dataset.adjustment || '0');
    
    if (adjustment > 0) {
      await (this.actor as MasteryActor).heal(adjustment);
    } else if (adjustment < 0) {
      await (this.actor as MasteryActor).applyDamage(Math.abs(adjustment));
    }
  }

  /**
   * Adjust Stress
   */
  async #onStressAdjust(event: JQuery.ClickEvent) {
    event.preventDefault();
    const element = event.currentTarget;
    const adjustment = parseInt(element.dataset.adjustment || '0');
    
    const current = this.actor.system.stress?.current || 0;
    const max = this.actor.system.stress?.maximum || 100;
    const newValue = Math.max(0, Math.min(max, current + adjustment));
    
    await this.actor.update({ 'system.stress.current': newValue });
  }

  /**
   * Adjust Stones
   */
  async #onStoneAdjust(event: JQuery.ClickEvent) {
    event.preventDefault();
    const element = event.currentTarget;
    const adjustment = parseInt(element.dataset.adjustment || '0');
    
    const current = this.actor.system.stones?.current || 0;
    const max = this.actor.system.stones?.maximum || 0;
    const newValue = Math.max(0, Math.min(max, current + adjustment));
    
    await this.actor.update({ 'system.stones.current': newValue });
  }


  /**
   * Handle profile image edit (upper zone)
   */
  async #onProfileEdit(event: JQuery.ClickEvent, imgType: string = 'portrait') {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    
    if (!this.isEditable) {
      ui.notifications?.warn('You do not have permission to edit this character.');
      return;
    }
    
    try {
      const FilePickerClass = getFilePickerClass();
      
      if (!FilePickerClass) {
        ui.notifications?.error('File picker is not available in this Foundry version.');
        return;
      }
      
      // Get current image based on imgType - use strict comparison
      const isTokenEdit = (imgType === 'token'); // Store in const to ensure it's captured correctly in closure
      let currentImage: string;
      if (isTokenEdit) {
        currentImage = this.actor.prototypeToken?.texture?.src || this.actor.img || '';
      } else {
        currentImage = this.actor.img || '';
      }
      
      // Store isTokenEdit in a way that can't be modified
      const updateIsToken = isTokenEdit;
      
      const filePicker = new FilePickerClass({
        type: 'image',
        current: currentImage,
        callback: async (path: string) => {
          try {
            if (updateIsToken) {
              // Update token image
              const updateData = { 'prototypeToken.texture.src': path };
              await this.actor.update(updateData);
            } else {
              // Update portrait image
              const updateData = { img: path };
              await this.actor.update(updateData);
            }
            // Re-render the sheet to show the new image
            this.render(false);
          } catch (updateError) {
            console.error('Mastery System | Error updating image:', updateError);
            ui.notifications?.error('Failed to update image.');
          }
        }
      });
      await filePicker.render(true);
    } catch (error) {
      console.error('Mastery System | Error opening file picker:', error);
      console.error('Mastery System | Error stack:', error instanceof Error ? error.stack : 'No stack');
      ui.notifications?.error('Failed to open image picker.');
    }
  }

  /**
   * Handle profile image show (lower zone)
   */
  async #onProfileShow(event: JQuery.ClickEvent, imgType: string = 'portrait') {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    
    // Get image source based on imgType
    let imgSrc: string;
    if (imgType === 'token') {
      imgSrc = this.actor.prototypeToken?.texture?.src || this.actor.img || '';
    } else {
      imgSrc = this.actor.img || '';
    }
    if (!imgSrc || imgSrc === 'icons/svg/mystery-man.svg') {
      ui.notifications?.warn('No image to display.');
      return;
    }
    
    try {
      // Try to use Foundry's ImagePopout if available
      const ImagePopoutClass = (foundry as any)?.applications?.apps?.ImagePopout?.implementation ||
                               (window as any).ImagePopout;
      
      if (ImagePopoutClass) {
        const popout = new ImagePopoutClass(imgSrc, {
          title: this.actor.name,
          shareable: true,
          uuid: this.actor.uuid
        });
        await popout.render(true);
      } else {
        // Fallback: Create a simple dialog with the image
        const dialog = new Dialog({
          title: this.actor.name,
          content: `${buildImageUrlBarHtml(imgSrc)}<div style="text-align: center;"><img src="${imgSrc}" style="max-width: 100%; max-height: 80vh; height: auto; border-radius: 4px;" /></div>`,
          buttons: {
            close: {
              label: 'Close',
              callback: () => {}
            }
          },
          default: 'close',
          render: (html: JQuery) => bindImageUrlBar(html[0] ?? html.get?.(0), imgSrc),
        } as any);
        await dialog.render(true);
      }
    } catch (error) {
      console.error('Mastery System | Failed to show image popup', error);
      console.error('Mastery System | Error stack:', error instanceof Error ? error.stack : 'No stack');
      // Fallback: Create a simple dialog with the image
      try {
        const dialog = new Dialog({
          title: this.actor.name,
          content: `${buildImageUrlBarHtml(imgSrc)}<div style="text-align: center;"><img src="${imgSrc}" style="max-width: 100%; max-height: 80vh; height: auto; border-radius: 4px;" /></div>`,
          buttons: {
            close: {
              label: 'Close',
              callback: () => {}
            }
          },
          default: 'close',
          render: (html: JQuery) => bindImageUrlBar(html[0] ?? html.get?.(0), imgSrc),
        } as any);
        await dialog.render(true);
      } catch (fallbackError) {
        console.error('Mastery System | Fallback dialog also failed', fallbackError);
        console.error('Mastery System | Fallback error stack:', fallbackError instanceof Error ? fallbackError.stack : 'No stack');
        ui.notifications?.error('Failed to display image.');
      }
    }
  }

  /**
   * Lock sheet when character creation is incomplete
   * Only disable non-creation fields, allow creation controls
   */
  #lockSheetForCreation(html: JQuery) {
    // ApplicationV2 `activateListeners` receives the whole `.application` root.
    // Never disable Foundry window chrome (Close / Copy / Toggle Controls) or
    // those clicks fall through to the header drag handle.
    const $scope = html.find('.window-content').length ? html.find('.window-content') : html;

    $scope.find('input[name="name"], textarea').prop('disabled', true);
    $scope.find('select:not(.power-rank-select):not(.attr-creation-select):not(.mastery-rank-select)').prop('disabled', true);
    
    // Disable buttons except creation controls
    const buttonsToDisable = $scope.find('button:not(.header-control):not(.sheet-gm-menu-toggle):not(.attr-increase):not(.attr-decrease):not(.skill-increase):not(.skill-decrease):not(.finalize-creation):not(.reset-creation-attributes):not(.force-unlock-creation):not(.reset-character):not(.add-disadvantage-btn):not(.disadvantage-edit-btn):not(.disadvantage-remove-btn):not(.open-tower-wizard-btn):not(.open-manual-combat-package-btn):not(.add-power-btn):not(.add-spell-creation-btn):not(.power-rank-select):not(.item-delete):not(.power-toggle-details):not(.power-edit-mechanics):not(.general-items-btn):not(.choose-echo-btn):not(.add-echo-card-btn):not(.remove-echo-card-btn):not(.echo-card-use-btn):not(.open-languages-btn)');
    buttonsToDisable.prop('disabled', true);
    
    // Ensure creation buttons are enabled
    const creationButtons = $scope.find('.attr-increase, .attr-decrease, .skill-increase, .skill-decrease, .finalize-creation, .reset-creation-attributes, .force-unlock-creation, .reset-character, .sheet-gm-menu-toggle, .add-disadvantage-btn, .disadvantage-edit-btn, .disadvantage-remove-btn, .open-tower-wizard-btn, .open-manual-combat-package-btn, .add-spell-creation-btn, .item-delete, .general-items-btn, .choose-echo-btn, .add-echo-card-btn, .remove-echo-card-btn, .echo-card-use-btn, .open-languages-btn');
    creationButtons.prop('disabled', false);
    
    // Also enable power rank selects (they're select elements, not buttons)
    $scope.find('.power-rank-select').prop('disabled', false);
    $scope.find('.mastery-rank-select').prop('disabled', false);
    $scope.find('.power-radial-checkbox').prop('disabled', false);
    $scope.find('.power-display-name-input').prop('disabled', false);
    
    // Double-check all creation buttons are enabled
    const addDisadvantageBtn = $scope.find('.add-disadvantage-btn');
    const addPowerCreationBtn = $scope.find('.open-tower-wizard-btn');
    const addSpellCreationBtn = $scope.find('.add-spell-creation-btn');
    
    if (addDisadvantageBtn.length > 0) {
      addDisadvantageBtn.prop('disabled', false);
    } else {
      console.warn('Mastery System | add-disadvantage-btn not found during lockSheetForCreation!');
    }
    
    if (addPowerCreationBtn.length > 0) {
      addPowerCreationBtn.prop('disabled', false);
    } else {
    }
    
    if (addSpellCreationBtn.length > 0) {
      addSpellCreationBtn.prop('disabled', false);
    } else {
    }

    const generalItemsBtn = $scope.find('.general-items-btn');
    if (generalItemsBtn.length > 0) {
      generalItemsBtn.prop('disabled', false);
    }

    const languagesBtn = $scope.find('.open-languages-btn');
    if (languagesBtn.length > 0) {
      languagesBtn.prop('disabled', false);
    }

    html.find('.window-header button, .window-header .header-control, .header-control').prop('disabled', false);
    
    // Add CSS class for styling
    html.addClass('creation-incomplete');
  }

  /**
   * Keep hover styling. Do not deactivate Foundry tooltips on enter — that
   * flicker (active ↔ inactive) is what ate clicks. The tooltip itself is
   * inert so it cannot sit on top of the button.
   */
  #armSheetButtonsAgainstTooltipSteal(html: JQuery) {
    makeFoundryTooltipInert();
    html
      .off('pointerdown.msTipPass')
      .on('pointerdown.msTipPass', 'button, [role="button"], .sheet-tabs .item', () => {
        makeFoundryTooltipInert();
      });
  }


  /**
   * Force unlock creation (GM only)
   */
  async #onForceUnlockCreation(event: JQuery.ClickEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (!(game as any).user?.isGM) {
      ui.notifications?.warn('Only the GM can force unlock character creation.');
      return;
    }

    const confirmed = await Dialog.confirm({
      title: 'Force Unlock Character Creation',
      content: '<p>Are you sure you want to mark this character\'s creation as complete? This will unlock the sheet for editing.</p>'
    });

    if (confirmed) {
      try {
        await this.actor.update({ 'system.creation.complete': true });
        ui.notifications?.info('Character creation marked as complete.');
        this.render();
      } catch (error) {
        console.error('Mastery System | Failed to force unlock', error);
        ui.notifications?.error('Failed to unlock character creation.');
      }
    }
  }

  /**
   * GM-only: Full character reset. Wipes every embedded Item (powers, gear,
   * weapons, armor, schticks, artifacts, conditions, echo items), clears
   * every system.* field (attributes, skills, echo, disadvantages, passive
   * slots, manual adjustments, stress/health bars, …), flips creation back
   * to incomplete, and refunds the full lifetime earned-XP amount into
   * `system.points.xp` so the player can re-distribute it from scratch.
   *
   * Preserves the actor's `name`, `img`, `prototypeToken`, `ownership`,
   * `folder`, `flags`, and `system.xp.totalEarned` / `.history`.
   *
   * Requires two confirmations because the action is destructive and
   * cannot be undone without a world backup.
   */
  async #onResetCharacter(event: JQuery.ClickEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (!(game as any).user?.isGM) {
      (ui as any).notifications?.warn('Only the GM can reset a character.');
      return;
    }

    const actor = this.actor as any;
    const totalEarned = Number(actor?.system?.xp?.totalEarned ?? 0);
    const itemCount = (() => {
      try {
        const iter: any = actor?.items;
        if (!iter) return 0;
        let n = 0;
        for (const _ of iter) n++;
        return n;
      } catch {
        return 0;
      }
    })();

    const firstConfirm = await (Dialog as any).confirm({
      title: 'Reset Character?',
      content: `
        <div class="mastery-reset-char-warning">
          <p><strong>Destructive action — cannot be undone without a world backup.</strong></p>
          <p>This will <strong>wipe</strong> the character and drop them back into Character Creation:</p>
          <ul style="margin: 4px 0 8px 20px;">
            <li><strong>Removed:</strong> all powers, gear, weapons, armor, schticks, Echo artifacts, conditions (<em>${itemCount}</em> item(s) total), all attribute / skill values, Echo, disadvantages, passive slot assignments, manual adjustments, active effects, faith fractures, minor expressions.</li>
            <li><strong>General artifacts:</strong> reset to Level 1 / inactive and kept on the character; you will be asked whether equipped ones stay on the paperdoll.</li>
            <li><strong>Kept:</strong> name, portrait/token, ownership, folder, flags, and the lifetime earned XP (<em>${totalEarned}</em> XP).</li>
            <li><strong>After reset:</strong> the full <em>${totalEarned}</em> XP is added back to the player's available pool for re-distribution once creation is finalized again.</li>
          </ul>
          <p>Continue?</p>
        </div>
      `,
      yes: () => true,
      no: () => false,
      defaultYes: false,
    });

    if (!firstConfirm) return;

    // Second guard because this really is irreversible.
    const secondConfirm = await (Dialog as any).confirm({
      title: 'Really reset?',
      content:
        '<p>Last warning: every item, attribute, skill, and power on this character will be deleted. Name and portrait stay. Continue?</p>',
      yes: () => true,
      no: () => false,
      defaultYes: false,
    });

    if (!secondConfirm) return;

    const equippedGeneral = listEquippedGeneralArtifacts(actor);
    let keepEquippedGeneralArtifacts = false;
    if (equippedGeneral.length > 0) {
      const names = equippedGeneral.map((a) => a.name).join(', ');
      keepEquippedGeneralArtifacts = await (Dialog as any).confirm({
        title: 'General-Artefakte ausgerüstet lassen?',
        content: `
          <div class="mastery-reset-char-artifacts">
            <p>Dieser Charakter hat <strong>${equippedGeneral.length}</strong> ausgerüstete(s) General-Artefakt(e):</p>
            <p><em>${names}</em></p>
            <p>Sie werden auf <strong>Stufe 1 / inaktiv</strong> zurückgesetzt.</p>
            <p>Sollen sie <strong>weiterhin ausgerüstet</strong> bleiben?</p>
            <p class="notes">Echo-Artefakte werden entfernt und sind davon ausgenommen.</p>
          </div>
        `,
        yes: () => true,
        no: () => false,
        defaultYes: true,
        yesLabel: 'Ja, ausgerüstet lassen',
        noLabel: 'Nein, ins Inventar',
      });
    }

    const gmUser = (game as any).user;
    try {
      const result = await resetCharacterForRecreation(actor, {
        gmUserId: String(gmUser?.id ?? ''),
        gmUserName: String(gmUser?.name ?? 'GM'),
        keepEquippedGeneralArtifacts,
      });
      if (!result.ok) {
        (ui as any).notifications?.error(`Reset failed: ${result.error ?? 'unknown error'}`);
        return;
      }
      const keptNote =
        result.keptGeneralArtifactCount > 0
          ? ` ${result.keptGeneralArtifactCount} General-Artefakt(e) zurückgesetzt${keepEquippedGeneralArtifacts ? ' (ausgerüstet)' : ' (ins Inventar)'}.`
          : '';
      (ui as any).notifications?.info(
        `Character reset. ${result.removedItemCount} item(s) removed, ${result.returnedXp} XP returned to the pool.${keptNote}`,
      );
      await this.render(true);
    } catch (err) {
      console.error('Mastery System | Reset character failed:', err);
      (ui as any).notifications?.error('Reset failed — see console for details.');
    }
  }

  /**
   * Character Creation: reset all attributes to 2 so dropdowns show full options again.
   */
  #onResetCreationAttributes(event: JQuery.ClickEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (!this.actor.isOwner) {
      (ui as any).notifications?.warn('Only the character owner can reset attributes during creation.');
      return;
    }
    const attributeKeys = ['might', 'agility', 'vitality', 'intellect', 'resolve', 'influence', 'wits'];
    new Dialog({
      title: 'Reset attributes?',
      content:
        '<p class="mastery-reset-attrs-msg">Set <strong>all seven attributes</strong> to <strong>2</strong>. You can then pick the distribution again (2×8, 2×6, 2×4, 1×2). Skills, powers, and disadvantages are unchanged.</p>',
      buttons: {
        reset: {
          icon: '<i class="fas fa-undo"></i>',
          label: 'Reset all to 2',
          callback: async () => {
            const updates: Record<string, any> = {};
            for (const k of attributeKeys) {
              updates[`system.attributes.${k}.value`] = 2;
            }
            await this.actor.update(updates);
            (ui as any).notifications?.info('Attributes reset. Choose values again from the dropdowns.');
            await this.render();
          }
        },
        cancel: {
          label: 'Cancel',
          callback: () => {}
        }
      },
      default: 'cancel'
    } as any).render(true);
  }

  #toggleAttrCreationMenu(wrap: HTMLElement, select: HTMLSelectElement): void {
    const existing = wrap.querySelector('.attr-creation-menu');
    document.querySelectorAll('.attr-creation-menu').forEach((el) => el.remove());
    document.querySelectorAll('.attribute-value--creation.is-picking').forEach((el) => {
      el.classList.remove('is-picking');
    });
    if (existing) return;

    const menu = document.createElement('div');
    menu.className = 'attr-creation-menu';
    menu.setAttribute('role', 'listbox');
    for (const opt of Array.from(select.options)) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `attr-creation-menu-item${opt.selected ? ' is-current' : ''}`;
      btn.dataset.value = opt.value;
      btn.textContent = opt.textContent || opt.value;
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        select.value = opt.value;
        select.dispatchEvent(new Event('change', { bubbles: true }));
        menu.remove();
        wrap.classList.remove('is-picking');
      });
      menu.appendChild(btn);
    }
    wrap.classList.add('is-picking');
    wrap.appendChild(menu);

    const onDoc = (e: MouseEvent) => {
      if (wrap.contains(e.target as Node)) return;
      menu.remove();
      wrap.classList.remove('is-picking');
      document.removeEventListener('mousedown', onDoc, true);
    };
    window.setTimeout(() => document.addEventListener('mousedown', onDoc, true), 0);
  }

  /**
   * Character Creation: Attribute value changed via select dropdown
   */
  async #onCreationAttributeChange(event: JQuery.ChangeEvent) {
    const select = event.currentTarget as HTMLSelectElement;
    const attribute = select.dataset.attribute;
    if (!attribute) return;

    const newValue = parseInt(select.value);
    if (isNaN(newValue)) return;

    const system = (this.actor as any).system;
    const masteryRank = system.mastery?.rank || 2;
    const attributeKeys = ['might', 'agility', 'vitality', 'intellect', 'resolve', 'influence', 'wits'];

    // Count how many of each value are already assigned (excluding current attribute)
    let count8 = 0, count6 = 0, count4 = 0, count2 = 0;
    for (const key of attributeKeys) {
      if (key === attribute) continue;
      const v = system.attributes?.[key]?.value || masteryRank;
      if (v === 8) count8++;
      else if (v === 6) count6++;
      else if (v === 4) count4++;
      else if (v === 2) count2++;
    }

    // Validate the new assignment (2×8, 2×6, 2×4, 1×2)
    if (newValue === 8 && count8 >= 2) {
      ui.notifications?.warn('Already 2 attributes at 8. Choose a different value.');
      this.render();
      return;
    }
    if (newValue === 6 && count6 >= 2) {
      ui.notifications?.warn('Already 2 attributes at 6. Choose a different value.');
      this.render();
      return;
    }
    if (newValue === 4 && count4 >= 2) {
      ui.notifications?.warn('Already 2 attributes at 4. Choose a different value.');
      this.render();
      return;
    }
    if (newValue === 2 && count2 >= 1) {
      ui.notifications?.warn('Already 1 attribute at 2. Choose a different value.');
      this.render();
      return;
    }

    await this.actor.update({
      [`system.attributes.${attribute}.value`]: newValue
    });

    this.render();
  }

  /**
   * Character Creation / Redistribute: raise a skill by 4 (0 → 4).
   * One click spends the full creation cap; leftover 1/2/3 ranks are not allowed.
   */
  async #onCreationSkillIncrease(event: JQuery.ClickEvent) {
    event.preventDefault();
    const skill = $(event.currentTarget).data('skill');
    if (!skill) return;

    const creationComplete = (this.actor as any).system?.creation?.complete !== false;
    const redistributing = isSkillsRedistributing(this.actor);
    if (creationComplete && !redistributing) return;
    if (!this.actor.isOwner && !(game as any).user?.isGM) {
      ui.notifications?.warn('Only the owner or GM can allocate skill points.');
      return;
    }
    
    // Save scroll position
    const skillsTab = $(this.element).find('.tab.skills');
    const scrollTop = skillsTab.scrollTop();
    
    const system = (this.actor as any).system;
    const currentValue = Math.max(0, Math.floor(Number(system.skills?.[skill]) || 0));
    const { total: skillPointsConfig } = getCreationSkillBudget();
    
    // Calculate current points spent
    let skillPointsSpent = 0;
    for (const skillValue of Object.values(system.skills || {})) {
      skillPointsSpent += (typeof skillValue === 'number' ? skillValue : 0);
    }
    const remaining = skillPointsConfig - skillPointsSpent;
    const next = nextCreationSkillValue(currentValue, remaining);
    if (!next.ok || next.value == null) {
      ui.notifications?.warn(next.reason || 'Cannot raise this skill.');
      return;
    }
    
    await this.actor.update({
      [`system.skills.${skill}`]: next.value,
    });
    
    await this.render();
    
    // Restore scroll position
    const newSkillsTab = $(this.element).find('.tab.skills');
    if (newSkillsTab.length) {
      newSkillsTab.scrollTop(scrollTop ?? 0);
    }
  }

  /**
   * Character Creation / Redistribute: clear skill chunk back to 0.
   */
  async #onCreationSkillDecrease(event: JQuery.ClickEvent) {
    event.preventDefault();
    const skill = $(event.currentTarget).data('skill');
    if (!skill) return;

    const creationComplete = (this.actor as any).system?.creation?.complete !== false;
    const redistributing = isSkillsRedistributing(this.actor);
    if (creationComplete && !redistributing) return;
    if (!this.actor.isOwner && !(game as any).user?.isGM) {
      ui.notifications?.warn('Only the owner or GM can allocate skill points.');
      return;
    }
    
    // Save scroll position
    const skillsTab = $(this.element).find('.tab.skills');
    const scrollTop = skillsTab.scrollTop();
    
    const system = (this.actor as any).system;
    const currentValue = Math.max(0, Math.floor(Number(system.skills?.[skill]) || 0));
    const prev = prevCreationSkillValue(currentValue);
    if (!prev.ok || prev.value == null) {
      ui.notifications?.warn(prev.reason || 'Skill cannot go below 0.');
      return;
    }
    
    await this.actor.update({
      [`system.skills.${skill}`]: prev.value,
    });
    
    await this.render();
    
    // Restore scroll position
    const newSkillsTab = $(this.element).find('.tab.skills');
    if (newSkillsTab.length) {
      newSkillsTab.scrollTop(scrollTop ?? 0);
    }
  }

  async #onStartSkillsRedistribute(): Promise<void> {
    if (!this.actor.isOwner && !(game as any).user?.isGM) {
      ui.notifications?.warn('Only the owner or GM can redistribute skills.');
      return;
    }
    const gate = canStartSkillsRedistribute(this.actor);
    if (!gate.ok) {
      ui.notifications?.warn(gate.reason || 'Cannot redistribute skills.');
      return;
    }
    const { total, maxPerSkill } = getCreationSkillBudget();
    const confirmed = await new Promise<boolean>((resolve) => {
      new Dialog({
        title: 'Redistribute Skills',
        content: `<p>Reset all skills to <strong>0</strong> and distribute <strong>${total}</strong> points in steps of <strong>${maxPerSkill}</strong> (each click sets a skill to ${maxPerSkill}; only 0 or ${maxPerSkill}).</p>
<p><em>Only available when the character has no XP yet. Cancel restores the previous allocation.</em></p>`,
        buttons: {
          yes: {
            icon: '<i class="fas fa-check"></i>',
            label: 'Reset & Redistribute',
            callback: () => resolve(true),
          },
          no: {
            icon: '<i class="fas fa-times"></i>',
            label: 'Cancel',
            callback: () => resolve(false),
          },
        },
        default: 'no',
        close: () => resolve(false),
      }).render(true);
    });
    if (!confirmed) return;
    await this.actor.update(buildStartSkillsRedistributeUpdates(this.actor));
    ui.notifications?.info(
      `Skills cleared — distribute ${total} points freely (max ${maxPerSkill} per skill), then Finish.`,
    );
    this.render();
  }

  async #onFinishSkillsRedistribute(): Promise<void> {
    if (!this.actor.isOwner && !(game as any).user?.isGM) {
      ui.notifications?.warn('Only the owner or GM can finish skill redistribution.');
      return;
    }
    if (!isSkillsRedistributing(this.actor)) return;
    const result = buildFinishSkillsRedistributeUpdates(this.actor);
    if (!result.ok || !result.updates) {
      ui.notifications?.warn(result.reason || 'Cannot finish skill redistribution.');
      return;
    }
    await this.actor.update(result.updates);
    ui.notifications?.info('Skill redistribution complete.');
    this.render();
  }

  async #onCancelSkillsRedistribute(): Promise<void> {
    if (!this.actor.isOwner && !(game as any).user?.isGM) {
      ui.notifications?.warn('Only the owner or GM can cancel skill redistribution.');
      return;
    }
    if (!isSkillsRedistributing(this.actor)) return;
    await this.actor.update(buildCancelSkillsRedistributeUpdates(this.actor));
    ui.notifications?.info('Skill redistribution cancelled — previous skills restored.');
    this.render();
  }

  /**
   * Add Disadvantage during Creation
   */
  async #onAddDisadvantage(event: JQuery.ClickEvent) {
    event.preventDefault();
    event.stopPropagation();

    const creationComplete = (this.actor as any).system?.creation?.complete !== false;
    const isGm = (game as any).user?.isGM === true;
    if (creationComplete && !isGm) {
      (ui as any).notifications?.warn('Only a GM can add disadvantages after character creation.');
      return;
    }
    // Debug: Check if DISADVANTAGES is loaded
    if (!DISADVANTAGES || DISADVANTAGES.length === 0) {
      const errorMsg = 'Disadvantages list is not loaded. Please check the console for errors.';
      console.error('Mastery System | ERROR: DISADVANTAGES is empty or undefined!', {
        DISADVANTAGES: DISADVANTAGES,
        type: typeof DISADVANTAGES
      });
      ui.notifications?.error(errorMsg);
      return;
    }
    // Show selection dialog
    const disadvantageOptions = DISADVANTAGES.map(d => ({
      value: d.id,
      label: `${d.name} (${Array.isArray(d.basePoints) ? d.basePoints.join('/') : d.basePoints} pts)`
    }));
    const content = `
      <form class="mastery-system disadvantage-selection-form">
        <div class="disadvantage-field">
          <label class="disadvantage-field-label" for="disadvantageId">Select Disadvantage</label>
          <select name="disadvantageId" id="disadvantageId" class="disadvantage-field-control">
            <option value="">-- Select a Disadvantage --</option>
            ${disadvantageOptions.map(opt => `<option value="${opt.value}">${opt.label}</option>`).join('')}
          </select>
          <p class="disadvantage-field-hint">Pick a type, then Configure to write the details.</p>
        </div>
        ${disadvantageOptions.length === 0 ? '<p class="disadvantage-empty-warn">No disadvantages available. Please check the console.</p>' : ''}
      </form>
    `;
    const dialog = new Dialog({
      title: 'Add Disadvantage',
      content,
      buttons: {
        configure: {
          label: 'Configure',
          callback: async (html: JQuery) => {
            const disadvantageId = html.find('[name="disadvantageId"]').val() as string;
            if (!disadvantageId) {
              ui.notifications?.warn('Please select a disadvantage.');
              return false;
            }
            
            const def = getDisadvantageDefinition(disadvantageId);
            if (!def) {
              ui.notifications?.error(`Disadvantage definition not found for ID: ${disadvantageId}`);
              return false;
            }
            
            // Open configuration dialog
            await this.#openDisadvantageConfigDialog(def);
            return true;
          }
        },
        cancel: {
          label: 'Cancel',
          callback: () => {
          }
        }
      },
      default: 'configure',
      render: (htmlRaw: JQuery | HTMLElement) => {
        this.#setupDisadvantageDialogChrome(dialog, 'selection', htmlRaw);
        scheduleCenterLegacyDialog($(htmlRaw instanceof HTMLElement ? htmlRaw : htmlRaw), dialog);
      }
    } as any, {
      classes: ['dialog', 'mastery-system', 'disadvantage-selection-dialog'],
      width: 480,
      height: 280,
      resizable: true,
    });
    try {
      await dialog.render(true);
    } catch (error) {
      console.error('Mastery System | ERROR rendering dialog:', error);
      ui.notifications?.error('Failed to open disadvantage dialog. Check console for details.');
    }
  }

  /**
   * Edit Disadvantage during Creation
   */
  async #onEditDisadvantage(event: JQuery.ClickEvent) {
    event.preventDefault();
    const creationComplete = (this.actor as any).system?.creation?.complete !== false;
    const isGm = (game as any).user?.isGM === true;
    if (creationComplete && !isGm) {
      (ui as any).notifications?.warn('Only a GM can edit disadvantages after character creation.');
      return;
    }
    const index = parseInt($(event.currentTarget).data('index') || '0');
    const system = (this.actor as any).system;
    const disadvantages = system.disadvantages || [];
    
    if (index < 0 || index >= disadvantages.length) return;
    
    const selection = disadvantages[index];
    const def = getDisadvantageDefinition(selection.id);
    if (!def) return;
    
    await this.#openDisadvantageConfigDialog(def, index, selection.details);
  }

  /**
   * Remove Disadvantage during Creation
   */
  async #onRemoveDisadvantage(event: JQuery.ClickEvent) {
    event.preventDefault();
    const creationComplete = (this.actor as any).system?.creation?.complete !== false;
    const isGm = (game as any).user?.isGM === true;
    if (creationComplete && !isGm) {
      (ui as any).notifications?.warn('Only a GM can remove disadvantages after character creation.');
      return;
    }
    const index = parseInt($(event.currentTarget).data('index') || '0');
    const system = (this.actor as any).system;
    const disadvantages = [...(system.disadvantages || [])];
    
    if (index < 0 || index >= disadvantages.length) return;
    
    const removed = disadvantages[index];
    disadvantages.splice(index, 1);
    
    // Mark disadvantages as reviewed
    const updateData: any = { 'system.disadvantages': disadvantages };
    if (!(this.actor as any).system.creation?.disadvantagesReviewed) {
      updateData['system.creation.disadvantagesReviewed'] = true;
    }
    
    await this.actor.update(updateData);
    ui.notifications?.info(`Removed ${removed.name}`);
    this.render();
  }

  /**
   * Apply disadvantage dialog styling only to this Dialog's shell.
   * Foundry 14 `dialog.element` is an HTMLElement, not jQuery — wrap it before adding classes.
   * Prefer `.window-app.dialog` / `.application.dialog`; never climb to a generic `#interface` application.
   */
  #resolveDisadvantageDialogShell(
    dialog: { element?: unknown },
    htmlRaw?: JQuery | HTMLElement
  ): JQuery {
    const raw = dialog?.element;
    if (raw instanceof HTMLElement) {
      const $el = $(raw);
      if ($el.is('.window-app, .application.dialog, .application')) return $el;
    } else if (raw) {
      const $el = $(raw as JQuery);
      if ($el?.length && $el.is('.window-app, .application.dialog, .application')) return $el;
    }
    if (htmlRaw) {
      const html = htmlRaw instanceof HTMLElement ? $(htmlRaw) : $(htmlRaw);
      const found = html.closest('.window-app.dialog, .application.dialog, .window-app');
      if (found.length) return found;
      return findLegacyDialogRoot(html);
    }
    return $();
  }

  #setupDisadvantageDialogChrome(
    dialog: { element?: unknown },
    kind: 'selection' | 'config',
    htmlRaw?: JQuery | HTMLElement
  ): void {
    const shell = this.#resolveDisadvantageDialogShell(dialog, htmlRaw);
    if (!shell?.length) return;
    shell.removeClass('theme-light').addClass('themed theme-dark');
    if (kind === 'selection') {
      shell.addClass('mastery-system disadvantage-selection-dialog');
      queueMicrotask(() => {
        setTimeout(() => this.#attachDisadvantageDialogResizeHandle(shell, 360, 260), 80);
      });
    } else {
      shell.addClass('mastery-system disadvantage-config-dialog-styled');
      queueMicrotask(() => {
        setTimeout(() => this.#attachDisadvantageDialogResizeHandle(shell, 500, 340), 80);
      });
    }
  }

  /**
   * Legacy Dialog may not show a resize grip; add bottom-right resize if still missing after paint.
   */
  #wireDisadvantageExamplePresets(root: JQuery, def: any): void {
    const presets = def?.examplePresets as Array<{ label: string; text: string }> | undefined;
    if (!presets?.length || !root?.length) return;

    const $sel = root.find('.js-disadvantage-example-preset');
    if (!$sel.length) return;

    if (def.presetFillsNameAndContext) {
      $sel.off('change.ms-preset').on('change.ms-preset', () => {
        const raw = String($sel.val() ?? '');
        const idx = parseInt(raw, 10);
        if (!Number.isFinite(idx) || idx < 0 || idx >= presets.length) return;
        const p = presets[idx];
        if (!p) return;
        const $form = this.#disadvantageDialogFormRoot(root);
        $form.find('[name="sheetTitle"]').val(p.label);
        $form.find('[name="name"]').val(p.label);
        $form.find('[name="context"]').val(p.text || '');
      });
      return;
    }

    let targetName = def.presetTargetField as string | undefined;
    if (!targetName) {
      const ta = (def.fields || []).find((f: any) => f.type === 'textarea');
      targetName = ta?.name;
    }
    if (!targetName) return;

    $sel.off('change.ms-preset').on('change.ms-preset', () => {
      const raw = String($sel.val() ?? '');
      const idx = parseInt(raw, 10);
      if (!Number.isFinite(idx) || idx < 0 || idx >= presets.length) return;
      const text = presets[idx]?.text;
      if (text == null) return;
      root.find(`[name="${targetName}"]`).val(text);
    });
  }

  #attachDisadvantageDialogResizeHandle(root: JQuery, minWidth: number, minHeight: number) {
    if (!root?.length) return;
    if (root.find('> .window-resizable-handle').length) return;
    const appEl = root[0] as HTMLElement;
    const handle = $('<div class="window-resizable-handle" title="Resize" role="presentation"></div>');
    root.append(handle);
    handle.on('mousedown.disadvantageResize', (e: JQuery.MouseDownEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const startX = e.clientX;
      const startY = e.clientY;
      const rect = appEl.getBoundingClientRect();
      const startW = rect.width;
      const startH = rect.height;
      const maxW = Math.max(minWidth, Math.min(1000, window.innerWidth - 24));
      const maxH = Math.max(minHeight, Math.min(900, window.innerHeight - 24));
      const onMove = (move: MouseEvent) => {
        const dw = move.clientX - startX;
        const dh = move.clientY - startY;
        const w = Math.min(maxW, Math.max(minWidth, startW + dw));
        const h = Math.min(maxH, Math.max(minHeight, startH + dh));
        appEl.style.width = `${w}px`;
        appEl.style.height = `${h}px`;
      };
      const onUp = () => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      };
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });
  }

  /** Scope field queries to the disadvantage dialog (avoids stray `[name="…"]` matches). */
  #disadvantageDialogFormRoot(html: JQuery): JQuery {
    const $h = $(html);
    if ($h.is('.disadvantage-config-dialog')) return $h;
    const inner = $h.find('.disadvantage-config-dialog').first();
    return inner.length ? inner : $h;
  }

  /**
   * Open Disadvantage Configuration Dialog
   */
  async #openDisadvantageConfigDialog(
    def: any,
    editIndex?: number,
    existingDetails?: Record<string, any>
  ) {
    const mergedDetails =
      def.id === 'mental-restrictions'
        ? detailsForMentalRestrictionsDialog(existingDetails)
        : def.id === 'physical-scars'
          ? detailsForPhysicalScarsDialog(existingDetails)
          : existingDetails || {};

    const content = await foundry.applications.handlebars.renderTemplate(
      'systems/mastery-system/templates/dialogs/disadvantage-config.hbs',
      {
        disadvantage: def,
        details: mergedDetails
      }
    );

    const configDialog = new Dialog({
      title: `${editIndex !== undefined ? 'Edit' : 'Add'} ${def.name}`,
      content,
      buttons: {
        save: {
          icon: '<i class="fas fa-check"></i>',
          label: 'Save',
          callback: async (html: JQuery) => {
            const $root = this.#disadvantageDialogFormRoot($(html));
            const details: Record<string, any> = {};
            for (const field of def.fields || []) {
              if (field.type === 'number') {
                details[field.name] = parseInt($root.find(`[name="${field.name}"]`).val() as string) || 0;
              } else if (field.type === 'select') {
                details[field.name] = $root.find(`[name="${field.name}"]`).val() as string;
              } else if (field.type === 'textarea') {
                details[field.name] = String($root.find(`[name="${field.name}"]`).val() || '').trim();
              } else {
                details[field.name] = String($root.find(`[name="${field.name}"]`).val() || '').trim();
              }
            }

            delete details.name;

            if (def.id === 'physical-scars' && details.tier && String(details.sheetTitle || '').trim()) {
              delete details.scar;
              delete details.description;
            }
            if (def.id === 'mental-restrictions' && String(details.sheetTitle || '').trim()) {
              delete details.restriction;
              delete details.type;
            }

            // Validate required fields are not empty
            for (const field of def.fields || []) {
              if (field.required && !details[field.name]?.toString().trim()) {
                ui.notifications?.warn(`"${field.label}" is required and cannot be empty.`);
                return false;
              }
            }

            const points = calculateDisadvantagePoints(def.id, details);
            const system = (this.actor as any).system;
            const currentDisadvantages = [...(system.disadvantages || [])];
            const newSelection = { id: def.id, details };
            const forValidation =
              editIndex !== undefined
                ? currentDisadvantages.filter((_: unknown, i: number) => i !== editIndex)
                : [...currentDisadvantages];
            const validation = validateDisadvantageSelection([...forValidation, newSelection]);

            if (!validation.valid) {
              ui.notifications?.error(validation.error || 'Invalid disadvantage selection');
              return false;
            }

            const entry = {
              id: def.id,
              name: def.name,
              points,
              details,
              description: def.description
            };
            if (editIndex !== undefined) {
              currentDisadvantages[editIndex] = entry;
            } else {
              currentDisadvantages.push(entry);
            }

            // Mark disadvantages as reviewed
            const updateData: any = { 'system.disadvantages': currentDisadvantages };
            if (!(this.actor as any).system.creation?.disadvantagesReviewed) {
              updateData['system.creation.disadvantagesReviewed'] = true;
            }
            
            await this.actor.update(updateData);
            ui.notifications?.info(`${editIndex !== undefined ? 'Updated' : 'Added'} ${def.name} (${points} points)`);
            this.render();
            return true;
          }
        },
        cancel: {
          icon: '<i class="fas fa-times"></i>',
          label: 'Cancel',
          callback: () => {}
        }
      },
      default: 'save',
      render: (htmlRaw: JQuery | HTMLElement) => {
        const html = htmlRaw instanceof HTMLElement ? $(htmlRaw) : $(htmlRaw);
        this.#wireDisadvantageExamplePresets(html, def);
        this.#setupDisadvantageDialogChrome(configDialog, 'config', html);
        scheduleCenterLegacyDialog(html, configDialog);
      }
    } as any, {
      classes: ['dialog', 'mastery-system', 'disadvantage-config-dialog-styled'],
      width: 600,
      height: 560,
      resizable: true,
    });
    await configDialog.render(true);
  }

  /**
   * Finalize Character Creation
   */
  async #onFinalizeCreation(event: JQuery.ClickEvent) {
    event.preventDefault();
    
    const system = (this.actor as any).system;
    const masteryRank = system.mastery?.rank || 2;
    const skillPointsConfig = (CONFIG as any).MASTERY?.creation?.skillPoints || 40;
    
    const attributeKeys = ['might', 'agility', 'vitality', 'intellect', 'resolve', 'influence', 'wits'];
    
    let skillPointsSpent = 0;
    for (const skillValue of Object.values(system.skills || {})) {
      skillPointsSpent += (typeof skillValue === 'number' ? skillValue : 0);
    }
    
    const disadvantagePoints = (system.disadvantages || []).reduce((sum: number, d: any) => sum + (d.points || 0), 0);
    const maxDisadvantagePts = (CONFIG as any).MASTERY?.creation?.maxDisadvantagePoints ?? 8;
    const minDisadvantagePts = (CONFIG as any).MASTERY?.creation?.minDisadvantagePoints ?? 2;
    
    // Validate powers & magic
    const powers = this.actor.items.filter((item: any) => item.type === 'power');

    const creationCategoryCounts = countPowersByCategory(powers);

    // Validate attribute distribution (2×8, 2×6, 2×4, 1×2)
    const attrValues = attributeKeys.map(key => system.attributes?.[key]?.value || masteryRank);
    const c8 = attrValues.filter((v: number) => v === 8).length;
    const c6 = attrValues.filter((v: number) => v === 6).length;
    const c4 = attrValues.filter((v: number) => v === 4).length;
    const c2 = attrValues.filter((v: number) => v === 2).length;
    if (c8 !== 2 || c6 !== 2 || c4 !== 2 || c2 !== 1) {
      ui.notifications?.error(
        `Attributes must be 2×8, 2×6, 2×4, 1×2. Currently: ${c8}×8, ${c6}×6, ${c4}×4, ${c2}×2`
      );
      return;
    }
    if (skillPointsSpent !== skillPointsConfig) {
      ui.notifications?.error(`Must spend exactly ${skillPointsConfig} skill points. Currently spent: ${skillPointsSpent}`);
      return;
    }
    const skillAlloc = validateCreationSkillAllocation(system);
    if (!skillAlloc.ok) {
      ui.notifications?.error(skillAlloc.reason || 'Invalid skill allocation.');
      return;
    }

    const towerErr = validateTowerWizardCreation(this.actor);
    if (towerErr) {
      ui.notifications?.error(towerErr);
      return;
    }
    if (disadvantagePoints < minDisadvantagePts) {
      ui.notifications?.error(
        `You must take at least ${minDisadvantagePts} points of disadvantages to finish creation (currently ${disadvantagePoints}).`
      );
      return;
    }
    if (disadvantagePoints > maxDisadvantagePts) {
      ui.notifications?.error(
        `Disadvantages cannot exceed ${maxDisadvantagePts} points (currently ${disadvantagePoints}).`
      );
      return;
    }

    const rawEcho = system.echo || {};
    const echoDef = getEcho(rawEcho.key);
    const echoSubChoice = echoDef?.subChoices?.length
      ? getEchoSubChoice(rawEcho.key, rawEcho.subChoiceKey || null)
      : undefined;
    if (!echoDef) {
      ui.notifications?.error('Choose an Echo before finalizing character creation.');
      return;
    }
    if (echoDef.subChoices?.length && !rawEcho.subChoiceKey) {
      ui.notifications?.error(`Choose a ${echoDef.subChoiceLabel || 'sub-choice'} for your Echo before finalizing.`);
      return;
    }
    if (echoDef.veiledForm && !rawEcho.veiledFormKey) {
      ui.notifications?.error('Choose a Veiled Form for your Dragonborn before finalizing.');
      return;
    }
    const startCards: string[] = Array.isArray(rawEcho.selectedCardIds)
      ? rawEcho.selectedCardIds.filter((id: any) => typeof id === 'string')
      : [];
    if (startCards.length < 1) {
      ui.notifications?.error('Pick at least one Echo start card before finalizing.');
      return;
    }

    const langNorm = normalizeKnownLanguages(
      system.languages?.known,
      system.echo?.key,
    );
    if (!langNorm.creationValid) {
      ui.notifications?.error('Pick at least one additional language (besides Common) before finalizing.');
      return;
    }
    void echoSubChoice;
    
    // Power Level cap is by Mastery Rank (MR 1–2 → 4, …, MR 5+ → 16). MR 2 may keep Level 4 Powers.
    const maxPowerLevel = calculateMaxPowerLevel(masteryRank);
    const invalidPowers = powers.filter((p: any) => (p.system?.level || 1) > maxPowerLevel);
    if (invalidPowers.length > 0) {
      ui.notifications?.error(`Power Level cannot exceed ${maxPowerLevel} at Mastery Rank ${masteryRank}. Invalid: ${invalidPowers.map((p: any) => p.name).join(', ')}`);
      return;
    }
    
    // Validate schticks per rank
    const schticksRanks = system.schticks?.ranks || [];
    const schticksRows: Array<{rank: number, schtickName: string, manifestation: string}> = [];
    for (let rank = 1; rank <= masteryRank; rank++) {
      const rankData = schticksRanks.find((r: any) => r.rank === rank);
      schticksRows.push({
        rank,
        schtickName: rankData?.schtickName || '',
        manifestation: rankData?.manifestation || ''
      });
    }
    // Schticks validation removed - no longer required
    // Sync Faith Fractures: Disadvantage Points = Starting Faith Fractures (both current and maximum)
    const updateData: any = {
      'system.creation.complete': true,
      'system.mastery.rank': masteryRank,
      'system.faithFractures.current': disadvantagePoints,
      'system.faithFractures.maximum': disadvantagePoints,
      'system.languages.known': langNorm.cleaned,
    };
    
    // Always persist full per-rank schtick rows (merged 1..MR) so actor data matches the sheet after finalize
    updateData['system.schticks.ranks'] = schticksRows;
    
    const attributeBaselines: Record<string, number> = {};
    for (const key of attributeKeys) {
      attributeBaselines[key] = system.attributes?.[key]?.value ?? 2;
    }

    const postCreationProgress = buildPostCreationSnapshot(this.actor);

    // XP: preserve GM-granted (or other) pool earned before finalize — do not zero the sheet on complete.
    const points = system.points || {};
    const xpExisting = system.xp || {};
    let preservedAvailable = Math.max(0, Number(points.xp) || 0);
    let preservedTotalEarned = Math.max(0, Number(xpExisting.totalEarned) || 0);
    const preservedTotalSpent = Math.max(0, Number(xpExisting.totalSpent) || 0);
    const preservedHistory = Array.isArray(xpExisting.history) ? [...xpExisting.history] : [];

    if (preservedTotalEarned === 0 && preservedAvailable > 0) {
      preservedTotalEarned = preservedAvailable;
    }
    if (preservedAvailable === 0 && preservedTotalEarned > preservedTotalSpent) {
      preservedAvailable = preservedTotalEarned - preservedTotalSpent;
    }

    updateData['system.points.xp'] = preservedAvailable;
    updateData['system.xp.totalEarned'] = preservedTotalEarned;
    updateData['system.xp.totalSpent'] = preservedTotalSpent;
    updateData['system.xp.attributeBaselines'] = attributeBaselines;
    updateData['system.xp.postCreationProgress'] = postCreationProgress;
    updateData['system.xp.history'] = preservedHistory;
    // Free XP pool: preserve any already-granted Free XP across finalize.
    updateData['system.points.xpFree'] = Math.max(0, Number(points.xpFree) || 0);
    updateData['system.xp.freeEarned'] = Math.max(0, Number((xpExisting as any).freeEarned) || 0);
    updateData['system.xp.freeSpent'] = Math.max(0, Number((xpExisting as any).freeSpent) || 0);
    // Initialize the once-per-step bump bucket at finalize.
    updateData['system.xp.currentStep'] = { attributes: [], skills: [], powers: [], artifacts: [] };
    
    try {
      await this.actor.update(updateData, { render: false });
      
      // Ensure all power items have minLevel set to their current level
      const powerItems = this.actor.items.filter((item: any) => item.type === 'power');
      for (const power of powerItems) {
        const lvl = (power.system as any).level ?? 1;
        const min = (power.system as any).minLevel;
        if (min === undefined || min === null) {
          await power.update({ 'system.minLevel': lvl });
        }
      }

      const refreshed = (game as any).actors?.get(this.actor.id) ?? this.actor;
      const savedPowers = refreshed.items.filter((item: any) => item.type === 'power');
      const savedCounts = countPowersByCategory(savedPowers);
      const echoLabel = [
        echoDef.name,
        echoSubChoice?.name,
        echoDef.veiledForm && rawEcho.veiledFormKey ? `veiled as ${getEcho(rawEcho.veiledFormKey)?.name || rawEcho.veiledFormKey}` : '',
      ].filter(Boolean).join(' · ');

      const expectedPowerTotal = Object.values(
        creationPowerRequirementsForMasteryRank(Number((this.actor as any).system?.mastery?.rank) || 2),
      ).reduce((s, n) => s + n, 0);
      if (savedPowers.length !== expectedPowerTotal) {
        ui.notifications?.warn(
          `Character creation marked complete, but only ${savedPowers.length} of ${expectedPowerTotal} Powers are on this actor. Check the Items tab in the sidebar — if powers are missing, re-add them before playing.`,
        );
      } else {
        ui.notifications?.info(
          `Character creation complete — ${savedPowers.length} Powers saved (${CATEGORY_ORDER.map(c => `${savedCounts[c]} ${CATEGORY_LABELS[c]}`).join(', ')}). Echo: ${echoLabel}.`,
        );
      }

      this._powersListDetailsOpen = true;
      this.render(false);
    } catch (error) {
      console.error('Mastery System | Failed to finalize character creation', error);
      ui.notifications?.error('Failed to finalize character creation.');
    }
  }

  /** Status UI is button-driven — never let an empty form submit wipe it. */
  _prepareSubmitData(event: any, form: any, formData: any, updateData?: any): any {
    const data = super._prepareSubmitData(event, form, formData, updateData);
    if (!data?.system || !Object.prototype.hasOwnProperty.call(data.system, 'statusEffects')) {
      return data;
    }
    const submitted = coerceStatusEffectsArray(data.system.statusEffects);
    data.system.statusEffects =
      submitted.length > 0
        ? submitted
        : coerceStatusEffectsArray((this.actor as any).system?.statusEffects);
    return data;
  }

  /** Local controls that must not submit / re-render the actor sheet. */
  #isLocalMinorMagicField(event?: Event): boolean {
    const target = event?.target as HTMLElement | null;
    return !!target?.closest?.('.js-mm-name, .mm-root .js-mm-form, .power-display-name-input');
  }

  async #giveMinorMagicItem(item: any): Promise<boolean> {
    const actors = listMinorMagicGiveTargets(this.actor.id);
    if (!actors.length) {
      ui.notifications?.warn('No other player character you can give this to.');
      return false;
    }
    const options = actors
      .map((a: any) => `<option value="${a.id}">${a.name}</option>`)
      .join('');
    const DialogV2 = (globalThis as any).foundry?.applications?.api?.DialogV2;
    let targetId = '';
    if (typeof DialogV2?.prompt === 'function') {
      targetId = await DialogV2.prompt({
        window: { title: `Give ${item.name}` },
        content: `<form class="mastery-dialog-form"><label class="md-label">Give to</label><select name="target" class="md-select">${options}</select></form>`,
        ok: {
          label: 'Give',
          callback: (_event: unknown, button: any) =>
            String(button?.form?.elements?.target?.value || ''),
        },
      });
    } else {
      targetId = String(actors[0]?.id || '');
    }
    const target = actors.find((a: any) => a.id === targetId);
    if (!target) return false;
    const result = await giveMinorMagicItemToActor(this.actor, item, target);
    if (!result.ok) {
      ui.notifications?.warn(result.error);
      return false;
    }
    const flag = readMinorMagicFlag(item) || readMinorMagicFlag(result.item);
    const creatorName = String(flag?.creatorName || 'the creator');
    const ownLimit = String(flag?.creatorId || '') === String(this.actor.id);
    ui.notifications?.info(
      ownLimit
        ? `${item.name} given to ${target.name}. It still counts against your Minor Magic limit.`
        : `${item.name} given to ${target.name}. It still counts against ${creatorName}'s Minor Magic limit.`,
    );
    return true;
  }

  async #returnMinorMagicItem(item: any): Promise<boolean> {
    const result = await returnMinorMagicItemToCreator(this.actor, item);
    if (!result.ok) {
      ui.notifications?.warn(result.error);
      return false;
    }
    ui.notifications?.info(
      `${item.name} returned to ${result.creator.name}. They can give it again. It still counts against their Minor Magic limit.`,
    );
    return true;
  }

  /** @override */
  _onChangeForm(formConfig: any, event: Event) {
    if (this.#isLocalMinorMagicField(event)) return;
    return super._onChangeForm?.(formConfig, event);
  }

  /** @override */
  async _onSubmitForm(formConfig: any, event: Event) {
    if (this.#isLocalMinorMagicField(event)) {
      event?.preventDefault?.();
      return;
    }
    // Block updates if creation is incomplete
    const creationComplete = (this.actor as any).system?.creation?.complete !== false;
    if (!creationComplete && !(game as any).user?.isGM) {
      event?.preventDefault?.();
      ui.notifications?.warn('Character creation is incomplete. Please complete character creation first.');
      return;
    }
    
    return super._onSubmitForm(formConfig, event);
  }

  /**
   * Wire a freshly embedded artifact to the world evolution tree when possible.
   */
  async #tryWireDroppedArtifact(embedded: any, sourceWorld?: any): Promise<void> {
    if (!embedded || embedded.type !== 'artifact') return;
    if (embedded.getFlag?.('mastery-system', 'evolutionRootItemId')) return;

    const sourceNodeId = sourceWorld?.getFlag?.('mastery-system', 'nodeId');
    const embeddedNodeId = embedded.getFlag?.('mastery-system', 'nodeId');
    if (!sourceNodeId && !embeddedNodeId) {
      const { inferArtifactKeyFromName } = await import('../utils/artifact-tree-grant.js');
      if (!inferArtifactKeyFromName(embedded.name) && !sourceWorld) return;
    }

    const { wireEmbeddedArtifactToWorldTree } = await import('../utils/artifact-tree-grant.js');
    await wireEmbeddedArtifactToWorldTree(this.actor, embedded, { sourceWorldItem: sourceWorld });
  }

  /**
   * Handle drag and drop for equipment
   */
  async _onDrop(event: DragEvent): Promise<boolean> {
    if ((event as any).__msDropHandled) {
      return false;
    }
    (event as any).__msDropHandled = true;
    const TextEditorImpl = foundry.applications?.ux?.TextEditor?.implementation || TextEditor;
    const data = TextEditorImpl.getDragEventData(event);
    
    const path = (event.composedPath?.() || []) as HTMLElement[];
    const pathDropTarget = path.find(el => (el as HTMLElement)?.dataset?.dfDrop) as HTMLElement | undefined;
    const resolvedTarget = ((event as any).__msDropTarget as HTMLElement | undefined)
      || (event.target as HTMLElement)?.closest('[data-df-drop]')
      || pathDropTarget
      || null;
    const target = resolvedTarget as HTMLElement | null;
    if (!target) {
      if (data.uuid) {
        try {
          const src = await fromUuid(data.uuid);
          if (readMinorMagicFlag(src) && src.parent && src.parent.id !== this.actor.id) {
            const moved = await transferConsumableToActor(this.actor, src);
            if (!moved) {
              ui.notifications?.error(`Could not give ${src.name} to this character.`);
              return false;
            }
            await this.render(true, { focus: false });
            return true;
          }
        } catch {
          /* fall through to the default drop */
        }
      }
      // No equipment drop zone — delegate to ActorSheetV2 (item creation / sorting).
      await super._onDrop(event);
      return true;
    }

    if (target.dataset.dfDrop === 'consumable-slot') {
      return this.#onDropConsumableSlot(event, data, target);
    }

    const dropPath = (event.composedPath?.() || [event.target]) as HTMLElement[];

    // Get dropped item
    let droppedItem: any = null;
    if (data.uuid) {
      droppedItem = await fromUuid(data.uuid);
    } else if (data.data?._id) {
      droppedItem = this.actor.items.get(data.data._id);
    }
    if (!droppedItem) {
      const dragItemId = (window as any).__msDragItemId as string | undefined;
      if (dragItemId) {
        droppedItem = this.actor.items.get(dragItemId);
      }
    }
    if (!droppedItem) {
      let sourceWorldItem: any = null;
      if (data.uuid) {
        try {
          sourceWorldItem = await fromUuid(data.uuid);
        } catch {
          sourceWorldItem = null;
        }
      }

      // External item - let parent handle creation first.
      // (ActorSheetV2._onDrop returns void — detect success via item count.)
      const itemCountBefore = this.actor.items.size;
      await super._onDrop(event);
      
      // Wait a bit for item to be created, then find it
      await new Promise(resolve => setTimeout(resolve, 100));
      const itemCountAfter = this.actor.items.size;
      
      if (itemCountAfter > itemCountBefore) {
        // Find the newly created item (last item in collection)
        const itemsArray = Array.from(this.actor.items.values());
        droppedItem = itemsArray[itemsArray.length - 1];
        if (droppedItem) {
          await this.#tryWireDroppedArtifact(droppedItem, sourceWorldItem);
          if (isAmmunitionItem(droppedItem)) {
            const quiver = this.#resolveAmmoDropTarget(event, target, dropPath);
            if (quiver && quiver.id !== droppedItem.id) {
              await loadAmmunitionIntoContainer(this.actor, droppedItem, quiver);
              (this as any)._lastDroppedItemId = quiver.id;
              await new Promise(resolve => setTimeout(resolve, 0));
              await this.render(true, { focus: false });
              return true;
            }
          }
          // New item created, now set flags
          await this.#updateItemEquipmentFlags(droppedItem, target, event);
          (this as any)._lastDroppedItemId = droppedItem?.id;
          (this as any)._lastDroppedItemName = droppedItem?.name;
          await new Promise(resolve => setTimeout(resolve, 0));
          await this.render(true, { focus: false });
        }
      }
      return true;
    }

    // World/compendium item dropped on sheet - create embedded copy first.
    // Minor Magic Items move (they keep counting on the creator) instead of copying.
    if (!droppedItem.parent || droppedItem.parent.id !== this.actor.id) {
      const sourceWorldItem = droppedItem;
      if (readMinorMagicFlag(droppedItem) && droppedItem.parent) {
        const moved = await transferConsumableToActor(this.actor, droppedItem);
        if (!moved) {
          ui.notifications?.error(`Could not give ${droppedItem.name} to this character.`);
          return false;
        }
        droppedItem = moved;
      } else {
        const itemData = this.#sanitizeItemDataForActorEmbed(droppedItem.toObject());
        try {
          const [created] = await this.actor.createEmbeddedDocuments('Item', [itemData], { render: false });
          if (!created) return false;
          droppedItem = created;
          await this.#tryWireDroppedArtifact(created, sourceWorldItem);
        } catch (error) {
          console.error('Mastery System | [Equipment Drop] Failed to create embedded item', error);
          ui.notifications?.error(`Could not add ${droppedItem.name} to this character.`);
          return false;
        }
      }
    }

    if (isAmmunitionItem(droppedItem)) {
      const quiver = this.#resolveAmmoDropTarget(event, target, dropPath);
      if (quiver && quiver.id !== droppedItem.id) {
        const result = await loadAmmunitionIntoContainer(this.actor, droppedItem, quiver);
        if (result.reason === 'busy') return false;
        (this as any)._lastDroppedItemId = quiver.id;
        await this.render(true, { focus: false });
        return result.ok;
      }
    }

    // Internal item - update flags
    await this.#updateItemEquipmentFlags(droppedItem, target, event);
    (this as any)._lastDroppedItemId = droppedItem?.id;
    (this as any)._lastDroppedItemName = droppedItem?.name;
    await new Promise(resolve => setTimeout(resolve, 0));
    await this.render(true, { focus: false });
    return true;
  }

  async #onDropConsumableSlot(event: DragEvent, data: any, target: HTMLElement): Promise<boolean> {
    const index = Math.floor(Number(target.dataset.slotIndex));
    let droppedItem: any = null;
    if (data.uuid) {
      try {
        droppedItem = await fromUuid(data.uuid);
      } catch {
        droppedItem = null;
      }
    } else if (data.data?._id) {
      droppedItem = this.actor.items.get(data.data._id);
    }
    if (!droppedItem) {
      const dragItemId = (window as any).__msDragItemId as string | undefined;
      if (dragItemId) droppedItem = this.actor.items.get(dragItemId);
    }
    if (!droppedItem) {
      ui.notifications?.warn(
        (globalThis as any).game?.i18n?.localize?.('MASTERY.consumable.missingItem') || 'Item not found.',
      );
      return false;
    }
    if (!isConsumableItem(droppedItem)) {
      ui.notifications?.warn(
        (globalThis as any).game?.i18n?.localize?.('MASTERY.consumable.notConsumable') ||
          'Only consumable items can occupy a Consumable Slot.',
      );
      return false;
    }
    if (!droppedItem.parent || droppedItem.parent.id !== this.actor.id) {
      const moved = await transferConsumableToActor(this.actor, droppedItem);
      if (!moved) {
        ui.notifications?.error(`Could not add ${droppedItem.name} to this character.`);
        return false;
      }
      droppedItem = moved;
    }
    const result = await equipConsumableToSlot(this.actor, droppedItem, index);
    if (!result.ok) {
      ui.notifications?.warn(result.error);
      return false;
    }
    (this as any)._lastDroppedItemId = droppedItem?.id;
    await this.render(true, { focus: false });
    return true;
  }

  /** Item currently occupying an equipment slot (flags + legacy equipped). */
  #getItemInEquipSlot(slotKey: string): any {
    const items = Array.from(this.actor.items.values());
    for (const it of items) {
      const flags = (it as any).getFlag('mastery-system', 'equipment') || {};
      if (flags.slot === slotKey) {
        return it;
      }
    }
    if (slotKey === 'mainhand') {
      const weapons = items.filter((it: any) => it.type === 'weapon' && (it.system as any)?.equipped === true);
      if (weapons.length > 0) return weapons[0];
    } else if (slotKey === 'offhand') {
      const shields = items.filter((it: any) => it.type === 'shield' && (it.system as any)?.equipped === true);
      if (shields.length > 0) return shields[0];
    } else if (slotKey === 'body') {
      const armor = items.filter((it: any) => it.type === 'armor' && (it.system as any)?.equipped === true);
      if (armor.length > 0) return armor[0];
    }
    return null;
  }

  /**
   * Move an embedded item into a paperdoll slot (same rules as drag-drop onto that slot).
   * @returns whether the item was updated successfully
   */
  async #applyEquipToSlot(item: any, slot: string): Promise<boolean> {
    if (!item?.id || item.parent?.id !== this.actor.id) {
      ui.notifications?.warn('Item must be on this actor to equip.');
      return false;
    }

    const allowed = getNormalizedEquipSlots(item);
    if (!allowed) {
      ui.notifications?.warn(
        'This item cannot be equipped. Set system.equipSlots on the item (non-empty list of slot keys).'
      );
      return false;
    }
    if (!allowed.includes(slot)) {
      ui.notifications?.warn(`This item can only be equipped in: ${allowed.join(', ')}`);
      return false;
    }

    if (slot === 'offhand' && item.type === 'weapon' && !requiresAmmunition(item)) {
      const mainhandItem = this.#getItemInEquipSlot('mainhand');
      if (mainhandItem?.id === item.id && canMarkTwoHandedGrip(item)) {
        const flags = item.getFlag('mastery-system', 'equipment') || {};
        await item.update({
          'flags.mastery-system.equipment': { ...flags, slot: 'mainhand', twoHanded: true },
          'system.equipped': true,
        });
        await syncActiveWeaponSetFromHands(this.actor);
        return true;
      }
      // PG "Weapon Properties": Light — "May be wielded in the off-hand."
      const { isLightWeapon } = await import('../utils/weapon-properties.js');
      if (!isLightWeapon(item)) {
        ui.notifications?.warn(
          'Only Light weapons can be wielded in the off hand (or use it for a shield).',
        );
        return false;
      }
      if (mainhandItem && isNaturallyTwoHandedItem(mainhandItem)) {
        ui.notifications?.warn('Cannot equip an off-hand weapon while a 2-handed weapon is equipped.');
        return false;
      }
    }

    if ((slot === 'mainhand' || slot === 'offhand') && (requiresAmmunition(item) || isAmmoContainer(item) || requiresAmmunition(this.#getItemInEquipSlot(slot === 'mainhand' ? 'offhand' : 'mainhand')))) {
      const check = validateHandEquip(this.actor, item, slot);
      if (!check.ok) {
        ui.notifications?.warn(check.message);
        return false;
      }
    }

    if (slot === 'mainhand' && isNaturallyTwoHandedItem(item)) {
      const offhandItem = this.#getItemInEquipSlot('offhand');
      if (offhandItem && offhandItem.id !== item.id) {
        ui.notifications?.warn('Cannot equip 2-handed weapon while offhand is occupied.');
        return false;
      }
    } else if (slot === 'offhand' && item.type === 'shield') {
      const mainhandItem = this.#getItemInEquipSlot('mainhand');
      if (mainhandItem && requiresAmmunition(mainhandItem)) {
        const check = validateHandEquip(this.actor, item, 'offhand');
        if (!check.ok) {
          ui.notifications?.warn(check.message);
          return false;
        }
      } else if (mainhandItem && isNaturallyTwoHandedItem(mainhandItem)) {
        ui.notifications?.warn('Cannot equip shield while 2-handed weapon is equipped.');
        return false;
      }
    }

    // Artefacts.md: equipped Ring + Amulet share a combined max of 4 printed
    // Base Values (count assigned Base Values, including locked ones).
    if ((slot === 'ring' || slot === 'amulet') && item.type === 'artifact') {
      const otherSlot = slot === 'ring' ? 'amulet' : 'ring';
      const other = this.#getItemInEquipSlot(otherSlot);
      const countBv = (it: any): number =>
        Array.isArray(it?.system?.baseValues) ? it.system.baseValues.length : 0;
      const { ringAmuletCombinedBaseValueError } = await import('../utils/artifact-rules.js');
      const ringBv = slot === 'ring' ? countBv(item) : countBv(other);
      const amuletBv = slot === 'amulet' ? countBv(item) : countBv(other);
      const err = ringAmuletCombinedBaseValueError(ringBv, amuletBv);
      if (err && other && other.id !== item.id) {
        ui.notifications?.warn(err);
        return false;
      }
    }

    const previousItem = this.#getItemInEquipSlot(slot);
    if (previousItem && previousItem.id !== item.id) {
      // Echo-bound artifacts permanently occupy their slot and cannot be
      // displaced (e.g. Elven Stride on Feet, Dragon Head on Head).
      if (isEchoLockedItem(previousItem)) {
        ui.notifications?.warn(
          `${previousItem.name} is Echo-bound and permanently occupies the ${slot} slot. Nothing else can be equipped there.`,
        );
        return false;
      }
      const prevFlags = previousItem.getFlag('mastery-system', 'equipment') || {};
      const newPrevFlags = { ...prevFlags, slot: null };
      await previousItem.update({
        'flags.mastery-system.equipment': newPrevFlags,
        'system.equipped': false
      });
    }

    const currentFlags = item.getFlag('mastery-system', 'equipment') || {};
    const newFlags: any = { ...currentFlags, container: 'inventory', slot, band: currentFlags.band || 'not' };
    delete newFlags.grid;
    delete newFlags.keepInventoryGrid;
    if (isNaturallyTwoHandedItem(item)) newFlags.twoHanded = true;
    else delete newFlags.twoHanded;
    await item.update({
      'flags.mastery-system.equipment': newFlags,
      'system.equipped': true
    });
    if (slot === 'mainhand' || slot === 'offhand') {
      await syncActiveWeaponSetFromHands(this.actor);
    }
    return true;
  }

  #onEquipSlotContextMenu = (ev: MouseEvent): void => {
    if (!this.isEditable || !this.actor.isOwner) return;
    const target = ev.target as HTMLElement | null;
    const slotEl = target?.closest?.('.df-equip-slot, .df-consumable-slot') as HTMLElement | null;
    const root = this.element as HTMLElement | null;
    if (!slotEl || !root?.contains(slotEl)) return;
    const filledTile = target?.closest?.('.df-draggable-item') as HTMLElement | null;
    if (filledTile && slotEl.contains(filledTile)) return;
    ev.preventDefault();
    ev.stopPropagation();
    ev.stopImmediatePropagation();
    this.#openEquipSlotFillMenu(ev, slotEl);
  };

  #closeEquipSlotFillMenu(): void {
    document.getElementById(EQUIP_SLOT_FILL_MENU_ID)?.remove();
    this.#equipSlotFillMenuAbort?.abort();
    this.#equipSlotFillMenuAbort = null;
  }

  #openEquipSlotFillMenu(event: MouseEvent, slotEl: HTMLElement): void {
    this.#closeEquipSlotFillMenu();

    const isConsumable = slotEl.classList.contains('df-consumable-slot');
    const slotKey = String(slotEl.dataset.slot || '').trim();
    const slotIndex = Math.floor(Number(slotEl.dataset.slotIndex));
    const slotLabel =
      (slotEl.querySelector('.df-slot-label') as HTMLElement | null)?.textContent?.trim() ||
      (isConsumable ? `Consumable ${slotIndex + 1}` : slotKey);
    const locked = isConsumable && slotEl.classList.contains('is-locked');
    const items = locked
      ? []
      : isConsumable
        ? listCarriedConsumableItems(this.actor.items)
        : listCarriedItemsForPaperdollSlot(this.actor.items, slotKey, {
            allowOffhandWeapon: (item) => requiresAmmunition(item),
          });

    const menu = document.createElement('div');
    menu.id = EQUIP_SLOT_FILL_MENU_ID;
    menu.className = 'df-equip-slot-fill-menu';
    menu.setAttribute('role', 'menu');
    const title = localizeSheet('MASTERY.inventory.slotFillTitle', 'Place into {slot}', { slot: slotLabel });
    const emptyText = locked
      ? localizeSheet('MASTERY.consumable.lockedInCombat', 'Consumable Slots cannot be changed during combat.')
      : localizeSheet('MASTERY.inventory.slotFillEmpty', 'No matching items in inventory');
    const rows = items.map((item) => {
      const id = String(item?.id || '');
      const name = String(item?.name || id);
      const img = String(item?.img || 'icons/svg/item-bag.svg');
      return `<button type="button" class="df-equip-slot-fill-menu__item" role="menuitem" data-item-id="${escapeSheetHtml(id)}">
        <img src="${escapeSheetHtml(img)}" alt="">
        <span>${escapeSheetHtml(name)}</span>
      </button>`;
    });
    menu.innerHTML = `<div class="df-equip-slot-fill-menu__title">${escapeSheetHtml(title)}</div>${
      rows.length ? rows.join('') : `<div class="df-equip-slot-fill-menu__empty">${escapeSheetHtml(emptyText)}</div>`
    }`;

    const pad = 8;
    const left = Math.max(pad, event.clientX);
    const top = Math.max(pad, event.clientY);
    menu.style.left = `${left}px`;
    menu.style.top = `${top}px`;
    document.body.appendChild(menu);

    const rect = menu.getBoundingClientRect();
    const maxLeft = Math.max(pad, window.innerWidth - rect.width - pad);
    const maxTop = Math.max(pad, window.innerHeight - rect.height - pad);
    menu.style.left = `${Math.min(left, maxLeft)}px`;
    menu.style.top = `${Math.min(top, maxTop)}px`;

    menu.addEventListener('click', async (clickEv) => {
      const button = (clickEv.target as HTMLElement | null)?.closest?.('[data-item-id]') as HTMLElement | null;
      if (!button) return;
      clickEv.preventDefault();
      clickEv.stopPropagation();
      const item = this.actor.items.get(button.dataset.itemId || '');
      this.#closeEquipSlotFillMenu();
      if (!item) return;
      if (isConsumable) {
        if (!Number.isFinite(slotIndex)) return;
        const occupant = itemOccupyingConsumableSlot(this.actor, slotIndex);
        if (occupant && occupant.id !== item.id) {
          const cleared = await unequipConsumable(this.actor, occupant);
          if (!cleared.ok) {
            ui.notifications?.warn(cleared.error);
            return;
          }
        }
        const result = await equipConsumableToSlot(this.actor, item, slotIndex);
        if (!result.ok) {
          ui.notifications?.warn(result.error);
          return;
        }
        await this.render(true, { focus: false });
        return;
      }
      if (!slotKey) return;
      if (await this.#applyEquipToSlot(item, slotKey)) {
        await this.render(true, { focus: false });
      }
    });

    const abort = new AbortController();
    this.#equipSlotFillMenuAbort = abort;
    const dismiss = (ev: Event) => {
      if (ev.type === 'keydown' && (ev as KeyboardEvent).key !== 'Escape') return;
      if (ev.type === 'pointerdown' && menu.contains(ev.target as Node)) return;
      this.#closeEquipSlotFillMenu();
    };
    document.addEventListener('pointerdown', dismiss, { capture: true, signal: abort.signal });
    document.addEventListener('keydown', dismiss, { signal: abort.signal });
    window.addEventListener('resize', dismiss, { signal: abort.signal });
    window.addEventListener('blur', dismiss, { signal: abort.signal });
  }

  /**
   * Resolve actor Item from a context-menu target (jQuery or HTMLElement).
   */
  #itemFromInventoryTileContextTarget(target: unknown): any {
    let el: HTMLElement | null = null;
    if (target && typeof (target as any).jquery === 'string') {
      const jq = target as JQuery;
      el = (jq[0] as HTMLElement) || null;
    } else if (target instanceof HTMLElement) {
      el = target;
    }
    if (!el) return null;
    const tile = el.closest('.df-draggable-item') as HTMLElement | null;
    const id = tile?.dataset?.itemId;
    if (!id) return null;
    const item = this.actor.items.get(id);
    return item?.parent?.id === this.actor.id ? item : null;
  }

  /** Right-click equip: slots shown in equipment tab inventory / stash grids. */
  #inventoryEquipContextMenuEntries(): any[] {
    const slots: Array<{ key: string; label: string }> = [
      { key: 'mainhand', label: 'Main Hand' },
      { key: 'offhand', label: 'Off Hand' },
      { key: 'body', label: 'Body' },
      { key: 'head', label: 'Head' },
      { key: 'feet', label: 'Feet' },
      { key: 'amulet', label: 'Amulet' },
      { key: 'ring', label: 'Ring' },
    ];

    const entries: any[] = [
      {
        name: localizeSheet('MASTERY.consumable.use', 'Use'),
        icon: '<i class="fas fa-flask"></i>',
        group: 'minor-magic',
        condition: (target: unknown) => {
          const item = this.#itemFromInventoryTileContextTarget(target);
          return !!item && !!readMinorMagicFlag(item) && readConsumableSlotIndex(item) != null;
        },
        callback: async (target: unknown) => {
          const item = this.#itemFromInventoryTileContextTarget(target);
          if (!item) return;
          const res = await useEquippedConsumable(this.actor, item);
          if (!res.ok) ui.notifications?.warn(res.error);
          else await this.render(false);
        },
      },
      {
        name: localizeSheet('MASTERY.consumable.give', 'Give'),
        icon: '<i class="fas fa-hand-holding"></i>',
        group: 'minor-magic',
        condition: (target: unknown) => {
          const item = this.#itemFromInventoryTileContextTarget(target);
          return !!item && !!readMinorMagicFlag(item);
        },
        callback: async (target: unknown) => {
          const item = this.#itemFromInventoryTileContextTarget(target);
          if (!item) return;
          if (await this.#giveMinorMagicItem(item)) await this.render(false);
        },
      },
      {
        name: localizeSheet('MASTERY.consumable.giveBack', 'Give Back'),
        icon: '<i class="fas fa-undo"></i>',
        group: 'minor-magic',
        condition: (target: unknown) => {
          const item = this.#itemFromInventoryTileContextTarget(target);
          return !!item && canGiveBackMinorMagic(this.actor, item);
        },
        callback: async (target: unknown) => {
          const item = this.#itemFromInventoryTileContextTarget(target);
          if (!item) return;
          if (await this.#returnMinorMagicItem(item)) await this.render(false);
        },
      },
      {
        name: 'Equip (main hand)',
        icon: '<i class="fas fa-hand-fist"></i>',
        group: 'quick',
        condition: (target: unknown) => {
          const item = this.#itemFromInventoryTileContextTarget(target);
          return !!item && !!getNormalizedEquipSlots(item)?.includes('mainhand');
        },
        callback: async (target: unknown) => {
          const item = this.#itemFromInventoryTileContextTarget(target);
          if (!item) return;
          if (await this.#applyEquipToSlot(item, 'mainhand')) {
            await this.render(true, { focus: false });
          }
        }
      },
      {
        name: 'Equip (off hand)',
        icon: '<i class="fas fa-shield-alt"></i>',
        group: 'quick',
        condition: (target: unknown) => {
          const item = this.#itemFromInventoryTileContextTarget(target);
          if (!item || !getNormalizedEquipSlots(item)?.includes('offhand')) return false;
          if (item.type === 'weapon' && !requiresAmmunition(item)) {
            // Light weapons may be wielded in the off-hand (PG Weapon Properties).
            const innates = Array.isArray(item.system?.innateAbilities) ? item.system.innateAbilities : [];
            return innates.some((a: unknown) => /^light\b/i.test(String(a).trim()));
          }
          return true;
        },
        callback: async (target: unknown) => {
          const item = this.#itemFromInventoryTileContextTarget(target);
          if (!item) return;
          if (await this.#applyEquipToSlot(item, 'offhand')) {
            await this.render(true, { focus: false });
          }
        }
      },
      {
        name: 'Equip (body)',
        icon: '<i class="fas fa-tshirt"></i>',
        group: 'quick',
        condition: (target: unknown) => {
          const item = this.#itemFromInventoryTileContextTarget(target);
          return !!item && !!getNormalizedEquipSlots(item)?.includes('body');
        },
        callback: async (target: unknown) => {
          const item = this.#itemFromInventoryTileContextTarget(target);
          if (!item) return;
          if (await this.#applyEquipToSlot(item, 'body')) {
            await this.render(true, { focus: false });
          }
        }
      },
      {
        // PG "Item Rotation": rotate 90° — width × height becomes height × width.
        // Allowed only if the rotated item still fits entirely into empty squares.
        name: 'Rotate 90°',
        icon: '<i class="fas fa-rotate-right"></i>',
        group: 'quick',
        condition: (target: unknown) => {
          const item = this.#itemFromInventoryTileContextTarget(target);
          if (!item) return false;
          const size = parseInventorySize(item.system?.inventorySize);
          return size.w !== size.h;
        },
        callback: async (target: unknown) => {
          const item = this.#itemFromInventoryTileContextTarget(target);
          if (!item) return;
          await this.#rotateInventoryItem(item);
        }
      }
    ];

    for (const { key, label } of slots) {
      entries.push({
        name: `Equip: ${label}`,
        icon: '<i class="fas fa-arrow-right"></i>',
        group: 'slot',
        condition: (target: unknown) => {
          const item = this.#itemFromInventoryTileContextTarget(target);
          if (!item || !getNormalizedEquipSlots(item)?.includes(key)) return false;
          // Light weapons may be wielded in the off-hand (PG Weapon Properties).
          if (key === 'offhand' && item.type === 'weapon' && !requiresAmmunition(item)) {
            const innates = Array.isArray(item.system?.innateAbilities) ? item.system.innateAbilities : [];
            if (!innates.some((a: unknown) => /^light\b/i.test(String(a).trim()))) return false;
          }
          return true;
        },
        callback: async (target: unknown) => {
          const item = this.#itemFromInventoryTileContextTarget(target);
          if (!item) return;
          if (await this.#applyEquipToSlot(item, key)) {
            await this.render(true, { focus: false });
          }
        }
      });
    }

    entries.push({
      name: 'Cannot equip (no equip slots on item)',
      icon: '<i class="fas fa-info-circle"></i>',
      group: 'info',
      condition: (target: unknown) => {
        const item = this.#itemFromInventoryTileContextTarget(target);
        return !!item && !getNormalizedEquipSlots(item);
      },
      callback: () => {
        ui.notifications?.info(
          'Set system.equipSlots on this item to a non-empty array of slot keys (e.g. ["mainhand"], ["body"], ["ring"]).'
        );
      }
    });

    return entries;
  }

  /** Strip legacy auto-seeded Unarmed weapon items (virtual unarmed replaces them). */
  async #purgeLegacyUnarmedItems(): Promise<void> {
    const legacyIds = Array.from(this.actor.items.values())
      .filter((item: any) => isLegacyUnarmedItem(item))
      .map((item: any) => item.id)
      .filter(Boolean);
    if (legacyIds.length === 0) return;
    try {
      await this.actor.deleteEmbeddedDocuments('Item', legacyIds, { masterySystemForceDelete: true } as any);
      await this.render(false);
    } catch (error) {
      console.warn(`Mastery System | Could not remove legacy Unarmed from ${this.actor.name}:`, error);
    }
  }

  /** Clone item data for embedding on this actor without stale cross-document ids. */
  #sanitizeItemDataForActorEmbed(itemData: Record<string, unknown>): Record<string, unknown> {
    const data = foundry.utils.deepClone(itemData) as Record<string, unknown>;
    delete data._id;
    delete data.folder;
    delete data.ownership;
    delete data.sort;
    return data;
  }

  /** Resolve the inventory grid cell under a drop event (if any). */
  #resolveDropCell(event?: DragEvent): HTMLElement | null {
    if (!event) return null;
    const fromEvent = (event as any).__msDropCell as HTMLElement | undefined;
    if (fromEvent?.classList?.contains('df-cell')) return fromEvent;
    const fromTarget = (event.target as HTMLElement | null)?.closest?.('.df-cell') as HTMLElement | null;
    if (fromTarget) return fromTarget;
    const path = (event.composedPath?.() || []) as HTMLElement[];
    return path.find(el => el?.classList?.contains?.('df-cell')) || null;
  }

  /** Collect occupied inventory rects for a band (excluding one item id). */
  #inventoryBandRects(band: string, excludeItemId?: string): Array<{ x: number; y: number; w: number; h: number }> {
    return collectInventoryBandRects(this.actor.items.values(), band, {
      excludeItemId,
      cols: ZONE_WIDTH_COLS,
      rows: 9,
    });
  }

  /**
   * PG "Item Rotation": rotate an item 90° (width × height → height × width).
   * Allowed only if the rotated footprint still fits entirely into empty squares.
   */
  async #rotateInventoryItem(item: any): Promise<void> {
    const flags = item.getFlag('mastery-system', 'equipment') || {};
    const wasRotated = flags.rotated === true;
    const current = itemInventorySize(item);
    const rotatedSize = { w: current.h, h: current.w };

    // If the item sits in the carry grid, the rotated rect must fit in place.
    if (occupiesInventoryGrid(flags)) {
      const band = String(flags.band ?? 'not');
      const x = Number(flags.grid?.x || 0);
      const y = Number(flags.grid?.y || 0);
      const rect = { x, y, w: rotatedSize.w, h: rotatedSize.h };
      const rects = this.#inventoryBandRects(band, item.id);
      const fits =
        fitsInGrid(rect.x, rect.y, rect.w, rect.h, ZONE_WIDTH_COLS, 9) &&
        !rects.some((r) => rectsOverlap(r, rect));
      if (!fits) {
        ui.notifications?.warn(
          'Rotation blocked — the rotated item does not fit entirely into empty squares.',
        );
        return;
      }
    }

    await item.update({
      'flags.mastery-system.equipment': { ...flags, rotated: !wasRotated },
    });
    await this.render(true, { focus: false });
  }

  #resolveDraggedActorOrWorldItem(): any | null {
    const id = (window as any).__msDragItemId as string | undefined;
    if (!id) return null;
    return this.actor.items.get(id) || (globalThis as any).game?.items?.get?.(id) || null;
  }

  #resolveAmmoDropTarget(event: DragEvent | undefined, target: HTMLElement | null, dropPath: HTMLElement[]): any | null {
    const dropCell = this.#resolveDropCell(event);
    const dropBand = dropCell?.closest?.('.df-enc-band') as HTMLElement | undefined;
    const cellItem = dropCell && dropBand
      ? this.#itemAtInventoryCell(
          String(dropBand.dataset?.band || ''),
          Number(dropCell.dataset?.col || 0),
          Number(dropCell.dataset?.row || 0),
        )
      : null;
    if (isAmmoContainer(cellItem)) return cellItem;
    const slotItem = target?.dataset?.dfDrop === 'equip-slot'
      ? this.#getItemInEquipSlot(String(target.dataset.slot || ''))
      : null;
    if (isAmmoContainer(slotItem)) return slotItem;
    return findAmmoContainerFromDropPath(this.actor, dropPath);
  }

  #itemAtInventoryCell(band: string, col: number, row: number): any | null {
    for (const item of this.actor.items.values()) {
      const flags = (item as any).getFlag?.('mastery-system', 'equipment') || {};
      if (!occupiesInventoryGrid(flags, band)) continue;
      const size = itemInventorySize(item);
      const rect = {
        x: Number(flags.grid?.x || 0),
        y: Number(flags.grid?.y || 0),
        w: size.w,
        h: size.h,
      };
      if (rectsOverlap(rect, { x: col, y: row, w: 1, h: 1 })) return item;
    }
    return null;
  }

  /**
   * Helper: Update item equipment flags based on drop target
   */
  async #updateItemEquipmentFlags(item: any, target: HTMLElement, event?: DragEvent): Promise<void> {
    const dropType = target.dataset.dfDrop;
    if (!dropType) return;

    // Echo-bound artifacts are locked into their slot — they cannot be moved to
    // the stash or an inventory band (i.e. unequipped).
    if (isEchoLockedItem(item) && (dropType === 'stash' || dropType === 'band')) {
      ui.notifications?.warn(`${item.name} is Echo-bound and cannot be unequipped.`);
      return;
    }

    const currentFlags = item.getFlag('mastery-system', 'equipment') || {};
    const newFlags: any = { ...currentFlags };
    if (readConsumableSlotIndex(item) != null && (dropType === 'stash' || dropType === 'band' || dropType === 'equip-slot')) {
      const locked = validateUnequipConsumable({ actor: this.actor, item });
      if (locked) {
        ui.notifications?.warn(
          (globalThis as any).game?.i18n?.localize?.('MASTERY.consumable.lockedInCombat') ||
            'Consumable Slots cannot be changed during combat.',
        );
        return;
      }
      delete newFlags.consumableSlot;
    }
    if (dropType === 'stash') {
      newFlags.container = 'stash';
      newFlags.band = null;
      newFlags.slot = null;
      delete newFlags.twoHanded;
      delete newFlags.weaponSetPrepared;
      delete newFlags.keepInventoryGrid;
      await item.update({
        'flags.mastery-system.equipment': newFlags,
        'system.equipped': false
      });
      await syncActiveWeaponSetFromHands(this.actor);
    } else if (dropType === 'band') {
      const band = target.dataset.band;
      if (band === 'not' || band === 'enc' || band === 'heavy') {
        newFlags.container = 'inventory';
        newFlags.band = band;
        newFlags.slot = null;
        delete newFlags.twoHanded;
        delete newFlags.weaponSetPrepared;
        delete newFlags.keepInventoryGrid;
        const BAND_COLS = ZONE_WIDTH_COLS;
        const BAND_ROWS = 9;
        const size = itemInventorySize(item);
        const w = Math.min(BAND_COLS, size.w);
        const h = Math.min(BAND_ROWS, size.h);
        const cell = this.#resolveDropCell(event);
        let gridPos: { x: number; y: number } | null = null;

        if (cell) {
          const col = Number(cell.dataset?.col || 0);
          const row = Number(cell.dataset?.row || 0);
          if (col > 0 && row > 0) {
            const candidate = { x: col, y: row, w, h };
            const rects = this.#inventoryBandRects(band, item.id);
            const fits = fitsInGrid(candidate.x, candidate.y, candidate.w, candidate.h, BAND_COLS, BAND_ROWS)
              && !rects.some(rect => rectsOverlap(rect, candidate));
            if (fits) {
              gridPos = { x: col, y: row };
            }
          }
        }

        if (!gridPos) {
          const gameI18n = (globalThis as any).game?.i18n;
          ui.notifications?.warn(
            gameI18n?.localize?.('MASTERY.inventory.dropBlocked') ||
              'That cell is blocked or the item does not fit there.',
          );
          return;
        }

        newFlags.grid = gridPos;
        await item.update({
          'flags.mastery-system.equipment': newFlags,
          'system.equipped': false
        });
        await syncActiveWeaponSetFromHands(this.actor);
      }
    } else if (dropType === 'consumable-slot') {
      const index = Math.floor(Number(target.dataset.slotIndex));
      const result = await equipConsumableToSlot(this.actor, item, index);
      if (!result.ok) ui.notifications?.warn(result.error);
    } else if (dropType === 'equip-slot') {
      const slot = target.dataset.slot;
      if (!slot) return;
      await this.#applyEquipToSlot(item, slot);
    } else if (dropType === 'equip-trash') {
      if (isEchoLockedItem(item)) {
        ui.notifications?.warn(`${item.name} is Echo-bound and cannot be deleted.`);
        return;
      }
      if (isLegacyUnarmedItem(item)) {
        await this.actor.deleteEmbeddedDocuments('Item', [item.id], { masterySystemForceDelete: true } as any);
        ui.notifications?.info('Removed legacy Unarmed item (melee uses virtual unarmed).');
        return;
      }
      const confirmed = await Dialog.confirm({
        title: 'Delete Item',
        content: `<p>Delete <strong>${item.name}</strong> permanently?</p>`,
        yes: () => true,
        no: () => false,
        defaultYes: false,
      });
      if (confirmed) {
        await item.delete();
        ui.notifications?.info(`Deleted ${item.name}.`);
      }
    }
  }
}




