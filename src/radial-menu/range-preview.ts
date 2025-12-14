/**
 * Range Preview and Hex Highlighting for Radial Menu
 */

/**
 * Global state for range preview graphics
 */
let msRangePreviewGfx: PIXI.Graphics | null = null;

/**
 * Convert system units (meters) to pixels
 */
function unitsToPixels(units: number): number {
  // 1 unit = 1 grid square
  // canvas.grid.size = pixels per square
  return units * (canvas.grid?.size || 100);
}

/**
 * Clear the range preview graphics
 */
export function clearRangePreview(): void {
  if (msRangePreviewGfx && msRangePreviewGfx.parent) {
    msRangePreviewGfx.parent.removeChild(msRangePreviewGfx);
  }
  msRangePreviewGfx = null;
  
  // Also clear hex highlights
  if (canvas.grid) {
    let highlight: any = null;
    try {
      if (canvas.interface?.grid?.highlight) {
        highlight = canvas.interface.grid.highlight;
      } else if (canvas.grid?.highlight) {
        highlight = canvas.grid.highlight;
      } else if ((canvas.grid as any).getHighlightLayer) {
        highlight = (canvas.grid as any).getHighlightLayer('mastery-range-preview');
      }
    } catch (error) {
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
export function showRangePreview(token: any, rangeUnits: number): void {
  clearRangePreview();
  
  if (!rangeUnits || rangeUnits <= 0) return;
  
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
  let effectsContainer: PIXI.Container | null = null;
  
  if (canvas.effects) {
    // Try v13 structure first (container property)
    if ((canvas.effects as any).container && typeof (canvas.effects as any).container.addChild === 'function') {
      effectsContainer = (canvas.effects as any).container;
    }
    // Try direct addChild (older versions)
    else if (typeof (canvas.effects as any).addChild === 'function') {
      effectsContainer = canvas.effects as any;
    }
  }
  
  // Fallback to foreground if effects doesn't work
  if (!effectsContainer && canvas.foreground) {
    if ((canvas.foreground as any).container && typeof (canvas.foreground as any).container.addChild === 'function') {
      effectsContainer = (canvas.foreground as any).container;
    } else if (typeof (canvas.foreground as any).addChild === 'function') {
      effectsContainer = canvas.foreground as any;
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
      containerVisible: (effectsContainer as any).visible,
      containerWorldVisible: (effectsContainer as any).worldVisible,
      rangeUnits
    });
  } else {
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
 */
function highlightRangeHexes(center: { x: number; y: number }, rangeUnits: number, highlightId: string): void {
  console.log('Mastery System | [DEBUG] highlightRangeHexes: Called', {
    center,
    rangeUnits,
    highlightId,
    hasGrid: !!canvas.grid
  });
  
  if (!canvas.grid) {
    console.warn('Mastery System | [DEBUG] highlightRangeHexes: No grid available');
    return;
  }
  
  // Get highlight layer
  let highlight: any = null;
  let highlightMethod = 'none';
  try {
    // Use new v13 API: canvas.interface.grid.highlight
    if (canvas.interface?.grid?.highlight) {
      highlight = canvas.interface.grid.highlight;
      highlightMethod = 'canvas.interface.grid.highlight';
      console.log('Mastery System | [DEBUG] highlightRangeHexes: Using canvas.interface.grid.highlight');
    } else if (canvas.grid?.highlight) {
      // Fallback to old API for compatibility
      highlight = canvas.grid.highlight;
      highlightMethod = 'canvas.grid.highlight';
      console.log('Mastery System | [DEBUG] highlightRangeHexes: Using canvas.grid.highlight (fallback)');
    } else if ((canvas.grid as any).getHighlightLayer) {
      highlight = (canvas.grid as any).getHighlightLayer(highlightId);
      if (!highlight && (canvas.grid as any).addHighlightLayer) {
        highlight = (canvas.grid as any).addHighlightLayer(highlightId);
      }
      highlightMethod = 'getHighlightLayer';
      console.log('Mastery System | [DEBUG] highlightRangeHexes: Using getHighlightLayer');
    }
  } catch (error) {
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
    } catch (error) {
      console.warn('Mastery System | [DEBUG] highlightRangeHexes: Error clearing highlights', error);
    }
  } else if (typeof highlight.clearAll === 'function') {
    try {
      highlight.clearAll();
      console.log('Mastery System | [DEBUG] highlightRangeHexes: Cleared via clearAll');
    } catch (error) {
      console.warn('Mastery System | [DEBUG] highlightRangeHexes: Error clearing via clearAll', error);
    }
  } else if (highlight.highlights && Array.isArray(highlight.highlights)) {
    highlight.highlights.length = 0;
    console.log('Mastery System | [DEBUG] highlightRangeHexes: Cleared via array clear');
  } else if (highlight.removeChildren && typeof highlight.removeChildren === 'function') {
    try {
      highlight.removeChildren();
      console.log('Mastery System | [DEBUG] highlightRangeHexes: Cleared via removeChildren');
    } catch (error) {
      console.warn('Mastery System | [DEBUG] highlightRangeHexes: Error clearing via removeChildren', error);
    }
  } else {
    console.warn('Mastery System | [DEBUG] highlightRangeHexes: Highlight layer has no clear method - will overwrite');
  }
  
  // Get grid position of center using new v13 API
  let centerGrid: { col: number; row: number } | null = null;
  let gridPositionMethod = 'none';
  try {
    if (canvas.grid?.getOffset) {
      // New v13 API: getOffset returns {col, row}
      const offset = canvas.grid.getOffset(center.x, center.y);
      centerGrid = { col: offset.col, row: offset.row };
      gridPositionMethod = 'getOffset';
      console.log('Mastery System | [DEBUG] highlightRangeHexes: Got grid position via getOffset', centerGrid);
    } else if (canvas.grid?.getGridPositionFromPixels) {
      // Fallback to old API
      const oldGrid = canvas.grid.getGridPositionFromPixels(center.x, center.y);
      if (oldGrid) {
        centerGrid = { col: oldGrid.x, row: oldGrid.y };
        gridPositionMethod = 'getGridPositionFromPixels';
        console.log('Mastery System | [DEBUG] highlightRangeHexes: Got grid position via getGridPositionFromPixels', centerGrid);
      }
    }
  } catch (error) {
    console.warn('Mastery System | [DEBUG] highlightRangeHexes: Could not get grid position', error);
    return;
  }
  
  console.log('Mastery System | [DEBUG] highlightRangeHexes: Grid position result', {
    centerGrid,
    gridPositionMethod
  });
  
  if (!centerGrid) {
    console.warn('Mastery System | [DEBUG] highlightRangeHexes: No grid position, aborting');
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
      let hexCenter: { x: number; y: number } | null = null;
      try {
        if (canvas.grid?.getTopLeftPoint) {
          // New v13 API: getTopLeftPoint(col, row) returns center point
          hexCenter = canvas.grid.getTopLeftPoint(gridCol, gridRow);
        } else if (canvas.grid?.getPixelsFromGridPosition) {
          // Fallback to old API
          hexCenter = canvas.grid.getPixelsFromGridPosition(gridCol, gridRow);
        }
      } catch (error) {
        // Skip this hex if we can't get its position
        continue;
      }
      
      if (!hexCenter) continue;
      
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
        } else if (canvas.grid?.measureDistances) {
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
      } catch (error) {
        // Use fallback distance
      }
      
      // If hex is within range, highlight it
      if (distanceInUnits <= rangeUnits) {
        // Try different methods to highlight the hex
        // Use yellow color (0xffe066) for movement preview to match movement segment color
        const highlightColor = 0xffe066; // Yellow/gold color
        const highlightAlpha = 0.5;
        
        let highlighted = false;
        try {
          // Method 1: Foundry v13 API: highlight.highlightPosition(col, row, options)
          if (highlight && typeof highlight.highlightPosition === 'function') {
            highlight.highlightPosition(gridCol, gridRow, { color: highlightColor, alpha: highlightAlpha });
            highlighted = true;
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
          else if (canvas.grid && typeof (canvas.grid as any).highlightPosition === 'function') {
            (canvas.grid as any).highlightPosition(gridCol, gridRow, { color: highlightColor, alpha: highlightAlpha });
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
        } catch (error) {
          // Log errors for debugging
          console.warn('Mastery System | [DEBUG] highlightRangeHexes: Could not highlight hex at', gridCol, gridRow, error);
        }
      }
    }
  }
  
  console.log('Mastery System | [DEBUG] highlightRangeHexes: Complete', {
    hexesHighlighted,
    rangeUnits,
    totalHexesChecked: (maxHexDistance * 2 + 1) * (maxHexDistance * 2 + 1),
    highlightMethod,
    highlightType: highlight ? highlight.constructor.name : 'null'
  });
}

