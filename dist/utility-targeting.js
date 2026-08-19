/**
 * Utility Targeting System for Mastery System
 *
 * Provides targeting preview and selection for utility powers, especially AoE utilities
 * Supports single-target and radius AoE with manual target selection
 */
import { consumeAttackAction, getAvailableAttackActions, markPowerUsedThisRound, markNpcAttackUsedThisRound, } from './combat/action-economy';
import { extractMeleeAoePowerBonusD8 } from './utils/power-mechanics.js';
import { getNpcAttackByIndex, npcDamageDiceFormula } from './utils/npc-attack-model.js';
import { isWithinMasteryPowerRange, masteryAoERadiusPixels, masteryPowerMaxSteps } from './utils/grid-range.js';
import { clearHexHighlight, highlightHexesWithinStepsFromPoint } from './utils/hex-highlighting.js';
import { eventWorldPoint, resolveOverlayContainer, snapWorldCenter, } from './utils/grid-snap.js';
import { pickTokenAtPoint } from './utils/token-pick.js';
function placementColorsFromOption(option) {
    if (option.aoePlacementProfile === 'hostile-zone') {
        return {
            hex: 0xff8833,
            hexAlpha: 0.35,
            previewAlpha: 0.28,
            lineValid: 0xffaa44,
            lineInvalid: 0xff4444,
            tokenTint: 0xff8833,
            previewLine: 0xff8833,
            previewFill: 0xff8833
        };
    }
    return {
        hex: 0x66aaff,
        hexAlpha: 0.35,
        previewAlpha: 0.28,
        lineValid: 0x66aaff,
        lineInvalid: 0xff6666,
        tokenTint: 0x66aaff,
        previewLine: 0x66aaff,
        previewFill: 0x66aaff
    };
}
// Global utility targeting state
let activeUtilityTargeting = null;
/**
 * Check if a token is an ally of the caster
 */
function isAlly(casterToken, targetToken) {
    const casterActor = casterToken.actor;
    const targetActor = targetToken.actor;
    if (!casterActor || !targetActor)
        return false;
    // Same actor
    if (casterActor.id === targetActor.id)
        return true;
    // Player characters are one party — regardless of token disposition
    // (scenes often carry misconfigured/default dispositions).
    if (casterActor.type === 'character' && targetActor.type === 'character')
        return true;
    // Check disposition
    const casterDisposition = casterToken.document.disposition;
    const targetDisposition = targetToken.document.disposition;
    // Friendly or neutral to friendly
    if (casterDisposition === CONST.TOKEN_DISPOSITIONS.FRIENDLY &&
        targetDisposition === CONST.TOKEN_DISPOSITIONS.FRIENDLY) {
        return true;
    }
    // Check if same player owns both
    if (casterActor.hasPlayerOwner && targetActor.hasPlayerOwner) {
        const casterOwners = casterActor.ownership;
        const targetOwners = targetActor.ownership;
        // If any player owns both, they're allies
        for (const userId in casterOwners) {
            if (casterOwners[userId] > 0 && targetOwners[userId] > 0) {
                return true;
            }
        }
    }
    return false;
}
/**
 * Check if a token is an enemy of the caster
 */
function isEnemy(_casterToken, targetToken) {
    const targetDisposition = targetToken.document.disposition;
    return targetDisposition === CONST.TOKEN_DISPOSITIONS.HOSTILE;
}
/**
 * Check if token matches target group
 */
function matchesTargetGroup(casterToken, targetToken, group) {
    if (group === 'self') {
        return casterToken.id === targetToken.id;
    }
    if (group === 'ally') {
        return isAlly(casterToken, targetToken);
    }
    if (group === 'enemy') {
        return isEnemy(casterToken, targetToken);
    }
    if (group === 'creature' || group === 'any') {
        return true; // All tokens match
    }
    return false;
}
/**
 * Find candidate tokens within radius
 */
