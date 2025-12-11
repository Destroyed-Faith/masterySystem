/**
 * Melee Targeting System for Mastery System
 *
 * Provides reach preview and target highlighting for melee attacks
 * Similar to movement preview but for attack targeting
 */
// Global melee targeting state
let activeMeleeTargeting = null;
/**
 * Parse reach from weapon innate abilities or option
 * @param innateAbilities - Array of ability strings like ["Reach (2 m)", "Finesse"]
 * @returns Reach in meters, or 2 if not found (default melee reach is now 2m)
 */
function parseReachFromAbilities(innateAbilities) {
    if (!innateAbilities || !Array.isArray(innateAbilities)) {
        return 2; // Default melee reach is now 2m
    }
    for (const ability of innateAbilities) {
        // Match "Reach (2 m)" or "Reach (3 m)"
        const match = ability.match(/Reach\s*\((\d+)\s*m\)/i);
        if (match) {
            return parseInt(match[1], 10);
        }
    }
    return 2; // Default melee reach is now 2m
}
/**
 * Get melee reach for an attack option
 * @param token - The attacking token
 * @param option - The combat option
 * @returns Reach in meters
 */
function getMeleeReach(token, option) {
    // Check if option has explicit meleeReachMeters
    if (option.meleeReachMeters !== undefined) {
        return option.meleeReachMeters;
    }
    // Check equipped weapon
    const actor = token.actor;
    if (actor) {
        const items = actor.items || [];
        const equippedWeapon = items.find((item) => {
            return item.type === 'weapon' && item.system?.equipped === true;
        });
        if (equippedWeapon) {
            const innateAbilities = equippedWeapon.system?.innateAbilities || [];
            const reach = parseReachFromAbilities(innateAbilities);
            // If weapon has explicit reach, use it (even if it's 2m, which is now the default)
            if (reach >= 2) {
                console.log('Mastery System | Found weapon reach:', reach, 'm from', equippedWeapon.name);
                return reach;
            }
        }
    }
    // Default: 2 meters (extended melee reach)
    return 2;
}
/**
 * Convert meters to grid units
 * @param meters - Distance in meters
 * @returns Distance in grid units
 */
function metersToGridUnits(meters) {
    // canvas.grid.distance is the grid distance per unit (usually 1 for 1m per hex)
    const gridDistance = canvas.grid?.distance || 1;
    return meters / gridDistance;
}
/**
 * Get all valid melee targets within reach
 * @param attackerToken - The attacking token
 * @param reachGridUnits - Reach in grid units
 * @returns Array of valid target tokens
 */
function getValidMeleeTargets(attackerToken, reachGridUnits) {
    const validTargets = [];
    const attackerCenter = attackerToken.center;
    // Get all tokens on the canvas
    const allTokens = canvas.tokens?.placeables || [];
    for (const token of allTokens) {
        // Skip the attacker
        if (token.id === attackerToken.id) {
            continue;
        }
        // Only consider NPCs or hostile tokens
        const actor = token.actor;
        if (!actor)
            continue;
        // Check if it's an NPC or hostile
        const isNPC = actor.type === 'npc';
        const isHostile = token.document.disposition === CONST.TOKEN_DISPOSITIONS.HOSTILE;
        if (!isNPC && !isHostile) {
            continue; // Skip friendly/neutral tokens
        }
        // Calculate distance from attacker center to target center
        const targetCenter = token.center;
        const dx = targetCenter.x - attackerCenter.x;
        const dy = targetCenter.y - attackerCenter.y;
        const pixelDistance = Math.sqrt(dx * dx + dy * dy);
        const gridDistance = pixelDistance / (canvas.grid?.size || 1);
        // For hex grids, use Foundry's distance measurement (new v13 API)
        let distanceInUnits = gridDistance;
        try {
            if (canvas.grid?.measurePath) {
                // New v13 API: measurePath returns array of distances
                const waypoints = [
                    { x: attackerCenter.x, y: attackerCenter.y },
                    { x: targetCenter.x, y: targetCenter.y }
                ];
                const measurement = canvas.grid.measurePath(waypoints, {});
                if (measurement && measurement.length > 0) {
                    distanceInUnits = measurement[0];
                }
            }
            else if (canvas.grid?.measureDistances) {
                // Fallback to old API
                const waypoints = [
                    { x: attackerCenter.x, y: attackerCenter.y },
                    { x: targetCenter.x, y: targetCenter.y }
                ];
                const measurement = canvas.grid.measureDistances(waypoints, {});
                if (measurement && measurement.length > 0) {
                    distanceInUnits = measurement[0];
                }
            }
        }
        catch (error) {
            console.warn('Mastery System | Could not measure distance, using fallback', error);
        }
        // Check if within reach
        if (distanceInUnits <= reachGridUnits) {
            validTargets.push(token);
        }
    }
    return validTargets;
}
/**
 * Highlight reach area around the attacker
 */
