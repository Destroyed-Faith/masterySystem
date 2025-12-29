/**
 * Range Preview and Hex Highlighting for Radial Menu
 */
import { highlightHexesInRange, clearHexHighlight } from '../utils/hex-highlighting';
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
    clearHexHighlight('mastery-range-preview');
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
    clearHexHighlight('mastery-radial-menu-range');
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
    if (canvas.grid && canvas.grid.type !== CONST.GRID_TYPES.GRIDLESS && token?.id) {
        highlightHexesInRange(token.id, rangeUnits, 'mastery-range-preview', 0xffe066, 0.5);
    }
}
// Old highlightRangeHexes function removed - use highlightHexesInRange from utils/hex-highlighting.ts instead
// The old function was replaced with the BFS-based implementation in utils/hex-highlighting.ts
/**
 * Show a fixed 6-field radius around the token when radial menu opens

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
        if (token?.id) {
            highlightHexesInRange(token.id, RANGE_UNITS, 'mastery-radial-menu-range', FIXED_COLOR, FIXED_ALPHA);
        }
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