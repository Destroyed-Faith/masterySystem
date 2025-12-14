/**
 * Range Preview and Hex Highlighting for Radial Menu
 */
/**
 * Global state for range preview graphics
 */
let msRangePreviewGfx = null;
let msRadialMenuRangeGfx = null;
/**
 * Convert system units (meters) to pixels
 */
function unitsToPixels(units) {
    // 1 unit = 1 grid square
    // canvas.grid.size = pixels per square
    return units * (canvas.grid?.size || 100);
}
/**
 * Clear the range preview graphics
 */
export function clearRangePreview() {
    if (msRangePreviewGfx && msRangePreviewGfx.parent) {
        msRangePreviewGfx.parent.removeChild(msRangePreviewGfx);
    }
    msRangePreviewGfx = null;
    // Also clear hex highlights
    if (canvas.grid) {
        let highlight = null;
        try {
            if (canvas.interface?.grid?.highlight) {
                highlight = canvas.interface.grid.highlight;
            }
            else if (canvas.grid?.highlight) {
                highlight = canvas.grid.highlight;
            }
            else if (canvas.grid.getHighlightLayer) {
                highlight = canvas.grid.getHighlightLayer('mastery-range-preview');
            }
        }
        catch (error) {
            // Ignore errors
        }
        if (highlight && typeof highlight.clear === 'function') {
            highlight.clear();
        }
    }
}
/**
 * Clear the radial menu range preview (6 fields)
 */
export function clearRadialMenuRange() {
    if (msRadialMenuRangeGfx && msRadialMenuRangeGfx.parent) {
        msRadialMenuRangeGfx.parent.removeChild(msRadialMenuRangeGfx);
    }
    msRadialMenuRangeGfx = null;
    // Also clear hex highlights for radial menu
    if (canvas.grid) {
        let highlight = null;
        try {
            if (canvas.interface?.grid?.highlight) {
                highlight = canvas.interface.grid.highlight;
            }
            else if (canvas.grid?.highlight) {
                highlight = canvas.grid.highlight;
            }
            else if (canvas.grid.getHighlightLayer) {
                highlight = canvas.grid.getHighlightLayer('mastery-radial-menu-range');
            }
        }
        catch (error) {
            // Ignore errors
        }
        if (highlight && typeof highlight.clear === 'function') {
            highlight.clear();
        }
    }
}
/**
 * Show range preview circle around token
 * If a grid is present, also highlights hex fields within range
 */
