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
                // For hexagonal grids, calculate pixel coordinates directly from offset coordinates
                // getTopLeftPoint returns wrong values for all hexes, so we calculate manually
                if (isHexGrid) {
                    const gridSize = canvas.grid.size || 100;
                    const sqrt3 = Math.sqrt(3);
                    // For pointy-top hexes (Foundry default for type 2), calculate pixel coordinates from offset coordinates
                    // Offset coordinates: i = column, j = row
                    if (centerGrid.i !== undefined && centerGrid.j !== undefined) {
                        const hexI = centerGrid.i + q;
                        const hexJ = centerGrid.j + r;
                        // Calculate pixel coordinates for pointy-top hexes (relative to grid origin)
                        // x = size * (sqrt(3) * i + sqrt(3)/2 * j)
                        // y = size * (3/2 * j)
                        const pixelXRelative = gridSize * (sqrt3 * hexI + sqrt3 / 2 * hexJ);
                        const pixelYRelative = gridSize * (3 / 2 * hexJ);
                        // Calculate pixel coordinates for center hex (0,0) to get offset
                        const centerPixelXRelative = gridSize * (sqrt3 * centerGrid.i + sqrt3 / 2 * centerGrid.j);
                        const centerPixelYRelative = gridSize * (3 / 2 * centerGrid.j);
                        // Convert to scene coordinates by adding the center token position offset
                        // The center token is at (center.x, center.y) in scene coordinates
                        // So we need to add the difference between the hex position and center hex position
                        const pixelX = center.x + (pixelXRelative - centerPixelXRelative);
                        const pixelY = center.y + (pixelYRelative - centerPixelYRelative);
                        // Hex center is at the calculated pixel coordinates
                        hexCenter = { x: pixelX, y: pixelY };
                        positionMethod = 'calculated from offset coordinates (i,j)';
                        // Log first few for debugging
                        if (hexesWithPosition < 3) {
                            console.log('Mastery System | [DEBUG] highlightRangeHexes: Calculated hex center from offset coordinates');
                            console.log('  gridCol:', gridCol, 'gridRow:', gridRow);
                            console.log('  hexI:', hexI, 'hexJ:', hexJ);
                            console.log('  pixelXRelative:', pixelXRelative, 'pixelYRelative:', pixelYRelative);
                            console.log('  centerPixelXRelative:', centerPixelXRelative, 'centerPixelYRelative:', centerPixelYRelative);
                            console.log('  pixelX:', pixelX, 'pixelY:', pixelY);
                            console.log('  hexCenterX:', hexCenter.x, 'hexCenterY:', hexCenter.y);
                            console.log('  gridSize:', gridSize, 'gridType:', canvas.grid.type);
                            console.log('  positionMethod:', positionMethod);
                            console.log('  centerX:', center.x, 'centerY:', center.y);
                            console.log('  calculation: x =', center.x, '+ (', pixelXRelative, '-', centerPixelXRelative, ') =', pixelX);
                            console.log('  calculation: y =', center.y, '+ (', pixelYRelative, '-', centerPixelYRelative, ') =', pixelY);
                        }
                    }
                    else {
                        // Fallback: try getTopLeftPoint if i/j not available
                        if (canvas.grid?.getTopLeftPoint) {
                            try {
                                const topLeft = canvas.grid.getTopLeftPoint(gridCol, gridRow);
                                if (topLeft) {
                                    const hexCenterX = topLeft.x + gridSize / 2;
                                    const hexCenterY = topLeft.y + gridSize * sqrt3 / 4;
                                    hexCenter = { x: hexCenterX, y: hexCenterY };
                                    positionMethod = 'getTopLeftPoint(col,row) fallback (calculated center)';
                                }
                            }
                            catch (e) {
                                // Failed
                            }
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
                console.log('Mastery System | [DEBUG] highlightRangeHexes: Distance calculation');
                console.log('  gridCol:', gridCol, 'gridRow:', gridRow);
                console.log('  hexCenterX:', hexCenter.x, 'hexCenterY:', hexCenter.y);
                console.log('  centerX:', center.x, 'centerY:', center.y);
                console.log('  dx:', dx, 'dy:', dy);
                console.log('  pixelDistance:', pixelDistance);
                console.log('  gridDistance:', gridDistance);
                console.log('  distanceInUnits:', distanceInUnits);
                console.log('  rangeUnits:', rangeUnits);
                console.log('  withinRange:', distanceInUnits <= rangeUnits);
                console.log('  gridSize:', canvas.grid?.size);
                console.log('  hasMeasurePath:', !!canvas.grid?.measurePath);
                console.log('  hasMeasureDistances:', !!canvas.grid?.measureDistances);
            }
            // If hex is within range, highlight it
            if (distanceInUnits <= rangeUnits) {
                hexesInRange++;
                // Use provided color and alpha (defaults to yellow for movement preview)
                const highlightColor = color;
                const highlightAlpha = alpha;
                let highlighted = false;
                let usedMethod = 'none';
                try {
                    // For hex grids, try with i/j coordinates if available
                    const hexI = centerGrid.i !== undefined ? centerGrid.i + q : gridCol;
                    const hexJ = centerGrid.j !== undefined ? centerGrid.j + r : gridRow;
                    // Only log first few attempts to avoid spam
                    if (hexesInRange <= 3) {
                        console.log('Mastery System | [DEBUG] highlightRangeHexes: Attempting to highlight hex', {
                            gridCol,
                            gridRow,
                            hexI,
                            hexJ,
                            distanceInUnits,
                            rangeUnits,
                            color: highlightColor.toString(16),
                            alpha: highlightAlpha,
                            highlightMethods: highlight ? Object.getOwnPropertyNames(Object.getPrototypeOf(highlight)).filter(m => typeof highlight[m] === 'function') : []
                        });
                    }
                    // Method 1: Foundry v13 API: highlight.highlightPosition(col, row, options)
                    // For hex grids, try with i/j first, then fallback to col/row
                    if (highlight && typeof highlight.highlightPosition === 'function') {
                        try {
                            if (isHexGrid && centerGrid.i !== undefined && centerGrid.j !== undefined) {
                                highlight.highlightPosition(hexI, hexJ, { color: highlightColor, alpha: highlightAlpha });
                                usedMethod = 'highlightPosition(i,j)';
                            }
                            else {
                                highlight.highlightPosition(gridCol, gridRow, { color: highlightColor, alpha: highlightAlpha });
                                usedMethod = 'highlightPosition(col,row)';
                            }
                            highlighted = true;
                            if (hexesInRange <= 3) {
                                console.log('Mastery System | [DEBUG] highlightRangeHexes: Highlighted via highlightPosition', { gridCol, gridRow, hexI, hexJ, usedMethod });
                            }
                        }
                        catch (e) {
                            // Try fallback with col/row if i/j fails
                            try {
                                highlight.highlightPosition(gridCol, gridRow, { color: highlightColor, alpha: highlightAlpha });
                                usedMethod = 'highlightPosition(col,row fallback)';
                                highlighted = true;
                            }
                            catch (e2) {
                                if (hexesInRange <= 3) {
                                    console.warn('Mastery System | [DEBUG] highlightRangeHexes: highlightPosition failed', { gridCol, gridRow, hexI, hexJ, error: e2 });
                                }
                            }
                        }
                    }
                    // Method 2: Alternative API: highlight.highlightGridPosition
                    else if (highlight && typeof highlight.highlightGridPosition === 'function') {
                        try {
                            if (isHexGrid && centerGrid.i !== undefined && centerGrid.j !== undefined) {
                                highlight.highlightGridPosition(hexI, hexJ, { color: highlightColor, alpha: highlightAlpha });
                                usedMethod = 'highlightGridPosition(i,j)';
                            }
                            else {
                                highlight.highlightGridPosition(gridCol, gridRow, { color: highlightColor, alpha: highlightAlpha });
                                usedMethod = 'highlightGridPosition(col,row)';
                            }
                            highlighted = true;
                        }
                        catch (e) {
                            if (hexesInRange <= 3) {
                                console.warn('Mastery System | [DEBUG] highlightRangeHexes: highlightGridPosition failed', { gridCol, gridRow, hexI, hexJ, error: e });
                            }
                        }
                    }
                    // Method 3: Fallback: highlight.highlight
                    else if (highlight && typeof highlight.highlight === 'function') {
                        try {
                            if (isHexGrid && centerGrid.i !== undefined && centerGrid.j !== undefined) {
                                highlight.highlight(hexI, hexJ, { color: highlightColor, alpha: highlightAlpha });
                                usedMethod = 'highlight(i,j)';
                            }
                            else {
                                highlight.highlight(gridCol, gridRow, { color: highlightColor, alpha: highlightAlpha });
                                usedMethod = 'highlight(col,row)';
                            }
                            highlighted = true;
                        }
                        catch (e) {
                            if (hexesInRange <= 3) {
                                console.warn('Mastery System | [DEBUG] highlightRangeHexes: highlight failed', { gridCol, gridRow, hexI, hexJ, error: e });
                            }
                        }
                    }
                    // Method 4: Direct grid highlight (v13) - use canvas.interface.grid.highlightPosition instead of deprecated canvas.grid.highlightPosition
                    else if (canvas.interface?.grid && typeof canvas.interface.grid.highlightPosition === 'function') {
                        try {
                            if (isHexGrid && centerGrid.i !== undefined && centerGrid.j !== undefined) {
                                canvas.interface.grid.highlightPosition(hexI, hexJ, { color: highlightColor, alpha: highlightAlpha });
                                usedMethod = 'canvas.interface.grid.highlightPosition(i,j)';
                            }
                            else {
                                canvas.interface.grid.highlightPosition(gridCol, gridRow, { color: highlightColor, alpha: highlightAlpha });
                                usedMethod = 'canvas.interface.grid.highlightPosition(col,row)';
                            }
                            highlighted = true;
                        }
                        catch (e) {
                            if (hexesInRange <= 3) {
                                console.warn('Mastery System | [DEBUG] highlightRangeHexes: canvas.interface.grid.highlightPosition failed', { gridCol, gridRow, hexI, hexJ, error: e });
                            }
                        }
                    }
                    // Method 5: Try to add highlight directly with add method
                    else if (highlight && typeof highlight.add === 'function') {
                        try {
                            if (isHexGrid && centerGrid.i !== undefined && centerGrid.j !== undefined) {
                                highlight.add({ i: hexI, j: hexJ, col: gridCol, row: gridRow, color: highlightColor, alpha: highlightAlpha });
                                usedMethod = 'add(i,j)';
                            }
                            else {
                                highlight.add({ col: gridCol, row: gridRow, color: highlightColor, alpha: highlightAlpha });
                                usedMethod = 'add(col,row)';
                            }
                            highlighted = true;
                        }
                        catch (e) {
                            if (hexesInRange <= 3) {
                                console.warn('Mastery System | [DEBUG] highlightRangeHexes: add failed', { gridCol, gridRow, hexI, hexJ, error: e });
                            }
                        }
                    }
                    // Method 6: Try to set highlights array directly
                    else if (highlight && Array.isArray(highlight.highlights)) {
                        try {
                            if (isHexGrid && centerGrid.i !== undefined && centerGrid.j !== undefined) {
                                highlight.highlights.push({ i: hexI, j: hexJ, col: gridCol, row: gridRow, color: highlightColor, alpha: highlightAlpha });
                                usedMethod = 'highlights.push(i,j)';
                            }
                            else {
                                highlight.highlights.push({ col: gridCol, row: gridRow, color: highlightColor, alpha: highlightAlpha });
                                usedMethod = 'highlights.push(col,row)';
                            }
                            highlighted = true;
                        }
                        catch (e) {
                            if (hexesInRange <= 3) {
                                console.warn('Mastery System | [DEBUG] highlightRangeHexes: highlights.push failed', { gridCol, gridRow, hexI, hexJ, error: e });
                            }
                        }
                    }
                    // Method 7: Try to use set method
                    else if (highlight && typeof highlight.set === 'function') {
                        try {
                            if (isHexGrid && centerGrid.i !== undefined && centerGrid.j !== undefined) {
                                highlight.set(hexI, hexJ, { color: highlightColor, alpha: highlightAlpha });
                                usedMethod = 'set(i,j)';
                            }
                            else {
                                highlight.set(gridCol, gridRow, { color: highlightColor, alpha: highlightAlpha });
                                usedMethod = 'set(col,row)';
                            }
                            highlighted = true;
                        }
                        catch (e) {
                            if (hexesInRange <= 3) {
                                console.warn('Mastery System | [DEBUG] highlightRangeHexes: set failed', { gridCol, gridRow, hexI, hexJ, error: e });
                            }
                        }
                    }
                    // Method 8: Try to use drawHighlight method
                    else if (highlight && typeof highlight.drawHighlight === 'function') {
                        try {
                            if (isHexGrid && centerGrid.i !== undefined && centerGrid.j !== undefined) {
                                highlight.drawHighlight(hexI, hexJ, highlightColor, highlightAlpha);
                                usedMethod = 'drawHighlight(i,j)';
                            }
                            else {
                                highlight.drawHighlight(gridCol, gridRow, highlightColor, highlightAlpha);
                                usedMethod = 'drawHighlight(col,row)';
                            }
                            highlighted = true;
                        }
                        catch (e) {
                            if (hexesInRange <= 3) {
                                console.warn('Mastery System | [DEBUG] highlightRangeHexes: drawHighlight failed', { gridCol, gridRow, hexI, hexJ, error: e });
                            }
                        }
                    }
                    if (highlighted) {
                        hexesHighlighted++;
                        // Log which method was used for first few hexes
                        if (hexesInRange <= 3) {
                            console.log('Mastery System | [DEBUG] highlightRangeHexes: Successfully highlighted hex', {
                                gridCol,
                                gridRow,
                                hexI,
                                hexJ,
                                usedMethod,
                                highlightVisible: highlight?.visible !== false,
                                highlightRenderable: highlight?.renderable !== false,
                                highlightAlpha: highlight?.alpha,
                                highlightChildren: highlight?.children?.length || 0
                            });
                        }
                    }
                    else {
                        // Only log first few failures to avoid spam
                        if (hexesInRange <= 3) {
                            console.warn('Mastery System | [DEBUG] highlightRangeHexes: No highlight method worked for hex', {
                                gridCol,
                                gridRow,
                                hexI,
                                hexJ,
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
    // Ensure highlight layer is visible and renderable
    if (highlight) {
        if (highlight.visible === false) {
            highlight.visible = true;
            console.log('Mastery System | [DEBUG] highlightRangeHexes: Set highlight.visible = true');
        }
        if (highlight.renderable === false) {
            highlight.renderable = true;
            console.log('Mastery System | [DEBUG] highlightRangeHexes: Set highlight.renderable = true');
        }
        // Try to render/refresh the highlight layer
        if (typeof highlight.render === 'function') {
            try {
                highlight.render();
                console.log('Mastery System | [DEBUG] highlightRangeHexes: Called highlight.render()');
            }
            catch (e) {
                console.warn('Mastery System | [DEBUG] highlightRangeHexes: Error calling highlight.render()', e);
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
        highlightVisible: highlight?.visible,
        highlightRenderable: highlight?.renderable,
        highlightAlpha: highlight?.alpha,
        highlightChildren: highlight?.children?.length || 0,
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