function highlightReachArea(state) {
    if (!canvas.grid || !state.previewGraphics)
        return;
    const attackerCenter = state.token.center;
    const radiusPx = state.reachGridUnits * (canvas.grid.size || 1);
    // Clear previous graphics
    state.previewGraphics.clear();
    // Draw reach circle (semi-transparent red/orange) - make it more visible
    state.previewGraphics.lineStyle(3, 0xff6666, 1.0); // Thicker, fully opaque border
    state.previewGraphics.beginFill(0xff6666, 0.25); // Slightly more visible fill
    state.previewGraphics.drawCircle(0, 0, radiusPx);
    state.previewGraphics.endFill();
    // Add an inner ring for better visibility
    state.previewGraphics.lineStyle(1, 0xff8888, 0.6);
    state.previewGraphics.drawCircle(0, 0, radiusPx * 0.9);
    // Position at attacker center
    state.previewGraphics.position.set(attackerCenter.x, attackerCenter.y);
    // Also highlight hexes within reach using grid highlight
    let highlight = null;
    try {
        // Use new v13 API: canvas.interface.grid.highlight
        if (canvas.interface?.grid?.highlight) {
            highlight = canvas.interface.grid.highlight;
            console.log('Mastery System | Using canvas.interface.grid.highlight for melee reach');
        }
        else if (canvas.grid?.highlight) {
            // Fallback to old API for compatibility
            highlight = canvas.grid.highlight;
            console.log('Mastery System | Using canvas.grid.highlight (fallback) for melee reach');
        }
        else if (canvas.grid.getHighlightLayer) {
            highlight = canvas.grid.getHighlightLayer(state.highlightId);
            if (!highlight && canvas.grid.addHighlightLayer) {
                highlight = canvas.grid.addHighlightLayer(state.highlightId);
            }
            console.log('Mastery System | Using getHighlightLayer for melee reach');
        }
    }
    catch (error) {
        console.warn('Mastery System | Could not get highlight layer for melee reach', error);
    }
    if (highlight) {
        // Try to clear the highlight layer
        if (typeof highlight.clear === 'function') {
            highlight.clear();
            console.log('Mastery System | Highlight layer cleared for melee reach');
        }
        else {
            console.log('Mastery System | Highlight layer found but no clear method');
        }
    }
    else {
        console.warn('Mastery System | No highlight layer available - hex highlighting will not work');
    }
    // Highlight hexes within reach
    // For hex grids, we need to iterate through nearby hexes
    const maxHexDistance = Math.ceil(state.reachGridUnits);
    // Get grid position of attacker using new v13 API
    let attackerGrid = null;
    try {
        if (canvas.grid?.getOffset) {
            // New v13 API: getOffset returns {col, row}
            const offset = canvas.grid.getOffset(attackerCenter.x, attackerCenter.y);
            attackerGrid = { col: offset.col, row: offset.row };
        }
        else if (canvas.grid?.getGridPositionFromPixels) {
            // Fallback to old API
            const oldGrid = canvas.grid.getGridPositionFromPixels(attackerCenter.x, attackerCenter.y);
            if (oldGrid) {
                attackerGrid = { col: oldGrid.x, row: oldGrid.y };
            }
        }
    }
    catch (error) {
        console.warn('Mastery System | Could not get grid position', error);
    }
    if (attackerGrid && highlight) {
        // For hex grids, use cube coordinates or axial coordinates
        // Simple approach: check all hexes in a square area and measure distance
        for (let q = -maxHexDistance; q <= maxHexDistance; q++) {
            for (let r = -maxHexDistance; r <= maxHexDistance; r++) {
                // For hex grids, calculate distance using hex distance formula
                // In axial coordinates: distance = (|q| + |r| + |q + r|) / 2
                // But we need to check if this hex is within reach
                const gridCol = attackerGrid.col + q;
                const gridRow = attackerGrid.row + r;
                // Measure actual distance from attacker to this hex using new v13 API
                let hexCenter = null;
                try {
                    if (canvas.grid?.getTopLeftPoint) {
                        // New v13 API: getTopLeftPoint(col, row) returns center point
                        hexCenter = canvas.grid.getTopLeftPoint(gridCol, gridRow);
                    }
                    else if (canvas.grid?.getPixelsFromGridPosition) {
                        // Fallback to old API
                        hexCenter = canvas.grid.getPixelsFromGridPosition(gridCol, gridRow);
                    }
                }
                catch (error) {
                    // Skip this hex if we can't get its position
                    continue;
                }
                if (hexCenter) {
                    const dx = hexCenter.x - attackerCenter.x;
                    const dy = hexCenter.y - attackerCenter.y;
                    const pixelDistance = Math.sqrt(dx * dx + dy * dy);
                    const gridDistance = pixelDistance / (canvas.grid.size || 1);
                    // Use Foundry's distance measurement if available (new v13 API)
                    let distanceInUnits = gridDistance;
                    try {
                        if (canvas.grid?.measurePath) {
                            // New v13 API: measurePath returns array of distances
                            const waypoints = [
                                { x: attackerCenter.x, y: attackerCenter.y },
                                { x: hexCenter.x, y: hexCenter.y }
                            ];
                            const measurement = canvas.grid.measurePath(waypoints, {});
                            if (measurement && measurement.length > 0) {
                                distanceInUnits = measurement[0];
                            }
                        }
                        else if (canvas.grid?.measureDistances) {
                            // Fallback to old API
                            const waypoints = [
                                { x: attackerCenter.x, y: attackerCenter.y },
                                { x: hexCenter.x, y: hexCenter.y }
                            ];
                            const measurement = canvas.grid.measureDistances(waypoints, {});
                            if (measurement && measurement.length > 0) {
                                distanceInUnits = measurement[0];
                            }
                        }
                    }
                    catch (error) {
                        // Use fallback
                    }
                    if (distanceInUnits <= state.reachGridUnits) {
                        // Try different methods to highlight the hex
                        if (highlight && typeof highlight.highlightPosition === 'function') {
                            highlight.highlightPosition(gridCol, gridRow, { color: 0xff6666, alpha: 0.5 });
                        }
                        else if (highlight && typeof highlight.highlightGridPosition === 'function') {
                            highlight.highlightGridPosition(gridCol, gridRow, { color: 0xff6666, alpha: 0.5 });
                        }
                        else if (highlight && typeof highlight.highlight === 'function') {
                            // Some versions use just 'highlight'
                            highlight.highlight(gridCol, gridRow, { color: 0xff6666, alpha: 0.5 });
                        }
                    }
                }
            }
        }
    }
}
/**
 * Apply visual tint to valid target tokens
 */
