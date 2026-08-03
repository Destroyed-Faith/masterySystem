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
import { clearRangePreview, clearRadialMenuRange } from './radial-menu/range-preview.js';
import { hideRadialInfoPanel } from './radial-menu/info-panel.js';
import { renderOuterRing, renderInnerSegments, refreshInnerSegmentsVisual } from './radial-menu/rendering.js';
import { getActionEconomyActor } from './combat/action-economy.js';
// Re-export for external use
export { getAllCombatOptionsForActor };
// Global state
let msRadialMenu = null;
let msRadialCloseHandler = null;
let msTokenHUD = null; // Reference to the Token HUD element to hide/show
let msCurrentTokenId = null; // ID of token with open radial menu
/** Segment getter for the open menu — used to refresh action-count labels when round state changes. */
let msRadialGetCurrentSegmentId = null;
async function rebuildRadialBySegment(actor) {
    const allOptions = await getAllCombatOptionsForActor(actor);
    const bySegment = {
        movement: [],
        attack: [],
        utility: [],
        'active-buff': []
    };
    for (const option of allOptions) {
        bySegment[getSegmentIdForOption(option)].push(option);
    }
    return bySegment;
}
/**
 * Live-Sync: Innenring-Zahlen + äußerer Ring (Ranges nach RoundState / Steinen) — ohne Stone-Dialog-UI.
 */
