/**
 * Melee Targeting System for Mastery System
 *
 * Provides reach preview and target highlighting for melee attacks
 * Similar to movement preview but for attack targeting
 */
// Global melee targeting state
let activeMeleeTargeting = null;
// Guard to prevent duplicate confirmMeleeTarget calls
let isConfirmingTarget = false;
/**
 * Parse reach from weapon innate abilities or option
 * @param innateAbilities - Array of ability strings like ["Reach (+1 m)", "Finesse"]
 * @returns Reach in meters (2m base + bonus from weapon)
 */
function parseReachFromAbilities(innateAbilities) {
    const baseReach = 2; // Default melee reach is 2m
    if (!innateAbilities || !Array.isArray(innateAbilities)) {
        return baseReach;
    }
    for (const ability of innateAbilities) {
        // Match "Reach (+1 m)" or "Reach (+2 m)" - new format
        const bonusMatch = ability.match(/Reach\s*\(\+\s*(\d+)\s*m\)/i);
        if (bonusMatch) {
            const bonus = parseInt(bonusMatch[1], 10);
            return baseReach + bonus; // 2m base + bonus
        }
        // Legacy support: Match "Reach (2 m)" or "Reach (3 m)" - old format
        const legacyMatch = ability.match(/Reach\s*\((\d+)\s*m\)/i);
        if (legacyMatch) {
            return parseInt(legacyMatch[1], 10);
        }
    }
    return baseReach; // Default melee reach is 2m
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
 * Calculate Evade (defense) for a target
 * Evade = Agility + Combat Reflexes + (Mastery Rank × 2)
 * Or use pre-calculated evadeTotal if available
 */
function calculateEvade(actor) {
    const system = actor.system;
    // Try to use pre-calculated evadeTotal first
    if (system.combat?.evadeTotal !== undefined) {
        return system.combat.evadeTotal;
    }
    // Fallback calculation: Agility + Combat Reflexes + (MR × 2)
    const agility = system.attributes?.agility?.value || 0;
    const combatReflexes = system.combat?.reflexes || system.combat?.combatReflexes || 0;
    const masteryRank = system.mastery?.rank || 2;
    return agility + combatReflexes + (masteryRank * 2);
}
/**
 * Get attack attribute for melee attack
 * Defaults to Might, but can be Agility if weapon has Finesse
 */
function getAttackAttribute(actor, weapon) {
    const system = actor.system;
    // Check if weapon has Finesse
    const innateAbilities = weapon?.system?.innateAbilities || [];
    const hasFinesse = innateAbilities.some((a) => a.toLowerCase().includes('finesse'));
    if (hasFinesse) {
        return {
            name: 'Agility',
            value: system.attributes?.agility?.value || 0
        };
    }
    // Default to Might
    return {
        name: 'Might',
        value: system.attributes?.might?.value || 0
    };
}
/**
 * Confirm melee target and create attack roll card
 */
async function confirmMeleeTarget(targetToken, state) {
    // Guard against duplicate calls
    if (isConfirmingTarget) {
        console.warn('Mastery System | confirmMeleeTarget already in progress, ignoring duplicate call');
        return;
    }
    isConfirmingTarget = true;
    try {
        const attacker = state.token.actor;
        const target = targetToken.actor;
        if (!attacker || !target) {
            console.error('Mastery System | Missing actor data for attack');
            endMeleeTargeting(false);
            return;
        }
        // Get equipped weapon
        const items = attacker.items || [];
        const equippedWeapon = items.find((item) => item.type === 'weapon' && item.system?.equipped === true);
        // Get attack data
        const attackAttr = getAttackAttribute(attacker, equippedWeapon);
        const attackerSystem = attacker.system;
        const masteryRank = attackerSystem.mastery?.rank || 2;
        // Get target's Evade
        const targetEvade = calculateEvade(target);
        // Get weapon damage for display
        const weaponDamage = equippedWeapon ? (equippedWeapon.system?.damage || equippedWeapon.system?.weaponDamage || '1d8') : '1d8';
        console.log('Mastery System | [ATTACK CARD CREATION] Weapon info', {
            hasEquippedWeapon: !!equippedWeapon,
            weaponId: equippedWeapon ? equippedWeapon.id : null,
            weaponName: equippedWeapon ? equippedWeapon.name : null,
            weaponDamage: weaponDamage
        });
        // Get available attack powers (powers that can be used on attack)
        // Show all active powers, or powers explicitly marked as canUseOnAttack
        const attackPowers = items.filter((item) => {
            if (item.type !== 'special')
                return false;
            const system = item.system;
            const powerType = system?.powerType;
            // Include if it's an active power
            if (powerType === 'active') {
                // If canUseOnAttack is explicitly set, respect it
                if (system?.canUseOnAttack !== undefined) {
                    return system.canUseOnAttack === true;
                }
                // Otherwise, include all active powers (default to true)
                return true;
            }
            return false;
        });
        console.log('Mastery System | [ATTACK CARD CREATION] Attack powers found', {
            totalItems: items.length,
            specialItems: items.filter((item) => item.type === 'special').length,
            attackPowersCount: attackPowers.length,
            attackPowers: attackPowers.map((p) => ({
                id: p.id,
                name: p.name,
                powerType: p.system?.powerType,
                canUseOnAttack: p.system?.canUseOnAttack,
                level: p.system?.level
            }))
        });
        // Select first available power automatically (if any)
        let selectedPower = null;
        let selectedPowerLevel = 1;
        let selectedPowerSpecials = [];
        let selectedPowerDamage = '';
        if (attackPowers.length > 0) {
            // Use the first available power
            selectedPower = attackPowers[0];
            const powerSystem = selectedPower.system;
            selectedPowerLevel = powerSystem.level || 1;
            selectedPowerSpecials = powerSystem.specials || [];
            selectedPowerDamage = powerSystem.roll?.damage || '';
            // Try to get level-specific data from power definitions
            try {
                const powersModule = await import('../../utils/powers/index.js');
                const powerDefinitions = powersModule.ALL_MASTERY_POWERS || [];
                const powerTree = powerSystem.tree || '';
                const powerName = selectedPower.name;
                const powerDef = powerDefinitions.find((p) => p.name === powerName && p.tree === powerTree);
                if (powerDef && powerDef.levels) {
                    const levelData = powerDef.levels.find((l) => l.level === selectedPowerLevel);
                    if (levelData) {
                        // Use level-specific data if available
                        if (levelData.special) {
                            selectedPowerSpecials = levelData.special.split(',').map((s) => s.trim());
                        }
                        if (levelData.roll?.damage) {
                            selectedPowerDamage = levelData.roll.damage;
                        }
                    }
                }
            }
            catch (e) {
                console.warn('Mastery System | Could not load power definitions for level data', e);
            }
            console.log('Mastery System | [ATTACK CARD CREATION] Selected power', {
                powerId: selectedPower.id,
                powerName: selectedPower.name,
                powerLevel: selectedPowerLevel,
                powerSpecials: selectedPowerSpecials,
                powerDamage: selectedPowerDamage
            });
        }
        // Create attack card in chat
        const attackCardContent = `
    <div class="mastery-attack-card">
      <div class="attack-header">
        <h3><i class="fas fa-sword"></i> Melee Attack</h3>
        <div class="attack-participants">
          <strong>${attacker.name}</strong> → <strong>${target.name}</strong>
        </div>
      </div>
      
      <div class="attack-details">
        <div class="detail-row">
          <span>Attack Attribute:</span>
          <span><strong>${attackAttr.name}</strong> (${attackAttr.value} dice)</span>
        </div>
        <div class="detail-row">
          <span>Mastery Rank:</span>
          <span><strong>${masteryRank}</strong> (keep ${masteryRank} highest)</span>
        </div>
        <div class="detail-row">
          <span>Target Evade:</span>
          <span><strong id="display-evade-${attacker.id}">${targetEvade}</strong></span>
        </div>
        ${equippedWeapon ? `
          <div class="detail-row">
            <span>Weapon:</span>
            <span><strong>${equippedWeapon.name}</strong> (${weaponDamage} damage)</span>
          </div>
        ` : ''}
        ${selectedPower ? `
          <div class="detail-row">
            <span>Power:</span>
            <span><strong>${selectedPower.name}</strong> (Level ${selectedPowerLevel})</span>
          </div>
        ` : ''}
      </div>
      
      <div class="raises-section">
        <label for="raises-input-${attacker.id}" style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
          <span style="font-weight: bold; color: #8b0000;">Raises:</span>
          <input type="number" class="raises-input" id="raises-input-${attacker.id}" 
                 min="0" value="0" step="1" inputmode="numeric" pattern="[0-9]*"
                 data-base-evade="${targetEvade}">
          <span class="raises-hint">(+4 TN per raise)</span>
        </label>
      </div>
      
      <div class="attack-actions">
        <button class="roll-attack-btn" data-attacker-id="${attacker.id}" data-target-id="${target.id}" 
                data-attribute="${attackAttr.name.toLowerCase()}" data-attribute-value="${attackAttr.value}"
                data-mastery-rank="${masteryRank}" data-target-evade="${targetEvade}" data-raises="0"
                data-base-evade="${targetEvade}">
          <i class="fas fa-dice-d20"></i> Roll Attack
        </button>
      </div>
    </div>
  `;
        console.log('Mastery System | [ATTACK CARD CREATION] Attack card HTML generated', {
            hasRaisesSection: attackCardContent.includes('raises-section'),
            hasRaisesInput: attackCardContent.includes('raises-input'),
            hasPowerSelection: attackCardContent.includes('power-select'),
            raisesInputId: `raises-input-${attacker.id}`,
            htmlLength: attackCardContent.length,
            htmlPreview: attackCardContent.substring(0, 500) + '...'
        });
        // Prepare initial flags
        const initialFlags = {
            attackType: 'melee',
            attackerId: attacker.id,
            targetId: target.id,
            targetTokenId: targetToken.id,
            attribute: attackAttr.name.toLowerCase(),
            attributeValue: attackAttr.value,
            masteryRank: masteryRank,
            targetEvade: targetEvade,
            weaponDamage: weaponDamage,
            baseEvade: targetEvade,
            weaponId: equippedWeapon ? equippedWeapon.id : null,
            selectedPowerId: null,
            selectedPowerLevel: null,
            selectedPowerSpecials: [],
            selectedPowerDamage: ''
        };
        console.log('Mastery System | [ATTACK CARD CREATION] Initial flags being set', {
            weaponId: initialFlags.weaponId,
            selectedPowerId: initialFlags.selectedPowerId,
            targetEvade: initialFlags.targetEvade,
            baseEvade: initialFlags.baseEvade,
            allFlagKeys: Object.keys(initialFlags)
        });
        // Create chat message
        const chatData = {
            user: game.user?.id,
            speaker: ChatMessage.getSpeaker({ actor: attacker, token: state.token }),
            content: attackCardContent,
            style: CONST.CHAT_MESSAGE_STYLES.OTHER,
            flags: {
                'mastery-system': initialFlags
            }
        };
        const message = await ChatMessage.create(chatData);
        console.log('Mastery System | DEBUG: Chat message created', {
            messageId: message.id,
            contentLength: attackCardContent.length
        });
        // Initialize raises input handler and power selection
        const initializeRaisesInput = () => {
            const messageElement = $(`[data-message-id="${message.id}"]`);
            console.log('Mastery System | DEBUG: Initializing raises input handler', {
                messageId: message.id,
                messageElementFound: messageElement.length > 0,
                messageElementHtml: messageElement.length > 0 ? messageElement.html()?.substring(0, 200) : 'not found'
            });
            if (messageElement.length) {
                // Power is now automatically selected, no dropdown handler needed
                const raisesInput = messageElement.find(`#raises-input-${attacker.id}`);
                const displayEvade = messageElement.find(`#display-evade-${attacker.id}`);
                const rollButton = messageElement.find(`[data-attacker-id="${attacker.id}"].roll-attack-btn`);
                const baseEvade = targetEvade;
                console.log('Mastery System | DEBUG: Looking for elements in message', {
                    raisesInputFound: raisesInput.length > 0,
                    displayEvadeFound: displayEvade.length > 0,
                    rollButtonFound: rollButton.length > 0,
                    raisesInputId: `raises-input-${attacker.id}`,
                    allInputsInMessage: messageElement.find('input').length,
                    allInputsIds: messageElement.find('input').map((_i, el) => $(el).attr('id')).get()
                });
                if (raisesInput.length && displayEvade.length && rollButton.length) {
                    console.log('Mastery System | DEBUG: All elements found, attaching input handler');
                    // Prevent non-numeric input
                    raisesInput.off('keypress').on('keypress', function (e) {
                        const char = String.fromCharCode(e.which);
                        if (!/[0-9]/.test(char)) {
                            e.preventDefault();
                            console.log('Mastery System | DEBUG: Blocked non-numeric input:', char);
                            return false;
                        }
                        return true;
                    });
                    // Handle input changes
                    raisesInput.off('input').on('input', function () {
                        let value = $(this).val();
                        // Remove any non-numeric characters
                        value = value.replace(/[^0-9]/g, '');
                        if (value === '')
                            value = '0';
                        $(this).val(value);
                        const raises = parseInt(value) || 0;
                        const adjustedEvade = baseEvade + (raises * 4);
                        console.log('Mastery System | DEBUG: Raises input changed', {
                            rawValue: $(this).val(),
                            raises,
                            baseEvade,
                            adjustedEvade
                        });
                        displayEvade.text(adjustedEvade);
                        rollButton.attr('data-target-evade', adjustedEvade);
                        rollButton.attr('data-raises', raises);
                    });
                    console.log('Mastery System | DEBUG: Raises input handler attached successfully');
                    return true;
                }
                else {
                    console.warn('Mastery System | DEBUG: Not all elements found for raises input initialization', {
                        raisesInput: raisesInput.length,
                        displayEvade: displayEvade.length,
                        rollButton: rollButton.length
                    });
                }
            }
            else {
                console.warn('Mastery System | DEBUG: Message element not found for initialization', {
                    messageId: message.id,
                    allMessages: $('.message').length
                });
            }
            return false;
        };
        // Initialize raises input handler - use setTimeout to ensure DOM is ready
        setTimeout(() => {
            console.log('Mastery System | DEBUG: Attempting to initialize raises input (setTimeout)');
            if (!initializeRaisesInput()) {
                console.log('Mastery System | DEBUG: Raises input not found, waiting for renderChatMessage hook');
                // If still not found, wait for render hook
                Hooks.once('renderChatMessage', (_messageApp, _html, messageData) => {
                    console.log('Mastery System | DEBUG: renderChatMessage hook fired', {
                        messageId: messageData.message.id,
                        expectedMessageId: message.id,
                        matches: messageData.message.id === message.id
                    });
                    if (messageData.message.id === message.id) {
                        initializeRaisesInput();
                    }
                });
            }
        }, 100);
        console.log('Mastery System | Melee attack card created:', {
            attacker: attacker.name,
            target: target.name,
            attribute: attackAttr.name,
            evade: targetEvade
        });
        // End targeting mode
        endMeleeTargeting(true);
    }
    finally {
        isConfirmingTarget = false;
    }
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