function findCandidatesInRadius(casterToken, center, radiusMeters, targetGroup) {
    const candidates = new Map();
    const allTokens = canvas.tokens?.placeables || [];
    for (const token of allTokens) {
        const tokenCenter = token.center;
        if (isWithinMasteryPowerRange(center, tokenCenter, radiusMeters)) {
            const isAllyToken = isAlly(casterToken, token);
            const isEnemyToken = isEnemy(casterToken, token);
            const matches = matchesTargetGroup(casterToken, token, targetGroup);
            const state = {
                token,
                inRadius: true,
                selected: matches, // Default: selected if matches target group
                isAlly: isAllyToken,
                isEnemy: isEnemyToken,
                originalAlpha: token.alpha
            };
            candidates.set(token.id, state);
        }
    }
    return candidates;
}
/**
 * Highlight radius area on grid
 */
function highlightRadiusArea(state) {
    if (!state.previewGraphics || !state.center)
        return;
    const center = state.center;
    const grid = canvas.grid;
    const gridless = !grid || grid.type === CONST.GRID_TYPES.GRIDLESS;
    state.previewGraphics.clear();
    const c = state.placement;
    if (gridless) {
        const radiusPx = masteryAoERadiusPixels(state.radiusMeters);
        if (state.radiusMeters > 0 && radiusPx > 0) {
            state.previewGraphics.lineStyle(2, c.previewLine, 0.85);
            state.previewGraphics.beginFill(c.previewFill, 0.14);
            state.previewGraphics.drawCircle(0, 0, radiusPx);
            state.previewGraphics.endFill();
        }
        state.previewGraphics.position.set(center.x, center.y);
        return;
    }
    state.previewGraphics.position.set(0, 0);
    const steps = masteryPowerMaxSteps(state.radiusMeters);
    clearHexHighlight(state.highlightId);
    if (steps > 0) {
        highlightHexesWithinStepsFromPoint(center, steps, state.highlightId, c.hex, c.hexAlpha);
    }
}
/**
 * Update visual markers for candidate tokens
 */
function updateCandidateVisuals(state) {
    for (const [, candidate] of state.candidates.entries()) {
        const token = candidate.token;
        // Restore original alpha
        token.alpha = candidate.originalAlpha;
        // Remove existing filters
        if (token.filters) {
            token.filters = token.filters.filter((f) => {
                return !(f instanceof PIXI.filters.ColorMatrixFilter);
            });
            if (token.filters.length === 0) {
                token.filters = null;
            }
        }
        // Apply visual based on selection state
        if (candidate.selected) {
            token.alpha = Math.min(1.0, candidate.originalAlpha);
            const tintFilter = new PIXI.filters.ColorMatrixFilter();
            tintFilter.tint(state.placement.tokenTint, false);
            token.filters = [...(token.filters || []), tintFilter];
        }
        else {
            // Not selected: faded
            token.alpha = candidate.originalAlpha * 0.4;
        }
    }
}
/**
 * Create UI panel for target selection
 */
