import { getActionEconomyActor, getAvailableAttackActions, getAvailableMovementActions, getMovementRangeBonusMeters, getReactionActionsSummary, getRoundState, gmRefundCombatAction, hasPowerBeenUsedThisRound, } from '../combat/action-economy.js';
import { canViewerSeeEndTurn, requestEndTurn, userMayEndCurrentTurn } from '../combat/end-turn.js';
import { arePlayerStonesReadyForRound, encounterStartBlockers, isEncounterPreparing, pendingStonePlayerNames, warnIfPlayerStonesPending, } from '../combat/stone-round-gate.js';
import { readActorStatusEffects } from '../system/active-specials.js';
import { MASTERY_STATUS_EFFECTS } from '../system/status-effects.js';
import { specialTokenIcon } from './special-token-assets.js';
import { buildCarouselHpSegments, hideCarouselHpNumbers } from './combat-carousel-hp.js';
import { carouselSideClass, findNextCombatantId, resolveCurrentCombatantId, } from './combat-carousel-helpers.js';
import { applyCarouselCompactClass, applyCarouselUserSize, CAROUSEL_MIN_HEIGHT, CAROUSEL_MIN_WIDTH, CAROUSEL_Z_INDEX, clampCarouselHeight, clampCarouselWidth, clearCarouselTopOffset, isCompactCarouselViewport, syncCarouselTopOffset, writeCarouselUserSize, } from './combat-carousel-layout.js';
import { buildCarouselTooltip, readCarouselClientPrefs, resolveCarouselCompact, writeCarouselClientPrefs, } from './combat-carousel-settings.js';
import { PENDING_SAFE_MOVEMENT_FLAG, PENDING_SLIP_FLAG, } from '../stones/agility-movement.js';
import { getActiveGuidedMovementSummary, handleChosenCombatOption } from '../token-action-selector.js';
import { applyCarouselVitalsEdit } from './carousel-vitals-edit.js';
import { readPowerFavorites, togglePowerFavorite } from './power-favorites.js';
import { getAllCombatOptionsForActor } from '../token-radial-menu.js';
import { resolveLiveActor } from '../system/status-target.js';
import { forceEncounterDialog, forceEncounterDialogForAll, } from '../combat/encounter-setup-status.js';
const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;
// Type workaround for Mixin
const BaseCarousel = HandlebarsApplicationMixin(ApplicationV2);
function combatantDisposition(combatant, token, actor) {
    const raw = token?.document?.disposition ??
        token?.disposition ??
        combatant?.token?.disposition ??
        actor?.prototypeToken?.disposition ??
        0;
    return Number(raw);
}
export class CombatCarouselApp extends BaseCarousel {
    static _instance = null;
    /** Prevents double `nextTurn` / `previousTurn` from rapid clicks on carousel controls. */
    static _turnNavigationBusy = false;
    hookEntries = [];
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
        },
        actions: {
            msEndTurn: function (event) {
                event.preventDefault();
                event.stopPropagation();
                void requestEndTurn();
            },
        },
    };
    static PARTS = {
        content: { template: 'systems/mastery-system/templates/ui/combat-carousel.hbs' }
    };
    /**
     * Open the carousel (singleton pattern)
     */
    static open() {
        // Check for existing instance
        const existingApp = foundry.applications.instances.get('mastery-combat-carousel');
        if (existingApp) {
            if (!existingApp.rendered) {
                existingApp.render({ force: true, focus: false });
            }
            return;
        }
        if (!CombatCarouselApp._instance) {
            CombatCarouselApp._instance = new CombatCarouselApp();
        }
        CombatCarouselApp._instance.render({ force: true, focus: false });
    }
    /**
     * Close the carousel
     */
    static close() {
        if (CombatCarouselApp._instance) {
            CombatCarouselApp._instance.close();
            CombatCarouselApp._instance = null;
        }
    }
    /**
     * Get the singleton instance
     */
    static get instance() {
        return CombatCarouselApp._instance;
    }
    /**
     * Refresh the carousel (re-render with current combat state)
     */
    static refresh() {
        const instance = CombatCarouselApp.instance;
        if (instance && instance.rendered) {
            instance.render({ force: true });
        }
    }
    async _prepareContext(_options) {
        const combat = game.combats?.active;
        if (!combat) {
            return { active: false, compact: isCompactCarouselViewport() };
        }
        // Build combatants array — use Foundry's `combat.turns` order as-is so portrait order
        // matches `combat.turn` / `nextTurn`. Re-sorting here broke alignment with the tracker.
        const combatants = [];
        const rawTurnsArray = Array.isArray(combat.turns) ? combat.turns : [];
        let turns = [...rawTurnsArray];
        let turnsSource = turns.length > 0
            ? 'combat.turns (Foundry order, carousel uses as-is)'
            : 'fallback (empty combat.turns): sorted combatants by ini desc, id tiebreak';
        if (turns.length === 0 && combat.combatants) {
            turns = Array.from(combat.combatants.values()).sort((a, b) => {
                const aInit = a.initiative ?? 0;
                const bInit = b.initiative ?? 0;
                if (aInit === bInit)
                    return String(a.id ?? '').localeCompare(String(b.id ?? ''));
                return bInit - aInit;
            });
        }
        const currentCombatantId = resolveCurrentCombatantId(combat);
        const isGM = game.user?.isGM || false;
        const prefs = readCarouselClientPrefs();
        const guidedMove = getActiveGuidedMovementSummary();
        for (const combatant of turns) {
            const actor = combatant.actor;
            if (!actor)
                continue;
            const tokenId = combatant.tokenId || combatant.token?.id;
            const token = tokenId ? canvas.tokens?.get(tokenId) : null;
            // Active Specials / conditions from `system.statusEffects` — ONLY entries
            // that are actually present (value > 0, or valueless conditions like
            // Prone). Buffs/passives are intentionally NOT mirrored here (they used
            // to duplicate the combat strip and confused players). Hover shows
            // "Name (X)" so the table sees each combatant's Specials at a glance.
            const statusIcons = [];
            try {
                const tokenDoc = combatant.token?.document ?? combatant.token ?? token?.document ?? token;
                const effectList = readActorStatusEffects(actor, tokenDoc);
                for (const entry of effectList) {
                    const rawId = String(entry?.id ?? '').trim().toLowerCase();
                    const rawName = String(entry?.name ?? '').replace(/\(x\)/gi, '').trim();
                    if (!rawId && !rawName)
                        continue;
                    const value = entry?.value == null ? null : Math.floor(Number(entry.value) || 0);
                    if (value !== null && value <= 0)
                        continue;
                    const reg = MASTERY_STATUS_EFFECTS.find((e) => e.id === rawId) ??
                        MASTERY_STATUS_EFFECTS.find((e) => e.name.toLowerCase() === rawName.toLowerCase());
                    const label = reg?.name ?? rawName ?? rawId;
                    const tokenIcon = specialTokenIcon(rawId) ?? (reg ? specialTokenIcon(reg.id) : null);
                    statusIcons.push({
                        icon: tokenIcon ?? reg?.img ?? 'systems/mastery-system/assets/icons/status/hazard.svg',
                        name: label,
                        tooltip: value !== null ? `${label} (${value})` : label,
                        kind: 'special',
                        cssClass: tokenIcon ? 'status-icon status-effect-token' : undefined,
                    });
                }
            }
            catch (err) {
                console.warn('Mastery System | [CAROUSEL] Failed to build status icons:', err);
            }
            // Build the segmented HP bar: one segment per health-bar (wound level).
            // Dynamically includes extra bars from passives/equipment. Each segment
            // carries a `severity` index (0=healthy-green, 1=yellow, 2=orange, 3=red,
            // 4+=dark-red) derived from its position so extra bars degrade further.
            // Scarred (empty) bars get an X so players see they cannot heal there
            // until Remove Scar opens the bar again.
            let hpSegments = [];
            let hpTotalCurrent = 0;
            let hpTotalMax = 0;
            let hpScarredCount = 0;
            // Temp HP (e.g. Vitality "Temporary HP" stone power) — shown as a separate
            // badge on the banner so players can see their cushion before damage lands.
            const tempHP = Math.max(0, Math.floor(Number(actor.system?.health?.tempHP ?? 0) || 0));
            try {
                hpSegments = buildCarouselHpSegments(actor.system?.health?.bars);
                for (const seg of hpSegments) {
                    hpTotalCurrent += seg.current;
                    hpTotalMax += seg.max;
                    if (seg.scarred)
                        hpScarredCount += 1;
                }
            }
            catch (err) {
                console.warn('Mastery System | [CAROUSEL] Failed to build HP segments:', err);
            }
            // Segmented Stress bar — same layout as HP (Healthy → Breaking).
            const stressSegments = [];
            let stressTotalCurrent = 0;
            let stressTotalMax = 0;
            try {
                const bars = actor.system?.stress?.bars;
                if (Array.isArray(bars) && bars.length > 0) {
                    for (const bar of bars) {
                        const cur = Math.max(0, Math.floor(Number(bar?.current ?? 0) || 0));
                        const mx = Math.max(0, Math.floor(Number(bar?.max ?? 0) || 0));
                        stressTotalCurrent += cur;
                        stressTotalMax += mx;
                    }
                    if (stressTotalMax > 0) {
                        bars.forEach((bar, idx) => {
                            const cur = Math.max(0, Math.floor(Number(bar?.current ?? 0) || 0));
                            const mx = Math.max(0, Math.floor(Number(bar?.max ?? 0) || 0));
                            const severity = Math.min(3, idx);
                            const widthPct = mx > 0 ? (mx / stressTotalMax) * 100 : 0;
                            stressSegments.push({
                                name: String(bar?.name ?? `Stress ${idx + 1}`),
                                current: cur,
                                max: mx,
                                severity,
                                widthPct,
                            });
                        });
                    }
                }
            }
            catch (err) {
                console.warn('Mastery System | [CAROUSEL] Failed to build Stress segments:', err);
            }
            // Use actor portrait, not token image
            const portraitImg = actor.img || actor.prototypeToken?.texture?.src || combatant.img;
            // At-a-glance combat totals (same numbers as the character-sheet header strip).
            let combatStrip = null;
            try {
                // Re-run derived prep so `conditionExpr` that depends on token positions
                // (e.g. adjacent enemies) matches the canvas after any token has moved.
                try {
                    if (typeof actor.prepareDerivedData === 'function') {
                        actor.prepareDerivedData();
                    }
                }
                catch {
                    /* ignore */
                }
                const c = actor.system?.combat ?? {};
                const drPct = Math.max(0, Math.min(100, Math.floor(Number(c.damageReductionPct ?? 0) || 0)));
                const stripTooltip = (() => {
                    try {
                        const i18n = globalThis.game?.i18n;
                        const loc = (k, fb) => {
                            const s = i18n?.localize?.(k);
                            return s && !String(s).startsWith('MASTERY.') ? String(s) : fb;
                        };
                        const a = Math.floor(Number(c.armorTotal ?? 0) || 0);
                        const e = Math.floor(Number(c.evadeTotal ?? 0) || 0);
                        const dr = drPct;
                        const ar = c.armorBreakdownRows || [];
                        const ev = c.evadeBreakdownRows || [];
                        const drR = c.damageReductionRows || [];
                        const line = (rows, max) => rows
                            .slice(0, max)
                            .map((r) => `${r.label}: ${r.display ?? r.value}`)
                            .join('\n');
                        const drLine = loc('MASTERY.combatStripDrSustained', 'DR {pct}%').replace('{pct}', String(dr));
                        const reactionNote = loc('MASTERY.combatStripReactionDrNote', 'Per-hit reaction DR% is added in the damage dialog, not in this sustained value.');
                        return [
                            `Armor ${a}`,
                            line(ar, 8),
                            '',
                            `Evade ${e}`,
                            line(ev, 8),
                            '',
                            drLine,
                            line(drR, 8),
                            '',
                            reactionNote,
                        ]
                            .filter(Boolean)
                            .join('\n');
                    }
                    catch {
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
            }
            catch {
                combatStrip = null;
            }
            const economyActor = (getActionEconomyActor(actor) ?? actor);
            const reactSum = getReactionActionsSummary(economyActor, combat);
            const attackRemaining = getAvailableAttackActions(economyActor, combat);
            const movementRemaining = getAvailableMovementActions(economyActor, combat);
            const roundState = getRoundState(economyActor, combat);
            const attackUsed = Math.max(0, Math.floor(Number(roundState.attackActions?.used) || 0));
            const movementUsed = Math.max(0, Math.floor(Number(roundState.movementActions?.used) || 0));
            const attackTotal = Math.max(attackRemaining + attackUsed, Math.floor(Number(roundState.attackActions?.total) || 0));
            const movementTotal = Math.max(movementRemaining + movementUsed, Math.floor(Number(roundState.movementActions?.total) || 0));
            const disposition = combatantDisposition(combatant, token, actor);
            const ownsActor = typeof actor.testUserPermission === 'function' &&
                !!game.user &&
                actor.testUserPermission(game.user, 'OWNER');
            const hideHpNumbers = !isGM && !ownsActor && hideCarouselHpNumbers(actor.type, disposition);
            const visibleStatusIcons = prefs.showStatusIcons
                ? statusIcons.filter((item) => item && item.icon)
                : [];
            const tip = buildCarouselTooltip({
                mode: prefs.tooltipMode,
                name: String(combatant.name || actor.name || ''),
                initiative: combatant.initiative ?? 0,
                statusTooltips: visibleStatusIcons.map((s) => String(s.tooltip || s.name || '')).filter(Boolean),
                hideVitals: hideHpNumbers,
                armor: combatStrip?.armor,
                evade: combatStrip?.evade,
                drPct: combatStrip?.drPct,
                attackRemaining,
                attackTotal,
                movementRemaining,
                movementTotal,
                reactionRemaining: reactSum.remaining,
                reactionTotal: reactSum.total,
                tempHP,
                hpScarredCount,
                stressCurrent: stressTotalCurrent,
                stressMax: stressTotalMax,
            });
            const speedMeters = Math.max(0, Math.floor(Number(actor.system?.combat?.speed ?? 0) || 0)) +
                getMovementRangeBonusMeters(economyActor, combat);
            const tokenDocId = String(token?.id ?? tokenId ?? '');
            const moveActive = !!guidedMove &&
                (guidedMove.tokenId === tokenDocId ||
                    (guidedMove.actorId != null && guidedMove.actorId === String(actor.id || '')));
            const pendingSafe = (() => {
                try {
                    const raw = economyActor?.getFlag?.('mastery-system', PENDING_SAFE_MOVEMENT_FLAG);
                    const m = Math.max(0, Math.floor(Number(raw?.meters ?? raw) || 0));
                    return m > 0 ? m : 0;
                }
                catch {
                    return 0;
                }
            })();
            const pendingSlip = (() => {
                try {
                    const raw = economyActor?.getFlag?.('mastery-system', PENDING_SLIP_FLAG);
                    if (raw && typeof raw === 'object' && raw.used === true)
                        return 0;
                    const m = Math.max(0, Math.floor(Number(raw?.meters ?? raw) || 0));
                    return m > 0 ? m : 0;
                }
                catch {
                    return 0;
                }
            })();
            const showMoveStrip = !hideHpNumbers &&
                (ownsActor ||
                    combatant.id === currentCombatantId ||
                    moveActive);
            const favoritePowers = ownsActor && actor.type === 'character'
                ? (() => {
                    const ids = readPowerFavorites(actor);
                    if (!ids.length)
                        return [];
                    return ids
                        .map((id) => {
                        const item = actor.items?.get?.(id);
                        if (!item || item.type !== 'power')
                            return null;
                        const used = hasPowerBeenUsedThisRound(economyActor, combat, id);
                        return {
                            id,
                            name: String(item.name || 'Power'),
                            img: String(item.img || 'icons/svg/aura.svg'),
                            used,
                            disabled: used,
                        };
                    })
                        .filter(Boolean);
                })()
                : [];
            combatants.push({
                id: combatant.id,
                name: combatant.name || actor.name,
                img: portraitImg,
                initiative: combatant.initiative ?? 0,
                reactionRemaining: reactSum.remaining,
                reactionTotal: reactSum.total,
                attackRemaining,
                attackTotal,
                movementRemaining,
                movementTotal,
                canRefundAttack: isGM && attackUsed > 0,
                canRefundMovement: isGM && movementUsed > 0,
                canRefundReaction: isGM && reactSum.used > 0,
                showGmActionRefund: isGM && !isEncounterPreparing(combat),
                isCurrent: !isEncounterPreparing(combat) &&
                    arePlayerStonesReadyForRound(combat) &&
                    String(combatant.id) === String(currentCombatantId),
                isNext: false,
                showEndTurn: !isEncounterPreparing(combat) &&
                    arePlayerStonesReadyForRound(combat) &&
                    String(combatant.id) === String(currentCombatantId) &&
                    canViewerSeeEndTurn(actor, game.user),
                hidden: combatant.hidden || false,
                defeated: combatant.defeated || false,
                disposition,
                dispositionClass: prefs.showDisposition ? carouselSideClass(actor.type) : '',
                statusIcons: visibleStatusIcons,
                hpTotalCurrent,
                hpTotalMax,
                hpScarredCount,
                tempHP,
                hpSegments,
                hideHpNumbers,
                stressTotalCurrent,
                stressTotalMax,
                stressSegments: prefs.showStressBar ? stressSegments : [],
                combatStrip: prefs.showCombatStrip ? combatStrip : null,
                richTooltip: tip,
                hasToken: !!token,
                tokenId: tokenId,
                moveStrip: showMoveStrip
                    ? {
                        movementRemaining,
                        movementTotal,
                        speedMeters,
                        moveActive,
                        remainingMeters: moveActive ? Math.round(guidedMove.remainingMeters) : null,
                        maxMeters: moveActive ? Math.round(guidedMove.maxMeters) : speedMeters,
                        safeMeters: pendingSafe,
                        slipMeters: pendingSlip,
                    }
                    : null,
                favoritePowers,
                canEditVitals: isGM,
                actorId: String(actor.id || ''),
            });
        }
        const turnsActive = !isEncounterPreparing(combat) && arePlayerStonesReadyForRound(combat);
        const nextCombatantId = prefs.showNextMark
            ? findNextCombatantId(combatants, currentCombatantId, turnsActive)
            : null;
        for (const row of combatants) {
            row.isNext = String(row.id) === String(nextCombatantId);
        }
        const preparing = isEncounterPreparing(combat);
        const stonesReady = arePlayerStonesReadyForRound(combat);
        const startBlockers = preparing ? encounterStartBlockers(combat) : [];
        const startBlockedTpl = game.i18n?.localize('MASTERY.encounterSetup.startBlocked') || 'Still open: {list}';
        const round = Math.max(1, Number(combat.round) || 1);
        const fill = (key, fallback) => (game.i18n?.localize(key) || fallback).replace('{n}', String(round));
        // Between rounds the carousel used to go silent for the GM: turn controls are
        // held back until every PC set stones, and the prepare bar is long gone. The
        // top bar now stays put — it names the round, says who is missing, and keeps
        // the round start and the shutdown within reach, so the GM never has to walk
        // over to the encounter sidebar.
        const roundGateOpen = !preparing && !!combat.started && !stonesReady;
        const pendingList = roundGateOpen ? pendingStonePlayerNames(combat, round).join(', ') : '';
        const topBar = {
            show: preparing || roundGateOpen || isGM,
            isRoundGate: roundGateOpen,
            label: preparing
                ? game.i18n?.localize('MASTERY.encounterSetup.preparing') || 'Preparation'
                : roundGateOpen
                    ? fill('MASTERY.encounterSetup.roundWaiting', 'Round {n} — stones still open') +
                        (pendingList ? ` — ${pendingList}` : '')
                    : fill('MASTERY.encounterSetup.roundLine', 'Round {n}'),
            showPrepareButtons: preparing && isGM,
            showStartRound: roundGateOpen && isGM,
            startRoundLabel: fill('MASTERY.encounterSetup.startRound', 'Start Round {n}'),
            showShutdown: isGM,
        };
        const nextCombatant = combatants.find((c) => c.isNext) ?? null;
        return {
            active: true,
            compact: resolveCarouselCompact(prefs, isCompactCarouselViewport()),
            prefs,
            combatants,
            nextCombatant: nextCombatant
                ? { id: nextCombatant.id, name: nextCombatant.name, img: nextCombatant.img, hasToken: nextCombatant.hasToken }
                : null,
            controlsAllowed: isGM,
            showPlayerEndTurn: !isGM && userMayEndCurrentTurn(game.user, combat),
            currentRound: combat.round || 1,
            currentTurn: combat.turn || 0,
            preparing,
            stonesReady,
            topBar,
            canStartLive: preparing && startBlockers.length === 0,
            startBlockedReason: startBlockers.length
                ? startBlockedTpl.replace('{list}', startBlockers.join(', '))
                : game.i18n?.localize('MASTERY.encounterSetup.startCombat') || 'Start Combat',
        };
    }
    async _onRender(_context, _options) {
        super._onRender?.(_context, _options);
        const root = this.element;
        // Add body class when carousel is rendered
        document.body.classList.add('mastery-carousel-open');
        this.pinBehindSheets();
        this.applyCompactLayout();
        this.bindCompactViewportWatch();
        this.bindResizeHandle(root);
        if (this.hookEntries.length === 0) {
            this.registerUpdateHooks();
        }
        // Name click — Stone Powers (Passives live in that dialog).
        root.querySelectorAll('.js-open-stone-powers').forEach((nameEl) => {
            nameEl.onclick = async (ev) => {
                ev.preventDefault();
                ev.stopPropagation();
                const portrait = nameEl.closest('.carousel-portrait');
                const combatantId = portrait?.dataset.combatantId;
                if (!combatantId)
                    return;
                const combat = game.combats?.active;
                const combatant = combat?.combatants?.get(combatantId);
                const actor = combatant?.actor;
                if (!combatant || !actor || actor.type !== 'character')
                    return;
                if (game.user?.isGM) {
                    await forceEncounterDialog('stones', combatant);
                    return;
                }
                const { StonePowersDialog } = await import('../stones/stone-powers-dialog.js');
                await StonePowersDialog.showForActor(actor, combatant);
            };
            nameEl.ondblclick = (ev) => {
                ev.preventDefault();
                ev.stopPropagation();
            };
        });
        const panToCombatant = (combatantId) => {
            const combat = game.combats?.active;
            if (!combat)
                return;
            const combatant = combat.combatants.get(combatantId);
            if (!combatant)
                return;
            const tokenId = combatant.tokenId || combatant.token?.id;
            const token = tokenId ? canvas.tokens?.get(tokenId) : null;
            if (!token)
                return;
            token.control({ releaseOthers: true });
            canvas.animatePan({
                x: token.center.x,
                y: token.center.y,
                scale: canvas.stage.scale.x,
            });
        };
        root.querySelectorAll('.js-pan-next').forEach((btn) => {
            btn.onclick = (ev) => {
                ev.preventDefault();
                ev.stopPropagation();
                const id = btn.dataset.combatantId;
                if (id)
                    panToCombatant(id);
            };
        });
        root.querySelectorAll('.js-carousel-settings').forEach((btn) => {
            btn.onclick = (ev) => {
                ev.preventDefault();
                ev.stopPropagation();
                void this.openCarouselSettingsDialog();
            };
        });
        root.querySelectorAll('.js-edit-temp-hp').forEach((el) => {
            el.onclick = (ev) => {
                ev.preventDefault();
                ev.stopPropagation();
                if (!game.user?.isGM)
                    return;
                const actorId = el.dataset.actorId || '';
                const combatantEl = el.closest('.carousel-combatant');
                const combatantId = combatantEl?.dataset.combatantId || '';
                const combatant = game.combats?.active?.combatants?.get(combatantId);
                const tokenId = combatant?.tokenId || combatant?.token?.id;
                const actor = resolveLiveActor(actorId, tokenId) ?? combatant?.actor;
                if (!actor)
                    return;
                const cur = Math.max(0, Math.floor(Number(el.dataset.temp) || 0));
                void this.openVitalsEditDialog({
                    actor,
                    title: `Temp HP — ${actor.name}`,
                    pool: 'health',
                    tempHP: cur,
                });
            };
        });
        root.querySelectorAll('.js-edit-hp-bar, .js-edit-stress-bar').forEach((el) => {
            el.onclick = (ev) => {
                ev.preventDefault();
                ev.stopPropagation();
                if (!game.user?.isGM)
                    return;
                const actorId = el.dataset.actorId || '';
                const combatantEl = el.closest('.carousel-combatant');
                const combatantId = combatantEl?.dataset.combatantId || '';
                const combatant = game.combats?.active?.combatants?.get(combatantId);
                const tokenId = combatant?.tokenId || combatant?.token?.id;
                const actor = resolveLiveActor(actorId, tokenId) ?? combatant?.actor;
                if (!actor)
                    return;
                const pool = el.classList.contains('js-edit-stress-bar') ? 'stress' : 'health';
                const barIndex = Math.max(0, Math.floor(Number(el.dataset.barIndex) || 0));
                const current = Math.max(0, Math.floor(Number(el.dataset.current) || 0));
                const max = Math.max(0, Math.floor(Number(el.dataset.max) || 0));
                const scarred = el.dataset.scarred === '1';
                void this.openVitalsEditDialog({
                    actor,
                    title: `${pool === 'health' ? 'Health' : 'Stress'} bar — ${actor.name}`,
                    pool,
                    barIndex,
                    current,
                    max,
                    scarred,
                });
            };
        });
        root.querySelectorAll('.js-favorite-power').forEach((btn) => {
            btn.onclick = async (ev) => {
                ev.preventDefault();
                ev.stopPropagation();
                if (btn.disabled)
                    return;
                const wrap = btn.closest('.ms-carousel-favorites');
                const combatantId = wrap?.dataset.combatantId;
                const itemId = btn.dataset.itemId;
                if (!combatantId || !itemId)
                    return;
                const combat = game.combats?.active;
                const combatant = combat?.combatants?.get(combatantId);
                const actor = combatant?.actor;
                const tokenId = combatant?.tokenId || combatant?.token?.id;
                const token = tokenId ? canvas.tokens?.get(tokenId) : null;
                if (!actor || !token) {
                    ui.notifications?.warn?.('Token not found for this power.');
                    return;
                }
                const options = await getAllCombatOptionsForActor(actor);
                const option = options.find((o) => o.item?.id === itemId || o.id === itemId);
                if (!option) {
                    ui.notifications?.warn?.('That power is not available right now.');
                    return;
                }
                await handleChosenCombatOption(token, option);
                CombatCarouselApp.refresh();
            };
            btn.oncontextmenu = async (ev) => {
                ev.preventDefault();
                ev.stopPropagation();
                const wrap = btn.closest('.ms-carousel-favorites');
                const combatantId = wrap?.dataset.combatantId;
                const itemId = btn.dataset.itemId;
                if (!combatantId || !itemId)
                    return;
                const combatant = game.combats?.active?.combatants?.get(combatantId);
                const actor = combatant?.actor;
                if (!actor)
                    return;
                await togglePowerFavorite(actor, itemId);
                CombatCarouselApp.refresh();
            };
        });
        // Portrait click - pan to token; double-click - open actor sheet
        root.querySelectorAll('.carousel-portrait').forEach((portrait) => {
            const tip = portrait.querySelector('.ms-carousel-rich-tip');
            if (tip) {
                portrait.onmouseenter = () => {
                    tip.hidden = false;
                };
                portrait.onmouseleave = () => {
                    tip.hidden = true;
                };
            }
            portrait.onclick = async (ev) => {
                const hit = ev.target;
                if (hit?.closest?.('.js-end-turn, .portrait-end-turn, button, .js-open-stone-powers, .js-pan-next, .js-carousel-settings, .ms-carousel-rich-tip, .ms-hp-segment, .ms-hp-temp')) {
                    return;
                }
                const combatantId = portrait.dataset.combatantId;
                if (combatantId)
                    panToCombatant(combatantId);
            };
            portrait.ondblclick = async (ev) => {
                ev.preventDefault();
                ev.stopPropagation();
                const hit = ev.target;
                if (hit?.closest?.('.js-end-turn, .portrait-end-turn, button'))
                    return;
                const combatantId = portrait.dataset.combatantId;
                if (!combatantId)
                    return;
                const combat = game.combats?.active;
                const combatant = combat?.combatants?.get(combatantId);
                const actor = combatant?.actor;
                if (!actor?.sheet)
                    return;
                await actor.sheet.render(true);
            };
        });
        // Combat controls - Previous Turn
        root.querySelectorAll('.js-prev-turn').forEach((btn) => {
            btn.onclick = async (ev) => {
                ev.preventDefault();
                if (!game.user?.isGM)
                    return;
                if (CombatCarouselApp._turnNavigationBusy)
                    return;
                const combat = game.combats?.active;
                if (!combat)
                    return;
                CombatCarouselApp._turnNavigationBusy = true;
                try {
                    await combat.previousTurn();
                }
                finally {
                    CombatCarouselApp._turnNavigationBusy = false;
                }
            };
        });
        // Combat controls - Next Turn
        root.querySelectorAll('.js-next-turn').forEach((btn) => {
            btn.onclick = async (ev) => {
                ev.preventDefault();
                ev.stopPropagation();
                if (CombatCarouselApp._turnNavigationBusy)
                    return;
                const combat = game.combats?.active;
                if (!combat)
                    return;
                if (warnIfPlayerStonesPending(combat))
                    return;
                CombatCarouselApp._turnNavigationBusy = true;
                try {
                    if (game.user?.isGM)
                        await combat.nextTurn();
                    else
                        await requestEndTurn();
                }
                finally {
                    CombatCarouselApp._turnNavigationBusy = false;
                }
            };
        });
        // Combat controls - Next Round
        root.querySelectorAll('.js-next-round').forEach((btn) => {
            btn.onclick = async (ev) => {
                ev.preventDefault();
                if (!game.user?.isGM)
                    return;
                const combat = game.combats?.active;
                if (combat) {
                    if (warnIfPlayerStonesPending(combat))
                        return;
                    await combat.nextRound();
                }
            };
        });
        root.querySelectorAll('.js-roll-npc-ini').forEach((btn) => {
            btn.onclick = async (ev) => {
                ev.preventDefault();
                if (!game.user?.isGM)
                    return;
                const combat = game.combats?.active;
                if (!combat)
                    return;
                const { rollNpcInitiativeOnly } = await import('../combat/initiative-roll.js');
                const n = await rollNpcInitiativeOnly(combat, { force: true });
                CombatCarouselApp.refresh();
                ui.notifications?.info((game.i18n?.localize('MASTERY.encounterSetup.npcIniRolled') || 'NPC initiative rolled ({n}).').replace('{n}', String(n)));
            };
        });
        root.querySelectorAll('.js-start-live-combat').forEach((btn) => {
            btn.onclick = async (ev) => {
                ev.preventDefault();
                const combat = game.combats?.active;
                if (!combat)
                    return;
                const { launchLiveCombat } = await import('../combat/encounter-start.js');
                await launchLiveCombat(combat);
            };
        });
        root.querySelectorAll('.js-shutdown-combat').forEach((btn) => {
            btn.onclick = async (ev) => {
                ev.preventDefault();
                const { shutDownCombat } = await import('../combat/combat-shutdown.js');
                await shutDownCombat();
            };
        });
        root.querySelectorAll('.js-start-round').forEach((btn) => {
            btn.onclick = async (ev) => {
                ev.preventDefault();
                const combat = game.combats?.active;
                if (!combat)
                    return;
                const { promptPendingStoneAssignments } = await import('../combat/stone-powers-flow.js');
                await promptPendingStoneAssignments(combat);
            };
        });
        // Combat controls - End Combat (same path as the tracker shutdown button)
        root.querySelectorAll('.js-end-combat').forEach((btn) => {
            btn.onclick = async (ev) => {
                ev.preventDefault();
                const { shutDownCombat } = await import('../combat/combat-shutdown.js');
                await shutDownCombat();
            };
        });
        // Portrait controls - Toggle Defeated
        root.querySelectorAll('.js-toggle-defeated').forEach((btn) => {
            btn.onclick = async (ev) => {
                ev.preventDefault();
                ev.stopPropagation();
                const portrait = btn.closest('.carousel-portrait');
                if (!portrait)
                    return;
                const combatantId = portrait.dataset.combatantId;
                if (!combatantId)
                    return;
                const combat = game.combats?.active;
                if (!combat)
                    return;
                const combatant = combat.combatants.get(combatantId);
                if (!combatant)
                    return;
                // Only GM or owner can toggle defeated
                const actor = combatant.actor;
                if (!game.user?.isGM && !actor?.isOwner)
                    return;
                const { applyDefeatedPresentation } = await import('../combat/defeated-token.js');
                await applyDefeatedPresentation({
                    actor: combatant.actor,
                    tokenId: String(combatant.tokenId || combatant.token?.id || ''),
                    defeated: !combatant.defeated,
                });
            };
        });
        // GM recovery: refund one spent Attack / Movement / Reaction this round.
        root.querySelectorAll('.js-refund-action').forEach((btn) => {
            btn.onclick = async (ev) => {
                ev.preventDefault();
                ev.stopPropagation();
                if (!game.user?.isGM)
                    return;
                if (btn.disabled)
                    return;
                const portrait = btn.closest('.carousel-portrait');
                const combatantId = portrait?.dataset.combatantId;
                const kind = (btn.dataset.kind || '');
                if (!combatantId || !['attack', 'movement', 'reaction'].includes(kind))
                    return;
                const combat = game.combats?.active;
                const combatant = combat?.combatants?.get(combatantId);
                const actor = combatant?.actor;
                if (!combat || !actor)
                    return;
                const ok = await gmRefundCombatAction(actor, combat, kind);
                const name = String(combatant.name || actor.name || 'combatant');
                if (!ok) {
                    ui.notifications?.warn(game.i18n?.localize('MASTERY.carousel.refundNone') ||
                        `Nothing to refund for ${name} (${kind}).`);
                    return;
                }
                const label = kind === 'attack'
                    ? game.i18n?.localize('MASTERY.carousel.attackActions') || 'Attack'
                    : kind === 'movement'
                        ? game.i18n?.localize('MASTERY.carousel.movementActions') || 'Movement'
                        : game.i18n?.localize('MASTERY.carousel.reactionActions') || 'Reaction';
                ui.notifications?.info((game.i18n?.localize('MASTERY.carousel.refundDone') || 'Refunded 1 {kind} to {name}.')
                    .replace('{kind}', String(label))
                    .replace('{name}', name));
                await this.render({ force: true });
            };
        });
        // Portrait controls - Toggle Hidden
        root.querySelectorAll('.js-toggle-hidden').forEach((btn) => {
            btn.onclick = async (ev) => {
                ev.preventDefault();
                ev.stopPropagation();
                const portrait = btn.closest('.carousel-portrait');
                if (!portrait)
                    return;
                const combatantId = portrait.dataset.combatantId;
                if (!combatantId)
                    return;
                const combat = game.combats?.active;
                if (!combat)
                    return;
                const combatant = combat.combatants.get(combatantId);
                if (!combatant)
                    return;
                // Only GM can toggle hidden
                if (!game.user?.isGM)
                    return;
                await combatant.update({ hidden: !combatant.hidden });
            };
        });
        // Portrait controls - Ping
        root.querySelectorAll('.js-ping').forEach((btn) => {
            btn.onclick = async (ev) => {
                ev.preventDefault();
                ev.stopPropagation();
                const portrait = btn.closest('.carousel-portrait');
                if (!portrait)
                    return;
                const combatantId = portrait.dataset.combatantId;
                if (!combatantId)
                    return;
                const combat = game.combats?.active;
                if (!combat)
                    return;
                const combatant = combat.combatants.get(combatantId);
                if (!combatant)
                    return;
                const tokenId = combatant.tokenId || combatant.token?.id;
                const token = tokenId ? canvas.tokens?.get(tokenId) : null;
                if (token) {
                    canvas.ping(token.center);
                }
            };
        });
        root.querySelectorAll('.js-force-setup').forEach((btn) => {
            btn.onclick = async (ev) => {
                ev.preventDefault();
                ev.stopPropagation();
                const combatantId = btn.dataset.combatantId;
                const kind = btn.dataset.kind;
                if (!combatantId || !kind)
                    return;
                const combat = game.combats?.active;
                const combatant = combat?.combatants.get(combatantId);
                if (!combatant)
                    return;
                await forceEncounterDialog(kind, combatant);
            };
        });
        root.querySelectorAll('.js-force-all-setup').forEach((btn) => {
            btn.onclick = async (ev) => {
                ev.preventDefault();
                ev.stopPropagation();
                const kind = btn.dataset.kind;
                if (!kind)
                    return;
                await forceEncounterDialogForAll(kind);
            };
        });
        // End Turn button — sibling of the portrait, same path as the Next chevron
        root.querySelectorAll('.js-end-turn').forEach((btn) => {
            const button = btn;
            button.disabled = false;
            button.removeAttribute('disabled');
            button.ondblclick = (ev) => {
                ev.preventDefault();
                ev.stopPropagation();
                ev.stopImmediatePropagation();
            };
            button.onclick = async (ev) => {
                ev.preventDefault();
                ev.stopPropagation();
                ev.stopImmediatePropagation();
                await requestEndTurn();
            };
        });
    }
    async _onClose(_options) {
        // Remove hooks
        this.unregisterUpdateHooks();
        this.unbindCompactViewportWatch();
        // Remove body class when carousel is closed
        document.body.classList.remove('mastery-carousel-open');
        document.body.classList.remove('mastery-carousel-compact');
        document.body.classList.remove('mastery-carousel-resizing');
        clearCarouselTopOffset();
        return super._onClose(_options);
    }
    compactViewportHandler = null;
    resizeDrag = null;
    /** Stay under actor sheets so the close button remains clickable. */
    bringToFront() {
        this.pinBehindSheets();
        return this;
    }
    pinBehindSheets() {
        const el = this.element;
        if (!el)
            return;
        el.style.zIndex = String(CAROUSEL_Z_INDEX);
    }
    applyCompactLayout() {
        applyCarouselCompactClass(this.element, isCompactCarouselViewport());
        this.pinBehindSheets();
    }
    bindResizeHandle(root) {
        const handle = root?.querySelector?.('.js-carousel-resize');
        if (!handle || !root)
            return;
        const onMove = (ev) => {
            const drag = this.resizeDrag;
            if (!drag || ev.pointerId !== drag.pointerId)
                return;
            ev.preventDefault();
            const maxW = Math.max(CAROUSEL_MIN_WIDTH, Math.floor(window.innerWidth * 0.96));
            const maxH = Math.max(CAROUSEL_MIN_HEIGHT, Math.floor(window.innerHeight * 0.7));
            const width = clampCarouselWidth(drag.startW + (ev.clientX - drag.startX), maxW);
            const height = clampCarouselHeight(drag.startH + (ev.clientY - drag.startY), maxH);
            applyCarouselUserSize(root, { width, height });
        };
        const endDrag = (ev) => {
            const drag = this.resizeDrag;
            if (!drag || ev.pointerId !== drag.pointerId)
                return;
            this.resizeDrag = null;
            document.body.classList.remove('mastery-carousel-resizing');
            window.removeEventListener('pointermove', onMove, true);
            window.removeEventListener('pointerup', endDrag, true);
            window.removeEventListener('pointercancel', endDrag, true);
            try {
                handle.releasePointerCapture?.(ev.pointerId);
            }
            catch {
                /* ignore */
            }
            const width = Number.parseInt(root.style.getPropertyValue('--ms-carousel-user-width'), 10);
            const height = Number.parseInt(root.style.getPropertyValue('--ms-carousel-user-height'), 10);
            writeCarouselUserSize({
                width: Number.isFinite(width) ? width : null,
                height: Number.isFinite(height) ? height : null,
            });
            syncCarouselTopOffset(root);
        };
        handle.onpointerdown = (ev) => {
            if (ev.button !== 0)
                return;
            ev.preventDefault();
            ev.stopPropagation();
            const inner = root.querySelector('.mastery-carousel');
            const startW = Number.parseInt(root.style.getPropertyValue('--ms-carousel-user-width'), 10) ||
                root.offsetWidth ||
                Math.floor(window.innerWidth * 0.5);
            const startH = Number.parseInt(root.style.getPropertyValue('--ms-carousel-user-height'), 10) ||
                inner?.offsetHeight ||
                root.offsetHeight;
            this.resizeDrag = {
                pointerId: ev.pointerId,
                startX: ev.clientX,
                startY: ev.clientY,
                startW,
                startH,
            };
            try {
                handle.setPointerCapture?.(ev.pointerId);
            }
            catch {
                /* ignore */
            }
            document.body.classList.add('mastery-carousel-resizing');
            window.addEventListener('pointermove', onMove, true);
            window.addEventListener('pointerup', endDrag, true);
            window.addEventListener('pointercancel', endDrag, true);
        };
        handle.ondblclick = (ev) => {
            ev.preventDefault();
            ev.stopPropagation();
            this.resizeDrag = null;
            document.body.classList.remove('mastery-carousel-resizing');
            writeCarouselUserSize({ width: null, height: null });
            applyCarouselUserSize(root, { width: null, height: null });
        };
    }
    bindCompactViewportWatch() {
        if (this.compactViewportHandler)
            return;
        this.compactViewportHandler = () => this.applyCompactLayout();
        window.addEventListener('resize', this.compactViewportHandler);
        window.visualViewport?.addEventListener('resize', this.compactViewportHandler);
    }
    unbindCompactViewportWatch() {
        if (!this.compactViewportHandler)
            return;
        window.removeEventListener('resize', this.compactViewportHandler);
        window.visualViewport?.removeEventListener('resize', this.compactViewportHandler);
        this.compactViewportHandler = null;
    }
    /**
     * Register hooks for live HP/Stress updates
     */
    registerUpdateHooks() {
        // Unregister any existing hooks first
        this.unregisterUpdateHooks();
        const reg = (event, id) => this.hookEntries.push({ event, id });
        // Hook: Update actor (for linked tokens)
        reg('updateActor', Hooks.on('updateActor', (actor, updateData) => {
            const actorId = actor?.id || actor?._id;
            if (!actorId || !this.isRelevantActor(actorId))
                return;
            const hasRelevantChange = this.hasRelevantChange(updateData, 'actor');
            if (hasRelevantChange) {
                this.debouncedRefresh();
            }
        }));
        // Hook: Update token (for unlinked tokens + any token move for adjacency-based passives)
        reg('updateToken', Hooks.on('updateToken', (tokenDoc, updateData) => {
            const posChanged = updateData &&
                (updateData.x !== undefined ||
                    updateData.y !== undefined ||
                    updateData.elevation !== undefined);
            if (posChanged && game.combats?.active?.started) {
                this.debouncedRefresh();
                return;
            }
            if (!this.isRelevantToken(tokenDoc.id))
                return;
            const hasRelevantChange = this.hasRelevantChange(updateData, 'token');
            if (hasRelevantChange) {
                this.debouncedRefresh();
            }
        }));
        // ActiveEffects do not always bubble into `updateActor.system` — refresh strip when buffs change.
        const onEffectChange = (effect) => {
            try {
                const parent = effect?.parent;
                const aid = parent?.id;
                if (aid && parent?.documentName === 'Actor' && this.isRelevantActor(aid)) {
                    this.debouncedRefresh();
                }
            }
            catch {
                /* ignore */
            }
        };
        reg('createActiveEffect', Hooks.on('createActiveEffect', onEffectChange));
        reg('updateActiveEffect', Hooks.on('updateActiveEffect', onEffectChange));
        reg('deleteActiveEffect', Hooks.on('deleteActiveEffect', onEffectChange));
    }
    async openVitalsEditDialog(opts) {
        const isTemp = opts.tempHP != null;
        const content = isTemp
            ? `<form class="ms-carousel-vitals-form"><label>Temp HP <input type="number" name="value" value="${opts.tempHP}" min="0" step="1"/></label></form>`
            : `<form class="ms-carousel-vitals-form">
          <p style="margin:0 0 0.4rem;">Current / max: <strong>${opts.current ?? 0}</strong> / ${opts.max ?? 0}</p>
          <label>Set current <input type="number" name="value" value="${opts.current ?? 0}" min="0" max="${opts.max ?? 0}" step="1"/></label>
          ${opts.scarred
                ? '<label style="display:block;margin-top:0.4rem;"><input type="checkbox" name="clearScar" checked/> Clear scar (fill this bar)</label>'
                : ''}
        </form>`;
        await new Promise((resolve) => {
            new Dialog({
                title: opts.title,
                content,
                buttons: {
                    save: {
                        label: 'Apply',
                        callback: async (html) => {
                            const root = html?.[0] ?? html;
                            const form = root?.querySelector?.('form');
                            if (!form)
                                return;
                            const value = Math.floor(Number(new FormData(form).get('value')) || 0);
                            const clearScar = !!form.querySelector('[name="clearScar"]')?.checked;
                            const res = await applyCarouselVitalsEdit(opts.actor, {
                                pool: opts.pool,
                                barIndex: opts.barIndex,
                                tempHP: isTemp ? value : undefined,
                                fillBar: !isTemp && clearScar,
                                current: !isTemp && !clearScar ? value : undefined,
                            });
                            if (!res.ok) {
                                ui.notifications?.warn?.(res.error || 'Could not update vitals.');
                                return;
                            }
                            CombatCarouselApp.refresh();
                        },
                    },
                    cancel: { label: 'Cancel' },
                },
                default: 'save',
                close: () => resolve(),
            }).render(true);
        });
    }
    /** Client-side carousel display preferences. */
    async openCarouselSettingsDialog() {
        const prefs = readCarouselClientPrefs();
        const content = `
      <form class="ms-carousel-settings-form" style="display:flex;flex-direction:column;gap:0.55rem;">
        <label>Compact mode
          <select name="compactMode">
            <option value="auto"${prefs.compactMode === 'auto' ? ' selected' : ''}>Auto</option>
            <option value="force"${prefs.compactMode === 'force' ? ' selected' : ''}>Force compact</option>
            <option value="off"${prefs.compactMode === 'off' ? ' selected' : ''}>Always full</option>
          </select>
        </label>
        <label><input type="checkbox" name="showCombatStrip"${prefs.showCombatStrip ? ' checked' : ''}/> Combat strip (A / E / DR)</label>
        <label><input type="checkbox" name="showStatusIcons"${prefs.showStatusIcons ? ' checked' : ''}/> Status effect coins</label>
        <label><input type="checkbox" name="showNextMark"${prefs.showNextMark ? ' checked' : ''}/> Next-turn mark</label>
        <label><input type="checkbox" name="showDisposition"${prefs.showDisposition ? ' checked' : ''}/> PC blue / NPC red borders</label>
        <label><input type="checkbox" name="showStressBar"${prefs.showStressBar ? ' checked' : ''}/> Stress bar</label>
        <label>Tooltips
          <select name="tooltipMode">
            <option value="full"${prefs.tooltipMode === 'full' ? ' selected' : ''}>Full</option>
            <option value="short"${prefs.tooltipMode === 'short' ? ' selected' : ''}>Short</option>
            <option value="off"${prefs.tooltipMode === 'off' ? ' selected' : ''}>Off</option>
          </select>
        </label>
      </form>`;
        await new Promise((resolve) => {
            new Dialog({
                title: 'Combat Carousel',
                content,
                buttons: {
                    save: {
                        label: 'Save',
                        callback: async (html) => {
                            const root = html?.[0] ?? html;
                            const form = root?.querySelector?.('form');
                            if (!form)
                                return;
                            const fd = new FormData(form);
                            const next = {
                                compactMode: String(fd.get('compactMode') || 'auto'),
                                tooltipMode: String(fd.get('tooltipMode') || 'full'),
                                showCombatStrip: !!form.querySelector('[name="showCombatStrip"]')?.checked,
                                showStatusIcons: !!form.querySelector('[name="showStatusIcons"]')?.checked,
                                showNextMark: !!form.querySelector('[name="showNextMark"]')?.checked,
                                showDisposition: !!form.querySelector('[name="showDisposition"]')?.checked,
                                showStressBar: !!form.querySelector('[name="showStressBar"]')?.checked,
                            };
                            await writeCarouselClientPrefs(next);
                            CombatCarouselApp.refresh();
                        },
                    },
                    cancel: { label: 'Cancel' },
                },
                default: 'save',
                close: () => resolve(),
            }).render(true);
        });
    }
    /**
     * Unregister update hooks
     */
    unregisterUpdateHooks() {
        for (const { event, id } of this.hookEntries) {
            Hooks.off(event, id);
        }
        this.hookEntries = [];
    }
    /**
     * Check if an actor is relevant to any combatant in the carousel
     */
    isRelevantActor(actorId) {
        const combat = game.combat;
        if (!combat)
            return false;
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
    isRelevantToken(tokenId) {
        const combat = game.combat;
        if (!combat)
            return false;
        for (const combatant of combat.combatants) {
            const combatantTokenId = combatant.tokenId || combatant.token?.id;
            if (combatantTokenId === tokenId) {
                return true;
            }
        }
        return false;
    }
    /**
     * Check if update data contains relevant HP/Stress changes
     */
    hasRelevantChange(updateData, source) {
        if (!updateData)
            return false;
        // For simplicity, always refresh if system data changed
        // (optimization: could check specific paths like system.tracked.hp, system.tracked.stress, system.health)
        if (source === 'actor') {
            return (updateData.system !== undefined ||
                updateData.flags?.['mastery-system'] !== undefined ||
                updateData['flags.mastery-system.statusJson'] !== undefined ||
                updateData['flags.mastery-system.statusEffects'] !== undefined);
        }
        const delta = updateData.delta ?? updateData.actorData ?? {};
        return (updateData.system !== undefined ||
            updateData.flags !== undefined ||
            delta.system !== undefined ||
            delta.flags !== undefined ||
            updateData['flags.mastery-system.statusJson'] !== undefined ||
            updateData['flags.mastery-system.statusEffects'] !== undefined);
    }
    /**
     * Debounced refresh to avoid excessive re-renders
     */
    refreshTimeout = null;
    debouncedRefresh() {
        if (this.refreshTimeout !== null) {
            clearTimeout(this.refreshTimeout);
        }
        this.refreshTimeout = window.setTimeout(() => {
            if (this.rendered) {
                CombatCarouselApp.refresh();
            }
            this.refreshTimeout = null;
        }, 150);
    }
}
//# sourceMappingURL=combat-carousel.js.map