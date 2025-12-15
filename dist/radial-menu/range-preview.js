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
    // For hexagonal grids, we need to preserve {i, j} format
    let centerGrid = null;
    let gridPositionMethod = 'none';
    const isHexGrid = canvas.grid?.type === 2;
    try {
        console.log('Mastery System | [DEBUG] highlightRangeHexes: Attempting to get grid position', {
            center,
            hasGetOffset: !!canvas.grid?.getOffset,
            gridType: canvas.grid?.type,
            gridSize: canvas.grid?.size,
            isHexGrid
        });
        if (canvas.grid?.getOffset) {
            // New v13 API: getOffset returns {col, row} or {i, j} for hex grids
            const offset = canvas.grid.getOffset(center.x, center.y);
            // Log detailed offset information
            console.log('Mastery System | [DEBUG] highlightRangeHexes: getOffset raw result');
            console.log('  offset:', offset);
            console.log('  offsetType:', typeof offset);
            console.log('  offsetIsNull:', offset === null);
            console.log('  offsetIsUndefined:', offset === undefined);
            console.log('  offsetKeys:', offset ? Object.keys(offset) : []);
            console.log('  offsetCol:', offset?.col);
            console.log('  offsetRow:', offset?.row);
            console.log('  offsetX:', offset?.x);
            console.log('  offsetY:', offset?.y);
            console.log('  offsetQ:', offset?.q);
            console.log('  offsetR:', offset?.r);
            console.log('  offsetI:', offset?.i);
            console.log('  offsetJ:', offset?.j);
            console.log('  offsetStringified:', JSON.stringify(offset));
            console.log('  centerX:', center.x);
            console.log('  centerY:', center.y);
            console.log('  gridType:', canvas.grid.type);
            console.log('  gridSize:', canvas.grid.size);
            // Try different property names
            if (offset) {
                // Debug: Check what properties are actually available
                const hasCol = 'col' in offset && offset.col !== undefined;
                const hasRow = 'row' in offset && offset.row !== undefined;
                const hasI = 'i' in offset && offset.i !== undefined;
                const hasJ = 'j' in offset && offset.j !== undefined;
                const hasX = 'x' in offset && offset.x !== undefined;
                const hasY = 'y' in offset && offset.y !== undefined;
                const hasQ = 'q' in offset && offset.q !== undefined;
                const hasR = 'r' in offset && offset.r !== undefined;
                console.log('Mastery System | [DEBUG] highlightRangeHexes: Property checks', {
                    hasCol, hasRow, hasI, hasJ, hasX, hasY, hasQ, hasR,
                    iValue: offset.i,
                    jValue: offset.j,
                    iType: typeof offset.i,
                    jType: typeof offset.j
                });
                // Check for col/row (standard)
                if (hasCol && hasRow) {
                    centerGrid = { col: offset.col, row: offset.row };
                    gridPositionMethod = 'getOffset (col/row)';
                }
                // Check for i/j (hexagonal grid format in v13)
                else if (hasI && hasJ) {
                    // For hex grids, preserve both col/row (for iteration) and i/j (for getCenterPoint)
                    centerGrid = { col: offset.i, row: offset.j, i: offset.i, j: offset.j };
                    gridPositionMethod = 'getOffset (i/j hex)';
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
                console.log('Mastery System | [DEBUG] highlightRangeHexes: After parsing offset');
                console.log('  centerGrid:', centerGrid);
                console.log('  gridPositionMethod:', gridPositionMethod);
                console.log('  offsetParsed:', !!centerGrid);
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
    }
    catch (error) {
        console.warn('Mastery System | [DEBUG] highlightRangeHexes: Could not get grid position', error);
        return;
    }
    console.log('Mastery System | [DEBUG] highlightRangeHexes: Grid position result');
    console.log('  centerGrid:', centerGrid);
    console.log('  gridPositionMethod:', gridPositionMethod);
    console.log('  hasValidPosition:', centerGrid && centerGrid.col !== undefined && centerGrid.row !== undefined);
    console.log('  centerGrid?.col:', centerGrid?.col);
    console.log('  centerGrid?.row:', centerGrid?.row);
    console.log('  centerGrid?.i:', centerGrid?.i);
    console.log('  centerGrid?.j:', centerGrid?.j);
    if (!centerGrid || centerGrid.col === undefined || centerGrid.row === undefined) {
        console.warn('Mastery System | [DEBUG] highlightRangeHexes: No valid grid position, aborting');
        console.warn('  centerGrid:', centerGrid);
        console.warn('  center:', center);
        console.warn('  centerGrid?.col:', centerGrid?.col);
        console.warn('  centerGrid?.row:', centerGrid?.row);
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
    let hexesChecked = 0;
    let hexesWithPosition = 0;
    let hexesInRange = 0;
    for (let q = -maxHexDistance; q <= maxHexDistance; q++) {
        for (let r = -maxHexDistance; r <= maxHexDistance; r++) {
            const gridCol = centerGrid.col + q;
            const gridRow = centerGrid.row + r;
            hexesChecked++;
            // Get hex center position
            // For hexagonal grids, getCenterPoint doesn't work correctly, so we use getTopLeftPoint and calculate center
            let hexCenter = null;
            let positionMethod = 'none';
            try {
                // For hexagonal grids, use getTopLeftPoint and calculate center (getCenterPoint returns wrong values)
                if (isHexGrid && canvas.grid?.getTopLeftPoint) {
                    // For hex grids, try both i/j and col/row to see which works
                    let topLeft = null;
                    let topLeftWithColRow = null;
                    let topLeftWithIJ = null;
                    // Always try col/row first (this is what getTopLeftPoint expects for hex grids)
                    try {
                        topLeftWithColRow = canvas.grid.getTopLeftPoint(gridCol, gridRow);
                        topLeft = topLeftWithColRow;
                        positionMethod = 'getTopLeftPoint(col,row) (calculated center)';
                    }
                    catch (e) {
                        // If col/row fails, try i/j
                        if (centerGrid.i !== undefined && centerGrid.j !== undefined) {
                            const hexI = centerGrid.i + q;
                            const hexJ = centerGrid.j + r;
                            try {
                                topLeftWithIJ = canvas.grid.getTopLeftPoint(hexI, hexJ);
                                topLeft = topLeftWithIJ;
                                positionMethod = 'getTopLeftPoint(i,j) (calculated center)';
                            }
                            catch (e2) {
                                // Both failed
                            }
                        }
                    }
                    // Also try i/j if we haven't already, for comparison
                    if (centerGrid.i !== undefined && centerGrid.j !== undefined && !topLeftWithIJ) {
                        const hexI = centerGrid.i + q;
                        const hexJ = centerGrid.j + r;
                        try {
                            topLeftWithIJ = canvas.grid.getTopLeftPoint(hexI, hexJ);
                        }
                        catch (e) {
                            // Ignore
                        }
                    }
                    if (topLeft) {
                        // For hex grids, calculate center from top-left
                        // Hex center is at: x = topLeft.x + size/2, y = topLeft.y + size * sqrt(3) / 4
                        const gridSize = canvas.grid.size || 100;
                        const hexCenterX = topLeft.x + gridSize / 2;
                        const hexCenterY = topLeft.y + gridSize * Math.sqrt(3) / 4;
                        hexCenter = { x: hexCenterX, y: hexCenterY };
                        // Log first few for debugging
                        if (hexesWithPosition < 3) {
                            const hexI = centerGrid.i !== undefined ? centerGrid.i + q : undefined;
                            const hexJ = centerGrid.j !== undefined ? centerGrid.j + r : undefined;
                            console.log('Mastery System | [DEBUG] highlightRangeHexes: Calculated hex center from topLeft', {
                                gridCol,
                                gridRow,
                                hexI,
                                hexJ,
                                topLeft,
                                topLeftX: topLeft.x,
                                topLeftY: topLeft.y,
                                topLeftWithIJ: topLeftWithIJ ? { x: topLeftWithIJ.x, y: topLeftWithIJ.y } : null,
                                topLeftWithColRow: topLeftWithColRow ? { x: topLeftWithColRow.x, y: topLeftWithColRow.y } : null,
                                hexCenter,
                                hexCenterX,
                                hexCenterY,
                                gridSize,
                                gridType: canvas.grid.type,
                                positionMethod,
                                calculation: `x = ${topLeft.x} + ${gridSize}/2 = ${hexCenterX}, y = ${topLeft.y} + ${gridSize} * sqrt(3)/4 = ${hexCenterY}`
                            });
                        }
                    }
                }
                // Try getCenterPoint for non-hex grids
                else if (canvas.grid?.getCenterPoint && typeof canvas.grid.getCenterPoint === 'function') {
                    // Use col/row for non-hex grids
                    hexCenter = canvas.grid.getCenterPoint(gridCol, gridRow);
                    positionMethod = 'getCenterPoint(col,row)';
                    if (hexesWithPosition < 3) {
                        console.log('Mastery System | [DEBUG] highlightRangeHexes: Using getCenterPoint', {
                            gridCol,
                            gridRow,
                            hexCenter,
                            hexCenterX: hexCenter?.x,
                            hexCenterY: hexCenter?.y,
                            centerX: center.x,
                            centerY: center.y,
                            positionMethod
                        });
                    }
                }
                // Try getTopLeftPoint (for square grids, or if getCenterPoint doesn't exist)
                else if (canvas.grid?.getTopLeftPoint) {
                    const topLeft = canvas.grid.getTopLeftPoint(gridCol, gridRow);
                    if (topLeft) {
                        // For hexagonal grids, getTopLeftPoint returns top-left corner, not center
                        // We need to calculate the center point
                        if (canvas.grid.type === 2) { // Hexagonal grid
                            // For hex grids, calculate center from top-left
                            // Hex center is at: x = topLeft.x + size/2, y = topLeft.y + size * sqrt(3) / 4
                            const gridSize = canvas.grid.size || 100;
                            const hexCenterX = topLeft.x + gridSize / 2;
                            const hexCenterY = topLeft.y + gridSize * Math.sqrt(3) / 4;
                            hexCenter = { x: hexCenterX, y: hexCenterY };
                            positionMethod = 'getTopLeftPoint (calculated center)';
                            // Log first few for debugging
                            if (hexesWithPosition < 3) {
                                console.log('Mastery System | [DEBUG] highlightRangeHexes: Calculated hex center from topLeft', {
                                    gridCol,
                                    gridRow,
                                    topLeft,
                                    hexCenter,
                                    gridSize,
                                    gridType: canvas.grid.type,
                                    calculation: `x = ${topLeft.x} + ${gridSize}/2 = ${hexCenterX}, y = ${topLeft.y} + ${gridSize} * sqrt(3)/4 = ${hexCenterY}`
                                });
                            }
                        }
                        else {
                            // For square grids, topLeft is the center
                            hexCenter = topLeft;
                            positionMethod = 'getTopLeftPoint (square grid)';
                        }
                    }
                }
                else if (canvas.grid?.getPixelsFromGridPosition) {
                    // Fallback to old API
                    hexCenter = canvas.grid.getPixelsFromGridPosition(gridCol, gridRow);
                    positionMethod = 'getPixelsFromGridPosition';
                }
            }
            catch (error) {
                // Log first few errors for debugging
                if (hexesChecked <= 3) {
                    console.warn('Mastery System | [DEBUG] highlightRangeHexes: Error getting hex position', {
                        gridCol,
                        gridRow,
                        error,
                        hasGetTopLeftPoint: !!canvas.grid?.getTopLeftPoint,
                        hasGetCenterPoint: !!canvas.grid?.getCenterPoint,
                        hasGetPixelsFromGridPosition: !!canvas.grid?.getPixelsFromGridPosition
                    });
                }
                continue;
            }
            if (!hexCenter) {
                // Log first few missing positions
                if (hexesChecked <= 3) {
                    console.warn('Mastery System | [DEBUG] highlightRangeHexes: No hex center position', {
                        gridCol,
                        gridRow,
                        hasGetTopLeftPoint: !!canvas.grid?.getTopLeftPoint,
                        hasGetCenterPoint: !!canvas.grid?.getCenterPoint,
                        hasGetPixelsFromGridPosition: !!canvas.grid?.getPixelsFromGridPosition
                    });
                }
                continue;
            }
            hexesWithPosition++;
            // Log first few positions for debugging
            if (hexesWithPosition <= 3) {
                console.log('Mastery System | [DEBUG] highlightRangeHexes: Got hex position', {
                    gridCol,
                    gridRow,
                    hexCenter,
                    center,
                    positionMethod,
                    distance: Math.sqrt(Math.pow(hexCenter.x - center.x, 2) + Math.pow(hexCenter.y - center.y, 2))
                });
            }
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
            // Log distance calculation for first few hexes
            if (hexesWithPosition <= 3) {
                console.log('Mastery System | [DEBUG] highlightRangeHexes: Distance calculation', {
                    gridCol,
                    gridRow,
                    hexCenterX: hexCenter.x,
                    hexCenterY: hexCenter.y,
                    centerX: center.x,
                    centerY: center.y,
                    dx,
                    dy,
                    pixelDistance,
                    gridDistance,
                    distanceInUnits,
                    rangeUnits,
                    withinRange: distanceInUnits <= rangeUnits,
                    gridSize: canvas.grid?.size,
                    hasMeasurePath: !!canvas.grid?.measurePath,
                    hasMeasureDistances: !!canvas.grid?.measureDistances
                });
            }
            // If hex is within range, highlight it
            if (distanceInUnits <= rangeUnits) {
                hexesInRange++;
                // Use provided color and alpha (defaults to yellow for movement preview)
                const highlightColor = color;
                const highlightAlpha = alpha;
                let highlighted = false;
                try {
                    // Only log first few attempts to avoid spam
                    if (hexesInRange <= 3) {
                        console.log('Mastery System | [DEBUG] highlightRangeHexes: Attempting to highlight hex', {
                            gridCol,
                            gridRow,
                            distanceInUnits,
                            rangeUnits,
                            color: highlightColor.toString(16),
                            alpha: highlightAlpha,
                            highlightMethods: highlight ? Object.getOwnPropertyNames(Object.getPrototypeOf(highlight)).filter(m => typeof highlight[m] === 'function') : []
                        });
                    }
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
                        // Only log first few failures to avoid spam
                        if (hexesInRange <= 3) {
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
        hexesChecked,
        hexesWithPosition,
        hexesInRange,
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
    console.log('Mastery System | [DEBUG] showRadialMenuRange: Grid check');
    console.log('  hasGrid:', !!canvas.grid);
    console.log('  gridType:', canvas.grid?.type);
    const gridTypeName = canvas.grid?.type === CONST.GRID_TYPES.GRIDLESS ? 'GRIDLESS' :
        canvas.grid?.type === CONST.GRID_TYPES.SQUARE ? 'SQUARE' :
            canvas.grid?.type === CONST.GRID_TYPES.HEXAGONAL ? 'HEXAGONAL' :
                `UNKNOWN (${canvas.grid?.type})`;
    console.log('  gridTypeName:', gridTypeName);
    console.log('  isGridless:', isGridless);
    console.log('  CONST_GRID_TYPES_GRIDLESS:', CONST.GRID_TYPES.GRIDLESS);
    console.log('  CONST_GRID_TYPES_SQUARE:', CONST.GRID_TYPES.SQUARE);
    console.log('  CONST_GRID_TYPES_HEXAGONAL:', CONST.GRID_TYPES.HEXAGONAL);
    console.log('  gridType === GRIDLESS:', canvas.grid?.type === CONST.GRID_TYPES.GRIDLESS);
    console.log('  !canvas.grid:', !canvas.grid);
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