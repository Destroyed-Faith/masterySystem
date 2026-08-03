/**
 * Passive Selection Dialog for Combat Start
 *
 * Shows an overlay at combat start where players select and activate their passive abilities.
 * Supports multiple characters per player with step-by-step navigation.
 *
 * Migrated to Foundry VTT v13 ApplicationV2 + HandlebarsApplicationMixin
 */
import { getPassiveSlots, getAvailablePassives, getSlottedPassiveIds, getPassiveSlotCountForMasteryRank, MAX_PASSIVE_SLOTS, slotPassive, unslotPassive } from '../powers/passives.js';
import { log } from '../utils/logger.js';
const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;
// Type workaround for Mixin
const BaseDialog = HandlebarsApplicationMixin(ApplicationV2);
export class PassiveSelectionDialog extends BaseDialog {
    currentIndex = 0;
    pcs;
    resolve;
    readOnly = false;
    _outcomeResolved = false;
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
    static async showForCombatant(combatant, readOnly = false) {
        log.debug('Mastery System | [PASSIVE DIALOG] showForCombatant', {
            combatantId: combatant.id,
            actorName: combatant.actor?.name,
            readOnly
        });
        const user = game.user;
        if (!user || (!user.isGM && !combatant.actor?.isOwner)) {
            return { confirmed: false };
        }
        const existing = foundry.applications.instances.get("mastery-passive-selection");
        if (existing) {
            existing.bringToFront();
            return { confirmed: false };
        }
        return new Promise((resolve) => {
            const app = new PassiveSelectionDialog([combatant], resolve, readOnly);
            app.render(true);
        });
    }
    /**
     * Show passive selection dialog for all player-controlled combatants
     */
    static async showForCombat(combat) {
        log.debug('Mastery System | [PASSIVE DIALOG] showForCombat', {
            combatId: combat.id,
            combatants: combat.combatants.size
        });
        const user = game.user;
        if (!user)
            return { confirmed: false };
        const existing = foundry.applications.instances.get("mastery-passive-selection");
        if (existing) {
            existing.bringToFront();
            return { confirmed: false };
        }
        const pcs = combat.combatants.filter((c) => c.actor?.type === 'character' && (user.isGM || c.actor?.isOwner));
        if (pcs.length === 0) {
            log.debug('Mastery System | [PASSIVE DIALOG] No player characters for passive selection');
            return { confirmed: false };
        }
        return new Promise((resolve) => {
            const app = new PassiveSelectionDialog(pcs, resolve, false);
            app.render(true);
        });
    }
    constructor(pcs, resolve, readOnly = false) {
        super({});
        this.pcs = pcs;
        this.resolve = resolve;
        this.readOnly = readOnly;
    }
    get currentCombatant() {
        return this.pcs[this.currentIndex] ?? null;
    }
    get currentActor() {
        return this.currentCombatant?.actor ?? null;
    }
    async _prepareContext(_options) {
        const actor = this.currentActor;
        if (!actor)
            return {};
        const slots = getPassiveSlots(actor);
        const available = getAvailablePassives(actor);
        const masteryRank = actor.system.mastery?.rank ?? 2;
        const maxPassiveSlots = getPassiveSlotCountForMasteryRank(masteryRank);
        const slottedIds = getSlottedPassiveIds(actor);
        const selectablePassives = available.filter((p) => !slottedIds.has(String(p.id)));
        return {
            actor,
            slots,
            availablePassives: selectablePassives,
            masteryRank,
            maxPassiveSlots,
            maxPassiveSlotsTotal: MAX_PASSIVE_SLOTS,
            currentIndex: this.currentIndex + 1,
            total: this.pcs.length,
            isFirst: this.currentIndex === 0,
            isLast: this.currentIndex === this.pcs.length - 1,
            isGM: game.user?.isGM ?? false,
            readOnly: this.readOnly
        };
    }
    async _onRender(_context, _options) {
        const root = this.element;
        // If read-only, disable all interactive elements
        if (this.readOnly) {
            root.classList.add('read-only');
            root.querySelectorAll('.draggable-passive').forEach(el => {
                el.draggable = false;
                el.style.opacity = '0.6';
                el.style.cursor = 'not-allowed';
            });
            root.querySelectorAll('.droppable-slot').forEach(slot => {
                slot.style.pointerEvents = 'none';
                slot.style.opacity = '0.6';
            });
            root.querySelectorAll('.js-unslot-passive').forEach(btn => {
                btn.style.display = 'none';
            });
            root.querySelectorAll('.available-passives-section').forEach(section => {
                section.style.display = 'none';
            });
        }
        else {
            // Drag & Drop handlers
            root.querySelectorAll('.draggable-passive').forEach(el => {
                el.draggable = true;
                el.ondragstart = (ev) => {
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
            root.querySelectorAll('.droppable-slot').forEach(slot => {
                slot.ondragover = (ev) => {
                    ev.preventDefault();
                    if (ev.dataTransfer)
                        ev.dataTransfer.dropEffect = 'move';
                    slot.classList.add('drag-over');
                };
                slot.ondragleave = () => {
                    slot.classList.remove('drag-over');
                };
                slot.ondrop = async (ev) => {
                    ev.preventDefault();
                    const actor = this.currentActor;
                    if (!actor)
                        return;
                    const slotIndex = Number(slot.dataset.slotIndex ?? 0);
                    const passiveId = ev.dataTransfer?.getData('text/plain') || '';
                    if (!passiveId || !slot.classList.contains('empty'))
                        return;
                    await slotPassive(actor, slotIndex, passiveId);
                    await this.render({ force: true });
                };
            });
            // Unslot passive
            root.querySelectorAll('.js-unslot-passive').forEach(btn => {
                btn.onclick = async (ev) => {
                    ev.preventDefault();
                    const actor = this.currentActor;
                    if (!actor)
                        return;
                    const slotIndex = Number(btn.dataset.slotIndex ?? 0);
                    await unslotPassive(actor, slotIndex);
                    await this.render({ force: true });
                };
            });
        }
        // Navigation: Next
        const nextBtn = root.querySelector('.js-next-character');
        if (nextBtn) {
            nextBtn.onclick = async (ev) => {
                ev.preventDefault();
                if (this.currentIndex < this.pcs.length - 1) {
                    this.currentIndex++;
                    await this.render({ force: true });
                }
                else {
                    await this._closeExplicit();
                }
            };
        }
        // Navigation: Previous
        const prevBtn = root.querySelector('.js-prev-character');
        if (prevBtn) {
            prevBtn.onclick = async (ev) => {
                ev.preventDefault();
                if (this.currentIndex > 0) {
                    this.currentIndex--;
                    await this.render({ force: true });
                }
            };
        }
        // GM skip all
        const skipBtn = root.querySelector('.js-gm-skip');
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
    finishOutcome(confirmed) {
        if (this._outcomeResolved)
            return;
        this._outcomeResolved = true;
        if (this.resolve) {
            this.resolve({ confirmed });
            this.resolve = undefined;
        }
    }
    async _closeExplicit() {
        this.finishOutcome(true);
        await super.close({ closeSource: 'button', committed: true });
    }
    async close(options) {
        const committed = options?.committed === true;
        if (!this._outcomeResolved) {
            this.finishOutcome(committed);
        }
        return super.close(options);
    }
}
//# sourceMappingURL=passive-selection-dialog.js.map