function createTargetSelectionPanel(state) {
    const confirmLabel = state.option.aoePlacementProfile === 'hostile-zone' ? 'Zone bestätigen' : 'Confirm Utility';
    const panelContent = `
    <div class="mastery-utility-panel">
      <div class="panel-header">
        <h4>${state.option.name}</h4>
        <div class="panel-subtitle">Select Targets</div>
      </div>
      <div class="panel-controls">
        <button class="panel-btn" data-action="allies">Allies</button>
        <button class="panel-btn" data-action="enemies">Enemies</button>
        <button class="panel-btn" data-action="all">All</button>
        <button class="panel-btn" data-action="none">None</button>
      </div>
      <div class="panel-toggle">
        <label title="Verbündete und Spieler-Charaktere können nicht als Ziel gewählt werden, solange aktiv.">
          <input type="checkbox" id="exclude-allies" ${state.excludeAllies ? 'checked' : ''}>
          Verbündete/Spieler ausnehmen
        </label>
      </div>
      <div class="panel-toggle">
        <label>
          <input type="checkbox" id="manual-mode" ${state.manualMode ? 'checked' : ''}>
          Manual Selection Mode
        </label>
      </div>
      <div class="panel-actions">
        <button class="panel-btn confirm" data-action="confirm">${confirmLabel}</button>
        <button class="panel-btn cancel" data-action="cancel">Cancel</button>
      </div>
      <div class="panel-info">
        <div>Selected: <span id="selected-count">0</span></div>
      </div>
    </div>
  `;
    // Create a simple dialog-like panel using Foundry's Dialog
    const panel = {
        element: null,
        render: function () {
            const html = $(panelContent);
            // Update selected count
            const updateCount = () => {
                const count = state.selectedTargets.size;
                html.find('#selected-count').text(count);
            };
            // Button handlers
            html.find('[data-action="allies"]').on('click', () => {
                // Explicitly targeting allies overrides the exclusion filter.
                if (state.excludeAllies) {
                    state.excludeAllies = false;
                    html.find('#exclude-allies').prop('checked', false);
                }
                for (const [tokenId, candidate] of state.candidates.entries()) {
                    candidate.selected = candidate.isAlly;
                    if (candidate.selected) {
                        state.selectedTargets.add(tokenId);
                    }
                    else {
                        state.selectedTargets.delete(tokenId);
                    }
                }
                updateCandidateVisuals(state);
                updateCount();
            });
            html.find('[data-action="enemies"]').on('click', () => {
                for (const [tokenId, candidate] of state.candidates.entries()) {
                    candidate.selected = candidate.isEnemy;
                    if (candidate.selected) {
                        state.selectedTargets.add(tokenId);
                    }
                    else {
                        state.selectedTargets.delete(tokenId);
                    }
                }
                updateCandidateVisuals(state);
                updateCount();
            });
            html.find('[data-action="all"]').on('click', () => {
                for (const [tokenId, candidate] of state.candidates.entries()) {
                    if (state.excludeAllies && candidate.isAlly) {
                        candidate.selected = false;
                        state.selectedTargets.delete(tokenId);
                        continue;
                    }
                    candidate.selected = true;
                    state.selectedTargets.add(tokenId);
                }
                updateCandidateVisuals(state);
                updateCount();
            });
            html.find('[data-action="none"]').on('click', () => {
                for (const [tokenId, candidate] of state.candidates.entries()) {
                    candidate.selected = false;
                    state.selectedTargets.delete(tokenId);
                }
                updateCandidateVisuals(state);
                updateCount();
            });
            html.find('#exclude-allies').on('change', (ev) => {
                state.excludeAllies = ev.target.checked;
                if (state.excludeAllies) {
                    // Drop any allies that are currently selected.
                    for (const [tokenId, candidate] of state.candidates.entries()) {
                        if (candidate.isAlly && candidate.selected) {
                            candidate.selected = false;
                            state.selectedTargets.delete(tokenId);
                        }
                    }
                    updateCandidateVisuals(state);
                    updateCount();
                }
            });
            html.find('#manual-mode').on('change', (ev) => {
                state.manualMode = ev.target.checked;
            });
            html.find('[data-action="confirm"]').on('click', () => {
                if (state.selectedTargets.size === 0) {
                    ui.notifications?.warn('No targets selected.');
                    return;
                }
                confirmUtilityTargets(state);
            });
            html.find('[data-action="cancel"]').on('click', () => {
                endUtilityTargeting(false);
            });
            updateCount();
            // Create a container div and append to body
            const container = $('<div class="mastery-utility-panel-container"></div>');
            container.append(html);
            $('body').append(container);
            panel.element = container[0];
            return html;
        },
        close: function () {
            if (this.element) {
                $(this.element).remove();
                this.element = null;
            }
        }
    };
    return panel;
}
/**
 * Start single-target utility mode
 */