function highlightValidTargets(state) {
    const validTargets = getValidMeleeTargets(state.token, state.reachGridUnits);
    console.log('Mastery System | Melee targeting: Found', validTargets.length, 'valid targets within', state.reachMeters, 'm reach');
    // Store original alphas and apply red tint
    state.originalTokenAlphas.clear();
    for (const target of validTargets) {
        // Store original alpha
        state.originalTokenAlphas.set(target, target.alpha);
        // Apply red tint (reduce alpha slightly and add red filter)
        target.alpha = Math.max(0.6, target.alpha * 0.8);
        // Add red tint using a simple color overlay instead of deprecated ColorMatrixFilter
        // Store original tint for restoration
        const originalTint = target.tint;
        target.msOriginalTint = originalTint;
        // Apply red tint (mix red with original color)
        target.tint = 0xff6666;
        // Also add a red outline/border effect using a graphics overlay
        // This is more reliable than filters
        if (!target.msTargetOverlay) {
            const overlay = new PIXI.Graphics();
            const radius = Math.max(target.w || 50, target.h || 50) / 2 + 5;
            overlay.lineStyle(3, 0xff6666, 0.8);
            overlay.drawCircle(0, 0, radius);
            // Position overlay at token center
            overlay.position.set((target.w || 50) / 2, (target.h || 50) / 2);
            target.addChild(overlay);
            target.msTargetOverlay = overlay;
            console.log('Mastery System | Added red overlay to target:', target.name);
        }
    }
}
/**
 * Start melee targeting mode
 * @param token - The attacking token
 * @param option - The combat option (must be melee)
 */