export function showRangePreview(token, rangeUnits) {
    clearRangePreview();
    if (!rangeUnits || rangeUnits <= 0)
        return;
    const tokenCenter = token.center;
    const radiusPx = unitsToPixels(rangeUnits);
    const gfx = new PIXI.Graphics();
    // Only draw circle if no grid is present, or as a fallback
    // If grid is present, we'll highlight hexes instead
    if (!canvas.grid || canvas.grid.type === CONST.GRID_TYPES.GRIDLESS) {
        // Cyan circle with transparency
        gfx.lineStyle(2, 0x00ffff, 0.8);
        gfx.beginFill(0x00ffff, 0.1);
        gfx.drawCircle(0, 0, radiusPx);
        gfx.endFill();
    }
    msRangePreviewGfx = gfx;
    // Add to effects layer so it appears above tokens
    // Try multiple approaches for Foundry v13 compatibility
    let effectsContainer = null;
    if (canvas.effects) {
        // Try v13 structure first (container property)
        if (canvas.effects.container && typeof canvas.effects.container.addChild === 'function') {
            effectsContainer = canvas.effects.container;
        }
        // Try direct addChild (older versions)
        else if (typeof canvas.effects.addChild === 'function') {
            effectsContainer = canvas.effects;
        }
    }
    // Fallback to foreground if effects doesn't work
    if (!effectsContainer && canvas.foreground) {
        if (canvas.foreground.container && typeof canvas.foreground.container.addChild === 'function') {
            effectsContainer = canvas.foreground.container;
        }
        else if (typeof canvas.foreground.addChild === 'function') {
            effectsContainer = canvas.foreground;
        }
    }
    if (effectsContainer) {
        effectsContainer.addChild(gfx);
        // Position at token center
        gfx.position.set(tokenCenter.x, tokenCenter.y);
        // Ensure graphics are visible
        gfx.visible = true;
        gfx.renderable = true;
        gfx.alpha = 1.0;
        console.log('Mastery System | [DEBUG] showRangePreview: Graphics added', {
            containerName: effectsContainer.constructor.name,
            graphicsPosition: { x: gfx.position.x, y: gfx.position.y },
            graphicsVisible: gfx.visible,
            graphicsRenderable: gfx.renderable,
            graphicsAlpha: gfx.alpha,
            graphicsWorldVisible: gfx.worldVisible,
            graphicsParent: gfx.parent?.constructor?.name,
            containerVisible: effectsContainer.visible,
            containerWorldVisible: effectsContainer.worldVisible,
            rangeUnits
        });
    }
    else {
        console.warn('Mastery System | [DEBUG] Could not find effects layer for range preview', {
            hasEffects: !!canvas.effects,
            hasForeground: !!canvas.foreground,
            hasTokens: !!canvas.tokens
        });
    }
    // If grid is present, highlight hex fields within range
    if (canvas.grid && canvas.grid.type !== CONST.GRID_TYPES.GRIDLESS) {
        highlightRangeHexes(tokenCenter, rangeUnits, 'mastery-range-preview');
    }
}
/**
 * Highlight hex fields within range on the grid
 * @param center - Center point in pixels
 * @param rangeUnits - Range in grid units (1m = 1 hex)
 * @param highlightId - Unique ID for this highlight layer
 * @param color - Optional color override (default: yellow for movement)
 * @param alpha - Optional alpha override (default: 0.5)
 */
