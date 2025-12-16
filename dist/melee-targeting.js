/**
 * Melee Targeting – Foundry VTT v13
 * Clean, deterministic, hex-safe implementation
 */
import { highlightHexesInRange, clearHexHighlight } from "./utils/hex-highlighting.js";
let activeMeleeTargeting = null;
/* -------------------------------------------- */
/*  Utilities                                   */
/* -------------------------------------------- */
function metersToGridUnits(meters) {
    const d = canvas.grid?.distance ?? 1;
    return meters / d;
}
function getMeleeReachMeters(option) {
    // Use option.range if available (new unified range system)
    if (option.range !== undefined) {
        console.log('Mastery System | [MELEE TARGETING] Using option.range:', option.range, {
            optionId: option.id,
            optionName: option.name,
            slot: option.slot,
            source: option.source
        });
        return option.range;
    }
    // Fallback to meleeReachMeters if set (legacy support)
    if (option.meleeReachMeters !== undefined) {
        console.log('Mastery System | [MELEE TARGETING] Using option.meleeReachMeters (legacy):', option.meleeReachMeters);
        return option.meleeReachMeters;
    }
    // Default fallback
    console.warn('Mastery System | [MELEE TARGETING] No range found, using default 2m', {
        optionId: option.id,
        optionName: option.name,
        hasRange: option.range !== undefined,
        hasMeleeReachMeters: option.meleeReachMeters !== undefined
    });
    return 2; // default melee reach
}
/* -------------------------------------------- */
/*  Find Valid Targets                          */
/* -------------------------------------------- */
/**
 * Find all tokens within melee reach
 */
function findValidTargets(state) {
    const validTargets = new Set();
    const attackerToken = state.token;
    const reachMeters = state.reachMeters;
    const reachGridUnits = state.reachGridUnits;
    if (!attackerToken || !canvas.grid) {
        console.log('Mastery System | [MELEE TARGETING] Cannot find targets: missing token or grid');
        return validTargets;
    }
    const attackerCenter = attackerToken.center;
    const allTokens = canvas.tokens?.placeables || [];
    const gridDistance = canvas.grid.distance || 1;
    console.log('Mastery System | [MELEE TARGETING] Finding valid targets', {
        reachMeters,
        reachGridUnits,
        gridDistance,
        totalTokens: allTokens.length
    });
    for (const token of allTokens) {
        // Skip own token
        if (token.id === attackerToken.id)
            continue;
        // Skip tokens without actor
        if (!token.actor)
            continue;
        // Calculate distance
        const tokenCenter = token.center;
        const distancePx = Math.sqrt(Math.pow(tokenCenter.x - attackerCenter.x, 2) +
            Math.pow(tokenCenter.y - attackerCenter.y, 2));
        // Convert to grid units
        const distanceGridUnits = distancePx / (canvas.grid.size || 100);
        const distanceMeters = distanceGridUnits * gridDistance;
        // Check if within reach
        if (distanceMeters <= reachMeters) {
            validTargets.add(token.id);
            console.log('Mastery System | [MELEE TARGETING] Valid target found', {
                targetId: token.id,
                targetName: token.name,
                distanceMeters: distanceMeters.toFixed(2),
                reachMeters
            });
        }
    }
    console.log('Mastery System | [MELEE TARGETING] Found valid targets', {
        count: validTargets.size,
        targetIds: Array.from(validTargets)
    });
    return validTargets;
}
/**
 * Create a ring around a token to mark it as a valid target
 */
function createTargetRing(token) {
    const ring = new PIXI.Graphics();
    const radius = (token.w || token.width || 50) / 2 + 10; // Token radius + padding
    // Red ring for valid targets
    ring.lineStyle(3, 0xff0000, 1);
    ring.drawCircle(0, 0, radius);
    ring.position.set(token.center.x, token.center.y);
    ring.visible = true;
    ring.renderable = true;
    ring.alpha = 1.0;
    // IMPORTANT: Make ring non-interactive so it doesn't block clicks
    ring.interactive = false;
    ring.eventMode = 'none';
    return ring;
}
/**
 * Create an interactive overlay over a token that stores the token ID
 * This overlay will handle clicks and trigger the attack
 */
