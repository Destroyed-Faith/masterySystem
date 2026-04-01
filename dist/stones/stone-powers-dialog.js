/**
 * Stone Powers Activation Dialog
 *
 * Allows players to activate stone powers during combat
 */
var _a;
const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;
// Type workaround for Mixin
const BaseDialog = HandlebarsApplicationMixin(ApplicationV2);
import { STONE_POWERS, activateStonePower, getAvailableStonePowers } from './stone-activation.js';
import { STONE_POWERS_BY_ATTRIBUTE } from './stone-powers.js';
import { getStoneUsageCount, getGenericStonePowerUsageCount, calculateStoneCost, getStonePool, isStonePowersConfigurationLocked, getActionEconomyActor } from '../combat/action-economy.js';
import { getStoneGemStyle } from '../utils/stone-attribute-ui.js';
const STONE_DRAG_MIME = 'application/x-mastery-stone-attribute';
const STONE_RETURN_MIME = 'application/x-mastery-stone-return-acc';
/**
 * Konsole nach `StoneDnD` filtern.
 * Abschalten: in F12 `CONFIG.masterySystemDebugStoneDnD = false` (Standard ist an, bis ihr es dauerhaft ausmacht).
 * Rückgabe Pool↔Feld: zusätzlich `CONFIG.masterySystemDebugStoneReturn = true` (Standard aus), dann [StoneReturn]-Logs.
 * Ablage-Raster (wave/acc/nextCost): `CONFIG.masterySystemDebugStoneWave = true` → [StoneWave]-Logs.
 * Lane-UI / Akku / DOM: `CONFIG.masterySystemDebugStoneLanes = true` → [StoneLanes]-Logs.
 * Zahlungs-Wellen / spendableNet / warum Slot locked: `CONFIG.masterySystemDebugStonePayment = true` → [StonePayment]-Logs bei jedem Render + `console.warn` bei Drop auf locked (immer kurz, Details wenn Flag an).
 */
