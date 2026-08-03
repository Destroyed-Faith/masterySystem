/**
 * Stone Powers Dialog — Steine pro Macht in Segmenten (1→2→4→8) verteilen.
 * Voll bezahlte Wellen werden beim Schließen des Dialogs abgerechnet (Pools, RoundState, Radial); beim Klick/Drop bleiben Steine in den Slots.
 */
var _a;
const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;
// Type workaround for Mixin
const BaseDialog = HandlebarsApplicationMixin(ApplicationV2);
import { STONE_POWERS, getAvailableStonePowers, activateStonePower, activateGenericStonePowerMixed } from './stone-activation.js';
import { STONE_POWERS_BY_ATTRIBUTE, stonePowerSkipsFirstTier } from './stone-powers.js';
import { getStoneUsageCount, getGenericStonePowerUsageCount, calculateStoneCost, getStonePool, isStonePowersConfigurationLocked, getActionEconomyActor } from '../combat/action-economy.js';
import { getStoneGemStyle } from '../utils/stone-attribute-ui.js';
import { poolSpendableStones } from '../utils/artifact-actor-rules.js';
import { countArtifactActivationStones } from '../utils/artifact-stone-bound.js';
import { getArtifactStoneFunctionStatus } from '../utils/artifact-stone-functions.js';
import { refreshRadialMenuActionLabelsIfOpenForActor } from '../token-radial-menu.js';
import { STONE_RITUALS_CATALOG } from './rituals-catalog.js';
import { deleteSummonActor } from './familiar-actor-factory.js';
import { dissolveSummonBond, getSummonBondsFromActor, tokensSummary, } from './summon-bond-bind.js';
import { SummonBondDialog } from './summon-bond-dialog.js';
import { summonTokensFromStones } from './summon-bond-rules.js';
const STONE_DRAG_MIME = 'application/x-mastery-stone-attribute';
const STONE_RETURN_MIME = 'application/x-mastery-stone-return-acc';
/** Physische Zahlungs-Lanes im Cluster: 1 + 2 + 4 + 8. */
const STONE_PAYMENT_LANE_COUNT = 15;
/** Segment-Index für Lane: 0=Anchor(1), 1=Mid(2), 2=Quad(4), 3=Oct(8). */
function segmentIndexForLane(laneIndex) {
    if (laneIndex === 0)
        return 0;
    if (laneIndex <= 2)
        return 1;
    if (laneIndex <= 6)
        return 2;
    return 3;
}
/** Segment vollständig belegt (Voraussetzung für das nächste Segment). */
function isStoneSegmentComplete(o, seg) {
    if (seg === 0)
        return o.has(0);
    if (seg === 1)
        return o.has(1) && o.has(2);
    if (seg === 2)
        return [3, 4, 5, 6].every((l) => o.has(l));
    if (seg === 3)
        return [7, 8, 9, 10, 11, 12, 13, 14].every((l) => o.has(l));
    return false;
}
/** Leere Lane darf einen Stein annehmen (Segment-Freigabe 1 → 2 → 4 → 8). */
function isLaneAllowedBySegmentUnlock(occupied, laneIndex) {
    if (laneIndex < 0 || laneIndex >= STONE_PAYMENT_LANE_COUNT)
        return false;
    const o = new Set(occupied);
    if (o.has(laneIndex))
        return false;
    const seg = segmentIndexForLane(laneIndex);
    for (let s = 0; s < seg; s++) {
        if (!isStoneSegmentComplete(o, s))
            return false;
    }
    return true;
}
/** Alle leeren Lanes, die aktuell dropfähig sind. */
function allowedSegmentDropLanes(occupied) {
    const set = new Set();
    for (let l = 0; l < STONE_PAYMENT_LANE_COUNT; l++) {
        if (isLaneAllowedBySegmentUnlock(occupied, l))
            set.add(l);
    }
    return set;
}
/** Lane-Indizes pro Segment: 0=1, 1=2, 2=4, 3=8. */
function lanesInStonePaymentSegment(segmentIndex) {
    if (segmentIndex === 0)
        return [0];
    if (segmentIndex === 1)
        return [1, 2];
    if (segmentIndex === 2)
        return [3, 4, 5, 6];
    if (segmentIndex === 3)
        return [7, 8, 9, 10, 11, 12, 13, 14];
    return [];
}
/**
 * Niedrigstes Segment mit freien Lanes, sobald alle vorherigen Segmente voll sind.
 * Ein Linksklick füllt nur dieses Segment (teilweise, wenn der Pool nicht reicht).
 */
function nextStoneSegmentToFill(occupied) {
    const o = new Set(occupied);
    for (let seg = 0; seg <= 3; seg++) {
        if (isStoneSegmentComplete(o, seg))
            continue;
        for (let s = 0; s < seg; s++) {
            if (!isStoneSegmentComplete(o, s))
                return null;
        }
        return seg;
    }
    return null;
}
/**
 * Some powers have a no-op Tier 1 "ramp step" (e.g. Extra Attack), so their
 * first real activation is Tier 2 = the Mid segment (2 stones). Such powers
 * skip the leading segment(s): the Anchor renders disabled and the first
 * payable wave is the Mid segment.
 */