function createTargetOverlay(token, tokenId, onClick) {
    const overlay = new PIXI.Container();
    // Get token bounds
    const bounds = token.bounds;
    const width = bounds.width || token.w || 100;
    const height = bounds.height || token.h || 100;
    // Create a hit area that covers the token and ring area
    const hitArea = new PIXI.Graphics();
    const radius = Math.max(width, height) / 2 + 15; // Token radius + ring padding
    hitArea.beginFill(0xffffff, 0); // Invisible but clickable
    hitArea.drawCircle(0, 0, radius);
    hitArea.endFill();
    overlay.addChild(hitArea);
    overlay.position.set(token.center.x, token.center.y);
    // Make overlay interactive
    overlay.interactive = true;
    overlay.eventMode = 'static';
    overlay.cursor = 'pointer';
    // Store token ID in overlay for easy access
    overlay.targetTokenId = tokenId;
    // Handle clicks
    overlay.on('pointerdown', (ev) => {
        ev.stopPropagation();
        ev.stopImmediatePropagation();
        console.log('Mastery System | [MELEE TARGETING] Overlay clicked for token', tokenId);
        onClick(tokenId);
    });
    // Visual feedback on hover
    overlay.on('pointerover', () => {
        overlay.alpha = 0.8;
    });
    overlay.on('pointerout', () => {
        overlay.alpha = 1.0;
    });
    return overlay;
}
/**
 * Highlight reach area and mark valid targets
 */
