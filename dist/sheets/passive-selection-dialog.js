/**
 * Passive Selection Dialog for Combat Start
 *
 * Shows an overlay at combat start where players select and activate their passive abilities.
 * Supports multiple characters per player with step-by-step navigation.
 *
 * Migrated to Foundry VTT v13 ApplicationV2 + HandlebarsApplicationMixin
 */
import { getPassiveSlots, getAvailablePassives, getSlottedPassiveIds, slotPassive, unslotPassive, canEditEncounterPassives, consumePendingPassiveSwap, getPendingPassiveSwaps, } from '../powers/passives.js';
import { shouldShowEncounterDialogLocally } from '../combat/combat-permissions.js';
import { getActionEconomyActor } from '../combat/action-economy.js';
const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;
// Type workaround for Mixin
const BaseDialog = HandlebarsApplicationMixin(ApplicationV2);
export class PassiveSelectionDialog extends BaseDialog {
    currentIndex = 0;
    pcs;
    resolve;
    readOnly = false;
    _outcomeResolved = false;
    /** Slots emptied with a paid mid-combat swap; refilling them does not cost another token. */
    freedSlots = new Set();
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
    static async showForCombatant(combatant, readOnly = false) {
        const user = game.user;
        if (!user || (!user.isGM && !combatant.actor?.isOwner)) {
            return { confirmed: false };
        }
        const existing = foundry.applications.instances.get("mastery-passive-selection");
        if (existing) {
            existing.bringToFront();
            return { confirmed: false, alreadyOpen: true };
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
        const user = game.user;
        if (!user)
            return { confirmed: false };
        const existing = foundry.applications.instances.get("mastery-passive-selection");
        if (existing) {
            existing.bringToFront();
            return { confirmed: false, alreadyOpen: true };
        }
        const pcs = combat.combatants.filter((c) => {
            if (c.actor?.type !== 'character')
                return false;
            if (user.isGM)
                return true;
            return shouldShowEncounterDialogLocally(c.actor);
        });
        if (pcs.length === 0) {
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
        const raw = this.currentCombatant?.actor ?? null;
        if (!raw)
            return null;
        return getActionEconomyActor(raw) ?? raw;
    }
    /**
     * Who this is for belongs in the window bar, not in a header block above the
     * slots — that block cost the vertical room the slot grid needs.
     */
    get title() {
        const name = String(this.currentActor?.name ?? '').trim();
        const step = this.pcs.length > 1 ? ` (${this.currentIndex + 1}/${this.pcs.length})` : '';
        return name ? `Combat: Select Passives for ${name}${step}` : 'Combat: Select Passives';
    }
    async _prepareContext(_options) {
        const actor = this.currentActor;
        if (!actor)
            return {};
        const slots = getPassiveSlots(actor);
        const available = getAvailablePassives(actor);
        const slottedIds = getSlottedPassiveIds(actor);
        const selectablePassives = available.filter((p) => !slottedIds.has(String(p.id)));
        const canEdit = this.#canMutate();
        return {
            actor,
            slots,
            availablePassives: selectablePassives,
            isFirst: this.currentIndex === 0,
            isLast: this.currentIndex === this.pcs.length - 1,
            isGM: game.user?.isGM ?? false,
            readOnly: !canEdit,
            canEdit,
        };
    }
    #combatRound() {
        return Math.max(1, Math.floor(Number(game?.combat?.round) || 1));
    }
    #canMutate() {
        if (canEditEncounterPassives(game?.combat, this.currentActor))
            return true;
        return this.freedSlots.size > 0;
    }
    async _onRender(_context, _options) {
        const root = this.element;
        // Stepping to the next character re-renders the content only, so the frame
        // keeps the old name unless it is written here.
        const titleEl = root.querySelector?.('.window-title');
        if (titleEl)
            titleEl.textContent = this.title;
        // After round 1 the loadout is locked unless Exchange Passive was paid.
        if (!this.#canMutate()) {
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
                    if (!this.#canMutate())
                        return;
                    if (this.#combatRound() > 1) {
                        if (this.freedSlots.has(slotIndex)) {
                            this.freedSlots.delete(slotIndex);
                        }
                        else {
                            if (getPendingPassiveSwaps(actor) <= 0)
                                return;
                            await consumePendingPassiveSwap(actor);
                        }
                    }
                    await slotPassive(actor, slotIndex, passiveId);
                    await this.render({ force: true });
                };
            });
            // Capture-phase so the X wins over ApplicationV2 form submit / slot drag.
            if (!root._msUnslotBound) {
                root._msUnslotBound = true;
                root.addEventListener('click', (ev) => {
                    const btn = ev.target?.closest?.('.js-unslot-passive');
                    if (!btn || !root.contains(btn))
                        return;
                    ev.preventDefault();
                    ev.stopPropagation();
                    void this.#unslotClicked(btn);
                }, true);
            }
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
    async #unslotClicked(btn) {
        if (!this.#canMutate())
            return;
        const actor = this.currentActor;
        if (!actor)
            return;
        const slotIndex = Number(btn.dataset.slotIndex ?? 0);
        if (this.#combatRound() > 1 && !this.freedSlots.has(slotIndex)) {
            if (getPendingPassiveSwaps(actor) <= 0)
                return;
            await consumePendingPassiveSwap(actor);
            this.freedSlots.add(slotIndex);
        }
        try {
            await unslotPassive(actor, slotIndex);
        }
        catch (err) {
            const actorId = String(actor.id ?? '');
            const world = actorId ? game.actors?.get(actorId) : undefined;
            if (world && world !== actor) {
                try {
                    await unslotPassive(world, slotIndex);
                }
                catch (err2) {
                    console.error('Mastery System | Could not clear passive slot', err2);
                    ui.notifications?.error('Passive konnte nicht aus dem Slot entfernt werden.');
                    return;
                }
            }
            else {
                console.error('Mastery System | Could not clear passive slot', err);
                ui.notifications?.error('Passive konnte nicht aus dem Slot entfernt werden.');
                return;
            }
        }
        await this.render({ force: true });
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
        try {
            const { handlePassiveSelectionComplete } = await import('../combat/encounter-start.js');
            const combat = typeof game !== 'undefined' ? game.combat : null;
            if (combat) {
                for (const pc of this.pcs) {
                    const actorId = String(pc.actor?.id ?? '');
                    if (actorId)
                        await handlePassiveSelectionComplete(combat, actorId, {});
                }
            }
        }
        catch (err) {
            console.error('Mastery System | Could not persist passive confirmation', err);
        }
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