function rampSkipSegmentsForPower(powerId) {
    return stonePowerSkipsFirstTier(powerId) ? 1 : 0;
}
/** Lane indices of the leading segments skipped by a ramp power (e.g. [0]). */
function rampSkipLeadLanes(powerId) {
    const segs = rampSkipSegmentsForPower(powerId);
    if (segs <= 0)
        return [];
    const lanes = [];
    for (let s = 0; s < segs; s++)
        lanes.push(...lanesInStonePaymentSegment(s));
    return lanes;
}
/** Occupied lanes augmented with skipped lead lanes (for segment-unlock only). */
function occWithRampSkip(occupied, powerId) {
    const lead = rampSkipLeadLanes(powerId);
    return lead.length ? [...occupied, ...lead] : occupied;
}
/** Fallback wenn getData im Drop leer bleibt (z. B. Chromium/Foundry) */
let msLastDraggedStoneAttribute = '';
/** Mittelteil im Akku-Schlüssel: General Powers mit Steinen aus mehreren Attribut-Pools. */
const STONE_GENERIC_UNIFIED_MARKER = 'msGenMulti';
/** Actor-Flag: gespeicherter Steinplan pro Kampf/Runde (Kampf · Runde 1 „Speichern“). */
const STONE_POWERS_ROUND_PLAN_FLAG = 'stonePowersRoundPlan';
/** `powerId:middle:uses` — powerId darf Punkte (und künftig Doppelpunkte) enthalten. */
function parseStonePowerAccKey(accKey) {
    const j = accKey.lastIndexOf(':');
    if (j <= 0)
        return null;
    const uses = Number(accKey.slice(j + 1));
    if (!Number.isFinite(uses))
        return null;
    const rest = accKey.slice(0, j);
    const i = rest.lastIndexOf(':');
    if (i <= 0)
        return null;
    return { powerId: rest.slice(0, i), middle: rest.slice(i + 1), uses };
}
function stonePowerAccKeyPowerId(accKey) {
    return parseStonePowerAccKey(accKey)?.powerId ?? null;
}
function accKeyPayAttrSegment(accKey) {
    return parseStonePowerAccKey(accKey)?.middle ?? null;
}
function accKeyUsesSegment(accKey) {
    const p = parseStonePowerAccKey(accKey);
    return p != null && Number.isFinite(p.uses) ? p.uses : null;
}
function isGenericUnifiedAccKey(accKey) {
    return accKeyPayAttrSegment(accKey) === STONE_GENERIC_UNIFIED_MARKER;
}
function genericUnifiedAccKey(powerId, uses) {
    return `${powerId}:${STONE_GENERIC_UNIFIED_MARKER}:${uses}`;
}
function isGenericLaneOccArray(v) {
    const x = v[0];
    return x !== undefined && typeof x === 'object' && x !== null && 'lane' in x;
}
const ALL_STONE_ATTRS = [
    'might',
    'agility',
    'vitality',
    'intellect',
    'resolve',
    'influence'
];
/** Pools shown in the dialog (core six + optional Wits if the actor has a wits pool). */
const POOL_DISPLAY_ATTRS = [...ALL_STONE_ATTRS, 'wits'];
function poolDisplayName(key) {
    if (key === 'wits')
        return 'Wits';
    return key.charAt(0).toUpperCase() + key.slice(1);
}
function getActorStonePoolKeysWithMax(actor) {
    const owner = getActionEconomyActor(actor) ?? actor;
    const sp = (owner.system?.stonePools || {});
    const keys = new Set();
    for (const k of POOL_DISPLAY_ATTRS) {
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
/**
 * Lanes pre-filled by Artifact Support Stones for a Stone Power Support of
 * `prefillTier` (2..4).
 *
 * The support covers the tier's wave cost (2^(tier-1) stones) and sits
 * directly above the anchor: tier 2 → lanes [1,2], tier 3 → [1..4],
 * tier 4 → [1..8]. The player still primes the power by dropping a single
 * own stone into the anchor (lane 0); the support lanes are decorative and
 * are not part of the player `occupied` set. Returns `undefined` when there
 * is no support or it is no longer available this turn.
 */
function buildSupportLaneSet(prefillTier, usesThisTurn) {
    if (!(prefillTier >= 2))
        return undefined;
    // The support only applies to the very first activation of the power this turn.
    if (usesThisTurn !== 0)
        return undefined;
    const count = Math.min(STONE_PAYMENT_LANE_COUNT - 1, Math.pow(2, prefillTier - 1));
    const set = new Set();
    for (let i = 1; i <= count; i++)
        set.add(i);
    return set;
}
/**
 * UI/Drop: Segment-Freigabe — erst Anchor (1), nach Stein die beiden Mitten (2), dann Quad (4), dann Oct (8).
 * Innerhalb eines freigeschalteten Segments beliebige leere Lane; Reihenfolge innerhalb Mid/Quad/Oct frei.
 */
function buildStonePaymentLanes(usesThisTurn, spendableNet, planLocked, occupied, debugLabel, supportLanes, leadLockedLanes) {
    const o = new Set(occupied);
    const leadLocked = new Set(leadLockedLanes ?? []);
    // Ramp powers (no Tier 1) treat their leading segment as already satisfied so
    // the next segment unlocks immediately; those lanes are disabled, not payable.
    const allowed = allowedSegmentDropLanes(leadLocked.size ? [...occupied, ...leadLocked] : occupied);
    const laneState = (laneIndex) => {
        if (laneIndex < 0 || laneIndex >= STONE_PAYMENT_LANE_COUNT)
            return 'locked';
        if (o.has(laneIndex))
            return 'filled';
        // Disabled lead lane of a ramp power (e.g. Extra Attack Tier 1): greyed,
        // not droppable — the player must start in the next (Tier 2) segment.
        if (leadLocked.has(laneIndex))
            return 'disabled';
        // Artifact "Stone Power Support" pre-fills lanes above the anchor with
        // Artifact Support Stones (free, artifact-provided). They are purely
        // visual: not in the `occupied` player set, so they never participate in
        // segment-unlock or settle.
        if (supportLanes?.has(laneIndex))
            return 'support';
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
     * Schlüssel: `${ownerActorId}\\0${powerId}:${attr}:${uses}` oder unified `...:msGenMulti:${uses}`
     */
    static _sessionStoneLanes = new Map();
    actor;
    combatant;
    resolve;
    _generalAttrSelection = {}; // Track selected attribute per generic power
    _stonePowersMainTab = 'combat';
    /** Fixed-cost ritual slots: ritual id → placed stone attribute per slot (null = empty). */
    _ritualStonePlacements = new Map();
    /** Belegte Lanes: Attribut-Macht `number[]`; General `GenericLaneOcc[]` unter `genericUnifiedAccKey`. */
    _stoneDropAccumulators = new Map();
    /** Lane des Steins bei Rückzug Pool←Feld (dragstart). */
    _stoneReturnLane = null;
    /** Entfernt Root‑Listener von #bindStoneDragAndDrop (bei jedem Render neu binden). */
    _stoneDndCleanup;
    /** Attribut des aktuellen Zugs — Foundry/Electron liefert oft kein dataTransfer.getData beim drop. */
    _stoneDragAttribute = null;
    /** Akku-Schlüssel beim Ziehen eines Steins aus dem Feld zurück in den Pool. */
    _stoneReturnAccKey = null;
    /** Pool-Zeile für Rückgabe (bei General-Multi aus data-return-attribute-key). */
    _stoneReturnPoolAttr = null;
    /** Verhindert, dass jeder Render den Session-Steinplan aus dem Flag neu überschreibt (ungespeicherte UI ging verloren). */
    _stoneRoundPlanHydratedKey = null;
    /** Scroll im Dialog-Inhalt vor Re-Render merken (Stein setzen sonst springt nach oben). */
    _stonePowersContentScrollTop = 0;
    static DEFAULT_OPTIONS = {
        id: "mastery-stone-powers",
        classes: ["mastery-system", "stone-powers-dialog"],
        position: { width: 980, height: 680 },
        window: { title: 'Stone Powers', resizable: true }
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
        const prefs = (getActionEconomyActor(actor) ?? actor).system?.stonePowersPrefs;
        if (prefs?.useDefaultsEachRound && prefs.defaultAttributesByPowerId) {
            for (const [powerId, attr] of Object.entries(prefs.defaultAttributesByPowerId)) {
                if (typeof attr === 'string') {
                    this._generalAttrSelection[powerId] = attr;
                }
            }
        }
    }
    #ritualEnsureSlots(entry) {
        this.#pullSessionPartialsIntoInstance();
        let arr = this._ritualStonePlacements.get(entry.id);
        if (!arr || arr.length !== entry.slots.length) {
            arr = Array(entry.slots.length).fill(null);
            this._ritualStonePlacements.set(entry.id, arr);
        }
        return arr;
    }
    /** Erstes erlaubtes Attribut mit mindestens einem freien Pool-Stein (Reihenfolge wie im Ritual-Katalog). */
    #firstSpendableRitualAttr(allowed) {
        this.#pullSessionPartialsIntoInstance();
        const poolKeys = getActorStonePoolKeysWithMax(this.actor);
        for (const a of allowed) {
            if (!poolKeys.has(a))
                continue;
            if (this.#spendableNetForAttr(a) >= 1)
                return a;
        }
        return null;
    }
    /** Leeres Ritual-Feld per Klick mit dem nächsten passenden Stein füllen (wie Drop, ohne Drag). */
    async #autoFillRitualSlot(ritualId, slotIndex) {
        this.#pullSessionPartialsIntoInstance();
        const entry = STONE_RITUALS_CATALOG.find((r) => r.id === ritualId);
        if (!entry || slotIndex < 0 || slotIndex >= entry.slots.length)
            return;
        const placed = this.#ritualEnsureSlots(entry);
        if (placed[slotIndex])
            return;
        const allowed = entry.slots[slotIndex].allow;
        const pick = this.#firstSpendableRitualAttr(allowed);
        if (!pick) {
            ui.notifications?.warn('Kein freier Stein eines erlaubten Attributs.');
            return;
        }
        placed[slotIndex] = pick;
        await this.render({ force: true });
    }
    /** Ritual-Feld leeren (Stein zurück logisch frei — wie Rückzug in den Pool). */
    #clearRitualSlot(ritualId, slotIndex) {
        this.#pullSessionPartialsIntoInstance();
        const entry = STONE_RITUALS_CATALOG.find((r) => r.id === ritualId);
        if (!entry || slotIndex < 0 || slotIndex >= entry.slots.length)
            return;
        const placed = this.#ritualEnsureSlots(entry);
        if (!placed[slotIndex])
            return;
        placed[slotIndex] = null;
    }
    #bindSummonBondsTab(root) {
        root.querySelector('.js-summon-bond-new')?.addEventListener('click', async (ev) => {
            ev.preventDefault();
            await SummonBondDialog.showCreate(this.actor);
            await this.render({ force: true });
        });
        root.querySelectorAll('.js-summon-bond-ritual').forEach((btn) => {
            btn.onclick = async (ev) => {
                ev.preventDefault();
                const id = btn.dataset.bondId;
                if (!id)
                    return;
                await SummonBondDialog.showRitual(this.actor, id);
                await this.render({ force: true });
            };
        });
        root.querySelectorAll('.js-summon-bond-dissolve').forEach((btn) => {
            btn.onclick = async (ev) => {
                ev.preventDefault();
                const id = btn.dataset.bondId;
                if (!id)
                    return;
                const bond = getSummonBondsFromActor(this.actor).find((b) => b.id === id);
                if (!bond)
                    return;
                const confirmed = typeof globalThis.foundry?.applications?.api?.DialogV2?.confirm === 'function'
                    ? await globalThis.foundry.applications.api.DialogV2.confirm({
                        window: { title: 'Dissolve Summon Bond' },
                        content: `<p>Release <strong>${bond.name}</strong>? Bound Stones return to your pool.</p>`,
                    })
                    : globalThis.confirm?.(`Dissolve ${bond.name}?`);
                if (!confirmed)
                    return;
                const res = await dissolveSummonBond(this.actor, id, deleteSummonActor);
                if (res.removed) {
                    ui.notifications?.info(`Dissolved Summon Bond "${res.removed.name}".`);
                }
                await this.render({ force: true });
            };
        });
    }
    async _prepareContext(_options) {
        const el = this.element;
        const scrollRoot = el ? getStonePowersContentRoot(this) : null;
        if (scrollRoot && scrollRoot.scrollTop > 0) {
            this._stonePowersContentScrollTop = scrollRoot.scrollTop;
        }
        await this.#syncStonePowersRoundPlanWithCombat();
        this.#pullSessionPartialsIntoInstance();
        const combat = game.combat;
        const combatActive = !!combat;
        const combatStarted = !!combat?.started;
        if (!this.combatant && combat) {
            this.combatant = resolveStonePowersCombatant(this.actor, combat);
        }
        const poolOwner = getActionEconomyActor(this.actor) ?? this.actor;
        const system = poolOwner.system;
        const stonePools = system.stonePools || {};
        // Artifact "Stone Power Support" Stone Functions pre-fill an activation to
        // a higher tier. Resolve them once (off the same actor the economy uses)
        // so power cards can surface the Artifact Support Stones + their source.
        const artifactStoneSupports = getArtifactStoneFunctionStatus(poolOwner).supports;
        const supportForPower = (powerId, attr) => {
            let best = null;
            for (const s of artifactStoneSupports) {
                if (!s.stonePowerId || s.stonePowerId !== powerId)
                    continue;
                if (attr && s.attribute !== attr)
                    continue;
                if (!best || s.value > best.tier)
                    best = { tier: s.value, source: s.source };
            }
            return best;
        };
        const availablePowers = getAvailableStonePowers(this.actor);
        // Filter pools to only show those with max > 0 (includes optional Wits)
        const pools = POOL_DISPLAY_ATTRS.map((attr) => {
            const pool = stonePools[attr];
            const current = pool?.current ?? pool?.value ?? 0;
            const max = pool?.max ?? pool?.maximum ?? 0;
            const sustained = pool?.sustained ?? 0;
            // Artifact activation flags live on the embedded items of the actor the
            // sheet / evolution dialog edit (`this.actor`). For unlinked tokens the
            // economy actor (`poolOwner`) can be a different document whose item
            // flags are stale, so always read the binding from `this.actor`.
            const artifactBound = countArtifactActivationStones(this.actor, attr);
            const spendable = poolSpendableStones(this.actor, attr);
            const reserved = this.#reservedStonesInDialogForAttr(attr);
            const poolDisplay = Math.max(0, spendable - reserved);
            const gemStyle = getStoneGemStyle(attr) ?? { fill: '#888888', stroke: '#aaaaaa' };
            const gemSlots = Array.from({ length: poolDisplay }, (_, i) => ({ index: i }));
            const boundSlots = Array.from({ length: artifactBound }, (_, i) => ({ index: i }));
            return {
                key: attr,
                name: poolDisplayName(attr),
                current: Number(current) || 0,
                max: Number(max) || 0,
                sustained: Number(sustained) || 0,
                artifactBound,
                available: spendable,
                gemStyle,
                gemSlots,
                boundSlots,
            };
        })
            .filter((pool) => pool.max > 0);
        const combatMissingFromTracker = combatActive && !this.combatant;
        const hasCombat = combatActive && !!this.combatant;
        const stonePlanLocked = !!(combat && this.combatant && isStonePowersConfigurationLocked(this.actor, combat));
        const mainTab = this._stonePowersMainTab;
        const showStonePools = mainTab === 'combat' || mainTab === 'rituals' || mainTab === 'summons';
        const dragPoolEnabled = mainTab === 'rituals' || (mainTab === 'combat' && !stonePlanLocked);
        const ritualDragEnabled = mainTab === 'rituals';
        const tabCombatActive = mainTab === 'combat';
        const tabRitualsActive = mainTab === 'rituals';
        const tabSummonsActive = mainTab === 'summons';
        const ritualRows = STONE_RITUALS_CATALOG.map((entry) => {
            const placed = this.#ritualEnsureSlots(entry);
            const slotsUi = entry.slots.map((rule, idx) => {
                const p = placed[idx];
                if (p) {
                    const style = getStoneGemStyle(p) ?? { fill: '#888888', stroke: '#aaaaaa' };
                    return {
                        slotIndex: idx,
                        state: 'filled',
                        allowedCsv: rule.allow.join(','),
                        placedKey: p,
                        gemStyle: style,
                        allowTitle: rule.allow.join(' or ')
                    };
                }
                const canAny = rule.allow.some((a) => this.#spendableNetForAttr(a) >= 1);
                const state = ritualDragEnabled && canAny ? 'active' : 'locked';
                return {
                    slotIndex: idx,
                    state,
                    allowedCsv: rule.allow.join(','),
                    placedKey: null,
                    gemStyle: null,
                    allowTitle: rule.allow.join(' or ')
                };
            });
            return {
                id: entry.id,
                name: entry.name,
                roll: entry.roll,
                duration: entry.duration,
                requirement: entry.requirement,
                intro: entry.intro,
                raises: entry.raises,
                danger: entry.danger,
                lore: entry.lore,
                slotsUi
            };
        });
        const prefsUseDefaults = !!(system.stonePowersPrefs?.useDefaultsEachRound);
        const user = game.user;
        const canSavePrefs = !stonePlanLocked && !!user && (user.isGM || this.actor.isOwner);
        const showCombatRoundPlanSave = !!combat &&
            !!this.combatant &&
            !stonePlanLocked &&
            !combatMissingFromTracker &&
            !combatStarted &&
            !!user &&
            (user.isGM || this.actor.isOwner);
        // Determine default attribute for generic powers
        // First pool with current > 0, else first pool with max > 0
        const defaultGeneralAttrKey = (() => {
            const withCurrent = pools.find(p => p.current > 0);
            if (withCurrent)
                return String(withCurrent.key);
            if (pools.length > 0)
                return String(pools[0].key);
            return 'might';
        })();
        const spendableForAttr = (key) => pools.find((p) => p.key === key)?.available ?? 0;
        const totalSpendableNetAllPools = () => {
            let sum = 0;
            for (const p of pools) {
                const gross = spendableForAttr(String(p.key));
                const reserved = this.#reservedStonesInDialogForAttr(String(p.key));
                sum += Math.max(0, gross - reserved);
            }
            return sum;
        };
        const canAffordGenericNextCost = (cost) => hasCombat && pools.some((p) => (Number(p.current) || 0) >= cost);
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
            const support = supportForPower(power.id, attrKey);
            const supportTier = support?.tier ?? 0;
            const supportLanes = buildSupportLaneSet(supportTier, usesThisTurn);
            const laneSegs = buildStonePaymentLanes(usesThisTurn, spendableNet, stonePlanLocked, occupied, `${power.id}/${attrKey}`, supportLanes);
            return {
                id: power.id,
                name: power.name,
                description,
                attribute: power.attribute,
                nextCost,
                canAfford,
                selectedAttrKey: attrKey,
                usesThisTurn,
                supportTier,
                supportSource: support?.source ?? '',
                supportActive: !!supportLanes,
                ...laneSegs
            };
        };
        const resolveGenericAttrAndStats = (powerId) => {
            const usesThisTurn = getGenericStonePowerUsageCount(this.actor, powerId, combat);
            this.#mergeLegacyGenericIntoUnified(powerId, usesThisTurn);
            const unifiedKey = genericUnifiedAccKey(powerId, usesThisTurn);
            const raw = this.#stoneOccGetRaw(unifiedKey);
            const last = raw.length && isGenericLaneOccArray(raw) ? raw[raw.length - 1] : undefined;
            let attrKey = last?.attr ||
                this._generalAttrSelection[powerId] ||
                defaultGeneralAttrKey;
            if (!pools.some((p) => p.key === attrKey))
                attrKey = defaultGeneralAttrKey;
            const nextCost = calculateStoneCost(usesThisTurn);
            const spendable = spendableForAttr(attrKey);
            this._generalAttrSelection[powerId] = attrKey;
            return { attrKey, usesThisTurn, spendable, nextCost };
        };
        // Separate generic and attribute-specific powers
        const genericPowers = availablePowers.filter(p => p.attribute === 'generic');
        const attributeSpecificPowers = availablePowers.filter(p => p.attribute !== 'generic');
        const generalPowers = genericPowers.map((power) => {
            const { attrKey, usesThisTurn } = resolveGenericAttrAndStats(power.id);
            // Ramp powers (no Tier 1, e.g. Extra Attack) start one segment higher:
            // first activation = Tier 2 (2 stones), Anchor disabled.
            const rampSkip = rampSkipSegmentsForPower(power.id);
            const leadLockedLanes = rampSkipLeadLanes(power.id);
            const nextCost = calculateStoneCost(usesThisTurn + rampSkip);
            const canAfford = canAffordGenericNextCost(nextCost);
            const description = power.description || power.effect || '';
            const spendableNet = totalSpendableNetAllPools();
            const occupied = this.#stoneOccGet(genericUnifiedAccKey(power.id, usesThisTurn));
            const sp = STONE_POWERS[power.id];
            const support = supportForPower(power.id);
            const supportTier = support?.tier ?? 0;
            const supportLanes = buildSupportLaneSet(supportTier, usesThisTurn);
            const laneSegs = buildStonePaymentLanes(usesThisTurn, spendableNet, stonePlanLocked, occupied, `${power.id}/general`, supportLanes, leadLockedLanes);
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
                supportTier,
                supportSource: support?.source ?? '',
                supportActive: !!supportLanes,
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
            // Wits carries a 5th power (Seize the Moment) — render every pool power,
            // padding shorter pools to the base column count for grid alignment.
            const cols = Math.max(ATTR_MATRIX_COLS, defs.length);
            for (let i = 0; i < cols; i++) {
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
        const summonBonds = getSummonBondsFromActor(this.actor).map((b) => {
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
                tokenPreview: summonTokensFromStones(b.boundStoneCount, b.bonusTokens),
            };
        });
        return {
            actor: this.actor,
            pools,
            attributePowerMatrix,
            generalPowers,
            defaultGeneralAttrKey,
            combatActive,
            combatStarted,
            combatMissingFromTracker,
            hasCombat,
            stonePlanLocked,
            /** Ziehen erlaubt sobald Runde nicht gesperrt (auch ohne Kampf — Ausführung nur im Kampf). */
            dragStonesEnabled: !stonePlanLocked,
            dragPoolEnabled,
            ritualDragEnabled,
            stonePowersMainTab: mainTab,
            showStonePools,
            tabCombatActive,
            tabRitualsActive,
            tabSummonsActive,
            ritualRows,
            summonBonds,
            prefsUseDefaults,
            canSavePrefs,
            showCombatRoundPlanSave,
            combatRound: combat?.round,
            combatLabel: combat ? `Runde ${combat.round}` : ''
        };
    }
    async _onRender(_context, _options) {
        super._onRender?.(_context, _options);
        this.#pullSessionPartialsIntoInstance();
        const st = this._stonePowersContentScrollTop;
        if (st > 0) {
            requestAnimationFrame(() => {
                const scrollRoot = getStonePowersContentRoot(this);
                if (scrollRoot)
                    scrollRoot.scrollTop = st;
            });
        }
        const root = getStonePowersContentRoot(this);
        if (!root) {
            console.warn('Mastery System | StonePowersDialog: kein Content-Root für Event-Handler');
            return;
        }
        const appWindow = this.element ?? root;
        this.#bindStoneDragAndDrop(root, appWindow);
        this.#reconcileFilledLaneClasses(appWindow);
        this.#syncAccumulatorGems(appWindow);
        root.querySelectorAll('.js-stone-powers-tab').forEach((btn) => {
            const el = btn;
            el.onclick = (ev) => {
                ev.preventDefault();
                const tab = el.dataset.tab;
                if (!tab || tab === this._stonePowersMainTab)
                    return;
                this._stonePowersMainTab = tab;
                void this.render({ force: true });
            };
        });
        this.#bindSummonBondsTab(root);
        const savePrefsBtn = root.querySelector('.js-save-stone-prefs');
        if (savePrefsBtn) {
            savePrefsBtn.onclick = async (ev) => {
                ev.preventDefault();
                if (savePrefsBtn.classList.contains('is-disabled'))
                    return;
                await this.#saveStonePowersPrefs(root);
            };
        }
        const saveR1CombatBtn = root.querySelector('.js-save-stone-r1-combat-plan');
        if (saveR1CombatBtn) {
            saveR1CombatBtn.onclick = async (ev) => {
                ev.preventDefault();
                await this.#persistStonePowersRoundPlan();
                if (this.resolve) {
                    this.resolve(false);
                    this.resolve = undefined;
                }
                await this.close({ closeSource: 'button' });
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
    /** payAttr / Marker aus Schlüssel `powerId:middle:uses` (vollständiger powerId über parseStonePowerAccKey). */
    #parseAccKeyPayAttr(accKey) {
        return accKeyPayAttrSegment(accKey);
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
            if (isGenericUnifiedAccKey(accKey) && isGenericLaneOccArray(lanes)) {
                this._stoneDropAccumulators.set(accKey, [...lanes].sort((a, b) => a.lane - b.lane));
            }
            else if (!isGenericUnifiedAccKey(accKey)) {
                const nums = lanes;
                this._stoneDropAccumulators.set(accKey, [...nums].sort((a, b) => a - b));
            }
        }
    }
    /** Legacy `powerId:echtesAttr:uses` in einen Eintrag `genericUnifiedAccKey` zusammenführen. */
    #mergeLegacyGenericIntoUnified(powerId, uses) {
        this.#pullSessionPartialsIntoInstance();
        const unifiedKey = genericUnifiedAccKey(powerId, uses);
        const collected = [];
        const rawU = this._stoneDropAccumulators.get(unifiedKey);
        if (rawU?.length && isGenericLaneOccArray(rawU)) {
            collected.push(...rawU);
        }
        const toDelete = [];
        for (const [k, v] of [...this._stoneDropAccumulators.entries()]) {
            if (!k.startsWith(`${powerId}:`))
                continue;
            if (accKeyUsesSegment(k) !== uses)
                continue;
            const mid = accKeyPayAttrSegment(k);
            if (!mid || mid === STONE_GENERIC_UNIFIED_MARKER)
                continue;
            if (!v?.length || isGenericLaneOccArray(v))
                continue;
            for (const lane of v) {
                if (!collected.some((c) => c.lane === lane)) {
                    collected.push({ lane, attr: mid });
                }
            }
            toDelete.push(k);
        }
        for (const k of toDelete) {
            this.#stoneOccDelete(k);
        }
        collected.sort((a, b) => a.lane - b.lane);
        if (collected.length) {
            this.#stoneOccSet(unifiedKey, collected);
        }
    }
    #stoneOccDelete(accKey) {
        this._stoneDropAccumulators.delete(accKey);
        _a._sessionStoneLanes.delete(this.#sessionLaneCompositeKey(accKey));
    }
    /** Rohwert aus Map/Session (Typ je nach Schlüssel). */
    #stoneOccGetRaw(accKey) {
        let v = this._stoneDropAccumulators.get(accKey);
        if (!v?.length) {
            const sk = this.#sessionLaneCompositeKey(accKey);
            const fromS = _a._sessionStoneLanes.get(sk);
            if (fromS?.length) {
                if (isGenericUnifiedAccKey(accKey) && isGenericLaneOccArray(fromS)) {
                    v = [...fromS].sort((a, b) => a.lane - b.lane);
                }
                else if (!isGenericUnifiedAccKey(accKey) && !isGenericLaneOccArray(fromS)) {
                    v = [...fromS].sort((a, b) => a - b);
                }
                else {
                    v = fromS;
                }
                this._stoneDropAccumulators.set(accKey, v);
            }
        }
        return v ?? [];
    }
    /** Nur Lane-Indizes (Segment-Logik / Template). */
    #stoneOccGet(accKey) {
        if (isGenericUnifiedAccKey(accKey)) {
            const raw = this.#stoneOccGetRaw(accKey);
            if (!raw.length)
                return [];
            if (!isGenericLaneOccArray(raw))
                return [];
            return raw.map((x) => x.lane).sort((a, b) => a - b);
        }
        const raw = this.#stoneOccGetRaw(accKey);
        return [...raw].sort((a, b) => a - b);
    }
    #stoneOccSet(accKey, value) {
        const sk = this.#sessionLaneCompositeKey(accKey);
        if (!value.length) {
            this._stoneDropAccumulators.delete(accKey);
            _a._sessionStoneLanes.delete(sk);
        }
        else if (isGenericUnifiedAccKey(accKey)) {
            const sorted = [...value].sort((a, b) => a.lane - b.lane);
            this._stoneDropAccumulators.set(accKey, sorted);
            _a._sessionStoneLanes.set(sk, sorted);
        }
        else {
            const sorted = [...value].sort((a, b) => a - b);
            this._stoneDropAccumulators.set(accKey, sorted);
            _a._sessionStoneLanes.set(sk, sorted);
        }
    }
    /**
     * Vollständige Zahlungswelle → Pools abziehen, Macht anwenden, Akku leeren. Keine UI-Strukturänderung.
     */
    async #trySettleStonePayment(accKey) {
        this.#pullSessionPartialsIntoInstance();
        const parsed = parseStonePowerAccKey(accKey);
        if (!parsed)
            return false;
        const { powerId, middle, uses: usesInKey } = parsed;
        const def = STONE_POWERS[powerId];
        if (!def)
            return false;
        const combat = game.combat;
        if (!combat)
            return false;
        const currentUses = isGenericUnifiedAccKey(accKey)
            ? getGenericStonePowerUsageCount(this.actor, powerId, combat)
            : getStoneUsageCount(this.actor, middle, powerId, combat);
        if (currentUses !== usesInKey)
            return false;
        // Ramp powers (no Tier 1) start one segment higher, so the first wave
        // costs the Tier-2 amount; mirror the dialog's nextCost here.
        const nextCost = calculateStoneCost(usesInKey + rampSkipSegmentsForPower(powerId));
        const perAttr = {};
        if (isGenericUnifiedAccKey(accKey)) {
            const raw = this.#stoneOccGetRaw(accKey);
            if (!raw.length || !isGenericLaneOccArray(raw))
                return false;
            if (raw.length !== nextCost)
                return false;
            for (const { attr } of raw) {
                perAttr[attr] = (perAttr[attr] || 0) + 1;
            }
        }
        else {
            if (def.attribute !== 'generic' && middle !== def.attribute)
                return false;
            const raw = this.#stoneOccGetRaw(accKey);
            if (!raw.length)
                return false;
            if (raw.length !== nextCost)
                return false;
            perAttr[String(middle)] = raw.length;
        }
        const combatant = this.combatant || resolveStonePowersCombatant(this.actor, combat);
        if (!combatant)
            return false;
        let ok;
        if (isGenericUnifiedAccKey(accKey)) {
            ok = await activateGenericStonePowerMixed({
                actor: this.actor,
                combatant,
                abilityId: powerId,
                perAttributeStones: perAttr
            });
        }
        else {
            ok = await activateStonePower({
                actor: this.actor,
                combatant,
                abilityId: powerId
            });
        }
        if (ok)
            this.#stoneOccSet(accKey, []);
        return ok;
    }
    async #flushCompletedStonePaymentsFromAccumulators() {
        this.#pullSessionPartialsIntoInstance();
        const keys = [...this._stoneDropAccumulators.keys()];
        let anyOk = false;
        for (const accKey of keys) {
            if (await this.#trySettleStonePayment(accKey))
                anyOk = true;
        }
        if (anyOk) {
            const owner = getActionEconomyActor(this.actor) ?? this.actor;
            void refreshRadialMenuActionLabelsIfOpenForActor(owner);
        }
        return anyOk;
    }
    /** Gleicher Owner wie Stein-Nutzung (unverlinkter Token → Prototyp-Actor). */
    #stoneLaneOwnerActorId() {
        const owner = getActionEconomyActor(this.actor) ?? this.actor;
        return String(owner?.id ?? '');
    }
    #sessionLaneCompositeKey(accKey) {
        return `${this.#stoneLaneOwnerActorId()}\0${accKey}`;
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
    #reservedStonesNonFamiliar(attr) {
        this.#pullSessionPartialsIntoInstance();
        let sum = 0;
        for (const [accKey, val] of this._stoneDropAccumulators) {
            if (!val?.length)
                continue;
            if (isGenericUnifiedAccKey(accKey)) {
                if (!isGenericLaneOccArray(val))
                    continue;
                for (const a of val) {
                    if (a.attr === attr)
                        sum += 1;
                }
            }
            else if (this.#parseAccKeyPayAttr(accKey) === attr) {
                sum += val.length;
            }
        }
        for (const slots of this._ritualStonePlacements.values()) {
            for (const a of slots) {
                if (a === attr)
                    sum += 1;
            }
        }
        return sum;
    }
    #reservedStonesInDialogForAttr(attr) {
        return this.#reservedStonesNonFamiliar(attr);
    }
    #actorPoolSpendable(attr) {
        // Read from `this.actor` so artifact activation bindings match the sheet /
        // evolution dialog (pool capacity is still derived via the economy actor
        // inside poolSpendableStones).
        return poolSpendableStones(this.actor, attr);
    }
    /** Brutto-Pool minus bereits im Dialog reservierte Steine dieser Farbe. */
    #spendableNetForAttr(attr) {
        return Math.max(0, this.#actorPoolSpendable(attr) - this.#reservedStonesInDialogForAttr(attr));
    }
    /** General Power: erstes Attribut mit mindestens einem freien Stein (Kern-Attribute; Wits nur für Rituale). */
    #firstGenericAttrWithSpendable(poolKeys) {
        for (const attr of ALL_STONE_ATTRS) {
            if (!poolKeys.has(attr))
                continue;
            if (this.#spendableNetForAttr(attr) > 0)
                return attr;
        }
        return null;
    }
    /**
     * Klick-Befüllung: **ein** Segment pro Klick (1 → 2 → 4 → 8 Lanes), begrenzt durch Pool.
     * Attribut-Macht: nur `fixedPayAttr`. General: jeweils erstes Attribut mit Netto > 0.
     */
    async #autoFillPowerCluster(powerId, isGeneric, fixedPayAttr, poolKeys) {
        const combat = game.combat;
        if (!isGeneric && !fixedPayAttr)
            return;
        const uses = isGeneric
            ? getGenericStonePowerUsageCount(this.actor, powerId, combat)
            : getStoneUsageCount(this.actor, fixedPayAttr, powerId, combat);
        if (isGeneric) {
            this.#mergeLegacyGenericIntoUnified(powerId, uses);
        }
        this.#pullSessionPartialsIntoInstance();
        const accKey = isGeneric
            ? genericUnifiedAccKey(powerId, uses)
            : `${powerId}:${fixedPayAttr}:${uses}`;
        let occ = this.#stoneOccGet(accKey);
        const seg = nextStoneSegmentToFill(occWithRampSkip(occ, powerId));
        if (seg === null) {
            return;
        }
        const occSet = new Set(occ);
        const emptyInSeg = lanesInStonePaymentSegment(seg).filter((l) => !occSet.has(l));
        emptyInSeg.sort((a, b) => a - b);
        for (const lane of emptyInSeg) {
            this.#pullSessionPartialsIntoInstance();
            occ = this.#stoneOccGet(accKey);
            if (!isLaneAllowedBySegmentUnlock(occWithRampSkip(occ, powerId), lane))
                break;
            let chosenAttr;
            if (isGeneric) {
                const pick = this.#firstGenericAttrWithSpendable(poolKeys);
                if (!pick)
                    break;
                chosenAttr = pick;
            }
            else {
                if (this.#spendableNetForAttr(fixedPayAttr) < 1)
                    break;
                chosenAttr = fixedPayAttr;
            }
            if (isGeneric) {
                const prev = this.#stoneOccGetRaw(accKey);
                const base = prev.length && isGenericLaneOccArray(prev) ? [...prev] : [];
                base.push({ lane, attr: chosenAttr });
                base.sort((a, b) => a.lane - b.lane);
                this.#stoneOccSet(accKey, base);
                this._generalAttrSelection[powerId] = chosenAttr;
            }
            else {
                this.#stoneOccSet(accKey, [...occ, lane].sort((a, b) => a - b));
            }
        }
    }
    /** Alle Akku-Einträge dieser Macht für die aktuelle uses-Stufe leeren (inkl. Session-Backup). */
    #clearPowerStonePlan(powerId, isGeneric, fixedPayAttr) {
        this.#pullSessionPartialsIntoInstance();
        const combat = game.combat;
        if (!isGeneric && !fixedPayAttr)
            return;
        const uses = isGeneric
            ? getGenericStonePowerUsageCount(this.actor, powerId, combat)
            : getStoneUsageCount(this.actor, fixedPayAttr, powerId, combat);
        const shouldDeleteAccKey = (accKey) => {
            if (!accKey.startsWith(`${powerId}:`))
                return false;
            if (accKeyUsesSegment(accKey) !== uses)
                return false;
            if (isGeneric)
                return true;
            return accKeyPayAttrSegment(accKey) === fixedPayAttr;
        };
        for (const k of [...this._stoneDropAccumulators.keys()]) {
            if (shouldDeleteAccKey(k))
                this.#stoneOccDelete(k);
        }
        const aid = this.#stoneLaneOwnerActorId();
        const prefix = `${aid}\0`;
        for (const composite of [..._a._sessionStoneLanes.keys()]) {
            if (!composite.startsWith(prefix))
                continue;
            const accKey = composite.slice(prefix.length);
            if (shouldDeleteAccKey(accKey)) {
                _a._sessionStoneLanes.delete(composite);
                this._stoneDropAccumulators.delete(accKey);
            }
        }
    }
    /** Entfernt Pool-Chips, die bereits in Ablagefeldern (Akku) stecken — inkl. Teilbelegung. */
    #syncPoolGemChips(root) {
        root.querySelectorAll('.pool-gems[data-attribute-key]').forEach((node) => {
            const poolGems = node;
            const attr = poolGems.dataset.attributeKey || '';
            if (!attr)
                return;
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
            }
        });
    }
    /** Zeigt Steine in `slot-filled`-Zellen (ein Stein pro Feld, zurück zum Pool ziehbar). */
    #syncAccumulatorGems(root) {
        const combat = game.combat;
        const locked = !!(combat && this.combatant && isStonePowersConfigurationLocked(this.actor, combat));
        const allowReturnDrag = !locked;
        root.querySelectorAll('.ms-stone-slot-fill .ms-slot-gem-partial').forEach((n) => n.remove());
        this.#pullSessionPartialsIntoInstance();
        for (const [accKey, lanesVal] of this._stoneDropAccumulators) {
            if (!lanesVal?.length)
                continue;
            const powerId = stonePowerAccKeyPowerId(accKey);
            if (!powerId)
                continue;
            const esc = escapeAttrValueInCssSelector(powerId);
            const host = root.querySelector(`.power-drop-slots[data-power-id="${esc}"]`);
            if (!host) {
                continue;
            }
            const placeGem = (lane, payAttr) => {
                const style = getStoneGemStyle(payAttr);
                const fillC = style?.fill ?? '#888888';
                const strokeC = style?.stroke ?? '#aaaaaa';
                let slot = host.querySelector(`.ms-stone-drop-slot.slot-filled[data-lane-index="${lane}"]`);
                if (!slot) {
                    slot = host.querySelector(`.ms-stone-drop-slot.slot-active[data-lane-index="${lane}"]`);
                }
                if (!slot) {
                    return;
                }
                const fill = slot.querySelector('.ms-stone-slot-fill');
                if (!fill)
                    return;
                const gem = document.createElement('span');
                gem.className = 'ms-stone-gem-chip ms-slot-gem-partial js-stone-returnable';
                gem.setAttribute('data-acc-key', accKey);
                gem.setAttribute('data-lane-index', String(lane));
                gem.setAttribute('data-return-attribute-key', payAttr);
                gem.title = allowReturnDrag
                    ? 'Zurück in den passenden Pool ziehen'
                    : 'Runde gesperrt — Rückgabe nicht möglich';
                gem.draggable = allowReturnDrag;
                gem.classList.toggle('is-drag-disabled', !allowReturnDrag);
                gem.style.background = fillC;
                gem.style.boxShadow = `0 0 0 2px ${strokeC} inset, 0 1px 3px rgba(0,0,0,0.45)`;
                fill.appendChild(gem);
            };
            if (isGenericUnifiedAccKey(accKey) && isGenericLaneOccArray(lanesVal)) {
                for (const { lane, attr } of lanesVal) {
                    placeGem(lane, attr);
                }
            }
            else if (!isGenericUnifiedAccKey(accKey)) {
                const payAttrRaw = this.#parseAccKeyPayAttr(accKey);
                if (!payAttrRaw)
                    continue;
                const payAttr = payAttrRaw;
                for (const lane of [...lanesVal].sort((a, b) => a - b)) {
                    placeGem(lane, payAttr);
                }
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
        for (const [accKey, lanesVal] of this._stoneDropAccumulators) {
            if (!lanesVal?.length)
                continue;
            const powerId = stonePowerAccKeyPowerId(accKey);
            if (!powerId)
                continue;
            const attrEsc = escapeAttrValueInCssSelector(powerId);
            const host = root.querySelector(`.power-drop-slots[data-power-id="${attrEsc}"]`);
            if (!host)
                continue;
            const laneList = isGenericUnifiedAccKey(accKey) && isGenericLaneOccArray(lanesVal)
                ? lanesVal.map((x) => x.lane)
                : lanesVal;
            for (const lane of laneList) {
                const el = host.querySelector(`.ms-stone-drop-slot[data-lane-index="${lane}"]`);
                if (!el)
                    continue;
                el.classList.remove('slot-active', 'slot-locked');
                el.classList.add('slot-filled');
                el.style.setProperty('background', 'rgba(76, 175, 80, 0.28)', 'important');
                el.style.setProperty('border-color', 'rgba(102, 187, 106, 0.95)', 'important');
            }
        }
        this.#reconcilePrimedSupportLanes(root);
    }
    /**
     * Stone Power Support: once the player primes a supported power by placing
     * the anchor stone (lane 0 → slot-filled), flip its gold Artifact Support
     * Stones to a "primed/active" green look so it's clear the higher tier is now
     * in effect. Runs over every power host so it also clears when the anchor is
     * removed (the accumulator for that power may already be empty by then).
     */
    #reconcilePrimedSupportLanes(root) {
        root.querySelectorAll('.power-drop-slots').forEach((host) => {
            const anchor = host.querySelector('.ms-stone-drop-slot[data-lane-index="0"]');
            const primed = !!anchor && anchor.classList.contains('slot-filled');
            host
                .querySelectorAll('.ms-stone-drop-slot.slot-support')
                .forEach((s) => s.classList.toggle('is-primed', primed));
        });
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
        const mainTab = this._stonePowersMainTab;
        const allowDrag = mainTab === 'rituals' || (mainTab === 'combat' && !locked);
        const poolKeys = getActorStonePoolKeysWithMax(this.actor);
        let lastDragOverLogKey = '';
        const clearPoolReturnHighlight = () => {
            bindTarget.querySelectorAll('.pool-gems.is-pool-drag-over').forEach((n) => n.classList.remove('is-pool-drag-over'));
        };
        const clearDragOver = () => {
            clearPoolReturnHighlight();
            bindTarget.querySelectorAll('.ms-stone-drop-slot.is-drag-over, .ms-ritual-drop-slot.is-drag-over').forEach((n) => {
                clearStoneSlotDragOverVisual(n);
            });
        };
        root.querySelectorAll('.js-stone-draggable').forEach((el) => {
            const gem = el;
            gem.draggable = allowDrag;
            gem.classList.toggle('is-drag-disabled', !allowDrag);
            gem.ondragstart = (ev) => {
                if (!allowDrag || !ev.dataTransfer) {
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
            };
            gem.ondragend = () => {
                gem.classList.remove('is-dragging');
                clearDragOver();
                lastDragOverLogKey = '';
                this.#syncPoolGemChips(bindTarget);
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
                return null;
            }
            if (!bindTarget.contains(el)) {
                return null;
            }
            const slot = el.closest('.ms-stone-drop-slot');
            if (!slot || !bindTarget.contains(slot)) {
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
                    const payAttr = this._stoneReturnPoolAttr ||
                        this.#parseAccKeyPayAttr(this._stoneReturnAccKey) ||
                        '';
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
                        }
                        return;
                    }
                }
                clearPoolReturnHighlight();
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
            const poolGemsDrop = ev.target?.closest?.('.pool-gems');
            if (accKeyReturn) {
                ev.preventDefault();
                clearDragOver();
                if (!poolGemsDrop || !bindTarget.contains(poolGemsDrop)) {
                    return;
                }
                const payAttr = this._stoneReturnPoolAttr ||
                    this.#parseAccKeyPayAttr(accKeyReturn) ||
                    '';
                const poolAttr = poolGemsDrop.dataset.attributeKey || '';
                if (!payAttr || poolAttr !== payAttr) {
                    return;
                }
                if (accKeyReturn.startsWith('ritual-slot:')) {
                    const m = /^ritual-slot:([^:]+):(\d+)$/.exec(accKeyReturn);
                    if (!m) {
                        return;
                    }
                    const ritualId = m[1];
                    const slotIndex = Number(m[2]);
                    const entry = STONE_RITUALS_CATALOG.find((r) => r.id === ritualId);
                    if (!entry || !Number.isFinite(slotIndex) || slotIndex < 0 || slotIndex >= entry.slots.length) {
                        return;
                    }
                    const placed = this.#ritualEnsureSlots(entry);
                    const stone = placed[slotIndex];
                    if (!stone || stone !== payAttr) {
                        return;
                    }
                    placed[slotIndex] = null;
                    await this.render({ force: true });
                    return;
                }
                const laneRm = this._stoneReturnLane;
                if (isGenericUnifiedAccKey(accKeyReturn)) {
                    const raw = this.#stoneOccGetRaw(accKeyReturn);
                    if (!raw.length || !isGenericLaneOccArray(raw)) {
                        return;
                    }
                    let nextAssign;
                    if (laneRm != null) {
                        nextAssign = raw.filter((a) => a.lane !== laneRm);
                    }
                    else {
                        const hi = Math.max(...raw.map((a) => a.lane));
                        nextAssign = raw.filter((a) => a.lane !== hi);
                    }
                    this.#stoneOccSet(accKeyReturn, nextAssign);
                }
                else {
                    const occ = this.#stoneOccGet(accKeyReturn);
                    if (!occ.length) {
                        return;
                    }
                    let nextOcc;
                    if (laneRm != null && occ.includes(laneRm)) {
                        nextOcc = occ.filter((l) => l !== laneRm);
                    }
                    else {
                        const hi = Math.max(...occ);
                        nextOcc = occ.filter((l) => l !== hi);
                    }
                    this.#stoneOccSet(accKeyReturn, nextOcc);
                }
                this.#syncAccumulatorGems(bindTarget);
                await this.render({ force: true });
                return;
            }
            const slot = resolveMsStoneDropSlotUnderPointer(ev, bindTarget) ?? resolveDropSlot(ev, true);
            if (!slot) {
                if (msLastDraggedStoneAttribute)
                    ev.preventDefault();
                return;
            }
            ev.preventDefault();
            clearDragOver();
            const ritualIdDrop = slot.dataset.ritualId;
            if (ritualIdDrop) {
                if (!slot.classList.contains('slot-active')) {
                    ui.notifications?.warn('Dieses Ritual-Feld ist nicht verfügbar (kein passender Stein im Pool oder Feld schon belegt).');
                    return;
                }
                const idxR = slot.dataset.ritualSlotIndex !== undefined && slot.dataset.ritualSlotIndex !== ''
                    ? Number(slot.dataset.ritualSlotIndex)
                    : NaN;
                const draggedR = this._stoneDragAttribute ||
                    ev.dataTransfer?.getData(STONE_DRAG_MIME) ||
                    ev.dataTransfer?.getData('text/plain') ||
                    msLastDraggedStoneAttribute ||
                    '';
                const entryDrop = STONE_RITUALS_CATALOG.find((r) => r.id === ritualIdDrop);
                if (!entryDrop || !Number.isFinite(idxR) || idxR < 0 || idxR >= entryDrop.slots.length) {
                    return;
                }
                const ruleDrop = entryDrop.slots[idxR];
                if (!draggedR || !ruleDrop.allow.includes(draggedR)) {
                    ui.notifications?.warn('Falscher Stein — Attribut passt nicht zu diesem Ritual-Feld.');
                    return;
                }
                if (!poolKeys.has(draggedR)) {
                    ui.notifications?.warn('Dieser Stein gehört zu keinem Pool auf diesem Bogen.');
                    return;
                }
                const placedDrop = this.#ritualEnsureSlots(entryDrop);
                if (placedDrop[idxR])
                    return;
                if (this.#spendableNetForAttr(draggedR) < 1) {
                    ui.notifications?.warn('Kein freier Stein dieses Attributs im Pool.');
                    return;
                }
                placedDrop[idxR] = draggedR;
                await this.render({ force: true });
                return;
            }
            if (locked) {
                ui.notifications?.warn('Diese Runde ist für Stonepowers gesperrt.');
                return;
            }
            if (!slot.classList.contains('slot-active')) {
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
            let payAttr;
            if (isGeneric) {
                payAttr = dragged;
                if (!powerId || !dragged) {
                    return;
                }
                if (!poolKeys.has(dragged)) {
                    ui.notifications?.warn('Dieser Stein gehört zu keinem Pool auf diesem Bogen.');
                    return;
                }
                this._generalAttrSelection[powerId] = payAttr;
            }
            else {
                payAttr = (slot.dataset.payAttribute || '');
                if (!powerId || !payAttr) {
                    return;
                }
                if (dragged !== payAttr) {
                    ui.notifications?.warn('Falscher Stein — Attribut passt nicht zu diesem Feld.');
                    return;
                }
            }
            const uses = isGeneric
                ? getGenericStonePowerUsageCount(this.actor, powerId, combat)
                : getStoneUsageCount(this.actor, payAttr, powerId, combat);
            const laneRaw = slot.dataset.laneIndex;
            const laneIndex = laneRaw !== undefined && laneRaw !== '' ? Number(laneRaw) : NaN;
            if (!Number.isFinite(laneIndex)) {
                return;
            }
            let accKey;
            let occ;
            let paid;
            if (isGeneric) {
                this.#mergeLegacyGenericIntoUnified(powerId, uses);
                accKey = genericUnifiedAccKey(powerId, uses);
                occ = this.#stoneOccGet(accKey);
                if (occ.includes(laneIndex)) {
                    return;
                }
                if (!isLaneAllowedBySegmentUnlock(occWithRampSkip(occ, powerId), laneIndex)) {
                    return;
                }
                const prev = this.#stoneOccGetRaw(accKey);
                const base = prev.length && isGenericLaneOccArray(prev) ? [...prev] : [];
                base.push({ lane: laneIndex, attr: payAttr });
                base.sort((a, b) => a.lane - b.lane);
                this.#stoneOccSet(accKey, base);
                paid = base.length;
            }
            else {
                accKey = `${powerId}:${payAttr}:${uses}`;
                occ = this.#stoneOccGet(accKey);
                if (occ.includes(laneIndex)) {
                    return;
                }
                if (!isLaneAllowedBySegmentUnlock(occ, laneIndex)) {
                    return;
                }
                const nextOcc = [...occ, laneIndex];
                this.#stoneOccSet(accKey, nextOcc);
                paid = nextOcc.length;
            }
            this.#reconcileFilledLaneClasses(bindTarget);
            this.#syncAccumulatorGems(bindTarget);
            await this.render({ force: true });
        };
        const onDelegateReturnDragStart = (ev) => {
            const t = ev.target;
            if (!t?.classList?.contains('js-stone-returnable'))
                return;
            if (!allowDrag || !ev.dataTransfer || locked) {
                ev.preventDefault();
                return;
            }
            const accKey = t.getAttribute('data-acc-key') || t.dataset.accKey || '';
            if (!accKey) {
                ev.preventDefault();
                return;
            }
            this._stoneReturnAccKey = accKey;
            this._stoneReturnPoolAttr =
                t.getAttribute('data-return-attribute-key') ||
                    t.dataset.returnAttributeKey ||
                    this.#parseAccKeyPayAttr(accKey) ||
                    null;
            const lr = t.getAttribute('data-lane-index') ?? t.dataset.laneIndex ?? '';
            const ln = lr !== '' ? Number(lr) : NaN;
            this._stoneReturnLane = Number.isFinite(ln) ? ln : null;
            this._stoneDragAttribute = null;
            ev.dataTransfer.setData(STONE_RETURN_MIME, accKey);
            ev.dataTransfer.setData('text/plain', accKey);
            ev.dataTransfer.effectAllowed = 'move';
            t.classList.add('is-dragging');
            lastDragOverLogKey = '';
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
            queueMicrotask(() => {
                this._stoneReturnAccKey = null;
                this._stoneReturnPoolAttr = null;
                this._stoneReturnLane = null;
            });
        };
        const resolvePowerCardContext = (t) => {
            const card = t.closest('.power-card.power-card-general:not(.power-card-placeholder)');
            if (!card || !bindTarget.contains(card))
                return null;
            const slotsHost = card.querySelector('.power-drop-slots[data-power-id]');
            const powerId = slotsHost?.dataset.powerId || slotsHost?.getAttribute('data-power-id') || '';
            if (!powerId)
                return null;
            const isGeneric = !!card.querySelector('.ms-stone-drop-slot[data-is-generic="true"]');
            let fixedPayAttr = null;
            if (!isGeneric) {
                fixedPayAttr =
                    card
                        .querySelector('.ms-stone-drop-slot[data-pay-attribute]')
                        ?.getAttribute('data-pay-attribute') || null;
                if (!fixedPayAttr)
                    return null;
            }
            return { powerId, isGeneric, fixedPayAttr };
        };
        /** Linksklick auf grünes Ritual-Feld: ersten passenden Stein automatisch legen. */
        const onRitualSlotClick = async (ev) => {
            if (ev.button !== 0)
                return;
            if (!allowDrag)
                return;
            if (this._stonePowersMainTab !== 'rituals')
                return;
            const t = ev.target;
            if (t.closest('.js-stone-draggable') || t.closest('.js-stone-returnable'))
                return;
            if (t.closest('button, a, input, select, textarea, label'))
                return;
            const slot = t.closest('.ms-ritual-drop-slot.slot-active');
            if (!slot || !bindTarget.contains(slot))
                return;
            ev.preventDefault();
            ev.stopImmediatePropagation();
            const ritualId = slot.dataset.ritualId || '';
            const idxRaw = slot.dataset.ritualSlotIndex;
            const slotIndex = idxRaw !== undefined && idxRaw !== '' ? Number(idxRaw) : NaN;
            if (!ritualId || !Number.isFinite(slotIndex))
                return;
            await this.#autoFillRitualSlot(ritualId, slotIndex);
        };
        /** Linksklick auf ganze Power-Karte (inkl. Titel): Slots aus Pools füllen. */
        const onPowerCardClick = async (ev) => {
            if (ev.button !== 0)
                return;
            if (!allowDrag || locked)
                return;
            const t = ev.target;
            if (t.closest('.js-stone-draggable') || t.closest('.js-stone-returnable'))
                return;
            if (t.closest('button, a, input, select, textarea, label'))
                return;
            const resolved = resolvePowerCardContext(t);
            if (!resolved)
                return;
            ev.preventDefault();
            ev.stopPropagation();
            const { powerId, isGeneric, fixedPayAttr } = resolved;
            await this.#autoFillPowerCluster(powerId, isGeneric, fixedPayAttr, poolKeys);
            await this.render({ force: true });
        };
        /** Rechtsklick: Ritual-Feld leeren (Stein freigeben) oder Kampf-Macht leeren. */
        const onPowerCardContextMenu = async (ev) => {
            if (!allowDrag || locked)
                return;
            const t = ev.target;
            if (this._stonePowersMainTab === 'rituals') {
                const rSlot = t.closest('.ms-ritual-drop-slot.slot-filled');
                if (rSlot && bindTarget.contains(rSlot)) {
                    ev.preventDefault();
                    ev.stopPropagation();
                    const ritualId = rSlot.dataset.ritualId || '';
                    const idxRaw = rSlot.dataset.ritualSlotIndex;
                    const slotIndex = idxRaw !== undefined && idxRaw !== '' ? Number(idxRaw) : NaN;
                    if (ritualId && Number.isFinite(slotIndex)) {
                        this.#clearRitualSlot(ritualId, slotIndex);
                        this.#reconcileFilledLaneClasses(bindTarget);
                        this.#syncAccumulatorGems(bindTarget);
                        await this.render({ force: true });
                    }
                    return;
                }
            }
            if (t.closest('.js-stone-draggable') || t.closest('.js-stone-returnable'))
                return;
            const resolved = resolvePowerCardContext(t);
            if (!resolved)
                return;
            ev.preventDefault();
            const { powerId, isGeneric, fixedPayAttr } = resolved;
            this.#clearPowerStonePlan(powerId, isGeneric, fixedPayAttr);
            this.#reconcileFilledLaneClasses(bindTarget);
            this.#syncAccumulatorGems(bindTarget);
            await this.render({ force: true });
        };
        const useCapture = true;
        bindTarget.addEventListener('dragstart', onDelegateReturnDragStart, useCapture);
        bindTarget.addEventListener('dragend', onDelegateReturnDragEnd, useCapture);
        bindTarget.addEventListener('dragover', onBindDragOver, useCapture);
        bindTarget.addEventListener('dragleave', onBindDragLeave);
        bindTarget.addEventListener('drop', onBindDrop, useCapture);
        bindTarget.addEventListener('click', onRitualSlotClick);
        bindTarget.addEventListener('click', onPowerCardClick);
        bindTarget.addEventListener('contextmenu', onPowerCardContextMenu);
        this._stoneDndCleanup = () => {
            bindTarget.removeEventListener('dragstart', onDelegateReturnDragStart, useCapture);
            bindTarget.removeEventListener('dragend', onDelegateReturnDragEnd, useCapture);
            bindTarget.removeEventListener('dragover', onBindDragOver, useCapture);
            bindTarget.removeEventListener('dragleave', onBindDragLeave);
            bindTarget.removeEventListener('drop', onBindDrop, useCapture);
            bindTarget.removeEventListener('click', onRitualSlotClick);
            bindTarget.removeEventListener('click', onPowerCardClick);
            bindTarget.removeEventListener('contextmenu', onPowerCardContextMenu);
        };
    }
    #isValidLaneSnapshotValue(accKey, v) {
        if (!Array.isArray(v) || v.length === 0)
            return false;
        if (isGenericUnifiedAccKey(accKey)) {
            return isGenericLaneOccArray(v);
        }
        return v.every((n) => typeof n === 'number' && Number.isFinite(n));
    }
    async #syncStonePowersRoundPlanWithCombat() {
        const ownerDoc = (getActionEconomyActor(this.actor) ?? this.actor);
        const combat = game.combat;
        let plan = ownerDoc.getFlag('mastery-system', STONE_POWERS_ROUND_PLAN_FLAG);
        // Nur bei **aktivem** Kampf verwerfen, wenn Encounter/Runde nicht mehr zum gespeicherten Plan passen.
        // Ohne Kampf: Plan behalten (z. B. Sheet zwischen Szenen) — früheres `!combat` hat den Plan gelöscht und nie wieder geladen.
        if (plan &&
            combat &&
            (String(plan.combatId) !== String(combat.id) || plan.round !== combat.round)) {
            try {
                await ownerDoc.unsetFlag('mastery-system', STONE_POWERS_ROUND_PLAN_FLAG);
            }
            catch (e) {
                console.warn('Mastery System | Could not clear stale stone round plan', e);
            }
            plan = undefined;
            this._stoneRoundPlanHydratedKey = null;
            this.#clearSessionStoneLanesForOwner();
        }
        if (!plan?.lanes?.length)
            return;
        const hydrateKey = `${plan.combatId}\0${plan.round}`;
        if (this._stoneRoundPlanHydratedKey === hydrateKey)
            return;
        const aid = this.#stoneLaneOwnerActorId();
        if (!aid)
            return;
        const prefix = `${aid}\0`;
        for (const k of [..._a._sessionStoneLanes.keys()]) {
            if (k.startsWith(prefix))
                _a._sessionStoneLanes.delete(k);
        }
        const dup = foundry.utils?.duplicate;
        for (const row of plan.lanes) {
            if (!row?.accKey)
                continue;
            const raw = dup ? dup(row.value) : JSON.parse(JSON.stringify(row.value));
            if (!this.#isValidLaneSnapshotValue(row.accKey, raw))
                continue;
            _a._sessionStoneLanes.set(`${aid}\0${row.accKey}`, raw);
        }
        this._stoneDropAccumulators.clear();
        this.#pullSessionPartialsIntoInstance();
        this._stoneRoundPlanHydratedKey = hydrateKey;
    }
    async #persistStonePowersRoundPlan() {
        const combat = game.combat;
        if (!combat) {
            ui.notifications?.warn('Kein aktiver Kampf — Steinplan kann nicht gespeichert werden.');
            return;
        }
        if (!this.combatant) {
            ui.notifications?.warn('Figur nicht im Initiative-Tracker — Steinplan kann nicht zugeordnet werden.');
            return;
        }
        this.#pullSessionPartialsIntoInstance();
        const ownerDoc = (getActionEconomyActor(this.actor) ?? this.actor);
        const aid = this.#stoneLaneOwnerActorId();
        if (!aid)
            return;
        const prefix = `${aid}\0`;
        const lanes = [];
        const dup = foundry.utils?.duplicate;
        for (const [composite, val] of _a._sessionStoneLanes) {
            if (!composite.startsWith(prefix))
                continue;
            if (!val || !Array.isArray(val) || val.length === 0)
                continue;
            const accKey = composite.slice(prefix.length);
            const cloned = (dup ? dup(val) : JSON.parse(JSON.stringify(val)));
            lanes.push({ accKey, value: cloned });
        }
        await ownerDoc.setFlag('mastery-system', STONE_POWERS_ROUND_PLAN_FLAG, {
            combatId: combat.id,
            round: combat.round,
            lanes
        });
        ui.notifications?.info(`Steinplan für Runde ${combat.round} gespeichert.`);
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
        this.#pullSessionPartialsIntoInstance();
        await this.#flushCompletedStonePaymentsFromAccumulators();
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