function highlightReachArea(state) {
    const grid = canvas.grid;
    if (!grid)
        return;
    const RANGE = Math.max(0, Math.floor(state.reachGridUnits));
    const tokenId = state.token?.document?.id;
    if (!tokenId)
        return;
    // HEX GRID → Grid Highlight Layer ONLY
    if (grid.type !== CONST.GRID_TYPES.GRIDLESS) {
        highlightHexesInRange(tokenId, RANGE, state.highlightId, 0xff6666, 0.5);
    }
    // GRIDLESS fallback → previewGraphics
    if (grid.type === CONST.GRID_TYPES.GRIDLESS && state.previewGraphics) {
        state.previewGraphics.clear();
        const c = state.token.center;
        const radiusPx = RANGE * (grid.size || 100);
        state.previewGraphics.lineStyle(3, 0xff6666, 1);
        state.previewGraphics.beginFill(0xff6666, 0.25);
        state.previewGraphics.drawCircle(0, 0, radiusPx);
        state.previewGraphics.endFill();
        state.previewGraphics.position.set(c.x, c.y);
        state.previewGraphics.visible = true;
    }
    // Find and mark valid targets
    state.validTargets = findValidTargets(state);
    // Create rings around valid targets
    const effectsLayer = canvas.effects || canvas.foreground;
    if (!effectsLayer) {
        console.warn('Mastery System | [MELEE TARGETING] No effects layer found for target rings');
        return;
    }
    const container = effectsLayer.container || effectsLayer;
    // Handler for overlay clicks
    const handleOverlayClick = (targetTokenId) => {
        const targetToken = canvas.tokens?.get(targetTokenId);
        if (!targetToken) {
            console.warn('Mastery System | [MELEE TARGETING] Target token not found for overlay click', targetTokenId);
            return;
        }
        if (!state.validTargets.has(targetTokenId)) {
            console.warn('Mastery System | [MELEE TARGETING] Overlay clicked for invalid target', targetTokenId);
            ui.notifications?.warn(`Target is out of range (${state.reachMeters}m)`);
            return;
        }
        console.log('Mastery System | [MELEE TARGETING] Overlay clicked - executing attack', {
            targetId: targetTokenId,
            targetName: targetToken.name,
            attackerId: state.token.id,
            attackerName: state.token.name,
            optionId: state.option.id,
            optionName: state.option.name
        });
        // Execute the attack
        executeMeleeAttack(state.token, targetToken, state.option);
        // End targeting
        endMeleeTargeting(true);
    };
    for (const targetId of state.validTargets) {
        const targetToken = canvas.tokens?.get(targetId);
        if (!targetToken)
            continue;
        // Store original alpha
        if (!state.originalTokenAlphas.has(targetToken)) {
            state.originalTokenAlphas.set(targetToken, targetToken.alpha);
        }
        // Create ring (visual indicator)
        const ring = createTargetRing(targetToken);
        state.targetRings.set(targetId, ring);
        container.addChild(ring);
        // Create interactive overlay (handles clicks)
        const overlay = createTargetOverlay(targetToken, targetId, handleOverlayClick);
        state.targetOverlays.set(targetId, overlay);
        container.addChild(overlay);
        // Highlight target token slightly
        targetToken.alpha = Math.min(1.0, targetToken.alpha * 1.2);
    }
    console.log('Mastery System | [MELEE TARGETING] Target rings and overlays created', {
        rings: state.targetRings.size,
        overlays: state.targetOverlays.size
    });
}
/* -------------------------------------------- */
/*  Start / End Targeting                       */
/* -------------------------------------------- */
export function startMeleeTargeting(token, option) {
    console.log('Mastery System | [MELEE TARGETING] startMeleeTargeting called', {
        tokenId: token?.id,
        tokenName: token?.name,
        optionId: option.id,
        optionName: option.name,
        optionRange: option.range,
        optionMeleeReachMeters: option.meleeReachMeters,
        slot: option.slot,
        source: option.source
    });
    endMeleeTargeting(false);
    token.control({ releaseOthers: false });
    const reachMeters = getMeleeReachMeters(option);
    const reachGridUnits = metersToGridUnits(reachMeters);
    console.log('Mastery System | [MELEE TARGETING] Calculated reach', {
        reachMeters,
        reachGridUnits,
        gridDistance: canvas.grid?.distance,
        gridType: canvas.grid?.type
    });
    const previewGraphics = canvas.grid?.type === CONST.GRID_TYPES.GRIDLESS
        ? new PIXI.Graphics()
        : null;
    if (previewGraphics) {
        canvas.stage.addChild(previewGraphics);
    }
    const state = {
        token,
        option,
        reachMeters,
        reachGridUnits,
        highlightId: "mastery-melee",
        previewGraphics,
        originalTokenAlphas: new Map(),
        targetRings: new Map(),
        targetOverlays: new Map(),
        validTargets: new Set(),
        onPointerDown: handlePointerDown,
        onKeyDown: handleKeyDown
    };
    activeMeleeTargeting = state;
    // Use capture phase to catch clicks before they reach other handlers
    canvas.stage.on("pointerdown", state.onPointerDown, true);
    // Also listen on tokens layer as fallback
    if (canvas.tokens) {
        const tokensLayer = canvas.tokens.layer || canvas.tokens;
        tokensLayer.on("pointerdown", state.onPointerDown, true);
    }
    window.addEventListener("keydown", state.onKeyDown);
    highlightReachArea(state);
}
export function endMeleeTargeting(success) {
    const state = activeMeleeTargeting;
    if (!state)
        return;
    canvas.stage.off("pointerdown", state.onPointerDown, true);
    // Remove from tokens layer if added
    if (canvas.tokens) {
        const tokensLayer = canvas.tokens.layer || canvas.tokens;
        tokensLayer.off("pointerdown", state.onPointerDown, true);
    }
    window.removeEventListener("keydown", state.onKeyDown);
    // CLEAR GRID HIGHLIGHT (IMPORTANT)
    clearHexHighlight(state.highlightId);
    // Clear preview graphics
    if (state.previewGraphics) {
        state.previewGraphics.destroy(true);
    }
    // Remove target rings
    for (const [_targetId, ring] of state.targetRings) {
        if (ring.parent) {
            ring.parent.removeChild(ring);
        }
        ring.destroy(true);
    }
    // Remove target overlays
    for (const [_targetId, overlay] of state.targetOverlays) {
        if (overlay.parent) {
            overlay.parent.removeChild(overlay);
        }
        overlay.destroy({ children: true });
    }
    state.targetRings.clear();
    // Restore target visuals
    for (const [token, alpha] of state.originalTokenAlphas) {
        token.alpha = alpha;
        if (token.msOriginalTint !== undefined) {
            token.tint = token.msOriginalTint;
            delete token.msOriginalTint;
        }
    }
    activeMeleeTargeting = null;
    if (!success) {
        ui.notifications?.info("Melee targeting cancelled");
    }
}
/* -------------------------------------------- */
/*  Input Handling                              */
/* -------------------------------------------- */
function handleKeyDown(ev) {
    if (ev.key === "Escape") {
        endMeleeTargeting(false);
    }
}
function handlePointerDown(ev) {
    const state = activeMeleeTargeting;
    if (!state) {
        console.log('Mastery System | [MELEE TARGETING] handlePointerDown: No active targeting state');
        return;
    }
    console.log('Mastery System | [MELEE TARGETING] handlePointerDown', {
        button: ev.button,
        targetType: ev.target?.constructor?.name,
        targetDocumentType: ev.target?.document?.type,
        targetId: ev.target?.id,
        stateTokenId: state.token?.document?.id
    });
    if (ev.button !== 0) {
        console.log('Mastery System | [MELEE TARGETING] Non-left click, cancelling');
        endMeleeTargeting(false);
        return;
    }
    // Use the same method as utility-targeting: find token at click position
    const worldPos = ev.data.getLocalPosition(canvas.app.stage);
    const tokens = canvas.tokens?.placeables || [];
    console.log('Mastery System | [MELEE TARGETING] Searching for token at click position', {
        worldPos: { x: worldPos.x, y: worldPos.y },
        totalTokens: tokens.length,
        validTargets: Array.from(state.validTargets)
    });
    // Try multiple methods to find the clicked token
    let clickedToken = null;
    // Method 1: Check bounds.contains (standard method)
    for (const token of tokens) {
        const bounds = token.bounds;
        if (bounds && bounds.contains(worldPos.x, worldPos.y)) {
            clickedToken = token;
            console.log('Mastery System | [MELEE TARGETING] Found token via bounds.contains', {
                tokenId: token.id,
                tokenName: token.name,
                bounds: { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height }
            });
            break;
        }
    }
    // Method 2: If not found, check distance to token center (fallback)
    if (!clickedToken) {
        let closestToken = null;
        let closestDistance = Infinity;
        for (const token of tokens) {
            const tokenCenter = token.center;
            const distance = Math.sqrt(Math.pow(worldPos.x - tokenCenter.x, 2) +
                Math.pow(worldPos.y - tokenCenter.y, 2));
            const tokenRadius = (token.w || token.width || 50) / 2;
            if (distance <= tokenRadius * 1.5) { // 1.5x radius for easier clicking
                if (distance < closestDistance) {
                    closestDistance = distance;
                    closestToken = token;
                }
            }
        }
        if (closestToken) {
            clickedToken = closestToken;
            console.log('Mastery System | [MELEE TARGETING] Found token via distance check', {
                tokenId: closestToken.id,
                tokenName: closestToken.name,
                distance: closestDistance.toFixed(2)
            });
        }
    }
    // Method 3: Check if ev.target is a token or has a token ancestor
    if (!clickedToken) {
        let current = ev.target;
        let depth = 0;
        while (current && depth < 10) {
            if (current.document && current.document.type === "Token") {
                const tokenId = current.id || current.document?.id;
                clickedToken = tokens.find((t) => t.id === tokenId);
                if (clickedToken) {
                    console.log('Mastery System | [MELEE TARGETING] Found token via ev.target traversal', {
                        tokenId: clickedToken.id,
                        tokenName: clickedToken.name,
                        depth
                    });
                    break;
                }
            }
            current = current.parent;
            depth++;
        }
    }
    console.log('Mastery System | [MELEE TARGETING] Token search result', {
        worldPos: { x: worldPos.x, y: worldPos.y },
        clickedTokenId: clickedToken?.id,
        clickedTokenName: clickedToken?.name,
        totalTokens: tokens.length,
        validTargets: Array.from(state.validTargets),
        foundVia: clickedToken ? 'found' : 'not found'
    });
    if (!clickedToken) {
        // Don't cancel immediately - might be clicking on empty space
        // Only cancel if clicking outside the highlighted area
        console.log('Mastery System | [MELEE TARGETING] No token found at click position', {
            worldPos: { x: worldPos.x, y: worldPos.y },
            validTargets: Array.from(state.validTargets),
            allTokenPositions: tokens.slice(0, 5).map((t) => ({
                id: t.id,
                name: t.name,
                center: t.center,
                bounds: t.bounds ? { x: t.bounds.x, y: t.bounds.y, width: t.bounds.width, height: t.bounds.height } : null
            }))
        });
        // Check if click is on a valid target ring (clicked on ring, not token)
        let clickedOnRing = false;
        for (const [targetId, ring] of state.targetRings) {
            const ringPos = ring.position;
            const ringRadius = ring.radius || 50;
            const distance = Math.sqrt(Math.pow(worldPos.x - ringPos.x, 2) +
                Math.pow(worldPos.y - ringPos.y, 2));
            if (distance <= ringRadius) {
                clickedOnRing = true;
                // Get the token for this ring
                clickedToken = canvas.tokens?.get(targetId);
                console.log('Mastery System | [MELEE TARGETING] Clicked on ring, found token', {
                    targetId,
                    tokenId: clickedToken?.id,
                    tokenName: clickedToken?.name
                });
                break;
            }
        }
        if (!clickedToken && !clickedOnRing) {
            console.log('Mastery System | [MELEE TARGETING] Clicked outside, cancelling');
            endMeleeTargeting(false);
            return;
        }
    }
    if (clickedToken.id === state.token.id) {
        console.log('Mastery System | [MELEE TARGETING] Clicked on own token, ignoring');
        return;
    }
    // Check if target is in valid targets list
    const targetTokenId = clickedToken.id;
    if (!state.validTargets.has(targetTokenId)) {
        console.log('Mastery System | [MELEE TARGETING] Target not in valid targets list', {
            targetId: targetTokenId,
            targetName: clickedToken.name,
            validTargets: Array.from(state.validTargets),
            reachMeters: state.reachMeters
        });
        ui.notifications?.warn(`Target is out of range (${state.reachMeters}m)`);
        return;
    }
    console.log('Mastery System | [MELEE TARGETING] Valid target clicked - starting attack', {
        targetId: clickedToken.id,
        targetName: clickedToken.name,
        attackerId: state.token.id,
        attackerName: state.token.name,
        reachMeters: state.reachMeters,
        reachGridUnits: state.reachGridUnits,
        optionId: state.option.id,
        optionName: state.option.name
    });
    ev.stopPropagation();
    ev.stopImmediatePropagation();
    // Execute the attack
    executeMeleeAttack(state.token, clickedToken, state.option);
    // End targeting
    endMeleeTargeting(true);
}
/**
 * Execute a melee attack with the selected target
 */