export function startUtilitySingleTargetMode(token, option) {
    // Cancel any existing utility targeting
    endUtilityTargeting(false);
    // Ensure token is controlled
    token.control({ releaseOthers: false });
    const rangeMeters = option.rangeMeters || option.range || 0;
    const targetGroup = option.defaultTargetGroup || 'ally';
    // Create preview graphics
    const previewGraphics = new PIXI.Graphics();
    const rangeLineGraphics = new PIXI.Graphics();
    const effectsContainer = resolveOverlayContainer();
    if (effectsContainer) {
        effectsContainer.addChild(previewGraphics);
        effectsContainer.addChild(rangeLineGraphics);
    }
    else {
        console.warn('Mastery System | Utility targeting: no overlay container for preview graphics');
    }
    const highlightId = 'mastery-utility-single';
    const placement = placementColorsFromOption(option);
    // Event handlers
    const onPointerMove = (ev) => {
        try {
            const worldPos = eventWorldPoint(ev);
            const snapped = snapWorldCenter(worldPos.x, worldPos.y);
            // Draw range line
            rangeLineGraphics.clear();
            const casterCenter = token.center;
            const isValid = isWithinMasteryPowerRange(casterCenter, snapped, rangeMeters);
            rangeLineGraphics.lineStyle(2, isValid ? placement.lineValid : placement.lineInvalid, 0.8);
            rangeLineGraphics.moveTo(casterCenter.x, casterCenter.y);
            rangeLineGraphics.lineTo(snapped.x, snapped.y);
            // Highlight valid targets
            const allTokens = canvas.tokens?.placeables || [];
            for (const targetToken of allTokens) {
                if (targetToken.id === token.id)
                    continue;
                const targetCenter = targetToken.center;
                const isInRange = isWithinMasteryPowerRange(casterCenter, targetCenter, rangeMeters);
                const matches = matchesTargetGroup(token, targetToken, targetGroup);
                if (isInRange && matches) {
                    // Highlight valid target
                    targetToken.alpha = Math.min(1.0, targetToken.alpha);
                    if (!targetToken.filters) {
                        const tintFilter = new PIXI.filters.ColorMatrixFilter();
                        tintFilter.tint(placement.tokenTint, false);
                        targetToken.filters = [tintFilter];
                    }
                }
                else {
                    // Restore normal appearance
                    targetToken.alpha = targetToken._originalAlpha || 1.0;
                    if (targetToken.filters) {
                        targetToken.filters = targetToken.filters.filter((f) => {
                            return !(f instanceof PIXI.filters.ColorMatrixFilter);
                        });
                        if (targetToken.filters.length === 0) {
                            targetToken.filters = null;
                        }
                    }
                }
            }
        }
        catch (err) {
            console.error('Mastery System | Utility single-target pointermove failed', err);
        }
    };
    const onPointerDown = (ev) => {
        if (ev.button === 2 || ev.button === 1) {
            endUtilityTargeting(false);
            return;
        }
        if (ev.button === 0) {
            const worldPos = eventWorldPoint(ev);
            const clickedToken = pickTokenAtPoint(worldPos.x, worldPos.y, {
                excludeIds: token?.id ? [token.id] : [],
                noCenterFallback: true,
            });
            if (clickedToken && clickedToken.id !== token.id) {
                const casterCenter = token.center;
                const matches = matchesTargetGroup(token, clickedToken, targetGroup);
                if (isWithinMasteryPowerRange(casterCenter, clickedToken.center, rangeMeters) && matches) {
                    confirmUtilityTargets({
                        casterToken: token,
                        option,
                        rangeMeters: 0,
                        radiusMeters: 0,
                        center: null,
                        candidates: new Map([[clickedToken.id, {
                                    token: clickedToken,
                                    inRadius: true,
                                    selected: true,
                                    isAlly: isAlly(token, clickedToken),
                                    isEnemy: isEnemy(token, clickedToken),
                                    originalAlpha: clickedToken.alpha
                                }]]),
                        selectedTargets: new Set([clickedToken.id]),
                        highlightId,
                        placement,
                        previewGraphics,
                        rangeLineGraphics,
                        panelApp: null,
                        onPointerMove,
                        onPointerDown,
                        onKeyDown: () => { },
                        manualMode: false,
                        excludeAllies: false
                    });
                    return;
                }
            }
            // Clicked outside - cancel
            endUtilityTargeting(false);
        }
    };
    const onKeyDown = (ev) => {
        if (ev.key === 'Escape') {
            endUtilityTargeting(false);
        }
    };
    const state = {
        casterToken: token,
        option,
        rangeMeters,
        radiusMeters: 0,
        center: null,
        candidates: new Map(),
        selectedTargets: new Set(),
        highlightId,
        placement,
        previewGraphics,
        rangeLineGraphics,
        panelApp: null,
        onPointerMove,
        onPointerDown,
        onKeyDown,
        manualMode: false,
        excludeAllies: false
    };
    activeUtilityTargeting = state;
    // Store original alphas
    const allTokens = canvas.tokens?.placeables || [];
    for (const t of allTokens) {
        t._originalAlpha = t.alpha;
    }
    // Attach event listeners
    canvas.stage.on('pointermove', state.onPointerMove);
    canvas.stage.on('pointerdown', state.onPointerDown);
    window.addEventListener('keydown', state.onKeyDown);
}
/**
 * Start radius utility mode
 */
