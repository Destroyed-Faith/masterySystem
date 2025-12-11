/**
 * Turn Indicator - Blue Ring around Active Combatant
 *
 * Replaces the big d20 turn indicator with a subtle blue ring around the active token
 * Integrates with the radial menu to adjust size when menu is open
 */
// Global state
let activeTurnRing = null;
let activeTurnTokenId = null;
let turnRingTickerFn = null;
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
    console.log('Mastery System | Clearing turn ring');
    // Remove ticker animation
    if (turnRingTickerFn) {
        const ticker = PIXI.Ticker.shared;
        ticker.remove(turnRingTickerFn);
        turnRingTickerFn = null;
    }
    // Also check if there's a ticker stored on the graphics object
    const tickFn = activeTurnRing.msTurnRingTicker;
    if (tickFn) {
        const ticker = PIXI.Ticker.shared;
        ticker.remove(tickFn);
    }
    // Remove from parent
    if (activeTurnRing.parent) {
        activeTurnRing.parent.removeChild(activeTurnRing);
    }
    // Destroy graphics
    activeTurnRing.destroy({ children: true });
    activeTurnRing = null;
    activeTurnTokenId = null;
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
            // Just update position (token might have moved)
            const tokenCenter = token.center;
            activeTurnRing.position.set(tokenCenter.x, tokenCenter.y);
            return;
        }
    }
    else {
        // Different token or no ring, clear old one
        clearTurnRing();
    }
    const radialOpen = isRadialMenuOpenForToken(token);
    const ringRadius = radius || computeTurnRingRadius(token, radialOpen);
    console.log('Mastery System | Showing turn ring for token', {
        token: token.name,
        radius: ringRadius,
        radialOpen
    });
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
    console.log('Mastery System | Turn ring created and displayed');
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
    console.log('Mastery System | Initializing Turn Indicator');
    // Hook into combat updates
    Hooks.on('updateCombat', (combat) => {
        if (!combat?.started) {
            console.log('Mastery System | Combat ended - clearing turn ring');
            clearTurnRing();
            return;
        }
        // Get current combatant
        const combatant = combat.combatant;
        if (!combatant) {
            clearTurnRing();
            return;
        }
        const token = combatant.token?.object;
        if (!token) {
            console.log('Mastery System | No token for current combatant - clearing turn ring');
            clearTurnRing();
            return;
        }
        console.log('Mastery System | Turn changed to', token.name, '- updating turn ring');
        const radialOpen = isRadialMenuOpenForToken(token);
        const radius = computeTurnRingRadius(token, radialOpen);
        showTurnRingForToken(token, radius);
    });
    // Hook into combat end
    Hooks.on('deleteCombat', () => {
        console.log('Mastery System | Combat deleted - clearing turn ring');
        clearTurnRing();
    });
    // Update ring position when token moves
    Hooks.on('updateToken', (tokenDoc) => {
        if (activeTurnRing && activeTurnTokenId === tokenDoc.id) {
            const token = tokenDoc.object;
            if (token && token.center) {
                activeTurnRing.position.set(token.center.x, token.center.y);
            }
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
    console.log('Mastery System | Turn indicator hooks registered');
}
//# sourceMappingURL=turn-indicator.js.map