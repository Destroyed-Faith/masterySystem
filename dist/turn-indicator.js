let activeTurnRing = null;
let activeTurnTokenId = null;
let turnRingTickerFn = null;
/** Last combatant we drew the ring for — avoids re-running on every unrelated `updateCombat`. */
let lastTurnRingCombatantId = null;
// Constants from radial menu
const MS_OUTER_RING_OUTER = 140; // Outer radius of radial menu
/**
 * Create a turn ring around a token
 */
function createTurnRing({ token, radius, color = 0x3399ff, lineWidth = 4, pulsing = true }) {
    const g = new PIXI.Graphics();
    // Draw the ring (no fill, only stroke)
    g.lineStyle(lineWidth, color, 0.95);
    g.drawCircle(0, 0, radius);
    g.endFill();
    // Position at token center
    const tokenCenter = token.center;
    g.position.set(tokenCenter.x, tokenCenter.y);
    // Tag for cleanup
    g.msTurnRing = true;
    g.msBaseRadius = radius;
    // Optional pulsing animation
    if (pulsing) {
        let t = 0;
        const ticker = PIXI.Ticker.shared;
        const tickFn = (delta) => {
            if (!g.parent) {
                // Ring was removed, stop animation
                ticker.remove(tickFn);
                return;
            }
            t += delta / 60; // Normalize to ~60fps
            const scale = 1 + 0.05 * Math.sin(t * 2 * Math.PI); // Subtle pulse
            g.scale.set(scale);
        };
        ticker.add(tickFn);
        turnRingTickerFn = tickFn;
        // Store removal hook on object
        g.msTurnRingTicker = tickFn;
    }
    return g;
}
/**
 * Clear the turn ring
 */
export function clearTurnRing() {
    if (!activeTurnRing)
        return;
    const ring = activeTurnRing;
    activeTurnRing = null;
    activeTurnTokenId = null;
    // Remove ticker animation
    if (turnRingTickerFn) {
        const ticker = PIXI.Ticker.shared;
        ticker.remove(turnRingTickerFn);
        turnRingTickerFn = null;
    }
    const tickFn = ring.msTurnRingTicker;
    if (tickFn) {
        PIXI.Ticker.shared.remove(tickFn);
    }
    try {
        if (ring.parent) {
            ring.parent.removeChild(ring);
        }
        ring.destroy({ children: true });
    }
    catch (e) {
        console.warn('Mastery System | Turn ring cleanup skipped (already destroyed or invalid)', e);
    }
}
/**
 * Check if radial menu is open for a token
 */
function isRadialMenuOpenForToken(token) {
    // Import the function from token-radial-menu
    try {
        // Use dynamic import to avoid circular dependencies
        const { isRadialMenuOpenForToken: checkRadial } = require('./token-radial-menu');
        return checkRadial(token.id);
    }
    catch (error) {
        // Fallback: check if token is controlled (less reliable)
        return token.controlled || false;
    }
}
/**
 * Compute turn ring radius based on token and radial menu state
 */
function computeTurnRingRadius(token, radialOpen) {
    if (radialOpen) {
        // If radial menu is open, match the radial menu size
        return MS_OUTER_RING_OUTER + 10;
    }
    // Otherwise, use token size
    const baseTokenRadius = Math.max(token.w || 50, token.h || 50) / 2;
    return baseTokenRadius + 15; // Slightly larger than token
}
/**
 * Show turn ring for a token
 */
