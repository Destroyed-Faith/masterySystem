/**
 * Radial Menu for Combat Action Selection
 * PIXI-based radial menu that appears on the canvas around tokens
 * Replaces the dialog-based option selection
 *
 * This file is the main entry point. The implementation is split into modules:
 * - radial-menu/types.ts: Types, interfaces, and constants
 * - radial-menu/options.ts: Option collection and parsing
 * - radial-menu/range-preview.ts: Range preview and hex highlighting
 * - radial-menu/info-panel.ts: Info panel display
 * - radial-menu/rendering.ts: Rendering functions (slices, rings, segments)
 */
import { MS_OUTER_RING_OUTER, hasGridEnabled, getGridType, getGridTypeName } from './radial-menu/types.js';
import { getAllCombatOptionsForActor, getSegmentIdForOption } from './radial-menu/options.js';
import { clearRangePreview, showRadialMenuRange, clearRadialMenuRange } from './radial-menu/range-preview.js';
import { hideRadialInfoPanel } from './radial-menu/info-panel.js';
import { renderOuterRing, renderInnerSegments, refreshInnerSegmentsVisual } from './radial-menu/rendering.js';
// Re-export for external use
export { getAllCombatOptionsForActor };
// Global state
let msRadialMenu = null;
let msRadialCloseHandler = null;
let msTokenHUD = null; // Reference to the Token HUD element to hide/show
let msCurrentTokenId = null; // ID of token with open radial menu
/**
 * Close the radial menu and clean up
 */
export function closeRadialMenu() {
    clearRangePreview();
    clearRadialMenuRange();
    hideRadialInfoPanel();
    const previousTokenId = msCurrentTokenId;
    msCurrentTokenId = null;
    if (msRadialMenu && msRadialMenu.parent) {
        msRadialMenu.parent.removeChild(msRadialMenu);
    }
    msRadialMenu = null;
    if (msRadialCloseHandler) {
        window.removeEventListener('mousedown', msRadialCloseHandler, true);
        msRadialCloseHandler = null;
    }
    // Notify turn indicator that radial menu closed
    if (previousTokenId) {
        Hooks.call('masterySystem.radialMenuClosed', previousTokenId);
    }
    // Show Token HUD again if it was hidden
    if (msTokenHUD && msTokenHUD.length > 0) {
        msTokenHUD.css('display', '');
        msTokenHUD = null;
        console.log('Mastery System | Token HUD restored');
    }
    // Don't cancel melee/utility targeting when menu closes
    // The targeting modes should remain active so the user can select targets
    // They will be cancelled when the user clicks outside or presses ESC
}
/**
 * Open the radial menu for an actor's token
 */
