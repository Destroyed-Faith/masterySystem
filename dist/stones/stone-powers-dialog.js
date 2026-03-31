/**
 * Stone Powers Activation Dialog
 *
 * Allows players to activate stone powers during combat
 */
const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;
// Type workaround for Mixin
const BaseDialog = HandlebarsApplicationMixin(ApplicationV2);
import { STONE_POWERS, activateStonePower, getAvailableStonePowers } from './stone-activation.js';
import { getStoneUsageCount, calculateStoneCost, getStonePool, isStonePowersConfigurationLocked, getActionEconomyActor } from '../combat/action-economy.js';
import { getStoneGemStyle } from '../utils/stone-attribute-ui.js';
const STONE_DRAG_MIME = 'application/x-mastery-stone-attribute';
/** Fallback wenn getData im Drop leer bleibt (z. B. Chromium/Foundry) */
let msLastDraggedStoneAttribute = '';
const ALL_STONE_ATTRS = [
    'might',
    'agility',
    'vitality',
    'intellect',
    'resolve',
    'influence'
];
function getActorStonePoolKeysWithMax(actor) {
    const sp = (actor.system?.stonePools || {});
    const keys = new Set();
    for (const k of ALL_STONE_ATTRS) {
        const max = Number(sp[k]?.max) || 0;
        if (max > 0)
            keys.add(k);
    }
    return keys;
}
/**
 * Find the combatant row for this actor (linked sheet, prototype actor, or token document actorId).
 */
