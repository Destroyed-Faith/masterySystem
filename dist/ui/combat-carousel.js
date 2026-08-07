import { getActionEconomyActor, getReactionActionsSummary, isStonePowersConfigurationLocked, } from '../combat/action-economy.js';
import { requestEndTurn } from '../combat/end-turn.js';
import { StonePowersDialog } from '../stones/stone-powers-dialog.js';
import { MASTERY_STATUS_EFFECTS } from '../system/status-effects.js';
const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;
// Type workaround for Mixin
const BaseCarousel = HandlebarsApplicationMixin(ApplicationV2);
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
        }
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
            existingApp.bringToFront();
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
            return { active: false };
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
        const currentCombatantId = combat.combatant?.id ?? combat.current?.combatantId ?? null;
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
                const effectList = Array.isArray(actor.system?.statusEffects)
                    ? actor.system.statusEffects
                    : [];
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
                    statusIcons.push({
                        icon: reg?.img ?? 'systems/mastery-system/assets/icons/status/hazard.svg',
                        name: label,
                        tooltip: value !== null ? `${label} (${value})` : label,
                        kind: 'special',
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
            const hpSegments = [];
            let hpTotalCurrent = 0;
            let hpTotalMax = 0;
            // Temp HP (e.g. Vitality "Temporary HP" stone power) — shown as a separate
            // badge on the banner so players can see their cushion before damage lands.
            const tempHP = Math.max(0, Math.floor(Number(actor.system?.health?.tempHP ?? 0) || 0));
            try {
                const bars = actor.system?.health?.bars;
                if (Array.isArray(bars) && bars.length > 0) {
                    for (const bar of bars) {
                        const cur = Math.max(0, Math.floor(Number(bar?.current ?? 0) || 0));
                        const mx = Math.max(0, Math.floor(Number(bar?.max ?? 0) || 0));
                        hpTotalCurrent += cur;
                        hpTotalMax += mx;
                    }
                    if (hpTotalMax > 0) {
                        bars.forEach((bar, idx) => {
                            const cur = Math.max(0, Math.floor(Number(bar?.current ?? 0) || 0));
                            const mx = Math.max(0, Math.floor(Number(bar?.max ?? 0) || 0));
                            const severity = Math.min(4, idx); // clamp so extras still render
                            const widthPct = mx > 0 ? (mx / hpTotalMax) * 100 : 0;
                            hpSegments.push({
                                name: String(bar?.name ?? `Bar ${idx + 1}`),
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
            const reactSum = getReactionActionsSummary((getActionEconomyActor(actor) ?? actor), combat);
            combatants.push({
                id: combatant.id,
                name: combatant.name || actor.name,
                img: portraitImg,
                initiative: combatant.initiative ?? 0,
                reactionRemaining: reactSum.remaining,
                reactionTotal: reactSum.total,
                isCurrent: combatant.id === currentCombatantId,
                hidden: combatant.hidden || false,
                defeated: combatant.defeated || false,
                statusIcons: statusIcons.filter((item) => item && item.icon),
                hpTotalCurrent,
                hpTotalMax,
                tempHP,
                hpSegments,
                stressTotalCurrent,
                stressTotalMax,
                stressSegments,
                combatStrip,
                hasToken: !!token,
                tokenId: tokenId,
                showStonePowersButton: actor.type === 'character' && !!(game.user?.isGM || actor.isOwner),
                stonePlanLocked: actor.type === 'character' && isStonePowersConfigurationLocked(actor, combat)
            });
        }
        return {
            active: true,
            combatants,
            controlsAllowed: game.user?.isGM || false,
            currentRound: combat.round || 1,
            currentTurn: combat.turn || 0
        };
    }
    async _onRender(_context, _options) {
        super._onRender?.(_context, _options);
        const root = this.element;
        // Add body class when carousel is rendered
        document.body.classList.add('mastery-carousel-open');
        // Register hooks for live updates (only once per render)
        this.registerUpdateHooks();
        // Portrait click - pan to token; double-click - open actor sheet
        root.querySelectorAll('.carousel-portrait').forEach((portrait) => {
            portrait.onclick = async (_ev) => {
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
                    token.control({ releaseOthers: true });
                    canvas.animatePan({
                        x: token.center.x,
                        y: token.center.y,
                        scale: canvas.stage.scale.x
                    });
                }
            };
            portrait.ondblclick = async (ev) => {
                ev.preventDefault();
                ev.stopPropagation();
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
                if (CombatCarouselApp._turnNavigationBusy)
                    return;
                const combat = game.combats?.active;
                if (!combat)
                    return;
                CombatCarouselApp._turnNavigationBusy = true;
                try {
                    await combat.nextTurn();
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
                const combat = game.combats?.active;
                if (combat) {
                    await combat.nextRound();
                }
            };
        });
        // Combat controls - End Combat
        root.querySelectorAll('.js-end-combat').forEach((btn) => {
            btn.onclick = async (ev) => {
                ev.preventDefault();
                if (game.user?.isGM) {
                    const combat = game.combats?.active;
                    if (combat) {
                        await combat.endCombat();
                    }
                }
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
                await combatant.update({ defeated: !combatant.defeated });
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
        // Stone Powers (PC owners + GM)
        root.querySelectorAll('.js-carousel-stone-powers').forEach((btn) => {
            btn.onclick = async (ev) => {
                ev.preventDefault();
                ev.stopPropagation();
                if (btn.disabled)
                    return;
                const combatantId = btn.dataset.combatantId;
                if (!combatantId)
                    return;
                const combat = game.combats?.active;
                if (!combat)
                    return;
                const combatant = combat.combatants.get(combatantId);
                if (!combatant)
                    return;
                // Resolve the TOKEN's actor explicitly. `combatant.actor` can fall back
                // to the world/prototype actor (default attributes, empty stone pools)
                // when the token reference is shaky — which made the dialog open empty.
                // The token document's actor is the same (synthetic, delta-carrying)
                // actor the character sheet uses, so the carousel now matches the sheet.
                const tokenDoc = combatant.token ??
                    (combatant.sceneId
                        ? game.scenes?.get(combatant.sceneId)?.tokens?.get(combatant.tokenId)
                        : null);
                const actor = (tokenDoc?.actor ?? combatant.actor);
                if (!actor || actor.type !== 'character')
                    return;
                // Diagnostic: if the resolved actor has no stone-pool capacity the
                // dialog will look "dead". Logging the source + pool maxes makes the
                // unlinked-token vs world-actor mismatch obvious in the console.
                try {
                    const pools = actor.system?.stonePools ?? {};
                }
                catch {
                    /* diagnostic only */
                }
                try {
                    await StonePowersDialog.showForActor(actor, combatant);
                }
                catch (e) {
                    console.error('Mastery System | Carousel Stone Powers failed', e);
                }
            };
        });
        // End Turn button (on current combatant card)
        root.querySelectorAll('.js-end-turn').forEach((btn) => {
            btn.onclick = async (ev) => {
                ev.preventDefault();
                ev.stopPropagation();
                await requestEndTurn();
            };
        });
    }
    async _onClose(_options) {
        // Remove hooks
        this.unregisterUpdateHooks();
        // Remove body class when carousel is closed
        document.body.classList.remove('mastery-carousel-open');
        return super._onClose(_options);
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
                updateData.flags?.['mastery-system'] !== undefined);
        }
        else {
            // For tokens, check delta.system or actorData.system
            return updateData.delta?.system !== undefined ||
                updateData.actorData?.system !== undefined ||
                updateData.system !== undefined;
        }
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