export function openRadialMenuForActor(token, allOptions) {
    closeRadialMenu();
    // Check if grid is enabled on the scene
    const gridEnabled = hasGridEnabled();
    const gridType = getGridType();
    const gridTypeName = getGridTypeName();
    const sceneGridType = canvas.scene?.gridType;
    console.log('Mastery System | Grid Status:', {
        gridEnabled,
        gridType,
        gridTypeName,
        sceneGridType,
        hasCanvasGrid: !!canvas.grid,
        hasCanvasScene: !!canvas.scene
    });
    // Show fixed 6-field radius around token
    showRadialMenuRange(token);
    // Hide Token HUD to show only the radial menu
    // Find the Token HUD element for this token
    const tokenHUD = canvas.hud?.token;
    if (tokenHUD) {
        // Try to find the HTML element
        // In Foundry v13, the TokenHUD might have different structure
        let hudElement = null;
        // Method 1: Try to get the element from the TokenHUD app
        if (tokenHUD.element) {
            hudElement = $(tokenHUD.element);
        }
        // Method 2: Try to find by token ID in the DOM
        else {
            const tokenId = token.id;
            hudElement = $(`.token-hud[data-token-id="${tokenId}"]`);
            if (hudElement.length === 0) {
                // Try alternative selector
                hudElement = $(`[data-token-id="${tokenId}"]`).closest('.token-hud, .hud');
            }
        }
        // Method 3: Try to find any visible Token HUD
        if (!hudElement || hudElement.length === 0) {
            hudElement = $('.token-hud:visible');
            if (hudElement.length === 0) {
                hudElement = $('.hud.token-hud:visible');
            }
        }
        if (hudElement && hudElement.length > 0) {
            msTokenHUD = hudElement;
            hudElement.css('display', 'none');
            console.log('Mastery System | Token HUD hidden');
        }
        else {
            console.warn('Mastery System | Could not find Token HUD element to hide');
        }
    }
    // Build bySegment structure from allOptions
    const bySegment = {
        'movement': [],
        'attack': [],
        'utility': [],
        'active-buff': []
    };
    for (const option of allOptions) {
        const segmentId = getSegmentIdForOption(option);
        bySegment[segmentId].push(option);
    }
    console.log('Mastery System | Options by segment:', {
        movement: bySegment.movement.length,
        attack: bySegment.attack.length,
        utility: bySegment.utility.length,
        'active-buff': bySegment['active-buff'].length
    });
    // Determine initial segment (first non-empty segment, default to movement)
    const segments = ['movement', 'attack', 'utility', 'active-buff'];
    let currentSegmentId = segments.find(id => (bySegment[id]?.length ?? 0) > 0) ?? 'movement';
    // In Foundry v13, canvas layers may have different structure
    // Try multiple approaches for compatibility
    let hudContainer = null;
    if (canvas.hud) {
        // Debug: log canvas.hud structure
        const hudKeys = Object.keys(canvas.hud);
        const hudKeyTypes = {};
        hudKeys.forEach(key => {
            const value = canvas.hud[key];
            hudKeyTypes[key] = typeof value;
            if (value && typeof value.addChild === 'function') {
                hudKeyTypes[key] += ' (has addChild)';
            }
        });
        console.log('Mastery System | canvas.hud structure:', {
            hasAddChild: typeof canvas.hud.addChild === 'function',
            hasContainer: !!canvas.hud.container,
            hasObjects: !!canvas.hud.objects,
            keys: hudKeys,
            keyTypes: hudKeyTypes
        });
        // Try v13 structure - check for layers property
        if (canvas.hud.layers) {
            // Foundry v13 uses layers array/object
            const layers = canvas.hud.layers;
            if (layers instanceof Array && layers.length > 0) {
                // Try first layer
                const firstLayer = layers[0];
                if (firstLayer && typeof firstLayer.addChild === 'function') {
                    hudContainer = firstLayer;
                    console.log('Mastery System | Using canvas.hud.layers[0]');
                }
                else if (firstLayer && firstLayer.container && typeof firstLayer.container.addChild === 'function') {
                    hudContainer = firstLayer.container;
                    console.log('Mastery System | Using canvas.hud.layers[0].container');
                }
            }
            else if (layers && typeof layers.addChild === 'function') {
                hudContainer = layers;
                console.log('Mastery System | Using canvas.hud.layers');
            }
        }
        // Try v13 structure - check for interactive property (TokenHUD)
        if (!hudContainer && canvas.hud.interactive && typeof canvas.hud.interactive.addChild === 'function') {
            hudContainer = canvas.hud.interactive;
            console.log('Mastery System | Using canvas.hud.interactive');
        }
        // Try v13 structure - check for children property
        if (!hudContainer && canvas.hud.children && Array.isArray(canvas.hud.children)) {
            // If it has children, it might be a container itself
            if (typeof canvas.hud.addChild === 'function') {
                hudContainer = canvas.hud;
                console.log('Mastery System | Using canvas.hud (has children array)');
            }
        }
        // Try container property
        if (!hudContainer && canvas.hud.container && typeof canvas.hud.container.addChild === 'function') {
            hudContainer = canvas.hud.container;
            console.log('Mastery System | Using canvas.hud.container');
        }
        // Try direct addChild (older versions)
        if (!hudContainer && typeof canvas.hud.addChild === 'function') {
            hudContainer = canvas.hud;
            console.log('Mastery System | Using canvas.hud directly');
        }
        // Try objects container
        if (!hudContainer && canvas.hud.objects && typeof canvas.hud.objects.addChild === 'function') {
            hudContainer = canvas.hud.objects;
            console.log('Mastery System | Using canvas.hud.objects');
        }
        // Try each key to see if any is a PIXI.Container
        if (!hudContainer) {
            for (const key of hudKeys) {
                const value = canvas.hud[key];
                if (value && typeof value.addChild === 'function') {
                    hudContainer = value;
                    console.log(`Mastery System | Using canvas.hud.${key}`);
                    break;
                }
                // Also check nested properties
                if (value && typeof value === 'object') {
                    // Check for v13 element property first (replaces deprecated container)
                    if (value.element && typeof value.element.addChild === 'function') {
                        hudContainer = value.element;
                        console.log(`Mastery System | Using canvas.hud.${key}.element`);
                        break;
                    }
                    // Fallback to deprecated container property (for backwards compatibility)
                    if (value.container && typeof value.container.addChild === 'function') {
                        hudContainer = value.container;
                        console.log(`Mastery System | Using canvas.hud.${key}.container (deprecated)`);
                        break;
                    }
                }
            }
        }
    }
    // Fallback to tokens layer if HUD doesn't work (tokens layer exists)
    if (!hudContainer && canvas.tokens) {
        if (canvas.tokens.container && typeof canvas.tokens.container.addChild === 'function') {
            hudContainer = canvas.tokens.container;
            console.log('Mastery System | Using canvas.tokens.container');
        }
        else if (typeof canvas.tokens.addChild === 'function') {
            hudContainer = canvas.tokens;
            console.log('Mastery System | Using canvas.tokens directly');
        }
    }
    // Fallback to foreground layer if HUD doesn't work
    if (!hudContainer && canvas.foreground) {
        if (canvas.foreground.container && typeof canvas.foreground.container.addChild === 'function') {
            hudContainer = canvas.foreground.container;
            console.log('Mastery System | Using canvas.foreground.container');
        }
        else if (typeof canvas.foreground.addChild === 'function') {
            hudContainer = canvas.foreground;
            console.log('Mastery System | Using canvas.foreground directly');
        }
    }
    // Last resort: use canvas.app.stage (the root PIXI container)
    if (!hudContainer && canvas.app && canvas.app.stage) {
        hudContainer = canvas.app.stage;
        console.log('Mastery System | Using canvas.app.stage as last resort');
    }
    if (!hudContainer) {
        console.error('Mastery System | Could not find suitable canvas layer for radial menu');
        console.error('Mastery System | Available canvas layers:', {
            hud: !!canvas.hud,
            foreground: !!canvas.foreground,
            effects: !!canvas.effects,
            tokens: !!canvas.tokens
        });
        ui.notifications.error('Could not display radial menu: Canvas layer not available');
        return;
    }
    const root = new PIXI.Container();
    msRadialMenu = root;
    msCurrentTokenId = token.id; // Track which token has the menu open
    root.name = 'ms-radial-menu-root';
    // Make root interactive so child events can be captured
    root.interactive = true;
    root.interactiveChildren = true; // Allow children to be interactive
    // Notify turn indicator that radial menu opened
    Hooks.call('masterySystem.radialMenuOpened', token.id);
    console.log('Mastery System | Root container created:', {
        interactive: root.interactive,
        interactiveChildren: root.interactiveChildren,
        name: root.name
    });
    // Add to canvas layer
    hudContainer.addChild(root);
    console.log('Mastery System | Root container added to hudContainer, parent:', root.parent?.constructor?.name);
    // Center on token
    const tokenCenter = token.center;
    root.position.set(tokenCenter.x, tokenCenter.y);
    // State management functions
    const getCurrentSegmentId = () => currentSegmentId;
    const setCurrentSegmentId = (id) => {
        console.log(`Mastery System | [setCurrentSegmentId] Called with id="${id}", current="${currentSegmentId}"`);
        if (currentSegmentId === id) {
            console.log(`Mastery System | Segment ${id} already active, no change needed`);
            return; // No change needed
        }
        console.log(`Mastery System | [setCurrentSegmentId] Changing segment from "${currentSegmentId}" to "${id}"`);
        const oldSegmentId = currentSegmentId;
        currentSegmentId = id;
        // Check if the new segment has options
        const optionsForSegment = bySegment[currentSegmentId] ?? [];
        console.log(`Mastery System | [setCurrentSegmentId] Segment "${currentSegmentId}" has ${optionsForSegment.length} options`);
        // Re-render outer ring with filtered options for the new segment
        console.log(`Mastery System | [setCurrentSegmentId] Re-rendering outer ring...`);
        renderOuterRing(root, token, bySegment, currentSegmentId);
        // Refresh inner segments visual state to highlight the active segment
        console.log(`Mastery System | [setCurrentSegmentId] Refreshing inner segments visual...`);
        refreshInnerSegmentsVisual(root, getCurrentSegmentId);
        // Ensure inner segments stay on top after re-rendering outer ring
        const innerSegments = [];
        root.children.forEach((child) => {
            if (child.msInnerSegment === true) {
                innerSegments.push(child);
            }
        });
        console.log(`Mastery System | [setCurrentSegmentId] Moving ${innerSegments.length} inner segments to top...`);
        // Remove and re-add to put them on top
        innerSegments.forEach((seg, idx) => {
            const oldIndex = root.getChildIndex(seg);
            root.removeChild(seg);
            root.addChild(seg);
            const newIndex = root.getChildIndex(seg);
            console.log(`Mastery System | [setCurrentSegmentId] Inner segment ${idx} moved from index ${oldIndex} to ${newIndex}`);
        });
        console.log(`Mastery System | [setCurrentSegmentId] Segment change complete: "${oldSegmentId}" -> "${currentSegmentId}"`);
    };
    // Initial render
    // Render outer ring first, then inner segments
    // This ensures inner segments are on top and can receive clicks
    renderOuterRing(root, token, bySegment, currentSegmentId);
    renderInnerSegments(root, getCurrentSegmentId, setCurrentSegmentId, token);
    // Move inner segments to the end of children list to ensure they're on top
    // This helps with event handling - elements rendered later are on top
    const innerSegments = [];
    root.children.forEach((child) => {
        if (child.msInnerSegment === true) {
            innerSegments.push(child);
        }
    });
    console.log(`Mastery System | Found ${innerSegments.length} inner segments, moving to top`);
    // Remove and re-add to put them on top
    innerSegments.forEach((seg, idx) => {
        const oldIndex = root.getChildIndex(seg);
        root.removeChild(seg);
        root.addChild(seg);
        const newIndex = root.getChildIndex(seg);
        console.log(`Mastery System | Inner segment ${idx} moved from index ${oldIndex} to ${newIndex}`);
    });
    // Final verification: log all children in order
    console.log('Mastery System | Root children order (bottom to top):');
    root.children.forEach((child, idx) => {
        const type = child.msInnerSegment ? 'INNER_SEGMENT' :
            child.msOuterSlice ? 'OUTER_SLICE' :
                child.msOuterRing ? 'OUTER_RING' : 'UNKNOWN';
        console.log(`  [${idx}] ${type} - ${child.name || child.constructor.name}`);
    });
    // Outside-click closes the menu
    msRadialCloseHandler = (event) => {
        if (!msRadialMenu)
            return;
        // Get the click position in canvas coordinates
        let canvasPoint = null;
        // Try multiple methods to get mouse position
        // Method 1: Use event coordinates and convert
        if (event && canvas.app?.renderer) {
            const rect = canvas.app.renderer.view.getBoundingClientRect();
            const clientX = event.clientX - rect.left;
            const clientY = event.clientY - rect.top;
            // Convert screen coordinates to world coordinates
            if (canvas.stage && typeof canvas.stage.toLocal === 'function') {
                const screenPoint = new PIXI.Point(clientX, clientY);
                const worldPoint = canvas.stage.toLocal(screenPoint);
                canvasPoint = { x: worldPoint.x, y: worldPoint.y };
            }
            else {
                // Fallback: use screen coordinates directly (approximation)
                const scale = canvas.stage?.scale?.x || 1;
                canvasPoint = { x: clientX / scale, y: clientY / scale };
            }
        }
        // Method 2: Use interaction plugin (if available)
        else if (canvas.app?.renderer?.plugins?.interaction?.mouse?.global) {
            const mouseGlobal = canvas.app.renderer.plugins.interaction.mouse.global;
            if (canvas.stage && typeof canvas.stage.toLocal === 'function') {
                const worldPoint = canvas.stage.toLocal(mouseGlobal);
                canvasPoint = { x: worldPoint.x, y: worldPoint.y };
            }
            else {
                canvasPoint = { x: mouseGlobal.x, y: mouseGlobal.y };
            }
        }
        // If we couldn't get the point, just close on any click
        if (!canvasPoint) {
            closeRadialMenu();
            return;
        }
        // Calculate distance from token center
        const dx = canvasPoint.x - tokenCenter.x;
        const dy = canvasPoint.y - tokenCenter.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        // If click is outside the outer ring (with some margin for easier clicking), close
        if (distance > MS_OUTER_RING_OUTER + 30) {
            closeRadialMenu();
        }
    };
    window.addEventListener('mousedown', msRadialCloseHandler, true);
}
//# sourceMappingURL=token-radial-menu.js.map