function resolveStonePowersCombatant(actor, combat) {
    const owner = getActionEconomyActor(actor) ?? actor;
    const sheetId = actor.id;
    const worldId = owner.id;
    const ids = new Set([sheetId, worldId].filter(Boolean));
    for (const c of combat.combatants) {
        const ca = c.actor;
        if (ca && ids.has(ca.id))
            return c;
    }
    for (const c of combat.combatants) {
        const td = c.token;
        const aid = td?.actorId;
        if (aid && ids.has(aid))
            return c;
    }
    return null;
}
/** Max number of tier slots to show: 2^n − 1 ≤ spendable */
function visibleStoneDropSlotCount(spendable) {
    if (spendable <= 0)
        return 0;
    return Math.floor(Math.log2(spendable + 1));
}
/** Slot visuals: active whenever genug Steine und nicht gesperrt — auch ohne laufenden Kampf (Aktivierung erst beim Drop/Button). */
function buildStoneDropSlots(usesThisTurn, spendable, nextCost, planLocked) {
    const visible = visibleStoneDropSlotCount(spendable);
    const count = Math.max(visible, usesThisTurn);
    const slots = [];
    for (let k = 0; k < count; k++) {
        const displayCost = calculateStoneCost(k);
        let state;
        if (k < usesThisTurn)
            state = 'done';
        else if (k === usesThisTurn) {
            if (planLocked)
                state = 'locked';
            else if (spendable >= nextCost)
                state = 'active';
            else
                state = 'locked';
        }
        else
            state = 'locked';
        slots.push({ index: k, displayCost, state });
    }
    if (slots.length === 0) {
        const cost = calculateStoneCost(usesThisTurn);
        let state = 'locked';
        if (!planLocked && spendable >= cost)
            state = 'active';
        slots.push({ index: usesThisTurn, displayCost: cost, state });
    }
    return slots;
}
/** DOM root for listeners (ApplicationV2 legt Inhalt unter part=content / .window-content). */
function getStonePowersContentRoot(app) {
    const el = app?.element;
    if (!el)
        return null;
    return (el.querySelector('[data-application-part="content"]') ||
        el.querySelector('.window-content') ||
        el);
}
export class StonePowersDialog extends BaseDialog {
    actor;
    combatant;
    resolve;
    _generalAttrSelection = {}; // Track selected attribute per generic power
    /** Partial drops toward multi-stone cost: key `${powerId}:${attr}:${uses}` */
    _stoneDropAccumulators = new Map();
    /** Entfernt Root‑Listener von #bindStoneDragAndDrop (bei jedem Render neu binden). */
    _stoneDndCleanup;
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
    static async showForActor(actor, combatant) {
        return new Promise(resolve => {
            const app = new StonePowersDialog(actor, combatant || null, resolve);
            app.render({ force: true });
        });
    }
    constructor(actor, combatant, resolve) {
        super({});
        this.actor = actor;
        this.combatant = combatant;
        this.resolve = resolve;
        const prefs = actor.system?.stonePowersPrefs;
        if (prefs?.useDefaultsEachRound && prefs.defaultAttributesByPowerId) {
            for (const [powerId, attr] of Object.entries(prefs.defaultAttributesByPowerId)) {
                if (typeof attr === 'string') {
                    this._generalAttrSelection[powerId] = attr;
                }
            }
        }
    }
    async _prepareContext(_options) {
        const combat = game.combat;
        const combatActive = !!combat;
        if (!this.combatant && combat) {
            this.combatant = resolveStonePowersCombatant(this.actor, combat);
        }
        const system = this.actor.system;
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
        const canSavePrefs = !stonePlanLocked && !!user && (user.isGM || this.actor.isOwner);
        // Determine default attribute for generic powers
        // First pool with current > 0, else first pool with max > 0
        const defaultGeneralAttrKey = (() => {
            const withCurrent = pools.find(p => p.current > 0);
            if (withCurrent)
                return withCurrent.key;
            if (pools.length > 0)
                return pools[0].key;
            return 'might'; // Fallback
        })();
        const spendableForAttr = (key) => pools.find((p) => p.key === key)?.available ?? 0;
        const preparePowerData = (power, attrKey) => {
            const usesThisTurn = hasCombat && combat ? getStoneUsageCount(this.actor, attrKey, power.id, combat) : 0;
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
        const resolveGenericAttrAndStats = (powerId) => {
            let attrKey = null;
            for (const [accKey, n] of this._stoneDropAccumulators) {
                if (n <= 0 || !accKey.startsWith(`${powerId}:`))
                    continue;
                const rest = accKey.slice(powerId.length + 1);
                const i = rest.lastIndexOf(':');
                if (i <= 0)
                    continue;
                attrKey = rest.slice(0, i);
                break;
            }
            if (!attrKey) {
                attrKey =
                    this._generalAttrSelection[powerId] || defaultGeneralAttrKey;
                if (!pools.some((p) => p.key === attrKey))
                    attrKey = defaultGeneralAttrKey;
            }
            let usesThisTurn = hasCombat && combat ? getStoneUsageCount(this.actor, attrKey, powerId, combat) : 0;
            let spendable = spendableForAttr(attrKey);
            let nextCost = calculateStoneCost(usesThisTurn);
            const hasPartial = [...this._stoneDropAccumulators].some(([k, n]) => n > 0 && k.startsWith(`${powerId}:`));
            if (!hasPartial &&
                !stonePlanLocked &&
                spendable < nextCost &&
                pools.some((p) => spendableForAttr(p.key) >= nextCost)) {
                const alt = pools.find((p) => spendableForAttr(p.key) >= nextCost);
                if (alt) {
                    attrKey = alt.key;
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
        const powersByAttribute = {};
        // First, initialize arrays for all pools that exist
        for (const pool of pools) {
            powersByAttribute[pool.key] = [];
        }
        // Then, add powers to their respective attribute sections
        for (const power of attributeSpecificPowers) {
            const attr = power.attribute;
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
    async _onRender(_context, _options) {
        super._onRender?.(_context, _options);
        const root = getStonePowersContentRoot(this);
        if (!root) {
            console.warn('Mastery System | StonePowersDialog: kein Content-Root für Event-Handler');
            return;
        }
        this.#bindStoneDragAndDrop(root);
        this.#syncAccumulatorGems(root);
        const savePrefsBtn = root.querySelector('.js-save-stone-prefs');
        if (savePrefsBtn) {
            savePrefsBtn.onclick = async (ev) => {
                ev.preventDefault();
                if (savePrefsBtn.classList.contains('is-disabled'))
                    return;
                await this.#saveStonePowersPrefs(root);
            };
        }
        root.querySelectorAll('.js-activate-power').forEach((el) => {
            const btn = el;
            btn.onclick = async (ev) => {
                ev.preventDefault();
                if (btn.disabled)
                    return;
                const powerId = btn.dataset.powerId;
                const attributeKey = btn.dataset.attributeKey;
                if (!powerId)
                    return;
                if (!this.combatant || !game.combat) {
                    ui.notifications?.warn('Steinmächte kannst du nur aktivieren, wenn ein Kampf läuft und die Figur im Tracker steht.');
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
                        await this.render({ force: true });
                    }
                    else {
                        ui.notifications?.warn(`Failed to activate ${STONE_POWERS[powerId]?.name || powerId}`);
                    }
                }
                catch (error) {
                    console.error('Mastery System | Error activating stone power', error);
                    ui.notifications?.error('Failed to activate stone power');
                }
            };
        });
        // Close button
        const closeBtn = root.querySelector('.js-close');
        if (closeBtn) {
            closeBtn.onclick = async (ev) => {
                ev.preventDefault();
                if (this.resolve) {
                    this.resolve(false);
                    this.resolve = undefined;
                }
                await this.close({ closeSource: "button" });
            };
        }
    }
    /** Zeigt Steine im aktiven Ablagefeld während Teil-Aktivierung (Kosten größer 1). */
    #syncAccumulatorGems(root) {
        root.querySelectorAll('.ms-stone-slot-fill .ms-slot-gem-partial').forEach((n) => n.remove());
        for (const [accKey, count] of this._stoneDropAccumulators) {
            if (count <= 0)
                continue;
            const firstColon = accKey.indexOf(':');
            if (firstColon < 0)
                continue;
            const powerId = accKey.slice(0, firstColon);
            const rest = accKey.slice(firstColon + 1);
            const lastColon = rest.lastIndexOf(':');
            if (lastColon <= 0)
                continue;
            const payAttr = rest.slice(0, lastColon);
            const slot = root.querySelector(`.ms-stone-drop-slot.slot-active[data-power-id="${powerId}"]`);
            if (!slot)
                continue;
            const fill = slot.querySelector('.ms-stone-slot-fill');
            if (!fill)
                continue;
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
    #bindStoneDragAndDrop(root) {
        this._stoneDndCleanup?.();
        this._stoneDndCleanup = undefined;
        const combat = game.combat;
        const canExecute = !!combat && !!this.combatant;
        const locked = !!(combat && this.combatant && isStonePowersConfigurationLocked(this.actor, combat));
        const allowDrag = !locked;
        const poolKeys = getActorStonePoolKeysWithMax(this.actor);
        const clearDragOver = () => {
            root.querySelectorAll('.ms-stone-drop-slot.is-drag-over').forEach((n) => n.classList.remove('is-drag-over'));
        };
        root.querySelectorAll('.js-stone-draggable').forEach((el) => {
            const gem = el;
            gem.draggable = allowDrag;
            gem.classList.toggle('is-drag-disabled', !allowDrag);
            gem.ondragstart = (ev) => {
                if (!allowDrag || !ev.dataTransfer)
                    return;
                const attr = gem.dataset.attributeKey || '';
                msLastDraggedStoneAttribute = attr;
                ev.dataTransfer.setData(STONE_DRAG_MIME, attr);
                ev.dataTransfer.setData('text/plain', attr);
                ev.dataTransfer.effectAllowed = 'copy';
                gem.classList.add('is-dragging');
            };
            gem.ondragend = () => {
                gem.classList.remove('is-dragging');
                clearDragOver();
            };
        });
        const resolveDropSlot = (ev) => {
            const raw = ev.target;
            const el = raw instanceof Element
                ? raw
                : raw && raw.parentElement instanceof Element
                    ? raw.parentElement
                    : null;
            if (!el || !root.contains(el))
                return null;
            const slot = el.closest('.ms-stone-drop-slot');
            return slot && root.contains(slot) ? slot : null;
        };
        /** Ein Listener auf dem Content‑Root: vermeidet, dass Kind‑Elemente dragover „schlucken“. */
        const onRootDragOver = (ev) => {
            if (!allowDrag || locked)
                return;
            const slot = resolveDropSlot(ev);
            if (!slot?.classList.contains('slot-active')) {
                clearDragOver();
                return;
            }
            ev.preventDefault();
            if (ev.dataTransfer)
                ev.dataTransfer.dropEffect = 'copy';
            clearDragOver();
            slot.classList.add('is-drag-over');
        };
        const onRootDragLeave = (ev) => {
            const rel = ev.relatedTarget;
            if (rel && root.contains(rel))
                return;
            clearDragOver();
        };
        const onRootDrop = async (ev) => {
            const slot = resolveDropSlot(ev);
            if (!slot) {
                if (msLastDraggedStoneAttribute)
                    ev.preventDefault();
                return;
            }
            ev.preventDefault();
            clearDragOver();
            if (locked) {
                ui.notifications?.warn('Diese Runde ist für Steinmächte gesperrt.');
                return;
            }
            if (!slot.classList.contains('slot-active'))
                return;
            const dragged = ev.dataTransfer?.getData(STONE_DRAG_MIME) ||
                ev.dataTransfer?.getData('text/plain') ||
                msLastDraggedStoneAttribute ||
                '';
            const powerId = slot.dataset.powerId || '';
            const isGeneric = slot.dataset.isGeneric === 'true';
            let payAttr;
            if (isGeneric) {
                payAttr = dragged;
                if (!powerId || !dragged)
                    return;
                if (!poolKeys.has(dragged)) {
                    ui.notifications?.warn('Dieser Stein gehört zu keinem Pool auf diesem Bogen.');
                    return;
                }
                for (const [k, v] of this._stoneDropAccumulators) {
                    if (v <= 0 || !k.startsWith(`${powerId}:`))
                        continue;
                    const rest = k.slice(powerId.length + 1);
                    const i = rest.lastIndexOf(':');
                    const existingAttr = i > 0 ? rest.slice(0, i) : '';
                    if (existingAttr && existingAttr !== dragged) {
                        ui.notifications?.warn('Für diese Aktivierung denselben Stein-Typ verwenden.');
                        return;
                    }
                    break;
                }
                this._generalAttrSelection[powerId] = payAttr;
            }
            else {
                payAttr = (slot.dataset.payAttribute || '');
                if (!powerId || !payAttr)
                    return;
                if (dragged !== payAttr) {
                    ui.notifications?.warn('Falscher Stein — Attribut passt nicht zu diesem Feld.');
                    return;
                }
            }
            const uses = getStoneUsageCount(this.actor, payAttr, powerId, combat);
            const nextCost = calculateStoneCost(uses);
            const accKey = `${powerId}:${payAttr}:${uses}`;
            const cur = this._stoneDropAccumulators.get(accKey) || 0;
            if (cur >= nextCost) {
                return;
            }
            const next = cur + 1;
            this._stoneDropAccumulators.set(accKey, next);
            this.#syncAccumulatorGems(root);
            if (next < nextCost) {
                return;
            }
            if (!canExecute) {
                return;
            }
            this._stoneDropAccumulators.delete(accKey);
            this.#syncAccumulatorGems(root);
            try {
                const success = await activateStonePower({
                    actor: this.actor,
                    combatant: this.combatant,
                    abilityId: powerId,
                    attributeKey: payAttr
                });
                if (success) {
                    ui.notifications?.info(`${STONE_POWERS[powerId]?.name || powerId} aktiviert`);
                    await this.render({ force: true });
                }
                else {
                    if (next > 1)
                        this._stoneDropAccumulators.set(accKey, next - 1);
                    else
                        this._stoneDropAccumulators.delete(accKey);
                    this.#syncAccumulatorGems(root);
                    ui.notifications?.warn('Aktivierung fehlgeschlagen.');
                }
            }
            catch (error) {
                console.error('Mastery System | stone drop activate', error);
                if (next > 1)
                    this._stoneDropAccumulators.set(accKey, next - 1);
                else
                    this._stoneDropAccumulators.delete(accKey);
                this.#syncAccumulatorGems(root);
                ui.notifications?.error('Steinmacht konnte nicht aktiviert werden.');
            }
        };
        const cap = true;
        root.addEventListener('dragover', onRootDragOver, cap);
        root.addEventListener('dragleave', onRootDragLeave);
        root.addEventListener('drop', onRootDrop, cap);
        this._stoneDndCleanup = () => {
            root.removeEventListener('dragover', onRootDragOver, cap);
            root.removeEventListener('dragleave', onRootDragLeave);
            root.removeEventListener('drop', onRootDrop, cap);
        };
    }
    async #saveStonePowersPrefs(root) {
        const doc = getActionEconomyActor(this.actor) ?? this.actor;
        const useEl = root.querySelector('.js-stone-prefs-use-defaults');
        const useDefaultsEachRound = !!useEl?.checked;
        const map = {};
        for (const [pid, attr] of Object.entries(this._generalAttrSelection)) {
            map[pid] = attr;
        }
        await doc.update({
            'system.stonePowersPrefs': {
                useDefaultsEachRound,
                defaultAttributesByPowerId: map
            }
        });
        ui.notifications?.info('Steinmacht-Standard gespeichert (wird bei neuen Runden übernommen, solange aktiviert).');
    }
    async _onClose(_options) {
        this._stoneDndCleanup?.();
        this._stoneDndCleanup = undefined;
        if (this.resolve) {
            this.resolve(false);
            this.resolve = undefined;
        }
        return super._onClose(_options);
    }
}
//# sourceMappingURL=stone-powers-dialog.js.map