const DEBUG_STONE_POWERS_DND = globalThis.CONFIG?.masterySystemDebugStoneDnD !== false;
const DEBUG_STONE_RETURN = globalThis.CONFIG?.masterySystemDebugStoneReturn === true;
const DEBUG_STONE_WAVE = globalThis.CONFIG?.masterySystemDebugStoneWave === true;
/** F12: `CONFIG.masterySystemDebugStoneLanes = true` — Lane-Zustand, Akku-Keys, DOM nach Render. */
const DEBUG_STONE_LANES = globalThis.CONFIG?.masterySystemDebugStoneLanes === true;
/** F12: `CONFIG.masterySystemDebugStonePayment = true` — volle Payment-Snapshots in _prepareContext ([StonePayment]). */
const DEBUG_STONE_PAYMENT = globalThis.CONFIG?.masterySystemDebugStonePayment === true;
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
function dlogStoneWave(payload) {
    console.log('Mastery System | [StoneWave]', payload);
}
function dlogStoneLanes(...args) {
    if (!DEBUG_STONE_LANES)
        return;
    console.log('Mastery System | [StoneLanes]', ...args);
}
function dlogStonePayment(...args) {
    if (!DEBUG_STONE_PAYMENT)
        return;
    console.log('Mastery System | [StonePayment]', ...args);
}
/** Warum ein leeres Feld nicht `slot-active` ist (Debug / Drop-Warn). */
function explainLaneInactiveReason(laneIndex, occ, allowed, spendableNet, planLocked, nextCost) {
    const o = new Set(occ);
    const paid = o.size;
    if (planLocked)
        return 'stonePlanLocked';
    if (o.has(laneIndex))
        return 'filled';
    if (nextCost < 1)
        return 'nextCost<1';
    if (paid >= nextCost) {
        return `Zahlung_voll (paid=${paid} nextCost=${nextCost}) — bei nextCost=1 nur Lane 0, keine Mittelfelder`;
    }
    if (spendableNet < 1) {
        return `spendableNet=${spendableNet} (kein freier Pool-Stein; reservierte Felder zählen gegen den Pool)`;
    }
    if (!allowed.has(laneIndex)) {
        return `Lane nicht in allowed=[${[...allowed].sort((a, b) => a - b)}] (Wellenfolge 0 → 1+2 → 3+…)`;
    }
    return 'sollte_active_sein';
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
/**
 * Wert für Attribut-Selektoren `[data-power-id="…"]` in querySelector.
 * Nicht `CSS.escape` verwenden: Macht-IDs enthalten Punkte (`generic.extraAttack`); als Ident escaped
 * matcht der Selektor nicht das literal gesetzte HTML-Attribut → keine Zelle, kein grünes Feld / kein Gem.
 */
function escapeAttrValueInCssSelector(value) {
    return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}
/** Physische Zahlungs-Lanes im Cluster: 1 + 2 + 4 + 8. */
const STONE_PAYMENT_LANE_COUNT = 15;
/**
 * Welche leeren Lanes dürfen als Nächstes belegt werden:
 * zuerst nur Lane 0, nach Stein auf 0 die beiden Mittelfelder 1+2 (Reihenfolge frei),
 * danach Lanes 3 … bis nextCost-1.
 *
 * Wichtig: Mids 1+2 nicht mit `l < nextCost` koppeln — bei nextCost 2 wäre Lane 2 sonst nie erlaubt,
 * und die „zwei Mittelfelder“-Phase würde fälschlich ausfallen.
 */
function allowedPaymentDropLanes(occupied, nextCost) {
    const o = new Set(occupied);
    const paid = o.size;
    if (paid >= nextCost || nextCost < 1)
        return new Set();
    if (!o.has(0))
        return new Set([0]);
    const hasBothMids = o.has(1) && o.has(2);
    if (!hasBothMids) {
        const midsFree = [1, 2].filter((l) => !o.has(l));
        if (midsFree.length > 0)
            return new Set(midsFree);
    }
    const rest = new Set();
    for (let l = 3; l < nextCost && l < STONE_PAYMENT_LANE_COUNT; l++) {
        if (!o.has(l))
            rest.add(l);
    }
    return rest;
}
function buildStonePaymentLanes(usesThisTurn, spendableNet, nextCost, planLocked, occupied, debugLabel) {
    const o = new Set(occupied);
    const allowed = allowedPaymentDropLanes(occupied, nextCost);
    const laneState = (laneIndex) => {
        if (laneIndex < 0 || laneIndex >= STONE_PAYMENT_LANE_COUNT)
            return 'locked';
        if (o.has(laneIndex))
            return 'filled';
        if (planLocked)
            return 'locked';
        if (spendableNet < 1)
            return 'locked';
        if (allowed.has(laneIndex))
            return 'active';
        return 'locked';
    };
    const cell = (laneIndex) => ({
        laneIndex,
        slotIndex: usesThisTurn + laneIndex,
        state: laneState(laneIndex)
    });
    const segments = {
        paymentAnchor: [cell(0)],
        paymentMid: [cell(1), cell(2)],
        paymentQuad: [cell(3), cell(4), cell(5), cell(6)],
        paymentOct: Array.from({ length: 8 }, (_, j) => cell(7 + j))
    };
    if (DEBUG_STONE_WAVE && debugLabel) {
        dlogStoneWave({
            label: debugLabel,
            usesThisTurn,
            nextCost,
            occupied: [...occupied].sort((a, b) => a - b),
            allowedLanes: [...allowed],
            spendableNet,
            planLocked
        });
    }
    return segments;
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
/**
 * Slot unter dem Mauszeiger — `ev.target` beim drop/dragover sitzt oft auf Kindern oder einer
 * benachbarten Zelle; sonst akzeptiert der Browser den Drop auf `slot-locked` obwohl visuell „aktiv“ wirkte.
 */
function resolveMsStoneDropSlotUnderPointer(ev, bindTarget) {
    const doc = (ev.view?.document ?? (typeof document !== 'undefined' ? document : null));
    if (!doc?.elementsFromPoint)
        return null;
    try {
        const stack = doc.elementsFromPoint(ev.clientX, ev.clientY);
        for (const el of stack) {
            if (!(el instanceof HTMLElement))
                continue;
            if (!bindTarget.contains(el))
                continue;
            const slot = el.closest('.ms-stone-drop-slot');
            if (slot instanceof HTMLElement && bindTarget.contains(slot))
                return slot;
        }
    }
    catch {
        /* ignore */
    }
    return null;
}
function applyStoneSlotDragOverVisual(slot) {
    slot.classList.add('is-drag-over');
    slot.style.setProperty('outline', '2px solid rgba(255, 255, 255, 0.98)', 'important');
    slot.style.setProperty('outline-offset', '2px', 'important');
    slot.style.setProperty('box-shadow', '0 0 0 3px rgba(255, 200, 60, 0.95), 0 0 14px rgba(255, 235, 120, 0.55)', 'important');
}
function clearStoneSlotDragOverVisual(slot) {
    slot.classList.remove('is-drag-over');
    slot.style.removeProperty('outline');
    slot.style.removeProperty('outline-offset');
    slot.style.removeProperty('box-shadow');
}
export class StonePowersDialog extends BaseDialog {
    /**
     * Teilzahlungs-Lanes überleben Foundry-V2-`render`/`_prepareContext`, falls die App-Instanz
     * intern neu verdrahtet wird (Akku-Map sonst leer → nie slot-filled / kein Grün).
     * Schlüssel: `${ownerActorId}\0${powerId}:${attr}:${uses}`
     */
    static _sessionStoneLanes = new Map();
    actor;
    combatant;
    resolve;
    _generalAttrSelection = {}; // Track selected attribute per generic power
    /** Belegte Zahlungs-Lanes (0..14) je laufender Zahlung: `${powerId}:${attr}:${uses}` */
    _stoneDropAccumulators = new Map();
    /** Lane des Steins bei Rückzug Pool←Feld (dragstart). */
    _stoneReturnLane = null;
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
            const app = new _a(actor, combatant || null, resolve);
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
        this.#pullSessionPartialsIntoInstance();
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
        const totalSpendableNetAllPools = () => {
            let sum = 0;
            for (const attr of ALL_STONE_ATTRS) {
                const gross = spendableForAttr(attr);
                const reserved = this.#reservedStonesInDialogForAttr(attr);
                sum += Math.max(0, gross - reserved);
            }
            return sum;
        };
        const canAffordGenericNextCost = (cost) => hasCombat && ALL_STONE_ATTRS.some((a) => getStonePool(this.actor, a).current >= cost);
        const preparePowerData = (power, attrKey) => {
            /** Wie im Drop-Handler: `getStoneUsageCount(..., combat)` — auch wenn `combat` null (dann Runde 1 / Zug 0). Nicht `combat ? … : 0`, sonst anderer accKey als beim Drop. */
            const usesThisTurn = getStoneUsageCount(this.actor, attrKey, power.id, combat);
            const nextCost = calculateStoneCost(usesThisTurn);
            const pool = getStonePool(this.actor, attrKey);
            const canAfford = pool.current >= nextCost && hasCombat;
            const gross = spendableForAttr(attrKey);
            const reserved = this.#reservedStonesInDialogForAttr(attrKey);
            const spendableNet = Math.max(0, gross - reserved);
            const description = power.description || power.effect || '';
            const accKey = `${power.id}:${attrKey}:${usesThisTurn}`;
            const occupied = this.#stoneOccGet(accKey);
            const gem = getStoneGemStyle(attrKey);
            const laneSegs = buildStonePaymentLanes(usesThisTurn, spendableNet, nextCost, stonePlanLocked, occupied, `${power.id}/${attrKey}`);
            return {
                id: power.id,
                name: power.name,
                description,
                attribute: power.attribute,
                nextCost,
                canAfford,
                selectedAttrKey: attrKey,
                usesThisTurn,
                slotGemStyle: gem ?? { fill: '#888888', stroke: '#aaaaaa' },
                ...laneSegs
            };
        };
        const resolveGenericAttrAndStats = (powerId) => {
            const usesThisTurn = getGenericStonePowerUsageCount(this.actor, powerId, combat);
            let attrKey = null;
            for (const [accKey, lanes] of this._stoneDropAccumulators) {
                if (!lanes?.length || !accKey.startsWith(`${powerId}:`))
                    continue;
                const rest = accKey.slice(powerId.length + 1);
                const i = rest.lastIndexOf(':');
                if (i <= 0)
                    continue;
                const tierUses = Number(rest.slice(i + 1));
                if (tierUses !== usesThisTurn)
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
            const nextCost = calculateStoneCost(usesThisTurn);
            const spendable = spendableForAttr(attrKey);
            this._generalAttrSelection[powerId] = attrKey;
            return { attrKey, usesThisTurn, spendable, nextCost };
        };
        // Separate generic and attribute-specific powers
        const genericPowers = availablePowers.filter(p => p.attribute === 'generic');
        const attributeSpecificPowers = availablePowers.filter(p => p.attribute !== 'generic');
        const generalPowers = genericPowers.map((power) => {
            const { attrKey, usesThisTurn, nextCost } = resolveGenericAttrAndStats(power.id);
            const canAfford = canAffordGenericNextCost(nextCost);
            const description = power.description || power.effect || '';
            const spendableNet = totalSpendableNetAllPools();
            const occupied = this.#stoneOccGet(`${power.id}:${attrKey}:${usesThisTurn}`);
            const gem = getStoneGemStyle(attrKey);
            const sp = STONE_POWERS[power.id];
            const laneSegs = buildStonePaymentLanes(usesThisTurn, spendableNet, nextCost, stonePlanLocked, occupied, `${power.id}/general`);
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
                slotGemStyle: gem ?? { fill: '#888888', stroke: '#aaaaaa' },
                ...laneSegs
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
        const spendableNetAllPoolsCached = totalSpendableNetAllPools();
        if (DEBUG_STONE_PAYMENT) {
            const poolSnapPay = this.#debugPaymentNetwork();
            dlogStonePayment('_prepareContext snapshot', {
                stonePlanLocked,
                combatRound: combat?.round,
                combatTurn: combat?.turn,
                hasCombat,
                totalSpendableNetAllPools: spendableNetAllPoolsCached,
                poolNetByAttr: poolSnapPay.perAttr,
                generics: generalPowers.map((p) => {
                    const occ = this.#stoneOccGet(`${p.id}:${p.selectedAttrKey}:${p.usesThisTurn}`);
                    const allowed = allowedPaymentDropLanes(occ, p.nextCost);
                    return {
                        id: p.id,
                        payAttr: p.selectedAttrKey,
                        usesThisTurn: p.usesThisTurn,
                        nextCost: p.nextCost,
                        accKey: `${p.id}:${p.selectedAttrKey}:${p.usesThisTurn}`,
                        occupied: [...occ].sort((a, b) => a - b),
                        allowedLanes: [...allowed].sort((a, b) => a - b),
                        lane012: [
                            p.paymentAnchor?.[0]?.state,
                            p.paymentMid?.[0]?.state,
                            p.paymentMid?.[1]?.state
                        ],
                        whyLane1: explainLaneInactiveReason(1, occ, allowed, spendableNetAllPoolsCached, stonePlanLocked, p.nextCost),
                        whyLane2: explainLaneInactiveReason(2, occ, allowed, spendableNetAllPoolsCached, stonePlanLocked, p.nextCost)
                    };
                })
            });
        }
        if (DEBUG_STONE_LANES) {
            const accDump = Object.fromEntries([...this._stoneDropAccumulators.entries()].map(([k, v]) => [k, [...v].sort((a, b) => a - b)]));
            dlogStoneLanes('_prepareContext', {
                hasCombat,
                combatMissingFromTracker,
                combatRound: combat?.round,
                combatTurn: combat?.turn,
                stonePlanLocked,
                totalSpendableNetAllPools: spendableNetAllPoolsCached,
                accumulators: accDump,
                generalPowersPreview: generalPowers.map((p) => {
                    const occ = this.#stoneOccGet(`${p.id}:${p.selectedAttrKey}:${p.usesThisTurn}`);
                    const allowed = allowedPaymentDropLanes(occ, p.nextCost);
                    return {
                        id: p.id,
                        attr: p.selectedAttrKey,
                        usesThisTurn: p.usesThisTurn,
                        nextCost: p.nextCost,
                        accKey: `${p.id}:${p.selectedAttrKey}:${p.usesThisTurn}`,
                        lane0state: p.paymentAnchor?.[0]?.state,
                        lane1state: p.paymentMid?.[0]?.state,
                        lane2state: p.paymentMid?.[1]?.state,
                        occupied: [...occ].sort((a, b) => a - b),
                        allowedLanes: [...allowed].sort((a, b) => a - b),
                        whyLane1: explainLaneInactiveReason(1, occ, allowed, spendableNetAllPoolsCached, stonePlanLocked, p.nextCost),
                        whyLane2: explainLaneInactiveReason(2, occ, allowed, spendableNetAllPoolsCached, stonePlanLocked, p.nextCost),
                        occMatchInMap: accDump[`${p.id}:${p.selectedAttrKey}:${p.usesThisTurn}`] ?? null
                    };
                })
            });
        }
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
        this.#pullSessionPartialsIntoInstance();
        const root = getStonePowersContentRoot(this);
        if (!root) {
            console.warn('Mastery System | StonePowersDialog: kein Content-Root für Event-Handler');
            return;
        }
        const appWindow = this.element ?? root;
        this.#bindStoneDragAndDrop(root, appWindow);
        this.#reconcileFilledLaneClasses(appWindow);
        this.#syncAccumulatorGems(appWindow);
        if (DEBUG_STONE_LANES)
            this.#logStoneLanesDom(appWindow);
        const savePrefsBtn = root.querySelector('.js-save-stone-prefs');
        if (savePrefsBtn) {
            savePrefsBtn.onclick = async (ev) => {
                ev.preventDefault();
                if (savePrefsBtn.classList.contains('is-disabled'))
                    return;
                await this.#saveStonePowersPrefs(root);
            };
        }
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
    /** Debug/Diagnose: Pool brutto, reserviert im Dialog, netto — pro Attribut + Summe. */
    #debugPaymentNetwork() {
        this.#pullSessionPartialsIntoInstance();
        const system = this.actor.system;
        const stonePools = system?.stonePools || {};
        const perAttr = {};
        let totalNet = 0;
        for (const attr of ALL_STONE_ATTRS) {
            const pool = stonePools[attr];
            const current = pool?.current ?? pool?.value ?? 0;
            const sustained = pool?.sustained ?? 0;
            const gross = Math.max(0, (Number(current) || 0) - (Number(sustained) || 0));
            const reserved = this.#reservedStonesInDialogForAttr(attr);
            const net = Math.max(0, gross - reserved);
            perAttr[attr] = { gross, reserved, net };
            totalNet += net;
        }
        return { totalNet, perAttr };
    }
    /** Drop auf slot-locked: vollständige Zahlungs-Sicht für Konsole. */
    #slotInactiveDropDiag(slot) {
        this.#pullSessionPartialsIntoInstance();
        const combat = game.combat;
        const powerId = slot.dataset.powerId ||
            slot.closest('.power-drop-slots')?.dataset.powerId ||
            '';
        const isGeneric = slot.dataset.isGeneric === 'true' || slot.getAttribute('data-is-generic') === 'true';
        const laneRaw = slot.dataset.laneIndex;
        const laneIndex = laneRaw !== undefined && laneRaw !== '' ? Number(laneRaw) : NaN;
        const planLocked = !!(combat && this.combatant && isStonePowersConfigurationLocked(this.actor, combat));
        let payAttr = (slot.dataset.payAttribute || '');
        if (isGeneric && powerId) {
            if (!payAttr) {
                for (const [k] of this._stoneDropAccumulators) {
                    if (!k.startsWith(`${powerId}:`))
                        continue;
                    const parsed = this.#parseAccKeyPayAttr(k);
                    if (parsed) {
                        payAttr = parsed;
                        break;
                    }
                }
            }
            if (!payAttr)
                payAttr = this._generalAttrSelection[powerId] || '';
        }
        if (!powerId) {
            return { error: 'no_powerId', laneIndex, classList: Array.from(slot.classList) };
        }
        if (!isGeneric && !payAttr) {
            return { error: 'no_payAttr', powerId, isGeneric, laneIndex, classList: Array.from(slot.classList) };
        }
        const uses = isGeneric
            ? getGenericStonePowerUsageCount(this.actor, powerId, combat ?? null)
            : getStoneUsageCount(this.actor, payAttr, powerId, combat ?? null);
        const nextCost = calculateStoneCost(uses);
        const accKey = `${powerId}:${payAttr}:${uses}`;
        const occ = this.#stoneOccGet(accKey);
        const allowed = allowedPaymentDropLanes(occ, nextCost);
        const { totalNet, perAttr } = this.#debugPaymentNetwork();
        const spendableNet = isGeneric ? totalNet : Math.max(0, perAttr[payAttr]?.net ?? 0);
        const why = Number.isFinite(laneIndex)
            ? explainLaneInactiveReason(laneIndex, occ, allowed, spendableNet, planLocked, nextCost)
            : 'ungültige_laneIndex';
        return {
            powerId,
            isGeneric,
            payAttr,
            laneIndex,
            usesThisTurn: uses,
            nextCost,
            accKey,
            occupied: [...occ].sort((a, b) => a - b),
            allowedLanes: [...allowed].sort((a, b) => a - b),
            spendableNet,
            spendableNetAllPools: totalNet,
            perAttrPoolNet: perAttr,
            stonePlanLocked: planLocked,
            classList: Array.from(slot.classList),
            whyInactive: why
        };
    }
    /** Gleicher Owner wie Stein-Nutzung (unverlinkter Token → Prototyp-Actor). */
    #stoneLaneOwnerActorId() {
        const owner = getActionEconomyActor(this.actor) ?? this.actor;
        return String(owner?.id ?? '');
    }
    #sessionLaneCompositeKey(accKey) {
        return `${this.#stoneLaneOwnerActorId()}\0${accKey}`;
    }
    /** Stellt den Akku aus dem sessionweiten Backup wieder her (wichtig nach jedem render). */
    #pullSessionPartialsIntoInstance() {
        const aid = this.#stoneLaneOwnerActorId();
        if (!aid)
            return;
        const prefix = `${aid}\0`;
        for (const [composite, lanes] of _a._sessionStoneLanes) {
            if (!composite.startsWith(prefix) || !lanes?.length)
                continue;
            const accKey = composite.slice(prefix.length);
            this._stoneDropAccumulators.set(accKey, [...lanes].sort((a, b) => a - b));
        }
    }
    #stoneOccGet(accKey) {
        const v = this._stoneDropAccumulators.get(accKey);
        if (v?.length)
            return [...v].sort((a, b) => a - b);
        const sk = this.#sessionLaneCompositeKey(accKey);
        const fromS = _a._sessionStoneLanes.get(sk);
        if (fromS?.length) {
            const sorted = [...fromS].sort((a, b) => a - b);
            this._stoneDropAccumulators.set(accKey, sorted);
            return sorted;
        }
        return [];
    }
    #stoneOccSet(accKey, lanes) {
        const sk = this.#sessionLaneCompositeKey(accKey);
        if (!lanes.length) {
            this._stoneDropAccumulators.delete(accKey);
            _a._sessionStoneLanes.delete(sk);
        }
        else {
            const sorted = [...lanes].sort((a, b) => a - b);
            this._stoneDropAccumulators.set(accKey, sorted);
            _a._sessionStoneLanes.set(sk, sorted);
        }
        if (DEBUG_STONE_LANES) {
            dlogStoneLanes('stoneOccSet', {
                accKey,
                sk,
                lanes: [...lanes].sort((a, b) => a - b),
                instanceKeys: [...this._stoneDropAccumulators.keys()],
                sessionSize: _a._sessionStoneLanes.size
            });
        }
    }
    #clearSessionStoneLanesForOwner() {
        const aid = this.#stoneLaneOwnerActorId();
        if (!aid)
            return;
        const prefix = `${aid}\0`;
        for (const k of [..._a._sessionStoneLanes.keys()]) {
            if (k.startsWith(prefix))
                _a._sessionStoneLanes.delete(k);
        }
        this._stoneDropAccumulators.clear();
    }
    /** Nur bei CONFIG.masterySystemDebugStoneLanes: Lane 0–2 Klassen im gerenderten DOM. */
    #logStoneLanesDom(root) {
        const rows = [];
        root.querySelectorAll('.ms-stone-drop-slot[data-lane-index]').forEach((el) => {
            const he = el;
            const lane = he.dataset.laneIndex ?? '';
            if (lane !== '0' && lane !== '1' && lane !== '2')
                return;
            rows.push({
                powerId: he.dataset.powerId ?? '',
                lane,
                slotClasses: Array.from(he.classList).filter((c) => c.startsWith('slot-'))
            });
        });
        dlogStoneLanes('DOM nach sync (Lanes 0–2)', { rowCount: rows.length, rows });
    }
    #reservedStonesInDialogForAttr(attr) {
        this.#pullSessionPartialsIntoInstance();
        let sum = 0;
        for (const [accKey, lanes] of this._stoneDropAccumulators) {
            if (!lanes?.length)
                continue;
            if (this.#parseAccKeyPayAttr(accKey) === attr)
                sum += lanes.length;
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
    /** Zeigt Steine in `slot-filled`-Zellen (ein Stein pro Feld, zurück zum Pool ziehbar). */
    #syncAccumulatorGems(root) {
        const combat = game.combat;
        const locked = !!(combat && this.combatant && isStonePowersConfigurationLocked(this.actor, combat));
        const allowReturnDrag = !locked;
        root.querySelectorAll('.ms-stone-slot-fill .ms-slot-gem-partial').forEach((n) => n.remove());
        this.#pullSessionPartialsIntoInstance();
        for (const [accKey, lanes] of this._stoneDropAccumulators) {
            if (!lanes?.length)
                continue;
            const fc = accKey.indexOf(':');
            if (fc < 0)
                continue;
            const powerId = accKey.slice(0, fc);
            const payAttrRaw = this.#parseAccKeyPayAttr(accKey);
            if (!payAttrRaw)
                continue;
            const payAttr = payAttrRaw;
            const esc = escapeAttrValueInCssSelector(powerId);
            const style = getStoneGemStyle(payAttr);
            const fillC = style?.fill ?? '#888888';
            const strokeC = style?.stroke ?? '#aaaaaa';
            for (const lane of [...lanes].sort((a, b) => a - b)) {
                let slot = root.querySelector(`.ms-stone-drop-slot.slot-filled[data-power-id="${esc}"][data-lane-index="${lane}"]`);
                if (!slot) {
                    slot = root.querySelector(`.ms-stone-drop-slot.slot-active[data-power-id="${esc}"][data-lane-index="${lane}"]`);
                }
                if (!slot) {
                    dlogStoneDnD('syncAccumulatorGems: kein Ziel-Slot', {
                        powerId,
                        lane,
                        lanes,
                        hint: 'fehlendes render() oder data-power-id / data-lane-index'
                    });
                    if (DEBUG_STONE_LANES) {
                        const byPid = root.querySelectorAll(`[data-power-id="${esc}"]`).length;
                        const byLane = root.querySelectorAll(`[data-lane-index="${lane}"]`).length;
                        dlogStoneLanes('syncAccumulatorGems: Selector-Miss', {
                            esc,
                            powerId,
                            lane,
                            nodesWithPowerId: byPid,
                            nodesWithLaneIndex: byLane
                        });
                    }
                    continue;
                }
                const fill = slot.querySelector('.ms-stone-slot-fill');
                if (!fill)
                    continue;
                const gem = document.createElement('span');
                gem.className = 'ms-stone-gem-chip ms-slot-gem-partial js-stone-returnable';
                gem.setAttribute('data-acc-key', accKey);
                gem.setAttribute('data-lane-index', String(lane));
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
     * Nach Template-Render: belegte Lanes am DOM kennzeichnen (slot-filled), falls Kontext/Theme abweicht.
     * Verwendet dieselben data-Attribute wie das HBS; Werte wie bei #syncAccumulatorGems escapen.
     */
    #reconcileFilledLaneClasses(root) {
        this.#pullSessionPartialsIntoInstance();
        for (const [accKey, lanes] of this._stoneDropAccumulators) {
            if (!lanes?.length)
                continue;
            const fc = accKey.indexOf(':');
            if (fc < 0)
                continue;
            const powerId = accKey.slice(0, fc);
            const attrEsc = escapeAttrValueInCssSelector(powerId);
            for (const lane of lanes) {
                const el = root.querySelector(`.ms-stone-drop-slot[data-power-id="${attrEsc}"][data-lane-index="${lane}"]`);
                if (!el)
                    continue;
                el.classList.remove('slot-active', 'slot-locked');
                el.classList.add('slot-filled');
                el.style.setProperty('background', 'rgba(76, 175, 80, 0.28)', 'important');
                el.style.setProperty('border-color', 'rgba(102, 187, 106, 0.95)', 'important');
            }
        }
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
            bindTarget.querySelectorAll('.ms-stone-drop-slot.is-drag-over').forEach((n) => {
                clearStoneSlotDragOverVisual(n);
            });
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
                        bindTarget.querySelectorAll('.ms-stone-drop-slot.is-drag-over').forEach((n) => {
                            clearStoneSlotDragOverVisual(n);
                        });
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
            const slot = resolveMsStoneDropSlotUnderPointer(ev, bindTarget) ?? resolveDropSlot(ev, false);
            if (!slot?.classList.contains('slot-active')) {
                clearDragOver();
                return;
            }
            ev.preventDefault();
            if (ev.dataTransfer)
                ev.dataTransfer.dropEffect = 'copy';
            clearDragOver();
            applyStoneSlotDragOverVisual(slot);
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
            this.#pullSessionPartialsIntoInstance();
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
                const occ = this.#stoneOccGet(accKeyReturn);
                if (!occ.length) {
                    dlogStoneReturn('abort: Akku schon leer', { accKeyReturn });
                    return;
                }
                const laneRm = this._stoneReturnLane;
                let nextOcc;
                if (laneRm != null && occ.includes(laneRm)) {
                    nextOcc = occ.filter((l) => l !== laneRm);
                }
                else {
                    const hi = Math.max(...occ);
                    nextOcc = occ.filter((l) => l !== hi);
                }
                this.#stoneOccSet(accKeyReturn, nextOcc);
                dlogStoneReturn('OK: Stein zurück im Pool (Lane entfernt)', {
                    accKeyReturn,
                    laneRm,
                    nextOcc
                });
                this.#syncAccumulatorGems(bindTarget);
                await this.render({ force: true });
                return;
            }
            const slot = resolveMsStoneDropSlotUnderPointer(ev, bindTarget) ?? resolveDropSlot(ev, true);
            if (!slot) {
                const doc = (ev.view?.document ?? (typeof document !== 'undefined' ? document : null));
                let underStack = [];
                try {
                    if (doc?.elementsFromPoint) {
                        underStack = doc.elementsFromPoint(ev.clientX, ev.clientY).slice(0, 10).map((e) => {
                            const h = e;
                            return `${h.tagName}.${(h.className?.toString?.() || '').slice(0, 72)}`;
                        });
                    }
                }
                catch {
                    /* ignore */
                }
                console.warn('Mastery System | [StonePayment] Drop ohne erkanntes Ablagefeld', {
                    clientX: ev.clientX,
                    clientY: ev.clientY,
                    elementsFromPoint: underStack
                });
                dlogStoneDnD('drop abort: kein Slot (resolveDropSlot null)', { elementsFromPoint: underStack });
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
                const inactiveDiag = this.#slotInactiveDropDiag(slot);
                console.warn('Mastery System | [StonePayment] Drop abgelehnt (Feld nicht slot-active)', inactiveDiag);
                dlogStoneDnD('drop abort: Slot nicht slot-active', inactiveDiag);
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
                for (const [k, lanes] of this._stoneDropAccumulators) {
                    if (!lanes?.length || !k.startsWith(`${powerId}:`))
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
            const uses = isGeneric
                ? getGenericStonePowerUsageCount(this.actor, powerId, combat)
                : getStoneUsageCount(this.actor, payAttr, powerId, combat);
            const nextCost = calculateStoneCost(uses);
            const accKey = `${powerId}:${payAttr}:${uses}`;
            const laneRaw = slot.dataset.laneIndex;
            const laneIndex = laneRaw !== undefined && laneRaw !== '' ? Number(laneRaw) : NaN;
            if (!Number.isFinite(laneIndex)) {
                dlogStoneDnD('drop abort: keine gültige data-lane-index', { laneRaw });
                return;
            }
            const occ = this.#stoneOccGet(accKey);
            if (occ.length >= nextCost) {
                dlogStoneDnD('drop abort: Zahlung schon voll', { accKey, occ, nextCost });
                return;
            }
            if (occ.includes(laneIndex)) {
                dlogStoneDnD('drop abort: Lane schon belegt', { laneIndex, occ });
                return;
            }
            if (!allowedPaymentDropLanes(occ, nextCost).has(laneIndex)) {
                dlogStoneDnD('drop abort: Lane nicht als Nächstes erlaubt', { laneIndex, occ, nextCost });
                return;
            }
            const nextOcc = [...occ, laneIndex];
            this.#stoneOccSet(accKey, nextOcc);
            const paid = nextOcc.length;
            this.#reconcileFilledLaneClasses(bindTarget);
            this.#syncAccumulatorGems(bindTarget);
            dlogStoneDnD('drop Lane+1', { accKey, laneIndex, paid, nextCost, partial: paid < nextCost });
            if (DEBUG_STONE_LANES) {
                dlogStoneLanes('drop angenommen', { accKey, uses, laneIndex, nextOcc, nextCost, isGeneric });
            }
            if (paid < nextCost) {
                await this.render({ force: true });
                return;
            }
            /**
             * Letzter Stein der Zahlung: ohne render bleiben Slots `slot-active`, während #syncPoolGemChips
             * den Chip schon abzieht → Stein „verschwindet“. Immer neu rendern bevor Übung/Kampf-Abbruch.
             */
            await this.render({ force: true });
            if (!canExecute) {
                dlogStoneDnD('drop Ende Übung: canExecute false (kein Kampf/Tracker)', {
                    canExecute,
                    accKey,
                    paid,
                    nextCost,
                    note: 'Akku bleibt; Felder sollten slot-filled + Teil-Steine zeigen'
                });
                return;
            }
            const paidSnapshot = [...nextOcc];
            this.#stoneOccSet(accKey, []);
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
                    this.#stoneOccSet(accKey, paidSnapshot);
                    this.#syncAccumulatorGems(bindTarget);
                    await this.render({ force: true });
                    ui.notifications?.warn('Aktivierung fehlgeschlagen.');
                }
            }
            catch (error) {
                console.error('Mastery System | stone drop activate', error);
                this.#stoneOccSet(accKey, paidSnapshot);
                this.#syncAccumulatorGems(bindTarget);
                await this.render({ force: true });
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
            const lr = t.getAttribute('data-lane-index') ?? t.dataset.laneIndex ?? '';
            const ln = lr !== '' ? Number(lr) : NaN;
            this._stoneReturnLane = Number.isFinite(ln) ? ln : null;
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
                this._stoneReturnLane = null;
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
        this.#clearSessionStoneLanesForOwner();
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
_a = StonePowersDialog;
//# sourceMappingURL=stone-powers-dialog.js.map