export function startUtilityRadiusMode(token, option) {
    // Cancel any existing utility targeting
    endUtilityTargeting(false);
    // Ensure token is controlled
    token.control({ releaseOthers: false });
    const rangeMeters = option.rangeMeters || option.range || 0;
    const radiusMeters = option.aoeRadiusMeters || 0;
    const targetGroup = option.defaultTargetGroup || 'ally';
    // Create preview graphics
    const previewGraphics = new PIXI.Graphics();
    const rangeLineGraphics = new PIXI.Graphics();
    const effectsContainer = resolveOverlayContainer();
    if (effectsContainer) {
        effectsContainer.addChild(previewGraphics);
        effectsContainer.addChild(rangeLineGraphics);
    }
    else {
        console.warn('Mastery System | AoE targeting: no overlay container for preview graphics');
    }
    const highlightId = `mastery-aoe-${option.id}`;
    const placement = placementColorsFromOption(option);
    const aoePreviewLayerId = `mastery-aoe-preview-${option.id}`;
    // Create state first (with placeholders for event handlers)
    const state = {
        casterToken: token,
        option,
        rangeMeters,
        radiusMeters,
        center: null,
        candidates: new Map(),
        selectedTargets: new Set(),
        highlightId,
        aoePreviewLayerId,
        placement,
        previewGraphics,
        rangeLineGraphics,
        panelApp: null,
        onPointerMove: () => { },
        onPointerDown: () => { },
        onKeyDown: () => { },
        manualMode: option.allowManualTargetSelection !== false,
        // Attack zones default to sparing allies/players; utilities keep them selectable.
        excludeAllies: option.aoePlacementProfile === 'hostile-zone' || option.slot === 'attack'
    };
    activeUtilityTargeting = state;
    // Event handlers (can now reference state)
    state.onPointerMove = (ev) => {
        try {
            if (rangeMeters === 0) {
                // Self-aura: no movement needed
                return;
            }
            if (!state.center) {
                // Still choosing center point — snap to hex/square center and paint AoE preview
                const worldPos = eventWorldPoint(ev);
                const snapped = snapWorldCenter(worldPos.x, worldPos.y);
                // Draw range line
                state.rangeLineGraphics.clear();
                const casterCenter = token.center;
                const isValid = isWithinMasteryPowerRange(casterCenter, snapped, rangeMeters);
                state.rangeLineGraphics.lineStyle(2, isValid ? state.placement.lineValid : state.placement.lineInvalid, 0.8);
                state.rangeLineGraphics.moveTo(casterCenter.x, casterCenter.y);
                state.rangeLineGraphics.lineTo(snapped.x, snapped.y);
                if (isValid) {
                    state.previewGraphics.clear();
                    const grid = canvas.grid;
                    const gridless = !grid || grid.type === CONST.GRID_TYPES.GRIDLESS;
                    if (gridless) {
                        const radiusPx = masteryAoERadiusPixels(radiusMeters);
                        if (radiusMeters > 0 && radiusPx > 0) {
                            state.previewGraphics.lineStyle(2, state.placement.previewLine, 0.75);
                            state.previewGraphics.beginFill(state.placement.previewFill, 0.12);
                            state.previewGraphics.drawCircle(0, 0, radiusPx);
                            state.previewGraphics.endFill();
                        }
                        state.previewGraphics.position.set(snapped.x, snapped.y);
                    }
                    else {
                        state.previewGraphics.position.set(0, 0);
                        if (radiusMeters > 0) {
                            highlightHexesWithinStepsFromPoint(snapped, masteryPowerMaxSteps(radiusMeters), state.aoePreviewLayerId, state.placement.hex, state.placement.previewAlpha);
                        }
                        else {
                            clearHexHighlight(state.aoePreviewLayerId);
                        }
                    }
                }
                else {
                    state.previewGraphics.clear();
                    clearHexHighlight(state.aoePreviewLayerId);
                }
            }
        }
        catch (err) {
            console.error('Mastery System | AoE radius pointermove failed', err);
        }
    };
    state.onPointerDown = (ev) => {
        if (ev.button === 2 || ev.button === 1) {
            endUtilityTargeting(false);
            return;
        }
        if (ev.button === 0) {
            try {
                if (rangeMeters === 0) {
                    // Self-aura: clicking toggles targets in manual mode
                    if (state.manualMode) {
                        const worldPos = eventWorldPoint(ev);
                        const clickedToken = pickTokenAtPoint(worldPos.x, worldPos.y, {
                            onlyIds: state.candidates.keys(),
                            noCenterFallback: true,
                        });
                        if (clickedToken && state.candidates.has(clickedToken.id)) {
                            const candidate = state.candidates.get(clickedToken.id);
                            if (state.excludeAllies && candidate.isAlly && !candidate.selected) {
                                ui.notifications?.info('Verbündete/Spieler sind ausgenommen (Häkchen im Panel entfernen, um sie zu treffen).');
                                return;
                            }
                            candidate.selected = !candidate.selected;
                            if (candidate.selected) {
                                state.selectedTargets.add(clickedToken.id);
                            }
                            else {
                                state.selectedTargets.delete(clickedToken.id);
                            }
                            updateCandidateVisuals(state);
                            if (state.panelApp) {
                                const html = $(state.panelApp.element);
                                html.find('#selected-count').text(state.selectedTargets.size);
                            }
                        }
                    }
                    return;
                }
                if (!state.center) {
                    // Choosing center point
                    const worldPos = eventWorldPoint(ev);
                    const snapped = snapWorldCenter(worldPos.x, worldPos.y);
                    const casterCenter = token.center;
                    if (isWithinMasteryPowerRange(casterCenter, snapped, rangeMeters)) {
                        state.center = snapped;
                        clearHexHighlight(state.aoePreviewLayerId);
                        if (state.center) {
                            state.candidates = findCandidatesInRadius(token, state.center, radiusMeters, targetGroup);
                        }
                        // Default selection (allies never pre-selected while excluded)
                        for (const [tokenId, candidate] of state.candidates.entries()) {
                            if (state.excludeAllies && candidate.isAlly) {
                                candidate.selected = false;
                                continue;
                            }
                            if (candidate.selected) {
                                state.selectedTargets.add(tokenId);
                            }
                        }
                        // Draw radius and update visuals
                        highlightRadiusArea(state);
                        updateCandidateVisuals(state);
                        // Create UI panel
                        const panel = createTargetSelectionPanel(state);
                        state.panelApp = panel;
                        panel.render(true);
                        // Position panel near caster
                        const tokenScreen = canvas.stage.toGlobal(new PIXI.Point(token.center.x, token.center.y));
                        if (panel.element) {
                            $(panel.element).css({
                                position: 'absolute',
                                left: `${tokenScreen.x + 100}px`,
                                top: `${tokenScreen.y - 100}px`
                            });
                        }
                    }
                }
                else {
                    // Center chosen, clicking toggles targets in manual mode
                    if (state.manualMode) {
                        const worldPos = eventWorldPoint(ev);
                        const clickedToken = pickTokenAtPoint(worldPos.x, worldPos.y, {
                            onlyIds: state.candidates.keys(),
                            noCenterFallback: true,
                        });
                        if (clickedToken && state.candidates.has(clickedToken.id)) {
                            const candidate = state.candidates.get(clickedToken.id);
                            if (state.excludeAllies && candidate.isAlly && !candidate.selected) {
                                ui.notifications?.info('Verbündete/Spieler sind ausgenommen (Häkchen im Panel entfernen, um sie zu treffen).');
                                return;
                            }
                            candidate.selected = !candidate.selected;
                            if (candidate.selected) {
                                state.selectedTargets.add(clickedToken.id);
                            }
                            else {
                                state.selectedTargets.delete(clickedToken.id);
                            }
                            updateCandidateVisuals(state);
                            if (state.panelApp) {
                                const html = $(state.panelApp.element);
                                html.find('#selected-count').text(state.selectedTargets.size);
                            }
                        }
                    }
                }
            }
            catch (err) {
                console.error('Mastery System | AoE radius pointerdown failed', err);
            }
        }
    };
    state.onKeyDown = (ev) => {
        if (ev.key === 'Escape') {
            endUtilityTargeting(false);
        }
    };
    // If range is 0, center is always caster's position
    if (rangeMeters === 0) {
        state.center = { x: token.center.x, y: token.center.y };
        state.candidates = findCandidatesInRadius(token, state.center, radiusMeters, targetGroup);
        // Default selection based on target group (allies never pre-selected while excluded)
        for (const [tokenId, candidate] of state.candidates.entries()) {
            if (state.excludeAllies && candidate.isAlly) {
                candidate.selected = false;
                continue;
            }
            if (candidate.selected) {
                state.selectedTargets.add(tokenId);
            }
        }
        // Draw radius and update visuals
        highlightRadiusArea(state);
        updateCandidateVisuals(state);
        // Create panel immediately
        const panel = createTargetSelectionPanel(state);
        state.panelApp = panel;
        panel.render(true);
        // Position panel near caster
        const tokenScreen = canvas.stage.toGlobal(new PIXI.Point(token.center.x, token.center.y));
        if (panel.element) {
            $(panel.element).css({
                position: 'absolute',
                left: `${tokenScreen.x + 100}px`,
                top: `${tokenScreen.y - 100}px`
            });
        }
    }
    // Store original alphas
    const allTokens = canvas.tokens?.placeables || [];
    for (const t of allTokens) {
        t._originalAlpha = t.alpha;
    }
    // Attach event listeners
    canvas.stage.on('pointermove', state.onPointerMove);
    canvas.stage.on('pointerdown', state.onPointerDown);
    window.addEventListener('keydown', state.onKeyDown);
}
/**
 * Confirm utility targets and resolve power
 */
