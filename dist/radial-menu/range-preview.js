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
    // Get or create highlight layer using v13 API
    let highlightLayer = null;
    let highlightMethod = 'none';
    try {
        // Use new v13 API: canvas.interface.grid.addHighlightLayer / getHighlightLayer
        if (canvas.interface?.grid) {
            // Try to get existing layer first
            highlightLayer = canvas.interface.grid.highlightLayers?.[highlightId];
            if (!highlightLayer && typeof canvas.interface.grid.addHighlightLayer === 'function') {
                // Create new layer if it doesn't exist
                highlightLayer = canvas.interface.grid.addHighlightLayer(highlightId);
                highlightMethod = 'addHighlightLayer';
                console.log('Mastery System | [DEBUG] highlightRangeHexes: Created highlight layer via addHighlightLayer');
            }
            else if (highlightLayer) {
                highlightMethod = 'getHighlightLayer (existing)';
                console.log('Mastery System | [DEBUG] highlightRangeHexes: Using existing highlight layer');
            }
        }
        // Fallback to old API for compatibility
        if (!highlightLayer && canvas.grid?.highlight) {
            highlightLayer = canvas.grid.highlight;
            highlightMethod = 'canvas.grid.highlight (fallback)';
            console.log('Mastery System | [DEBUG] highlightRangeHexes: Using canvas.grid.highlight (fallback)');
        }
    }
    catch (error) {
        console.warn('Mastery System | [DEBUG] highlightRangeHexes: Could not get/create highlight layer', error);
        return;
    }
    if (!highlightLayer) {
        console.warn('Mastery System | [DEBUG] highlightRangeHexes: No highlight layer available');
        return;
    }
    // Ensure layer is visible and renderable
    if (highlightLayer.visible === false) {
        highlightLayer.visible = true;
    }
    if (highlightLayer.renderable === false) {
        highlightLayer.renderable = true;
    }
    console.log('Mastery System | [DEBUG] highlightRangeHexes: Highlight layer check', {
        hasHighlightLayer: !!highlightLayer,
        highlightMethod,
        highlightType: highlightLayer ? highlightLayer.constructor.name : 'null',
        layerName: highlightLayer?.name
    });
    // Clear previous highlights - for GridHighlight, use clearHighlightLayer or clear the layer directly
    if (canvas.interface?.grid && typeof canvas.interface.grid.clearHighlightLayer === 'function') {
        try {
            canvas.interface.grid.clearHighlightLayer(highlightId);
            console.log('Mastery System | [DEBUG] highlightRangeHexes: Cleared via clearHighlightLayer');
        }
        catch (error) {
            console.warn('Mastery System | [DEBUG] highlightRangeHexes: Error clearing via clearHighlightLayer', error);
        }
    }
    else if (highlightLayer && typeof highlightLayer.clear === 'function') {
        try {
            highlightLayer.clear();
            console.log('Mastery System | [DEBUG] highlightRangeHexes: Cleared via layer.clear()');
        }
        catch (error) {
            console.warn('Mastery System | [DEBUG] highlightRangeHexes: Error clearing via layer.clear()', error);
        }
    }
    else if (highlightLayer && highlightLayer.removeChildren && typeof highlightLayer.removeChildren === 'function') {
        try {
            highlightLayer.removeChildren();
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
    // For hexagonal grids, use hexagonal iteration to cover all hexes in radius
    // For rectangular/square grids, use rectangular iteration
    if (isHexGrid) {
        // Hexagonal iteration: for each q, r must satisfy the hex distance constraint
        // In axial coordinates (i, j), we iterate q from -radius to radius
        // and for each q, r from max(-radius, -q-radius) to min(radius, -q+radius)
        for (let q = -maxHexDistance; q <= maxHexDistance; q++) {
            const rMin = Math.max(-maxHexDistance, -q - maxHexDistance);
            const rMax = Math.min(maxHexDistance, -q + maxHexDistance);
            for (let r = rMin; r <= rMax; r++) {
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
                            // We need to add the difference between the hex position and center hex position
                            // Plus a calibration offset to align with Foundry's grid system
                            // Calibration: Hex (0,0) at token center (2300, 924.735...) should be at (2250, 865)
                            // Delta: (-50, -59.735...)
                            const calibrationDeltaX = -50; // Foundry's grid offset for hex (0,0)
                            const calibrationDeltaY = -59.7350269189626; // Foundry's grid offset for hex (0,0)
                            const pixelX = center.x + (pixelXRelative - centerPixelXRelative) + calibrationDeltaX;
                            const pixelY = center.y + (pixelYRelative - centerPixelYRelative) + calibrationDeltaY;
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
                                hexCenterX: hexCenter.x,
                                hexCenterY: hexCenter.y,
                                distanceInUnits,
                                rangeUnits,
                                color: highlightColor.toString(16),
                                alpha: highlightAlpha
                            });
                        }
                        // Method 1: Direct grid highlight (v13) - use canvas.interface.grid.highlightPosition with pixel coordinates
                        // highlightPosition(name, {x, y, color, alpha}) expects pixel coordinates, not grid coordinates
                        if (canvas.interface?.grid && typeof canvas.interface.grid.highlightPosition === 'function') {
                            try {
                                // Use pixel coordinates (hexCenter.x, hexCenter.y) instead of grid coordinates
                                canvas.interface.grid.highlightPosition(highlightId, {
                                    x: hexCenter.x,
                                    y: hexCenter.y,
                                    color: highlightColor,
                                    alpha: highlightAlpha
                                });
                                usedMethod = 'canvas.interface.grid.highlightPosition(pixel)';
                                highlighted = true;
                            }
                            catch (e) {
                                if (hexesInRange <= 3) {
                                    console.warn('Mastery System | [DEBUG] highlightRangeHexes: canvas.interface.grid.highlightPosition failed', {
                                        gridCol, gridRow, hexI, hexJ, hexCenterX: hexCenter.x, hexCenterY: hexCenter.y, error: e
                                    });
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
                                    hexCenterX: hexCenter.x,
                                    hexCenterY: hexCenter.y,
                                    highlightLayerVisible: highlightLayer?.visible !== false,
                                    highlightLayerRenderable: highlightLayer?.renderable !== false,
                                    highlightLayerAlpha: highlightLayer?.alpha,
                                    highlightLayerPositions: highlightLayer?.positions?.size || 0
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
                                    hexCenterX: hexCenter.x,
                                    hexCenterY: hexCenter.y,
                                    highlightLayerAvailable: !!highlightLayer,
                                    highlightLayerType: highlightLayer?.constructor?.name,
                                    hasHighlightPosition: typeof canvas.interface?.grid?.highlightPosition === 'function'
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
    }
    else {
        // For non-hexagonal grids, use rectangular iteration
        for (let q = -maxHexDistance; q <= maxHexDistance; q++) {
            for (let r = -maxHexDistance; r <= maxHexDistance; r++) {
                const gridCol = centerGrid.col + q;
                const gridRow = centerGrid.row + r;
                hexesChecked++;
                // Get hex center position (same logic as above, but for non-hex grids)
                let hexCenter = null;
                try {
                    // For non-hex grids, use standard methods
                    if (canvas.grid?.getCenterPoint) {
                        hexCenter = canvas.grid.getCenterPoint(gridCol, gridRow);
                    }
                    else if (canvas.grid?.getTopLeftPoint) {
                        const topLeft = canvas.grid.getTopLeftPoint(gridCol, gridRow);
                        if (topLeft) {
                            const gridSize = canvas.grid.size || 100;
                            hexCenter = { x: topLeft.x + gridSize / 2, y: topLeft.y + gridSize / 2 };
                        }
                    }
                    if (hexCenter) {
                        hexesWithPosition++;
                        // Calculate distance
                        const dx = hexCenter.x - center.x;
                        const dy = hexCenter.y - center.y;
                        const pixelDistance = Math.sqrt(dx * dx + dy * dy);
                        const gridDistance = pixelDistance / (canvas.grid.size || 100);
                        let distanceInUnits = gridDistance;
                        // Use Foundry's measurement API if available
                        try {
                            if (canvas.grid?.measurePath) {
                                const waypoints = [{ x: center.x, y: center.y }, { x: hexCenter.x, y: hexCenter.y }];
                                const measurement = canvas.grid.measurePath(waypoints, {});
                                if (measurement && measurement.length > 0) {
                                    distanceInUnits = measurement[0];
                                }
                            }
                            else if (canvas.grid?.measureDistances) {
                                const waypoints = [{ x: center.x, y: center.y }, { x: hexCenter.x, y: hexCenter.y }];
                                const measurement = canvas.grid.measureDistances(waypoints, {});
                                if (measurement && measurement.length > 0) {
                                    distanceInUnits = measurement[0];
                                }
                            }
                        }
                        catch (e) {
                            // Use fallback distance
                        }
                        const withinRange = distanceInUnits <= rangeUnits;
                        if (withinRange) {
                            hexesInRange++;
                            // Highlight the hex
                            const highlightColor = color;
                            const highlightAlpha = alpha;
                            let highlighted = false;
                            try {
                                if (canvas.interface?.grid && typeof canvas.interface.grid.highlightPosition === 'function') {
                                    try {
                                        canvas.interface.grid.highlightPosition(highlightId, {
                                            x: hexCenter.x,
                                            y: hexCenter.y,
                                            color: highlightColor,
                                            alpha: highlightAlpha
                                        });
                                        highlighted = true;
                                    }
                                    catch (e) {
                                        // Failed
                                    }
                                }
                                if (highlighted) {
                                    hexesHighlighted++;
                                }
                            }
                            catch (error) {
                                // Log errors
                            }
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
    if (highlightLayer) {
        if (highlightLayer.visible === false) {
            highlightLayer.visible = true;
            console.log('Mastery System | [DEBUG] highlightRangeHexes: Set highlightLayer.visible = true');
        }
        if (highlightLayer.renderable === false) {
            highlightLayer.renderable = true;
            console.log('Mastery System | [DEBUG] highlightRangeHexes: Set highlightLayer.renderable = true');
        }
        // Try to render/refresh the highlight layer if needed
        if (typeof highlightLayer.render === 'function') {
            try {
                highlightLayer.render();
                console.log('Mastery System | [DEBUG] highlightRangeHexes: Called highlightLayer.render()');
            }
            catch (e) {
                console.warn('Mastery System | [DEBUG] highlightRangeHexes: Error calling highlightLayer.render()', e);
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
        highlightType: highlightLayer ? highlightLayer.constructor.name : 'null',
        centerGrid,
        gridPositionMethod,
        highlightAvailable: !!highlightLayer,
        highlightVisible: highlightLayer?.visible,
        highlightRenderable: highlightLayer?.renderable,
        highlightAlpha: highlightLayer?.alpha,
        highlightChildren: highlightLayer?.children?.length || 0,
        highlightPositions: highlightLayer?.positions?.size || 0,
        layerName: highlightLayer?.name
    });
    if (hexesHighlighted === 0) {
        console.warn('Mastery System | [DEBUG] highlightRangeHexes: WARNING - No hexes were highlighted!', {
            centerGrid,
            rangeUnits,
            maxHexDistance,
            highlightAvailable: !!highlightLayer,
            highlightType: highlightLayer?.constructor?.name,
            layerName: highlightLayer?.name
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