function highlightRangeHexes(center, rangeUnits, highlightId, color = 0xffe066, alpha = 0.5) {
    console.log('Mastery System | [DEBUG] highlightRangeHexes: Called', {
        center,
        rangeUnits,
        highlightId,
        color: color.toString(16),
        alpha,
        hasGrid: !!canvas.grid,
        gridType: canvas.grid?.type,
        gridTypeName: canvas.grid?.type === CONST.GRID_TYPES.GRIDLESS ? 'GRIDLESS' :
            canvas.grid?.type === CONST.GRID_TYPES.SQUARE ? 'SQUARE' :
                canvas.grid?.type === CONST.GRID_TYPES.HEXAGONAL ? 'HEXAGONAL' : 'UNKNOWN'
    });
    if (!canvas.grid) {
        console.warn('Mastery System | [DEBUG] highlightRangeHexes: No grid available');
        return;
    }
    // Get highlight layer
    let highlight = null;
    let highlightMethod = 'none';
    try {
        // Use new v13 API: canvas.interface.grid.highlight
        if (canvas.interface?.grid?.highlight) {
            highlight = canvas.interface.grid.highlight;
            highlightMethod = 'canvas.interface.grid.highlight';
            console.log('Mastery System | [DEBUG] highlightRangeHexes: Using canvas.interface.grid.highlight');
        }
        else if (canvas.grid?.highlight) {
            // Fallback to old API for compatibility
            highlight = canvas.grid.highlight;
            highlightMethod = 'canvas.grid.highlight';
            console.log('Mastery System | [DEBUG] highlightRangeHexes: Using canvas.grid.highlight (fallback)');
        }
        else if (canvas.grid.getHighlightLayer) {
            highlight = canvas.grid.getHighlightLayer(highlightId);
            if (!highlight && canvas.grid.addHighlightLayer) {
                highlight = canvas.grid.addHighlightLayer(highlightId);
            }
            highlightMethod = 'getHighlightLayer';
            console.log('Mastery System | [DEBUG] highlightRangeHexes: Using getHighlightLayer');
        }
    }
    catch (error) {
        console.warn('Mastery System | [DEBUG] highlightRangeHexes: Could not get highlight layer', error);
        return;
    }
    console.log('Mastery System | [DEBUG] highlightRangeHexes: Highlight layer check', {
        hasHighlight: !!highlight,
        highlightMethod,
        highlightType: highlight ? highlight.constructor.name : 'null'
    });
    if (!highlight) {
        console.warn('Mastery System | [DEBUG] highlightRangeHexes: No highlight layer available');
        return;
    }
    // Clear previous highlights - try multiple methods
    if (typeof highlight.clear === 'function') {
        try {
            highlight.clear();
            console.log('Mastery System | [DEBUG] highlightRangeHexes: Cleared previous highlights');
        }
        catch (error) {
            console.warn('Mastery System | [DEBUG] highlightRangeHexes: Error clearing highlights', error);
        }
    }
    else if (typeof highlight.clearAll === 'function') {
        try {
            highlight.clearAll();
            console.log('Mastery System | [DEBUG] highlightRangeHexes: Cleared via clearAll');
        }
        catch (error) {
            console.warn('Mastery System | [DEBUG] highlightRangeHexes: Error clearing via clearAll', error);
        }
    }
    else if (highlight.highlights && Array.isArray(highlight.highlights)) {
        highlight.highlights.length = 0;
        console.log('Mastery System | [DEBUG] highlightRangeHexes: Cleared via array clear');
    }
    else if (highlight.removeChildren && typeof highlight.removeChildren === 'function') {
        try {
            highlight.removeChildren();
            console.log('Mastery System | [DEBUG] highlightRangeHexes: Cleared via removeChildren');
        }
        catch (error) {
            console.warn('Mastery System | [DEBUG] highlightRangeHexes: Error clearing via removeChildren', error);
        }
    }
    else {
        console.warn('Mastery System | [DEBUG] highlightRangeHexes: Highlight layer has no clear method - will overwrite');
    }
    // Get grid position of center using new v13 API
    let centerGrid = null;
    let gridPositionMethod = 'none';
    try {
        console.log('Mastery System | [DEBUG] highlightRangeHexes: Attempting to get grid position', {
            center,
            hasGetOffset: !!canvas.grid?.getOffset,
            hasGetGridPositionFromPixels: !!canvas.grid?.getGridPositionFromPixels,
            gridType: canvas.grid?.type,
            gridSize: canvas.grid?.size
        });
        if (canvas.grid?.getOffset) {
            // New v13 API: getOffset returns {col, row}
            const offset = canvas.grid.getOffset(center.x, center.y);
            console.log('Mastery System | [DEBUG] highlightRangeHexes: getOffset raw result', {
                offset,
                offsetType: typeof offset,
                offsetIsNull: offset === null,
                offsetIsUndefined: offset === undefined,
                offsetKeys: offset ? Object.keys(offset) : [],
                offsetCol: offset?.col,
                offsetRow: offset?.row,
                offsetX: offset?.x,
                offsetY: offset?.y,
                offsetQ: offset?.q,
                offsetR: offset?.r,
                offsetStringified: JSON.stringify(offset),
                centerX: center.x,
                centerY: center.y,
                gridType: canvas.grid.type,
                gridSize: canvas.grid.size
            });
            // Try different property names
            if (offset) {
                // Check for col/row (standard)
                if (offset.col !== undefined && offset.row !== undefined) {
                    centerGrid = { col: offset.col, row: offset.row };
                    gridPositionMethod = 'getOffset (col/row)';
                }
                // Check for x/y (alternative)
                else if (offset.x !== undefined && offset.y !== undefined) {
                    centerGrid = { col: offset.x, row: offset.y };
                    gridPositionMethod = 'getOffset (x/y)';
                }
                // Check for q/r (hex offset coordinates)
                else if (offset.q !== undefined && offset.r !== undefined) {
                    // For hex grids, q/r are offset coordinates, we need to convert to col/row
                    // Hex grids use offset coordinates where q is column and r is row
                    centerGrid = { col: offset.q, row: offset.r };
                    gridPositionMethod = 'getOffset (q/r hex)';
                }
                // Try any object with col/row properties
                else if (typeof offset === 'object' && 'col' in offset) {
                    const anyOffset = offset;
                    if (anyOffset.col !== undefined && anyOffset.row !== undefined) {
                        centerGrid = { col: anyOffset.col, row: anyOffset.row };
                        gridPositionMethod = 'getOffset (any col/row)';
                    }
                }
                console.log('Mastery System | [DEBUG] highlightRangeHexes: After parsing offset', {
                    centerGrid,
                    gridPositionMethod,
                    offsetParsed: !!centerGrid
                });
            }
            else {
                console.warn('Mastery System | [DEBUG] highlightRangeHexes: getOffset returned null/undefined', {
                    offset,
                    center
                });
            }
            console.log('Mastery System | [DEBUG] highlightRangeHexes: Parsed grid position via getOffset', {
                centerGrid,
                gridPositionMethod
            });
        }
        // Fallback to old API if getOffset didn't work
        if (!centerGrid && canvas.grid?.getGridPositionFromPixels) {
            console.log('Mastery System | [DEBUG] highlightRangeHexes: Trying getGridPositionFromPixels fallback');
            const oldGrid = canvas.grid.getGridPositionFromPixels(center.x, center.y);
            console.log('Mastery System | [DEBUG] highlightRangeHexes: getGridPositionFromPixels result', {
                oldGrid,
                oldGridType: typeof oldGrid,
                oldGridKeys: oldGrid ? Object.keys(oldGrid) : []
            });
            if (oldGrid) {
                if (oldGrid.x !== undefined && oldGrid.y !== undefined) {
                    centerGrid = { col: oldGrid.x, row: oldGrid.y };
                    gridPositionMethod = 'getGridPositionFromPixels (x/y)';
                }
                else if (oldGrid.col !== undefined && oldGrid.row !== undefined) {
                    centerGrid = { col: oldGrid.col, row: oldGrid.row };
                    gridPositionMethod = 'getGridPositionFromPixels (col/row)';
                }
            }
        }
        // Try alternative methods for hex grids
        if (!centerGrid && canvas.grid) {
            console.log('Mastery System | [DEBUG] highlightRangeHexes: Trying alternative grid position methods');
            // Try pixelsToOffset for hex grids
            if (canvas.grid.pixelsToOffset && typeof canvas.grid.pixelsToOffset === 'function') {
                try {
                    const hexOffset = canvas.grid.pixelsToOffset(center.x, center.y);
                    console.log('Mastery System | [DEBUG] highlightRangeHexes: pixelsToOffset result', hexOffset);
                    if (hexOffset && (hexOffset.col !== undefined || hexOffset.x !== undefined)) {
                        centerGrid = {
                            col: hexOffset.col ?? hexOffset.x ?? 0,
                            row: hexOffset.row ?? hexOffset.y ?? 0
                        };
                        gridPositionMethod = 'pixelsToOffset';
                    }
                }
                catch (error) {
                    console.warn('Mastery System | [DEBUG] highlightRangeHexes: pixelsToOffset failed', error);
                }
            }
        }
    }
    catch (error) {
        console.warn('Mastery System | [DEBUG] highlightRangeHexes: Could not get grid position', error);
        return;
    }
    console.log('Mastery System | [DEBUG] highlightRangeHexes: Grid position result', {
        centerGrid,
        gridPositionMethod,
        hasValidPosition: centerGrid && centerGrid.col !== undefined && centerGrid.row !== undefined
    });
    if (!centerGrid || centerGrid.col === undefined || centerGrid.row === undefined) {
        console.warn('Mastery System | [DEBUG] highlightRangeHexes: No valid grid position, aborting', {
            centerGrid,
            center
        });
        return;
    }
    console.log('Mastery System | [DEBUG] highlightRangeHexes: Starting hex iteration', {
        maxHexDistance: Math.ceil(rangeUnits),
        totalHexesToCheck: (Math.ceil(rangeUnits) * 2 + 1) * (Math.ceil(rangeUnits) * 2 + 1)
    });
    let hexesHighlighted = 0;
    // Calculate max hex distance (round up to include all hexes within range)
    const maxHexDistance = Math.ceil(rangeUnits);
    // Iterate through all hexes within range
    for (let q = -maxHexDistance; q <= maxHexDistance; q++) {
        for (let r = -maxHexDistance; r <= maxHexDistance; r++) {
            const gridCol = centerGrid.col + q;
            const gridRow = centerGrid.row + r;
            // Get hex center position
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
            if (!hexCenter)
                continue;
            // Calculate distance from center to this hex
            const dx = hexCenter.x - center.x;
            const dy = hexCenter.y - center.y;
            const pixelDistance = Math.sqrt(dx * dx + dy * dy);
            const gridDistance = pixelDistance / (canvas.grid.size || 1);
            // Use Foundry's distance measurement if available (for hex grids)
            let distanceInUnits = gridDistance;
            try {
                if (canvas.grid?.measurePath) {
                    // New v13 API: measurePath returns array of distances
                    const waypoints = [
                        { x: center.x, y: center.y },
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
                        { x: center.x, y: center.y },
                        { x: hexCenter.x, y: hexCenter.y }
                    ];
                    const measurement = canvas.grid.measureDistances(waypoints, {});
                    if (measurement && measurement.length > 0) {
                        distanceInUnits = measurement[0];
                    }
                }
            }
            catch (error) {
                // Use fallback distance
            }
            // If hex is within range, highlight it
            if (distanceInUnits <= rangeUnits) {
                // Use provided color and alpha (defaults to yellow for movement preview)
                const highlightColor = color;
                const highlightAlpha = alpha;
                let highlighted = false;
                try {
                    console.log('Mastery System | [DEBUG] highlightRangeHexes: Attempting to highlight hex', {
                        gridCol,
                        gridRow,
                        distanceInUnits,
                        rangeUnits,
                        color: highlightColor.toString(16),
                        alpha: highlightAlpha,
                        highlightMethods: highlight ? Object.getOwnPropertyNames(Object.getPrototypeOf(highlight)).filter(m => typeof highlight[m] === 'function') : []
                    });
                    // Method 1: Foundry v13 API: highlight.highlightPosition(col, row, options)
                    if (highlight && typeof highlight.highlightPosition === 'function') {
                        highlight.highlightPosition(gridCol, gridRow, { color: highlightColor, alpha: highlightAlpha });
                        highlighted = true;
                        console.log('Mastery System | [DEBUG] highlightRangeHexes: Highlighted via highlightPosition', { gridCol, gridRow });
                    }
                    // Method 2: Alternative API: highlight.highlightGridPosition
                    else if (highlight && typeof highlight.highlightGridPosition === 'function') {
                        highlight.highlightGridPosition(gridCol, gridRow, { color: highlightColor, alpha: highlightAlpha });
                        highlighted = true;
                    }
                    // Method 3: Fallback: highlight.highlight
                    else if (highlight && typeof highlight.highlight === 'function') {
                        highlight.highlight(gridCol, gridRow, { color: highlightColor, alpha: highlightAlpha });
                        highlighted = true;
                    }
                    // Method 4: Direct grid highlight (v13)
                    else if (canvas.grid && typeof canvas.grid.highlightPosition === 'function') {
                        canvas.grid.highlightPosition(gridCol, gridRow, { color: highlightColor, alpha: highlightAlpha });
                        highlighted = true;
                    }
                    // Method 5: Try to add highlight directly with add method
                    else if (highlight && typeof highlight.add === 'function') {
                        highlight.add({ col: gridCol, row: gridRow, color: highlightColor, alpha: highlightAlpha });
                        highlighted = true;
                    }
                    // Method 6: Try to set highlights array directly
                    else if (highlight && Array.isArray(highlight.highlights)) {
                        highlight.highlights.push({ col: gridCol, row: gridRow, color: highlightColor, alpha: highlightAlpha });
                        highlighted = true;
                    }
                    // Method 7: Try to use set method
                    else if (highlight && typeof highlight.set === 'function') {
                        highlight.set(gridCol, gridRow, { color: highlightColor, alpha: highlightAlpha });
                        highlighted = true;
                    }
                    // Method 8: Try to use drawHighlight method
                    else if (highlight && typeof highlight.drawHighlight === 'function') {
                        highlight.drawHighlight(gridCol, gridRow, highlightColor, highlightAlpha);
                        highlighted = true;
                    }
                    if (highlighted) {
                        hexesHighlighted++;
                    }
                    else {
                        console.warn('Mastery System | [DEBUG] highlightRangeHexes: No highlight method worked for hex', {
                            gridCol,
                            gridRow,
                            highlightAvailable: !!highlight,
                            highlightType: highlight?.constructor?.name,
                            hasHighlightPosition: typeof highlight?.highlightPosition === 'function',
                            hasHighlightGridPosition: typeof highlight?.highlightGridPosition === 'function',
                            hasHighlight: typeof highlight?.highlight === 'function'
                        });
                    }
                }
                catch (error) {
                    // Log errors for debugging
                    console.warn('Mastery System | [DEBUG] highlightRangeHexes: Error highlighting hex at', gridCol, gridRow, error);
                }
            }
        }
    }
    console.log('Mastery System | [DEBUG] highlightRangeHexes: Complete', {
        hexesHighlighted,
        rangeUnits,
        totalHexesChecked: (maxHexDistance * 2 + 1) * (maxHexDistance * 2 + 1),
        highlightMethod,
        highlightType: highlight ? highlight.constructor.name : 'null',
        centerGrid,
        gridPositionMethod,
        highlightAvailable: !!highlight,
        highlightMethods: highlight ? Object.getOwnPropertyNames(Object.getPrototypeOf(highlight)).filter(m => typeof highlight[m] === 'function').slice(0, 10) : []
    });
    if (hexesHighlighted === 0) {
        console.warn('Mastery System | [DEBUG] highlightRangeHexes: WARNING - No hexes were highlighted!', {
            centerGrid,
            rangeUnits,
            maxHexDistance,
            highlightAvailable: !!highlight,
            highlightType: highlight?.constructor?.name
        });
    }
}
/**
 * Show a fixed 6-field radius around the token when radial menu opens
 * Uses a fixed color (cyan/blue) to distinguish from movement preview
 * @param token - The token to show the range around
 */