async function confirmUtilityTargets(state) {
    const targets = Array.from(state.selectedTargets).map(id => {
        const candidate = state.candidates.get(id);
        return candidate?.token;
    }).filter(t => t !== undefined);
    const combat = game.combat;
    const actor = state.casterToken?.actor;
    if (state.option.costsAction) {
        if (!combat || !actor) {
            ui.notifications?.warn('Cannot resolve utility: not in combat or missing actor.');
            console.warn('Mastery System | [RADIAL FLOW] utility confirm blocked: no combat/actor', {
                option: state.option.name
            });
            return;
        }
        const available = getAvailableAttackActions(actor, combat);
        if (available <= 0) {
            ui.notifications?.warn('No Actions left this round.');
            console.warn('Mastery System | [RADIAL FLOW] utility confirm blocked: no attack actions', {
                option: state.option.name
            });
            return;
        }
        const consumed = await consumeAttackAction(actor, combat);
        if (!consumed) {
            ui.notifications?.warn('Failed to consume attack action.');
            return;
        }
    }
    else {
    }
    if (state.option.source === 'power' && state.option.item?.id && actor && combat) {
        await markPowerUsedThisRound(actor, combat, state.option.item.id);
    }
    if (state.option.source === 'npc-attack' && state.option.costsAction && actor && combat) {
        await markNpcAttackUsedThisRound(actor, combat, String(state.option.npcAttackUsageKey || state.option.id || ''));
    }
    const isHostileZone = state.option.aoePlacementProfile === 'hostile-zone';
    const isAttackZone = isHostileZone && state.option.slot === 'attack';
    if (isAttackZone) {
        if (!targets.length) {
            ui.notifications?.warn('Keine Ziele in der Zone ausgewählt.');
            endUtilityTargeting(false);
            return;
        }
        const primary = targets[0];
        const secondaries = targets.slice(1).map((t) => String(t.id));
        let powerBonus = 0;
        if (state.option.source === 'npc-attack' && actor) {
            const row = getNpcAttackByIndex(actor.system, state.option.npcAttackIndex ?? 0, state.option.npcPhaseIndex);
            const formula = npcDamageDiceFormula(row);
            const m = /^(\d+)d8$/i.exec(String(formula));
            powerBonus = m ? Math.max(0, parseInt(m[1], 10)) : 0;
        }
        else if (state.option.item) {
            powerBonus = extractMeleeAoePowerBonusD8(state.option.item);
        }
        // Pass AoE context so secondaries each get a per-Evade check + full payload.
        try {
            const { createRangedAttackCard } = await import('./combat/attack-executor.js');
            await createRangedAttackCard(state.casterToken, primary, state.option, {
                secondaryTokenIds: secondaries,
                powerBonusDice: powerBonus,
            });
        }
        catch (err) {
            console.error('Mastery System | Hostile-zone attack resolve failed', err);
            ui.notifications?.error('AoE-Angriff konnte nicht erstellt werden.');
            endUtilityTargeting(false);
            return;
        }
        endUtilityTargeting(true);
        return;
    }
    // Utility / persistent zone placement (no attack card)
    const dur = state.option.zoneDurationNote;
    const durPart = dur ? ` — Dauer ${dur} (Zone am Tisch weiterverfolgen)` : '';
    const kind = isHostileZone ? 'Zone' : 'Utility';
    ui.notifications?.info(`${kind} ${state.option.name}: ${targets.length} Ziel(e)${durPart}`);
    endUtilityTargeting(true);
}
/**
 * End utility targeting mode
 */