async function executeMeleeAttack(attackerToken, targetToken, option) {
    console.log('Mastery System | [MELEE TARGETING] Executing melee attack', {
        attackerId: attackerToken.id,
        attackerName: attackerToken.name,
        targetId: targetToken.id,
        targetName: targetToken.name,
        optionId: option.id,
        optionName: option.name,
        optionSource: option.source
    });
    const attacker = attackerToken.actor;
    const target = targetToken.actor;
    if (!attacker || !target) {
        console.error('Mastery System | [MELEE TARGETING] Missing actor data', {
            hasAttacker: !!attacker,
            hasTarget: !!target
        });
        ui.notifications?.error('Cannot execute attack: missing actor data');
        return;
    }
    // If it's a power, try to use the item's roll method
    if (option.source === 'power' && option.item) {
        try {
            // Check if the item has a roll method that accepts targets
            if (typeof option.item.roll === 'function') {
                // Some Foundry systems support passing targets to roll()
                const rollOptions = {
                    target: target,
                    createMessage: true
                };
                // Try to call roll with target
                await option.item.roll(rollOptions);
                ui.notifications?.info(`Attacking ${targetToken.name || 'target'} with ${option.name}`);
                return;
            }
        }
        catch (error) {
            console.warn('Mastery System | [MELEE TARGETING] Error using item.roll(), trying alternative method', error);
        }
    }
    // Fallback: Call handleChosenCombatOption with target information
    // This will trigger the normal attack flow
    try {
        // Import the handler
        const { handleChosenCombatOption } = await import('./token-action-selector');
        // Store target info in option for the handler to use
        const optionWithTarget = {
            ...option,
            targetToken: targetToken,
            targetActor: target
        };
        // Call the handler - it should handle the attack roll
        await handleChosenCombatOption(attackerToken, optionWithTarget);
        ui.notifications?.info(`Attacking ${targetToken.name || 'target'} with ${option.name}`);
    }
    catch (error) {
        console.error('Mastery System | [MELEE TARGETING] Error executing attack', error);
        ui.notifications?.error(`Failed to execute attack: ${error}`);
    }
}
export function isMeleeTargetingActive() {
    return activeMeleeTargeting !== null;
}
//# sourceMappingURL=melee-targeting.js.map