export function startMeleeTargeting(token, option) {
    console.log('Mastery System | Starting melee targeting mode', { token: token.name, option: option.name });
    // Cancel any existing melee targeting
    endMeleeTargeting(false);
    // Ensure token is controlled by this user
    token.control({ releaseOthers: false });
    // Calculate reach
    const reachMeters = getMeleeReach(token, option);
    const reachGridUnits = metersToGridUnits(reachMeters);
    console.log('Mastery System | Melee reach:', reachMeters, 'm (', reachGridUnits, 'grid units)');
    // Create preview graphics
    const previewGraphics = new PIXI.Graphics();
    // Add to effects layer - try multiple layers to ensure visibility
    let effectsContainer = null;
    // Try tokens layer first (most visible)
    if (canvas.tokens) {
        if (canvas.tokens.container && typeof canvas.tokens.container.addChild === 'function') {
            effectsContainer = canvas.tokens.container;
        }
        else if (typeof canvas.tokens.addChild === 'function') {
            effectsContainer = canvas.tokens;
        }
    }
    // Fallback to effects layer
    if (!effectsContainer && canvas.effects) {
        if (canvas.effects.container && typeof canvas.effects.container.addChild === 'function') {
            effectsContainer = canvas.effects.container;
        }
        else if (typeof canvas.effects.addChild === 'function') {
            effectsContainer = canvas.effects;
        }
    }
    // Fallback to foreground layer
    if (!effectsContainer && canvas.foreground) {
        if (canvas.foreground.container && typeof canvas.foreground.container.addChild === 'function') {
            effectsContainer = canvas.foreground.container;
        }
        else if (typeof canvas.foreground.addChild === 'function') {
            effectsContainer = canvas.foreground;
        }
    }
    if (effectsContainer) {
        effectsContainer.addChild(previewGraphics);
        // Ensure it's on top
        effectsContainer.setChildIndex(previewGraphics, effectsContainer.children.length - 1);
        console.log('Mastery System | Melee reach circle added to container:', effectsContainer.constructor.name);
    }
    else {
        console.warn('Mastery System | Could not find container for melee reach preview');
    }
    const highlightId = 'mastery-melee';
    // Create event handlers
    const onPointerDown = (ev) => handleMeleePointerDown(ev);
    const onKeyDown = (ev) => {
        if (ev.key === 'Escape' && activeMeleeTargeting) {
            console.log('Mastery System | Melee targeting cancelled via ESC');
            endMeleeTargeting(false);
        }
    };
    const state = {
        token,
        option,
        reachMeters,
        reachGridUnits,
        originalTokenAlphas: new Map(),
        highlightId,
        previewGraphics,
        onPointerDown,
        onKeyDown
    };
    activeMeleeTargeting = state;
    // Attach event listeners
    canvas.stage.on('pointerdown', state.onPointerDown);
    window.addEventListener('keydown', state.onKeyDown);
    // Draw reach area and highlight targets
    highlightReachArea(state);
    highlightValidTargets(state);
    // Show notification to help user understand what's happening
    const validTargets = getValidMeleeTargets(token, reachGridUnits);
    if (validTargets.length > 0) {
        ui.notifications?.info(`Melee targeting active: ${reachMeters}m reach. ${validTargets.length} enemy(ies) in range. Click on an enemy to attack.`);
    }
    else {
        ui.notifications?.info(`Melee targeting active: ${reachMeters}m reach. No enemies in range. Move enemies within the red area to attack.`);
    }
    console.log('Mastery System | Melee targeting mode active', {
        reachMeters,
        reachGridUnits,
        token: token.name,
        validTargets: validTargets.length
    });
}
/**
 * Handle pointer down during melee targeting
 */