export function endUtilityTargeting(success) {
    const state = activeUtilityTargeting;
    if (!state)
        return;
    // Remove event listeners
    canvas.stage.off('pointermove', state.onPointerMove);
    canvas.stage.off('pointerdown', state.onPointerDown);
    window.removeEventListener('keydown', state.onKeyDown);
    clearHexHighlight(state.highlightId);
    if (state.aoePreviewLayerId) {
        clearHexHighlight(state.aoePreviewLayerId);
    }
    // Clear preview graphics
    if (state.previewGraphics && state.previewGraphics.parent) {
        state.previewGraphics.parent.removeChild(state.previewGraphics);
        state.previewGraphics.clear();
    }
    if (state.rangeLineGraphics && state.rangeLineGraphics.parent) {
        state.rangeLineGraphics.parent.removeChild(state.rangeLineGraphics);
        state.rangeLineGraphics.clear();
    }
    // Close panel
    if (state.panelApp) {
        state.panelApp.close();
    }
    // Restore token visuals
    for (const [, candidate] of state.candidates.entries()) {
        const token = candidate.token;
        token.alpha = candidate.originalAlpha;
        if (token.filters) {
            token.filters = token.filters.filter((f) => {
                return !(f instanceof PIXI.filters.ColorMatrixFilter);
            });
            if (token.filters.length === 0) {
                token.filters = null;
            }
        }
    }
    // Restore all tokens (in case some were highlighted but not in candidates)
    const allTokens = canvas.tokens?.placeables || [];
    for (const token of allTokens) {
        const originalAlpha = token._originalAlpha;
        if (originalAlpha !== undefined) {
            token.alpha = originalAlpha;
            delete token._originalAlpha;
        }
    }
    if (!success) {
        const msg = state.option.aoePlacementProfile === 'hostile-zone'
            ? 'Zonenwahl abgebrochen'
            : 'Utility targeting cancelled';
        ui.notifications?.info(msg);
    }
    activeUtilityTargeting = null;
}
/**
 * Check if utility targeting is currently active
 */
export function isUtilityTargetingActive() {
    return activeUtilityTargeting !== null;
}
//# sourceMappingURL=utility-targeting.js.map