export function showTurnRingForToken(token, radius) {
    if (!token) {
        clearTurnRing();
        return;
    }
    // If it's the same token, just update radius if needed
    if (activeTurnTokenId === token.id && activeTurnRing) {
        const radialOpen = isRadialMenuOpenForToken(token);
        const newRadius = radius || computeTurnRingRadius(token, radialOpen);
        const baseRadius = activeTurnRing.msBaseRadius;
        if (Math.abs(newRadius - baseRadius) > 1) {
            // Radius changed significantly, recreate ring
            clearTurnRing();
        }
        else {
            try {
                const tokenCenter = token.center;
                if (tokenCenter && activeTurnRing?.position) {
                    activeTurnRing.position.set(tokenCenter.x, tokenCenter.y);
                }
            }
            catch (e) {
                console.warn('Mastery System | Turn ring position update failed, recreating', e);
                clearTurnRing();
            }
            if (activeTurnRing)
                return;
        }
    }
    else {
        // Different token or no ring, clear old one
        clearTurnRing();
    }
    const radialOpen = isRadialMenuOpenForToken(token);
    const ringRadius = radius || computeTurnRingRadius(token, radialOpen);
    // Create the ring
    const ring = createTurnRing({
        token,
        radius: ringRadius,
        color: 0x3399ff,
        lineWidth: 4,
        pulsing: true
    });
    // Add to appropriate layer
    // Try to use the same container as radial menu or tokens layer
    let container = null;
    // Try tokens layer first (most reliable)
    if (canvas.tokens) {
        if (canvas.tokens.container && typeof canvas.tokens.container.addChild === 'function') {
            container = canvas.tokens.container;
        }
        else if (typeof canvas.tokens.addChild === 'function') {
            container = canvas.tokens;
        }
    }
    // Fallback to foreground or effects layer
    if (!container && canvas.foreground) {
        if (canvas.foreground.container && typeof canvas.foreground.container.addChild === 'function') {
            container = canvas.foreground.container;
        }
        else if (typeof canvas.foreground.addChild === 'function') {
            container = canvas.foreground;
        }
    }
    if (!container && canvas.effects) {
        if (canvas.effects.container && typeof canvas.effects.container.addChild === 'function') {
            container = canvas.effects.container;
        }
        else if (typeof canvas.effects.addChild === 'function') {
            container = canvas.effects;
        }
    }
    if (container) {
        container.addChild(ring);
        // Ensure ring is on top
        container.setChildIndex(ring, container.children.length - 1);
    }
    else {
        console.warn('Mastery System | Could not find container for turn ring');
        return;
    }
    activeTurnRing = ring;
    activeTurnTokenId = token.id;
}
/**
 * Update turn ring when radial menu opens/closes
 */
export function updateTurnRingForRadialMenu(token, radialOpen) {
    if (!activeTurnRing || activeTurnTokenId !== token.id) {
        return; // Not the active token
    }
    const newRadius = computeTurnRingRadius(token, radialOpen);
    const baseRadius = activeTurnRing.msBaseRadius;
    if (Math.abs(newRadius - baseRadius) > 1) {
        // Recreate ring with new radius
        showTurnRingForToken(token, newRadius);
    }
}
/**
 * Initialize turn indicator hooks
 */
export function initializeTurnIndicator() {
    // Hook into combat updates — only refresh ring on real turn/round changes or combatant swap
    Hooks.on('updateCombat', (combat, changes) => {
        if (!combat?.started) {
            lastTurnRingCombatantId = null;
            clearTurnRing();
            return;
        }
        const combatant = combat.combatant;
        if (!combatant) {
            lastTurnRingCombatantId = null;
            clearTurnRing();
            return;
        }
        const cid = combatant.id;
        const turnOrRound = changes &&
            (Object.prototype.hasOwnProperty.call(changes, 'turn') ||
                Object.prototype.hasOwnProperty.call(changes, 'round'));
        const combatantChanged = cid !== lastTurnRingCombatantId;
        if (!turnOrRound && !combatantChanged) {
            return;
        }
        lastTurnRingCombatantId = cid;
        const token = combatant.token?.object;
        if (!token) {
            lastTurnRingCombatantId = null;
            clearTurnRing();
            return;
        }
        const radialOpen = isRadialMenuOpenForToken(token);
        const radius = computeTurnRingRadius(token, radialOpen);
        showTurnRingForToken(token, radius);
    });
    // Hook into combat end
    Hooks.on('deleteCombat', () => {
        lastTurnRingCombatantId = null;
        clearTurnRing();
    });
    // Update ring position when token moves
    Hooks.on('updateToken', (tokenDoc) => {
        if (!activeTurnRing || activeTurnTokenId !== tokenDoc.id)
            return;
        try {
            const token = tokenDoc.object;
            if (!token || token.destroyed)
                return;
            const c = token.center;
            if (c && activeTurnRing?.position) {
                activeTurnRing.position.set(c.x, c.y);
            }
        }
        catch (e) {
            console.warn('Mastery System | Turn ring: updateToken position skipped', e);
        }
    });
    // Update ring when radial menu opens/closes
    Hooks.on('masterySystem.radialMenuOpened', (tokenId) => {
        if (activeTurnRing && activeTurnTokenId === tokenId) {
            const token = canvas.tokens?.placeables?.find((t) => t.id === tokenId);
            if (token) {
                updateTurnRingForRadialMenu(token, true);
            }
        }
    });
    Hooks.on('masterySystem.radialMenuClosed', (tokenId) => {
        if (activeTurnRing && activeTurnTokenId === tokenId) {
            const token = canvas.tokens?.placeables?.find((t) => t.id === tokenId);
            if (token) {
                updateTurnRingForRadialMenu(token, false);
            }
        }
    });
}
//# sourceMappingURL=turn-indicator.js.map