/**
 * Initiative Shop Dialog — schlank: Mastery Roll + CR-Dropdown + Shop-Zeilen, kein CR-Popup.
 */
import { INITIATIVE_SHOP } from '../utils/constants.js';
import { getCombatReflexesInitiativeLimits } from './initiative-roll.js';
import { resetRoundState } from './action-economy.js';
import { log } from '../utils/logger.js';
const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;
const BaseDialog = HandlebarsApplicationMixin(ApplicationV2);
const CR_SKILL_KEY = 'combatReflexes';
export class InitiativeShopDialog extends BaseDialog {
    combatant;
    combat;
    context;
    resolve;
    purchases;
    /** CR-Punkte, die der Spieler im Dropdown wählt (Shop-Pool = Wurf + das). */
    crSpent;
    /** Bereits vor diesem Dialog auf skillsSpent gebucht (Legacy / seltener Pfad). */
    crCommittedAtOpen;
    static DEFAULT_OPTIONS = {
        id: 'mastery-initiative-shop',
        classes: ['mastery-system', 'initiative-shop'],
        position: { width: 580 },
        window: { title: 'Initiative Shop', resizable: true }
    };
    static PARTS = {
        content: { template: 'systems/mastery-system/templates/dialogs/initiative-shop.hbs' }
    };
    static async showForCombatant(combatant, context, combat) {
        const existing = foundry.applications.instances.get('mastery-initiative-shop');
        if (existing) {
            existing.bringToFront();
            return null;
        }
        return new Promise((resolve) => {
            const app = new InitiativeShopDialog(combatant, context, combat, resolve);
            app.render(true);
        });
    }
    constructor(combatant, context, combat, resolve) {
        super({});
        this.combatant = combatant;
        this.combat = combat;
        this.context = context;
        this.resolve = resolve;
        this.purchases = {
            extraMovement: 0,
            initiativeSwap: false,
            extraReaction: false,
            removeStress: false,
            extraAttack: false
        };
        this.crCommittedAtOpen = Number(context.combatReflexesSpent) || 0;
        this.crSpent = this.crCommittedAtOpen;
    }
    getShopPool() {
        return (this.context.diceTotal +
            this.crSpent +
            (this.context.equipmentInitiativeModifier ?? 0));
    }
    async _prepareContext(_options) {
        const actor = this.combatant.actor;
        if (!actor)
            return {};
        const { maxThisRoll, remainingPool, capPerRoll } = getCombatReflexesInitiativeLimits(actor, this.context.masteryRank);
        if (this.crSpent > maxThisRoll)
            this.crSpent = maxThisRoll;
        if (this.crSpent < 0)
            this.crSpent = 0;
        const crOptions = Array.from({ length: Math.max(0, maxThisRoll) + 1 }, (_, i) => ({
            value: i,
            selected: i === this.crSpent
        }));
        const totalCost = this.calculateTotalCost();
        const totalInitiative = this.getShopPool();
        const remainingInitiative = Math.max(0, totalInitiative - totalCost);
        return {
            actor,
            combatant: this.combatant,
            round: this.combat.round || 1,
            diceTotal: this.context.diceTotal,
            crSpent: this.crSpent,
            equipmentInitiativeModifier: this.context.equipmentInitiativeModifier ?? 0,
            masteryRank: this.context.masteryRank,
            totalInitiative,
            remainingInitiative,
            purchases: this.purchases,
            costs: {
                movement: INITIATIVE_SHOP.MOVEMENT.COST,
                movementIncrement: INITIATIVE_SHOP.MOVEMENT.INCREMENT,
                swap: INITIATIVE_SHOP.SWAP.COST,
                extraReaction: INITIATIVE_SHOP.EXTRA_REACTION.COST,
                removeStress: INITIATIVE_SHOP.REMOVE_STRESS.COST,
                extraAttack: INITIATIVE_SHOP.EXTRA_ATTACK.COST
            },
            movementSpent: this.purchases.extraMovement * INITIATIVE_SHOP.MOVEMENT.COST,
            movementBonus: this.purchases.extraMovement * INITIATIVE_SHOP.MOVEMENT.INCREMENT,
            crOptions,
            crSelectDisabled: maxThisRoll <= 0,
            crMax: maxThisRoll,
            crPoolRemaining: remainingPool,
            crCapPerRoll: capPerRoll
        };
    }
    async _onRender(_context, _options) {
        const root = this.element;
        const crSel = root.querySelector('.js-cr-select');
        if (crSel) {
            crSel.onchange = async () => {
                const v = Math.max(0, Math.floor(Number(crSel.value) || 0));
                const actor = this.combatant.actor;
                const max = actor != null
                    ? getCombatReflexesInitiativeLimits(actor, this.context.masteryRank).maxThisRoll
                    : 0;
                this.crSpent = Math.min(v, max);
                await this.render({ force: true });
            };
        }
        root.querySelectorAll('.js-buy-movement').forEach((btn) => {
            btn.onclick = async (ev) => {
                ev.preventDefault();
                const totalCost = this.calculateTotalCost();
                const cost = INITIATIVE_SHOP.MOVEMENT.COST;
                if (totalCost + cost <= this.getShopPool()) {
                    this.purchases.extraMovement++;
                    await this.render({ force: true });
                }
                else {
                    ui.notifications.warn('Nicht genug Initiative-Punkte!');
                }
            };
        });
        root.querySelectorAll('.js-remove-movement').forEach((btn) => {
            btn.onclick = async (ev) => {
                ev.preventDefault();
                if (this.purchases.extraMovement > 0) {
                    this.purchases.extraMovement--;
                    await this.render({ force: true });
                }
            };
        });
        const bindToggle = (sel, key, cost) => {
            root.querySelectorAll(sel).forEach((btn) => {
                btn.onclick = async (ev) => {
                    ev.preventDefault();
                    if (this.purchases[key]) {
                        this.purchases[key] = false;
                    }
                    else {
                        const totalCost = this.calculateTotalCost();
                        if (totalCost + cost <= this.getShopPool()) {
                            this.purchases[key] = true;
                        }
                        else {
                            ui.notifications.warn('Nicht genug Initiative-Punkte!');
                        }
                    }
                    await this.render({ force: true });
                };
            });
        };
        bindToggle('.js-buy-swap', 'initiativeSwap', INITIATIVE_SHOP.SWAP.COST);
        bindToggle('.js-buy-reaction', 'extraReaction', INITIATIVE_SHOP.EXTRA_REACTION.COST);
        bindToggle('.js-buy-stress', 'removeStress', INITIATIVE_SHOP.REMOVE_STRESS.COST);
        bindToggle('.js-buy-attack', 'extraAttack', INITIATIVE_SHOP.EXTRA_ATTACK.COST);
        root.querySelectorAll('.js-confirm').forEach((confirmBtn) => {
            confirmBtn.setAttribute('type', 'button');
            confirmBtn.onclick = async (ev) => {
                ev.preventDefault();
                await this.confirmPurchases();
            };
        });
    }
    calculateTotalCost() {
        let cost = 0;
        cost += this.purchases.extraMovement * INITIATIVE_SHOP.MOVEMENT.COST;
        if (this.purchases.initiativeSwap)
            cost += INITIATIVE_SHOP.SWAP.COST;
        if (this.purchases.extraReaction)
            cost += INITIATIVE_SHOP.EXTRA_REACTION.COST;
        if (this.purchases.removeStress)
            cost += INITIATIVE_SHOP.REMOVE_STRESS.COST;
        if (this.purchases.extraAttack)
            cost += INITIATIVE_SHOP.EXTRA_ATTACK.COST;
        return cost;
    }
    async confirmPurchases() {
        const totalPool = this.getShopPool();
        const totalCost = this.calculateTotalCost();
        const remainingInitiative = Math.max(0, totalPool - totalCost);
        await this.combatant.update({ initiative: remainingInitiative });
        await this.combatant.setFlag('mastery-system', 'msInitiativeValue', remainingInitiative);
        const shopData = {
            round: this.combat.round || 1,
            ...this.purchases
        };
        await this.combatant.setFlag('mastery-system', 'initiativeShop', shopData);
        const actor = this.combatant.actor;
        if (actor) {
            const delta = this.crSpent - this.crCommittedAtOpen;
            if (delta !== 0) {
                const prevSpent = Number(actor.system?.skillsSpent?.[CR_SKILL_KEY] ?? 0);
                await actor.update({
                    [`system.skillsSpent.${CR_SKILL_KEY}`]: prevSpent + delta
                });
            }
            await resetRoundState(actor, this.combatant, this.combat);
            log.debug('Mastery System | [INITIATIVE SHOP] RoundState updated after purchases', {
                actorName: actor.name,
                purchases: this.purchases,
                crSpent: this.crSpent,
                round: this.combat.round
            });
        }
        if (actor) {
            const parts = [];
            if (this.crSpent > 0) {
                parts.push(`Combat Reflexes +${this.crSpent}`);
            }
            if (this.purchases.extraMovement > 0) {
                parts.push(`+${this.purchases.extraMovement * INITIATIVE_SHOP.MOVEMENT.INCREMENT}m Bewegung`);
            }
            if (this.purchases.initiativeSwap) {
                parts.push('Initiative-Tausch (mit Zustimmung)');
            }
            if (this.purchases.extraReaction) {
                parts.push('Extra Reaktion');
            }
            if (this.purchases.removeStress) {
                parts.push('Stress −1W8');
            }
            if (this.purchases.extraAttack) {
                parts.push('Extra Angriff');
            }
            const messageContent = parts.length > 0
                ? `<div class="mastery-system-info">
            <h3><i class="fas fa-shop"></i> Initiative Shop</h3>
            <div class="info-details">
              <div class="info-row"><span class="info-label">Figur:</span><span class="info-value">${actor.name}</span></div>
              <div class="info-row"><span class="info-label">Ausgegeben:</span><span class="info-value">${totalCost}</span></div>
              <div class="info-row"><span class="info-label">Einkäufe:</span><span class="info-value">${parts.join(', ')}</span></div>
              <div class="info-row"><span class="info-label">Initiative (Rest):</span><span class="info-value">${remainingInitiative}</span></div>
            </div>
          </div>`
                : `<div class="mastery-system-info">
            <h3><i class="fas fa-shop"></i> Initiative Shop</h3>
            <div class="info-details">
              <div class="info-row"><span class="info-label">Figur:</span><span class="info-value">${actor.name}</span></div>
              <div class="info-row"><span class="info-label">Keine Einkäufe</span><span class="info-value"></span></div>
              <div class="info-row"><span class="info-label">Initiative (Rest):</span><span class="info-value">${remainingInitiative}</span></div>
            </div>
          </div>`;
            await ChatMessage.create({
                content: messageContent,
                speaker: ChatMessage.getSpeaker({ actor: actor }),
                style: CONST.CHAT_MESSAGE_STYLES.OTHER
            });
        }
        if (!game.user?.isGM) {
            game.socket?.emit('system.mastery-system', {
                type: 'initiativeConfirmed',
                combatId: this.combat.id,
                combatantId: this.combatant.id,
                finalInitiative: remainingInitiative
            });
        }
        await this.combatant.unsetFlag('mastery-system', 'pendingInitiativeShop');
        if (this.resolve) {
            this.resolve(this.purchases);
            this.resolve = undefined;
        }
        await super.close({ closeSource: 'button', committed: true });
    }
    async close(options) {
        /** Schließen ohne confirmPurchases → Abbruch (null); pendingInitiativeShop bleibt für Rettung im Tracker. */
        if (this.resolve) {
            this.resolve(null);
            this.resolve = undefined;
        }
        return super.close(options);
    }
}
//# sourceMappingURL=initiative-shop-dialog.js.map