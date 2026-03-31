/**
 * Stone Powers Activation Dialog
 *
 * Allows players to activate stone powers during combat
 */
const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;
// Type workaround for Mixin
const BaseDialog = HandlebarsApplicationMixin(ApplicationV2);
import { STONE_POWERS, activateStonePower, getAvailableStonePowers } from './stone-activation.js';
import { STONE_POWERS_BY_ATTRIBUTE } from './stone-powers.js';
import { getStoneUsageCount, calculateStoneCost, getStonePool, isStonePowersConfigurationLocked, getActionEconomyActor } from '../combat/action-economy.js';
import { getStoneGemStyle } from '../utils/stone-attribute-ui.js';
const STONE_DRAG_MIME = 'application/x-mastery-stone-attribute';
const STONE_RETURN_MIME = 'application/x-mastery-stone-return-acc';
/**
 * Konsole nach `StoneDnD` filtern.
 * Abschalten: in F12 `CONFIG.masterySystemDebugStoneDnD = false` (Standard ist an, bis ihr es dauerhaft ausmacht).
 * Rückgabe Pool↔Feld: zusätzlich `CONFIG.masterySystemDebugStoneReturn = true` (Standard aus), dann [StoneReturn]-Logs.
 */
const DEBUG_STONE_POWERS_DND = globalThis.CONFIG?.masterySystemDebugStoneDnD !== false;
const DEBUG_STONE_RETURN = globalThis.CONFIG?.masterySystemDebugStoneReturn === true;
function dlogStoneDnD(...args) {
    if (!DEBUG_STONE_POWERS_DND)
        return;
    console.log('Mastery System | [StoneDnD]', ...args);
}
function dlogStoneReturn(...args) {
    if (!DEBUG_STONE_RETURN)
        return;
    console.log('Mastery System | [StoneReturn]', ...args);
}
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
    /** Attribut des aktuellen Zugs — Foundry/Electron liefert oft kein dataTransfer.getData beim drop. */
    _stoneDragAttribute = null;
    /** Akku-Schlüssel beim Ziehen eines Steins aus dem Feld zurück in den Pool. */
    _stoneReturnAccKey = null;
    static DEFAULT_OPTIONS = {
        id: "mastery-stone-powers",
        classes: ["mastery-system", "stone-powers-dialog"],
        position: { width: 920, height: 640 },
        window: { title: 'Stonepowers', resizable: true }
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
            const reserved = this.#reservedStonesInDialogForAttr(attr);
            const poolDisplay = Math.max(0, available - reserved);
            const gemStyle = getStoneGemStyle(attr) ?? { fill: '#888888', stroke: '#aaaaaa' };
            const gemSlots = Array.from({ length: poolDisplay }, (_, i) => ({ index: i }));
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
            const sp = STONE_POWERS[power.id];
            return {
                id: power.id,
                name: power.name,
                description,
                effectLong: sp?.effect || description,
                attribute: power.attribute,
                nextCost,
                canAfford,
                selectedAttrKey: attrKey,
                usesThisTurn,
                dropSlots,
                slotGemStyle: gem ?? { fill: '#888888', stroke: '#aaaaaa' }
            };
        });
        const powersByAttribute = {};
        for (const pool of pools) {
            powersByAttribute[pool.key] = [];
        }
        for (const power of attributeSpecificPowers) {
            const attr = power.attribute;
            if (powersByAttribute[attr]) {
                powersByAttribute[attr].push(preparePowerData(power, attr));
            }
        }
        const ATTR_MATRIX_COLS = 4;
        const attributePowerMatrix = pools
            .map((pool) => {
            const attr = pool.key;
            const defs = STONE_POWERS_BY_ATTRIBUTE[attr];
            if (!defs?.length)
                return null;
            const preparedMap = new Map((powersByAttribute[attr] || []).map((p) => [p.id, p]));
            const cells = [];
            for (let i = 0; i < ATTR_MATRIX_COLS; i++) {
                const def = defs[i];
                if (!def) {
                    cells.push(null);
                    continue;
                }
                let p = preparedMap.get(def.id);
                if (!p) {
                    p = preparePowerData(def, attr);
                }
                cells.push({
                    ...p,
                    effectLong: def.effect || p.description || ''
                });
            }
            return {
                attrKey: attr,
                label: pool.name,
                cells
            };
        })
            .filter((row) => {
            if (!row)
                return false;
            const spendable = spendableForAttr(row.attrKey);
            const reserved = this.#reservedStonesInDialogForAttr(row.attrKey);
            return spendable > 0 || reserved > 0;
        });
        return {
            actor: this.actor,
            pools,
            attributePowerMatrix,
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
        const appWindow = this.element ?? root;
        this.#bindStoneDragAndDrop(root, appWindow);
        this.#syncAccumulatorGems(appWindow);
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
                    ui.notifications?.warn('Stonepowers kannst du nur aktivieren, wenn ein Kampf läuft und die Figur im Tracker steht.');
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
    /** payAttr aus Schlüssel `powerId:payAttr:uses` (powerId kann Punkte, keine weiteren `:`). */
    #parseAccKeyPayAttr(accKey) {
        const i = accKey.indexOf(':');
        if (i < 0)
            return null;
        const rest = accKey.slice(i + 1);
        const j = rest.lastIndexOf(':');
        if (j <= 0)
            return null;
        return rest.slice(0, j);
    }
    #reservedStonesInDialogForAttr(attr) {
        let sum = 0;
        for (const [accKey, count] of this._stoneDropAccumulators) {
            if (count <= 0)
                continue;
            if (this.#parseAccKeyPayAttr(accKey) === attr)
                sum += count;
        }
        return sum;
    }
    #actorPoolSpendable(attr) {
        const system = this.actor.system;
        const stonePools = system?.stonePools || {};
        const pool = stonePools[attr];
        if (!pool)
            return 0;
        const current = pool?.current ?? pool?.value ?? 0;
        const sustained = pool?.sustained ?? 0;
        return Math.max(0, (Number(current) || 0) - (Number(sustained) || 0));
    }
    /** Entfernt Pool-Chips, die bereits in Ablagefeldern (Akku) stecken — inkl. Teilbelegung. */
    #syncPoolGemChips(root) {
        for (const attr of ALL_STONE_ATTRS) {
            const poolGems = root.querySelector(`.pool-gems[data-attribute-key="${attr}"]`);
            if (!poolGems)
                continue;
            const spendable = this.#actorPoolSpendable(attr);
            const reserved = this.#reservedStonesInDialogForAttr(attr);
            const want = Math.max(0, spendable - reserved);
            const chips = Array.from(poolGems.querySelectorAll('.js-stone-draggable')).filter((c) => !c.classList.contains('is-dragging'));
            while (chips.length > want) {
                const el = chips.pop();
                el?.remove();
            }
            if (chips.length < want) {
                void this.render({ force: true });
                return;
            }
        }
    }
    /** Zeigt Steine im aktiven Ablagefeld während Teil-Aktivierung (Kosten größer 1). */
    #syncAccumulatorGems(root) {
        const combat = game.combat;
        const locked = !!(combat && this.combatant && isStonePowersConfigurationLocked(this.actor, combat));
        const allowReturnDrag = !locked;
        root.querySelectorAll('.ms-stone-slot-fill .ms-slot-gem-partial').forEach((n) => n.remove());
        for (const [accKey, count] of this._stoneDropAccumulators) {
            if (count <= 0)
                continue;
            const fc = accKey.indexOf(':');
            if (fc < 0)
                continue;
            const powerId = accKey.slice(0, fc);
            const payAttrRaw = this.#parseAccKeyPayAttr(accKey);
            if (!payAttrRaw)
                continue;
            const payAttr = payAttrRaw;
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
                gem.className = 'ms-stone-gem-chip ms-slot-gem-partial js-stone-returnable';
                gem.setAttribute('data-acc-key', accKey);
                gem.title = allowReturnDrag
                    ? 'Zurück in den passenden Pool ziehen'
                    : 'Runde gesperrt — Rückgabe nicht möglich';
                gem.draggable = allowReturnDrag;
                gem.classList.toggle('is-drag-disabled', !allowReturnDrag);
                gem.style.background = fillC;
                gem.style.boxShadow = `0 0 0 2px ${strokeC} inset, 0 1px 3px rgba(0,0,0,0.45)`;
                fill.appendChild(gem);
            }
        }
        this.#syncPoolGemChips(root);
    }
    /**
     * @param root Content-Part (Queries für Buttons)
     * @param bindTarget App-Fenster-Element: DnD hier binden (Foundry V2: Slots liegen zuverlässig darunter)
     */
    #bindStoneDragAndDrop(root, bindTarget) {
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
        const clearPoolReturnHighlight = () => {
            bindTarget.querySelectorAll('.pool-gems.is-pool-drag-over').forEach((n) => n.classList.remove('is-pool-drag-over'));
        };
        const clearDragOver = () => {
            clearPoolReturnHighlight();
            bindTarget.querySelectorAll('.ms-stone-drop-slot.is-drag-over').forEach((n) => n.classList.remove('is-drag-over'));
        };
        root.querySelectorAll('.js-stone-draggable').forEach((el) => {
            const gem = el;
            gem.draggable = allowDrag;
            gem.classList.toggle('is-drag-disabled', !allowDrag);
            gem.ondragstart = (ev) => {
                if (!allowDrag || !ev.dataTransfer) {
                    dlogStoneDnD('dragstart skipped', { allowDrag, hasDT: !!ev.dataTransfer });
                    return;
                }
                this._stoneReturnAccKey = null;
                const attr = gem.dataset.attributeKey ||
                    gem.closest('.pool-gems')?.dataset?.attributeKey ||
                    gem.closest('.pool-item')?.dataset?.attribute ||
                    '';
                this._stoneDragAttribute = attr;
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
                this.#syncPoolGemChips(bindTarget);
                dlogStoneDnD('dragend', {
                    msLastDraggedStoneAttribute,
                    dialogDragAttr: this._stoneDragAttribute
                });
                queueMicrotask(() => {
                    this._stoneDragAttribute = null;
                });
            };
        });
        const resolveDropSlot = (ev, logMiss) => {
            const raw = ev.target;
            const el = raw instanceof Element
                ? raw
                : raw && raw.parentElement instanceof Element
                    ? raw.parentElement
                    : null;
            if (!el) {
                if (logMiss)
                    dlogStoneDnD('resolveDropSlot: no element', { rawType: raw?.constructor?.name });
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
            const slot = el.closest('.ms-stone-drop-slot');
            if (!slot || !bindTarget.contains(slot)) {
                if (logMiss)
                    dlogStoneDnD('resolveDropSlot: no .ms-stone-drop-slot ancestor', {
                        elTag: el.tagName,
                        elClass: el.className
                    });
                return null;
            }
            return slot;
        };
        /** Slot: Pool→Feld; Return-Drag: Feld→Pool (nutzt `_stoneReturnAccKey`, da types in dragover unzuverlässig sind). */
        const onBindDragOver = (ev) => {
            if (!allowDrag || locked) {
                return;
            }
            if (this._stoneReturnAccKey) {
                const poolGems = ev.target?.closest?.('.pool-gems');
                if (poolGems && bindTarget.contains(poolGems)) {
                    const payAttr = this.#parseAccKeyPayAttr(this._stoneReturnAccKey);
                    const poolAttr = poolGems.dataset.attributeKey || '';
                    if (payAttr && poolAttr === payAttr) {
                        ev.preventDefault();
                        if (ev.dataTransfer)
                            ev.dataTransfer.dropEffect = 'move';
                        bindTarget.querySelectorAll('.ms-stone-drop-slot.is-drag-over').forEach((n) => n.classList.remove('is-drag-over'));
                        clearPoolReturnHighlight();
                        poolGems.classList.add('is-pool-drag-over');
                        const k = `return-pool:${poolAttr}`;
                        if (k !== lastDragOverLogKey) {
                            lastDragOverLogKey = k;
                            dlogStoneReturn('dragover → pool OK', {
                                poolAttr,
                                accKey: this._stoneReturnAccKey,
                                types: ev.dataTransfer ? [...(ev.dataTransfer.types || [])] : []
                            });
                        }
                        return;
                    }
                    dlogStoneReturn('dragover → pool mismatch', { payAttr, poolAttr, accKey: this._stoneReturnAccKey });
                }
                clearPoolReturnHighlight();
                dlogStoneReturn('dragover return: not over matching pool, skip slot highlight');
                return;
            }
            const slot = resolveDropSlot(ev, false);
            if (!slot?.classList.contains('slot-active')) {
                clearDragOver();
                return;
            }
            ev.preventDefault();
            if (ev.dataTransfer)
                ev.dataTransfer.dropEffect = 'copy';
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
        const onBindDragLeave = (ev) => {
            const rel = ev.relatedTarget;
            if (rel && bindTarget.contains(rel))
                return;
            clearDragOver();
        };
        const onBindDrop = async (ev) => {
            const pathTags = (ev.composedPath?.() || [])
                .slice(0, 12)
                .map((n) => (n instanceof Element ? n.tagName + (n.id ? `#${n.id}` : '') : String(n)));
            const accKeyReturn = this._stoneReturnAccKey ||
                ev.dataTransfer?.getData(STONE_RETURN_MIME) ||
                '';
            dlogStoneDnD('drop event', {
                target: ev.target instanceof Element ? ev.target.tagName + '.' + ev.target.className?.toString?.()?.slice(0, 80) : ev.target,
                pathHead: pathTags,
                dataTypes: ev.dataTransfer ? [...(ev.dataTransfer.types || [])] : [],
                mime: ev.dataTransfer?.getData(STONE_DRAG_MIME),
                plain: ev.dataTransfer?.getData('text/plain'),
                returnMime: ev.dataTransfer?.getData(STONE_RETURN_MIME),
                dialogDragAttr: this._stoneDragAttribute,
                returnAccKeyField: this._stoneReturnAccKey,
                accKeyReturnResolved: accKeyReturn,
                msLastDraggedStoneAttribute
            });
            const poolGemsDrop = ev.target?.closest?.('.pool-gems');
            if (accKeyReturn) {
                ev.preventDefault();
                clearDragOver();
                if (!poolGemsDrop || !bindTarget.contains(poolGemsDrop)) {
                    dlogStoneReturn('abort: Rückgabe nur auf Pool-Zeile', { accKeyReturn, hasPoolEl: !!poolGemsDrop });
                    return;
                }
                const payAttr = this.#parseAccKeyPayAttr(accKeyReturn);
                const poolAttr = poolGemsDrop.dataset.attributeKey || '';
                dlogStoneReturn('drop auf Pool prüfen', { accKeyReturn, payAttr, poolAttr });
                if (!payAttr || poolAttr !== payAttr) {
                    dlogStoneReturn('abort: falscher Pool für diesen Stein', { payAttr, poolAttr });
                    return;
                }
                const cur = this._stoneDropAccumulators.get(accKeyReturn) || 0;
                if (cur <= 0) {
                    dlogStoneReturn('abort: Akku schon leer', { accKeyReturn });
                    return;
                }
                const next = cur - 1;
                if (next <= 0)
                    this._stoneDropAccumulators.delete(accKeyReturn);
                else
                    this._stoneDropAccumulators.set(accKeyReturn, next);
                dlogStoneReturn('OK: Stein zurück im Pool (Akku--)', { accKeyReturn, next });
                this.#syncAccumulatorGems(bindTarget);
                return;
            }
            const slot = resolveDropSlot(ev, true);
            if (!slot) {
                dlogStoneDnD('drop abort: kein Slot (resolveDropSlot null)');
                if (msLastDraggedStoneAttribute)
                    ev.preventDefault();
                return;
            }
            ev.preventDefault();
            clearDragOver();
            if (locked) {
                dlogStoneDnD('drop abort: stonePlanLocked');
                ui.notifications?.warn('Diese Runde ist für Stonepowers gesperrt.');
                return;
            }
            if (!slot.classList.contains('slot-active')) {
                dlogStoneDnD('drop abort: Slot nicht slot-active', { classes: Array.from(slot.classList) });
                return;
            }
            const dragged = this._stoneDragAttribute ||
                ev.dataTransfer?.getData(STONE_DRAG_MIME) ||
                ev.dataTransfer?.getData('text/plain') ||
                msLastDraggedStoneAttribute ||
                '';
            const powerId = slot.dataset.powerId ||
                slot.closest('.power-drop-slots')?.dataset.powerId ||
                '';
            const isGeneric = slot.dataset.isGeneric === 'true' ||
                slot.getAttribute('data-is-generic') === 'true';
            dlogStoneDnD('drop resolved slot', {
                powerId,
                isGeneric,
                dragged,
                slotDataset: { ...slot.dataset }
            });
            let payAttr;
            if (isGeneric) {
                payAttr = dragged;
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
                    if (v <= 0 || !k.startsWith(`${powerId}:`))
                        continue;
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
            }
            else {
                payAttr = (slot.dataset.payAttribute || '');
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
                    await this.render({ force: true });
                }
                else {
                    if (next > 1)
                        this._stoneDropAccumulators.set(accKey, next - 1);
                    else
                        this._stoneDropAccumulators.delete(accKey);
                    this.#syncAccumulatorGems(bindTarget);
                    ui.notifications?.warn('Aktivierung fehlgeschlagen.');
                }
            }
            catch (error) {
                console.error('Mastery System | stone drop activate', error);
                if (next > 1)
                    this._stoneDropAccumulators.set(accKey, next - 1);
                else
                    this._stoneDropAccumulators.delete(accKey);
                this.#syncAccumulatorGems(bindTarget);
                ui.notifications?.error('Steinmacht konnte nicht aktiviert werden.');
            }
        };
        const onDelegateReturnDragStart = (ev) => {
            const t = ev.target;
            if (!t?.classList?.contains('js-stone-returnable'))
                return;
            if (!allowDrag || !ev.dataTransfer || locked) {
                ev.preventDefault();
                dlogStoneReturn('dragstart blocked', { allowDrag, locked });
                return;
            }
            const accKey = t.getAttribute('data-acc-key') || t.dataset.accKey || '';
            if (!accKey) {
                ev.preventDefault();
                dlogStoneReturn('dragstart abort: keine accKey am Element');
                return;
            }
            this._stoneReturnAccKey = accKey;
            this._stoneDragAttribute = null;
            ev.dataTransfer.setData(STONE_RETURN_MIME, accKey);
            ev.dataTransfer.setData('text/plain', accKey);
            ev.dataTransfer.effectAllowed = 'move';
            t.classList.add('is-dragging');
            lastDragOverLogKey = '';
            const fc = accKey.indexOf(':');
            dlogStoneReturn('dragstart', { accKey, powerId: fc >= 0 ? accKey.slice(0, fc) : accKey });
        };
        const onDelegateReturnDragEnd = (ev) => {
            const t = ev.target;
            if (!t?.classList?.contains('js-stone-returnable'))
                return;
            t.classList.remove('is-dragging');
            clearDragOver();
            lastDragOverLogKey = '';
            this.#syncPoolGemChips(bindTarget);
            const acc = this._stoneReturnAccKey;
            dlogStoneReturn('dragend', { hadAccKey: acc });
            queueMicrotask(() => {
                this._stoneReturnAccKey = null;
            });
        };
        const useCapture = true;
        bindTarget.addEventListener('dragstart', onDelegateReturnDragStart, useCapture);
        bindTarget.addEventListener('dragend', onDelegateReturnDragEnd, useCapture);
        bindTarget.addEventListener('dragover', onBindDragOver, useCapture);
        bindTarget.addEventListener('dragleave', onBindDragLeave);
        bindTarget.addEventListener('drop', onBindDrop, useCapture);
        this._stoneDndCleanup = () => {
            bindTarget.removeEventListener('dragstart', onDelegateReturnDragStart, useCapture);
            bindTarget.removeEventListener('dragend', onDelegateReturnDragEnd, useCapture);
            bindTarget.removeEventListener('dragover', onBindDragOver, useCapture);
            bindTarget.removeEventListener('dragleave', onBindDragLeave);
            bindTarget.removeEventListener('drop', onBindDrop, useCapture);
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
        this._stoneDragAttribute = null;
        this._stoneReturnAccKey = null;
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