export async function refreshRadialMenuActionLabelsIfOpenForActor(actor) {
    if (!msRadialMenu ||
        !msCurrentTokenId ||
        typeof msRadialGetCurrentSegmentId !== 'function') {
        return;
    }
    try {
        const token = canvas.tokens?.get(msCurrentTokenId);
        if (!token?.actor)
            return;
        let menuOwner;
        let updateOwner;
        try {
            menuOwner = getActionEconomyActor(token.actor) ?? token.actor;
            updateOwner = getActionEconomyActor(actor) ?? actor;
        }
        catch (e) {
            console.warn('Mastery System | refreshRadialMenuActionLabelsIfOpenForActor: getActionEconomyActor failed', e);
            return;
        }
        const updateId = updateOwner.id;
        const menuOwnerId = menuOwner.id;
        const tokenDocActorId = token.document?.actorId;
        if (updateId !== menuOwnerId && updateId !== tokenDocActorId)
            return;
        refreshInnerSegmentsVisual(msRadialMenu, msRadialGetCurrentSegmentId, token);
        const bySegment = await rebuildRadialBySegment(menuOwner);
        if (!msRadialMenu ||
            !msCurrentTokenId ||
            typeof msRadialGetCurrentSegmentId !== 'function') {
            return;
        }
        const seg = msRadialGetCurrentSegmentId();
        renderOuterRing(msRadialMenu, token, bySegment, seg);
        const innerSegments = [];
        msRadialMenu.children.forEach((child) => {
            if (child.msInnerSegment === true)
                innerSegments.push(child);
        });
        innerSegments.forEach((obj) => {
            msRadialMenu.removeChild(obj);
            msRadialMenu.addChild(obj);
        });
    }
    catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        const stack = e instanceof Error ? e.stack : undefined;
        console.warn('Mastery System | refreshRadialMenuActionLabelsIfOpenForActor failed', msg, stack ?? '', { actorId: actor?.id, tokenId: msCurrentTokenId });
    }
}
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
    msRadialGetCurrentSegmentId = null;
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
    // Debug: Log remaining actions when opening radial menu
    const combat = game.combat;
    const actor = token?.actor;
    if (combat && actor) {
        // Use dynamic import to avoid circular dependencies
        (async () => {
            try {
                const { getRoundState, getAvailableAttackActions, getAvailableMovementActions } = await import('./combat/action-economy.js');
                const roundState = getRoundState(actor, combat);
            }
            catch (err) {
                console.warn('Mastery System | Could not log action economy on radial menu open', err);
            }
        })();
    }
    // Check if grid is enabled on the scene
    const gridEnabled = hasGridEnabled();
    const gridType = getGridType();
    const gridTypeName = getGridTypeName();
    const sceneGridType = canvas.scene?.gridType;
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
        // Try v13 structure - check for layers property
        if (canvas.hud.layers) {
            // Foundry v13 uses layers array/object
            const layers = canvas.hud.layers;
            if (layers instanceof Array && layers.length > 0) {
                // Try first layer
                const firstLayer = layers[0];
                if (firstLayer && typeof firstLayer.addChild === 'function') {
                    hudContainer = firstLayer;
                }
                else if (firstLayer && firstLayer.container && typeof firstLayer.container.addChild === 'function') {
                    hudContainer = firstLayer.container;
                }
            }
            else if (layers && typeof layers.addChild === 'function') {
                hudContainer = layers;
            }
        }
        // Try v13 structure - check for interactive property (TokenHUD)
        if (!hudContainer && canvas.hud.interactive && typeof canvas.hud.interactive.addChild === 'function') {
            hudContainer = canvas.hud.interactive;
        }
        // Try v13 structure - check for children property
        if (!hudContainer && canvas.hud.children && Array.isArray(canvas.hud.children)) {
            // If it has children, it might be a container itself
            if (typeof canvas.hud.addChild === 'function') {
                hudContainer = canvas.hud;
            }
        }
        // Try container property
        if (!hudContainer && canvas.hud.container && typeof canvas.hud.container.addChild === 'function') {
            hudContainer = canvas.hud.container;
        }
        // Try direct addChild (older versions)
        if (!hudContainer && typeof canvas.hud.addChild === 'function') {
            hudContainer = canvas.hud;
        }
        // Try objects container
        if (!hudContainer && canvas.hud.objects && typeof canvas.hud.objects.addChild === 'function') {
            hudContainer = canvas.hud.objects;
        }
        // Try each key to see if any is a PIXI.Container
        if (!hudContainer) {
            for (const key of hudKeys) {
                const value = canvas.hud[key];
                if (value && typeof value.addChild === 'function') {
                    hudContainer = value;
                    break;
                }
                // Also check nested properties
                if (value && typeof value === 'object') {
                    // Check for v13 element property first (replaces deprecated container)
                    if (value.element && typeof value.element.addChild === 'function') {
                        hudContainer = value.element;
                        break;
                    }
                    // Fallback to deprecated container property (for backwards compatibility)
                    if (value.container && typeof value.container.addChild === 'function') {
                        hudContainer = value.container;
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
        }
        else if (typeof canvas.tokens.addChild === 'function') {
            hudContainer = canvas.tokens;
        }
    }
    // Fallback to foreground layer if HUD doesn't work
    if (!hudContainer && canvas.foreground) {
        if (canvas.foreground.container && typeof canvas.foreground.container.addChild === 'function') {
            hudContainer = canvas.foreground.container;
        }
        else if (typeof canvas.foreground.addChild === 'function') {
            hudContainer = canvas.foreground;
        }
    }
    // Last resort: use canvas.app.stage (the root PIXI container)
    if (!hudContainer && canvas.app && canvas.app.stage) {
        hudContainer = canvas.app.stage;
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
    // Add to canvas layer
    hudContainer.addChild(root);
    // Center on token
    const tokenCenter = token.center;
    root.position.set(tokenCenter.x, tokenCenter.y);
    // State management functions
    const getCurrentSegmentId = () => currentSegmentId;
    msRadialGetCurrentSegmentId = getCurrentSegmentId;
    const setCurrentSegmentId = (id) => {
        if (currentSegmentId === id) {
            return; // No change needed
        }
        const oldSegmentId = currentSegmentId;
        currentSegmentId = id;
        // Check if the new segment has options
        const optionsForSegment = bySegment[currentSegmentId] ?? [];
        // Re-render outer ring with filtered options for the new segment
        renderOuterRing(root, token, bySegment, currentSegmentId);
        // Refresh inner segments visual state to highlight the active segment
        refreshInnerSegmentsVisual(root, getCurrentSegmentId, token);
        // Ensure inner segments stay on top after re-rendering outer ring
        const innerSegments = [];
        root.children.forEach((child) => {
            if (child.msInnerSegment === true) {
                innerSegments.push(child);
            }
        });
        // Remove and re-add to put them on top
        innerSegments.forEach((seg, idx) => {
            const oldIndex = root.getChildIndex(seg);
            root.removeChild(seg);
            root.addChild(seg);
            const newIndex = root.getChildIndex(seg);
        });
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
    // Remove and re-add to put them on top
    innerSegments.forEach((seg, idx) => {
        const oldIndex = root.getChildIndex(seg);
        root.removeChild(seg);
        root.addChild(seg);
        const newIndex = root.getChildIndex(seg);
    });
    // Final verification: log all children in order
    root.children.forEach((child, idx) => {
        const type = child.msInnerSegment ? 'INNER_SEGMENT' :
            child.msOuterSlice ? 'OUTER_SLICE' :
                child.msOuterRing ? 'OUTER_RING' : 'UNKNOWN';
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