function handleMeleePointerDown(ev) {
    const state = activeMeleeTargeting;
    if (!state)
        return;
    // Right or middle click cancels
    if (ev.button === 2 || ev.button === 1) {
        console.log('Mastery System | Melee targeting cancelled via mouse button', ev.button);
        endMeleeTargeting(false);
        return;
    }
    // Left click - check if clicking on a valid target
    if (ev.button === 0) {
        // Get the clicked object from the event
        const clickedObject = ev.target;
        // Try to find the token from the clicked object
        let clickedToken = null;
        // Method 1: Check if the clicked object is a token
        if (clickedObject && clickedObject.document && clickedObject.document.type === 'Token') {
            clickedToken = clickedObject;
            console.log('Mastery System | Found token via direct check:', clickedToken.name);
        }
        // Method 2: Check if clicked object is a child of a token
        if (!clickedToken && clickedObject) {
            let parent = clickedObject.parent;
            let depth = 0;
            while (parent && depth < 10) {
                if (parent.document && parent.document.type === 'Token') {
                    clickedToken = parent;
                    console.log('Mastery System | Found token via parent traversal:', clickedToken.name);
                    break;
                }
                parent = parent.parent;
                depth++;
            }
        }
        // Method 3: Find token by position (fallback)
        if (!clickedToken) {
            try {
                const worldPos = ev.data.getLocalPosition(canvas.app.stage);
                const tokens = canvas.tokens?.placeables || [];
                clickedToken = tokens.find((token) => {
                    const bounds = token.bounds;
                    return bounds && bounds.contains(worldPos.x, worldPos.y);
                });
                if (clickedToken) {
                    console.log('Mastery System | Found token via position check:', clickedToken.name);
                }
            }
            catch (error) {
                console.warn('Mastery System | Could not get world position from click', error);
            }
        }
        if (clickedToken && clickedToken.id !== state.token.id) {
            // Check if it's a valid target
            const validTargets = getValidMeleeTargets(state.token, state.reachGridUnits);
            const isValidTarget = validTargets.some(t => t.id === clickedToken.id);
            if (isValidTarget) {
                console.log('Mastery System | Valid melee target selected:', clickedToken.name);
                ev.stopPropagation();
                ev.stopImmediatePropagation();
                confirmMeleeTarget(clickedToken, state);
                return;
            }
            else {
                console.log('Mastery System | Clicked token is not a valid target:', clickedToken.name);
            }
        }
        // Clicked outside any valid target - cancel
        console.log('Mastery System | Clicked outside valid target, cancelling melee targeting');
        endMeleeTargeting(false);
    }
}
/**
 * Confirm melee target and execute attack
 */
async function confirmMeleeTarget(targetToken, state) {
    // Set target using Foundry's targeting API
    try {
        await game.user.updateTokenTargets([targetToken.id]);
        console.log('Mastery System | Target set:', targetToken.name);
    }
    catch (error) {
        console.warn('Mastery System | Could not set target via API', error);
    }
    // Execute attack resolution
    // This will be handled by the existing combat option handler
    // We just need to pass the target information
    console.log('Mastery System | Melee attack confirmed:', {
        attacker: state.token.name,
        target: targetToken.name,
        option: state.option.name,
        reach: state.reachMeters + 'm'
    });
    // Call the existing attack handler with target info
    // The handler should be able to access the target via game.user.targets
    // For now, we'll just log and end targeting mode
    // TODO: Integrate with actual attack resolution
    // End targeting mode
    endMeleeTargeting(true);
    // Trigger notification
    ui.notifications?.info(`Melee attack: ${state.token.name} → ${targetToken.name} (${state.option.name})`);
}
/**
 * End melee targeting mode
 * @param success - Whether targeting was successful (target selected) or cancelled
 */
export function endMeleeTargeting(success) {
    const state = activeMeleeTargeting;
    if (!state)
        return;
    console.log('Mastery System | Ending melee targeting mode, success =', success);
    // Remove event listeners
    canvas.stage.off('pointerdown', state.onPointerDown);
    window.removeEventListener('keydown', state.onKeyDown);
    // Clear highlights using new v13 API
    let highlight = null;
    try {
        // Use new v13 API: canvas.interface.grid.highlight
        if (canvas.interface?.grid?.highlight) {
            highlight = canvas.interface.grid.highlight;
        }
        else if (canvas.grid?.highlight) {
            // Fallback to old API for compatibility
            highlight = canvas.grid.highlight;
        }
        else if (canvas.grid && canvas.grid.getHighlightLayer) {
            highlight = canvas.grid.getHighlightLayer(state.highlightId);
        }
    }
    catch (error) {
        // Ignore
    }
    if (highlight && highlight.clear) {
        highlight.clear();
    }
    // Clear preview graphics
    if (state.previewGraphics && state.previewGraphics.parent) {
        state.previewGraphics.parent.removeChild(state.previewGraphics);
        state.previewGraphics.clear();
    }
    // Restore token alphas and remove tints
    for (const [token, originalAlpha] of state.originalTokenAlphas.entries()) {
        token.alpha = originalAlpha;
        // Restore original tint
        const originalTint = token.msOriginalTint;
        if (originalTint !== undefined) {
            token.tint = originalTint;
            delete token.msOriginalTint;
        }
        // Remove overlay graphics
        const overlay = token.msTargetOverlay;
        if (overlay && overlay.parent) {
            overlay.parent.removeChild(overlay);
            overlay.destroy();
            delete token.msTargetOverlay;
        }
    }
    // Clear state
    activeMeleeTargeting = null;
    if (!success) {
        ui.notifications?.info('Melee targeting cancelled');
    }
}
/**
 * Check if melee targeting is currently active
 */
export function isMeleeTargetingActive() {
    return activeMeleeTargeting !== null;
}
//# sourceMappingURL=melee-targeting.js.map