export function showRadialMenuRange(token) {
    console.log('Mastery System | [DEBUG] showRadialMenuRange: Called', {
        hasToken: !!token,
        tokenId: token?.id,
        tokenName: token?.name,
        hasCanvas: !!canvas,
        hasGrid: !!canvas.grid,
        gridType: canvas.grid?.type,
        gridTypeName: canvas.grid?.type === CONST.GRID_TYPES.GRIDLESS ? 'GRIDLESS' :
            canvas.grid?.type === CONST.GRID_TYPES.SQUARE ? 'SQUARE' :
                canvas.grid?.type === CONST.GRID_TYPES.HEXAGONAL ? 'HEXAGONAL' : 'UNKNOWN'
    });
    clearRadialMenuRange();
    const RANGE_UNITS = 6; // Fixed 6 fields
    const FIXED_COLOR = 0x00aaff; // Cyan/blue color (different from movement yellow)
    const FIXED_ALPHA = 0.4;
    if (!token) {
        console.warn('Mastery System | [DEBUG] showRadialMenuRange: No token provided');
        return;
    }
    const tokenCenter = token.center;
    console.log('Mastery System | [DEBUG] showRadialMenuRange: Token center', {
        x: tokenCenter?.x,
        y: tokenCenter?.y,
        hasCenter: !!tokenCenter
    });
    // Check if grid is actually enabled (not gridless)
    const isGridless = !canvas.grid || canvas.grid.type === CONST.GRID_TYPES.GRIDLESS;
    console.log('Mastery System | [DEBUG] showRadialMenuRange: Grid check', {
        hasGrid: !!canvas.grid,
        gridType: canvas.grid?.type,
        gridTypeName: canvas.grid?.type === CONST.GRID_TYPES.GRIDLESS ? 'GRIDLESS' :
            canvas.grid?.type === CONST.GRID_TYPES.SQUARE ? 'SQUARE' :
                canvas.grid?.type === CONST.GRID_TYPES.HEXAGONAL ? 'HEXAGONAL' :
                    `UNKNOWN (${canvas.grid?.type})`,
        isGridless,
        CONST_GRID_TYPES_GRIDLESS: CONST.GRID_TYPES.GRIDLESS,
        CONST_GRID_TYPES_SQUARE: CONST.GRID_TYPES.SQUARE,
        CONST_GRID_TYPES_HEXAGONAL: CONST.GRID_TYPES.HEXAGONAL
    });
    // If grid is enabled, highlight grid fields
    if (!isGridless) {
        console.log('Mastery System | [DEBUG] showRadialMenuRange: Grid enabled, highlighting fields', {
            gridType: canvas.grid.type,
            rangeUnits: RANGE_UNITS,
            color: FIXED_COLOR.toString(16),
            alpha: FIXED_ALPHA
        });
        highlightRangeHexes(tokenCenter, RANGE_UNITS, 'mastery-radial-menu-range', FIXED_COLOR, FIXED_ALPHA);
    }
    else {
        console.log('Mastery System | [DEBUG] showRadialMenuRange: No grid or gridless, drawing circle', {
            hasGrid: !!canvas.grid,
            gridType: canvas.grid?.type,
            isGridless
        });
        // If no grid, draw a circle
        const radiusPx = unitsToPixels(RANGE_UNITS);
        const gfx = new PIXI.Graphics();
        gfx.lineStyle(3, FIXED_COLOR, 0.8);
        gfx.beginFill(FIXED_COLOR, 0.15);
        gfx.drawCircle(0, 0, radiusPx);
        gfx.endFill();
        msRadialMenuRangeGfx = gfx;
        // Add to effects layer
        let effectsContainer = null;
        if (canvas.effects) {
            if (canvas.effects.container && typeof canvas.effects.container.addChild === 'function') {
                effectsContainer = canvas.effects.container;
            }
            else if (typeof canvas.effects.addChild === 'function') {
                effectsContainer = canvas.effects;
            }
        }
        if (!effectsContainer && canvas.foreground) {
            if (canvas.foreground.container && typeof canvas.foreground.container.addChild === 'function') {
                effectsContainer = canvas.foreground.container;
            }
            else if (typeof canvas.foreground.addChild === 'function') {
                effectsContainer = canvas.foreground;
            }
        }
        if (effectsContainer) {
            effectsContainer.addChild(gfx);
            gfx.position.set(tokenCenter.x, tokenCenter.y);
            gfx.visible = true;
            gfx.renderable = true;
            gfx.alpha = 1.0;
            console.log('Mastery System | [DEBUG] showRadialMenuRange: Circle graphics added', {
                containerName: effectsContainer.constructor.name,
                graphicsPosition: { x: gfx.position.x, y: gfx.position.y },
                graphicsVisible: gfx.visible,
                graphicsRenderable: gfx.renderable,
                graphicsAlpha: gfx.alpha,
                graphicsWorldVisible: gfx.worldVisible,
                graphicsParent: gfx.parent?.constructor?.name,
                containerVisible: effectsContainer.visible,
                containerWorldVisible: effectsContainer.worldVisible,
                radiusPx
            });
        }
        else {
            console.warn('Mastery System | [DEBUG] showRadialMenuRange: Could not find effects layer for circle', {
                hasEffects: !!canvas.effects,
                hasForeground: !!canvas.foreground,
                hasTokens: !!canvas.tokens
            });
        }
    }
    console.log('Mastery System | [DEBUG] showRadialMenuRange: Complete', {
        rangeUnits: RANGE_UNITS,
        color: FIXED_COLOR.toString(16),
        hasGrid: !!(canvas.grid && canvas.grid.type !== CONST.GRID_TYPES.GRIDLESS),
        hasGraphics: !!msRadialMenuRangeGfx
    });
}
//# sourceMappingURL=range-preview.js.map